import { storage } from './storage';
import { weatherService } from './weather';
import { chatWithAI } from './openai';
import type { TelemetryData, PlantSpecies } from '../shared/schema';

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'prediction';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  category: 'temperature' | 'humidity' | 'moisture' | 'co2' | 'weather' | 'system';
  actionRequired: boolean;
  recommendations: string[];
}

export class AlertSystem {
  private alerts: Alert[] = [];
  private lastWeatherCheck: Date = new Date(0);
  private weatherCheckInterval = 30 * 60 * 1000; // 30 minutes

  async analyzeAndGenerateAlerts(): Promise<Alert[]> {
    try {
      // Get recent sensor data and current plant
      const telemetryHistory = await storage.getTelemetryHistory(20);
      const currentPlant = await storage.getCurrentPlant();
      
      if (!currentPlant || telemetryHistory.length === 0) {
        return [];
      }

      const newAlerts: Alert[] = [];
      const latestReading = telemetryHistory[0];

      // Check threshold breaches
      const thresholdAlerts = this.checkThresholdBreaches(latestReading, currentPlant.species);
      newAlerts.push(...thresholdAlerts);

      // Predictive analysis using AI
      const predictiveAlerts = await this.generatePredictiveAlerts(telemetryHistory, currentPlant.species);
      newAlerts.push(...predictiveAlerts);

      // Weather-based alerts
      const weatherAlerts = await this.generateWeatherAlerts(currentPlant.species);
      newAlerts.push(...weatherAlerts);

      // Trend analysis alerts
      const trendAlerts = this.analyzeTrends(telemetryHistory, currentPlant.species);
      newAlerts.push(...trendAlerts);

      // Store new alerts
      this.alerts = [...newAlerts, ...this.alerts.slice(0, 50)]; // Keep last 50 alerts

      return newAlerts;

    } catch (error) {
      console.error('Error generating alerts:', error);
      return [];
    }
  }

  private checkThresholdBreaches(reading: TelemetryData, plant: PlantSpecies): Alert[] {
    const alerts: Alert[] = [];
    const ranges = plant.idealRanges as any;

    // Temperature check
    const temp = parseFloat(reading.temperature || '0');
    if (temp < ranges.temp[0] || temp > ranges.temp[1]) {
      alerts.push({
        id: `temp-${Date.now()}`,
        type: temp < ranges.temp[0] - 3 || temp > ranges.temp[1] + 3 ? 'critical' : 'warning',
        title: 'Temperature Alert',
        message: `Temperature ${temp}°C is ${temp < ranges.temp[0] ? 'below' : 'above'} optimal range (${ranges.temp[0]}-${ranges.temp[1]}°C)`,
        timestamp: new Date().toISOString(),
        severity: temp < ranges.temp[0] - 3 || temp > ranges.temp[1] + 3 ? 'high' : 'medium',
        category: 'temperature',
        actionRequired: true,
        recommendations: temp < ranges.temp[0] 
          ? ['Activate heating system', 'Check ventilation settings', 'Monitor for cold drafts']
          : ['Increase ventilation', 'Check cooling system', 'Reduce lighting intensity if applicable']
      });
    }

    // Humidity check
    const humidity = parseInt(reading.humidity);
    if (humidity < ranges.humidity[0] || humidity > ranges.humidity[1]) {
      alerts.push({
        id: `humidity-${Date.now()}`,
        type: humidity < ranges.humidity[0] - 10 || humidity > ranges.humidity[1] + 10 ? 'critical' : 'warning',
        title: 'Humidity Alert',
        message: `Humidity ${humidity}% is ${humidity < ranges.humidity[0] ? 'below' : 'above'} optimal range (${ranges.humidity[0]}-${ranges.humidity[1]}%)`,
        timestamp: new Date().toISOString(),
        severity: humidity < ranges.humidity[0] - 10 || humidity > ranges.humidity[1] + 10 ? 'high' : 'medium',
        category: 'humidity',
        actionRequired: true,
        recommendations: humidity < ranges.humidity[0]
          ? ['Increase misting frequency', 'Check humidifier operation', 'Reduce ventilation temporarily']
          : ['Increase air circulation', 'Check dehumidification system', 'Monitor for fungal issues']
      });
    }

    // Soil moisture check
    const moisture = parseFloat(reading.soilMoisture);
    if (moisture < ranges.soilMoisture[0] || moisture > ranges.soilMoisture[1]) {
      alerts.push({
        id: `moisture-${Date.now()}`,
        type: moisture < ranges.soilMoisture[0] - 0.1 || moisture > ranges.soilMoisture[1] + 0.1 ? 'critical' : 'warning',
        title: 'Soil Moisture Alert',
        message: `Soil moisture ${moisture} is ${moisture < ranges.soilMoisture[0] ? 'below' : 'above'} optimal range (${ranges.soilMoisture[0]}-${ranges.soilMoisture[1]})`,
        timestamp: new Date().toISOString(),
        severity: moisture < ranges.soilMoisture[0] - 0.1 || moisture > ranges.soilMoisture[1] + 0.1 ? 'high' : 'medium',
        category: 'moisture',
        actionRequired: true,
        recommendations: moisture < ranges.soilMoisture[0]
          ? ['Activate irrigation system', 'Check water pump operation', 'Inspect for leaks in irrigation lines']
          : ['Reduce watering frequency', 'Check drainage system', 'Monitor for root rot signs']
      });
    }

    return alerts;
  }

