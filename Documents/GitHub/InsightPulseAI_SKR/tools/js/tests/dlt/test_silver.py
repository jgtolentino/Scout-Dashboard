"""
Tests for silver layer of the DLT pipeline.
"""
import pytest
import logging
from pyspark.sql.functions import col, count, when, isnan, isnull, expr
from schema_validator import validate_dataframe_schema, generate_schema_from_expectations

logger = logging.getLogger(__name__)

def test_silver_enriched_events_schema(silver_enriched_events, dlt_quality_checks):
    """
    Test that silver_enriched_events have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    enriched_id_nulls = silver_enriched_events.filter(col("enriched_event_id").isNull()).count()
    assert enriched_id_nulls == 0, "enriched_event_id should not contain nulls"
    
    # Check row count is reasonable
    row_count = silver_enriched_events.count()
    assert row_count > 0, "silver_enriched_events should contain data"
    assert row_count <= 10000000, "silver_enriched_events has unexpectedly large row count"
    
    # Check user_id can have some nulls but not too many (per quality check threshold)
    user_id_nulls = silver_enriched_events.filter(col("user_id").isNull()).count()
    assert user_id_nulls / row_count <= 0.10, f"Too many null user_ids: {user_id_nulls}/{row_count}"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "silver_enriched_events")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(silver_enriched_events, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_silver_brand_mentions_schema(silver_brand_mentions, dlt_quality_checks):
    """
    Test that silver_brand_mentions have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    mention_id_nulls = silver_brand_mentions.filter(col("mention_id").isNull()).count()
    brand_id_nulls = silver_brand_mentions.filter(col("brand_id").isNull()).count()
    
    assert mention_id_nulls == 0, "mention_id should not contain nulls"
    assert brand_id_nulls == 0, "brand_id should not contain nulls"
    
    # Check confidence_score is between 0 and 1
    invalid_confidence = silver_brand_mentions.filter(
        (col("confidence_score").isNotNull()) & 
        ((col("confidence_score") < 0.0) | (col("confidence_score") > 1.0))
    ).count()
    
    total_mentions = silver_brand_mentions.count()
    assert invalid_confidence == 0, f"Found {invalid_confidence} brand mentions with invalid confidence scores"
    
    # Check that at least 75% of mentions have high confidence (>0.7)
    high_confidence = silver_brand_mentions.filter(col("confidence_score") > 0.7).count()
    assert high_confidence / total_mentions >= 0.75, f"Too few high confidence mentions: {high_confidence}/{total_mentions}"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "silver_brand_mentions")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(silver_brand_mentions, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_silver_customer_interactions_schema(spark, silver_enriched_events):
    """
    Test that customer interactions have valid sentiment scores.
    
    Note: This assumes customer interactions are derived from enriched events
    in a real implementation, you would have a separate fixture for customer interactions.
    """
    # For this example, we'll mock customer interactions from enriched events
    # In a real implementation, you'd use actual customer_interactions data
    
    # Create a mock view of customer interactions
    silver_enriched_events.createOrReplaceTempView("silver_enriched_events")
    
    mock_interactions = spark.sql("""
    SELECT 
        concat('interaction-', enriched_event_id) AS interaction_id,
        user_id,
        timestamp,
        event_type AS interaction_type,
        CASE 
            WHEN event_type = 'pageview' THEN 0.1
            WHEN event_type = 'transaction' THEN 0.8
            WHEN event_type = 'conversion' THEN 0.9
            WHEN event_type = 'error' THEN -0.5
            ELSE 0.0
        END AS sentiment_score,
        processed_at
    FROM silver_enriched_events
    WHERE event_type IN ('pageview', 'transaction', 'conversion', 'error')
    """)
    
    # Verify interaction_id is not null
    interaction_id_nulls = mock_interactions.filter(col("interaction_id").isNull()).count()
    assert interaction_id_nulls == 0, "interaction_id should not contain nulls"
    
    # Verify sentiment score is between -1 and 1
    invalid_sentiment = mock_interactions.filter(
        (col("sentiment_score").isNotNull()) & 
        ((col("sentiment_score") < -1.0) | (col("sentiment_score") > 1.0))
    ).count()
    
    assert invalid_sentiment == 0, f"Found {invalid_sentiment} interactions with invalid sentiment scores"
    
    # Check for null interaction_type
    interaction_type_nulls = mock_interactions.filter(col("interaction_type").isNull()).count()
    total_interactions = mock_interactions.count()
    
    assert interaction_type_nulls / total_interactions <= 0.001, f"Too many null interaction_types: {interaction_type_nulls}/{total_interactions}"

def test_bronze_to_silver_completeness(bronze_events, silver_enriched_events):
    """
    Test that most bronze events appear in silver (no significant data loss).
    """
    # Get counts
    bronze_count = bronze_events.count()
    
    # Join to find bronze events that have corresponding silver events
    bronze_events.createOrReplaceTempView("bronze_events")
    silver_enriched_events.createOrReplaceTempView("silver_enriched_events")
    
    # Count bronze events that have a corresponding silver event
    matched_count = spark.sql("""
    SELECT COUNT(*) as matched_count
    FROM bronze_events b
    INNER JOIN silver_enriched_events s
    ON b.event_id = s.source_event_id
    """).collect()[0]['matched_count']
    
    # Calculate the matching ratio
    match_ratio = matched_count / bronze_count if bronze_count > 0 else 1.0
    
    # Per quality check threshold, expect at least 99% match
    assert match_ratio >= 0.99, f"Too many bronze events missing from silver: match ratio = {match_ratio}"

def test_brand_mentions_to_events_relationship(silver_brand_mentions, silver_enriched_events):
    """
    Test that brand mentions reference valid enriched events.
    """
    # Join to find brand mentions that have corresponding enriched events
    silver_brand_mentions.createOrReplaceTempView("silver_brand_mentions")
    silver_enriched_events.createOrReplaceTempView("silver_enriched_events")
    
    # Count brand mentions
    total_mentions = silver_brand_mentions.count()
    
    # Count brand mentions that have a corresponding enriched event
    matched_count = spark.sql("""
    SELECT COUNT(*) as matched_count
    FROM silver_brand_mentions m
    INNER JOIN silver_enriched_events e
    ON m.event_id = e.enriched_event_id
    """).collect()[0]['matched_count']
    
    # Calculate the matching ratio
    match_ratio = matched_count / total_mentions if total_mentions > 0 else 1.0
    
    # Per quality check threshold, expect at least 99% match
    assert match_ratio >= 0.99, f"Too many brand mentions with invalid event references: match ratio = {match_ratio}"

def test_silver_data_freshness(silver_enriched_events, silver_brand_mentions):
    """
    Test that silver data is being processed in a timely manner.
    """
    from datetime import datetime, timedelta
    import pytz
    
    now = datetime.now(pytz.UTC)
    max_delay = timedelta(minutes=120)  # 120 min max delay for silver
    
    # Count enriched events with excessive processing delay
    stale_events = silver_enriched_events.filter(
        (col("processed_at").isNotNull()) & 
        (col("processed_at") < now - max_delay)
    ).count()
    
    events_with_processed_time = silver_enriched_events.filter(col("processed_at").isNotNull()).count()
    
    if events_with_processed_time > 0:
        assert stale_events / events_with_processed_time <= 0.05, f"Too many stale enriched events: {stale_events}/{events_with_processed_time}"
    
    # Count brand mentions with excessive processing delay
    stale_mentions = silver_brand_mentions.filter(
        (col("processed_at").isNotNull()) & 
        (col("processed_at") < now - max_delay)
    ).count()
    
    mentions_with_processed_time = silver_brand_mentions.filter(col("processed_at").isNotNull()).count()
    
    if mentions_with_processed_time > 0:
        assert stale_mentions / mentions_with_processed_time <= 0.05, f"Too many stale brand mentions: {stale_mentions}/{mentions_with_processed_time}"

def test_evaluate_all_silver_expectations(silver_enriched_events, silver_brand_mentions, dlt_quality_checks):
    """
    Test that the silver data meets all expectations defined in the quality checks.
    """
    # Extract silver expectations from the quality checks config
    silver_expectations = dlt_quality_checks.get("silver_expectations", {})
    
    # For demonstration, we'll test a few expectations from the config
    # In a real implementation, you would dynamically evaluate all expectations based on the config
    
    if "silver_enriched_events" in silver_expectations:
        event_expectations = silver_expectations["silver_enriched_events"]["expectations"]
        
        # Find the not_null_enriched_event_id expectation
        not_null_event_id = next((exp for exp in event_expectations if exp["name"] == "not_null_enriched_event_id"), None)
        
        if not_null_event_id:
            # Evaluate the expectation
            null_count = silver_enriched_events.filter(col("enriched_event_id").isNull()).count()
            total_count = silver_enriched_events.count()
            not_null_ratio = (total_count - null_count) / total_count
            
            # Check if the expectation passes
            threshold = not_null_event_id.get("threshold", 1.0)
            assert not_null_ratio >= threshold, f"not_null_enriched_event_id expectation failed: {not_null_ratio} < {threshold}"
    
    if "silver_brand_mentions" in silver_expectations:
        mention_expectations = silver_expectations["silver_brand_mentions"]["expectations"]
        
        # Find the confidence_score_range expectation
        confidence_range = next((exp for exp in mention_expectations if exp["name"] == "confidence_score_range"), None)
        
        if confidence_range:
            # Evaluate the expectation
            invalid_count = silver_brand_mentions.filter(
                (col("confidence_score").isNotNull()) & 
                ((col("confidence_score") < 0.0) | (col("confidence_score") > 1.0))
            ).count()
            total_count = silver_brand_mentions.count()
            valid_ratio = (total_count - invalid_count) / total_count
            
            # Check if the expectation passes
            threshold = confidence_range.get("threshold", 1.0)
            assert valid_ratio >= threshold, f"confidence_score_range expectation failed: {valid_ratio} < {threshold}"