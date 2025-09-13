-- Cross-Database Schema Diff Tool for Project Scout
-- Created: 2025-05-12
-- Purpose: Identify which database contains the TranscriptionResults table
--          and determine the optimal location for brand mention enrichment

-- Part 1: Get list of all databases
DECLARE @DatabaseList TABLE (DatabaseName NVARCHAR(255));

INSERT INTO @DatabaseList
SELECT name 
FROM sys.databases
WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb') -- Skip system DBs
  AND state_desc = 'ONLINE'                            -- Only online DBs
  AND name LIKE '%ProjectScout%' OR name LIKE '%TBWA%' -- Only Project Scout related DBs
ORDER BY name;

-- Part 2: Create temporary results table
IF OBJECT_ID('tempdb..#SchemaResults') IS NOT NULL
    DROP TABLE #SchemaResults;

CREATE TABLE #SchemaResults (
    DatabaseName NVARCHAR(255),
    TableName NVARCHAR(255),
    SchemaName NVARCHAR(255),
    ColumnCount INT,
    RowEstimate BIGINT,
    HasTranscriptionText BIT,
    HasBrandMentions BIT,
    IsEnrichmentTarget BIT
);

-- Part 3: Dynamic SQL to check each database
DECLARE @SQL NVARCHAR(MAX);
DECLARE @CurrentDB NVARCHAR(255);
DECLARE @ErrorMessage NVARCHAR(MAX);

DECLARE db_cursor CURSOR FOR 
SELECT DatabaseName FROM @DatabaseList;

OPEN db_cursor;
FETCH NEXT FROM db_cursor INTO @CurrentDB;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        -- Check for TranscriptionResults or similar tables
        SET @SQL = N'
        USE [' + @CurrentDB + '];
        
        -- Find relevant tables
        INSERT INTO #SchemaResults (DatabaseName, TableName, SchemaName, ColumnCount, RowEstimate, HasTranscriptionText, HasBrandMentions, IsEnrichmentTarget)
        SELECT 
            DB_NAME() AS DatabaseName,
            t.name AS TableName,
            SCHEMA_NAME(t.schema_id) AS SchemaName,
            (SELECT COUNT(*) FROM sys.columns WHERE object_id = t.object_id) AS ColumnCount,
            p.rows AS RowEstimate,
            CASE WHEN EXISTS (
                SELECT 1 FROM sys.columns c 
                WHERE c.object_id = t.object_id 
                AND c.name IN (''TranscriptionText'', ''Transcription'', ''SpeechText'', ''Text'')
            ) THEN 1 ELSE 0 END AS HasTranscriptionText,
            CASE WHEN EXISTS (
                SELECT 1 FROM sys.columns c 
                WHERE c.object_id = t.object_id 
                AND c.name IN (''BrandMentions'', ''Brands'', ''MentionedBrands'', ''EntityMentions'')
            ) THEN 1 ELSE 0 END AS HasBrandMentions,
            0 AS IsEnrichmentTarget
        FROM sys.tables t
        INNER JOIN sys.indexes i ON t.object_id = i.object_id
        INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
        WHERE t.name LIKE ''%Transcript%'' 
           OR t.name LIKE ''%Speech%''
           OR t.name LIKE ''%STT%''
           OR t.name LIKE ''%Recognition%''
           OR t.name LIKE ''%Entity%''
           OR t.name LIKE ''%Brand%''
           OR t.name = ''TranscriptionResults''
        GROUP BY t.name, t.schema_id, t.object_id, p.rows;
        ';
        
        EXEC sp_executesql @SQL;
        
    END TRY
    BEGIN CATCH
        -- Log error and continue
        SET @ErrorMessage = 'Error checking database [' + @CurrentDB + ']: ' + ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 10, 1) WITH NOWAIT;
    END CATCH
    
    FETCH NEXT FROM db_cursor INTO @CurrentDB;
END

CLOSE db_cursor;
DEALLOCATE db_cursor;

-- Part 4: Analyze results and identify enrichment target
-- The ideal enrichment target has:
-- 1. TranscriptionResults or equivalent table with text
-- 2. No existing brand mentions columns yet
-- 3. Ideally in the enrichment/processing database, not reporting

