"""
Data Processor Module - Scout Dashboard ETL Pipeline
Handles data transformation, cleaning, and enrichment
"""

import logging
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class DataProcessor:
    """Processes and transforms data for the Scout Dashboard"""
    
    def __init__(self, config):
        """Initialize with pipeline configuration"""
        self.config = config
        self.transform_config = config.get_transformation_config()
    
    def clean(self, data: List[Dict]) -> List[Dict]:
        """Clean and standardize data"""
        if not data:
            return data
        
        logger.info(f"Cleaning {len(data)} records...")
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(data)
        
        # Remove duplicates
        if self.transform_config.get('data_quality', {}).get('remove_duplicates', True):
            initial_count = len(df)
            df = df.drop_duplicates()
            removed_count = initial_count - len(df)
            if removed_count > 0:
                logger.info(f"Removed {removed_count} duplicate records")
        
        # Handle null values
        null_handling = self.transform_config.get('data_quality', {}).get('handle_nulls', 'fill_with_default')
        if null_handling == 'fill_with_default':
            df = self._fill_nulls_with_defaults(df)
        elif null_handling == 'remove':
            df = df.dropna()
        
        # Validate schema
        if self.transform_config.get('data_quality', {}).get('validate_schema', True):
            df = self._validate_schema(df)
        
        # Detect and handle outliers
        if self.transform_config.get('data_quality', {}).get('outlier_detection', True):
            df = self._handle_outliers(df)
        
        logger.info(f"Cleaning complete. {len(df)} records remain.")
        return df.to_dict('records')
    
    def validate(self, data: List[Dict]) -> List[Dict]:
        """Validate data quality and consistency"""
        if not data:
            return data
        
        logger.info(f"Validating {len(data)} records...")
        
        valid_records = []
        invalid_count = 0
        
        for record in data:
            if self._is_valid_record(record):
                valid_records.append(record)
            else:
                invalid_count += 1
        
        if invalid_count > 0:
            logger.warning(f"Filtered out {invalid_count} invalid records")
        
        logger.info(f"Validation complete. {len(valid_records)} valid records.")
        return valid_records
    
    def enrich(self, data: List[Dict]) -> List[Dict]:
        """Enrich data with additional information"""
        if not data:
            return data
        
        logger.info(f"Enriching {len(data)} records...")
        
        enriched_data = []
        
        for record in data:
            enriched_record = record.copy()
            
            # Add timestamps
            if self.transform_config.get('enrichment', {}).get('add_timestamps', True):
                enriched_record = self._add_timestamps(enriched_record)
            
            # Calculate metrics
            if self.transform_config.get('enrichment', {}).get('calculate_metrics', True):
                enriched_record = self._calculate_metrics(enriched_record)
            
            # Geographic lookup
            if self.transform_config.get('enrichment', {}).get('geographic_lookup', True):
                enriched_record = self._enrich_geographic(enriched_record)
            
            # Category mapping
            if self.transform_config.get('enrichment', {}).get('category_mapping', True):
                enriched_record = self._map_categories(enriched_record)
            
            enriched_data.append(enriched_record)
        
        logger.info(f"Enrichment complete for {len(enriched_data)} records.")
        return enriched_data
    
    def _fill_nulls_with_defaults(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fill null values with appropriate defaults"""
        # Define default values by data type
        defaults = {
            'object': 'Unknown',
            'int64': 0,
            'float64': 0.0,
            'bool': False,
            'datetime64[ns]': pd.Timestamp.now()
        }
        
        for column in df.columns:
            if df[column].isnull().any():
                dtype = str(df[column].dtype)
                default_value = defaults.get(dtype, 'Unknown')
                df[column] = df[column].fillna(default_value)
        
        return df
    
    def _validate_schema(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate data schema and types"""
        # Define expected schemas for different data types
        schemas = {
            'transactions': {
                'required_columns': ['id', 'timestamp', 'amount'],
                'types': {'amount': float, 'timestamp': str}
            },
            'geographic': {
                'required_columns': ['location', 'latitude', 'longitude'],
                'types': {'latitude': float, 'longitude': float}
            }
        }
        
        # Apply basic validation
        for column in df.columns:
            if column in ['amount', 'price', 'value']:
                df[column] = pd.to_numeric(df[column], errors='coerce')
            elif column in ['timestamp', 'date', 'created_at']:
                df[column] = pd.to_datetime(df[column], errors='coerce')
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect and handle statistical outliers"""
        numeric_columns = df.select_dtypes(include=['int64', 'float64']).columns
        
        for column in numeric_columns:
            if df[column].notna().sum() > 0:
                Q1 = df[column].quantile(0.25)
                Q3 = df[column].quantile(0.75)
                IQR = Q3 - Q1
                
                # Define outlier bounds
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Cap outliers instead of removing them
                df[column] = df[column].clip(lower=lower_bound, upper=upper_bound)
        
        return df
    
    def _is_valid_record(self, record: Dict) -> bool:
        """Check if a record meets validation criteria"""
        # Basic validation rules
        if not record:
            return False
        
        # Check for required fields based on record type
        if 'amount' in record and (record['amount'] is None or record['amount'] < 0):
            return False
        
        if 'timestamp' in record and not record['timestamp']:
            return False
        
        return True
    
    def _add_timestamps(self, record: Dict) -> Dict:
        """Add processing timestamps to record"""
        record['processed_at'] = datetime.now().isoformat()
        record['processing_version'] = '1.0.0'
        return record
    
    def _calculate_metrics(self, record: Dict) -> Dict:
        """Calculate derived metrics for record"""
        # Add calculated fields based on existing data
        if 'amount' in record and 'quantity' in record:
            try:
                record['unit_price'] = float(record['amount']) / max(float(record['quantity']), 1)
            except (ValueError, TypeError):
                record['unit_price'] = 0.0
        
        # Add day of week if timestamp exists
        if 'timestamp' in record:
            try:
                dt = pd.to_datetime(record['timestamp'])
                record['day_of_week'] = dt.strftime('%A')
                record['hour_of_day'] = dt.hour
            except:
                pass
        
        return record
    
    def _enrich_geographic(self, record: Dict) -> Dict:
        """Enrich with geographic information"""
        # Add region mapping based on location
        location_mappings = {
            'metro_manila': 'NCR',
            'cebu': 'Central Visayas',
            'davao': 'Davao Region',
            'default': 'Philippines'
        }
        
        if 'location' in record:
            location = str(record['location']).lower()
            for key, region in location_mappings.items():
                if key in location:
                    record['region'] = region
                    break
            else:
                record['region'] = location_mappings['default']
        
        return record
    
    def _map_categories(self, record: Dict) -> Dict:
        """Map and standardize category information"""
        # Category standardization
        category_mappings = {
            'food': ['food', 'grocery', 'snacks', 'beverages'],
            'household': ['cleaning', 'personal_care', 'home'],
            'electronics': ['gadgets', 'phones', 'accessories']
        }
        
        if 'category' in record:
            category = str(record['category']).lower()
            for standard_cat, variations in category_mappings.items():
                if any(var in category for var in variations):
                    record['standard_category'] = standard_cat
                    break
            else:
                record['standard_category'] = 'other'
        
        return record
    
    def aggregate_data(self, data: List[Dict], aggregation_type: str) -> Dict:
        """Create aggregated summaries of the data"""
        if not data:
            return {}
        
        df = pd.DataFrame(data)
        
        aggregations = {}
        
        if aggregation_type == 'daily':
            aggregations = self._create_daily_aggregations(df)
        elif aggregation_type == 'weekly':
            aggregations = self._create_weekly_aggregations(df)
        elif aggregation_type == 'monthly':
            aggregations = self._create_monthly_aggregations(df)
        
        return aggregations
    
    def _create_daily_aggregations(self, df: pd.DataFrame) -> Dict:
        """Create daily aggregated metrics"""
        aggregations = {
            'total_records': len(df),
            'date': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Numeric aggregations
        numeric_columns = df.select_dtypes(include=['int64', 'float64']).columns
        for column in numeric_columns:
            aggregations[f'{column}_sum'] = df[column].sum()
            aggregations[f'{column}_avg'] = df[column].mean()
            aggregations[f'{column}_max'] = df[column].max()
            aggregations[f'{column}_min'] = df[column].min()
        
        return aggregations
    
    def _create_weekly_aggregations(self, df: pd.DataFrame) -> Dict:
        """Create weekly aggregated metrics"""
        return self._create_daily_aggregations(df)  # Simplified for now
    
    def _create_monthly_aggregations(self, df: pd.DataFrame) -> Dict:
        """Create monthly aggregated metrics"""
        return self._create_daily_aggregations(df)  # Simplified for now