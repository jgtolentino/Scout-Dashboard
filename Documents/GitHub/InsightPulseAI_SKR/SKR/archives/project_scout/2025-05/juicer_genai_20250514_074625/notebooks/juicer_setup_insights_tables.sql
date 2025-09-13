-- Databricks notebook source
-- MAGIC %md
-- MAGIC # Juicer - Setup Insights Tables
-- MAGIC 
-- MAGIC This notebook creates the necessary database structures for storing GenAI-generated insights in the Platinum layer.
-- MAGIC 
-- MAGIC **Author:** InsightPulseAI Team  
-- MAGIC **Version:** 1.0

-- COMMAND ----------

-- DBTITLE 1,Set Parameters
-- MAGIC %python
-- MAGIC # Configure notebook parameters
-- MAGIC from datetime import datetime
-- MAGIC 
-- MAGIC # Add widgets for parameters
-- MAGIC dbutils.widgets.dropdown("env", "dev", ["dev", "test", "prod"], "Environment")
-- MAGIC dbutils.widgets.dropdown("create_sample_data", "true", ["true", "false"], "Create Sample Data")
-- MAGIC 
-- MAGIC # Get parameter values
-- MAGIC env = dbutils.widgets.get("env")
-- MAGIC create_sample_data = dbutils.widgets.get("create_sample_data").lower() == "true"
-- MAGIC 
-- MAGIC print(f"Environment: {env}")
-- MAGIC print(f"Create Sample Data: {create_sample_data}")

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Create Platinum Schema

-- COMMAND ----------

-- DBTITLE 1,Create Database Schemas
-- Create the necessary schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS insight_pulse_ai.platinum;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Insights Tables

-- COMMAND ----------

-- DBTITLE 1,Create GenAI Insights Table
-- Drop the table if it exists to recreate the schema
DROP TABLE IF EXISTS insight_pulse_ai.platinum.genai_insights;

-- Create the main insights table
CREATE TABLE insight_pulse_ai.platinum.genai_insights (
  insight_id STRING NOT NULL,
  insight_type STRING NOT NULL COMMENT 'Type of insight: general, brand, sentiment, trend',
  insight_title STRING NOT NULL COMMENT 'Concise title describing the insight',
  insight_text STRING NOT NULL COMMENT 'Detailed explanation of the insight with supporting evidence',
  confidence_score FLOAT COMMENT 'Model confidence in this insight (0.0-1.0)',
  source_transcripts ARRAY<STRING> COMMENT 'List of transcript IDs that contributed to this insight',
  brands_mentioned ARRAY<STRING> COMMENT 'Brands mentioned in this insight',
  time_period STRING COMMENT 'Date range this insight covers',
  generated_by STRING COMMENT 'Provider that generated the insight (claude, openai, deepseek)',
  model_name STRING COMMENT 'Specific model used for generation',
  prompt_tokens INT COMMENT 'Number of tokens in the prompt',
  completion_tokens INT COMMENT 'Number of completion tokens generated',
  processing_timestamp TIMESTAMP COMMENT 'When this insight was generated',
  summary_tags ARRAY<STRING> COMMENT 'Tags summarizing key themes in the insight',
  PRIMARY KEY (insight_id)
)
USING DELTA
LOCATION 'dbfs:/mnt/insightpulseai/platinum/genai_insights'
COMMENT 'GenAI generated insights from transcription data';

-- COMMAND ----------

-- DBTITLE 1,Create Insight Actions Table
-- Drop the table if it exists to recreate the schema
DROP TABLE IF EXISTS insight_pulse_ai.platinum.insight_actions;

-- Create the actions table (for recommended actions based on insights)
CREATE TABLE insight_pulse_ai.platinum.insight_actions (
  action_id STRING NOT NULL,
  insight_id STRING NOT NULL,
  action_text STRING NOT NULL COMMENT 'Description of the recommended action',
  priority STRING COMMENT 'Priority level: high, medium, low',
  category STRING COMMENT 'Category of action: product, marketing, operations, etc.',
  status STRING COMMENT 'Current status: pending, in_progress, completed, rejected',
  assigned_to STRING COMMENT 'Person or team assigned to action',
  estimated_impact STRING COMMENT 'Estimated business impact: high, medium, low',
  due_date DATE COMMENT 'Target date for action completion',
  created_timestamp TIMESTAMP COMMENT 'When this action was created',
  updated_timestamp TIMESTAMP COMMENT 'When this action was last updated',
  PRIMARY KEY (action_id),
  CONSTRAINT fk_insight
    FOREIGN KEY (insight_id) 
    REFERENCES insight_pulse_ai.platinum.genai_insights(insight_id)
)
USING DELTA
LOCATION 'dbfs:/mnt/insightpulseai/platinum/insight_actions'
COMMENT 'Recommended actions based on generated insights';

