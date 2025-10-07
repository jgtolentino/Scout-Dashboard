#!/bin/bash
# whitelabel.sh - Convert internal Pulser agent references to client-facing OpsCore aliases
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

# Load the alias mapping from YAML
echo -e "${BLUE}${BOLD}Loading alias mapping...${RESET}"
if [[ ! -f "client-facing/alias_map.yaml" ]]; then
  echo -e "${RED}Error: alias_map.yaml not found in client-facing directory${RESET}"
  exit 1
fi

# Function to extract keys and values from YAML
parse_yaml() {
  local yaml_file="$1"
  local prefix="$2"
  local s
  s='[[:space:]]*'
  w='[a-zA-Z0-9_]*'
  fs=$(echo @|tr @ '\034')
  
  # Extract key-value pairs using sed and awk
  sed -ne "s|^\($s\):|\1|" \
      -e "s|^\($s\)\($w\)$s:$s[\"']\(.*\)[\"']$s\$|\1$fs\2$fs\3|p" \
      -e "s|^\($s\)\($w\)$s:$s\(.*\)$s\$|\1$fs\2$fs\3|p" "$yaml_file" |
  awk -F$fs '{
    indent = length($1)/2;
    key = $2;
    value = $3;
    
    if (indent == 0) {
      section = key;
    } else {
      if (key != "" && value != "") {
        printf("%s_%s=\"%s\"\n", section, key, value);
      }
    }
  }'
}

# Create a temporary file with variable assignments
temp_vars=$(mktemp)
parse_yaml "client-facing/alias_map.yaml" > "$temp_vars"

# Source the variables
source "$temp_vars"

# Extract agent aliases from the variables
declare -A agent_map
for line in $(cat "$temp_vars" | grep "agent_aliases_"); do
  key=$(echo "$line" | cut -d = -f 1 | sed 's/agent_aliases_//')
  value=$(echo "$line" | cut -d = -f 2 | sed 's/"//g')
  agent_map["$key"]="$value"
done

# Extract terminology mappings
declare -A term_map
for line in $(cat "$temp_vars" | grep "terminology_"); do
  key=$(echo "$line" | cut -d = -f 1 | sed 's/terminology_//')
  value=$(echo "$line" | cut -d = -f 2 | sed 's/"//g')
  term_map["$key"]="$value"
done

# Clean up temp file
rm "$temp_vars"

# Show the loaded mappings
echo -e "${GREEN}Agent Mappings:${RESET}"
for key in "${!agent_map[@]}"; do
  echo -e "  ${YELLOW}$key${RESET} → ${CYAN}${agent_map[$key]}${RESET}"
done

# Create output directory
echo -e "\n${BLUE}${BOLD}Creating output directory...${RESET}"
mkdir -p "client-facing/output"

# Function to white-label a file
whitelabel_file() {
  local input_file="$1"
  local output_file="$2"
  local file_type="$3"
  
  echo -e "${YELLOW}Processing: ${input_file}${RESET}"
  
  # Create a copy of the input file
  cp "$input_file" "$output_file"
  
  # Replace agent names
  for key in "${!agent_map[@]}"; do
    value="${agent_map[$key]}"
    # Replace exact matches with word boundaries
    sed -i '' -E "s/\\b${key}\\b/${value}/g" "$output_file"
  done
  
  # Replace terminology in documentation files
  if [[ "$file_type" == "md" || "$file_type" == "txt" || "$file_type" == "html" ]]; then
    for key in "${!term_map[@]}"; do
      value="${term_map[$key]}"
      # Use straight replacement as these are phrases
      sed -i '' "s|${key}|${value}|g" "$output_file"
    done
  fi
  
  # Special handling for different file types
  case "$file_type" in
    "py")
      # Python files
      sed -i '' 's/pulser_/opscore_/g' "$output_file"
      sed -i '' 's/from pulser/from opscore/g' "$output_file"
      sed -i '' 's/import pulser/import opscore/g' "$output_file"
      sed -i '' 's/Juicer/RetailAdvisor/g' "$output_file"
      sed -i '' 's/juicer_/retail_advisor_/g' "$output_file"
      ;;
    "js")
      # JavaScript files
      sed -i '' 's/pulser\./opscore\./g' "$output_file"
      sed -i '' 's/Pulser\./OpsCore\./g' "$output_file"
      sed -i '' 's/Juicer/RetailAdvisor/g' "$output_file"
      sed -i '' 's/juicer\./retailAdvisor\./g' "$output_file"
      ;;
    "yaml"|"yml")
      # YAML files
      sed -i '' 's/pulser:/opscore:/g' "$output_file"
      sed -i '' 's/pulser_/opscore_/g' "$output_file"
      sed -i '' 's/juicer/retail-advisor/g' "$output_file"
      sed -i '' 's/Juicer/RetailAdvisor/g' "$output_file"
      ;;
    "html")
      # HTML files
      sed -i '' 's/pulser/opscore/g' "$output_file"
      sed -i '' 's/Pulser/OpsCore/g' "$output_file"
      sed -i '' 's/Juicer/Retail Advisor/g' "$output_file"
      sed -i '' 's/juicer/retail-advisor/g' "$output_file"
      sed -i '' 's/InsightPulseAI/Project Scout/g' "$output_file"
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
mkdir -p "client-facing/output/notebooks"
whitelabel_file "notebooks/juicer_gold_insights.py" "client-facing/output/notebooks/retail_advisor_gold_insights.py" "py"
whitelabel_file "notebooks/juicer_setup_insights_tables.sql" "client-facing/output/notebooks/retail_advisor_setup_insights_tables.sql" "sql"

