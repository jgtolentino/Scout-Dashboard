# Locating Transcript Tables for Brand Mention Enrichment

This guide helps you identify which database contains your transcription data for implementing the brand mention extraction feature.

## The Problem: Missing Tables

If you encounter an error like:

```
Invalid object name 'dbo.TranscriptionResults'
```

It usually means you're connected to a database that doesn't contain the transcription tables. Common reasons:

1. You're connected to a **reporting database** (read-only)
2. The tables may exist in a different database in the same server
3. The tables have a different name than expected

## Solution: Cross-Database Schema Scanner

We provide two tools to help you locate the correct tables across all databases:

### 1. PowerShell Scanner (Windows)

The PowerShell script scans all databases on a server and identifies potential tables containing transcription data:

```powershell
# Run the script
./find_transcript_tables.ps1 -ServerName "server.database.windows.net" -Username "admin" -Password "password"
```

### 2. SQL Script (Any Platform)

If you prefer direct SQL execution:

```bash
# Run with sqlcmd
sqlcmd -S server.database.windows.net -d master -U admin -P password -i cross_db_schema_checker.sql -o scan_results.txt
```

### 3. Bash Wrapper (macOS/Linux)

For non-Windows users, we provide a bash wrapper that can use either method:

```bash
# Run the wrapper script
./find_transcript_tables.sh
```

## Understanding the Results

The scanner will identify:

1. All databases with tables containing transcription data
2. A recommended target database for enrichment
3. SQL scripts to create the necessary tables in the correct database

Example output:

```
PRIMARY ENRICHMENT TARGET
Database: TBWA_ProjectScout_DB
Table: dbo.TranscriptionResults
Estimated Rows: 25348
```

## Next Steps

Once you've identified the correct database:

1. **Connect to the right database:**
   ```sql
   USE TBWA_ProjectScout_DB;  -- Use the identified database
   GO
   ```

2. **Verify the table exists:**
   ```sql
   SELECT TOP 5 * FROM dbo.TranscriptionResults;
   ```

3. **Run the schema extension script** from the results file or from the provided SQL file, making sure to update any table references to match your actual table names.

4. **Update connection strings** in your brand mention extraction scripts to point to the correct database.

## Common Database Patterns

Project Scout typically follows these database naming patterns:

| Purpose | Typical Names |
|---------|---------------|
| Raw Data Ingestion | TBWA_ProjectScout_Ingest, ProjectScout_Raw |
| Processing/Enrichment | TBWA_ProjectScout_DB, ProjectScout_Enrich |
| Reporting/Analytics | SQL-TBWA-ProjectScout-Reporting, ProjectScout_Reporting |

The brand mention extraction should typically target the Processing/Enrichment database, not the reporting database.

## Troubleshooting

If the scanner doesn't find any suitable tables:

1. **Check permissions** - Ensure your account has VIEW DEFINITION permissions on all databases
2. **Database naming** - Look for other databases that might contain "Scout" or "TBWA" in their names
3. **Table naming** - Your transcription data might use a different naming convention (e.g., "SpeechRecognitionResults" instead of "TranscriptionResults")

For any issues, contact Basher for database access support.