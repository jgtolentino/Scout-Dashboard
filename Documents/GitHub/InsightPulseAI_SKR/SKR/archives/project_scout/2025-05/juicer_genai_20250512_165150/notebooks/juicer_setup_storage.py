# Databricks notebook source
# MAGIC %md
# MAGIC # Juicer Setup Storage
# MAGIC 
# MAGIC This notebook configures the necessary storage mounts and initializes the database structure for Juicer.
# MAGIC 
# MAGIC **Author:** InsightPulseAI Team  
# MAGIC **Version:** 1.0

# COMMAND ----------

# DBTITLE 1,Configuration Parameters
# Replace these with your actual values
storage_account_name = "insightpulseaistorage"
container_name = "insights"
storage_account_key = "YOUR_STORAGE_ACCOUNT_KEY"  # Replace with your key or use Azure Key Vault

# Mount point in Databricks
mount_point = "/mnt/insightpulseai"

# Database and schema names
database_name = "insight_pulse_ai"
bronze_schema = "bronze"
silver_schema = "silver"
gold_schema = "gold"

# COMMAND ----------

# DBTITLE 1,Mount Storage
# Check if already mounted
mounts = dbutils.fs.mounts()
already_mounted = False

for mount in mounts:
  if mount.mountPoint == mount_point:
    already_mounted = True
    print(f"Storage is already mounted at {mount_point}")
    break

# Mount storage if not already mounted
if not already_mounted:
  try:
    dbutils.fs.mount(
      source = f"wasbs://{container_name}@{storage_account_name}.blob.core.windows.net/",
      mount_point = mount_point,
      extra_configs = {
        f"fs.azure.account.key.{storage_account_name}.blob.core.windows.net": storage_account_key
      }
    )
    print(f"Storage mounted successfully at {mount_point}")
  except Exception as e:
    print(f"Error mounting storage: {e}")

# COMMAND ----------

# DBTITLE 1,Create Database and Schemas
# Create the main database
spark.sql(f"CREATE DATABASE IF NOT EXISTS {database_name}")
print(f"Database '{database_name}' created or already exists")

# Create schemas
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {database_name}.{bronze_schema}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {database_name}.{silver_schema}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {database_name}.{gold_schema}")

print(f"Schemas created or already exist: {bronze_schema}, {silver_schema}, {gold_schema}")

# COMMAND ----------

# DBTITLE 1,Create Directory Structure
# Create directories for each layer
bronze_path = f"{mount_point}/{bronze_schema}"
silver_path = f"{mount_point}/{silver_schema}"
gold_path = f"{mount_point}/{gold_schema}"
reference_path = f"{mount_point}/reference"

# Create the directories if they don't exist
dbutils.fs.mkdirs(bronze_path)
dbutils.fs.mkdirs(silver_path)
dbutils.fs.mkdirs(gold_path)
dbutils.fs.mkdirs(reference_path)

print(f"Directory structure created at {mount_point}")

# COMMAND ----------

# DBTITLE 1,Create Bronze Tables
# Create transcript table in Bronze layer
bronze_transcripts_sql = f"""
CREATE TABLE IF NOT EXISTS {database_name}.{bronze_schema}.transcripts (
  transcript_id STRING,
  interaction_id STRING,
  agent_id STRING,
  customer_id STRING,
  chunk_id STRING,
  chunk_text STRING,
  chunk_start_time TIMESTAMP,
  chunk_end_time TIMESTAMP,
  speaker_type STRING,
  chunk_index INT,
  processing_timestamp TIMESTAMP,
  source_file STRING,
  source_table STRING,
  bronze_batch_id STRING
)
USING DELTA
LOCATION '{bronze_path}/transcripts'
"""

spark.sql(bronze_transcripts_sql)
print(f"Bronze layer table '{database_name}.{bronze_schema}.transcripts' created or already exists")

# COMMAND ----------

# DBTITLE 1,Create Silver Tables
# Create transcript entity mentions table in Silver layer
silver_entity_mentions_sql = f"""
CREATE TABLE IF NOT EXISTS {database_name}.{silver_schema}.transcript_entity_mentions (
  entity_id STRING,
  transcript_id STRING,
  chunk_id STRING,
  entity_type STRING,
  entity_text STRING,
  entity_normalized STRING,
  match_confidence FLOAT,
  start_idx INT,
  end_idx INT,
  chunk_text STRING,
  sentiment_score FLOAT,
  source_table STRING,
  detection_timestamp TIMESTAMP
)
USING DELTA
LOCATION '{silver_path}/transcript_entity_mentions'
"""

spark.sql(silver_entity_mentions_sql)
print(f"Silver layer table '{database_name}.{silver_schema}.transcript_entity_mentions' created or already exists")

# COMMAND ----------

