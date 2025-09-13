#!/usr/bin/env python3
"""
Import Brands Dictionary to SQL Server
Imports brand dictionary data from ADLS or local files to SQL Server
"""

import os
import sys
import json
import logging
import argparse
import pyodbc
from datetime import datetime
from azure.storage.blob import BlobServiceClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BrandsDictionaryImporter:
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
        
    def create_brand_tables(self):
        """Create brand dictionary tables if they don't exist"""
        create_brand_families_table = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BrandFamilies' AND xtype='U')
        CREATE TABLE BrandFamilies (
            BrandFamilyID int IDENTITY(1,1) PRIMARY KEY,
            FamilyName nvarchar(100) NOT NULL UNIQUE,
            Category nvarchar(100) NOT NULL,
            CreatedDate datetime2 DEFAULT GETDATE(),
            UpdatedDate datetime2 DEFAULT GETDATE()
        )
        """
        
        create_brands_table = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Brands' AND xtype='U')
        CREATE TABLE Brands (
            BrandID int IDENTITY(1,1) PRIMARY KEY,
            BrandFamilyID int NOT NULL,
            BrandName nvarchar(100) NOT NULL,
            CreatedDate datetime2 DEFAULT GETDATE(),
            FOREIGN KEY (BrandFamilyID) REFERENCES BrandFamilies(BrandFamilyID)
        )
        """
        
        create_brand_keywords_table = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BrandKeywords' AND xtype='U')
        CREATE TABLE BrandKeywords (
            KeywordID int IDENTITY(1,1) PRIMARY KEY,
            BrandFamilyID int NOT NULL,
            Keyword nvarchar(100) NOT NULL,
            CreatedDate datetime2 DEFAULT GETDATE(),
            FOREIGN KEY (BrandFamilyID) REFERENCES BrandFamilies(BrandFamilyID)
        )
        """
        
        create_product_categories_table = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductCategories' AND xtype='U')
        CREATE TABLE ProductCategories (
            CategoryID int IDENTITY(1,1) PRIMARY KEY,
            BrandFamilyID int NOT NULL,
            CategoryName nvarchar(100) NOT NULL,
            CreatedDate datetime2 DEFAULT GETDATE(),
            FOREIGN KEY (BrandFamilyID) REFERENCES BrandFamilies(BrandFamilyID)
        )
        """
        
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                logger.info("Creating brand dictionary tables...")
                cursor.execute(create_brand_families_table)
                cursor.execute(create_brands_table)
                cursor.execute(create_brand_keywords_table)
                cursor.execute(create_product_categories_table)
                
                conn.commit()
                logger.info("Brand dictionary tables created successfully")
                return True
                
        except Exception as e:
            logger.error(f"Failed to create tables: {str(e)}")
            return False
    
    def clear_existing_data(self):
        """Clear existing brand data for fresh import"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                logger.info("Clearing existing brand data...")
                cursor.execute("DELETE FROM ProductCategories")
                cursor.execute("DELETE FROM BrandKeywords")
                cursor.execute("DELETE FROM Brands")
                cursor.execute("DELETE FROM BrandFamilies")
                
                conn.commit()
                logger.info("Existing brand data cleared")
                return True
                
        except Exception as e:
            logger.error(f"Failed to clear existing data: {str(e)}")
            return False
    
    def import_brand_dictionary(self, brand_data):
        """Import brand dictionary data into SQL Server"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                # Import brand families
                for family_name, family_data in brand_data['brandFamilies'].items():
                    logger.info(f"Importing brand family: {family_name}")
                    
                    # Insert brand family
                    cursor.execute(
                        "INSERT INTO BrandFamilies (FamilyName, Category) VALUES (?, ?)",
                        family_name, family_data['category']
                    )
                    
                    # Get the inserted family ID
                    cursor.execute("SELECT @@IDENTITY")
                    family_id = cursor.fetchone()[0]
                    
                    # Insert brands
                    for brand in family_data['brands']:
                        cursor.execute(
                            "INSERT INTO Brands (BrandFamilyID, BrandName) VALUES (?, ?)",
                            family_id, brand
                        )
                    
                    # Insert keywords
                    for keyword in family_data['keywords']:
                        cursor.execute(
                            "INSERT INTO BrandKeywords (BrandFamilyID, Keyword) VALUES (?, ?)",
                            family_id, keyword
                        )
                    
                    # Insert product categories
                    for category in family_data['productCategories']:
                        cursor.execute(
                            "INSERT INTO ProductCategories (BrandFamilyID, CategoryName) VALUES (?, ?)",
                            family_id, category
                        )
                
                conn.commit()
                logger.info("Brand dictionary imported successfully")
                return True
                
        except Exception as e:
            logger.error(f"Failed to import brand dictionary: {str(e)}")
            return False
    
    def validate_import(self):
        """Validate the imported data"""
        try:
            with pyodbc.connect(self.connection_string) as conn:
                cursor = conn.cursor()
                
                # Count records in each table
                cursor.execute("SELECT COUNT(*) FROM BrandFamilies")
                family_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM Brands")
                brand_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM BrandKeywords")
                keyword_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM ProductCategories")
                category_count = cursor.fetchone()[0]
                
                logger.info(f"Validation results:")
                logger.info(f"  Brand Families: {family_count}")
                logger.info(f"  Brands: {brand_count}")
                logger.info(f"  Keywords: {keyword_count}")
                logger.info(f"  Product Categories: {category_count}")
                
                return family_count > 0 and brand_count > 0
                
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return False

