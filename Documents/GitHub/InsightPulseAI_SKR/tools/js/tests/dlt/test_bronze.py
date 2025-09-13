"""
Tests for bronze layer of the DLT pipeline.
"""
import pytest
import logging
from pyspark.sql.functions import col, count, when, isnan, isnull, length
from schema_validator import validate_dataframe_schema, generate_schema_from_expectations

logger = logging.getLogger(__name__)

def test_bronze_events_schema(bronze_events, dlt_quality_checks):
    """
    Test that bronze_events have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    event_id_nulls = bronze_events.filter(col("event_id").isNull()).count()
    timestamp_nulls = bronze_events.filter(col("timestamp").isNull()).count()
    
    assert event_id_nulls == 0, "event_id should not contain nulls"
    assert timestamp_nulls == 0, "timestamp should not contain nulls"
    
    # Check row count is reasonable
    row_count = bronze_events.count()
    assert row_count > 0, "bronze_events should contain data"
    
    # Verify event_type values are within expected set
    valid_event_types = ["pageview", "interaction", "transaction", "conversion", "error"]
    invalid_events = bronze_events.filter(~col("event_type").isin(valid_event_types)).count()
    
    # Allow some invalid event types (per quality check threshold)
    total_events = bronze_events.count()
    assert invalid_events / total_events <= 0.02, f"Too many invalid event types: {invalid_events}/{total_events}"
    
    # Validate schema against expected schema from DLT quality checks
    # This uses the schema validator to dynamically generate expected schema
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "bronze_events")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(bronze_events, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_bronze_transcripts_schema(bronze_transcripts, dlt_quality_checks):
    """
    Test that bronze_transcripts have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    transcript_id_nulls = bronze_transcripts.filter(col("transcript_id").isNull()).count()
    assert transcript_id_nulls == 0, "transcript_id should not contain nulls"
    
    # Check transcript_text is mostly not null (allow 5% nulls per quality check)
    text_nulls = bronze_transcripts.filter(col("transcript_text").isNull()).count()
    total_transcripts = bronze_transcripts.count()
    assert text_nulls / total_transcripts <= 0.05, f"Too many null transcripts: {text_nulls}/{total_transcripts}"
    
    # Check transcript length is reasonable
    short_transcripts = bronze_transcripts.filter(
        (col("transcript_text").isNotNull()) & 
        (length(col("transcript_text")) < 10)
    ).count()
    
    long_transcripts = bronze_transcripts.filter(
        (col("transcript_text").isNotNull()) & 
        (length(col("transcript_text")) > 50000)
    ).count()
    
    invalid_length = short_transcripts + long_transcripts
    valid_transcripts = total_transcripts - text_nulls
    
    assert invalid_length / valid_transcripts <= 0.01, "Too many invalid length transcripts"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "bronze_transcripts")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(bronze_transcripts, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_bronze_devices_schema(bronze_devices, dlt_quality_checks):
    """
    Test that bronze_devices have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    device_id_nulls = bronze_devices.filter(col("device_id").isNull()).count()
    assert device_id_nulls == 0, "device_id should not contain nulls"
    
    # Check device_type values are valid
    valid_device_types = ["desktop", "tablet", "mobile", "pos", "kiosk", "other"]
    invalid_devices = bronze_devices.filter(
        col("device_type").isNotNull() & 
        ~col("device_type").isin(valid_device_types)
    ).count()
    
    total_devices = bronze_devices.count()
    assert invalid_devices / total_devices <= 0.01, f"Too many invalid device types: {invalid_devices}/{total_devices}"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "bronze_device_telemetry")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(bronze_devices, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_bronze_events_timestamp_range(bronze_events):
    """
    Test that bronze_events timestamps are within valid range.
    """
    from datetime import datetime
    import pytz
    
    # No data from before 2023
    min_valid_date = datetime(2023, 1, 1, tzinfo=pytz.UTC)
    
    # No future data
    now = datetime.now(pytz.UTC)
    
    # Count events outside valid range
    early_events = bronze_events.filter(col("timestamp") < min_valid_date).count()
    future_events = bronze_events.filter(col("timestamp") > now).count()
    
    total_events = bronze_events.count()
    invalid_time_events = early_events + future_events
    
    assert invalid_time_events / total_events <= 0.001, f"Too many events with invalid timestamps: {invalid_time_events}/{total_events}"

def test_bronze_data_freshness(bronze_events, bronze_transcripts, bronze_devices):
    """
    Test that bronze data is being processed in a timely manner.
    """
    from datetime import datetime, timedelta
    import pytz
    
    now = datetime.now(pytz.UTC)
    max_delay = timedelta(minutes=60)  # 60 min max delay
    
    # Count events with excessive processing delay
    stale_events = bronze_events.filter(
        (col("processed_at").isNotNull()) & 
        (col("processed_at") < now - max_delay)
    ).count()
    
    total_events = bronze_events.count()
    events_with_processed_time = bronze_events.filter(col("processed_at").isNotNull()).count()
    
    if events_with_processed_time > 0:
        assert stale_events / events_with_processed_time <= 0.05, f"Too many stale events: {stale_events}/{events_with_processed_time}"

def test_evaluate_all_bronze_expectations(bronze_events, bronze_transcripts, bronze_devices, dlt_quality_checks):
    """
    Test that the bronze data meets all expectations defined in the quality checks.
    """
    # Extract bronze expectations from the quality checks config
    bronze_expectations = dlt_quality_checks.get("bronze_expectations", {})
    
    # For demonstration, we'll test a few expectations from the config
    # In a real implementation, you would dynamically evaluate all expectations based on the config
    
    if "bronze_events" in bronze_expectations:
        event_expectations = bronze_expectations["bronze_events"]["expectations"]
        
        # Find the not_null_event_id expectation
        not_null_event_id = next((exp for exp in event_expectations if exp["name"] == "not_null_event_id"), None)
        
        if not_null_event_id:
            # Evaluate the expectation
            null_count = bronze_events.filter(col("event_id").isNull()).count()
            total_count = bronze_events.count()
            not_null_ratio = (total_count - null_count) / total_count
            
            # Check if the expectation passes
            threshold = not_null_event_id.get("threshold", 1.0)
            assert not_null_ratio >= threshold, f"not_null_event_id expectation failed: {not_null_ratio} < {threshold}"
    
    if "bronze_transcripts" in bronze_expectations:
        transcript_expectations = bronze_expectations["bronze_transcripts"]["expectations"]
        
        # Find the not_empty_transcript expectation
        not_empty_transcript = next((exp for exp in transcript_expectations if exp["name"] == "not_empty_transcript"), None)
        
        if not_empty_transcript:
            # Evaluate the expectation
            null_count = bronze_transcripts.filter(col("transcript_text").isNull()).count()
            total_count = bronze_transcripts.count()
            not_null_ratio = (total_count - null_count) / total_count
            
            # Check if the expectation passes
            threshold = not_empty_transcript.get("threshold", 0.95)
            assert not_null_ratio >= threshold, f"not_empty_transcript expectation failed: {not_null_ratio} < {threshold}"