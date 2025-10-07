#!/bin/bash
# Modified script to commit Juicer integration from the current directory

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

# Ensure we're in the right directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: Must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Header
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║  Local Commit: Juicer GenAI Integration                      ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check if the directory structure is correct
echo -e "${BLUE}Verifying directory structure...${RESET}"
REQUIRED_DIRS=(
  "notebooks"
  "dashboards"
  "cli"
  "pulser"
  "pulser_config"
)

MISSING_DIRS=false
for DIR in "${REQUIRED_DIRS[@]}"; do
  if [[ ! -d "./${DIR}" ]]; then
    echo -e "${RED}✕ Missing directory: ./${DIR}${RESET}"
    MISSING_DIRS=true
  else
    echo -e "${GREEN}✓ Directory found: ./${DIR}${RESET}"
  fi
done

if $MISSING_DIRS; then
  echo -e "${RED}Directory structure is incomplete. Please fix before committing.${RESET}"
  exit 1
fi

# Check for essential files
echo -e "\n${BLUE}Verifying essential files...${RESET}"
REQUIRED_FILES=(
  "notebooks/juicer_gold_insights.py"
  "notebooks/juicer_setup_insights_tables.sql"
  "dashboards/insights_dashboard.html"
  "dashboards/insights_visualizer.js"
  "pulser/insights_hook.yaml"
  "GENAI_INSIGHTS_INTEGRATION.md"
)

MISSING_FILES=false
for FILE in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "./${FILE}" ]]; then
    echo -e "${RED}✕ Missing file: ./${FILE}${RESET}"
    MISSING_FILES=true
  else
    echo -e "${GREEN}✓ File found: ./${FILE}${RESET}"
  fi
done

if $MISSING_FILES; then
  echo -e "${RED}Essential files are missing. Please fix before committing.${RESET}"
  exit 1
fi

# Stage files
echo -e "\n${BLUE}Staging GenAI Insights files for commit...${RESET}"
git add "./notebooks/juicer_gold_insights.py"
git add "./notebooks/juicer_setup_insights_tables.sql"
git add "./dashboards/insights_dashboard.html"
git add "./dashboards/insights_visualizer.js"
git add "./pulser/insights_hook.yaml"
git add "./pulser/juicer_hook.yaml"
git add "./GENAI_INSIGHTS_INTEGRATION.md"

# Show staged files
echo -e "\n${BLUE}Files staged for commit:${RESET}"
git status --short

# Confirm before committing
echo -e "\n${YELLOW}Ready to commit GenAI Insights integration to the repository.${RESET}"
read -p "Proceed with commit? (y/n) " PROCEED

if [[ "$PROCEED" =~ ^[Yy]$ ]]; then
  # Create commit message
  COMMIT_MSG="✨ Add GenAI Insights to Juicer platform:
Integrates LLM-powered insights generation with agent collaboration (Claudia, Kalaw, Echo, Maya, Sunnies)

- Databricks notebook for Gold → Platinum layer processing
- SQL schema for insights storage with confidence scoring
- Interactive dashboard for insights visualization
- Agent-based prompt templates and insight validation
- Fallback mechanisms between LLM providers (Claude, OpenAI, DeepSeek)

Reference ID: PULSER-2.2.1-GENAI-INSIGHTS-20250512"

  # Create commit
  git commit -m "$COMMIT_MSG"

  if [[ $? -eq 0 ]]; then
    echo -e "\n${GREEN}${BOLD}GenAI Insights integration successfully committed!${RESET}"
    echo -e "${BLUE}Next steps:${RESET}"
    echo -e "1. Push to remote with: ${YELLOW}git push origin HEAD${RESET}"
    echo -e "2. Update juicer_hook.yaml with: ${YELLOW}cat pulser/insights_hook.yaml >> ~/.pulser/hooks/juicer_insights.yaml${RESET}"
    echo -e "3. Run insights schema script in Databricks"
  else
    echo -e "\n${RED}Commit failed. Please check the error message above.${RESET}"
  fi
else
  echo -e "\n${YELLOW}Commit cancelled. Files remain staged.${RESET}"
fi

echo -e "\n${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  GENAI INSIGHTS INTEGRATION COMMIT PROCESS COMPLETE           ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"