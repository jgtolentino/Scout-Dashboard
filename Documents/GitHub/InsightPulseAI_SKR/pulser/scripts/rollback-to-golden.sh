#!/bin/bash

# Rollback to Golden Baseline Script v2.0
# This script provides a comprehensive system to roll back to a previously
# created "golden" baseline version with verification and multiple rollback methods

set -e

# Configuration (Customizable via environment variables)
GOLDEN_TAG_PREFIX=${GOLDEN_PREFIX:-"golden"}
DOCKER_REPO=${DOCKER_REPO:-"insightpulseai/scout-dashboard"}
APP_NAME=${APP_NAME:-"insight-pulse-ai"}
RESOURCE_GROUP=${RESOURCE_GROUP:-"InsightPulseAI-RG"}
STATIC_WEB_APP_NAME=${STATIC_WEB_APP_NAME:-"scout-dashboard"}
VERIFY_AFTER_ROLLBACK=${VERIFY_AFTER_ROLLBACK:-"true"}
ROLLBACK_METHOD=${ROLLBACK_METHOD:-"auto"}

# Color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for logging with timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $timestamp - $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $timestamp - $message" ;;
        *) echo -e "$timestamp - $message" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Function to display script help
show_help() {
    echo "Usage: $0 <golden-tag> [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -m, --method METHOD        Rollback method (git|docker|snapshot|auto)"
    echo "  -b, --branch NAME          Create rollback branch with specified name"
    echo "  -d, --deploy               Deploy after rollback"
    echo "  -n, --no-verify            Skip verification after rollback"
    echo "  -r, --resource-group NAME  Azure resource group name"
    echo "  -a, --app-name NAME        Azure static web app name"
    echo "  -f, --force                Force rollback even with uncommitted changes"
    echo ""
    echo "Environment variables:"
    echo "  GOLDEN_PREFIX              Set the golden tag prefix"
    echo "  DOCKER_REPO                Set the Docker repository"
    echo "  APP_NAME                   Set the application name"
    echo "  RESOURCE_GROUP             Set the Azure resource group"
    echo "  STATIC_WEB_APP_NAME        Set the Azure static web app name"
    echo "  VERIFY_AFTER_ROLLBACK      Set to 'false' to skip verification"
    echo "  ROLLBACK_METHOD            Set rollback method (git|docker|snapshot|auto)"
    echo ""
    echo "Available rollback methods:"
    echo "  git      - Use Git to checkout the golden baseline commit"
    echo "  docker   - Extract files from a Docker image of the golden baseline"
    echo "  snapshot - Restore from a file-based snapshot archive"
    echo "  auto     - Automatically choose the best available method (default)"
    echo ""
    echo "Example:"
    echo "  $0 golden-20250510123045 --method docker --deploy"
}

# Initialize variables
FORCE_MODE="false"
DEPLOY_AFTER_ROLLBACK="false"
CUSTOM_BRANCH_NAME=""
GOLDEN_TAG=""

# Parse command line arguments
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--method)
            ROLLBACK_METHOD="$2"
            shift 2
            ;;
        -b|--branch)
            CUSTOM_BRANCH_NAME="$2"
            shift 2
            ;;
        -d|--deploy)
            DEPLOY_AFTER_ROLLBACK="true"
            shift
            ;;
        -n|--no-verify)
            VERIFY_AFTER_ROLLBACK="false"
            shift
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -a|--app-name)
            STATIC_WEB_APP_NAME="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_MODE="true"
            shift
            ;;
        -*)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$GOLDEN_TAG" ]; then
                GOLDEN_TAG="$1"
                shift
            else
                log "ERROR" "Unknown argument: $1"
                show_help
                exit 1
            fi
            ;;
    esac
done

# Check if a golden tag was specified
if [ -z "$GOLDEN_TAG" ]; then
    log "ERROR" "No golden tag specified."
    echo "Usage: $0 <golden-tag> [options]"
    
    # List available golden tags
    echo ""
    echo "Available golden tags:"
    git tag -l "${GOLDEN_TAG_PREFIX}-*" | sort -r
    exit 1
fi

# Ensure we're in the right directory
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log "ERROR" "Not in a git repository."
    exit 1
fi

