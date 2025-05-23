"""
Configuration settings for Green Genesis Python Backend
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://greengenesis:SecurePassword123!@localhost:5432/greengenesis")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # API Keys
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openweather_api_key: Optional[str] = os.getenv("OPENWEATHER_API_KEY")
    
    # Hardware
    serial_port: str = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
    serial_baudrate: int = int(os.getenv("SERIAL_BAUDRATE", "9600"))
    
    # AI Configuration
    ai_model: str = "gpt-4-vision-preview"
    max_tokens: int = 1000
    temperature: float = 0.7
    
    # Sensor Configuration
    sensor_read_interval: int = 30  # seconds
    data_retention_days: int = 30
    
    # Alerts
    alert_cooldown_minutes: int = 15
    critical_threshold_multiplier: float = 1.5
    
    # Performance
    max_concurrent_requests: int = 100
    cache_ttl_seconds: int = 300
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()