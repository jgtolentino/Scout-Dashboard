#!/usr/bin/env python3
"""
CES Schema Analysis Script
Query Azure SQL Database to identify populated vs empty tables
"""

import pyodbc
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def load_env_file(file_path):
    """Load environment variables from .env file"""
    env_vars = {}
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"Warning: {file_path} not found")
    return env_vars

def analyze_ces_schema():
    """Analyze CES database schema and identify data gaps"""
    
    # Load environment variables
    env_file = project_root / '.env.local'
    env_vars = load_env_file(env_file)
    
    # Get connection details
    server = env_vars.get('CES_AZURE_SQL_SERVER')
    database = env_vars.get('CES_AZURE_SQL_DATABASE')
    username = env_vars.get('CES_AZURE_SQL_USER')
    password = env_vars.get('CES_AZURE_SQL_PASSWORD')
    
    if not all([server, database, username, password]):
        print("❌ Missing required environment variables in .env.local")
        print("Required: CES_AZURE_SQL_SERVER, CES_AZURE_SQL_DATABASE, CES_AZURE_SQL_USER, CES_AZURE_SQL_PASSWORD")
        return
    
    # Build connection string
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30;"
    )
    
    try:
        print("🔍 Connecting to CES Azure SQL Database...")
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print(f"📊 Database: {database}")
        print(f"🖥️  Server: {server}")
        print("")
        
        # Get all tables in the database
        print("=== DISCOVERING TABLES ===")
        cursor.execute("""
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)
        
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables in the database:")
        print("")
        
        # Display all tables
        for table in tables:
            schema, name, table_type = table
            full_name = f"{schema}.{name}" if schema != "dbo" else name
            print(f"  📋 {full_name}")
        
        print("")
        print("=== ANALYZING TABLE POPULATION ===")
        
        populated_tables = []
        empty_tables = []
        error_tables = []
        
        for table in tables:
            schema, name, table_type = table
            full_name = f"[{schema}].[{name}]"
            display_name = f"{schema}.{name}" if schema != "dbo" else name
            
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {full_name}")
                count = cursor.fetchone()[0]
                
                if count > 0:
                    populated_tables.append((display_name, count))
                    print(f"✅ {display_name}: {count:,} records")
                else:
                    empty_tables.append(display_name)
                    print(f"❌ {display_name}: 0 records (EMPTY)")
                    
            except Exception as e:
                error_tables.append((display_name, str(e)))
                print(f"⚠️  {display_name}: Error querying - {str(e)}")
        
        print("")
        print("=== DETAILED SCHEMA ANALYSIS ===")
        
        # Get column information for populated tables
        if populated_tables:
            print("📊 POPULATED TABLES - Column Details:")
            for table_name, count in populated_tables:
                cursor.execute(f"""
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '{table_name.split('.')[-1]}'
                    ORDER BY ORDINAL_POSITION
                """)
                columns = cursor.fetchall()
                print(f"\n  📋 {table_name} ({count:,} records):")
                for col in columns[:5]:  # Show first 5 columns
                    col_name, data_type, nullable, default = col
                    print(f"    - {col_name} ({data_type}) {'NULL' if nullable == 'YES' else 'NOT NULL'}")
                if len(columns) > 5:
                    print(f"    ... and {len(columns) - 5} more columns")
        
        print("")
        print("=== PAGEINDEX SCHEMA CHECK ===")
        
        # Check if PageIndex tables exist
        pageindex_tables = [
            'pageIndex', 'fileMetadata', 'campaignInsights', 
            'semanticIndex', 'qualityMetrics', 'processingLogs'
        ]
        
        existing_pageindex = []
        missing_pageindex = []
        
        for pi_table in pageindex_tables:
            table_exists = any(pi_table.lower() in table[1].lower() for table in tables)
            if table_exists:
                existing_pageindex.append(pi_table)
            else:
                missing_pageindex.append(pi_table)
        
        if existing_pageindex:
            print("✅ Found PageIndex tables:")
            for table in existing_pageindex:
                print(f"  - {table}")
        
        if missing_pageindex:
            print("❌ Missing PageIndex tables:")
            for table in missing_pageindex:
                print(f"  - {table}")
        
        conn.close()
        
        print("")
        print("=== SUMMARY & GAPS ANALYSIS ===")
        print(f"📊 Total tables: {len(tables)}")
        print(f"✅ Populated tables: {len(populated_tables)}")
        print(f"❌ Empty tables: {len(empty_tables)}")
        print(f"⚠️  Error tables: {len(error_tables)}")
        
        if empty_tables:
            print("\n🔍 DATA GAPS IDENTIFIED:")
            for empty_table in empty_tables:
                print(f"  ❌ {empty_table} - Needs data population")
        
        if missing_pageindex:
            print(f"\n📋 PAGEINDEX SCHEMA GAPS:")
            print("  Run: sqlcmd -i sql/pageindex.schema.sql to create missing tables")
        
        print("\n💡 RECOMMENDATIONS:")
        if len(empty_tables) > len(populated_tables):
            print("  🚨 Most tables are empty - Database needs initial data population")
        if missing_pageindex:
            print("  📋 Deploy PageIndex schema for semantic indexing capabilities")
        if populated_tables:
            print("  ✅ Good foundation exists - Build upon existing data structure")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check .env.local file exists with correct credentials")
        print("2. Verify network access to Azure SQL")
        print("3. Confirm ODBC Driver 17 for SQL Server is installed")

if __name__ == "__main__":
    analyze_ces_schema()