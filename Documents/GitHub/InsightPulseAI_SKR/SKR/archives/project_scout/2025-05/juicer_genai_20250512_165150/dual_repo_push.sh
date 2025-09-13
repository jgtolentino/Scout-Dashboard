#!/bin/bash
# dual_repo_push.sh - Implements the dual push policy for Juicer GenAI insights
# Pushes to both GitHub (production) and SKR Archive (all versions)

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║  Dual Repo Push: Project Scout + SKR Archive                  ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check that we're in the juicer-stack directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: This script must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Set the SKR archive root location
SKR_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/SKR"
if [[ ! -d "$SKR_ROOT" ]]; then
  echo -e "${YELLOW}Warning: SKR root directory not found. Creating it...${RESET}"
  mkdir -p "$SKR_ROOT"
fi

# Get today's date for archive folder
YEAR_MONTH=$(date +"%Y-%m")
DAY=$(date +"%d")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_PATH="$SKR_ROOT/archives/project_scout/$YEAR_MONTH"

# Create the archive path if it doesn't exist
mkdir -p "$ARCHIVE_PATH"

# Function to determine if code is production-ready
check_production_readiness() {
  echo -e "${BLUE}${BOLD}Checking production readiness...${RESET}"
  
  # Run the verification script if it exists
  if [[ -f "./verify_commit_readiness.sh" ]]; then
    # Run verification script but capture output
    verification_output=$(./verify_commit_readiness.sh)
    verification_status=$?
    
    # Display output
    echo -e "$verification_output"
    
    # Check for "Ready for commit" message
    if [[ $verification_status -eq 0 && "$verification_output" == *"Ready for commit"* ]]; then
      echo -e "${GREEN}Verification passed! Code is production-ready.${RESET}"
      return 0
    else
      echo -e "${YELLOW}Verification did not confirm production readiness.${RESET}"
      return 1
    fi
  else
    # Manual checks if verification script doesn't exist
    missing_files=0
    
    # Check for essential files
    for file in "notebooks/juicer_gold_insights.py" "dashboards/insights_dashboard.html" "GENAI_INSIGHTS_INTEGRATION.md"; do
      if [[ ! -f "$file" ]]; then
        echo -e "${RED}Missing file: $file${RESET}"
        missing_files=$((missing_files + 1))
      fi
    done
    
    if [[ $missing_files -gt 0 ]]; then
      echo -e "${YELLOW}Found $missing_files missing files. Code is not production-ready.${RESET}"
      return 1
    else
      echo -e "${GREEN}All essential files present.${RESET}"
      return 0
    fi
  fi
}

