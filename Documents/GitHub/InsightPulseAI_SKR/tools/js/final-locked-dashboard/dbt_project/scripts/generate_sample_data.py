#!/usr/bin/env python
"""
Generate sample data JSON files for the Scout Edge dashboard
This script creates synthetic data that mimics the structure of the dbt model exports
"""

import os
import json
import random
from datetime import datetime, timedelta
import argparse

# Configuration
DEFAULT_OUTPUT_DIR = "../assets/data/exports"
REGIONS = ["North Luzon", "Central Luzon", "South Luzon", "Visayas", "Mindanao", "Metro Manila"]
CITIES = {
    "North Luzon": ["Baguio", "Vigan", "Laoag"],
    "Central Luzon": ["Angeles", "San Fernando", "Tarlac"],
    "South Luzon": ["Batangas", "Lucena", "Legazpi"],
    "Visayas": ["Cebu", "Iloilo", "Bacolod"],
    "Mindanao": ["Davao", "Cagayan de Oro", "Zamboanga"],
    "Metro Manila": ["Makati", "Quezon City", "Manila"]
}
BARANGAYS = {city: [f"{city} Barangay {i}" for i in range(1, 4)] for cities in CITIES.values() for city in cities}
BRANDS = [
    "Globe", "Smart", "PLDT", "Cherry Mobile", "Vivo", "Oppo", "Huawei", "Apple", "Samsung", 
    "Realme", "Xiaomi", "Nokia", "Infinix", "Tecno", "MyPhone", "Acer", "Asus", "Lenovo"
]
STORE_TYPES = ["Flagship", "Mall", "Kiosk", "Express", "Partner"]

def parse_args():
    parser = argparse.ArgumentParser(description='Generate sample data for Scout Edge dashboard')
    parser.add_argument('--output-dir', default=DEFAULT_OUTPUT_DIR, help='Output directory for JSON files')
    parser.add_argument('--brand-count', type=int, default=len(BRANDS), help='Number of brands to generate')
    parser.add_argument('--store-count', type=int, default=50, help='Number of stores to generate')
    parser.add_argument('--transaction-count', type=int, default=10000, help='Number of transactions to generate')
    return parser.parse_args()

def generate_sales_interaction_brands(args):
    """Generate sample data for sales_interaction_brands model"""
    print("Generating sales_interaction_brands data...")
    
    transactions = []
    transaction_id = 10000
    
    # Create store IDs and map them to locations
    stores = {}
    for i in range(1, args.store_count + 1):
        store_id = f"ST{i:03d}"
        region = random.choice(REGIONS)
        city = random.choice(CITIES[region])
        barangay = random.choice(BARANGAYS[city])
        stores[store_id] = {
            "region": region,
            "city": city,
            "barangay": barangay,
            "region_id": f"R{REGIONS.index(region) + 1:02d}",
            "store_type": random.choice(STORE_TYPES)
        }
    
    # Create brand interactions
    for _ in range(args.transaction_count):
        transaction_id += 1
        customer_id = f"C{random.randint(1, 5000):04d}"
        store_id = random.choice(list(stores.keys()))
        store_info = stores[store_id]
        
        transaction_date = (datetime.now() - timedelta(days=random.randint(0, 90))).strftime('%Y-%m-%d')
        transaction_amount = round(random.uniform(100, 5000), 2)
        
        # Decide how many brands in this transaction (1-3)
        brand_count = random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0]
        
        # Pick random brands without duplicates
        selected_brands = random.sample(BRANDS[:args.brand_count], brand_count)
        
        # Determine the "top brand" in the transaction
        top_brand_idx = 0  # First brand is the top by default
        
        for brand_idx, brand in enumerate(selected_brands):
            brand_id = BRANDS.index(brand) + 1
            mention_count = random.randint(1, 5)
            attributed_amount = round((transaction_amount / brand_count) * (1 + random.uniform(-0.2, 0.2)), 2)
            
            is_top_brand = (brand_idx == top_brand_idx)
            
            transaction = {
                "InteractionBrandID": f"{transaction_id}_{brand_id}",
                "TransactionID": transaction_id,
                "BrandID": brand_id,
                "BrandName": brand,
                "MentionCount": mention_count,
                "StoreID": store_id,
                "RegionID": store_info["region_id"],
                "Region": store_info["region"],
                "City": store_info["city"],
                "Barangay": store_info["barangay"],
                "TransactionDate": transaction_date,
                "CustomerID": customer_id,
                "TransactionAmount": transaction_amount,
                "AttributedAmount": attributed_amount,
                "IsTopBrand": is_top_brand,
                "MentionSource": "product",
                "CreatedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
                "UpdatedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            transactions.append(transaction)
    
    # Create GeoJSON format for choropleth map
    features = []
    for region in REGIONS:
        for city in CITIES[region]:
            for barangay in BARANGAYS[city]:
                # Collect all transactions for this location
                location_transactions = [t for t in transactions 
                                         if t["Region"] == region and t["City"] == city and t["Barangay"] == barangay]
                
                if not location_transactions:
                    continue
                
                # Calculate the top brand
                brand_counts = {}
                for t in location_transactions:
                    brand = t["BrandName"]
                    brand_counts[brand] = brand_counts.get(brand, 0) + t["MentionCount"]
                
                sorted_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)
                top_brand = sorted_brands[0][0] if sorted_brands else ""
                top_brand_count = sorted_brands[0][1] if sorted_brands else 0
                total_mentions = sum(brand_counts.values())
                top_brand_percentage = int((top_brand_count / total_mentions) * 100) if total_mentions > 0 else 0
                
                # Create a feature for this location
                feature = {
                    "type": "Feature",
                    "properties": {
                        "name": barangay,
                        "region": region,
                        "city": city,
                        "barangay": barangay,
                        "value": total_mentions,
                        "rank": 0,  # Will be calculated later
                        "storeCount": len(set(t["StoreID"] for t in location_transactions)),
                        "topBrand": top_brand,
                        "brandPercentage": top_brand_percentage,
                        "transactionCount": len(set(t["TransactionID"] for t in location_transactions))
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": []  # This would be filled with actual coordinates in real implementation
                    }
                }
                features.append(feature)
    
    # Rank the features by value
    features.sort(key=lambda x: x["properties"]["value"], reverse=True)
    for i, feature in enumerate(features):
        feature["properties"]["rank"] = i + 1
    
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "generated": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "source": "sample_data_script",
            "mode": "geo_brand_mentions",
            "timeRange": "last_90_days"
        },
        "features": features
    }
    
    return geojson

