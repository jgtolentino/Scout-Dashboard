#!/usr/bin/env python
"""
Export dbt model data to JSON files for dashboard consumption
This script runs after dbt models are built to create static JSON files
that the Scout Edge dashboard can use for visualizations
"""

import os
import json
import argparse
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    parser = argparse.ArgumentParser(description='Export dbt models to JSON files')
    parser.add_argument('--profile', default='scout_edge', help='dbt profile to use')
    parser.add_argument('--target', default='dev', help='dbt target to use')
    parser.add_argument('--output-dir', default='../assets/data/exports', help='Output directory for JSON files')
    parser.add_argument('--models', nargs='+', default=['sales_interaction_brands', 'top_brands', 'top_combos', 'store_metrics'], 
                        help='List of models to export')
    return parser.parse_args()

def get_connection_from_profile(profile, target):
    """
    Create a database connection using dbt profile information
    """
    # In a real environment, this would parse the dbt profiles.yml file
    # For this example, we'll use environment variables or hardcoded dev credentials
    
    # This should be replaced with actual profile parsing in production
    connections = {
        'dev': {
            'host': os.environ.get('DBT_HOST', 'localhost'),
            'port': os.environ.get('DBT_PORT', '5432'),
            'user': os.environ.get('DBT_USER', 'dbt_user'),
            'password': os.environ.get('DBT_PASSWORD', 'dbt_password'),
            'database': os.environ.get('DBT_DATABASE', 'retail_data'),
            'schema': 'marts',
        },
        'prod': {
            'host': os.environ.get('DBT_PROD_HOST', 'prod-db.example.com'),
            'port': os.environ.get('DBT_PROD_PORT', '5432'),
            'user': os.environ.get('DBT_PROD_USER', 'dbt_prod_user'),
            'password': os.environ.get('DBT_PROD_PASSWORD', 'dbt_prod_password'),
            'database': os.environ.get('DBT_PROD_DATABASE', 'retail_data_prod'),
            'schema': 'marts',
        }
    }
    
    conn_info = connections.get(target)
    if not conn_info:
        raise ValueError(f"Target {target} not found in profile {profile}")
    
    connection_string = f"postgresql://{conn_info['user']}:{conn_info['password']}@{conn_info['host']}:{conn_info['port']}/{conn_info['database']}"
    engine = create_engine(connection_string)
    return engine, conn_info['schema']

def export_model_to_json(engine, schema, model_name, output_dir):
    """
    Export a dbt model to a JSON file
    """
    logger.info(f"Exporting model {model_name} to JSON")
    
    # For large tables, you might want to add a LIMIT clause or filter condition
    query = text(f"SELECT * FROM {schema}.{model_name}")
    
    try:
        df = pd.read_sql(query, engine)
        logger.info(f"Retrieved {len(df)} rows from {model_name}")
        
        # Handle datetime/date columns for JSON serialization
        for col in df.select_dtypes(include=['datetime64', 'datetime64[ns]']).columns:
            df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%S')
        
        for col in df.select_dtypes(include=['date']).columns:
            df[col] = df[col].dt.strftime('%Y-%m-%d')
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Write to JSON file
        output_file = os.path.join(output_dir, f"{model_name}.json")
        
        # For choropleth map compatibility, create a special structure for sales_interaction_brands
        if model_name == 'sales_interaction_brands':
            # Convert to GeoJSON-compatible format for choropleth maps
            geo_data = create_choropleth_geojson(df)
            with open(output_file, 'w') as f:
                json.dump(geo_data, f)
        else:
            # For other models, just convert to regular JSON
            records = df.to_dict(orient='records')
            
            # Add metadata
            data = {
                "metadata": {
                    "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
                    "model": model_name,
                    "record_count": len(records)
                },
                "data": records
            }
            
            with open(output_file, 'w') as f:
                json.dump(data, f)
        
        logger.info(f"Exported {model_name} to {output_file}")
        return output_file
    
    except Exception as e:
        logger.error(f"Error exporting {model_name}: {str(e)}")
        raise

def create_choropleth_geojson(df):
    """
    Create a GeoJSON structure from the sales_interaction_brands data
    This is specifically formatted for choropleth map visualization
    """
    # Group by geographic regions
    region_data = df.groupby(['Region', 'City', 'Barangay', 'BrandID', 'BrandName']).agg({
        'TransactionID': 'nunique',
        'MentionCount': 'sum',
        'CustomerID': lambda x: x.nunique(),
        'TransactionAmount': 'sum',
        'IsTopBrand': 'sum'
    }).reset_index()
    
    region_data.columns = ['Region', 'City', 'Barangay', 'BrandID', 'BrandName', 
                          'TransactionCount', 'MentionCount', 'UniqueCustomers', 
                          'TotalSales', 'TopBrandCount']
    
    # Calculate top brand percentage
    region_data['TopBrandPercentage'] = (region_data['TopBrandCount'] / region_data['TransactionCount']) * 100
    
    # Create a lookup to get top brand for each region
    top_brands = region_data.sort_values(['Region', 'City', 'Barangay', 'MentionCount'], ascending=[True, True, True, False])
    top_brands = top_brands.groupby(['Region', 'City', 'Barangay']).first().reset_index()
    top_brand_lookup = {}
    for _, row in top_brands.iterrows():
        key = f"{row['Region']}_{row['City']}_{row['Barangay']}"
        top_brand_lookup[key] = {
            'topBrand': row['BrandName'],
            'topBrandCount': int(row['MentionCount']),
            'topBrandPercentage': int(row['TopBrandPercentage'])
        }
    
    # Build the GeoJSON structure
    features = []
    for geo_key, data in top_brands.groupby(['Region', 'City', 'Barangay']):
        region, city, barangay = geo_key
        geo_id = f"{region}_{city}_{barangay}"
        top_brand_info = top_brand_lookup.get(geo_id, {})
        
        # For this demo, we don't have actual geometry data
        # In a real implementation, you would join with actual GeoJSON polygons
        feature = {
            "type": "Feature",
            "properties": {
                "name": barangay,
                "region": region,
                "city": city,
                "barangay": barangay,
                "value": int(data['MentionCount'].sum()),
                "rank": 0,  # This would be calculated properly in real implementation
                "storeCount": int(data['UniqueCustomers'].nunique()),
                "topBrand": top_brand_info.get('topBrand', ''),
                "brandPercentage": top_brand_info.get('topBrandPercentage', 0),
                "transactionCount": int(data['TransactionCount'].sum())
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": []  # This would be filled with actual coordinates in real implementation
            }
        }
        features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "generated": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "source": "dbt_export",
            "mode": "geo_brand_mentions",
            "timeRange": "last_90_days"
        },
        "features": features
    }
    
    return geojson

def main():
    args = parse_args()
    
    try:
        engine, schema = get_connection_from_profile(args.profile, args.target)
        logger.info(f"Connected to database using profile {args.profile}, target {args.target}")
        
        exported_files = []
        for model in args.models:
            file_path = export_model_to_json(engine, schema, model, args.output_dir)
            exported_files.append(file_path)
        
        logger.info(f"Successfully exported {len(exported_files)} models to JSON")
        
        # Create an index file that lists all exports
        index = {
            "exports": [os.path.basename(f) for f in exported_files],
            "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "profile": args.profile,
            "target": args.target
        }
        
        index_path = os.path.join(args.output_dir, "index.json")
        with open(index_path, 'w') as f:
            json.dump(index, f)
        
        logger.info(f"Created index file at {index_path}")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())