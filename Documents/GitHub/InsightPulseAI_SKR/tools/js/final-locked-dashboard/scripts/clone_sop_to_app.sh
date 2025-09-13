#!/bin/bash
# clone_sop_to_app.sh
# Clones the Unified Developer Deployment SOP to a target InsightPulseAI application
# Part of InsightPulseAI Unified Developer Deployment SOP (v1.0)

# Exit on any error
set -e

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Default values
SOP_ROOT_DIR="${SOP_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SOP_PROFILE="${SOP_PROFILE:-${SOP_ROOT_DIR}/pulser_sop_profile.yaml}"

function usage() {
  echo -e "${BOLD}Usage:${RESET} $0 [OPTIONS] TARGET_APP_PATH"
  echo
  echo -e "${BOLD}Options:${RESET}"
  echo -e "  -a, --app-name NAME       Application name (e.g., PRISMA, GEZ, PulseUP)"
  echo -e "  -t, --target-type TYPE    Target type (azure, vercel, kubernetes)"
  echo -e "  -p, --profile FILE        Path to SOP profile (default: ${SOP_PROFILE})"
  echo -e "  -s, --skip-skr            Skip SKR archive creation"
  echo -e "  -d, --dry-run             Show operations without executing"
  echo -e "  -h, --help                Show this help message"
  echo
  echo -e "${BOLD}Example:${RESET}"
  echo -e "  $0 --app-name PRISMA --target-type azure /path/to/prisma/app"
}

# Parse command-line arguments
APP_NAME=""
TARGET_TYPE="azure"
TARGET_PATH=""
SKIP_SKR=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--app-name)
      APP_NAME="$2"
      shift 2
      ;;
    -t|--target-type)
      TARGET_TYPE="$2"
      shift 2
      ;;
    -p|--profile)
      SOP_PROFILE="$2"
      shift 2
      ;;
    -s|--skip-skr)
      SKIP_SKR=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$TARGET_PATH" ]]; then
        TARGET_PATH="$1"
      else
        echo -e "${RED}Error: Unknown argument: $1${RESET}"
        usage
        exit 1
      fi
      shift
      ;;
  esac
done

# Validate inputs
if [[ -z "$APP_NAME" ]]; then
  echo -e "${RED}Error: Application name is required${RESET}"
  usage
  exit 1
fi

if [[ -z "$TARGET_PATH" ]]; then
  echo -e "${RED}Error: Target application path is required${RESET}"
  usage
  exit 1
fi

if [[ ! -f "$SOP_PROFILE" ]]; then
  echo -e "${RED}Error: SOP profile not found: $SOP_PROFILE${RESET}"
  exit 1
fi

if [[ ! -d "$TARGET_PATH" ]]; then
  echo -e "${RED}Error: Target path is not a directory: $TARGET_PATH${RESET}"
  exit 1
fi

# Function to execute or echo a command based on dry run mode
run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would execute:${RESET} $@"
  else
    eval "$@"
  fi
}

# Print header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Clone Unified Developer Deployment SOP to Application          ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}"
echo

# Print summary
echo -e "${BOLD}Configuration:${RESET}"
echo -e "  Application Name:  ${GREEN}$APP_NAME${RESET}"
echo -e "  Target Type:       ${GREEN}$TARGET_TYPE${RESET}"
echo -e "  Target Path:       ${GREEN}$TARGET_PATH${RESET}"
echo -e "  SOP Profile:       ${GREEN}$SOP_PROFILE${RESET}"
echo -e "  Skip SKR:          ${GREEN}$SKIP_SKR${RESET}"
echo -e "  Dry Run:           ${GREEN}$DRY_RUN${RESET}"
echo

# Confirm before proceeding
if [[ "$DRY_RUN" != "true" ]]; then
  read -p "Proceed with cloning SOP to application? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo -e "${YELLOW}Operation aborted by user${RESET}"
    exit 0
  fi
fi

echo -e "${BLUE}Cloning Unified Developer Deployment SOP to $APP_NAME...${RESET}"

# Create directory structure
echo -e "${BLUE}Creating directory structure...${RESET}"
directories=(
  "scripts"
  "docs"
  "tools"
  "public"
  "css"
  "js"
)

for dir in "${directories[@]}"; do
  if [[ ! -d "$TARGET_PATH/$dir" ]]; then
    run_cmd "mkdir -p \"$TARGET_PATH/$dir\""
    echo -e "${GREEN}✓${RESET} Created directory: $dir"
  else
    echo -e "${YELLOW}⚠${RESET} Directory already exists: $dir"
  fi
