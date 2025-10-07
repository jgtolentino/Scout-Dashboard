#!/bin/bash
# claude_with_context.sh
# Executes Claude CLI commands with context awareness

set -e

PULSER_DIR="${HOME}/.pulser"
CONTEXT_DIR="${PULSER_DIR}/context"
LOG_FILE="${PULSER_DIR}/claude_cli.log"

# Ensure directories exist
mkdir -p "${PULSER_DIR}"
mkdir -p "${CONTEXT_DIR}"

# Log execution
echo "[$(date)] Executing Claude CLI with context" >> "${LOG_FILE}"

# Read prompt from stdin
prompt=$(cat)

# Log the prompt
echo "[$(date)] Prompt: ${prompt}" >> "${LOG_FILE}"

# Check if we have a claude command
if command -v claude &> /dev/null; then
    # Execute Claude CLI
    claude code << EOF
${prompt}
EOF
else
    # Try using the pulser command if claude isn't available
    if command -v pulser &> /dev/null; then
        pulser ask "${prompt}" --agent claudia
    else
        echo "Error: Neither Claude CLI nor Pulser command found."
        echo "Please install Claude CLI or Pulser to use this feature."
        exit 1
    fi
fi

# Log completion
echo "[$(date)] Claude CLI execution completed" >> "${LOG_FILE}"