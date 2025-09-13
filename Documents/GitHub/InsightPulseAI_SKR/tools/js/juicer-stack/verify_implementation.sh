#!/bin/bash
# verify_implementation.sh - Verify that all GenAI Insights components are implemented
# This script checks for the presence of all required files and components

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Juicer GenAI Insights Implementation Verification         ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check that we're in the juicer-stack directory
if [[ ! $(basename "$PWD") == "juicer-stack" ]]; then
  echo -e "${RED}Error: This script must be run from the juicer-stack directory${RESET}"
  exit 1
fi

# Function to check for file existence
check_file() {
  local file="$1"
  local description="$2"
  local required="$3"  # true/false
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ Found${RESET}: $file"
    return 0
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Missing (REQUIRED)${RESET}: $file - $description"
      return 1
    else
      echo -e "${YELLOW}⚠️ Missing (Optional)${RESET}: $file - $description"
      return 0
    fi
  fi
}

# Function to check directory exists and is not empty
check_directory() {
  local dir="$1"
  local description="$2"
  local required="$3"  # true/false
  
  if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Found${RESET}: $dir"
    return 0
  elif [ -d "$dir" ]; then
    if [ "$required" = "true" ]; then
      echo -e "${YELLOW}⚠️ Empty directory (REQUIRED)${RESET}: $dir - $description"
      return 1
    else
      echo -e "${YELLOW}⚠️ Empty directory (Optional)${RESET}: $dir - $description"
      return 0
    fi
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Missing directory (REQUIRED)${RESET}: $dir - $description"
      return 1
    else
      echo -e "${YELLOW}⚠️ Missing directory (Optional)${RESET}: $dir - $description"
      return 0
    fi
  fi
}

# Function to check file content for key patterns
check_content() {
  local file="$1"
  local pattern="$2"
  local description="$3"
  
  if [ -f "$file" ]; then
    if grep -q "$pattern" "$file"; then
      echo -e "${GREEN}✅ Verified${RESET}: $description in $file"
      return 0
    else
      echo -e "${YELLOW}⚠️ Not found${RESET}: $description in $file"
      return 1
    fi
  else
    echo -e "${RED}❌ Cannot check${RESET}: File $file does not exist"
    return 1
  fi
}

# Initialize counters
total_checks=0
passed_checks=0
failed_checks=0
warn_checks=0

# Check for essential directories
echo -e "\n${BLUE}${BOLD}Checking essential directories...${RESET}"
check_directory "notebooks" "Databricks notebooks directory" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_directory "dashboards" "Dashboard HTML/JS files directory" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_directory "pulser" "Pulser CLI integration files" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_directory "cli" "CLI tools directory" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_directory "github_workflows" "GitHub Actions workflow files" "false"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_directory "client-facing" "White-labeled client files" "false"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

# Check for essential notebooks
echo -e "\n${BLUE}${BOLD}Checking essential notebooks...${RESET}"
check_file "notebooks/juicer_gold_insights.py" "Gold layer insights generation" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "notebooks/juicer_setup_insights_tables.sql" "Platinum layer schema setup" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "notebooks/juicer_ingest_bronze.sql" "Bronze layer data ingestion" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "notebooks/juicer_enrich_silver.py" "Silver layer data enrichment" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "notebooks/juicer_setup_storage.py" "Storage mounts configuration" "false"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

# Check for essential dashboard files
echo -e "\n${BLUE}${BOLD}Checking dashboard files...${RESET}"
check_file "dashboards/insights_dashboard.html" "Interactive insights dashboard" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "dashboards/insights_visualizer.js" "Dashboard JavaScript library" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "dashboards/agent_brand_heatmap.dbviz" "Brand mentions heatmap" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

# Check for essential CLI and QA tools
echo -e "\n${BLUE}${BOLD}Checking CLI and QA tools...${RESET}"
check_file "cli/juicer_cli.py" "Juicer CLI tool" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "cli/requirements.txt" "CLI requirements file" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "insights_validator.js" "Insights validation tool" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "dashboard_qa.js" "Dashboard visual QA tool" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

# Check for essential Pulser integration files
echo -e "\n${BLUE}${BOLD}Checking Pulser integration files...${RESET}"
check_file "pulser/juicer_hook.yaml" "Juicer Pulser hook" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "pulser/insights_hook.yaml" "GenAI insights Pulser hook" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

# Check for essential documentation
echo -e "\n${BLUE}${BOLD}Checking documentation files...${RESET}"
check_file "README.md" "Main README file" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "GENAI_INSIGHTS_INTEGRATION.md" "GenAI insights architecture documentation" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "DEPLOYMENT.md" "Deployment instructions" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "IMPLEMENTATION_PLAN.md" "Implementation roadmap" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "DEVELOPER.md" "Developer guide" "false"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

# Check for deployment and utility scripts
echo -e "\n${BLUE}${BOLD}Checking deployment and utility scripts...${RESET}"
check_file "whitelabel_simple.sh" "White-labeling script" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "dual_repo_push.sh" "Dual repository push script" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "github_workflows/deploy-insights.yml" "GenAI insights deployment workflow" "false"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_file "commit_juicer.sh" "Juicer commit script" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

check_file "install.sh" "Installation script" "true"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((failed_checks++)); fi; ((total_checks++))

# Check for content in key files
echo -e "\n${BLUE}${BOLD}Checking key file contents...${RESET}"
check_content "notebooks/juicer_gold_insights.py" "LLM_PROVIDERS" "LLM provider configuration"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_content "notebooks/juicer_gold_insights.py" "generate_insight_prompt" "Insight prompt template generator"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_content "notebooks/juicer_setup_insights_tables.sql" "CREATE TABLE insight_pulse_ai.platinum.genai_insights" "Platinum layer insights table"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_content "pulser/insights_hook.yaml" "triggers" "Command trigger configuration"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

check_content "insights_validator.js" "validateInsights" "Insight validation function"; 
if [ $? -eq 0 ]; then ((passed_checks++)); else ((warn_checks++)); fi; ((total_checks++))

# Summary
echo -e "\n${BLUE}${BOLD}Verification Summary${RESET}"
echo -e "-----------------------------------"
echo -e "Total checks: ${total_checks}"
echo -e "${GREEN}Passed: ${passed_checks}${RESET}"
echo -e "${RED}Failed: ${failed_checks}${RESET}"
echo -e "${YELLOW}Warnings: ${warn_checks}${RESET}"

# Determine overall status
if [ $failed_checks -eq 0 ]; then
  if [ $warn_checks -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✅ All components verified! Implementation is complete.${RESET}"
    exit 0
  else
    echo -e "\n${YELLOW}${BOLD}⚠️ Implementation is complete with some optional components missing.${RESET}"
    exit 0
  fi
else
  echo -e "\n${RED}${BOLD}❌ Implementation is incomplete. ${failed_checks} required components are missing.${RESET}"
  exit 1
fi