# Validate the golden tag exists
if ! git tag -l | grep -q "^${GOLDEN_TAG}$"; then
    log "ERROR" "Golden tag '${GOLDEN_TAG}' does not exist."
    echo "Available golden tags:"
    git tag -l "${GOLDEN_TAG_PREFIX}-*" | sort -r
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ] && [ "$FORCE_MODE" != "true" ]; then
    log "WARNING" "You have uncommitted changes in your working directory."
    log "INFO" "Current changes:"
    git status --short
    
    read -p "Would you like to stash these changes before rolling back? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Stashing changes..."
        git stash save "Auto-stashed before rollback to ${GOLDEN_TAG}"
        log "SUCCESS" "Changes stashed. You can restore them later with 'git stash pop'."
    else
        read -p "Continue anyway? This will discard your changes. (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Rollback cancelled."
            exit 0
        fi
        log "WARNING" "Proceeding despite uncommitted changes."
    fi
fi

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "INFO" "Current branch: ${CURRENT_BRANCH}"

# Create a new branch for the rollback
if [ -n "$CUSTOM_BRANCH_NAME" ]; then
    ROLLBACK_BRANCH="${CUSTOM_BRANCH_NAME}"
else
    ROLLBACK_BRANCH="rollback-to-${GOLDEN_TAG}"
fi

log "INFO" "Will create rollback branch: ${ROLLBACK_BRANCH}"

# Ask for confirmation
log "INFO" "You are about to roll back to golden baseline: ${GOLDEN_TAG}"
echo ""
echo "This will:"
echo "1. Create a new branch: ${ROLLBACK_BRANCH}"
echo "2. Roll back to the state captured in ${GOLDEN_TAG}"
if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ]; then
    echo "3. Deploy the rolled-back version"
fi
echo ""

read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "INFO" "Rollback cancelled."
    exit 0
fi

# Check if the golden baseline info exists
BASELINE_INFO_FILE=".golden-baselines/${GOLDEN_TAG}.json"
BASELINE_INFO_DIR=$(dirname "${BASELINE_INFO_FILE}")

# Ensure the golden-baselines directory exists
if [ ! -d "${BASELINE_INFO_DIR}" ]; then
    log "INFO" "Creating golden baselines directory: ${BASELINE_INFO_DIR}..."
    mkdir -p "${BASELINE_INFO_DIR}"
fi

if [ -f "${BASELINE_INFO_FILE}" ]; then
    log "INFO" "Loading baseline info..."
    
    # Parse the baseline info
    if command_exists jq; then
        BASELINE_INFO=$(cat "${BASELINE_INFO_FILE}")
        DOCKER_IMAGE=$(echo "${BASELINE_INFO}" | jq -r '.docker_image')
        SNAPSHOT_FILE=$(echo "${BASELINE_INFO}" | jq -r '.snapshot_file')
        BASELINE_COMMIT=$(echo "${BASELINE_INFO}" | jq -r '.commit')
        BASELINE_TIMESTAMP=$(echo "${BASELINE_INFO}" | jq -r '.timestamp')
        BASELINE_APP_NAME=$(echo "${BASELINE_INFO}" | jq -r '.app_name')
        BASELINE_THEME=$(echo "${BASELINE_INFO}" | jq -r '.theme')
        
        log "INFO" "Baseline info loaded:"
        log "INFO" "- Commit: ${BASELINE_COMMIT}"
        log "INFO" "- Timestamp: ${BASELINE_TIMESTAMP}"
        log "INFO" "- App name: ${BASELINE_APP_NAME}"
        
        if [ "$BASELINE_THEME" != "null" ] && [ -n "$BASELINE_THEME" ]; then
            log "INFO" "- Theme: ${BASELINE_THEME}"
        else
            # Default to TBWA theme if not specified
            BASELINE_THEME="tbwa"
            log "INFO" "- Theme: ${BASELINE_THEME} (default)"
        fi
        
        if [ "$DOCKER_IMAGE" != "null" ] && [ -n "$DOCKER_IMAGE" ]; then
            log "INFO" "- Docker image: ${DOCKER_IMAGE}"
        fi
        
        if [ "$SNAPSHOT_FILE" != "null" ] && [ -n "$SNAPSHOT_FILE" ]; then
            log "INFO" "- Snapshot file: ${SNAPSHOT_FILE}"
        fi
    else
        log "WARNING" "jq not installed, can't parse JSON properly."
        DOCKER_IMAGE="${DOCKER_REPO}:${GOLDEN_TAG}"
        SNAPSHOT_FILE=".golden-baselines/snapshots/${GOLDEN_TAG}.tar.gz"
        BASELINE_COMMIT=$(git rev-list -n 1 "${GOLDEN_TAG}")
        BASELINE_THEME="tbwa"
    fi
