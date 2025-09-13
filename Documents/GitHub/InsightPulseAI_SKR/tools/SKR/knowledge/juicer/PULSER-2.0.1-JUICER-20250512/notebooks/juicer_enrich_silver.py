# Databricks notebook source
# MAGIC %md
# MAGIC # Juicer - Silver Layer Enrichment Pipeline
# MAGIC 
# MAGIC This notebook processes Bronze layer transcript data, performs brand mention detection, sentiment analysis, and writes enriched data to the Silver layer.
# MAGIC 
# MAGIC **Author:** InsightPulseAI Team  
# MAGIC **Version:** 1.0

# COMMAND ----------

# MAGIC %md
# MAGIC ## Configuration

# COMMAND ----------

# DBTITLE 1,Import Libraries
import pandas as pd
import numpy as np
from pyspark.sql import functions as F
from pyspark.sql.types import *
from datetime import datetime, timedelta
import mlflow
import mlflow.sklearn
import re
import json
from rapidfuzz import fuzz, process

# Configure notebook parameters
dbutils.widgets.text("date", (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "Processing Date")
dbutils.widgets.dropdown("env", "dev", ["dev", "test", "prod"], "Environment")
dbutils.widgets.dropdown("brand_threshold", "80", ["70", "75", "80", "85", "90"], "Brand Match Threshold")

# Get parameter values
processing_date = dbutils.widgets.get("date")
env = dbutils.widgets.get("env")
brand_threshold = int(dbutils.widgets.get("brand_threshold"))

print(f"Processing data for date: {processing_date}")
print(f"Environment: {env}")
print(f"Brand Match Threshold: {brand_threshold}")

# COMMAND ----------

# DBTITLE 1,Define Constants
# Delta table paths
BRONZE_TABLE_PATH = f"dbfs:/mnt/insightpulseai/bronze/transcripts"
SILVER_TABLE_PATH = f"dbfs:/mnt/insightpulseai/silver/transcripts"
BRAND_MENTIONS_PATH = f"dbfs:/mnt/insightpulseai/silver/transcript_entity_mentions"

# Schema for brand mentions
brand_mentions_schema = StructType([
    StructField("entity_id", StringType(), False),
    StructField("transcript_id", StringType(), False),
    StructField("chunk_id", StringType(), True),
    StructField("entity_type", StringType(), False),
    StructField("entity_text", StringType(), False),
    StructField("entity_normalized", StringType(), False),
    StructField("match_confidence", FloatType(), False),
    StructField("start_idx", IntegerType(), True),
    StructField("end_idx", IntegerType(), True),
    StructField("chunk_text", StringType(), True),
    StructField("sentiment_score", FloatType(), True),
    StructField("source_table", StringType(), True),
    StructField("detection_timestamp", TimestampType(), False)
])

# COMMAND ----------

# MAGIC %md
# MAGIC ## Load Brand Reference Data

# COMMAND ----------

# DBTITLE 1,Load Brand Reference Data
# Load brand reference data from catalog
brands_df = spark.sql("""
SELECT 
  brand_id,
  brand_name,
  brand_aliases,
  category,
  priority
FROM 
  insight_pulse_ai.reference.brands
WHERE
  is_active = true
""")

# Convert to pandas for easier processing
brands_pd = brands_df.toPandas()

# Create a consolidated list of brand names and their aliases
brand_lookup = {}
brand_categories = {}
brand_normalized = {}

for _, row in brands_pd.iterrows():
    # Main brand name
    brand_name = row['brand_name'].strip().lower()
    brand_id = row['brand_id']
    brand_lookup[brand_name] = brand_id
    brand_categories[brand_name] = row['category']
    brand_normalized[brand_name] = brand_name
    
    # Process aliases if present
    if row['brand_aliases'] and not pd.isna(row['brand_aliases']):
        aliases = json.loads(row['brand_aliases']) if isinstance(row['brand_aliases'], str) else row['brand_aliases']
        for alias in aliases:
            alias_lower = alias.strip().lower()
            brand_lookup[alias_lower] = brand_id
            brand_categories[alias_lower] = row['category']
            brand_normalized[alias_lower] = brand_name

# Display the brand lookup dictionary
print(f"Loaded {len(brands_pd)} brands with {len(brand_lookup)} total names/aliases")
display(brands_pd)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Load Bronze Transcripts

# COMMAND ----------

# DBTITLE 1,Load Bronze Transcripts
# Load bronze transcription data for the specified date
bronze_df = spark.sql(f"""
SELECT 
  t.transcript_id,
  t.interaction_id,
  t.agent_id,
  t.customer_id,
  t.chunk_id,
  t.chunk_text,
  t.chunk_start_time,
  t.chunk_end_time,
  t.speaker_type,
  t.chunk_index,
  t.processing_timestamp,
  t.source_file,
  t.source_table
FROM 
  insight_pulse_ai.bronze.transcripts t
WHERE 
  DATE(t.processing_timestamp) = '{processing_date}'
  AND t.chunk_text IS NOT NULL
  AND LENGTH(t.chunk_text) > 0
""")

# Get count of bronze records
bronze_count = bronze_df.count()
print(f"Loaded {bronze_count} bronze transcript chunks for date {processing_date}")

# Get sample of data
display(bronze_df.limit(5))

# Exit if no data found
if bronze_count == 0:
    dbutils.notebook.exit("No bronze transcripts found for the specified date.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Brand Mention Detection

# COMMAND ----------

# DBTITLE 1,Define Brand Detection Function
def detect_brands_in_text(text, brands_dict=brand_lookup, normalized_dict=brand_normalized, threshold=80):
    """
    Detect brand mentions in text using fuzzy matching.
    
    Args:
        text (str): The text to search for brand mentions
        brands_dict (dict): Dictionary mapping brand names/aliases to brand IDs
        normalized_dict (dict): Dictionary mapping brand names/aliases to normalized brand names
        threshold (int): Fuzzy matching threshold (0-100)
        
    Returns:
        list: List of dictionaries containing brand mention details
    """
    if not text or pd.isna(text):
        return []
    
    text = text.lower()
    results = []
    brand_keys = list(brands_dict.keys())
    
    # First pass - exact matches
    exact_matches = {}
    for brand in brand_keys:
        brand_lower = brand.lower()
        if brand_lower in text:
            # Find all occurrences
            start_idx = 0
            while True:
                start_idx = text.find(brand_lower, start_idx)
                if start_idx == -1:
                    break
                
                end_idx = start_idx + len(brand_lower)
                match_id = f"{start_idx}_{end_idx}"
                
                # Check if this is a better (longer) match than previously found at this position
                if match_id not in exact_matches or len(brand_lower) > len(exact_matches[match_id]['entity_text']):
                    exact_matches[match_id] = {
                        'entity_text': brand_lower,
                        'entity_normalized': normalized_dict[brand_lower],
                        'entity_id': brands_dict[brand_lower],
                        'start_idx': start_idx,
                        'end_idx': end_idx,
                        'match_confidence': 100.0
                    }
                
                start_idx += 1
    
    # Add exact matches to results
    for match_id, match_data in exact_matches.items():
        results.append(match_data)
    
    # Second pass - fuzzy matches for longer text
    if len(text.split()) > 3:  # Only do fuzzy matching for longer texts
        # Extract phrases that might be brands (2-3 words)
        words = text.split()
        phrases = []
        for i in range(len(words)):
            phrases.append(words[i])
            if i < len(words) - 1:
                phrases.append(f"{words[i]} {words[i+1]}")
            if i < len(words) - 2:
                phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")
        
        # Deduplicate phrases
        phrases = list(set(phrases))
        
        # Check each phrase against our brand list
        for phrase in phrases:
            # Skip very short phrases
            if len(phrase) < 3:
                continue
                
            # Skip phrases already found in exact matches
            skip = False
            for match in results:
                if phrase in match['entity_text'] or match['entity_text'] in phrase:
                    skip = True
                    break
            
            if skip:
                continue
                
            # Find fuzzy matches
            matches = process.extractBests(phrase, brand_keys, scorer=fuzz.token_sort_ratio, 
                                          score_cutoff=threshold, limit=1)
            
            for match, score in matches:
                # Find the position of the phrase in the text
                start_idx = text.find(phrase)
                if start_idx != -1:
                    end_idx = start_idx + len(phrase)
                    
                    # Check for overlap with existing matches
                    overlap = False
                    for existing in results:
                        if (start_idx <= existing['start_idx'] <= end_idx or 
                            start_idx <= existing['end_idx'] <= end_idx or
                            existing['start_idx'] <= start_idx <= existing['end_idx'] or
                            existing['start_idx'] <= end_idx <= existing['end_idx']):
                            overlap = True
                            break
                    
                    if not overlap:
                        results.append({
                            'entity_text': phrase,
                            'entity_normalized': normalized_dict[match],
                            'entity_id': brands_dict[match],
                            'start_idx': start_idx,
                            'end_idx': end_idx,
                            'match_confidence': float(score)
                        })
    
    return results

# Sample test run
sample_text = "I really love having my morning coffee at Jollibee. Their breakfast is better than MacDonalds."
sample_results = detect_brands_in_text(sample_text, threshold=brand_threshold)
print(f"Sample text: {sample_text}")
print(f"Detected brands: {json.dumps(sample_results, indent=2)}")

# COMMAND ----------

# DBTITLE 1,Process Transcripts with Brand Detection
# Convert to pandas for brand detection
chunks_pd = bronze_df.select(
    "transcript_id", "chunk_id", "chunk_text", "source_table"
).toPandas()

# Initialize results list
brand_mentions = []

# Process each transcript chunk
for _, row in chunks_pd.iterrows():
    transcript_id = row['transcript_id']
    chunk_id = row['chunk_id']
    chunk_text = row['chunk_text']
    source_table = row['source_table']
    
    # Detect brands in the chunk
    chunk_brands = detect_brands_in_text(chunk_text, threshold=brand_threshold)
    
    # Add detected brands to results
    for idx, brand in enumerate(chunk_brands):
        brand_mentions.append({
            'entity_id': f"{transcript_id}_{chunk_id}_{idx}" if chunk_id else f"{transcript_id}_{idx}",
            'transcript_id': transcript_id,
            'chunk_id': chunk_id,
            'entity_type': 'BRAND',
            'entity_text': brand['entity_text'],
            'entity_normalized': brand['entity_normalized'],
            'match_confidence': brand['match_confidence'],
            'start_idx': brand['start_idx'],
            'end_idx': brand['end_idx'],
            'chunk_text': chunk_text,
            'sentiment_score': None,  # Will be filled in the next step
            'source_table': source_table,
            'detection_timestamp': datetime.now()
        })

# Convert results to DataFrame
if brand_mentions:
    brand_mentions_pd = pd.DataFrame(brand_mentions)
    brand_mentions_spark = spark.createDataFrame(brand_mentions_pd, schema=brand_mentions_schema)
    
    print(f"Detected {len(brand_mentions)} brand mentions in {len(chunks_pd)} transcript chunks")
    display(brand_mentions_spark.limit(10))
else:
    print("No brand mentions detected")
    brand_mentions_spark = spark.createDataFrame([], schema=brand_mentions_schema)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Sentiment Analysis

# COMMAND ----------

# DBTITLE 1,Add Sentiment Analysis
# In a production environment, we would use a proper sentiment model
# For demo purposes, we'll simulate sentiment scores

# Function to generate a simulated sentiment score based on the text
def generate_sentiment_score(text, entity):
    """Generate a simulated sentiment score between 0 and 1"""
    if not text or pd.isna(text):
        return 0.5
    
    text = text.lower()
    entity = entity.lower()
    
    # Basic sentiment words
    positive_words = ['good', 'great', 'excellent', 'awesome', 'love', 'best', 'delicious', 'enjoy', 'perfect', 'recommend']
    negative_words = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'worst', 'hate', 'dislike', 'avoid']
    
    # Find the context around the entity (10 words before and after)
    words = text.split()
    try:
        # Find position of entity in words
        for i, word in enumerate(words):
            if entity in word:
                entity_pos = i
                break
        else:
            entity_pos = len(words) // 2  # Default to middle if not found
        
        # Extract context window
        start = max(0, entity_pos - 10)
        end = min(len(words), entity_pos + 10)
        context = ' '.join(words[start:end])
    except:
        context = text
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in context)
    negative_count = sum(1 for word in negative_words if word in context)
    
    # Calculate base sentiment
    if positive_count == 0 and negative_count == 0:
        base_sentiment = 0.5  # Neutral
    else:
        total = positive_count + negative_count
        base_sentiment = (0.5 + 0.5 * (positive_count - negative_count) / total)
    
    # Add some randomness to make it more realistic
    sentiment = base_sentiment + (np.random.random() - 0.5) * 0.2
    
    # Clamp to [0, 1]
    return max(0, min(1, sentiment))

