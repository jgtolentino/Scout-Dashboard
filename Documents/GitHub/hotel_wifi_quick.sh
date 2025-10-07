#!/bin/bash

# Quick Hotel Wi-Fi Login - One-liner approach

# Check if already connected
if curl -s --head https://www.google.com | grep "200 OK" > /dev/null; then
    echo "✓ Already connected!"
    exit 0
fi

# Get portal URL
PORTAL=$(curl -sI http://captive.apple.com | grep -i location | cut -d' ' -f2 | tr -d '\r')

if [ -z "$PORTAL" ]; then
    echo "No captive portal found. Try:"
    echo "1. Disconnect and reconnect to Wi-Fi"
    echo "2. Run: sudo dscacheutil -flushcache"
    exit 1
fi

echo "Portal found: $PORTAL"
echo ""
echo "Quick login commands to try:"
echo ""
echo "# Option 1 - Basic POST:"
echo "curl -X POST '$PORTAL' -d 'username=ROOM123&password=PASS' -L"
echo ""
echo "# Option 2 - With common fields:"
echo "curl -X POST '$PORTAL' -d 'room=123&code=password&terms=1' -L"
echo ""
echo "# Option 3 - Open in browser:"
echo "open '$PORTAL'"
echo ""
echo "# Option 4 - Debug mode:"
echo "curl -v '$PORTAL' | grep -E '<form|input|name=' | head -20"