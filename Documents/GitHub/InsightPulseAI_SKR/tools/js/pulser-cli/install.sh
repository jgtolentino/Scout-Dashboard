#!/bin/bash
# Install script for ClodRep (Claude Local Tool Adapter)
# Version: 2.0.1

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
SHELL_CONFIG=""

# Determine shell config file
if [ -n "$BASH_VERSION" ]; then
  if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
  elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
  fi
elif [ -n "$ZSH_VERSION" ]; then
  SHELL_CONFIG="$HOME/.zshrc"
else
  # Try to detect based on files
  if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
  elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
  elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
  fi
fi

# Display banner
echo -e "\033[1;36m"
echo "  ___ _         _ ___            "
echo " / __| |___  __| | _ \\___ _ __   "
echo "| (__| / _ \\/ _\` |   / -_) '_ \\ "
echo " \\___|_\\___/\\__,_|_|_\\___| .__/"
echo "                          |_|     "
echo -e "\033[0m"
echo "Claude Local Tool Adapter v2.0.1 Installer"
echo "=========================================="

# Install dependencies
install_dependencies() {
  echo "Installing Python dependencies..."
  pip install -r "$SCRIPT_DIR/requirements.txt"
  echo "✅ Dependencies installed"
}

# Setup environment
setup_environment() {
  echo "Setting up environment..."
  
  # Create directories
  mkdir -p "$SCRIPT_DIR/tools/pulser_tools"
  
  # Make scripts executable
  chmod +x "$SCRIPT_DIR/clodrep.sh"
  chmod +x "$SCRIPT_DIR/task_executor.sh"
  chmod +x "$SCRIPT_DIR/pulser_git_proxy.sh"
  
  # Initialize with clodrep
  "$SCRIPT_DIR/clodrep.sh" init
  
  echo "✅ Environment setup complete"
}

# Configure shell
configure_shell() {
  echo "Configuring shell integration..."
  
  # Create aliases file
  "$SCRIPT_DIR/clodrep.sh" mount-local-tools
  
  if [ -n "$SHELL_CONFIG" ]; then
    # Check if already configured
    if grep -q "source \"$SCRIPT_DIR/.clodrep_aliases\"" "$SHELL_CONFIG"; then
      echo "✅ Shell already configured in $SHELL_CONFIG"
    else
      # Add to shell config
      echo "" >> "$SHELL_CONFIG"
      echo "# ClodRep - Claude Local Tool Adapter" >> "$SHELL_CONFIG"
      echo "source \"$SCRIPT_DIR/.clodrep_aliases\"" >> "$SHELL_CONFIG"
      echo "✅ Added configuration to $SHELL_CONFIG"
    fi
  else
    echo "⚠️ Could not determine shell config file."
    echo "Please add the following line to your shell configuration file:"
    echo "source \"$SCRIPT_DIR/.clodrep_aliases\""
  fi
}

# Display completion message
display_completion() {
  echo ""
  echo -e "\033[1;32mInstallation complete!\033[0m"
  echo ""
  echo "To start using ClodRep, you can either:"
  echo "1. Restart your terminal"
  echo "2. Run: source \"$SCRIPT_DIR/.clodrep_aliases\""
  echo ""
  echo "Then use commands like:"
  echo "  :claude run \"create a hello world program\""
  echo "  :dash render \"data.csv\""
  echo ""
  echo "See usage_examples.md for more examples."
  echo ""
}

# Main installation sequence
main() {
  install_dependencies
  setup_environment
  configure_shell
  display_completion
}

main "$@"