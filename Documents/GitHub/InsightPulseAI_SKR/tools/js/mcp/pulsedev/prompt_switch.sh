#!/bin/bash
# prompt_switch.sh - Simple CLI tool for managing MCP prompts in PulseDev
# 
# This script provides convenient access to the prompt management features
# of PulseDev from the command line.

# Configuration
API_BASE="http://localhost:5000/api/ai"

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_usage() {
  echo -e "${BOLD}PulseDev Prompt Switch${NC}"
  echo
  echo "Usage:"
  echo "  $0 list                      # List all available prompts"
  echo "  $0 info <prompt_name>        # Get detailed info about a prompt"
  echo "  $0 switch <prompt_name>      # Switch to a specific prompt"
  echo "  $0 recommend \"<query>\"       # Get prompt recommendations based on query"
  echo "  $0 status                    # Show current prompt status"
  echo "  $0 aliases <task_type>       # Find prompts matching a task type/alias"
  echo 
  echo "Examples:"
  echo "  $0 list"
  echo "  $0 switch gamma/presentation_creator"
  echo "  $0 recommend \"Design a user profile page with responsive layout\""
  echo "  $0 aliases ui"
}

check_dependencies() {
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
  fi
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Please install it with: brew install jq (macOS) or apt install jq (Linux)"
    exit 1
  fi
}

list_prompts() {
  echo -e "${BOLD}Available MCP Prompts${NC}"
  echo
  
  response=$(curl -s "$API_BASE/prompts?include_metadata=true")
  
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}Error: Failed to connect to PulseDev API${NC}"
    echo "Make sure PulseDev is running."
    exit 1
  fi
  
  active_prompt=$(echo "$response" | jq -r '.active_prompt')
  
  echo "$response" | jq -c '.prompts[]' | while read -r prompt; do
    name=$(echo "$prompt" | jq -r '.name')
    description=$(echo "$prompt" | jq -r '.metadata.description // "No description"')
    access=$(echo "$prompt" | jq -r '.access_level // "internal"')
    is_active=$(echo "$prompt" | jq -r '.active')
    
    # Format based on access level and active status
    if [[ "$is_active" == "true" ]]; then
      echo -e "${GREEN}➜ ${BOLD}$name${NC} - $description ${YELLOW}[$access]${NC}"
    elif [[ "$access" == "public" ]]; then
      echo -e "  ${BOLD}$name${NC} - $description ${GREEN}[$access]${NC}"
    elif [[ "$access" == "beta" ]]; then
      echo -e "  ${BOLD}$name${NC} - $description ${YELLOW}[$access]${NC}"
    else
      echo -e "  ${BOLD}$name${NC} - $description ${RED}[$access]${NC}"
    fi
  done
  
  echo
  echo -e "Active prompt: ${GREEN}$active_prompt${NC}"
}

get_prompt_info() {
  if [[ -z "$1" ]]; then
    echo -e "${RED}Error: Prompt name is required${NC}"
    print_usage
    exit 1
  fi
  
  prompt_name=$1
  
  echo -e "${BOLD}Prompt Details: ${BLUE}$prompt_name${NC}"
  echo
  
  response=$(curl -s "$API_BASE/prompts/$prompt_name")
  
  if [[ $? -ne 0 || $(echo "$response" | jq -r '.error // ""') != "" ]]; then
    echo -e "${RED}Error: $(echo "$response" | jq -r '.error // "Failed to fetch prompt info"')${NC}"
    exit 1
  fi
  
  # Extract and display basic info
  name=$(echo "$response" | jq -r '.name')
  description=$(echo "$response" | jq -r '.metadata.description // "No description"')
  access=$(echo "$response" | jq -r '.access_level // "internal"')
  is_active=$(echo "$response" | jq -r '.active')
  
  echo -e "${BOLD}Name:${NC} $name"
  echo -e "${BOLD}Description:${NC} $description"
  echo -e "${BOLD}Access Level:${NC} $access"
  echo -e "${BOLD}Active:${NC} $is_active"
  echo
  
  # Extract and display capabilities
  echo -e "${BOLD}Capabilities:${NC}"
  echo "$response" | jq -r '.metadata.capabilities[]? // empty' | while read -r capability; do
    echo -e "  • $capability"
  done
  echo
  
  # Extract and display use cases
  echo -e "${BOLD}Use Cases:${NC}"
  echo "$response" | jq -r '.metadata.use_cases[]? // empty' | while read -r use_case; do
    echo -e "  • $use_case"
  done
  echo
  
  # Extract and display dependencies
  echo -e "${BOLD}Dependencies:${NC}"
  if [[ $(echo "$response" | jq -r '.requires | length // 0') -eq 0 ]]; then
    echo "  None specified"
  else
    echo "$response" | jq -r '.requires[]? // empty' | while read -r dependency; do
      echo -e "  • $dependency"
    done
  fi
  echo
  
  # Extract and display aliases
  echo -e "${BOLD}Aliases:${NC}"
  if [[ $(echo "$response" | jq -r '.metadata.aliases | length // 0') -eq 0 ]]; then
    echo "  None specified"
  else
    echo "$response" | jq -r '.metadata.aliases[]? // empty' | while read -r alias; do
      echo -e "  • $alias"
    done
  fi
}

