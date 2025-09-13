#!/bin/bash
# Add QA alias to .pulserrc for quick dashboard screenshots

# Get directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if running as claude
IS_CLAUDE=0
if [ -n "$CLAUDE_CONTEXT" ] || [ -n "$ANTHROPIC_API_KEY" ]; then
  IS_CLAUDE=1
fi

echo "Adding :qa-screenshot alias to pulser configuration..."

if [ $IS_CLAUDE -eq 1 ]; then
  # When running as Claude, just show the command
  echo "Please add these lines to your .pulserrc file:"
  echo ""
  echo "qa-screenshot: cd $SCRIPT_DIR && ./capture_dashboard_qa.sh"
  echo "qa-chart: cd $SCRIPT_DIR && ./capture_chart_qa.sh"
  echo ""
  echo "Then you can run ':qa-screenshot' or ':qa-chart' in the Pulser CLI."
else
  # Direct addition to .pulserrc
  PULSERRC="$HOME/.pulserrc"

  # Check if .pulserrc exists
  if [ ! -f "$PULSERRC" ]; then
    echo "Creating new .pulserrc file"
    touch "$PULSERRC"
  fi

  # Check if aliases already exist
  if grep -q "qa-screenshot:" "$PULSERRC"; then
    echo "qa-screenshot alias already exists in .pulserrc"
  else
    # Add screenshot alias
    echo "qa-screenshot: cd $SCRIPT_DIR && ./capture_dashboard_qa.sh" >> "$PULSERRC"
    echo "qa-screenshot alias added successfully."
  fi

  if grep -q "qa-chart:" "$PULSERRC"; then
    echo "qa-chart alias already exists in .pulserrc"
  else
    # Add chart alias
    echo "qa-chart: cd $SCRIPT_DIR && ./capture_chart_qa.sh" >> "$PULSERRC"
    echo "qa-chart alias added successfully."
  fi

  echo "You can now run ':qa-screenshot' and ':qa-chart' in the Pulser CLI."
fi