def generate_top_brands(transactions_data):
    """Generate sample data for top_brands model based on the generated transactions"""
    print("Generating top_brands data...")
    
    # Extract transactions from GeoJSON if necessary
    if isinstance(transactions_data, dict) and "features" in transactions_data:
        # Extract relevant data from the features
        features = transactions_data["features"]
        
        # Initialize results
        results = []
        
        # For each location in the GeoJSON, create top brand entries
        for idx, feature in enumerate(features):
            props = feature["properties"]
            region = props["region"]
            city = props["city"]
            barangay = props["barangay"]
            
            # Create entries for multiple brands in this location
            num_brands = min(5, len(BRANDS))  # Up to 5 brands per location
            
            for brand_rank in range(1, num_brands + 1):
                brand_id = random.randint(1, len(BRANDS))
                brand_name = BRANDS[brand_id - 1]
                
                # The top brand should match what's in the GeoJSON
                if brand_rank == 1:
                    brand_name = props["topBrand"]
                    brand_id = BRANDS.index(brand_name) + 1 if brand_name in BRANDS else brand_id
                
                # Calculate metrics based on rank
                transaction_count = max(5, int(props["transactionCount"] * (1 / brand_rank) * random.uniform(0.7, 1.0)))
                mention_count = max(10, int(props["value"] * (1 / brand_rank) * random.uniform(0.7, 1.0)))
                total_sales = round(transaction_count * random.uniform(200, 500), 2)
                unique_customers = max(3, int(transaction_count * random.uniform(0.5, 0.9)))
                top_brand_transactions = int(transaction_count * random.uniform(0.1, 0.3))
                top_brand_percentage = round((top_brand_transactions / transaction_count) * 100, 1)
                
                # Regional and overall ranks
                regional_brand_rank = random.randint(1, 10) if brand_rank > 1 else 1
                overall_brand_rank = random.randint(1, 20) if brand_rank > 1 else random.randint(1, 5)
                
                # Create the top brand entry
                entry = {
                    "TopBrandID": f"{region}_{city}_{barangay}_{brand_id}",
                    "BrandID": brand_id,
                    "BrandName": brand_name,
                    "Region": region,
                    "City": city,
                    "Barangay": barangay,
                    "TransactionCount": transaction_count,
                    "MentionCount": mention_count,
                    "TotalSales": total_sales,
                    "UniqueCustomers": unique_customers,
                    "TopBrandTransactions": top_brand_transactions,
                    "TopBrandPercentage": top_brand_percentage,
                    "BrandRank": brand_rank,
                    "RegionalBrandRank": regional_brand_rank,
                    "OverallBrandRank": overall_brand_rank,
                    "IsTopBrandInLocation": brand_rank == 1,
                    "IsTopBrandInRegion": regional_brand_rank == 1,
                    "IsOverallTopTen": overall_brand_rank <= 10,
                    "GeneratedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
                }
                
                results.append(entry)
        
        return {
            "metadata": {
                "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
                "model": "top_brands",
                "record_count": len(results)
            },
            "data": results
        }
    
    return {
        "metadata": {
            "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "model": "top_brands",
            "record_count": 0
        },
        "data": []
    }

