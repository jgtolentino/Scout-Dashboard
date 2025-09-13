#!/bin/bash
# ClodRep - Claude Local Tool Adapter Activator
# Version: 2.0.1

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
LOG_FILE="$SCRIPT_DIR/claude_session.log"
CONFIG_FILE="$SCRIPT_DIR/pulser.config.yaml"

# Display banner
echo -e "\033[1;36m"
echo "  ___ _         _ ___            "
echo " / __| |___  __| | _ \\___ _ __   "
echo "| (__| / _ \\/ _\` |   / -_) '_ \\ "
echo " \\___|_\\___/\\__,_|_|_\\___| .__/"
echo "                          |_|     "
echo -e "\033[0m"
echo "Claude Local Tool Adapter v2.0.1"
echo "================================"

# Check dependencies
check_dependencies() {
  local missing=0
  
  echo "Checking dependencies..."
  
  # Check Python
  if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    missing=1
  else
    echo "✅ Python 3 found: $(python3 --version)"
  fi
  
  # Check pip modules
  if ! python3 -c "import yaml" &> /dev/null; then
    echo "❌ PyYAML not found"
    missing=1
  else
    echo "✅ PyYAML found"
  fi
  
  if ! python3 -c "import requests" &> /dev/null; then
    echo "❌ Requests not found"
    missing=1
  else
    echo "✅ Requests found"
  fi
  
  if [ $missing -eq 1 ]; then
    echo "Missing dependencies. Install with:"
    echo "pip install -r requirements.txt"
    exit 1
  fi
}

# Initialize environment
init_environment() {
  echo "Initializing environment..."
  
  # Create log file if it doesn't exist
  if [ ! -f "$LOG_FILE" ]; then
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] ClodRep initialized" > "$LOG_FILE"
    echo "✅ Created log file: $LOG_FILE"
  fi
  
  # Make scripts executable
  chmod +x "$SCRIPT_DIR/task_executor.sh"
  chmod +x "$SCRIPT_DIR/pulser_git_proxy.sh"
  
  echo "✅ Setup complete"
}

# Mount local tools
mount_local_tools() {
  echo "Mounting local tools..."
  
  # Log start of mounting
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] Mounting local tools" >> "$LOG_FILE"
  
  # Create aliases for bash integration
  echo "
# ClodRep Aliases
alias :claude='python3 $SCRIPT_DIR/mcp_bridge.py'
alias :dash='$SCRIPT_DIR/task_executor.sh dash'
alias :clodrep='$SCRIPT_DIR/clodrep.sh'
" > "$SCRIPT_DIR/.clodrep_aliases"
  
  echo "✅ Tools mounted successfully"
  echo ""
  echo "Add to your shell config:"
  echo "source \"$SCRIPT_DIR/.clodrep_aliases\""
  echo ""
}

# Display help
display_help() {
  echo "Usage: ./clodrep.sh [command]"
  echo ""
  echo "Commands:"
  echo "  mount-local-tools   Mount Claude to local tools"
  echo "  init               Initialize environment"
  echo "  help               Display this help message"
  echo ""
}

# Main function
main() {
  case "$1" in
    "mount-local-tools")
      check_dependencies
      init_environment
      mount_local_tools
      ;;
    "init")
      check_dependencies
      init_environment
      ;;
    "help"|"")
      display_help
      ;;
    *)
      echo "Unknown command: $1"
      display_help
      exit 1
      ;;
  esac
}

main "$@"