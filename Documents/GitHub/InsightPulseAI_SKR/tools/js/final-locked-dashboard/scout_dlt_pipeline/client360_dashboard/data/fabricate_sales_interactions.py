#!/usr/bin/env python3
"""
Sales Interaction Simulator for Client360 Dashboard
==================================================

Generates synthetic sales interaction data with both TBWA and non-client brands
for testing and demonstration purposes. Produces:
- SalesInteractions records
- SalesInteractionBrands mapping
- TranscriptChunks with brand mentions
- VisionDetections with product visibility

Usage:
    python fabricate_sales_interactions.py --count 1000 --output-path ./data/simulations/
"""

import argparse
import datetime
import json
import os
import random
import sys
import uuid
import pandas as pd
import numpy as np
from faker import Faker
from typing import Dict, List, Tuple, Optional

# Set up fake data generator
fake = Faker(['en_PH'])
Faker.seed(42)  # For reproducibility

# Constants
DEFAULT_OUTPUT_PATH = "./data/simulations"
DEFAULT_INTERACTION_COUNT = 100
SIMULATION_SOURCE = "Pulser-Fabricator"
GENERATOR_VERSION = "Client360-Simulator-1.0"

# TBWA client brands with higher probability of appearance
TBWA_BRANDS = [
    {"brand_id": 101, "brand_name": "Lucky Me!", "client_name": "Monde Nissin", "product_type": "Instant Noodles", "category": "Food", "is_tbwa_client": True},
    {"brand_id": 102, "brand_name": "Bear Brand", "client_name": "Nestle", "product_type": "Powdered Milk", "category": "Dairy", "is_tbwa_client": True},
    {"brand_id": 103, "brand_name": "Safeguard", "client_name": "Procter & Gamble", "product_type": "Soap", "category": "Personal Care", "is_tbwa_client": True},
    {"brand_id": 104, "brand_name": "Joy", "client_name": "Procter & Gamble", "product_type": "Dishwashing Liquid", "category": "Household", "is_tbwa_client": True},
    {"brand_id": 105, "brand_name": "Coke", "client_name": "Coca-Cola", "product_type": "Soda", "category": "Beverage", "is_tbwa_client": True},
    {"brand_id": 106, "brand_name": "Red Horse", "client_name": "San Miguel", "product_type": "Beer", "category": "Alcohol", "is_tbwa_client": True},
    {"brand_id": 107, "brand_name": "Smart C+", "client_name": "Oishi", "product_type": "Beverage", "category": "Beverage", "is_tbwa_client": True},
    {"brand_id": 108, "brand_name": "Eden Cheese", "client_name": "Mondelez", "product_type": "Cheese", "category": "Dairy", "is_tbwa_client": True},
    {"brand_id": 109, "brand_name": "Surf", "client_name": "Unilever", "product_type": "Detergent", "category": "Household", "is_tbwa_client": True},
    {"brand_id": 110, "brand_name": "Milo", "client_name": "Nestle", "product_type": "Chocolate Drink", "category": "Beverage", "is_tbwa_client": True}
]

# Non-client brands (competitors or adjacent products)
NON_CLIENT_BRANDS = [
    {"brand_id": 201, "brand_name": "Payless", "client_name": "Monde Nissin", "product_type": "Instant Noodles", "category": "Food", "is_tbwa_client": False},
    {"brand_id": 202, "brand_name": "Alaska", "client_name": "Alaska Milk Corporation", "product_type": "Evaporated Milk", "category": "Dairy", "is_tbwa_client": False},
    {"brand_id": 203, "brand_name": "Palmolive", "client_name": "Colgate-Palmolive", "product_type": "Shampoo", "category": "Personal Care", "is_tbwa_client": False},
    {"brand_id": 204, "brand_name": "Pride", "client_name": "Peerless Products", "product_type": "Detergent", "category": "Household", "is_tbwa_client": False},
    {"brand_id": 205, "brand_name": "Pepsi", "client_name": "PepsiCo", "product_type": "Soda", "category": "Beverage", "is_tbwa_client": False},
    {"brand_id": 206, "brand_name": "Fortune", "client_name": "PMFTC", "product_type": "Cigarette", "category": "Tobacco", "is_tbwa_client": False},
    {"brand_id": 207, "brand_name": "Nova", "client_name": "Jack n Jill", "product_type": "Chips", "category": "Food", "is_tbwa_client": False},
    {"brand_id": 208, "brand_name": "Cheez Whiz", "client_name": "Mondelez", "product_type": "Cheese Spread", "category": "Dairy", "is_tbwa_client": False},
    {"brand_id": 209, "brand_name": "Tide", "client_name": "Procter & Gamble", "product_type": "Detergent", "category": "Household", "is_tbwa_client": False},
    {"brand_id": 210, "brand_name": "Great Taste", "client_name": "Universal Robina Corporation", "product_type": "Coffee", "category": "Beverage", "is_tbwa_client": False}
]

