#!/bin/bash
# start-cta-demo.sh
# Script to launch the CTA Demo web interface

set -e

# Change to the script directory
cd "$(dirname "$0")"

# Check for dependencies
if ! command -v npm &> /dev/null; then
  echo "Error: npm is required but not installed"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Configure environment variables
export PORT=3001
export NODE_ENV=development

# Create required directories
mkdir -p public/images
mkdir -p public/styles
mkdir -p public/scripts
mkdir -p public/components/cta-demo

# Create placeholder logo if it doesn't exist
if [ ! -f "public/images/insightpulseai-logo.png" ]; then
  echo "Creating placeholder logo..."
  # Create a simple placeholder image using base64
  echo "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" | base64 -d > public/images/insightpulseai-logo.png
fi

# Create placeholder icons if they don't exist
if [ ! -f "public/images/cta-demo-icon.svg" ]; then
  echo "Creating placeholder icons..."
  
  # Create simple placeholder SVGs
  echo '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#4a6cf7" /><text x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" fill="white">CTA Demo</text></svg>' > public/images/cta-demo-icon.svg
  echo '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#4a6cf7" /><text x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Prompt Demo</text></svg>' > public/images/prompt-demo-icon.svg
  echo '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#4a6cf7" /><text x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Agent Demo</text></svg>' > public/images/agent-demo-icon.svg
fi

# Create essential .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# InsightPulseAI Pulser 2.0 Environment Variables
PORT=3001
NODE_ENV=development
CLAUDE_PROMPT_TEST_SCRIPT=../scripts/claude_prompt_test.sh
CLAUDE_MODEL=claude-3-7-sonnet
PROMPT_LIBRARY_PATH=../SKR/prompt_library
EOF
fi

# Start the application
echo "Starting CTA Demo on http://localhost:3001/cta-demo"
npm run dev