  private async generatePredictiveAlerts(history: TelemetryData[], plant: PlantSpecies): Promise<Alert[]> {
    if (history.length < 5) return [];

    try {
      // Prepare data for AI analysis
      const recentData = history.slice(0, 10).map(reading => ({
        timestamp: reading.timestamp,
        temperature: reading.temperature,
        humidity: reading.humidity,
        soilMoisture: reading.soilMoisture,
        co2Level: reading.co2Level
      }));

      const context = {
        currentPlant: plant,
        telemetry: recentData,
        idealRanges: plant.idealRanges
      };

      const aiPrompt = `Analyze the recent sensor trends for ${plant.name} and predict potential issues in the next 2-4 hours. 
      
Recent readings: ${JSON.stringify(recentData, null, 2)}
Optimal ranges: ${JSON.stringify(plant.idealRanges, null, 2)}

Based on the trends, identify:
1. Any parameters approaching critical thresholds
2. Rate of change that might cause issues
3. Preventive actions needed

Respond with specific, actionable predictions in a concise format.`;

      const aiResponse = await chatWithAI(aiPrompt, context);
      
      if (aiResponse && aiResponse.length > 20) {
        return [{
          id: `ai-prediction-${Date.now()}`,
          type: 'prediction',
          title: 'AI Predictive Alert',
          message: aiResponse,
          timestamp: new Date().toISOString(),
          severity: 'medium',
          category: 'system',
          actionRequired: true,
          recommendations: ['Review AI analysis', 'Monitor suggested parameters closely', 'Consider preventive adjustments']
        }];
      }

    } catch (error) {
      console.error('Error generating AI predictions:', error);
    }

    return [];
  }

