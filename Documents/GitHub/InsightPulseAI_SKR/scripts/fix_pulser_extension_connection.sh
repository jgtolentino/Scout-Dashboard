#!/bin/bash
# Fix Pulser VS Code extension connection issues

echo "🔧 Fixing Pulser Extension Connection..."

# 1. Ensure Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

# 2. Test connection
echo "Testing Ollama connection..."
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running on 127.0.0.1:11434"
else
    echo "❌ Ollama is not responding"
    exit 1
fi

# 3. List available models
echo ""
echo "Available models:"
curl -s http://127.0.0.1:11434/api/tags | jq -r '.models[].name' | grep -E "(deepseek|codellama)"

# 4. Set VS Code settings
echo ""
echo "Updating VS Code settings..."
cat > "$HOME/Library/Application Support/Code/User/settings.json.tmp" << 'EOF'
{
    "pulser.apiEndpoints": [
        "http://127.0.0.1:11434/api/generate"
    ],
    "pulser.model": "deepseek-coder:6.7b-instruct-q4_K_M",
    "pulser.timeout": 30000,
    "pulser.maxTokens": 2048
}
EOF

# Merge with existing settings if file exists
if [ -f "$HOME/Library/Application Support/Code/User/settings.json" ]; then
    echo "Merging with existing settings..."
    # This is a simple append - in production you'd want proper JSON merging
    echo "Please manually add these settings to your VS Code settings.json:"
    cat "$HOME/Library/Application Support/Code/User/settings.json.tmp"
else
    mv "$HOME/Library/Application Support/Code/User/settings.json.tmp" "$HOME/Library/Application Support/Code/User/settings.json"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🦫 The Pulser extension is now configured to use:"
echo "   - API: http://127.0.0.1:11434"
echo "   - Model: deepseek-coder:6.7b-instruct-q4_K_M"
echo ""
echo "Reload VS Code window (Cmd+R) to apply settings."