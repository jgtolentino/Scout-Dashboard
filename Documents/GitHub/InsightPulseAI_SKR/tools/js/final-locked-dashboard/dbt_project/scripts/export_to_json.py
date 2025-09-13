#!/usr/bin/env python
"""
Export dbt model outputs to JSON files for the Scout Edge dashboard.
This script connects to the data warehouse, runs SQL queries for each dataset,
and exports the results to JSON files that can be loaded by the dashboard.
"""
import os
import json
import argparse
import logging
import datetime
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
import yaml
import databricks.sql

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# SQL queries to generate the required JSON datasets
QUERIES = {
    "top_brands": """
        SELECT
            brand,
            state,
            city,
            transaction_count,
            total_quantity,
            total_sales,
            sales_share,
            transaction_share,
            quantity_share,
            sales_rank,
            transaction_rank,
            quantity_rank,
            is_top_5_sales,
            is_top_5_transactions,
            is_top_5_quantity
        FROM {{ target_schema }}.top_brands
        WHERE sales_rank <= 20
        ORDER BY state, city, sales_rank
    """,
    
    "top_combos": """
        SELECT
            brand_a,
            brand_b,
            state,
            city,
            transaction_count,
            lift,
            pct_of_brand_a_transactions,
            pct_of_brand_b_transactions,
            is_top_10_by_frequency,
            is_top_10_by_lift
        FROM {{ target_schema }}.top_combos
        WHERE is_top_10_by_frequency = true OR is_top_10_by_lift = true
        ORDER BY state, city, lift_rank
    """,
    
    "store_metrics": """
        SELECT
            store_id,
            store_name,
            latitude,
            longitude,
            city,
            state,
            country,
            store_type,
            total_brands_carried,
            avg_daily_revenue,
            avg_daily_transactions,
            revenue_vs_region_avg,
            transactions_vs_region_avg,
            brand_diversity_vs_region_avg
        FROM {{ target_schema }}.store_metrics
        ORDER BY revenue_vs_region_avg DESC
    """,
    
    "geo_brand_distribution": """
        SELECT
            state,
            city,
            brand,
            COUNT(*) as mention_count,
            SUM(quantity) as total_quantity,
            SUM(item_total) as total_sales
        FROM {{ target_schema }}.sales_interaction_brands
        WHERE transaction_date >= CURRENT_DATE - INTERVAL {days} DAY
        GROUP BY state, city, brand
        HAVING COUNT(*) >= 5
        ORDER BY state, city, total_sales DESC
    """,
    
    "geo_sales_volume": """
        SELECT
            state,
            city,
            COUNT(DISTINCT transaction_id) as transaction_count,
            SUM(item_total) as total_sales,
            COUNT(DISTINCT store_id) as store_count
        FROM {{ target_schema }}.sales_interaction_brands
        WHERE transaction_date >= CURRENT_DATE - INTERVAL {days} DAY
        GROUP BY state, city
        ORDER BY total_sales DESC
    """,
    
    "geo_brand_mentions": """
        WITH brand_mentions AS (
            SELECT
                state,
                city,
                brand_standardized as brand,
                COUNT(*) as mention_count,
                SUM(quantity) as total_quantity,
                SUM(item_total) as total_sales
            FROM {{ target_schema }}.sales_interaction_brands
            WHERE transaction_date >= CURRENT_DATE - INTERVAL {days} DAY
            GROUP BY state, city, brand_standardized
            HAVING COUNT(*) >= 5
        ),
        region_totals AS (
            SELECT
                state,
                city,
                SUM(mention_count) as total_mentions,
                SUM(total_sales) as total_region_sales
            FROM brand_mentions
            GROUP BY state, city
        )
        SELECT
            b.state,
            b.city,
            b.brand,
            b.mention_count,
            b.total_quantity,
            b.total_sales,
            (b.mention_count / r.total_mentions) as mention_share,
            (b.total_sales / r.total_region_sales) as sales_share,
            CASE 
                WHEN b.total_sales > 10000 THEN 'high'
                WHEN b.total_sales > 5000 THEN 'medium'
                ELSE 'low' 
            END as value_segment
        FROM brand_mentions b
        JOIN region_totals r
            ON b.state = r.state AND b.city = r.city
        ORDER BY b.state, b.city, b.total_sales DESC
    """
}

