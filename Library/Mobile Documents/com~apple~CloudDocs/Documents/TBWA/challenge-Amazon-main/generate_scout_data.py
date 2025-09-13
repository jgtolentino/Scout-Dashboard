#!/usr/bin/env python3
"""
Scout Retail Synthetic Data Generator

This script generates comprehensive synthetic data for the Scout retail dashboard,
replacing hard-coded fallbacks with realistic Philippine retail patterns.

Generated Files:
- transactions.csv - Main transaction records
- customers.csv - Customer demographics  
- products.csv - Product catalog
- stores.csv - Store locations
- brands.csv - Brand information
- categories.csv - Product categories
- recommendations.csv - AI recommendations
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os
from faker import Faker
import matplotlib.pyplot as plt

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

# Initialize Faker for Philippine locale
try:
    fake = Faker(['en_PH', 'en_US'])
except:
    fake = Faker(['en_US'])  # Fallback if en_PH not available

# Configuration Parameters
CONFIG = {
    'num_transactions': 20000,
    'num_customers': 2000,
    'num_products': 500,
    'num_stores': 100,
    'num_brands': 50,
    'date_start': datetime(2024, 6, 1),
    'date_end': datetime(2024, 8, 31),
    'output_dir': 'data/raw'
}

# Create output directory
os.makedirs(CONFIG['output_dir'], exist_ok=True)

print(f"Configuration:")
for key, value in CONFIG.items():
    print(f"  {key}: {value}")

# Philippine regions (17 administrative regions)
PHILIPPINE_REGIONS = [
    'National Capital Region', 'Ilocos Region', 'Cagayan Valley', 'Central Luzon',
    'CALABARZON', 'MIMAROPA', 'Bicol Region', 'Western Visayas', 'Central Visayas',
    'Eastern Visayas', 'Zamboanga Peninsula', 'Northern Mindanao', 'Davao Region',
    'SOCCSKSARGEN', 'Caraga', 'Cordillera Administrative Region', 'BARMM'
]

# Scout retail product categories
PRODUCT_CATEGORIES = [
    'Food & Beverages', 'Personal Care', 'Household Items', 
    'Snacks & Confectionery', 'Health & Wellness', 'Baby Care',
    'Beverages', 'Canned & Jarred Goods', 'Dairy Products',
    'Frozen Foods', 'School & Office Supplies'
]

# Popular Philippine brands
FILIPINO_BRANDS = [
    'Lucky Me!', 'Rebisco', 'Ricoa', 'Boy Bawang', 'Oishi', 'Jack \'n Jill',
    'Monde Nissin', 'Universal Robina Corporation', 'San Miguel', 'Magnolia',
    'Century Tuna', 'Argentina', 'CDO', 'Spam', 'Ligo',
    'Palmolive', 'Safeguard', 'Joy', 'Tide', 'Ariel',
    'Colgate', 'Close-Up', 'Hapee', 'Sensodyne', 'Oral-B'
]

# International brands available in PH
INTERNATIONAL_BRANDS = [
    'Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'Procter & Gamble',
    'Johnson & Johnson', 'Head & Shoulders', 'Pantene', 'Dove',
    'Lay\'s', 'Pringles', 'KitKat', 'Oreo', 'Ritz',
    'Maggi', 'Knorr', 'Lipton', 'Milo', 'Ovaltine',
    'Pampers', 'Huggies', 'Johnson\'s Baby', 'Enfamil', 'Similac'
]

ALL_BRANDS = FILIPINO_BRANDS + INTERNATIONAL_BRANDS

# Demographics distributions
AGE_BRACKETS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
EDUCATION_LEVELS = ['Elementary', 'High School', 'Vocational', "Bachelor's", "Master's", 'Doctoral']
INCOME_BRACKETS = ['Under ₱25K', '₱25K-₱49K', '₱50K-₱74K', '₱75K-₱99K', '₱100K-₱149K', 'Over ₱150K']

print(f"Philippine Regions: {len(PHILIPPINE_REGIONS)}")
print(f"Product Categories: {len(PRODUCT_CATEGORIES)}")
print(f"Total Brands: {len(ALL_BRANDS)}")

def generate_categories():
    """Generate product category hierarchy"""
    categories = []
    
    for i, category in enumerate(PRODUCT_CATEGORIES, 1):
        categories.append({
            'category_id': f'CAT{i:03d}',
            'category_name': category,
            'parent_category': 'Retail' if category in PRODUCT_CATEGORIES[:6] else 'Consumer Goods',
            'is_active': True
        })
    
    return pd.DataFrame(categories)

def generate_brands():
    """Generate brand information"""
    brands = []
    
    for i, brand in enumerate(ALL_BRANDS[:CONFIG['num_brands']], 1):
        is_filipino = brand in FILIPINO_BRANDS
        
        brands.append({
            'brand_id': f'BRD{i:03d}',
            'brand_name': brand,
            'brand_type': 'Local' if is_filipino else 'International',
            'established_year': np.random.randint(1950, 2020),
            'is_active': True
        })
    
    return pd.DataFrame(brands)

def generate_stores():
    """Generate Scout store locations"""
    stores = []
    
    # Distribution weights (NCR has more stores)
    region_weights = [0.25] + [0.75/16] * 16  # 25% in NCR, rest distributed
    
    for i in range(CONFIG['num_stores']):
        region = np.random.choice(PHILIPPINE_REGIONS, p=region_weights)
        
        stores.append({
            'store_id': f'STR{i+1:03d}',
            'store_name': f'Scout Store {fake.city()} Branch',
            'region': region,
            'city': fake.city(),
            'store_type': np.random.choice(['Flagship', 'Regular', 'Express'], p=[0.1, 0.7, 0.2]),
            'opening_date': fake.date_between(start_date='-5y', end_date='-6m'),
            'is_active': True
        })
    
    return pd.DataFrame(stores)

def generate_products():
    """Generate product catalog"""
    products = []
    
    # Product templates by category
    product_templates = {
        'Food & Beverages': ['Rice', 'Noodles', 'Cooking Oil', 'Soy Sauce', 'Vinegar'],
        'Personal Care': ['Shampoo', 'Soap', 'Toothpaste', 'Deodorant', 'Lotion'],
        'Household Items': ['Detergent', 'Dishwashing Liquid', 'Fabric Conditioner', 'Bleach'],
        'Snacks & Confectionery': ['Chips', 'Crackers', 'Chocolate', 'Candy', 'Biscuits'],
        'Health & Wellness': ['Vitamins', 'Pain Reliever', 'Cough Syrup', 'Band-aids'],
        'Baby Care': ['Baby Powder', 'Diapers', 'Baby Food', 'Baby Shampoo'],
        'Beverages': ['Soft Drinks', 'Juice', 'Water', 'Coffee', 'Tea'],
        'Canned & Jarred Goods': ['Canned Fish', 'Canned Meat', 'Jam', 'Pickles'],
        'Dairy Products': ['Milk', 'Cheese', 'Yogurt', 'Butter'],
        'Frozen Foods': ['Ice Cream', 'Frozen Vegetables', 'Frozen Meat'],
        'School & Office Supplies': ['Notebook', 'Pen', 'Pencil', 'Eraser']
    }
    
    # Generate categories and brands first
    df_categories = generate_categories()
    df_brands = generate_brands()
    
    product_id = 1
    for category in PRODUCT_CATEGORIES:
        category_id = df_categories[df_categories['category_name'] == category]['category_id'].iloc[0]
        templates = product_templates.get(category, ['Generic Product'])
        
        # Generate products for this category
        products_per_category = CONFIG['num_products'] // len(PRODUCT_CATEGORIES)
        
        for _ in range(products_per_category):
            brand = df_brands.sample(1).iloc[0]
            template = np.random.choice(templates)
            
            # Price ranges by category (in PHP)
            price_ranges = {
                'Food & Beverages': (15, 150),
                'Personal Care': (25, 300),
                'Household Items': (35, 250),
                'Snacks & Confectionery': (10, 80),
                'Health & Wellness': (50, 500),
                'Baby Care': (100, 800),
                'Beverages': (12, 60),
                'Canned & Jarred Goods': (25, 120),
                'Dairy Products': (30, 200),
                'Frozen Foods': (40, 300),
                'School & Office Supplies': (5, 150)
            }
            
            min_price, max_price = price_ranges.get(category, (20, 200))
            
            products.append({
                'product_id': f'PRD{product_id:03d}',
                'product_name': f'{brand["brand_name"]} {template}',
                'brand_id': brand['brand_id'],
                'category_id': category_id,
                'unit_price': round(np.random.uniform(min_price, max_price), 2),
                'unit_size': np.random.choice(['Small', 'Medium', 'Large', 'Family Size']),
                'is_active': True
            })
            product_id += 1
    
    return pd.DataFrame(products), df_categories, df_brands

def generate_customers():
    """Generate customer demographics"""
    customers = []
    
    # Regional distribution (similar to stores)
    region_weights = [0.25] + [0.75/16] * 16
    
    for i in range(CONFIG['num_customers']):
        # Demographics with realistic distributions
        age_bracket = np.random.choice(AGE_BRACKETS, p=[0.15, 0.25, 0.20, 0.15, 0.15, 0.10])
        gender = np.random.choice(['Female', 'Male', 'Other'], p=[0.55, 0.43, 0.02])
        region = np.random.choice(PHILIPPINE_REGIONS, p=region_weights)
        
        # Education correlated with income
        education = np.random.choice(EDUCATION_LEVELS, p=[0.05, 0.30, 0.15, 0.35, 0.12, 0.03])
        
        # Income brackets with realistic distribution
        if education in ['Elementary', 'High School']:
            income = np.random.choice(INCOME_BRACKETS[:3], p=[0.4, 0.4, 0.2])
        elif education == 'Vocational':
            income = np.random.choice(INCOME_BRACKETS[1:4], p=[0.3, 0.4, 0.3])
        elif education == "Bachelor's":
            income = np.random.choice(INCOME_BRACKETS[2:5], p=[0.2, 0.4, 0.4])
        else:  # Master's, Doctoral
            income = np.random.choice(INCOME_BRACKETS[3:], p=[0.2, 0.4, 0.4])
        
        customers.append({
            'customer_id': f'CUST{i+1:04d}',
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'age_bracket': age_bracket,
            'gender': gender,
            'region': region,
            'city': fake.city(),
            'education': education,
            'income_bracket': income,
            'registration_date': fake.date_between(start_date='-2y', end_date='-1m')
        })
    
    return pd.DataFrame(customers)

def generate_transactions(df_customers, df_stores, df_products):
    """Generate realistic transaction data"""
    transactions = []
    
    # Date range
    date_range = pd.date_range(CONFIG['date_start'], CONFIG['date_end'], freq='D')
    
    for i in range(CONFIG['num_transactions']):
        # Random date with weekend/weekday patterns
        date = np.random.choice(date_range)
        
        # Convert numpy datetime64 to Python datetime for .replace() method
        date = pd.to_datetime(date).to_pydatetime()
        
        # Time patterns (peak hours: 7-9am, 5-8pm)
        if np.random.random() < 0.6:  # Peak hours
            if np.random.random() < 0.5:
                hour = np.random.randint(7, 10)  # Morning
            else:
                hour = np.random.randint(17, 21)  # Evening
        else:  # Off-peak
            hour = np.random.randint(9, 17)
        
        transaction_time = date.replace(hour=hour, minute=np.random.randint(0, 60))
        
        # Random customer, store, product
        customer = df_customers.sample(1).iloc[0]
        store = df_stores.sample(1).iloc[0]
        product = df_products.sample(1).iloc[0]
        
        # Quantity (realistic for retail)
        quantity = np.random.choice([1, 2, 3, 4, 5, 6], p=[0.5, 0.25, 0.15, 0.05, 0.03, 0.02])
        
        # Calculate total
        unit_price = product['unit_price']
        total_amount = round(quantity * unit_price, 2)
        
        # Payment method
        payment_method = np.random.choice(['Cash', 'GCash', 'Card', 'PayMaya'], 
                                        p=[0.6, 0.25, 0.10, 0.05])
        
        transactions.append({
            'transaction_id': f'TXN{i+1:06d}',
            'transaction_date': transaction_time,
            'customer_id': customer['customer_id'],
            'store_id': store['store_id'],
            'product_id': product['product_id'],
            'quantity': quantity,
            'unit_price': unit_price,
            'total_amount': total_amount,
            'payment_method': payment_method,
            'discount_applied': np.random.choice([0, 5, 10, 15], p=[0.7, 0.15, 0.10, 0.05])
        })
    
    return pd.DataFrame(transactions)

def generate_recommendations(df_transactions, df_products):
    """Generate AI recommendation data"""
    recommendations = []
    
    # Popular products for recommendations
    popular_products = df_transactions.groupby('product_id').agg({
        'total_amount': 'sum',
        'quantity': 'sum',
        'transaction_id': 'count'
    }).sort_values('total_amount', ascending=False).head(100)
    
    # Generate recommendations for top customers
    top_customers = df_transactions.groupby('customer_id')['total_amount'].sum().sort_values(ascending=False).head(500)
    
    recommendation_id = 1
    for customer_id in top_customers.index:
        # Customer's purchase history
        customer_purchases = df_transactions[df_transactions['customer_id'] == customer_id]['product_id'].unique()
        
        # Recommend products they haven't bought
        available_products = df_products[~df_products['product_id'].isin(customer_purchases)]
        
        # Generate 3-5 recommendations per customer
        num_recommendations = np.random.randint(3, 6)
        
        for _ in range(min(num_recommendations, len(available_products))):
            product = available_products.sample(1).iloc[0]
            
            # Recommendation score based on product popularity and randomness
            base_score = 0.5 + np.random.random() * 0.5
            if product['product_id'] in popular_products.index:
                popularity_boost = popular_products.loc[product['product_id'], 'transaction_id'] / popular_products['transaction_id'].max()
                base_score = min(0.95, base_score + popularity_boost * 0.3)
            
            recommendations.append({
                'recommendation_id': f'REC{recommendation_id:05d}',
                'customer_id': customer_id,
                'product_id': product['product_id'],
                'recommendation_score': round(base_score, 3),
                'recommendation_type': np.random.choice(['Popular', 'Similar', 'Category', 'Seasonal'], 
                                                      p=[0.4, 0.3, 0.2, 0.1]),
                'created_date': fake.date_between(start_date='-30d', end_date='today')
            })
            recommendation_id += 1
    
    return pd.DataFrame(recommendations)

def main():
    """Main data generation function"""
    print("🔄 Starting Scout retail data generation...")
    
    # Generate all datasets
    print("Generating categories...")
    df_categories = generate_categories()
    
    print("Generating brands...")
    df_brands = generate_brands()
    
    print("Generating stores...")
    df_stores = generate_stores()
    
    print("Generating products...")
    df_products, _, _ = generate_products()
    
    print("Generating customers...")
    df_customers = generate_customers()
    
    print("Generating transactions...")
    df_transactions = generate_transactions(df_customers, df_stores, df_products)
    
    print("Generating recommendations...")
    df_recommendations = generate_recommendations(df_transactions, df_products)
    
    # Data validation checks
    print("\n=== DATA VALIDATION ===")
    print(f"Transactions: {len(df_transactions):,}")
    print(f"Customers: {len(df_customers):,}")
    print(f"Products: {len(df_products):,}")
    print(f"Stores: {len(df_stores):,}")
    print(f"Brands: {len(df_brands):,}")
    print(f"Categories: {len(df_categories):,}")
    print(f"Recommendations: {len(df_recommendations):,}")

    # Check for nulls
    print("\n=== NULL CHECK ===")
    for name, df in [('transactions', df_transactions), ('customers', df_customers), 
                     ('products', df_products), ('stores', df_stores)]:
        nulls = df.isnull().sum().sum()
        print(f"{name}: {nulls} null values")

    # Business metrics
    print("\n=== BUSINESS METRICS ===")
    total_sales = df_transactions['total_amount'].sum()
    avg_transaction = df_transactions['total_amount'].mean()
    unique_customers = df_transactions['customer_id'].nunique()
    unique_products_sold = df_transactions['product_id'].nunique()

    print(f"Total Sales: ₱{total_sales:,.2f}")
    print(f"Average Transaction: ₱{avg_transaction:.2f}")
    print(f"Active Customers: {unique_customers:,}")
    print(f"Products Sold: {unique_products_sold:,} / {len(df_products):,}")
    
    # Export all dataframes to CSV
    datasets = {
        'transactions': df_transactions,
        'customers': df_customers,
        'products': df_products,
        'stores': df_stores,
        'brands': df_brands,
        'categories': df_categories,
        'recommendations': df_recommendations
    }

    print("\n" + "="*50)
    print("Exporting datasets to CSV files...")
    print("="*50)

    for name, df in datasets.items():
        filepath = os.path.join(CONFIG['output_dir'], f'{name}.csv')
        df.to_csv(filepath, index=False)
        print(f"✅ {name}.csv: {len(df):,} records exported")

    print("\n🎉 All synthetic data generated successfully!")
    print(f"📁 Files saved to: {CONFIG['output_dir']}")

    # Summary statistics
    total_records = sum(len(df) for df in datasets.values())
    print(f"📊 Total records generated: {total_records:,}")
    print(f"💰 Total transaction value: ₱{df_transactions['total_amount'].sum():,.2f}")
    print(f"🏪 Active stores: {len(df_stores):,}")
    print(f"👥 Unique customers: {len(df_customers):,}")

if __name__ == "__main__":
    main()