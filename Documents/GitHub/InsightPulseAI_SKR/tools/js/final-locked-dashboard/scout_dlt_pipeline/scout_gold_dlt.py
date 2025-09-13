from dlt import table, read_stream, expect_all_or_drop, expect_or_drop, expect, read_from_tables
from pyspark.sql.functions import col, expr, window, avg, max, min, count, sum, when, current_timestamp, json_tuple
from pyspark.sql.functions import coalesce, lit, timestamp_seconds, to_json, struct, from_json, explode, date_format
from pyspark.sql.functions import datediff, hour, dayofweek, month, year, concat, concat_ws
from pyspark.sql.types import StructType, StringType, TimestampType, MapType, ArrayType, DoubleType, IntegerType, BooleanType
import pyspark.sql.functions as F

@table(name="gold_insight_feedback")
@expect_all_or_drop(
    "valid_insight_id", "insight_id IS NOT NULL",
    "valid_timestamp", "timestamp IS NOT NULL",
    "valid_feedback_type", "feedback_type IS NOT NULL"  
)
def gold_insight_feedback():
    """
    Processes insight feedback events from advisors/users through the advisor panel.
    Source: eh-insight-feedback
    
    This table captures actions taken based on generated insights, forming a feedback loop
    for AI improvement and opportunity tracking.
    """
    # Define schema for insight feedback events
    feedback_schema = StructType().add("insight_id", StringType()) \
                                 .add("timestamp", TimestampType()) \
                                 .add("session_id", StringType()) \
                                 .add("store_id", StringType()) \
                                 .add("advisor_id", StringType()) \
                                 .add("feedback_type", StringType()) \
                                 .add("insight_category", StringType()) \
                                 .add("confidence_score", DoubleType()) \
                                 .add("action_taken", StringType()) \
                                 .add("customer_outcome", StringType()) \
                                 .add("notes", StringType()) \
                                 .add("metadata", MapType(StringType(), StringType()))
    
    # Read from Event Hub
    return (
        read_stream("eventhub", eventhub_name="eh-insight-feedback")
        .withColumn("body", from_json(col("body").cast("string"), feedback_schema))
        .select(
            "body.insight_id",
            "body.timestamp",
            "body.session_id",
            "body.store_id",
            "body.advisor_id",
            "body.feedback_type",
            "body.insight_category",
            "body.confidence_score",
            "body.action_taken",
            "body.customer_outcome",
            "body.notes",
            "body.metadata",
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
    )

@table(name="gold_store_interaction_metrics")
@expect_all_or_drop(
    "valid_store_id", "store_id IS NOT NULL",
    "valid_window", "window_start IS NOT NULL AND window_end IS NOT NULL"
)
def gold_store_interaction_metrics():
    """
    Aggregates customer interaction metrics by store and time window.
    
    This table provides key business metrics for the Retail Advisor dashboard,
    showing customer engagement, conversion, and behavioral patterns.
    """
    # Read from silver annotated events
    annotated_events = read_from_tables("silver_annotated_events")
    
    # Window for aggregation (hourly)
    window_duration = "1 hour"
    
    return (
        annotated_events
        .withWatermark("timestamp", "1 day")
        .groupBy(
            "store_id",
            window("timestamp", window_duration)
        )
        .agg(
            count("*").alias("total_interactions"),
            count(when(col("interaction_type") == "greeting", 1)).alias("greeting_count"),
            count(when(col("interaction_type") == "question", 1)).alias("question_count"),
            count(when(col("interaction_type") == "browsing", 1)).alias("browsing_count"),
            count(when(col("interaction_type") == "purchase_intent", 1)).alias("purchase_intent_count"),
            count(when(col("interaction_type") == "checkout", 1)).alias("checkout_count"),
            count(when(col("interaction_type") == "assistance", 1)).alias("assistance_count"),
            count(when(col("interaction_type") == "leaving", 1)).alias("leaving_count"),
            count("customer_id").alias("total_customers"),
            count(F.approx_count_distinct("customer_id")).alias("unique_customers"),
            avg("duration_sec").alias("avg_interaction_duration_sec"),
            max("duration_sec").alias("max_interaction_duration_sec"),
            count(when(col("zone_id") == "entrance", 1)).alias("entrance_interactions"),
            count(when(col("zone_id") == "checkout", 1)).alias("checkout_interactions"),
            count(when(col("zone_id") == "product_display", 1)).alias("product_display_interactions"),
            count(when(col("zone_id") == "fitting_room", 1)).alias("fitting_room_interactions")
        )
        .select(
            "store_id",
            col("window.start").alias("window_start"),
            col("window.end").alias("window_end"),
            "total_interactions",
            "greeting_count",
            "question_count",
            "browsing_count",
            "purchase_intent_count",
            "checkout_count",
            "assistance_count",
            "leaving_count",
            "total_customers",
            "unique_customers",
            "avg_interaction_duration_sec",
            "max_interaction_duration_sec",
            "entrance_interactions",
            "checkout_interactions",
            "product_display_interactions",
            "fitting_room_interactions",
            (col("checkout_count") / col("total_interactions")).alias("checkout_conversion_rate"),
            (col("purchase_intent_count") / col("browsing_count")).alias("browse_to_intent_rate"),
            current_timestamp().alias("processing_time")
        )
    )

@table(name="gold_device_health_summary")
@expect_all_or_drop(
    "valid_store_id", "store_id IS NOT NULL",
    "valid_window", "window_start IS NOT NULL AND window_end IS NOT NULL"
)
def gold_device_health_summary():
    """
    Aggregates device health metrics across stores for the operations dashboard.
    
    This table provides key operational metrics for the Scout Operations dashboard,
    showing device status, errors, and performance metrics.
    """
    # Read from silver device heartbeat
    device_heartbeat = read_from_tables("silver_device_heartbeat")
    
    # Window for aggregation (hourly)
    window_duration = "1 hour"
    
    return (
        device_heartbeat
        .withWatermark("timestamp", "1 day")
        .groupBy(
            "store_id",
            window("timestamp", window_duration)
        )
        .agg(
            count("device_id").alias("total_devices"),
            count(when(col("status") == "online", 1)).alias("online_devices"),
            count(when(col("status") == "offline", 1)).alias("offline_devices"),
            count(when(col("status") == "warning", 1)).alias("warning_devices"),
            count(when(col("status") == "error", 1)).alias("error_devices"),
            count(when(col("errors").isNotNull(), 1)).alias("devices_with_errors"),
            avg("battery_level").alias("avg_battery_level"),
            min("battery_level").alias("min_battery_level"),
            avg("temperature_c").alias("avg_temperature_c"),
            max("temperature_c").alias("max_temperature_c"),
            avg("memory_usage_pct").alias("avg_memory_usage"),
            avg("disk_usage_pct").alias("avg_disk_usage"),
            avg("network_signal_strength").alias("avg_network_signal"),
            avg("camera_fps").alias("avg_camera_fps")
        )
        .select(
            "store_id",
            col("window.start").alias("window_start"),
            col("window.end").alias("window_end"),
            "total_devices",
            "online_devices",
            "offline_devices", 
            "warning_devices",
            "error_devices",
            "devices_with_errors",
            "avg_battery_level",
            "min_battery_level",
            "avg_temperature_c",
            "max_temperature_c",
            "avg_memory_usage",
            "avg_disk_usage",
            "avg_network_signal",
            "avg_camera_fps",
            (col("online_devices") / col("total_devices")).alias("device_online_rate"),
            current_timestamp().alias("processing_time")
        )
    )

@table(name="gold_transcript_sentiment_analysis")
@expect_all_or_drop(
    "valid_store_id", "store_id IS NOT NULL",
    "valid_window", "window_start IS NOT NULL AND window_end IS NOT NULL",
    "valid_transcripts", "total_transcripts > 0"
)
def gold_transcript_sentiment_analysis():
    """
    Performs sentiment analysis on customer transcripts for brand and product insights.
    
    This table provides sentiment metrics that feed into the GenAI insights section
    of the Retail Advisor dashboard.
    """
    # Read from silver annotated events
    annotated_events = read_from_tables("silver_annotated_events")
    
    # Note: This would typically call an external sentiment analysis model or UDF
    # For this example, we'll simulate using simple word-based sentiment detection
    
    # Window for aggregation (daily)
    window_duration = "1 day"
    
    # Words associated with positive and negative sentiment
    # In a real implementation, this would be much more sophisticated NLP
    positive_words = ["happy", "great", "excellent", "good", "like", "love", "wonderful", "helpful"]
    negative_words = ["bad", "poor", "terrible", "dislike", "hate", "awful", "unhelpful", "disappointed"]
    
    # Create sentiment detection UDFs
    contains_positive = F.udf(lambda text: any(word in text.lower() for word in positive_words) if text else False)
    contains_negative = F.udf(lambda text: any(word in text.lower() for word in negative_words) if text else False)
    
    return (
        annotated_events
        .filter(col("transcript").isNotNull())
        .withColumn("has_positive", contains_positive(col("transcript")))
        .withColumn("has_negative", contains_negative(col("transcript")))
        .withColumn("sentiment_score", 
                    when(col("has_positive") & ~col("has_negative"), 1.0)
                    .when(col("has_negative") & ~col("has_positive"), -1.0)
                    .when(col("has_positive") & col("has_negative"), 0.0)
                    .otherwise(0.0))
        .withWatermark("timestamp", "1 day")
        .groupBy(
            "store_id",
            window("timestamp", window_duration)
        )
        .agg(
            count("*").alias("total_transcripts"),
            count(when(col("sentiment_score") > 0, 1)).alias("positive_count"),
            count(when(col("sentiment_score") < 0, 1)).alias("negative_count"),
            count(when(col("sentiment_score") == 0, 1)).alias("neutral_count"),
            avg("sentiment_score").alias("avg_sentiment_score")
        )
        .select(
            "store_id",
            col("window.start").alias("window_start"),
            col("window.end").alias("window_end"),
            "total_transcripts",
            "positive_count",
            "negative_count",
            "neutral_count",
            "avg_sentiment_score",
            (col("positive_count") / col("total_transcripts")).alias("positive_rate"),
            (col("negative_count") / col("total_transcripts")).alias("negative_rate"),
            current_timestamp().alias("processing_time")
        )
    )