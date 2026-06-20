from cv_monitoring.camera import SafeCameraStream
import logging

logger = logging.getLogger("CameraService")

class CameraService:
    """
    Subsystem manager handling hardware camera drivers and virtual feed fallbacks.
    """
    def __init__(self):
        # Initialize thread-safe frame grabber loop with virtual backup capabilities
        self.stream = SafeCameraStream(source=0).start()
        logger.info("Modular Camera Capture context initialized safely.")

    def fetch_current_frame(self):
        """Fetches latest frame array with status indicators from our worker thread."""
        return self.stream.read()

    def shutdown(self):
        """Secure camera references to avoid native port socket leaks."""
        self.stream.stop()

# Global Singleton Service
camera_service = CameraService()
