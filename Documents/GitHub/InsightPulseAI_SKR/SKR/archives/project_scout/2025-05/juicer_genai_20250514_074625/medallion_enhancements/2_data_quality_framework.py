#!/usr/bin/env python
# 2_data_quality_framework.py - Data Quality Framework Implementation for Medallion Architecture

import sys
import json
import argparse
import os
import requests
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('data_quality_framework')

# Great Expectations Template
GE_CONFIG_TEMPLATE = {
    "name": "juicer_medallion_quality",
    "config_version": 2.0,
    "plugins_directory": None,
    "evaluation_parameter_store_name": "default_evaluation_parameter_store",
    "expectations_store_name": "default_expectations_store",
    "validations_store_name": "default_validations_store",
    "data_docs_sites": {
        "local_site": {
            "class_name": "SiteBuilder",
            "show_how_to_buttons": True,
            "store_backend": {
                "class_name": "TupleFilesystemStoreBackend",
                "base_directory": "data_docs"
            }
        },
        "azure_site": {
            "class_name": "SiteBuilder",
            "store_backend": {
                "class_name": "TupleAzureBlobStoreBackend",
                "container": "data-quality",
                "connection_string": ""
            },
            "site_index_builder": {
                "class_name": "DefaultSiteIndexBuilder"
            }
        }
    }
}

# Bronze Layer Expectations
BRONZE_EXPECTATIONS = [
    {
        "expectation_type": "expect_table_row_count_to_be_between",
        "kwargs": {
            "min_value": 1,
            "max_value": 10000000
        }
    },
    {
        "expectation_type": "expect_table_columns_to_match_set",
        "kwargs": {
            "column_set": ["transcript_id", "session_id", "timestamp", "text", "source", "metadata"],
            "exact_match": False
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "transcript_id"
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "text"
        }
    }
]

# Silver Layer Expectations
SILVER_EXPECTATIONS = [
    {
        "expectation_type": "expect_table_row_count_to_be_between",
        "kwargs": {
            "min_value": 1,
            "max_value": 10000000
        }
    },
    {
        "expectation_type": "expect_table_columns_to_match_set",
        "kwargs": {
            "column_set": ["transcript_id", "session_id", "timestamp", "text", "source", "metadata", 
                         "brand_mentions", "sentiment_score", "processed_timestamp"],
            "exact_match": False
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "brand_mentions"
        }
    },
    {
        "expectation_type": "expect_column_values_to_be_between",
        "kwargs": {
            "column": "sentiment_score",
            "min_value": -1.0,
            "max_value": 1.0
        }
    }
]

# Gold Layer Expectations
GOLD_EXPECTATIONS = [
    {
        "expectation_type": "expect_table_row_count_to_be_between",
        "kwargs": {
            "min_value": 1,
            "max_value": 10000000
        }
    },
    {
        "expectation_type": "expect_table_columns_to_match_set",
        "kwargs": {
            "column_set": ["transcript_id", "session_id", "timestamp", "text", "brand_mentions", 
                         "sentiment_score", "topic", "intent", "processed_timestamp"],
            "exact_match": False
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "topic"
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "intent"
        }
    }
]

# Platinum Layer Expectations
PLATINUM_EXPECTATIONS = [
    {
        "expectation_type": "expect_table_row_count_to_be_between",
        "kwargs": {
            "min_value": 1,
            "max_value": 10000000
        }
    },
    {
        "expectation_type": "expect_table_columns_to_match_set",
        "kwargs": {
            "column_set": ["insight_id", "timestamp", "brand", "insight_type", "insight_text", 
                         "confidence_score", "source_data", "model", "processed_timestamp"],
            "exact_match": False
        }
    },
    {
        "expectation_type": "expect_column_values_to_not_be_null",
        "kwargs": {
            "column": "insight_text"
        }
    },
    {
        "expectation_type": "expect_column_values_to_be_between",
        "kwargs": {
            "column": "confidence_score",
            "min_value": 0.0,
            "max_value": 1.0
        }
    },
    {
        "expectation_type": "expect_column_values_to_be_in_set",
        "kwargs": {
            "column": "model",
            "value_set": ["claude", "openai", "deepseek", "auto"]
        }
    }
]

