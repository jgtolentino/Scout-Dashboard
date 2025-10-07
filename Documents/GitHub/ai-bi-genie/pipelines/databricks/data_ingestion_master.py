# Databricks notebook source
# MAGIC %md
# MAGIC # AI-BI-Genie Data Ingestion Master Pipeline
# MAGIC 
# MAGIC This notebook orchestrates the complete data ingestion process for the AI-BI-Genie platform.
# MAGIC It handles data extraction from multiple sources and loads them into the Bronze layer of our data lake.

# COMMAND ----------

# MAGIC %pip install great-expectations azure-keyvault-secrets azure-identity

# COMMAND ----------

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import requests
from pyspark.sql import DataFrame
from pyspark.sql.functions import *
from pyspark.sql.types import *
from delta.tables import DeltaTable
import great_expectations as ge
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Configuration and Setup

# COMMAND ----------

# Get configuration from widgets or environment
dbutils.widgets.text("config_path", "/mnt/config/data_pipeline_config.json", "Configuration Path")
dbutils.widgets.text("execution_date", datetime.now().strftime("%Y-%m-%d"), "Execution Date")
dbutils.widgets.text("source_filter", "", "Source Filter (optional)")
dbutils.widgets.dropdown("mode", "incremental", ["full", "incremental"], "Ingestion Mode")

config_path = dbutils.widgets.get("config_path")
execution_date = dbutils.widgets.get("execution_date")
source_filter = dbutils.widgets.get("source_filter")
ingestion_mode = dbutils.widgets.get("mode")

print(f"Configuration Path: {config_path}")
print(f"Execution Date: {execution_date}")
print(f"Source Filter: {source_filter}")
print(f"Ingestion Mode: {ingestion_mode}")

# COMMAND ----------