-- COMMAND ----------

-- DBTITLE 1,Create Insights by Brand View
-- Create a view for insights by brand
CREATE OR REPLACE VIEW insight_pulse_ai.platinum.vw_insights_by_brand AS
WITH brand_insights AS (
  SELECT 
    insight_id,
    insight_type,
    insight_title,
    insight_text,
    confidence_score,
    explode(brands_mentioned) AS brand,
    time_period,
    processing_timestamp
  FROM 
    insight_pulse_ai.platinum.genai_insights
)
SELECT 
  brand,
  COUNT(*) AS insight_count,
  ROUND(AVG(confidence_score) * 100, 1) AS avg_confidence_pct,
  COLLECT_LIST(STRUCT(insight_id, insight_title, insight_type, confidence_score)) AS insights
FROM 
  brand_insights
GROUP BY 
  brand
ORDER BY 
  insight_count DESC, avg_confidence_pct DESC;

-- COMMAND ----------

-- DBTITLE 1,Create Insights by Type View
-- Create a view for insights by type
CREATE OR REPLACE VIEW insight_pulse_ai.platinum.vw_insights_by_type AS
SELECT 
  insight_type,
  COUNT(*) AS insight_count,
  ROUND(AVG(confidence_score) * 100, 1) AS avg_confidence_pct,
  COLLECT_LIST(STRUCT(insight_id, insight_title, brands_mentioned, confidence_score)) AS insights,
  MAX(processing_timestamp) AS last_updated
FROM 
  insight_pulse_ai.platinum.genai_insights
GROUP BY 
  insight_type
ORDER BY 
  insight_count DESC;

-- COMMAND ----------

-- DBTITLE 1,Create Trending Tags View
-- Create a view for trending tags
CREATE OR REPLACE VIEW insight_pulse_ai.platinum.vw_trending_tags AS
WITH flattened_tags AS (
  SELECT 
    explode(summary_tags) AS tag,
    insight_type,
    confidence_score,
    processing_timestamp
  FROM 
    insight_pulse_ai.platinum.genai_insights
  WHERE 
    processing_timestamp >= CURRENT_DATE - INTERVAL 30 DAYS
)
SELECT 
  tag,
  COUNT(*) AS tag_count,
  ROUND(AVG(confidence_score) * 100, 1) AS avg_confidence_pct,
  COLLECT_LIST(insight_type) AS insight_types
FROM 
  flattened_tags
GROUP BY 
  tag
HAVING 
  tag_count >= 2
ORDER BY 
  tag_count DESC, avg_confidence_pct DESC
LIMIT 100;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Sample Data

-- COMMAND ----------