def load_profiles():
    """Load dbt profiles configuration."""
    profiles_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "profiles.yml")
    with open(profiles_path, "r") as f:
        return yaml.safe_load(f)

def get_connection_from_profile(profile_name, target_name=None):
    """Create a database connection from a dbt profile."""
    profiles = load_profiles()
    
    if profile_name not in profiles:
        raise ValueError(f"Profile '{profile_name}' not found in profiles.yml")
    
    profile = profiles[profile_name]
    target = target_name or profile.get("target", "dev")
    
    if target not in profile.get("outputs", {}):
        raise ValueError(f"Target '{target}' not found in profile '{profile_name}'")
    
    connection_config = profile["outputs"][target]
    
    if connection_config["type"] == "databricks":
        # Databricks connection
        connection = databricks.sql.connect(
            server_hostname=os.path.expandvars(connection_config["host"].replace("{{ env_var('DBT_DATABRICKS_HOST') }}", "${DBT_DATABRICKS_HOST}")),
            http_path=os.path.expandvars(connection_config["http_path"].replace("{{ env_var('DBT_DATABRICKS_HTTP_PATH') }}", "${DBT_DATABRICKS_HTTP_PATH}")),
            access_token=os.path.expandvars(connection_config["token"].replace("{{ env_var('DBT_DATABRICKS_TOKEN') }}", "${DBT_DATABRICKS_TOKEN}"))
        )
        return connection
    else:
        # SQLAlchemy connection for other database types
        engine = create_engine(URL.create(
            drivername=connection_config["type"],
            username=connection_config.get("user"),
            password=connection_config.get("password"),
            host=connection_config.get("host"),
            port=connection_config.get("port"),
            database=connection_config.get("database"),
        ))
        return engine.connect()

def run_query(connection, query, target_schema, days=30):
    """Run a SQL query and return the results as a DataFrame."""
    formatted_query = query.replace("{{ target_schema }}", target_schema).format(days=days)
    
    if isinstance(connection, databricks.sql.client.Connection):
        with connection.cursor() as cursor:
            cursor.execute(formatted_query)
            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchall()
        
        return pd.DataFrame(data, columns=columns)
    else:
        return pd.read_sql(formatted_query, connection)

def convert_to_geojson(df, lat_col="latitude", lon_col="longitude", properties=None):
    """Convert a DataFrame with lat/lon columns to GeoJSON."""
    features = []
    
    for _, row in df.iterrows():
        geometry = {
            "type": "Point",
            "coordinates": [float(row[lon_col]), float(row[lat_col])]
        }
        
        props = {}
        if properties:
            for prop in properties:
                if prop in row:
                    value = row[prop]
                    # Convert numpy/pandas types to Python native types
                    if hasattr(value, "item"):
                        value = value.item()
                    props[prop] = value
        
        feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": props
        }
        
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def convert_to_choropleth_data(df, region_col="state", value_col="total_sales", normalize_col=None):
    """Convert DataFrame to format suitable for choropleth maps."""
    result = []
    
    for region, group in df.groupby(region_col):
        value = group[value_col].sum()
        
        if normalize_col and normalize_col in group:
            normalizer = group[normalize_col].sum()
            normalized_value = value / normalizer if normalizer else 0
        else:
            normalized_value = None
        
        data = {"region": region, "value": float(value)}
        
        if normalized_value is not None:
            data["normalizedValue"] = float(normalized_value)
            
        result.append(data)
    
    return sorted(result, key=lambda x: x["value"], reverse=True)

