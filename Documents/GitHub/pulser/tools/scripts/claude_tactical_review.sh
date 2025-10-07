#!/bin/bash
# Claude Parity Tactical Review Script
# Runs comparison and updates war status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
WAR_LOG_DIR="$HOME/.pulser/logs/claude-parity-war"
STATUS_DIR="$HOME/.pulser/status"
CONFIG_DIR="$HOME/.pulser/config"
KALAW_DIR="$CONFIG_DIR/kalaw_registry"
COMPARE_SCRIPT="$TOOLS_DIR/pulser-claude-compare.sh"
WAR_STATUS="$STATUS_DIR/claude-parity-war.json"

# Run the comparison
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
LOG_FILE="$WAR_LOG_DIR/tactical_review_$TIMESTAMP.log"
$COMPARE_SCRIPT > "$LOG_FILE"

# Extract metrics
PASS_COUNT=$(grep -c "✅" "$LOG_FILE")
PARTIAL_COUNT=$(grep -c "⚠️" "$LOG_FILE")
FAIL_COUNT=$(grep -c "❌" "$LOG_FILE")
TOTAL=$((PASS_COUNT + PARTIAL_COUNT + FAIL_COUNT))
PARITY_SCORE=$((PASS_COUNT * 100 / TOTAL))

# Update the war status JSON
cat > "$WAR_STATUS" << JSONEOF
{
  "codename": "CLAUDE PARITY WARFIRE",
  "status": "ACTIVE",
  "last_update": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "declaration_time": "2025-05-04T00:00:00+08:00",
  "deadline": "2025-05-06T23:59:59+08:00",
  "metrics": {
    "pass_count": $PASS_COUNT,
    "partial_count": $PARTIAL_COUNT,
    "fail_count": $FAIL_COUNT,
    "total_features": $TOTAL,
    "parity_score": $PARITY_SCORE,
    "progress_percentage": $((PARITY_SCORE - 70))
  },
  "battle_status": {
    "is_improving": $([ $PARITY_SCORE -gt 70 ] && echo "true" || echo "false"),
    "goal_reached": $([ $PARITY_SCORE -ge 100 ] && echo "true" || echo "false"),
    "tactical_reviews_completed": $(ls "$WAR_LOG_DIR"/tactical_review_*.log | wc -l | tr -d ' '),
    "time_remaining_hours": $(( ($(date -d "$DEADLINE" +%s) - $(date +%s)) / 3600 ))
  },
  "vulnerabilities": [
    {"name": "Command registry structure", "status": $([ $PARITY_SCORE -ge 80 ] && echo "\"patched\"" || echo "\"vulnerable\"")},
    {"name": "Context injection flag", "status": $([ $PARITY_SCORE -ge 85 ] && echo "\"patched\"" || echo "\"vulnerable\"")},
    {"name": "Error boundary reporting", "status": $([ $PARITY_SCORE -ge 90 ] && echo "\"patched\"" || echo "\"vulnerable\"")},
    {"name": "Terminal feedback", "status": $([ $PARTIAL_COUNT -eq 0 ] && echo "\"patched\"" || echo "\"partial\"")},
    {"name": "Working directory context", "status": $([ $PARITY_SCORE -eq 100 ] && echo "\"patched\"" || echo "\"vulnerable\"")},
    {"name": "Version display", "status": $([ $PARITY_SCORE -ge 95 ] && echo "\"patched\"" || echo "\"partial\"")},
    {"name": "Test suite gaps", "status": $([ $PARITY_SCORE -eq 100 ] && echo "\"patched\"" || echo "\"vulnerable\"")}
  ],
  "last_tactical_review": "$LOG_FILE"
}
JSONEOF

# Copy updated matrix to Kalaw registry
cp "$CONFIG_DIR/claude_parity_matrix.yaml" "$KALAW_DIR/claude_parity_matrix.yaml"

# Send Slack notification if configured
if [ -f "$HOME/.pulser/config/slack_webhook.txt" ]; then
  WEBHOOK_URL=$(cat "$HOME/.pulser/config/slack_webhook.txt")
  
  # Only send if PARITY_SCORE changed
  if [ -f "$WAR_LOG_DIR/last_parity_score.txt" ]; then
    LAST_SCORE=$(cat "$WAR_LOG_DIR/last_parity_score.txt")
    if [ "$LAST_SCORE" != "$PARITY_SCORE" ]; then
      curl -s -X POST -H 'Content-type: application/json' --data "{
        \"text\": \"🔥 *CLAUDE PARITY WARFIRE UPDATE*\\nCurrent parity score: $PARITY_SCORE%\\nPass: $PASS_COUNT | Partial: $PARTIAL_COUNT | Fail: $FAIL_COUNT\\nTactical review #$(ls "$WAR_LOG_DIR"/tactical_review_*.log | wc -l) completed.\"
      }" "$WEBHOOK_URL"
    fi
  fi
  
  # Save current score for next comparison
  echo "$PARITY_SCORE" > "$WAR_LOG_DIR/last_parity_score.txt"
fi

echo "Tactical review completed. Parity score: $PARITY_SCORE%"
