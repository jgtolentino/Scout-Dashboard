#!/usr/bin/env python3
"""
Scout Dashboard ETL Pipeline - Main Orchestrator
Production-ready data pipeline for analytics dashboard
"""

import sys
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Add ETL modules to path
sys.path.append(str(Path(__file__).parent))

from ingest.data_collector import DataCollector
from transform.data_processor import DataProcessor
from load.data_loader import DataLoader
from config.pipeline_config import PipelineConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl/logs/pipeline.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ScoutETLPipeline:
    """Main ETL Pipeline orchestrator for Scout Dashboard"""
    
    def __init__(self, config_path='etl/config/pipeline.json'):
        """Initialize pipeline with configuration"""
        self.config = PipelineConfig(config_path)
        self.collector = DataCollector(self.config)
        self.processor = DataProcessor(self.config)
        self.loader = DataLoader(self.config)
        self.stats = {
            'start_time': None,
            'end_time': None,
            'records_processed': 0,
            'errors': 0,
            'status': 'initialized'
        }
    
    def validate_environment(self):
        """Validate pipeline environment and dependencies"""
        logger.info("🔍 Validating pipeline environment...")
        
        validation_results = {
            'config_valid': self.config.validate(),
            'storage_accessible': self._check_storage(),
            'dependencies_installed': self._check_dependencies()
        }
        
        all_valid = all(validation_results.values())
        logger.info(f"✅ Environment validation: {'PASSED' if all_valid else 'FAILED'}")
        return all_valid
    
    def _check_storage(self):
        """Check storage connectivity"""
        try:
            # Test database/storage connections
            return self.loader.test_connection()
        except Exception as e:
            logger.error(f"Storage check failed: {e}")
            return False
    
    def _check_dependencies(self):
        """Check required dependencies"""
        try:
            import pandas as pd
            import requests
            import sqlalchemy
            return True
        except ImportError as e:
            logger.error(f"Missing dependency: {e}")
            return False
    
    def run_ingestion(self):
        """Execute data ingestion phase"""
        logger.info("📥 Starting data ingestion...")
        self.stats['status'] = 'ingesting'
        
        try:
            # Collect from multiple sources
            sources = self.config.get_data_sources()
            raw_data = {}
            
            for source in sources:
                logger.info(f"Collecting from source: {source['name']}")
                data = self.collector.collect(source)
                raw_data[source['name']] = data
                logger.info(f"Collected {len(data)} records from {source['name']}")
            
            return raw_data
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            self.stats['errors'] += 1
            raise
    
    def run_transformation(self, raw_data):
        """Execute data transformation phase"""
        logger.info("🔄 Starting data transformation...")
        self.stats['status'] = 'transforming'
        
        try:
            transformed_data = {}
            
            for source_name, data in raw_data.items():
                logger.info(f"Transforming data from: {source_name}")
                
                # Apply transformations based on source type
                clean_data = self.processor.clean(data)
                validated_data = self.processor.validate(clean_data)
                enriched_data = self.processor.enrich(validated_data)
                
                transformed_data[source_name] = enriched_data
                logger.info(f"Transformation complete for: {source_name}")
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Transformation failed: {e}")
            self.stats['errors'] += 1
            raise
    
    def run_loading(self, transformed_data):
        """Execute data loading phase"""
        logger.info("📤 Starting data loading...")
        self.stats['status'] = 'loading'
        
        try:
            total_records = 0
            
            for source_name, data in transformed_data.items():
                logger.info(f"Loading data from: {source_name}")
                
                # Load to configured destinations
                destinations = self.config.get_load_destinations()
                
                for destination in destinations:
                    records_loaded = self.loader.load(data, destination)
                    total_records += records_loaded
                    logger.info(f"Loaded {records_loaded} records to {destination['name']}")
            
            self.stats['records_processed'] = total_records
            return total_records
            
        except Exception as e:
            logger.error(f"Loading failed: {e}")
            self.stats['errors'] += 1
            raise
    
    def run_full_pipeline(self):
        """Execute complete ETL pipeline"""
        logger.info("🚀 Starting Scout Dashboard ETL Pipeline...")
        self.stats['start_time'] = datetime.now()
        self.stats['status'] = 'running'
        
        try:
            # Validate environment
            if not self.validate_environment():
                raise RuntimeError("Environment validation failed")
            
            # Execute ETL phases
            raw_data = self.run_ingestion()
            transformed_data = self.run_transformation(raw_data)
            records_loaded = self.run_loading(transformed_data)
            
            # Update statistics
            self.stats['end_time'] = datetime.now()
            self.stats['status'] = 'completed'
            
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            
            logger.info("✅ ETL Pipeline completed successfully!")
            logger.info(f"📊 Records processed: {records_loaded}")
            logger.info(f"⏱️ Duration: {duration:.2f} seconds")
            logger.info(f"❌ Errors: {self.stats['errors']}")
            
            return True
            
        except Exception as e:
            self.stats['end_time'] = datetime.now()
            self.stats['status'] = 'failed'
            logger.error(f"❌ Pipeline failed: {e}")
            return False
    
    def get_pipeline_stats(self):
        """Get pipeline execution statistics"""
        return self.stats

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Scout Dashboard ETL Pipeline')
    parser.add_argument('--config', default='etl/config/pipeline.json', 
                       help='Path to pipeline configuration')
    parser.add_argument('--validate', action='store_true', 
                       help='Validate environment only')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize pipeline
    pipeline = ScoutETLPipeline(args.config)
    
    if args.validate:
        # Validation mode
        valid = pipeline.validate_environment()
        sys.exit(0 if valid else 1)
    else:
        # Full pipeline execution
        success = pipeline.run_full_pipeline()
        
        # Save execution stats
        stats = pipeline.get_pipeline_stats()
        stats_file = Path('etl/logs/last_run_stats.json')
        stats_file.parent.mkdir(exist_ok=True)
        
        with open(stats_file, 'w') as f:
            json.dump(stats, f, indent=2, default=str)
        
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()