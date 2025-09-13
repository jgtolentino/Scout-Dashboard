#!/bin/bash
# Claudia Sync Warning Filter Script
# This script modifies the claudia_autosync_downloads.sh script to filter out specific warnings

set -e

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Path to the claudia_autosync_downloads.sh script
CLAUDIA_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/claudia_autosync_downloads.sh"

# Create a backup of the original script
BACKUP_FILE="${CLAUDIA_SCRIPT}.bak.$(date +%Y%m%d%H%M%S)"
cp "$CLAUDIA_SCRIPT" "$BACKUP_FILE"

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Claudia Sync Warning Filter                             ${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo -e "${YELLOW}Created backup: $BACKUP_FILE${NC}"

# Replace the warning line with a filtered version
sed -i.bak '
/echo "$(date): ⚠️ Skipped unrecognized file: $filename"/c\
        # Filter specific file types to avoid warning spam in logs\
        if [[ "$filename" =~ skr_docs.yaml|claudia_router.yaml|conventions.yaml|"(1).yaml" ]]; then\
          # Silently skip known files\
          echo "$(date): [SILENT] Skipped expected file: $filename" >> "$LOG_FILE"\
        else\
          echo "$(date): ⚠️ Skipped unrecognized file: $filename" | tee -a "$LOG_FILE"\
        fi
' "$CLAUDIA_SCRIPT"

# Verify the change was made
if grep -q "SILENT" "$CLAUDIA_SCRIPT"; then
  echo -e "${GREEN}Successfully updated claudia_autosync_downloads.sh to filter warnings${NC}"
  
  # Add log entry
  LOG_FILE="$HOME/claudia_sync.log"
  echo "[$(date)] Warning filter added for skr_docs.yaml, claudia_router.yaml, conventions.yaml" >> "$LOG_FILE"
  
  # Print instructions
  echo -e "${YELLOW}To activate the changes, restart the Claudia service:${NC}"
  echo -e "${BLUE}launchctl unload ~/Library/LaunchAgents/com.claudia.autosync.plist${NC}"
  echo -e "${BLUE}launchctl load ~/Library/LaunchAgents/com.claudia.autosync.plist${NC}"
else
  echo -e "${RED}Failed to update claudia_autosync_downloads.sh${NC}"
  echo -e "${YELLOW}Restoring from backup...${NC}"
  cp "$BACKUP_FILE" "$CLAUDIA_SCRIPT"
  echo -e "${GREEN}Restored from backup${NC}"
fi

echo -e "${BLUE}===========================================================${NC}"

# Make this script executable
chmod +x "$0"

exit 0