def load_brand_data_from_blob(connection_string, container_name, blob_name):
    """Load brand data from Azure Blob Storage"""
    try:
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
        
        blob_data = blob_client.download_blob().readall()
        return json.loads(blob_data)
        
    except Exception as e:
        logger.error(f"Failed to load data from blob: {str(e)}")
        return None

def load_brand_data_from_file(file_path):
    """Load brand data from local file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load data from file: {str(e)}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Import brands dictionary to SQL Server")
    parser.add_argument("--sql-server", required=True, help="SQL Server hostname")
    parser.add_argument("--sql-database", required=True, help="SQL Database name")
    parser.add_argument("--sql-username", required=True, help="SQL Username")
    parser.add_argument("--sql-password", required=True, help="SQL Password")
    parser.add_argument("--source-type", choices=["blob", "file"], required=True, help="Data source type")
    parser.add_argument("--source-path", required=True, help="Blob name or file path")
    parser.add_argument("--storage-connection", help="Azure Storage connection string (for blob source)")
    parser.add_argument("--container", default="brand-dictionary", help="Container name (for blob source)")
    parser.add_argument("--clear-existing", action="store_true", help="Clear existing data before import")
    
    args = parser.parse_args()
    
    try:
        # Initialize importer
        importer = BrandsDictionaryImporter(
            args.sql_server, args.sql_database, args.sql_username, args.sql_password
        )
        
        # Create tables
        if not importer.create_brand_tables():
            sys.exit(1)
        
        # Clear existing data if requested
        if args.clear_existing:
            if not importer.clear_existing_data():
                sys.exit(1)
        
        # Load brand data
        if args.source_type == "blob":
            if not args.storage_connection:
                logger.error("Storage connection string required for blob source")
                sys.exit(1)
            brand_data = load_brand_data_from_blob(args.storage_connection, args.container, args.source_path)
        else:
            brand_data = load_brand_data_from_file(args.source_path)
        
        if not brand_data:
            logger.error("Failed to load brand data")
            sys.exit(1)
        
        # Import data
        if not importer.import_brand_dictionary(brand_data):
            sys.exit(1)
        
        # Validate import
        if not importer.validate_import():
            logger.warning("Import validation failed")
            sys.exit(1)
        
        logger.info("Brands dictionary import completed successfully!")
        
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()