#!/bin/bash
# whitelabel_simple.sh - Simplified version that doesn't rely on associative arrays
# This script processes files to create white-labeled versions for client repositories

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
echo -e "${BOLD}${MAGENTA}║  White-Label Conversion: Pulser → OpsCore                     ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check that we're in the juicer-stack directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: This script must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Create output directory
echo -e "\n${BLUE}${BOLD}Creating output directory...${RESET}"
mkdir -p "client-facing/output/retail-advisor/dashboards"
mkdir -p "client-facing/output/retail-advisor/notebooks"
mkdir -p "client-facing/output/retail-advisor/config"
mkdir -p "client-facing/output/retail-advisor/docs"

# Function to white-label a file
whitelabel_file() {
  local input_file="$1"
  local output_file="$2"
  local file_type="$3"
  
  echo -e "${YELLOW}Processing: ${input_file}${RESET}"
  
  # Create a copy of the input file
  cp "$input_file" "$output_file"
  
  # Replace agent names
  sed -i '' 's/Claudia/TaskRunner/g' "$output_file"
  sed -i '' 's/Kalaw/KnowledgeModule/g' "$output_file"
  sed -i '' 's/Maya/FlowManager/g' "$output_file"
  sed -i '' 's/Echo/SignalParser/g' "$output_file"
  sed -i '' 's/Sunnies/ChartRenderer/g' "$output_file"
  sed -i '' 's/Caca/QAChecker/g' "$output_file"
  sed -i '' 's/Tide/BackendSwitcher/g' "$output_file"
  sed -i '' 's/Enrico/DataAugmentor/g' "$output_file"
  sed -i '' 's/Basher/SysOpsDaemon/g' "$output_file"
  sed -i '' 's/Plato/AssistantBot/g' "$output_file"
  sed -i '' 's/Rica/SecurityEnforcer/g' "$output_file"
  sed -i '' 's/Tala/FinanceParser/g' "$output_file"
  sed -i '' 's/Toni/MultimodalProcessor/g' "$output_file"
  sed -i '' 's/Datu/DataIntegrator/g' "$output_file"
  sed -i '' 's/Susi/MetricTracker/g' "$output_file"
  
  # Replace Pulser and Juicer
  sed -i '' 's/Pulser/OpsCore/g' "$output_file"
  sed -i '' 's/pulser/opscore/g' "$output_file"
  sed -i '' 's/Juicer/Retail Advisor/g' "$output_file"
  sed -i '' 's/juicer/retail-advisor/g' "$output_file"
  sed -i '' 's/JUICER/RETAIL ADVISOR/g' "$output_file"
  
  # Replace terminology
  sed -i '' 's/Pulser CLI/OpsCore CLI/g' "$output_file"
  sed -i '' 's/Pulser agent system/OpsCore agent system/g' "$output_file"
  sed -i '' 's/Pulser shell/OpsCore shell/g' "$output_file"
  sed -i '' 's/Pulser orchestration/OpsCore orchestration/g' "$output_file"
  sed -i '' 's/Juicer integration/Retail Advisor integration/g' "$output_file"
  sed -i '' 's/Brand mentions/Brand intelligence/g' "$output_file"
  sed -i '' 's/Sketch dashboard/Embedded visualization/g' "$output_file"
  sed -i '' 's/InsightPulseAI/Project Scout/g' "$output_file"
  
  # Special handling for different file types
  case "$file_type" in
    "py")
      # Python files
      sed -i '' 's/from pulser/from opscore/g' "$output_file"
      sed -i '' 's/import pulser/import opscore/g' "$output_file"
      ;;
    "js")
      # JavaScript files
      sed -i '' 's/pulser\./opscore\./g' "$output_file"
      sed -i '' 's/Pulser\./OpsCore\./g' "$output_file"
      ;;
    "yaml"|"yml")
      # YAML files
      sed -i '' 's/pulser:/opscore:/g' "$output_file"
      sed -i '' 's/pulser_/opscore_/g' "$output_file"
      ;;
    "sql")
      # SQL files
      sed -i '' 's/juicer_/retail_advisor_/g' "$output_file"
      sed -i '' 's/pulser_/opscore_/g' "$output_file"
      ;;
  esac
  
  echo -e "${GREEN}Created: ${output_file}${RESET}"
}

# Process notebooks directory
echo -e "\n${BLUE}${BOLD}Processing notebooks...${RESET}"
whitelabel_file "notebooks/juicer_gold_insights.py" "client-facing/output/retail-advisor/notebooks/retail_advisor_gold_insights.py" "py"
whitelabel_file "notebooks/juicer_setup_insights_tables.sql" "client-facing/output/retail-advisor/notebooks/retail_advisor_setup_insights_tables.sql" "sql"

