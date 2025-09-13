-- SQL Script to extend schema for Exploded Brand Mentions
-- Option A: Separate mentions table with proper indexing
-- Created: 2025-05-12

-- Create the TranscriptEntityMentions table
-- Match field naming with standardized naming from transcript_field_map.yaml
CREATE TABLE dbo.TranscriptEntityMentions (
  InteractionID     VARCHAR(60)   NOT NULL,
  ChunkIndex        INT           NOT NULL,
  MentionedBrand    NVARCHAR(255) NOT NULL,
  ConfidenceScore   FLOAT         NULL,
  DeviceID          VARCHAR(60)   NULL,
  DetectedAt        DATETIME2     DEFAULT SYSDATETIME(),
  PRIMARY KEY (InteractionID, ChunkIndex, MentionedBrand),
  FOREIGN KEY (InteractionID, ChunkIndex)
    REFERENCES dbo.SalesInteractionTranscripts(InteractionID, ChunkIndex)
);

-- Create supporting indexes for optimized querying
CREATE INDEX idx_brand_mentions_device ON dbo.TranscriptEntityMentions(DeviceID);
CREATE INDEX idx_brand_mentions_brand ON dbo.TranscriptEntityMentions(MentionedBrand);
CREATE INDEX idx_brand_mentions_confidence ON dbo.TranscriptEntityMentions(ConfidenceScore);

-- Create view for full transcript with brands (using standardized field names)
CREATE VIEW dbo.TranscriptWithBrands AS
SELECT
  t.InteractionID,
  t.ChunkIndex,
  t.ChunkText,              -- Using ChunkText per standardized naming
  t.ChunkTimestamp,
  t.FacialID,
  b.MentionedBrand,
  b.ConfidenceScore,
  b.DeviceID
FROM
  dbo.SalesInteractionTranscripts t
LEFT JOIN
  dbo.TranscriptEntityMentions b
ON
  t.InteractionID = b.InteractionID AND t.ChunkIndex = b.ChunkIndex;

-- Example: Retrieve all transcripts with brand mentions above a confidence threshold
-- SELECT * FROM dbo.TranscriptWithBrands WHERE ConfidenceScore > 0.8 ORDER BY InteractionID, ChunkIndex;

-- Example: Count frequency of brand mentions by device
-- SELECT DeviceID, MentionedBrand, COUNT(*) AS Frequency 
-- FROM dbo.TranscriptEntityMentions 
-- GROUP BY DeviceID, MentionedBrand 
-- ORDER BY COUNT(*) DESC;