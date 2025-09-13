#!/bin/bash
# Nightly baseline update script (for cron job)
# This script updates baselines automatically on a schedule

# Get current script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Log file
LOGFILE="$SCRIPT_DIR/logs/nightly_baseline_$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$(dirname "$LOGFILE")"

# Make sure to log both stdout and stderr
exec > >(tee -a "$LOGFILE") 2>&1

echo "========================================"
echo "Nightly Baseline Update - $(date)"
echo "========================================"

# Set up environment
export DASHBOARD_URL=${DASHBOARD_URL:-"http://localhost:8080"}
echo "Using dashboard URL: $DASHBOARD_URL"
echo "Working directory: $SCRIPT_DIR"

# Create a dated backup directory for git commit message
DATE_TAG=$(date +%Y%m%d)
BACKUP_DIR="baseline_backup_$DATE_TAG"
mkdir -p "$SCRIPT_DIR/backup/$BACKUP_DIR"

# Run baseline update
echo "Updating baselines..."
node utils/create_real_baselines.js

# Git operations if needed
if [ -n "$(git status --porcelain baselines)" ]; then
  echo "Changes detected in baselines. Committing..."
  
  git add baselines/
  
  git commit -m "Automatic baseline update - $DATE_TAG
  
This is an automated commit to update visual baselines.
The update was triggered by the nightly cron job.

🤖 Generated with automated QA tools" || {
    echo "Git commit failed. There may be a git hook issue."
  }
else
  echo "No changes detected in baselines. Nothing to commit."
fi

echo "Baseline update complete."
echo "Log saved to: $LOGFILE"