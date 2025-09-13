from dlt import table, read_stream, expect_all_or_drop, expect_or_drop, expect, read_from_tables
from pyspark.sql.functions import col, expr, window, avg, max, min, count, when, current_timestamp, json_tuple, coalesce, lit, timestamp_seconds, to_json, struct
from pyspark.sql.types import StructType, StringType, TimestampType
import pyspark.sql.functions as F

@table(name="silver_annotated_events")
@expect_all_or_drop(
    "valid_device_id", "device_id IS NOT NULL",
    "valid_timestamp", "timestamp IS NOT NULL",
    "valid_session_id", "session_id IS NOT NULL",
    "interaction_has_data", "interaction_type IS NOT NULL OR transcript IS NOT NULL"
)
def silver_annotated_events():
    """
    Creates a table of annotated multimodal interaction events by combining speech and visual signals.
    Targets the eh-pi-annotated-events Event Hub which contains pre-annotated events from the edge.

    Each record represents a semantically meaningful interaction (e.g., customer greeted, asked question, showed interest)
    """

    # Define schema for annotated multimodal events
    annotated_schema = StructType().add("device_id", StringType()) \
                               .add("timestamp", TimestampType()) \
                               .add("session_id", StringType()) \
                               .add("interaction_type", StringType()) \
                               .add("transcript", StringType()) \
                               .add("visual_cues", StringType()) \
                               .add("customer_id", StringType()) \
                               .add("store_id", StringType()) \
                               .add("zone_id", StringType()) \
                               .add("confidence", StringType()) \
                               .add("duration_sec", StringType())

    # Read from Event Hub
    return (
        read_stream("eventhub", eventhub_name="eh-pi-annotated-events")
        .withColumn("body", from_json(col("body").cast("string"), annotated_schema))
        .select(
            "body.device_id",
            "body.timestamp",
            "body.session_id",
            "body.interaction_type",
            "body.transcript",
            "body.visual_cues",
            "body.customer_id",
            "body.store_id",
            "body.zone_id",
            "body.confidence",
            "body.duration_sec",
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
    )

@table(name="silver_device_heartbeat")
@expect_all_or_drop(
    "valid_device_id", "device_id IS NOT NULL",
    "valid_timestamp", "timestamp IS NOT NULL",
    "valid_status", "status IS NOT NULL"
)
def silver_device_heartbeat():
    """
    Processes device health and diagnostic data from Raspberry Pi devices.
    Source: eh-device-heartbeat
    """
    # Define schema for device heartbeat events
    heartbeat_schema = StructType().add("device_id", StringType()) \
                                  .add("timestamp", TimestampType()) \
                                  .add("store_id", StringType()) \
                                  .add("status", StringType()) \
                                  .add("battery_level", StringType()) \
                                  .add("temperature_c", StringType()) \
                                  .add("memory_usage_pct", StringType()) \
                                  .add("disk_usage_pct", StringType()) \
                                  .add("network_signal_strength", StringType()) \
                                  .add("camera_fps", StringType()) \
                                  .add("errors", StringType()) \
                                  .add("sw_version", StringType())

    # Read from Event Hub
    return (
        read_stream("eventhub", eventhub_name="eh-device-heartbeat")
        .withColumn("body", from_json(col("body").cast("string"), heartbeat_schema))
        .select(
            "body.device_id",
            "body.timestamp",
            "body.store_id",
            "body.status",
            "body.battery_level",
            "body.temperature_c",
            "body.memory_usage_pct",
            "body.disk_usage_pct",
            "body.network_signal_strength",
            "body.camera_fps",
            "body.errors",
            "body.sw_version",
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
    )

@table(name="silver_multimodal_aligned")
@expect_or_drop("has_session_id", "session_id IS NOT NULL")
def silver_multimodal_aligned():
    """
    Aligns and combines raw speech and visual data by timestamp to create a unified view
    when the data isn't pre-annotated at the edge.

    This handles cases where separate raw events need to be correlated in the cloud.
    """
    # Read from bronze tables
    stt_data = read_from_tables("bronze_stt_raw")
    visual_data = read_from_tables("bronze_visual_stream")

    # Window size for aligning audio and visual events (2 second window)
    window_duration = "2 seconds"

    # Join STT and visual data on session_id and within the time window
    return (
        stt_data.withWatermark("timestamp", "10 seconds")
        .join(
            visual_data.withWatermark("timestamp", "10 seconds"),
            expr("""
                session_id = visual_data.session_id AND
                timestamp >= visual_data.timestamp - interval 1 seconds AND
                timestamp <= visual_data.timestamp + interval 1 seconds
            """),
            "inner"
        )
        .select(
            stt_data.device_id,
            stt_data.timestamp,
            stt_data.session_id,
            stt_data.transcript,
            stt_data.confidence.alias("stt_confidence"),
            visual_data.detection_type,
            visual_data.confidence.alias("visual_confidence"),
            visual_data.attributes,
            stt_data.metadata.store_id,
            visual_data.metadata.camera_position,
            current_timestamp().alias("processing_time")
        )
    )