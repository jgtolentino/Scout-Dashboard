#!/bin/bash
# Setup Cline with Local Ollama Models
# Fully uninstalls and reinstalls Cline for clean local-only setup

set -e

echo "🧹 Step 1: Fully Uninstall Cline"

# Remove global Cline CLI install
npm uninstall -g cline || echo "Cline CLI not installed globally"

# Remove Cline VS Code extension storage
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev

# Kill any stuck VS Code sessions
pkill -f "Visual Studio Code" || echo "No VS Code processes found"

echo "✅ Cline uninstalled successfully"

echo "📦 Step 2: Reinstall Cline"

# Reinstall Cline globally
npm install -g cline

echo "✅ Cline reinstalled successfully"

echo "⚙️ Step 3: Configure Cline for Local Ollama"

# Create clean workspace
mkdir -p ~/cline-local/.vscode

# Create VS Code settings for Ollama
cat > ~/cline-local/.vscode/settings.json << 'EOF'
{
  "claude-dev.apiProvider": "openai-compatible",
  "claude-dev.openaiCompatibleApiUrl": "http://localhost:11434/v1",
  "claude-dev.openaiCompatibleModelId": "deepseek-coder:6.7b-instruct-q4_K_M"
}
EOF

echo "✅ Cline configured for local Ollama"

echo "🧠 Step 4: Verify Setup"

# Check if Ollama is running
if curl -s http://localhost:11434/v1/models > /dev/null 2>&1; then
    echo "✅ Ollama is running and accessible"
else
    echo "⚠️  Ollama is not running. Start it with: ollama serve"
fi

# Check if deepseek-coder model is available
if ollama list | grep -q "deepseek-coder"; then
    echo "✅ deepseek-coder model is available"
else
    echo "⚠️  deepseek-coder model not found. Install with: ollama pull deepseek-coder:6.7b-instruct-q4_K_M"
fi

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "To use Cline:"
echo "1. Start Ollama: ollama serve"
echo "2. Open VS Code: code ~/cline-local"
echo "3. Install Cline extension if needed"
echo "4. Start coding with local AI!"
echo ""
echo "Your Cline workspace is ready at: ~/cline-local"