# Available stores with region information
STORES = [
    {"store_id": 1001, "store_name": "SariSari Express - Tondo", "region": "National Capital Region (NCR)", "city": "Manila", "barangay": "Tondo", "is_synthetic": True},
    {"store_id": 1002, "store_name": "Mini Mart - Malate", "region": "National Capital Region (NCR)", "city": "Manila", "barangay": "Malate", "is_synthetic": True},
    {"store_id": 1003, "store_name": "Family Store - Ermita", "region": "National Capital Region (NCR)", "city": "Manila", "barangay": "Ermita", "is_synthetic": True},
    {"store_id": 1004, "store_name": "Quick Stop - Intramuros", "region": "National Capital Region (NCR)", "city": "Manila", "barangay": "Intramuros", "is_synthetic": True},
    {"store_id": 1005, "store_name": "Daily Needs - Sampaloc", "region": "National Capital Region (NCR)", "city": "Manila", "barangay": "Sampaloc", "is_synthetic": True},
    {"store_id": 1006, "store_name": "Corner Shop - Diliman", "region": "National Capital Region (NCR)", "city": "Quezon City", "barangay": "Diliman", "is_synthetic": True},
    {"store_id": 1007, "store_name": "Neighborhood Store - Cubao", "region": "National Capital Region (NCR)", "city": "Quezon City", "barangay": "Cubao", "is_synthetic": True},
    {"store_id": 1008, "store_name": "Community Mart - Fairview", "region": "National Capital Region (NCR)", "city": "Quezon City", "barangay": "Fairview", "is_synthetic": True},
    {"store_id": 1009, "store_name": "All Day Store - Poblacion", "region": "National Capital Region (NCR)", "city": "Makati", "barangay": "Poblacion", "is_synthetic": True},
    {"store_id": 1010, "store_name": "Happy Shop - Bel-Air", "region": "National Capital Region (NCR)", "city": "Makati", "barangay": "Bel-Air", "is_synthetic": True},
    {"store_id": 1011, "store_name": "Village Store - San Lorenzo", "region": "National Capital Region (NCR)", "city": "Makati", "barangay": "San Lorenzo", "is_synthetic": True},
    {"store_id": 1012, "store_name": "Pinoy Mart - Lahug", "region": "Central Visayas (Region VII)", "city": "Cebu City", "barangay": "Lahug", "is_synthetic": True},
    {"store_id": 1013, "store_name": "Island Shop - Mabolo", "region": "Central Visayas (Region VII)", "city": "Cebu City", "barangay": "Mabolo", "is_synthetic": True},
    {"store_id": 1014, "store_name": "Central Store - Guadalupe", "region": "Central Visayas (Region VII)", "city": "Cebu City", "barangay": "Guadalupe", "is_synthetic": True},
    {"store_id": 1015, "store_name": "Cebuano Shop - Apas", "region": "Central Visayas (Region VII)", "city": "Cebu City", "barangay": "Apas", "is_synthetic": True},
    {"store_id": 1016, "store_name": "Mindanao Mart - Poblacion", "region": "Davao Region (Region XI)", "city": "Davao City", "barangay": "Poblacion", "is_synthetic": True},
    {"store_id": 1017, "store_name": "Davao Store - Talomo", "region": "Davao Region (Region XI)", "city": "Davao City", "barangay": "Talomo", "is_synthetic": True},
    {"store_id": 1018, "store_name": "Southern Shop - Buhangin", "region": "Davao Region (Region XI)", "city": "Davao City", "barangay": "Buhangin", "is_synthetic": True},
    {"store_id": 1019, "store_name": "Batangas Shop - Centro", "region": "CALABARZON (Region IV-A)", "city": "Batangas City", "barangay": "Centro", "is_synthetic": True},
    {"store_id": 1020, "store_name": "Tagaytay Store - Centro", "region": "CALABARZON (Region IV-A)", "city": "Tagaytay", "barangay": "Centro", "is_synthetic": True}
]