def export_dataset(df, dataset, output_dir, format_func=None):
    """Export a dataset to a JSON file."""
    os.makedirs(output_dir, exist_ok=True)
    
    if format_func:
        data = format_func(df)
    else:
        # Convert DataFrame to dict records
        data = df.to_dict(orient="records")
    
    output_file = os.path.join(output_dir, f"{dataset}.json")
    with open(output_file, "w") as f:
        json.dump(data, f, default=str)
        
    logger.info(f"Exported {dataset} to {output_file}")
    return output_file

def generate_sample_data():
    """Generate sample data for testing when no connection is available."""
    import numpy as np
    
    # Sample data for top_brands
    top_brands = pd.DataFrame({
        "brand": np.random.choice(["Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Asics", "Converse"], 50),
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 50),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 50),
        "transaction_count": np.random.randint(100, 5000, 50),
        "total_quantity": np.random.randint(500, 10000, 50),
        "total_sales": np.random.uniform(10000, 1000000, 50),
        "sales_share": np.random.uniform(0.01, 0.4, 50),
        "transaction_share": np.random.uniform(0.01, 0.4, 50),
        "quantity_share": np.random.uniform(0.01, 0.4, 50),
        "sales_rank": np.arange(1, 51),
        "transaction_rank": np.random.permutation(np.arange(1, 51)),
        "quantity_rank": np.random.permutation(np.arange(1, 51)),
        "is_top_5_sales": np.random.choice([True, False], 50),
        "is_top_5_transactions": np.random.choice([True, False], 50),
        "is_top_5_quantity": np.random.choice([True, False], 50)
    })
    
    # Sample data for top_combos
    top_combos = pd.DataFrame({
        "brand_a": np.random.choice(["Nike", "Adidas", "Puma", "Under Armour"], 30),
        "brand_b": np.random.choice(["Apple", "Samsung", "Sony", "Bose"], 30),
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 30),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 30),
        "transaction_count": np.random.randint(50, 1000, 30),
        "lift": np.random.uniform(1.1, 5.0, 30),
        "pct_of_brand_a_transactions": np.random.uniform(0.01, 0.4, 30),
        "pct_of_brand_b_transactions": np.random.uniform(0.01, 0.4, 30),
        "is_top_10_by_frequency": np.random.choice([True, False], 30),
        "is_top_10_by_lift": np.random.choice([True, False], 30)
    })
    
    # Sample data for store_metrics
    store_metrics = pd.DataFrame({
        "store_id": [f"STORE{i:03d}" for i in range(1, 41)],
        "store_name": [f"Store {i}" for i in range(1, 41)],
        "latitude": np.random.uniform(25, 49, 40),
        "longitude": np.random.uniform(-124, -70, 40),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 40),
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 40),
        "country": ["USA" for _ in range(40)],
        "store_type": np.random.choice(["Flagship", "Mall", "Street", "Outlet"], 40),
        "total_brands_carried": np.random.randint(10, 100, 40),
        "avg_daily_revenue": np.random.uniform(5000, 50000, 40),
        "avg_daily_transactions": np.random.uniform(50, 500, 40),
        "revenue_vs_region_avg": np.random.uniform(0.5, 2.0, 40),
        "transactions_vs_region_avg": np.random.uniform(0.5, 2.0, 40),
        "brand_diversity_vs_region_avg": np.random.uniform(0.5, 2.0, 40)
    })
    
    # Sample data for geo_brand_distribution
    geo_brand_distribution = pd.DataFrame({
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 100),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 100),
        "brand": np.random.choice(["Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Asics", "Converse"], 100),
        "mention_count": np.random.randint(5, 1000, 100),
        "total_quantity": np.random.randint(10, 5000, 100),
        "total_sales": np.random.uniform(1000, 100000, 100)
    })
    
    # Sample data for geo_sales_volume
    geo_sales_volume = pd.DataFrame({
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 20),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 20),
        "transaction_count": np.random.randint(100, 10000, 20),
        "total_sales": np.random.uniform(10000, 1000000, 20),
        "store_count": np.random.randint(1, 20, 20)
    })
    
    # Sample data for geo_brand_mentions
    geo_brand_mentions = pd.DataFrame({
        "state": np.random.choice(["CA", "NY", "TX", "FL", "IL"], 100),
        "city": np.random.choice(["Los Angeles", "San Francisco", "New York", "Chicago", "Dallas", "Miami"], 100),
        "brand": np.random.choice(["Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Asics", "Converse"], 100),
        "mention_count": np.random.randint(5, 1000, 100),
        "total_quantity": np.random.randint(10, 5000, 100),
        "total_sales": np.random.uniform(1000, 100000, 100),
        "mention_share": np.random.uniform(0.01, 0.3, 100),
        "sales_share": np.random.uniform(0.01, 0.3, 100),
        "value_segment": np.random.choice(["high", "medium", "low"], 100)
    })
    
    return {
        "top_brands": top_brands,
        "top_combos": top_combos,
        "store_metrics": store_metrics,
        "geo_brand_distribution": geo_brand_distribution,
        "geo_sales_volume": geo_sales_volume,
        "geo_brand_mentions": geo_brand_mentions
    }

