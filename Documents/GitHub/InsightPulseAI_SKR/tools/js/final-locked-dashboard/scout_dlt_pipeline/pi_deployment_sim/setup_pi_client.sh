#!/bin/bash
# Setup script for Raspberry Pi client (Mock for simulation)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   Scout Raspberry Pi Client Setup     ${NC}"
echo -e "${BLUE}   (SIMULATED FOR DEMONSTRATION)       ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Mock device configuration
DEVICE_ID="pi-device-store112"
STORE_ID="store-112"
LOCATION_ZONE="entrance"
CAMERA_POSITION="ceiling"

# Mock connection strings
EVENTHUB_STT="Endpoint=sb://scout-eh-namespace-abc123.servicebus.windows.net/;SharedAccessKeyName=pi-device-send-rule;SharedAccessKey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;EntityPath=eh-pi-stt-raw"
EVENTHUB_VISUAL="Endpoint=sb://scout-eh-namespace-abc123.servicebus.windows.net/;SharedAccessKeyName=pi-device-send-rule;SharedAccessKey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;EntityPath=eh-pi-visual-stream"
EVENTHUB_ANNOTATED="Endpoint=sb://scout-eh-namespace-abc123.servicebus.windows.net/;SharedAccessKeyName=pi-device-send-rule;SharedAccessKey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;EntityPath=eh-pi-annotated-events"
EVENTHUB_HEARTBEAT="Endpoint=sb://scout-eh-namespace-abc123.servicebus.windows.net/;SharedAccessKeyName=pi-device-send-rule;SharedAccessKey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;EntityPath=eh-device-heartbeat"

echo -e "${GREEN}[1/5] Creating directory structure${NC}"
echo "mkdir -p ~/project-scout/audio_buffer/metadata"
echo "mkdir -p ~/project-scout/vision_log"
echo "mkdir -p ~/project-scout/matched_sessions"
echo "mkdir -p ~/project-scout/scripts"
sleep 1

echo -e "${GREEN}[2/5] Installing dependencies${NC}"
echo "sudo apt-get update"
echo "sudo apt-get install -y python3-pip python3-opencv libatlas-base-dev portaudio19-dev"
echo "pip3 install azure-eventhub azure-storage-blob numpy opencv-python-headless pyaudio pydub"
sleep 2

echo -e "${GREEN}[3/5] Creating environment file${NC}"
echo "Creating .env file with the following configuration:"
echo "DEVICE_ID=$DEVICE_ID"
echo "STORE_ID=$STORE_ID"
echo "LOCATION_ZONE=$LOCATION_ZONE"
echo "CAMERA_POSITION=$CAMERA_POSITION"
echo "EVENTHUB_STT=<hidden>"
echo "EVENTHUB_VISUAL=<hidden>"
echo "EVENTHUB_ANNOTATED=<hidden>"
echo "EVENTHUB_HEARTBEAT=<hidden>"
sleep 1

echo -e "${GREEN}[4/5] Copying client scripts${NC}"
echo "Copying stt_visual_client.py to ~/project-scout/scripts/"
sleep 1

echo -e "${GREEN}[5/5] Creating and starting systemd service${NC}"
echo "Creating systemd service file: /etc/systemd/system/scout-client.service"
echo "Running: sudo systemctl daemon-reload"
echo "Running: sudo systemctl enable scout-client"
echo "Running: sudo systemctl start scout-client"
echo "Service status: Active: active (running)"
sleep 1

echo -e "${BLUE}=======================================${NC}"
echo -e "${GREEN}Scout Raspberry Pi client setup complete!${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""
echo "Device Information:"
echo "Device ID: $DEVICE_ID"
echo "Store ID: $STORE_ID"
echo "Location: $LOCATION_ZONE ($CAMERA_POSITION)"
echo ""
echo "Directory structure created:"
echo "/home/pi/project-scout/"
echo "├── audio_buffer/"
echo "│   ├── audio_<timestamp>.wav"
echo "│   └── metadata/"
echo "│       └── audio_<timestamp>.json"
echo "├── vision_log/"
echo "│   └── face_<timestamp>.json"
echo "├── matched_sessions/"
echo "│   └── session_<id>.json"
echo "├── scripts/"
echo "│   ├── record_audio.py"
echo "│   ├── vad_keyword_trigger.py"
echo "│   ├── generate_metadata.py"
echo "│   ├── analyze_transcript.py"
echo "│   ├── session_matcher.py"
echo "│   ├── filter_noise.sh"
echo "│   ├── pi_ui_display.py"
echo "│   └── batch_uploader.py"
echo "└── .env"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify service is running: sudo systemctl status scout-client"
echo "2. Check logs: journalctl -u scout-client -f"
echo "3. Customize configuration in ~/.env if needed"
echo "4. Monitor Event Hub for incoming data"