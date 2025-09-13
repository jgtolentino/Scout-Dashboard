-- Create SalesInteractions and related tables needed for Sari-Sari Store enhancements
-- This script should be run before the sari_sari_schema_enhancements.sql

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create SalesInteractions table
CREATE TABLE IF NOT EXISTS SalesInteractions (
    InteractionID VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    SessionID VARCHAR(36) NOT NULL,
    StoreID VARCHAR(20) REFERENCES stores(store_id),
    CustomerID VARCHAR(36),
    InteractionTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    InteractionDuration INTEGER,
    InteractionType VARCHAR(50),
    DeviceID VARCHAR(36),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SalesInteractionBrands table
CREATE TABLE IF NOT EXISTS SalesInteractionBrands (
    InteractionBrandID SERIAL PRIMARY KEY,
    InteractionID VARCHAR(36) REFERENCES SalesInteractions(InteractionID),
    BrandID SMALLINT REFERENCES brands(brand_id),
    MentionCount INTEGER DEFAULT 1,
    Sentiment VARCHAR(20),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SalesInteractionTranscripts table
CREATE TABLE IF NOT EXISTS SalesInteractionTranscripts (
    TranscriptID SERIAL PRIMARY KEY,
    InteractionID VARCHAR(36) REFERENCES SalesInteractions(InteractionID),
    TranscriptText TEXT,
    Language VARCHAR(20) DEFAULT 'en',
    ProcessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ConfidenceScore DECIMAL(5,2)
);

-- Create TranscriptChunkAudit table
CREATE TABLE IF NOT EXISTS TranscriptChunkAudit (
    ChunkID SERIAL PRIMARY KEY,
    TranscriptID INTEGER REFERENCES SalesInteractionTranscripts(TranscriptID),
    ChunkText TEXT,
    StartTime INTEGER,
    EndTime INTEGER,
    QualityScore DECIMAL(5,2),
    Issues JSONB,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE IF NOT EXISTS Products (
    ProductID VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    ProductName VARCHAR(100) NOT NULL,
    BrandID SMALLINT REFERENCES brands(brand_id),
    CategoryID SMALLINT REFERENCES product_categories(category_id),
    UPC VARCHAR(20),
    DefaultPrice DECIMAL(10,2),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table (optional, can be minimal for initial implementation)
CREATE TABLE IF NOT EXISTS Customers (
    CustomerID VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    CustomerReference VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create EdgeDeviceRegistry table
CREATE TABLE IF NOT EXISTS EdgeDeviceRegistry (
    DeviceID VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
    DeviceName VARCHAR(100),
    DeviceType VARCHAR(50),
    StoreID VARCHAR(20) REFERENCES stores(store_id),
    InstallationDate TIMESTAMP,
    LastSeenAt TIMESTAMP,
    Status VARCHAR(20) DEFAULT 'active',
    FirmwareVersion VARCHAR(20),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_interactions_store ON SalesInteractions(StoreID);
CREATE INDEX IF NOT EXISTS idx_sales_interactions_session ON SalesInteractions(SessionID);
CREATE INDEX IF NOT EXISTS idx_sales_interactions_timestamp ON SalesInteractions(InteractionTimestamp);
CREATE INDEX IF NOT EXISTS idx_sales_interaction_brands_interaction ON SalesInteractionBrands(InteractionID);
CREATE INDEX IF NOT EXISTS idx_sales_interaction_brands_brand ON SalesInteractionBrands(BrandID);
CREATE INDEX IF NOT EXISTS idx_sales_interaction_transcripts_interaction ON SalesInteractionTranscripts(InteractionID);

-- Create view for simplified transcript analysis
CREATE OR REPLACE VIEW vw_interaction_transcript AS
SELECT
    si.InteractionID,
    si.StoreID,
    si.SessionID,
    si.InteractionTimestamp,
    si.InteractionDuration,
    s.name AS StoreName,
    st.store_type_name,
    sit.TranscriptText,
    sit.Language,
    sit.ConfidenceScore,
    (
        SELECT STRING_AGG(br.brand_name, ', ')
        FROM SalesInteractionBrands sib
        JOIN brands br ON sib.BrandID = br.brand_id
        WHERE sib.InteractionID = si.InteractionID
    ) AS MentionedBrands
FROM
    SalesInteractions si
JOIN
    stores s ON si.StoreID = s.store_id
JOIN
    store_types st ON s.store_type_id = st.store_type_id
LEFT JOIN
    SalesInteractionTranscripts sit ON si.InteractionID = sit.InteractionID;

-- Add comments for documentation
COMMENT ON TABLE SalesInteractions IS 'Core table for tracking customer interactions in stores';
COMMENT ON TABLE SalesInteractionBrands IS 'Tracks brand mentions within sales interactions';
COMMENT ON TABLE SalesInteractionTranscripts IS 'Stores speech transcriptions from store interactions';
COMMENT ON TABLE TranscriptChunkAudit IS 'Quality tracking for transcript segments';
COMMENT ON TABLE Products IS 'Product catalog reference table';
COMMENT ON TABLE Customers IS 'Basic customer reference table';
COMMENT ON TABLE EdgeDeviceRegistry IS 'Registration information for edge devices installed in stores';