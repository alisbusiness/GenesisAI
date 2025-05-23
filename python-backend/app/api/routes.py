"""
API routes for Green Genesis Python Backend
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timedelta

from app.schemas.plant_schemas import (
    TelemetryData, PlantHealthAnalysisRequest, PlantHealthResponse,
    ActionRequest, AlertResponse, SystemStatus, PredictionResponse
)
from app.services.ai_service import ai_service
from app.services.sensor_service import sensor_service
from app.services.scheduler import scheduler
from app.core.websocket_manager import websocket_manager

router = APIRouter()


@router.get("/health", response_model=SystemStatus)
async def get_system_health():
    """Get comprehensive system health status"""
    sensor_status = sensor_service.get_connection_status()
    latest_reading = sensor_service.get_latest_reading()
    
    return SystemStatus(
        status="healthy" if sensor_status["connected"] else "degraded",
        components={
            "sensor_service": "connected" if sensor_status["connected"] else "disconnected",
            "ai_service": "available" if ai_service.openai_client else "limited",
            "scheduler": "running" if scheduler.is_running else "stopped",
            "websocket": f"{websocket_manager.get_connection_count()} clients"
        },
        sensor_count=1 if sensor_status["connected"] else 0,
        last_reading=datetime.now() if latest_reading else None,
        uptime=0.0  # Could be calculated from startup time
    )


@router.get("/telemetry/latest", response_model=Optional[TelemetryData])
async def get_latest_telemetry():
    """Get the most recent sensor reading"""
    return sensor_service.get_latest_reading()


@router.get("/telemetry/history")
async def get_telemetry_history(hours: int = 24):
    """Get historical sensor data"""
    if hours > 168:  # Limit to 1 week
        raise HTTPException(status_code=400, detail="Maximum history is 168 hours (1 week)")
    
    history = sensor_service.get_history(hours=hours)
    return {
        "readings": history,
        "count": len(history),
        "hours_requested": hours
    }


@router.post("/analysis/health", response_model=PlantHealthResponse)
async def analyze_plant_health(request: PlantHealthAnalysisRequest):
    """Perform comprehensive plant health analysis"""
    try:
        analysis = await ai_service.analyze_plant_health(
            telemetry=request.telemetry_data,
            image_data=request.image_data
        )
        
        # Broadcast analysis to connected clients
        await websocket_manager.broadcast({
            "type": "new_analysis",
            "data": analysis.dict(),
            "timestamp": datetime.now().isoformat()
        })
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/auto", response_model=Optional[PlantHealthResponse])
async def get_automatic_analysis():
    """Get automatic analysis based on latest sensor data"""
    latest_reading = sensor_service.get_latest_reading()
    if not latest_reading:
        raise HTTPException(status_code=404, detail="No sensor data available")
    
    return await ai_service.analyze_plant_health(latest_reading)


@router.post("/predictions/forecast", response_model=PredictionResponse)
async def generate_predictions(hours_ahead: int = 24):
    """Generate predictions for future plant conditions"""
    if hours_ahead > 72:  # Limit to 3 days
        raise HTTPException(status_code=400, detail="Maximum forecast is 72 hours")
    
    # Get sufficient historical data
    required_history_hours = max(24, hours_ahead)
    history = sensor_service.get_history(hours=required_history_hours)
    
    if len(history) < 10:
        raise HTTPException(
            status_code=400, 
            detail="Insufficient historical data for predictions (minimum 10 readings required)"
        )
    
    # Convert to TelemetryData objects
    telemetry_history = []
    for reading in history:
        # Remove timestamp for TelemetryData validation
        telemetry_dict = {k: v for k, v in reading.items() if k != 'timestamp'}
        telemetry_history.append(TelemetryData(**telemetry_dict))
    
    return await ai_service.predict_future_conditions(telemetry_history, hours_ahead)


@router.post("/actuators/command")
async def send_actuator_command(request: ActionRequest):
    """Send command to actuators/hardware"""
    command = {
        "type": request.action_type,
        "params": request.parameters,
        "timestamp": datetime.now().isoformat(),
        "source": "python_backend"
    }
    
    success = await sensor_service.send_actuator_command(command)
    
    if success:
        # Log the action
        await websocket_manager.broadcast({
            "type": "actuator_action",
            "data": {
                "action": request.action_type,
                "parameters": request.parameters,
                "triggered_by": request.triggered_by,
                "success": True
            },
            "timestamp": datetime.now().isoformat()
        })
        
        return {"success": True, "message": "Command sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send command to hardware")


@router.get("/alerts/active")
async def get_active_alerts():
    """Get current active alerts"""
    # This would typically query the database for unresolved alerts
    # For now, return recent system status
    return {
        "alerts": [],
        "count": 0,
        "last_check": datetime.now().isoformat()
    }


@router.post("/alerts/acknowledge/{alert_id}")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert"""
    # This would update the alert in the database
    await websocket_manager.broadcast({
        "type": "alert_acknowledged",
        "data": {"alert_id": alert_id},
        "timestamp": datetime.now().isoformat()
    })
    
    return {"success": True, "alert_id": alert_id}


