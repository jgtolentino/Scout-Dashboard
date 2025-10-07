#!/bin/bash
# Surf Command - CLI Interface for Surf Agent
# Integrated with Pulser CLI

set -e

# Default values
SURF_GOAL=""
SURF_FILES=""
SURF_ENV=".env.local"
SURF_NOTE=""
SURF_BACKEND="deepseekr1"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --goal)
      SURF_GOAL="$2"
      shift 2
      ;;
    --files)
      SURF_FILES="$2"
      shift 2
      ;;
    --env)
      SURF_ENV="$2"
      shift 2
      ;;
    --note)
      SURF_NOTE="$2"
      shift 2
      ;;
    --backend)
      SURF_BACKEND="$2"
      shift 2
      ;;
    *)
      echo "❌ Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$SURF_GOAL" ]]; then
  echo "❌ Error: Goal is required"
  echo "Usage: :surf --goal \"Your task in natural language\" [--files \"path/to/files\"] [--env \".env.file\"] [--note \"Additional instructions\"] [--backend \"claude|deepseekr1\"]"
  exit 1
fi

# Export variables for the agent
export SURF_GOAL="$SURF_GOAL"
export SURF_FILES="$SURF_FILES"
export SURF_ENV="$SURF_ENV"
export SURF_NOTE="$SURF_NOTE"
export SURF_BACKEND="$SURF_BACKEND"

# Echo logo
echo "🌊 🏄 SURF AUTONOMOUS AGENT 🏄 🌊"
echo "===================================="
echo "Goal: $SURF_GOAL"
[[ -n "$SURF_FILES" ]] && echo "Files: $SURF_FILES"
echo "Environment: $SURF_ENV"
[[ -n "$SURF_NOTE" ]] && echo "Note: $SURF_NOTE"
echo "Backend: $SURF_BACKEND"
echo "===================================="

# Run the Surf agent
REPO_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
AGENT_PATH="$REPO_ROOT/agents/surf/surf_agent.py"

# Ensure the script is executable
chmod +x "$AGENT_PATH"

# Execute the agent
python3 "$AGENT_PATH" --goal "$SURF_GOAL" ${SURF_FILES:+--files "$SURF_FILES"} --env "$SURF_ENV" ${SURF_NOTE:+--note "$SURF_NOTE"}

# Exit with the same status code as the agent
exit $?