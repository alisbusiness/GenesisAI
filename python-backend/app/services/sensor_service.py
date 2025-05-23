"""
Sensor data collection and hardware interface service
"""

import asyncio
import serial_asyncio
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

from app.core.config import settings
from app.core.websocket_manager import websocket_manager
from app.schemas.plant_schemas import TelemetryData


class SensorService:
    """Handles sensor data collection and hardware communication"""
    
    def __init__(self):
        self.serial_connection: Optional[serial_asyncio.SerialTransport] = None
        self.is_connected = False
        self.latest_reading: Optional[TelemetryData] = None
        self.reading_history: List[Dict[str, Any]] = []
        self.max_history = 1000
        self.logger = logging.getLogger(__name__)
    
    async def initialize(self):
        """Initialize sensor connections"""
        await self._connect_to_arduino()
        # Start periodic data collection
        asyncio.create_task(self._periodic_data_collection())
    
    async def _connect_to_arduino(self):
        """Attempt to connect to Arduino via serial"""
        try:
            reader, writer = await serial_asyncio.open_serial_connection(
                url=settings.serial_port,
                baudrate=settings.serial_baudrate
            )
            self.serial_connection = writer
            self.is_connected = True
            self.logger.info(f"Connected to Arduino on {settings.serial_port}")
            
            # Start reading data
            asyncio.create_task(self._read_serial_data(reader))
            
        except Exception as e:
            self.logger.warning(f"Could not connect to Arduino: {e}")
            self.is_connected = False
    
    async def _read_serial_data(self, reader):
        """Read data from Arduino serial connection"""
        while self.is_connected:
            try:
                line = await reader.readline()
                if line:
                    data_str = line.decode('utf-8').strip()
                    await self._process_sensor_data(data_str)
            except Exception as e:
                self.logger.error(f"Error reading serial data: {e}")
                self.is_connected = False
                break
    
    async def _process_sensor_data(self, data_str: str):
        """Process incoming sensor data"""
        try:
            # Expected format: {"temp":25.5,"humidity":60,"soil":0.7,"co2":800,"light":500}
            data = json.loads(data_str)
            
            telemetry = TelemetryData(
                temperature=float(data.get('temp', 0)),
                humidity=float(data.get('humidity', 0)),
                soil_moisture=float(data.get('soil', 0)),
                co2_level=int(data.get('co2', 0)),
                light_level=float(data.get('light', 0)) if data.get('light') else None,
                ph_level=float(data.get('ph')) if data.get('ph') else None,
                nutrient_level=float(data.get('nutrients')) if data.get('nutrients') else None
            )
            
            self.latest_reading = telemetry
            self._add_to_history(telemetry)
            
            # Broadcast to WebSocket clients
            await websocket_manager.broadcast({
                "type": "telemetry_update",
                "data": telemetry.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
        except json.JSONDecodeError:
            self.logger.warning(f"Invalid JSON from Arduino: {data_str}")
        except Exception as e:
            self.logger.error(f"Error processing sensor data: {e}")
    
    def _add_to_history(self, telemetry: TelemetryData):
        """Add reading to history with timestamp"""
        reading = {
            **telemetry.dict(),
            "timestamp": datetime.now().isoformat()
        }
        
        self.reading_history.append(reading)
        
        # Keep only recent readings
        if len(self.reading_history) > self.max_history:
            self.reading_history = self.reading_history[-self.max_history:]
    
    async def _periodic_data_collection(self):
        """Collect sensor data periodically if no Arduino connection"""
        while True:
            await asyncio.sleep(settings.sensor_read_interval)
            
            if not self.is_connected:
                # Generate simulated data for development
                simulated_data = self._generate_simulated_data()
                await self._process_sensor_data(json.dumps(simulated_data))
    
    def _generate_simulated_data(self) -> Dict[str, Any]:
        """Generate realistic simulated sensor data"""
        import random
        
        # Base values with some variation
        base_temp = 23.0 + random.uniform(-3, 3)
        base_humidity = 60.0 + random.uniform(-15, 15)
        base_soil = 0.6 + random.uniform(-0.2, 0.2)
        base_co2 = 800 + random.randint(-200, 200)
        base_light = 450 + random.uniform(-100, 100)
        
        return {
            "temp": round(base_temp, 1),
            "humidity": max(0, min(100, round(base_humidity, 1))),
            "soil": max(0, min(1, round(base_soil, 2))),
            "co2": max(300, min(1500, base_co2)),
            "light": max(0, round(base_light, 1)),
            "ph": round(6.5 + random.uniform(-1, 1), 1),
            "nutrients": round(random.uniform(0.3, 0.9), 2)
        }
    
    async def send_actuator_command(self, command: Dict[str, Any]) -> bool:
        """Send command to Arduino actuators"""
        if not self.is_connected or not self.serial_connection:
            self.logger.warning("Cannot send command - Arduino not connected")
            return False
        
        try:
            command_str = json.dumps(command) + '\n'
            self.serial_connection.write(command_str.encode('utf-8'))
            await self.serial_connection.drain()
            return True
        except Exception as e:
            self.logger.error(f"Error sending command: {e}")
            return False
    
    def get_latest_reading(self) -> Optional[TelemetryData]:
        """Get the most recent sensor reading"""
        return self.latest_reading
    
    def get_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get sensor reading history for specified hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        filtered_history = []
        for reading in self.reading_history:
            reading_time = datetime.fromisoformat(reading['timestamp'])
            if reading_time >= cutoff_time:
                filtered_history.append(reading)
        
        return filtered_history
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get sensor connection status"""
        return {
            "connected": self.is_connected,
            "port": settings.serial_port,
            "baudrate": settings.serial_baudrate,
            "last_reading": self.latest_reading.dict() if self.latest_reading else None,
            "readings_count": len(self.reading_history)
        }
    
    async def cleanup(self):
        """Cleanup connections"""
        if self.serial_connection:
            self.serial_connection.close()
            await self.serial_connection.wait_closed()
        self.is_connected = False


sensor_service = SensorService()