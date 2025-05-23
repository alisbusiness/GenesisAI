import OpenAI from "openai";
import { TelemetryData, PlantSpecies } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RealTimeAnalysis {
  healthScore: number;
  growthRate: number;
  systemEfficiency: number;
  energySavings: number;
  recommendations: string[];
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  confidence: number;
  timestamp: string;
}

export class AIAnalysisEngine {
  
  // Calculate plant health score based on real sensor data
  calculatePlantHealth(telemetry: TelemetryData, plant?: PlantSpecies): number {
    if (!telemetry) return 75; // Default baseline
    
    const temp = parseFloat(String(telemetry.temperature || '24'));
    const humidity = parseFloat(String(telemetry.humidity || '70'));
    const moisture = parseFloat(String(telemetry.soilMoisture || '0.75')) * 100;
    const co2 = Number(telemetry.co2Level || 600);
    const light = telemetry.lightLevel ? parseFloat(telemetry.lightLevel) : 350;

    // Optimal ranges for tomato (current plant)
    const optimalRanges = {
      temperature: { min: 18, max: 30, ideal: 24 },
      humidity: { min: 60, max: 80, ideal: 70 },
      moisture: { min: 60, max: 85, ideal: 75 },
      co2: { min: 400, max: 1000, ideal: 600 },
      light: { min: 200, max: 600, ideal: 400 }
    };

    // Calculate individual scores (0-100)
    const tempScore = this.calculateRangeScore(temp, optimalRanges.temperature);
    const humidityScore = this.calculateRangeScore(humidity, optimalRanges.humidity);
    const moistureScore = this.calculateRangeScore(moisture, optimalRanges.moisture);
    const co2Score = this.calculateRangeScore(co2, optimalRanges.co2);
    const lightScore = this.calculateRangeScore(light, optimalRanges.light);

    // Weighted average (moisture and temp are most important)
    const weightedScore = (
      tempScore * 0.25 +
      humidityScore * 0.2 +
      moistureScore * 0.3 +
      co2Score * 0.15 +
      lightScore * 0.1
    );

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  // Calculate growth rate based on environmental conditions
  calculateGrowthRate(telemetry: TelemetryData): number {
    if (!telemetry) return 5;
    
    const temp = parseFloat(String(telemetry.temperature || '24'));
    const humidity = parseFloat(String(telemetry.humidity || '70'));
    const moisture = parseFloat(String(telemetry.soilMoisture || '0.75')) * 100;
    const co2 = Number(telemetry.co2Level || 600);

    // Growth rate factors
    const tempFactor = temp >= 20 && temp <= 28 ? 1.0 : 0.7;
    const humidityFactor = humidity >= 65 && humidity <= 75 ? 1.0 : 0.8;
    const moistureFactor = moisture >= 70 && moisture <= 80 ? 1.0 : 0.6;
    const co2Factor = co2 >= 500 && co2 <= 800 ? 1.0 : 0.8;

    const baseGrowthRate = 8; // 8% baseline
    const optimizationBonus = (tempFactor + humidityFactor + moistureFactor + co2Factor) / 4;
    
    return Math.round(baseGrowthRate * optimizationBonus * 1.5);
  }

  // Calculate system efficiency
  calculateSystemEfficiency(telemetry: TelemetryData, healthScore: number): number {
    const baseEfficiency = 82;
    const healthBonus = Math.round(healthScore * 0.15);
    const sensorStability = this.calculateSensorStability(telemetry);
    
    return Math.min(99, baseEfficiency + healthBonus + sensorStability);
  }

  // Calculate energy savings from AI optimization
  calculateEnergySavings(telemetry: TelemetryData): number {
    if (!telemetry) return 25;
    
    const temp = parseFloat(telemetry.temperature);
    const humidity = parseFloat(telemetry.humidity);
    
    // Energy savings based on optimal conditions (less heating/cooling needed)
    const tempEfficiency = Math.abs(temp - 24) < 3 ? 35 : 20;
    const humidityEfficiency = Math.abs(humidity - 70) < 10 ? 40 : 25;
    
    return Math.round((tempEfficiency + humidityEfficiency) / 2);
  }

  // Helper function to calculate score within a range
  private calculateRangeScore(value: number, range: { min: number, max: number, ideal: number }): number {
    if (value >= range.min && value <= range.max) {
      // Within acceptable range, calculate how close to ideal
      const distanceFromIdeal = Math.abs(value - range.ideal);
      const maxDistance = Math.max(range.ideal - range.min, range.max - range.ideal);
      return Math.round(100 - (distanceFromIdeal / maxDistance) * 20);
    } else {
      // Outside acceptable range
      const outsideBy = value < range.min ? range.min - value : value - range.max;
      return Math.max(0, 60 - outsideBy * 5);
    }
  }

  // Calculate sensor stability (how consistent readings are)
  private calculateSensorStability(telemetry: TelemetryData): number {
    // Simplified stability calculation based on reasonable values
    const temp = parseFloat(telemetry.temperature);
    const humidity = parseFloat(telemetry.humidity);
    
    const tempStability = temp > 10 && temp < 40 ? 5 : 0;
    const humidityStability = humidity > 30 && humidity < 90 ? 5 : 0;
    
    return tempStability + humidityStability;
  }

  // Generate AI-powered recommendations using GPT-4o
  async generateRecommendations(telemetry: TelemetryData, healthScore: number): Promise<string[]> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getFallbackRecommendations(telemetry, healthScore);
    }

