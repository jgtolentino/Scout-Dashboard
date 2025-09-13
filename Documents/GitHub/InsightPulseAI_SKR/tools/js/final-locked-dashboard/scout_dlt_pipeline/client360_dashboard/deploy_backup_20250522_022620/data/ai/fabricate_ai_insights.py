#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fabricate_ai_insights.py - AI Insights Generator for Client360 Dashboard

This script generates AI-powered insights for the Client360 Dashboard using 
Azure OpenAI. It can operate in both synthetic and production modes, generating 
realistic insights based on sales, brand, and store data.

Usage:
    python fabricate_ai_insights.py --mode [synthetic|production] --output [sql|parquet|json]
"""

import os
import sys
import time
import json
import uuid
import random
import argparse
import logging
import datetime
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional, Union
import yaml
import pyarrow as pa
import pyarrow.parquet as pq
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import openai
from concurrent.futures import ThreadPoolExecutor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ai_insights_generation.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("fabricate_ai_insights")

# Load environment variables
load_dotenv()

def load_model_routing_config(config_path: str = "model_routing.yaml") -> Dict:
    """Load the model routing configuration from YAML file."""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        logger.info(f"Successfully loaded model routing config from {config_path}")
        return config
    except Exception as e:
        logger.error(f"Error loading model routing config: {e}")
        sys.exit(1)

def get_azure_secret(secret_name: str) -> str:
    """Retrieve a secret from Azure Key Vault."""
    try:
        keyvault_name = os.environ.get("AZURE_KEYVAULT_ENDPOINT", "").replace("https://", "").replace(".vault.azure.net/", "")
        if not keyvault_name:
            logger.warning("Azure Key Vault endpoint not configured, using environment variables")
            return os.environ.get(secret_name, "")
            
        credential = DefaultAzureCredential()
        secret_client = SecretClient(vault_url=f"https://{keyvault_name}.vault.azure.net/", credential=credential)
        return secret_client.get_secret(secret_name).value
    except Exception as e:
        logger.warning(f"Failed to retrieve secret from Key Vault: {e}")
        return os.environ.get(secret_name, "")

def setup_openai_client(config: Dict) -> openai.AzureOpenAI:
    """Set up the Azure OpenAI client using configuration."""
    provider_config = config["providers"]["azure_openai"]
    
    # Try to get API key from Key Vault first, fall back to environment variable
    api_key = get_azure_secret("AZURE-OPENAI-API-KEY") or os.environ.get("AZURE_OPENAI_API_KEY", "")
    if not api_key:
        logger.error("Azure OpenAI API key not found in environment or Key Vault")
        sys.exit(1)
        
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", provider_config.get("base_url", ""))
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", provider_config.get("api_version", "2023-12-01-preview"))
    
    try:
        client = openai.AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint
        )
        logger.info("Successfully initialized Azure OpenAI client")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Azure OpenAI client: {e}")
        sys.exit(1)

def load_prompt_template(template_name: str, config: Dict) -> Dict:
    """Load a prompt template from configuration."""
    try:
        template_config = config["prompt_templates"][template_name]
        template_file = os.path.expandvars(template_config["file"])
        
        with open(template_file, 'r') as f:
            template_text = f.read()
            
        return {
            "text": template_text,
            "variables": template_config["variables"],
            "system_message": template_config["system_message"]
        }
    except Exception as e:
        logger.error(f"Error loading prompt template {template_name}: {e}")
        # Return a fallback minimal template
        return {
            "text": "Analyze the following data and provide insights: {data}",
            "variables": ["data"],
            "system_message": "You are an AI assistant analyzing retail data."
        }

def generate_synthetic_store_data(num_stores: int = 20) -> pd.DataFrame:
    """Generate synthetic store data for testing."""
    regions = ["National Capital Region", "Calabarzon", "Central Luzon", "Central Visayas", "Davao Region"]
    cities = ["Manila", "Quezon City", "Caloocan", "Cebu City", "Davao City", "Pasig", "Taguig", "Makati", "Mandaluyong", "Pasay"]
    barangays = ["San Miguel", "Santa Cruz", "Poblacion", "Barangay 1", "Santo Niño", "San Isidro", "San Jose", "Santa Maria", "San Antonio", "San Juan"]
    
    data = []
    for i in range(1, num_stores + 1):
        store_id = f"SIM-STORE-{str(i).zfill(4)}"
        region = random.choice(regions)
        city = random.choice(cities)
        barangay = random.choice(barangays)
        
        # Generate realistic lat/long within the Philippines
        latitude = random.uniform(7.5, 18.5)
        longitude = random.uniform(117.0, 126.0)
        
        monthly_sales = random.uniform(50000, 500000)
        customer_count = int(monthly_sales / random.uniform(100, 500))
        product_categories = random.randint(3, 10)
        
        data.append({
            "StoreID": store_id,
            "StoreName": f"Sari-Sari Store {i}",
            "Region": region,
            "CityMunicipality": city,
            "Barangay": barangay,
            "Latitude": latitude,
            "Longitude": longitude,
            "MonthlySales": monthly_sales,
            "CustomerCount": customer_count,
            "ProductCategories": product_categories,
            "IsSynthetic": True
        })
    
    return pd.DataFrame(data)

def generate_synthetic_sales_data(stores_df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    """Generate synthetic sales data for testing."""
    categories = [
        "Beverages", "Snacks", "Canned Goods", "Instant Noodles", 
        "Personal Care", "Household Supplies", "Condiments", "Tobacco"
    ]
    
    data = []
    end_date = datetime.datetime.now().date()
    start_date = end_date - datetime.timedelta(days=days)
    
    for store in stores_df.itertuples():
        for day_offset in range(days):
            sale_date = start_date + datetime.timedelta(days=day_offset)
            
            # Generate 3-8 sales entries per store per day
            for _ in range(random.randint(3, 8)):
                category = random.choice(categories)
                transactions = random.randint(10, 100)
                sales_amount = transactions * random.uniform(10, 100)
                
                data.append({
                    "SaleID": f"SIM-SALE-{str(len(data) + 1).zfill(6)}",
                    "StoreID": store.StoreID,
                    "Date": sale_date,
                    "ProductCategory": category,
                    "Transactions": transactions,
                    "SalesAmount": round(sales_amount, 2),
                    "IsSynthetic": True
                })
    
    return pd.DataFrame(data)

def generate_synthetic_brand_data(sales_df: pd.DataFrame) -> pd.DataFrame:
    """Generate synthetic brand interaction data for testing."""
    brands = [
        "Coca-Cola", "Pepsi", "Nestlé", "Unilever", "Procter & Gamble", "San Miguel", 
        "Monde Nissin", "Universal Robina", "Rebisco", "Alaska", "Argentina", "Oishi",
        "Lucky Me", "Surf", "Palmolive", "Milo", "Tang", "Great Taste", "Kopiko"
    ]
    interaction_types = ["Purchase", "Inquiry", "Display", "Promotion"]
    
    data = []
    for sale in sales_df.sample(n=min(len(sales_df), 1000)).itertuples():
        for _ in range(random.randint(1, 3)):
            brand = random.choice(brands)
            interaction_type = random.choice(interaction_types)
            sentiment_score = random.uniform(-1.0, 1.0)
            
            data.append({
                "InteractionID": f"SIM-INTER-{str(len(data) + 1).zfill(6)}",
                "SaleID": sale.SaleID,
                "StoreID": sale.StoreID,
                "Date": sale.Date,
                "Brand": brand,
                "InteractionType": interaction_type,
                "SentimentScore": round(sentiment_score, 2),
                "IsSynthetic": True
            })
    
    return pd.DataFrame(data)

def generate_insight_prompt(insight_type: str, data: Dict, config: Dict) -> Dict:
    """Generate a prompt for insight generation based on data and template."""
    routing_config = config["routing"][insight_type]
    template_name = routing_config["prompt_template"]
    template = load_prompt_template(template_name, config)
    
    # Replace template variables with actual data
    prompt_text = template["text"]
    for var in template["variables"]:
        if var in data:
            # Convert different data types to string format suitable for prompt
            if isinstance(data[var], pd.DataFrame):
                value = data[var].to_string()
            elif isinstance(data[var], dict) or isinstance(data[var], list):
                value = json.dumps(data[var], indent=2)
            else:
                value = str(data[var])
                
            prompt_text = prompt_text.replace(f"{{{var}}}", value)
    
    return {
        "system_message": template["system_message"],
        "user_message": prompt_text
    }

def generate_insight(client: openai.AzureOpenAI, insight_type: str, data: Dict, config: Dict) -> Dict:
    """Generate insights using Azure OpenAI."""
    try:
        # Get model configuration for this insight type
        routing_config = config["routing"][insight_type]
        model_key = routing_config["primary_model"]
        provider, model = model_key.split(".")
        model_config = config["providers"][provider]["models"][model]
        
        # Prepare the prompt
        prompt = generate_insight_prompt(insight_type, data, config)
        
        # Call the OpenAI API
        deployment = model_config.get("deployment_id", model)
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": prompt["system_message"]},
                {"role": "user", "content": prompt["user_message"]}
            ],
            max_tokens=routing_config.get("token_limit", 2000),
            temperature=model_config.get("temperature", 0.2),
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        insight_text = response.choices[0].message.content
        insight_json = json.loads(insight_text)
        
        # Add metadata
        result = {
            "InsightID": f"SIM-INSIGHT-{str(uuid.uuid4())[:8]}",
            "InsightType": insight_type,
            "GeneratedAt": datetime.datetime.now().isoformat(),
            "Model": model_key,
            "IsSynthetic": True,
            "Content": insight_json
        }
        
        # Add other data attributes for traceability
        if "StoreID" in data:
            result["StoreID"] = data["StoreID"]
        if "Date" in data:
            result["Date"] = data["Date"].isoformat() if hasattr(data["Date"], "isoformat") else data["Date"]
            
        return result
        
    except Exception as e:
        logger.error(f"Error generating {insight_type} insight: {e}")
        # Return a minimal insight to avoid breaking the pipeline
        return {
            "InsightID": f"SIM-INSIGHT-ERROR-{str(uuid.uuid4())[:8]}",
            "InsightType": insight_type,
            "GeneratedAt": datetime.datetime.now().isoformat(),
            "Model": "error",
            "IsSynthetic": True,
            "Error": str(e),
            "Content": {"error": "Failed to generate insight"}
        }

def generate_sales_insights(client: openai.AzureOpenAI, sales_df: pd.DataFrame, stores_df: pd.DataFrame, config: Dict) -> List[Dict]:
    """Generate sales insights for each store."""
    insights = []
    
    # Group sales by store
    store_groups = sales_df.groupby("StoreID")
    
    for store_id, store_sales in store_groups:
        # Get store information
        store_info = stores_df[stores_df["StoreID"] == store_id].iloc[0].to_dict() if any(stores_df["StoreID"] == store_id) else {}
        
        # Format sales data for the prompt
        store_sales_summary = store_sales.groupby("ProductCategory").agg({
            "Transactions": "sum",
            "SalesAmount": "sum"
        }).reset_index().to_dict(orient="records")
        
        # Daily sales trend
        daily_sales = store_sales.groupby("Date").agg({
            "SalesAmount": "sum"
        }).reset_index()
        daily_sales["Date"] = daily_sales["Date"].astype(str)
        daily_trend = daily_sales.to_dict(orient="records")
        
        # Prepare data for insight generation
        insight_data = {
            "StoreID": store_id,
            "StoreName": store_info.get("StoreName", f"Store {store_id}"),
            "Region": store_info.get("Region", "Unknown"),
            "CityMunicipality": store_info.get("CityMunicipality", "Unknown"),
            "Barangay": store_info.get("Barangay", "Unknown"),
            "Date": datetime.datetime.now().date(),
            "SalesSummary": store_sales_summary,
            "DailyTrend": daily_trend
        }
        
        # Generate the insight
        insight = generate_insight(client, "sales_insights", insight_data, config)
        insights.append(insight)
    
    return insights

def generate_brand_insights(client: openai.AzureOpenAI, brand_df: pd.DataFrame, config: Dict) -> List[Dict]:
    """Generate brand insights based on interaction data."""
    insights = []
    
    # Group by brand
    brand_groups = brand_df.groupby("Brand")
    
    for brand_name, brand_interactions in brand_groups:
        # Calculate some basic metrics for the brand
        interaction_count = len(brand_interactions)
        avg_sentiment = brand_interactions["SentimentScore"].mean()
        interaction_by_type = brand_interactions.groupby("InteractionType").size().to_dict()
        
        # Prepare data for insight generation
        insight_data = {
            "BrandID": brand_name.replace(" ", "_").lower(),
            "BrandName": brand_name,
            "InteractionCount": interaction_count,
            "AverageSentiment": round(avg_sentiment, 2),
            "InteractionsByType": interaction_by_type,
            "Date": datetime.datetime.now().date(),
            "InteractionSamples": brand_interactions.sample(min(10, len(brand_interactions))).to_dict(orient="records")
        }
        
        # Generate the insight
        insight = generate_insight(client, "brand_analysis", insight_data, config)
        insights.append(insight)
    
    return insights

def generate_store_recommendations(client: openai.AzureOpenAI, stores_df: pd.DataFrame, sales_df: pd.DataFrame, config: Dict) -> List[Dict]:
    """Generate store-specific recommendations."""
    insights = []
    
    # Process a subset of stores
    for store in stores_df.sample(min(5, len(stores_df))).itertuples():
        # Get sales data for this store
        store_sales = sales_df[sales_df["StoreID"] == store.StoreID]
        
        if len(store_sales) == 0:
            continue
            
        # Calculate sales metrics
        total_sales = store_sales["SalesAmount"].sum()
        sales_by_category = store_sales.groupby("ProductCategory").agg({
            "SalesAmount": "sum"
        }).reset_index()
        sales_by_category["Percentage"] = (sales_by_category["SalesAmount"] / total_sales * 100).round(2)
        
        # Prepare data for recommendation generation
        recommendation_data = {
            "StoreID": store.StoreID,
            "StoreName": store.StoreName,
            "Region": store.Region,
            "CityMunicipality": store.CityMunicipality,
            "Barangay": store.Barangay,
            "MonthlySales": store.MonthlySales,
            "ProductCategories": store.ProductCategories,
            "SalesByCategory": sales_by_category.to_dict(orient="records"),
            "Date": datetime.datetime.now().date()
        }
        
        # Generate the recommendation
        recommendation = generate_insight(client, "store_recommendations", recommendation_data, config)
        insights.append(recommendation)
    
    return insights

def save_insights_to_parquet(insights: List[Dict], output_path: str):
    """Save insights to Parquet format."""
    try:
        # Convert to pandas DataFrame
        df = pd.DataFrame(insights)
        
        # Convert complex JSON columns to strings for Parquet compatibility
        for col in df.columns:
            if df[col].apply(lambda x: isinstance(x, (dict, list))).any():
                df[col] = df[col].apply(json.dumps)
        
        # Save to Parquet
        table = pa.Table.from_pandas(df)
        pq.write_table(table, output_path)
        logger.info(f"Successfully saved insights to {output_path}")
    except Exception as e:
        logger.error(f"Error saving insights to Parquet: {e}")

def save_insights_to_json(insights: List[Dict], output_path: str):
    """Save insights to JSON format."""
    try:
        with open(output_path, 'w') as f:
            json.dump(insights, f, indent=2)
        logger.info(f"Successfully saved insights to {output_path}")
    except Exception as e:
        logger.error(f"Error saving insights to JSON: {e}")

def save_insights_to_sql(insights: List[Dict], output_path: str):
    """Generate SQL statements to insert insights into the database."""
    try:
        with open(output_path, 'w') as f:
            f.write("-- Auto-generated SQL for AI Insights\n")
            f.write("-- Generated on: " + datetime.datetime.now().isoformat() + "\n\n")
            
            # Begin transaction
            f.write("BEGIN TRANSACTION;\n\n")
            
            for insight in insights:
                # Convert the Content field to JSON string
                content_json = json.dumps(insight["Content"]).replace("'", "''")
                
                f.write(f"""