# Apply sentiment analysis if we have brand mentions
if 'brand_mentions_pd' in locals() and not brand_mentions_pd.empty:
    brand_mentions_pd['sentiment_score'] = brand_mentions_pd.apply(
        lambda row: generate_sentiment_score(row['chunk_text'], row['entity_text']), axis=1
    )
    
    # Update Spark DataFrame
    brand_mentions_spark = spark.createDataFrame(brand_mentions_pd, schema=brand_mentions_schema)
    
    print("Added sentiment scores to brand mentions")
    display(brand_mentions_spark.select("entity_text", "entity_normalized", "match_confidence", "sentiment_score").limit(10))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Write to Silver Layer

# COMMAND ----------

# DBTITLE 1,Write Brand Mentions to Silver Layer
# Write brand mentions to Delta table
if 'brand_mentions_spark' in locals() and brand_mentions_spark.count() > 0:
    # Write to Delta table
    brand_mentions_spark.write \
        .format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .save(BRAND_MENTIONS_PATH)
    
    # Create table if it doesn't exist
    spark.sql(f"""
    CREATE TABLE IF NOT EXISTS insight_pulse_ai.silver.transcript_entity_mentions
    USING DELTA
    LOCATION '{BRAND_MENTIONS_PATH}'
    """)
    
    print(f"Successfully wrote {brand_mentions_spark.count()} brand mentions to Silver layer")
