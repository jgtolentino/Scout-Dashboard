-- Migration script to add missing columns for Scout pipeline integrity
-- This ensures all required fields for DLT + dbt pipeline are present

-- 1. Add missing timestamp fields for late-arriving & windowed logic
-- SalesInteractionBrands
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractionBrands') AND name = 'CreatedAtUtc')
BEGIN
    ALTER TABLE dbo.SalesInteractionBrands
    ADD CreatedAtUtc DATETIME2(7) NOT NULL DEFAULT GETUTCDATE();
    
    PRINT 'Added CreatedAtUtc to SalesInteractionBrands';
END

-- SalesInteractions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'IngestedAt')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD IngestedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE();
    
    PRINT 'Added IngestedAt to SalesInteractions';
END

-- bronze_device_logs
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bronze_device_logs') AND name = 'IngestedAt')
BEGIN
    ALTER TABLE dbo.bronze_device_logs
    ADD IngestedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE();
    
    PRINT 'Added IngestedAt to bronze_device_logs';
END

-- 2. Add IsDeleted or IsActive columns for soft delete handling
-- Customers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Customers') AND name = 'IsActive')
BEGIN
    ALTER TABLE dbo.Customers
    ADD IsActive BIT NOT NULL DEFAULT 1;
    
    PRINT 'Added IsActive to Customers';
END

-- Products
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'IsActive')
BEGIN
    ALTER TABLE dbo.Products
    ADD IsActive BIT NOT NULL DEFAULT 1;
    
    PRINT 'Added IsActive to Products';
END

-- Stores
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Stores') AND name = 'IsActive')
BEGIN
    ALTER TABLE dbo.Stores
    ADD IsActive BIT NOT NULL DEFAULT 1;
    
    PRINT 'Added IsActive to Stores';
END

-- 3. Add metadata for source tracking
-- bronze_transcriptions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bronze_transcriptions') AND name = 'SourceFile')
BEGIN
    ALTER TABLE dbo.bronze_transcriptions
    ADD SourceFile NVARCHAR(255) NULL;
    
    PRINT 'Added SourceFile to bronze_transcriptions';
END

-- bronze_vision_detections
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bronze_vision_detections') AND name = 'ZoneID')
BEGIN
    ALTER TABLE dbo.bronze_vision_detections
    ADD ZoneID NVARCHAR(50) NULL;
    
    PRINT 'Added ZoneID to bronze_vision_detections';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bronze_vision_detections') AND name = 'CameraAngle')
BEGIN
    ALTER TABLE dbo.bronze_vision_detections
    ADD CameraAngle NVARCHAR(50) NULL;
    
    PRINT 'Added CameraAngle to bronze_vision_detections';
END

-- SalesInteractions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'SessionID')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD SessionID NVARCHAR(128) NULL;
    
    PRINT 'Added SessionID to SalesInteractions';
END

-- 4. Add sessionization columns
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'SessionStart')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD SessionStart DATETIME2(7) NULL;
    
    PRINT 'Added SessionStart to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'SessionEnd')
BEGIN
    ALTER TABLE dbo.SalesInteractions
    ADD SessionEnd DATETIME2(7) NULL;
    
    PRINT 'Added SessionEnd to SalesInteractions';
END

-- 5. Create EdgeDeviceRegistry table for device metadata
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.EdgeDeviceRegistry') AND type = 'U')
BEGIN
    CREATE TABLE dbo.EdgeDeviceRegistry (
        DeviceID NVARCHAR(50) PRIMARY KEY,
        DeviceType NVARCHAR(50) NOT NULL,
        Location NVARCHAR(100) NOT NULL,
        StoreID INT NULL,
        ZoneID NVARCHAR(50) NULL,
        InstallDate DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        LastHeartbeat DATETIME2(7) NULL,
        FirmwareVersion NVARCHAR(50) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        ModifiedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
    );
    
    PRINT 'Created EdgeDeviceRegistry table';
