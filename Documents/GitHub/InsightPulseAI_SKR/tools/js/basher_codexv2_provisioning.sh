#!/bin/bash
# basher_codexv2_provisioning.sh - Comprehensive provisioning for Codex v2 sandbox
# 
# This script handles creating, configuring, and managing Codex v2 sandboxes
# including provisioning, tagging, snapshot management, and cleanup.
#
# Author: Basher Team
# Version: 1.0.1
# Last Updated: 2025-05-17

set -e

# ANSI color codes for prettier output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner function
print_banner() {
  echo -e "${BLUE}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║                                                           ║"
  echo "║   🚀 Codex v2 Sandbox Provisioner (Basher) v1.0.1    🚀   ║"
  echo "║                                                           ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Default configuration
SANDBOX_NAME="codexv2_sandbox"
SANDBOX_IMAGE="ghcr.io/openai/codexv2-sandbox:latest"
CPU_CORES=8
RAM_GB=16
TTL_HOURS=4
SNAPSHOT_TAG="initial"
AUTO_CLEANUP=true
VERBOSE=false
DRY_RUN=false

# Function to display help
show_help() {
  echo -e "${CYAN}USAGE:${NC}"
  echo "  $0 [command] [options]"
  echo ""
  echo -e "${CYAN}COMMANDS:${NC}"
  echo "  provision   Create and configure a new sandbox (default)"
  echo "  snapshot    Create a snapshot of an existing sandbox"
  echo "  extend      Extend the TTL of an existing sandbox"
  echo "  destroy     Destroy an existing sandbox"
  echo "  list        List all sandboxes and their status"
  echo "  restore     Restore a sandbox from a snapshot"
  echo ""
  echo -e "${CYAN}OPTIONS:${NC}"
  echo "  --name NAME        Sandbox name (default: $SANDBOX_NAME)"
  echo "  --image IMAGE      Sandbox image (default: $SANDBOX_IMAGE)"
  echo "  --cpu CORES        CPU cores (default: $CPU_CORES)"
  echo "  --ram GB           RAM in GB (default: $RAM_GB)"
  echo "  --ttl HOURS        Time-to-live in hours (default: $TTL_HOURS)"
  echo "  --snapshot TAG     Snapshot tag (default: $SNAPSHOT_TAG)"
  echo "  --no-cleanup       Disable auto-cleanup on exit (default: cleanup enabled)"
  echo "  --verbose          Enable verbose output"
  echo "  --dry-run          Show commands without executing them"
  echo "  --help             Show this help message"
  echo ""
  echo -e "${CYAN}EXAMPLES:${NC}"
  echo "  $0 provision --name my-sandbox --cpu 16 --ram 32"
  echo "  $0 snapshot --name my-sandbox --snapshot prod-ready"
  echo "  $0 destroy --name my-sandbox"
  echo ""
}

# Function to log messages
log() {
  local level=$1
  local message=$2
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  case $level in
    info)
      echo -e "${GREEN}[INFO]${NC} $timestamp - $message"
      ;;
    warn)
      echo -e "${YELLOW}[WARN]${NC} $timestamp - $message"
      ;;
    error)
      echo -e "${RED}[ERROR]${NC} $timestamp - $message"
      ;;
    debug)
      if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[DEBUG]${NC} $timestamp - $message"
      fi
      ;;
    *)
      echo -e "$timestamp - $message"
      ;;
  esac
}

# Function to execute commands (or just print them in dry-run mode)
execute() {
  if [ "$VERBOSE" = true ]; then
    log debug "Executing: $*"
  fi
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY-RUN]${NC} Would execute: $*"
    return 0
  else
    "$@"
    return $?
  fi
}

# Function to check if pulser CLI is available
check_pulser_cli() {
  if ! command -v pulser &> /dev/null; then
    log error "Pulser CLI not found. Please install it first."
    exit 1
  fi
  log debug "Pulser CLI found: $(which pulser)"
}

# Function to retrieve secrets from vault
get_secret() {
  local secret_path=$1
  local secret_value
  
  log debug "Retrieving secret from $secret_path"
  secret_value=$(execute pulser vault:get "$secret_path" 2>/dev/null)
  
  if [ -z "$secret_value" ]; then
    log error "Failed to retrieve secret from $secret_path"
    exit 1
  fi
  
  echo "$secret_value"
}

