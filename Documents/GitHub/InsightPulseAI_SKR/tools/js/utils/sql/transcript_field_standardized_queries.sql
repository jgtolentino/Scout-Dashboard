-- Standardized Queries for Transcript Fields
-- Created: 2025-05-12
-- Based on transcript_field_map.yaml

-- -----------------------------------------------------
-- TRANSCRIPT FIELD REFERENCE GUIDE
-- -----------------------------------------------------
--
-- This script provides standardized queries for working
-- with transcript data across different tables and layers
-- in the Project Scout database architecture.
--
-- IMPORTANT: Always use the standardized field names as
-- documented in transcript_field_map.yaml

-- -----------------------------------------------------
-- BRAND MENTION EXTRACTION QUERIES
-- -----------------------------------------------------

-- 1. Brand mention extraction from chunked transcripts (primary source)
SELECT 
    t.InteractionID,
    t.ChunkIndex,
    t.ChunkText,                        -- Note: Use ChunkText, not TranscriptionText
    t.ChunkTimestamp,
    t.DeviceID
FROM 
    dbo.SalesInteractionTranscripts t
WHERE 
    t.ChunkText IS NOT NULL
    AND t.ChunkText LIKE '%Samsung%';   -- Example brand filter

-- 2. Join brand mentions with transcript chunks
SELECT 
    t.InteractionID,
    t.ChunkIndex,
    t.ChunkText,
    m.MentionedBrand,
    m.ConfidenceScore
FROM 
    dbo.SalesInteractionTranscripts t
JOIN
    dbo.TranscriptEntityMentions m ON t.InteractionID = m.InteractionID AND t.ChunkIndex = m.ChunkIndex
WHERE
    m.ConfidenceScore > 0.8
ORDER BY
    t.InteractionID, t.ChunkIndex;

-- -----------------------------------------------------
-- REPORTING QUERIES USING GOLD LAYER
-- -----------------------------------------------------

-- 1. Get complete transcripts from Gold layer
SELECT 
    g.InteractionID,
    g.FullTranscript,                   -- Note: Use FullTranscript in Gold layer
    g.InteractionDate
FROM 
    dbo.gold_reconstructed_transcripts g
WHERE
    g.InteractionDate >= DATEADD(day, -7, GETDATE());

-- 2. Join Gold layer with brand mentions for reporting
SELECT 
    g.InteractionID,
    g.FullTranscript,
    COUNT(DISTINCT m.MentionedBrand) AS BrandMentionCount,
    STRING_AGG(DISTINCT m.MentionedBrand, ', ') AS MentionedBrands
FROM 
    dbo.gold_reconstructed_transcripts g
LEFT JOIN
    dbo.TranscriptEntityMentions m ON g.InteractionID = m.InteractionID
GROUP BY
    g.InteractionID, g.FullTranscript;

-- -----------------------------------------------------
-- SILVER LAYER QUERIES
-- -----------------------------------------------------

-- 1. Working with Silver layer transcripts
SELECT 
    s.InteractionID,
    s.TranscriptText,                   -- Note: Use TranscriptText in silver_transcripts
    s.Timestamp
FROM 
    dbo.silver_transcripts s
WHERE
    s.Timestamp >= DATEADD(hour, -24, GETDATE());

-- 2. Enriched transcripts from SalesInteractions
SELECT 
    i.InteractionID,
    i.TranscriptionText,                -- Note: Use TranscriptionText in SalesInteractions
    i.CustomerID,
    i.AgentID
FROM 
    dbo.SalesInteractions i
WHERE
    i.InteractionDate >= DATEADD(month, -1, GETDATE());

-- -----------------------------------------------------
-- CROSS-LAYER QUERIES
-- -----------------------------------------------------

-- Join across Bronze, Silver and Gold layers
SELECT 
    g.InteractionID,
    b.ChunkIndex,
    b.ChunkText AS BronzeText,          -- Bronze layer
    s.TranscriptText AS SilverText,     -- Silver layer
    g.FullTranscript AS GoldText,       -- Gold layer
    m.MentionedBrand,
    m.ConfidenceScore
FROM 
    dbo.gold_reconstructed_transcripts g
JOIN
    dbo.silver_transcripts s ON g.InteractionID = s.InteractionID
JOIN
    dbo.SalesInteractionTranscripts b ON s.InteractionID = b.InteractionID
LEFT JOIN
    dbo.TranscriptEntityMentions m ON b.InteractionID = m.InteractionID AND b.ChunkIndex = m.ChunkIndex
WHERE
    g.InteractionID = '12345'; -- Example InteractionID

-- -----------------------------------------------------
-- USAGE NOTES
-- -----------------------------------------------------
--
-- 1. Always use the correct field name based on the table:
--    - ChunkText: SalesInteractionTranscripts (Bronze)
--    - TranscriptText: bronze_transcriptions, silver_transcripts
--    - TranscriptionText: SalesInteractions, TranscriptionDataTable
--    - FullTranscript: gold_reconstructed_transcripts
--
-- 2. For brand mention extraction, use SalesInteractionTranscripts.ChunkText
--
-- 3. For reporting dashboards, use gold_reconstructed_transcripts.FullTranscript
--
-- 4. For entity mining, remember TranscriptEntityMentions links to
--    SalesInteractionTranscripts via (InteractionID, ChunkIndex)
--
-- Refer to transcript_field_map.yaml for complete field standardization details