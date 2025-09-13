"""
Standalone demo endpoint for the Juicer Chat with Data API
This is a simplified version for demonstration purposes
"""

import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("juicer.demo")

# Create app
app = FastAPI(
    title="Juicer Chat with Data API Demo",
    description="Demo API for the Juicer Chat with Data module",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class JuicerQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query from the user")
    model: Optional[str] = Field("claude", description="LLM model to use (claude, openai, deepseek)")
    include_sql: Optional[bool] = Field(False, description="Whether to include SQL in response")
    use_rag: Optional[bool] = Field(True, description="Whether to use RAG if structured query fails")

class JuicerQueryResponse(BaseModel):
    answer: str
    sql: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    charts: Optional[List[Dict[str, Any]]] = None
    processing_time: float = 0.5
    model_used: str = "claude"
    confidence: float = 0.9

# Sample data for the demo
SAMPLE_RESPONSES = {
    "sales_comparison": {
        "answer": "Campaign B showed a 23% uplift in sales compared to Campaign A in the NCR region during Q1 2025. Campaign B generated ₱45.2M in total sales versus ₱36.7M for Campaign A, with a higher average transaction value (₱1,250 vs ₱980).",
        "sql": """
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
        """,
        "data": [
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
        "charts": [
            {
                "type": "bar",
                "title": "Total Sales by Campaign in NCR",
                "x_axis": "campaign_name",
                "y_axis": "total_sales",
                "data": [
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
                ]
            }
        ]
    },
    "brand_mentions": {
        "answer": "Jollibee has received 4,253 brand mentions in the last quarter, which is 9.8% higher than the previous quarter. The average sentiment score is 75.2%, showing a positive trend (+3.1%) compared to the previous period.",
        "sql": """
        SELECT 
            entity_normalized AS brand, 
            COUNT(*) AS mention_count,
            ROUND(AVG(sentiment_score) * 100, 1) AS avg_sentiment_pct
        FROM 
            insight_pulse_ai.silver.transcript_entity_mentions
        WHERE 
            entity_type = 'BRAND'
            AND entity_normalized = 'Jollibee'
            AND detection_timestamp >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY 
            brand
        """,
        "data": [
            {
                "brand": "Jollibee",
                "mention_count": 4253,
                "avg_sentiment_pct": 75.2
            }
        ],
        "charts": [
            {
                "type": "line",
                "title": "Jollibee Brand Sentiment over Time",
                "x_axis": "week",
                "y_axis": "sentiment_score",
                "data": [
                    {"week": "Week 1", "sentiment_score": 72.3},
                    {"week": "Week 2", "sentiment_score": 73.5},
                    {"week": "Week 3", "sentiment_score": 74.8},
                    {"week": "Week 4", "sentiment_score": 75.1},
                    {"week": "Week 5", "sentiment_score": 74.9},
                    {"week": "Week 6", "sentiment_score": 75.4},
                    {"week": "Week 7", "sentiment_score": 76.2},
                    {"week": "Week 8", "sentiment_score": 77.1},
                    {"week": "Week 9", "sentiment_score": 77.3},
                    {"week": "Week 10", "sentiment_score": 78.5},
                    {"week": "Week 11", "sentiment_score": 79.2},
                    {"week": "Week 12", "sentiment_score": 79.8}
                ]
            }
        ]
    },
    "insights": {
        "answer": "Based on the analysis of customer transcripts, the positive sentiment toward expanded vegetarian options has been consistently high (76% confidence score) across all major brands in our analysis. KFC and Burger King show the strongest positive sentiment correlation with vegetarian menu items, with customer quotes highlighting 'taste that matches the original' and 'healthier options without sacrificing flavor.'",
        "sql": """
        SELECT 
            insight_id,
            insight_type,
            insight_title,
            insight_text,
            confidence_score,
            array_join(brands_mentioned, ', ') AS brands,
            array_join(summary_tags, ', ') AS tags,
            processing_timestamp
        FROM 
            insight_pulse_ai.platinum.genai_insights
        WHERE 
            insight_type = 'sentiment'
            AND array_contains(summary_tags, 'vegetarian')
        ORDER BY 
            confidence_score DESC
        LIMIT 5
        """,
        "data": [
            {
                "insight_id": "ins_003",
                "insight_type": "sentiment",
                "insight_title": "Positive sentiment toward expanded vegetarian options",
                "confidence_score": 0.76,
                "brands": "KFC, Burger King",
                "tags": "vegetarian, health, menu, alternatives",
                "processing_timestamp": "2025-05-05T09:15:00Z"
            }
        ],
        "charts": [
            {
                "type": "pie",
                "title": "Brand Distribution for Vegetarian Sentiment Insights",
                "dimension": "brand",
                "metric": "mention_count",
                "data": [
                    {"brand": "KFC", "mention_count": 285},
                    {"brand": "Burger King", "mention_count": 237},
                    {"brand": "McDonald's", "mention_count": 196},
                    {"brand": "Jollibee", "mention_count": 142},
                    {"brand": "Wendy's", "mention_count": 98}
                ]
            }
        ]
    }
}

# Endpoint
@app.post("/api/juicer/query", response_model=JuicerQueryResponse)
async def juicer_query(request: JuicerQueryRequest):
    """
    Process a natural language query against Juicer data
    """
    query = request.query.lower()
    logger.info(f"Processing query: {query}")
    
    # Select an appropriate sample response based on the query
    if any(term in query for term in ["campaign", "sales", "revenue", "uplift"]):
        response_data = SAMPLE_RESPONSES["sales_comparison"]
    elif any(term in query for term in ["brand", "mentions", "jollibee"]):
        response_data = SAMPLE_RESPONSES["brand_mentions"]
    elif any(term in query for term in ["insights", "vegetarian", "sentiment", "trends"]):
        response_data = SAMPLE_RESPONSES["insights"]
    else:
        # Default response for unknown queries
        response_data = {
            "answer": f"I don't have specific data for '{request.query}'. Try asking about campaign sales, brand mentions, or insights about vegetarian options.",
            "sql": None,
            "data": None,
            "charts": None
        }
    
    # Include SQL only if requested
    if not request.include_sql:
        response_data["sql"] = None
    
    # Return the response
    return JuicerQueryResponse(
        answer=response_data["answer"],
        sql=response_data["sql"],
        data=response_data["data"],
        charts=response_data["charts"],
        model_used=request.model,
        confidence=0.9 if response_data["data"] else 0.7
    )

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import sys
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    print(f"Starting server on port {port}")
    uvicorn.run("demo_endpoint:app", host="0.0.0.0", port=port, reload=True)