else
    log "WARNING" "No baseline info file found. Creating a new one with defaults..."
    DOCKER_IMAGE="${DOCKER_REPO}:${GOLDEN_TAG}"
    SNAPSHOT_FILE=".golden-baselines/snapshots/${GOLDEN_TAG}.tar.gz"
    BASELINE_COMMIT=$(git rev-list -n 1 "${GOLDEN_TAG}")
    BASELINE_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    BASELINE_APP_NAME="${APP_NAME}"
    BASELINE_THEME="tbwa"
    
    # Create the baseline info file
    log "INFO" "Creating baseline info file: ${BASELINE_INFO_FILE}..."
    cat > "${BASELINE_INFO_FILE}" << EOF
{
  "tag": "${GOLDEN_TAG}",
  "commit": "${BASELINE_COMMIT}",
  "timestamp": "${BASELINE_TIMESTAMP}",
  "app_name": "${BASELINE_APP_NAME}",
  "docker_image": "${DOCKER_IMAGE}",
  "snapshot_file": "${SNAPSHOT_FILE}",
  "theme": "${BASELINE_THEME}"
}
EOF
    log "SUCCESS" "Created baseline info file with default values."
fi

# Determine rollback method if set to auto
if [ "$ROLLBACK_METHOD" = "auto" ]; then
    if [ -f "${SNAPSHOT_FILE}" ]; then
        log "INFO" "Found snapshot file, will use snapshot method."
        ROLLBACK_METHOD="snapshot"
    elif command_exists docker && (docker image inspect "${DOCKER_IMAGE}" &> /dev/null || docker pull "${DOCKER_IMAGE}" &> /dev/null); then
        log "INFO" "Found Docker image, will use docker method."
        ROLLBACK_METHOD="docker"
    else
        log "INFO" "Will use git method for rollback."
        ROLLBACK_METHOD="git"
    fi
fi

# Create a new branch for the rollback
log "INFO" "Creating rollback branch: ${ROLLBACK_BRANCH}..."

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${ROLLBACK_BRANCH}"; then
    log "WARNING" "Branch ${ROLLBACK_BRANCH} already exists."
    read -p "Overwrite existing branch? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout -B "${ROLLBACK_BRANCH}"
    else
        read -p "Enter a new branch name: " new_branch
        ROLLBACK_BRANCH="${new_branch}"
        git checkout -b "${ROLLBACK_BRANCH}"
    fi
else
    git checkout -b "${ROLLBACK_BRANCH}"
fi

# Pre-rollback status
log "INFO" "Pre-rollback state captured. Ready to proceed with ${ROLLBACK_METHOD} method."

# Perform the rollback based on the selected method
BUILD_DIR=""