-- DBTITLE 1,Create Sample Data
-- MAGIC %python
-- MAGIC # Only create sample data if the parameter is set
-- MAGIC if create_sample_data:
-- MAGIC     from pyspark.sql.types import *
-- MAGIC     import uuid
-- MAGIC     from datetime import datetime, timedelta
-- MAGIC     import random
-- MAGIC     import json
-- MAGIC 
-- MAGIC     # Sample brands
-- MAGIC     brands = ["Jollibee", "McDonald's", "KFC", "Burger King", "Wendy's", "Pizza Hut", "Taco Bell", "Subway"]
-- MAGIC     
-- MAGIC     # Sample insight types
-- MAGIC     insight_types = ["general", "brand", "sentiment", "trend"]
-- MAGIC     
-- MAGIC     # Sample tags
-- MAGIC     tags = [
-- MAGIC         "pricing", "value", "quality", "service", "speed", "cleanliness", "menu", "variety",
-- MAGIC         "taste", "freshness", "convenience", "location", "app", "delivery", "ambiance",
-- MAGIC         "loyalty", "promotion", "family", "breakfast", "lunch", "dinner", "snack"
-- MAGIC     ]
-- MAGIC     
-- MAGIC     # Generate sample insights
-- MAGIC     sample_insights = []
-- MAGIC     
-- MAGIC     for i in range(50):  # Create 50 sample insights
-- MAGIC         # Create insight ID
-- MAGIC         insight_id = f"sample_insight_{uuid.uuid4().hex[:8]}"
-- MAGIC         
-- MAGIC         # Pick random insight type
-- MAGIC         insight_type = random.choice(insight_types)
-- MAGIC         
-- MAGIC         # Generate random title based on type
-- MAGIC         titles = {
-- MAGIC             "general": [
-- MAGIC                 "Increasing focus on value meals across all demographics",
-- MAGIC                 "App usage drives higher average order value",
-- MAGIC                 "Family-oriented promotions show higher conversion rates"
-- MAGIC             ],
-- MAGIC             "brand": [
-- MAGIC                 "Brand loyalty stronger for customers using rewards programs",
-- MAGIC                 "Premium menu items create positive brand associations",
-- MAGIC                 "Sustainability messaging resonates with younger customers"
-- MAGIC             ],
-- MAGIC             "sentiment": [
-- MAGIC                 "Positive sentiment toward expanded vegetarian options",
-- MAGIC                 "Mixed reactions to recent price adjustments",
-- MAGIC                 "Consistent praise for staff friendliness across locations"
-- MAGIC             ],
-- MAGIC             "trend": [
-- MAGIC                 "Rising preference for breakfast items throughout the day",
-- MAGIC                 "Increasing mentions of nutritional concerns in customer feedback",
-- MAGIC                 "Growing comparison shopping behavior among value-conscious customers"
-- MAGIC             ]
-- MAGIC         }
-- MAGIC         
-- MAGIC         insight_title = random.choice(titles[insight_type])
-- MAGIC         
-- MAGIC         # Generate sample text
-- MAGIC         text_templates = [
-- MAGIC             "Analysis of {transcript_count} transcripts reveals that {percentage}% of customers mention {topic} when discussing {brand}. This represents a {trend_direction} trend compared to previous periods. Supporting evidence includes consistent mentions across different demographic segments and geographical locations. Customer quotes like \"{quote}\" highlight this pattern.",
-- MAGIC             "Data from recent interactions shows {brand} is frequently associated with {topic}, with {percentage}% of mentions having positive sentiment. This has {trend_direction} by {change_percentage}% over the last 30 days. Competitive analysis shows this is {comparison} the industry average.",
-- MAGIC             "A recurring theme in {percentage}% of analyzed conversations is the connection between {brand} and {topic}. This insight has a correlation coefficient of 0.{correlation} with purchase intent, suggesting it's a significant factor in customer decision-making."
-- MAGIC         ]
-- MAGIC         
-- MAGIC         insight_text = random.choice(text_templates).format(
-- MAGIC             transcript_count=random.randint(50, 500),
-- MAGIC             percentage=random.randint(20, 85),
-- MAGIC             topic=random.choice(tags),
-- MAGIC             brand=random.choice(brands),
-- MAGIC             trend_direction=random.choice(["an increasing", "a stable", "a decreasing"]),
-- MAGIC             change_percentage=random.randint(5, 25),
-- MAGIC             comparison=random.choice(["above", "below", "consistent with"]),
-- MAGIC             correlation=random.randint(65, 95),
-- MAGIC             quote=f"I really {random.choice(['like', 'love', 'prefer', 'enjoy'])} their {random.choice(['service', 'quality', 'prices', 'options'])}"
-- MAGIC         )
-- MAGIC         
-- MAGIC         # Generate random brands mentioned
-- MAGIC         mentioned_brands = random.sample(brands, random.randint(1, 3))
-- MAGIC         
-- MAGIC         # Generate random transcript IDs
-- MAGIC         source_transcripts = [f"transcript_{uuid.uuid4().hex[:6]}" for _ in range(random.randint(3, 10))]
-- MAGIC         
-- MAGIC         # Generate random tags
-- MAGIC         summary_tags = random.sample(tags, random.randint(2, 5))
-- MAGIC         
-- MAGIC         # Generate random timestamps within the last 30 days
-- MAGIC         days_ago = random.randint(0, 30)
-- MAGIC         processing_timestamp = datetime.now() - timedelta(days=days_ago)
-- MAGIC         
-- MAGIC         # Random confidence score between 0.5 and 0.95
-- MAGIC         confidence_score = round(random.uniform(0.5, 0.95), 2)
-- MAGIC         
-- MAGIC         # Create insight record
-- MAGIC         insight = {
-- MAGIC             "insight_id": insight_id,
-- MAGIC             "insight_type": insight_type,
-- MAGIC             "insight_title": insight_title,
-- MAGIC             "insight_text": insight_text,
-- MAGIC             "confidence_score": confidence_score,
-- MAGIC             "source_transcripts": source_transcripts,
-- MAGIC             "brands_mentioned": mentioned_brands,
-- MAGIC             "time_period": f"{(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')} to {datetime.now().strftime('%Y-%m-%d')}",
-- MAGIC             "generated_by": random.choice(["claude", "openai", "deepseek"]),
-- MAGIC             "model_name": random.choice(["claude-3-sonnet-20240229", "gpt-4-turbo", "deepseek-chat"]),
-- MAGIC             "prompt_tokens": random.randint(500, 2500),
-- MAGIC             "completion_tokens": random.randint(300, 1500),
-- MAGIC             "processing_timestamp": processing_timestamp,
-- MAGIC             "summary_tags": summary_tags
-- MAGIC         }
-- MAGIC         
-- MAGIC         sample_insights.append(insight)
-- MAGIC     
-- MAGIC     # Create DataFrame from sample insights
-- MAGIC     insights_schema = StructType([
-- MAGIC         StructField("insight_id", StringType(), False),
-- MAGIC         StructField("insight_type", StringType(), False),
-- MAGIC         StructField("insight_title", StringType(), False),
-- MAGIC         StructField("insight_text", StringType(), False),
-- MAGIC         StructField("confidence_score", FloatType(), True),
-- MAGIC         StructField("source_transcripts", ArrayType(StringType()), True),
-- MAGIC         StructField("brands_mentioned", ArrayType(StringType()), True),
-- MAGIC         StructField("time_period", StringType(), False),
-- MAGIC         StructField("generated_by", StringType(), False),
-- MAGIC         StructField("model_name", StringType(), True),
-- MAGIC         StructField("prompt_tokens", IntegerType(), True),
-- MAGIC         StructField("completion_tokens", IntegerType(), True),
-- MAGIC         StructField("processing_timestamp", TimestampType(), False),
-- MAGIC         StructField("summary_tags", ArrayType(StringType()), True)
-- MAGIC     ])
-- MAGIC     
-- MAGIC     # Convert to DataFrame
-- MAGIC     insights_df = spark.createDataFrame(sample_insights, schema=insights_schema)
-- MAGIC     
-- MAGIC     # Write to the insights table
-- MAGIC     insights_df.write.format("delta").mode("overwrite").saveAsTable("insight_pulse_ai.platinum.genai_insights")
-- MAGIC     
-- MAGIC     print(f"Created {len(sample_insights)} sample insights")
-- MAGIC     
-- MAGIC     # Generate sample actions
-- MAGIC     sample_actions = []
-- MAGIC     
-- MAGIC     action_templates = [
-- MAGIC         "Update {category} messaging to highlight {topic}",
-- MAGIC         "Train staff on {topic} to improve customer experience",
-- MAGIC         "Develop new {category} campaign focusing on {topic}",
-- MAGIC         "Adjust pricing strategy for {topic} based on competitive analysis",
-- MAGIC         "Enhance mobile app to better showcase {topic}",
-- MAGIC         "Create new loyalty program element centered on {topic}",
-- MAGIC         "Optimize supply chain for {topic} to improve customer satisfaction",
-- MAGIC         "Conduct focus groups on {topic} to gain deeper insights"
-- MAGIC     ]
-- MAGIC     
-- MAGIC     action_categories = ["marketing", "operations", "product", "pricing", "technology", "training", "research"]
-- MAGIC     
-- MAGIC     # Get all insight IDs
-- MAGIC     insight_ids = [insight["insight_id"] for insight in sample_insights]
-- MAGIC     
-- MAGIC     # Create 2-3 actions for each insight
-- MAGIC     for insight_id in insight_ids:
-- MAGIC         # Randomly select number of actions for this insight
-- MAGIC         num_actions = random.randint(1, 3)
-- MAGIC         
-- MAGIC         for j in range(num_actions):
-- MAGIC             action_id = f"action_{uuid.uuid4().hex[:8]}"
-- MAGIC             
-- MAGIC             # Random category and topic
-- MAGIC             category = random.choice(action_categories)
-- MAGIC             topic = random.choice(tags)
-- MAGIC             
-- MAGIC             # Generate action text
-- MAGIC             action_text = random.choice(action_templates).format(category=category, topic=topic)
-- MAGIC             
-- MAGIC             # Random priority
-- MAGIC             priority = random.choice(["high", "medium", "low"])
-- MAGIC             
-- MAGIC             # Random status
-- MAGIC             status = random.choice(["pending", "in_progress", "completed", "rejected"])
-- MAGIC             
-- MAGIC             # Random assigned person
-- MAGIC             assigned_to = random.choice(["Marketing Team", "Operations Team", "Product Team", "Research Team", "Dev Team", None])
-- MAGIC             
-- MAGIC             # Random impact
-- MAGIC             estimated_impact = random.choice(["high", "medium", "low"])
-- MAGIC             
-- MAGIC             # Random due date (between now and 3 months from now)
-- MAGIC             days_ahead = random.randint(7, 90)
-- MAGIC             due_date = datetime.now() + timedelta(days=days_ahead) if random.random() > 0.2 else None
-- MAGIC             
-- MAGIC             # Creation and update timestamps
-- MAGIC             created_timestamp = datetime.now() - timedelta(days=random.randint(1, 30))
-- MAGIC             updated_timestamp = created_timestamp + timedelta(days=random.randint(0, 5))
-- MAGIC             
-- MAGIC             # Create action record
-- MAGIC             action = {
-- MAGIC                 "action_id": action_id,
-- MAGIC                 "insight_id": insight_id,
-- MAGIC                 "action_text": action_text,
-- MAGIC                 "priority": priority,
-- MAGIC                 "category": category,
-- MAGIC                 "status": status,
-- MAGIC                 "assigned_to": assigned_to,
-- MAGIC                 "estimated_impact": estimated_impact,
-- MAGIC                 "due_date": due_date,
-- MAGIC                 "created_timestamp": created_timestamp,
-- MAGIC                 "updated_timestamp": updated_timestamp
-- MAGIC             }
-- MAGIC             
-- MAGIC             sample_actions.append(action)
-- MAGIC     
-- MAGIC     # Create DataFrame from sample actions
-- MAGIC     actions_schema = StructType([
-- MAGIC         StructField("action_id", StringType(), False),
-- MAGIC         StructField("insight_id", StringType(), False),
-- MAGIC         StructField("action_text", StringType(), False),
-- MAGIC         StructField("priority", StringType(), True),
-- MAGIC         StructField("category", StringType(), True),
-- MAGIC         StructField("status", StringType(), True),
-- MAGIC         StructField("assigned_to", StringType(), True),
-- MAGIC         StructField("estimated_impact", StringType(), True),
-- MAGIC         StructField("due_date", DateType(), True),
-- MAGIC         StructField("created_timestamp", TimestampType(), False),
-- MAGIC         StructField("updated_timestamp", TimestampType(), False)
-- MAGIC     ])
-- MAGIC     
-- MAGIC     # Convert to DataFrame
-- MAGIC     actions_df = spark.createDataFrame(sample_actions, schema=actions_schema)
-- MAGIC     
-- MAGIC     # Write to the actions table
-- MAGIC     actions_df.write.format("delta").mode("overwrite").saveAsTable("insight_pulse_ai.platinum.insight_actions")
-- MAGIC     
-- MAGIC     print(f"Created {len(sample_actions)} sample actions")
-- MAGIC else:
-- MAGIC     print("Skipping sample data creation")

