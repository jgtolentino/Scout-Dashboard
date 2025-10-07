# Scout DLT Pipeline Rollback Guide

This document provides a detailed procedure for rolling back the Scout DLT Pipeline to the previous stable configuration from May 19, 2025. The rollback reverses the AudioURL field deprecation change that was recently implemented.

## Overview

The recent update to the Scout DLT Pipeline included:
- Removal of the AudioURL field from bronze_transcriptions
- Changes to ETL configuration to stop audio blob storage
- Updates to Raspberry Pi clients to stop uploading audio files
- Documentation updates reflecting the AudioURL deprecation

This rollback will restore the previous functionality where:
- AudioURL field is included in the pipeline
- Audio files are stored in blob storage
- Raspberry Pi clients upload audio files to the cloud

## Prerequisites

To complete this rollback, you need:

1. **Access Credentials**:
   - Databricks workspace access
   - Azure CLI credentials
   - Git repository access

2. **CLI Tools**:
   - Databricks CLI (`pip install databricks-cli`)
   - Azure CLI
   - Git
   - jq (`brew install jq` on macOS)

## Rollback Procedure

### 1. Prepare the Environment

```bash
# Clone the repository if you don't have it
git clone https://github.com/tbwa/InsightPulseAI_SKR.git
cd InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline

# Switch to the rollback branch
git checkout rollback-dashboard-2025-05-19
```

### 2. Run the Rollback Script

We've prepared an automated rollback script that performs the following actions:
- Creates a backup of the current configuration
- Stops the running DLT pipeline
- Restores the previous versions of DLT scripts
- Updates the schema to include AudioURL field again
- Updates configuration to enable audio storage

```bash
# Make the script executable
chmod +x rollback_pipeline.sh

# Run the rollback script
./rollback_pipeline.sh
```

### 3. Verify the Rollback

After running the script, verify that:

1. **Check DLT Scripts**:
   ```bash
   grep -n "audio_url" scout_bronze_dlt.py
   # Should show the AudioURL field in schema definition
   ```

2. **Check ETL Configuration**:
   ```bash
   grep -n "backup_audio_files" etl-deploy-kit.yaml
   # Should show audio backup is enabled
   ```

3. **Verify Databricks Pipeline Status**:
   - Log into Databricks workspace
   - Navigate to Workflows → Delta Live Tables
   - Verify ScoutDLT pipeline is in "Stopped" status

### 4. Restart the Pipeline

Once verification is complete:

1. **Start the Pipeline**:
   ```bash
   # Get the pipeline ID
   PIPELINE_ID=$(databricks pipelines get --pipeline-name "ScoutDLT" | jq -r '.pipeline_id')
   
   # Start the pipeline
   databricks pipelines start --pipeline-id "$PIPELINE_ID"
   ```

2. **Monitor Pipeline Health**:
   - Watch the pipeline initialization
   - Verify that all tables are created with correct schema

### 5. Update Raspberry Pi Devices

The Raspberry Pi devices need to be updated to send audio files again:

1. **Create Device Update Script**:
   ```bash
   # Create a reversion script for Pi devices
   cat <<EOF > update_pi_clients.sh
   #!/bin/bash
   # Revert Pi clients to include audio uploads
   
   # Update configuration
   sed -i 's/ENABLE_AUDIO_UPLOAD=false/ENABLE_AUDIO_UPLOAD=true/' ~/project-scout/.env
   
   # Restart the service
   sudo systemctl restart scout-client
   EOF
   ```

2. **Deploy to Devices**:
   - Use your device management system to push update_pi_clients.sh to all devices
   - Execute the script on all devices
   - Verify logs to ensure audio uploads resume

## Monitoring and Validation

After completing the rollback:

1. **Monitor Data Quality**:
   - Check if new records in bronze_transcriptions have AudioURL values
   - Verify audio files are appearing in blob storage

2. **Validate End-to-End Flow**:
   - Confirm that dashboard functionality dependent on audio references works
   - Test any features that rely on audio file access

3. **Update Documentation**:
   - Revert any documentation that mentioned AudioURL deprecation
   - Clearly mark current state of the system

## Rollback Completion Checklist

- [ ] Rollback script executed successfully
- [ ] DLT scripts restored and modified to include AudioURL
- [ ] Pipeline restarted successfully
- [ ] Raspberry Pi clients updated
- [ ] Data validation shows AudioURL field populated
- [ ] Blob storage receiving audio files
- [ ] Dashboard functionality verified
- [ ] Documentation updated

## Support

If you encounter any issues during the rollback process:
- Contact: devops@example.com
- Create an issue: https://github.com/tbwa/InsightPulseAI_SKR/issues
- Emergency contact: Call the on-call engineer at (555) 123-4567