#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
export_insights.py - Exports AI insights for offline analysis

This script exports AI insights from the database to various formats
for offline analysis and reporting.
"""

import os
import sys
import time
import json
import logging
import argparse
import datetime
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from dotenv import load_dotenv
from databricks import sql

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"logs/export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("insights_exporter")

# Load environment variables
load_dotenv()

def connect_to_databricks():
    """Connect to Databricks SQL warehouse."""
    try:
        connection = sql.connect(
            server_hostname=os.environ["DATABRICKS_HOST"],
            http_path=os.environ["DATABRICKS_HTTP_PATH"],
            access_token=os.environ["DATABRICKS_TOKEN"]
        )
        logger.info("Successfully connected to Databricks SQL warehouse")
        return connection
    except Exception as e:
        logger.error(f"Error connecting to Databricks: {e}")
        sys.exit(1)

def query_insights(connection, days=90, include_synthetic=True):
    """Query insights from the database."""
    try:
        cursor = connection.cursor()
        
        synthetic_filter = "" if include_synthetic else "AND IsSynthetic = 0"
        days_filter = f"AND GeneratedAt >= DATE_SUB(CURRENT_TIMESTAMP(), {days})" if days > 0 else ""
        
        query = f"""
        SELECT 
            InsightID,
            InsightType,
            GeneratedAt,
            Model,
            IsSynthetic,
            StoreID,
            BrandID,
            CategoryID,
            RegionID,
            Content,
            CreatedAt,
            UpdatedAt,
            ExpiresAt,
            IsActive,
            TokensUsed,
            GenerationLatencyMs,
            Version,
            Tags,
            UserFeedback
        FROM 
            ${os.environ.get("DATABRICKS_SCHEMA", "tbwa_client360")}.AIInsights
        WHERE 
            IsActive = 1
            {synthetic_filter}
            {days_filter}
        ORDER BY 
            GeneratedAt DESC
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(results, columns=column_names)
        logger.info(f"Retrieved {len(df)} insights from database")
        
        return df
    except Exception as e:
        logger.error(f"Error querying insights: {e}")
        sys.exit(1)

def export_to_parquet(df, output_dir="exports", filename=None):
    """Export insights to Parquet format."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"insights_export_{timestamp}.parquet"
        
        output_path = os.path.join(output_dir, filename)
        
        # Convert complex JSON columns to strings for Parquet compatibility
        df_export = df.copy()
        for col in df_export.columns:
            if df_export[col].apply(lambda x: isinstance(x, (dict, list))).any():
                df_export[col] = df_export[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)
        
        # Save to Parquet
        table = pa.Table.from_pandas(df_export)
        pq.write_table(table, output_path)
        
        logger.info(f"Exported {len(df)} insights to {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error exporting to Parquet: {e}")
        return None

def export_to_json(df, output_dir="exports", filename=None):
    """Export insights to JSON format."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"insights_export_{timestamp}.json"
        
        output_path = os.path.join(output_dir, filename)
        
        # Convert DataFrame to records
        records = []
        for _, row in df.iterrows():
            record = {}
            for col, val in row.items():
                # Convert datetime objects to ISO strings
                if isinstance(val, (datetime.datetime, datetime.date)):
                    val = val.isoformat()
                record[col] = val
            records.append(record)
        
        # Write to JSON
        with open(output_path, 'w') as f:
            json.dump(records, f, indent=2)
        
        logger.info(f"Exported {len(df)} insights to {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error exporting to JSON: {e}")
        return None

