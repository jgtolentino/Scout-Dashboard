#!/bin/bash

# =====================================================
# Azure SQL Database Migration Deployment Script
# Purpose: Deploy Scout Analytics schema migrations to Azure SQL
# =====================================================

set -e  # Exit on any error

# Configuration
SERVER_NAME="sqltbwaprojectscoutserver"
DATABASE_NAME="SQL-TBWA-ProjectScout-Reporting-Prod"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Compute"
MIGRATION_DIR="$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Azure CLI is logged in
    if ! az account show &> /dev/null; then
        error "Not logged into Azure CLI. Please run 'az login' first."
        exit 1
    fi
    
    # Check if sqlcmd is available
    if ! command -v sqlcmd &> /dev/null; then
        error "sqlcmd not found. Please install SQL Server command line tools."
        exit 1
    fi
    
    # Verify migration files exist
    local files=("02_sprint10_transaction_duration_amounts.sql" 
                 "03_sprint11_substitution_tracking_views.sql" 
                 "04_sprint12_fk_constraints_validation.sql")
    
    for file in "${files[@]}"; do
        if [[ ! -f "$MIGRATION_DIR/$file" ]]; then
            error "Migration file not found: $file"
            exit 1
        fi
    done
    
    success "Prerequisites check passed"
}

# Create database backup
create_backup() {
    log "Creating database backup before migration..."
    
    local backup_name="scout-analytics-pre-migration-$(date +%Y%m%d-%H%M%S)"
    
    # Export database to bacpac
    az sql db export \
        --admin-user sqladmin \
        --admin-password "$SQL_ADMIN_PASSWORD" \
        --server "$SERVER_NAME" \
        --name "$DATABASE_NAME" \
        --storage-key-type StorageAccessKey \
        --storage-key "$STORAGE_ACCESS_KEY" \
        --storage-uri "https://projectscoutdata.blob.core.windows.net/backups/${backup_name}.bacpac" \
        --resource-group "$RESOURCE_GROUP"
    
    if [[ $? -eq 0 ]]; then
        success "Database backup created: ${backup_name}.bacpac"
    else
        error "Failed to create database backup"
        exit 1
    fi
}

# Get database connection string
get_connection_string() {
    log "Retrieving database connection information..."
    
    # Get server FQDN
    SERVER_FQDN=$(az sql server show \
        --name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "fullyQualifiedDomainName" \
        --output tsv)
    
    if [[ -z "$SERVER_FQDN" ]]; then
        error "Could not retrieve server FQDN"
        exit 1
    fi
    
    success "Database server: $SERVER_FQDN"
}

# Execute SQL migration file
execute_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    log "Executing $description..."
    log "File: $sql_file"
    
    # Execute SQL file using sqlcmd
    sqlcmd -S "$SERVER_FQDN" -d "$DATABASE_NAME" -U sqladmin -P "$SQL_ADMIN_PASSWORD" -i "$MIGRATION_DIR/$sql_file" -b
    
    if [[ $? -eq 0 ]]; then
        success "$description completed successfully"
    else
        error "$description failed"
        return 1
    fi
}

# Validate migration results
validate_migration() {
    log "Validating migration results..."
    
    # Create validation script
    cat > "$MIGRATION_DIR/validate_migration.sql" << 'EOF'
-- Migration validation queries
SET NOCOUNT ON;

PRINT 'MIGRATION VALIDATION REPORT';
PRINT '===========================';

-- Check new columns
SELECT 'New Columns Added' as ValidationCheck, COUNT(*) as Count
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'RequestMethods', 'Customers')
AND c.name IN ('StartTime', 'EndTime', 'DurationSec', 'TransactionAmount', 
               'IsSubstitution', 'SubstitutedProductID', 'SuggestionAccepted', 
               'IsStoreOwnerSuggested', 'RequestGroup', 'AgeBracket');

