import time
import uuid
import threading
from typing import List, Dict, Any
from backend.models.schemas import AlertRecord

class AlarmLoggerService:
    """
    Thread-safe storage registry to hold, audit, and log factory danger incidents in memory.
    """
    def __init__(self, max_history: int = 100):
        self._alerts: List[AlertRecord] = []
        self._lock = threading.Lock()
        self.max_history = max_history

    def log_alert(self, risk_score: float, risk_category: str, reasoning: str, rules_triggered: List[str]) -> AlertRecord:
        """Registers a safety hazard incident."""
        with self._lock:
            record = AlertRecord(
                id=str(uuid.uuid4())[:8].upper(),
                timestamp=time.time(),
                risk_score=risk_score,
                risk_category=risk_category,
                reasoning=reasoning,
                triggered_rules=rules_triggered
            )
            self._alerts.insert(0, record)  # Newest first
            
            # Bound memory buffer
            if len(self._alerts) > self.max_history:
                self._alerts.pop()
                
            return record

    def get_alerts(self, limit: int = 50) -> List[AlertRecord]:
        """Fetches the log of recent alerts."""
        with self._lock:
            return self._alerts[:limit]

    def clear_logs(self):
        """Reset historical buffer logs."""
        with self._lock:
            self._alerts.clear()

# Global Singleton Context Provider
alarm_logger = AlarmLoggerService()