def get_databricks_token():
    """Get Databricks token from environment or Azure Key Vault"""
    # Check for environment variable first
    token = os.environ.get('DATABRICKS_TOKEN')
    if token:
        return token
    
    # Try to get from Key Vault using Azure CLI
    try:
        import subprocess
        result = subprocess.run(
            ['az', 'keyvault', 'secret', 'show', '--vault-name', 'kv-tbwa-juicer-insights2', 
             '--name', 'DATABRICKS-TOKEN', '--query', 'value', '-o', 'tsv'],
            capture_output=True, text=True, check=True
        )
        token = result.stdout.strip()
        if token:
            return token
    except Exception as e:
        logger.error(f"Failed to get token from Key Vault: {e}")
    
    # If we get here, we couldn't find a token
    logger.error("Databricks token not found in environment or Key Vault")
    return None

def create_notebook_for_layer(layer_name, expectations, workspace_url, token):
    """Create a Databricks notebook for the specified layer with quality checks"""
    notebook_content = f"""
# Databricks notebook source
# MAGIC %md
# MAGIC # {layer_name} Layer Data Quality Validation
# MAGIC 
# MAGIC This notebook implements data quality validation for the {layer_name} layer using Great Expectations.

# COMMAND ----------

# MAGIC %pip install great_expectations

# COMMAND ----------

import great_expectations as ge
from datetime import datetime
import json

# COMMAND ----------

# Configure the context
context = ge.data_context.DataContext.create_ephemeral(
    project_config_dict={json.dumps(GE_CONFIG_TEMPLATE)}
)

# COMMAND ----------

# Connect to the {layer_name.lower()} table
{layer_name.lower()}_df = spark.table("juicer.{layer_name.lower()}")

# COMMAND ----------

# Convert to pandas for Great Expectations
{layer_name.lower()}_pandas_df = {layer_name.lower()}_df.limit(100000).toPandas()
{layer_name.lower()}_ge_df = ge.from_pandas({layer_name.lower()}_pandas_df)

# COMMAND ----------

# Add expectations
{layer_name.lower()}_expectations = {expectations}

for expectation in {layer_name.lower()}_expectations:
    {layer_name.lower()}_ge_df.expect(**expectation)

# COMMAND ----------

# Validate expectations
results = {layer_name.lower()}_ge_df.validate()

# COMMAND ----------

# Save results
validation_time = datetime.now().strftime("%Y%m%d_%H%M%S")
validation_results = {{
    "success": results.success,
    "statistics": results.statistics,
    "results": [{{
        "expectation_type": r.expectation_config.expectation_type,
        "success": r.success,
        "result": r.result
    }} for r in results.results]
}}

# Write to Delta
validation_results_json = json.dumps(validation_results)
spark.sql(f"CREATE TABLE IF NOT EXISTS juicer.{layer_name.lower()}_quality_results (timestamp TIMESTAMP, results STRING)")
spark.sql(f"INSERT INTO juicer.{layer_name.lower()}_quality_results VALUES (current_timestamp(), '{validation_results_json}')")

# COMMAND ----------

# Generate alerts if validation fails
if not results.success:
    failed_expectations = [r for r in results.results if not r.success]
    alert_message = f"{layer_name} Layer Data Quality Validation Failed\\n"
    alert_message += f"Date: {{validation_time}}\\n"
    alert_message += f"Failed Expectations: {{len(failed_expectations)}}\\n"
    
    for i, r in enumerate(failed_expectations):
        alert_message += f"{{i+1}}. {{r.expectation_config.expectation_type}}: {{r.result}}\\n"
    
    # Log the alert
    print(f"ALERT: {{alert_message}}")
    
    # Set a flag to trigger the next step based on failure
    dbutils.notebook.exit({{"success": False, "message": alert_message}})
else:
    dbutils.notebook.exit({{"success": True, "message": f"{layer_name} Layer Data Quality Validation Succeeded"}})
"""
    
    # Create the notebook in Databricks
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "text/plain"
    }
    
    notebook_path = f"/Shared/InsightPulseAI/Juicer/data_quality/{layer_name.lower()}_quality"
    api_url = f"https://{workspace_url}/api/2.0/workspace/import"
    
    # Make API request to create notebook
    try:
        encoded_content = notebook_content.encode("base64")
        response = requests.post(
            api_url,
            headers=headers,
            json={
                "path": notebook_path,
                "format": "SOURCE",
                "language": "PYTHON",
                "content": encoded_content,
                "overwrite": True
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully created notebook for {layer_name} layer at {notebook_path}")
            return notebook_path
        else:
            logger.error(f"Failed to create notebook for {layer_name} layer: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error creating notebook for {layer_name} layer: {e}")
        return None

def update_job_with_quality_check(job_id, notebook_path, workspace_url, token):
    """Update an existing job to include data quality checks"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get current job config
    api_url = f"https://{workspace_url}/api/2.0/jobs/get"
    response = requests.get(api_url, headers=headers, params={"job_id": job_id})
    
    if response.status_code != 200:
        logger.error(f"Failed to get job configuration for job {job_id}: {response.text}")
        return False
    
    job_config = response.json()
    
    # Add quality check notebook as a dependent task
    current_tasks = job_config.get("settings", {}).get("tasks", [])
    
    # Find the main processing task
    main_task = None
    for task in current_tasks:
        if "notebook_task" in task:
            main_task = task
            break
    
    if not main_task:
        logger.error(f"Could not find main notebook task in job {job_id}")
        return False
    
    # Create a new task for quality check that depends on the main task
    quality_task = {
        "task_key": "data_quality_check",
        "depends_on": [
            {"task_key": main_task.get("task_key")}
        ],
        "notebook_task": {
            "notebook_path": notebook_path,
            "base_parameters": {}
        },
        "job_cluster_key": main_task.get("job_cluster_key"),
        "timeout_seconds": 3600,
        "email_notifications": {
            "on_failure": ["${secrets.get('NOTIFICATION_EMAIL')}"]
        }
    }
    
    # Add the new task to the job config
    current_tasks.append(quality_task)
    job_config["settings"]["tasks"] = current_tasks
    
    # Update the job
    update_url = f"https://{workspace_url}/api/2.0/jobs/update"
    update_response = requests.post(update_url, headers=headers, json=job_config)
    
    if update_response.status_code == 200:
        logger.info(f"Successfully updated job {job_id} to include data quality checks")
        return True
    else:
        logger.error(f"Failed to update job {job_id}: {update_response.text}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Setup Data Quality Framework for Medallion Architecture')
    parser.add_argument('--workspace-url', type=str, help='Databricks workspace URL')
    parser.add_argument('--bronze-job-id', type=str, help='Job ID for Bronze layer processing')
    parser.add_argument('--silver-job-id', type=str, help='Job ID for Silver layer processing')
    parser.add_argument('--gold-job-id', type=str, help='Job ID for Gold layer processing')
    parser.add_argument('--platinum-job-id', type=str, help='Job ID for Platinum layer processing')
    args = parser.parse_args()
    
    # Get workspace URL and token
    workspace_url = args.workspace_url
    if not workspace_url:
        # Try to get from environment or Azure CLI
        try:
            import subprocess
            result = subprocess.run(
                ['az', 'databricks', 'workspace', 'show', '--resource-group', 'RG-TBWA-ProjectScout-Juicer', 
                 '--name', 'tbwa-juicer-databricks', '--query', 'properties.workspaceUrl', '-o', 'tsv'],
                capture_output=True, text=True, check=True
            )
            workspace_url = result.stdout.strip()
        except Exception as e:
            logger.error(f"Failed to get workspace URL: {e}")
            return
    
    token = get_databricks_token()
    if not token:
        return
    
    logger.info(f"Setting up Data Quality Framework for workspace {workspace_url}")
    
    # Create directory structure
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    mkdir_url = f"https://{workspace_url}/api/2.0/workspace/mkdirs"
    requests.post(mkdir_url, headers=headers, json={"path": "/Shared/InsightPulseAI/Juicer/data_quality"})
    
    # Create notebooks for each layer
    bronze_notebook = create_notebook_for_layer("Bronze", BRONZE_EXPECTATIONS, workspace_url, token)
    silver_notebook = create_notebook_for_layer("Silver", SILVER_EXPECTATIONS, workspace_url, token)
    gold_notebook = create_notebook_for_layer("Gold", GOLD_EXPECTATIONS, workspace_url, token)
    platinum_notebook = create_notebook_for_layer("Platinum", PLATINUM_EXPECTATIONS, workspace_url, token)
    
    # Update jobs with quality checks
    if args.bronze_job_id and bronze_notebook:
        update_job_with_quality_check(args.bronze_job_id, bronze_notebook, workspace_url, token)
    
    if args.silver_job_id and silver_notebook:
        update_job_with_quality_check(args.silver_job_id, silver_notebook, workspace_url, token)
    
    if args.gold_job_id and gold_notebook:
        update_job_with_quality_check(args.gold_job_id, gold_notebook, workspace_url, token)
    
    if args.platinum_job_id and platinum_notebook:
        update_job_with_quality_check(args.platinum_job_id, platinum_notebook, workspace_url, token)
    
    logger.info("Data Quality Framework setup complete!")

if __name__ == "__main__":
    main()