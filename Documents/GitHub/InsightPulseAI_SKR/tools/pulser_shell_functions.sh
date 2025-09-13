# Pulser helper functions for Claude
pulser-log() {
  echo "[COMMAND] $(date +'%Y-%m-%d %H:%M:%S') $*" >> ~/Documents/GitHub/InsightPulseAI_SKR/claude_logs/pulser_session.log
  echo "$*"
}

# Clod Reporter function - for external API integration with Mistral LLM
clodrep() {
  local api_endpoint="$1"
  local api_action="$2"
  shift 2
  local api_params="$*"
  
  # Log the command
  echo "[CLODREP] $(date +'%Y-%m-%d %H:%M:%S') $api_endpoint $api_action $api_params" >> ~/Documents/GitHub/InsightPulseAI_SKR/claude_logs/pulser_session.log
  
  # Execute the task using Pulser task system
  pulser-log ":task \"Execute API integration for endpoint=$api_endpoint action=$api_action params='$api_params' using task=pulser_api_integration\""
}

# Add the #clodrep command alias
alias '#clodrep'='clodrep'

alias :task='pulser-log :task'
alias :verify-docket='pulser-log :verify-docket'
alias :pulseops='pulser-log :pulseops'
