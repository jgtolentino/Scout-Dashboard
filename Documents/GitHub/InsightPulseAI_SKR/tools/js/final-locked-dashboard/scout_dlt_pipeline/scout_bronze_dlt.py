from dlt import table, read_stream
from pyspark.sql.functions import from_json, col, explode, to_timestamp, current_timestamp, lit, to_json, struct
from pyspark.sql.types import StructType, StructField, StringType, TimestampType, ArrayType, DoubleType, IntegerType, BooleanType

# Schema for speech-to-text data from Raspberry Pi devices
stt_schema = StructType([
    StructField("device_id", StringType(), False),
    StructField("timestamp", TimestampType(), False),
    StructField("session_id", StringType(), True),
    StructField("transcript", StringType(), True),
    StructField("confidence", DoubleType(), True),
    StructField("language", StringType(), True),
    StructField("audio_duration_sec", DoubleType(), True),
    StructField("speaker_id", StringType(), True),
    StructField("metadata", StructType([
        StructField("store_id", StringType(), True),
        StructField("location_zone", StringType(), True),
        StructField("model_version", StringType(), True),
        StructField("noise_level_db", DoubleType(), True)
    ]), True)
])

# Schema for visual data from OpenCV on Raspberry Pi
visual_schema = StructType([
    StructField("device_id", StringType(), False),
    StructField("timestamp", TimestampType(), False),
    StructField("session_id", StringType(), True),
    StructField("frame_id", IntegerType(), True),
    StructField("detections", ArrayType(StructType([
        StructField("detection_type", StringType(), True),  # face, gesture, zone, object
        StructField("confidence", DoubleType(), True),
        StructField("bounding_box", StructType([
            StructField("x", IntegerType(), True),
            StructField("y", IntegerType(), True),
            StructField("width", IntegerType(), True),
            StructField("height", IntegerType(), True)
        ]), True),
        StructField("attributes", StructType([
            StructField("age_group", StringType(), True),
            StructField("gender", StringType(), True),
            StructField("gesture_type", StringType(), True),
            StructField("object_class", StringType(), True),
            StructField("zone_id", StringType(), True),
            StructField("motion_direction", StringType(), True),
            StructField("dwell_time_sec", DoubleType(), True)
        ]), True)
    ])), True),
    StructField("metadata", StructType([
        StructField("store_id", StringType(), True),
        StructField("camera_position", StringType(), True),
        StructField("resolution", StringType(), True),
        StructField("fps", DoubleType(), True),
        StructField("model_version", StringType(), True)
    ]), True)
])

@table(name="bronze_stt_raw")
def bronze_stt():
    """
    Ingests raw speech-to-text data from Raspberry Pi devices via Event Hub.
    Source: eh-pi-stt-raw
    """
    return (
        read_stream("eventhub", eventhub_name="eh-pi-stt-raw")
        .withColumn("body", from_json(col("body").cast("string"), stt_schema))
        .select("body.*",
                to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
                current_timestamp().alias("processing_time"))
    )

@table(name="bronze_visual_stream")
def bronze_visual():
    """
    Ingests OpenCV detection data from Raspberry Pi devices via Event Hub.
    Source: eh-pi-visual-stream
    """
    return (
        read_stream("eventhub", eventhub_name="eh-pi-visual-stream")
        .withColumn("body", from_json(col("body").cast("string"), visual_schema))
        .select(
            "body.device_id",
            "body.timestamp",
            "body.session_id",
            "body.frame_id",
            "body.metadata",
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
        .withColumn("detection", explode("body.detections"))
        .select(
            "device_id",
            "timestamp",
            "session_id",
            "frame_id",
            "detection.detection_type",
            "detection.confidence",
            "detection.bounding_box",
            "detection.attributes",
            "metadata",
            "ingestion_time",
            "processing_time"
        )
    )

@table(name="bronze_raw_events")
def bronze_raw():
    """
    Legacy table for backward compatibility.
    Combines both audio and visual events in a single table.
    NOTE: This is deprecated - use bronze_stt_raw and bronze_visual_stream instead.
    """
    # Read from both event hubs and unionize the data
    stt_stream = (
        read_stream("eventhub", eventhub_name="eh-pi-stt-raw")
        .withColumn("body", from_json(col("body").cast("string"), stt_schema))
        .select(
            col("body.device_id").alias("device_id"),
            col("body.timestamp").alias("event_time"),
            lit("stt").alias("event_type"),
            col("body.session_id").alias("session_id"),
            to_json(struct("body.*")).alias("event_data"),
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
    )

    visual_stream = (
        read_stream("eventhub", eventhub_name="eh-pi-visual-stream")
        .withColumn("body", from_json(col("body").cast("string"), visual_schema))
        .select(
            col("body.device_id").alias("device_id"),
            col("body.timestamp").alias("event_time"),
            lit("visual").alias("event_type"),
            col("body.session_id").alias("session_id"),
            to_json(struct("body.*")).alias("event_data"),
            to_timestamp(col("enqueuedTime")).alias("ingestion_time"),
            current_timestamp().alias("processing_time")
        )
    )

    return stt_stream.unionByName(visual_stream)