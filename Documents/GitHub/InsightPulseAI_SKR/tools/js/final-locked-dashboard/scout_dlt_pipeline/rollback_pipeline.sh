#!/bin/bash
# Rollback Script for Scout DLT Pipeline
# Created: May 19, 2025
# Purpose: Rollback the Scout DLT pipeline to a known stable state

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Scout DLT Pipeline Rollback${NC}"
echo "==============================="
echo ""

# Configuration variables
BACKUP_DIR="./backup_$(date +%Y%m%d%H%M%S)"
PIPELINE_NAME="ScoutDLT"
DATABRICKS_HOST="${DATABRICKS_HOST:-"https://adb-xxxx.azuredatabricks.net"}"
DATABRICKS_TOKEN="${DATABRICKS_TOKEN:-"dapi_xxxxx"}"

# Check if Databricks CLI is installed
if ! command -v databricks &> /dev/null; then
    echo -e "${YELLOW}Databricks CLI not found. Installing...${NC}"
    pip install databricks-cli
fi

# Confirm rollback
echo -e "${YELLOW}This script will:"
echo "1. Create backup of current configuration"
echo "2. Stop the current DLT pipeline"
echo "3. Restore the previous stable version of all Scout DLT scripts"
echo "4. Restart the DLT pipeline with rollback configuration"
echo ""
echo -e "Continue with rollback? (y/n)${NC}"
read -r confirm
if [[ "$confirm" != "y" ]]; then
    echo "Rollback cancelled."
    exit 0
fi

# Create backup directory
echo -e "${GREEN}[1/5] Creating backup directory: $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR"

# Backup current files
echo -e "${GREEN}[2/5] Backing up current pipeline files${NC}"
cp scout_bronze_dlt.py "$BACKUP_DIR/"
cp scout_silver_dlt.py "$BACKUP_DIR/"
cp scout_gold_dlt.py "$BACKUP_DIR/"
cp etl-deploy-kit.yaml "$BACKUP_DIR/"
cp -r sample_data/ "$BACKUP_DIR/"
cp -r pi_deployment_sim/ "$BACKUP_DIR/"

# Configure Databricks CLI
echo -e "${GREEN}[3/5] Configuring Databricks CLI${NC}"
echo "Using Databricks host: $DATABRICKS_HOST"
databricks configure --host "$DATABRICKS_HOST" --token "$DATABRICKS_TOKEN"

# Stop the running pipeline
echo -e "${GREEN}[4/5] Stopping the DLT pipeline: $PIPELINE_NAME${NC}"
PIPELINE_ID=$(databricks pipelines get --pipeline-name "$PIPELINE_NAME" | jq -r '.pipeline_id' 2>/dev/null || echo "")

if [ -n "$PIPELINE_ID" ]; then
    echo "Found pipeline with ID: $PIPELINE_ID"
    echo "Stopping pipeline..."
    databricks pipelines stop --pipeline-id "$PIPELINE_ID"
    echo "Pipeline stopped."
else
    echo -e "${YELLOW}Pipeline '$PIPELINE_NAME' not found or not running.${NC}"
fi

# Restore previous stable versions from git
echo -e "${GREEN}[5/5] Restoring previous stable pipeline configuration${NC}"
echo "Checking out files from stable version..."

# Get files from previous commit (before AudioURL was deprecated)
git checkout HEAD~1 -- scout_bronze_dlt.py scout_silver_dlt.py scout_gold_dlt.py etl-deploy-kit.yaml

# Restore AudioURL field in bronze_stt_raw schema (scout_bronze_dlt.py)
echo "Restoring AudioURL field in schema and code..."
sed -i '' 's/StructField("audio_duration_sec", DoubleType(), True),/StructField("audio_duration_sec", DoubleType(), True),\n    StructField("audio_url", StringType(), True),/' scout_bronze_dlt.py

# Update etl-deploy-kit.yaml to include audio backup
echo "Updating etl-deploy-kit.yaml to include audio backup..."
sed -i '' 's/# Note: No audio backup as AudioURL is deprecated/- backup_audio_files/' etl-deploy-kit.yaml
sed -i '' 's/AudioURL field is DEPRECATED and not included in the pipeline - audio files remain on devices/AudioURL field IS included for audio file reference and backup/' etl-deploy-kit.yaml

echo -e "${GREEN}Rollback complete!${NC}"
echo ""
echo "To restart the pipeline with the rolled back configuration:"
echo "1. Run: databricks pipelines start --pipeline-id $PIPELINE_ID"
echo ""
echo "To verify the rollback:"
echo "1. Check the schema in scout_bronze_dlt.py (should include AudioURL)"
echo "2. Verify etl-deploy-kit.yaml includes audio backup"
echo "3. Test with sample data containing AudioURL fields"
echo ""
echo "Your previous configuration has been backed up to: $BACKUP_DIR"
echo ""
echo "Note: You may need to update any deployed Raspberry Pi clients to send AudioURL fields again."
exit 0