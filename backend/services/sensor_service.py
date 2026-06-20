from cv_monitoring.sensor_simulator import FactorySensorSimulator
from backend.models.schemas import SensorTelemetryResponse
import time

class SensorService:
    """
    Service wrapper managing factory sensor instrumentation, thresholds, and stress models.
    """
    def __init__(self):
        self.simulator = FactorySensorSimulator()

    def get_feed_telemetry(self, cycle_ticks: int = 0) -> SensorTelemetryResponse:
        """
        Retrieves real-time sensor variables safely translating stress cycles
        matching optical computer vision status events.
        """
        # Sync physics with active vision frame counters
        cycle = cycle_ticks % 300
        if 60 <= cycle <= 150:
            self.simulator.set_stress_profile("FAILURE_TEST")
        elif 180 <= cycle <= 260:
            self.simulator.set_stress_profile("WARMEST_RUN")
        else:
            self.simulator.set_stress_profile("NORMAL")
            
        sample = self.simulator.generate_sample()
        return SensorTelemetryResponse(
            timestamp=sample["timestamp"],
            stress_profile=sample["stress_profile"],
            sensors=sample["sensors"]
        )

# Global Service Singleton
sensor_service = SensorService()
