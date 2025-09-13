#!/bin/bash
# demo_genai_integration.sh - Demonstrates the GenAI insights integration

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  GenAI Insights Integration Demo                            ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
INPUT_DIAGRAM="/Users/tbwa/Downloads/Worked_project_scout_official_icons.drawio"
OUTPUT_DIAGRAM="/Users/tbwa/Downloads/Updated_project_scout_with_genai.drawio"
DOCS_DIR="${PROJECT_ROOT}/docs"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${RESET}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${RESET}"
    echo -e "${YELLOW}Please install Node.js to continue:${RESET}"
    echo -e "   https://nodejs.org/en/download/"
    exit 1
fi

echo -e "${GREEN}Node.js detected: $(node -v)${RESET}"

# Check for input diagram
if [ ! -f "$INPUT_DIAGRAM" ]; then
    echo -e "${RED}Error: Input diagram not found at ${INPUT_DIAGRAM}${RESET}"
    echo -e "${YELLOW}Please provide a valid path to the input diagram:${RESET}"
    echo -e "${YELLOW}  ./demo_genai_integration.sh input.drawio output.drawio${RESET}"
    exit 1
fi

echo -e "${GREEN}Input diagram found at: ${INPUT_DIAGRAM}${RESET}"

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${RESET}"
mkdir -p "${PROJECT_ROOT}/docs/diagrams"
mkdir -p "${PROJECT_ROOT}/output/insights"
mkdir -p "${PROJECT_ROOT}/output/dashboard"
mkdir -p "${PROJECT_ROOT}/output/visualizations"

# Step 1: Update the diagram
echo -e "\n${BOLD}Step 1: Updating Project Scout Diagram with GenAI Components${RESET}"
echo -e "${BLUE}Running diagram update script...${RESET}"

"${SCRIPT_DIR}/update_project_scout_diagram.sh" "${INPUT_DIAGRAM}" "${OUTPUT_DIAGRAM}"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error updating diagram. Exiting.${RESET}"
    exit 1
fi

echo -e "${GREEN}Diagram updated successfully!${RESET}"

# Step 2: Generate sample insights
echo -e "\n${BOLD}Step 2: Generating Sample Insights${RESET}"
echo -e "${BLUE}Running insights generator in demo mode...${RESET}"

# Run in simulated mode
node "${SCRIPT_DIR}/insights_generator.js" --days 30 --model claude --output "${PROJECT_ROOT}/output/insights"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error generating insights. Continuing with limited functionality.${RESET}"
else
    echo -e "${GREEN}Sample insights generated successfully!${RESET}"
    
    # Display number of insights generated
    if [ -f "${PROJECT_ROOT}/output/insights/insights_summary.json" ]; then
        INSIGHTS_COUNT=$(cat "${PROJECT_ROOT}/output/insights/insights_summary.json" | node -e "try { const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.results.insights_generated); } catch(e) { console.log('Unknown'); }")
        echo -e "${BLUE}Generated ${INSIGHTS_COUNT} sample insights${RESET}"
    fi
fi

# Step 3: Create visualization
echo -e "\n${BOLD}Step 3: Creating Insights Visualization${RESET}"
echo -e "${BLUE}Running visualization generator...${RESET}"

# Prepare and copy dashboard files
cp "${PROJECT_ROOT}/dashboards/insights_dashboard.html" "${PROJECT_ROOT}/output/dashboard/index.html"
cp "${PROJECT_ROOT}/dashboards/insights_visualizer.js" "${PROJECT_ROOT}/output/dashboard/"

# Make a more detailed visualization
node "${SCRIPT_DIR}/pulser_insights_cli.js" visualize --type bar --group brand --output "${PROJECT_ROOT}/output/visualizations/brand_insights.html"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error creating visualization. Continuing with limited functionality.${RESET}"
else
    echo -e "${GREEN}Visualization created successfully!${RESET}"
    echo -e "${BLUE}Visualization saved to: ${PROJECT_ROOT}/output/visualizations/brand_insights.html${RESET}"
fi

# Step 4: Generate executive summary
echo -e "\n${BOLD}Step 4: Generating Executive Summary${RESET}"
echo -e "${BLUE}Creating executive summary report...${RESET}"

node "${SCRIPT_DIR}/pulser_insights_cli.js" summarize --days 30 --format markdown --output "${PROJECT_ROOT}/output/insights/executive_summary.md"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error generating summary. Continuing with limited functionality.${RESET}"
else
    echo -e "${GREEN}Executive summary created successfully!${RESET}"
    echo -e "${BLUE}Summary saved to: ${PROJECT_ROOT}/output/insights/executive_summary.md${RESET}"
    
    # Display beginning of summary
    echo -e "\n${YELLOW}Executive Summary Preview:${RESET}"
    head -n 10 "${PROJECT_ROOT}/output/insights/executive_summary.md"
    echo -e "${YELLOW}...${RESET}"
