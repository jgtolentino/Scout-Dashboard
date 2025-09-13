#!/bin/bash

# Create an entry in the user's crontab to run Pulser validation daily
# This helps keep track of the Pulser MVP's status automatically

VALIDATOR_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/pulser_validate.sh"

if [ ! -f "$VALIDATOR_SCRIPT" ]; then
  echo "❌ Error: Validator script not found at $VALIDATOR_SCRIPT"
  exit 1
fi

# Make sure it's executable
chmod +x "$VALIDATOR_SCRIPT"

# Create a temporary file with the current crontab
crontab -l > /tmp/current_crontab 2>/dev/null || echo "" > /tmp/current_crontab

# Check if the entry already exists
if grep -q "pulser_validate.sh" /tmp/current_crontab; then
  echo "✅ Pulser validation is already scheduled in crontab"
else
  # Add the entry to run daily at 9 AM
  echo "0 9 * * * $VALIDATOR_SCRIPT >> /Users/tbwa/pulser_validation.log 2>&1" >> /tmp/current_crontab
  crontab /tmp/current_crontab
  echo "✅ Pulser validation scheduled to run daily at 9 AM"
  echo "✅ Logs will be written to ~/pulser_validation.log"
fi

# Clean up
rm /tmp/current_crontab

echo "$(date '+%Y-%m-%d %H:%M:%S') ⏱️ Pulser MVP: Validation scheduled for daily monitoring" >> ~/claudia_sync.log
echo "✅ Done!"