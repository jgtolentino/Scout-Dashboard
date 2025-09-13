#!/bin/bash
# Scheduled export script for running as a cron job
# Usage: ./scheduled_export.sh [environment]

# Exit on errors
set -e

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default to production environment
ENVIRONMENT=${1:-production}
ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    echo "Run setup_env_variables.sh first to create it"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Change to project directory
cd "$PROJECT_ROOT"

# Log file for export
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/metrics_export_${TIMESTAMP}.log"

# Make sure logs directory exists
mkdir -p logs

# Start log entry
echo "=== Static Metrics Export Started at $(date) ===" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"

# Run the export script
echo "Running export script..." | tee -a "$LOG_FILE"
npm run export:metrics >> "$LOG_FILE" 2>&1

# Check if export was successful
if [ $? -eq 0 ]; then
    echo "Export completed successfully at $(date)" | tee -a "$LOG_FILE"
    
    # Optional: Add Git commit and push
    if [ "$GIT_COMMIT_ENABLED" = "true" ]; then
        echo "Committing changes to Git..." | tee -a "$LOG_FILE"
        git add deploy/data/*.json
        git commit -m "chore: update static metrics data [skip ci]" >> "$LOG_FILE" 2>&1 || echo "No changes to commit" | tee -a "$LOG_FILE"
        
        if [ "$GIT_PUSH_ENABLED" = "true" ]; then
            echo "Pushing changes to remote repository..." | tee -a "$LOG_FILE"
            git push origin $(git rev-parse --abbrev-ref HEAD) >> "$LOG_FILE" 2>&1
        fi
    fi
else
    echo "Export failed with error code $?" | tee -a "$LOG_FILE"
    # Optional: Add error notification (email, Slack, etc.)
    exit 1
fi

# Finish log
echo "=== Static Metrics Export Completed at $(date) ===" >> "$LOG_FILE"

# Keep only the last 10 log files
if [ "$(ls -1 logs/metrics_export_*.log | wc -l)" -gt 10 ]; then
    echo "Cleaning up old log files..."
    ls -1t logs/metrics_export_*.log | tail -n +11 | xargs rm -f
fi

echo "Done!"