#!/bin/bash
# validate_21st_magic.sh - Run 21st Magic validation on dashboard
# Usage: ./validate_21st_magic.sh [target_path] [theme]

set -e

# Default parameters
TARGET_PATH="${1:-./deploy}"
THEME="${2:-21st_magic_dark}"
OUTPUT_PATH="./qa_reports"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Ensure required directories exist
mkdir -p "$OUTPUT_PATH"
mkdir -p "$OUTPUT_PATH/screenshots"

# Check if the target exists
if [ ! -e "$TARGET_PATH" ]; then
  echo "Error: Target path does not exist: $TARGET_PATH"
  exit 1
fi

echo "=================================="
echo "  21st Magic QA Validation"
echo "=================================="
echo "Target: $TARGET_PATH"
echo "Theme: $THEME"
echo "Output: $OUTPUT_PATH"
echo "=================================="

# Install dependencies if needed
if ! command -v puppeteer &> /dev/null; then
  echo "Installing dependencies..."
  npm install --no-save puppeteer jsdom axe-core color-contrast
fi

# Run the validation script
echo "Running validation script..."
node "$SCRIPT_DIR/scripts/validate_21st_magic.js" "$TARGET_PATH" "$OUTPUT_PATH" "$THEME"

# Get the latest report
LATEST_REPORT=$(ls -t "$OUTPUT_PATH"/21st_magic_qa_*.md | head -n 1)

if [ -f "$LATEST_REPORT" ]; then
  echo "=================================="
  echo "  QA Report Summary"
  echo "=================================="
  # Extract and display summary from markdown report
  grep -A 10 "^## Summary" "$LATEST_REPORT"
  echo "=================================="
  echo "Full report: $LATEST_REPORT"
  echo "=================================="
else
  echo "Warning: No QA report generated"
fi