#!/bin/bash
# Script to run SalesInteractions schema migration for the Client360 Dashboard

# Set variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"
SCHEMA_FILE="$MIGRATIONS_DIR/create_sales_interactions.sql"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE="$LOG_DIR/sales_interactions_migration_$(date +%Y%m%d%H%M%S).log"

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
echo "Starting SalesInteractions schema migration"
echo "Migration started at $(date)" > "$LOG_FILE"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT" >> "$LOG_FILE"

# Ask for database password
read -sp "Enter database password for user $DB_USER: " DB_PASSWORD
echo

# Run migration
echo "Running SalesInteractions schema migration..."
echo "Executing $SCHEMA_FILE" >> "$LOG_FILE"

PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$SCHEMA_FILE" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ SalesInteractions schema migration completed successfully"
  echo "Migration completed successfully at $(date)" >> "$LOG_FILE"
else
  echo "❌ Error running SalesInteractions schema migration. Check log file at $LOG_FILE"
  echo "Migration failed at $(date)" >> "$LOG_FILE"
  exit 1
fi

# Verify migration
echo "Verifying migration..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'salesinteractions';" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Migration verification passed"
  echo "Migration verification passed" >> "$LOG_FILE"
  
  # Check if tables were created
  TABLES_CREATED=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('salesinteractions', 'salesinteractionbrands', 'salesinteractiontranscripts', 'transcriptchunkaudit', 'products', 'customers', 'edgedeviceregistry');")
  
  if [ "$TABLES_CREATED" -eq 7 ]; then
    echo "All tables were created successfully"
    echo "All tables were created successfully" >> "$LOG_FILE"
  else
    echo "⚠️ Some tables may not have been created correctly. Please check the database manually."
    echo "Some tables may not have been created correctly" >> "$LOG_FILE"
  fi
else
  echo "⚠️ Migration verification failed. Please check the database manually."
  echo "Migration verification failed" >> "$LOG_FILE"
fi

echo "Logs are available at $LOG_FILE"
exit 0