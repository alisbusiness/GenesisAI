import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface PlantAnalysisResult {
  healthScore: number;
  summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  issues: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  confidence: number;
}

interface ChatContext {
  currentPlant?: any;
  telemetry?: any;
  analysis?: any;
  hasImage?: boolean;
  imageAnalysis?: string | null;
}

export async function analyzeImageWithAI(base64Image: string): Promise<PlantAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1", // Updated to GPT-4.1 as requested
      messages: [
        {
          role: "system",
          content: `You are an expert agricultural AI assistant specializing in plant health analysis for precision farming. 
          
          Analyze the provided plant image and provide a comprehensive health assessment. Focus on:
          - Overall plant health and vigor
          - Disease detection and identification
          - Pest damage assessment
          - Nutrient deficiency signs
          - Growth stage evaluation
          - Environmental stress indicators
          
          Provide your analysis in JSON format with the following structure:
          {
            "healthScore": number (0-100),
            "summary": "Brief overall assessment",
            "recommendations": [
              {
                "title": "Action title",
                "description": "Detailed recommendation",
                "priority": "high|medium|low"
              }
            ],
            "issues": [
              {
                "type": "Issue category",
                "description": "Detailed issue description",
                "severity": "critical|warning|info"
              }
            ],
            "confidence": number (0.0-1.0)
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this plant image for health assessment, disease detection, and provide care recommendations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      healthScore: Math.max(0, Math.min(100, result.healthScore || 0)),
      summary: result.summary || "Analysis completed",
      recommendations: result.recommendations || [],
      issues: result.issues || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
    };

  } catch (error) {
    console.error('OpenAI vision analysis error:', error);
    throw new Error('Failed to analyze image with AI');
  }
}

export async function chatWithAI(message: string, context: ChatContext): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant for the Green Genesis precision farming platform. You specialize in:
    - Plant care and cultivation advice
    - Environmental optimization for greenhouse growing
    - Disease and pest identification and treatment
    - Sensor data interpretation
    - Irrigation and nutrition management
    - Growth optimization strategies

    Current context:
    ${context.currentPlant ? `Current plant: ${context.currentPlant.species?.name} (${context.currentPlant.species?.variety || 'standard variety'})` : 'No plant currently selected'}
    ${context.telemetry ? `Latest sensor readings: Temperature: ${context.telemetry.temperature}°C, Humidity: ${context.telemetry.humidity}%, Soil Moisture: ${context.telemetry.soilMoisture}, CO2: ${context.telemetry.co2Level}ppm` : 'No recent sensor data'}
    ${context.analysis ? `Latest AI analysis: Health score ${context.analysis.healthScore}% - ${context.analysis.summary}` : 'No recent analysis'}

    Provide helpful, actionable advice based on the user's question and the current system context. Keep responses concise but informative.`;

    const hasImage = context.hasImage || false;
    const plantName = context.currentPlant?.species?.name || 'your plant';
    const telemetryInfo = context.telemetry ? 
      `Temperature: ${context.telemetry.temperature}°C, Humidity: ${context.telemetry.humidity}%, Soil Moisture: ${(parseFloat(context.telemetry.soilMoisture) * 100).toFixed(0)}%, CO₂: ${context.telemetry.co2Level} ppm` : 
      'Sensor data unavailable';

    const plantSystemPrompt = `You are speaking as ${plantName}, responding directly to your caretaker in a friendly, natural conversation. 

Key guidelines:
- Speak in first person as the plant (use "I", "my", "me")
- Keep responses conversational and under 150 words
- No asterisks, markdown, or special formatting
- Be helpful but maintain the plant personality
- Reference current conditions when relevant

Current conditions: ${telemetryInfo}
${hasImage ? 'A photo was just taken of me for this conversation.' : ''}

Respond naturally as the plant would speak to their caretaker.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: plantSystemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 200, // Limited tokens for concise responses
      temperature: 0.8, // Slightly higher for natural personality
    });

    return response.choices[0].message.content || "I'm having trouble speaking right now. Could you try asking me again?";

  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw new Error('Failed to get AI response');
  }
}

export async function detectAnomalies(telemetryData: any[], plantSpecies: any): Promise<Array<{
  type: string;
  description: string;
  severity: string;
  recommendation: string;
}>> {
  try {
    const idealRanges = plantSpecies?.idealRanges;
    if (!idealRanges || !telemetryData.length) {
      return [];
    }

    const latest = telemetryData[0];
    const anomalies: any[] = [];

    // Temperature anomaly detection
    const temp = parseFloat(latest.temperature);
    if (temp < idealRanges.temp[0] || temp > idealRanges.temp[1]) {
      const severity = temp < idealRanges.temp[0] * 0.8 || temp > idealRanges.temp[1] * 1.2 ? 'critical' : 'warning';
      anomalies.push({
        type: 'Temperature Anomaly',
        description: `Temperature ${temp}°C is outside optimal range of ${idealRanges.temp[0]}-${idealRanges.temp[1]}°C`,
        severity,
        recommendation: temp < idealRanges.temp[0] ? 'Increase heating or reduce ventilation' : 'Increase ventilation or activate cooling'
      });
    }

    // Humidity anomaly detection
    const humidity = parseFloat(latest.humidity);
    if (humidity < idealRanges.humidity[0] || humidity > idealRanges.humidity[1]) {
      const severity = humidity < idealRanges.humidity[0] * 0.8 || humidity > idealRanges.humidity[1] * 1.2 ? 'critical' : 'warning';
      anomalies.push({
        type: 'Humidity Anomaly',
        description: `Humidity ${humidity}% is outside optimal range of ${idealRanges.humidity[0]}-${idealRanges.humidity[1]}%`,
        severity,
        recommendation: humidity < idealRanges.humidity[0] ? 'Increase misting or reduce ventilation' : 'Increase ventilation or reduce watering'
      });
    }

    // Soil moisture anomaly detection
    const soilMoisture = parseFloat(latest.soilMoisture);
    if (soilMoisture < idealRanges.soilMoisture[0] || soilMoisture > idealRanges.soilMoisture[1]) {
      const severity = soilMoisture < idealRanges.soilMoisture[0] * 0.8 || soilMoisture > idealRanges.soilMoisture[1] * 1.2 ? 'critical' : 'warning';
      anomalies.push({
        type: 'Soil Moisture Anomaly',
        description: `Soil moisture ${soilMoisture} is outside optimal range of ${idealRanges.soilMoisture[0]}-${idealRanges.soilMoisture[1]}`,
        severity,
        recommendation: soilMoisture < idealRanges.soilMoisture[0] ? 'Increase irrigation frequency or duration' : 'Reduce watering and check drainage'
      });
    }

    return anomalies;

  } catch (error) {
    console.error('Anomaly detection error:', error);
    return [];
  }
}

export async function forecastTrends(telemetryData: any[]): Promise<{
  temperature: { trend: string; prediction: number; confidence: number };
  humidity: { trend: string; prediction: number; confidence: number };
  soilMoisture: { trend: string; prediction: number; confidence: number };
}> {
  try {
    if (telemetryData.length < 5) {
      return {
        temperature: { trend: 'stable', prediction: 0, confidence: 0.5 },
        humidity: { trend: 'stable', prediction: 0, confidence: 0.5 },
        soilMoisture: { trend: 'stable', prediction: 0, confidence: 0.5 }
      };
    }

    // Simple trend analysis using linear regression
    const calculateTrend = (values: number[]) => {
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
      
      return {
        trend,
        prediction: slope * n + (sumY - slope * sumX) / n,
        confidence: Math.min(0.9, Math.max(0.3, 1 - Math.abs(slope) * 0.1))
      };
    };

    const recentData = telemetryData.slice(0, 10).reverse();
    
    return {
      temperature: calculateTrend(recentData.map(d => parseFloat(d.temperature))),
      humidity: calculateTrend(recentData.map(d => parseFloat(d.humidity))),
      soilMoisture: calculateTrend(recentData.map(d => parseFloat(d.soilMoisture)))
    };

  } catch (error) {
    console.error('Trend forecasting error:', error);
    return {
      temperature: { trend: 'stable', prediction: 0, confidence: 0.5 },
      humidity: { trend: 'stable', prediction: 0, confidence: 0.5 },
      soilMoisture: { trend: 'stable', prediction: 0, confidence: 0.5 }
    };
  }
}