# Process dashboards directory
echo -e "\n${BLUE}${BOLD}Processing dashboards...${RESET}"
mkdir -p "client-facing/output/dashboards"
whitelabel_file "dashboards/insights_dashboard.html" "client-facing/output/dashboards/retail_advisor_insights_dashboard.html" "html"
whitelabel_file "dashboards/insights_visualizer.js" "client-facing/output/dashboards/retail_advisor_insights_visualizer.js" "js"

# Copy config files
echo -e "\n${BLUE}${BOLD}Copying client-facing files...${RESET}"
mkdir -p "client-facing/output/config"
cp "client-facing/opscore-config.yaml" "client-facing/output/config/"
cp "client-facing/retail-advisor-hook.yaml" "client-facing/output/config/"
cp "client-facing/LICENSE.txt" "client-facing/output/"
cp "client-facing/NOTICE.md" "client-facing/output/"

# Create documentation
echo -e "\n${BLUE}${BOLD}Creating client-facing documentation...${RESET}"
mkdir -p "client-facing/output/docs"

cat > "client-facing/output/docs/README.md" << EOL
# Retail Advisor - Intelligent Analytics

This repository contains the Retail Advisor component of Project Scout, powered by the OpsCore agent framework.

## Overview

Retail Advisor provides AI-powered analytics for customer interactions, enabling:

- Brand mention detection and sentiment analysis
- Automated insight generation from customer transcripts
- Interactive visualizations and dashboards
- Action recommendation system

## Components

### Dashboards

The \`dashboards/\` directory contains visualization components:

- \`retail_advisor_insights_dashboard.html\`: Interactive dashboard for insights
- \`retail_advisor_insights_visualizer.js\`: JavaScript visualization library

### Notebooks

The \`notebooks/\` directory contains data processing pipelines:

- \`retail_advisor_gold_insights.py\`: Generates insights from transcript data
- \`retail_advisor_setup_insights_tables.sql\`: Creates database structure

### Configuration

The \`config/\` directory contains:

- \`opscore-config.yaml\`: System configuration
- \`retail-advisor-hook.yaml\`: Command routing configuration

## Getting Started

1. Install the OpsCore CLI:
   \`\`\`bash
   ./install_opscore.sh
   \`\`\`

2. Configure Retail Advisor integration:
   \`\`\`bash
   opscore config --set retail_advisor=true
   \`\`\`

3. Run your first insight generation:
   \`\`\`bash
   :retail-advisor insights generate --days 7
   \`\`\`

## License

This project is licensed under the terms specified in LICENSE.txt.
EOL

echo -e "\n${BLUE}${BOLD}Creating OpsCore installer script...${RESET}"
cat > "client-facing/output/install_opscore.sh" << EOL
#!/bin/bash
# OpsCore Installer for Project Scout
# This script installs the OpsCore CLI and Retail Advisor components

# Create config directory
mkdir -p ~/.opscore/hooks/

# Copy configuration files
cp config/opscore-config.yaml ~/.opscore/
cp config/retail-advisor-hook.yaml ~/.opscore/hooks/

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