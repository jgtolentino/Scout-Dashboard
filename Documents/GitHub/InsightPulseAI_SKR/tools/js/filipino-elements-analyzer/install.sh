#!/bin/bash
# Installation script for Filipino Elements Analyzer

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Filipino Elements Analyzer - Installation"
echo "========================================"
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    echo "Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Make scripts executable
echo "Making scripts executable..."
chmod +x analyze_filipino_elements.js
chmod +x pulser_integration.js

# Create symlink in user's bin directory if it exists and is in PATH
LOCAL_BIN="$HOME/.local/bin"
if [[ ":$PATH:" == *":$LOCAL_BIN:"* ]]; then
    if [ ! -d "$LOCAL_BIN" ]; then
        echo "Creating $LOCAL_BIN directory..."
        mkdir -p "$LOCAL_BIN"
    fi
    
    echo "Creating symlink in $LOCAL_BIN..."
    ln -sf "$SCRIPT_DIR/analyze_filipino_elements.js" "$LOCAL_BIN/analyze-filipino-elements"
    echo "You can now run the tool using 'analyze-filipino-elements' command."
else
    echo "Note: $LOCAL_BIN is not in your PATH. No symlink created."
fi

# Run Pulser integration
echo
echo "Setting up Pulser CLI integration..."
node pulser_integration.js

echo
echo "Installation complete!"
echo
echo "Usage:"
echo "  cd $SCRIPT_DIR"
echo "  ./analyze_filipino_elements.js [command]"
echo
echo "Or use the symlink if available:"
echo "  analyze-filipino-elements [command]"
echo
echo "Or use the Pulser integration:"
echo "  :analyze-filipino [command]"
echo "  pulser filipino_elements [command]"
echo
echo "Available commands:"
echo "  analyze              - Run basic analysis"
echo "  visualize            - Generate visualizations"
echo "  usage                - Show element usage"
echo "  correlations         - Show correlations with metrics"
echo "  top-campaigns        - Show top campaigns"
echo "  chart-usage          - Generate usage chart"
echo "  chart-correlation    - Generate correlation heatmap"
echo "  chart-distribution   - Generate distribution chart"
echo
echo "For more information, see README.md"