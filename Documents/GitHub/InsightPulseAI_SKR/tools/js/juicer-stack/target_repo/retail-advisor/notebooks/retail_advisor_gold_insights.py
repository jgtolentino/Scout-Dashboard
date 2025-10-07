# Databricks notebook source
# MAGIC %md
# MAGIC # Retail Advisor - Gold Layer Insights Generation with GenAI
# MAGIC 
# MAGIC This notebook generates actionable insights from Gold layer transcript data using GenAI (Claude/OpenAI/DeepSeek).
# MAGIC It transforms cleaned transcript data into summarized insights, trends, and narratives.
# MAGIC 
# MAGIC **Author:** Project Scout Team  
# MAGIC **Version:** 1.0

# COMMAND ----------

# DBTITLE 1,Import Libraries
import pandas as pd
import numpy as np
from pyspark.sql import functions as F
from pyspark.sql.types import *
from datetime import datetime, timedelta
import mlflow
import mlflow.sklearn
import re
import json
import os
import requests
import time
import uuid
import logging
from typing import List, Dict, Any, Optional, Union

# Configure notebook parameters
dbutils.widgets.text("date", (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"), "Start Date")
dbutils.widgets.text("end_date", datetime.now().strftime("%Y-%m-%d"), "End Date")
dbutils.widgets.dropdown("env", "dev", ["dev", "test", "prod"], "Environment")
dbutils.widgets.dropdown("model", "claude", ["claude", "openai", "deepseek", "auto"], "LLM Model")
dbutils.widgets.dropdown("generate_dashboard", "true", ["true", "false"], "Generate Dashboard")

# Get parameter values
start_date = dbutils.widgets.get("date")
end_date = dbutils.widgets.get("end_date")
env = dbutils.widgets.get("env")
model_choice = dbutils.widgets.get("model")
generate_dashboard = dbutils.widgets.get("generate_dashboard").lower() == "true"

print(f"Processing data from {start_date} to {end_date}")
print(f"Environment: {env}")
print(f"Model: {model_choice}")
print(f"Generate Dashboard: {generate_dashboard}")

# COMMAND ----------

# DBTITLE 1,Define Constants
# Delta table paths
GOLD_TABLE_PATH = f"dbfs:/mnt/insightpulseai/gold/reconstructed_transcripts"
INSIGHTS_TABLE_PATH = f"dbfs:/mnt/insightpulseai/platinum/genai_insights"

# Schema for insights
insights_schema = StructType([
    StructField("insight_id", StringType(), False),
    StructField("insight_type", StringType(), False),
    StructField("insight_title", StringType(), False),
    StructField("insight_text", StringType(), False),
    StructField("confidence_score", FloatType(), True),
    StructField("source_transcripts", ArrayType(StringType()), True),
    StructField("brands_mentioned", ArrayType(StringType()), True),
    StructField("time_period", StringType(), False),
    StructField("generated_by", StringType(), False),
    StructField("model_name", StringType(), True),
    StructField("prompt_tokens", IntegerType(), True),
    StructField("completion_tokens", IntegerType(), True),
    StructField("processing_timestamp", TimestampType(), False),
    StructField("summary_tags", ArrayType(StringType()), True)
])

# Supported LLM providers
LLM_PROVIDERS = {
    "claude": {
        "name": "Claude",
        "model": "claude-3-sonnet-20240229",
        "token_limit": 100000,
        "fallback": "openai"
    },
    "openai": {
        "name": "OpenAI",
        "model": "gpt-4-turbo",
        "token_limit": 32000,
        "fallback": "deepseek"
    },
    "deepseek": {
        "name": "DeepSeek",
        "model": "deepseek-chat",
        "token_limit": 16000,
        "fallback": None
    }
}

# COMMAND ----------

# DBTITLE 1,Load Gold Layer Transcript Data
# Load gold layer data within date range
gold_df = spark.sql(f"""
SELECT 
  t.transcript_id,
  t.interaction_id,
  t.agent_id,
  t.customer_id,
  t.full_transcript,
  t.transcript_summary,
  t.speaker_summary,
  t.interaction_date,
  b.brand_mentions,
  b.brand_sentiment,
  b.topic_categories
FROM 
  insight_pulse_ai.gold.reconstructed_transcripts t
  LEFT JOIN insight_pulse_ai.gold.transcript_brands b ON t.transcript_id = b.transcript_id
WHERE 
  t.interaction_date BETWEEN '{start_date}' AND '{end_date}'
  AND t.full_transcript IS NOT NULL
  AND LENGTH(t.full_transcript) > 100
""")

# Get count of gold records
gold_count = gold_df.count()
print(f"Loaded {gold_count} gold transcripts between {start_date} and {end_date}")

# Get sample of data (if available)
if gold_count > 0:
    display(gold_df.limit(2))
else:
    print("No gold transcripts found for the specified date range.")
    dbutils.notebook.exit("No gold transcripts found for the specified date range.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## LLM Integration for Insight Generation

# COMMAND ----------

# DBTITLE 1,Define LLM API Clients

def get_llm_client(provider="claude"):
    """
    Factory function to get the appropriate LLM client.
    
    Args:
        provider (str): LLM provider name (claude, openai, deepseek)
        
    Returns:
        callable: A function that can be used to call the LLM
    """
    if provider == "claude":
        return claude_insight_generation
    elif provider == "openai":
        return openai_insight_generation
    elif provider == "deepseek":
        return deepseek_insight_generation
    elif provider == "auto":
        # Auto will try providers in order of preference: Claude, OpenAI, DeepSeek
        return auto_fallback_insight_generation
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

def auto_fallback_insight_generation(prompt, data, max_retries=2):
    """
    Attempt to generate insights with fallback logic.
    
    Args:
        prompt (str): The prompt to send to the LLM
        data (dict): The transcript data context
        max_retries (int): Maximum number of retries with fallback providers
        
    Returns:
        dict: LLM response with insights
    """
    providers = ["claude", "openai", "deepseek"]
    errors = []
    
    for i, provider in enumerate(providers):
        if i >= max_retries:
            break
            
        try:
            print(f"Trying provider: {provider}")
            client_fn = get_llm_client(provider)
            return client_fn(prompt, data)
        except Exception as e:
            error_msg = f"Error with {provider}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
    
    # If all attempts failed, raise the error
    raise Exception(f"All LLM providers failed: {', '.join(errors)}")

def claude_insight_generation(prompt, data):
    """
    Generate insights using Claude API.
    
    Args:
        prompt (str): The prompt to send to Claude
        data (dict): The transcript data context
        
    Returns:
        dict: Claude response with insights
    """
    # In production, API keys should be stored in Azure Key Vault or similar secure storage
    CLAUDE_API_KEY = "sk-ant-api03-..."  # Placeholder for demo - load from KeyVault in prod
    
    if not CLAUDE_API_KEY:
        raise ValueError("Claude API key not configured")
    
    # Prepare the Claude API request
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    
    model = LLM_PROVIDERS["claude"]["model"]
    
    # Prepare request body with system prompt
    request_body = {
        "model": model,
        "max_tokens": 4000,
        "temperature": 0.3,
        "system": "You are an AI business analyst specialized in extracting actionable insights from transcript data. Provide clear, concise, and data-backed insights that could inform business decisions.",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    # Call Claude API
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers=headers,
        json=request_body
    )
    
    if response.status_code != 200:
        raise Exception(f"Claude API error: {response.status_code} - {response.text}")
    
    response_data = response.json()
    
    # Extract message content and usage stats
    result = {
        "text": response_data["content"][0]["text"],
        "model": model,
        "prompt_tokens": response_data.get("usage", {}).get("input_tokens", 0),
        "completion_tokens": response_data.get("usage", {}).get("output_tokens", 0),
        "provider": "claude"
    }
    
    return result

def openai_insight_generation(prompt, data):
    """
    Generate insights using OpenAI API.
    
    Args:
        prompt (str): The prompt to send to OpenAI
        data (dict): The transcript data context
        
    Returns:
        dict: OpenAI response with insights
    """
    # In production, API keys should be stored in Azure Key Vault or similar secure storage
    OPENAI_API_KEY = "sk-..."  # Placeholder for demo - load from KeyVault in prod
    
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key not configured")
    
    # Prepare the OpenAI API request
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    model = LLM_PROVIDERS["openai"]["model"]
    
    # Prepare request body
    request_body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are an AI business analyst specialized in extracting actionable insights from transcript data. Provide clear, concise, and data-backed insights that could inform business decisions."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 4000
    }
    
    # Call OpenAI API
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=request_body
    )
    
    if response.status_code != 200:
        raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
    
    response_data = response.json()
    
    # Extract message content and usage stats
    result = {
        "text": response_data["choices"][0]["message"]["content"],
        "model": model,
        "prompt_tokens": response_data.get("usage", {}).get("prompt_tokens", 0),
        "completion_tokens": response_data.get("usage", {}).get("completion_tokens", 0),
        "provider": "openai"
    }
    
    return result

def deepseek_insight_generation(prompt, data):
    """
    Generate insights using DeepSeek API.
    
    Args:
        prompt (str): The prompt to send to DeepSeek
        data (dict): The transcript data context
        
    Returns:
        dict: DeepSeek response with insights
    """
    # For demo purposes, we'll simulate a response
    # In production, this would make an actual API call to DeepSeek
    
    # Simulate API call
    import time
    time.sleep(2)  # Simulate API latency
    
    # Mock response for demo
    model = LLM_PROVIDERS["deepseek"]["model"]
    result = {
        "text": f"[Simulated DeepSeek response for demo purposes]\n\n# Key Insights from Brand Mentions\n\n1. Customers frequently mention competitor brands when discussing pricing options\n2. There is a positive sentiment trend for our brand compared to last month\n3. Product features X and Y are consistently mentioned as superior to competitors\n\n# Action Recommendations\n\n- Emphasize our competitive pricing in marketing materials\n- Continue to highlight features X and Y in customer communications\n- Address negative sentiments around customer service wait times",
        "model": model,
        "prompt_tokens": len(prompt) // 4,  # Approximate token count
        "completion_tokens": 250,  # Approximate token count
        "provider": "deepseek"
    }
    
    return result

# COMMAND ----------

# DBTITLE 1,Prompt Template Generator
def generate_insight_prompt(data, insight_type="general"):
    """
    Generate prompt for LLM based on data and insight type.
    
    Args:
        data (dict): Transcript data and context
        insight_type (str): Type of insight to generate (general, brand, sentiment, trend)
        
    Returns:
        str: Formatted prompt for LLM
    """
    # Extract key data elements
    full_transcript = data.get("full_transcript", "")
    transcript_summary = data.get("transcript_summary", "")
    speaker_summary = data.get("speaker_summary", "")
    brand_mentions = data.get("brand_mentions", [])
    brand_sentiment = data.get("brand_sentiment", {})
    topic_categories = data.get("topic_categories", [])
    
    # Format brand mentions for prompt
    brand_mentions_str = ""
    if brand_mentions:
        if isinstance(brand_mentions, str):
            try:
                # Try to parse if it's a JSON string
                brand_mentions = json.loads(brand_mentions)
            except:
                brand_mentions = [brand_mentions]
                
        if isinstance(brand_mentions, list):
            brand_mentions_str = "- " + "\n- ".join(brand_mentions)
        else:
            brand_mentions_str = str(brand_mentions)
    
    # Format brand sentiment for prompt
    brand_sentiment_str = ""
    if brand_sentiment:
        if isinstance(brand_sentiment, str):
            try:
                # Try to parse if it's a JSON string
                brand_sentiment = json.loads(brand_sentiment)
            except:
                pass
        
        if isinstance(brand_sentiment, dict):
            lines = []
            for brand, sentiment in brand_sentiment.items():
                lines.append(f"- {brand}: {sentiment}")
            brand_sentiment_str = "\n".join(lines)
        else:
            brand_sentiment_str = str(brand_sentiment)
    
    # Base prompt template
    base_prompt = f"""
You are analyzing customer interaction data to extract valuable business insights.

## TRANSCRIPT SUMMARY
{transcript_summary if transcript_summary else "No summary available."}

## SPEAKER INTERACTION SUMMARY
{speaker_summary if speaker_summary else "No speaker summary available."}

## BRAND MENTIONS
{brand_mentions_str if brand_mentions_str else "No brand mentions detected."}

## BRAND SENTIMENT
{brand_sentiment_str if brand_sentiment_str else "No brand sentiment data available."}

## TOPICS DISCUSSED
{", ".join(topic_categories) if topic_categories else "No topic categories available."}
    """
    
    # Insight-specific prompt additions
    if insight_type == "general":
        prompt = base_prompt + """
Based on the data provided, generate 3-5 key business insights that would be valuable for decision makers. For each insight:

1. Provide a clear, concise title
2. Explain the insight with supporting evidence from the data
3. Suggest potential business actions based on this insight
4. Rate your confidence in this insight (high, medium, or low)

Format your response as JSON with the following structure:
```json
{
  "insights": [
    {
      "title": "Concise insight title",
      "description": "Detailed explanation with supporting evidence",
      "actions": ["Suggested action 1", "Suggested action 2"],
      "confidence": "high|medium|low",
      "tags": ["relevant_tag1", "relevant_tag2"]
    }
  ],
  "summary": "Brief overall summary of key findings",
  "time_period": "Date range analyzed"
}
```
"""
    
    elif insight_type == "brand":
        prompt = base_prompt + """
Focus specifically on brand mentions and competitive positioning in the data. Generate 3-5 key brand-related insights:

1. Identify patterns in how customers compare our brand to competitors
2. Highlight positive and negative brand associations
3. Note any emerging trends in brand perception
4. Suggest ways to improve brand positioning based on the data

Format your response as JSON with the following structure:
```json
{
  "brand_insights": [
    {
      "title": "Concise brand insight title",
      "description": "Detailed explanation with supporting evidence",
      "competitors_mentioned": ["Competitor1", "Competitor2"],
      "brand_attributes": ["Attribute1", "Attribute2"],
      "actions": ["Suggested action 1", "Suggested action 2"],
      "confidence": "high|medium|low"
    }
  ],
  "summary": "Brief overall summary of key brand findings",
  "time_period": "Date range analyzed" 
}
```
"""
    
    elif insight_type == "sentiment":
        prompt = base_prompt + """
Focus specifically on sentiment analysis in the data. Generate 3-5 key sentiment-related insights:

1. Identify emotional patterns in customer interactions
2. Highlight topics that generate the most positive and negative reactions
3. Compare sentiment across different brands mentioned
4. Suggest ways to improve customer sentiment based on the data

Format your response as JSON with the following structure:
```json
{
  "sentiment_insights": [
    {
      "title": "Concise sentiment insight title",
      "description": "Detailed explanation with supporting evidence",
      "sentiment_score": "positive|negative|neutral",
      "intensity": "high|medium|low",
      "topics": ["Topic1", "Topic2"],
      "actions": ["Suggested action 1", "Suggested action 2"],
      "confidence": "high|medium|low"
    }
  ],
  "summary": "Brief overall summary of key sentiment findings",
  "time_period": "Date range analyzed"
}
```
"""
    
    elif insight_type == "trend":
        prompt = base_prompt + """
Look for emerging trends or patterns in the data. Generate 3-5 key trend-related insights:

1. Identify recurring themes or topics
2. Note any shifts in customer preferences or concerns
3. Highlight potential emerging opportunities or threats
4. Suggest ways to capitalize on identified trends

Format your response as JSON with the following structure:
```json
{
  "trend_insights": [
    {
      "title": "Concise trend insight title",
      "description": "Detailed explanation with supporting evidence",
      "trend_direction": "increasing|decreasing|stable",
      "potential_impact": "high|medium|low",
      "timeframe": "immediate|short_term|long_term",
      "actions": ["Suggested action 1", "Suggested action 2"],
      "confidence": "high|medium|low"
    }
  ],
  "summary": "Brief overall summary of key trend findings",
  "time_period": "Date range analyzed"
}
```
"""
    
    return prompt.strip()

# Test prompt generation function
test_data = {
    "full_transcript": "This is a sample transcript discussing brands and products.",
    "transcript_summary": "Customer discussed pricing options for Product X compared to competitors.",
    "speaker_summary": "Agent provided information about pricing and features. Customer expressed interest in lower-cost alternatives.",
    "brand_mentions": ["BrandA", "BrandB", "CompetitorX"],
    "brand_sentiment": {"BrandA": "positive", "BrandB": "neutral", "CompetitorX": "negative"},
    "topic_categories": ["pricing", "product features", "competitors", "promotions"]
}

# Generate sample prompt
sample_prompt = generate_insight_prompt(test_data, insight_type="general")
print(f"Sample prompt length: {len(sample_prompt)} characters")
print("Sample prompt excerpt:")
print(sample_prompt[:500] + "...")

# COMMAND ----------

# DBTITLE 1,Process Transcripts for Insights
def extract_insights_from_json(json_text):
    """
    Extract structured insights from JSON response.
    
    Args:
        json_text (str): The JSON response from the LLM
        
    Returns:
        dict: Extracted and cleaned insights
    """
    # Extract JSON block if enclosed in markdown code blocks
    if "```json" in json_text:
        pattern = r"```json\s*([\s\S]*?)\s*```"
        match = re.search(pattern, json_text)
        if match:
            json_text = match.group(1)
    elif "```" in json_text:
        pattern = r"```\s*([\s\S]*?)\s*```"
        match = re.search(pattern, json_text)
        if match:
            json_text = match.group(1)
    
    # Try to parse the JSON
    try:
        insights_data = json.loads(json_text)
        return insights_data
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"JSON text: {json_text}")
        
        # Fallback: try to extract key parts by removing potential markdown or text
        clean_text = re.sub(r"^.*?{", "{", json_text)
        clean_text = re.sub(r"}.*?$", "}", clean_text)
        
        try:
            return json.loads(clean_text)
        except:
            # Last resort: return dummy structured data
            return {
                "insights": [
                    {
                        "title": "Error parsing insights",
                        "description": "The system was unable to parse the structured insights. Original text is included.",
                        "actions": ["Review raw LLM output manually"],
                        "confidence": "low",
                        "tags": ["parsing_error"]
                    }
                ],
                "summary": "Error processing insights",
                "time_period": f"{start_date} to {end_date}",
                "raw_text": json_text
            }

