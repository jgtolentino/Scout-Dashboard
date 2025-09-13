#!/bin/bash
# basher_codexv2.sh - Provision Codex v2 sandbox

set -e

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 Codex v2 Sandbox Provisioning Script (Basher)  🚀    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
SANDBOX_NAME="codexv2_sandbox"
SANDBOX_IMAGE="ghcr.io/openai/codexv2-sandbox:latest"
CPU_CORES=8
RAM_GB=16
TTL_HOURS=4

# Function to handle errors
handle_error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

# Function to show progress
show_progress() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to show warnings
show_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Pulser is available
if ! command -v pulser &> /dev/null; then
    handle_error "Pulser CLI not found. Please install it first."
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
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
        --help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --name NAME      Sandbox name (default: $SANDBOX_NAME)"
        echo "  --image IMAGE    Sandbox image URL (default: $SANDBOX_IMAGE)"
        echo "  --cpu CORES      CPU cores (default: $CPU_CORES)"
        echo "  --ram GB         RAM in GB (default: $RAM_GB)"
        echo "  --ttl HOURS      Time-to-live in hours (default: $TTL_HOURS)"
        echo "  --help           Show this help message"
        exit 0
        ;;
        *)
        handle_error "Unknown option: $1"
        ;;
    esac
done

echo -e "${BLUE}Provisioning Codex v2 sandbox with the following configuration:${NC}"
echo "  Sandbox name: $SANDBOX_NAME"
echo "  Image: $SANDBOX_IMAGE"
echo "  CPU: $CPU_CORES cores"
echo "  RAM: ${RAM_GB}GB"
echo "  TTL: $TTL_HOURS hours"
echo ""

# Check if sandbox already exists
EXISTING_SANDBOX=$(pulser exec basher:list --filter name=$SANDBOX_NAME --format json 2>/dev/null || echo "")
if [[ ! -z "$EXISTING_SANDBOX" && "$EXISTING_SANDBOX" != "[]" ]]; then
    show_warning "Sandbox $SANDBOX_NAME already exists. Continuing will destroy and recreate it."
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted by user."
        exit 0
    fi
    
    echo "Destroying existing sandbox..."
    pulser exec basher:destroy --name $SANDBOX_NAME || handle_error "Failed to destroy existing sandbox"
    show_progress "Existing sandbox destroyed"
fi

# Pull secrets from vault
echo "Retrieving secrets from vault..."
OPENAI_API_KEY=$(pulser vault:get codex/openai_api_key 2>/dev/null) || handle_error "Failed to get OpenAI API key from vault"
GITHUB_TOKEN=$(pulser vault:get codex/github_token 2>/dev/null) || handle_error "Failed to get GitHub token from vault"
show_progress "Secrets retrieved successfully"

# Provision sandbox
echo "Provisioning Codex v2 sandbox..."
SANDBOX_URI=$(pulser exec basher:provision \
  --name $SANDBOX_NAME \
  --image $SANDBOX_IMAGE \
  --cpu $CPU_CORES \
  --ram "${RAM_GB}Gi" \
  --ttl "${TTL_HOURS}h" \
  --env "OPENAI_API_KEY=$OPENAI_API_KEY" \
  --env "GITHUB_TOKEN=$GITHUB_TOKEN") || handle_error "Failed to provision sandbox"

show_progress "Sandbox provisioned successfully"

# Tag the sandbox
echo "Tagging sandbox..."
pulser exec basher:tag --name $SANDBOX_NAME --tag "prod" || handle_error "Failed to tag sandbox"
show_progress "Sandbox tagged as 'prod'"

# Create initial snapshot
echo "Creating initial snapshot..."
pulser exec basher:snapshot --name $SANDBOX_NAME --tag "initial" || handle_error "Failed to create snapshot"
show_progress "Initial snapshot created"

# Register sandbox URI in Pulser context
echo "Registering sandbox URI in Pulser configuration..."
pulser config:set codex.sandbox_uri "$SANDBOX_URI" || handle_error "Failed to set configuration"
show_progress "Sandbox URI registered in Pulser configuration"

# Check sandbox health
echo "Checking sandbox health..."
HEALTH_CHECK=$(pulser exec basher:health --name $SANDBOX_NAME --format json) || handle_error "Failed to check sandbox health"
HEALTH_STATUS=$(echo $HEALTH_CHECK | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [[ "$HEALTH_STATUS" == "healthy" ]]; then
    show_progress "Sandbox is healthy"
else
    show_warning "Sandbox health check returned status: $HEALTH_STATUS"
fi

# Save sandbox info to a file for reference
echo "Saving sandbox info..."
INFO_FILE="codexv2_sandbox_info.json"
echo $HEALTH_CHECK > $INFO_FILE
show_progress "Sandbox info saved to $INFO_FILE"

# Print summary
echo -e "${GREEN}===== Codex v2 Sandbox Provisioning Complete =====${NC}"
echo "Sandbox URI: $SANDBOX_URI"
echo "Tagged as: prod"
echo "Initial snapshot created and tagged as: initial"
echo "Time-to-live: $TTL_HOURS hours"
echo ""
echo -e "${YELLOW}To use the sandbox, run:${NC}"
echo "pulser exec codexv2:implement --repo <your-repo> --task \"Your task description\""
echo ""
echo -e "${YELLOW}To destroy the sandbox, run:${NC}"
echo "pulser exec basher:destroy --name $SANDBOX_NAME"
echo ""
echo -e "${YELLOW}To extend the TTL, run:${NC}"
echo "pulser exec basher:extend-ttl --name $SANDBOX_NAME --hours <additional-hours>"

exit 0