UPDATE #SchemaResults
SET IsEnrichmentTarget = 1
WHERE HasTranscriptionText = 1
  AND HasBrandMentions = 0
  AND (
    DatabaseName LIKE '%Enrichment%' 
    OR DatabaseName LIKE '%Process%'
    OR DatabaseName LIKE '%Ingest%'
    OR DatabaseName LIKE '%TBWA_ProjectScout_DB%'
  )
  AND DatabaseName NOT LIKE '%Reporting%'
  AND DatabaseName NOT LIKE '%ReadOnly%'
  AND DatabaseName NOT LIKE '%Archive%';

-- Part 5: Show results summary
SELECT 
    'DATABASE SCAN RESULTS' AS ResultType,
    COUNT(DISTINCT DatabaseName) AS DatabasesScanned,
    SUM(CASE WHEN HasTranscriptionText = 1 THEN 1 ELSE 0 END) AS TablesWithTranscriptionText,
    SUM(CASE WHEN IsEnrichmentTarget = 1 THEN 1 ELSE 0 END) AS PotentialEnrichmentTargets
FROM #SchemaResults;

-- Part 6: Show detailed results
SELECT
    'TRANSCRIPTION TABLES FOUND' AS ResultType,
    DatabaseName,
    TableName,
    SchemaName,
    ColumnCount,
    CAST(RowEstimate AS VARCHAR) + ' rows' AS EstimatedRows,
    CASE WHEN HasTranscriptionText = 1 THEN 'YES' ELSE 'NO' END AS HasTranscriptionText,
    CASE WHEN HasBrandMentions = 1 THEN 'YES' ELSE 'NO' END AS HasBrandMentions,
    CASE WHEN IsEnrichmentTarget = 1 THEN '✓ RECOMMENDED TARGET' ELSE '' END AS RecommendedTarget
FROM #SchemaResults
ORDER BY 
    IsEnrichmentTarget DESC,
    HasTranscriptionText DESC,
    DatabaseName,
    TableName;

-- Part 7: Generate recommendation for brand mention enrichment
DECLARE @TargetDB NVARCHAR(255);
DECLARE @TargetTable NVARCHAR(255);
DECLARE @TargetSchema NVARCHAR(255);

SELECT TOP 1
    @TargetDB = DatabaseName,
    @TargetTable = TableName,
    @TargetSchema = SchemaName
FROM #SchemaResults
WHERE IsEnrichmentTarget = 1
ORDER BY RowEstimate DESC;

IF @TargetDB IS NOT NULL
BEGIN
    PRINT '============================================================================';
    PRINT '    BRAND ENRICHMENT IMPLEMENTATION RECOMMENDATION                          ';
    PRINT '============================================================================';
    PRINT '';
    PRINT 'Based on database analysis, the recommended target for brand mention enrichment is:';
    PRINT '';
    PRINT '   Database: ' + @TargetDB;
    PRINT '   Table:    ' + @TargetTable;
    PRINT '   Schema:   ' + @TargetSchema;
    PRINT '';
    PRINT 'NEXT STEPS:';
    PRINT '';
    PRINT '1. Connect to the ' + @TargetDB + ' database';
    PRINT '   USE ' + @TargetDB + ';';
    PRINT '';
    PRINT '2. Create the TranscriptEntityMentions table:';
    PRINT '   CREATE TABLE dbo.TranscriptEntityMentions (';
    PRINT '     InteractionID     VARCHAR(60)   NOT NULL,';
    PRINT '     ChunkIndex        INT           NOT NULL,';
    PRINT '     MentionedBrand    NVARCHAR(255) NOT NULL,';
    PRINT '     ConfidenceScore   FLOAT         NULL,';
    PRINT '     DeviceID          VARCHAR(60)   NULL,';
    PRINT '     DetectedAt        DATETIME2     DEFAULT SYSDATETIME(),';
    PRINT '     PRIMARY KEY (InteractionID, ChunkIndex, MentionedBrand),';
    PRINT '     FOREIGN KEY (InteractionID, ChunkIndex)';
    PRINT '       REFERENCES ' + @TargetSchema + '.' + @TargetTable + '(InteractionID, ChunkIndex)';
    PRINT '   );';
    PRINT '';
    PRINT '3. Create supporting indexes';
    PRINT '';
    PRINT '4. Run the brand explode script targeting this database';
    PRINT '';
    PRINT '============================================================================';
END
ELSE
BEGIN
    PRINT 'No suitable enrichment target found. Consider creating a new enrichment database.';
END

-- Cleanup
DROP TABLE #SchemaResults;