-- Check new tables
SELECT 'New Tables Created' as ValidationCheck, COUNT(*) as Count
FROM sys.tables
WHERE name IN ('v_SkuFrequency', 'GeoDimension', 'ProductUpdates', 'StoreUpdates');

-- Check new views
SELECT 'New Views Created' as ValidationCheck, COUNT(*) as Count
FROM sys.views
WHERE name IN ('v_TransactionStats', 'v_SubstitutionAnalysis', 
               'v_RequestMethodAnalysis', 'v_BasketAnalysis', 'v_SystemHealthMetrics');

-- Check new procedures
SELECT 'New Procedures Created' as ValidationCheck, COUNT(*) as Count
FROM sys.procedures
WHERE name IN ('sp_RefreshSkuFrequency', 'sp_DataQualityCheck', 
               'sp_NightlyDataIntegrityCheck', 'sp_ExportDashboardData');

-- Check data population
SELECT 'Transactions with Duration' as ValidationCheck, COUNT(*) as Count
FROM SalesInteractions WHERE DurationSec IS NOT NULL;

SELECT 'Transactions with Amount' as ValidationCheck, COUNT(*) as Count
FROM SalesInteractions WHERE TransactionAmount IS NOT NULL;

PRINT 'Validation completed.';
EOF

    # Execute validation
    sqlcmd -S "$SERVER_FQDN" -d "$DATABASE_NAME" -U sqladmin -P "$SQL_ADMIN_PASSWORD" -i "$MIGRATION_DIR/validate_migration.sql"
    
    if [[ $? -eq 0 ]]; then
        success "Migration validation completed"
    else
        warning "Migration validation had issues - please review manually"
    fi
    
    # Clean up validation file
    rm -f "$MIGRATION_DIR/validate_migration.sql"
}

# Main deployment function
deploy_migration() {
    log "Starting Scout Analytics schema migration deployment..."
    log "Target: $SERVER_NAME.$DATABASE_NAME"
    
    # Execute migrations in order
    execute_sql_file "02_sprint10_transaction_duration_amounts.sql" "Sprint 10: Transaction Duration & Amounts"
    execute_sql_file "03_sprint11_substitution_tracking_views.sql" "Sprint 11: Substitution Tracking & Views"
    execute_sql_file "04_sprint12_fk_constraints_validation.sql" "Sprint 12: FK Constraints & Validation"
    
    success "All migration scripts executed successfully"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f "$MIGRATION_DIR/validate_migration.sql"
}

# Main execution
main() {
    log "Scout Analytics Migration Deployment"
    log "===================================="
    
    # Check if required environment variables are set
    if [[ -z "$SQL_ADMIN_PASSWORD" ]]; then
        error "SQL_ADMIN_PASSWORD environment variable not set"
        echo "Please set it with: export SQL_ADMIN_PASSWORD='your_password'"
        exit 1
    fi
    
    # Execute deployment steps
    check_prerequisites
    get_connection_string
    
    # Ask for confirmation
    echo
    warning "This will modify the production database: $DATABASE_NAME"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Migration cancelled by user"
        exit 0
    fi
    
    # Create backup if storage credentials are provided
    if [[ -n "$STORAGE_ACCESS_KEY" ]]; then
        create_backup
    else
        warning "STORAGE_ACCESS_KEY not set - skipping automatic backup"
        warning "Please ensure you have a manual backup before proceeding"
        read -p "Continue without automatic backup? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            exit 0
        fi
    fi
    
    # Deploy migration
    deploy_migration
    
    # Validate results
    validate_migration
    
    # Cleanup
    cleanup
    
    success "Migration deployment completed successfully!"
    log "Next steps:"
    log "1. Schedule maintenance jobs (sp_NightlyDataIntegrityCheck)"
    log "2. Populate GeoDimension table with geographic data"
    log "3. Monitor dashboard performance with new features"
    log "4. Review IntegrationAuditLogs for any warnings"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"