case "$ROLLBACK_METHOD" in
    "git")
        log "INFO" "Using git method for rollback..."
        
        # Reset the branch to the golden tag
        git reset --hard "${GOLDEN_TAG}"
        log "SUCCESS" "Reset branch to golden tag: ${GOLDEN_TAG}"
        
        # Run npm install if package.json exists
        if [ -f "package.json" ]; then
            log "INFO" "Installing dependencies..."
            npm install --no-fund --no-audit || log "WARNING" "npm install failed."
        fi
        
        # Build the application if needed
        if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ] && [ -f "package.json" ]; then
            if grep -q "\"build\"" package.json; then
                log "INFO" "Building application..."
                npm run build || log "WARNING" "Build failed."
                
                # Determine build directory
                if [ -d "build" ]; then
                    BUILD_DIR="build"
                elif [ -d "dist" ]; then
                    BUILD_DIR="dist"
                else
                    log "WARNING" "Could not determine build directory."
                fi
            fi
        fi
        ;;
        
    "docker")
        log "INFO" "Using docker method for rollback..."
        
        # Check if Docker is installed
        if ! command_exists docker; then
            log "ERROR" "Docker not found. Please install Docker or choose a different rollback method."
            exit 1
        fi
        
        # Check if Docker image exists locally
        if docker image inspect "${DOCKER_IMAGE}" &> /dev/null; then
            log "INFO" "Docker image ${DOCKER_IMAGE} found locally."
        else
            # Try to pull the image from the repository
            log "INFO" "Docker image not found locally. Trying to pull from repository..."
            if docker pull "${DOCKER_IMAGE}" &> /dev/null; then
                log "SUCCESS" "Docker image pulled from repository."
            else
                log "ERROR" "Docker image not found in repository."
                log "INFO" "Falling back to git method..."
                
                # Reset the branch to the golden tag
                git reset --hard "${GOLDEN_TAG}"
                log "SUCCESS" "Reset branch to golden tag: ${GOLDEN_TAG}"
                
                # Set method to git for proper post-processing
                ROLLBACK_METHOD="git"
            fi
        fi
        
        if [ "$ROLLBACK_METHOD" = "docker" ]; then
            # Create a temporary container
            log "INFO" "Creating temporary container from Docker image..."
            CONTAINER_ID=$(docker create "${DOCKER_IMAGE}")
            
            # Determine the app directory in the Docker image
            APP_DIR="/app"
            
            # Extract the app files
            log "INFO" "Extracting files from Docker container..."
            BUILD_DIR="docker-extract-${GOLDEN_TAG}"
            rm -rf "${BUILD_DIR}" || true
            mkdir -p "${BUILD_DIR}"
            
            # Copy files from container to local directory
            docker cp "${CONTAINER_ID}:${APP_DIR}/." "${BUILD_DIR}/"
            
            # Clean up the container
            docker rm "${CONTAINER_ID}"
            
            # Copy the files to the current directory, preserving Git folder
            log "INFO" "Copying files to current directory..."
            find . -mindepth 1 -maxdepth 1 -not -name ".git" -not -name "${BUILD_DIR}" -exec rm -rf {} \; || true
            cp -R "${BUILD_DIR}"/* .
            
            log "SUCCESS" "Files extracted from Docker image successfully."
            
            # If we're deploying, use the extracted build directory
            if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ]; then
                if [ -d "${BUILD_DIR}/build" ]; then
                    BUILD_DIR="${BUILD_DIR}/build"
                elif [ -d "${BUILD_DIR}/dist" ]; then
                    BUILD_DIR="${BUILD_DIR}/dist"
                fi
            fi
        fi
        ;;
        
    "snapshot")
        log "INFO" "Using snapshot method for rollback..."
        
        # Check if the snapshot file exists
        if [ ! -f "${SNAPSHOT_FILE}" ]; then
            log "ERROR" "Snapshot file not found: ${SNAPSHOT_FILE}"
            log "INFO" "Falling back to git method..."
            
            # Reset the branch to the golden tag
            git reset --hard "${GOLDEN_TAG}"
            log "SUCCESS" "Reset branch to golden tag: ${GOLDEN_TAG}"
            
            # Set method to git for proper post-processing
            ROLLBACK_METHOD="git"
        else
            # Create temporary directory for extraction
            EXTRACT_DIR="snapshot-extract-${GOLDEN_TAG}"
            rm -rf "${EXTRACT_DIR}" || true
            mkdir -p "${EXTRACT_DIR}"
            
            # Extract the snapshot
            log "INFO" "Extracting snapshot archive..."
            tar -xzf "${SNAPSHOT_FILE}" -C "${EXTRACT_DIR}"
            
            # Copy the files to the current directory, preserving Git folder
            log "INFO" "Copying files to current directory..."
            find . -mindepth 1 -maxdepth 1 -not -name ".git" -not -name "${EXTRACT_DIR}" -exec rm -rf {} \; || true
            cp -R "${EXTRACT_DIR}"/${GOLDEN_TAG}/* .
            
            log "SUCCESS" "Files restored from snapshot successfully."
            
            # Install dependencies if package.json exists
            if [ -f "package.json" ]; then
                log "INFO" "Installing dependencies..."
                npm install --no-fund --no-audit || log "WARNING" "npm install failed."
            fi
            
            # Build the application if needed
            if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ] && [ -f "package.json" ]; then
                if grep -q "\"build\"" package.json; then
                    log "INFO" "Building application..."
                    npm run build || log "WARNING" "Build failed."
                    
                    # Determine build directory
                    if [ -d "build" ]; then
                        BUILD_DIR="build"
                    elif [ -d "dist" ]; then
                        BUILD_DIR="dist"
                    else
                        log "WARNING" "Could not determine build directory."
                    fi
                fi
            fi
            
            # Clean up extraction directory
            rm -rf "${EXTRACT_DIR}"
        fi
        ;;
        
    *)
        log "ERROR" "Unknown rollback method: ${ROLLBACK_METHOD}"
        log "INFO" "Available methods: git, docker, snapshot, auto"
        exit 1
        ;;
esac

# Create a rollback commit to record the state
log "INFO" "Creating rollback commit..."

# Add all files
git add -A

# Create the commit
ROLLBACK_MESSAGE="Rollback to golden baseline ${GOLDEN_TAG}"
git commit -m "${ROLLBACK_MESSAGE}" || log "WARNING" "Nothing to commit. Working tree may already match the golden baseline."

# Create a rollback tag
ROLLBACK_TAG="rollback-${GOLDEN_TAG}-$(date +"%Y%m%d%H%M%S")"
git tag -a "${ROLLBACK_TAG}" -m "Rollback to golden baseline ${GOLDEN_TAG} on $(date)"
log "SUCCESS" "Created rollback tag: ${ROLLBACK_TAG}"

# Verify the rollback if requested
if [ "$VERIFY_AFTER_ROLLBACK" = "true" ]; then
    log "INFO" "Verifying rollback..."
    
    # Create verification report
    VERIFICATION_REPORT=".golden-baselines/verification-${ROLLBACK_TAG}.md"
    
    if [ -x "./scripts/verify-against-golden.sh" ]; then
        ./scripts/verify-against-golden.sh "${GOLDEN_TAG}" --output "${VERIFICATION_REPORT}" || log "WARNING" "Verification produced warnings or errors."
        log "INFO" "Verification report saved to: ${VERIFICATION_REPORT}"
    else
        log "WARNING" "Verification script not executable or not found."
    fi
fi

# Deploy to Azure if requested
if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ]; then
    log "INFO" "Deploying to Azure Static Web Apps..."
    
    # Check if Azure CLI is installed
    if ! command_exists az; then
        log "ERROR" "Azure CLI not found. Please install Azure CLI to deploy."
        log "INFO" "You can deploy manually later."
    else
        # Check if az is logged in
        if ! az account show &>/dev/null; then
            log "WARNING" "Not logged in to Azure CLI. Please log in first."
            read -p "Login to Azure CLI now? (y/n) " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                az login || {
                    log "ERROR" "Azure login failed."
                    log "INFO" "You can deploy manually later."
                    DEPLOY_AFTER_ROLLBACK="false"
                }
            else
                log "INFO" "Skipping deployment to Azure."
                DEPLOY_AFTER_ROLLBACK="false"
            fi
        fi
        
        # Deploy if still set to true
        if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ]; then
            if [ -n "$BUILD_DIR" ] && [ -d "$BUILD_DIR" ]; then
                log "INFO" "Deploying from build directory: ${BUILD_DIR}"
                
                az staticwebapp deploy \
                    --name "$STATIC_WEB_APP_NAME" \
                    --resource-group "$RESOURCE_GROUP" \
                    --source "${BUILD_DIR}" || log "ERROR" "Deployment failed."
            else
                log "WARNING" "Build directory not found. Cannot deploy."
                log "INFO" "You can build and deploy manually later."
            fi
        fi
    fi
fi

# Print summary
log "SUCCESS" "Rollback to ${GOLDEN_TAG} completed!"
echo ""
echo "📋 Rollback Summary"
echo "==================="
echo "Original golden tag:  ${GOLDEN_TAG}"
echo "Rollback branch:      ${ROLLBACK_BRANCH}"
echo "Rollback tag:         ${ROLLBACK_TAG}"
echo "Rollback method:      ${ROLLBACK_METHOD}"
echo "Build directory:      ${BUILD_DIR:-"Not built"}"

if [ "$VERIFY_AFTER_ROLLBACK" = "true" ] && [ -f "${VERIFICATION_REPORT}" ]; then
    echo "Verification report: ${VERIFICATION_REPORT}"
fi

if [ "$DEPLOY_AFTER_ROLLBACK" = "true" ]; then
    echo "Deployed to:         ${STATIC_WEB_APP_NAME}"
fi

echo ""
echo "Next steps:"
echo "1. Verify the application works as expected"
echo "2. To continue development from this point, work on this branch"
echo "3. To switch back to your previous branch, use: git checkout ${CURRENT_BRANCH}"
echo ""

# EOF