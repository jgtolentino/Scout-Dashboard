"""
LLM Client

This module provides a unified interface to multiple LLM providers
(Claude, OpenAI, DeepSeek) with fallback mechanisms.
"""

import logging
import os
import json
import requests
import time
from typing import Dict, Any, List, Optional, Callable, Union

logger = logging.getLogger("juicer.llm")

# LLM provider configuration
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

# Mock implementation for development/testing
def _mock_llm_response(provider: str, prompt: str) -> str:
    """Return mock LLM responses for testing"""
    if "transform" in prompt.lower() and "structured" in prompt.lower():
        # SAQ rewriter mock
        return json.dumps({
            "metric": "sales",
            "dimensions": ["campaign", "region"],
            "filters": {"campaign": ["Campaign A", "Campaign B"], "region": "NCR"},
            "time_range": "Q1 2025",
            "comparison": {"type": "vs_other", "targets": ["Campaign A", "Campaign B"]}
        })
    elif "sql" in prompt.lower():
        # Text-to-SQL mock
        return """
        SELECT 
            c.campaign_name,
            r.region_name,
            SUM(s.sales_amount) as total_sales,
            COUNT(s.transaction_id) as transaction_count,
            AVG(s.sales_amount) as avg_sale_value
        FROM
            insight_pulse_ai.gold.sales_transactions s
            JOIN insight_pulse_ai.gold.campaigns c ON s.campaign_id = c.campaign_id
            JOIN insight_pulse_ai.gold.regions r ON s.region_id = r.region_id
        WHERE
            c.campaign_name IN ('Campaign A', 'Campaign B')
            AND r.region_name = 'NCR'
            AND s.transaction_date BETWEEN '2025-01-01' AND '2025-03-31'
        GROUP BY
            c.campaign_name,
            r.region_name
        """
    else:
        # General response mock
        return "Based on the data from Q1 2025, Campaign B showed a 23% uplift in sales compared to Campaign A in the NCR region. Campaign B generated ₱45.2M in total sales versus ₱36.7M for Campaign A, with a higher average transaction value (₱1,250 vs ₱980)."

def claude_client(prompt: str) -> str:
    """
    Call Claude API
    
    Args:
        prompt: Prompt to send to Claude
        
    Returns:
        Response text from Claude
    """
    # In production, retrieve API key from secure storage
    api_key = os.environ.get("CLAUDE_API_KEY", "mock_key_for_development")
    
    if api_key == "mock_key_for_development":
        logger.warning("Using mock Claude response - set CLAUDE_API_KEY for production")
        return _mock_llm_response("claude", prompt)
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    
    model = LLM_PROVIDERS["claude"]["model"]
    
    request_body = {
        "model": model,
        "max_tokens": 4000,
        "temperature": 0.3,
        "system": "You are an AI business analyst specialized in helping with business intelligence queries.",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=request_body,
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"Claude API error: {response.status_code} - {response.text}")
            raise Exception(f"Claude API error: {response.status_code}")
        
        response_data = response.json()
        return response_data["content"][0]["text"]
    except Exception as e:
        logger.error(f"Error calling Claude API: {str(e)}")
        raise

def openai_client(prompt: str) -> str:
    """
    Call OpenAI API
    
    Args:
        prompt: Prompt to send to OpenAI
        
    Returns:
        Response text from OpenAI
    """
    # In production, retrieve API key from secure storage
    api_key = os.environ.get("OPENAI_API_KEY", "mock_key_for_development")
    
    if api_key == "mock_key_for_development":
        logger.warning("Using mock OpenAI response - set OPENAI_API_KEY for production")
        return _mock_llm_response("openai", prompt)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    model = LLM_PROVIDERS["openai"]["model"]
    
    request_body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are an AI business analyst specialized in helping with business intelligence queries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 4000
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=request_body,
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            raise Exception(f"OpenAI API error: {response.status_code}")
        
        response_data = response.json()
        return response_data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        raise

def deepseek_client(prompt: str) -> str:
    """
    Call DeepSeek API (mock implementation)
    
    Args:
        prompt: Prompt to send to DeepSeek
        
    Returns:
        Response text from DeepSeek
    """
    # Mock implementation - in production, make actual API call
    logger.info("Using mock DeepSeek response - implement actual API call for production")
    return _mock_llm_response("deepseek", prompt)

def auto_fallback_client(prompt: str, max_retries: int = 2) -> str:
    """
    Attempt to generate response with fallback logic
    
    Args:
        prompt: The prompt to send to the LLM
        max_retries: Maximum number of retries with fallback providers
        
    Returns:
        LLM response text
    """
    providers = ["claude", "openai", "deepseek"]
    errors = []
    
    for i, provider in enumerate(providers):
        if i >= max_retries:
            break
            
        try:
            logger.info(f"Trying provider: {provider}")
            client_fn = get_llm_client(provider)
            return client_fn(prompt)
        except Exception as e:
            error_msg = f"Error with {provider}: {str(e)}"
            logger.warning(error_msg)
            errors.append(error_msg)
    
    # If all attempts failed, raise the error
    raise Exception(f"All LLM providers failed: {', '.join(errors)}")

def get_llm_client(provider: str = "claude") -> Callable[[str], str]:
    """
    Get the appropriate LLM client function
    
    Args:
        provider: LLM provider name (claude, openai, deepseek, auto)
        
    Returns:
        Function that accepts a prompt and returns LLM response
    """
    if provider == "claude":
        return claude_client
    elif provider == "openai":
        return openai_client
    elif provider == "deepseek":
        return deepseek_client
    elif provider == "auto":
        return auto_fallback_client
    else:
        logger.error(f"Unsupported LLM provider: {provider}")
        raise ValueError(f"Unsupported LLM provider: {provider}")

def process_with_llm(context: Dict[str, Any], model: str = "claude") -> str:
    """
    Process context with LLM to generate a response
    
    Args:
        context: Context dictionary with query, data, etc.
        model: LLM model to use
        
    Returns:
        Generated response
    """
    query = context.get("query", "")
    saq = context.get("saq", {})
    sql = context.get("sql")
    data = context.get("data", [])
    rag_results = context.get("rag_results", [])
    
    # Build prompt
    prompt = f"""
    Answer the following business intelligence question:
    
    Question: {query}
    
    """
    
    # Add structured data if available
    if sql and data:
        prompt += f"""
        SQL Query:
        ```sql
        {sql}
        ```
        
        Query Results (first {min(5, len(data))} of {len(data)} rows):
        ```json
        {json.dumps(data[:5], indent=2)}
        ```
        """
    
    # Add RAG results if available
    if rag_results:
        prompt += "\nAdditional context from related documents:\n"
        for i, doc in enumerate(rag_results, 1):
            prompt += f"""
            Document {i} (Source: {doc['source']}):
            {doc['content']}
            """
    
    # Add response guidance
    prompt += """
    Provide a clear, concise answer based on the data provided. Format numbers appropriately and include key insights.
    Avoid phrases like "Based on the data" or "The results show" - just give the direct answer.
    """
    
    # Get client and call LLM
    llm_client = get_llm_client(model)
    return llm_client(prompt)