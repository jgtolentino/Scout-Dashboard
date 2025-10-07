"""
SAQ (Structured Analytical Question) Rewriter

This module converts natural language queries into structured components
that can be used for Text-to-SQL generation and analytical processing.
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional

from .llm_client import get_llm_client

logger = logging.getLogger("juicer.saq")

# Sample prompts for SAQ rewriting
PROMPT_TEMPLATE = """
You are a query understanding system that transforms natural language questions into structured components.
Extract the key analytical components from the user's question.

Query: {query}

Parse the query into these structured components:
1. metric: The primary measurement or KPI (e.g., "sales", "revenue", "mentions", "sentiment")
2. dimensions: Categories or attributes to analyze by (e.g., ["brand", "region", "campaign"])
3. filters: Conditions to limit the data (e.g., {"brand": "Jollibee", "time": "last month"})
4. time_range: Time period for analysis (e.g., "last 7 days", "Q1 2025")
5. comparison: Any explicit comparisons requested (e.g., {"type": "vs_previous", "period": "month"})

Output ONLY valid JSON with these fields. Not every field needs a value - only include what's explicitly or implicitly in the query.
"""

# Function to rewrite query to SAQ
def rewrite_to_saq(query: str, model: str = "claude") -> Dict[str, Any]:
    """
    Rewrite natural language query to Structured Analytical Question (SAQ)
    
    Args:
        query: Natural language query from user
        model: LLM model to use (claude, openai, deepseek)
        
    Returns:
        Dictionary with structured components
    """
    logger.info(f"Rewriting query to SAQ: {query}")
    
    # Process with LLM
    llm_client = get_llm_client(model)
    prompt = PROMPT_TEMPLATE.format(query=query)
    
    try:
        result = llm_client(prompt)
        
        # Extract JSON from response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = result
        
        # Parse and validate
        structured_components = json.loads(json_str)
        logger.info(f"Successfully parsed SAQ: {structured_components}")
        
        # Ensure required fields are present
        required_fields = ["metric", "dimensions", "filters", "time_range", "comparison"]
        for field in required_fields:
            if field not in structured_components:
                structured_components[field] = None
                
        return structured_components
        
    except Exception as e:
        logger.error(f"Error rewriting query to SAQ: {str(e)}")
        # Fallback to basic extraction
        return _fallback_extraction(query)

def _fallback_extraction(query: str) -> Dict[str, Any]:
    """
    Fallback method for basic extraction when LLM fails
    
    Args:
        query: Natural language query
        
    Returns:
        Basic structured components
    """
    logger.info("Using fallback extraction for SAQ")
    
    # Very simple regex-based extraction for common metrics
    metrics = ["sales", "revenue", "mentions", "sentiment", "interactions", "uplift"]
    dimensions = ["brand", "campaign", "region", "product", "channel", "agent"]
    
    # Extract potential metric
    metric = None
    for m in metrics:
        if m in query.lower():
            metric = m
            break
    
    # Extract potential dimensions
    found_dimensions = []
    for d in dimensions:
        if d in query.lower():
            found_dimensions.append(d)
    
    # Return simplified structure
    return {
        "metric": metric,
        "dimensions": found_dimensions if found_dimensions else None,
        "filters": None,
        "time_range": None,
        "comparison": None
    }