def prepare_transcript_data(row):
    """
    Prepare transcript data from DataFrame row for LLM processing.
    
    Args:
        row: DataFrame row with transcript data
        
    Returns:
        dict: Prepared data for LLM
    """
    data = {}
    
    # Extract fields from row
    data["transcript_id"] = row["transcript_id"]
    data["interaction_id"] = row["interaction_id"]
    data["agent_id"] = row["agent_id"]
    data["full_transcript"] = row["full_transcript"]
    data["transcript_summary"] = row["transcript_summary"]
    data["speaker_summary"] = row["speaker_summary"]
    data["interaction_date"] = row["interaction_date"].strftime("%Y-%m-%d") if row["interaction_date"] else None
    
    # Process brand mentions if available
    if "brand_mentions" in row and row["brand_mentions"]:
        if isinstance(row["brand_mentions"], str):
            try:
                data["brand_mentions"] = json.loads(row["brand_mentions"])
            except:
                data["brand_mentions"] = row["brand_mentions"]
        else:
            data["brand_mentions"] = row["brand_mentions"]
    else:
        data["brand_mentions"] = []
    
    # Process brand sentiment if available
    if "brand_sentiment" in row and row["brand_sentiment"]:
        if isinstance(row["brand_sentiment"], str):
            try:
                data["brand_sentiment"] = json.loads(row["brand_sentiment"])
            except:
                data["brand_sentiment"] = row["brand_sentiment"]
        else:
            data["brand_sentiment"] = row["brand_sentiment"]
    else:
        data["brand_sentiment"] = {}
    
    # Process topic categories if available
    if "topic_categories" in row and row["topic_categories"]:
        if isinstance(row["topic_categories"], str):
            try:
                data["topic_categories"] = json.loads(row["topic_categories"])
            except:
                # Handle case where it might be a comma-separated string
                if "," in row["topic_categories"]:
                    data["topic_categories"] = [t.strip() for t in row["topic_categories"].split(",")]
                else:
                    data["topic_categories"] = [row["topic_categories"]]
        else:
            data["topic_categories"] = row["topic_categories"]
    else:
        data["topic_categories"] = []
        
    return data