@router.get("/system/status")
async def get_detailed_system_status():
    """Get detailed system diagnostic information"""
    sensor_status = sensor_service.get_connection_status()
    
    return {
        "timestamp": datetime.now().isoformat(),
        "services": {
            "sensor_service": {
                "status": "online" if sensor_status["connected"] else "offline",
                "details": sensor_status
            },
            "ai_service": {
                "status": "available" if ai_service.openai_client else "limited",
                "model": "gpt-4-vision-preview"
            },
            "scheduler": {
                "status": "running" if scheduler.is_running else "stopped",
                "jobs": 5 if scheduler.is_running else 0
            },
            "websocket": {
                "status": "active",
                "connections": websocket_manager.get_connection_count()
            }
        },
        "performance": {
            "memory_usage": "N/A",  # Could implement actual monitoring
            "cpu_usage": "N/A",
            "uptime": "N/A"
        }
    }


@router.post("/system/restart")
async def restart_services(background_tasks: BackgroundTasks):
    """Restart system services"""
    background_tasks.add_task(_restart_services)
    return {"message": "Service restart initiated"}


async def _restart_services():
    """Background task to restart services"""
    try:
        # Restart scheduler
        scheduler.shutdown()
        await asyncio.sleep(2)
        scheduler.start()
        
        # Reinitialize sensor service
        await sensor_service.cleanup()
        await sensor_service.initialize()
        
        await websocket_manager.broadcast({
            "type": "system_restarted",
            "data": {"timestamp": datetime.now().isoformat()},
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        await websocket_manager.broadcast({
            "type": "system_error",
            "data": {"error": str(e)},
            "timestamp": datetime.now().isoformat()
        })


@router.get("/system/logs")
async def get_system_logs(lines: int = 100):
    """Get recent system logs"""
    # This would typically read from log files
    # For now, return basic log information
    return {
        "logs": [
            {
                "timestamp": datetime.now().isoformat(),
                "level": "INFO",
                "message": "Python backend running normally",
                "service": "main"
            }
        ],
        "lines_requested": lines,
        "total_available": 1
    }


@router.get("/diagnostics/sensor-test")
async def test_sensor_connection():
    """Test sensor connection and data quality"""
    status = sensor_service.get_connection_status()
    latest = sensor_service.get_latest_reading()
    
    diagnostics = {
        "connection": status["connected"],
        "port": status["port"],
        "data_quality": "good" if latest else "no_data",
        "last_reading_age": None
    }
    
    if latest:
        # Calculate age of last reading
        now = datetime.now()
        # This would need the actual timestamp from the reading
        diagnostics["data_quality"] = "good"
    
    return diagnostics


@router.post("/ai/chat")
async def chat_with_ai(message: str):
    """Chat with AI about plant care"""
    if not ai_service.openai_client:
        raise HTTPException(
            status_code=503, 
            detail="AI service not available - OpenAI API key required"
        )
    
    # This would implement chat functionality
    # For now, return a simple response
    return {
        "response": "AI chat functionality would be implemented here with plant care expertise",
        "timestamp": datetime.now().isoformat()
    }