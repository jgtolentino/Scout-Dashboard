# Databricks notebook source
# MAGIC %md
# MAGIC # Genie StockBot - AI-Powered Retail Insights
# MAGIC 
# MAGIC **Azure OpenAI Integration for Scout Analytics**
# MAGIC 
# MAGIC This notebook generates intelligent business recommendations using GPT-4o based on:
# MAGIC - Daily KPI trends from Gold tables
# MAGIC - Product performance metrics
# MAGIC - Regional sales patterns
# MAGIC - Historical data analysis
# MAGIC 
# MAGIC Recommendations are written back to PostgreSQL for dashboard consumption.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🤖 Setup and Configuration

# COMMAND ----------

import openai
import json
import pandas as pd
from datetime import datetime, timedelta
from pyspark.sql.functions import *
from pyspark.sql.types import *
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("🤖 Starting Genie StockBot AI Analysis")
print(f"📅 Execution Time: {datetime.now()}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🔐 Azure OpenAI Configuration

# COMMAND ----------

# Azure OpenAI configuration
openai.api_type = "azure"
openai.api_base = dbutils.secrets.get("scout", "aoai_endpoint")
openai.api_key = dbutils.secrets.get("scout", "aoai_key")
openai.api_version = "2024-05-01-preview"
DEPLOYMENT = dbutils.secrets.get("scout", "aoai_deployment")

# PostgreSQL connection details
POSTGRES_URL = "jdbc:postgresql://pg-scout-prod.postgres.database.azure.com:5432/scout"
POSTGRES_USER = "scout_admin"
POSTGRES_PASSWORD = dbutils.secrets.get("scout", "postgres_pw")
POSTGRES_DRIVER = "org.postgresql.Driver"

print("✅ Azure OpenAI configured")
print(f"🔧 Using deployment: {DEPLOYMENT}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 📊 Data Analysis and Preparation

# COMMAND ----------

print("📊 Analyzing recent performance data...")

try:
    # Read daily KPIs from PostgreSQL
    daily_kpis = (spark.read
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.daily_kpis")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .load()
    )
    
    # Read product performance
    product_performance = (spark.read
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.product_performance")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .load()
    )
    
    # Read regional performance
    regional_performance = (spark.read
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.regional_performance")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .load()
    )
    
    print("✅ Data loaded from PostgreSQL")
    
except Exception as e:
    logger.error(f"❌ Data loading failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 📈 Performance Analysis

# COMMAND ----------

print("📈 Analyzing performance trends...")

try:
    # Last 7 days summary
    recent_kpis = (daily_kpis
        .orderBy(desc("date"))
        .limit(7)
        .agg(
            sum("revenues").alias("revenue_7d"),
            sum("orders").alias("orders_7d"),
            avg("aov").alias("aov_avg_7d"),
            sum("units_sold").alias("units_7d"),
            avg("unique_skus").alias("avg_skus_7d")
        )
        .collect()[0]
    )
    
    # Previous 7 days for comparison
    previous_kpis = (daily_kpis
        .orderBy(desc("date"))
        .limit(14)
        .offset(7)
        .agg(
            sum("revenues").alias("revenue_prev_7d"),
            sum("orders").alias("orders_prev_7d"),
            avg("aov").alias("aov_avg_prev_7d")
        )
        .collect()[0]
    )
    
    # Top performing products (last 7 days)
    top_products = (product_performance
        .groupBy("sku")
        .agg(sum("sku_revenue").alias("total_revenue"))
        .orderBy(desc("total_revenue"))
        .limit(5)
        .collect()
    )
    
    # Top performing regions
    top_regions = (regional_performance
        .groupBy("barangay")
        .agg(sum("region_revenue").alias("total_revenue"))
        .orderBy(desc("total_revenue"))
        .limit(3)
        .collect()
    )
    
    # Calculate growth rates
    revenue_growth = ((recent_kpis['revenue_7d'] - previous_kpis['revenue_prev_7d']) / previous_kpis['revenue_prev_7d'] * 100) if previous_kpis['revenue_prev_7d'] else 0
    orders_growth = ((recent_kpis['orders_7d'] - previous_kpis['orders_prev_7d']) / previous_kpis['orders_prev_7d'] * 100) if previous_kpis['orders_prev_7d'] else 0
    aov_growth = ((recent_kpis['aov_avg_7d'] - previous_kpis['aov_avg_prev_7d']) / previous_kpis['aov_avg_prev_7d'] * 100) if previous_kpis['aov_avg_prev_7d'] else 0
    
    print(f"📊 Revenue (7d): ₱{recent_kpis['revenue_7d']:,.2f} ({revenue_growth:+.1f}%)")
    print(f"📦 Orders (7d): {recent_kpis['orders_7d']:,} ({orders_growth:+.1f}%)")
    print(f"🛒 AOV (7d): ₱{recent_kpis['aov_avg_7d']:.2f} ({aov_growth:+.1f}%)")
    
except Exception as e:
    logger.error(f"❌ Performance analysis failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 🧠 AI Insight Generation

# COMMAND ----------

print("🧠 Generating AI insights with GPT-4o...")

try:
    # Prepare data context for AI
    data_context = {
        "recent_performance": {
            "revenue_7d": float(recent_kpis['revenue_7d']),
            "orders_7d": int(recent_kpis['orders_7d']),
            "aov_7d": float(recent_kpis['aov_avg_7d']),
            "units_7d": int(recent_kpis['units_7d']),
            "unique_skus_7d": float(recent_kpis['avg_skus_7d'])
        },
        "growth_rates": {
            "revenue_growth": revenue_growth,
            "orders_growth": orders_growth,
            "aov_growth": aov_growth
        },
        "top_products": [{"sku": row['sku'], "revenue": float(row['total_revenue'])} for row in top_products],
        "top_regions": [{"barangay": row['barangay'], "revenue": float(row['total_revenue'])} for row in top_regions]
    }
    
    # Create comprehensive prompt
    prompt = f"""
You are Genie StockBot, an AI retail analytics expert for Scout Analytics. 
Analyze the following retail performance data and provide actionable business recommendations.

RECENT PERFORMANCE (Last 7 Days):
• Revenue: ₱{recent_kpis['revenue_7d']:,.2f} ({revenue_growth:+.1f}% vs previous week)
• Orders: {recent_kpis['orders_7d']:,} ({orders_growth:+.1f}% vs previous week)
• Average Order Value: ₱{recent_kpis['aov_avg_7d']:.2f} ({aov_growth:+.1f}% vs previous week)
• Units Sold: {recent_kpis['units_7d']:,}
• Average SKUs per Day: {recent_kpis['avg_skus_7d']:.1f}

TOP PERFORMING PRODUCTS:
{chr(10).join([f"• {product['sku']}: ₱{product['revenue']:,.2f}" for product in data_context['top_products']])}

TOP PERFORMING REGIONS:
{chr(10).join([f"• {region['barangay']}: ₱{region['revenue']:,.2f}" for region in data_context['top_regions']])}

Based on this data, provide exactly 3 specific, actionable recommendations to improve sales performance this week. 
Each recommendation should be:
1. Specific and actionable
2. Based on the data trends shown
3. Focused on immediate impact (next 7 days)

Format your response as a numbered list with brief explanations.
"""

    # Generate AI recommendations
    response = openai.ChatCompletion.create(
        deployment_id=DEPLOYMENT,
        messages=[
            {
                "role": "system", 
                "content": "You are Genie StockBot, an expert retail analytics AI that provides concise, actionable business recommendations based on sales data analysis."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        max_tokens=400,
        temperature=0.4,
        top_p=0.9
    )
    
    ai_recommendation = response.choices[0].message.content.strip()
    
    print("🔮 Genie StockBot Recommendations:")
    print("=" * 50)
    print(ai_recommendation)
    print("=" * 50)
    
except Exception as e:
    logger.error(f"❌ AI insight generation failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 💾 Save Recommendations to PostgreSQL

# COMMAND ----------

print("💾 Saving recommendations to PostgreSQL...")

try:
    # Create recommendation record
    recommendation_data = [
        (
            datetime.now(),
            ai_recommendation,
            json.dumps(data_context),
            float(recent_kpis['revenue_7d']),
            int(recent_kpis['orders_7d']),
            float(recent_kpis['aov_avg_7d']),
            revenue_growth,
            orders_growth,
            aov_growth
        )
    ]
    
    # Define schema for recommendations
    recommendation_schema = StructType([
        StructField("generated_at", TimestampType(), False),
        StructField("recommendation", StringType(), False),
        StructField("data_context", StringType(), True),
        StructField("revenue_7d", DoubleType(), True),
        StructField("orders_7d", LongType(), True),
        StructField("aov_7d", DoubleType(), True),
        StructField("revenue_growth", DoubleType(), True),
        StructField("orders_growth", DoubleType(), True),
        StructField("aov_growth", DoubleType(), True)
    ])
    
    # Create DataFrame
    recommendation_df = spark.createDataFrame(recommendation_data, recommendation_schema)
    
    # Write to PostgreSQL
    (recommendation_df.write
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.ai_recommendations")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .mode("append")
        .save()
    )
    
    print("✅ Recommendations saved to PostgreSQL")
    
    # Also save a summary for dashboard quick access
    summary_data = [(
        datetime.now().date(),
        ai_recommendation[:500],  # Truncated for quick display
        float(recent_kpis['revenue_7d']),
        revenue_growth
    )]
    
    summary_schema = StructType([
        StructField("date", DateType(), False),
        StructField("summary", StringType(), False),
        StructField("revenue", DoubleType(), True),
        StructField("growth_rate", DoubleType(), True)
    ])
    
    summary_df = spark.createDataFrame(summary_data, summary_schema)
    
    (summary_df.write
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", "public.ai_insights_summary")
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .mode("overwrite")
        .save()
    )
    
    print("✅ Summary saved for dashboard")
    
except Exception as e:
    logger.error(f"❌ Saving recommendations failed: {str(e)}")
    raise e

# COMMAND ----------

# MAGIC %md
# MAGIC ## 📊 Performance Insights Summary

# COMMAND ----------

print("📊 Generating Performance Insights Summary...")

try:
    # Additional insights for logging
    insights = {
        "execution_time": datetime.now().isoformat(),
        "data_quality": {
            "kpi_records": daily_kpis.count(),
            "product_records": product_performance.count(),
            "regional_records": regional_performance.count()
        },
        "key_metrics": {
            "revenue_7d": float(recent_kpis['revenue_7d']),
            "revenue_growth": revenue_growth,
            "top_product": top_products[0]['sku'] if top_products else "N/A",
            "top_region": top_regions[0]['barangay'] if top_regions else "N/A"
        },
        "ai_model": {
            "deployment": DEPLOYMENT,
            "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else "N/A"
        }
    }
    
    print("🤖 GENIE STOCKBOT ANALYSIS COMPLETE")
    print("=" * 50)
    print(f"📅 Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"💰 Revenue Trend: {revenue_growth:+.1f}%")
    print(f"📦 Orders Trend: {orders_growth:+.1f}%")
    print(f"🛒 AOV Trend: {aov_growth:+.1f}%")
    print(f"🏆 Top Product: {top_products[0]['sku'] if top_products else 'N/A'}")
    print(f"🌟 Top Region: {top_regions[0]['barangay'] if top_regions else 'N/A'}")
    print(f"🤖 AI Model: {DEPLOYMENT}")
    print("=" * 50)
    
    logger.info(f"Genie StockBot analysis completed: {json.dumps(insights)}")
    
except Exception as e:
    logger.error(f"❌ Summary generation failed: {str(e)}")
    print("⚠️ Summary generation failed, but analysis completed")

# COMMAND ----------

# MAGIC %md
# MAGIC ## ✅ Analysis Completion

# COMMAND ----------

print("🎉 GENIE STOCKBOT ANALYSIS COMPLETED SUCCESSFULLY!")
print(f"⏰ Completion Time: {datetime.now()}")
print("🤖 AI recommendations are now available in the dashboard")
print("📊 Next analysis scheduled according to job configuration")
print("")
print("🔮 Genie StockBot says: Your data-driven insights are ready!")

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC 
# MAGIC **Genie StockBot - AI-Powered Retail Insights**  
# MAGIC *Intelligent business recommendations powered by Azure OpenAI GPT-4o*  
# MAGIC *Integrated with Scout Retail Analytics Platform*
