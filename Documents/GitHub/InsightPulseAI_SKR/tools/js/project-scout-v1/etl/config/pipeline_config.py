"""
Pipeline Configuration Module - Scout Dashboard ETL Pipeline
Handles configuration loading and validation
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class PipelineConfig:
    """Configuration manager for Scout Dashboard ETL Pipeline"""
    
    def __init__(self, config_path: str):
        """Initialize with configuration file path"""
        self.config_path = Path(config_path)
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            if not self.config_path.exists():
                logger.error(f"Configuration file not found: {self.config_path}")
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
            
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            
            logger.info(f"Configuration loaded from {self.config_path}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise
    
    def validate(self) -> bool:
        """Validate configuration structure and required fields"""
        try:
            # Check required top-level sections
            required_sections = ['pipeline', 'data_sources', 'transformations', 'load_destinations']
            
            for section in required_sections:
                if section not in self.config:
                    logger.error(f"Missing required configuration section: {section}")
                    return False
            
            # Validate pipeline metadata
            pipeline_config = self.config.get('pipeline', {})
            required_pipeline_fields = ['name', 'version']
            
            for field in required_pipeline_fields:
                if field not in pipeline_config:
                    logger.error(f"Missing required pipeline field: {field}")
                    return False
            
            # Validate data sources
            data_sources = self.config.get('data_sources', [])
            if not isinstance(data_sources, list) or len(data_sources) == 0:
                logger.error("No data sources configured")
                return False
            
            for i, source in enumerate(data_sources):
                if not self._validate_data_source(source, i):
                    return False
            
            # Validate load destinations
            destinations = self.config.get('load_destinations', [])
            if not isinstance(destinations, list) or len(destinations) == 0:
                logger.error("No load destinations configured")
                return False
            
            for i, dest in enumerate(destinations):
                if not self._validate_destination(dest, i):
                    return False
            
            logger.info("Configuration validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Configuration validation failed: {e}")
            return False
    
    def _validate_data_source(self, source: Dict[str, Any], index: int) -> bool:
        """Validate individual data source configuration"""
        required_fields = ['name', 'type', 'connection']
        
        for field in required_fields:
            if field not in source:
                logger.error(f"Data source {index} missing required field: {field}")
                return False
        
        # Validate connection based on source type
        source_type = source.get('type')
        connection = source.get('connection', {})
        
        if source_type == 'api':
            if 'url' not in connection:
                logger.error(f"API data source {source['name']} missing URL")
                return False
        elif source_type == 'file':
            if 'path' not in connection:
                logger.error(f"File data source {source['name']} missing path")
                return False
        elif source_type == 'database':
            required_db_fields = ['database']
            for field in required_db_fields:
                if field not in connection:
                    logger.error(f"Database source {source['name']} missing {field}")
                    return False
        
        return True
    
    def _validate_destination(self, destination: Dict[str, Any], index: int) -> bool:
        """Validate individual destination configuration"""
        required_fields = ['name', 'type', 'connection']
        
        for field in required_fields:
            if field not in destination:
                logger.error(f"Destination {index} missing required field: {field}")
                return False
        
        # Validate connection based on destination type
        dest_type = destination.get('type')
        connection = destination.get('connection', {})
        
        if dest_type == 'json_files':
            if 'path' not in connection:
                logger.error(f"JSON files destination {destination['name']} missing path")
                return False
        elif dest_type == 'sqlite':
            if 'database' not in connection:
                logger.error(f"SQLite destination {destination['name']} missing database path")
                return False
        elif dest_type == 'azure_sql':
            required_fields = ['server', 'database', 'username', 'password']
            for field in required_fields:
                if field not in connection:
                    logger.warning(f"Azure SQL destination {destination['name']} missing {field} (may use environment variables)")
        
        return True
    
    def get_data_sources(self) -> List[Dict[str, Any]]:
        """Get list of enabled data sources"""
        sources = self.config.get('data_sources', [])
        return [source for source in sources if source.get('enabled', True)]
    
    def get_load_destinations(self) -> List[Dict[str, Any]]:
        """Get list of enabled load destinations"""
        destinations = self.config.get('load_destinations', [])
        return [dest for dest in destinations if dest.get('enabled', True)]
    
    def get_transformation_config(self) -> Dict[str, Any]:
        """Get transformation configuration"""
        return self.config.get('transformations', {})
    
    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration"""
        return self.config.get('monitoring', {})
    
    def get_edge_config(self) -> Dict[str, Any]:
        """Get edge deployment configuration"""
        return self.config.get('edge_deployment', {})
    
    def get_pipeline_info(self) -> Dict[str, Any]:
        """Get pipeline metadata"""
        return self.config.get('pipeline', {})
    
    def update_config(self, updates: Dict[str, Any]) -> bool:
        """Update configuration with new values"""
        try:
            # Deep merge updates into existing config
            self._deep_merge(self.config, updates)
            
            # Validate updated configuration
            if self.validate():
                # Save updated configuration
                with open(self.config_path, 'w') as f:
                    json.dump(self.config, f, indent=2)
                
                logger.info("Configuration updated successfully")
                return True
            else:
                logger.error("Configuration update failed validation")
                return False
                
        except Exception as e:
            logger.error(f"Failed to update configuration: {e}")
            return False
    
    def _deep_merge(self, base: Dict, updates: Dict) -> None:
        """Deep merge updates into base dictionary"""
        for key, value in updates.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value
    
    def get_source_by_name(self, name: str) -> Dict[str, Any]:
        """Get data source configuration by name"""
        sources = self.get_data_sources()
        for source in sources:
            if source.get('name') == name:
                return source
        raise ValueError(f"Data source not found: {name}")
    
    def get_destination_by_name(self, name: str) -> Dict[str, Any]:
        """Get destination configuration by name"""
        destinations = self.get_load_destinations()
        for dest in destinations:
            if dest.get('name') == name:
                return dest
        raise ValueError(f"Destination not found: {name}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Get complete configuration as dictionary"""
        return self.config.copy()
    
    def save_config(self, path: str = None) -> bool:
        """Save current configuration to file"""
        try:
            save_path = Path(path) if path else self.config_path
            
            with open(save_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info(f"Configuration saved to {save_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False