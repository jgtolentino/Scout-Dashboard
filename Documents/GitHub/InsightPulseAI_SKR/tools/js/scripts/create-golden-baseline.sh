#!/bin/bash

# Create Golden Baseline Script v2.0
# This script creates a comprehensive "golden" baseline version of the application
# that can be used for future rollbacks with built-in verification.

set -e

# Configuration (Customizable via environment variables)
GOLDEN_TAG_PREFIX=${GOLDEN_PREFIX:-"golden"}
DOCKER_REPO=${DOCKER_REPO:-"insightpulseai/scout-dashboard"}
APP_NAME=${APP_NAME:-"insight-pulse-ai"}
CREATE_SNAPSHOT=${CREATE_SNAPSHOT:-"true"}
CREATE_DOCKER=${CREATE_DOCKER:-"true"}
RUN_TESTS=${RUN_TESTS:-"true"}

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
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -p, --prefix PREFIX       Set the golden tag prefix (default: golden)"
    echo "  -d, --docker REPO         Set the Docker repository (default: insightpulseai/scout-dashboard)"
    echo "  -n, --name NAME           Set the application name (default: insight-pulse-ai)"
    echo "  -s, --no-snapshot         Skip file snapshot creation"
    echo "  -t, --no-tests            Skip running tests"
    echo "  -i, --no-docker           Skip Docker image creation"
    echo "  -m, --message \"MESSAGE\"   Custom message for the golden baseline"
    echo ""
    echo "Environment variables:"
    echo "  GOLDEN_PREFIX             Set the golden tag prefix"
    echo "  DOCKER_REPO               Set the Docker repository"
    echo "  APP_NAME                  Set the application name"
    echo "  CREATE_SNAPSHOT           Set to 'false' to skip file snapshot creation"
    echo "  CREATE_DOCKER             Set to 'false' to skip Docker image creation"
    echo "  RUN_TESTS                 Set to 'false' to skip running tests"
    echo ""
    echo "Example:"
    echo "  $0 --prefix prod-golden --message 'Release v2.3.0 golden baseline'"
}

# Parse command line arguments
CUSTOM_MESSAGE="Golden baseline created automatically"
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--prefix)
            GOLDEN_TAG_PREFIX="$2"
            shift 2
            ;;
        -d|--docker)
            DOCKER_REPO="$2"
            shift 2
            ;;
        -n|--name)
            APP_NAME="$2"
            shift 2
            ;;
        -s|--no-snapshot)
            CREATE_SNAPSHOT="false"
            shift
            ;;
        -t|--no-tests)
            RUN_TESTS="false"
            shift
            ;;
        -i|--no-docker)
            CREATE_DOCKER="false"
            shift
            ;;
        -m|--message)
            CUSTOM_MESSAGE="$2"
            shift 2
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Ensure we're in the right directory
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# Get the current timestamp for tagging
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
GOLDEN_TAG="${GOLDEN_TAG_PREFIX}-${TIMESTAMP}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log "ERROR" "Not in a git repository."
    exit 1
fi

# Ensure required tools are available
REQUIRED_TOOLS=("git" "npm" "node" "jq")
if [ "$CREATE_DOCKER" = "true" ]; then
    REQUIRED_TOOLS+=("docker")
fi

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command_exists "$tool"; then
        log "ERROR" "Required tool not found: $tool"
        exit 1
    fi
done

# Ensure we're on a clean working directory
if [ -n "$(git status --porcelain)" ]; then
    log "WARNING" "Working directory is not clean."
    log "INFO" "Current changes:"
    git status --short
    
    read -p "Would you like to commit these changes before creating the golden baseline? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_message
        git add .
        git commit -m "$commit_message"
        log "SUCCESS" "Changes committed."
    else
        read -p "Continue anyway? This may affect the integrity of your baseline. (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Aborting. Please commit or stash your changes first."
            exit 0
        fi
        log "WARNING" "Proceeding with uncommitted changes. This is not recommended."
    fi
fi

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "INFO" "Creating golden baseline from branch: ${CURRENT_BRANCH}"

