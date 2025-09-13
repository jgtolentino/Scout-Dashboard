"""
Text-to-SQL Generator

This module converts natural language queries into SQL statements
for executing against the Medallion architecture tables in Databricks.
"""

import logging
import re
from typing import Dict, Any, List, Optional

from .llm_client import get_llm_client
from .schema_provider import get_table_schema

logger = logging.getLogger("juicer.sql")

# Table schemas for Medallion architecture
MEDALLION_LAYERS = {
    "bronze": ["SalesInteractionTranscripts", "TranscriptionChunks"],
    "silver": ["transcript_entity_mentions", "transcript_brands", "transcript_sentiment"],
    "gold": ["reconstructed_transcripts", "transcript_brands", "agent_performance"],
    "platinum": ["genai_insights", "insight_actions"]
}

# SQL generation prompt template
SQL_TEMPLATE = """
You are a SQL expert that translates natural language questions into SQL queries for a data warehouse.
The question needs to be converted to a SQL query that follows best practices.

Here are the available tables in our data warehouse:

{schema}

The structured analytical components extracted from the question are:
{saq}

Question: {query}

Generate a SQL query that accurately answers this question while following these guidelines:
1. Use the most appropriate tables based on the question
2. Include proper joins between related tables
3. Format the SQL clearly with proper indentation
4. Add comments to explain your reasoning
5. Use aggregation functions as needed (COUNT, SUM, AVG, etc.)
6. Limit to 100 rows unless otherwise specified
7. Always qualify column names with table names/aliases

Return SQL query only, without explanation or markdown formatting.
"""

def generate_sql(query: str, saq: Dict[str, Any], model: str = "claude") -> str:
    """
    Generate SQL from natural language query and SAQ
    
    Args:
        query: Natural language query
        saq: Structured Analytical Question components
        model: LLM model to use
        
    Returns:
        SQL query string
    """
    logger.info(f"Generating SQL for query: {query}")
    
    # Get relevant table schemas
    tables = _identify_relevant_tables(saq)
    schema_info = get_table_schema(tables)
    
    # Process with LLM
    llm_client = get_llm_client(model)
    prompt = SQL_TEMPLATE.format(
        query=query,
        saq=saq,
        schema=schema_info
    )
    
    try:
        result = llm_client(prompt)
        
        # Extract SQL from response
        sql_match = re.search(r'```sql\s*([\s\S]*?)\s*```', result)
        if sql_match:
            sql = sql_match.group(1)
        else:
            # If no code block, assume the whole response is SQL
            sql = result
            
        # Basic validation
        if "SELECT" not in sql.upper():
            logger.warning("Generated text doesn't appear to be valid SQL")
            return None
            
        logger.info(f"Successfully generated SQL: {sql}")
        return sql
        
    except Exception as e:
        logger.error(f"Error generating SQL: {str(e)}")
        return None

def _identify_relevant_tables(saq: Dict[str, Any]) -> List[str]:
    """
    Identify relevant tables based on SAQ components
    
    Args:
        saq: Structured Analytical Question components
        
    Returns:
        List of relevant table names
    """
    tables = []
    metric = saq.get("metric", "").lower() if saq.get("metric") else ""
    
    # Mapping metrics to appropriate tables
    if metric in ["sales", "revenue", "transactions"]:
        tables.extend(["gold.agent_performance", "gold.reconstructed_transcripts"])
    elif metric in ["mentions", "brand"]:
        tables.extend(["silver.transcript_entity_mentions", "silver.transcript_brands"])
    elif metric in ["sentiment", "emotion"]:
        tables.extend(["silver.transcript_sentiment", "silver.transcript_brands"])
    elif metric in ["insights", "trends", "patterns"]:
        tables.extend(["platinum.genai_insights", "platinum.insight_actions"])
    else:
        # Default set of tables if metric doesn't match
        tables.extend([
            "gold.reconstructed_transcripts", 
            "silver.transcript_brands",
            "silver.transcript_entity_mentions"
        ])
    
    # Ensure the tables are correctly qualified
    qualified_tables = []
    for table in tables:
        if "." not in table:
            # Assume it's a gold table if not specified
            qualified_tables.append(f"insight_pulse_ai.gold.{table}")
        else:
            # Extract layer and table
            layer, table_name = table.split(".")
            qualified_tables.append(f"insight_pulse_ai.{layer}.{table_name}")
            
    return qualified_tables