done

# Create SKR archive directory if needed
if [[ "$SKIP_SKR" != "true" ]]; then
  today=$(date +%Y-%m)
  skr_dir="$TARGET_PATH/SKR/archives/${APP_NAME,,}/$today"
  run_cmd "mkdir -p \"$skr_dir\""
  echo -e "${GREEN}✓${RESET} Created SKR archive directory"
fi

# Copy core scripts
echo -e "${BLUE}Copying core scripts...${RESET}"

# package_app.sh
run_cmd "cp \"$SOP_ROOT_DIR/scripts/package_dashboard.sh\" \"$TARGET_PATH/scripts/package_app.sh\""
run_cmd "sed -i.bak \"s/dashboard/app/g\" \"$TARGET_PATH/scripts/package_app.sh\""
run_cmd "sed -i.bak \"s/Scout/$APP_NAME/g\" \"$TARGET_PATH/scripts/package_app.sh\""
run_cmd "rm -f \"$TARGET_PATH/scripts/package_app.sh.bak\""
echo -e "${GREEN}✓${RESET} Created package_app.sh"

# deploy_app.sh
run_cmd "cp \"$SOP_ROOT_DIR/scripts/deploy_dashboard.sh\" \"$TARGET_PATH/scripts/deploy_app.sh\""
run_cmd "sed -i.bak \"s/dashboard/app/g\" \"$TARGET_PATH/scripts/deploy_app.sh\""
run_cmd "sed -i.bak \"s/Scout/$APP_NAME/g\" \"$TARGET_PATH/scripts/deploy_app.sh\""
if [[ "$TARGET_TYPE" != "azure" ]]; then
  run_cmd "sed -i.bak \"s/Azure Static Web App/$TARGET_TYPE deployment/g\" \"$TARGET_PATH/scripts/deploy_app.sh\""
fi
run_cmd "rm -f \"$TARGET_PATH/scripts/deploy_app.sh.bak\""
echo -e "${GREEN}✓${RESET} Created deploy_app.sh"

# Copy monitoring and verification tools
echo -e "${BLUE}Copying monitoring and verification tools...${RESET}"

# verify_style_compliance.js
run_cmd "cp \"$SOP_ROOT_DIR/tools/verify_style_compliance.js\" \"$TARGET_PATH/tools/\""
run_cmd "sed -i.bak \"s/Power BI/$APP_NAME/g\" \"$TARGET_PATH/tools/verify_style_compliance.js\""
run_cmd "rm -f \"$TARGET_PATH/tools/verify_style_compliance.js.bak\""
echo -e "${GREEN}✓${RESET} Created verify_style_compliance.js"

# monitor_app_uptime.js
run_cmd "cp \"$SOP_ROOT_DIR/tools/monitor_dashboard_uptime.js\" \"$TARGET_PATH/tools/monitor_app_uptime.js\""
run_cmd "sed -i.bak \"s/dashboard/app/g\" \"$TARGET_PATH/tools/monitor_app_uptime.js\""
run_cmd "sed -i.bak \"s/Scout/$APP_NAME/g\" \"$TARGET_PATH/tools/monitor_app_uptime.js\""
run_cmd "rm -f \"$TARGET_PATH/tools/monitor_app_uptime.js.bak\""
echo -e "${GREEN}✓${RESET} Created monitor_app_uptime.js"

# Create documentation
echo -e "${BLUE}Creating documentation...${RESET}"

# SOP_DEPLOYMENT.md
run_cmd "cp \"$SOP_ROOT_DIR/docs/SOP_DEPLOYMENT.md\" \"$TARGET_PATH/docs/\""
run_cmd "sed -i.bak \"s/Scout/$APP_NAME/g\" \"$TARGET_PATH/docs/SOP_DEPLOYMENT.md\""
run_cmd "rm -f \"$TARGET_PATH/docs/SOP_DEPLOYMENT.md.bak\""
echo -e "${GREEN}✓${RESET} Created SOP_DEPLOYMENT.md"

# QA_GUIDELINES.md
run_cmd "cp \"$SOP_ROOT_DIR/docs/QA_GUIDELINES_POWERBI_PARITY.md\" \"$TARGET_PATH/docs/QA_GUIDELINES.md\""
run_cmd "sed -i.bak \"s/Power BI/$APP_NAME/g\" \"$TARGET_PATH/docs/QA_GUIDELINES.md\""
run_cmd "rm -f \"$TARGET_PATH/docs/QA_GUIDELINES.md.bak\""
echo -e "${GREEN}✓${RESET} Created QA_GUIDELINES.md"

