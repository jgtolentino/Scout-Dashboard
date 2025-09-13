#!/bin/bash
# Script to commit Juicer integration to the Project Scout repository

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

# Ensure we're in the right directory
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -z "$REPO_ROOT" ]]; then
  echo -e "${RED}Error: Not in a git repository${RESET}"
  exit 1
fi

TOOLS_DIR="${REPO_ROOT}/tools/js"
if [[ ! -d "$TOOLS_DIR" ]]; then
  echo -e "${RED}Error: tools/js directory not found${RESET}"
  exit 1
fi

if [[ ! -d "${TOOLS_DIR}/juicer-stack" ]]; then
  echo -e "${RED}Error: juicer-stack directory not found${RESET}"
  exit 1
fi

# Header
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║  Commit Juicer Integration to Project Scout Repository       ║${RESET}"
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
  if [[ ! -d "${TOOLS_DIR}/juicer-stack/${DIR}" ]]; then
    echo -e "${RED}✕ Missing directory: juicer-stack/${DIR}${RESET}"
    MISSING_DIRS=true
  else
    echo -e "${GREEN}✓ Directory found: juicer-stack/${DIR}${RESET}"
  fi
done

if $MISSING_DIRS; then
  echo -e "${RED}Directory structure is incomplete. Please fix before committing.${RESET}"
  exit 1
fi

# Check for essential files
echo -e "\n${BLUE}Verifying essential files...${RESET}"
REQUIRED_FILES=(
  "notebooks/juicer_ingest_bronze.sql"
  "notebooks/juicer_enrich_silver.py"
  "dashboards/juicer_dash_shell.html"
  "dashboards/agent_brand_heatmap.dbviz"
  "cli/juicer_cli.py"
  "pulser/juicer_hook.yaml"
  "README.md"
  "DEBUGGING.md"
  "install.sh"
)

MISSING_FILES=false
for FILE in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "${TOOLS_DIR}/juicer-stack/${FILE}" ]]; then
    echo -e "${RED}✕ Missing file: juicer-stack/${FILE}${RESET}"
    MISSING_FILES=true
  else
    echo -e "${GREEN}✓ File found: juicer-stack/${FILE}${RESET}"
  fi
done

if $MISSING_FILES; then
  echo -e "${RED}Essential files are missing. Please fix before committing.${RESET}"
  exit 1
fi

# Check for agent references in README
echo -e "\n${BLUE}Checking for agent references in README.md...${RESET}"
if grep -q "InsightPulseAI Agent Roles" "${TOOLS_DIR}/juicer-stack/README.md"; then
  echo -e "${GREEN}✓ Agent references found in README.md${RESET}"
else
  echo -e "${RED}✕ Agent references missing in README.md${RESET}"
  exit 1
fi

# Check for router command handler
echo -e "\n${BLUE}Checking for juicer.js command handler...${RESET}"
if [[ -f "${TOOLS_DIR}/router/commands/juicer.js" ]]; then
  echo -e "${GREEN}✓ juicer.js command handler found${RESET}"
else
  echo -e "${YELLOW}⚠ juicer.js command handler not found in router/commands/${RESET}"
  echo -e "${YELLOW}Make sure it's included in your commit.${RESET}"
fi

# Create branch if needed
echo -e "\n${BLUE}Setting up git branch...${RESET}"
CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH="pulser-juicer-integration"

if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo -e "${YELLOW}Currently on branch: ${CURRENT_BRANCH}${RESET}"
  read -p "Create and switch to branch '$TARGET_BRANCH'? (y/n) " CREATE_BRANCH
  if [[ "$CREATE_BRANCH" =~ ^[Yy]$ ]]; then
    git checkout -b "$TARGET_BRANCH"
    if [[ $? -ne 0 ]]; then
      echo -e "${RED}Failed to create branch${RESET}"
      exit 1
    fi
    echo -e "${GREEN}Created and switched to branch: ${TARGET_BRANCH}${RESET}"
  else
    echo -e "${YELLOW}Continuing with current branch: ${CURRENT_BRANCH}${RESET}"
  fi
