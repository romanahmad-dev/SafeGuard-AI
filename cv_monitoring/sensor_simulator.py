import time
import random
import json
import math
import logging
from typing import Dict, Any, Generator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SensorSimulator")

class FactorySensorSimulator:
    """
    Simulates physical factory plant sensors (Temperature, CO2/H2S Gas levels, axial Vibration)
    using continuous random walk drift models with configurable mechanical stress profiles.
    Requires absolute zero hardware modules.
    """
    
    def __init__(
        self,
        base_temp: float = 40.0,
        base_gas: float = 300.0,  # Base CO2 concentration in PPM
        base_vib: float = 1.2,     # Normal axial displacement in mm/s
        stress_mode: str = "NORMAL" # NORMAL, WARMEST_RUN, FAILURE_TEST
    ):
        # Base levels
        self.base_temp = base_temp
        self.base_gas = base_gas
        self.base_vib = base_vib
        self.stress_mode = stress_mode
        
        # Real-time walk state memories
        self.current_temp = base_temp
        self.current_gas = base_gas
        self.current_vib = base_vib
        
        # Angle counter to simulate periodic workload sweeps (diurnal factory cycles)
        self.theta = 0.0

    def set_stress_profile(self, mode: str):
        """Toggle different operational environments."""
        valid_modes = ["NORMAL", "WARMEST_RUN", "FAILURE_TEST"]
        if mode in valid_modes:
            self.stress_mode = mode
            logger.info(f"Simulator engine configured to operational mode: {mode}")
        else:
            logger.warning(f"Invalid mode {mode} ignored. Defaulting to NORMAL configuration.")

    def generate_sample(self) -> Dict[str, Any]:
        """
        Calculates one high-fidelity multi-sensor sample.
        Applies mathematical walk functions with noise and stress filters.
        """
        self.theta += 0.05
        if self.theta > 2 * math.pi:
            self.theta = 0.0
            
        # Simulate base continuous thermal swing (daily load + high frequency white noise)
        periodic_load = math.sin(self.theta) * 4.0
        thermal_drift = random.uniform(-0.4, 0.4)
        
        # CO2 simulation drift (build-up of gases based on workload)
        gas_drift = random.uniform(-5.0, 5.0)
        
        # Mechanical mechanical resonance vibration spike
        vibration_flicker = random.uniform(-0.15, 0.15)

        # Scale parameters to target simulation environments
        if self.stress_mode == "FAILURE_TEST":
            # Simulate total core overload
            self.current_temp += random.uniform(1.5, 3.2)
            self.current_gas += random.uniform(20.0, 55.0)
            self.current_vib += random.uniform(0.4, 0.9)
            
            # Bound realistic extreme crash metrics
            self.current_temp = min(150.0, self.current_temp)
            self.current_gas = min(2500.0, self.current_gas)
            self.current_vib = min(12.0, self.current_vib)
            
        elif self.stress_mode == "WARMEST_RUN":
            # Continuous warning levels
            self.current_temp = self.base_temp + 28.0 + periodic_load + thermal_drift
            self.current_gas = self.base_gas + 400.0 + (math.cos(self.theta) * 120.0) + gas_drift
            self.current_vib = self.base_vib + 2.8 + vibration_flicker
        else:
            # Standard NORMAL operations with periodic system ripples
            self.current_temp = self.base_temp + periodic_load + thermal_drift
            self.current_gas = self.base_gas + (math.sin(self.theta * 2) * 50.0) + gas_drift
            self.current_vib = self.base_vib + (math.sin(self.theta) * 0.3) + vibration_flicker
            
            # Ensure stable boundaries for safety state
            self.current_temp = max(15.0, min(65.0, self.current_temp))
            self.current_gas = max(100.0, min(600.0, self.current_gas))
            self.current_vib = max(0.2, min(3.0, self.current_vib))

        return {
            "timestamp": time.time(),
            "stress_profile": self.stress_mode,
            "sensors": {
                "temperature": round(self.current_temp, 2),
                "gas_co2_ppm": round(self.current_gas, 1),
                "vibration_mm_s": round(self.current_vib, 2)
            }
        }

    def raw_stream_generator(self, interval_sec: float = 1.0) -> Generator[str, None, None]:
        """
        Infinite JSON stream generator yielding raw structural strings.
        Ideal for Server-Sent Events (SSE) or command line piping.
        """
        while True:
            sample = self.generate_sample()
            yield json.dumps(sample)
            time.sleep(interval_sec)

if __name__ == "__main__":
    logger.info("Initializing stand-alone factory telemetry console simulation loop...")
    simulator = FactorySensorSimulator(stress_mode="NORMAL")
    
    # Run simple demo sweep for validation
    try:
        # Run normal profile
        for idx in range(5):
            sample = simulator.generate_sample()
            print(f"Normal Matrix Output -> {json.dumps(sample)}")
            time.sleep(1.0)
            
        # Run abnormal profile simulation
        simulator.set_stress_profile("FAILURE_TEST")
        for idx in range(5):
            sample = simulator.generate_sample()
            print(f"Hazard Matrix Output -> {json.dumps(sample)}")
            time.sleep(1.0)
            
    except KeyboardInterrupt:
        logger.info("Simulator testing sweep final completed successfully.")
