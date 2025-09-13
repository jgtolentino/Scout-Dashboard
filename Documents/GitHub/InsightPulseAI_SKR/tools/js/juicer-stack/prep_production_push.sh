#!/bin/bash
# prep_production_push.sh
# Script to prepare client-facing production files from internal Juicer GenAI development

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
echo -e "${BOLD}${MAGENTA}║  Prepare GenAI Insights for Production Repository            ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check if we're in the juicer-stack directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: This script must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Get Project Scout repo path
echo -e "${BLUE}${BOLD}Step 1: Set Project Scout Repository Path${RESET}"
echo -e "${YELLOW}Enter the path to the Project Scout production repository:${RESET}"
read -p "> " SCOUT_REPO_PATH

if [[ ! -d "$SCOUT_REPO_PATH" ]]; then
  echo -e "${RED}Error: Directory not found: $SCOUT_REPO_PATH${RESET}"
  echo -e "${YELLOW}Do you want to create this directory? (y/n)${RESET}"
  read -p "> " CREATE_DIR
  
  if [[ "$CREATE_DIR" =~ ^[Yy]$ ]]; then
    mkdir -p "$SCOUT_REPO_PATH"
    echo -e "${GREEN}Created directory: $SCOUT_REPO_PATH${RESET}"
  else
    echo -e "${RED}Cannot continue without valid repository path.${RESET}"
    exit 1
  fi
fi

# Create directory structure
echo -e "\n${BLUE}${BOLD}Step 2: Creating Directory Structure${RESET}"
SCOUT_RETAIL_DIR="$SCOUT_REPO_PATH/retail-analytics-dash"
SCOUT_DOCS_DIR="$SCOUT_REPO_PATH/docs/genai"
SCOUT_CLI_DIR="$SCOUT_REPO_PATH/cli"

mkdir -p "$SCOUT_RETAIL_DIR"
mkdir -p "$SCOUT_DOCS_DIR"
mkdir -p "$SCOUT_CLI_DIR"

echo -e "${GREEN}Created directory structure:${RESET}"
echo -e "  - ${CYAN}$SCOUT_RETAIL_DIR${RESET}"
echo -e "  - ${CYAN}$SCOUT_DOCS_DIR${RESET}"
echo -e "  - ${CYAN}$SCOUT_CLI_DIR${RESET}"

# Clean production documentation
echo -e "\n${BLUE}${BOLD}Step 3: Preparing Documentation for Client${RESET}"
# Create a sanitized version of the documentation
cat GENAI_INSIGHTS_INTEGRATION.md | grep -v "claudia\|Claudia\|maya\|Maya\|kalaw\|Kalaw\|echo\|Echo\|sunnies\|Sunnies" > /tmp/sanitized_insights.md

# Add client-friendly information
cat > "$SCOUT_DOCS_DIR/GenAI_Retail_Advisor.md" << EOL
# GenAI Insights for Retail Advisor

This document outlines the implementation of automated insights generation using GenAI for the Retail Advisor system, enabling business intelligence from customer interaction data.

## Overview

The insights generation system leverages advanced AI models to process transcripts and extract valuable business intelligence. Insights are stored in a structured format and visualized in interactive dashboards.

$(cat /tmp/sanitized_insights.md | grep -v "# GenAI Insights Integration")

## Client Benefits

- **Automated Analysis**: Eliminate manual review of customer interactions
- **Prioritized Actions**: Focus on high-confidence, high-impact opportunities
- **Brand Intelligence**: Track competitive positioning and sentiment over time
- **Executive Summaries**: Ready-to-use reports for management review

## Implementation Timeline

- **Phase 1**: Initial deployment with basic sentiment and brand insights
- **Phase 2**: Addition of trend analysis and competitive intelligence
- **Phase 3**: Action tracking and ROI measurement

For technical assistance, please contact your Project Scout implementation team.
EOL

echo -e "${GREEN}Created client documentation: ${CYAN}$SCOUT_DOCS_DIR/GenAI_Retail_Advisor.md${RESET}"

# Prepare the dashboard
echo -e "\n${BLUE}${BOLD}Step 4: Preparing Dashboard for Client${RESET}"
# Create modified dashboard with client-friendly naming
cat dashboards/insights_dashboard.html | sed 's/Juicer/Retail Advisor/g' | sed 's/InsightPulseAI/Project Scout/g' > "$SCOUT_RETAIL_DIR/retail_advisor_insights.html"

