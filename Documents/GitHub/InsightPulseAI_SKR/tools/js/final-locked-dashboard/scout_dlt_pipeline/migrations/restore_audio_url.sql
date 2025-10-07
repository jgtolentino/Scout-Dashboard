-- Restoration script for AudioURL field - Scout DLT Pipeline
-- Rollback script as part of rollback-dashboard-2025-05-19

-- Check if AudioURL column exists in bronze_transcriptions
-- If not, add it back

-- For SQL Server
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'bronze_transcriptions'
    AND COLUMN_NAME = 'AudioURL'
)
BEGIN
    ALTER TABLE dbo.bronze_transcriptions ADD AudioURL NVARCHAR(255) NULL;
    
    PRINT 'AudioURL column restored to bronze_transcriptions table.';
    
    -- Log the schema change
    INSERT INTO dbo.SchemaChangeLog (
        TableName, 
        ColumnName, 
        ChangeType, 
        ChangedBy, 
        ChangeDate, 
        ChangeNotes
    )
    VALUES (
        'bronze_transcriptions', 
        'AudioURL', 
        'ADD', 
        SUSER_SNAME(), 
        GETUTCDATE(), 
        'Rollback: Restored AudioURL field per rollback-dashboard-2025-05-19'
    );
END
ELSE
BEGIN
    PRINT 'AudioURL column already exists in bronze_transcriptions table.';
END

-- For PostgreSQL (commented out - uncomment if using PostgreSQL)
/*
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bronze_transcriptions'
        AND column_name = 'audiourl'
    ) THEN
        ALTER TABLE bronze_transcriptions ADD COLUMN audiourl VARCHAR(255);
        
        RAISE NOTICE 'AudioURL column restored to bronze_transcriptions table.';
        
        -- Log the schema change
        INSERT INTO schema_change_log (
            table_name, 
            column_name, 
            change_type, 
            changed_by, 
            change_date, 
            change_notes
        )
        VALUES (
            'bronze_transcriptions', 
            'audiourl', 
            'ADD', 
            current_user, 
            now(), 
            'Rollback: Restored AudioURL field per rollback-dashboard-2025-05-19'
        );
    ELSE
        RAISE NOTICE 'AudioURL column already exists in bronze_transcriptions table.';
    END IF;
END
$$;
*/

-- For Databricks SQL (uncomment if using Databricks SQL directly)
/*
CREATE OR REPLACE TABLE bronze_transcriptions AS
SELECT 
    *,
    NULL AS AudioURL  -- Add AudioURL column with NULL values
FROM 
    bronze_transcriptions;
*/

-- Note: After adding the column, you'll need to update existing records
-- with appropriate AudioURL values if needed. This can be done using
-- a separate update script based on available data.