#!/usr/bin/env python3
"""
Scout Raspberry Pi Client for STT and OpenCV Event Publishing

This script runs on Raspberry Pi devices to:
1. Capture audio using the microphone
2. Process audio with Whisper for speech-to-text
3. Capture video frames using OpenCV
4. Detect faces, gestures, and objects
5. Publish events to Azure Event Hubs

Requirements:
- Python 3.7+
- PyAudio
- OpenCV
- Azure Event Hub SDK
- Whisper (or alternative lightweight STT)
- Numpy
"""

import os
import sys
import time
import json
import uuid
import signal
import threading
import argparse
from datetime import datetime
import logging
import numpy as np
import cv2
from azure.eventhub import EventHubProducerClient, EventData
from azure.eventhub.exceptions import EventHubError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scout_pi_client.log')
    ]
)
logger = logging.getLogger("ScoutPiClient")

# Default Event Hub connection strings (replace with environment variables or secrets in production)
DEFAULT_EVENTHUB_STT = os.environ.get("EVENTHUB_STT", "")
DEFAULT_EVENTHUB_VISUAL = os.environ.get("EVENTHUB_VISUAL", "")
DEFAULT_EVENTHUB_ANNOTATED = os.environ.get("EVENTHUB_ANNOTATED", "")
DEFAULT_EVENTHUB_HEARTBEAT = os.environ.get("EVENTHUB_HEARTBEAT", "")

# Device and store configuration
DEVICE_ID = os.environ.get("DEVICE_ID", f"pi-device-{uuid.uuid4().hex[:8]}")
STORE_ID = os.environ.get("STORE_ID", "store-001")
LOCATION_ZONE = os.environ.get("LOCATION_ZONE", "entrance")
CAMERA_POSITION = os.environ.get("CAMERA_POSITION", "ceiling")

# Feature flags
ENABLE_STT = True
ENABLE_VISUAL = True
ENABLE_ANNOTATED = True
ENABLE_HEARTBEAT = True

# Running flag for clean shutdown
running = True

