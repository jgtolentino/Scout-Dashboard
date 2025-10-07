#!/bin/bash
# Setup script for DeepSeek Coder with Pulser/Codex CLI
# Supports macOS and Linux

set -e

echo "🚀 DeepSeek Coder Local Setup for Pulser/Codex CLI"
echo "=================================================="

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install Ollama
install_ollama() {
    echo -e "\n${YELLOW}Step 1: Installing Ollama...${NC}"
    
    if command_exists ollama; then
        echo -e "${GREEN}✓ Ollama already installed${NC}"
        ollama --version
    else
        case "$OS" in
            Darwin)
                # macOS
                if command_exists brew; then
                    brew install ollama
                else
                    echo "Installing via official script..."
                    curl -fsSL https://ollama.ai/install.sh | sh
                fi
                ;;
            Linux)
                # Linux
                curl -fsSL https://ollama.ai/install.sh | sh
                ;;
            *)
                echo -e "${RED}Unsupported OS: $OS${NC}"
                exit 1
                ;;
        esac
    fi
}

# Step 2: Start Ollama service
start_ollama() {
    echo -e "\n${YELLOW}Step 2: Starting Ollama service...${NC}"
    
    if pgrep -x "ollama" > /dev/null; then
        echo -e "${GREEN}✓ Ollama service already running${NC}"
    else
        echo "Starting Ollama service..."
        ollama serve > /dev/null 2>&1 &
        sleep 3
        echo -e "${GREEN}✓ Ollama service started${NC}"
    fi
}

# Step 3: Pull DeepSeek models
pull_models() {
    echo -e "\n${YELLOW}Step 3: Pulling DeepSeek Coder models...${NC}"
    echo "This may take several minutes depending on your internet speed."
    
    # Check available disk space
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    echo "Available disk space: $AVAILABLE_SPACE"
    
    # Pull models
    echo -e "\n📦 Pulling DeepSeek Coder 33B (Q4 quantized - ~20GB)..."
    ollama pull deepseek-coder:33b-instruct-q4_K_M || {
        echo -e "${YELLOW}Note: 33B model requires ~20GB disk space and 32GB+ RAM${NC}"
        echo "Trying smaller model..."
    }
    
    echo -e "\n📦 Pulling DeepSeek Coder 6.7B (Q4 quantized - ~4GB)..."
    ollama pull deepseek-coder:6.7b-instruct-q4_K_M
    
    echo -e "${GREEN}✓ Models pulled successfully${NC}"
}

# Step 4: Configure Pulser CLI
configure_pulser() {
    echo -e "\n${YELLOW}Step 4: Configuring Pulser CLI...${NC}"
    
    PULSER_CONFIG="$HOME/.pulser/config.yaml"
    PULSER_DIR="$HOME/.pulser"
    
    # Create Pulser directory if it doesn't exist
    mkdir -p "$PULSER_DIR"
    
    # Backup existing config
    if [ -f "$PULSER_CONFIG" ]; then
        cp "$PULSER_CONFIG" "$PULSER_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✓ Backed up existing config"
    fi
    
    # Add DeepSeek configuration to Pulser
    cat >> "$PULSER_CONFIG" << 'EOF'

# DeepSeek Coder Local Models
models:
  deepseek-33b:
    provider: ollama
    base_url: "http://localhost:11434"
    model: "deepseek-coder:33b-instruct-q4_K_M"
    context_window: 16384
    
  deepseek-6.7b:
    provider: ollama
    base_url: "http://localhost:11434"
    model: "deepseek-coder:6.7b-instruct-q4_K_M"
    context_window: 8192

# Local model aliases
aliases:
  ds: deepseek-6.7b
  dsl: deepseek-33b
  local: deepseek-6.7b
EOF

    echo -e "${GREEN}✓ Pulser configuration updated${NC}"
}

# Step 5: Create convenience scripts
create_scripts() {
    echo -e "\n${YELLOW}Step 5: Creating convenience scripts...${NC}"
    
    # Create pulser-deepseek wrapper
    cat > "$HOME/.local/bin/pulser-deepseek" << 'EOF'
#!/bin/bash
# Wrapper for using DeepSeek with Pulser CLI

# Ensure Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama service..."
    ollama serve > /dev/null 2>&1 &
    sleep 2
fi

# Run Pulser with DeepSeek
pulser --model deepseek-6.7b "$@"
EOF

    chmod +x "$HOME/.local/bin/pulser-deepseek"
    
    # Create model switcher
    cat > "$HOME/.local/bin/pulser-model" << 'EOF'
#!/bin/bash
# Quick model switcher for Pulser

case "$1" in
    claude)
        export PULSER_MODEL="claude-3-sonnet"
        ;;
    deepseek|ds)
        export PULSER_MODEL="deepseek-6.7b"
        ;;
    deepseek-large|dsl)
        export PULSER_MODEL="deepseek-33b"
        ;;
    *)
        echo "Usage: pulser-model [claude|deepseek|deepseek-large]"
        echo "Current model: ${PULSER_MODEL:-default}"
        exit 1
        ;;
esac

echo "Switched to model: $PULSER_MODEL"
EOF

    chmod +x "$HOME/.local/bin/pulser-model"
    
    # Ensure ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
        echo "✓ Added ~/.local/bin to PATH"
    fi
    
    echo -e "${GREEN}✓ Convenience scripts created${NC}"
}

# Step 6: Test installation
test_installation() {
    echo -e "\n${YELLOW}Step 6: Testing installation...${NC}"
    
    # Test Ollama
    echo -n "Testing Ollama connection... "
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
    
    # Test model
    echo -n "Testing DeepSeek model... "
    RESPONSE=$(ollama run deepseek-coder:6.7b-instruct-q4_K_M "print('Hello World')" 2>/dev/null | head -1)
    if [[ "$RESPONSE" == *"print"* ]] || [[ "$RESPONSE" == *"Hello"* ]]; then
        echo -e "${GREEN}✓ Model responding${NC}"
    else
        echo -e "${YELLOW}⚠ Model may still be loading${NC}"
    fi
}

# Main execution
main() {
    echo "This script will:"
    echo "1. Install Ollama (if not present)"
    echo "2. Pull DeepSeek Coder models"
    echo "3. Configure Pulser CLI for local models"
    echo "4. Create convenience scripts"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    install_ollama
    start_ollama
    pull_models
    configure_pulser
    create_scripts
    test_installation
    
    echo -e "\n${GREEN}🎉 Setup complete!${NC}"
    echo -e "\nUsage examples:"
    echo "  pulser --model deepseek-6.7b 'Refactor this function'"
    echo "  pulser-deepseek 'Generate unit tests'"
    echo "  pulser-model deepseek  # Switch default model"
    echo ""
    echo "Aliases configured:"
    echo "  :ds  - DeepSeek 6.7B (fast)"
    echo "  :dsl - DeepSeek 33B (powerful)"
    echo ""
    echo -e "${YELLOW}Note: First run may be slow as models load into memory${NC}"
}

# Run main function
main