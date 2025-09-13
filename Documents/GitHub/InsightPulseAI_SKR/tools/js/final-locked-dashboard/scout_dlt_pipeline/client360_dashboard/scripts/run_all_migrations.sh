#!/bin/bash
# Master script to run all SQL migrations for the Client360 Dashboard

# Set variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE="$LOG_DIR/all_migrations_$(date +%Y%m%d%H%M%S).log"

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
  echo "  --create-db     Create database if it doesn't exist"
  echo "  --help          Display this help message and exit"
  echo
  echo "Environment variables DB_HOST, DB_PORT, DB_NAME, and DB_USER can also be used"
}

# Default database connection parameters
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-client360}
DB_USER=${DB_USER:-postgres}
CREATE_DB=false

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
    --create-db)
      CREATE_DB=true
      shift
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

# Start logging
echo "Starting all migrations for Client360 Dashboard"
echo "Migrations started at $(date)" > "$LOG_FILE"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT" >> "$LOG_FILE"

# Ask for database password
read -sp "Enter database password for user $DB_USER: " DB_PASSWORD
echo

# Create database if requested
if [ "$CREATE_DB" = true ]; then
  echo "Checking if database $DB_NAME exists..."
  
  # Check if the database exists
  DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" postgres 2>/dev/null)
  
  if [ -z "$DB_EXISTS" ]; then
    echo "Creating database $DB_NAME..."
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" postgres >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
      echo "✅ Database $DB_NAME created successfully"
      echo "Database $DB_NAME created successfully" >> "$LOG_FILE"
    else
      echo "❌ Error creating database $DB_NAME. Check log file at $LOG_FILE"
      echo "Error creating database $DB_NAME" >> "$LOG_FILE"
      exit 1
    fi
  else
    echo "Database $DB_NAME already exists"
    echo "Database $DB_NAME already exists" >> "$LOG_FILE"
  fi
fi

# Function to run a migration script
run_migration() {
  local script=$1
  local description=$2
  local success_count=$3
  
  echo "Running $description..."
  echo "Running $description at $(date)" >> "$LOG_FILE"
  
  # Add parameters to pass to the script
  $script -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -u "$DB_USER" < <(echo "$DB_PASSWORD")
  
  # Check the result
  if [ $? -eq 0 ]; then
    echo "✅ $description completed successfully"
    echo "$description completed successfully" >> "$LOG_FILE"
    return 0
  else
    echo "❌ Error running $description. Check log files for details."
    echo "Error running $description" >> "$LOG_FILE"
    return 1
  fi
}

# Run migrations in order
TOTAL_MIGRATIONS=3
SUCCESSFUL_MIGRATIONS=0
MIGRATION_STEPS=(
  "$SCRIPT_DIR/run_sql_migration.sh|Location schema migration"
  "$SCRIPT_DIR/run_sales_interactions_migration.sh|SalesInteractions schema migration"
  "$SCRIPT_DIR/run_sari_sari_migration.sh|Sari-Sari Store schema enhancements"
)

for migration in "${MIGRATION_STEPS[@]}"; do
  # Split the string by the delimiter
  IFS="|" read -r script description <<< "$migration"
  
  if run_migration "$script" "$description" "$SUCCESSFUL_MIGRATIONS"; then
    SUCCESSFUL_MIGRATIONS=$((SUCCESSFUL_MIGRATIONS + 1))
  fi
done

# Summary
echo
echo "Migration Summary:"
echo "-----------------"
echo "Total migrations: $TOTAL_MIGRATIONS"
echo "Successful migrations: $SUCCESSFUL_MIGRATIONS"
echo "Failed migrations: $((TOTAL_MIGRATIONS - SUCCESSFUL_MIGRATIONS))"
echo

if [ $SUCCESSFUL_MIGRATIONS -eq $TOTAL_MIGRATIONS ]; then
  echo "✅ All migrations completed successfully!"
  echo "All migrations completed successfully at $(date)" >> "$LOG_FILE"
  exit 0
else
  echo "⚠️ Some migrations failed. Please check the log files for details."
  echo "Some migrations failed at $(date)" >> "$LOG_FILE"
  exit 1
fi