from dlt import table, read_stream
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, TimestampType

schema = StructType().add("event_time", TimestampType()).add("event_type", StringType()).add("user_id", StringType())

@table(name="bronze_events")
def bronze():
    return read_stream("cloudFiles:/mnt/data/streaming-events", format="json", schema=schema)