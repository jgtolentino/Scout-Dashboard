# Sari-Sari Store Analytics Sample Data

This directory contains sample data files for the Scout DLT Pipeline tailored to Sari-Sari stores in the Philippines. These simulated datasets represent data collected from Raspberry Pi devices deployed in Sari-Sari stores to capture customer interactions and product mentions.

## Files Included

1. **sari_sari_simulated_data.json**
   - Speech-to-text data from microphones in Sari-Sari stores
   - Contains customer requests for products in Filipino/Tagalog
   - Includes metadata like store ID, location, and audio properties

2. **rollback_test_data.json**
   - Sample data with AudioURL field included (post-rollback format)
   - Contains the same speech-to-text data but with audio file references
   - Used for testing the rollback implementation

3. **sari_sari_visual_data.json**
   - Visual detection data from cameras in Sari-Sari stores
   - Includes face detections (anonymized) and product detections
   - Contains spatial information and dwell time metrics

4. **sari_sari_heartbeat_data.json**
   - Device health monitoring data
   - Includes battery level, temperature, memory usage, etc.
   - Used for monitoring device status and performance

5. **product_catalog.json**
   - Reference data for products commonly sold in Sari-Sari stores
   - Includes product details, categories, brands, and pricing
   - Used for brand mention analysis and sales correlation

## Data Schema

### Speech Data Schema
```json
{
  "device_id": "pi-device-001",
  "timestamp": "2025-05-19T08:01:12.345Z",
  "session_id": "f8a7b6c5-d4e3-f2a1-b0c9-d8e7f6a5b4c3",
  "transcript": "Pabili po ng dalawang Milo sachet at isang Palmolive shampoo.",
  "confidence": 0.89,
  "language": "tl",
  "audio_duration_sec": 2.5,
  "speaker_id": "unknown",
  "audio_url": "https://scoutblobaccount.blob.core.windows.net/scout-audio/sari-112/audio_20250519_080112.wav",
  "metadata": {
    "store_id": "sari-112",
    "location_zone": "entrance",
    "model_version": "whisper-tiny",
    "noise_level_db": 35.0,
    "simulated": true
  }
}
```

### Visual Data Schema
```json
{
  "device_id": "pi-device-001",
  "timestamp": "2025-05-19T08:01:15.765Z",
  "session_id": "f8a7b6c5-d4e3-f2a1-b0c9-d8e7f6a5b4c3",
  "frame_id": 1234,
  "detections": [
    {
      "detection_type": "face",
      "confidence": 0.88,
      "bounding_box": {...},
      "attributes": {...}
    },
    {
      "detection_type": "product",
      "confidence": 0.92,
      "bounding_box": {...},
      "attributes": {...}
    }
  ],
  "metadata": {...}
}
```

### Device Heartbeat Schema
```json
{
  "device_id": "pi-device-001",
  "timestamp": "2025-05-19T08:00:00.000Z",
  "store_id": "sari-112",
  "status": "online",
  "battery_level": "95.2",
  "temperature_c": "42.3",
  "memory_usage_pct": "45.7",
  "disk_usage_pct": "62.3",
  "network_signal_strength": "excellent",
  "camera_fps": "29.8",
  "errors": "",
  "sw_version": "1.0.0",
  "metadata": {
    "simulated": true
  }
}
```

## Usage

These sample data files can be used for:

1. **Testing the ETL Pipeline**
   - Process data through bronze, silver, and gold layers
   - Verify data transformations and aggregations

2. **Dashboard Development**
   - Develop and test analytics dashboards
   - Create visualizations for brand mentions and customer behaviors

3. **Algorithm Testing**
   - Test NLP algorithms for brand mention detection
   - Develop session matching algorithms between speech and visual data

4. **Device Monitoring**
   - Test device health monitoring dashboards
   - Develop alerting systems for device issues

## Note on Simulated Data

All data in these files is simulated and does not represent real customers or transactions. The data has been crafted to represent realistic patterns of customer behavior and product mentions in typical Sari-Sari stores in the Philippines, including:

- Common Filipino products (Milo, Palmolive, Bear Brand, etc.)
- Typical transaction patterns (small quantity purchases)
- Filipino/Tagalog language patterns and expressions
- Realistic store layouts and customer flow

Each record is marked with `"simulated": true` in the metadata to clearly indicate its synthetic nature.

## Implementation Notes

### ✅ ROLLBACK NOTICE: AudioURL Field Restored

The `AudioURL` field has been **restored** in the Project Scout pipeline as part of the rollback-dashboard-2025-05-19 branch:

- **Table**: `dbo.bronze_transcriptions`
- **Field**: `AudioURL`
- **Status**: `ACTIVE` (Rollback from previous deprecation)

This field is now included in all sample data and processing logic. The current implementation:

- Includes and processes audio file URLs
- Requires blob storage for audio clips
- Supports both transcript text and audio file access

The AudioURL field uses the following format:

```json
{
  "audio_url": "https://<account>.blob.core.windows.net/scout-audio/<store-id>/audio_<timestamp>.wav"
}
```

A new test file with the AudioURL field included has been added: `rollback_test_data.json`

## Related Resources

- `scout_bronze_dlt.py` - Bronze layer data processing
- `scout_silver_dlt.py` - Silver layer data transformations
- `scout_gold_dlt.py` - Gold layer analytics aggregations
- Deployment scripts for Raspberry Pi devices