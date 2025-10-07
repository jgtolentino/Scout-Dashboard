#!/usr/bin/env python3
"""
Scout Edge Dataset Exporter

This script exports SQL datasets from the database to JSON files for use in the Scout Edge dashboard.
It replaces the former Superset dataset dependencies with static JSON files served via Azure Blob Storage.

Usage:
    python export_datasets_to_json.py [--config CONFIG_FILE] [--datasets DATASET1,DATASET2] [--upload]

Options:
    --config CONFIG_FILE    Path to the configuration file (default: config.json)
    --datasets DATASETS     Comma-separated list of datasets to export (default: all)
    --upload                Upload the exported files to Azure Blob Storage
    --simulate              Generate simulated data instead of querying the database
    --days DAYS             Number of days of data to export (default: 90)
"""

import argparse
import json
import os
import sys
import logging
import datetime
import random
from pathlib import Path
import pyodbc
import pandas as pd
import numpy as np
from azure.storage.blob import BlobServiceClient, ContentSettings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('scout_edge_exporter')

# Default configuration
DEFAULT_CONFIG = {
    "database": {
        "driver": "{ODBC Driver 17 for SQL Server}",
        "server": "localhost",
        "database": "RetailAdvisor",
        "username": "scout_edge_user",
        "password": "********",
        "trusted_connection": "yes"
    },
    "azure_storage": {
        "connection_string": "DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net",
        "container_name": "scout-edge-data"
    },
    "export": {
        "output_dir": "assets/data/simulated",
        "datasets": [
            "geo_brand_mentions",
            "geo_sales_volume",
            "geo_store_density",
            "geo_combo_frequency",
            "top_brands"
        ],
        "days": 90
    }
}

# SQL queries for each dataset
DATASET_QUERIES = {
    "geo_brand_mentions": """
        EXEC [dbo].[GetChoroplethData]
            @GeoLevel = 'barangay',
            @BrandID = NULL,
            @Days = {days},
            @Mode = 'brands'
    """,
    "geo_sales_volume": """
        EXEC [dbo].[GetChoroplethData]
            @GeoLevel = 'barangay',
            @BrandID = NULL,
            @Days = {days},
            @Mode = 'sales'
    """,
    "geo_store_density": """
        EXEC [dbo].[GetChoroplethData]
            @GeoLevel = 'barangay',
            @BrandID = NULL,
            @Days = {days},
            @Mode = 'stores'
    """,
    "geo_combo_frequency": """
        EXEC [dbo].[GetChoroplethData]
            @GeoLevel = 'barangay',
            @BrandID = NULL,
            @Days = {days},
            @Mode = 'combos'
    """,
    "top_brands": """
        SELECT TOP 10
            b.BrandID,
            b.BrandName,
            COUNT(DISTINCT sib.TransactionID) AS TransactionCount,
            SUM(sib.MentionCount) AS MentionCount,
            CAST(COUNT(DISTINCT sib.TransactionID) * 100.0 / 
                (SELECT COUNT(DISTINCT TransactionID) FROM [dbo].[SalesInteractionBrands] 
                 WHERE TransactionDate >= DATEADD(DAY, -{days}, GETDATE())) AS DECIMAL(5,2)) AS MarketSharePct,
            ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT sib.TransactionID) DESC) AS BrandRank
        FROM 
            [dbo].[SalesInteractionBrands] sib
        JOIN 
            dbo.Brands b ON sib.BrandID = b.BrandID
        WHERE 
            sib.TransactionDate >= DATEADD(DAY, -{days}, GETDATE())
        GROUP BY 
            b.BrandID, b.BrandName
        ORDER BY 
            TransactionCount DESC
        FOR JSON PATH
    """
}

def load_config(config_file):
    """Load configuration from a JSON file."""
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        logger.warning(f"Configuration file {config_file} not found. Using default configuration.")
        return DEFAULT_CONFIG
    except json.JSONDecodeError:
        logger.error(f"Error parsing configuration file {config_file}. Using default configuration.")
        return DEFAULT_CONFIG