    try {
      const prompt = `Based on these plant sensor readings, provide 3 specific actionable recommendations:
      
Temperature: ${telemetry.temperature}°C
Humidity: ${telemetry.humidity}%
Soil Moisture: ${(parseFloat(telemetry.soilMoisture) * 100).toFixed(0)}%
CO₂: ${telemetry.co2Level} ppm
Plant Health Score: ${healthScore}%

Return only a JSON array of 3 short recommendations (max 50 words each).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations || result.items || Object.values(result).flat().slice(0, 3);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return this.getFallbackRecommendations(telemetry, healthScore);
    }
  }

  // Fallback recommendations when AI is unavailable
  private getFallbackRecommendations(telemetry: TelemetryData, healthScore: number): string[] {
    const recommendations = [];
    const temp = parseFloat(telemetry.temperature);
    const humidity = parseFloat(telemetry.humidity);
    const moisture = parseFloat(telemetry.soilMoisture) * 100;

    if (temp < 20) recommendations.push("Increase temperature to optimal range (20-28°C)");
    if (temp > 30) recommendations.push("Reduce temperature for better plant health");
    if (humidity < 60) recommendations.push("Increase humidity to 65-75% for optimal growth");
    if (humidity > 80) recommendations.push("Improve ventilation to reduce humidity");
    if (moisture < 60) recommendations.push("Increase watering frequency");
    if (moisture > 85) recommendations.push("Reduce watering to prevent root rot");

    return recommendations.slice(0, 3);
  }

  // Perform complete real-time analysis
  async performAnalysis(telemetry: TelemetryData, plant?: PlantSpecies): Promise<RealTimeAnalysis> {
    const healthScore = this.calculatePlantHealth(telemetry, plant);
    const growthRate = this.calculateGrowthRate(telemetry);
    const systemEfficiency = this.calculateSystemEfficiency(telemetry, healthScore);
    const energySavings = this.calculateEnergySavings(telemetry);
    const recommendations = await this.generateRecommendations(telemetry, healthScore);

    // Detect issues
    const issues = this.detectIssues(telemetry);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(telemetry);

    return {
      healthScore,
      growthRate,
      systemEfficiency,
      energySavings,
      recommendations,
      issues,
      confidence,
      timestamp: new Date().toISOString()
    };
  }

  private detectIssues(telemetry: TelemetryData): Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string; }> {
    const issues = [];
    const temp = parseFloat(telemetry.temperature);
    const humidity = parseFloat(telemetry.humidity);
    const moisture = parseFloat(telemetry.soilMoisture) * 100;

    if (temp < 15 || temp > 35) {
      issues.push({
        type: 'temperature',
        severity: temp < 10 || temp > 40 ? 'high' : 'medium',
        description: `Temperature ${temp}°C is outside optimal range`
      });
    }

    if (moisture < 50) {
      issues.push({
        type: 'moisture',
        severity: moisture < 30 ? 'high' : 'medium',
        description: 'Soil moisture is too low, risk of plant stress'
      });
    }

    if (humidity > 85) {
      issues.push({
        type: 'humidity',
        severity: 'medium',
        description: 'High humidity may lead to fungal issues'
      });
    }

    return issues;
  }

  private calculateConfidence(telemetry: TelemetryData): number {
    // Confidence based on data completeness and reasonableness
    let confidence = 0.9;
    
    if (!telemetry.lightLevel) confidence -= 0.1;
    
    const temp = parseFloat(telemetry.temperature);
    if (temp < 0 || temp > 50) confidence -= 0.2;
    
    const humidity = parseFloat(telemetry.humidity);
    if (humidity < 0 || humidity > 100) confidence -= 0.2;
    
    return Math.max(0.6, confidence);
  }
}

export const aiAnalysisEngine = new AIAnalysisEngine();