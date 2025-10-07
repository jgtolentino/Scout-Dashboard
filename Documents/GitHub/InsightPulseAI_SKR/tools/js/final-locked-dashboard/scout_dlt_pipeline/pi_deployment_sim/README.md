# Scout Raspberry Pi Client Deployment for Sari-Sari Stores

This directory contains scripts and instructions for deploying the Scout client to Raspberry Pi devices in Sari-Sari stores across the Philippines.

## Directory Structure

Once deployed, each Raspberry Pi will have the following directory structure:

```
/home/pi/project-scout/
├── audio_buffer/
│   ├── audio_<timestamp>.wav       # Temporary audio processing only, not uploaded
│   └── metadata/
│       └── audio_<timestamp>.json  # Metadata for local processing
├── vision_log/
│   └── face_<timestamp>.json       # Local face detection logs
├── matched_sessions/
│   └── session_<id>.json           # Local session matching results
├── scripts/
│   ├── record_audio.py             # Audio capture utility
│   ├── vad_keyword_trigger.py      # Voice activity detection
│   ├── generate_metadata.py        # Metadata extraction
│   ├── analyze_transcript.py       # Local transcript analysis
│   ├── session_matcher.py          # Audio/visual correlation
│   ├── filter_noise.sh             # Audio preprocessing
│   ├── pi_ui_display.py            # Optional local UI
│   └── batch_uploader.py           # Event Hub data uploader
└── .env                            # Configuration file
```

## Deployment Instructions

1. Copy the `setup_pi_client.sh` script to each Raspberry Pi device
2. SSH into each device and run:

   ```bash
   chmod +x setup_pi_client.sh
   ./setup_pi_client.sh
   ```

3. Configure the device by editing `~/project-scout/.env`

## Configuration Parameters

Edit the `.env` file to customize the client:

```bash
# Device configuration
DEVICE_ID="pi-device-store112"       # Unique ID for this device
STORE_ID="sari-112"                  # Store identifier
LOCATION_ZONE="entrance"             # Location within store (entrance, checkout, etc.)
CAMERA_POSITION="ceiling"            # Camera mounting position

# Event Hub connection strings (provided by setup script)
EVENTHUB_STT="Endpoint=sb://..."
EVENTHUB_VISUAL="Endpoint=sb://..."
EVENTHUB_ANNOTATED="Endpoint=sb://..."
EVENTHUB_HEARTBEAT="Endpoint=sb://..."

# Optional configurations
AUDIO_SAMPLE_RATE=16000              # Audio sample rate in Hz
AUDIO_CHANNELS=1                     # Mono audio
CAMERA_RESOLUTION="640x480"          # Camera resolution
FACE_DETECTION_SCALE=1.1             # Scale factor for face detection
ENABLE_HEARTBEAT=true                # Enable device heartbeat
HEARTBEAT_INTERVAL=60                # Heartbeat interval in seconds
```

## Important Implementation Notes

### ✅ AudioURL Field Deprecation

The current implementation **does not** upload or store audio files in blob storage:

- **Change**: The `AudioURL` field in `dbo.bronze_transcriptions` is now deprecated
- **Impact**: Audio files are processed locally and **only the transcription text is sent** to Event Hub
- **Local Storage**: Audio files are temporarily stored in `audio_buffer/` for local processing only
- **Cleanup**: Temporary audio files are automatically deleted after processing

This change improves:
- **Privacy**: No raw audio is stored in the cloud
- **Bandwidth**: Reduces data transfer requirements
- **Storage Costs**: Eliminates blob storage needs for audio files
- **Simplicity**: Streamlines ETL pipeline without audio URL processing

### Data Flow

1. **Local Processing**:
   - Audio is captured and processed locally on the Raspberry Pi
   - Speech-to-text (STT) processing happens on-device
   - Face and product detection happens on-device
   - Session correlation happens on-device

2. **Event Hub Publishing**:
   - Only processed data (transcripts, detections) is sent to Event Hubs
   - No audio files or images are uploaded to cloud storage
   - Lightweight JSON payloads optimize bandwidth usage

## Monitoring

- Check service status: `sudo systemctl status scout-client`
- View logs: `journalctl -u scout-client -f`
- Restart service: `sudo systemctl restart scout-client`

## Troubleshooting

### Camera/Microphone Issues

- If camera or microphone permissions are denied, run:
  ```bash
  sudo usermod -a -G video,audio $(whoami)
  ```
- Test camera with: `raspistill -o test.jpg`
- Test microphone with: `arecord -d 5 test.wav`

### Event Hub Connection Issues

- Verify network connectivity: `ping scout-eh-namespace-abc123.servicebus.windows.net`
- Check connection strings in `.env` file
- Ensure Azure Event Hub is properly configured

### Performance Issues

- Reduce resolution in `.env` if CPU usage is too high
- For low-power devices, set `ENABLE_VISUAL=false` to disable video processing
- Adjust `AUDIO_SAMPLE_RATE` and `CAMERA_RESOLUTION` for better performance

## Updating

To update the client to the latest version:

```bash
cd ~/project-scout
git pull
sudo systemctl restart scout-client
```

## Security Notes

- All Event Hub connections use SAS tokens with minimally required permissions
- No sensitive information is stored on the device
- All data is processed locally before being sent to the cloud

## Support

For assistance with deployment:
- Contact: devops@example.com
- Submit issues: https://github.com/tbwa/project-scout/issues