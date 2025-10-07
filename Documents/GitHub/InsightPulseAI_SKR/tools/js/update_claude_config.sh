#!/bin/bash

# Update the Claude configuration in the current project
echo "Updating Claude configuration in the current project..."
CONFIG_PATH="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/pulser.config.yaml"

# Create or update the config file
cat > "$CONFIG_PATH" << 'EOF'
claude:
  system_prompt: |
    You are an automated executor.
    Never ask the user to perform any steps manually.
    Always output executable scripts, commands, or API calls
    that can be run end-to-end without human intervention.
  enforce_direct: true
  forbid_manual: true
EOF

echo "Configuration updated at $CONFIG_PATH"

# Copy to user home directory if .pulserrc exists
if [ -f "$HOME/.pulserrc" ]; then
    echo "Updating ~/.pulserrc with direct mode settings..."
    
    # Read existing content
    CONTENT=$(cat "$HOME/.pulserrc")
    
    # Check if it's JSON format
    if [[ "$CONTENT" == {* ]]; then
        # It's JSON, create a new file with the claude configuration
        TMP_FILE=$(mktemp)
        jq '.agents.claude = {"system_prompt": "You are an automated executor. Never ask the user to perform any steps manually. Always output executable scripts, commands or API calls that can be run end-to-end without human intervention.", "enforce_direct": true, "forbid_manual": true}' "$HOME/.pulserrc" > "$TMP_FILE"
        mv "$TMP_FILE" "$HOME/.pulserrc"
    else
        # Not JSON, append to the file
        cat >> "$HOME/.pulserrc" << 'EOF'

# Claude direct mode settings
{
  "agents": {
    "claude": {
      "system_prompt": "You are an automated executor. Never ask the user to perform any steps manually. Always output executable scripts, commands or API calls that can be run end-to-end without human intervention.",
      "enforce_direct": true,
      "forbid_manual": true
    }
  }
}
EOF
    fi
    echo "Updated ~/.pulserrc successfully"
fi

echo ""
echo "Configuration updated successfully!"
echo "To apply changes, you'll need to restart Claude or start a new session with the updated configuration."
echo ""
echo "Suggested methods to restart Claude:"
echo "1. Close and reopen your terminal, then run 'claude' or 'pulser' again"
echo "2. Run 'source ~/.zshrc' to reload your shell configuration"
echo "3. If using Claude Code, restart the Claude Code application"
echo ""
echo "Your 'direct-only' mode for Claude is now configured!"