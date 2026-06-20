import cv2
import numpy as np
import logging
from typing import Tuple, List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafetyDetector")

class IndustrialSafetyDetector:
    """
    Industrial safety detector using OpenCV.
    Performs HOG-based person detection and HSV color thresholding for fire/smoke detection.
    Also provides simulated detection logic if a live environment lacks suitable physical triggers.
    """
    
    def __init__(self, confidence_threshold: float = 0.5, use_simulation_fallback: bool = True):
        self.confidence_threshold = confidence_threshold
        self.use_simulation_fallback = use_simulation_fallback
        
        # Initialize OpenCV Histograms of Oriented Gradients (HOG) for person detection
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
        logger.info("Industrial Safety Detector initialized successfully.")

    def detect_people(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect people in the frame using OpenCV HOG detector.
        Returns a list of bounding boxes (x, y, w, h).
        """
        # Resize frame for faster processing
        resized = cv2.resize(frame, (640, 480)) if frame.shape[1] > 640 else frame
        scale_x = frame.shape[1] / resized.shape[1]
        scale_y = frame.shape[0] / resized.shape[0]
        
        # Detect people
        boxes, weights = self.hog.detectMultiScale(
            resized, 
            winStride=(8, 8), 
            padding=(4, 4), 
            scale=1.05
        )
        
        scaled_boxes = []
        for (x, y, w, h) in boxes:
            # Scale coordinates back to original image scale
            scaled_boxes.append((
                int(x * scale_x),
                int(y * scale_y),
                int(w * scale_x),
                int(h * scale_y)
            ))
            
        return scaled_boxes

    def detect_fire_smoke(self, frame: np.ndarray) -> List[Tuple[int, int, int, int, float]]:
        """
        Detect potential fire/smoke using color thresholding heuristics in HSV space.
        Returns a list of bounding boxes with intensities: (x, y, w, h, intensity).
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Define range for flame color (bright orange, yellow, and red) in HSV
        lower_fire = np.array([5, 150, 150], dtype="uint8")
        upper_fire = np.array([25, 255, 255], dtype="uint8")
        
        # Threshold the HSV image to get only fire-like colors
        mask = cv2.inRange(hsv, lower_fire, upper_fire)
        
        # Apply morphology elements (dilation and erosion) to filter noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.dilate(mask, kernel, iterations=2)
        
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        fire_detections = []
        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area > 350:  # Ignore tiny noisy spots
                x, y, w, h = cv2.boundingRect(contour)
                flame_intensity = min(100.0, float(area) / 10.0)
                fire_detections.append((x, y, w, h, flame_intensity))
                
        return fire_detections

    def run_inference(self, frame: np.ndarray, tick_count: int = 0) -> Dict[str, Any]:
        """
        Executes safe and hazard detection pipelines.
        Returns detection metadata and a consolidated safety status ("SAFE" or "DANGER").
        """
        status = "SAFE"
        detections = []
        
        # 1. Human (Person) Detection
        people_boxes = self.detect_people(frame)
        for (x, y, w, h) in people_boxes:
            detections.append({
                "label": "Person",
                "box": [x, y, w, h],
                "confidence": 0.82
            })
            
        # 2. Fire & Thermal Hazard Detection
        fire_boxes = self.detect_fire_smoke(frame)
        for (x, y, w, h, intensity) in fire_boxes:
            detections.append({
                "label": "Fire/Overheat",
                "box": [x, y, w, h],
                "confidence": intensity / 100.0
            })
            status = "DANGER"  # Any active flame is an immediate hazard
            
        # 3. Simulation Fallback (runs if enabled and no real occurrences are detected in empty streams)
        if self.use_simulation_fallback and len(detections) == 0:
            # Create simulated hazards every 300 frames to verify integration logic
            cycle = tick_count % 300
            if 60 <= cycle <= 150:
                # Simulate anomaly: operator without proper PPE, or temperature flashpoint
                h, w, _ = frame.shape
                sim_box = [int(w * 0.35), int(h * 0.25), int(w * 0.3), int(h * 0.5)]
                detections.append({
                    "label": "Simulated Flame/Thermal Leak",
                    "box": sim_box,
                    "confidence": 0.95
                })
                status = "DANGER"
            elif 180 <= cycle <= 260:
                h, w, _ = frame.shape
                sim_box = [int(w * 0.2), int(h * 0.4), int(w * 0.15), int(h * 0.35)]
                detections.append({
                    "label": "Simulated Human Operative",
                    "box": sim_box,
                    "confidence": 0.88
                })
                status = "SAFE"
                
        return {
            "status": status,
            "detections": detections,
            "hazards_found": status == "DANGER"
        }

    def render_overlays(self, frame: np.ndarray, inference_data: Dict[str, Any]) -> np.ndarray:
        """
        Draws bounding boxes, alert states, HUD panels, and crosshairs directly onto the video frame.
        """
        annotated_frame = frame.copy()
        h, w, _ = frame.shape
        
        # Color palettes matching our top-performing React styles
        accent_gold = (0, 215, 255)       # BGR for #FFD700
        accent_red = (113, 113, 248)       # BGR for #F87171
        accent_green = (128, 222, 74)     # BGR for #4ADE80
        accent_charcoal = (21, 17, 15)     # BGR for dark panels
        
        # Determine status styling
        is_danger = inference_data["status"] == "DANGER"
        status_color = accent_red if is_danger else accent_green
        
        # 1. Draw Bounding Boxes for detected occurrences
        for item in inference_data["detections"]:
            x, y, box_w, box_h = item["box"]
            label = item["label"]
            conf = item["confidence"]
            
            box_color = accent_red if "Fire" in label or "Leak" in label else accent_gold
            
            # Draw sturdy box corners
            thickness = 2
            cv2.rectangle(annotated_frame, (x, y), (x + box_w, y + box_h), box_color, 1)
            
            # Corner accents
            length = min(15, box_w // 4, box_h // 4)
            # Top Left
            cv2.line(annotated_frame, (x, y), (x + length, y), box_color, 3)
            cv2.line(annotated_frame, (x, y), (x, y + length), box_color, 3)
            # Top Right
            cv2.line(annotated_frame, (x + box_w, y), (x + box_w - length, y), box_color, 3)
            cv2.line(annotated_frame, (x + box_w, y), (x + box_w, y + length), box_color, 3)
            # Bottom Left
            cv2.line(annotated_frame, (x, y + box_h), (x + length, y + box_h), box_color, 3)
            cv2.line(annotated_frame, (x, y + box_h), (x, y + box_h - length), box_color, 3)
            # Bottom Right
            cv2.line(annotated_frame, (x + box_w, y + box_h), (x + box_w - length, y + box_h), box_color, 3)
            cv2.line(annotated_frame, (x + box_w, y + box_h), (x + box_w, y + box_h - length), box_color, 3)
            
            # Simple metadata text above box
            txt = f"{label.upper()} ({int(conf * 100)}%)"
            cv2.putText(annotated_frame, txt, (x, max(15, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, box_color, 1, cv2.LINE_AA)
            
        # 2. Upper HUD Header Bar (Opaque alpha blend background)
        header_height = 42
        hud_overlay = annotated_frame.copy()
        cv2.rectangle(hud_overlay, (0, 0), (w, header_height), accent_charcoal, -1)
        cv2.addWeighted(hud_overlay, 0.75, annotated_frame, 0.25, 0, annotated_frame)
        
        # Grid lines and crosshair borders
        cv2.line(annotated_frame, (0, header_height), (w, header_height), (57, 49, 45), 1)
        
        # HUD Text
        cv2.putText(annotated_frame, "SAFE-GUARD AI CAMERA NODAL FEED", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1, cv2.LINE_AA)
        
        # HUD Status Box (top right)
        status_label = f"SYSTEM STATUS: {inference_data['status']}"
        status_size = cv2.getTextSize(status_label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 2)[0]
        st_x = w - status_size[0] - 25
        cv2.putText(annotated_frame, status_label, (st_x, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, status_color, 2, cv2.LINE_AA)
        
        # 3. Flashing/vibrant side hazard borders in DANGER mode
        if is_danger:
            border_thickness = 4
            cv2.rectangle(annotated_frame, (0, 0), (w, h), accent_red, border_thickness)
            # Subtle grid alignment overlay
            cv2.putText(annotated_frame, "[*] ACTIVATE CRITICAL EVACUATION SIRENS", (30, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, accent_red, 1, cv2.LINE_AA)
            
        return annotated_frame