def generate_insights_for_batch(batch_df, insight_types=None):
    """
    Generate insights for a batch of transcripts.
    
    Args:
        batch_df: Spark DataFrame with batch of transcripts
        insight_types: List of insight types to generate (defaults to ["general"])
        
    Returns:
        list: Generated insights
    """
    if insight_types is None:
        insight_types = ["general"]
    
    # Convert to pandas for processing
    batch_pd = batch_df.toPandas()
    
    # Get appropriate LLM client based on configuration
    llm_client = get_llm_client(model_choice)
    
    # List to store all insights
    all_insights = []
    
    # Process each transcript for each insight type
    for _, row in batch_pd.iterrows():
        transcript_data = prepare_transcript_data(row)
        transcript_id = transcript_data["transcript_id"]
        
        for insight_type in insight_types:
            # Generate insight ID
            insight_id = f"insight_{insight_type}_{transcript_id}_{uuid.uuid4().hex[:8]}"
            
            # Generate prompt for this insight type
            prompt = generate_insight_prompt(transcript_data, insight_type)
            
            try:
                # Call LLM client to generate insights
                llm_response = llm_client(prompt, transcript_data)
                
                # Extract response text and metadata
                response_text = llm_response["text"]
                model_name = llm_response["model"]
                prompt_tokens = llm_response["prompt_tokens"]
                completion_tokens = llm_response["completion_tokens"]
                provider = llm_response["provider"]
                
                # Parse structured insights from response
                parsed_insights = extract_insights_from_json(response_text)
                
                # Determine key for this insight type
                if insight_type == "general":
                    insights_key = "insights"
                else:
                    insights_key = f"{insight_type}_insights"
                
                # Extract insights array
                if insights_key in parsed_insights:
                    insights_array = parsed_insights[insights_key]
                else:
                    # Fallback if the expected key isn't found
                    for key in parsed_insights.keys():
                        if isinstance(parsed_insights[key], list):
                            insights_array = parsed_insights[key]
                            break
                    else:
                        insights_array = []
                
                # Process each insight
                for idx, insight in enumerate(insights_array):
                    # Extract data
                    title = insight.get("title", f"Insight {idx+1}")
                    description = insight.get("description", "")
                    confidence = insight.get("confidence", "medium").lower()
                    
                    # Convert confidence to numeric score
                    confidence_map = {"high": 0.9, "medium": 0.7, "low": 0.5}
                    confidence_score = confidence_map.get(confidence, 0.7)
                    
                    # Extract tags
                    tags = insight.get("tags", [])
                    if not tags:
                        # Try to extract from other fields
                        all_tags = []
                        if "topics" in insight:
                            all_tags.extend(insight["topics"])
                        if "brand_attributes" in insight:
                            all_tags.extend(insight["brand_attributes"])
                        if "competitors_mentioned" in insight:
                            all_tags.extend(insight["competitors_mentioned"])
                        tags = all_tags
                    
                    # Ensure tags is a list
                    if isinstance(tags, str):
                        tags = [t.strip() for t in tags.split(",")]
                    
                    # Create insight record
                    insight_record = {
                        "insight_id": f"{insight_id}_{idx}",
                        "insight_type": insight_type,
                        "insight_title": title,
                        "insight_text": description,
                        "confidence_score": confidence_score,
                        "source_transcripts": [transcript_id],
                        "brands_mentioned": transcript_data.get("brand_mentions", []),
                        "time_period": f"{start_date} to {end_date}",
                        "generated_by": provider,
                        "model_name": model_name,
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "processing_timestamp": datetime.now(),
                        "summary_tags": tags
                    }
                    
                    all_insights.append(insight_record)
                
            except Exception as e:
                print(f"Error generating insights for transcript {transcript_id}, type {insight_type}: {str(e)}")
                
                # Create error record
                error_record = {
                    "insight_id": insight_id,
                    "insight_type": f"{insight_type}_error",
                    "insight_title": "Error generating insight",
                    "insight_text": f"Error: {str(e)}",
                    "confidence_score": 0.1,
                    "source_transcripts": [transcript_id],
                    "brands_mentioned": transcript_data.get("brand_mentions", []),
                    "time_period": f"{start_date} to {end_date}",
                    "generated_by": model_choice,
                    "model_name": LLM_PROVIDERS[model_choice]["model"],
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "processing_timestamp": datetime.now(),
                    "summary_tags": ["error"]
                }
                
                all_insights.append(error_record)
    
    return all_insights