def generate_top_combos(transactions_data):
    """Generate sample data for top_combos model"""
    print("Generating top_combos data...")
    
    # Extract locations from GeoJSON if necessary
    if isinstance(transactions_data, dict) and "features" in transactions_data:
        features = transactions_data["features"]
        
        # Initialize results
        results = []
        
        # For each location in the GeoJSON, create combo entries
        for feature in features:
            props = feature["properties"]
            region = props["region"]
            city = props["city"]
            barangay = props["barangay"]
            
            # Create entries for multiple combos in this location
            num_combos = min(5, random.randint(2, 7))  # Up to 5 combos per location
            
            for combo_rank in range(1, num_combos + 1):
                # Generate a random combo of 2-3 brands
                combo_size = random.randint(2, 3)
                combo_brands = random.sample(BRANDS, combo_size)
                combo_name = " + ".join(sorted(combo_brands))
                
                # Calculate metrics based on rank
                transaction_count = max(3, int((props["transactionCount"] * 0.3) * (1 / combo_rank) * random.uniform(0.5, 0.9)))
                total_sales = round(transaction_count * random.uniform(300, 800), 2)
                avg_transaction_value = round(total_sales / transaction_count, 2)
                store_count = random.randint(1, min(5, props["storeCount"]))
                store_ids = [f"ST{random.randint(1, 50):03d}" for _ in range(store_count)]
                
                # Regional and overall ranks
                regional_combo_rank = random.randint(1, 10) if combo_rank > 1 else 1
                overall_combo_rank = random.randint(1, 20) if combo_rank > 1 else random.randint(1, 5)
                
                # Create the combo entry
                entry = {
                    "ComboID": f"{region}_{city}_{barangay}_{combo_name.replace(' + ', '_')}",
                    "ComboName": combo_name,
                    "Region": region,
                    "City": city,
                    "Barangay": barangay,
                    "TransactionCount": transaction_count,
                    "TotalSales": total_sales,
                    "AvgTransactionValue": avg_transaction_value,
                    "StoreCount": store_count,
                    "StoreIDList": ",".join(store_ids),
                    "ComboRank": combo_rank,
                    "RegionalComboRank": regional_combo_rank,
                    "OverallComboRank": overall_combo_rank,
                    "IsTopComboInLocation": combo_rank == 1,
                    "IsTopComboInRegion": regional_combo_rank == 1,
                    "IsOverallTopTen": overall_combo_rank <= 10,
                    "GeneratedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
                }
                
                results.append(entry)
        
        return {
            "metadata": {
                "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
                "model": "top_combos",
                "record_count": len(results)
            },
            "data": results
        }
    
    return {
        "metadata": {
            "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "model": "top_combos",
            "record_count": 0
        },
        "data": []
    }

