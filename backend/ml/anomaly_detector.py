import time
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger("MLAnomalyDetector")

try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("Scikit-learn could not be resolved in the current workspace. Activating statistical Mahalanobis fallback.")

class FactoryAnomalyDetector:
    """
    Independent Machine Learning subsystem implementing unsupervised outlier detection.
    Evaluates temperature, CO2 gas concentration, and vibration to label normal vs abnormal signatures.
    """
    def __init__(self):
        self.is_trained = False
        self._sklearn_model = None
        
        # Nominal system parameters for offline reference (used for fallback or training seeds)
        self.nominal_temp_mean = 40.0
        self.nominal_temp_std = 8.0
        self.nominal_gas_mean = 300.0
        self.nominal_gas_std = 45.0
        self.nominal_vib_mean = 1.2
        self.nominal_vib_std = 0.3
        
        self.bootstrap_model()

    def bootstrap_model(self):
        """Pre-trains model on simulated nominal baseline patterns (normal operations)."""
        if SKLEARN_AVAILABLE:
            try:
                # Synthesize 1000 standard, healthy industrial telemetry points
                np.random.seed(42)
                temps = np.random.normal(self.nominal_temp_mean, self.nominal_temp_std, 1000)
                gases = np.random.normal(self.nominal_gas_mean, self.nominal_gas_std, 1000)
                vibes = np.random.normal(self.nominal_vib_mean, self.nominal_vib_std, 1000)
                
                training_data = np.vstack((temps, gases, vibes)).T
                
                # Fit the Isolation Forest estimator
                # Contamination of 2% representing standard calibration allowances
                self._sklearn_model = IsolationForest(contamination=0.02, random_state=42)
                self._sklearn_model.fit(training_data)
                self.is_trained = True
                logger.info("Adaptive sklearn Isolation Forest pre-trained on 1000 nominal samples.")
            except Exception as e:
                logger.error(f"Error bootstrapping Isolation Forest: {e}")
                self.is_trained = False
        else:
            self.is_trained = True
            logger.info("Statistical distance model initialized for multi-variate drift metrics.")

    def predict(self, temp: float, gas: float, vib: float) -> Tuple[bool, float, float]:
        """
        Infers anomaly labels for a given reading.
        Returns: (is_anomaly: bool, anomaly_score: float, model_confidence: float)
        """
        if SKLEARN_AVAILABLE and self._sklearn_model is not None:
            try:
                sample = np.array([[temp, gas, vib]])
                # Predict returns -1 for outliers, 1 for inliers
                prediction = self._sklearn_model.predict(sample)[0]
                
                # Decision function returns raw anomaly scores (lower means more anomalous)
                raw_score = float(self._sklearn_model.decision_function(sample)[0])
                
                # Normalize raw_score to a nice 0.0 to 1.0 confidence/strength score
                # Usually values range from -0.5 (heavy anomaly) to +0.5 (highly normal)
                anomaly_strength = max(0.0, min(1.0, 1.0 - (raw_score + 0.5)))
                
                is_anomaly = True if prediction == -1 else False
                return is_anomaly, raw_score, round(anomaly_strength, 3)
            except Exception as e:
                logger.error(f"Inference error using IsolationForest: {e}. Defaulting to statistical mode.")

        # Robust High-Fidelity Mathematical Fallback (Multi-variate Z-Score)
        temp_z = abs(temp - self.nominal_temp_mean) / self.nominal_temp_std
        gas_z = abs(gas - self.nominal_gas_mean) / self.nominal_gas_std
        vib_z = abs(vib - self.nominal_vib_mean) / self.nominal_vib_std
        
        # Combined score represents composite vector deviation
        composite_z = (temp_z**2 + gas_z**2 + vib_z**2)**0.5
        is_anomaly = composite_z > 3.0  # standard 3-sigma confidence boundaries
        
        # Map composite score to standard scale
        anomaly_score = -0.1 * composite_z
        confidence = min(0.99, max(0.05, composite_z / 10.0))
        
        return is_anomaly, anomaly_score, round(confidence, 3)

    def evaluate_telemetry_health(self, temp: float, gas: float, vib: float) -> Dict[str, Any]:
        """
        Wraps model predictions into a serialized JSON descriptor.
        """
        is_anomaly, score, confidence = self.predict(temp, gas, vib)
        
        # Categorize threat tier based on severity vectors
        risk = "NORMAL"
        if is_anomaly:
            if temp > 75.0 or gas > 600.0 or vib > 5.0:
                risk = "SEVERE_BREACH"
            else:
                risk = "UNSTABLE_DRIFT"

        return {
            "ml_anomaly_detected": is_anomaly,
            "anomaly_score": score,
            "anomaly_confidence": confidence,
            "operational_status": risk,
            "framework_type": "Isolation Forest" if SKLEARN_AVAILABLE else "Multi-variate Z-Score"
        }

# Global singleton component
anomaly_detector = FactoryAnomalyDetector()
