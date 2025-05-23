import { WebSocketServer } from 'ws';
import { storage } from './storage';

// Simulated Arduino data generator for demo purposes
export function startSensorSimulation(wss: WebSocketServer): void {
  console.log('🔬 Starting sensor data simulation...');
  
  // Generate realistic sensor data every 30 seconds
  const sensorInterval = setInterval(async () => {
    try {
      // Generate realistic sensor readings
      const telemetryData = {
        temperature: (20 + Math.random() * 8).toFixed(1), // 20-28°C
        humidity: (55 + Math.random() * 35).toFixed(0), // 55-90%
        soilMoisture: (0.5 + Math.random() * 0.4).toFixed(2), // 0.5-0.9
        co2Level: Math.floor(400 + Math.random() * 600), // 400-1000 ppm
        lightLevel: (300 + Math.random() * 200).toFixed(0) // 300-500 lux
      };

      // Store in database
      await storage.insertTelemetryData(telemetryData);

      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'telemetry_update',
        data: { ...telemetryData, timestamp: new Date().toISOString() },
      });

      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });

      console.log('📊 Simulated sensor data:', telemetryData);

    } catch (error) {
      console.error('Error generating sensor data:', error);
    }
  }, 30000); // Every 30 seconds

  // Generate initial reading immediately
  setTimeout(async () => {
    try {
      const initialData = {
        temperature: '22.5',
        humidity: '68',
        soilMoisture: '0.72',
        co2Level: 650,
        lightLevel: '420'
      };

      await storage.insertTelemetryData(initialData);
      
      const message = JSON.stringify({
        type: 'telemetry_update',
        data: { ...initialData, timestamp: new Date().toISOString() },
      });

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });

      console.log('📊 Initial sensor data generated');
    } catch (error) {
      console.error('Error generating initial data:', error);
    }
  }, 2000);

  // Store cleanup function (optional cleanup for future use)
  process.on('SIGTERM', () => {
    clearInterval(sensorInterval);
    console.log('🛑 Sensor simulation stopped');
  });
}