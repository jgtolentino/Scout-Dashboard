"""
Data Loader Module - Scout Dashboard ETL Pipeline
Handles loading processed data to various destinations
"""

import json
import logging
import sqlite3
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

logger = logging.getLogger(__name__)

class DataLoader:
    """Loads processed data to configured destinations"""
    
    def __init__(self, config):
        """Initialize with pipeline configuration"""
        self.config = config
        self.load_destinations = config.get_load_destinations()
    
    def load(self, data: List[Dict], destination_config: Dict[str, Any]) -> int:
        """Load data to a configured destination"""
        destination_type = destination_config.get('type', 'json_files')
        
        if destination_type == 'json_files':
            return self._load_to_json_files(data, destination_config)
        elif destination_type == 'sqlite':
            return self._load_to_sqlite(data, destination_config)
        elif destination_type == 'azure_sql':
            return self._load_to_azure_sql(data, destination_config)
        elif destination_type == 'csv':
            return self._load_to_csv(data, destination_config)
        else:
            raise ValueError(f"Unsupported destination type: {destination_type}")
    
    def _load_to_json_files(self, data: List[Dict], destination_config: Dict[str, Any]) -> int:
        """Load data to JSON files for dashboard consumption"""
        connection = destination_config['connection']
        output_path = Path(connection['path'])
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Loading {len(data)} records to JSON files at {output_path}")
        
        try:
            # Determine data type and filename
            data_type = self._infer_data_type(data)
            filename = f"{data_type}.json"
            file_path = output_path / filename
            
            # Prepare data for dashboard
            dashboard_data = self._prepare_dashboard_data(data, data_type)
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(dashboard_data, f, indent=2, default=str)
            
            logger.info(f"Successfully loaded data to {file_path}")
            return len(data)
            
        except Exception as e:
            logger.error(f"Failed to load to JSON files: {e}")
            return 0
    
    def _load_to_sqlite(self, data: List[Dict], destination_config: Dict[str, Any]) -> int:
        """Load data to SQLite database"""
        connection = destination_config['connection']
        db_path = Path(connection['database'])
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Loading {len(data)} records to SQLite at {db_path}")
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data)
            if df.empty:
                return 0
            
            # Determine table name
            data_type = self._infer_data_type(data)
            table_name = f"scout_{data_type}"
            
            # Create connection and load data
            conn = sqlite3.connect(db_path)
            
            # Load data, replacing existing table
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            
            # Create indexes for common query patterns
            self._create_sqlite_indexes(conn, table_name, df.columns)
            
            conn.close()
            
            logger.info(f"Successfully loaded {len(data)} records to {table_name}")
            return len(data)
            
        except Exception as e:
            logger.error(f"Failed to load to SQLite: {e}")
            return 0
    
    def _load_to_azure_sql(self, data: List[Dict], destination_config: Dict[str, Any]) -> int:
        """Load data to Azure SQL Database"""
        if not destination_config.get('enabled', False):
            logger.info("Azure SQL destination disabled, skipping...")
            return 0
        
        connection = destination_config['connection']
        
        logger.info(f"Loading {len(data)} records to Azure SQL")
        
        try:
            import sqlalchemy
            import os
            
            # Build connection string with environment variables
            server = os.getenv('AZURE_SQL_SERVER', connection.get('server', ''))
            database = os.getenv('AZURE_SQL_DATABASE', connection.get('database', ''))
            username = os.getenv('AZURE_SQL_USERNAME', connection.get('username', ''))
            password = os.getenv('AZURE_SQL_PASSWORD', connection.get('password', ''))
            
            if not all([server, database, username, password]):
                logger.warning("Azure SQL credentials not configured, skipping...")
                return 0
            
            conn_str = f"mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
            engine = sqlalchemy.create_engine(conn_str)
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            if df.empty:
                return 0
            
            # Determine table name
            data_type = self._infer_data_type(data)
            table_name = f"scout_{data_type}"
            
            # Load data
            df.to_sql(table_name, engine, if_exists='replace', index=False)
            
            logger.info(f"Successfully loaded {len(data)} records to Azure SQL")
            return len(data)
            
        except Exception as e:
            logger.error(f"Failed to load to Azure SQL: {e}")
            return 0
    
    def _load_to_csv(self, data: List[Dict], destination_config: Dict[str, Any]) -> int:
        """Load data to CSV files"""
        connection = destination_config['connection']
        output_path = Path(connection['path'])
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Loading {len(data)} records to CSV at {output_path}")
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data)
            if df.empty:
                return 0
            
            # Determine filename
            data_type = self._infer_data_type(data)
            filename = f"{data_type}.csv"
            file_path = output_path / filename
            
            # Write to CSV
            df.to_csv(file_path, index=False)
            
            logger.info(f"Successfully loaded data to {file_path}")
            return len(data)
            
        except Exception as e:
            logger.error(f"Failed to load to CSV: {e}")
            return 0
    
    def _infer_data_type(self, data: List[Dict]) -> str:
        """Infer data type from record structure"""
        if not data:
            return "unknown"
        
        # Check first record for type indicators
        sample = data[0]
        
        if 'transaction_id' in sample or 'amount' in sample:
            return "transactions"
        elif 'latitude' in sample or 'longitude' in sample:
            return "geographic"
        elif 'product_id' in sample or 'sku' in sample:
            return "products"
        elif 'behavior' in sample or 'interaction' in sample:
            return "behavior"
        elif 'customer_id' in sample or 'age' in sample or 'gender' in sample:
            return "customers"
        else:
            return "general"
    
    def _prepare_dashboard_data(self, data: List[Dict], data_type: str) -> Dict[str, Any]:
        """Prepare data in format expected by dashboard"""
        dashboard_data = {
            "metadata": {
                "type": data_type,
                "count": len(data),
                "last_updated": pd.Timestamp.now().isoformat(),
                "version": "1.0.0"
            },
            "data": data
        }
        
        # Add type-specific metadata
        if data_type == "transactions":
            dashboard_data["summary"] = self._create_transaction_summary(data)
        elif data_type == "geographic":
            dashboard_data["summary"] = self._create_geographic_summary(data)
        elif data_type == "products":
            dashboard_data["summary"] = self._create_product_summary(data)
        
        return dashboard_data
    
    def _create_transaction_summary(self, data: List[Dict]) -> Dict[str, Any]:
        """Create summary statistics for transaction data"""
        df = pd.DataFrame(data)
        
        summary = {
            "total_transactions": len(df),
            "total_amount": 0,
            "average_amount": 0,
            "date_range": {}
        }
        
        if 'amount' in df.columns:
            amount_col = pd.to_numeric(df['amount'], errors='coerce')
            summary["total_amount"] = float(amount_col.sum())
            summary["average_amount"] = float(amount_col.mean())
        
        if 'timestamp' in df.columns:
            timestamps = pd.to_datetime(df['timestamp'], errors='coerce')
            valid_timestamps = timestamps.dropna()
            if len(valid_timestamps) > 0:
                summary["date_range"] = {
                    "start": valid_timestamps.min().isoformat(),
                    "end": valid_timestamps.max().isoformat()
                }
        
        return summary
    
    def _create_geographic_summary(self, data: List[Dict]) -> Dict[str, Any]:
        """Create summary statistics for geographic data"""
        df = pd.DataFrame(data)
        
        summary = {
            "total_locations": len(df),
            "regions": [],
            "coordinate_bounds": {}
        }
        
        if 'region' in df.columns:
            summary["regions"] = df['region'].unique().tolist()
        
        if 'latitude' in df.columns and 'longitude' in df.columns:
            lat_col = pd.to_numeric(df['latitude'], errors='coerce')
            lon_col = pd.to_numeric(df['longitude'], errors='coerce')
            
            if not lat_col.empty and not lon_col.empty:
                summary["coordinate_bounds"] = {
                    "north": float(lat_col.max()),
                    "south": float(lat_col.min()),
                    "east": float(lon_col.max()),
                    "west": float(lon_col.min())
                }
        
        return summary
    
    def _create_product_summary(self, data: List[Dict]) -> Dict[str, Any]:
        """Create summary statistics for product data"""
        df = pd.DataFrame(data)
        
        summary = {
            "total_products": len(df),
            "categories": [],
            "brands": []
        }
        
        if 'category' in df.columns:
            summary["categories"] = df['category'].unique().tolist()
        
        if 'brand' in df.columns:
            summary["brands"] = df['brand'].unique().tolist()
        
        return summary
    
    def _create_sqlite_indexes(self, conn: sqlite3.Connection, table_name: str, columns: List[str]):
        """Create indexes for common query patterns"""
        index_columns = ['id', 'timestamp', 'date', 'customer_id', 'product_id', 'location']
        
        for column in columns:
            if column.lower() in index_columns:
                try:
                    index_name = f"idx_{table_name}_{column}"
                    conn.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column})")
                except Exception as e:
                    logger.warning(f"Failed to create index on {column}: {e}")
        
        conn.commit()
    
    def test_connection(self, destination_config: Dict[str, Any] = None) -> bool:
        """Test connection to a data destination"""
        if destination_config is None:
            # Test all configured destinations
            for dest in self.load_destinations:
                if dest.get('enabled', True):
                    if not self._test_single_destination(dest):
                        return False
            return True
        else:
            return self._test_single_destination(destination_config)
    
    def _test_single_destination(self, destination_config: Dict[str, Any]) -> bool:
        """Test a single destination connection"""
        try:
            destination_type = destination_config.get('type', 'json_files')
            
            if destination_type == 'json_files':
                output_path = Path(destination_config['connection']['path'])
                output_path.mkdir(parents=True, exist_ok=True)
                return output_path.exists()
                
            elif destination_type == 'sqlite':
                db_path = Path(destination_config['connection']['database'])
                db_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Test connection
                conn = sqlite3.connect(db_path)
                conn.execute("SELECT 1")
                conn.close()
                return True
                
            elif destination_type == 'azure_sql':
                if not destination_config.get('enabled', False):
                    return True  # Disabled destinations are considered "successful"
                # Add Azure SQL connection test here
                return True
                
            else:
                logger.warning(f"Unknown destination type for testing: {destination_type}")
                return False
                
        except Exception as e:
            logger.error(f"Destination test failed: {e}")
            return False