def generate_interaction_id(synthetic: bool = True) -> str:
    """Generate a sales interaction ID with appropriate prefix."""
    prefix = "SIM" if synthetic else "REAL"
    timestamp = datetime.datetime.now().strftime("%Y%m%d")
    random_id = str(random.randint(10000, 99999))
    return f"{prefix}-{timestamp}-{random_id}"

def generate_session_id() -> str:
    """Generate a unique session ID."""
    return str(uuid.uuid4())

def generate_device_id(store_id: int) -> str:
    """Generate a device ID based on store."""
    return f"DEVICE-{store_id}-{random.randint(1, 3)}"

def generate_interaction_timestamp(
    start_date: datetime.datetime = None, 
    end_date: datetime.datetime = None
) -> datetime.datetime:
    """Generate a random timestamp for the interaction."""
    if not start_date:
        start_date = datetime.datetime.now() - datetime.timedelta(days=30)
    if not end_date:
        end_date = datetime.datetime.now()
    
    time_between_dates = end_date - start_date
    days_between = time_between_dates.days
    random_days = random.randrange(days_between)
    random_seconds = random.randrange(86400)  # seconds in a day
    
    return start_date + datetime.timedelta(days=random_days, seconds=random_seconds)

def generate_interaction_duration() -> int:
    """Generate a random duration in seconds for the interaction."""
    # Most interactions last between 30 seconds and 5 minutes
    return random.randint(30, 300)

def select_random_brands(count: int = None) -> List[Dict]:
    """Select random brands, ensuring TBWA clients have higher probability."""
    if count is None:
        # Most transactions involve 1-5 brands
        count = random.randint(1, 5)
    
    all_brands = []
    
    # 60% chance of including at least one TBWA client brand
    if random.random() < 0.6:
        all_brands.extend(random.sample(TBWA_BRANDS, k=min(count, len(TBWA_BRANDS))))
    
    # Fill the rest with random brands
    remaining_count = count - len(all_brands)
    if remaining_count > 0:
        # Pool of all brands (weighted to include more TBWA brands)
        brand_pool = TBWA_BRANDS * 2 + NON_CLIENT_BRANDS
        # Filter out brands already selected
        available_brands = [b for b in brand_pool if b not in all_brands]
        all_brands.extend(random.sample(available_brands, k=min(remaining_count, len(available_brands))))
    
    return all_brands