-- COMMAND ----------

-- DBTITLE 1,Verify Table Creation
-- Verify the insights table
SELECT 
  insight_type,
  COUNT(*) as insight_count
FROM 
  insight_pulse_ai.platinum.genai_insights
GROUP BY 
  insight_type
ORDER BY 
  insight_count DESC;

-- COMMAND ----------

-- DBTITLE 1,Verify Views
-- Verify brand insights view
SELECT * FROM insight_pulse_ai.platinum.vw_insights_by_brand LIMIT 5;

-- COMMAND ----------

-- Verify insights by type view
SELECT * FROM insight_pulse_ai.platinum.vw_insights_by_type;

-- COMMAND ----------

-- Verify trending tags view
SELECT * FROM insight_pulse_ai.platinum.vw_trending_tags LIMIT 10;

-- COMMAND ----------

-- MAGIC %md
-- MAGIC ## Summary

-- COMMAND ----------

-- DBTITLE 1,Schema Verification
-- MAGIC %python
-- MAGIC # Describe the insights table
-- MAGIC print("GenAI Insights Table Schema:")
-- MAGIC display(spark.sql("DESCRIBE TABLE insight_pulse_ai.platinum.genai_insights"))
-- MAGIC 
-- MAGIC # Describe the actions table
-- MAGIC print("\nInsight Actions Table Schema:")
-- MAGIC display(spark.sql("DESCRIBE TABLE insight_pulse_ai.platinum.insight_actions"))
-- MAGIC 
-- MAGIC # Final message
-- MAGIC if create_sample_data:
-- MAGIC     insight_count = spark.table("insight_pulse_ai.platinum.genai_insights").count()
-- MAGIC     action_count = spark.table("insight_pulse_ai.platinum.insight_actions").count()
-- MAGIC     message = f"Schema creation completed successfully with {insight_count} sample insights and {action_count} sample actions."
-- MAGIC else:
-- MAGIC     message = "Schema creation completed successfully without sample data."
-- MAGIC 
-- MAGIC # Return success
-- MAGIC dbutils.notebook.exit(message)