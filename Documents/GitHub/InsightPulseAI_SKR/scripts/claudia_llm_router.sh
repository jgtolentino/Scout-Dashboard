#!/bin/bash

# Usage: ./scripts/claudia_llm_router.sh "AgentName" "Prompt text here"

AGENT_NAME="$1"
USER_PROMPT="$2"

# Create slug and log path
AGENT_SLUG=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/claude_logs"
mkdir -p "$LOG_DIR"

echo "🧠 Running Claude Code as agent: $AGENT_NAME"
echo "📝 Prompt: $USER_PROMPT"
echo "🕓 Timestamp: $TIMESTAMP"

# Create a temporary system prompt file
TEMP_SYSTEM_FILE=$(mktemp)
echo "You are $AGENT_NAME, an expert AI agent at InsightPulseAI. Stay on-brand and complete the task clearly and with precision." > "$TEMP_SYSTEM_FILE"

# Call Claude CLI
cat "$TEMP_SYSTEM_FILE" - <<EOF | claude --print | tee "$LOG_DIR/${AGENT_SLUG}_$TIMESTAMP.md"
$USER_PROMPT
EOF

# Remove the temporary system prompt file
rm "$TEMP_SYSTEM_FILE"

echo "✅ Output saved to: $LOG_DIR/${AGENT_SLUG}_$TIMESTAMP.md"