def generate_store_metrics(transactions_data, args):
    """Generate sample data for store_metrics model"""
    print("Generating store_metrics data...")
    
    results = []
    
    # Create a set of stores
    for i in range(1, args.store_count + 1):
        store_id = f"ST{i:03d}"
        store_name = f"Store {i}"
        store_type = random.choice(STORE_TYPES)
        
        # Assign to a region, city, and barangay
        region = random.choice(REGIONS)
        city = random.choice(CITIES[region])
        barangay = random.choice(BARANGAYS[city])
        
        # Generate random coordinates
        latitude = round(random.uniform(13.0, 14.5), 6)
        longitude = round(random.uniform(120.5, 121.5), 6)
        
        # Generate metrics for the last 90 days
        total_transactions_90d = random.randint(500, 5000)
        total_customers_90d = random.randint(total_transactions_90d // 2, total_transactions_90d)
        total_sales_90d = round(total_transactions_90d * random.uniform(200, 600), 2)
        total_items_90d = total_transactions_90d * random.randint(1, 5)
        avg_transaction_value_90d = round(total_sales_90d / total_transactions_90d, 2)
        
        # Last 30 days
        total_sales_30d = round(total_sales_90d * random.uniform(0.3, 0.4), 2)
        total_transactions_30d = int(total_transactions_90d * random.uniform(0.3, 0.4))
        
        # Last 7 days
        total_sales_7d = round(total_sales_90d * random.uniform(0.05, 0.1), 2)
        total_transactions_7d = int(total_transactions_90d * random.uniform(0.05, 0.1))
        
        # Brand metrics
        unique_brands = random.randint(5, 15)
        top_brand = random.choice(BRANDS)
        top_brand_mentions = random.randint(50, 500)
        top_brand_percentage = round(random.uniform(20, 60), 1)
        second_brand = random.choice([b for b in BRANDS if b != top_brand])
        second_brand_mentions = int(top_brand_mentions * random.uniform(0.4, 0.8))
        
        # Combo metrics
        top_combo = f"{top_brand} + {second_brand}"
        top_combo_transactions = random.randint(20, 100)
        unique_combo_count = random.randint(5, 20)
        
        # Growth metrics
        sales_growth_30d = round(random.uniform(-0.2, 0.4), 3)
        transaction_growth_30d = round(random.uniform(-0.15, 0.35), 3)
        
        # Store ranking
        overall_sales_rank = random.randint(1, args.store_count)
        regional_sales_rank = random.randint(1, 10)
        
        # Create the store metrics entry
        entry = {
            "StoreID": store_id,
            "StoreName": store_name,
            "StoreType": store_type,
            "Region": region,
            "City": city,
            "Barangay": barangay,
            "Latitude": latitude,
            "Longitude": longitude,
            "TotalTransactions90d": total_transactions_90d,
            "TotalCustomers90d": total_customers_90d,
            "TotalSales90d": total_sales_90d,
            "TotalItems90d": total_items_90d,
            "AvgTransactionValue90d": avg_transaction_value_90d,
            "TotalSales30d": total_sales_30d,
            "TotalTransactions30d": total_transactions_30d,
            "TotalSales7d": total_sales_7d,
            "TotalTransactions7d": total_transactions_7d,
            "UniqueBrands": unique_brands,
            "TopBrand": top_brand,
            "TopBrandMentions": top_brand_mentions,
            "TopBrandPercentage": top_brand_percentage,
            "SecondBrand": second_brand,
            "SecondBrandMentions": second_brand_mentions,
            "TopCombo": top_combo,
            "TopComboTransactions": top_combo_transactions,
            "UniqueComboCount": unique_combo_count,
            "SalesGrowth30d": sales_growth_30d,
            "TransactionGrowth30d": transaction_growth_30d,
            "OverallSalesRank": overall_sales_rank,
            "RegionalSalesRank": regional_sales_rank,
            "GeneratedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        }
        
        results.append(entry)
    
    return {
        "metadata": {
            "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
            "model": "store_metrics",
            "record_count": len(results)
        },
        "data": results
    }

def save_data_to_json(data, filename, output_dir):
    """Save data to a JSON file"""
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved {filename} to {filepath}")
    return filepath

def create_index_file(files, output_dir):
    """Create an index file with metadata about all generated files"""
    index = {
        "exports": [os.path.basename(f) for f in files],
        "generated_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        "profile": "sample_data",
        "target": "dev"
    }
    
    filepath = os.path.join(output_dir, "index.json")
    with open(filepath, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"Created index file at {filepath}")
    return filepath

def main():
    args = parse_args()
    print(f"Generating sample data with {args.brand_count} brands, {args.store_count} stores, and {args.transaction_count} transactions")
    
    # Generate the data
    sales_data = generate_sales_interaction_brands(args)
    top_brands_data = generate_top_brands(sales_data)
    top_combos_data = generate_top_combos(sales_data)
    store_metrics_data = generate_store_metrics(sales_data, args)
    
    # Save the data to JSON files
    files = [
        save_data_to_json(sales_data, "sales_interaction_brands.json", args.output_dir),
        save_data_to_json(top_brands_data, "top_brands.json", args.output_dir),
        save_data_to_json(top_combos_data, "top_combos.json", args.output_dir),
        save_data_to_json(store_metrics_data, "store_metrics.json", args.output_dir)
    ]
    
    # Create an index file
    create_index_file(files, args.output_dir)
    
    print(f"Successfully generated sample data in {args.output_dir}")

if __name__ == "__main__":
    main()