fi

# Step 5: Create Integration Document
echo -e "\n${BOLD}Step 5: Creating Integration Document${RESET}"
echo -e "${BLUE}Preparing integration documentation...${RESET}"

# Create README with integration details
INTEGRATION_README="${PROJECT_ROOT}/README_GENAI_INTEGRATION.md"

cat > "${INTEGRATION_README}" << EOL
# GenAI Insights Integration for Project Scout

This document provides an overview of the GenAI Insights integration implemented for Project Scout, which enhances the system with AI-powered insights generation from transcript data.

## Overview

The GenAI Insights system transforms transcript data from the Gold layer into actionable business intelligence using advanced language models (Claude, OpenAI, DeepSeek) with custom prompting. This adds a new Platinum layer to the Medallion architecture, specifically for AI-generated insights.

## Components Implemented

1. **LLM Integration for Insights Generation**
   - Multi-model support (Claude/OpenAI/DeepSeek)
   - Fallback mechanisms for high availability
   - Custom prompting for different insight types
   - Confidence scoring and metadata tagging

2. **Platinum Layer Data Schema**
   - Tables for insights and recommended actions
   - Views for common query patterns (by brand, type, trending)
   - Delta Lake integration for ACID transactions

3. **Dashboard and Visualization**
   - Interactive dashboard for insights exploration
   - Filtering by brand, insight type, confidence
   - Charts for brand analysis and sentiment trends
   - Tag cloud for trending topics

4. **CLI Tools for Management**
   - Generation of insights on demand
   - Visualization of insights with various charts
   - Executive summary creation
   - Dashboard management

5. **Agent Integration**
   - Pulser agent integration via YAML configuration
   - Natural language query interpretation
   - Command routing to appropriate handlers
   - Scheduled execution of insights generation

## Architecture Diagram

The updated architecture diagram shows the integration of GenAI insights components:

![Project Scout with GenAI Integration](docs/diagrams/project_scout_with_genai.png)

## Getting Started

To use the GenAI insights system:

1. **Generate Insights**
   \`\`\`bash
   ./tools/run_insights_generator.sh --days 30 --model claude
   \`\`\`

2. **View Insights**
   \`\`\`bash
   ./tools/pulser_insights_cli.js show --type brand --brand "Jollibee" --limit 5
   \`\`\`

3. **Visualize Insights**
   \`\`\`bash
   ./tools/pulser_insights_cli.js visualize --type heatmap --group brand --show
   \`\`\`

4. **Generate Summary**
   \`\`\`bash
   ./tools/pulser_insights_cli.js summarize --days 7 --format markdown --output summary.md
   \`\`\`

## Documentation

For detailed information, refer to:

- [GenAI Insights Tools](tools/README_GENAI_TOOLS.md) - Comprehensive documentation of tools
- [Diagram Updates](GENAI_DIAGRAM_UPDATES.md) - Explanation of architecture updates
- [Integration Plan](GENAI_INSIGHTS_INTEGRATION.md) - Original integration plan
EOL

echo -e "${GREEN}Integration documentation created at: ${INTEGRATION_README}${RESET}"

# Step 6: Display Final Summary
echo -e "\n${BOLD}Step 6: Integration Demo Summary${RESET}"
echo -e "${GREEN}=====================================${RESET}"
echo -e "${GREEN}GenAI Insights Integration Demo Complete!${RESET}"
echo -e "${GREEN}=====================================${RESET}"

echo -e "\n${BLUE}Components Implemented:${RESET}"
echo -e "1. Updated Project Scout architecture diagram with Platinum layer"
echo -e "2. Implemented insights generation scripts with multi-model support"
echo -e "3. Created dashboard visualizations for insights"
echo -e "4. Added CLI tools for insights management"
echo -e "5. Generated comprehensive documentation"

echo -e "\n${BLUE}Output Files:${RESET}"
echo -e "- Updated Diagram: ${OUTPUT_DIAGRAM}"
echo -e "- Sample Insights: ${PROJECT_ROOT}/output/insights/insights_summary.json"
echo -e "- Visualization: ${PROJECT_ROOT}/output/visualizations/brand_insights.html"
echo -e "- Executive Summary: ${PROJECT_ROOT}/output/insights/executive_summary.md"
echo -e "- Integration Docs: ${INTEGRATION_README}"

echo -e "\n${BLUE}Next Steps:${RESET}"
echo -e "1. Review the updated diagram and documentation"
echo -e "2. Set up scheduled insights generation using Pulser agents"
echo -e "3. Integrate dashboard with existing monitoring systems"
echo -e "4. Train team members on using the insights system"

echo -e "\n${GREEN}Demo complete! Thank you for exploring the GenAI insights integration.${RESET}"