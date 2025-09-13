#!/bin/bash
# Script to load Sari-Sari Store FMCG sample data for the Client360 Dashboard

# Set variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"
SCHEMA_FILE="$MIGRATIONS_DIR/sari_sari_fmcg_sample_data.sql"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE="$LOG_DIR/sari_sari_fmcg_data_$(date +%Y%m%d%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to display usage information
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h, --host      Database host (default: 127.0.0.1)"
  echo "  -p, --port      Database port (default: 5432)"
  echo "  -d, --database  Database name (default: client360)"
  echo "  -u, --user      Database user (default: postgres)"
  echo "  --help          Display this help message and exit"
  echo
  echo "Environment variables DB_HOST, DB_PORT, DB_NAME, and DB_USER can also be used"
}

# Default database connection parameters
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-client360}
DB_USER=${DB_USER:-postgres}

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--host)
      DB_HOST="$2"
      shift 2
      ;;
    -p|--port)
      DB_PORT="$2"
      shift 2
      ;;
    -d|--database)
      DB_NAME="$2"
      shift 2
      ;;
    -u|--user)
      DB_USER="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      usage
      exit 1
      ;;
  esac
done

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "Error: PostgreSQL client (psql) not found. Please install PostgreSQL client tools."
  exit 1
fi

# Check if file exists
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: Schema file not found at $SCHEMA_FILE"
  exit 1
fi

# Start logging
echo "Starting Sari-Sari Store FMCG sample data load"
echo "Data load started at $(date)" > "$LOG_FILE"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT" >> "$LOG_FILE"

# Ask for database password
read -sp "Enter database password for user $DB_USER: " DB_PASSWORD
echo

# Run data load
echo "Loading Sari-Sari Store FMCG sample data..."
echo "Executing $SCHEMA_FILE" >> "$LOG_FILE"

PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$SCHEMA_FILE" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Sari-Sari Store FMCG sample data load completed successfully"
  echo "Data load completed successfully at $(date)" >> "$LOG_FILE"
else
  echo "❌ Error loading Sari-Sari Store FMCG sample data. Check log file at $LOG_FILE"
  echo "Data load failed at $(date)" >> "$LOG_FILE"
  exit 1
fi

# Verify data load
echo "Verifying data load..."
VERIFICATION=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT COUNT(*) FROM brands WHERE is_tbwa_client = TRUE; SELECT COUNT(*) FROM products; SELECT COUNT(*) FROM SalesInteractions;" -t)

echo "Verification results:" >> "$LOG_FILE"
echo "$VERIFICATION" >> "$LOG_FILE"

BRAND_COUNT=$(echo "$VERIFICATION" | head -1 | tr -d " ")
PRODUCT_COUNT=$(echo "$VERIFICATION" | head -2 | tail -1 | tr -d " ")
INTERACTION_COUNT=$(echo "$VERIFICATION" | head -3 | tail -1 | tr -d " ")

echo "Data load summary:"
echo "-----------------"
echo "TBWA Client Brands: $BRAND_COUNT"
echo "FMCG Products: $PRODUCT_COUNT"
echo "Store Interactions: $INTERACTION_COUNT"
echo

if [ "$BRAND_COUNT" -gt 0 ] && [ "$PRODUCT_COUNT" -gt 0 ] && [ "$INTERACTION_COUNT" -gt 0 ]; then
  echo "✅ Data verification passed"
  echo "Data verification passed" >> "$LOG_FILE"
else
  echo "⚠️ Data verification failed. Some data may not have been loaded correctly."
  echo "Data verification failed" >> "$LOG_FILE"
fi

echo "Logs are available at $LOG_FILE"
exit 0