-- TBWA Creative Campaign Analysis System - ColPali PageIndex Schema
-- Azure SQL Database Schema for Perplexity-style semantic indexing and cataloging

-- Main pageIndex table for semantic chunks and metadata
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
    embedding_vector VARBINARY(MAX), -- Serialized embedding vector
    chunk_index INT DEFAULT 0,
    chunk_size INT DEFAULT 0,
    content_type NVARCHAR(50), -- 'text', 'image', 'slide', 'video'
    confidence_score FLOAT DEFAULT 0.0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX IX_pageIndex_file_id (file_id),
    INDEX IX_pageIndex_filepath (filepath),
    INDEX IX_pageIndex_mood (mood_label),
    INDEX IX_pageIndex_quality (visual_quality_score),
    INDEX IX_pageIndex_created (created_at)
);

-- File metadata table
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
    INDEX IX_fileMetadata_campaign (campaign_name),
    INDEX IX_fileMetadata_client (client_name),
    INDEX IX_fileMetadata_status (processing_status),
    INDEX IX_fileMetadata_type (file_type)
);

-- Campaign-level aggregated insights
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
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX IX_campaignInsights_client (client_name),
    INDEX IX_campaignInsights_effectiveness (effectiveness_prediction)
);

-- Semantic search index for fast retrieval
CREATE TABLE semanticIndex (
    search_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    chunk_id UNIQUEIDENTIFIER NOT NULL,
    search_terms NVARCHAR(MAX), -- Extracted keywords for full-text search
    topic_clusters NVARCHAR(MAX), -- JSON array of topic clusters
    similarity_hash NVARCHAR(100), -- For deduplication
    search_rank FLOAT DEFAULT 0.0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (chunk_id) REFERENCES pageIndex(chunk_id) ON DELETE CASCADE,
    INDEX IX_semanticIndex_terms (search_terms),
    INDEX IX_semanticIndex_rank (search_rank)
);

-- Quality and mood classification results
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
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (chunk_id) REFERENCES pageIndex(chunk_id) ON DELETE CASCADE,
    INDEX IX_qualityMetrics_overall (overall_score)
);

-- Processing logs for audit trail
CREATE TABLE processingLogs (
    log_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    file_id UNIQUEIDENTIFIER,
    chunk_id UNIQUEIDENTIFIER,
    operation_type NVARCHAR(50), -- 'extraction', 'embedding', 'classification', 'indexing'
    status NVARCHAR(20), -- 'started', 'completed', 'failed'
    error_message NVARCHAR(MAX),
    processing_time_ms INT,
    model_version NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX IX_processingLogs_file (file_id),
    INDEX IX_processingLogs_status (status),
    INDEX IX_processingLogs_operation (operation_type)
);

-- Foreign key constraints
ALTER TABLE pageIndex 
ADD CONSTRAINT FK_pageIndex_fileMetadata 
FOREIGN KEY (file_id) REFERENCES fileMetadata(file_id) ON DELETE CASCADE;

-- Create full-text catalog and index for semantic search
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'pageIndex_catalog')
    CREATE FULLTEXT CATALOG pageIndex_catalog AS DEFAULT;

CREATE FULLTEXT INDEX ON pageIndex(text_snippet) 
KEY INDEX PK__pageIndex__chunk_id;

-- Views for common queries
CREATE VIEW vw_FileOverview AS
SELECT 
    fm.file_id,
    fm.original_filename,
    fm.campaign_name,
    fm.client_name,
    fm.file_type,
    fm.total_chunks,
    fm.processing_status,
    AVG(pi.visual_quality_score) as avg_quality,
    STRING_AGG(pi.mood_label, ', ') as moods,
    COUNT(pi.chunk_id) as indexed_chunks,
    fm.created_at
FROM fileMetadata fm
LEFT JOIN pageIndex pi ON fm.file_id = pi.file_id
GROUP BY fm.file_id, fm.original_filename, fm.campaign_name, 
         fm.client_name, fm.file_type, fm.total_chunks, 
         fm.processing_status, fm.created_at;

CREATE VIEW vw_CampaignSummary AS
SELECT 
    ci.campaign_name,
    ci.client_name,
    ci.total_files,
    ci.total_chunks,
    ci.avg_quality_score,
    ci.dominant_mood,
    ci.effectiveness_prediction,
    COUNT(DISTINCT fm.file_id) as processed_files,
    AVG(CAST(JSON_VALUE(ci.creative_features, '$.confidence_score') AS FLOAT)) as avg_confidence
FROM campaignInsights ci
LEFT JOIN fileMetadata fm ON ci.campaign_name = fm.campaign_name
GROUP BY ci.campaign_name, ci.client_name, ci.total_files, ci.total_chunks, 
         ci.avg_quality_score, ci.dominant_mood, ci.effectiveness_prediction;

-- Stored procedures for common operations
CREATE PROCEDURE sp_GetFileChunks
    @file_id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT 
        pi.chunk_id,
        pi.title,
        pi.text_snippet,
        pi.tags,
        pi.visual_quality_score,
        pi.mood_label,
        pi.chunk_index,
        pi.content_type,
        pi.confidence_score,
        qm.overall_score as quality_score
    FROM pageIndex pi
    LEFT JOIN qualityMetrics qm ON pi.chunk_id = qm.chunk_id
    WHERE pi.file_id = @file_id
    ORDER BY pi.chunk_index;
END;

CREATE PROCEDURE sp_SearchSemantic
    @query NVARCHAR(500),
    @limit INT = 20
AS
BEGIN
    SELECT TOP (@limit)
        pi.chunk_id,
        pi.file_id,
        fm.original_filename,
        fm.campaign_name,
        pi.title,
        pi.text_snippet,
        pi.visual_quality_score,
        pi.mood_label,
        pi.confidence_score
    FROM pageIndex pi
    INNER JOIN fileMetadata fm ON pi.file_id = fm.file_id
    INNER JOIN semanticIndex si ON pi.chunk_id = si.chunk_id
    WHERE CONTAINS(pi.text_snippet, @query)
    ORDER BY si.search_rank DESC, pi.visual_quality_score DESC;
END;

-- Initial data setup
INSERT INTO campaignInsights (campaign_name, client_name) VALUES 
('Sample Campaign', 'Sample Client');

-- Permissions for application user
-- GRANT SELECT, INSERT, UPDATE ON pageIndex TO [app_user];
-- GRANT SELECT, INSERT, UPDATE ON fileMetadata TO [app_user];
-- GRANT SELECT ON vw_FileOverview TO [app_user];
-- GRANT SELECT ON vw_CampaignSummary TO [app_user];
-- GRANT EXECUTE ON sp_GetFileChunks TO [app_user];
-- GRANT EXECUTE ON sp_SearchSemantic TO [app_user];