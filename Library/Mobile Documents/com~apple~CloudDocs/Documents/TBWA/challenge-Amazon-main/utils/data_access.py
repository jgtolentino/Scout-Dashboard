import os
import pandas as pd
import json
from typing import Optional, Dict, Any, List
from datetime import datetime

class CSVClient:
    """Data Access Layer for CSV-based Scout transaction data"""
    
    def __init__(self):
        self.csv_path = os.getenv('CSV_DATA_PATH', 'data/ready/scout_master_transactions_clean.csv')
        self.geojson_path = os.getenv('GEOJSON_PATH', 'data/geo/')
        self._data = None
        self._enriched_data = None
    
    def _load_data(self) -> pd.DataFrame:
        """Load Scout transaction data with caching"""
        if self._data is None:
            try:
                self._data = pd.read_csv(self.csv_path)
                # Normalize column names and ensure date columns are datetime
                if 'TransactionDate' in self._data.columns:
                    self._data['transaction_date'] = pd.to_datetime(self._data['TransactionDate'])
                elif 'transaction_date' in self._data.columns:
                    self._data['transaction_date'] = pd.to_datetime(self._data['transaction_date'])
                if 'TransactionID' in self._data.columns:
                    self._data['transaction_id'] = self._data['TransactionID']
                elif 'transaction_id' in self._data.columns:
                    pass  # already normalized
                if 'ProductCategory' in self._data.columns:
                    self._data['category'] = self._data['ProductCategory']
                elif 'category' not in self._data.columns:
                    self._data['category'] = 'General'  # fallback
                if 'Brand' in self._data.columns:
                    self._data['brand'] = self._data['Brand']
                elif 'brand' not in self._data.columns:
                    self._data['brand'] = 'Generic'  # fallback
            except FileNotFoundError:
                print(f"Warning: CSV file not found at {self.csv_path}. Using sample data.")
                self._data = self._generate_sample_data()
        return self._data
    
    def _get_enriched_data(self) -> pd.DataFrame:
        """Get enriched transaction data with joins to related tables"""
        if hasattr(self, '_enriched_data') and self._enriched_data is not None:
            return self._enriched_data
            
        # Load main transaction data
        transactions = self._load_data()
        
        # Try to load and join related tables if they exist
        try:
            # Load related CSV files
            products_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'products.csv'))
            stores_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'stores.csv'))
            customers_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'customers.csv'))
            brands_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'brands.csv'))
            categories_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'categories.csv'))
            
            # Join transactions with products
            if 'product_id' in transactions.columns and 'product_id' in products_df.columns:
                transactions = transactions.merge(products_df, on='product_id', how='left', suffixes=('', '_prod'))
                
            # Join with stores
            if 'store_id' in transactions.columns and 'store_id' in stores_df.columns:
                transactions = transactions.merge(stores_df, on='store_id', how='left', suffixes=('', '_store'))
                
            # Join with customers
            if 'customer_id' in transactions.columns and 'customer_id' in customers_df.columns:
                transactions = transactions.merge(customers_df, on='customer_id', how='left', suffixes=('', '_cust'))
                
            # Join with brands
            if 'brand_id' in transactions.columns and 'brand_id' in brands_df.columns:
                transactions = transactions.merge(brands_df, on='brand_id', how='left', suffixes=('', '_brand'))
            elif 'brand_id' in products_df.columns and 'brand_id' in brands_df.columns:
                transactions = transactions.merge(brands_df, left_on='brand_id', right_on='brand_id', how='left', suffixes=('', '_brand'))
                
            # Join with categories
            if 'category_id' in transactions.columns and 'category_id' in categories_df.columns:
                transactions = transactions.merge(categories_df, on='category_id', how='left', suffixes=('', '_cat'))
            elif 'category_id' in products_df.columns and 'category_id' in categories_df.columns:
                transactions = transactions.merge(categories_df, left_on='category_id', right_on='category_id', how='left', suffixes=('', '_cat'))
                
        except FileNotFoundError as e:
            print(f"Related tables not found, using base transaction data: {e}")
            
        self._enriched_data = transactions
        return self._enriched_data
    
    def _generate_sample_data(self) -> pd.DataFrame:
        """Generate sample Scout transaction data for fallback"""
        import numpy as np
        from datetime import datetime, timedelta
        
        # Generate 1000 sample transactions
        n_transactions = 1000
        base_date = datetime(2024, 6, 1)
        
        data = {
            'transaction_id': [f'TXN_{i:06d}' for i in range(n_transactions)],
            'transaction_date': [base_date + timedelta(days=np.random.randint(0, 90)) for _ in range(n_transactions)],
            'customer_id': [f'CUST_{np.random.randint(1, 201):04d}' for _ in range(n_transactions)],
            'product_id': [f'PROD_{np.random.randint(1, 51):04d}' for _ in range(n_transactions)],
            'product_name': np.random.choice(['Rice 5kg', 'Cooking Oil 1L', 'Instant Noodles', 'Canned Sardines', 'Shampoo 200ml'], n_transactions),
            'category': np.random.choice(['Food & Beverages', 'Personal Care', 'Household Items'], n_transactions),
            'brand': np.random.choice(['Lucky Me', 'Palmolive', 'Maggi', 'Century Tuna', 'Head & Shoulders'], n_transactions),
            'quantity': np.random.randint(1, 6, n_transactions),
            'unit_price': np.random.uniform(15.0, 250.0, n_transactions),
            'total_amount': lambda x: x['quantity'] * x['unit_price'],
            'store_id': [f'STORE_{np.random.randint(1, 11):03d}' for _ in range(n_transactions)],
            'region': np.random.choice(['NCR', 'Region III', 'Region IV-A', 'Region VII', 'Region XI'], n_transactions)
        }
        
        df = pd.DataFrame(data)
        df['total_amount'] = df['quantity'] * df['unit_price']
        return df
    
    def transactions(self, date_gte: Optional[str] = None, date_lte: Optional[str] = None, 
                    region: Optional[str] = None, category: Optional[str] = None, 
                    brand: Optional[str] = None, product_name: Optional[str] = None,
                    store: Optional[str] = None, customer_segment: Optional[str] = None) -> pd.DataFrame:
        """Get filtered transaction data with comprehensive Scout dimensions"""
        df = self._get_enriched_data()
        
        # Date filtering
        if date_gte:
            df = df[df['transaction_date'] >= pd.to_datetime(date_gte)]
        if date_lte:
            df = df[df['transaction_date'] <= pd.to_datetime(date_lte)]
            
        # Scout dimension filtering
        if region:
            df = df[df.get('region', '') == region]
        if category:
            df = df[df.get('category', '') == category]
        if brand:
            df = df[df.get('brand', '') == brand]
        if product_name:
            df = df[df.get('product_name', '').str.contains(product_name, case=False, na=False)]
        if store:
            df = df[df.get('store_name', '') == store]
        if customer_segment:
            df = df[df.get('customer_segment', '') == customer_segment]
            
        return df
    
    def demographics(self, region: Optional[str] = None, category: Optional[str] = None,
                    brand: Optional[str] = None, date_gte: Optional[str] = None, 
                    date_lte: Optional[str] = None) -> pd.DataFrame:
        """Get demographic data with filtering support"""
        try:
            # Try to load customers.csv if available
            customers_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'customers.csv'))
            
            # If filters provided, get filtered transactions first to get relevant customers
            if any([region, category, brand, date_gte, date_lte]):
                filtered_transactions = self.transactions(date_gte=date_gte, date_lte=date_lte, 
                                                        region=region, category=category, brand=brand)
                relevant_customer_ids = filtered_transactions['customer_id'].unique()
                customers_df = customers_df[customers_df['customer_id'].isin(relevant_customer_ids)]
                
            return customers_df
            
        except FileNotFoundError:
            # Fallback to original logic with enhanced filtering
            df = self._get_enriched_data()
            
            # Apply filters if provided
            if any([region, category, brand, date_gte, date_lte]):
                df = self.transactions(date_gte=date_gte, date_lte=date_lte, 
                                     region=region, category=category, brand=brand)
            
            # Create demographic data from filtered transactions
            unique_customers = df.drop_duplicates('customer_id') if 'customer_id' in df.columns else df.head(1000)
            
            # Philippine regions for geographic distribution
            regions = [
                'Metro Manila', 'Central Luzon', 'CALABARZON', 'Central Visayas', 
                'Western Visayas', 'Eastern Visayas', 'Bicol Region', 'Ilocos Region',
                'Cagayan Valley', 'Northern Mindanao', 'Davao Region', 'SOCCSKSARGEN'
            ]
            
            demo_data = []
            for i, (_, row) in enumerate(unique_customers.head(1000).iterrows()):
                # Create customer demographic profile
                demo_data.append({
                    'customer_id': row.get('customer_id', f'CUST_{i:04d}'),
                    'region': row.get('region', regions[i % len(regions)]),
                    'gender': ['Female', 'Male', 'Other'][i % 3],
                    'age_bracket': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][i % 6],
                    'education': ["Bachelor's", "High School", "Master's", "Vocational", "Elementary", "Doctoral"][i % 6],
                    'Q-demos-income': ['Under $25K', '$25 - $49.9K', '$50 - $74.9K', '$75 - $99.9K', '$100 - $149.9K'][i % 5]
                })
            
            return pd.DataFrame(demo_data)
    
    def recommendations(self, user_id: Optional[str] = None, query_text: Optional[str] = None, 
                       top_k: int = 10, region: Optional[str] = None, category: Optional[str] = None,
                       brand: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get Scout product recommendations with filtering support"""
        try:
            # Try to load recommendations.csv if available
            rec_df = pd.read_csv(self.csv_path.replace('scout_master_transactions_clean.csv', 'recommendations.csv'))
            
            # Filter recommendations based on provided criteria
            if user_id:
                rec_df = rec_df[rec_df.get('customer_id', '') == user_id]
            if category:
                rec_df = rec_df[rec_df.get('category', '').str.contains(category, case=False, na=False)]
            if brand:
                rec_df = rec_df[rec_df.get('brand', '').str.contains(brand, case=False, na=False)]
                
            return rec_df.head(top_k).to_dict('records')
            
        except FileNotFoundError:
            # Fallback: generate recommendations from transaction data
            df = self.transactions(region=region, category=category, brand=brand)
            
            # Simple recommendation based on popular products
            if 'product_name' in df.columns:
                popular_products = df.groupby('product_name').agg({
                    'total_amount': 'sum',
                    'quantity': 'sum'
                }).sort_values('total_amount', ascending=False).head(top_k)
                
                recommendations = []
                for product, data in popular_products.iterrows():
                    product_data = df[df['product_name'] == product].iloc[0]
                    recommendations.append({
                        'title': product,
                        'category': product_data.get('category', 'General'),
                        'brand': product_data.get('brand', 'Generic'),
                        'total_sales': data['total_amount'],
                        'units_sold': data['quantity'],
                        'recommendation_score': data['total_amount'] / popular_products['total_amount'].max()
                    })
                return recommendations
            
            # Ultimate fallback
            return [{
                'title': f'Scout Product {i}',
                'category': category or 'General',
                'brand': brand or 'Generic',
                'total_sales': 1000.0 - (i * 100),
                'units_sold': 100 - (i * 10),
                'recommendation_score': (10 - i) / 10.0
            } for i in range(top_k)]
    
    def tx_agg_geo(self, geo_level: str = "region", value_col: str = "total_amount",
                   date_gte: Optional[str] = None, date_lte: Optional[str] = None,
                   category: Optional[str] = None, brand: Optional[str] = None) -> pd.DataFrame:
        """Get geographic aggregations for choropleth mapping with filtering"""
        df = self.transactions(date_gte=date_gte, date_lte=date_lte, 
                              category=category, brand=brand)
        
        if geo_level in df.columns and value_col in df.columns:
            return df.groupby(geo_level)[value_col].sum().reset_index()
        
        # Fallback with sample Philippine regions
        return pd.DataFrame({
            geo_level: ['NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region V'],
            value_col: [50000, 30000, 25000, 35000, 45000, 20000]
        })
    
    def load_geojson(self) -> Dict[str, Any]:
        """Load GeoJSON for choropleth mapping"""
        geojson_file = os.path.join(self.geojson_path, 'ph_regions.geojson')
        
        if os.path.exists(geojson_file):
            with open(geojson_file, 'r') as f:
                return json.load(f)
        
        # Fallback minimal GeoJSON structure
        return {
            "type": "FeatureCollection",
            "features": []
        }


class SupabaseClient:
    """Data Access Layer for Supabase-based Scout data (future implementation)"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        # Note: Will implement Supabase connection when DAL_MODE=supabase
    
    def transactions(self, date_gte: Optional[str] = None, date_lte: Optional[str] = None, 
                    region: Optional[str] = None, category: Optional[str] = None,
                    brand: Optional[str] = None, product_name: Optional[str] = None,
                    store: Optional[str] = None, customer_segment: Optional[str] = None) -> pd.DataFrame:
        """Get filtered transaction data from Supabase"""
        # TODO: Implement PostgREST queries with comprehensive filtering
        raise NotImplementedError("Supabase client not yet implemented")
    
    def demographics(self, region: Optional[str] = None, category: Optional[str] = None,
                    brand: Optional[str] = None, date_gte: Optional[str] = None, 
                    date_lte: Optional[str] = None) -> pd.DataFrame:
        """Get demographic data with filtering from Supabase"""
        # TODO: Implement PostgREST aggregation queries with filtering
        raise NotImplementedError("Supabase client not yet implemented")
    
    def recommendations(self, user_id: Optional[str] = None, query_text: Optional[str] = None, 
                       top_k: int = 10, region: Optional[str] = None, category: Optional[str] = None,
                       brand: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get Scout product recommendations from Supabase with filtering"""
        # TODO: Implement recommendation logic with filtering
        raise NotImplementedError("Supabase client not yet implemented")
    
    def tx_agg_geo(self, geo_level: str = "region", value_col: str = "total_amount",
                   date_gte: Optional[str] = None, date_lte: Optional[str] = None,
                   category: Optional[str] = None, brand: Optional[str] = None) -> pd.DataFrame:
        """Get geographic aggregations from Supabase with filtering"""
        # TODO: Implement PostgREST geo queries with filtering
        raise NotImplementedError("Supabase client not yet implemented")
    
    def load_geojson(self) -> Dict[str, Any]:
        """Load GeoJSON from Supabase storage"""
        # TODO: Implement Supabase storage access
        raise NotImplementedError("Supabase client not yet implemented")


def get_data_client():
    """Factory function to get appropriate data client based on DAL_MODE"""
    dal_mode = os.getenv('DAL_MODE', 'csv').lower()
    
    if dal_mode == 'csv':
        return CSVClient()
    elif dal_mode == 'supabase':
        return SupabaseClient()
    else:
        raise ValueError(f"Invalid DAL_MODE: {dal_mode}. Use 'csv' or 'supabase'")


# Convenience functions for backward compatibility
def load_scout_data() -> pd.DataFrame:
    """Load Scout transaction data"""
    client = get_data_client()
    return client.transactions()

def get_scout_demographics() -> Dict[str, Any]:
    """Get Scout demographic data"""
    client = get_data_client()
    return client.demographics()

def get_scout_recommendations(top_k: int = 10) -> List[Dict[str, Any]]:
    """Get Scout product recommendations"""
    client = get_data_client()
    return client.recommendations(top_k=top_k)