"""
WebSocket connection manager for real-time communication
"""

from fastapi import WebSocket
from typing import List, Dict, Any
import json
import asyncio


class WebSocketManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_data: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_data[websocket] = {"connected_at": asyncio.get_event_loop().time()}
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection",
            "message": "Connected to Green Genesis Python Backend",
            "timestamp": asyncio.get_event_loop().time()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            if websocket in self.connection_data:
                del self.connection_data[websocket]
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def handle_message(self, websocket: WebSocket, data: str):
        """Handle incoming WebSocket messages"""
        try:
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "ping":
                await self.send_personal_message({"type": "pong"}, websocket)
            elif message_type == "subscribe":
                # Handle subscription to specific data streams
                await self.handle_subscription(websocket, message)
            else:
                await self.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }, websocket)
                
        except json.JSONDecodeError:
            await self.send_personal_message({
                "type": "error",
                "message": "Invalid JSON format"
            }, websocket)
    
    async def handle_subscription(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle subscription requests"""
        subscription_type = message.get("subscription")
        if subscription_type in ["telemetry", "alerts", "analysis"]:
            self.connection_data[websocket]["subscriptions"] = \
                self.connection_data[websocket].get("subscriptions", [])
            if subscription_type not in self.connection_data[websocket]["subscriptions"]:
                self.connection_data[websocket]["subscriptions"].append(subscription_type)
            
            await self.send_personal_message({
                "type": "subscription_confirmed",
                "subscription": subscription_type
            }, websocket)
    
    def get_connection_count(self) -> int:
        """Get the number of active connections"""
        return len(self.active_connections)


websocket_manager = WebSocketManager()