#!/bin/bash

echo "🚀 Setting up Clodrep Local CLI..."

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node --version)
echo "Node.js version: $node_version"

if [[ $node_version < "v20" ]]; then
    echo "❌ Node.js 20+ required. Current version: $node_version"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build project
echo "Building project..."
npm run build

# Make binary executable
chmod +x bin/run

# Check if Ollama is available
echo "Checking for Ollama..."
if command -v ollama &> /dev/null; then
    echo "✓ Ollama found"
    
    # Check for required models
    echo "Checking for required models..."
    if ollama list | grep -q "deepseek-coder"; then
        echo "✓ DeepSeek Coder model found"
    else
        echo "⚠ DeepSeek Coder model not found. Run: ollama pull deepseek-coder:13b-instruct"
    fi
    
    if ollama list | grep -q "llava"; then
        echo "✓ LLaVA model found"
    else
        echo "⚠ LLaVA model not found. Run: ollama pull llava:7b"
    fi
else
    echo "⚠ Ollama not found. Install from: https://ollama.com"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start Clodrep Local CLI:"
echo "  npm run dev     # Development mode"
echo "  ./bin/run       # Production mode"
echo ""
echo "To start with MCP bridge:"
echo "  ./bin/run --bridge --port 3000"
echo ""
echo "For help:"
echo "  ./bin/run --help"