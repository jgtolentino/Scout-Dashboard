#!/bin/bash
# Script to run SQL migration for the Client360 Dashboard
# This script executes the location schema and data migration SQL files

# Set variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data/sample_data"
SCHEMA_FILE="$DATA_DIR/location_schema.sql"
MIGRATION_FILE="$DATA_DIR/location_data_migration.sql"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE="$LOG_DIR/sql_migration_$(date +%Y%m%d%H%M%S).log"

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

# Function to run SQL file
run_sql_file() {
  local file=$1
  local message=$2
  
  echo "Running $message..."
  echo "Executing $file" >> "$LOG_FILE"
  
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$file" >> "$LOG_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ $message completed successfully"
    return 0
  else
    echo "❌ Error running $message. Check log file at $LOG_FILE"
    return 1
  fi
}

# Main execution
echo "Starting SQL migration for Client360 Dashboard"
echo "Migration started at $(date)" > "$LOG_FILE"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT" >> "$LOG_FILE"

# Check if files exist
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: Schema file not found at $SCHEMA_FILE"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

# Ask for database password
read -sp "Enter database password for user $DB_USER: " DB_PASSWORD
echo

# Run schema creation
run_sql_file "$SCHEMA_FILE" "schema creation" || exit 1

# Run data migration
run_sql_file "$MIGRATION_FILE" "data migration" || exit 1

echo "Migration completed at $(date)" >> "$LOG_FILE"
echo "✅ SQL migration completed successfully"
echo "Logs are available at $LOG_FILE"

# Verify migration
echo "Verifying migration..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT COUNT(*) AS store_count FROM stores; SELECT COUNT(*) AS region_count FROM regions;" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Migration verification passed"
  echo "Migration verification passed" >> "$LOG_FILE"
else
  echo "⚠️ Migration verification failed. Please check the database manually."
  echo "Migration verification failed" >> "$LOG_FILE"
fi

exit 0