from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import backend.logging_config  # This initializes Loguru structured output streams immediately on app boot
from loguru import logger

from backend.routers import telemetry, auth, websocket, analytics
from backend.services.camera_service import camera_service

app = FastAPI(
    title="SAFE-GUARD Modular AI Factory Gateway",
    description="Decoupled enterprise-grade backend integrating OpenCV visual detection and rule-based + ML hybrid engines.",
    version="3.0.0"
)

# Enable CORS for frontend clients (Vite / React interface)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular Routers & Subsystems
app.include_router(auth.router, prefix="/api")               # JWT and Role-Based Access controls
app.include_router(telemetry.router, prefix="/api")          # Telemetry and ad-hoc risk checks
app.include_router(analytics.router, prefix="/api")          # Trend analytics dashboards
app.include_router(websocket.router)                         # Continuous broadcast loop

@app.get("/")
def get_root_index():
    return {
        "service": "SAFE-GUARD Enterprise Industrial Safety Gateway",
        "version": "3.0.0",
        "status": "ONLINE",
        "endpoints": {
            "auth_register": "/api/auth/register",
            "auth_login": "/api/auth/login",
            "info_sensors": "/api/sensor-data",
            "cameras_status": "/api/camera-status",
            "eval_risk_score": "/api/risk-score",
            "alert_journals": "/api/alerts",
            "analytics_trends": "/api/analytics/trends",
            "analytics_summary": "/api/analytics/summary",
            "live_websocket": "/ws/telemetry"
        }
    }

@app.on_event("startup")
def startup_event():
    logger.info("Universal gateway started. Pre-loading camera modules and starting SQLite connections...")

@app.on_event("shutdown")
def shutdown_event():
    logger.warning("Main server shutdown instruction received. Securely shutting down camera streams...")
    camera_service.shutdown()