switch_prompt() {
  if [[ -z "$1" ]]; then
    echo -e "${RED}Error: Prompt name is required${NC}"
    print_usage
    exit 1
  fi
  
  prompt_name=$1
  
  echo -e "Switching to prompt: ${BLUE}$prompt_name${NC}"
  
  response=$(curl -s -X POST "$API_BASE/prompts/load" \
    -H "Content-Type: application/json" \
    -d "{\"prompt_name\": \"$prompt_name\"}")
  
  if [[ $? -ne 0 || $(echo "$response" | jq -r '.status // ""') != "success" ]]; then
    echo -e "${RED}Error: $(echo "$response" | jq -r '.detail // "Failed to switch prompt"')${NC}"
    exit 1
  fi
  
  active_prompt=$(echo "$response" | jq -r '.active_prompt')
  echo -e "${GREEN}Successfully switched to prompt: $active_prompt${NC}"
}

recommend_prompts() {
  if [[ -z "$1" ]]; then
    echo -e "${RED}Error: Query text is required${NC}"
    print_usage
    exit 1
  fi
  
  query=$1
  
  echo -e "${BOLD}Prompt Recommendations for:${NC} $query"
  echo
  
  response=$(curl -s -X POST "$API_BASE/prompts/recommend" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"max_recommendations\": 3}")
  
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}Error: Failed to get recommendations${NC}"
    exit 1
  fi
  
  # Extract and display hint information
  prompt_hint=$(echo "$response" | jq -r '.prompt_hint // "None"')
  if [[ "$prompt_hint" != "None" && "$prompt_hint" != "null" ]]; then
    echo -e "${BOLD}Detected hint:${NC} $prompt_hint"
    echo
  fi
  
  # Extract and display recommendations
  echo -e "${BOLD}Top Recommendations:${NC}"
  echo
  
  echo "$response" | jq -c '.recommendations[]' | while read -r recommendation; do
    name=$(echo "$recommendation" | jq -r '.name')
    score=$(echo "$recommendation" | jq -r '.score')
    description=$(echo "$recommendation" | jq -r '.metadata.description // "No description"')
    
    # Score-based formatting
    if [[ $score -gt 80 ]]; then
      echo -e "${GREEN}${BOLD}$name${NC} (Score: $score)"
    elif [[ $score -gt 40 ]]; then
      echo -e "${YELLOW}${BOLD}$name${NC} (Score: $score)"
    else
      echo -e "${BOLD}$name${NC} (Score: $score)"
    fi
    echo -e "  $description"
    echo
  done
  
  echo -e "To switch to a recommended prompt, use: ${BOLD}$0 switch [prompt_name]${NC}"
}

get_status() {
  echo -e "${BOLD}PulseDev MCP Status${NC}"
  echo
  
  response=$(curl -s "$API_BASE/status?detail=true")
  
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}Error: Failed to connect to PulseDev API${NC}"
    echo "Make sure PulseDev is running."
    exit 1
  fi
  
  status=$(echo "$response" | jq -r '.status')
  model=$(echo "$response" | jq -r '.model // "unknown"')
  active_prompt=$(echo "$response" | jq -r '.active_prompt // "None"')
  memory_state=$(echo "$response" | jq -r '.memory_state // "unknown"')
  
  echo -e "${BOLD}Connection:${NC} $status"
  echo -e "${BOLD}Model:${NC} $model"
  echo -e "${BOLD}Active Prompt:${NC} $active_prompt"
  echo -e "${BOLD}Memory State:${NC} $memory_state"
  
  # Get prompt details if active
  if [[ "$active_prompt" != "None" && "$active_prompt" != "null" ]]; then
    prompt_info=$(curl -s "$API_BASE/prompts/$active_prompt")
    description=$(echo "$prompt_info" | jq -r '.metadata.description // "No description"')
    echo
    echo -e "${BOLD}Active Prompt Description:${NC}"
    echo -e "  $description"
  fi
}

find_aliases() {
  if [[ -z "$1" ]]; then
    echo -e "${RED}Error: Task type or alias is required${NC}"
    print_usage
    exit 1
  fi
  
  alias=$1
  
  echo -e "${BOLD}Prompts matching alias:${NC} $alias"
  echo
  
  response=$(curl -s "$API_BASE/prompts?include_metadata=true")
  
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}Error: Failed to connect to PulseDev API${NC}"
    exit 1
  fi
  
  matches=0
  
  echo "$response" | jq -c '.prompts[]' | while read -r prompt; do
    name=$(echo "$prompt" | jq -r '.name')
    
    # Check if alias is in name
    if [[ "$name" == *"$alias"* ]]; then
      description=$(echo "$prompt" | jq -r '.metadata.description // "No description"')
      echo -e "${BOLD}$name${NC} - $description"
      matches=$((matches+1))
      continue
    fi
    
    # Check if alias is in aliases
    aliases=$(echo "$prompt" | jq -r '.metadata.aliases[]? // empty')
    if echo "$aliases" | grep -q "$alias"; then
      description=$(echo "$prompt" | jq -r '.metadata.description // "No description"')
      echo -e "${BOLD}$name${NC} - $description"
      matches=$((matches+1))
      continue
    fi
  done
  
  if [[ $matches -eq 0 ]]; then
    echo -e "${YELLOW}No prompts found matching: $alias${NC}"
    echo "Try a different alias or check available prompts with '$0 list'"
  fi
}

# Main execution
check_dependencies

# Process command line arguments
case "$1" in
  "list")
    list_prompts
    ;;
  "info")
    get_prompt_info "$2"
    ;;
  "switch")
    switch_prompt "$2"
    ;;
  "recommend")
    recommend_prompts "$2"
    ;;
  "status")
    get_status
    ;;
  "aliases")
    find_aliases "$2"
    ;;
  *)
    print_usage
    ;;
esac