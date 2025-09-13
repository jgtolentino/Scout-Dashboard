#!/bin/bash

# Make the main script executable
chmod +x /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/claudia_autosync_downloads.sh

# Load the LaunchAgent
launchctl unload ~/Library/LaunchAgents/com.insightpulseai.claudia.autosync.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.insightpulseai.claudia.autosync.plist

echo "🧿 Claudia AutoSync LaunchAgent loaded successfully!"
echo "✅ The agent will now run automatically at system startup"
echo "📊 Status check:"
launchctl list | grep claudia.autosync

echo ""
echo "To disable the service:"
echo "launchctl unload ~/Library/LaunchAgents/com.insightpulseai.claudia.autosync.plist"