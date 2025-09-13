#!/bin/bash
# find_transcript_tables.sh - Find transcript tables across Azure SQL databases
# Wrapper script for PowerShell and sqlcmd approach
# Created: 2025-05-12

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_SCRIPT="${SCRIPT_DIR}/../sql/cross_db_schema_checker.sql"
OUTPUT_DIR="${SCRIPT_DIR}/../output"
OUTPUT_FILE="${OUTPUT_DIR}/transcript_table_scan_results.txt"
PS_SCRIPT="${SCRIPT_DIR}/find_transcript_tables.ps1"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Header
echo -e "\n${CYAN}===============================================${NC}"
echo -e "${CYAN}   DATABASE SCHEMA SCANNER FOR TRANSCRIPTS      ${NC}"
echo -e "${CYAN}===============================================${NC}\n"

# Check for required tools
echo -e "${BLUE}Checking for required tools...${NC}"

# Check for sqlcmd
if command -v sqlcmd &> /dev/null; then
    echo -e "${GREEN}✓ sqlcmd found${NC}"
    USE_SQLCMD=true
else
    echo -e "${YELLOW}⚠ sqlcmd not found${NC}"
    USE_SQLCMD=false
fi

# Check for PowerShell
if command -v pwsh &> /dev/null; then
    echo -e "${GREEN}✓ PowerShell found${NC}"
    USE_POWERSHELL=true
else
    echo -e "${YELLOW}⚠ PowerShell not found${NC}"
    USE_POWERSHELL=false
fi

# Prompt for connection details
echo -e "\n${BLUE}Enter Azure SQL Database connection details:${NC}"
read -p "Server name (e.g. server.database.windows.net): " SERVER_NAME
read -p "Username: " USERNAME
read -sp "Password: " PASSWORD
echo ""
read -p "Initial database to connect to (e.g. master): " INITIAL_DB

# Choose execution method
if [ "$USE_POWERSHELL" = true ]; then
    echo -e "\n${BLUE}Running scanner using PowerShell...${NC}"
    pwsh -File "${PS_SCRIPT}" -ServerName "${SERVER_NAME}" -Username "${USERNAME}" -Password "${PASSWORD}" -OutputFile "${OUTPUT_FILE}"
elif [ "$USE_SQLCMD" = true ]; then
    echo -e "\n${BLUE}Running scanner using sqlcmd...${NC}"
    # Execute SQL script directly
    sqlcmd -S "${SERVER_NAME}" -d "${INITIAL_DB}" -U "${USERNAME}" -P "${PASSWORD}" -i "${SQL_SCRIPT}" -o "${OUTPUT_FILE}"
else
    echo -e "${RED}Error: Neither sqlcmd nor PowerShell is available.${NC}"
    echo -e "${YELLOW}Please install either:${NC}"
    echo -e "  - sqlcmd: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility"
    echo -e "  - PowerShell: https://github.com/PowerShell/PowerShell"
    exit 1
fi

# Check if output file was created
if [ -f "${OUTPUT_FILE}" ]; then
    echo -e "\n${GREEN}Scan completed successfully!${NC}"
    echo -e "${BLUE}Results saved to: ${OUTPUT_FILE}${NC}"
    
    # Display a summary
    echo -e "\n${YELLOW}Summary from scan results:${NC}"
    
    # Try to extract summary information
    if grep -q "RECOMMENDED TARGET" "${OUTPUT_FILE}"; then
        echo -e "${GREEN}Found recommended target database and table:${NC}"
        grep -A 3 "PRIMARY ENRICHMENT TARGET" "${OUTPUT_FILE}" | tail -n +2
    else
        echo -e "${YELLOW}No clear enrichment target identified. See output file for details.${NC}"
    fi
else
    echo -e "\n${RED}Error: Scan failed to produce output file.${NC}"
fi

echo -e "\n${CYAN}===============================================${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "1. Review the output file for detailed findings"
echo -e "2. Identify the correct database for TranscriptionResults"
echo -e "3. Connect to that database before proceeding with schema extensions"
echo -e "${CYAN}===============================================${NC}\n"