class ScoutDevice:
    """Main Scout device class for handling STT and OpenCV processing"""
    
    def __init__(self, 
                stt_connection_str=DEFAULT_EVENTHUB_STT,
                visual_connection_str=DEFAULT_EVENTHUB_VISUAL,
                annotated_connection_str=DEFAULT_EVENTHUB_ANNOTATED,
                heartbeat_connection_str=DEFAULT_EVENTHUB_HEARTBEAT):
        """Initialize the Scout device"""
        self.device_id = DEVICE_ID
        self.store_id = STORE_ID
        self.location_zone = LOCATION_ZONE
        self.camera_position = CAMERA_POSITION
        
        # Event Hub clients
        self.stt_client = None
        self.visual_client = None
        self.annotated_client = None 
        self.heartbeat_client = None
        
        if ENABLE_STT and stt_connection_str:
            self.stt_client = EventHubProducerClient.from_connection_string(
                conn_str=stt_connection_str,
                eventhub_name="eh-pi-stt-raw"
            )
        
        if ENABLE_VISUAL and visual_connection_str:
            self.visual_client = EventHubProducerClient.from_connection_string(
                conn_str=visual_connection_str,
                eventhub_name="eh-pi-visual-stream"
            )
            
        if ENABLE_ANNOTATED and annotated_connection_str:
            self.annotated_client = EventHubProducerClient.from_connection_string(
                conn_str=annotated_connection_str,
                eventhub_name="eh-pi-annotated-events"
            )
            
        if ENABLE_HEARTBEAT and heartbeat_connection_str:
            self.heartbeat_client = EventHubProducerClient.from_connection_string(
                conn_str=heartbeat_connection_str,
                eventhub_name="eh-device-heartbeat"
            )
        
        # OpenCV setup
        self.cap = None
        if ENABLE_VISUAL:
            self.cap = cv2.VideoCapture(0)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.fps = self.cap.get(cv2.CAP_PROP_FPS)
            
        # STT setup would go here
        self.stt_model = None
        
        # Session tracking
        self.current_session_id = str(uuid.uuid4())
        self.frame_id = 0
        
        # System metrics for heartbeat
        self.memory_usage = 0
        self.disk_usage = 0
        self.temperature = 0
        self.battery_level = 100
        self.errors = []
        
        logger.info(f"Scout device initialized with ID: {self.device_id}")
        
    def __del__(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
            
        # Close Event Hub clients
        if self.stt_client:
            self.stt_client.close()
        if self.visual_client:
            self.visual_client.close()
        if self.annotated_client:
            self.annotated_client.close()
        if self.heartbeat_client:
            self.heartbeat_client.close()
    
    def update_system_metrics(self):
        """Update system metrics for heartbeat"""
        try:
            # This would be more sophisticated on a real Pi with sensors
            self.memory_usage = 50  # Simulated 50% memory usage
            self.disk_usage = 30    # Simulated 30% disk usage
            self.temperature = 45   # Simulated 45°C temperature
            self.battery_level -= 0.1  # Simulated slight battery drain
            if self.battery_level < 0:
                self.battery_level = 0
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
            self.errors.append(str(e))
    
    def process_frame(self, frame):
        """Process a video frame with OpenCV"""
        if frame is None:
            return None
            
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        # Prepare detections for the event
        detections = []
        for (x, y, w, h) in faces:
            # Draw rectangle for visualization (not needed in production)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Add face detection to the list
            detections.append({
                "detection_type": "face",
                "confidence": 0.85,  # Simulated confidence
                "bounding_box": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                },
                "attributes": {
                    "age_group": "adult",  # Simulated attribute
                    "gender": "unknown",   # Simulated attribute
                    "gesture_type": None,
                    "object_class": None,
                    "zone_id": self.location_zone,
                    "motion_direction": None,
                    "dwell_time_sec": 0.0
                }
            })
            
        # Simulate a gesture detection (this would use a real model in production)
        if len(faces) > 0 and np.random.rand() > 0.7:  # 30% chance
            x, y, w, h = faces[0]  # Use the first face
            gesture_types = ["hand_wave", "pointing", "thumbs_up", "reaching"]
            gesture = np.random.choice(gesture_types)
            
            detections.append({
                "detection_type": "gesture",
                "confidence": 0.75,  # Simulated confidence
                "bounding_box": {
                    "x": int(x),
                    "y": int(y + h + 20),  # Below the face
                    "width": int(w),
                    "height": int(h // 2)
                },
                "attributes": {
                    "age_group": None,
                    "gender": None,
                    "gesture_type": gesture,
                    "object_class": None,
                    "zone_id": self.location_zone,
                    "motion_direction": None,
                    "dwell_time_sec": 0.0
                }
            })
        
        # Simulate a zone detection
        if np.random.rand() > 0.8:  # 20% chance
            zone_types = ["entrance", "checkout", "product_display", "fitting_room"]
            zone = np.random.choice(zone_types)
            
            detections.append({
                "detection_type": "zone",
                "confidence": 0.9,  # Simulated confidence
                "bounding_box": {
                    "x": int(np.random.randint(0, 640)),
                    "y": int(np.random.randint(0, 480)),
                    "width": int(np.random.randint(50, 200)),
                    "height": int(np.random.randint(50, 200))
                },
                "attributes": {
                    "age_group": None,
                    "gender": None,
                    "gesture_type": None,
                    "object_class": None,
                    "zone_id": zone,
                    "motion_direction": "entering" if np.random.rand() > 0.5 else "exiting",
                    "dwell_time_sec": float(np.random.randint(1, 60))
                }
            })
        
        return {
            "frame": frame,
            "detections": detections
        }
    
    def process_audio(self, audio_data):
        """Process audio data with STT (simulated)"""
        # This would use a real STT model in production
        
        # Simulated transcripts
        sample_transcripts = [
            "Hello, I'm looking for the summer collection.",
            "Do you have this in a size medium?",
            "Where can I find the shoes that match this outfit?",
            "Is there a discount on these items?",
            "I need help finding the right size.",
            "Do you have any more of these in stock?",
            "What time do you close today?",
            "Can I return this item if it doesn't fit?",
            "Where are the fitting rooms?",
            "Do you accept credit cards?"
        ]
        
        transcript = np.random.choice(sample_transcripts)
        confidence = 0.8 + (np.random.rand() * 0.15)  # Random between 0.8 and 0.95
        
        return {
            "transcript": transcript,
            "confidence": confidence,
            "language": "en",
            "audio_duration_sec": 2.5  # Simulated duration
        }
        
    def send_visual_event(self, result):
        """Send visual detection event to Event Hub"""
        if not self.visual_client:
            return
            
        try:
            event_data = {
                "device_id": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": self.current_session_id,
                "frame_id": self.frame_id,
                "detections": result["detections"],
                "metadata": {
                    "store_id": self.store_id,
                    "camera_position": self.camera_position,
                    "resolution": "640x480",
                    "fps": float(self.fps),
                    "model_version": "opencv-4.5.1"
                }
            }
            
            event_data_batch = self.visual_client.create_batch()
            event_data_batch.add(EventData(json.dumps(event_data)))
            self.visual_client.send_batch(event_data_batch)
            logger.debug(f"Sent visual event with {len(result['detections'])} detections")
        except EventHubError as e:
            logger.error(f"Error sending visual event: {e}")
            
    def send_stt_event(self, result):
        """Send STT event to Event Hub"""
        if not self.stt_client:
            return
            
        try:
            event_data = {
                "device_id": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": self.current_session_id,
                "transcript": result["transcript"],
                "confidence": result["confidence"],
                "language": result["language"],
                "audio_duration_sec": result["audio_duration_sec"],
                "speaker_id": "unknown",  # Would be from speaker diarization in production
                "metadata": {
                    "store_id": self.store_id,
                    "location_zone": self.location_zone,
                    "model_version": "whisper-tiny",
                    "noise_level_db": 35.0  # Simulated noise level
                }
            }
            
            event_data_batch = self.stt_client.create_batch()
            event_data_batch.add(EventData(json.dumps(event_data)))
            self.stt_client.send_batch(event_data_batch)
            logger.debug(f"Sent STT event: {result['transcript'][:30]}...")
        except EventHubError as e:
            logger.error(f"Error sending STT event: {e}")
    
    def send_annotated_event(self, visual_result, stt_result):
        """Send combined annotated event to Event Hub"""
        if not self.annotated_client:
            return
            
        # Determine interaction type based on detections and transcript
        interaction_type = "unknown"
        if stt_result and visual_result:
            # Simple rule-based classification
            transcript = stt_result["transcript"].lower()
            
            if "hello" in transcript or "hi" in transcript:
                interaction_type = "greeting"
            elif "?" in transcript or "where" in transcript or "how" in transcript or "what" in transcript:
                interaction_type = "question"
            elif "looking" in transcript or "find" in transcript:
                interaction_type = "browsing"
            elif "buy" in transcript or "purchase" in transcript or "size" in transcript:
                interaction_type = "purchase_intent"
            elif "checkout" in transcript or "pay" in transcript or "credit card" in transcript:
                interaction_type = "checkout"
            elif "help" in transcript or "assistance" in transcript:
                interaction_type = "assistance"
                
            # Check for gesture cues
            for detection in visual_result["detections"]:
                if detection["detection_type"] == "gesture":
                    gesture = detection["attributes"]["gesture_type"]
                    if gesture == "hand_wave":
                        interaction_type = "greeting"
                    elif gesture == "pointing":
                        interaction_type = "browsing"
                    elif gesture == "thumbs_up":
                        interaction_type = "positive_feedback"
                    elif gesture == "reaching":
                        interaction_type = "purchase_intent"
        
        try:
            # Visual cues as a simple string for now
            visual_cues = []
            if visual_result:
                for detection in visual_result["detections"]:
                    if detection["detection_type"] == "face":
                        visual_cues.append("face_detected")
                    elif detection["detection_type"] == "gesture":
                        visual_cues.append(f"gesture_{detection['attributes']['gesture_type']}")
                    elif detection["detection_type"] == "zone":
                        visual_cues.append(f"zone_{detection['attributes']['zone_id']}")
            
            event_data = {
                "device_id": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": self.current_session_id,
                "interaction_type": interaction_type,
                "transcript": stt_result["transcript"] if stt_result else None,
                "visual_cues": ",".join(visual_cues),
                "customer_id": f"unknown-{uuid.uuid4().hex[:8]}",  # Would be from face recognition in production
                "store_id": self.store_id,
                "zone_id": self.location_zone,
                "confidence": str(stt_result["confidence"] if stt_result else 0.5),
                "duration_sec": str(stt_result["audio_duration_sec"] if stt_result else 1.0)
            }
            
            event_data_batch = self.annotated_client.create_batch()
            event_data_batch.add(EventData(json.dumps(event_data)))
            self.annotated_client.send_batch(event_data_batch)
            logger.debug(f"Sent annotated event, type: {interaction_type}")
        except EventHubError as e:
            logger.error(f"Error sending annotated event: {e}")
    
    def send_heartbeat(self):
        """Send device heartbeat to Event Hub"""
        if not self.heartbeat_client:
            return
            
        try:
            event_data = {
                "device_id": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "store_id": self.store_id,
                "status": "online",
                "battery_level": str(self.battery_level),
                "temperature_c": str(self.temperature),
                "memory_usage_pct": str(self.memory_usage),
                "disk_usage_pct": str(self.disk_usage),
                "network_signal_strength": "excellent",  # Simulated
                "camera_fps": str(self.fps),
                "errors": ",".join(self.errors[-5:]),  # Last 5 errors
                "sw_version": "1.0.0"
            }
            
            event_data_batch = self.heartbeat_client.create_batch()
            event_data_batch.add(EventData(json.dumps(event_data)))
            self.heartbeat_client.send_batch(event_data_batch)
            logger.debug("Sent heartbeat")
        except EventHubError as e:
            logger.error(f"Error sending heartbeat: {e}")
    
    def heartbeat_thread(self):
        """Thread for sending periodic heartbeats"""
        while running:
            try:
                self.update_system_metrics()
                self.send_heartbeat()
            except Exception as e:
                logger.error(f"Error in heartbeat thread: {e}")
                self.errors.append(str(e))
            
            # Sleep for 60 seconds
            time.sleep(60)
    
    def main_loop(self):
        """Main processing loop"""
        # Start heartbeat thread
        if ENABLE_HEARTBEAT:
            heartbeat_thread = threading.Thread(target=self.heartbeat_thread)
            heartbeat_thread.daemon = True
            heartbeat_thread.start()
        
        logger.info("Starting main loop...")
        
        # Main loop
        while running:
            try:
                # Process video frame if enabled
                visual_result = None
                if ENABLE_VISUAL and self.cap:
                    ret, frame = self.cap.read()
                    if ret:
                        visual_result = self.process_frame(frame)
                        if visual_result:
                            self.send_visual_event(visual_result)
                            self.frame_id += 1
                
                # Process audio if enabled (simulated here)
                stt_result = None
                if ENABLE_STT:
                    # Every few frames, simulate audio capture and processing
                    if np.random.rand() > 0.7:  # 30% chance
                        stt_result = self.process_audio(None)  # Simulated
                        if stt_result:
                            self.send_stt_event(stt_result)
                
                # Send combined annotated event if enabled
                if ENABLE_ANNOTATED and (visual_result or stt_result):
                    self.send_annotated_event(visual_result, stt_result)
                
                # Generate a new session ID occasionally
                if np.random.rand() > 0.99:  # 1% chance
                    self.current_session_id = str(uuid.uuid4())
                    logger.info(f"New session started: {self.current_session_id}")
                
                # Sleep briefly
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                self.errors.append(str(e))
                time.sleep(1)  # Sleep longer on error
        
        logger.info("Main loop ended")

def signal_handler(sig, frame):
    """Handle SIGINT/SIGTERM"""
    global running
    logger.info("Shutdown signal received")
    running = False

def main():
    """Main entry point"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    parser = argparse.ArgumentParser(description="Scout Raspberry Pi Client for STT and OpenCV")
    parser.add_argument("--device-id", help="Device ID", default=DEVICE_ID)
    parser.add_argument("--store-id", help="Store ID", default=STORE_ID)
    parser.add_argument("--zone", help="Location zone", default=LOCATION_ZONE)
    parser.add_argument("--stt-only", help="Enable only STT", action="store_true")
    parser.add_argument("--visual-only", help="Enable only visual processing", action="store_true")
    
    args = parser.parse_args()
    
    # Update global settings
    global DEVICE_ID, STORE_ID, LOCATION_ZONE, ENABLE_STT, ENABLE_VISUAL
    DEVICE_ID = args.device_id
    STORE_ID = args.store_id
    LOCATION_ZONE = args.zone
    
    if args.stt_only:
        ENABLE_VISUAL = False
        ENABLE_STT = True
    elif args.visual_only:
        ENABLE_VISUAL = True
        ENABLE_STT = False
    
    # Create and run the Scout device
    scout = ScoutDevice()
    scout.main_loop()

if __name__ == "__main__":
    main()