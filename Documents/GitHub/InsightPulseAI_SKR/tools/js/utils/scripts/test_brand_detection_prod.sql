-- Test Brand Detection in Production Environment
-- Created: 2025-05-12
-- For use by Basher only on production systems
-- This script performs a controlled test of brand detection logic

-- ========================================
-- STEP 1: Create test data
-- ========================================

-- Safety check to ensure we don't accidentally run this multiple times
IF EXISTS (SELECT 1 FROM dbo.SalesInteractionTranscripts WHERE InteractionID = 'TEST_BRAND_001')
BEGIN
    PRINT 'WARNING: Test interaction TEST_BRAND_001 already exists.'
    PRINT 'If you want to run the test again, execute the cleanup section first.'
    -- Uncomment to force continuation despite warning:
    -- GOTO CONTINUE_ANYWAY
    RETURN
END

PRINT '✅ Step 1: Creating test data...'

-- Insert test transcript with known brands
INSERT INTO dbo.SalesInteractionTranscripts
(InteractionID, ChunkIndex, ChunkTimestamp, ChunkText, FacialID)
VALUES
('TEST_BRAND_001', 0, SYSDATETIME(),
 'I just bought a Samsung phone and drank Pepsi at Jollibee while wearing Nike shoes.',
 'test_face_001');

-- Add a second chunk to test multi-chunk processing
INSERT INTO dbo.SalesInteractionTranscripts
(InteractionID, ChunkIndex, ChunkTimestamp, ChunkText, FacialID)
VALUES
('TEST_BRAND_001', 1, SYSDATETIME(),
 'I think Globe Telecom has better coverage than PLDT in this area.',
 'test_face_001');

-- Add a control chunk with no expected brand mentions
INSERT INTO dbo.SalesInteractionTranscripts
(InteractionID, ChunkIndex, ChunkTimestamp, ChunkText, FacialID)
VALUES
('TEST_BRAND_001', 2, SYSDATETIME(),
 'The weather is nice today. I might go for a walk later.',
 'test_face_001');

PRINT '✅ Test data created successfully - 3 transcript chunks inserted.'

-- ========================================
-- STEP 2: Run brand extraction
-- ========================================

PRINT '✅ Step 2: Brand extraction must be run manually.'
PRINT 'Execute this command in your shell:'
PRINT 'python /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/utils/scripts/brand_explode.py --test-id TEST_BRAND_001'
PRINT 'Or use the bash script:'
PRINT 'bash /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/utils/scripts/run_brand_extraction.sh --prod --test-id TEST_BRAND_001'

PRINT 'After running extraction, continue with steps 3 and 4 in this script.'

-- Placeholder for command execution
-- (Must be run manually since SQL can't directly execute shell commands)

-- ========================================
-- STEP 3: Verify results
-- ========================================

-- IMPORTANT: Run steps 3 and 4 only after extraction has been performed

CONTINUE_ANYWAY:

PRINT '✅ Step 3: Verifying results...'
PRINT 'Expected brands: Samsung, Pepsi, Jollibee, Nike, Globe Telecom, PLDT'

-- Check what brands were detected
SELECT 
    'DETECTED BRANDS' AS ResultType,
    InteractionID,
    ChunkIndex,
    MentionedBrand,
    ConfidenceScore,
    DeviceID,
    DetectedAt
FROM 
    dbo.TranscriptEntityMentions
WHERE 
    InteractionID = 'TEST_BRAND_001'
ORDER BY
    ChunkIndex, ConfidenceScore DESC;

-- Calculate hit rate
SELECT
    'DETECTION METRICS' AS ResultType,
    COUNT(*) AS TotalBrandsDetected,
    (SELECT COUNT(*) FROM dbo.SalesInteractionTranscripts 
     WHERE InteractionID = 'TEST_BRAND_001') AS TranscriptChunks,
    CONVERT(DECIMAL(5,2), AVG(ConfidenceScore) * 100) AS AvgConfidencePercent,
    CASE 
        WHEN COUNT(*) >= 5 THEN 'PASS' 
        WHEN COUNT(*) >= 3 THEN 'PARTIAL' 
        ELSE 'FAIL' 
    END AS TestResult
FROM 
    dbo.TranscriptEntityMentions
WHERE 
    InteractionID = 'TEST_BRAND_001';

-- ========================================
-- STEP 4: Clean up test data
-- ========================================

PRINT '✅ Step 4: Cleanup.'
PRINT 'To remove test data, uncomment and run the DELETE statements below'

/*
-- Delete brand mentions first (due to foreign key constraint)
DELETE FROM dbo.TranscriptEntityMentions
WHERE InteractionID = 'TEST_BRAND_001';

-- Then delete test transcripts
DELETE FROM dbo.SalesInteractionTranscripts
WHERE InteractionID = 'TEST_BRAND_001';

PRINT 'Test data cleaned up successfully.'
*/

-- ========================================
-- STEP 5: Summary
-- ========================================

PRINT '✅ Test procedure complete.'
PRINT 'To run the test again, first execute the cleanup statements in Step 4.';