"""
Pydantic schemas for API request/response models
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class TelemetryData(BaseModel):
    """Sensor telemetry data schema"""
    temperature: float = Field(..., ge=-50, le=100, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    soil_moisture: float = Field(..., ge=0, le=1, description="Soil moisture level")
    co2_level: int = Field(..., ge=0, le=5000, description="CO2 level in ppm")
    light_level: Optional[float] = Field(None, ge=0, description="Light intensity")
    ph_level: Optional[float] = Field(None, ge=0, le=14, description="Soil pH level")
    nutrient_level: Optional[float] = Field(None, ge=0, description="Nutrient concentration")


class PlantHealthAnalysisRequest(BaseModel):
    """Request for plant health analysis"""
    telemetry_data: TelemetryData
    image_data: Optional[str] = Field(None, description="Base64 encoded plant image")
    analysis_type: str = Field("automated", description="Type of analysis to perform")


class PlantHealthResponse(BaseModel):
    """Plant health analysis response"""
    health_score: float = Field(..., ge=0, le=100, description="Overall health score")
    growth_rate_score: float = Field(..., ge=0, le=100, description="Growth rate assessment")
    disease_probability: float = Field(..., ge=0, le=1, description="Disease likelihood")
    stress_indicators: List[str] = Field(default_factory=list, description="Detected stress factors")
    recommendations: List[str] = Field(default_factory=list, description="Care recommendations")
    confidence_level: float = Field(..., ge=0, le=1, description="Analysis confidence")
    timestamp: datetime = Field(default_factory=datetime.now)


class ActionRequest(BaseModel):
    """Request to perform an action"""
    action_type: str = Field(..., description="Type of action to perform")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Action parameters")
    triggered_by: str = Field("user", description="Who triggered the action")


class AlertResponse(BaseModel):
    """Alert notification response"""
    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    category: Optional[str]
    resolved: bool
    acknowledged: bool
    created_at: datetime


class PlantSpeciesResponse(BaseModel):
    """Plant species information response"""
    id: int
    name: str
    scientific_name: Optional[str]
    optimal_temp_min: float
    optimal_temp_max: float
    optimal_humidity_min: float
    optimal_humidity_max: float
    optimal_soil_moisture_min: float
    optimal_soil_moisture_max: float
    optimal_co2_min: int
    optimal_co2_max: int
    growth_stage: str


class SystemStatus(BaseModel):
    """System status response"""
    status: str = Field(..., description="Overall system status")
    components: Dict[str, str] = Field(default_factory=dict, description="Component statuses")
    sensor_count: int = Field(0, description="Number of connected sensors")
    last_reading: Optional[datetime] = Field(None, description="Last sensor reading time")
    uptime: float = Field(0, description="System uptime in seconds")


class PredictionResponse(BaseModel):
    """Future condition prediction response"""
    prediction_type: str = Field(..., description="Type of prediction")
    forecast_hours: int = Field(..., description="Hours into the future")
    predicted_values: Dict[str, float] = Field(..., description="Predicted sensor values")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    recommendations: List[str] = Field(default_factory=list, description="Preventive actions")
    risk_factors: List[str] = Field(default_factory=list, description="Potential risks")