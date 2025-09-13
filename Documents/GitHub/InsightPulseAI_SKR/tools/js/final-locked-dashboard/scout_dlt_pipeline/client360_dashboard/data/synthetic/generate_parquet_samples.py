#!/usr/bin/env python3
"""
Synthetic Data Generator for Client360 Dashboard
Converts JSON sample data to Parquet format for use with the data toggle feature
"""

import os
import json
import pandas as pd
import argparse
from datetime import datetime

def ensure_directory(directory):
    """Ensure the directory exists, create it if it doesn't"""
    if not os.path.exists(directory):
        print(f"Creating directory: {directory}")
        os.makedirs(directory)

def generate_store_data():
    """Generate sample store data for the dashboard"""
    stores = [
        {
            "id": "S001",
            "name": "Manila Central Store",
            "region": "NCR",
            "storeType": "company-owned",
            "performance": 92,
            "sales": 325680,
            "stockouts": 5,
            "uptime": 98,
            "openDate": "2022-08-15",
            "lastRestock": "2025-05-15",
            "inventoryHealth": 95,
            "avgTraffic": 1250,
            "avgBasketSize": 260.54,
            "address": "123 Rizal Avenue, Manila",
            "manager": "Maria Santos",
            "contact": "+63 919 123 4567",
            "latitude": 14.5995,
            "longitude": 120.9842,
            "barangay": "Binondo",
            "municipality": "Manila",
            "province": "Metro Manila"
        },
        {
            "id": "S002",
            "name": "Cagayan de Oro Store",
            "region": "Mindanao",
            "storeType": "franchise",
            "performance": 85,
            "sales": 215430,
            "stockouts": 18,
            "uptime": 94,
            "openDate": "2023-01-08",
            "lastRestock": "2025-05-12",
            "inventoryHealth": 78,
            "avgTraffic": 820,
            "avgBasketSize": 381.07,
            "address": "456 Corrales Ave, Cagayan de Oro",
            "manager": "Paolo Mendoza",
            "contact": "+63 918 765 4321",
            "latitude": 8.4542,
            "longitude": 124.6319,
            "barangay": "Divisoria",
            "municipality": "Cagayan de Oro",
            "province": "Misamis Oriental"
        },
        {
            "id": "S003",
            "name": "Cebu City Store",
            "region": "Visayas",
            "storeType": "franchise",
            "performance": 65,
            "sales": 198750,
            "stockouts": 24,
            "uptime": 92,
            "openDate": "2022-07-22",
            "lastRestock": "2025-05-14",
            "inventoryHealth": 65,
            "avgTraffic": 520,
            "avgBasketSize": 382.21,
            "address": "78 Osmena Blvd, Cebu City",
            "manager": "Antonio Garcia",
            "contact": "+63 927 123 4567",
            "latitude": 10.3157,
            "longitude": 123.8854,
            "barangay": "Santo Niño",
            "municipality": "Cebu City",
            "province": "Cebu"
        },
        {
            "id": "S004",
            "name": "Angeles Store",
            "region": "Luzon",
            "storeType": "partner",
            "performance": 78,
            "sales": 150320,
            "stockouts": 15,
            "uptime": 96,
            "openDate": "2023-03-01",
            "lastRestock": "2025-05-10",
            "inventoryHealth": 82,
            "avgTraffic": 340,
            "avgBasketSize": 442.12,
            "address": "25 Friendship Highway, Angeles City",
            "manager": "Ryan Torres",
            "contact": "+63 939 876 5432",
            "latitude": 15.1795,
            "longitude": 120.5960,
            "barangay": "Balibago",
            "municipality": "Angeles City",
            "province": "Pampanga"
        },
        {
            "id": "S005",
            "name": "Iloilo Store",
            "region": "Visayas",
            "storeType": "company-owned",
            "performance": 81,
            "sales": 265430,
            "stockouts": 8,
            "uptime": 97,
            "openDate": "2022-09-15",
            "lastRestock": "2025-05-16",
            "inventoryHealth": 89,
            "avgTraffic": 560,
            "avgBasketSize": 473.98,
            "address": "45 Diversion Road, Iloilo City",
            "manager": "Christina Lim",
            "contact": "+63 945 234 5678",
            "latitude": 10.7202,
            "longitude": 122.5644,
            "barangay": "Mandurriao",
            "municipality": "Iloilo City",
            "province": "Iloilo"
        }
    ]
    return stores