# COMMAND ----------

# DBTITLE 1,Process Transcripts in Batches
# Determine batch size based on dataset size
total_count = gold_df.count()
batch_size = min(10, max(1, total_count // 10))  # Aim for 10 batches, minimum batch size of 1

print(f"Processing {total_count} transcripts in batches of {batch_size}")

# Collect all insights
all_batch_insights = []

# Process in batches
insight_types = ["general", "brand", "sentiment", "trend"]

# Use window function to create batch IDs
from pyspark.sql.window import Window
gold_df_with_batch = gold_df.withColumn(
    "batch_id", 
    F.ntile(total_count // batch_size + 1).over(Window.orderBy("interaction_date"))
)

# Get distinct batch IDs
batch_ids = [row["batch_id"] for row in gold_df_with_batch.select("batch_id").distinct().collect()]

# Process each batch
for batch_id in batch_ids:
    print(f"Processing batch {batch_id}...")
    
    # Get batch data
    batch_df = gold_df_with_batch.filter(F.col("batch_id") == batch_id)
    batch_count = batch_df.count()
    
    # Generate insights for this batch
    batch_insights = generate_insights_for_batch(batch_df, insight_types)
    
    # Add to collection
    all_batch_insights.extend(batch_insights)
    
    print(f"  - Generated {len(batch_insights)} insights from {batch_count} transcripts")

# Convert insights to DataFrame
if all_batch_insights:
    insights_pd = pd.DataFrame(all_batch_insights)
    insights_spark = spark.createDataFrame(insights_pd, schema=insights_schema)
    
    print(f"Generated {len(all_batch_insights)} total insights")
    display(insights_spark.limit(5))
else:
    print("No insights generated")
    insights_spark = spark.createDataFrame([], schema=insights_schema)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Aggregation and Consolidation of Insights

# COMMAND ----------

# DBTITLE 1,Aggregate and Consolidate Insights
# Define UDFs for JSON handling
@F.udf(returnType=ArrayType(StringType()))
def extract_array_from_json_str(json_str):
    """Extract array from JSON string"""
    if not json_str:
        return []
    
    try:
        if isinstance(json_str, str):
            return json.loads(json_str)
        elif isinstance(json_str, list):
            return json_str
        else:
            return []
    except:
        return []

# Group insights by type to create consolidated view
if 'insights_spark' in locals() and insights_spark.count() > 0:
    # Register temp view for SQL
    insights_spark.createOrReplaceTempView("temp_insights")
    
    # Create consolidated insights by type
    consolidated_insights = spark.sql("""
    SELECT
      insight_type,
      COUNT(*) as insight_count,
      ROUND(AVG(confidence_score) * 100, 1) as avg_confidence,
      COLLECT_LIST(insight_title) as top_insight_titles,
      ARRAY_DISTINCT(FLATTEN(COLLECT_LIST(brands_mentioned))) as all_brands_mentioned,
      ARRAY_DISTINCT(FLATTEN(COLLECT_LIST(summary_tags))) as all_tags,
      MIN(processing_timestamp) as earliest_insight,
      MAX(processing_timestamp) as latest_insight,
      time_period
    FROM
      temp_insights
    GROUP BY
      insight_type, time_period
    """)
    
    display(consolidated_insights)
    
    # Find most common tags
    common_tags = spark.sql("""
    WITH flattened AS (
      SELECT 
        explode(summary_tags) as tag
      FROM 
        temp_insights
    )
    SELECT
      tag,
      COUNT(*) as tag_count
    FROM
      flattened
    GROUP BY
      tag
    ORDER BY
      tag_count DESC
    LIMIT 20
    """)
    
    display(common_tags)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Write Insights to Platinum Layer

# COMMAND ----------

# DBTITLE 1,Write Insights to Platinum Layer
# Write insights to Delta table
if 'insights_spark' in locals() and insights_spark.count() > 0:
    # Write to Delta table
    insights_spark.write \
        .format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .save(INSIGHTS_TABLE_PATH)
    
    # Create table if it doesn't exist
    spark.sql(f"""
    CREATE TABLE IF NOT EXISTS insight_pulse_ai.platinum.genai_insights
    USING DELTA
    LOCATION '{INSIGHTS_TABLE_PATH}'
    """)
    
    print(f"Successfully wrote {insights_spark.count()} insights to Platinum layer")
else:
    print("No insights to write")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Summary and MLflow Logging

# COMMAND ----------

# DBTITLE 1,Log Process Metrics to MLflow
# Start a new MLflow run
mlflow.start_run(run_name=f"retail-advisor_insights_generation_{start_date}_to_{end_date}")

# Log parameters
mlflow.log_param("start_date", start_date)
mlflow.log_param("end_date", end_date)
mlflow.log_param("environment", env)
mlflow.log_param("model_choice", model_choice)
mlflow.log_param("insight_types", ",".join(insight_types))

# Log metrics
mlflow.log_metric("gold_records_processed", gold_count)
mlflow.log_metric("insights_generated", len(all_batch_insights) if 'all_batch_insights' in locals() else 0)

if 'insights_spark' in locals() and insights_spark.count() > 0:
    avg_confidence = insights_spark.select(F.avg("confidence_score")).first()[0]
    mlflow.log_metric("avg_confidence_score", avg_confidence)
    
    # Log insight counts by type
    insight_counts = insights_spark.groupBy("insight_type").count().collect()
    for row in insight_counts:
        insight_type = row["insight_type"]
        count = row["count"]
        mlflow.log_metric(f"insight_type_{insight_type}_count", count)

# Create artifact
summary = {
    "start_date": start_date,
    "end_date": end_date,
    "gold_records_processed": gold_count,
    "insights_generated": len(all_batch_insights) if 'all_batch_insights' in locals() else 0,
    "insight_types": insight_types,
    "model_used": model_choice,
    "status": "success",
    "timestamp": datetime.now().isoformat()
}

# Save summary as JSON
with open("/tmp/insights_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

# Log artifact
mlflow.log_artifact("/tmp/insights_summary.json")

# End the MLflow run
mlflow.end_run()

print("Process complete. Summary logged to MLflow.")

# COMMAND ----------

# Return success
dbutils.notebook.exit(json.dumps({"status": "success", "processed_records": gold_count, "insights_generated": len(all_batch_insights) if 'all_batch_insights' in locals() else 0}))