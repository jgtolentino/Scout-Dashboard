#!/bin/bash
# Script to run dbt models and export the results to JSON files for the dashboard

set -e

# Directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Parse command line arguments
PROFILE="scout_edge"
TARGET="dev"
EXPORT_DAYS=30
SAMPLE_DATA=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile=*)
      PROFILE="${1#*=}"
      shift
      ;;
    --target=*)
      TARGET="${1#*=}"
      shift
      ;;
    --days=*)
      EXPORT_DAYS="${1#*=}"
      shift
      ;;
    --sample)
      SAMPLE_DATA=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --profile=PROFILE  dbt profile name (default: scout_edge)"
      echo "  --target=TARGET    dbt target name (default: dev)"
      echo "  --days=DAYS        Number of days of data to include in exports (default: 30)"
      echo "  --sample           Generate sample data instead of running dbt models"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Output directory for JSON files
OUTPUT_DIR="../assets/data"

echo "=== Scout Edge dbt Project Runner ==="
echo "Profile: $PROFILE"
echo "Target: $TARGET"
echo "Export days: $EXPORT_DAYS"
echo "Output directory: $OUTPUT_DIR"
echo "Sample data: $SAMPLE_DATA"
echo

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Run dbt models if not using sample data
if [[ "$SAMPLE_DATA" == "false" ]]; then
  echo "=== Running dbt models ==="
  
  # Check if dbt is installed
  if ! command -v dbt &> /dev/null; then
    echo "Error: dbt is not installed or not in the PATH"
    exit 1
  fi
  
  # Run dbt models
  dbt run --profile "$PROFILE" --target "$TARGET"
  
  # Test dbt models
  echo "=== Testing dbt models ==="
  dbt test --profile "$PROFILE" --target "$TARGET"
  
  echo "=== Exporting data from database ==="
  python3 scripts/export_to_json.py \
    --profile "$PROFILE" \
    --target "$TARGET" \
    --output-dir "$OUTPUT_DIR" \
    --days "$EXPORT_DAYS"
else
  echo "=== Generating sample data ==="
  python3 scripts/export_to_json.py \
    --output-dir "$OUTPUT_DIR" \
    --days "$EXPORT_DAYS" \
    --sample
fi

echo
echo "=== Data export complete ==="
echo "JSON files have been written to: $OUTPUT_DIR"

# Make the script executable
chmod +x "$0"