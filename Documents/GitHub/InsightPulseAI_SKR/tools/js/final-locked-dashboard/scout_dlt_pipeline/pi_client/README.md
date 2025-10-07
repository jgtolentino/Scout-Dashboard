# Scout Raspberry Pi Client

This directory contains the client software for Raspberry Pi devices in the Scout system. The client captures audio and video data, processes it using STT and OpenCV, and publishes events to Azure Event Hubs.

## Features

- Audio capture and speech-to-text processing
- Video capture and OpenCV-based detection (face, gesture, zone)
- Combined multimodal event annotation
- Device health monitoring and heartbeat
- Azure Event Hub integration

## Requirements

- Raspberry Pi 4 (recommended) or newer
- Camera module
- Microphone
- Python 3.7+
- Azure Event Hub connection strings

## Installation

1. Install system dependencies:

    ```bash
    ./install_requirements.sh
    ```

2. Configure environment variables:

    ```bash
    # Add to ~/.bashrc or create a .env file
    export DEVICE_ID="pi-device-001"
    export STORE_ID="store-112"
    export LOCATION_ZONE="entrance"
    export CAMERA_POSITION="ceiling"
    
    # Event Hub connection strings
    export EVENTHUB_STT="Endpoint=sb://..."
    export EVENTHUB_VISUAL="Endpoint=sb://..."
    export EVENTHUB_ANNOTATED="Endpoint=sb://..."
    export EVENTHUB_HEARTBEAT="Endpoint=sb://..."
    ```

3. Run the client:

    ```bash
    python3 stt_visual_client.py
    ```

## Command-Line Options

```bash
# Run with custom device and store IDs
python3 stt_visual_client.py --device-id pi-device-002 --store-id store-156 --zone checkout

# Run in STT-only mode (disable video)
python3 stt_visual_client.py --stt-only

# Run in visual-only mode (disable STT)
python3 stt_visual_client.py --visual-only
```

## Event Data Format

### STT Events

```json
{
  "device_id": "pi-device-001",
  "timestamp": "2025-05-15T12:34:56.789Z",
  "session_id": "f8a7b6c5-d4e3-f2a1-b0c9-d8e7f6a5b4c3",
  "transcript": "Hello, I'm looking for the summer collection.",
  "confidence": 0.92,
  "language": "en",
  "audio_duration_sec": 2.5,
  "speaker_id": "unknown",
  "metadata": {
    "store_id": "store-112",
    "location_zone": "entrance",
    "model_version": "whisper-tiny",
    "noise_level_db": 35.0
  }
}
```

### Visual Events

```json
{
  "device_id": "pi-device-001",
  "timestamp": "2025-05-15T12:34:56.789Z",
  "session_id": "f8a7b6c5-d4e3-f2a1-b0c9-d8e7f6a5b4c3",
  "frame_id": 1234,
  "detections": [
    {
      "detection_type": "face",
      "confidence": 0.85,
      "bounding_box": {
        "x": 120,
        "y": 80,
        "width": 100,
        "height": 100
      },
      "attributes": {
        "age_group": "adult",
        "gender": "unknown",
        "gesture_type": null,
        "object_class": null,
        "zone_id": "entrance",
        "motion_direction": null,
        "dwell_time_sec": 0.0
      }
    }
  ],
  "metadata": {
    "store_id": "store-112",
    "camera_position": "ceiling",
    "resolution": "640x480",
    "fps": 30.0,
    "model_version": "opencv-4.5.1"
  }
}
```

## Troubleshooting

### Event Hub Connection Issues

- Ensure all Event Hub connection strings are correct
- Check network connectivity to Azure
- Verify that the Event Hubs exist and are properly configured

### Camera/Microphone Issues

- Check device permissions (run with sudo if needed)
- Verify hardware connections
- Test camera with: `raspistill -o test.jpg`
- Test microphone with: `arecord -d 5 test.wav`

### Performance Issues

- Reduce resolution if video processing is slow
- Consider disabling STT or visual processing if the device is overloaded
- Monitor CPU and memory usage with `htop`

## Maintenance

- Check logs regularly: `cat scout_pi_client.log`
- Update software: `git pull && ./install_requirements.sh`
- Restart on boot: Add to `/etc/rc.local` or create a systemd service