class DataIngestionPipeline:
    """Main data ingestion pipeline class"""
    
    def __init__(self, config_path: str, execution_date: str):
        self.config_path = config_path
        self.execution_date = execution_date
        self.config = self._load_config()
        self.key_vault_client = self._init_key_vault_client()
        self.ingestion_stats = {
            "sources_processed": 0,
            "total_records": 0,
            "failed_sources": [],
            "processing_time": 0
        }
        
    def _load_config(self) -> Dict[str, Any]:
        """Load pipeline configuration"""
        try:
            with open(self.config_path.replace("/mnt/", "/dbfs/mnt/"), 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {str(e)}")
            raise
            
    def _init_key_vault_client(self) -> SecretClient:
        """Initialize Azure Key Vault client"""
        credential = DefaultAzureCredential()
        vault_url = f"https://{self.config['environment']['key_vault']}.vault.azure.net/"
        return SecretClient(vault_url=vault_url, credential=credential)
        
    def _get_secret(self, secret_name: str) -> str:
        """Retrieve secret from Key Vault"""
        try:
            secret = self.key_vault_client.get_secret(secret_name)
            return secret.value
        except Exception as e:
            logger.error(f"Failed to retrieve secret {secret_name}: {str(e)}")
            raise
            
    def _create_bronze_path(self, source_name: str, table_name: str = None) -> str:
        """Create bronze layer path for data storage"""
        base_path = self.config["data_lake_structure"]["bronze_layer"]["path"]
        date_partition = datetime.strptime(self.execution_date, "%Y-%m-%d")
        
        path_parts = [
            base_path.rstrip('/'),
            f"source={source_name}",
            f"year={date_partition.year}",
            f"month={date_partition.month:02d}",
            f"day={date_partition.day:02d}"
        ]
        
        if table_name:
            path_parts.append(f"table={table_name}")
            
        return "/".join(path_parts)
        
    def ingest_sql_database(self, source_name: str, source_config: Dict[str, Any]) -> bool:
        """Ingest data from SQL database source"""
        try:
            logger.info(f"Starting ingestion from SQL source: {source_name}")
            
            # Get connection string from Key Vault
            connection_string = source_config["connection_string"]
            if connection_string.startswith("@Microsoft.KeyVault"):
                secret_name = connection_string.split("/")[-2]  # Extract secret name
                connection_string = self._get_secret(secret_name)
            
            # Process each table
            for table_name in source_config["tables"]:
                logger.info(f"Processing table: {table_name}")
                
                # Build query based on ingestion mode
                if ingestion_mode == "incremental" and "incremental_column" in source_config:
                    # Calculate lookback window
                    lookback_hours = self._get_lookback_hours(source_config["refresh_frequency"])
                    cutoff_time = datetime.now() - timedelta(hours=lookback_hours)
                    
                    query = f"""
                    (SELECT * FROM {table_name} 
                     WHERE {source_config['incremental_column']} >= '{cutoff_time.strftime('%Y-%m-%d %H:%M:%S')}') as t
                    """
                else:
                    query = f"(SELECT * FROM {table_name}) as t"
                
                # Read data
                df = spark.read \\\n                    .format("jdbc") \\\n                    .option("url", connection_string) \\\n                    .option("dbtable", query) \\\n                    .option("fetchsize", "10000") \\\n                    .load()
                
                # Add metadata columns
                df_with_metadata = df \\\n                    .withColumn("_ingestion_timestamp", current_timestamp()) \\\n                    .withColumn("_source_system", lit(source_name)) \\\n                    .withColumn("_table_name", lit(table_name)) \\\n                    .withColumn("_ingestion_date", lit(self.execution_date)) \\\n                    .withColumn("_batch_id", lit(f"{source_name}_{table_name}_{int(datetime.now().timestamp())}"))
                
                # Write to Bronze layer
                bronze_path = self._create_bronze_path(source_name, table_name)
                
                df_with_metadata.write \\\n                    .format("delta") \\\n                    .mode("append") \\\n                    .option("mergeSchema", "true") \\\n                    .save(bronze_path)
                
                record_count = df.count()
                self.ingestion_stats["total_records"] += record_count
                logger.info(f"Successfully ingested {record_count} records from {table_name}")
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest from SQL source {source_name}: {str(e)}")
            self.ingestion_stats["failed_sources"].append(source_name)
            return False
            
    def ingest_rest_api(self, source_name: str, source_config: Dict[str, Any]) -> bool:
        """Ingest data from REST API source"""
        try:
            logger.info(f"Starting ingestion from API source: {source_name}")
            
            # Handle authentication
            auth_headers = {}
            if "authentication" in source_config:
                auth_config = source_config["authentication"]
                if auth_config["type"] == "oauth2":
                    # Get OAuth token
                    token = self._get_oauth_token(auth_config)
                    auth_headers["Authorization"] = f"Bearer {token}"
                elif auth_config["type"] == "bearer":
                    token = self._get_secret(auth_config["token_secret"])
                    auth_headers["Authorization"] = f"Bearer {token}"
            
            # Process each endpoint
            endpoints = source_config.get("endpoints", [source_config.get("base_url", "")])
            base_url = source_config.get("base_url", "")
            
            for endpoint in endpoints:
                logger.info(f"Processing endpoint: {endpoint}")
                
                full_url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
                
                # Add date parameters for incremental loads
                params = {}
                if ingestion_mode == "incremental":
                    lookback_hours = self._get_lookback_hours(source_config["refresh_frequency"])
                    since_date = datetime.now() - timedelta(hours=lookback_hours)
                    params["since"] = since_date.isoformat()
                
                # Make API request
                response = requests.get(full_url, headers=auth_headers, params=params)
                response.raise_for_status()
                
                # Convert to DataFrame
                data = response.json()
                if isinstance(data, dict) and "data" in data:
                    data = data["data"]  # Extract data array if wrapped
                
                if not data:
                    logger.warning(f"No data returned from endpoint: {endpoint}")
                    continue
                
                # Create Spark DataFrame
                df = spark.createDataFrame(data)
                
                # Add metadata columns
                df_with_metadata = df \\\n                    .withColumn("_ingestion_timestamp", current_timestamp()) \\\n                    .withColumn("_source_system", lit(source_name)) \\\n                    .withColumn("_endpoint", lit(endpoint)) \\\n                    .withColumn("_ingestion_date", lit(self.execution_date)) \\\n                    .withColumn("_batch_id", lit(f"{source_name}_{endpoint.replace('/', '_')}_{int(datetime.now().timestamp())}"))
                
                # Write to Bronze layer
                endpoint_name = endpoint.strip('/').replace('/', '_')
                bronze_path = self._create_bronze_path(source_name, endpoint_name)
                
                df_with_metadata.write \\\n                    .format("delta") \\\n                    .mode("append") \\\n                    .option("mergeSchema", "true") \\\n                    .save(bronze_path)
                
                record_count = df.count()
                self.ingestion_stats["total_records"] += record_count
                logger.info(f"Successfully ingested {record_count} records from {endpoint}")
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest from API source {source_name}: {str(e)}")
            self.ingestion_stats["failed_sources"].append(source_name)
            return False
            
    def ingest_file_system(self, source_name: str, source_config: Dict[str, Any]) -> bool:
        """Ingest data from file system source"""
        try:
            logger.info(f"Starting ingestion from file source: {source_name}")
            
            source_path = source_config["location"]
            file_format = source_config.get("file_format", "parquet")
            
            # Build file path with date filter for incremental loads
            if ingestion_mode == "incremental":
                # Assume files are partitioned by date
                date_filter = datetime.strptime(self.execution_date, "%Y-%m-%d")
                source_path = f"{source_path}/year={date_filter.year}/month={date_filter.month:02d}/day={date_filter.day:02d}"
            
            # Read files
            df = spark.read \\\n                .format(file_format) \\\n                .option("recursiveFileLookup", "true") \\\n                .load(source_path)
            
            # Add metadata columns
            df_with_metadata = df \\\n                .withColumn("_ingestion_timestamp", current_timestamp()) \\\n                .withColumn("_source_system", lit(source_name)) \\\n                .withColumn("_source_path", lit(source_path)) \\\n                .withColumn("_ingestion_date", lit(self.execution_date)) \\\n                .withColumn("_batch_id", lit(f"{source_name}_{int(datetime.now().timestamp())}"))
            
            # Write to Bronze layer
            bronze_path = self._create_bronze_path(source_name)
            
            df_with_metadata.write \\\n                .format("delta") \\\n                .mode("append") \\\n                .option("mergeSchema", "true") \\\n                .save(bronze_path)
            
            record_count = df.count()
            self.ingestion_stats["total_records"] += record_count
            logger.info(f"Successfully ingested {record_count} records from file system")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest from file source {source_name}: {str(e)}")
            self.ingestion_stats["failed_sources"].append(source_name)
            return False
            
    def _get_oauth_token(self, auth_config: Dict[str, Any]) -> str:
        """Get OAuth2 token"""
        client_id = self._get_secret(auth_config["client_id"])
        client_secret = self._get_secret(auth_config["client_secret"])
        
        # Implementation depends on OAuth provider
        # This is a generic example
        token_url = auth_config.get("token_url", "https://oauth2.provider.com/token")
        
        response = requests.post(token_url, data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        })
        
        response.raise_for_status()
        return response.json()["access_token"]
        
    def _get_lookback_hours(self, frequency: str) -> int:
        """Convert frequency string to lookback hours"""
        frequency_map = {
            "hourly": 2,
            "every_4_hours": 5,
            "every_6_hours": 7,
            "daily": 25,
            "daily_at_midnight": 25
        }
        return frequency_map.get(frequency, 25)  # Default to 25 hours
        
    def run_data_quality_checks(self, source_name: str) -> bool:
        """Run data quality checks on ingested data"""
        try:
            logger.info(f"Running data quality checks for: {source_name}")
            
            # Get bronze data path
            bronze_path = self._create_bronze_path(source_name)
            
            # Load data for quality checks
            df = spark.read.format("delta").load(bronze_path)
            
            # Convert to Great Expectations DataFrame
            ge_df = ge.dataset.SparkDFDataset(df)
            
            # Basic quality checks
            quality_results = []
            
            # Check for null values in critical columns
            if "_batch_id" in df.columns:
                result = ge_df.expect_column_values_to_not_be_null("_batch_id")
                quality_results.append(result)
            
            # Check for duplicate batch IDs
            if "_batch_id" in df.columns:
                result = ge_df.expect_column_values_to_be_unique("_batch_id")
                quality_results.append(result)
            
            # Check ingestion timestamp is recent
            result = ge_df.expect_column_max_to_be_between(
                "_ingestion_timestamp",
                min_value=datetime.now() - timedelta(hours=2),
                max_value=datetime.now() + timedelta(minutes=10)
            )
            quality_results.append(result)
            
            # Check if any quality checks failed
            failed_checks = [r for r in quality_results if not r.success]
            
            if failed_checks:
                logger.warning(f"Data quality checks failed for {source_name}: {len(failed_checks)} failures")
                for failure in failed_checks:
                    logger.warning(f"Failed check: {failure.expectation_config}")
                return False
            else:
                logger.info(f"All data quality checks passed for {source_name}")
                return True
                
        except Exception as e:
            logger.error(f"Data quality check failed for {source_name}: {str(e)}")
            return False
            
    def send_notification(self, success: bool):
        """Send completion notification"""
        try:
            stats = self.ingestion_stats
            status = "SUCCESS" if success else "FAILED"
            
            message = f"""
            AI-BI-Genie Data Ingestion {status}
            
            Execution Date: {self.execution_date}
            Sources Processed: {stats['sources_processed']}
            Total Records: {stats['total_records']:,}
            Failed Sources: {', '.join(stats['failed_sources']) if stats['failed_sources'] else 'None'}
            Processing Time: {stats['processing_time']:.2f} minutes
            """
            
            # Log the notification (in real implementation, send to Teams/Slack)
            logger.info(f"Notification: {message}")
            
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
            
    def run(self) -> bool:
        """Run the complete data ingestion pipeline"""
        start_time = datetime.now()
        logger.info("Starting AI-BI-Genie data ingestion pipeline")
        
        try:
            data_sources = self.config["data_sources"]
            
            # Filter sources if specified
            if source_filter:
                filtered_sources = {k: v for k, v in data_sources.items() if k in source_filter.split(",")}
                data_sources = filtered_sources
            
            success_count = 0
            
            for source_name, source_config in data_sources.items():
                logger.info(f"Processing source: {source_name}")
                
                source_type = source_config["type"]
                success = False
                
                if source_type == "sql_database":
                    success = self.ingest_sql_database(source_name, source_config)
                elif source_type == "rest_api":
                    success = self.ingest_rest_api(source_name, source_config)
                elif source_type == "file_system":
                    success = self.ingest_file_system(source_name, source_config)
                else:
                    logger.error(f"Unsupported source type: {source_type}")
                    self.ingestion_stats["failed_sources"].append(source_name)
                    continue
                
                if success:
                    # Run data quality checks
                    quality_passed = self.run_data_quality_checks(source_name)
                    if quality_passed:
                        success_count += 1
                    else:
                        self.ingestion_stats["failed_sources"].append(f"{source_name} (quality check failed)")
                
                self.ingestion_stats["sources_processed"] += 1
            
            # Calculate processing time
            end_time = datetime.now()
            self.ingestion_stats["processing_time"] = (end_time - start_time).total_seconds() / 60
            
            # Determine overall success
            overall_success = len(self.ingestion_stats["failed_sources"]) == 0
            
            # Send notification
            self.send_notification(overall_success)
            
            if overall_success:
                logger.info("Data ingestion pipeline completed successfully")
            else:
                logger.error(f"Data ingestion pipeline completed with {len(self.ingestion_stats['failed_sources'])} failures")
            
            return overall_success
            
        except Exception as e:
            logger.error(f"Data ingestion pipeline failed: {str(e)}")
            self.ingestion_stats["processing_time"] = (datetime.now() - start_time).total_seconds() / 60
            self.send_notification(False)
            raise