# DBTITLE 1,Create Gold Tables
# Create transcript insights table in Gold layer
gold_transcript_insights_sql = f"""
CREATE TABLE IF NOT EXISTS {database_name}.{gold_schema}.transcript_insights (
  insight_id STRING,
  insight_type STRING,
  transcript_id STRING,
  interaction_id STRING,
  agent_id STRING,
  customer_id STRING,
  insight_value STRING,
  insight_score FLOAT,
  insight_context STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
LOCATION '{gold_path}/transcript_insights'
"""

spark.sql(gold_transcript_insights_sql)
print(f"Gold layer table '{database_name}.{gold_schema}.transcript_insights' created or already exists")

# COMMAND ----------

# DBTITLE 1,Create Reference Tables
# Create brands reference table
brands_reference_sql = f"""
CREATE TABLE IF NOT EXISTS {database_name}.reference.brands (
  brand_id STRING,
  brand_name STRING,
  brand_aliases STRING,
  category STRING,
  priority INT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
LOCATION '{reference_path}/brands'
"""

spark.sql(brands_reference_sql)
print(f"Reference table '{database_name}.reference.brands' created or already exists")

# COMMAND ----------

# DBTITLE 1,Insert Sample Brand Data (if table is empty)
# Check if the brands table is empty
brand_count = spark.sql(f"SELECT COUNT(*) as count FROM {database_name}.reference.brands").collect()[0]['count']

if brand_count == 0:
  # Insert sample data
  sample_brands_sql = f"""
  INSERT INTO {database_name}.reference.brands VALUES
  ('B001', 'Globe Telecom', '["Globe", "Globe PH", "Globe Philippines"]', 'Telecommunications', 1, true, current_timestamp(), current_timestamp()),
  ('B002', 'Smart Communications', '["Smart", "Smart PH", "Smart Philippines"]', 'Telecommunications', 2, true, current_timestamp(), current_timestamp()),
  ('B003', 'PLDT', '["PLDT Inc", "Philippine Long Distance Telephone"]', 'Telecommunications', 3, true, current_timestamp(), current_timestamp()),
  ('B004', 'Sun Cellular', '["Sun", "Sun PH"]', 'Telecommunications', 4, true, current_timestamp(), current_timestamp()),
  ('B005', 'Jollibee', '["JFC", "Jollibee Foods", "Jollibee PH"]', 'Food', 1, true, current_timestamp(), current_timestamp()),
  ('B006', 'McDonald''s', '["McDo", "McD", "Mickey D''s"]', 'Food', 2, true, current_timestamp(), current_timestamp()),
  ('B007', 'KFC', '["Kentucky Fried Chicken"]', 'Food', 3, true, current_timestamp(), current_timestamp()),
  ('B008', 'Wendy''s', '["Wendys"]', 'Food', 4, true, current_timestamp(), current_timestamp()),
  ('B009', 'Selecta', '["Selecta Ice Cream"]', 'Food', 5, true, current_timestamp(), current_timestamp()),
  ('B010', 'BDO', '["Banco de Oro", "BDO Unibank"]', 'Banking', 1, true, current_timestamp(), current_timestamp())
  """
  
  spark.sql(sample_brands_sql)
  print(f"Inserted 10 sample brands into reference.brands")
else:
  print(f"Brands table already contains {brand_count} records. Skipping sample data insertion.")

# COMMAND ----------

# DBTITLE 1,Create Medallion Views
# Create a view to join brands with mentions
brand_mentions_view_sql = f"""
CREATE OR REPLACE VIEW {database_name}.gold.brand_mentions_summary AS
SELECT 
  b.brand_name,
  b.category,
  COUNT(*) AS mention_count,
  AVG(e.sentiment_score) AS avg_sentiment,
  MAX(e.detection_timestamp) AS latest_mention
FROM 
  {database_name}.{silver_schema}.transcript_entity_mentions e
JOIN 
  {database_name}.reference.brands b ON e.entity_normalized = b.brand_name
WHERE
  e.entity_type = 'BRAND'
GROUP BY 
  b.brand_name, b.category
"""

spark.sql(brand_mentions_view_sql)
print(f"Gold view '{database_name}.gold.brand_mentions_summary' created")

# COMMAND ----------

# DBTITLE 1,Setup Summary
print("\n" + "="*80)
print("JUICER STORAGE SETUP COMPLETE")
print("="*80)
print(f"Database: {database_name}")
print(f"Schemas: {bronze_schema}, {silver_schema}, {gold_schema}, reference")
print(f"Mount point: {mount_point}")
print("\nTables created:")
print(f"- {database_name}.{bronze_schema}.transcripts")
print(f"- {database_name}.{silver_schema}.transcript_entity_mentions")
print(f"- {database_name}.{gold_schema}.transcript_insights")
print(f"- {database_name}.reference.brands")
print("\nViews created:")
print(f"- {database_name}.gold.brand_mentions_summary")
print("\nNext steps:")
print("1. Configure security and access control")
print("2. Set up job schedules for data processing")
print("3. Connect to Azure SQL Database")
print("="*80)