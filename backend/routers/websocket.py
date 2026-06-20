import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from backend.ai.orchestrator import orchestrator

logger = logging.getLogger("TelemetryWebSocket")
router = APIRouter(tags=["Real-time Live Analytics Portal"])

class WebSocketConnectionManager:
    """
    Manages active socket subscribers, tracks connection statuses,
    and supports multi-cast message broadcasting.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._broadcast_task: asyncio.Task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")
        
        # Start continuous broadcast stream engine if not already running
        self.start_broadcast_loop()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Remaining connections: {len(self.active_connections)}")

    def start_broadcast_loop(self):
        """Launches background task to broadcast telemetry coordinates at 1Hz."""
        if self._broadcast_task is None or self._broadcast_task.done():
            self._broadcast_task = asyncio.create_task(self._continuous_telemetry_broadcaster())
            logger.info("Background websocket telemetry broadcaster loop initialized.")

    async def _continuous_telemetry_broadcaster(self):
        """Asynchronous continuous execution loop serving active subscribers."""
        try:
            while len(self.active_connections) > 0:
                try:
                    # 1. Coordinate pipeline evaluation using our central AI Orchestrator
                    # Running in an executor to avoid blocking the main event loops during intensive frames inference
                    loop = asyncio.get_running_loop()
                    data = await loop.run_in_executor(None, orchestrator.process_safety_slice)
                    
                    # 2. Convert to string and multicast
                    message_str = json.dumps(data)
                    dead_sockets = []
                    
                    for connection in self.active_connections:
                        try:
                            await connection.send_text(message_str)
                        except Exception as e:
                            logger.error(f"Failed to send websocket update: {e}")
                            dead_sockets.append(connection)
                    
                    # Clean up expired sessions
                    for dead in dead_sockets:
                        self.disconnect(dead)
                except Exception as cycle_error:
                    logger.error(f"Error during active broadcast cycle: {cycle_error}")

                # Wait 1s (1Hz live tick frequency)
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            logger.info("Telemetry broadcaster background task cancelled.")
        except Exception as e:
            logger.error(f"Critical error on socket announcer task: {e}")
        finally:
            self._broadcast_task = None
            logger.info("Broadcaster task cleared due to empty subscriber pool.")

manager = WebSocketConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint delivering high-frequency synchronized machine telemetries and safety analytics.
    """
    await manager.connect(websocket)
    try:
        # Keep connection open and process incoming messages if requested
        while True:
            # We await messages from python clients (can be used for remote control configurations)
            data = await websocket.receive_text()
            logger.info(f"Received interactive telemetry websocket overlay control: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection exception: {e}")
        manager.disconnect(websocket)