# Process dashboards directory
echo -e "\n${BLUE}${BOLD}Processing dashboards...${RESET}"
whitelabel_file "dashboards/insights_dashboard.html" "client-facing/output/retail-advisor/dashboards/retail_advisor_insights.html" "html"
whitelabel_file "dashboards/insights_visualizer.js" "client-facing/output/retail-advisor/dashboards/insights_visualizer.js" "js"

# Copy config and documentation files
echo -e "\n${BLUE}${BOLD}Copying and processing documentation...${RESET}"
whitelabel_file "GENAI_INSIGHTS_INTEGRATION.md" "client-facing/output/retail-advisor/docs/GenAI_Retail_Advisor.md" "md"
cp "client-facing/LICENSE.txt" "client-facing/output/LICENSE.txt"
cp "client-facing/NOTICE.md" "client-facing/output/NOTICE.md"
cp "client-facing/opscore-config.yaml" "client-facing/output/retail-advisor/config/opscore-config.yaml"
cp "client-facing/retail-advisor-hook.yaml" "client-facing/output/retail-advisor/config/retail-advisor-hook.yaml"

# Create installer script
echo -e "\n${BLUE}${BOLD}Creating installer script...${RESET}"
cat > "client-facing/output/install_opscore.sh" << EOL
#!/bin/bash
# OpsCore Installer for Project Scout
# This script installs the OpsCore CLI and Retail Advisor components

# Create config directory
mkdir -p ~/.opscore/hooks/

# Copy configuration files
cp retail-advisor/config/opscore-config.yaml ~/.opscore/
cp retail-advisor/config/retail-advisor-hook.yaml ~/.opscore/hooks/

# Set up CLI
npm install -g opscore-cli

# Configure environment
echo 'export PATH=\$PATH:~/.opscore/bin' >> ~/.bashrc
echo 'export OPSCORE_HOME=~/.opscore' >> ~/.bashrc

# Set up aliases
cat > ~/.opscore_aliases << EOF
alias opscore='opscore-cli'
alias :retail-advisor='opscore retail-advisor'
EOF

echo 'source ~/.opscore_aliases' >> ~/.bashrc

# Complete installation
echo "OpsCore installation complete!"
echo "Restart your terminal or run 'source ~/.bashrc' to start using OpsCore"
EOL

chmod +x "client-facing/output/install_opscore.sh"

# Copy README to output
cp "client-facing/output/README.md" "client-facing/output/README.md" 2>/dev/null || echo -e "${YELLOW}README.md not found in client-facing/output/. Creating a basic one.${RESET}"

# If README doesn't exist, create a basic one
if [[ ! -f "client-facing/output/README.md" ]]; then
  cat > "client-facing/output/README.md" << EOL
# Retail Advisor - Intelligent Analytics

This repository contains the Retail Advisor component of Project Scout, powered by the OpsCore agent framework.

## Overview

Retail Advisor provides AI-powered analytics for customer interactions, enabling:

- Brand mention detection and sentiment analysis
- Automated insight generation from customer transcripts
- Interactive visualizations and dashboards
- Action recommendation system

## Components

The repository is organized into the following components:

- \`retail-advisor/dashboards/\`: Visualization components
- \`retail-advisor/notebooks/\`: Data processing pipelines
- \`retail-advisor/config/\`: System configuration
- \`retail-advisor/docs/\`: Documentation files

## Getting Started

See the installation guide in \`install_opscore.sh\`.

## License

This project is licensed under the terms specified in LICENSE.txt.
EOL
fi

# Summary
echo -e "\n${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  White-Label Conversion Complete!                              ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"

echo -e "\n${GREEN}${BOLD}All files have been successfully white-labeled.${RESET}"
echo -e "Client-facing files are located in: ${CYAN}client-facing/output/${RESET}"

echo -e "\n${BLUE}White-label process summary:${RESET}"
echo -e "  - Converted ${YELLOW}Pulser${RESET} → ${CYAN}OpsCore${RESET}"
echo -e "  - Converted ${YELLOW}Juicer${RESET} → ${CYAN}Retail Advisor${RESET}"
echo -e "  - Replaced all agent names with client-facing aliases"
echo -e "  - Created proper license and notice files"
echo -e "  - Generated client-ready documentation"
echo -e "  - Created installer script for client deployment"

echo -e "\n${YELLOW}Next steps:${RESET}"
echo -e "1. Review the white-labeled files to ensure all references are properly converted"
echo -e "2. Test the installer script in an isolated environment"
echo -e "3. Prepare the client repository with the white-labeled files"
echo -e "4. Create a pull request for the client-facing repository"

echo -e "\n${CYAN}Don't forget:${RESET} When merging code from internal repos to client repos,"
echo -e "always run this script first to ensure proper white-labeling and IP protection."