# Prepare the JS visualizer (clean version)
cat dashboards/insights_visualizer.js | grep -v "Claudia\|Maya\|Kalaw\|Echo\|Sunnies" | sed 's/Juicer/Retail Advisor/g' > "$SCOUT_RETAIL_DIR/insights_visualizer.js"

echo -e "${GREEN}Created client dashboard: ${CYAN}$SCOUT_RETAIL_DIR/retail_advisor_insights.html${RESET}"
echo -e "${GREEN}Created client visualizer: ${CYAN}$SCOUT_RETAIL_DIR/insights_visualizer.js${RESET}"

# Prepare the insights generation code
echo -e "\n${BLUE}${BOLD}Step 5: Preparing Code for Client${RESET}"
# Create a production-ready version of the insights generator
cat notebooks/juicer_gold_insights.py | grep -v "Claudia\|Maya\|Kalaw\|Echo\|Sunnies" | sed 's/Juicer/RetailAdvisor/g' > "$SCOUT_CLI_DIR/insight_gen.py"

echo -e "${GREEN}Created client code: ${CYAN}$SCOUT_CLI_DIR/insight_gen.py${RESET}"

# Create .pulserignore equivalent
echo -e "\n${BLUE}${BOLD}Step 6: Creating .pulserignore File${RESET}"
cat > "$SCOUT_REPO_PATH/.pulserignore" << EOL
# .pulserignore - Defines files that should not be synced to client environments
debug/
notebooks/
dashboards/test/
logs/
*.dev.json
*_internal.yaml
*_debug.sql
EOL

echo -e "${GREEN}Created .pulserignore file: ${CYAN}$SCOUT_REPO_PATH/.pulserignore${RESET}"

# Create git commit script
echo -e "\n${BLUE}${BOLD}Step 7: Creating Commit Script${RESET}"
cat > "$SCOUT_REPO_PATH/commit_genai_insights.sh" << EOL
#!/bin/bash
# Commit script for GenAI Insights in Project Scout production repo

# Check if git is initialized
if [ ! -d ".git" ]; then
  git init
  echo "Git repository initialized."
fi

# Create branch
git checkout -b feature/genai-retail-advisor

# Stage files
git add retail-analytics-dash/
git add docs/genai/
git add cli/insight_gen.py
git add .pulserignore

# Commit
git commit -m "🚀 Add production-ready GenAI Insight Engine for Retail Advisor

- Interactive dashboard for brand and sentiment intelligence
- Automated insight generation from customer interactions
- Action recommendation system with priority tracking
- Visualization of competitive positioning

REF: SCOUT-2025-05-GENAI"

# Show instructions
echo "Changes committed to branch: feature/genai-retail-advisor"
echo "To push to remote repository: git push origin feature/genai-retail-advisor"
EOL

chmod +x "$SCOUT_REPO_PATH/commit_genai_insights.sh"
echo -e "${GREEN}Created commit script: ${CYAN}$SCOUT_REPO_PATH/commit_genai_insights.sh${RESET}"

# Summary and instructions
echo -e "\n${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  Preparation Complete!                                       ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"

echo -e "\n${GREEN}${BOLD}Production-ready files have been created for Project Scout.${RESET}"
echo -e "\n${BLUE}Internal Repository (InsightPulseAI_SKR):${RESET}"
echo -e "  1. ${YELLOW}cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/${RESET}"
echo -e "  2. ${YELLOW}git checkout -b dev-juicer${RESET}"
echo -e "  3. ${YELLOW}git add tools/js/juicer-stack/${RESET}"
echo -e "  4. ${YELLOW}git commit -m \"🧪 Internal: Full Juicer stack integration (dev)\"${RESET}"
echo -e "  5. ${YELLOW}git push origin dev-juicer${RESET}"

echo -e "\n${BLUE}Production Repository (Project Scout):${RESET}"
echo -e "  1. ${YELLOW}cd $SCOUT_REPO_PATH${RESET}"
echo -e "  2. ${YELLOW}./commit_genai_insights.sh${RESET}"
echo -e "  3. ${YELLOW}git push origin feature/genai-retail-advisor${RESET}"

echo -e "\n${CYAN}Remember:${RESET}"
echo -e "  - Review files for any remaining internal references before pushing to production"
echo -e "  - Update documentation to match client terminology if needed"
echo -e "  - Test dashboard functionality in client environment"

echo -e "\n${GREEN}${BOLD}Good luck with your deployment!${RESET}"