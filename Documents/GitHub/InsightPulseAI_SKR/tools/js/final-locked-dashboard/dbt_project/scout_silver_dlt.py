from dlt import table, read_stream, expect
from pyspark.sql.functions import col
from pyspark.sql.types import StructType, StringType, TimestampType

schema = StructType().add("event_time", TimestampType()).add("event_type", StringType()).add("user_id", StringType())

@table(name="silver_events")
@expect("valid_event_type", "event_type IS NOT NULL")
def silver():
    df = read_stream("cloudFiles:/mnt/data/streaming-events", format="json", schema=schema)
    return df.filter("event_type IS NOT NULL")