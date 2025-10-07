-- Databricks notebook source
-- MAGIC %md
-- MAGIC # Juicer - Bronze Layer Ingestion Pipeline
-- MAGIC 
-- MAGIC This notebook connects to Azure SQL Database and ingests transcript data into the Bronze layer.
-- MAGIC 
-- MAGIC **Author:** InsightPulseAI Team  
-- MAGIC **Version:** 1.0

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Configuration

-- COMMAND ----------

-- DBTITLE 1,Set Parameters
-- MAGIC %python
-- MAGIC # Configure notebook parameters
-- MAGIC from datetime import datetime, timedelta
-- MAGIC 
-- MAGIC # Define widget defaults
-- MAGIC default_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
-- MAGIC 
-- MAGIC # Add widgets for parameters
-- MAGIC dbutils.widgets.text("date", default_date, "Processing Date (YYYY-MM-DD)")
-- MAGIC dbutils.widgets.dropdown("env", "dev", ["dev", "test", "prod"], "Environment")
-- MAGIC dbutils.widgets.text("batch_size", "10000", "Batch Size")
-- MAGIC 
-- MAGIC # Get parameter values
-- MAGIC processing_date = dbutils.widgets.get("date")
-- MAGIC env = dbutils.widgets.get("env")
-- MAGIC batch_size = int(dbutils.widgets.get("batch_size"))
-- MAGIC 
-- MAGIC print(f"Processing data for date: {processing_date}")
-- MAGIC print(f"Environment: {env}")
-- MAGIC print(f"Batch Size: {batch_size}")
-- MAGIC 
-- MAGIC # Set global variables for SQL access
-- MAGIC spark.conf.set("processing.date", processing_date)

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Define External Tables

-- COMMAND ----------

-- DBTITLE 1,Create Schema
-- Create the bronze schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS insight_pulse_ai.bronze;

-- COMMAND ----------

-- DBTITLE 1,Define External Connection
-- MAGIC %python
-- MAGIC # Define JDBC connection parameters
-- MAGIC jdbc_url = "jdbc:sqlserver://sqltbwaprojectscoutserver.database.windows.net:1433;database=SQL-TBWA-ProjectScout-Reporting-Prod"
-- MAGIC 
-- MAGIC # In production, these would be stored in Azure Key Vault and accessed securely
-- MAGIC jdbc_user = "TBWA"
-- MAGIC jdbc_password = "R@nd0mPA$2025!"
-- MAGIC 
-- MAGIC # Create connection properties dictionary
-- MAGIC connection_properties = {
-- MAGIC     "user": jdbc_user,
-- MAGIC     "password": jdbc_password,
-- MAGIC     "driver": "com.microsoft.sqlserver.jdbc.SQLServerDriver"
-- MAGIC }
-- MAGIC 
-- MAGIC # Test the connection by querying a small amount of data
-- MAGIC try:
-- MAGIC     test_df = spark.read \
-- MAGIC         .jdbc(url=jdbc_url, 
-- MAGIC                table="(SELECT TOP 1 * FROM SalesInteractionTranscripts) test_query", 
-- MAGIC                properties=connection_properties)
-- MAGIC     
-- MAGIC     print("Connection test successful!")
-- MAGIC     print(f"Retrieved {test_df.count()} rows")
-- MAGIC except Exception as e:
-- MAGIC     print(f"Connection test failed: {str(e)}")
-- MAGIC     dbutils.notebook.exit(f"Connection failed: {str(e)}")

-- COMMAND ----------

