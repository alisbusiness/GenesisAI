"""
Green Genesis Python Backend
FastAPI-based microservice for advanced plant health monitoring
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
import uvicorn
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import router
from app.core.database import init_db
from app.core.websocket_manager import websocket_manager
from app.services.sensor_service import sensor_service
from app.services.ai_service import ai_service
from app.services.scheduler import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    await init_db()
    await sensor_service.initialize()
    scheduler.start()
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    await sensor_service.cleanup()


app = FastAPI(
    title="Green Genesis Python Backend",
    description="Advanced AI-Powered Plant Health Monitoring System",
    version="1.0.0",
    docs_url="/py-docs",
    redoc_url="/py-redoc",
    openapi_url="/py-openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/py-api")


@app.websocket("/py-ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.handle_message(websocket, data)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


@app.get("/py-health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Green Genesis Python Backend",
        "version": "1.0.0",
        "database": "connected" if settings.database_url else "disconnected"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )