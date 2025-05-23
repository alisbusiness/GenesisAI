import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { analyzeImageWithAI, chatWithAI } from "./openai";
import { initializeSerial, sendArduinoCommand } from "./serial";
import { z } from "zod";
import { insertTelemetrySchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Initialize serial communication
  await initializeSerial(wss);
  
  // Start sensor simulation for demo (replaces Arduino when not connected)
  const { startSensorSimulation } = await import('./simulator');
  startSensorSimulation(wss);

  // Initialize alert system
  const { alertSystem } = await import('./alerts');
  
  // Run alert analysis every 2 minutes
  setInterval(async () => {
    try {
      const newAlerts = await alertSystem.analyzeAndGenerateAlerts();
      if (newAlerts.length > 0) {
        // Broadcast new alerts to all clients
        const message = JSON.stringify({
          type: 'new_alerts',
          data: newAlerts,
          timestamp: new Date().toISOString()
        });
        
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error in alert analysis:', error);
    }
  }, 120000); // Every 2 minutes

  // Middleware for admin authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    // For simplicity, we'll use basic auth with username:password base64 encoded
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [username, password] = decoded.split(':');
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.admin = admin;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  };

  // Health endpoints (public)
  app.get('/api/health', async (req, res) => {
    try {
      const latest = await storage.getLatestTelemetry();
      const analysis = await storage.getLatestAiAnalysis();
      const currentPlant = await storage.getCurrentPlant();
      
      res.json({
        status: 'ok',
        telemetry: latest,
        analysis,
        currentPlant,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch health data' });
    }
  });

  app.get('/api/health/snapshot', async (req, res) => {
    try {
      // This would interface with the camera module
      // For now, return a placeholder response
      res.status(501).json({ error: 'Camera interface not implemented' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to capture snapshot' });
    }
  });

  app.post('/api/health/analyze', async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: 'Image data required' });
      }

      const analysis = await analyzeImageWithAI(imageData);
      const saved = await storage.insertAiAnalysis({
        summary: analysis.summary,
        healthScore: analysis.healthScore,
        recommendations: analysis.recommendations,
        issues: analysis.issues,
        confidence: analysis.confidence.toString()
      });

      // Broadcast to all WebSocket clients
      const message = JSON.stringify({
        type: 'ai_analysis',
        data: saved,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      res.json(saved);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Telemetry endpoints
  app.get('/api/telemetry/latest', async (req, res) => {
    try {
      const latest = await storage.getLatestTelemetry();
      res.json(latest || {});
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
  });

  app.get('/api/telemetry/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await storage.getTelemetryHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch telemetry history' });
    }
  });

  // Plant species endpoints
  app.get('/api/plants/species', async (req, res) => {
    try {
      const species = await storage.getAllPlantSpecies();
      res.json(species);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch plant species' });
    }
  });

  app.get('/api/plants/current', async (req, res) => {
    try {
      const current = await storage.getCurrentPlant();
      res.json(current || {});
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current plant' });
    }
  });

  app.post('/api/plants/current', requireAdmin, async (req, res) => {
    try {
      const { speciesId, notes } = req.body;
      
      if (!speciesId) {
        return res.status(400).json({ error: 'Species ID required' });
      }

      const newPlant = await storage.setCurrentPlant({ speciesId, notes });
      const current = await storage.getCurrentPlant();

      // Broadcast plant change
      const message = JSON.stringify({
        type: 'plant_changed',
        data: current,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      res.json(current);
    } catch (error) {
      res.status(500).json({ error: 'Failed to set current plant' });
    }
  });

  // Actuator endpoints
  app.get('/api/actuators', async (req, res) => {
    try {
      const actuators = await storage.getAllActuators();
      res.json(actuators);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch actuators' });
    }
  });

  app.post('/api/actuators/:id/toggle', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const actuator = await storage.getAllActuators().then(acts => acts.find(a => a.id === id));
      
      if (!actuator) {
        return res.status(404).json({ error: 'Actuator not found' });
      }

      const newState = !actuator.isActive;
      const updated = await storage.updateActuator(id, { isActive: newState });

      // Log the action
      await storage.logActuatorAction({
        actuatorId: id,
        action: newState ? 'on' : 'off',
        triggeredBy: 'admin',
      });

      // Send command to Arduino
      await sendArduinoCommand({
        type: 'actuator_control',
        actuator: actuator.name,
        state: newState,
      });

      // Broadcast actuator state change
      const message = JSON.stringify({
        type: 'actuator_updated',
        data: updated,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Actuator toggle error:', error);
      res.status(500).json({ error: 'Failed to toggle actuator' });
    }
  });

  // Chat endpoints
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, isAdmin = false } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      console.log('Received chat message:', message);

      // Get current context for AI
      const currentPlant = await storage.getCurrentPlant();
      const latestTelemetry = await storage.getLatestTelemetry();
      const latestAnalysis = await storage.getLatestAiAnalysis();

      const response = await chatWithAI(message, {
        currentPlant,
        telemetry: latestTelemetry,
        analysis: latestAnalysis,
      });

      const savedMessage = await storage.insertChatMessage({
        message,
        response,
        isAdmin: isAdmin || false,
      });

      // Broadcast new chat message
      const broadcastMessage = JSON.stringify({
        type: 'chat_message',
        data: savedMessage,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastMessage);
        }
      });

      res.json(savedMessage);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  app.get('/api/chat/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getChatHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  // Admin authentication
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create basic auth token
      const token = Buffer.from(`${username}:${password}`).toString('base64');

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin settings
  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const { key, value, description } = req.body;

      if (!key || !value) {
        return res.status(400).json({ error: 'Key and value required' });
      }

      const setting = await storage.setSetting({ key, value, description });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // Weather API endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      const { weatherService } = await import('./weather');
      const { city } = req.query;
      
      let weather;
      if (city && typeof city === 'string') {
        weather = await weatherService.getLocationWeather(city);
      } else {
        weather = await weatherService.getCurrentWeather();
      }
      
      if (weather) {
        res.json(weather);
      } else {
        res.json({ 
          available: false,
          message: 'Weather integration ready - add OpenWeatherMap API key to enable real-time weather data'
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  // Alerts API endpoints  
  app.get('/api/alerts', async (req, res) => {
    try {
      const { alertSystem } = await import('./alerts');
      const { category, limit } = req.query;
      
      let alerts;
      if (category && typeof category === 'string') {
        alerts = alertSystem.getAlertsByCategory(category as any);
      } else {
        const limitNum = limit ? parseInt(limit as string) : 20;
        alerts = alertSystem.getRecentAlerts(limitNum);
      }
      
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts/clear', requireAdmin, async (req, res) => {
    try {
      const { alertSystem } = await import('./alerts');
      alertSystem.clearAlerts();
      res.json({ message: 'Alerts cleared successfully' });
    } catch (error) {
      console.error('Error clearing alerts:', error);
      res.status(500).json({ error: 'Failed to clear alerts' });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
