-- =====================================================
-- Master Migration Execution Script
-- File: 00_execute_all_migrations.sql
-- Purpose: Execute all Sprint 10-12 migrations in sequence
-- =====================================================

USE [scout_analytics];
GO

PRINT '========================================================';
PRINT 'SCOUT ANALYTICS SCHEMA MIGRATION - SPRINTS 10-12';
PRINT 'Execution started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';
PRINT '';

-- =====================================================
-- Pre-Migration Backup Recommendations
-- =====================================================

PRINT 'PRE-MIGRATION CHECKLIST:';
PRINT '1. Ensure database backup is completed';
PRINT '2. Verify no active ETL processes are running';
PRINT '3. Confirm maintenance window is active';
PRINT '4. Test connection to database with appropriate permissions';
PRINT '';

-- Check if we're in the right database
IF DB_NAME() != 'scout_analytics'
BEGIN
    PRINT 'ERROR: Not connected to scout_analytics database!';
    PRINT 'Please connect to the correct database before proceeding.';
    RETURN;
END

-- =====================================================
-- SPRINT 10: Transaction Duration and Amounts
-- =====================================================

PRINT '========================================================';
PRINT 'EXECUTING SPRINT 10: TRANSACTION DURATION AND AMOUNTS';
PRINT '========================================================';

:r 02_sprint10_transaction_duration_amounts.sql

PRINT '';
PRINT 'Sprint 10 completed successfully!';
PRINT '';

-- =====================================================
-- SPRINT 11: Substitution Tracking and Views
-- =====================================================

PRINT '========================================================';
PRINT 'EXECUTING SPRINT 11: SUBSTITUTION TRACKING AND VIEWS';
PRINT '========================================================';

:r 03_sprint11_substitution_tracking_views.sql

PRINT '';
PRINT 'Sprint 11 completed successfully!';
PRINT '';

-- =====================================================
-- SPRINT 12: FK Constraints and Validation
-- =====================================================

PRINT '========================================================';
PRINT 'EXECUTING SPRINT 12: FK CONSTRAINTS AND VALIDATION';
PRINT '========================================================';

:r 04_sprint12_fk_constraints_validation.sql

PRINT '';
PRINT 'Sprint 12 completed successfully!';
PRINT '';

-- =====================================================
-- Post-Migration Validation
-- =====================================================

PRINT '========================================================';
PRINT 'POST-MIGRATION VALIDATION';
PRINT '========================================================';

-- Validate schema changes
SELECT 
    'New Columns Added' as ValidationCheck,
    COUNT(*) as Count
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'RequestMethods', 'Customers')
AND c.name IN ('StartTime', 'EndTime', 'DurationSec', 'TransactionAmount', 
               'IsSubstitution', 'SubstitutedProductID', 'SuggestionAccepted', 
               'IsStoreOwnerSuggested', 'RequestGroup', 'AgeBracket');

-- Validate new tables
SELECT 
    'New Tables Created' as ValidationCheck,
    COUNT(*) as Count
FROM sys.tables
WHERE name IN ('v_SkuFrequency', 'GeoDimension', 'ProductUpdates', 'StoreUpdates');

-- Validate new views
SELECT 
    'New Views Created' as ValidationCheck,
    COUNT(*) as Count
FROM sys.views
WHERE name IN ('v_TransactionStats', 'v_SubstitutionAnalysis', 
               'v_RequestMethodAnalysis', 'v_BasketAnalysis', 'v_SystemHealthMetrics');

-- Validate new procedures
SELECT 
    'New Procedures Created' as ValidationCheck,
    COUNT(*) as Count
FROM sys.procedures
WHERE name IN ('sp_RefreshSkuFrequency', 'sp_DataQualityCheck', 
               'sp_NightlyDataIntegrityCheck', 'sp_ExportDashboardData');

-- Validate foreign keys
SELECT 
    'Foreign Keys Added' as ValidationCheck,
    COUNT(*) as Count