def generate_sales_interaction(synthetic: bool = True) -> Dict:
    """Generate a synthetic sales interaction."""
    store = random.choice(STORES)
    
    # Generate main sales interaction
    interaction = {
        "interaction_id": generate_interaction_id(synthetic),
        "store_id": store["store_id"],
        "session_id": generate_session_id(),
        "device_id": generate_device_id(store["store_id"]),
        "timestamp": generate_interaction_timestamp(),
        "duration_sec": generate_interaction_duration(),
        "is_synthetic": 1 if synthetic else 0,
        "source_system": SIMULATION_SOURCE,
        "fabrication_method": "fabricate_sales_interactions.py",
        "generated_by": GENERATOR_VERSION,
        "generated_date": datetime.datetime.now().isoformat(),
        "store_region": store["region"],
        "store_city": store["city"],
        "store_barangay": store["barangay"]
    }
    
    # Compute additional metrics
    interaction["timestamp_iso"] = interaction["timestamp"].isoformat()
    interaction["product_count"] = random.randint(1, 10)
    interaction["basket_value"] = round(random.uniform(20, 500), 2)
    interaction["transaction_completed"] = 1 if random.random() < 0.8 else 0
    interaction["dwell_time_sec"] = random.randint(15, 300)
    
    # Customer expressions (sentiment)
    sentiments = ["neutral", "positive", "negative"]
    weights = [0.6, 0.3, 0.1]  # Most customers are neutral
    interaction["customer_expressions"] = random.choices(sentiments, weights=weights)[0]
    
    # Interaction type
    interaction_types = ["purchase", "inquiry", "browse"]
    type_weights = [0.7, 0.2, 0.1]
    interaction["interaction_type"] = random.choices(interaction_types, weights=type_weights)[0]
    
    # Store zone
    zones = ["checkout", "shelves", "entrance"]
    interaction["zone_id"] = random.choice(zones)
    
    return interaction

def generate_brand_interactions(interaction: Dict, brands: List[Dict]) -> List[Dict]:
    """Generate brand interaction records for a sales interaction."""
    brand_interactions = []
    
    for i, brand in enumerate(brands):
        # Calculate metrics for each brand in the interaction
        brand_interaction = {
            "interaction_id": interaction["interaction_id"],
            "brand_id": brand["brand_id"],
            "brand_name": brand["brand_name"],
            "product_type": brand["product_type"],
            "category": brand["category"],
            "client_name": brand["client_name"],
            "is_tbwa_client": 1 if brand["is_tbwa_client"] else 0,
            "quantity": random.randint(1, 3),
            "unit_price": round(random.uniform(5, 150), 2),
            "is_primary_product": 1 if i == 0 else 0  # First brand is primary
        }
        
        # Calculate total price
        brand_interaction["total_price"] = round(brand_interaction["quantity"] * brand_interaction["unit_price"], 2)
        
        # Placement quality (how visible/prominent the product was)
        brand_interaction["placement_quality"] = random.choices(
            ["poor", "average", "excellent"],
            weights=[0.1, 0.6, 0.3]
        )[0]
        
        # Customer interest level
        brand_interaction["interest_level"] = random.choices(
            ["low", "medium", "high"],
            weights=[0.2, 0.5, 0.3]
        )[0]
        
        brand_interactions.append(brand_interaction)
    
    return brand_interactions

def generate_transcript_chunks(interaction: Dict, brands: List[Dict]) -> List[Dict]:
    """Generate synthetic transcript chunks for a sales interaction."""
    transcript_chunks = []
    
    # Templates for transcript generation
    templates = [
        "I need {quantity} {brand_name}.",
        "Do you have {brand_name}? I need {quantity}.",
        "How much is {brand_name}?",
        "I'll take {quantity} {brand_name}.",
        "Is {brand_name} available?",
        "Can I get {brand_name}, please?",
        "I'm looking for {brand_name}.",
        "Give me {quantity} {brand_name}.",
        "{brand_name} - how much?",
        "I want to buy {brand_name}."
    ]
    
    # Generate 1-3 transcript chunks per interaction
    num_chunks = random.randint(1, 3)
    
    for i in range(num_chunks):
        # Select brands to mention in this chunk (may be subset of all brands in interaction)
        mentioned_brands = random.sample(brands, k=min(len(brands), random.randint(1, 2)))
        
        # Build transcript text
        transcript_text = ""
        for brand in mentioned_brands:
            template = random.choice(templates)
            brand_text = template.format(
                brand_name=brand["brand_name"],
                quantity=random.randint(1, 3)
            )
            transcript_text += brand_text + " "
        
        # Add some filler text occasionally
        if random.random() < 0.3:
            fillers = [
                "Thank you.",
                "How much is that in total?",
                "Do you have change?",
                "I'll pay with cash.",
                "That's all for today.",
                "Is that fresh?",
                "When did you get new stock?"
            ]
            transcript_text += random.choice(fillers)
        
        # Create transcript chunk
        chunk = {
            "chunk_id": f"{interaction['interaction_id']}-T{i+1}",
            "interaction_id": interaction["interaction_id"],
            "sequence": i + 1,
            "chunk_text": transcript_text.strip(),
            "start_time": interaction["timestamp"] + datetime.timedelta(seconds=i*20),
            "end_time": interaction["timestamp"] + datetime.timedelta(seconds=(i+1)*20),
            "speaker": "customer" if i % 2 == 0 else "store_staff",
            "confidence": round(random.uniform(0.8, 0.99), 2),
            "is_synthetic": 1,
            "generated_by": GENERATOR_VERSION
        }
        
        transcript_chunks.append(chunk)
    
    return transcript_chunks

