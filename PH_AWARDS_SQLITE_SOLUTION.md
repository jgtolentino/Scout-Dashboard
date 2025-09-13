# PH Awards Analysis System - SQLite Solution

## Overview

This document provides instructions for setting up the PH Awards Analysis System using a local SQLite database instead of Azure SQL. This is a more practical solution for a proof of concept (POC) as it:

1. Doesn't require cloud permissions or authentication
2. Works completely offline
3. Is simpler to set up and use
4. Provides the same functionality for analysis and reporting

## Files Created

I've created the following files for the SQLite-based solution:

1. `/Users/tbwa/create_ph_awards_sqlite.py` - Creates the SQLite database and imports the analysis data
2. `/Users/tbwa/query_ph_awards.py` - Interactive tool to query and analyze the data
3. `/Users/tbwa/PH_AWARDS_SQLITE_SOLUTION.md` - This documentation file

## Step 1: Create the SQLite Database

Run the following command to create the database and import the analysis data:

```bash
python3 /Users/tbwa/create_ph_awards_sqlite.py
```

This script will:
- Create a new SQLite database at `/Users/tbwa/ph_awards.db`
- Create all the required tables with proper schema and relationships
- Import all data from JSON files in the `/Users/tbwa/analysis_results/` directory
- Run sample queries to verify the database is working correctly

## Step 2: Query and Analyze the Data

Run the interactive query tool:

```bash
python3 /Users/tbwa/query_ph_awards.py
```

This tool provides a menu-driven interface to:
1. List all campaigns
2. View detailed information for any campaign
3. Generate comprehensive analysis reports with visualizations
4. Run custom SQL queries
5. Extract data to JSON and CSV files
6. Open the analysis dashboard

## Database Schema

The SQLite database has the same structure as the originally planned Azure SQL database:

- **PH_Awards_Campaigns**: Basic campaign information
- **PH_Awards_Performance**: Award performance metrics
- **PH_Filipino_Metrics**: Filipino-specific elements and metrics
- **PH_Content_Analysis**: Content quality metrics
- **PH_Evolution_Tracking**: Campaign evolution over time
- **PH_Business_Impact**: Business impact metrics

## Sample Queries

Here are some sample queries you can run in the interactive tool:

1. **Top campaigns by Filipino index**:
```sql
SELECT c.name, c.brand, f.filipino_index
FROM PH_Filipino_Metrics f
JOIN PH_Awards_Campaigns c ON f.campaign_id = c.id
ORDER BY f.filipino_index DESC
LIMIT 5
```

2. **Relationship between content quality and award tier**:
```sql
SELECT 
    AVG(ca.content_analysis_index) as avg_content_quality,
    ap.highest_award_tier,
    COUNT(*) as campaign_count
FROM PH_Content_Analysis ca
JOIN PH_Awards_Performance ap ON ca.campaign_id = ap.campaign_id
GROUP BY ap.highest_award_tier
ORDER BY ap.highest_award_tier DESC
```

3. **Average ROI by Filipino index range**:
```sql
SELECT 
    CASE 
        WHEN f.filipino_index < 0.3 THEN 'Low (< 0.3)'
        WHEN f.filipino_index < 0.6 THEN 'Medium (0.3-0.6)'
        ELSE 'High (> 0.6)'
    END as filipino_level,
    AVG(b.roi_percent) as avg_roi,
    COUNT(*) as campaign_count
FROM PH_Filipino_Metrics f
JOIN PH_Business_Impact b ON f.campaign_id = b.campaign_id
GROUP BY filipino_level
ORDER BY avg_roi DESC
```

## Generating Reports

The query tool can generate comprehensive reports with visualizations:

```bash
# From the interactive menu, select option 3
# Or directly from command line:
python3 /Users/tbwa/query_ph_awards.py
# Then select option 3
```

Reports include:
- Summary statistics
- Visualizations of key relationships
- Business insights and recommendations
- CSV exports for further analysis

## Advantages of SQLite Solution

1. **Simplicity**: No need to deal with Azure authentication issues
2. **Portability**: The entire database is stored in a single file
3. **Performance**: Fast queries on local storage
4. **No cloud costs**: Works entirely on your local machine
5. **Easy sharing**: The database file can be easily shared with others

## Next Steps

After exploring the data with this SQLite solution:

1. Review the findings and insights from the analysis
2. Share the analysis results with stakeholders
3. If needed, migrate to Azure SQL later when permissions are resolved
4. Expand the analysis with additional metrics and visualizations

## Troubleshooting

If you encounter any issues:

1. **Database file not found**: Ensure the create script runs successfully first
2. **Import errors**: Check that analysis results directory exists and contains JSON files
3. **Visualization errors**: Ensure matplotlib and seaborn are installed:
   ```bash
   pip install matplotlib seaborn pandas
   ```
4. **Permission errors**: Check file permissions in the output directories