else:
    print("No brand mentions to write")

# COMMAND ----------

# DBTITLE 1,Process Transcript Text for Silver Layer
# Enrich the bronze data and write to Silver layer
silver_df = bronze_df.withColumn(
    "processing_level", F.lit("silver")
).withColumn(
    "silver_timestamp", F.current_timestamp()
)

# Write to Delta table
silver_df.write \
    .format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save(SILVER_TABLE_PATH)

# Create table if it doesn't exist
spark.sql(f"""
CREATE TABLE IF NOT EXISTS insight_pulse_ai.silver.transcripts
USING DELTA
LOCATION '{SILVER_TABLE_PATH}'
""")

print(f"Successfully wrote {silver_df.count()} enriched transcript records to Silver layer")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Summary and MLflow Logging

# COMMAND ----------

# DBTITLE 1,Log Process Metrics to MLflow
# Start a new MLflow run
mlflow.start_run(run_name=f"juicer_silver_enrichment_{processing_date}")

# Log parameters
mlflow.log_param("processing_date", processing_date)
mlflow.log_param("environment", env)
mlflow.log_param("brand_match_threshold", brand_threshold)

# Log metrics
mlflow.log_metric("bronze_records_processed", bronze_count)
mlflow.log_metric("brand_mentions_extracted", len(brand_mentions) if brand_mentions else 0)
if 'brand_mentions_pd' in locals() and not brand_mentions_pd.empty:
    avg_confidence = float(brand_mentions_pd['match_confidence'].mean())
    avg_sentiment = float(brand_mentions_pd['sentiment_score'].mean())
    mlflow.log_metric("avg_brand_match_confidence", avg_confidence)
    mlflow.log_metric("avg_sentiment_score", avg_sentiment)

# Create artifact
summary = {
    "processing_date": processing_date,
    "bronze_records_processed": bronze_count,
    "brand_mentions_extracted": len(brand_mentions) if brand_mentions else 0,
    "status": "success",
    "timestamp": datetime.now().isoformat()
}

# Save summary as JSON
with open("/tmp/processing_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

# Log artifact
mlflow.log_artifact("/tmp/processing_summary.json")

# End the MLflow run
mlflow.end_run()

print("Process complete. Summary logged to MLflow.")

# COMMAND ----------

# Return success
dbutils.notebook.exit(json.dumps({"status": "success", "processed_chunks": bronze_count, "brand_mentions": len(brand_mentions) if brand_mentions else 0}))