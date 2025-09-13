#!/usr/bin/env bash
# pulser_exec – wrapper to auto‑delegate tasks
# Implements the Pulser Unified Executor from pulser_exec.md

PULSER_AGENT="Claude"        # default executor
PRIV_AGENT="Basher"          # privileged executor
LOG_FILE="${HOME}/.pulser/logs/pulser_exec.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

is_privileged() {
  # naive ACL check – extend for granular control
  [[ "$*" =~ (sudo|apt-get|docker|ssh) ]]
}

run_or_delegate() {
  local label="$1"; shift
  local cmd=("$@")

  # Log the command
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Command: ${cmd[*]}" >> "$LOG_FILE"

  if is_privileged "${cmd[@]}"; then
    echo "[$label] ⟶ delegated to $PRIV_AGENT" | tee -a "$LOG_FILE"
    # Check for Surf integration
    if [[ "$label" == "surf_task" ]]; then
      # Use Surf agent with Basher backend
      export SURF_BACKEND="deepseekr1"
      :surf --goal "Execute privileged command: ${cmd[*]}" --backend "deepseekr1"
    else
      # Use standard Pulser call
      pulser call "$PRIV_AGENT" -- "${cmd[@]}"
    fi
  else
    echo "[$label] ⟶ executed by $PULSER_AGENT" | tee -a "$LOG_FILE"
    # Check for Surf integration
    if [[ "$label" == "surf_task" ]]; then
      # Use Surf agent with Claude backend
      export SURF_BACKEND="claude"
      :surf --goal "Execute command: ${cmd[*]}" --backend "claude"
    else
      # Use standard Pulser call
      pulser call "$PULSER_AGENT" -- "${cmd[@]}"
    fi
  fi
  
  # Log the result
  local result=$?
  if [ $result -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Command succeeded with exit code 0" >> "$LOG_FILE"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Command failed with exit code $result" >> "$LOG_FILE"
  fi
  
  return $result
}

# Entry‑point
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <label> <command…>"
  echo "Example: $0 register_dataset superset register-dataset --table SalesInteractionTranscripts"
  echo "Example: $0 surf_task 'Fix authentication bug in login form'"
  exit 1
fi

run_or_delegate "$@"