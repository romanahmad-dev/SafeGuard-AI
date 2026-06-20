import cv2
import time
import sys
import os
import logging

# Ensure absolute import directories resolution matches relative runtime layout
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv_monitoring.camera import SafeCameraStream
from cv_monitoring.detector import IndustrialSafetyDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafetyConsole")

def main():
    logger.info("================================================")
    logger.info(" Launching SAFE-GUARD Real-Time Camera Inspector")
    logger.info("================================================")
    logger.info("Press 'q' inside the video visual window to exit.")
    
    # Initialize high speed threaded camera driver (default index 0)
    camera = SafeCameraStream(source=0).start()
    
    # Initialize OpenCV computer vision object detection and simulation agent
    detector = IndustrialSafetyDetector(use_simulation_fallback=True)
    
    tick = 0
    t0 = time.time()
    
    try:
        while True:
            # 1. Grab camera frame
            grabbed, frame = camera.read()
            if not grabbed or frame is None:
                logger.error("Failed to read signal from video feed channel.")
                break
                
            # 2. Run computer vision pipeline detections (Safety audit checks)
            results = detector.run_inference(frame, tick_count=tick)
            
            # Print state-changes to CLI to alert on dangers
            if results["status"] == "DANGER" and tick % 45 == 0:
                logger.warning(f"⚠️ HAZARD ENCOUNTERED: {results['detections']}")
                
            # 3. Add telemetry graphics and bounding overlays 
            annotated_frame = detector.render_overlays(frame, results)
            
            # 4. Display annotated interactive frames with cv2GUI
            cv2.imshow("SAFE-GUARD AI Factory Inspection Suite", annotated_frame)
            
            # Simple window shutdown listeners (q to exit)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                logger.info("Shutdown command received from key press.")
                break
                
            tick += 1
            
            # Compute real current frame timing and loop speed (FPS)
            if tick % 150 == 0:
                elapsed = time.time() - t0
                fps = tick / elapsed if elapsed > 0 else 0.0
                logger.info(f"CV Analytics status check: Operational | FPS: {fps:.1f} | State: {results['status']}")
                
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received. Initiating safety cleanup.")
    finally:
        # Secure resources
        camera.stop()
        cv2.destroyAllWindows()
        logger.info("System shut down cleanly. Session logs saved.")

if __name__ == "__main__":
    main()
