"""
Pytest fixtures for DLT pipeline testing.
These fixtures provide mock data and Spark context for testing DLT pipelines.
"""
import os
import json
import pytest
import datetime
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, TimestampType, IntegerType, DoubleType, BooleanType, ArrayType

# Constants
FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
BRONZE_FIXTURE_DIR = os.path.join(FIXTURE_DIR, "bronze")
SILVER_FIXTURE_DIR = os.path.join(FIXTURE_DIR, "silver")
GOLD_FIXTURE_DIR = os.path.join(FIXTURE_DIR, "gold")

# Schemas
BRONZE_EVENT_SCHEMA = StructType([
    StructField("event_id", StringType(), False),
    StructField("timestamp", TimestampType(), False),
    StructField("event_type", StringType(), True),
    StructField("device_id", StringType(), True),
    StructField("user_id", StringType(), True),
    StructField("session_id", StringType(), True),
    StructField("page_url", StringType(), True),
    StructField("referrer", StringType(), True),
    StructField("event_data", StringType(), True),
    StructField("processed_at", TimestampType(), True)
])

BRONZE_TRANSCRIPT_SCHEMA = StructType([
    StructField("transcript_id", StringType(), False),
    StructField("conversation_id", StringType(), True),
    StructField("timestamp", TimestampType(), True),
    StructField("transcript_text", StringType(), True),
    StructField("agent_id", StringType(), True),
    StructField("customer_id", StringType(), True),
    StructField("channel", StringType(), True),
    StructField("processed_at", TimestampType(), True)
])

BRONZE_DEVICE_SCHEMA = StructType([
    StructField("device_id", StringType(), False),
    StructField("device_type", StringType(), True),
    StructField("os", StringType(), True),
    StructField("browser", StringType(), True),
    StructField("region", StringType(), True),
    StructField("last_seen", TimestampType(), True),
    StructField("properties", StringType(), True),
    StructField("processed_at", TimestampType(), True)
])

SILVER_ENRICHED_EVENT_SCHEMA = StructType([
    StructField("enriched_event_id", StringType(), False),
    StructField("source_event_id", StringType(), True),
    StructField("timestamp", TimestampType(), True),
    StructField("event_type", StringType(), True),
    StructField("device_id", StringType(), True),
    StructField("user_id", StringType(), True),
    StructField("session_id", StringType(), True),
    StructField("event_data", StringType(), True),
    StructField("device_type", StringType(), True),
    StructField("region", StringType(), True),
    StructField("user_segment", StringType(), True),
    StructField("processed_at", TimestampType(), True)
])

SILVER_BRAND_MENTION_SCHEMA = StructType([
    StructField("mention_id", StringType(), False),
    StructField("event_id", StringType(), True),
    StructField("transcript_id", StringType(), True),
    StructField("brand_id", StringType(), False),
    StructField("brand_name", StringType(), True),
    StructField("mention_text", StringType(), True),
    StructField("confidence_score", DoubleType(), True),
    StructField("sentiment_score", DoubleType(), True),
    StructField("timestamp", TimestampType(), True),
    StructField("processed_at", TimestampType(), True)
])

GOLD_METRIC_SCHEMA = StructType([
    StructField("metric_id", StringType(), False),
    StructField("metric_name", StringType(), True),
    StructField("metric_value", DoubleType(), True),
    StructField("time_window", StringType(), True),
    StructField("start_time", TimestampType(), True),
    StructField("end_time", TimestampType(), True),
    StructField("dimension", StringType(), True),
    StructField("dimension_value", StringType(), True),
    StructField("updated_at", TimestampType(), True)
])

GOLD_INSIGHT_SCHEMA = StructType([
    StructField("insight_id", StringType(), False),
    StructField("insight_text", StringType(), True),
    StructField("insight_type", StringType(), True),
    StructField("confidence_score", DoubleType(), True),
    StructField("metric_id", StringType(), True),
    StructField("time_window", StringType(), True),
    StructField("tags", ArrayType(StringType()), True),
    StructField("generated_at", TimestampType(), True)
])

# Helper functions
def load_json_fixture(filepath):
    """Load a JSON fixture file to a dict."""
    with open(filepath, 'r') as f:
        return json.load(f)

@pytest.fixture(scope="session")
def spark():
    """Create a Spark session for testing."""
    spark = (SparkSession.builder
             .master("local[2]")
             .appName("Scout-DLT-Pipeline-Tests")
             .config("spark.sql.warehouse.dir", "/tmp/spark-warehouse")
             .config("spark.sql.shuffle.partitions", "1")
             .config("spark.default.parallelism", "1")
             .config("spark.sql.streaming.schemaInference", "true")
             .getOrCreate())
    
    yield spark
    spark.stop()

