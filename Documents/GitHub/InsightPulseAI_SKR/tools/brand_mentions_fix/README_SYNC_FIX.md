# Claudia Sync Fix Utility

This utility helps resolve issues with YAML files being skipped during Claudia synchronization.

## Problem

The Claudia sync process may skip certain YAML files with the error:
```
⚠️ Skipped unrecognized file: skr_docs.yaml
```

This happens when the YAML files don't conform to Claudia's expected schema requirements.

## Solution

The `fix_sync_skips.py` script automatically detects and fixes common issues in YAML files that cause them to be skipped, including:

- Missing required fields (name, description)
- Incorrect structure for specific file types (router, docs)
- Missing metadata settings

## Usage

```bash
# Find and fix all skipped files automatically
./fix_sync_skips.py

# Specify a sync log file to analyze
./fix_sync_skips.py --log /path/to/claudia_sync.log

# Fix a specific file
./fix_sync_skips.py --file /path/to/skr_docs.yaml

# Specify a different SKR root directory
./fix_sync_skips.py --skr /path/to/InsightPulseAI_SKR
```

## What It Does

For each skipped file, the utility:

1. Creates a backup with `.bak` extension
2. Analyzes the file structure
3. Adds missing required fields
4. Updates the file format based on its type
5. Saves the fixed file

## File Type Handling

- **SKR Docs Files**: Ensures proper schema version and sections structure
- **Router Files**: Ensures routes have valid path and handler fields
- **General Files**: Adds required name and description fields

## After Fixing

After running the fix utility, try running the Claudia sync process again. The previously skipped files should now synchronize properly.

## Requirements

- Python 3.6 or higher
- PyYAML library (`pip install pyyaml`)

## Safety

The script always creates backups before modifying files, so you can restore the original if needed.