def generate_vision_detections(interaction: Dict, brands: List[Dict]) -> List[Dict]:
    """Generate synthetic vision detection records for a sales interaction."""
    vision_detections = []
    
    # Each brand might have 0-2 vision detections
    for brand in brands:
        # 70% chance of being detected by vision
        if random.random() < 0.7:
            # Number of detections (instances) for this brand
            num_detections = random.randint(1, 2)
            
            for i in range(num_detections):
                # Create vision detection record
                detection = {
                    "detection_id": f"{interaction['interaction_id']}-V{len(vision_detections)+1}",
                    "interaction_id": interaction["interaction_id"],
                    "timestamp": interaction["timestamp"] + datetime.timedelta(seconds=random.randint(0, interaction["duration_sec"])),
                    "label": brand["brand_name"],
                    "brand_id": brand["brand_id"],
                    "confidence": round(random.uniform(0.7, 0.98), 2),
                    "bounding_box": {
                        "x": round(random.uniform(0.1, 0.9), 2),
                        "y": round(random.uniform(0.1, 0.9), 2),
                        "width": round(random.uniform(0.1, 0.3), 2),
                        "height": round(random.uniform(0.1, 0.3), 2)
                    },
                    "product_type": brand["product_type"],
                    "is_synthetic": 1,
                    "generated_by": GENERATOR_VERSION
                }
                
                # Add detection to list
                vision_detections.append(detection)
    
    return vision_detections

def generate_dataset(count: int, synthetic: bool = True) -> Tuple[List[Dict], List[Dict], List[Dict], List[Dict]]:
    """Generate a complete synthetic dataset."""
    interactions = []
    all_brand_interactions = []
    all_transcript_chunks = []
    all_vision_detections = []
    
    for _ in range(count):
        # Generate main interaction
        interaction = generate_sales_interaction(synthetic)
        
        # Select brands for this interaction
        brands = select_random_brands()
        
        # Generate related data
        brand_interactions = generate_brand_interactions(interaction, brands)
        transcript_chunks = generate_transcript_chunks(interaction, brands)
        vision_detections = generate_vision_detections(interaction, brands)
        
        # Add to master lists
        interactions.append(interaction)
        all_brand_interactions.extend(brand_interactions)
        all_transcript_chunks.extend(transcript_chunks)
        all_vision_detections.extend(vision_detections)
    
    return interactions, all_brand_interactions, all_transcript_chunks, all_vision_detections

