#!/bin/bash
# 6_deploy_medallion_enhancements.sh - Master script to deploy all medallion architecture enhancements

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Medallion Architecture Enhancement Deployment             ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Verify all scripts exist
SCRIPTS=(
  "1_compute_isolation.sh"
  "2_data_quality_framework.py"
  "3_monitoring_alerting.sh"
  "4_storage_lifecycle_management.sh"
  "5_security_enhancements.sh"
)

SCRIPTS_MISSING=0
for script in "${SCRIPTS[@]}"; do
  if [ ! -f "$script" ]; then
    echo -e "${RED}Error: Script $script not found${RESET}"
    SCRIPTS_MISSING=1
  fi
done

if [ $SCRIPTS_MISSING -eq 1 ]; then
  echo -e "${RED}One or more scripts are missing. Please make sure all enhancement scripts are in the current directory.${RESET}"
  exit 1
fi

# Make all scripts executable
echo -e "${BLUE}Making all scripts executable...${RESET}"
chmod +x 1_compute_isolation.sh
chmod +x 2_data_quality_framework.py
chmod +x 3_monitoring_alerting.sh
chmod +x 4_storage_lifecycle_management.sh
chmod +x 5_security_enhancements.sh

echo -e "${GREEN}All scripts are now executable${RESET}"

# Display deployment plan
echo -e "\n${BLUE}${BOLD}Medallion Architecture Enhancement Deployment Plan${RESET}"
echo -e "-----------------------------------"
echo -e "1. ${YELLOW}Compute Isolation${RESET}: Create dedicated compute clusters for each medallion layer"
echo -e "2. ${YELLOW}Data Quality Framework${RESET}: Implement data quality checks between medallion layers"
echo -e "3. ${YELLOW}Monitoring & Alerting${RESET}: Set up comprehensive monitoring and alerting"
echo -e "4. ${YELLOW}Storage Lifecycle Management${RESET}: Configure tiered storage and lifecycle policies"
echo -e "5. ${YELLOW}Security Enhancements${RESET}: Implement private endpoints, VNET integration, and key rotation"
echo -e ""

# Confirm deployment
echo -e "${YELLOW}Do you want to proceed with the deployment? (y/n)${RESET}"
read -p "" confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
  echo -e "${RED}Deployment cancelled by user${RESET}"
  exit 0
fi

# Get Azure resource information for scripts
echo -e "\n${BLUE}Getting Azure resource information...${RESET}"

# Get Databricks workspace URL
echo -e "${BLUE}Getting Databricks workspace URL...${RESET}"
WORKSPACE_URL=$(az databricks workspace show \
  --name "tbwa-juicer-databricks" \
  --resource-group "RG-TBWA-ProjectScout-Juicer" \
  --query "properties.workspaceUrl" -o tsv 2>/dev/null)

if [ -z "$WORKSPACE_URL" ]; then
  echo -e "${YELLOW}Could not automatically get Databricks workspace URL${RESET}"
  echo -e "${YELLOW}Please enter the Databricks workspace URL (e.g., adb-1234567890123456.16.azuredatabricks.net):${RESET}"
  read -p "" WORKSPACE_URL
fi

# Get job IDs
echo -e "${BLUE}Getting job IDs...${RESET}"
BRONZE_JOB_ID=""
SILVER_JOB_ID=""
GOLD_JOB_ID=""
PLATINUM_JOB_ID=""

echo -e "${YELLOW}Please enter the Bronze layer job ID (leave blank if not available):${RESET}"
read -p "" BRONZE_JOB_ID

echo -e "${YELLOW}Please enter the Silver layer job ID (leave blank if not available):${RESET}"
read -p "" SILVER_JOB_ID

echo -e "${YELLOW}Please enter the Gold layer job ID (leave blank if not available):${RESET}"
read -p "" GOLD_JOB_ID

echo -e "${YELLOW}Please enter the Platinum layer job ID (leave blank if not available):${RESET}"
read -p "" PLATINUM_JOB_ID

# Create deployment log file
LOG_FILE="medallion_deployment_$(date +%Y%m%d_%H%M%S).log"
echo "Medallion Architecture Enhancement Deployment Log" > "${LOG_FILE}"
echo "Date: $(date)" >> "${LOG_FILE}"
echo "-----------------------------------" >> "${LOG_FILE}"