-- DBTITLE 1,Query SQL Server for Transcript Data
-- MAGIC %python
-- MAGIC # Define query to extract transcripts for the processing date
-- MAGIC # In this example, we're using a simulated date field as the source data might be structured differently
-- MAGIC 
-- MAGIC # Function to create a unique chunk ID from other fields
-- MAGIC def generate_chunk_id(row):
-- MAGIC     base = f"{row['TranscriptID']}_{row['InteractionID']}_{row['ChunkIndex']}"
-- MAGIC     return base
-- MAGIC 
-- MAGIC # Query transcripts from SQL Server
-- MAGIC query = f"""
-- MAGIC (
-- MAGIC     SELECT 
-- MAGIC         t.ID AS TranscriptID,
-- MAGIC         t.InteractionID,
-- MAGIC         t.AgentID,
-- MAGIC         t.CustomerID,
-- MAGIC         tc.ID AS ChunkID,
-- MAGIC         tc.ChunkText,
-- MAGIC         tc.StartTime AS ChunkStartTime,
-- MAGIC         tc.EndTime AS ChunkEndTime,
-- MAGIC         tc.SpeakerType,
-- MAGIC         tc.ChunkIndex,
-- MAGIC         GETDATE() AS ProcessingTimestamp,
-- MAGIC         t.SourceFile,
-- MAGIC         'SalesInteractionTranscripts' AS SourceTable
-- MAGIC     FROM 
-- MAGIC         SalesInteractionTranscripts t
-- MAGIC         JOIN TranscriptionChunks tc ON t.ID = tc.TranscriptID
-- MAGIC     WHERE 
-- MAGIC         CONVERT(DATE, t.CreatedAt) = '{processing_date}'
-- MAGIC         OR CONVERT(DATE, t.UpdatedAt) = '{processing_date}'
-- MAGIC ) AS source_query
-- MAGIC """
-- MAGIC 
-- MAGIC # Read data from SQL Server
-- MAGIC try:
-- MAGIC     transcript_df = spark.read \
-- MAGIC         .jdbc(url=jdbc_url, 
-- MAGIC                table=query, 
-- MAGIC                properties=connection_properties)
-- MAGIC     
-- MAGIC     # Add chunk_id if it doesn't exist
-- MAGIC     if 'ChunkID' not in transcript_df.columns or transcript_df.filter("ChunkID IS NULL").count() > 0:
-- MAGIC         from pyspark.sql.functions import udf, col
-- MAGIC         from pyspark.sql.types import StringType
-- MAGIC         
-- MAGIC         generate_chunk_id_udf = udf(generate_chunk_id, StringType())
-- MAGIC         transcript_df = transcript_df.withColumn(
-- MAGIC             "ChunkID", 
-- MAGIC             generate_chunk_id_udf(transcript_df)
-- MAGIC         )
-- MAGIC     
-- MAGIC     # Show data stats
-- MAGIC     count = transcript_df.count()
-- MAGIC     print(f"Retrieved {count} transcript chunks for date {processing_date}")
-- MAGIC     
-- MAGIC     # Show sample data
-- MAGIC     display(transcript_df.limit(5))
-- MAGIC     
-- MAGIC except Exception as e:
-- MAGIC     print(f"Error retrieving transcripts: {str(e)}")
-- MAGIC     dbutils.notebook.exit(f"Transcript retrieval failed: {str(e)}")

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Create Bronze Delta Table

-- COMMAND ----------

