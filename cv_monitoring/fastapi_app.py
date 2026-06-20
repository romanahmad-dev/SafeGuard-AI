from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
import uvicorn
import time
import sys
import os

# Align paths for seamless runtime discovery
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv_monitoring.camera import SafeCameraStream
from cv_monitoring.detector import IndustrialSafetyDetector
from cv_monitoring.safety_engine import SafetyEngine
from cv_monitoring.sensor_simulator import FactorySensorSimulator

app = FastAPI(
    title="SAFE-GUARD Safe-Factory CV App",
    description="FastAPI gateway supplying real-time safety inspection streaming feeds.",
    version="1.0.0"
)

# Start safe singleton stream context and object inspectors
camera_stream = SafeCameraStream(source=0).start()
anomaly_detector = IndustrialSafetyDetector(use_simulation_fallback=True)
safety_engine = SafetyEngine()
sensor_simulator = FactorySensorSimulator()

# Tracks ticks for the detector's state-machine trigger timing
ticks = 0

def generate_mjpeg_stream():
    """Reads processed camera frames with HUD graphics, converting them to live streaming chunks."""
    global ticks
    while True:
        grabbed, frame = camera_stream.read()
        if not grabbed or frame is None:
            time.sleep(0.03)
            continue
            
        ticks += 1
        # Run real-time computer vision inference
        analysis_data = anomaly_detector.run_inference(frame, tick_count=ticks)
        
        # Overlay computer vision markings (HUD, bounding boxes, labels)
        annotated_frame = anomaly_detector.render_overlays(frame, analysis_data)
        
        # Compress drawing layers to JPEG directly inside system RAM
        success, jpeg_buffer = cv2.imencode('.jpg', annotated_frame)
        if not success:
            time.sleep(0.01)
            continue
            
        frame_bytes = jpeg_buffer.tobytes()
        
        # Yeild MJPEG binary package
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
               
        # Throttle to roughly 30 FPS to reduce unnecessary server load
        time.sleep(0.033)

@app.get("/api/safety-status")
def get_safety_status():
    """
    Returns high-speed safety telemetry JSON utilizing rule-based+AI decision engine.
    Perfect endpoint for React frontends to poll or read and trigger alarm sirens.
    """
    grabbed, frame = camera_stream.read()
    if not grabbed or frame is None:
        return {"status": "UNKNOWN", "hazards_found": False, "message": "Camera stream unreachable"}
        
    analysis_data = anomaly_detector.run_inference(frame, tick_count=ticks)
    
    # Synchronize simulator profiles with the active visual simulation cycles
    cycle = ticks % 300
    if 60 <= cycle <= 150:
        sensor_simulator.set_stress_profile("FAILURE_TEST")
    elif 180 <= cycle <= 260:
        sensor_simulator.set_stress_profile("WARMEST_RUN")
    else:
        sensor_simulator.set_stress_profile("NORMAL")
        
    # Generate continuous physical metrics from our dynamic IoT simulator
    simulated_data = sensor_simulator.generate_sample()
    sensors_metrics = simulated_data.get("sensors", {})
    
    # Map back to SafetyEngine specs
    safety_input = {
        "camera_detections": analysis_data["detections"],
        "sensors": {
            "temperature": sensors_metrics.get("temperature", 40.0),
            "gas_h2s": sensors_metrics.get("gas_co2_ppm", 300.0) / 2000.0, # Scale CO2 PPM dynamically to simulate toxic gas thresholds
            "vibration": sensors_metrics.get("vibration_mm_s", 1.2)
        }
    }
    
    # Evaluate risk using SafetyEngine
    evaluation = safety_engine.evaluate_risk(safety_input)
    # Include raw simulated values in the final telemetry output payload
    evaluation["simulator_log"] = simulated_data
    return evaluation

@app.post("/api/evaluate-risk")
def post_evaluate_risk(payload: dict):
    """
    Accepts on-demand sensor value payload paired with camera detection lists.
    Returns complete rule-based + AI hybrid decision engine safety assessment.
    """
    evaluation = safety_engine.evaluate_risk(payload)
    return evaluation

@app.get("/video/stream")
def get_mjpeg_video_feed():
    """
    Exposes a real-time MJPEG camera stream endpoint.
    Can be used directly inside any HTML or React component like <img src='http://localhost:8000/video/stream' />
    """
    return StreamingResponse(
        generate_mjpeg_stream(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

import cv2 # Ensure cv2 is imported inside local execution thread to prevent fast-load race conditions

if __name__ == "__main__":
    print("-" * 50)
    print("Launching FastAPI Safety Monitor Gateway...")
    print("MJPEG Video: http://localhost:8000/video/stream")
    print("Status API : http://localhost:8000/api/safety-status")
    print("-" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