END

-- 6. Add NLP optimization fields to SalesInteractionTranscripts
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractionTranscripts') AND name = 'WordCount')
BEGIN
    ALTER TABLE dbo.SalesInteractionTranscripts
    ADD WordCount INT NULL;
    
    PRINT 'Added WordCount to SalesInteractionTranscripts';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractionTranscripts') AND name = 'LangCode')
BEGIN
    ALTER TABLE dbo.SalesInteractionTranscripts
    ADD LangCode NVARCHAR(10) NULL DEFAULT 'en';
    
    PRINT 'Added LangCode to SalesInteractionTranscripts';
END

-- 7. Create TranscriptChunkAudit table for quality scoring
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.TranscriptChunkAudit') AND type = 'U')
BEGIN
    CREATE TABLE dbo.TranscriptChunkAudit (
        ChunkID INT IDENTITY(1,1) PRIMARY KEY,
        TranscriptID INT NOT NULL,
        ChunkText NVARCHAR(MAX) NOT NULL,
        StartOffset INT NOT NULL,
        EndOffset INT NOT NULL,
        TranscriptQualityScore FLOAT NULL,
        NoiseLevel FLOAT NULL,
        IsReviewed BIT NOT NULL DEFAULT 0,
        ReviewedBy NVARCHAR(50) NULL,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TranscriptChunkAudit_SalesInteractionTranscripts FOREIGN KEY (TranscriptID) 
            REFERENCES dbo.SalesInteractionTranscripts(TranscriptID)
    );
    
    PRINT 'Created TranscriptChunkAudit table';
END

-- 8. Add persona segment for AI feature store
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Customers') AND name = 'PersonaSegment')
BEGIN
    ALTER TABLE dbo.Customers
    ADD PersonaSegment NVARCHAR(50) NULL;
    
    PRINT 'Added PersonaSegment to Customers';
END

-- Create indexes for better join performance
-- Only create if they don't exist
PRINT 'Creating or checking indexes...';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractionBrands_BrandID' AND object_id = OBJECT_ID('dbo.SalesInteractionBrands'))
BEGIN
    CREATE INDEX IX_SalesInteractionBrands_BrandID ON dbo.SalesInteractionBrands(BrandID);
    PRINT 'Created index IX_SalesInteractionBrands_BrandID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractions_FacialID' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
BEGIN
    CREATE INDEX IX_SalesInteractions_FacialID ON dbo.SalesInteractions(FacialID);
    PRINT 'Created index IX_SalesInteractions_FacialID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractions_ProductID' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
BEGIN
    CREATE INDEX IX_SalesInteractions_ProductID ON dbo.SalesInteractions(ProductID);
    PRINT 'Created index IX_SalesInteractions_ProductID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractions_DeviceID' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
BEGIN
    CREATE INDEX IX_SalesInteractions_DeviceID ON dbo.SalesInteractions(DeviceID);
    PRINT 'Created index IX_SalesInteractions_DeviceID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractions_StoreID' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
BEGIN
    CREATE INDEX IX_SalesInteractions_StoreID ON dbo.SalesInteractions(StoreID);
    PRINT 'Created index IX_SalesInteractions_StoreID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractions_SessionID' AND object_id = OBJECT_ID('dbo.SalesInteractions'))
BEGIN
    CREATE INDEX IX_SalesInteractions_SessionID ON dbo.SalesInteractions(SessionID);
    PRINT 'Created index IX_SalesInteractions_SessionID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SalesInteractionTranscripts_InteractionID' AND object_id = OBJECT_ID('dbo.SalesInteractionTranscripts'))
BEGIN
    CREATE INDEX IX_SalesInteractionTranscripts_InteractionID ON dbo.SalesInteractionTranscripts(InteractionID);
    PRINT 'Created index IX_SalesInteractionTranscripts_InteractionID';
END

PRINT 'Migration complete!';