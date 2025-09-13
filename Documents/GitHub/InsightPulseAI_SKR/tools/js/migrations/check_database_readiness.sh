#!/bin/bash

# =====================================================
# Database Readiness Check Script
# Purpose: Verify database state before migration
# =====================================================

set -e

# Configuration
SERVER_NAME="sqltbwaprojectscoutserver"
DATABASE_NAME="SQL-TBWA-ProjectScout-Reporting-Prod"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Compute"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

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

# Check if SQL admin password is set
if [[ -z "$SQL_ADMIN_PASSWORD" ]]; then
    error "SQL_ADMIN_PASSWORD environment variable not set"
    echo "Please set it with: export SQL_ADMIN_PASSWORD='your_password'"
    exit 1
fi

log "Checking database readiness for migration..."
log "Server: $SERVER_FQDN"
log "Database: $DATABASE_NAME"

# Create readiness check SQL
cat > check_readiness.sql << 'EOF'
SET NOCOUNT ON;

PRINT '===========================================';
PRINT 'DATABASE READINESS CHECK FOR MIGRATION';
PRINT '===========================================';

-- Check database size
SELECT 
    'Database Size Check' as CheckType,
    name as DatabaseName,
    size * 8.0 / 1024 as SizeMB,
    max_size * 8.0 / 1024 as MaxSizeMB,
    CAST(100.0 * size / max_size AS DECIMAL(5,2)) as PercentUsed
FROM sys.database_files
WHERE type = 0;

-- Check existing tables that will be modified
PRINT '';
PRINT 'EXISTING TABLES TO BE MODIFIED:';
SELECT 
    t.name as TableName,
    p.rows as RowCount,
    (SUM(a.total_pages) * 8) / 1024 as SizeMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'Products', 'Stores', 'RequestMethods', 'Customers')
GROUP BY t.name, p.rows
ORDER BY SizeMB DESC;

-- Check for existing columns that might conflict
PRINT '';
PRINT 'COLUMN CONFLICT CHECK:';
SELECT 
    'Potential Conflicts' as CheckType,
    t.name as TableName,
    c.name as ColumnName,
    ty.name as DataType
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'RequestMethods', 'Customers')
AND c.name IN ('StartTime', 'EndTime', 'DurationSec', 'TransactionAmount', 
               'IsSubstitution', 'SubstitutedProductID', 'SuggestionAccepted', 
               'IsStoreOwnerSuggested', 'RequestGroup', 'AgeBracket');

-- Check for existing objects that might conflict
PRINT '';
PRINT 'OBJECT CONFLICT CHECK:';
SELECT 'Existing Views' as ObjectType, name as ObjectName
FROM sys.views
WHERE name IN ('v_TransactionStats', 'v_SubstitutionAnalysis', 
               'v_RequestMethodAnalysis', 'v_BasketAnalysis', 'v_SystemHealthMetrics')
UNION ALL
SELECT 'Existing Tables' as ObjectType, name as ObjectName
FROM sys.tables
WHERE name IN ('v_SkuFrequency', 'GeoDimension', 'ProductUpdates', 'StoreUpdates')
UNION ALL
SELECT 'Existing Procedures' as ObjectType, name as ObjectName
FROM sys.procedures
WHERE name IN ('sp_RefreshSkuFrequency', 'sp_DataQualityCheck', 
               'sp_NightlyDataIntegrityCheck', 'sp_ExportDashboardData');

-- Check current data quality
PRINT '';
PRINT 'DATA QUALITY PRE-CHECK:';
SELECT 'Total SalesInteractions' as Metric, COUNT(*) as Count
FROM SalesInteractions
UNION ALL
SELECT 'Total TransactionItems', COUNT(*) FROM TransactionItems
UNION ALL
SELECT 'Orphaned TransactionItems', COUNT(*)
FROM TransactionItems ti
LEFT JOIN SalesInteractions si ON ti.InteractionID = si.InteractionID
WHERE si.InteractionID IS NULL
UNION ALL
SELECT 'Products without Brands', COUNT(*)
FROM Products p
LEFT JOIN Brands b ON p.BrandID = b.BrandID
WHERE p.BrandID IS NOT NULL AND b.BrandID IS NULL;

-- Check active connections
PRINT '';
PRINT 'ACTIVE CONNECTIONS:';
SELECT 
    'Active Connections' as Metric,
    COUNT(*) as Count
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID()
AND session_id != @@SPID;

PRINT '';
PRINT 'READINESS CHECK COMPLETED';
PRINT '===========================================';
EOF

# Execute readiness check
log "Executing database readiness check..."
sqlcmd -S "$SERVER_FQDN" -d "$DATABASE_NAME" -U sqladmin -P "$SQL_ADMIN_PASSWORD" -i check_readiness.sql

if [[ $? -eq 0 ]]; then
    success "Database readiness check completed"
    log "Review the output above for any potential conflicts or issues"
else
    error "Database readiness check failed"
    exit 1
fi

# Cleanup
rm -f check_readiness.sql

log "Next steps:"
log "1. Review the output above for any red flags"
log "2. Ensure database backup is current"
log "3. Set environment variables: export SQL_ADMIN_PASSWORD='your_password'"
log "4. Run migration: ./deploy_azure_migration.sh"