# 1. Deploy Compute Isolation
echo -e "\n${BLUE}${BOLD}Step 1/5: Deploying Compute Isolation...${RESET}"
./1_compute_isolation.sh | tee -a "${LOG_FILE}"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}Compute Isolation deployment failed${RESET}"
  echo -e "${YELLOW}Check the log file for details: ${LOG_FILE}${RESET}"
  echo -e "${YELLOW}Do you want to continue with the next step? (y/n)${RESET}"
  read -p "" continue_deploy
  if [[ $continue_deploy != [yY] && $continue_deploy != [yY][eE][sS] ]]; then
    echo -e "${RED}Deployment stopped by user${RESET}"
    exit 1
  fi
else
  echo -e "${GREEN}Compute Isolation deployed successfully${RESET}"
fi

# 2. Deploy Data Quality Framework
echo -e "\n${BLUE}${BOLD}Step 2/5: Deploying Data Quality Framework...${RESET}"
python3 2_data_quality_framework.py \
  --workspace-url "${WORKSPACE_URL}" \
  --bronze-job-id "${BRONZE_JOB_ID}" \
  --silver-job-id "${SILVER_JOB_ID}" \
  --gold-job-id "${GOLD_JOB_ID}" \
  --platinum-job-id "${PLATINUM_JOB_ID}" | tee -a "${LOG_FILE}"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}Data Quality Framework deployment failed${RESET}"
  echo -e "${YELLOW}Check the log file for details: ${LOG_FILE}${RESET}"
  echo -e "${YELLOW}Do you want to continue with the next step? (y/n)${RESET}"
  read -p "" continue_deploy
  if [[ $continue_deploy != [yY] && $continue_deploy != [yY][eE][sS] ]]; then
    echo -e "${RED}Deployment stopped by user${RESET}"
    exit 1
  fi
else
  echo -e "${GREEN}Data Quality Framework deployed successfully${RESET}"
fi

# 3. Deploy Monitoring & Alerting
echo -e "\n${BLUE}${BOLD}Step 3/5: Deploying Monitoring & Alerting...${RESET}"
./3_monitoring_alerting.sh | tee -a "${LOG_FILE}"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}Monitoring & Alerting deployment failed${RESET}"
  echo -e "${YELLOW}Check the log file for details: ${LOG_FILE}${RESET}"
  echo -e "${YELLOW}Do you want to continue with the next step? (y/n)${RESET}"
  read -p "" continue_deploy
  if [[ $continue_deploy != [yY] && $continue_deploy != [yY][eE][sS] ]]; then
    echo -e "${RED}Deployment stopped by user${RESET}"
    exit 1
  fi
else
  echo -e "${GREEN}Monitoring & Alerting deployed successfully${RESET}"
fi

# 4. Deploy Storage Lifecycle Management
echo -e "\n${BLUE}${BOLD}Step 4/5: Deploying Storage Lifecycle Management...${RESET}"
./4_storage_lifecycle_management.sh | tee -a "${LOG_FILE}"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}Storage Lifecycle Management deployment failed${RESET}"
  echo -e "${YELLOW}Check the log file for details: ${LOG_FILE}${RESET}"
  echo -e "${YELLOW}Do you want to continue with the next step? (y/n)${RESET}"
  read -p "" continue_deploy
  if [[ $continue_deploy != [yY] && $continue_deploy != [yY][eE][sS] ]]; then
    echo -e "${RED}Deployment stopped by user${RESET}"
    exit 1
  fi
else
  echo -e "${GREEN}Storage Lifecycle Management deployed successfully${RESET}"
fi

# 5. Deploy Security Enhancements
echo -e "\n${BLUE}${BOLD}Step 5/5: Deploying Security Enhancements...${RESET}"
echo -e "${YELLOW}IMPORTANT: Security enhancements include network changes that may temporarily disrupt service connectivity.${RESET}"
echo -e "${YELLOW}Do you want to proceed with security enhancements? (y/n)${RESET}"
read -p "" security_confirm

if [[ $security_confirm == [yY] || $security_confirm == [yY][eE][sS] ]]; then
  ./5_security_enhancements.sh | tee -a "${LOG_FILE}"
  if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "${RED}Security Enhancements deployment failed${RESET}"
    echo -e "${YELLOW}Check the log file for details: ${LOG_FILE}${RESET}"
  else
    echo -e "${GREEN}Security Enhancements deployed successfully${RESET}"
  fi
else
  echo -e "${YELLOW}Security Enhancements deployment skipped by user${RESET}"
  echo "Security Enhancements deployment skipped by user" >> "${LOG_FILE}"
fi

# Generate enhancement documentation
echo -e "\n${BLUE}${BOLD}Generating enhanced architecture documentation...${RESET}"
cat > MEDALLION_ENHANCED_ARCHITECTURE.md << EOF
# Juicer GenAI Insights: Enhanced Medallion Architecture

