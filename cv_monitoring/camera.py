import cv2
import threading
import time
import logging
from typing import Union, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CameraDriver")

class SafeCameraStream:
    """
    High-performance thread-safe camera driver for capturing live video.
    Uses an independent reading thread to prevent standard I/O bottlenecks in
    real-time event loops and APIs like FastAPI.
    """
    
    def __init__(self, source: Union[int, str] = 0):
        self.source = source
        self.cap = cv2.VideoCapture(source)
        
        if not self.cap.isOpened():
            logger.warning(f"Could not open live video source: {source}. Fading back to simulation mode.")
            self.working = False
        else:
            self.working = True
            
        self.grabbed, self.frame = self.cap.read()
        self.started = False
        self.read_lock = threading.Lock()
        
    def start(self) -> 'SafeCameraStream':
        """Starts the thread reading frames from the stream."""
        if self.started:
            return self
            
        if self.working:
            self.started = True
            self.thread = threading.Thread(target=self._update_loop, args=(), daemon=True)
            self.thread.start()
            logger.info("Asynchronous Camera frame grabber thread launched successfully.")
        return self

    def _update_loop(self):
        """Continuously capture frames from original media pointer."""
        while self.started:
            grabbed, frame = self.cap.read()
            if not grabbed:
                logger.error("Camera channel reported empty grab. Halting feed.")
                self.stop()
                break
                
            with self.read_lock:
                self.grabbed = grabbed
                self.frame = frame
                
            # Rest briefly to prevent CPU starvation (aim for ~60 FPS update limit)
            time.sleep(0.015)

    def read(self) -> Tuple[bool, Optional[cv2.Mat]]:
        """Returns the most recent frame safely in a non-blocking format."""
        if not self.working:
            # Generate a clean placeholder stream locally if no physical camera or mock camera is detected
            placeholder = self._generate_fallback_matrix()
            return True, placeholder
            
        with self.read_lock:
            grabbed = self.grabbed
            frame = self.frame.copy() if self.frame is not None else None
        return grabbed, frame

    def _generate_fallback_matrix(self) -> cv2.Mat:
        """
        Creates a dark dashboard terminal placeholder image with scanner sweeps.
        Guarantees that the pipeline works flawlessly even in headless server environments.
        """
        # Create standard charcoal backdrop
        canvas = cv2.Mat(480, 640, cv2.CV_8UC3)
        canvas.fill(0)
        
        # Subtle glowing horizontal scanning grid lines
        t = time.time()
        scan_y = int((t * 120) % 480)
        
        # Draw tech matrix Grid
        for y in range(0, 480, 40):
            opacity = 25 if abs(y - scan_y) > 100 else int(150 - (abs(y - scan_y) * 1.2))
            cv2.line(canvas, (0, y), (640, y), (opacity // 2, opacity, opacity // 4), 1)
        for x in range(0, 640, 40):
            cv2.line(canvas, (x, 0), (x, 480), (20, 30, 20), 1)
            
        # Draw sweeping line
        cv2.line(canvas, (0, scan_y), (640, scan_y), (10, 200, 10), 1)
        
        # Overlay blinking radar crosshair
        radar_radius = 40
        cx, cy = 320, 240
        cv2.circle(canvas, (cx, cy), radar_radius, (30, 80, 30), 1)
        cv2.line(canvas, (cx - 60, cy), (cx + 60, cy), (30, 80, 30), 1)
        cv2.line(canvas, (cx, cy - 60), (cx, cy + 60), (30, 80, 30), 1)
        
        # Write "SIMULATED FEED - NO CAMERA SOURCE ENABLED"
        cv2.putText(canvas, "SIMULATING RECON-CAMERA...", (30, 430), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1, cv2.LINE_AA)
        
        # Display live simulated timestamp
        times_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        cv2.putText(canvas, times_str, (30, 455), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 255, 100), 1, cv2.LINE_AA)
                    
        return canvas

    def stop(self):
        """Stops reading threads and releases hardware access securely."""
        self.started = False
        if self.cap.isOpened():
            self.cap.release()
        logger.info("Camera hardware stream released securely.")
