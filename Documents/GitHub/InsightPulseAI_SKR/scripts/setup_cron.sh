#!/bin/bash

# Setup cron job to run claudia_autosync_downloads.sh every 30 minutes
SCRIPT_PATH="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/claudia_autosync_downloads.sh"
LOG_PATH="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_PATH"

# Create a temporary file for the new crontab
TEMP_CRON=$(mktemp)

# Export existing crontab
crontab -l > "$TEMP_CRON" 2>/dev/null

# Check if our script is already in crontab
if grep -q "claudia_autosync_downloads.sh" "$TEMP_CRON"; then
  echo "⚠️ The autosync script is already scheduled in your crontab."
  echo "If you need to modify it, please use 'crontab -e' manually."
else
  # Add our script to crontab
  echo "# Run Claudia autosync every 30 minutes" >> "$TEMP_CRON"
  echo "*/30 * * * * $SCRIPT_PATH > $LOG_PATH/autosync_\$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).log 2>&1" >> "$TEMP_CRON"

  # Install the new crontab
  if crontab "$TEMP_CRON"; then
    echo "✅ ClaudiaShell autosync has been scheduled to run every 30 minutes"
    echo "Logs will be saved in $LOG_PATH"
  else
    echo "❌ Failed to schedule the autosync script"
    echo "Please try to set up the cron job manually:"
    echo "crontab -e"
    echo "Then add this line:"
    echo "*/30 * * * * $SCRIPT_PATH > $LOG_PATH/autosync_\$(date +%Y%m%d_%H%M%S).log 2>&1"
  fi
fi

# Clean up
rm "$TEMP_CRON"