"""
Databricks Connector

This module handles connectivity to Databricks for executing SQL queries
against the Medallion architecture tables.
"""

import logging
import os
import json
from typing import List, Dict, Any, Optional
import time

logger = logging.getLogger("juicer.databricks")

# Constants
DATABRICKS_HOST = os.environ.get("DATABRICKS_HOST", "")
DATABRICKS_TOKEN = os.environ.get("DATABRICKS_TOKEN", "")
DATABRICKS_SQL_PATH = os.environ.get("DATABRICKS_SQL_PATH", "/sql/1.0/warehouses")
DEFAULT_WAREHOUSE_ID = os.environ.get("DATABRICKS_WAREHOUSE_ID", "")
MAX_ROWS = 1000

# Mock results for development
MOCK_RESULTS = {
    "sales_comparison": [
        {
            "campaign_name": "Campaign B",
            "region_name": "NCR",
            "total_sales": 45200000,
            "transaction_count": 36160,
            "avg_sale_value": 1250.0
        },
        {
            "campaign_name": "Campaign A",
            "region_name": "NCR",
            "total_sales": 36700000,
            "transaction_count": 37449,
            "avg_sale_value": 980.0
        }
    ],
    "brand_mentions": [
        {
            "brand": "Jollibee",
            "mention_count": 4253,
            "avg_sentiment_pct": 75.2
        },
        {
            "brand": "McDonald's",
            "mention_count": 3872,
            "avg_sentiment_pct": 72.8
        },
        {
            "brand": "KFC",
            "mention_count": 2514,
            "avg_sentiment_pct": 68.5
        }
    ],
    "agent_performance": [
        {
            "agent_id": "AGT001",
            "interaction_count": 342,
            "avg_sentiment": 0.82,
            "resolution_rate": 0.94,
            "sales_amount": 4250000,
            "conversion_rate": 0.28
        },
        {
            "agent_id": "AGT002",
            "interaction_count": 298,
            "avg_sentiment": 0.75,
            "resolution_rate": 0.89,
            "sales_amount": 3820000,
            "conversion_rate": 0.24
        }
    ]
}

def is_connected_to_databricks() -> bool:
    """
    Check if we have valid Databricks connection parameters
    
    Returns:
        True if we can connect to Databricks, False otherwise
    """
    return bool(DATABRICKS_HOST and DATABRICKS_TOKEN and DEFAULT_WAREHOUSE_ID)

def execute_query(sql: str, max_results: int = MAX_ROWS) -> List[Dict[str, Any]]:
    """
    Execute SQL query against Databricks
    
    Args:
        sql: SQL query to execute
        max_results: Maximum number of results to return
        
    Returns:
        List of dictionaries with query results
    """
    logger.info(f"Executing SQL query: {sql[:100]}...")
    
    # Check if we're connected to Databricks
    if not is_connected_to_databricks():
        logger.warning("Not connected to Databricks - using mock data")
        return _mock_query_results(sql, max_results)
    
    try:
        # TODO: Implement actual Databricks query execution
        # For now, return mock data
        return _mock_query_results(sql, max_results)
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        return []

def _mock_query_results(sql: str, max_results: int) -> List[Dict[str, Any]]:
    """
    Generate mock query results for development
    
    Args:
        sql: SQL query to mock results for
        max_results: Maximum number of results to return
        
    Returns:
        List of dictionaries with mock results
    """
    # Analyze the query to determine what kind of results to return
    sql_lower = sql.lower()
    
    if "campaign" in sql_lower and ("sales" in sql_lower or "revenue" in sql_lower):
        results = MOCK_RESULTS["sales_comparison"]
    elif "brand_mentions" in sql_lower or "entity_mentions" in sql_lower:
        results = MOCK_RESULTS["brand_mentions"]
    elif "agent_performance" in sql_lower:
        results = MOCK_RESULTS["agent_performance"]
    else:
        # Generic empty results
        results = []
    
    # Simulate query execution time
    time.sleep(0.5)
    
    return results[:max_results]

def describe_table(table_name: str) -> Dict[str, Any]:
    """
    Get table description from Databricks
    
    Args:
        table_name: Name of table to describe
        
    Returns:
        Dictionary with table description
    """
    logger.info(f"Describing table: {table_name}")
    
    # In production, query Databricks for table description
    # For now, return mock data from schema provider
    from .schema_provider import SCHEMA_DEFINITIONS
    
    if table_name in SCHEMA_DEFINITIONS:
        return SCHEMA_DEFINITIONS[table_name]
    else:
        logger.warning(f"Table {table_name} not found in schema definitions")
        return {"description": "Unknown table", "columns": []}

def get_available_tables() -> List[str]:
    """
    Get list of available tables from Databricks
    
    Returns:
        List of table names
    """
    logger.info("Getting available tables")
    
    # In production, query Databricks for available tables
    # For now, return mock data from schema provider
    from .schema_provider import SCHEMA_DEFINITIONS
    
    return list(SCHEMA_DEFINITIONS.keys())