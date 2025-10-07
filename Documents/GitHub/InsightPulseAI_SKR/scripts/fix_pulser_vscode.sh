#!/bin/bash
# Fix and reinstall Pulser VS Code extension

echo "🔧 Fixing Pulser VS Code Extension..."

# 1. Remove broken installation
echo "📦 Removing broken extension..."
rm -rf ~/.vscode/extensions/undefined_publisher.pulser-0.0.1

# 2. Install from the correct VSIX file
VSIX_PATH="/Users/tbwa/Documents/GitHub/cline-wrapper/pulser-0.0.1.vsix"

if [ -f "$VSIX_PATH" ]; then
    echo "📥 Installing Pulser extension from VSIX..."
    code --install-extension "$VSIX_PATH" --force
    
    echo "✅ Extension installed!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Restart VS Code"
    echo "2. Look for the Pulser icon in the Activity Bar (left sidebar)"
    echo "3. Click it to open the Pulser chat panel"
    echo ""
    echo "⚙️  Configuration:"
    echo "The extension is configured to use:"
    echo "- Ollama API: http://localhost:11434"
    echo "- Default model: codellama:7b-code"
    echo ""
    echo "To use DeepSeek instead:"
    echo "1. Open VS Code Settings (Cmd+,)"
    echo "2. Search for 'pulser'"
    echo "3. Change 'Pulser: Model' to 'deepseek-coder:6.7b-instruct-q4_K_M'"
else
    echo "❌ Error: VSIX file not found at $VSIX_PATH"
    echo "Building from source..."
    
    cd /Users/tbwa/Documents/GitHub/cline-wrapper
    
    # Install dependencies
    npm install
    
    # Compile TypeScript
    npm run compile
    
    # Package extension
    npm run package
    
    # Install the newly built VSIX
    if [ -f "pulser-0.0.1.vsix" ]; then
        code --install-extension pulser-0.0.1.vsix --force
        echo "✅ Extension built and installed!"
    else
        echo "❌ Failed to build extension"
        exit 1
    fi
fi

# Test Ollama connection
echo ""
echo "🧪 Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
    
    # List available models
    echo ""
    echo "📦 Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name' | grep -E "(codellama|deepseek)" || echo "No code models found"
else
    echo "❌ Ollama is not running!"
    echo "Starting Ollama..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
    echo "✅ Ollama started"
fi

echo ""
echo "🎉 Setup complete! Please restart VS Code."