@pytest.fixture
def bronze_events(spark):
    """Load sample bronze events data."""
    fixture_file = os.path.join(BRONZE_FIXTURE_DIR, "events_sample.json")
    events_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for event in events_data:
        event["timestamp"] = datetime.datetime.fromisoformat(event["timestamp"].replace('Z', '+00:00'))
        if "processed_at" in event and event["processed_at"]:
            event["processed_at"] = datetime.datetime.fromisoformat(event["processed_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(events_data, BRONZE_EVENT_SCHEMA)

@pytest.fixture
def bronze_transcripts(spark):
    """Load sample bronze transcripts data."""
    fixture_file = os.path.join(BRONZE_FIXTURE_DIR, "transcripts_sample.json")
    transcripts_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for transcript in transcripts_data:
        transcript["timestamp"] = datetime.datetime.fromisoformat(transcript["timestamp"].replace('Z', '+00:00'))
        if "processed_at" in transcript and transcript["processed_at"]:
            transcript["processed_at"] = datetime.datetime.fromisoformat(transcript["processed_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(transcripts_data, BRONZE_TRANSCRIPT_SCHEMA)

@pytest.fixture
def bronze_devices(spark):
    """Load sample bronze device data."""
    fixture_file = os.path.join(BRONZE_FIXTURE_DIR, "devices_sample.json")
    devices_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for device in devices_data:
        if "last_seen" in device and device["last_seen"]:
            device["last_seen"] = datetime.datetime.fromisoformat(device["last_seen"].replace('Z', '+00:00'))
        if "processed_at" in device and device["processed_at"]:
            device["processed_at"] = datetime.datetime.fromisoformat(device["processed_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(devices_data, BRONZE_DEVICE_SCHEMA)

@pytest.fixture
def silver_enriched_events(spark):
    """Load sample silver enriched events data."""
    fixture_file = os.path.join(SILVER_FIXTURE_DIR, "enriched_events_sample.json")
    enriched_events_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for event in enriched_events_data:
        event["timestamp"] = datetime.datetime.fromisoformat(event["timestamp"].replace('Z', '+00:00'))
        if "processed_at" in event and event["processed_at"]:
            event["processed_at"] = datetime.datetime.fromisoformat(event["processed_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(enriched_events_data, SILVER_ENRICHED_EVENT_SCHEMA)

@pytest.fixture
def silver_brand_mentions(spark):
    """Load sample silver brand mentions data."""
    fixture_file = os.path.join(SILVER_FIXTURE_DIR, "brand_mentions_sample.json")
    brand_mentions_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for mention in brand_mentions_data:
        mention["timestamp"] = datetime.datetime.fromisoformat(mention["timestamp"].replace('Z', '+00:00'))
        if "processed_at" in mention and mention["processed_at"]:
            mention["processed_at"] = datetime.datetime.fromisoformat(mention["processed_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(brand_mentions_data, SILVER_BRAND_MENTION_SCHEMA)

@pytest.fixture
def gold_metrics(spark):
    """Load sample gold metrics data."""
    fixture_file = os.path.join(GOLD_FIXTURE_DIR, "metrics_sample.json")
    metrics_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for metric in metrics_data:
        metric["start_time"] = datetime.datetime.fromisoformat(metric["start_time"].replace('Z', '+00:00'))
        metric["end_time"] = datetime.datetime.fromisoformat(metric["end_time"].replace('Z', '+00:00'))
        if "updated_at" in metric and metric["updated_at"]:
            metric["updated_at"] = datetime.datetime.fromisoformat(metric["updated_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(metrics_data, GOLD_METRIC_SCHEMA)

@pytest.fixture
def gold_insights(spark):
    """Load sample gold insights data."""
    fixture_file = os.path.join(GOLD_FIXTURE_DIR, "insights_sample.json")
    insights_data = load_json_fixture(fixture_file)
    
    # Convert timestamp strings to datetime objects
    for insight in insights_data:
        if "generated_at" in insight and insight["generated_at"]:
            insight["generated_at"] = datetime.datetime.fromisoformat(insight["generated_at"].replace('Z', '+00:00'))
    
    return spark.createDataFrame(insights_data, GOLD_INSIGHT_SCHEMA)

@pytest.fixture
def dlt_quality_checks():
    """Load DLT quality checks configuration."""
    config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dlt_quality_checks.yaml")
    with open(config_file, 'r') as f:
        import yaml
        return yaml.safe_load(f)