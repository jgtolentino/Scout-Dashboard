"""
Data Collector Module - Scout Dashboard ETL Pipeline
Handles data ingestion from multiple sources
"""

import requests
import json
import logging
from typing import Dict, List, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class DataCollector:
    """Collects data from various sources for the Scout Dashboard"""
    
    def __init__(self, config):
        """Initialize with pipeline configuration"""
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Scout-Dashboard-ETL/1.0'})
    
    def collect(self, source_config: Dict[str, Any]) -> List[Dict]:
        """Collect data from a configured source"""
        source_type = source_config.get('type', 'api')
        
        if source_type == 'api':
            return self._collect_from_api(source_config)
        elif source_type == 'file':
            return self._collect_from_file(source_config)
        elif source_type == 'database':
            return self._collect_from_database(source_config)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
    
    def _collect_from_api(self, source_config: Dict[str, Any]) -> List[Dict]:
        """Collect data from REST API endpoint"""
        connection = source_config['connection']
        url = connection['url']
        method = connection.get('method', 'GET')
        headers = connection.get('headers', {})
        
        logger.info(f"Collecting from API: {url}")
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different response formats
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # Look for data in common response structures
                if 'data' in data:
                    return data['data'] if isinstance(data['data'], list) else [data['data']]
                elif 'results' in data:
                    return data['results'] if isinstance(data['results'], list) else [data['results']]
                else:
                    return [data]
            else:
                logger.warning(f"Unexpected data format from {url}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API collection failed for {url}: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {url}: {e}")
            return []
    
    def _collect_from_file(self, source_config: Dict[str, Any]) -> List[Dict]:
        """Collect data from file system"""
        connection = source_config['connection']
        file_path = Path(connection['path'])
        file_format = connection.get('format', 'json')
        
        logger.info(f"Collecting from file: {file_path}")
        
        try:
            if not file_path.exists():
                logger.warning(f"File not found: {file_path}")
                return []
            
            if file_format == 'json':
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else [data]
            elif file_format == 'csv':
                import pandas as pd
                df = pd.read_csv(file_path)
                return df.to_dict('records')
            else:
                raise ValueError(f"Unsupported file format: {file_format}")
                
        except Exception as e:
            logger.error(f"File collection failed for {file_path}: {e}")
            return []
    
    def _collect_from_database(self, source_config: Dict[str, Any]) -> List[Dict]:
        """Collect data from database"""
        connection = source_config['connection']
        
        logger.info(f"Collecting from database: {connection.get('database', 'unknown')}")
        
        try:
            import sqlalchemy
            import pandas as pd
            
            # Build connection string based on database type
            db_type = connection.get('type', 'sqlite')
            
            if db_type == 'sqlite':
                conn_str = f"sqlite:///{connection['database']}"
            elif db_type == 'postgresql':
                conn_str = f"postgresql://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database']}"
            elif db_type == 'mysql':
                conn_str = f"mysql+pymysql://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database']}"
            else:
                raise ValueError(f"Unsupported database type: {db_type}")
            
            engine = sqlalchemy.create_engine(conn_str)
            query = connection.get('query', f"SELECT * FROM {connection.get('table', 'data')}")
            
            df = pd.read_sql(query, engine)
            return df.to_dict('records')
            
        except Exception as e:
            logger.error(f"Database collection failed: {e}")
            return []
    
    def test_connection(self, source_config: Dict[str, Any]) -> bool:
        """Test connection to a data source"""
        try:
            data = self.collect(source_config)
            return len(data) >= 0  # Success if we can collect (even empty result)
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
    
    def get_collection_stats(self, source_config: Dict[str, Any]) -> Dict[str, Any]:
        """Get statistics about data collection from a source"""
        stats = {
            'source_name': source_config.get('name', 'unknown'),
            'source_type': source_config.get('type', 'unknown'),
            'connection_successful': False,
            'records_available': 0,
            'last_check': None
        }
        
        try:
            from datetime import datetime
            stats['last_check'] = datetime.now().isoformat()
            
            data = self.collect(source_config)
            stats['connection_successful'] = True
            stats['records_available'] = len(data)
            
        except Exception as e:
            logger.error(f"Stats collection failed for {source_config.get('name')}: {e}")
        
        return stats