# Run tests to ensure everything is working
if [ "$RUN_TESTS" = "true" ]; then
    log "INFO" "Running tests to verify codebase..."
    
    # Capture test output and results
    TEST_OUTPUT_FILE=".golden-baselines/test-output-${TIMESTAMP}.log"
    mkdir -p ".golden-baselines"
    
    if npm test > "$TEST_OUTPUT_FILE" 2>&1; then
        TEST_RESULT="PASS"
        log "SUCCESS" "All tests passed."
    else
        TEST_RESULT="FAIL"
        log "ERROR" "Tests failed. See log file: $TEST_OUTPUT_FILE"
        
        read -p "Continue despite test failure? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Aborting golden baseline creation."
            exit 1
        fi
        log "WARNING" "Proceeding despite test failures. This is not recommended."
    fi
fi

# Create a golden tag
log "INFO" "Creating golden tag: ${GOLDEN_TAG}..."
git tag -a "${GOLDEN_TAG}" -m "${CUSTOM_MESSAGE} on $(date)"

# Create a file-based snapshot if requested
SNAPSHOT_DIR=""
SNAPSHOT_FILE=""
if [ "$CREATE_SNAPSHOT" = "true" ]; then
    log "INFO" "Creating file-based snapshot..."
    
    # Create directory for snapshots
    SNAPSHOT_DIR=".golden-baselines/snapshots/${GOLDEN_TAG}"
    mkdir -p "$SNAPSHOT_DIR"
    
    # Create list of files to include in snapshot
    FILES_TO_INCLUDE=$(git ls-files)
    
    # Copy files to snapshot directory
    for file in $FILES_TO_INCLUDE; do
        if [ -f "$file" ]; then
            dir=$(dirname "$SNAPSHOT_DIR/$file")
            mkdir -p "$dir"
            cp "$file" "$SNAPSHOT_DIR/$file"
        fi
    done
    
    # Create a compressed archive of the snapshot
    SNAPSHOT_FILE=".golden-baselines/snapshots/${GOLDEN_TAG}.tar.gz"
    tar -czf "$SNAPSHOT_FILE" -C ".golden-baselines/snapshots" "${GOLDEN_TAG}"
    
    # Remove the snapshot directory to save space
    rm -rf "$SNAPSHOT_DIR"
    
    log "SUCCESS" "File snapshot created: $SNAPSHOT_FILE"
fi

# Create a Docker image of the current state if requested
DOCKER_IMAGE=""
if [ "$CREATE_DOCKER" = "true" ]; then
    log "INFO" "Building Docker image..."
    DOCKER_IMAGE="${DOCKER_REPO}:${GOLDEN_TAG}"
    
    if docker build -t "$DOCKER_IMAGE" .; then
        log "SUCCESS" "Docker image built: $DOCKER_IMAGE"
    else
        log "ERROR" "Docker image build failed."
        
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Aborting golden baseline creation."
            exit 1
        fi
        log "WARNING" "Proceeding without Docker image."
        DOCKER_IMAGE=""
    fi
fi

# Get package info and dependencies
NPM_DEPS="{}"
if [ -f "package.json" ]; then
    NPM_DEPS=$(jq -c '.dependencies + .devDependencies' package.json 2>/dev/null || echo "{}")
fi