def generate_sales_data():
    """Generate sample sales data for the dashboard"""
    sales_data = []
    
    # Generate sample daily sales for 5 stores over 30 days
    store_ids = ["S001", "S002", "S003", "S004", "S005"]
    
    # Base values for each store
    base_values = {
        "S001": {"sales": 10000, "transactions": 200, "customers": 180},
        "S002": {"sales": 7500, "transactions": 150, "customers": 140},
        "S003": {"sales": 6000, "transactions": 120, "customers": 110},
        "S004": {"sales": 5000, "transactions": 100, "customers": 90},
        "S005": {"sales": 8500, "transactions": 170, "customers": 160}
    }
    
    # Generate daily data with some randomness
    for day in range(1, 31):
        date = f"2025-05-{day:02d}"
        for store_id in store_ids:
            base = base_values[store_id]
            
            # Add some variety to the data (weekend effect)
            weekend_multiplier = 1.2 if day % 7 == 0 or day % 7 == 6 else 1.0
            
            # Add some random fluctuation
            import random
            random_factor = random.uniform(0.85, 1.15)
            
            daily_sales = {
                "date": date,
                "store_id": store_id,
                "sales": round(base["sales"] * weekend_multiplier * random_factor),
                "transactions": round(base["transactions"] * weekend_multiplier * random_factor),
                "customers": round(base["customers"] * weekend_multiplier * random_factor),
                "average_basket": round(base["sales"] / base["transactions"] * random_factor, 2),
                "items_per_transaction": round(random.uniform(2.5, 4.5), 1)
            }
            
            sales_data.append(daily_sales)
    
    return sales_data

def generate_brand_data():
    """Generate sample brand performance data"""
    brands = [
        {"brand_id": "B001", "name": "TechVision", "category": "Electronics", "sales": 450000, "growth": 12.5, "market_share": 24.3, "sentiment": 85},
        {"brand_id": "B002", "name": "EcoClean", "category": "Home Care", "sales": 325000, "growth": 8.2, "market_share": 16.7, "sentiment": 78},
        {"brand_id": "B003", "name": "NutriPlus", "category": "Food & Beverage", "sales": 560000, "growth": 15.3, "market_share": 31.2, "sentiment": 92},
        {"brand_id": "B004", "name": "FreshLiving", "category": "Personal Care", "sales": 290000, "growth": -2.1, "market_share": 14.8, "sentiment": 63},
        {"brand_id": "B005", "name": "ComfortWear", "category": "Apparel", "sales": 180000, "growth": 5.7, "market_share": 9.2, "sentiment": 75},
        {"brand_id": "B006", "name": "KidsFun", "category": "Toys", "sales": 120000, "growth": 18.9, "market_share": 6.1, "sentiment": 89},
        {"brand_id": "B007", "name": "HomeLuxe", "category": "Home Decor", "sales": 95000, "growth": 3.4, "market_share": 4.8, "sentiment": 72}
    ]
    return brands

