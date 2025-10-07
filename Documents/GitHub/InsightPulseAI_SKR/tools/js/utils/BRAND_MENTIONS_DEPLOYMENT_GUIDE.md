# Brand Mentions Extraction and Schema Extension Guide

This guide provides instructions for deploying the brand mentions extraction functionality in the Project Scout edge flow, including database schema extension, extraction script setup, and integration with Echo/Kalaw agents.

## 1. Overview

The Brand Mentions Extraction system enhances the STT processing pipeline by identifying and extracting brand references from sales interaction transcripts. This enables:

- Brand mention frequency analysis
- Named entity linking in transcripts
- Agent-discoverable SKR knowledge
- End-to-end validation of transcript processing

## 2. Components

### 2.1 Database Schema Extension

A new `TranscriptEntityMentions` table tracks brand mentions with metadata such as confidence scores, device IDs, and timestamps. This provides a structured way to query and analyze brand mentions.

### 2.2 Extraction Script

The `brand_explode.py` script processes transcript chunks, extracts brand mentions using NLP, and stores the results in the database. It also syncs the data to Kalaw's SKR for knowledge integration.

### 2.3 Agent Integration

- **Echo**: Runs the extraction script on transcript chunks
- **Kalaw**: Integrates extracted entities into the SKR
- **Caca**: Validates brand detection accuracy

## 3. Deployment Steps

### 3.1 Database Schema Extension

1. Connect to the SQL Server instance
2. Execute the schema extension script:

```bash
# Option A: Using sqlcmd
sqlcmd -S <server> -d <database> -U <username> -P <password> -i schema_extension_brand_mentions.sql

# Option B: Using Azure Data Studio or SSMS
# Open and execute schema_extension_brand_mentions.sql
```

### 3.2 Install Python Dependencies

The extraction script requires the following Python packages:

```bash
pip install pandas sqlalchemy pyodbc spacy
python -m spacy download en_core_web_lg
```

### 3.3 Configure Brand Extraction

1. Update database connection string in the script or use environment variables
2. Ensure the SKR directory structure exists:
   ```
   SKR/
     transcripts/
       entity_mentions/
       reference_data/
         known_brands.json
   ```

### 3.4 Run Initial Extraction

Execute the extraction script in production mode:

```bash
python brand_explode.py --conn "mssql+pyodbc://user:pass@server/database?driver=ODBC+Driver+17+for+SQL+Server"
```

Or use the shell script for integration with the validation report:

```bash
./run_brand_extraction.sh
```

### 3.5 Verify Deployment

Check the following to verify successful deployment:

1. Confirm the `TranscriptEntityMentions` table was created
2. Verify brand extraction results in the table
3. Check SKR for synchronized entity data
4. Review the validation report with brand mentions section

## 4. Agent Configuration Tasks

### 4.1 Echo Configuration

Update Echo's configuration to run brand extraction after STT processing:

1. Add brand extraction to Echo's task queue
2. Configure execution trigger on transcript completion
3. Set up monitoring for failed extractions

### 4.2 Kalaw Configuration

Configure Kalaw to integrate brand mentions:

1. Set up directory monitoring for new brand data
2. Configure SKR indexing for entity data
3. Enable named entity linking in knowledge base

### 4.3 Caca QA Integration

Set up Caca for brand detection validation:

1. Configure validation thresholds (confidence > 0.8)
2. Implement sampling for validation reports
3. Set up alert channels for detection anomalies

## 5. Testing in Production (Without Risk)

Before running brand extraction on all production data, it's recommended to perform a controlled test to validate the implementation without affecting real data.

### Running the Controlled Test

The test procedure injects a test transcript with known brands, runs the extraction, and verifies the results:

```bash
# Automatic test runner
./brand_detection_test_runner.sh

# Manual test steps:
# 1. Run SQL script to create test data
sqlcmd -S <server> -d <database> -i utils/sql/test_brand_detection_prod.sql

# 2. Run extraction on just the test transcript
./run_brand_extraction.sh --prod --test-id TEST_BRAND_001

# 3. Verify results by querying the database
sqlcmd -S <server> -d <database> -Q "SELECT * FROM dbo.TranscriptEntityMentions WHERE InteractionID = 'TEST_BRAND_001';"

# 4. Clean up test data
sqlcmd -S <server> -d <database> -Q "DELETE FROM dbo.TranscriptEntityMentions WHERE InteractionID = 'TEST_BRAND_001'; DELETE FROM dbo.SalesInteractionTranscripts WHERE InteractionID = 'TEST_BRAND_001';"
```

### Expected Test Results

If successful, the test will detect all the brands in the test transcript with high confidence:
- Samsung
- Pepsi
- Jollibee
- Nike
- Globe Telecom
- PLDT

## 6. Operational Commands

### Run Brand Extraction Manually

```bash
# Development/Testing (demo mode)
python brand_explode.py --demo

# Production with specific statuses
python brand_explode.py --status="complete,validated" --conn="..."

# For specific test Interaction ID only
python brand_explode.py --test-id="TEST_BRAND_001" --conn="..."

# Full integration with report
./run_brand_extraction.sh
```

### Monitor Brand Mentions

```sql
-- Most mentioned brands
SELECT MentionedBrand, COUNT(*) AS Frequency 
FROM dbo.TranscriptEntityMentions 
GROUP BY MentionedBrand 
ORDER BY COUNT(*) DESC;

-- Brand mentions by device
SELECT DeviceID, MentionedBrand, COUNT(*) AS Frequency 
FROM dbo.TranscriptEntityMentions 
GROUP BY DeviceID, MentionedBrand 
ORDER BY DeviceID, COUNT(*) DESC;

-- Low confidence mentions for QA
SELECT * FROM dbo.TranscriptEntityMentions 
WHERE ConfidenceScore < 0.8 
ORDER BY ConfidenceScore ASC;
```

## 7. Next Steps

After deployment, consider these enhancements:

1. **Confidence Recalibration**: Fine-tune confidence scores with human feedback
2. **Brand Category Tagging**: Add industry/category information to brand mentions
3. **Competitive Analysis**: Implement relative frequency analysis for brand groups
4. **Sentiment Analysis**: Add sentiment scores to brand mentions
5. **Visualization Dashboard**: Create a brand mention dashboard in Superset

---

## Appendix A: Troubleshooting

### Common Issues

1. **Missing NLP Models**
   - Error: `Failed to load spaCy model`
   - Solution: Run `python -m spacy download en_core_web_lg`

2. **Database Connection Errors**
   - Error: `Failed to connect to database`
   - Solution: Verify connection string and network access

3. **Missing Brand Data in SKR**
   - Error: Missing data in Kalaw's knowledge base
   - Solution: Check file permissions and paths in `brand_explode.py`

### Getting Help

If you encounter issues, contact:
- **Basher** for database schema issues
- **Echo** for extraction script problems
- **Kalaw** for SKR integration issues