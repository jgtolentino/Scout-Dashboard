#!/bin/bash
# prompt_aliases.sh - Handy ZSH aliases for PulseDev prompt management
#
# Source this file in your ~/.zshrc to add these aliases:
# source /path/to/prompt_aliases.sh

# Base script location - update this to the absolute path
PULSEDEV_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mcp/pulsedev"
PROMPT_SWITCH="$PULSEDEV_DIR/prompt_switch.sh"

# Shorthand aliases
alias plist="$PROMPT_SWITCH list"                     # List all prompts
alias pinfo="$PROMPT_SWITCH info"                     # Get prompt info
alias pswitch="$PROMPT_SWITCH switch"                 # Switch to prompt
alias prec="$PROMPT_SWITCH recommend"                 # Get prompt recommendations
alias pstatus="$PROMPT_SWITCH status"                 # Show current status
alias palias="$PROMPT_SWITCH aliases"                 # Find matching prompts

# Tool-specific shortcuts
alias pcode="$PROMPT_SWITCH switch cursor/chat_prompt"                    # Cursor coding mode
alias pcmd="$PROMPT_SWITCH switch replit/command_runner"                  # Replit command mode
alias papi="$PROMPT_SWITCH switch windsurf/tools"                         # API/tools mode
alias pux="$PROMPT_SWITCH switch lovable/ux_designer"                     # UX design mode
alias pcomp="$PROMPT_SWITCH switch rork/component_logic"                  # Component design mode
alias pslides="$PROMPT_SWITCH switch gamma/presentation_creator"          # Presentation mode
alias pdocs="$PROMPT_SWITCH switch same/collaboration_agent"              # Documentation mode
alias pdev="$PROMPT_SWITCH switch vscode/code_assistant"                  # Code assistance mode
alias pauto="$PROMPT_SWITCH switch devin/autonomous_developer"            # Autonomous dev mode
alias pagent="$PROMPT_SWITCH switch manus/agent_programmer"              # Agent design mode
alias pall="$PROMPT_SWITCH switch combined/pulsedev_unified"              # All capabilities

echo "PulseDev prompt aliases loaded. Use 'plist' to see available prompts."