def connect_to_database(db_config):
    """Connect to the database using the provided configuration."""
    try:
        if db_config.get("trusted_connection") == "yes":
            conn_str = (
                f"DRIVER={db_config['driver']};"
                f"SERVER={db_config['server']};"
                f"DATABASE={db_config['database']};"
                "Trusted_Connection=yes;"
            )
        else:
            conn_str = (
                f"DRIVER={db_config['driver']};"
                f"SERVER={db_config['server']};"
                f"DATABASE={db_config['database']};"
                f"UID={db_config['username']};"
                f"PWD={db_config['password']};"
            )
        
        return pyodbc.connect(conn_str)
    except pyodbc.Error as e:
        logger.error(f"Database connection error: {str(e)}")
        return None

def export_dataset(conn, dataset, query, output_dir, days):
    """Export a dataset from the database to a JSON file."""
    logger.info(f"Exporting dataset: {dataset}")
    
    try:
        cursor = conn.cursor()
        formatted_query = query.format(days=days)
        cursor.execute(formatted_query)
        
        # For most datasets, the stored procedure returns JSON directly
        if dataset in ["geo_brand_mentions", "geo_sales_volume", "geo_store_density", "geo_combo_frequency"]:
            result = cursor.fetchone()
            if result:
                json_data = result[0]  # The SP returns a single JSON string
            else:
                logger.warning(f"No data returned for dataset: {dataset}")
                return False
        else:
            # For other datasets, we need to convert the results to JSON
            rows = cursor.fetchall()
            if rows:
                json_data = rows[0][0]  # First column of first row contains JSON
            else:
                logger.warning(f"No data returned for dataset: {dataset}")
                return False
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Write the JSON data to a file
        output_file = os.path.join(output_dir, f"{dataset}.json")
        with open(output_file, 'w') as f:
            f.write(json_data)
        
        logger.info(f"Exported {dataset} to {output_file}")
        return True
    
    except Exception as e:
        logger.error(f"Error exporting dataset {dataset}: {str(e)}")
        return False

def generate_simulated_data(dataset, output_dir, days):
    """Generate simulated data for a dataset."""
    logger.info(f"Generating simulated data for dataset: {dataset}")
    
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate simulated data based on the dataset type
        if dataset in ["geo_brand_mentions", "geo_sales_volume", "geo_store_density", "geo_combo_frequency"]:
            # Generate a GeoJSON FeatureCollection
            data = generate_simulated_geojson(dataset, days)
        elif dataset == "top_brands":
            # Generate top brands data
            data = generate_simulated_top_brands(days)
        else:
            logger.warning(f"Unknown dataset type: {dataset}")
            return False
        
        # Write the data to a file
        output_file = os.path.join(output_dir, f"{dataset}.json")
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Generated simulated data for {dataset} in {output_file}")
        return True
    
    except Exception as e:
        logger.error(f"Error generating simulated data for dataset {dataset}: {str(e)}")
        return False

