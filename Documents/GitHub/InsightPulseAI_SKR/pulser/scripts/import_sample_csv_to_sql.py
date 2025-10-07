#!/usr/bin/env python3
"""
Import Sample CSV Data to SQL Server
Generic CSV importer for Project Scout sample data
"""

import os
import sys
import logging
import argparse
import pandas as pd
import pyodbc
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CSVToSQLImporter:
    def __init__(self, sql_server, sql_database, sql_username, sql_password):
        """Initialize SQL connection"""
        self.connection_string = (
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={sql_server};"
            f"DATABASE={sql_database};"
            f"UID={sql_username};"
            f"PWD={sql_password};"
            f"Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
        )
    
    def create_table_from_dataframe(self, df, table_name, drop_existing=False):
        """Create SQL table based on DataFrame structure"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                # Drop existing table if requested
                if drop_existing:
                    cursor.execute(f"IF OBJECT_ID('{table_name}', 'U') IS NOT NULL DROP TABLE {table_name}")
                    logger.info(f"Dropped existing table: {table_name}")
                
                # Generate CREATE TABLE statement
                sql_types = {
                    'object': 'NVARCHAR(255)',
                    'int64': 'BIGINT',
                    'float64': 'FLOAT',
                    'datetime64[ns]': 'DATETIME2',
                    'bool': 'BIT'
                }
                
                columns = []
                for col in df.columns:
                    col_type = str(df[col].dtype)
                    sql_type = sql_types.get(col_type, 'NVARCHAR(255)')
                    
                    # Handle special cases
                    if col.lower().endswith('_id'):
                        sql_type = 'NVARCHAR(50)'
                    elif col.lower() in ['email', 'phone', 'address']:
                        sql_type = 'NVARCHAR(255)'
                    elif col.lower() in ['description', 'notes', 'comment']:
                        sql_type = 'NVARCHAR(MAX)'
                    
                    columns.append(f"[{col}] {sql_type}")
                
                create_sql = f"CREATE TABLE [{table_name}] ({', '.join(columns)})"
                cursor.execute(create_sql)
                conn.commit()
                
                logger.info(f"Created table: {table_name} with {len(columns)} columns")
                return True
                
        except Exception as e:
            logger.error(f"Failed to create table {table_name}: {str(e)}")
            return False
    
    def import_dataframe_to_sql(self, df, table_name, batch_size=1000):
        """Import DataFrame to SQL Server table"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                # Prepare INSERT statement
                columns = ', '.join([f'[{col}]' for col in df.columns])
                placeholders = ', '.join(['?' for _ in df.columns])
                insert_sql = f"INSERT INTO [{table_name}] ({columns}) VALUES ({placeholders})"
                
                # Import data in batches
                total_rows = len(df)
                imported_rows = 0
                
                for start_idx in range(0, total_rows, batch_size):
                    end_idx = min(start_idx + batch_size, total_rows)
                    batch_df = df.iloc[start_idx:end_idx]
                    
                    # Convert DataFrame to list of tuples
                    data_tuples = []
                    for _, row in batch_df.iterrows():
                        # Handle NaN values
                        row_data = []
                        for value in row:
                            if pd.isna(value):
                                row_data.append(None)
                            elif isinstance(value, (pd.Timestamp, datetime)):
                                row_data.append(value.strftime('%Y-%m-%d %H:%M:%S'))
                            else:
                                row_data.append(value)
                        data_tuples.append(tuple(row_data))
                    
                    # Execute batch insert
                    cursor.executemany(insert_sql, data_tuples)
                    imported_rows += len(data_tuples)
                    
                    logger.info(f"Imported {imported_rows}/{total_rows} rows to {table_name}")
                
                conn.commit()
                logger.info(f"Successfully imported {imported_rows} rows to {table_name}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to import data to {table_name}: {str(e)}")
            return False
    
    def validate_import(self, table_name, expected_rows=None):
        """Validate the imported data"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                # Count imported rows
                cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
                actual_rows = cursor.fetchone()[0]
                
                # Get table schema
                cursor.execute(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'")
                columns = [row[0] for row in cursor.fetchall()]
                
                logger.info(f"Validation results for {table_name}:")
                logger.info(f"  Rows imported: {actual_rows}")
                logger.info(f"  Columns: {len(columns)}")
                logger.info(f"  Column names: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
                
                if expected_rows and actual_rows != expected_rows:
                    logger.warning(f"Row count mismatch: expected {expected_rows}, got {actual_rows}")
                    return False
                
                return actual_rows > 0
                
        except Exception as e:
            logger.error(f"Validation failed for {table_name}: {str(e)}")
            return False

def detect_delimiter(file_path, sample_lines=5):
    """Detect CSV delimiter by analyzing sample lines"""
    delimiters = [',', ';', '\t', '|']
    delimiter_counts = {d: 0 for d in delimiters}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for _ in range(sample_lines):
                line = f.readline()
                if not line:
                    break
                for delimiter in delimiters:
                    delimiter_counts[delimiter] += line.count(delimiter)
        
        # Return delimiter with highest count
        return max(delimiter_counts, key=delimiter_counts.get)
    except:
        return ','  # Default to comma

def clean_dataframe(df):
    """Clean DataFrame for SQL import"""
    # Remove leading/trailing whitespace from string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace('nan', None)
        df[col] = df[col].replace('', None)
    
    # Clean column names
    df.columns = [col.strip().replace(' ', '_').replace('-', '_') for col in df.columns]
    
    # Convert date columns
    date_columns = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    for col in date_columns:
        try:
            df[col] = pd.to_datetime(df[col], errors='coerce')
        except:
            pass
    
    return df

def main():
    parser = argparse.ArgumentParser(description="Import CSV data to SQL Server")
    parser.add_argument("--csv-file", required=True, help="Path to CSV file")
    parser.add_argument("--table-name", required=True, help="Target SQL table name")
    parser.add_argument("--sql-server", required=True, help="SQL Server hostname")
    parser.add_argument("--sql-database", required=True, help="SQL Database name")
    parser.add_argument("--sql-username", required=True, help="SQL Username")
    parser.add_argument("--sql-password", required=True, help="SQL Password")
    parser.add_argument("--delimiter", help="CSV delimiter (auto-detected if not specified)")
    parser.add_argument("--drop-existing", action="store_true", help="Drop existing table before import")
    parser.add_argument("--batch-size", type=int, default=1000, help="Batch size for imports")
    parser.add_argument("--sample-rows", type=int, help="Import only first N rows (for testing)")
    
    args = parser.parse_args()
    
    try:
        # Check if CSV file exists
        if not os.path.exists(args.csv_file):
            logger.error(f"CSV file not found: {args.csv_file}")
            sys.exit(1)
        
        # Detect delimiter if not specified
        delimiter = args.delimiter or detect_delimiter(args.csv_file)
        logger.info(f"Using delimiter: '{delimiter}'")
        
        # Read CSV file
        logger.info(f"Reading CSV file: {args.csv_file}")
        df = pd.read_csv(args.csv_file, delimiter=delimiter, encoding='utf-8')
        
        if args.sample_rows:
            df = df.head(args.sample_rows)
            logger.info(f"Using sample of {len(df)} rows")
        
        # Clean DataFrame
        df = clean_dataframe(df)
        logger.info(f"Loaded {len(df)} rows with {len(df.columns)} columns")
        
        # Initialize importer
        importer = CSVToSQLImporter(
            args.sql_server, args.sql_database, args.sql_username, args.sql_password
        )
        
        # Create table
        if not importer.create_table_from_dataframe(df, args.table_name, args.drop_existing):
            sys.exit(1)
        
        # Import data
        if not importer.import_dataframe_to_sql(df, args.table_name, args.batch_size):
            sys.exit(1)
        
        # Validate import
        if not importer.validate_import(args.table_name, len(df)):
            logger.warning("Import validation failed")
            sys.exit(1)
        
        logger.info(f"CSV import completed successfully: {args.csv_file} -> {args.table_name}")
        
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()