INSERT INTO dbo.AIInsights (
    InsightID,
    InsightType,
    GeneratedAt,
    Model,
    IsSynthetic,
    StoreID,
    Content
) VALUES (
    '{insight["InsightID"]}',
    '{insight["InsightType"]}',
    '{insight["GeneratedAt"]}',
    '{insight["Model"]}',
    {1 if insight.get("IsSynthetic", False) else 0},
    '{insight.get("StoreID", "NULL")}',
    '{content_json}'
);
""")
            
            # Commit transaction
            f.write("\nCOMMIT TRANSACTION;\n")
            
        logger.info(f"Successfully saved SQL statements to {output_path}")
    except Exception as e:
        logger.error(f"Error generating SQL statements: {e}")

def main():
    parser = argparse.ArgumentParser(description="Generate AI insights for Client360 Dashboard")
    parser.add_argument("--mode", choices=["synthetic", "production"], default="synthetic", 
                      help="Mode to run in (synthetic for test data, production for real data)")
    parser.add_argument("--output", choices=["sql", "parquet", "json"], default="json",
                      help="Output format for the generated insights")
    parser.add_argument("--config", default="model_routing.yaml",
                      help="Path to the model routing configuration file")
    parser.add_argument("--output-dir", default="./output",
                      help="Directory to save output files")
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)
    
    # Load configuration
    config = load_model_routing_config(args.config)
    
    # Set up OpenAI client
    client = setup_openai_client(config)
    
    # Generate or load data based on mode
    if args.mode == "synthetic":
        logger.info("Generating synthetic data for testing")
        
        # Generate synthetic data
        stores_df = generate_synthetic_store_data(20)
        sales_df = generate_synthetic_sales_data(stores_df, 30)
        brand_df = generate_synthetic_brand_data(sales_df)
        
        # Save synthetic data for reference
        stores_df.to_csv(os.path.join(args.output_dir, "synthetic_stores.csv"), index=False)
        sales_df.to_csv(os.path.join(args.output_dir, "synthetic_sales.csv"), index=False)
        brand_df.to_csv(os.path.join(args.output_dir, "synthetic_brand_interactions.csv"), index=False)
    else:
        # In production mode, data would be loaded from databases
        # This is a placeholder for actual implementation
        logger.error("Production mode not implemented yet")
        sys.exit(1)
    
    # Generate insights using ThreadPoolExecutor for parallel processing
    logger.info("Generating insights...")
    
    all_insights = []
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Submit tasks for different insight types
        sales_insights_future = executor.submit(generate_sales_insights, client, sales_df, stores_df, config)
        brand_insights_future = executor.submit(generate_brand_insights, client, brand_df, config)
        store_recommendations_future = executor.submit(generate_store_recommendations, client, stores_df, sales_df, config)
        
        # Collect results
        sales_insights = sales_insights_future.result()
        brand_insights = brand_insights_future.result()
        store_recommendations = store_recommendations_future.result()
        
        all_insights.extend(sales_insights)
        all_insights.extend(brand_insights)
        all_insights.extend(store_recommendations)
    
    logger.info(f"Generated {len(all_insights)} insights")
    
    # Save insights based on specified output format
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    if args.output == "parquet":
        output_file = os.path.join(args.output_dir, f"ai_insights_{timestamp}.parquet")
        save_insights_to_parquet(all_insights, output_file)
    elif args.output == "json":
        output_file = os.path.join(args.output_dir, f"ai_insights_{timestamp}.json")
        save_insights_to_json(all_insights, output_file)
    elif args.output == "sql":
        output_file = os.path.join(args.output_dir, f"ai_insights_{timestamp}.sql")
        save_insights_to_sql(all_insights, output_file)
        
    logger.info(f"All done! Output saved to {output_file}")

if __name__ == "__main__":
    main()