def main():
    parser = argparse.ArgumentParser(description="Export dbt model outputs to JSON files for the Scout Edge dashboard")
    parser.add_argument("--profile", default="scout_edge", help="dbt profile name")
    parser.add_argument("--target", default=None, help="dbt target name (default: profile's default target)")
    parser.add_argument("--schema", default=None, help="Target schema name (default: from profile)")
    parser.add_argument("--output-dir", default="../assets/data", help="Output directory for JSON files")
    parser.add_argument("--days", type=int, default=30, help="Number of days of data to include")
    parser.add_argument("--sample", action="store_true", help="Generate sample data instead of querying the database")
    parser.add_argument("--dataset", help="Export only the specified dataset")
    
    args = parser.parse_args()
    
    # Determine the output directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    output_dir = os.path.normpath(os.path.join(project_dir, args.output_dir))
    
    logger.info(f"Using output directory: {output_dir}")
    
    # Dictionary of special export functions for specific datasets
    export_functions = {
        "store_metrics": lambda df: convert_to_geojson(
            df, 
            properties=["store_id", "store_name", "city", "state", "country", 
                        "store_type", "total_brands_carried", "avg_daily_revenue", 
                        "revenue_vs_region_avg"]
        ),
        "geo_sales_volume": lambda df: convert_to_choropleth_data(df, region_col="state", value_col="total_sales"),
        "geo_brand_distribution": lambda df: df.to_dict(orient="records")
    }
    
    if args.sample:
        logger.info("Generating sample data")
        data_frames = generate_sample_data()
        
        # Filter to specific dataset if requested
        if args.dataset and args.dataset in data_frames:
            datasets = {args.dataset: data_frames[args.dataset]}
        else:
            datasets = data_frames
            
        # Export each dataset
        for dataset, df in datasets.items():
            export_dataset(df, dataset, output_dir, 
                          format_func=export_functions.get(dataset))
            
    else:
        try:
            logger.info(f"Connecting to database using profile '{args.profile}'")
            connection = get_connection_from_profile(args.profile, args.target)
            
            # Get the target schema from profile if not specified
            target_schema = args.schema
            if not target_schema:
                profiles = load_profiles()
                profile = profiles[args.profile]
                target = args.target or profile.get("target", "dev")
                conn_config = profile["outputs"][target]
                target_schema = conn_config.get("schema", "public")
                
            logger.info(f"Using target schema: {target_schema}")
            
            # Filter to specific dataset if requested
            if args.dataset and args.dataset in QUERIES:
                queries = {args.dataset: QUERIES[args.dataset]}
            else:
                queries = QUERIES
                
            # Export each dataset
            for dataset, query in queries.items():
                logger.info(f"Exporting dataset: {dataset}")
                df = run_query(connection, query, target_schema, args.days)
                export_dataset(df, dataset, output_dir,
                              format_func=export_functions.get(dataset))
                
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            raise
            
        finally:
            if 'connection' in locals() and connection:
                connection.close()
                logger.info("Database connection closed")
    
    logger.info("Export completed successfully")

if __name__ == "__main__":
    main()