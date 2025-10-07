#!/bin/bash
# Proxy for git commands with logging and validation

COMMAND="$@"
LOG_FILE="claude_session.log"

echo "[Git Proxy] Executing: git $COMMAND" | tee -a $LOG_FILE

# Block potentially dangerous commands
if [[ "$COMMAND" == *"push --force"* || "$COMMAND" == *"-f"* && "$COMMAND" == *"push"* ]]; then
  echo "[Git Proxy] ERROR: Force push detected and blocked for safety" | tee -a $LOG_FILE
  exit 1
fi

# Execute the git command
git $COMMAND
EXIT_CODE=$?

# Log the result
if [ $EXIT_CODE -eq 0 ]; then
  echo "[Git Proxy] Command completed successfully" | tee -a $LOG_FILE
else
  echo "[Git Proxy] Command failed with exit code $EXIT_CODE" | tee -a $LOG_FILE
fi

exit $EXIT_CODE