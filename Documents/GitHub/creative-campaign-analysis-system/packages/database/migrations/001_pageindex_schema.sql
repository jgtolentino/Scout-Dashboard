-- TBWA Creative Campaign Analysis System - Simple PageIndex Schema Migration
-- Version: 001_simple
-- Description: Create core PageIndex tables without full-text search

BEGIN TRANSACTION;

-- Main pageIndex table for semantic chunks and metadata
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pageIndex' AND xtype='U')
BEGIN
    CREATE TABLE pageIndex (
        chunk_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        file_id UNIQUEIDENTIFIER NOT NULL,
        filepath NVARCHAR(500) NOT NULL,
        title NVARCHAR(255),
        text_snippet NTEXT,
        tags NVARCHAR(MAX), -- JSON array of tags
        visual_quality_score FLOAT DEFAULT 0.0,
        semantic_topics NVARCHAR(MAX), -- JSON array of topics
        mood_label NVARCHAR(50),
        embedding_vector NVARCHAR(MAX), -- JSON serialized embedding vector
        chunk_index INT DEFAULT 0,
        chunk_size INT DEFAULT 0,
        content_type NVARCHAR(50), -- 'text', 'image', 'slide', 'video'
        confidence_score FLOAT DEFAULT 0.0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_pageIndex_file_id ON pageIndex(file_id);
    CREATE INDEX IX_pageIndex_filepath ON pageIndex(filepath);
    CREATE INDEX IX_pageIndex_mood ON pageIndex(mood_label);
    CREATE INDEX IX_pageIndex_quality ON pageIndex(visual_quality_score);
    CREATE INDEX IX_pageIndex_created ON pageIndex(created_at);
    CREATE INDEX IX_pageIndex_content_type ON pageIndex(content_type);
    
    PRINT 'Created table: pageIndex with indexes';
END

-- File metadata table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fileMetadata' AND xtype='U')
BEGIN
    CREATE TABLE fileMetadata (
        file_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        original_filename NVARCHAR(255) NOT NULL,
        filepath NVARCHAR(500) NOT NULL UNIQUE,
        file_size BIGINT,
        mime_type NVARCHAR(100),
        campaign_name NVARCHAR(255),
        client_name NVARCHAR(255),
        brand_name NVARCHAR(255),
        file_type NVARCHAR(50), -- 'video', 'image', 'presentation', 'document'
        processing_status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        total_chunks INT DEFAULT 0,
        azure_blob_url NVARCHAR(500),
        google_drive_id NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        processed_at DATETIME2,
        error_message NVARCHAR(MAX)
    );
    
    CREATE INDEX IX_fileMetadata_campaign ON fileMetadata(campaign_name);
    CREATE INDEX IX_fileMetadata_client ON fileMetadata(client_name);
    CREATE INDEX IX_fileMetadata_status ON fileMetadata(processing_status);
    CREATE INDEX IX_fileMetadata_type ON fileMetadata(file_type);
    CREATE INDEX IX_fileMetadata_created ON fileMetadata(created_at);
    
    PRINT 'Created table: fileMetadata with indexes';
END

-- Campaign-level aggregated insights
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaignInsights' AND xtype='U')
BEGIN
    CREATE TABLE campaignInsights (
        campaign_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_name NVARCHAR(255) NOT NULL UNIQUE,
        client_name NVARCHAR(255),
        total_files INT DEFAULT 0,
        total_chunks INT DEFAULT 0,
        avg_quality_score FLOAT DEFAULT 0.0,
        dominant_mood NVARCHAR(50),
        key_topics NVARCHAR(MAX), -- JSON array
        effectiveness_prediction FLOAT DEFAULT 0.0,
        creative_features NVARCHAR(MAX), -- JSON object from existing schema
        business_outcomes NVARCHAR(MAX), -- JSON object from existing schema
        award_submissions NVARCHAR(MAX), -- JSON array of award shows
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_campaignInsights_client ON campaignInsights(client_name);
    CREATE INDEX IX_campaignInsights_effectiveness ON campaignInsights(effectiveness_prediction);
    CREATE INDEX IX_campaignInsights_created ON campaignInsights(created_at);
    
    PRINT 'Created table: campaignInsights with indexes';
END

-- Semantic search index for fast retrieval
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='semanticIndex' AND xtype='U')
BEGIN
    CREATE TABLE semanticIndex (
        search_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        chunk_id UNIQUEIDENTIFIER NOT NULL,
        search_terms NVARCHAR(MAX), -- Extracted keywords for search
        topic_clusters NVARCHAR(MAX), -- JSON array of topic clusters
        similarity_hash NVARCHAR(100), -- For deduplication
        search_rank FLOAT DEFAULT 0.0,
        relevance_score FLOAT DEFAULT 0.0,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_semanticIndex_chunk ON semanticIndex(chunk_id);
    CREATE INDEX IX_semanticIndex_rank ON semanticIndex(search_rank);
    CREATE INDEX IX_semanticIndex_hash ON semanticIndex(similarity_hash);
    
    PRINT 'Created table: semanticIndex with indexes';
END

-- Quality and mood classification results
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='qualityMetrics' AND xtype='U')
BEGIN
    CREATE TABLE qualityMetrics (
        metric_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        chunk_id UNIQUEIDENTIFIER NOT NULL,
        content_clarity FLOAT DEFAULT 0.0, -- 0-1 scale
        visual_appeal FLOAT DEFAULT 0.0,
        message_strength FLOAT DEFAULT 0.0,
        brand_consistency FLOAT DEFAULT 0.0,
        emotional_impact FLOAT DEFAULT 0.0,
        technical_quality FLOAT DEFAULT 0.0,
        overall_score FLOAT DEFAULT 0.0,
        classification_model NVARCHAR(100), -- Model version used
        processing_time_ms INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_qualityMetrics_chunk ON qualityMetrics(chunk_id);
    CREATE INDEX IX_qualityMetrics_overall ON qualityMetrics(overall_score);
    CREATE INDEX IX_qualityMetrics_created ON qualityMetrics(created_at);
    
    PRINT 'Created table: qualityMetrics with indexes';
END

-- Processing logs for audit trail
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='processingLogs' AND xtype='U')
BEGIN
    CREATE TABLE processingLogs (
        log_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        file_id UNIQUEIDENTIFIER,
        chunk_id UNIQUEIDENTIFIER,
        operation_type NVARCHAR(50), -- 'extraction', 'embedding', 'classification', 'indexing'
        status NVARCHAR(20), -- 'started', 'completed', 'failed'
        error_message NVARCHAR(MAX),
        processing_time_ms INT,
        model_version NVARCHAR(100),
        agent_version NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_processingLogs_file ON processingLogs(file_id);
    CREATE INDEX IX_processingLogs_chunk ON processingLogs(chunk_id);
    CREATE INDEX IX_processingLogs_status ON processingLogs(status);
    CREATE INDEX IX_processingLogs_operation ON processingLogs(operation_type);
    CREATE INDEX IX_processingLogs_created ON processingLogs(created_at);
    
    PRINT 'Created table: processingLogs with indexes';
END

-- Add foreign key constraints after all tables are created
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_pageIndex_fileMetadata')
BEGIN
    ALTER TABLE pageIndex 
    ADD CONSTRAINT FK_pageIndex_fileMetadata 
    FOREIGN KEY (file_id) REFERENCES fileMetadata(file_id) ON DELETE CASCADE;
    PRINT 'Created foreign key: FK_pageIndex_fileMetadata';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_semanticIndex_pageIndex')
BEGIN
    ALTER TABLE semanticIndex 
    ADD CONSTRAINT FK_semanticIndex_pageIndex 
    FOREIGN KEY (chunk_id) REFERENCES pageIndex(chunk_id) ON DELETE CASCADE;
    PRINT 'Created foreign key: FK_semanticIndex_pageIndex';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_qualityMetrics_pageIndex')
BEGIN
    ALTER TABLE qualityMetrics 
    ADD CONSTRAINT FK_qualityMetrics_pageIndex 
    FOREIGN KEY (chunk_id) REFERENCES pageIndex(chunk_id) ON DELETE CASCADE;
    PRINT 'Created foreign key: FK_qualityMetrics_pageIndex';
END

-- Insert initial sample data
IF NOT EXISTS (SELECT * FROM campaignInsights WHERE campaign_name = 'System Initialization')
BEGIN
    INSERT INTO campaignInsights (campaign_name, client_name, total_files, total_chunks) 
    VALUES ('System Initialization', 'TBWA Philippines', 0, 0);
    PRINT 'Inserted initial campaign insight record';
END

COMMIT TRANSACTION;

PRINT 'PageIndex schema migration completed successfully!';
PRINT 'Tables created: pageIndex, fileMetadata, campaignInsights, semanticIndex, qualityMetrics, processingLogs';
PRINT 'Foreign key constraints added for data integrity';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Run database health check: npm run db:status';
PRINT '2. Test PageIndex agent: npm run pageindex:process --help';
PRINT '3. Start web dashboard: npm run dev';