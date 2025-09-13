from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import os
import json
import logging
from datetime import datetime

# Import utility modules
from .utils.saq_rewriter import rewrite_to_saq
from .utils.text_to_sql import generate_sql
from .utils.rag_resolver import search_documents
from .utils.llm_client import process_with_llm
from .utils.databricks_connector import execute_query
from .utils.response_formatter import format_response

# Configure logging
logger = logging.getLogger("juicer.query")

# Create router
router = APIRouter(prefix="/juicer", tags=["juicer"])

# Models for request/response
class JuicerQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query from the user")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the query (filters, etc.)")
    model: Optional[str] = Field("claude", description="LLM model to use for processing (claude, openai, deepseek)")
    include_sql: Optional[bool] = Field(False, description="Whether to include generated SQL in the response")
    max_results: Optional[int] = Field(100, description="Maximum number of results to return")
    use_rag: Optional[bool] = Field(True, description="Whether to use RAG if structured query fails")

class StructuredComponent(BaseModel):
    metric: Optional[str] = None
    dimensions: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    time_range: Optional[str] = None
    comparison: Optional[Dict[str, Any]] = None

class JuicerQueryResponse(BaseModel):
    answer: str
    structured_components: Optional[StructuredComponent] = None
    sql: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    charts: Optional[List[Dict[str, Any]]] = None
    sources: Optional[List[Dict[str, Any]]] = None
    processing_time: float
    model_used: str
    confidence: float

# Main query endpoint
@router.post("/query", response_model=JuicerQueryResponse)
async def process_query(
    request: JuicerQueryRequest = Body(...),
):
    """
    Process a natural language query against Juicer data sources
    
    This endpoint implements the dual-resolution approach:
    1. Try structured (SQL) approach first
    2. If that fails, fall back to RAG over unstructured data
    3. Combine results and synthesize a response
    """
    start_time = datetime.now()
    query = request.query
    model = request.model
    logger.info(f"Processing query: {query} with model: {model}")
    
    try:
        # Step 1: Rewrite query to SAQ (Structured Analytical Question)
        logger.info("Rewriting query to SAQ")
        saq_result = rewrite_to_saq(query, model=model)
        structured_components = StructuredComponent(**saq_result)
        
        # Initialize response variables
        sql = None
        data = None
        charts = None
        sources = []
        confidence = 0.0
        
        # Step 2: Try structured approach (Text-to-SQL)
        try:
            logger.info("Attempting structured approach with Text-to-SQL")
            sql = generate_sql(query, saq_result, model=model)
            
            if sql:
                # Execute SQL against Databricks
                logger.info(f"Executing SQL: {sql}")
                data = execute_query(sql, max_results=request.max_results)
                
                # If we have data, we're confident in the result
                if data and len(data) > 0:
                    confidence = 0.9
                    sources.append({
                        "type": "sql",
                        "source": "medallion_tables",
                        "query": sql
                    })
        except Exception as e:
            logger.warning(f"Structured approach failed: {str(e)}")
            sql = None
            data = None
        
        # Step 3: If structured fails or no data, try RAG
        if (not data or len(data) == 0) and request.use_rag:
            logger.info("Structured approach failed or returned no data, trying RAG")
            rag_results = search_documents(query)
            
            if rag_results and len(rag_results) > 0:
                sources.extend([
                    {"type": "document", "source": doc["source"], "score": doc["score"]}
                    for doc in rag_results
                ])
                
                # Adjust confidence based on RAG results
                confidence = max(0.7, confidence)
        
        # Step 4: Generate answer using LLM
        answer_context = {
            "query": query,
            "saq": saq_result,
            "sql": sql if request.include_sql else None,
            "data": data,
            "rag_results": rag_results if 'rag_results' in locals() else None
        }
        
        logger.info("Generating answer with LLM")
        answer = process_with_llm(answer_context, model=model)
        
        # Step 5: Format response with any visualizations
        formatted_response = format_response(answer, data, sql if request.include_sql else None)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return JuicerQueryResponse(
            answer=formatted_response["answer"],
            structured_components=structured_components,
            sql=sql if request.include_sql else None,
            data=data,
            charts=formatted_response.get("charts"),
            sources=sources,
            processing_time=processing_time,
            model_used=model,
            confidence=confidence
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")