FROM sys.foreign_keys
WHERE name IN ('FK_SessionMatches_Transcription', 'FK_SessionMatches_Vision',
               'FK_SalesInteractionTranscripts_SalesInteractions', 
               'FK_TransactionItems_SubstitutedProduct',
               'FK_GeoDimension_Store', 'FK_ProductUpdates_Product', 'FK_StoreUpdates_Store');

-- Sample data validation
SELECT 
    'Transactions with Duration Data' as ValidationCheck,
    COUNT(*) as Count
FROM dbo.SalesInteractions
WHERE DurationSec IS NOT NULL;

SELECT 
    'Transactions with Amount Data' as ValidationCheck,
    COUNT(*) as Count
FROM dbo.SalesInteractions
WHERE TransactionAmount IS NOT NULL;

SELECT 
    'SKU Frequency Records' as ValidationCheck,
    COUNT(*) as Count
FROM dbo.v_SkuFrequency;

-- =====================================================
-- Performance Validation
-- =====================================================

PRINT '';
PRINT 'PERFORMANCE VALIDATION:';

-- Check index creation
SELECT 
    'Performance Indexes Created' as ValidationCheck,
    COUNT(*) as Count
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('SalesInteractions', 'TransactionItems', 'v_SkuFrequency')
AND i.name LIKE 'IX_%';

-- Test view performance (sample query)
DECLARE @StartTime DATETIME2 = GETDATE();
SELECT TOP 100 * FROM dbo.v_TransactionStats;
DECLARE @EndTime DATETIME2 = GETDATE();
DECLARE @Duration INT = DATEDIFF(MILLISECOND, @StartTime, @EndTime);

PRINT 'Sample view query performance: ' + CAST(@Duration AS VARCHAR) + 'ms';

-- =====================================================
-- Migration Summary Report
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT 'MIGRATION SUMMARY REPORT';
PRINT '========================================================';

INSERT INTO dbo.IntegrationAuditLogs (LogLevel, Message, CreatedAt)
VALUES ('INFO', 'SCHEMA MIGRATION COMPLETED - SPRINTS 10-12

SPRINT 10 DELIVERABLES:
✓ Added transaction duration tracking (StartTime, EndTime, DurationSec)
✓ Added persisted transaction amounts with trigger maintenance
✓ Created performance indexes for time-based analysis
✓ Added transaction statistics view (v_TransactionStats)

SPRINT 11 DELIVERABLES:
✓ Added substitution tracking fields to TransactionItems
✓ Added request method grouping (Branded/Unbranded/Unsure)
✓ Created materialized SKU frequency table with refresh procedure
✓ Added substitution analysis view (v_SubstitutionAnalysis)
✓ Added request method analysis view (v_RequestMethodAnalysis)
✓ Added basket analysis view (v_BasketAnalysis)
✓ Added geographic dimension table structure
✓ Added age bracket computed column

SPRINT 12 DELIVERABLES:
✓ Added foreign key constraints for referential integrity
✓ Created audit tables for Products and Stores with triggers
✓ Created comprehensive data quality validation procedures
✓ Added nightly data integrity job procedure
✓ Created system health monitoring views
✓ Added dashboard data export procedures
✓ Created maintenance schedule recommendations

NEXT STEPS:
1. Schedule sp_NightlyDataIntegrityCheck to run daily at 2 AM
2. Schedule sp_RefreshSkuFrequency to run every 4 hours
3. Populate GeoDimension table with store geographic data
4. Train dashboard users on new data fields and views
5. Monitor system performance and adjust indexes as needed

Migration completed successfully at ' + CONVERT(VARCHAR, GETDATE(), 120), GETDATE());

PRINT '';
PRINT 'All Sprint 10-12 migrations completed successfully!';
PRINT 'Check IntegrationAuditLogs table for detailed completion record.';
PRINT '';
PRINT 'IMPORTANT: Remember to schedule the new maintenance procedures:';
PRINT '- sp_NightlyDataIntegrityCheck (daily at 2 AM)';
PRINT '- sp_RefreshSkuFrequency (every 4 hours during business hours)';
PRINT '';
PRINT 'Migration execution completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================================';

GO