def generate_ai_insights():
    """Generate sample AI insights data"""
    insights = [
        {
            "id": "INS001",
            "title": "Sales Performance Trend",
            "category": "sales_insights",
            "summary": "Sales have increased by 12.3% in NCR region stores compared to the previous month, driven primarily by the electronics category.",
            "content": {
                "trend": "increasing",
                "period": "month-over-month",
                "percent_change": 12.3,
                "primary_driver": "electronics category",
                "recommended_action": "Increase electronics inventory in NCR stores"
            },
            "GeneratedAt": "2025-05-19T14:30:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        },
        {
            "id": "INS002",
            "title": "Inventory Optimization Alert",
            "category": "store_recommendations",
            "summary": "Store S003 (Cebu City) is experiencing higher than average stockouts (24 items). Consider increasing safety stock levels for high-demand items.",
            "content": {
                "store_id": "S003",
                "store_name": "Cebu City Store",
                "issue": "high stockouts",
                "count": 24,
                "benchmark": 12,
                "priority": "Medium",
                "recommended_action": "Increase safety stock for key items"
            },
            "GeneratedAt": "2025-05-18T10:15:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        },
        {
            "id": "INS003",
            "title": "Brand Performance Insight",
            "category": "brand_analysis",
            "summary": "NutriPlus has shown the highest growth rate (15.3%) among all brands, with strong performance in Visayas region stores.",
            "content": {
                "brand": "NutriPlus",
                "metric": "growth rate",
                "value": 15.3,
                "context": "highest among all brands",
                "region_strength": "Visayas",
                "recommended_action": "Feature NutriPlus prominently in Visayas stores"
            },
            "GeneratedAt": "2025-05-17T16:45:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        },
        {
            "id": "INS004",
            "title": "Customer Traffic Pattern",
            "category": "store_recommendations",
            "summary": "Manila Central Store shows 35% higher customer traffic on weekends. Consider adjusting staffing and inventory levels accordingly.",
            "content": {
                "store_id": "S001",
                "store_name": "Manila Central Store",
                "pattern": "weekend traffic spike",
                "percent_change": 35,
                "priority": "High",
                "recommended_action": "Increase weekend staffing and inventory levels"
            },
            "GeneratedAt": "2025-05-16T09:20:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        },
        {
            "id": "INS005",
            "title": "Regional Performance Comparison",
            "category": "sales_insights",
            "summary": "Visayas region stores are outperforming other regions with 8.7% higher sales per square meter, despite having fewer total stores.",
            "content": {
                "region": "Visayas",
                "metric": "sales per square meter",
                "percent_difference": 8.7,
                "context": "higher than average",
                "recommended_action": "Study Visayas store layouts for potential improvements elsewhere"
            },
            "GeneratedAt": "2025-05-15T13:10:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        },
        {
            "id": "INS006",
            "title": "Category Growth Analysis",
            "category": "brand_analysis",
            "summary": "The Toys category (led by KidsFun brand) shows the highest growth rate at 18.9%, indicating a strong opportunity for expansion.",
            "content": {
                "category": "Toys",
                "leading_brand": "KidsFun",
                "growth_rate": 18.9,
                "context": "highest among all categories",
                "recommended_action": "Expand Toys category floor space in all stores"
            },
            "GeneratedAt": "2025-05-14T15:30:00Z",
            "dataSource": "Synthetic",
            "isSynthetic": True
        }
    ]
    return insights

def save_as_json_and_parquet(data, name, json_dir, parquet_dir):
    """Save data as both JSON and Parquet formats"""
    ensure_directory(json_dir)
    ensure_directory(parquet_dir)
    
    # Save as JSON
    json_path = os.path.join(json_dir, f"{name}.json")
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved JSON data to: {json_path}")
    
    # Convert to pandas DataFrame and save as Parquet
    df = pd.DataFrame(data)
    parquet_path = os.path.join(parquet_dir, f"{name}.parquet")
    df.to_parquet(parquet_path, index=False)
    print(f"Saved Parquet data to: {parquet_path}")
    
    return json_path, parquet_path

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic data for Client360 Dashboard')
    parser.add_argument('--output-dir', default='./data/synthetic', help='Base output directory')
    args = parser.parse_args()
    
    # Define directories
    base_dir = args.output_dir
    json_dir = os.path.join(base_dir, 'json')
    parquet_dir = os.path.join(base_dir, '')
    
    # Ensure base directory exists
    ensure_directory(base_dir)
    
    # Generate and save store data
    stores = generate_store_data()
    save_as_json_and_parquet(stores, 'stores', json_dir, parquet_dir)
    
    # Generate and save sales data
    sales = generate_sales_data()
    save_as_json_and_parquet(sales, 'daily_sales', json_dir, parquet_dir)
    
    # Generate and save brand data
    brands = generate_brand_data()
    save_as_json_and_parquet(brands, 'brands', json_dir, parquet_dir)
    
    # Generate and save AI insights
    insights = generate_ai_insights()
    save_as_json_and_parquet(insights, 'ai_insights', json_dir, parquet_dir)
    
    print("\nSynthetic data generation complete!")
    print(f"- JSON files directory: {json_dir}")
    print(f"- Parquet files directory: {parquet_dir}")
    print("\nUse these synthetic data files with the 'Simulated' data source toggle in the dashboard.")
    print("To convert more JSON files to Parquet format, use pandas:")
    print("  import pandas as pd")
    print("  df = pd.read_json('path/to/file.json')")
    print("  df.to_parquet('path/to/output.parquet')")

if __name__ == "__main__":
    main()