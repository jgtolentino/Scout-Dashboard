#!/bin/bash
# Update Raspberry Pi clients to restore audio upload functionality
# Part of Scout DLT Pipeline rollback (May 19, 2025)

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Scout Raspberry Pi Client Update${NC}"
echo "==============================="
echo ""

# Get device ID for logging
DEVICE_ID=$(hostname)
STORE_ID=$(grep "STORE_ID" /home/pi/project-scout/.env | cut -d "=" -f2 | tr -d '"')

# Log file
LOG_FILE="/home/pi/project-scout/update_log_$(date +%Y%m%d%H%M%S).log"

# Function to log message
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

# Backup current configuration
log "Creating backup of current configuration..."
cp /home/pi/project-scout/.env /home/pi/project-scout/.env.bak.$(date +%Y%m%d%H%M%S)
cp /home/pi/project-scout/scripts/batch_uploader.py /home/pi/project-scout/scripts/batch_uploader.py.bak.$(date +%Y%m%d%H%M%S)

# Update configuration to enable audio uploads
log "Updating configuration to enable audio uploads..."
if grep -q "ENABLE_AUDIO_UPLOAD=false" /home/pi/project-scout/.env; then
    sed -i 's/ENABLE_AUDIO_UPLOAD=false/ENABLE_AUDIO_UPLOAD=true/' /home/pi/project-scout/.env
    log "Set ENABLE_AUDIO_UPLOAD=true in .env file"
else
    # Add the parameter if it doesn't exist
    echo "ENABLE_AUDIO_UPLOAD=true" >> /home/pi/project-scout/.env
    log "Added ENABLE_AUDIO_UPLOAD=true to .env file"
fi

# Add blob storage connection if missing
if ! grep -q "AZURE_BLOB_CONNECTION_STRING" /home/pi/project-scout/.env; then
    log "Adding AZURE_BLOB_CONNECTION_STRING to .env file"
    echo "AZURE_BLOB_CONNECTION_STRING=\"DefaultEndpointsProtocol=https;AccountName=scoutblobaccount;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net\"" >> /home/pi/project-scout/.env
    log "Note: AZURE_BLOB_CONNECTION_STRING needs to be updated with actual credentials"
fi

# Update the batch uploader script to include audio upload functionality
log "Updating batch_uploader.py to include audio upload functionality..."
UPLOADER_FILE="/home/pi/project-scout/scripts/batch_uploader.py"

# Check if the script needs to be updated
if grep -q "# Audio uploads disabled" "$UPLOADER_FILE"; then
    log "Patching batch_uploader.py to restore audio upload functionality..."
    
    # Remove comment lines that disabled audio upload
    sed -i '/# Audio uploads disabled/d' "$UPLOADER_FILE"
    sed -i '/# if upload_audio:/d' "$UPLOADER_FILE"
    
    # Uncomment audio upload functionality
    sed -i 's/# *\(.*upload_audio_to_blob.*\)/\1/' "$UPLOADER_FILE"
    sed -i 's/# *\(.*audio_url =.*\)/\1/' "$UPLOADER_FILE"
    sed -i 's/# *\(.*event_data\["audio_url"\].*\)/\1/' "$UPLOADER_FILE"
    
    log "Audio upload functionality restored in batch_uploader.py"
else
    log "batch_uploader.py appears to already have audio upload functionality enabled"
fi

# Create audio buffer directory if it doesn't exist
if [ ! -d "/home/pi/project-scout/audio_buffer" ]; then
    log "Creating audio buffer directory..."
    mkdir -p /home/pi/project-scout/audio_buffer
    chmod 755 /home/pi/project-scout/audio_buffer
fi

# Restart the Scout client service
log "Restarting Scout client service..."
sudo systemctl restart scout-client

# Verify service status
log "Verifying service status..."
SERVICE_STATUS=$(sudo systemctl is-active scout-client)

if [ "$SERVICE_STATUS" = "active" ]; then
    log "Scout client service restarted successfully"
else
    log "ERROR: Scout client service failed to restart. Status: $SERVICE_STATUS"
    log "Please check the service logs with: sudo journalctl -u scout-client"
fi

# Send status to monitoring
log "Sending status update to monitoring system..."
if command -v curl &> /dev/null; then
    curl -s -X POST "https://scout-monitoring.example.com/api/device-update" \
        -H "Content-Type: application/json" \
        -d "{\"device_id\":\"$DEVICE_ID\",\"store_id\":\"$STORE_ID\",\"update\":\"audio_upload_enabled\",\"status\":\"complete\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
        -o /dev/null || log "Warning: Failed to send status update"
else
    log "Warning: curl not found, skipping status update"
fi

log "Update completed successfully. Audio uploads are now enabled."
echo -e "${GREEN}Update completed successfully.${NC}"
echo "Audio uploads are now enabled on this device."
echo "Check the log file for details: $LOG_FILE"

exit 0