#!/bin/bash

# Setup script to configure all test frameworks for headless/CI mode by default

echo "🔧 Configuring test frameworks for headless/CI mode..."

# Set up environment variables
cat >> ~/.zshrc << 'EOF'

# Default to headless mode for testing
export HEADLESS=true
export CI_MODE=true
# To run tests with browser UI, use: HEADED=true npm test
EOF

# Create a global test configuration
mkdir -p ~/.config/test-defaults

cat > ~/.config/test-defaults/config.json << 'EOF'
{
  "defaultMode": "headless",
  "screenshot": {
    "enabled": true,
    "onFailure": true,
    "fullPage": true
  },
  "video": {
    "enabled": true,
    "onFailure": true
  },
  "console": {
    "captureErrors": true,
    "captureWarnings": false
  },
  "network": {
    "captureFailures": true
  },
  "artifacts": {
    "path": "./test-results",
    "keepOnSuccess": false,
    "keepOnFailure": true
  }
}
EOF

# Create helper scripts
cat > ~/bin/test-headless << 'EOF'
#!/bin/bash
# Run tests in headless mode (default)
export HEADED=false
export HEADLESS=true
npm test "$@"
EOF

cat > ~/bin/test-headed << 'EOF'
#!/bin/bash
# Run tests with browser UI
export HEADED=true
export HEADLESS=false
npm test "$@"
EOF

chmod +x ~/bin/test-headless ~/bin/test-headed

echo "✅ Test configuration complete!"
echo ""
echo "📝 Usage:"
echo "  - Tests now run in headless mode by default"
echo "  - To run with browser UI: HEADED=true npm test"
echo "  - Or use helper: test-headed"
echo "  - Screenshots and videos are captured on failure"
echo "  - Console errors are logged automatically"