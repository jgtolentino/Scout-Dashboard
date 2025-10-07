#!/bin/bash

echo "🔍 Monitoring Claude Connection Attempts"
echo "======================================"
echo ""
echo "Watching for new connections..."
echo "Try clicking 'Update' in Claude.ai now"
echo ""

# Monitor both logs
tail -f bridge.log ngrok.log | while read line; do
    echo "[$(date +%H:%M:%S)] $line"
done