## Overview

This document describes the enhanced Medallion Architecture implemented for the Juicer GenAI Insights system, following best practices from the Databricks Medallion Azure Well-Architected Framework.

## Medallion Architecture Layers

### Bronze Layer
- **Purpose**: Raw data ingestion from source systems
- **Data Format**: JSON/Delta format with schema enforcement
- **Retention**: Hot tier (30 days) → Cool tier (30-90 days) → Archive tier (90+ days)
- **Dedicated Compute**: BronzeLayerProcessing cluster (2-4 workers, autoscaling)
- **Quality Checks**: Basic schema validation and row count verification

### Silver Layer
- **Purpose**: Cleaned data with brand mentions and sentiment analysis
- **Data Format**: Delta format with optimized partitioning
- **Retention**: Hot tier (60 days) → Cool tier (60-180 days) → Archive tier (180+ days)
- **Dedicated Compute**: SilverLayerProcessing cluster (2-6 workers, autoscaling)
- **Quality Checks**: Field validation, sentiment score range validation

### Gold Layer
- **Purpose**: Reconstructed transcripts for analytics
- **Data Format**: Delta format optimized for queries
- **Retention**: Hot tier (90 days) → Cool tier (90+ days)
- **Dedicated Compute**: GoldPlatinumLayerProcessing cluster (2-8 workers, autoscaling)
- **Quality Checks**: Topic and intent validation, enrichment verification

### Platinum Layer
- **Purpose**: GenAI-generated insights
- **Data Format**: Delta format optimized for dashboard consumption
- **Retention**: 2-year retention policy
- **Dedicated Compute**: GoldPlatinumLayerProcessing cluster (shared with Gold)
- **Quality Checks**: Confidence score validation, model verification

## Enhanced Capabilities

### Compute Isolation
- Separate compute clusters for each logical layer
- Auto-scaling based on workload demands
- Optimized Spark configurations for each data processing stage

### Data Quality Framework
- Automated quality checks between layers using Great Expectations
- Quality metrics stored in dedicated quality tables
- Dashboard for monitoring data quality across layers
- Alerting on quality failures

### Monitoring & Alerting
- Comprehensive monitoring via Azure Monitor and Log Analytics
- Custom dashboards for operational metrics
- Configured alerts for:
  - Job failures
  - Storage capacity thresholds
  - Data quality issues
  - Security events

### Storage Lifecycle Management
- Tiered storage strategy (Hot → Cool → Archive)
- Automated lifecycle policies based on data age
- Daily blob inventory for monitoring
- Storage metrics dashboard

### Security Enhancements
- Virtual Network integration
- Private endpoints for Storage Account and Key Vault
- Network security rules with default deny
- Automated API key rotation every 90 days

## Deployment Information

- **Deployment Date**: $(date +"%Y-%m-%d")
- **Deployment Log**: ${LOG_FILE}
- **Deployment Script**: 6_deploy_medallion_enhancements.sh

## Resources

- **Databricks Workspace**: tbwa-juicer-databricks
- **Storage Account**: tbwajuicerstorage
- **Key Vault**: kv-tbwa-juicer-insights2
- **Virtual Network**: juicer-vnet (if security enhancements were deployed)
- **Log Analytics**: juicer-log-analytics
- **Automation Account**: juicer-key-rotation (if security enhancements were deployed)
EOF

echo -e "${GREEN}Documentation generated: MEDALLION_ENHANCED_ARCHITECTURE.md${RESET}"

# Final summary
echo -e "\n${BLUE}${BOLD}Medallion Architecture Enhancement Deployment Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Compute Isolation: ${GREEN}✓${RESET}"
echo -e "Data Quality Framework: ${GREEN}✓${RESET}"
echo -e "Monitoring & Alerting: ${GREEN}✓${RESET}"
echo -e "Storage Lifecycle Management: ${GREEN}✓${RESET}"
if [[ $security_confirm == [yY] || $security_confirm == [yY][eE][sS] ]]; then
  echo -e "Security Enhancements: ${GREEN}✓${RESET}"
else
  echo -e "Security Enhancements: ${YELLOW}Skipped${RESET}"
fi
echo -e ""
echo -e "Deployment Log: ${GREEN}${LOG_FILE}${RESET}"
echo -e "Documentation: ${GREEN}MEDALLION_ENHANCED_ARCHITECTURE.md${RESET}"

echo -e "\n${GREEN}${BOLD}Medallion Architecture Enhancement deployment complete!${RESET}"
echo -e "${YELLOW}Note: Services may require some time to fully propagate changes.${RESET}"