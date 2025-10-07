#!/bin/bash
# Export dbt model data to JSON files for dashboard consumption

set -e

# Configuration
EXPORT_DIR="../../../final-locked-dashboard/assets/data/exports"
DASHBOARD_DATA_DIR="../../../final-locked-dashboard/assets/data"
MODELS_TO_EXPORT="marts.sales_interactions_enriched marts.store_daily_metrics marts.brand_performance_metrics marts.device_performance_metrics marts.customer_session_metrics"
DBT_PROFILE="scout_retail_advisor"
DBT_TARGET="dev"

# Command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --models)
      MODELS_TO_EXPORT="$2"
      shift 2
      ;;
    --export-dir)
      EXPORT_DIR="$2"
      shift 2
      ;;
    --profile)
      DBT_PROFILE="$2"
      shift 2
      ;;
    --target)
      DBT_TARGET="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./export_to_dashboard.sh [options]"
      echo ""
      echo "Options:"
      echo "  --models <model_names>   Space-separated list of models to export (default: all mart models)"
      echo "  --export-dir <dir>       Directory to export JSON files to"
      echo "  --profile <profile>      dbt profile to use"
      echo "  --target <target>        dbt target to use"
      echo "  --help                   Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Ensure export directory exists
mkdir -p "$EXPORT_DIR"
mkdir -p "$DASHBOARD_DATA_DIR"

echo "Starting export of dbt models to JSON..."
echo "Models to export: $MODELS_TO_EXPORT"
echo "Export directory: $EXPORT_DIR"

# Run dbt to ensure models are up to date
echo "Running dbt to ensure models are up to date..."
dbt run --select "$MODELS_TO_EXPORT" --profile "$DBT_PROFILE" --target "$DBT_TARGET"

# Export each model to JSON
for model in $MODELS_TO_EXPORT; do
  echo "Exporting $model..."
  
  # Extract the model name without the path
  model_name=$(echo "$model" | sed 's/.*\.//')
  
  # Get current timestamp for filename
  timestamp=$(date +"%Y%m%d_%H%M%S")
  
  # Execute dbt and export to JSON
  dbt run-operation export_model_to_json \
    --args "{\"model_name\": \"$model\", \"output_path\": \"$EXPORT_DIR/${model_name}_${timestamp}.json\"}" \
    --profile "$DBT_PROFILE" \
    --target "$DBT_TARGET"
  
  # Create a symbolic link to the latest export
  ln -sf "$EXPORT_DIR/${model_name}_${timestamp}.json" "$EXPORT_DIR/${model_name}_latest.json"
  
  echo "Exported $model to $EXPORT_DIR/${model_name}_${timestamp}.json"
  
  # Copy to dashboard data directory
  cp "$EXPORT_DIR/${model_name}_latest.json" "$DASHBOARD_DATA_DIR/${model_name}.json"
done

# Create a metadata.json file with export information
cat > "$EXPORT_DIR/metadata.json" <<EOF
{
  "exports": [
$(for model in $MODELS_TO_EXPORT; do
  model_name=$(echo "$model" | sed 's/.*\.//')
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "    {\"model\": \"$model\", \"file\": \"${model_name}_latest.json\", \"exported_at\": \"$timestamp\"},"
done | sed '$s/,$//')
  ],
  "last_updated": "$(date +"%Y-%m-%d %H:%M:%S")",
  "data_freshness": "$(date -d "now - 1 day" +"%Y-%m-%d %H:%M:%S")"
}
EOF

cp "$EXPORT_DIR/metadata.json" "$DASHBOARD_DATA_DIR/data_freshness.json"

echo "Export complete! Data is ready for dashboard consumption."
echo "Exported files are in $EXPORT_DIR"
echo "Dashboard data is updated in $DASHBOARD_DATA_DIR"