# README_DESKTOP.md
run_cmd "cat > \"$TARGET_PATH/README_DESKTOP.md\" << EOF
# $APP_NAME Deployment Guide

This package contains all the files needed to deploy the $APP_NAME application to $TARGET_TYPE.

## Quick Start

1. Unzip the package: \`unzip ${APP_NAME,,}_deployment.zip\`
2. Navigate to the extracted folder: \`cd ${APP_NAME,,}_package\`
3. Make the deployment script executable: \`chmod +x deploy_app.sh\`
4. Run the deployment script: \`./deploy_app.sh\`

## Documentation

See the \`docs/SOP_DEPLOYMENT.md\` file inside the package for complete details.

*Package created: \$(date +\"%Y-%m-%d\")*
EOF"
echo -e "${GREEN}✓${RESET} Created README_DESKTOP.md"

# Create Makefile
echo -e "${BLUE}Creating Makefile...${RESET}"
run_cmd "cat > \"$TARGET_PATH/Makefile\" << EOF
# Makefile for $APP_NAME Application
# Provides simple automation for packaging and deployment tasks

.PHONY: all help package deploy deploy-dry-run verify-style monitor clean

# Default target (help)
all: help

# Help message
help:
	@echo \"$APP_NAME Build & Deploy\"
	@echo \"=======================================\"
	@echo \"\"
	@echo \"Available targets:\"
	@echo \"  package          Create deployment package\"
	@echo \"  deploy           Deploy to $TARGET_TYPE\"
	@echo \"  deploy-dry-run   Perform a dry run of deployment (no actual deploy)\"
	@echo \"  verify-style     Verify style compliance\"
	@echo \"  monitor          Monitor application uptime\"
	@echo \"  clean            Clean up temporary files\"
	@echo \"\"
	@echo \"Environment variables:\"
	@echo \"  APP_ROOT_DIR          Root directory (default: current directory)\"
	@echo \"  APP_NAME              Application name for deployment\"
	@echo \"  RESOURCE_GROUP        Resource group (for Azure deployments)\"
	@echo \"\"
	@echo \"Examples:\"
	@echo \"  make package\"
	@echo \"  make deploy APP_NAME=my-app\"

# Create deployment package
package:
	@echo \"Creating deployment package...\"
	@./scripts/package_app.sh

# Deploy to target environment
deploy:
	@echo \"Deploying to $TARGET_TYPE...\"
	@./scripts/deploy_app.sh

# Perform a dry run of deployment
deploy-dry-run:
	@echo \"Performing dry run of deployment...\"
	@DRY_RUN=true ./scripts/deploy_app.sh

# Verify style compliance
verify-style:
	@echo \"Verifying style compliance...\"
	@node ./tools/verify_style_compliance.js

# Monitor application uptime
monitor:
	@echo \"Monitoring application uptime...\"
	@node ./tools/monitor_app_uptime.js

# Clean up temporary files
clean:
	@echo \"Cleaning up temporary files...\"
	@rm -rf output/*
	@echo \"Cleanup complete\"
EOF"
echo -e "${GREEN}✓${RESET} Created Makefile"

# Create Pulser integration
echo -e "${BLUE}Creating Pulser integration...${RESET}"
run_cmd "cat > \"$TARGET_PATH/pulser_tasks.yaml\" << EOF
# $APP_NAME Deployment Tasks for Pulser Integration
# These tasks are registered with the Pulser system for automated deployment
# Follows InsightPulseAI Unified Developer Deployment SOP v1.0

tasks:
  - id: deploy_app
    name: Deploy $APP_NAME
    agent: Basher
    script: scripts/deploy_app.sh
    description: Deploys latest $APP_NAME to $TARGET_TYPE
    env:
      APP_NAME: ${APP_NAME,,}-app
      RESOURCE_GROUP: RG-${APP_NAME}-Main
    triggers:
      - make deploy
      - /deploy ${APP_NAME,,}
      - :deploy ${APP_NAME,,}

  - id: package_app
    name: Package $APP_NAME
    agent: Basher 
    script: scripts/package_app.sh
    description: Packages the $APP_NAME files for deployment
    env:
      APP_ROOT_DIR: \${HOME}/Documents/GitHub/InsightPulseAI_SKR/tools/${APP_NAME,,}
    triggers:
      - make package
      - /package ${APP_NAME,,}
      - :package ${APP_NAME,,}

  - id: validate_app
    name: Validate $APP_NAME
    agent: Basher
    script: scripts/deploy_app.sh --dry-run
    description: Performs a dry run of deployment to validate the package
    env:
      APP_NAME: ${APP_NAME,,}-app
      RESOURCE_GROUP: RG-${APP_NAME}-Main
      DRY_RUN: true
    triggers:
      - make deploy-dry-run
      - /validate ${APP_NAME,,}
      - :validate ${APP_NAME,,}

  - id: verify_style_compliance
    name: Verify $APP_NAME Style Compliance
    agent: Caca
    script: tools/verify_style_compliance.js
    description: Verifies the application follows styling guidelines
    env:
      STYLE_GUIDE_PATH: docs/STYLE_GUIDE.md
      APP_PATH: index.html
    triggers:
      - make verify-style
      - /verify style
      - :verify ${APP_NAME,,}

  - id: monitor_app
    name: Monitor $APP_NAME
    agent: Echo
    script: tools/monitor_app_uptime.js
    description: Monitors the deployed application for uptime and performance
    env:
      APP_URL: https://${APP_NAME,,}-app.${TARGET_TYPE}app.net/index.html
      ALERT_THRESHOLD_MS: 3000
    schedule: 
      - "0 */6 * * *"  # Every 6 hours
    triggers:
      - make monitor
      - /monitor ${APP_NAME,,}
      - :monitor ${APP_NAME,,}

workflows:
  - id: deploy_and_monitor
    name: Deploy and Monitor $APP_NAME
    description: Full workflow to deploy and set up monitoring for the $APP_NAME
    steps:
      - task: package_app
      - task: validate_app
      - task: verify_style_compliance
      - task: deploy_app
      - task: monitor_app
    triggers:
      - /deploy full
      - :deploy full

  - id: qa_validate
    name: QA Validation
    description: Run all verification steps without deployment
    steps:
      - task: validate_app
      - task: verify_style_compliance
    triggers:
      - /qa validate
      - :qa ${APP_NAME,,}
EOF"
echo -e "${GREEN}✓${RESET} Created pulser_tasks.yaml"

# Create SKR archive entry if not skipped
if [[ "$SKIP_SKR" != "true" ]]; then
  echo -e "${BLUE}Creating SKR archive entry...${RESET}"
  today_date=$(date +%Y-%m-%d)
  today_dir=$(date +%Y-%m)
  
  run_cmd "cat > \"$TARGET_PATH/SKR/archives/${APP_NAME,,}/$today_dir/DEPLOYMENT_PROTOCOLS.md\" << EOF
# InsightPulseAI: Unified Developer Deployment SOP for $APP_NAME

**Version:** 1.0  
**Author:** InsightPulseAI Dev Team  
**Date:** $today_date  
**Status:** Implemented

## Summary

This document captures the Unified Developer Deployment SOP v1.0 implementation for $APP_NAME, which standardizes deployment practices across all InsightPulseAI projects. This SOP defines directory structures, packaging workflows, deployment procedures, style compliance guidelines, and Pulser integration standards.

## Key Components

### 1. Directory Structure Standard

\`\`\`
/$APP_NAME/
├── scripts/                # All deployment, packaging, and utility scripts
├── public/                 # Static assets (HTML, CSS, JS, images)
├── css/                    # Design system, style harmonization
├── js/                     # Application logic
├── docs/                   # All documentation, SOPs, style guides, and mappings
├── Makefile                # Unified automation entrypoint
└── README_DESKTOP.md       # Human-readable deployment overview
\`\`\`

### 2. Workflow Scripts

- \`scripts/package_app.sh\` - Creates deployment packages
- \`scripts/deploy_app.sh\` - Deploys to $TARGET_TYPE
- \`tools/verify_style_compliance.js\` - Validates style compliance
- \`tools/monitor_app_uptime.js\` - Monitors application availability

### 3. Documentation

- \`docs/SOP_DEPLOYMENT.md\` - Primary SOP reference
- \`docs/QA_GUIDELINES.md\` - QA guidelines
- \`README_DESKTOP.md\` - Simplified deployment instructions

### 4. Pulser Integration

Pulser tasks and workflows for application deployment automation with the following triggers:

- \`:deploy ${APP_NAME,,}\` - Deploy $APP_NAME
- \`:package ${APP_NAME,,}\` - Package application for deployment
- \`:validate ${APP_NAME,,}\` - Validate deployment (dry run)
- \`:deploy full\` - Full workflow: package, validate, deploy, monitor
- \`:qa ${APP_NAME,,}\` - Validate QA requirements

## Implementation Details

The Unified Developer Deployment SOP has been implemented in the $APP_NAME project. Key improvements include:

1. Standardized directory structure for all components
2. Robust error handling in deployment scripts
3. Environment variable support for cross-environment compatibility
4. Dry-run validation before deployment
5. Automatic packaging with desktop integration
6. Style compliance verification
7. Uptime monitoring
8. Comprehensive documentation

## Reference

The full implementation can be found in the following location:
\`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/${APP_NAME,,}/\`

Primary SOP document:
\`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/${APP_NAME,,}/docs/SOP_DEPLOYMENT.md\`

## Next Steps

1. Complete test deployments to $TARGET_TYPE
2. Set up CI/CD integration
3. Set up monitoring dashboards
4. Train team on the new deployment process

## Related Documents

- \`CLAUDE.md\` - Project context for Pulser 2.0
- \`pulser_tasks.yaml\` - Pulser system integration
EOF"

  run_cmd "cat > \"$TARGET_PATH/SKR/archives/${APP_NAME,,}/$today_dir/metadata.yaml\" << EOF
# SKR Metadata for Unified Developer Deployment SOP
document_id: sop_deployment_v1_$(date +%Y%m%d)_${APP_NAME,,}
title: \"InsightPulseAI: Unified Developer Deployment SOP v1.0 for $APP_NAME\"
author: \"InsightPulseAI Dev Team\"
date_created: \"$today_date\"
date_updated: \"$today_date\"
status: \"implemented\"
version: \"1.0\"
category: \"standard_operating_procedure\"
tags:
  - deployment
  - $TARGET_TYPE
  - sop
  - ${APP_NAME,,}
  - pulser
summary: >
  Standard Operating Procedure for consistent deployment of $APP_NAME
  across environments, with a focus on visual integrity and deployment safety.
related_documents:
  - path: \"tools/${APP_NAME,,}/docs/SOP_DEPLOYMENT.md\"
    type: \"primary_sop\"
  - path: \"tools/${APP_NAME,,}/docs/QA_GUIDELINES.md\"
    type: \"qa_guideline\"
  - path: \"tools/${APP_NAME,,}/README_DESKTOP.md\"
    type: \"deployment_guide\"
agents:
  - agent_id: \"Basher\"
    role: \"Deployment executor\"
  - agent_id: \"Caca\"
    role: \"QA verification\"
  - agent_id: \"Echo\"
    role: \"Monitoring\"
  - agent_id: \"Claudia\"
    role: \"Task orchestration\"
workflows:
  - workflow_id: \"deploy_and_monitor\"
    description: \"Full application deployment and monitoring workflow\"
  - workflow_id: \"qa_validate\"
    description: \"QA validation workflow without deployment\"
EOF"
  echo -e "${GREEN}✓${RESET} Created SKR archive entries"
fi

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${RESET}"
run_cmd "chmod +x \"$TARGET_PATH/scripts/package_app.sh\""
run_cmd "chmod +x \"$TARGET_PATH/scripts/deploy_app.sh\""
run_cmd "chmod +x \"$TARGET_PATH/tools/verify_style_compliance.js\""
run_cmd "chmod +x \"$TARGET_PATH/tools/monitor_app_uptime.js\""
echo -e "${GREEN}✓${RESET} Made scripts executable"

# Copy SOP profile for future use
echo -e "${BLUE}Copying SOP profile...${RESET}"
run_cmd "cp \"$SOP_PROFILE\" \"$TARGET_PATH/\""
echo -e "${GREEN}✓${RESET} Copied SOP profile"

# Print summary
echo -e "\n${BOLD}${GREEN}SOP Cloning Complete${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Target Application: ${GREEN}$APP_NAME${RESET}"
echo -e "Target Path: ${GREEN}$TARGET_PATH${RESET}"
echo -e "Target Type: ${GREEN}$TARGET_TYPE${RESET}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "\n${YELLOW}⚠️ This was a dry run - No actual files were created${RESET}"
  echo -e "${YELLOW}To perform actual cloning, run without --dry-run flag${RESET}"
else
  echo -e "\n${BOLD}${GREEN}✅ SOP successfully cloned to $APP_NAME!${RESET}"
  echo -e "${YELLOW}Next Steps:${RESET}"
  echo -e "1. Review and customize the generated files for your application"
  echo -e "2. Update environment-specific settings in scripts"
  echo -e "3. Test the deployment workflow: ${GREEN}cd $TARGET_PATH && make deploy-dry-run${RESET}"
  echo -e "4. Register with Pulser system: ${GREEN}pulser register sop --app $APP_NAME${RESET}"
fi