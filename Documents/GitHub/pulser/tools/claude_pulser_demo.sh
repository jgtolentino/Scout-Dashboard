#!/bin/bash
# Claude-Compatible Pulser Demo Tour
# This script demonstrates the aligned features between Claude Code and Pulser

# ANSI color codes
BLUE="\033[34m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
MAGENTA="\033[35m"
CYAN="\033[36m"
BOLD="\033[1m"
RESET="\033[0m"

# Function to display headers
header() {
  echo -e "\n${BOLD}$1${RESET}"
  echo -e "${YELLOW}$(printf '=%.0s' $(seq 1 ${#1}))${RESET}\n"
}

# Function to show demos with pauses
demo_step() {
  echo -e "${BOLD}${CYAN}📌 $1${RESET}"
  echo -e "${GREEN}$2${RESET}"
  if [ -n "$3" ]; then
    echo -e "${MAGENTA}Example:${RESET} $3"
  fi
  
  echo -e "\n${YELLOW}Press any key to continue...${RESET}"
  read -n 1 -s
}

# Welcome screen
clear
echo -e "${BOLD}${GREEN}"
echo "   _____ _                _        _____      _               "
echo "  / ____| |              | |      |  __ \    | |              "
echo " | |    | | __ _ _   _  _| |_ ___ | |__) |_ _| |___  ___ _ __ "
echo " | |    | |/ _\` | | | |/ / __/ _ \|  ___/ _\` | / __|/ _ \ '__|"
echo " | |____| | (_| | |_| | <| ||  __/| |  | (_| | \__ \  __/ |   "
echo "  \_____|_|\__,_|\__,_|\_\\\\__\\___||_|   \__,_|_|___/\___|_|   "
echo -e "${RESET}"
echo -e "${BOLD}Demonstrating Claude-Compatible Pulser Interface${RESET}"
echo -e "\nThis demo showcases how Pulser now uses the same interface as Claude Code."
echo -e "${YELLOW}Press any key to begin the tour...${RESET}"
read -n 1 -s

# Introduction
header "🌟 Claude-Compatible Pulser"
echo "Pulser now features the same interface as Claude Code, including:"
echo "  • Claude-style slash commands (/help, /think, etc.)"
echo "  • File references with @filename syntax"
echo "  • Shared API credentials"
echo "  • Thinking mode with step-by-step reasoning"
echo "  • Unified configuration system"
echo -e "\n${YELLOW}Press any key to explore the features...${RESET}"
read -n 1 -s

# Slash Commands Demo
header "🔍 Claude-Style Slash Commands"
demo_step "Slash Commands" \
          "Pulser now recognizes Claude's slash commands exactly as you'd use them in Claude Code:" \
          "/help, /config, /think, /vim"

demo_step "Command Translation" \
          "Behind the scenes, slash commands are translated to Pulser's native format:" \
          "/help → :help, /think → :think"

demo_step "Seamless Experience" \
          "This means you can use the same command patterns across both tools:" \
          "Use /help in both Claude Code and Pulser"

# File References Demo
header "📄 File References"
demo_step "@filename Syntax" \
          "Reference files using the @ symbol, just like in Claude Code:" \
          "@README.md will include the contents of README.md"

demo_step "Implementation" \
          "When you use @filename, Pulser automatically:" \
          "1. Detects the pattern\n2. Checks if file exists\n3. Converts to :read command\n4. Displays file contents"

# Thinking Mode Demo
header "🧠 Thinking Mode"
demo_step "/think Command" \
          "Enable thinking mode to see step-by-step reasoning:" \
          "/think Show me how to calculate the factorial of 5"

demo_step "Enhanced Thinking" \
          "Use enhanced thinking modes for more detailed reasoning:" \
          "/think-harder, /ultrathink"

demo_step "Implementation" \
          "Thinking mode modifies prompts to request detailed reasoning and formats the output to highlight the thinking process."

# API Integration Demo
header "🔑 Shared API Credentials"
demo_step "Claude API" \
          "Pulser now uses the same API credentials as Claude Code:" \
          "No need to set up separate API keys"

demo_step "Model Access" \
          "This gives you access to the same models:" \
          "Claude 3.7 Sonnet is available in both tools"

# Practical Examples
header "🛠️ Practical Examples"
demo_step "File Access Example" \
          "View a file with @ syntax:" \
          "@/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/README.md"

demo_step "Thinking Mode Example" \
          "Use thinking mode for complex problems:" \
          "/think What's the best way to structure a database for a social media application?"

demo_step "Multiple Files Example" \
          "Reference multiple files in one query:" \
          "Compare these two files: @file1.txt @file2.txt"

# Task Management Demo
header "📋 Task Management"
demo_step "Creating Tasks" \
          "Create implementation tasks with the pulser-task command:" \
          "pulser-task"

demo_step "Task Template" \
          "The template automatically includes the right format:" \
          "✅ For Pulser: Implement X feature"

# Conclusion
header "🎉 Tour Complete!"
echo -e "You've completed the Claude-Compatible Pulser demo! Here's how to get started:"
echo -e "\n${BOLD}Main Commands:${RESET}"
echo -e "  ${GREEN}pulser${RESET} - Launch Pulser with Claude compatibility"
echo -e "  ${GREEN}pulser-task${RESET} - Create a Pulser implementation task"
echo -e "  ${GREEN}pulser-help${RESET} - Show all available commands"
echo -e "\n${BOLD}Claude-Style Commands:${RESET}"
echo -e "  ${GREEN}/help${RESET} - Show help"
echo -e "  ${GREEN}/think${RESET} - Enable thinking mode"
echo -e "  ${GREEN}/config${RESET} - Configure settings"
echo -e "  ${GREEN}/memory${RESET} - Show context"
echo -e "\n${YELLOW}To exit this tour, press any key...${RESET}"
read -n 1 -s

clear
echo -e "${BOLD}${GREEN}Thank you for exploring Claude-Compatible Pulser!${RESET}"
echo -e "You now have a seamless experience across both Claude Code and Pulser."
echo ""