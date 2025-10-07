#!/bin/bash
# Phase 2.5 Monitoring Script for Stakeholders

echo "RED2025 Crisis Protocol - Phase 2.5 Monitor"
echo "==========================================="

# Display current status
echo "Current Status:"
cat war_room/status_board.md

# Display recent log entries
echo -e "\nRecent Events:"
tail -n 20 validation_protocol.log

# Option to refresh
echo -e "\nPress Ctrl+C to exit or wait 30s for refresh..."
sleep 30
exec $0
