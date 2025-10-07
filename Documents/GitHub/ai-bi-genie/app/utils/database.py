"""
Database connection and utilities for AI-BI-Genie
"""

import os
import logging
import pandas as pd
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import streamlit as st

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Database connection manager for AI-BI-Genie"""
    
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres123@localhost:5432/ai_bi_genie')
        self.connection = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(self.connection_string)
            return True
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return False
    
    def execute_query(self, query: str, params: tuple = None) -> pd.DataFrame:
        """Execute a SQL query and return results as DataFrame"""
        try:
            if not self.connection or self.connection.closed:
                self.connect()
                
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                
                if cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    data = cursor.fetchall()
                    return pd.DataFrame(data, columns=columns)
                else:
                    return pd.DataFrame()
                    
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return pd.DataFrame()
    
    def get_regions(self) -> List[str]:
        """Get available regions from database"""
        try:
            # For demo purposes, return sample regions
            return ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa']
        except Exception as e:
            logger.error(f"Failed to get regions: {str(e)}")
            return ['All Regions']
    
    def get_product_categories(self) -> List[str]:
        """Get available product categories"""
        try:
            # For demo purposes, return sample categories
            return ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Automotive']
        except Exception as e:
            logger.error(f"Failed to get product categories: {str(e)}")
            return ['All Categories']
    
    def get_customer_segments(self) -> List[str]:
        """Get available customer segments"""
        try:
            # For demo purposes, return sample segments
            return ['Enterprise', 'SMB', 'Consumer', 'Government', 'Non-Profit']
        except Exception as e:
            logger.error(f"Failed to get customer segments: {str(e)}")
            return ['All Segments']
    
    def close(self):
        """Close database connection"""
        if self.connection and not self.connection.closed:
            self.connection.close()

@st.cache_data
def get_sample_data():
    """Generate sample data for demonstration"""
    import numpy as np
    from datetime import datetime, timedelta
    
    # Generate sample revenue data
    dates = pd.date_range(start=datetime.now() - timedelta(days=90), end=datetime.now(), freq='D')
    revenue_data = pd.DataFrame({
        'date': dates,
        'revenue': np.random.normal(50000, 10000, len(dates)).cumsum() + 1000000
    })
    
    # Generate sample regional data
    regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America']
    region_data = pd.DataFrame({
        'region': regions,
        'sales': np.random.uniform(100000, 500000, len(regions))
    })
    
    # Generate sample category data
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports']
    category_data = pd.DataFrame({
        'category': categories,
        'sales': np.random.uniform(80000, 300000, len(categories))
    })
    
    return {
        'revenue_trend': revenue_data,
        'sales_by_region': region_data,
        'sales_by_category': category_data
    }