# Databricks notebook source
# MAGIC %md
# MAGIC # Scout Retail Analytics - ETL Pipeline
# MAGIC 
# MAGIC **Bronze → Silver → Gold ETL Job**
# MAGIC 
# MAGIC This notebook processes raw transaction data from ADLS Gen2 through the medallion architecture:
# MAGIC - **Bronze**: Raw ingestion with minimal transformation
# MAGIC - **Silver**: Cleaned and validated data
# MAGIC - **Gold**: Business-ready aggregated metrics
# MAGIC 
# MAGIC Final Gold tables are written to Azure PostgreSQL for dashboard consumption.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🔧 Setup and Configuration

# COMMAND ----------

from datetime import datetime, timedelta
from pyspark.sql.functions import *
from pyspark.sql.types import *
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("🚀 Starting Scout ETL Pipeline")
print(f"📅 Execution Time: {datetime.now()}")
print(f"🔧 Spark Version: {spark.version}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 📊 Data Source Configuration

# COMMAND ----------

# Data source paths
RAW_PATH = "/mnt/scout/raw/transactions/*.json"
CHECKPOINT_PATH = "/mnt/scout/checkpoints/etl"

# PostgreSQL connection details
POSTGRES_URL = "jdbc:postgresql://pg-scout-prod.postgres.database.azure.com:5432/scout"
POSTGRES_USER = "scout_admin"
POSTGRES_PASSWORD = dbutils.secrets.get("scout", "postgres_pw")
POSTGRES_DRIVER = "org.postgresql.Driver"

# Connection properties
postgres_properties = {
    "user": POSTGRES_USER,
    "password": POSTGRES_PASSWORD,
    "driver": POSTGRES_DRIVER,
    "stringtype": "unspecified"
}

print("✅ Configuration loaded")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🥉 Bronze Layer - Raw Data Ingestion

# COMMAND ----------

print("🥉 Processing Bronze Layer...")

# Define schema for raw transaction data
transaction_schema = StructType([
    StructField("store_id", IntegerType(), True),
    StructField("ts", TimestampType(), True),
    StructField("sku", StringType(), True),
    StructField("qty", IntegerType(), True),
    StructField("peso", DoubleType(), True),
    StructField("request", StringType(), True),
    StructField("suggested", BooleanType(), True),
    StructField("customer_id", IntegerType(), True),
    StructField("barangay", StringType(), True),
    StructField("gender", StringType(), True),
    StructField("age", IntegerType(), True)
])

# Read raw JSON files
try:
    bronze_df = (spark.read
        .schema(transaction_schema)
        .option("multiline", "true")
        .json(RAW_PATH)
        .withColumn("ingest_time", current_timestamp())
        .withColumn("file_name", input_file_name())
    )
    
    # Get record count
    bronze_count = bronze_df.count()
    print(f"📊 Bronze records processed: {bronze_count:,}")
    
    # Write to Bronze table
    (bronze_df.write
        .mode("append")
        .option("mergeSchema", "true")
        .saveAsTable("scout.bronze_transactions")
    )
    
    print("✅ Bronze layer completed")
    
except Exception as e:
    logger.error(f"❌ Bronze layer failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🥈 Silver Layer - Data Cleaning and Validation

# COMMAND ----------

print("🥈 Processing Silver Layer...")

try:
    # Read from Bronze table
    silver_df = (spark.table("scout.bronze_transactions")
        .filter("qty > 0 AND peso > 0")  # Remove invalid transactions
        .filter("ts IS NOT NULL")        # Ensure timestamp exists
        .withColumn("date", to_date("ts"))
        .withColumn("hour", hour("ts"))
        .withColumn("day_of_week", dayofweek("ts"))
        .withColumn("month", month("ts"))
        .withColumn("year", year("ts"))
        # Clean string fields
        .withColumn("barangay", trim(upper(col("barangay"))))
        .withColumn("gender", trim(upper(col("gender"))))
        .withColumn("sku", trim(col("sku")))
        # Add derived fields
        .withColumn("revenue", col("qty") * col("peso"))
        .withColumn("is_weekend", when(col("day_of_week").isin([1, 7]), True).otherwise(False))
    )
    
    # Data quality checks
    silver_count = silver_df.count()
    null_count = silver_df.filter("date IS NULL OR revenue IS NULL").count()
    
    print(f"📊 Silver records processed: {silver_count:,}")
    print(f"🔍 Records with nulls: {null_count:,}")
    
    # Write to Silver table
    (silver_df.write
        .mode("overwrite")
        .option("overwriteSchema", "true")
        .saveAsTable("scout.silver_transactions")
    )
    
    print("✅ Silver layer completed")
    
except Exception as e:
    logger.error(f"❌ Silver layer failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🥇 Gold Layer - Business Metrics

# COMMAND ----------

print("🥇 Processing Gold Layer...")

try:
    # Daily KPIs aggregation
    daily_kpis = (spark.table("scout.silver_transactions")
        .groupBy("date")
        .agg(
            sum("revenue").alias("revenues"),
            countDistinct("customer_id").alias("orders"),
            avg("revenue").alias("aov"),
            sum("qty").alias("units_sold"),
            countDistinct("sku").alias("unique_skus"),
            countDistinct("store_id").alias("active_stores")
        )
        .withColumn("aov", round(col("aov"), 2))
        .withColumn("revenues", round(col("revenues"), 2))
        .orderBy("date")
    )
    
    # Product performance metrics
    product_performance = (spark.table("scout.silver_transactions")
        .groupBy("sku", "date")
        .agg(
            sum("revenue").alias("sku_revenue"),
            sum("qty").alias("sku_quantity"),
            countDistinct("customer_id").alias("sku_customers")
        )
        .withColumn("sku_revenue", round(col("sku_revenue"), 2))
    )
    
    # Regional performance metrics
    regional_performance = (spark.table("scout.silver_transactions")
        .groupBy("barangay", "date")
        .agg(
            sum("revenue").alias("region_revenue"),
            countDistinct("customer_id").alias("region_customers"),
            avg("revenue").alias("region_aov")
        )
        .withColumn("region_revenue", round(col("region_revenue"), 2))
        .withColumn("region_aov", round(col("region_aov"), 2))
    )
    
    # Get counts
    kpi_count = daily_kpis.count()
    product_count = product_performance.count()
    regional_count = regional_performance.count()
    
    print(f"📊 Daily KPIs: {kpi_count:,} records")
    print(f"📊 Product metrics: {product_count:,} records")
    print(f"📊 Regional metrics: {regional_count:,} records")
    
    # Write Gold tables
    daily_kpis.write.mode("overwrite").saveAsTable("scout.gold_daily_kpis")
    product_performance.write.mode("overwrite").saveAsTable("scout.gold_product_performance")
    regional_performance.write.mode("overwrite").saveAsTable("scout.gold_regional_performance")
    
    print("✅ Gold layer completed")
    
except Exception as e:
    logger.error(f"❌ Gold layer failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🐘 PostgreSQL Integration

# COMMAND ----------

print("🐘 Writing to PostgreSQL...")

try:
    # Write daily KPIs to PostgreSQL
    print("📊 Writing daily KPIs...")
    (daily_kpis.write
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.daily_kpis")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .mode("overwrite")
        .save()
    )
    
    # Write product performance
    print("📦 Writing product performance...")
    (product_performance.write
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.product_performance")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .mode("overwrite")
        .save()
    )
    
    # Write regional performance
    print("🗺️ Writing regional performance...")
    (regional_performance.write
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.regional_performance")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .mode("overwrite")
        .save()
    )
    
    print("✅ PostgreSQL integration completed")
    
except Exception as e:
    logger.error(f"❌ PostgreSQL integration failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 📈 Data Quality Summary

# COMMAND ----------

print("📈 Generating Data Quality Summary...")

try:
    # Get final counts from PostgreSQL
    daily_kpis_pg = (spark.read
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.daily_kpis")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .load()
    )
    
    # Summary statistics
    total_revenue = daily_kpis_pg.agg(sum("revenues")).collect()[0][0] or 0
    total_orders = daily_kpis_pg.agg(sum("orders")).collect()[0][0] or 0
    avg_aov = daily_kpis_pg.agg(avg("aov")).collect()[0][0] or 0
    date_range = daily_kpis_pg.agg(min("date"), max("date")).collect()[0]
    
    print("📊 ETL PIPELINE SUMMARY")
    print("=" * 50)
    print(f"📅 Date Range: {date_range[0]} to {date_range[1]}")
    print(f"💰 Total Revenue: ₱{total_revenue:,.2f}")
    print(f"📦 Total Orders: {total_orders:,}")
    print(f"🛒 Average AOV: ₱{avg_aov:.2f}")
    print(f"🥉 Bronze Records: {bronze_count:,}")
    print(f"🥈 Silver Records: {silver_count:,}")
    print(f"🥇 Gold KPI Records: {kpi_count:,}")
    print("=" * 50)
    
    # Log completion
    logger.info("ETL Pipeline completed successfully")
    
except Exception as e:
    logger.error(f"❌ Summary generation failed: {str(e)}")
    print("⚠️ Summary generation failed, but ETL completed")

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Pipeline Completion

# COMMAND ----------

print("🎉 SCOUT ETL PIPELINE COMPLETED SUCCESSFULLY!")
print(f"⏰ Completion Time: {datetime.now()}")
print("📊 Data is now available in PostgreSQL for dashboard consumption")
print("🔄 Next run scheduled according to job configuration")

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC 
# MAGIC **Scout Retail Analytics ETL Pipeline**  
# MAGIC *Automated data processing from ADLS Gen2 to PostgreSQL*  
# MAGIC *Built with Apache Spark on Azure Databricks*