# Check if this is a themed application and verify rollback styles
THEME_INFO="{}"
if [ -d "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes" ]; then
    log "INFO" "Detected themes directory, capturing theme information..."
    
    # List available themes
    THEMES_DIR="final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes"
    AVAILABLE_THEMES=$(find "$THEMES_DIR" -name "*.scss" -exec basename {} .scss \; | tr '\n' ',' | sed 's/,$//')
    
    # Identify primary theme (default to TBWA but check if another one is used)
    PRIMARY_THEME="tbwa"
    
    # Verify that rollback component styles are available in each theme
    log "INFO" "Checking for rollback component styles in themes..."
    ROLLBACK_ISSUE_FOUND=false
    ROLLBACK_THEMES_FIXED=()
    
    for THEME_FILE in $(find "$THEMES_DIR" -name "*.scss"); do
        THEME_NAME=$(basename "$THEME_FILE" .scss)
        
        if ! grep -q "rollback-dashboard" "$THEME_FILE"; then
            log "WARNING" "Rollback component styles missing in theme: $THEME_NAME"
            ROLLBACK_ISSUE_FOUND=true
            
            # Try to fix by copying from another theme that has the styles
            for SOURCE_THEME in $(find "$THEMES_DIR" -name "*.scss"); do
                if [ "$SOURCE_THEME" != "$THEME_FILE" ] && grep -q "rollback-dashboard" "$SOURCE_THEME"; then
                    log "INFO" "Found rollback styles in $(basename "$SOURCE_THEME"). Copying to $THEME_NAME theme..."
                    
                    # Extract rollback styles
                    ROLLBACK_STYLES=$(awk '/\/\/ Rollback Dashboard Component/,/^}$/' "$SOURCE_THEME")
                    
                    # Backup the original theme file
                    cp "$THEME_FILE" "${THEME_FILE}.bak"
                    
                    # Append the rollback styles to the theme
                    echo -e "\n$ROLLBACK_STYLES" >> "$THEME_FILE"
                    
                    log "SUCCESS" "Added rollback component styles to $THEME_NAME theme"
                    ROLLBACK_THEMES_FIXED+=("$THEME_NAME")
                    break
                fi
            done
            
            # If we couldn't find styles in any theme, create minimal styles
            if ! grep -q "rollback-dashboard" "$THEME_FILE"; then
                log "WARNING" "Could not find rollback styles in any theme. Creating minimal styles for $THEME_NAME..."
                
                # Backup the original theme file
                cp "$THEME_FILE" "${THEME_FILE}.bak"
                
                # Add minimal rollback styles
                cat >> "$THEME_FILE" << EOF

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: #ffffff;
  border: 3px solid #00C3EC;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      color: #002B80;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
  }
  
  &-content {
    margin-bottom: 16px;
    
    p {
      color: #777777;
      margin-bottom: 8px;
      font-size: 14px;
    }
  }
  
  &-actions {
    display: flex;
    gap: 16px;
    
    .btn-rollback {
      background-color: #002B80;
      color: white;
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-verify {
      background-color: #00C3EC;
      color: #002B80;
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
  }
}
EOF
                log "SUCCESS" "Created minimal rollback component styles for $THEME_NAME theme"
                ROLLBACK_THEMES_FIXED+=("$THEME_NAME")
            fi
        else
            log "SUCCESS" "Rollback component styles found in $THEME_NAME theme"
        fi
    done
    
    # If we fixed any themes, build them if possible
    if [ ${#ROLLBACK_THEMES_FIXED[@]} -gt 0 ]; then
        log "INFO" "Fixed rollback styles in themes: ${ROLLBACK_THEMES_FIXED[*]}"
        
        # Try to build the themes if webpack is available
        if [ -f "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/webpack.config.js" ]; then
            log "INFO" "Building themes using webpack..."
            
            CURRENT_DIR=$(pwd)
            cd "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard"
            
            for THEME in "${ROLLBACK_THEMES_FIXED[@]}"; do
                log "INFO" "Building $THEME theme..."
                npx webpack --config webpack.config.js --env theme=$THEME --mode production || log "WARNING" "Failed to build $THEME theme"
            done
            
            cd "$CURRENT_DIR"
            log "SUCCESS" "Theme builds completed"
        else
            log "WARNING" "No webpack config found for theme building. Manual compilation may be needed."
        fi
        
        # Commit the theme changes
        git add "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes/*.scss"
        git commit -m "Fix: Added rollback component styles to themes" || log "WARNING" "No changes to commit for themes"
    fi
    
    # Create theme info object
    THEME_INFO=$(cat <<EOF
{
  "available_themes": "${AVAILABLE_THEMES}",
  "primary_theme": "${PRIMARY_THEME}",
  "theme_directory": "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes",
  "has_theme_system": true,
  "rollback_styles_verified": true,
  "themes_fixed": [$(printf '"%s",' "${ROLLBACK_THEMES_FIXED[@]}" | sed 's/,$//')]
}
EOF
)
    log "SUCCESS" "Theme information captured and verified."
fi

# Collect environment information
NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
OS_INFO=$(uname -a)

# Generate build info if available
BUILD_INFO="{}"
if [ -f "build-info.json" ]; then
    BUILD_INFO=$(cat build-info.json)
elif [ -d "build" ] || [ -d "dist" ]; then
    log "INFO" "Collecting build information..."
    
    # Generate basic build info
    BUILD_DIR="build"
    [ ! -d "$BUILD_DIR" ] && BUILD_DIR="dist"
    
    if [ -d "$BUILD_DIR" ]; then
        BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
        BUILD_FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
        
        BUILD_INFO=$(cat <<EOF
{
  "directory": "$BUILD_DIR",
  "size": "$BUILD_SIZE",
  "file_count": $BUILD_FILE_COUNT,
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)
    fi
fi

# Collect test coverage info if available
TEST_COVERAGE="{}"
if [ -f "coverage/coverage-summary.json" ]; then
    TEST_COVERAGE=$(cat coverage/coverage-summary.json)
fi

# Store information about this golden baseline
log "INFO" "Storing golden baseline information..."
BASELINE_INFO=$(cat <<EOF
{
  "tag": "${GOLDEN_TAG}",
  "app_name": "${APP_NAME}",
  "branch": "${CURRENT_BRANCH}",
  "commit": "$(git rev-parse HEAD)",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "docker_image": "${DOCKER_IMAGE}",
  "snapshot_file": "${SNAPSHOT_FILE}",
  "created_by": "$(git config user.name) <$(git config user.email)>",
  "notes": "${CUSTOM_MESSAGE}",
  "test_result": "${TEST_RESULT:-"SKIPPED"}",
  "test_output_file": "${TEST_OUTPUT_FILE:-""}",
  "environment": {
    "node_version": "${NODE_VERSION}",
    "npm_version": "${NPM_VERSION}",
    "os_info": "${OS_INFO}"
  },
  "dependencies": ${NPM_DEPS},
  "build_info": ${BUILD_INFO},
  "test_coverage": ${TEST_COVERAGE},
  "theme_info": ${THEME_INFO}
}
EOF
)

# Save the baseline info to a file
mkdir -p .golden-baselines
BASELINE_INFO_FILE=".golden-baselines/${GOLDEN_TAG}.json"
echo "$BASELINE_INFO" > "$BASELINE_INFO_FILE"
log "SUCCESS" "Baseline information saved to $BASELINE_INFO_FILE"

# Commit the baseline info
git add ".golden-baselines/${GOLDEN_TAG}.json"
if [ -n "$TEST_OUTPUT_FILE" ]; then
    git add "$TEST_OUTPUT_FILE"
fi
git commit -m "Add golden baseline info for ${GOLDEN_TAG}"

# Push the tag and commit
log "INFO" "Pushing golden tag and baseline info..."
git push origin "${CURRENT_BRANCH}" || log "WARNING" "Could not push branch to origin."
git push origin "${GOLDEN_TAG}" || log "WARNING" "Could not push tag to origin."

# Push the Docker image if desired
if [ -n "$DOCKER_IMAGE" ]; then
    read -p "Do you want to push the Docker image to the repository? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Pushing Docker image to repository..."
        docker push "$DOCKER_IMAGE" || log "WARNING" "Failed to push Docker image."
    fi
fi

# Create verification script
log "INFO" "Creating verification script..."
VERIFY_SCRIPT=".golden-baselines/verify-${GOLDEN_TAG}.sh"
cat > "$VERIFY_SCRIPT" <<EOF
#!/bin/bash
# Auto-generated verification script for ${GOLDEN_TAG}
set -e

# Run verification against this golden baseline
./scripts/verify-against-golden.sh "${GOLDEN_TAG}" "\$@"
EOF

chmod +x "$VERIFY_SCRIPT"
log "SUCCESS" "Verification script created: $VERIFY_SCRIPT"

# Print summary
log "SUCCESS" "Golden baseline ${GOLDEN_TAG} created successfully!"
echo ""
echo "📋 Baseline Summary"
echo "==================="
echo "Tag:              ${GOLDEN_TAG}"
echo "Branch:           ${CURRENT_BRANCH}"
echo "Commit:           $(git rev-parse HEAD)"
echo "Created By:       $(git config user.name)"
echo "Test Result:      ${TEST_RESULT:-"SKIPPED"}"

if [ -n "$DOCKER_IMAGE" ]; then
    echo "Docker Image:     ${DOCKER_IMAGE}"
fi

if [ -n "$SNAPSHOT_FILE" ]; then
    echo "Snapshot:         ${SNAPSHOT_FILE}"
fi

echo ""
echo "To verify against this baseline, run: ${VERIFY_SCRIPT}"
echo "To roll back to this version, run:   ./scripts/rollback-to-golden.sh ${GOLDEN_TAG}"