def export_to_csv(df, output_dir="exports", filename=None):
    """Export insights to CSV format."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"insights_export_{timestamp}.csv"
        
        output_path = os.path.join(output_dir, filename)
        
        # Convert complex JSON columns to strings for CSV compatibility
        df_export = df.copy()
        for col in df_export.columns:
            if df_export[col].apply(lambda x: isinstance(x, (dict, list))).any():
                df_export[col] = df_export[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)
        
        # Save to CSV
        df_export.to_csv(output_path, index=False)
        
        logger.info(f"Exported {len(df)} insights to {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error exporting to CSV: {e}")
        return None

def export_to_excel(df, output_dir="exports", filename=None):
    """Export insights to Excel format."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"insights_export_{timestamp}.xlsx"
        
        output_path = os.path.join(output_dir, filename)
        
        # Convert complex JSON columns to strings for Excel compatibility
        df_export = df.copy()
        for col in df_export.columns:
            if df_export[col].apply(lambda x: isinstance(x, (dict, list))).any():
                df_export[col] = df_export[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)
        
        # Save to Excel
        df_export.to_excel(output_path, index=False)
        
        logger.info(f"Exported {len(df)} insights to {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error exporting to Excel: {e}")
        return None

def export_by_type(df, output_dir="exports"):
    """Export insights grouped by type."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Group by insight type
        insight_types = df["InsightType"].unique()
        
        for insight_type in insight_types:
            type_df = df[df["InsightType"] == insight_type]
            
            # Export to various formats
            export_to_parquet(type_df, output_dir, f"{insight_type}_{timestamp}.parquet")
            export_to_json(type_df, output_dir, f"{insight_type}_{timestamp}.json")
        
        logger.info(f"Exported insights by type to {output_dir}")
        return True
    except Exception as e:
        logger.error(f"Error exporting by type: {e}")
        return False

def get_content_stats(df):
    """Get statistics on content fields from insights."""
    try:
        stats = {
            "insight_count": len(df),
            "insight_types": df["InsightType"].value_counts().to_dict(),
            "synthetic_count": df["IsSynthetic"].sum(),
            "real_count": len(df) - df["IsSynthetic"].sum(),
            "date_range": {
                "min": df["GeneratedAt"].min().isoformat() if not df["GeneratedAt"].empty else None,
                "max": df["GeneratedAt"].max().isoformat() if not df["GeneratedAt"].empty else None
            },
            "field_stats": {}
        }
        
        # Parse content to extract field information
        for _, row in df.iterrows():
            content = row["Content"]
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    continue
                    
            if isinstance(content, dict):
                for key in content.keys():
                    if key not in stats["field_stats"]:
                        stats["field_stats"][key] = 0
                    stats["field_stats"][key] += 1
        
        return stats
    except Exception as e:
        logger.error(f"Error getting content stats: {e}")
        return {}

def main():
    parser = argparse.ArgumentParser(description="Export AI insights for offline analysis")
    parser.add_argument("--days", type=int, default=90,
                      help="Number of days of history to export (0 for all)")
    parser.add_argument("--format", choices=["parquet", "json", "csv", "excel", "all"], default="parquet",
                      help="Export format")
    parser.add_argument("--include-synthetic", action="store_true", default=True,
                      help="Include synthetic data in export")
    parser.add_argument("--output-dir", default="exports",
                      help="Directory to save exports")
    parser.add_argument("--by-type", action="store_true",
                      help="Export separate files by insight type")
    parser.add_argument("--stats", action="store_true",
                      help="Generate content field statistics")
    args = parser.parse_args()
    
    # Connect to Databricks
    connection = connect_to_databricks()
    
    # Query insights
    df = query_insights(connection, args.days, args.include_synthetic)
    
    # Export based on format
    if args.format == "parquet" or args.format == "all":
        export_to_parquet(df, args.output_dir)
    
    if args.format == "json" or args.format == "all":
        export_to_json(df, args.output_dir)
    
    if args.format == "csv" or args.format == "all":
        export_to_csv(df, args.output_dir)
    
    if args.format == "excel" or args.format == "all":
        export_to_excel(df, args.output_dir)
    
    # Export by type if requested
    if args.by_type:
        export_by_type(df, args.output_dir)
    
    # Generate stats if requested
    if args.stats:
        stats = get_content_stats(df)
        stats_file = os.path.join(args.output_dir, f"insight_stats_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(stats_file, 'w') as f:
            json.dump(stats, f, indent=2)
        logger.info(f"Saved content field statistics to {stats_file}")
    
    # Close connection
    connection.close()
    
    logger.info("Export complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())