  private async generateWeatherAlerts(plant: PlantSpecies): Promise<Alert[]> {
    const now = new Date();
    if (now.getTime() - this.lastWeatherCheck.getTime() < this.weatherCheckInterval) {
      return []; // Skip if checked recently
    }

    this.lastWeatherCheck = now;

    try {
      const weather = await weatherService.getCurrentWeather();
      if (!weather) {
        return [{
          id: `weather-api-${Date.now()}`,
          type: 'info',
          title: 'Weather Data Unavailable',
          message: 'Weather API integration requires an OpenWeatherMap API key for enhanced environmental monitoring.',
          timestamp: new Date().toISOString(),
          severity: 'low',
          category: 'weather',
          actionRequired: false,
          recommendations: ['Add OpenWeatherMap API key to enable weather-based alerts', 'Monitor outdoor conditions manually']
        }];
      }

      const alerts: Alert[] = [];

      // Check for extreme weather conditions
      if (weather.temperature < 5 || weather.temperature > 35) {
        alerts.push({
          id: `weather-temp-${Date.now()}`,
          type: 'warning',
          title: 'Extreme Outdoor Temperature',
          message: `Outdoor temperature is ${weather.temperature}°C. This may affect greenhouse climate control.`,
          timestamp: new Date().toISOString(),
          severity: 'medium',
          category: 'weather',
          actionRequired: true,
          recommendations: ['Adjust heating/cooling systems', 'Monitor indoor temperature closely', 'Check insulation']
        });
      }

      // Check for high humidity affecting ventilation needs
      if (weather.humidity > 85) {
        alerts.push({
          id: `weather-humidity-${Date.now()}`,
          type: 'info',
          title: 'High Outdoor Humidity',
          message: `Outdoor humidity is ${weather.humidity}%. Consider adjusting ventilation to prevent indoor humidity buildup.`,
          timestamp: new Date().toISOString(),
          severity: 'low',
          category: 'weather',
          actionRequired: false,
          recommendations: ['Increase air circulation', 'Monitor indoor humidity closely', 'Consider dehumidification']
        });
      }

      // Forecast-based alerts
      if (weather.forecast.length > 0) {
        const tomorrowForecast = weather.forecast[0];
        if (tomorrowForecast.tempMin < 10 || tomorrowForecast.tempMax > 30) {
          alerts.push({
            id: `weather-forecast-${Date.now()}`,
            type: 'info',
            title: 'Weather Forecast Alert',
            message: `Tomorrow's forecast: ${tomorrowForecast.tempMin}°C to ${tomorrowForecast.tempMax}°C. Prepare climate control adjustments.`,
            timestamp: new Date().toISOString(),
            severity: 'low',
            category: 'weather',
            actionRequired: false,
            recommendations: ['Pre-adjust climate systems', 'Check backup heating/cooling', 'Monitor energy consumption']
          });
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error generating weather alerts:', error);
      return [];
    }
  }

  private analyzeTrends(history: TelemetryData[], plant: PlantSpecies): Alert[] {
    if (history.length < 3) return [];

    const alerts: Alert[] = [];
    
    // Analyze temperature trend
    const temps = history.slice(0, 5).map(r => parseFloat(r.temperature));
    const tempTrend = this.calculateTrend(temps);
    
    if (Math.abs(tempTrend) > 1.0) { // More than 1°C change per reading
      alerts.push({
        id: `trend-temp-${Date.now()}`,
        type: 'warning',
        title: 'Temperature Trend Alert',
        message: `Temperature is ${tempTrend > 0 ? 'rising' : 'falling'} rapidly (${tempTrend.toFixed(1)}°C/reading). Monitor closely.`,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        category: 'temperature',
        actionRequired: true,
        recommendations: ['Check climate control systems', 'Verify sensor accuracy', 'Adjust settings proactively']
      });
    }

    // Analyze moisture trend
    const moistures = history.slice(0, 5).map(r => parseFloat(r.soilMoisture));
    const moistureTrend = this.calculateTrend(moistures);
    
    if (Math.abs(moistureTrend) > 0.05) { // Significant moisture change
      alerts.push({
        id: `trend-moisture-${Date.now()}`,
        type: 'warning',
        title: 'Soil Moisture Trend Alert',
        message: `Soil moisture is ${moistureTrend > 0 ? 'increasing' : 'decreasing'} rapidly. Check irrigation system.`,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        category: 'moisture',
        actionRequired: true,
        recommendations: ['Verify irrigation schedule', 'Check for leaks or blockages', 'Monitor drainage']
      });
    }

    return alerts;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i-1] - values[i];
    }
    return trend / (values.length - 1);
  }

  getRecentAlerts(limit: number = 10): Alert[] {
    return this.alerts.slice(0, limit);
  }

  getAlertsByCategory(category: Alert['category']): Alert[] {
    return this.alerts.filter(alert => alert.category === category);
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

export const alertSystem = new AlertSystem();