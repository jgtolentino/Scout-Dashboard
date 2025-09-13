#!/bin/bash
# Script to verify commit readiness for Juicer Integration

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}Juicer Integration - Commit Readiness Check${RESET}\n"

# Check directory structure
echo -e "${BOLD}Directory Structure:${RESET}"
DIRS=("notebooks" "dashboards" "cli" "pulser" "pulser_config" "github_workflows")
ALL_DIRS_EXIST=true

for DIR in "${DIRS[@]}"; do
  if [ -d "$DIR" ]; then
    echo -e "${GREEN}✓ ${DIR}/ exists${RESET}"
  else
    echo -e "${RED}✗ ${DIR}/ missing${RESET}"
    ALL_DIRS_EXIST=false
  fi
done

# Check key files
echo -e "\n${BOLD}Key Files:${RESET}"
FILES=(
  "notebooks/juicer_ingest_bronze.sql"
  "notebooks/juicer_enrich_silver.py"
  "notebooks/juicer_setup_storage.py"
  "dashboards/juicer_dash_shell.html"
  "dashboards/agent_brand_heatmap.dbviz"
  "cli/juicer_cli.py"
  "cli/requirements.txt"
  "pulser/juicer_hook.yaml"
  "pulser_config/.pulserrc_entry"
  "pulser_config/.pulserrc_patch"
  "github_workflows/deploy-juicer.yml"
  "README.md"
  "RELEASE.md"
  "DEBUGGING.md"
  "DEPLOYMENT.md"
  "install.sh"
  "commit_juicer.sh"
)

ALL_FILES_EXIST=true
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo -e "${GREEN}✓ ${FILE} exists${RESET}"
  else
    echo -e "${RED}✗ ${FILE} missing${RESET}"
    ALL_FILES_EXIST=false
  fi
done

# Check executable scripts
echo -e "\n${BOLD}Script Permissions:${RESET}"
SCRIPTS=("install.sh" "commit_juicer.sh" "verify_commit_readiness.sh")
ALL_SCRIPTS_EXECUTABLE=true

for SCRIPT in "${SCRIPTS[@]}"; do
  if [ -x "$SCRIPT" ]; then
    echo -e "${GREEN}✓ ${SCRIPT} is executable${RESET}"
  else
    echo -e "${RED}✗ ${SCRIPT} is not executable${RESET}"
    ALL_SCRIPTS_EXECUTABLE=false
    
    # Make executable if possible
    if [ -f "$SCRIPT" ]; then
      chmod +x "$SCRIPT"
      echo -e "${YELLOW}  → Made ${SCRIPT} executable${RESET}"
    fi
  fi
done

# Check for agent references in README
echo -e "\n${BOLD}Agent References:${RESET}"
if grep -q "InsightPulseAI Agent Roles" README.md; then
  echo -e "${GREEN}✓ Agent references found in README.md${RESET}"
else
  echo -e "${RED}✗ Agent references missing in README.md${RESET}"
fi

# Check for agent references in hook YAML
if [ -f "pulser/juicer_hook.yaml" ] && grep -q "agents:" pulser/juicer_hook.yaml; then
  echo -e "${GREEN}✓ Agent references found in juicer_hook.yaml${RESET}"
else
  echo -e "${RED}✗ Agent references missing in juicer_hook.yaml${RESET}"
fi

# Check final status
echo -e "\n${BOLD}Commit Readiness Status:${RESET}"
if [ "$ALL_DIRS_EXIST" = true ] && [ "$ALL_FILES_EXIST" = true ] && [ "$ALL_SCRIPTS_EXECUTABLE" = true ]; then
  echo -e "${GREEN}${BOLD}✓ Ready for commit!${RESET}"
  echo -e "${BLUE}Run the following command to commit:${RESET}"
  echo -e "  ${YELLOW}./commit_juicer.sh${RESET}"
else
  echo -e "${RED}${BOLD}✗ Issues detected! Please fix before committing.${RESET}"
fi