# COMMAND ----------

# MAGIC %md
# MAGIC ## Execute Pipeline

# COMMAND ----------

# Create and run the pipeline
pipeline = DataIngestionPipeline(config_path, execution_date)
success = pipeline.run()

# Return status for downstream jobs
dbutils.notebook.exit(json.dumps({
    "status": "success" if success else "failed",
    "stats": pipeline.ingestion_stats,
    "execution_date": execution_date
}))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Pipeline Monitoring Dashboard
# MAGIC 
# MAGIC This section provides real-time monitoring of the pipeline execution

# COMMAND ----------

# Display pipeline statistics
display(spark.sql(f"""
SELECT 
    _source_system,
    _ingestion_date,
    COUNT(*) as record_count,
    MAX(_ingestion_timestamp) as last_ingestion,
    COUNT(DISTINCT _batch_id) as batch_count
FROM delta.`{pipeline.config["data_lake_structure"]["bronze_layer"]["path"]}`
WHERE _ingestion_date = '{execution_date}'
GROUP BY _source_system, _ingestion_date
ORDER BY last_ingestion DESC
"""))

# COMMAND ----------

# MAGIC %sql
# MAGIC -- Create monitoring view for pipeline execution history
# MAGIC CREATE OR REPLACE TEMPORARY VIEW pipeline_execution_history AS
# MAGIC SELECT 
# MAGIC     _ingestion_date,
# MAGIC     _source_system,
# MAGIC     COUNT(*) as records_ingested,
# MAGIC     MIN(_ingestion_timestamp) as first_record_time,
# MAGIC     MAX(_ingestion_timestamp) as last_record_time,
# MAGIC     COUNT(DISTINCT _batch_id) as number_of_batches,
# MAGIC     ROUND((unix_timestamp(MAX(_ingestion_timestamp)) - unix_timestamp(MIN(_ingestion_timestamp))) / 60, 2) as processing_duration_minutes
# MAGIC FROM delta.`abfss://bronze@aibirgenie.dfs.core.windows.net/`
# MAGIC WHERE _ingestion_date >= date_sub(current_date(), 7)
# MAGIC GROUP BY _ingestion_date, _source_system
# MAGIC ORDER BY _ingestion_date DESC, _source_system;
# MAGIC 
# MAGIC SELECT * FROM pipeline_execution_history;