def generate_simulated_geojson(dataset_type, days):
    """Generate simulated GeoJSON data for choropleth maps."""
    # Define regions, cities, and barangays
    regions = ["NCR", "Region III", "Region IV-A", "Region VI", "Region VII", "Region X", "Region XI"]
    cities_by_region = {
        "NCR": ["Manila", "Quezon City", "Makati", "Pasig", "Mandaluyong", "Caloocan"],
        "Region III": ["Angeles", "San Fernando", "Mabalacat", "Baguio"],
        "Region IV-A": ["Batangas City", "Lipa", "Tagaytay", "Calamba"],
        "Region VI": ["Iloilo City", "Bacolod", "Roxas City"],
        "Region VII": ["Cebu City", "Mandaue", "Lapu-Lapu"],
        "Region X": ["Cagayan de Oro", "Iligan", "Valencia"],
        "Region XI": ["Davao City", "Digos", "Tagum"]
    }
    barangays_per_city = 5  # Number of barangays to generate per city
    
    # Define brands for brand mentions
    brands = {
        101: "Sugarcola",
        102: "Juicy Juice",
        103: "Crunch Snacks",
        104: "Marlborez",
        105: "Happy Coffee",
        106: "Snack Time",
        107: "Mega Water",
        108: "Energy Plus",
        109: "Choco Delight",
        110: "Crispy Chips"
    }
    
    # Create GeoJSON features
    features = []
    feature_id = 1
    
    for region in regions:
        cities = cities_by_region.get(region, [f"{region} City 1", f"{region} City 2"])
        
        for city in cities:
            for i in range(1, barangays_per_city + 1):
                barangay = f"{city} Barangay {i}"
                
                # Generate random values based on dataset type
                if dataset_type == "geo_brand_mentions":
                    value = random.randint(50, 600)
                    top_brand_id = random.choice(list(brands.keys()))
                    top_brand = brands[top_brand_id]
                    brand_percentage = random.randint(30, 60)
                    second_brand_id = random.choice([bid for bid in brands.keys() if bid != top_brand_id])
                    second_brand = brands[second_brand_id]
                    second_percentage = random.randint(15, 40)
                    transaction_count = random.randint(1000, 5000)
                    store_count = random.randint(2, 15)
                elif dataset_type == "geo_sales_volume":
                    value = random.randint(10000, 100000) * 100  # Sales in hundreds
                    top_brand = random.choice(list(brands.values()))
                    transaction_count = random.randint(1000, 5000)
                    store_count = random.randint(2, 15)
                    brand_percentage = None
                    second_brand = None
                    second_percentage = None
                elif dataset_type == "geo_store_density":
                    store_count = random.randint(2, 20)
                    value = store_count
                    top_brand = random.choice(list(brands.values()))
                    transaction_count = random.randint(1000, 5000)
                    brand_percentage = None
                    second_brand = None
                    second_percentage = None
                elif dataset_type == "geo_combo_frequency":
                    value = random.randint(50, 300)
                    top_brand = f"{random.choice(list(brands.values()))} + {random.choice(list(brands.values()))}"
                    transaction_count = random.randint(500, 2500)
                    store_count = random.randint(2, 15)
                    brand_percentage = None
                    second_brand = None
                    second_percentage = None
                
                # Create a random polygon for the area
                center_lon = 120.0 + random.uniform(0, 6)
                center_lat = 13.0 + random.uniform(0, 5)
                polygon = [
                    [
                        [center_lon - 0.05, center_lat - 0.05],
                        [center_lon + 0.05, center_lat - 0.05],
                        [center_lon + 0.05, center_lat + 0.05],
                        [center_lon - 0.05, center_lat + 0.05],
                        [center_lon - 0.05, center_lat - 0.05]
                    ]
                ]
                
                # Create feature properties
                properties = {
                    "region": region,
                    "city": city,
                    "barangay": barangay,
                    "value": value,
                    "rank": feature_id,
                    "storeCount": store_count,
                    "topBrand": top_brand,
                    "transactionCount": transaction_count
                }
                
                # Add brand-specific properties if applicable
                if dataset_type == "geo_brand_mentions":
                    properties.update({
                        "brandID": top_brand_id,
                        "brandPercentage": brand_percentage,
                        "secondBrand": second_brand,
                        "secondBrandID": second_brand_id,
                        "secondPercentage": second_percentage
                    })
                
                # Create the feature
                feature = {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": polygon
                    }
                }
                
                features.append(feature)
                feature_id += 1
    
    # Create the GeoJSON object
    metadata_source = dataset_type.replace("geo_", "")
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "generated": datetime.datetime.now().isoformat(),
            "source": "simulated",
            "mode": metadata_source,
            "timeRange": f"last_{days}_days"
        },
        "features": features
    }
    
    return geojson