# 1. Always push to SKR Archive
push_to_skr() {
  echo -e "\n${BLUE}${BOLD}Archiving to SKR: ${ARCHIVE_PATH}${RESET}"
  
  # Create the archive directory for this specific push
  PUSH_ARCHIVE="$ARCHIVE_PATH/juicer_genai_${TIMESTAMP}"
  mkdir -p "$PUSH_ARCHIVE"
  
  # Copy all files to the archive
  echo -e "${YELLOW}Copying files to SKR archive...${RESET}"
  cp -r ./* "$PUSH_ARCHIVE/"
  
  # Create metadata file
  echo -e "${YELLOW}Creating metadata...${RESET}"
  cat > "$PUSH_ARCHIVE/metadata.yaml" << EOL
---
name: "Juicer GenAI Insights Integration"
version: "1.0.0"
timestamp: "$(date +"%Y-%m-%d %H:%M:%S")"
author: "InsightPulseAI Team"
branch: "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
commit: "$(git rev-parse HEAD 2>/dev/null || echo "unknown")"
status: "${SKR_TAG:-development}"
production_ready: ${is_production_ready}
components:
  - "notebooks/juicer_gold_insights.py"
  - "notebooks/juicer_setup_insights_tables.sql"
  - "dashboards/insights_dashboard.html"
  - "dashboards/insights_visualizer.js"
  - "pulser/insights_hook.yaml"
agents:
  - "Claudia"
  - "Kalaw"
  - "Maya"
  - "Echo"
  - "Sunnies"
  - "Caca"
description: >
  GenAI insights generation component for Juicer. Transforms Gold layer data
  into actionable business intelligence using LLM processing. Includes dashboard
  visualization, SQL schema, and Pulser integration.
EOL

  # Create an index entry for Kalaw
  echo -e "${YELLOW}Creating SKR index entry for Kalaw...${RESET}"
  cat > "$SKR_ROOT/metadata/juicer_genai_${TIMESTAMP}.yaml" << EOL
---
name: "Juicer GenAI Insights Integration"
timestamp: "$(date +"%Y-%m-%d %H:%M:%S")"
path: "archives/project_scout/$YEAR_MONTH/juicer_genai_${TIMESTAMP}"
status: "${SKR_TAG:-development}"
production_ready: ${is_production_ready}
agents: ["Claudia", "Kalaw", "Maya", "Echo", "Sunnies", "Caca"]
tags: ["genai", "insights", "juicer", "databricks", "project_scout"]
EOL

  echo -e "${GREEN}Successfully archived to SKR: $PUSH_ARCHIVE${RESET}"
  echo -e "${GREEN}Created index entry: $SKR_ROOT/metadata/juicer_genai_${TIMESTAMP}.yaml${RESET}"
  
  # Run sync to Kalaw if the script exists
  if [[ -f "./sync_to_kalaw.sh" ]]; then
    echo -e "${YELLOW}Syncing to Kalaw...${RESET}"
    ./sync_to_kalaw.sh "$PUSH_ARCHIVE"
  fi
}

# 2. Push to GitHub if production-ready
push_to_github() {
  if [[ "$is_production_ready" == "true" ]]; then
    echo -e "\n${BLUE}${BOLD}Preparing for GitHub push (production)...${RESET}"
    
    # Ask if user wants to white-label first
    echo -e "${YELLOW}Do you want to white-label the code before pushing to GitHub? (y/n)${RESET}"
    read -p "> " do_whitelabel
    
    if [[ "$do_whitelabel" =~ ^[Yy]$ ]]; then
      if [[ -f "./whitelabel.sh" ]]; then
        echo -e "${YELLOW}Running white-labeling process...${RESET}"
        ./whitelabel.sh
        
        echo -e "${GREEN}White-labeling complete.${RESET}"
        echo -e "${YELLOW}White-labeled files are in client-facing/output/${RESET}"
        
        # Ask for production repo location
        echo -e "${YELLOW}Enter the path to the Project Scout production repository:${RESET}"
        read -p "> " SCOUT_REPO_PATH
        
        if [[ -d "$SCOUT_REPO_PATH" ]]; then
          echo -e "${YELLOW}Copying white-labeled files to $SCOUT_REPO_PATH...${RESET}"
          cp -r client-facing/output/* "$SCOUT_REPO_PATH/"
          
          echo -e "${GREEN}Files copied to $SCOUT_REPO_PATH${RESET}"
          echo -e "${YELLOW}To commit and push, run these commands:${RESET}"
          echo -e "  cd $SCOUT_REPO_PATH"
          echo -e "  git checkout -b feature/retail-advisor-insights"
          echo -e "  git add ."
          echo -e "  git commit -m \"🚀 Add Retail Advisor with OpsCore integration\""
          echo -e "  git push origin feature/retail-advisor-insights"
        else
          echo -e "${RED}Error: Directory not found: $SCOUT_REPO_PATH${RESET}"
          echo -e "${YELLOW}White-labeled files are available in client-facing/output/${RESET}"
        fi
      else
        echo -e "${RED}Error: White-labeling script not found.${RESET}"
        echo -e "${YELLOW}Please run prep_production_push.sh to prepare production files.${RESET}"
      fi
    else
      # Direct push to GitHub without white-labeling
      echo -e "${YELLOW}Pushing directly to GitHub without white-labeling.${RESET}"
      echo -e "${YELLOW}Note: This will expose internal agent names and architecture.${RESET}"
      echo -e "${YELLOW}Are you sure you want to continue? (y/n)${RESET}"
      read -p "> " confirm_push
      
      if [[ "$confirm_push" =~ ^[Yy]$ ]]; then
        # Create a branch if needed
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        TARGET_BRANCH="feature/juicer-genai-insights"
        
        if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
          echo -e "${YELLOW}Creating branch: $TARGET_BRANCH${RESET}"
          git checkout -b "$TARGET_BRANCH"
        fi
        
        # Stage and commit
        echo -e "${YELLOW}Staging files...${RESET}"
        git add .
        
        # Create commit message
        COMMIT_MSG="✨ Add GenAI Insights to Juicer platform:
Integrates LLM-powered insights generation with agent collaboration (Claudia, Kalaw, Echo, Maya, Sunnies)

- Databricks notebook for Gold → Platinum layer processing
- SQL schema for insights storage with confidence scoring
- Interactive dashboard for insights visualization
- Agent-based prompt templates and insight validation
- Fallback mechanisms between LLM providers (Claude, OpenAI, DeepSeek)

Reference ID: PULSER-2.2.1-GENAI-INSIGHTS-$(date +"%Y%m%d")"

        # Commit
        echo -e "${YELLOW}Committing with message:${RESET}\n$COMMIT_MSG"
        git commit -m "$COMMIT_MSG"
        
        # Push
        echo -e "${YELLOW}Pushing to GitHub...${RESET}"
        git push origin "$TARGET_BRANCH"
        
        echo -e "${GREEN}Successfully pushed to GitHub branch: $TARGET_BRANCH${RESET}"
      else
        echo -e "${YELLOW}GitHub push cancelled.${RESET}"
      fi
    fi
  else
    echo -e "\n${YELLOW}Code is not production-ready. Skipping GitHub push.${RESET}"
    echo -e "${YELLOW}Only pushing to SKR Archive.${RESET}"
  fi
}

# Main execution flow
# 1. Check production readiness
check_production_readiness
is_production_ready=$?

if [[ $is_production_ready -eq 0 ]]; then
  is_production_ready="true"
  
  # Ask user to confirm production tag
  echo -e "\n${YELLOW}Code appears to be production-ready. Set SKR_TAG to 'prod-ready'? (y/n)${RESET}"
  read -p "> " set_prod_tag
  
  if [[ "$set_prod_tag" =~ ^[Yy]$ ]]; then
    SKR_TAG="prod-ready"
    echo -e "${GREEN}Set SKR_TAG to 'prod-ready'${RESET}"
  else
    SKR_TAG="development"
    is_production_ready="false"
    echo -e "${YELLOW}Set SKR_TAG to 'development'${RESET}"
  fi
else
  is_production_ready="false"
  SKR_TAG="development"
  echo -e "${YELLOW}Code is not production-ready. Setting SKR_TAG to 'development'${RESET}"
fi

# 2. Push to SKR Archive (always)
push_to_skr

# 3. Push to GitHub if production-ready
push_to_github

# Summary
echo -e "\n${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  Dual Repo Push Complete!                                     ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"

echo -e "\n${GREEN}${BOLD}Push Summary:${RESET}"
echo -e "  SKR Archive: ${GREEN}COMPLETE${RESET} (Archive: $ARCHIVE_PATH/juicer_genai_${TIMESTAMP})"
if [[ "$is_production_ready" == "true" ]]; then
  echo -e "  GitHub: ${GREEN}COMPLETE${RESET} (Branch: ${TARGET_BRANCH:-feature/retail-advisor-insights})"
else
  echo -e "  GitHub: ${YELLOW}SKIPPED${RESET} (Not production-ready)"
fi
echo -e "  Status: ${CYAN}${SKR_TAG}${RESET}"
echo -e "  Date: $(date)"

echo -e "\n${BLUE}Next Steps:${RESET}"
echo -e "  - Review the GitHub pull request (if pushed to GitHub)"
echo -e "  - Validate the SKR Archive indexing with Kalaw"
echo -e "  - Test the implementation in the target environment"
echo -e "  - Run QA validation with Caca"