else
  echo -e "${GREEN}Already on target branch: ${TARGET_BRANCH}${RESET}"
fi

# Stage files
echo -e "\n${BLUE}Staging files for commit...${RESET}"
git add "${TOOLS_DIR}/juicer-stack/"
git add "${TOOLS_DIR}/router/commands/juicer.js" 2>/dev/null || echo -e "${YELLOW}Note: juicer.js was not staged (may not exist yet)${RESET}"

# Check if GitHub Actions workflow directory exists
GH_WORKFLOWS_DIR="${REPO_ROOT}/.github/workflows"
if [[ ! -d "$GH_WORKFLOWS_DIR" ]]; then
  echo -e "${YELLOW}Creating GitHub Actions workflows directory...${RESET}"
  mkdir -p "$GH_WORKFLOWS_DIR"
fi

# Copy GitHub Actions workflow
if [[ -f "${TOOLS_DIR}/juicer-stack/github_workflows/deploy-juicer.yml" ]]; then
  echo -e "${YELLOW}Copying GitHub Actions workflow to .github/workflows/...${RESET}"
  cp "${TOOLS_DIR}/juicer-stack/github_workflows/deploy-juicer.yml" "${GH_WORKFLOWS_DIR}/"
  git add "${GH_WORKFLOWS_DIR}/deploy-juicer.yml"
  echo -e "${GREEN}✓ GitHub Actions workflow added${RESET}"
fi

# Show staged files
echo -e "\n${BLUE}Files staged for commit:${RESET}"
git status --short

# Confirm before committing
echo -e "\n${YELLOW}Ready to commit Juicer integration to the repository.${RESET}"
read -p "Proceed with commit? (y/n) " PROCEED

if [[ "$PROCEED" =~ ^[Yy]$ ]]; then
  # Create commit message
  COMMIT_MSG="🔗 Add Juicer integration stack for Databricks AI-BI:
includes notebooks, CLI handler, dashboard shell, and Pulser agent routing (Claudia, Kalaw, Echo, Maya, Sunnies)

- Databricks notebooks for Bronze/Silver/Gold medallion processing
- BI dashboard with SVG sketch embedding capability
- CLI interface for natural language queries
- Agent orchestration via juicer_hook.yaml
- GitHub Actions for CI/CD deployment

Reference ID: PULSER-2.0.1-JUICER-20250512"

  # Use GPG signing if available
  if git config --get user.signingkey > /dev/null 2>&1; then
    echo -e "${GREEN}Committing with GPG signature...${RESET}"
    git commit -S -m "$COMMIT_MSG"
  else
    echo -e "${YELLOW}GPG signing key not configured, committing without signature...${RESET}"
    git commit -m "$COMMIT_MSG"
  fi

  if [[ $? -eq 0 ]]; then
    echo -e "\n${GREEN}${BOLD}Juicer integration successfully committed!${RESET}"
    echo -e "${BLUE}Next steps:${RESET}"
    echo -e "1. Push to remote: ${YELLOW}git push origin ${TARGET_BRANCH}${RESET}"
    echo -e "2. Create pull request on GitHub"
    echo -e "3. Add .pulserrc entry: ${YELLOW}cat tools/js/juicer-stack/pulser_config/.pulserrc_entry >> ~/.pulserrc${RESET}"
    echo -e "4. Run installation script: ${YELLOW}tools/js/juicer-stack/install.sh${RESET}"
  else
    echo -e "\n${RED}Commit failed. Please check the error message above.${RESET}"
  fi
else
  echo -e "\n${YELLOW}Commit cancelled. Files remain staged.${RESET}"
fi

echo -e "\n${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  JUICER INTEGRATION COMMIT PROCESS COMPLETE                  ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"