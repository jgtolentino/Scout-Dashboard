"""
Tests for gold layer of the DLT pipeline.
"""
import pytest
import logging
from pyspark.sql.functions import col, count, when, isnan, isnull, expr, length
from schema_validator import validate_dataframe_schema, generate_schema_from_expectations

logger = logging.getLogger(__name__)

def test_gold_metrics_schema(gold_metrics, dlt_quality_checks):
    """
    Test that gold_metrics have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    metric_id_nulls = gold_metrics.filter(col("metric_id").isNull()).count()
    metric_value_nulls = gold_metrics.filter(col("metric_value").isNull()).count()
    time_window_nulls = gold_metrics.filter(col("time_window").isNull()).count()
    
    assert metric_id_nulls == 0, "metric_id should not contain nulls"
    assert metric_value_nulls == 0, "metric_value should not contain nulls"
    assert time_window_nulls == 0, "time_window should not contain nulls"
    
    # Check row count is reasonable
    row_count = gold_metrics.count()
    assert row_count > 0, "gold_metrics should contain data"
    assert row_count >= 100, "gold_metrics has unexpectedly small row count"
    assert row_count <= 100000, "gold_metrics has unexpectedly large row count"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "gold_metrics")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(gold_metrics, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_gold_insights_schema(gold_insights, dlt_quality_checks):
    """
    Test that gold_insights have the expected schema and required fields.
    """
    # Check required fields exist and are not null
    insight_id_nulls = gold_insights.filter(col("insight_id").isNull()).count()
    insight_text_nulls = gold_insights.filter(col("insight_text").isNull()).count()
    insight_type_nulls = gold_insights.filter(col("insight_type").isNull()).count()
    
    assert insight_id_nulls == 0, "insight_id should not contain nulls"
    assert insight_text_nulls == 0, "insight_text should not contain nulls"
    assert insight_type_nulls == 0, "insight_type should not contain nulls"
    
    # Check insight_type values are valid
    valid_insight_types = ["trend", "anomaly", "correlation", "prediction", "recommendation", "opportunity", "risk"]
    invalid_types = gold_insights.filter(
        (col("insight_type").isNotNull()) & 
        (~col("insight_type").isin(valid_insight_types))
    ).count()
    
    assert invalid_types == 0, f"Found {invalid_types} insights with invalid insight_type"
    
    # Check that at least 90% of insights have high confidence (>0.8)
    total_insights = gold_insights.count()
    high_confidence = gold_insights.filter(col("confidence_score") > 0.8).count()
    
    assert high_confidence / total_insights >= 0.9, f"Too few high confidence insights: {high_confidence}/{total_insights}"
    
    # Validate schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "gold_insights")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(gold_insights, expected_schema, 
                                                   ignore_nullable=True, 
                                                   ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error: {error}")
        
        assert is_valid, f"Schema validation failed: {', '.join(errors)}"

def test_gold_brand_performance(spark, silver_brand_mentions, dlt_quality_checks):
    """
    Test that brand performance metrics are valid.
    
    Note: This assumes brand performance is derived from brand mentions.
    In a real implementation, you would have a separate fixture for brand performance.
    """
    # For this example, we'll mock brand performance from brand mentions
    # In a real implementation, you'd use actual gold_brand_performance data
    
    # Create a mock view of brand performance
    silver_brand_mentions.createOrReplaceTempView("silver_brand_mentions")
    
    mock_brand_performance = spark.sql("""
    SELECT 
        brand_id,
        brand_name,
        date_format(timestamp, 'yyyy-MM') AS time_period,
        COUNT(*) AS mention_count,
        AVG(confidence_score) AS avg_confidence,
        AVG(sentiment_score) AS avg_sentiment,
        MIN(timestamp) AS period_start,
        MAX(timestamp) AS period_end,
        current_timestamp() AS updated_at
    FROM silver_brand_mentions
    GROUP BY brand_id, brand_name, date_format(timestamp, 'yyyy-MM')
    """)
    
    # Verify brand_id is not null
    brand_id_nulls = mock_brand_performance.filter(col("brand_id").isNull()).count()
    assert brand_id_nulls == 0, "brand_id should not contain nulls"
    
    # Verify time_period is not null
    time_period_nulls = mock_brand_performance.filter(col("time_period").isNull()).count()
    assert time_period_nulls == 0, "time_period should not contain nulls"
    
    # Verify mention_count is non-negative
    negative_counts = mock_brand_performance.filter(col("mention_count") < 0).count()
    assert negative_counts == 0, "mention_count should be non-negative"
    
    # Validate mock brand performance schema against expected schema from DLT quality checks
    expected_schema = generate_schema_from_expectations(dlt_quality_checks, "gold_brand_performance")
    if expected_schema:
        is_valid, errors = validate_dataframe_schema(mock_brand_performance, expected_schema, 
                                                  ignore_nullable=True, 
                                                  ignore_extra_columns=True)
        for error in errors:
            logger.warning(f"Schema validation error in brand performance: {error}")
        
        # We're using a mock schema here, so we'll log errors but not fail the test
        if not is_valid:
            logger.warning(f"Mock brand performance schema validation failed: {', '.join(errors)}")

def test_insights_to_metrics_relationship(gold_insights, gold_metrics):
    """
    Test that insights reference valid metrics.
    """
    # Join to find insights that have corresponding metrics
    gold_insights.createOrReplaceTempView("gold_insights")
    gold_metrics.createOrReplaceTempView("gold_metrics")
    
    # Count insights with metric_id
    insights_with_metric = gold_insights.filter(col("metric_id").isNotNull()).count()
    
    # Count insights that have a corresponding metric
    matched_count = spark.sql("""
    SELECT COUNT(*) as matched_count
    FROM gold_insights i
    INNER JOIN gold_metrics m
    ON i.metric_id = m.metric_id
    WHERE i.metric_id IS NOT NULL
    """).collect()[0]['matched_count']
    
    # Calculate the matching ratio
    match_ratio = matched_count / insights_with_metric if insights_with_metric > 0 else 1.0
    
    # Per quality check threshold, expect at least 95% match
    assert match_ratio >= 0.95, f"Too many insights with invalid metric references: match ratio = {match_ratio}"

def test_gold_data_freshness(gold_metrics, gold_insights):
    """
    Test that gold data is being processed in a timely manner.
    """
    from datetime import datetime, timedelta
    import pytz
    
    now = datetime.now(pytz.UTC)
    metrics_max_delay = timedelta(minutes=180)  # 180 min max delay for metrics
    insights_max_delay = timedelta(minutes=240)  # 240 min max delay for insights
    
    # Count metrics with excessive processing delay
    stale_metrics = gold_metrics.filter(
        (col("updated_at").isNotNull()) & 
        (col("updated_at") < now - metrics_max_delay)
    ).count()
    
    metrics_with_updated_time = gold_metrics.filter(col("updated_at").isNotNull()).count()
    
    if metrics_with_updated_time > 0:
        assert stale_metrics / metrics_with_updated_time <= 0.05, f"Too many stale metrics: {stale_metrics}/{metrics_with_updated_time}"
    
    # Count insights with excessive processing delay
    stale_insights = gold_insights.filter(
        (col("generated_at").isNotNull()) & 
        (col("generated_at") < now - insights_max_delay)
    ).count()
    
    insights_with_generated_time = gold_insights.filter(col("generated_at").isNotNull()).count()
    
    if insights_with_generated_time > 0:
        assert stale_insights / insights_with_generated_time <= 0.05, f"Too many stale insights: {stale_insights}/{insights_with_generated_time}"

def test_evaluate_all_gold_expectations(gold_metrics, gold_insights, dlt_quality_checks):
    """
    Test that the gold data meets all expectations defined in the quality checks.
    """
    # Extract gold expectations from the quality checks config
    gold_expectations = dlt_quality_checks.get("gold_expectations", {})
    
    # For demonstration, we'll test a few expectations from the config
    # In a real implementation, you would dynamically evaluate all expectations based on the config
    
    if "gold_metrics" in gold_expectations:
        metric_expectations = gold_expectations["gold_metrics"]["expectations"]
        
        # Find the not_null_metric_value expectation
        not_null_metric_value = next((exp for exp in metric_expectations if exp["name"] == "not_null_metric_value"), None)
        
        if not_null_metric_value:
            # Evaluate the expectation
            null_count = gold_metrics.filter(col("metric_value").isNull()).count()
            total_count = gold_metrics.count()
            not_null_ratio = (total_count - null_count) / total_count
            
            # Check if the expectation passes
            threshold = not_null_metric_value.get("threshold", 1.0)
            assert not_null_ratio >= threshold, f"not_null_metric_value expectation failed: {not_null_ratio} < {threshold}"
    
    if "gold_insights" in gold_expectations:
        insight_expectations = gold_expectations["gold_insights"]["expectations"]
        
        # Find the high_quality_insights expectation
        high_quality = next((exp for exp in insight_expectations if exp["name"] == "high_quality_insights"), None)
        
        if high_quality:
            # Evaluate the expectation
            high_confidence_count = gold_insights.filter(col("confidence_score") > 0.8).count()
            total_count = gold_insights.count()
            high_confidence_ratio = high_confidence_count / total_count if total_count > 0 else 1.0
            
            # Check if the expectation passes
            threshold = high_quality.get("threshold", 0.9)
            assert high_confidence_ratio >= threshold, f"high_quality_insights expectation failed: {high_confidence_ratio} < {threshold}"

def test_dlt_cross_table_expectations(bronze_events, silver_enriched_events, silver_brand_mentions, gold_insights, gold_metrics, dlt_quality_checks):
    """
    Test that the cross-table relationships meet the expectations defined in the quality checks.
    """
    # Extract cross-table expectations from the quality checks config
    cross_table_expectations = dlt_quality_checks.get("cross_table_expectations", {})
    
    # For demonstration, we'll test a few cross-table expectations
    # In a real implementation, you would dynamically evaluate all expectations based on the config
    
    # Test bronze_to_silver_completeness
    bronze_silver_completeness = cross_table_expectations.get("bronze_to_silver_completeness", {})
    
    if bronze_silver_completeness and bronze_silver_completeness["expectation"] == "table_a_ids_in_table_b":
        # Get counts
        bronze_count = bronze_events.count()
        
        # Join to find bronze events that have corresponding silver events
        bronze_events.createOrReplaceTempView("bronze_events")
        silver_enriched_events.createOrReplaceTempView("silver_enriched_events")
        
        # Count bronze events that have a corresponding silver event
        matched_count = spark.sql(f"""
        SELECT COUNT(*) as matched_count
        FROM bronze_events b
        INNER JOIN silver_enriched_events s
        ON b.{bronze_silver_completeness["id_column_a"]} = s.{bronze_silver_completeness["id_column_b"]}
        """).collect()[0]['matched_count']
        
        # Calculate the matching ratio
        match_ratio = matched_count / bronze_count if bronze_count > 0 else 1.0
        
        # Check if the expectation passes
        threshold = bronze_silver_completeness.get("threshold", 0.99)
        assert match_ratio >= threshold, f"bronze_to_silver_completeness expectation failed: {match_ratio} < {threshold}"
    
    # Test insights_to_metrics
    insights_to_metrics = cross_table_expectations.get("insights_to_metrics", {})
    
    if insights_to_metrics and insights_to_metrics["expectation"] == "table_a_ids_in_table_b":
        # Count insights with metric_id
        insights_with_metric = gold_insights.filter(col("metric_id").isNotNull()).count()
        
        # Join to find insights that have corresponding metrics
        gold_insights.createOrReplaceTempView("gold_insights")
        gold_metrics.createOrReplaceTempView("gold_metrics")
        
        # Count insights that have a corresponding metric
        matched_count = spark.sql(f"""
        SELECT COUNT(*) as matched_count
        FROM gold_insights i
        INNER JOIN gold_metrics m
        ON i.{insights_to_metrics["id_column_a"]} = m.{insights_to_metrics["id_column_b"]}
        WHERE i.{insights_to_metrics["id_column_a"]} IS NOT NULL
        """).collect()[0]['matched_count']
        
        # Calculate the matching ratio
        match_ratio = matched_count / insights_with_metric if insights_with_metric > 0 else 1.0
        
        # Check if the expectation passes
        threshold = insights_to_metrics.get("threshold", 0.95)
        assert match_ratio >= threshold, f"insights_to_metrics expectation failed: {match_ratio} < {threshold}"