-- DBTITLE 1,Define Bronze Schema
-- Create bronze Delta table
CREATE TABLE IF NOT EXISTS insight_pulse_ai.bronze.transcripts (
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
LOCATION 'dbfs:/mnt/insightpulseai/bronze/transcripts';

-- COMMAND ----------

-- DBTITLE 1,Write Data to Bronze Layer
-- MAGIC %python
-- MAGIC # Generate a batch ID for this processing run
-- MAGIC import uuid
-- MAGIC bronze_batch_id = f"bronze_ingest_{processing_date.replace('-', '')}_{uuid.uuid4().hex[:8]}"
-- MAGIC 
-- MAGIC # Add bronze_batch_id to the DataFrame
-- MAGIC from pyspark.sql.functions import lit
-- MAGIC transcript_df = transcript_df.withColumn("bronze_batch_id", lit(bronze_batch_id))
-- MAGIC 
-- MAGIC # Rename columns to match our schema
-- MAGIC column_mapping = {
-- MAGIC     "TranscriptID": "transcript_id",
-- MAGIC     "InteractionID": "interaction_id",
-- MAGIC     "AgentID": "agent_id",
-- MAGIC     "CustomerID": "customer_id",
-- MAGIC     "ChunkID": "chunk_id",
-- MAGIC     "ChunkText": "chunk_text",
-- MAGIC     "ChunkStartTime": "chunk_start_time",
-- MAGIC     "ChunkEndTime": "chunk_end_time",
-- MAGIC     "SpeakerType": "speaker_type",
-- MAGIC     "ChunkIndex": "chunk_index",
-- MAGIC     "ProcessingTimestamp": "processing_timestamp",
-- MAGIC     "SourceFile": "source_file",
-- MAGIC     "SourceTable": "source_table"
-- MAGIC }
-- MAGIC 
-- MAGIC # Rename columns
-- MAGIC for old_col, new_col in column_mapping.items():
-- MAGIC     if old_col in transcript_df.columns:
-- MAGIC         transcript_df = transcript_df.withColumnRenamed(old_col, new_col)
-- MAGIC 
-- MAGIC # Write to Delta table
-- MAGIC try:
-- MAGIC     transcript_df.write \
-- MAGIC         .format("delta") \
-- MAGIC         .mode("append") \
-- MAGIC         .option("mergeSchema", "true") \
-- MAGIC         .saveAsTable("insight_pulse_ai.bronze.transcripts")
-- MAGIC     
-- MAGIC     print(f"Successfully wrote {transcript_df.count()} records to bronze.transcripts")
-- MAGIC     print(f"Batch ID: {bronze_batch_id}")
-- MAGIC     
-- MAGIC except Exception as e:
-- MAGIC     print(f"Error writing to bronze layer: {str(e)}")
-- MAGIC     dbutils.notebook.exit(f"Bronze layer write failed: {str(e)}")

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Validate Bronze Layer Data

-- COMMAND ----------

-- DBTITLE 1,Count Records by Batch
-- Count records by batch ID
SELECT 
  bronze_batch_id,
  COUNT(*) as record_count
FROM 
  insight_pulse_ai.bronze.transcripts
WHERE 
  DATE(processing_timestamp) = DATE('${processing.date}')
GROUP BY 
  bronze_batch_id
ORDER BY 
  bronze_batch_id;

-- COMMAND ----------

-- DBTITLE 1,Check for Missing Data
-- Check for any chunks with missing text
SELECT 
  COUNT(*) as missing_text_count
FROM 
  insight_pulse_ai.bronze.transcripts
WHERE 
  DATE(processing_timestamp) = DATE('${processing.date}')
  AND (chunk_text IS NULL OR LENGTH(chunk_text) = 0);

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Summary and Logging

-- COMMAND ----------

-- DBTITLE 1,Process Summary
-- MAGIC %python
-- MAGIC # Create a summary of the processing run
-- MAGIC import json
-- MAGIC from datetime import datetime
-- MAGIC import mlflow
-- MAGIC 
-- MAGIC # Get record counts
-- MAGIC total_count = transcript_df.count()
-- MAGIC missing_text_count = transcript_df.filter("chunk_text IS NULL OR LENGTH(chunk_text) = 0").count()
-- MAGIC valid_count = total_count - missing_text_count
-- MAGIC 
-- MAGIC # Create summary dictionary
-- MAGIC summary = {
-- MAGIC     "processing_date": processing_date,
-- MAGIC     "environment": env,
-- MAGIC     "bronze_batch_id": bronze_batch_id,
-- MAGIC     "total_records": total_count,
-- MAGIC     "valid_records": valid_count,
-- MAGIC     "missing_text_records": missing_text_count,
-- MAGIC     "status": "success",
-- MAGIC     "timestamp": datetime.now().isoformat()
-- MAGIC }
-- MAGIC 
-- MAGIC # Display summary
-- MAGIC print(json.dumps(summary, indent=2))
-- MAGIC 
-- MAGIC # Log to MLflow
-- MAGIC mlflow.start_run(run_name=f"juicer_bronze_ingest_{processing_date}")
-- MAGIC 
-- MAGIC mlflow.log_param("processing_date", processing_date)
-- MAGIC mlflow.log_param("environment", env)
-- MAGIC mlflow.log_param("bronze_batch_id", bronze_batch_id)
-- MAGIC 
-- MAGIC mlflow.log_metric("total_records", total_count)
-- MAGIC mlflow.log_metric("valid_records", valid_count)
-- MAGIC mlflow.log_metric("missing_text_records", missing_text_count)
-- MAGIC 
-- MAGIC # Save summary as JSON
-- MAGIC with open("/tmp/bronze_processing_summary.json", "w") as f:
-- MAGIC     json.dump(summary, f, indent=2)
-- MAGIC 
-- MAGIC # Log artifact
-- MAGIC mlflow.log_artifact("/tmp/bronze_processing_summary.json")
-- MAGIC 
-- MAGIC # End the MLflow run
-- MAGIC mlflow.end_run()
-- MAGIC 
-- MAGIC # Return success
-- MAGIC dbutils.notebook.exit(json.dumps({"status": "success", "bronze_batch_id": bronze_batch_id, "record_count": total_count}))