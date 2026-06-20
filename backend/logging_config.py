import os
import sys
from loguru import logger

# Ensure directory context is ready to store file volumes
os.makedirs("logs", exist_ok=True)

# Remove standard loguru hooks to set up refined multiroute streams
logger.remove()

# Route 1: Unified Console Stream (Standard Out)
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    backtrace=True,
    diagnose=True
)

# Route 2: Core Platform Diagnostics Event Journal (app.log)
logger.add(
    "logs/app.log",
    rotation="10 MB",       # Keep files clean and responsive
    retention="14 days",    # Retain journals for standard audit intervals
    compression="zip",      # Highly compressed archive structure
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG"
)

# Route 3: High Severity Operational Hazard Incidents (alerts.log)
logger.add(
    "logs/alerts.log",
    rotation="5 MB",
    retention="30 days",
    compression="zip",
    filter=lambda record: "🚨" in record["message"] or "⚠️" in record["message"] or record["level"].name in ["WARNING", "CRITICAL"] or "[ALERT]" in record["message"],
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name} -> {message}",
    level="WARNING"
)

# Route 4: Technical Exceptions or Dependency Subsystem Failures (errors.log)
logger.add(
    "logs/errors.log",
    rotation="5 MB",
    retention="30 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}\nEXCEPTION:\n{exception}",
    level="ERROR"
)

logger.info("Universal SAFE-GUARD multi-channel logging context configured successfully.")