# Function to check if sandbox exists
check_sandbox_exists() {
  local sandbox_name=$1
  local exists
  
  log debug "Checking if sandbox $sandbox_name exists"
  exists=$(execute pulser exec basher:list --filter "name=$sandbox_name" --format json | grep -c "$sandbox_name" || echo "0")
  
  if [ "$exists" -gt "0" ]; then
    log debug "Sandbox $sandbox_name exists"
    return 0
  else
    log debug "Sandbox $sandbox_name does not exist"
    return 1
  fi
}

# Function to provision a new sandbox
provision_sandbox() {
  log info "Provisioning Codex v2 sandbox: $SANDBOX_NAME"
  
  # Check if sandbox already exists
  if check_sandbox_exists "$SANDBOX_NAME"; then
    log warn "Sandbox $SANDBOX_NAME already exists."
    read -p "Do you want to destroy and recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log info "Destroying existing sandbox $SANDBOX_NAME"
      execute pulser exec basher:destroy --name "$SANDBOX_NAME"
    else
      log error "Sandbox creation aborted by user"
      exit 1
    fi
  fi
  
  # Retrieve secrets
  log info "Retrieving secrets from vault"
  OPENAI_API_KEY=$(get_secret "codex/openai_api_key")
  GITHUB_TOKEN=$(get_secret "codex/github_token")
  
  # Provision the sandbox
  log info "Creating sandbox with image $SANDBOX_IMAGE"
  SANDBOX_URI=$(execute pulser exec basher:provision \
    --name "$SANDBOX_NAME" \
    --image "$SANDBOX_IMAGE" \
    --cpu "$CPU_CORES" \
    --ram "${RAM_GB}Gi" \
    --ttl "${TTL_HOURS}h" \
    --env "OPENAI_API_KEY=$OPENAI_API_KEY" \
    --env "GITHUB_TOKEN=$GITHUB_TOKEN")
  
  if [ -z "$SANDBOX_URI" ]; then
    log error "Failed to provision sandbox"
    exit 1
  fi
  
  log info "Sandbox provisioned at: $SANDBOX_URI"
  
  # Tag the sandbox
  log info "Tagging sandbox as 'prod'"
  execute pulser exec basher:tag --name "$SANDBOX_NAME" --tag "prod"
  
  # Create initial snapshot
  log info "Creating initial snapshot tagged as '$SNAPSHOT_TAG'"
  execute pulser exec basher:snapshot --name "$SANDBOX_NAME" --tag "$SNAPSHOT_TAG"
  
  # Register sandbox URI in Pulser configuration
  log info "Registering sandbox URI in Pulser configuration"
  execute pulser config:set codex.sandbox_uri "$SANDBOX_URI"
  
  # Check sandbox health
  log info "Checking sandbox health"
  HEALTH_STATUS=$(execute pulser exec basher:health --name "$SANDBOX_NAME" --format json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  if [ "$HEALTH_STATUS" = "healthy" ]; then
    log info "Sandbox is healthy"
  else
    log warn "Sandbox health check returned status: $HEALTH_STATUS"
  fi
  
  # Setup network egress rules
  log info "Setting up network egress rules"
  execute pulser exec basher:network --name "$SANDBOX_NAME" --allow "port:443" --deny "*.githubusercontent.com" --allow "api.github.com"
  
  # Configure resource limits
  log info "Configuring resource limits"
  execute pulser exec basher:limits --name "$SANDBOX_NAME" --memory-limit "${RAM_GB}Gi" --cpu-limit "$CPU_CORES"
  
  # Start the sandbox monitoring daemon
  log info "Starting sandbox monitoring daemon"
  execute pulser exec basher:monitor --name "$SANDBOX_NAME" --interval 5m --alert-on "memory>90%,cpu>80%"
  
  log info "Sandbox provisioning completed successfully"
  echo "Sandbox URI: $SANDBOX_URI"
  echo "Tagged as: prod"
  echo "Initial snapshot: $SNAPSHOT_TAG"
  echo "Time-to-live: $TTL_HOURS hours"
}

# Function to create a snapshot
create_snapshot() {
  log info "Creating snapshot of sandbox $SANDBOX_NAME with tag $SNAPSHOT_TAG"
  
  # Check if sandbox exists
  if ! check_sandbox_exists "$SANDBOX_NAME"; then
    log error "Sandbox $SANDBOX_NAME does not exist"
    exit 1
  fi
  
  # Create snapshot
  execute pulser exec basher:snapshot --name "$SANDBOX_NAME" --tag "$SNAPSHOT_TAG"
  
  log info "Snapshot created with tag: $SNAPSHOT_TAG"
}

# Function to extend TTL
extend_ttl() {
  log info "Extending TTL of sandbox $SANDBOX_NAME by $TTL_HOURS hours"
  
  # Check if sandbox exists
  if ! check_sandbox_exists "$SANDBOX_NAME"; then
    log error "Sandbox $SANDBOX_NAME does not exist"
    exit 1
  fi
  
  # Extend TTL
  execute pulser exec basher:extend-ttl --name "$SANDBOX_NAME" --hours "$TTL_HOURS"
  
  log info "TTL extended by $TTL_HOURS hours"
}

# Function to destroy sandbox
destroy_sandbox() {
  log info "Destroying sandbox $SANDBOX_NAME"
  
  # Check if sandbox exists
  if ! check_sandbox_exists "$SANDBOX_NAME"; then
    log error "Sandbox $SANDBOX_NAME does not exist"
    exit 1
  fi
  
  # Create final snapshot before destruction
  log info "Creating final snapshot before destruction"
  execute pulser exec basher:snapshot --name "$SANDBOX_NAME" --tag "pre-destroy"
  
  # Destroy sandbox
  execute pulser exec basher:destroy --name "$SANDBOX_NAME"
  
  # Remove from configuration
  execute pulser config:unset codex.sandbox_uri
  
  log info "Sandbox $SANDBOX_NAME destroyed successfully"
}

# Function to list sandboxes
list_sandboxes() {
  log info "Listing all Codex v2 sandboxes"
  
  execute pulser exec basher:list --filter "name~codexv2" --format table
}

# Function to restore from snapshot
restore_snapshot() {
  log info "Restoring sandbox $SANDBOX_NAME from snapshot $SNAPSHOT_TAG"
  
  # Check if sandbox exists
  if ! check_sandbox_exists "$SANDBOX_NAME"; then
    log error "Sandbox $SANDBOX_NAME does not exist"
    exit 1
  fi
  
  # Restore from snapshot
  execute pulser exec basher:restore --name "$SANDBOX_NAME" --snapshot "$SNAPSHOT_TAG"
  
  log info "Sandbox restored from snapshot: $SNAPSHOT_TAG"
}

# Parse command line arguments
COMMAND="provision"
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    provision|snapshot|extend|destroy|list|restore)
      COMMAND="$1"
      shift
      ;;
    --name)
      SANDBOX_NAME="$2"
      shift 2
      ;;
    --image)
      SANDBOX_IMAGE="$2"
      shift 2
      ;;
    --cpu)
      CPU_CORES="$2"
      shift 2
      ;;
    --ram)
      RAM_GB="$2"
      shift 2
      ;;
    --ttl)
      TTL_HOURS="$2"
      shift 2
      ;;
    --snapshot)
      SNAPSHOT_TAG="$2"
      shift 2
      ;;
    --no-cleanup)
      AUTO_CLEANUP=false
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      log error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Print banner
print_banner

# Check for pulser CLI
check_pulser_cli

# Execute the requested command
case $COMMAND in
  provision)
    provision_sandbox
    ;;
  snapshot)
    create_snapshot
    ;;
  extend)
    extend_ttl
    ;;
  destroy)
    destroy_sandbox
    ;;
  list)
    list_sandboxes
    ;;
  restore)
    restore_snapshot
    ;;
  *)
    log error "Unknown command: $COMMAND"
    show_help
    exit 1
    ;;
esac

# Auto-cleanup if enabled
cleanup() {
  if [ "$AUTO_CLEANUP" = true ] && [ "$COMMAND" = "provision" ]; then
    log info "Auto-cleanup enabled - registering cleanup handlers"
    # Register a trap for SIGINT and SIGTERM
    trap "log info 'Received termination signal, cleaning up...'; destroy_sandbox" SIGINT SIGTERM
  fi
}

# Register cleanup handler
cleanup

exit 0