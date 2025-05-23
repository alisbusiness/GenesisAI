"""
SQLAlchemy models for plant data
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class PlantSpecies(Base):
    """Plant species information"""
    __tablename__ = "py_plant_species"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(150))
    optimal_temp_min = Column(Float, default=18.0)
    optimal_temp_max = Column(Float, default=26.0)
    optimal_humidity_min = Column(Float, default=40.0)
    optimal_humidity_max = Column(Float, default=70.0)
    optimal_soil_moisture_min = Column(Float, default=0.3)
    optimal_soil_moisture_max = Column(Float, default=0.8)
    optimal_co2_min = Column(Integer, default=400)
    optimal_co2_max = Column(Integer, default=1200)
    growth_stage = Column(String(50), default="seedling")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TelemetryReading(Base):
    """Sensor telemetry data"""
    __tablename__ = "py_telemetry_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    co2_level = Column(Integer, nullable=False)
    light_level = Column(Float)
    ph_level = Column(Float)
    nutrient_level = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    sensor_id = Column(String(50), default="main_sensor")


class PlantHealthAnalysis(Base):
    """AI-powered plant health analysis results"""
    __tablename__ = "py_plant_health_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    health_score = Column(Float, nullable=False)
    growth_rate_score = Column(Float, default=0.0)
    disease_probability = Column(Float, default=0.0)
    stress_indicators = Column(JSON)
    recommendations = Column(JSON)
    confidence_level = Column(Float, default=0.0)
    analysis_type = Column(String(50), default="automated")
    image_analysis_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ActionLog(Base):
    """Log of automated and manual actions taken"""
    __tablename__ = "py_action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(100), nullable=False)
    description = Column(Text)
    triggered_by = Column(String(50), default="system")
    parameters = Column(JSON)
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class AlertEvent(Base):
    """System alerts and notifications"""
    __tablename__ = "py_alert_events"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50))
    resolved = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))