def generate_simulated_top_brands(days):
    """Generate simulated top brands data."""
    # Define brands
    brands = [
        {"BrandID": 101, "BrandName": "Sugarcola"},
        {"BrandID": 102, "BrandName": "Juicy Juice"},
        {"BrandID": 103, "BrandName": "Crunch Snacks"},
        {"BrandID": 104, "BrandName": "Marlborez"},
        {"BrandID": 105, "BrandName": "Happy Coffee"},
        {"BrandID": 106, "BrandName": "Snack Time"},
        {"BrandID": 107, "BrandName": "Mega Water"},
        {"BrandID": 108, "BrandName": "Energy Plus"},
        {"BrandID": 109, "BrandName": "Choco Delight"},
        {"BrandID": 110, "BrandName": "Crispy Chips"}
    ]
    
    # Generate random transaction counts for each brand
    total_transactions = 100000
    remaining = total_transactions
    
    for i, brand in enumerate(brands):
        # Distribute transactions with decreasing probability
        if i < len(brands) - 1:
            share = random.uniform(0.5, 0.9) if i == 0 else random.uniform(0.4, 0.7)
            transactions = int(remaining * share)
            remaining -= transactions
        else:
            transactions = remaining  # Last brand gets the remainder
        
        brand["TransactionCount"] = transactions
        brand["MentionCount"] = transactions + random.randint(0, transactions // 2)
        brand["MarketSharePct"] = round(transactions / total_transactions * 100, 2)
        brand["BrandRank"] = i + 1
    
    # Sort by TransactionCount (descending)
    brands.sort(key=lambda x: x["TransactionCount"], reverse=True)
    
    return brands

def upload_to_azure_blob(azure_config, file_path, container_path):
    """Upload a file to Azure Blob Storage."""
    try:
        # Create BlobServiceClient
        blob_service_client = BlobServiceClient.from_connection_string(azure_config["connection_string"])
        
        # Get container client
        container_client = blob_service_client.get_container_client(azure_config["container_name"])
        
        # Check if container exists, create if not
        try:
            container_client.get_container_properties()
        except Exception:
            container_client.create_container()
            logger.info(f"Created container: {azure_config['container_name']}")
        
        # Get blob client
        blob_client = container_client.get_blob_client(container_path)
        
        # Set content type based on file extension
        content_type = "application/json" if file_path.endswith(".json") else "application/octet-stream"
        content_settings = ContentSettings(content_type=content_type)
        
        # Upload file
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True, content_settings=content_settings)
        
        logger.info(f"Uploaded {file_path} to {container_path}")
        return True
    
    except Exception as e:
        logger.error(f"Error uploading to Azure Blob Storage: {str(e)}")
        return False

def process_datasets(config, args):
    """Process and export the specified datasets."""
    output_dir = config["export"]["output_dir"]
    days = args.days or config["export"]["days"]
    
    # Get the list of datasets to export
    if args.datasets:
        datasets = args.datasets.split(",")
    else:
        datasets = config["export"]["datasets"]
    
    logger.info(f"Processing datasets: {', '.join(datasets)}")
    
    # Track successful exports
    successful_exports = []
    
    if args.simulate:
        # Generate simulated data
        for dataset in datasets:
            if dataset in DATASET_QUERIES:
                if generate_simulated_data(dataset, output_dir, days):
                    successful_exports.append(dataset)
            else:
                logger.warning(f"Unknown dataset: {dataset}")
    else:
        # Connect to the database
        conn = connect_to_database(config["database"])
        if conn is None:
            logger.error("Could not connect to the database. Exiting.")
            return []
        
        try:
            # Export each dataset
            for dataset in datasets:
                if dataset in DATASET_QUERIES:
                    query = DATASET_QUERIES[dataset]
                    if export_dataset(conn, dataset, query, output_dir, days):
                        successful_exports.append(dataset)
                else:
                    logger.warning(f"Unknown dataset: {dataset}")
        finally:
            conn.close()
    
    # Upload to Azure Blob Storage if requested
    if args.upload and successful_exports:
        logger.info(f"Uploading {len(successful_exports)} datasets to Azure Blob Storage")
        
        for dataset in successful_exports:
            file_path = os.path.join(output_dir, f"{dataset}.json")
            container_path = f"data/simulated/{dataset}.json"
            upload_to_azure_blob(config["azure_storage"], file_path, container_path)
    
    logger.info(f"Successfully processed {len(successful_exports)} of {len(datasets)} datasets")
    return successful_exports

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Export SQL datasets to JSON for Scout Edge dashboard.')
    parser.add_argument('--config', help='Path to the configuration file', default='config.json')
    parser.add_argument('--datasets', help='Comma-separated list of datasets to export')
    parser.add_argument('--upload', action='store_true', help='Upload the exported files to Azure Blob Storage')
    parser.add_argument('--simulate', action='store_true', help='Generate simulated data instead of querying the database')
    parser.add_argument('--days', type=int, help='Number of days of data to export')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Process datasets
    successful_exports = process_datasets(config, args)
    
    if not successful_exports:
        logger.error("No datasets were successfully exported.")
        sys.exit(1)
    
    logger.info(f"Dataset export completed successfully for: {', '.join(successful_exports)}")
    sys.exit(0)

if __name__ == "__main__":
    main()