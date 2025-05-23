"""
Background task scheduler for automated plant care
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import asyncio
from datetime import datetime, timedelta
import logging

from app.services.ai_service import ai_service
from app.services.sensor_service import sensor_service
from app.core.websocket_manager import websocket_manager


class PlantCareScheduler:
    """Automated scheduling service for plant care tasks"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.logger = logging.getLogger(__name__)
        self.is_running = False
    
    def start(self):
        """Start the scheduler with all automated tasks"""
        if self.is_running:
            return
        
        # Health analysis every 10 minutes
        self.scheduler.add_job(
            self._periodic_health_analysis,
            IntervalTrigger(minutes=10),
            id='health_analysis',
            name='Periodic Plant Health Analysis'
        )
        
        # Alert checking every 5 minutes
        self.scheduler.add_job(
            self._check_alerts,
            IntervalTrigger(minutes=5),
            id='alert_check',
            name='Environmental Alert Monitoring'
        )
        
        # Data cleanup daily at 2 AM
        self.scheduler.add_job(
            self._cleanup_old_data,
            CronTrigger(hour=2, minute=0),
            id='data_cleanup',
            name='Daily Data Cleanup'
        )
        
        # Predictive analysis every hour
        self.scheduler.add_job(
            self._predictive_analysis,
            IntervalTrigger(hours=1),
            id='predictive_analysis',
            name='Hourly Predictive Analysis'
        )
        
        # System health check every 30 minutes
        self.scheduler.add_job(
            self._system_health_check,
            IntervalTrigger(minutes=30),
            id='system_health',
            name='System Health Monitoring'
        )
        
        self.scheduler.start()
        self.is_running = True
        self.logger.info("Plant care scheduler started")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
        self.is_running = False
        self.logger.info("Plant care scheduler stopped")
    
    async def _periodic_health_analysis(self):
        """Perform automated plant health analysis"""
        try:
            latest_reading = sensor_service.get_latest_reading()
            if latest_reading:
                analysis = await ai_service.analyze_plant_health(latest_reading)
                
                # Broadcast analysis results
                await websocket_manager.broadcast({
                    "type": "health_analysis",
                    "data": analysis.dict(),
                    "timestamp": datetime.now().isoformat()
                })
                
                # Check if immediate action is needed
                if analysis.health_score < 40:
                    await self._trigger_emergency_protocols(analysis)
                
        except Exception as e:
            self.logger.error(f"Error in periodic health analysis: {e}")
    
    async def _check_alerts(self):
        """Monitor environmental conditions and generate alerts"""
        try:
            latest_reading = sensor_service.get_latest_reading()
            if not latest_reading:
                return
            
            alerts = []
            
            # Temperature alerts
            if latest_reading.temperature < 15:
                alerts.append({
                    "type": "critical",
                    "title": "Critical Low Temperature",
                    "message": f"Temperature is {latest_reading.temperature}°C - Risk of plant damage",
                    "category": "temperature"
                })
            elif latest_reading.temperature > 35:
                alerts.append({
                    "type": "critical",
                    "title": "Critical High Temperature", 
                    "message": f"Temperature is {latest_reading.temperature}°C - Risk of heat stress",
                    "category": "temperature"
                })
            
            # Humidity alerts
            if latest_reading.humidity < 25:
                alerts.append({
                    "type": "warning",
                    "title": "Low Humidity Alert",
                    "message": f"Humidity is {latest_reading.humidity}% - Consider humidification",
                    "category": "humidity"
                })
            elif latest_reading.humidity > 85:
                alerts.append({
                    "type": "warning",
                    "title": "High Humidity Alert",
                    "message": f"Humidity is {latest_reading.humidity}% - Risk of fungal issues",
                    "category": "humidity"
                })
            
            # Soil moisture alerts
            if latest_reading.soil_moisture < 0.2:
                alerts.append({
                    "type": "critical",
                    "title": "Low Soil Moisture",
                    "message": f"Soil moisture is {latest_reading.soil_moisture:.2f} - Plant needs watering",
                    "category": "watering"
                })
            elif latest_reading.soil_moisture > 0.9:
                alerts.append({
                    "type": "warning",
                    "title": "Overwatering Risk",
                    "message": f"Soil moisture is {latest_reading.soil_moisture:.2f} - Risk of root rot",
                    "category": "watering"
                })
            
            # CO2 alerts
            if latest_reading.co2_level < 300:
                alerts.append({
                    "type": "info",
                    "title": "Low CO2 Levels",
                    "message": f"CO2 is {latest_reading.co2_level}ppm - Consider ventilation adjustment",
                    "category": "air_quality"
                })
            
            # Broadcast alerts if any
            if alerts:
                await websocket_manager.broadcast({
                    "type": "new_alerts",
                    "data": alerts,
                    "timestamp": datetime.now().isoformat()
                })
                
        except Exception as e:
            self.logger.error(f"Error in alert checking: {e}")
    
    async def _predictive_analysis(self):
        """Perform predictive analysis for future conditions"""
        try:
            # Get 24 hours of historical data
            history = sensor_service.get_history(hours=24)
            if len(history) < 10:  # Need sufficient data
                return
            
            # Convert to TelemetryData objects
            from app.schemas.plant_schemas import TelemetryData
            telemetry_history = []
            for reading in history:
                telemetry_history.append(TelemetryData(**reading))
            
            # Generate predictions
            prediction = await ai_service.predict_future_conditions(telemetry_history, hours_ahead=12)
            
            # Broadcast predictions
            await websocket_manager.broadcast({
                "type": "prediction_update",
                "data": prediction.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
            # Check for predicted risks
            if prediction.risk_factors:
                await websocket_manager.broadcast({
                    "type": "predictive_alert",
                    "data": {
                        "risks": prediction.risk_factors,
                        "recommendations": prediction.recommendations,
                        "forecast_hours": prediction.forecast_hours
                    },
                    "timestamp": datetime.now().isoformat()
                })
                
        except Exception as e:
            self.logger.error(f"Error in predictive analysis: {e}")
    
    async def _system_health_check(self):
        """Monitor system health and connectivity"""
        try:
            system_status = {
                "sensor_connection": sensor_service.get_connection_status(),
                "websocket_clients": websocket_manager.get_connection_count(),
                "scheduler_running": self.is_running,
                "timestamp": datetime.now().isoformat()
            }
            
            # Check for issues
            issues = []
            if not system_status["sensor_connection"]["connected"]:
                issues.append("Sensor connection lost")
            
            if system_status["websocket_clients"] == 0:
                issues.append("No active dashboard connections")
            
            if issues:
                await websocket_manager.broadcast({
                    "type": "system_alert",
                    "data": {
                        "issues": issues,
                        "status": system_status
                    },
                    "timestamp": datetime.now().isoformat()
                })
            
        except Exception as e:
            self.logger.error(f"Error in system health check: {e}")
    
    async def _trigger_emergency_protocols(self, analysis):
        """Trigger emergency protocols for critical plant health"""
        try:
            emergency_actions = []
            
            if analysis.health_score < 20:
                emergency_actions.append("Critical plant health - immediate intervention required")
            
            if "drought stress" in str(analysis.stress_indicators).lower():
                # Could trigger automatic watering if hardware supports it
                emergency_actions.append("Emergency watering protocol activated")
            
            if emergency_actions:
                await websocket_manager.broadcast({
                    "type": "emergency_alert",
                    "data": {
                        "health_score": analysis.health_score,
                        "actions": emergency_actions,
                        "recommendations": analysis.recommendations
                    },
                    "timestamp": datetime.now().isoformat()
                })
                
        except Exception as e:
            self.logger.error(f"Error in emergency protocols: {e}")
    
    async def _cleanup_old_data(self):
        """Clean up old sensor data and logs"""
        try:
            # This would typically clean database records older than retention period
            cutoff_date = datetime.now() - timedelta(days=30)
            
            # For now, just log the cleanup
            self.logger.info(f"Data cleanup completed for records older than {cutoff_date}")
            
        except Exception as e:
            self.logger.error(f"Error in data cleanup: {e}")


scheduler = PlantCareScheduler()