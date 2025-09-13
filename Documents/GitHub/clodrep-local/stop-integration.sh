#!/usr/bin/env bash
# stop-integration.sh - Stop the Claude integration

echo "🛑 Stopping Claude Integration..."

if [[ -f .integration-info ]]; then
    source .integration-info
    
    if [[ -n "$BRIDGE_PID" ]] && kill -0 $BRIDGE_PID 2>/dev/null; then
        kill $BRIDGE_PID
        echo "✅ Stopped bridge (PID: $BRIDGE_PID)"
    fi
    
    if [[ -n "$NGROK_PID" ]] && kill -0 $NGROK_PID 2>/dev/null; then
        kill $NGROK_PID
        echo "✅ Stopped ngrok (PID: $NGROK_PID)"
    fi
    
    rm -f .integration-info
else
    # Fallback: kill by process name
    pkill -f quick-bridge.cjs && echo "✅ Stopped bridge process"
    pkill -f "ngrok http" && echo "✅ Stopped ngrok process"
fi

# Clean up logs
rm -f bridge.log ngrok.log

echo "✅ Integration stopped"