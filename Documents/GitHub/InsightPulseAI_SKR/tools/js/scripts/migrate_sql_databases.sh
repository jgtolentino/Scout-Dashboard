#!/bin/bash
# SQL Database Migration Script for SQL Server Consolidation
# This script migrates databases from source SQL servers to the target consolidated server

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_SERVER="sqltbwaprojectscoutserver.database.windows.net"
TARGET_ADMIN="scout_admin"
TARGET_PASSWORD="" # Will be prompted

# Source servers and databases to migrate
declare -A SOURCE_SERVERS
SOURCE_SERVERS["retail-advisor-sql.database.windows.net"]="RetailAdvisorDB"
SOURCE_SERVERS["scout-edge-sql.database.windows.net"]="RetailAdvisor"

# Source credentials
SOURCE_ADMIN="retail_advisor_user" # Will be overridden per server if needed
SOURCE_PASSWORD="" # Will be prompted

# Temporary directory for backups
BACKUP_DIR="/tmp/sql_migration_$(date +%Y%m%d%H%M%S)"

# Display header
echo -e "${BOLD}SQL Database Migration for Server Consolidation${NC}"
echo "=============================================="
echo -e "Target Server: ${BLUE}${TARGET_SERVER}${NC}"
echo ""

# Ensure Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found${NC}"
    echo "Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Ensure SQLCMD is installed
if ! command -v sqlcmd &> /dev/null; then
    echo -e "${RED}Error: SQLCMD not found${NC}"
    echo "Please install SQLCMD: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility"
    exit 1
fi

# Check Azure login status
echo -e "${BLUE}Checking Azure login status...${NC}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in:${NC}"
    az login
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "Created backup directory: ${BLUE}${BACKUP_DIR}${NC}"

# Prompt for passwords if not provided
if [ -z "$TARGET_PASSWORD" ]; then
    echo -e "${BLUE}Enter password for target server (${TARGET_ADMIN}@${TARGET_SERVER}):${NC}"
    read -s TARGET_PASSWORD
    echo ""
fi

if [ -z "$SOURCE_PASSWORD" ]; then
    echo -e "${BLUE}Enter password for source servers:${NC}"
    read -s SOURCE_PASSWORD
    echo ""
fi

# Function to export database from source server
export_database() {
    local server=$1
    local database=$2
    local admin=$3
    local password=$4
    local backup_file="${BACKUP_DIR}/${database}.bacpac"
    
    echo -e "\n${BOLD}Exporting ${database} from ${server}${NC}"
    
    # Use Azure CLI to export database
    echo -e "${BLUE}Exporting database using Azure SQL Database export...${NC}"
    az sql db export \
        --server "${server%.*}" \
        --name "$database" \
        --admin-user "$admin" \
        --admin-password "$password" \
        --storage-key-type SharedAccessKey \
        --storage-uri "https://tbwajuicerstorage.blob.core.windows.net/sql-migration/${database}.bacpac" \
        --storage-key "your-storage-key"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to export database ${database} from ${server}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Successfully exported ${database} from ${server}${NC}"
    return 0
}

# Function to import database to target server
import_database() {
    local database=$1
    local admin=$2
    local password=$3
    local backup_file="${BACKUP_DIR}/${database}.bacpac"
    
    echo -e "\n${BOLD}Importing ${database} to ${TARGET_SERVER}${NC}"
    
    # Use Azure CLI to import database
    echo -e "${BLUE}Importing database using Azure SQL Database import...${NC}"
    az sql db import \
        --server "${TARGET_SERVER%.*}" \
        --name "$database" \
        --admin-user "$admin" \
        --admin-password "$password" \
        --storage-key-type SharedAccessKey \
        --storage-uri "https://tbwajuicerstorage.blob.core.windows.net/sql-migration/${database}.bacpac" \
        --storage-key "your-storage-key"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to import database ${database} to ${TARGET_SERVER}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Successfully imported ${database} to ${TARGET_SERVER}${NC}"
    return 0
}

# Function to create a database on the target server
create_database() {
    local database=$1
    local admin=$2
    local password=$3
    
    echo -e "\n${BOLD}Creating ${database} on ${TARGET_SERVER}${NC}"
    
    # Use Azure CLI to create database
    echo -e "${BLUE}Creating database...${NC}"
    az sql db create \
        --server "${TARGET_SERVER%.*}" \
        --name "$database" \
        --service-objective S0
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to create database ${database} on ${TARGET_SERVER}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Successfully created ${database} on ${TARGET_SERVER}${NC}"
    return 0
}

# Function to verify database migration
verify_database() {
    local database=$1
    local admin=$2
    local password=$3
    
    echo -e "\n${BOLD}Verifying ${database} on ${TARGET_SERVER}${NC}"
    
    # Use SQLCMD to count tables
    echo -e "${BLUE}Counting tables...${NC}"
    local table_count=$(sqlcmd -S "$TARGET_SERVER" -d "$database" -U "$admin" -P "$password" -Q "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'" -h -1)
    
    if [ -z "$table_count" ] || [ "$table_count" -eq 0 ]; then
        echo -e "${RED}Error: No tables found in ${database} on ${TARGET_SERVER}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Verification successful. Found ${table_count} tables in ${database} on ${TARGET_SERVER}${NC}"
    return 0
}

# Main migration process
for source_server in "${!SOURCE_SERVERS[@]}"; do
    database="${SOURCE_SERVERS[$source_server]}"
    
    echo -e "\n${BOLD}Processing database ${database} from ${source_server}${NC}"
    
    # Export database from source server
    export_database "$source_server" "$database" "$SOURCE_ADMIN" "$SOURCE_PASSWORD"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Skipping import for ${database}${NC}"
        continue
    fi
    
    # Create database on target server
    create_database "$database" "$TARGET_ADMIN" "$TARGET_PASSWORD"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Skipping import for ${database}${NC}"
        continue
    fi
    
    # Import database to target server
    import_database "$database" "$TARGET_ADMIN" "$TARGET_PASSWORD"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Skipping verification for ${database}${NC}"
        continue
    fi
    
    # Verify database migration
    verify_database "$database" "$TARGET_ADMIN" "$TARGET_PASSWORD"
done

# Clean up
echo -e "\n${BOLD}Migration Complete${NC}"
echo -e "${BLUE}Backup files are located at: ${BACKUP_DIR}${NC}"

# Summary
echo -e "\n${BOLD}Migration Summary${NC}"
echo "=============================================="
for source_server in "${!SOURCE_SERVERS[@]}"; do
    database="${SOURCE_SERVERS[$source_server]}"
    
    # Check if database exists on target server
    az sql db show --server "${TARGET_SERVER%.*}" --name "$database" &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${database}: ${GREEN}Successfully migrated${NC}"
    else
        echo -e "${database}: ${RED}Migration failed${NC}"
    fi
done