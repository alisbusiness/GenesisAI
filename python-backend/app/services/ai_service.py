"""
Advanced AI service for plant health analysis and predictions
"""

import openai
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import base64
import io
from PIL import Image
import json
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.schemas.plant_schemas import TelemetryData, PlantHealthResponse, PredictionResponse


class AIPlantAnalysisService:
    """Advanced AI service for comprehensive plant health analysis"""
    
    def __init__(self):
        self.openai_client = None
        if settings.openai_api_key:
            openai.api_key = settings.openai_api_key
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        
        # Initialize ML models
        self.health_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.growth_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize and train ML models with synthetic training data"""
        # Generate synthetic training data for demonstration
        np.random.seed(42)
        n_samples = 1000
        
        # Feature matrix: [temp, humidity, soil_moisture, co2, light]
        X = np.random.rand(n_samples, 5)
        X[:, 0] = X[:, 0] * 30 + 10  # Temperature: 10-40°C
        X[:, 1] = X[:, 1] * 100      # Humidity: 0-100%
        X[:, 2] = X[:, 2] * 1        # Soil moisture: 0-1
        X[:, 3] = X[:, 3] * 1000 + 300  # CO2: 300-1300 ppm
        X[:, 4] = X[:, 4] * 1000     # Light: 0-1000 lux
        
        # Generate realistic health scores based on optimal conditions
        health_scores = []
        growth_scores = []
        
        for i in range(n_samples):
            temp, humidity, soil, co2, light = X[i]
            
            # Calculate health score based on optimal ranges
            temp_score = 100 - abs(temp - 22) * 5  # Optimal at 22°C
            humidity_score = 100 - abs(humidity - 55) * 2  # Optimal at 55%
            soil_score = 100 - abs(soil - 0.6) * 100  # Optimal at 0.6
            co2_score = 100 - abs(co2 - 800) * 0.1  # Optimal at 800 ppm
            light_score = min(100, light * 0.1)  # More light is better
            
            health = max(0, min(100, np.mean([temp_score, humidity_score, soil_score, co2_score, light_score])))
            growth = max(0, min(100, health * 0.8 + np.random.normal(0, 5)))
            
            health_scores.append(health)
            growth_scores.append(growth)
        
        # Train models
        X_scaled = self.scaler.fit_transform(X)
        self.health_model.fit(X_scaled, health_scores)
        self.growth_model.fit(X_scaled, growth_scores)
    
    async def analyze_plant_health(self, telemetry: TelemetryData, image_data: Optional[str] = None) -> PlantHealthResponse:
        """Comprehensive plant health analysis using AI and ML"""
        
        # Prepare features for ML models
        features = np.array([[
            telemetry.temperature,
            telemetry.humidity,
            telemetry.soil_moisture,
            telemetry.co2_level,
            telemetry.light_level or 500
        ]])
        
        features_scaled = self.scaler.transform(features)
        
        # Predict health and growth scores
        health_score = float(self.health_model.predict(features_scaled)[0])
        growth_rate_score = float(self.growth_model.predict(features_scaled)[0])
        
        # Analyze stress indicators
        stress_indicators = self._detect_stress_indicators(telemetry)
        
        # Calculate disease probability based on environmental factors
        disease_probability = self._calculate_disease_probability(telemetry, stress_indicators)
        
        # Generate recommendations
        recommendations = await self._generate_recommendations(telemetry, health_score, stress_indicators)
        
        # Image analysis if provided
        if image_data and self.openai_client:
            image_analysis = await self._analyze_plant_image(image_data)
            if image_analysis:
                # Adjust scores based on visual analysis
                health_score = (health_score + image_analysis.get('health_score', health_score)) / 2
                stress_indicators.extend(image_analysis.get('visual_stress', []))
                recommendations.extend(image_analysis.get('visual_recommendations', []))
        
        confidence_level = self._calculate_confidence(telemetry, health_score)
        
        return PlantHealthResponse(
            health_score=max(0, min(100, health_score)),
            growth_rate_score=max(0, min(100, growth_rate_score)),
            disease_probability=max(0, min(1, disease_probability)),
            stress_indicators=list(set(stress_indicators)),
            recommendations=list(set(recommendations)),
            confidence_level=confidence_level
        )
    
    def _detect_stress_indicators(self, telemetry: TelemetryData) -> List[str]:
        """Detect plant stress indicators from sensor data"""
        stress_indicators = []
        
        # Temperature stress
        if telemetry.temperature < 15:
            stress_indicators.append("Cold stress - temperature too low")
        elif telemetry.temperature > 30:
            stress_indicators.append("Heat stress - temperature too high")
        
        # Humidity stress
        if telemetry.humidity < 30:
            stress_indicators.append("Low humidity stress")
        elif telemetry.humidity > 80:
            stress_indicators.append("High humidity - risk of fungal issues")
        
        # Soil moisture stress
        if telemetry.soil_moisture < 0.2:
            stress_indicators.append("Drought stress - soil too dry")
        elif telemetry.soil_moisture > 0.9:
            stress_indicators.append("Waterlogged soil - risk of root rot")
        
        # CO2 levels
        if telemetry.co2_level < 400:
            stress_indicators.append("Low CO2 - limited photosynthesis")
        elif telemetry.co2_level > 1500:
            stress_indicators.append("Excessive CO2 levels")
        
        # Light levels
        if telemetry.light_level and telemetry.light_level < 200:
            stress_indicators.append("Insufficient light for photosynthesis")
        
        return stress_indicators
    
    def _calculate_disease_probability(self, telemetry: TelemetryData, stress_indicators: List[str]) -> float:
        """Calculate disease probability based on environmental conditions"""
        risk_factors = 0
        
        # High humidity + warm temperature = fungal risk
        if telemetry.humidity > 70 and telemetry.temperature > 25:
            risk_factors += 0.3
        
        # Poor air circulation (high humidity + high CO2)
        if telemetry.humidity > 75 and telemetry.co2_level > 1200:
            risk_factors += 0.2
        
        # Stress weakens plant immunity
        risk_factors += len(stress_indicators) * 0.1
        
        # Overwatering increases disease risk
        if telemetry.soil_moisture > 0.8:
            risk_factors += 0.2
        
        return min(1.0, risk_factors)
    
    async def _generate_recommendations(self, telemetry: TelemetryData, health_score: float, stress_indicators: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Temperature recommendations
        if telemetry.temperature < 18:
            recommendations.append("Increase temperature - consider heating")
        elif telemetry.temperature > 28:
            recommendations.append("Reduce temperature - improve ventilation")
        
        # Humidity recommendations
        if telemetry.humidity < 40:
            recommendations.append("Increase humidity - use humidifier")
        elif telemetry.humidity > 75:
            recommendations.append("Reduce humidity - improve air circulation")
        
        # Watering recommendations
        if telemetry.soil_moisture < 0.3:
            recommendations.append("Water the plant - soil is too dry")
        elif telemetry.soil_moisture > 0.8:
            recommendations.append("Reduce watering - risk of overwatering")
        
        # Light recommendations
        if telemetry.light_level and telemetry.light_level < 300:
            recommendations.append("Increase light exposure - add grow lights")
        
        # General health recommendations
        if health_score < 50:
            recommendations.append("Plant health is poor - review all environmental conditions")
        elif health_score < 70:
            recommendations.append("Monitor plant closely - some improvements needed")
        
        # AI-powered recommendations using OpenAI if available
        if self.openai_client and len(recommendations) < 3:
            try:
                ai_recommendations = await self._get_ai_recommendations(telemetry, health_score)
                recommendations.extend(ai_recommendations)
            except Exception:
                pass  # Fall back to rule-based recommendations
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    async def _analyze_plant_image(self, image_data: str) -> Optional[Dict[str, Any]]:
        """Analyze plant image using OpenAI Vision API"""
        if not self.openai_client:
            return None
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this plant image for health indicators. Provide a health score (0-100), identify any visual stress indicators, and suggest improvements. Respond in JSON format with keys: health_score, visual_stress, visual_recommendations."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception:
            return None
    
    async def _get_ai_recommendations(self, telemetry: TelemetryData, health_score: float) -> List[str]:
        """Get AI-powered recommendations from OpenAI"""
        if not self.openai_client:
            return []
        
        try:
            prompt = f"""
            Plant sensor data:
            - Temperature: {telemetry.temperature}°C
            - Humidity: {telemetry.humidity}%
            - Soil moisture: {telemetry.soil_moisture}
            - CO2: {telemetry.co2_level} ppm
            - Light: {telemetry.light_level or 'Unknown'} lux
            - Health score: {health_score}/100
            
            Provide 2-3 specific, actionable recommendations to improve plant health.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200
            )
            
            content = response.choices[0].message.content
            return [line.strip('- ') for line in content.split('\n') if line.strip().startswith('-')]
        except Exception:
            return []
    
    def _calculate_confidence(self, telemetry: TelemetryData, health_score: float) -> float:
        """Calculate confidence level of the analysis"""
        confidence = 0.8  # Base confidence
        
        # Reduce confidence for extreme values
        if telemetry.temperature < 10 or telemetry.temperature > 35:
            confidence -= 0.1
        if telemetry.humidity < 20 or telemetry.humidity > 90:
            confidence -= 0.1
        if telemetry.soil_moisture < 0.1 or telemetry.soil_moisture > 0.95:
            confidence -= 0.1
        
        # Increase confidence for normal health scores
        if 30 <= health_score <= 90:
            confidence += 0.1
        
        return max(0.3, min(1.0, confidence))
    
    async def predict_future_conditions(self, historical_data: List[TelemetryData], hours_ahead: int = 24) -> PredictionResponse:
        """Predict future plant conditions based on trends"""
        if len(historical_data) < 5:
            # Not enough data for meaningful prediction
            return PredictionResponse(
                prediction_type="insufficient_data",
                forecast_hours=hours_ahead,
                predicted_values={},
                confidence=0.0,
                recommendations=["Collect more sensor data for accurate predictions"],
                risk_factors=["Insufficient historical data"]
            )
        
        # Extract trend data
        df = pd.DataFrame([{
            'temperature': d.temperature,
            'humidity': d.humidity,
            'soil_moisture': d.soil_moisture,
            'co2_level': d.co2_level,
            'light_level': d.light_level or 500
        } for d in historical_data])
        
        # Simple trend-based prediction
        predictions = {}
        trends = {}
        
        for column in df.columns:
            values = df[column].values
            if len(values) >= 3:
                # Linear trend
                x = np.arange(len(values))
                trend = np.polyfit(x, values, 1)[0]  # Slope
                latest_value = values[-1]
                predicted_value = latest_value + (trend * hours_ahead)
                
                predictions[column] = round(float(predicted_value), 2)
                trends[column] = trend
        
        # Assess risks based on predictions
        risk_factors = []
        recommendations = []
        
        if predictions.get('temperature', 20) > 30:
            risk_factors.append("Temperature trending too high")
            recommendations.append("Prepare cooling measures")
        elif predictions.get('temperature', 20) < 15:
            risk_factors.append("Temperature trending too low")
            recommendations.append("Prepare heating")
        
        if predictions.get('soil_moisture', 0.5) < 0.2:
            risk_factors.append("Soil moisture decreasing rapidly")
            recommendations.append("Schedule watering")
        
        # Calculate confidence based on trend stability
        confidence = 0.7
        if all(abs(trend) < 0.1 for trend in trends.values()):
            confidence += 0.2  # Stable trends are more predictable
        
        return PredictionResponse(
            prediction_type="trend_analysis",
            forecast_hours=hours_ahead,
            predicted_values=predictions,
            confidence=confidence,
            recommendations=recommendations,
            risk_factors=risk_factors
        )


ai_service = AIPlantAnalysisService()