def save_dataset(
    interactions: List[Dict],
    brand_interactions: List[Dict],
    transcript_chunks: List[Dict],
    vision_detections: List[Dict],
    output_path: str,
    format: str = "parquet"
) -> None:
    """Save the generated datasets to files."""
    # Create output directory if it doesn't exist
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(output_path, f"simulation_{timestamp}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Convert to pandas DataFrames
    df_interactions = pd.DataFrame(interactions)
    df_brand_interactions = pd.DataFrame(brand_interactions)
    df_transcript_chunks = pd.DataFrame(transcript_chunks)
    df_vision_detections = pd.DataFrame(vision_detections)
    
    # Handle timestamp columns for Parquet
    if format == "parquet":
        for df in [df_interactions, df_transcript_chunks, df_vision_detections]:
            for col in df.columns:
                if isinstance(df[col].iloc[0], datetime.datetime):
                    df[col] = df[col].astype(str)
    
    # Save files in requested format
    if format == "parquet":
        df_interactions.to_parquet(os.path.join(output_dir, "sales_interactions.parquet"), index=False)
        df_brand_interactions.to_parquet(os.path.join(output_dir, "sales_interaction_brands.parquet"), index=False)
        df_transcript_chunks.to_parquet(os.path.join(output_dir, "transcript_chunks.parquet"), index=False)
        df_vision_detections.to_parquet(os.path.join(output_dir, "vision_detections.parquet"), index=False)
    else:  # json format
        with open(os.path.join(output_dir, "sales_interactions.json"), 'w') as f:
            json.dump(interactions, f, default=str, indent=2)
        
        with open(os.path.join(output_dir, "sales_interaction_brands.json"), 'w') as f:
            json.dump(brand_interactions, f, default=str, indent=2)
            
        with open(os.path.join(output_dir, "transcript_chunks.json"), 'w') as f:
            json.dump(transcript_chunks, f, default=str, indent=2)
            
        with open(os.path.join(output_dir, "vision_detections.json"), 'w') as f:
            json.dump(vision_detections, f, default=str, indent=2)
    
    # Save summary file
    summary = {
        "timestamp": timestamp,
        "generated_by": GENERATOR_VERSION,
        "synthetic": True,
        "counts": {
            "interactions": len(interactions),
            "brand_interactions": len(brand_interactions),
            "transcript_chunks": len(transcript_chunks),
            "vision_detections": len(vision_detections)
        },
        "brand_distribution": {
            "tbwa_client_brands": sum(1 for b in brand_interactions if b["is_tbwa_client"] == 1),
            "non_client_brands": sum(1 for b in brand_interactions if b["is_tbwa_client"] == 0)
        },
        "store_distribution": {
            store["store_name"]: sum(1 for i in interactions if i["store_id"] == store["store_id"])
            for store in STORES
        }
    }
    
    with open(os.path.join(output_dir, "simulation_summary.json"), 'w') as f:
        json.dump(summary, f, default=str, indent=2)
    
    print(f"Dataset generated successfully in {output_dir}")
    print(f"Generated {len(interactions)} interactions with {len(brand_interactions)} brand interactions")
    print(f"TBWA client brand mentions: {summary['brand_distribution']['tbwa_client_brands']}")
    print(f"Non-client brand mentions: {summary['brand_distribution']['non_client_brands']}")

def main():
    """Main function to parse arguments and generate data."""
    parser = argparse.ArgumentParser(description="Generate synthetic sales interaction data for Client360 Dashboard")
    parser.add_argument("--count", type=int, default=DEFAULT_INTERACTION_COUNT,
                        help=f"Number of interactions to generate (default: {DEFAULT_INTERACTION_COUNT})")
    parser.add_argument("--output-path", type=str, default=DEFAULT_OUTPUT_PATH,
                        help=f"Output directory path (default: {DEFAULT_OUTPUT_PATH})")
    parser.add_argument("--format", type=str, choices=["json", "parquet"], default="parquet",
                        help="Output file format (default: parquet)")
    parser.add_argument("--real", action="store_true", 
                        help="Generate as real data instead of synthetic (not recommended)")
    
    args = parser.parse_args()
    
    # Ensure reasonable count
    if args.count <= 0:
        print("Count must be a positive integer")
        sys.exit(1)
    
    # Generate data
    print(f"Generating {args.count} synthetic interactions...")
    interactions, brand_interactions, transcript_chunks, vision_detections = generate_dataset(
        count=args.count,
        synthetic=not args.real
    )
    
    # Save data
    save_dataset(
        interactions=interactions,
        brand_interactions=brand_interactions,
        transcript_chunks=transcript_chunks,
        vision_detections=vision_detections,
        output_path=args.output_path,
        format=args.format
    )

if __name__ == "__main__":
    main()