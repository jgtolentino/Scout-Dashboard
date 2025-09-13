"""
Schema Provider

This module provides table schemas for the Medallion architecture
to support Text-to-SQL generation.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger("juicer.schema")

# Table schemas for the Medallion architecture
# In production, this would be dynamically retrieved from the database
SCHEMA_DEFINITIONS = {
    "insight_pulse_ai.bronze.SalesInteractionTranscripts": {
        "description": "Raw transcripts from sales interactions",
        "columns": [
            {"name": "transcript_id", "type": "string", "description": "Unique identifier for the transcript"},
            {"name": "interaction_id", "type": "string", "description": "Unique identifier for the interaction"},
            {"name": "agent_id", "type": "string", "description": "ID of the agent involved"},
            {"name": "customer_id", "type": "string", "description": "ID of the customer involved"},
            {"name": "raw_transcript", "type": "string", "description": "Raw transcript text"},
            {"name": "interaction_date", "type": "timestamp", "description": "Date and time of the interaction"},
            {"name": "channel", "type": "string", "description": "Communication channel (phone, chat, email)"},
            {"name": "duration_seconds", "type": "integer", "description": "Duration of the interaction in seconds"},
            {"name": "metadata", "type": "struct", "description": "Additional metadata about the transcript"}
        ]
    },
    "insight_pulse_ai.bronze.TranscriptionChunks": {
        "description": "Chunked segments of transcripts for processing",
        "columns": [
            {"name": "chunk_id", "type": "string", "description": "Unique identifier for the chunk"},
            {"name": "transcript_id", "type": "string", "description": "ID of the parent transcript"},
            {"name": "chunk_text", "type": "string", "description": "Text content of the chunk"},
            {"name": "chunk_index", "type": "integer", "description": "Position of the chunk in the transcript"},
            {"name": "speaker", "type": "string", "description": "Speaker identifier (agent or customer)"},
            {"name": "start_time", "type": "float", "description": "Start time in seconds"},
            {"name": "end_time", "type": "float", "description": "End time in seconds"}
        ]
    },
    "insight_pulse_ai.silver.transcript_entity_mentions": {
        "description": "Entities detected in transcripts",
        "columns": [
            {"name": "mention_id", "type": "string", "description": "Unique identifier for the mention"},
            {"name": "transcript_id", "type": "string", "description": "ID of the transcript"},
            {"name": "chunk_id", "type": "string", "description": "ID of the chunk containing the mention"},
            {"name": "entity_text", "type": "string", "description": "Original text of the entity"},
            {"name": "entity_normalized", "type": "string", "description": "Normalized entity name"},
            {"name": "entity_type", "type": "string", "description": "Type of entity (BRAND, PRODUCT, LOCATION, etc.)"},
            {"name": "confidence_score", "type": "float", "description": "Confidence score of the detection"},
            {"name": "detection_timestamp", "type": "timestamp", "description": "When the entity was detected"},
            {"name": "context_before", "type": "string", "description": "Text before the entity"},
            {"name": "context_after", "type": "string", "description": "Text after the entity"},
            {"name": "sentiment_score", "type": "float", "description": "Sentiment score for this mention (-1 to 1)"}
        ]
    },
    "insight_pulse_ai.silver.transcript_brands": {
        "description": "Brand mentions aggregated by transcript",
        "columns": [
            {"name": "transcript_id", "type": "string", "description": "ID of the transcript"},
            {"name": "interaction_date", "type": "date", "description": "Date of the interaction"},
            {"name": "agent_id", "type": "string", "description": "ID of the agent"},
            {"name": "brand_mentions", "type": "array<string>", "description": "Brands mentioned in the transcript"},
            {"name": "brand_sentiment", "type": "map<string,float>", "description": "Sentiment score by brand (-1 to 1)"},
            {"name": "mention_count", "type": "integer", "description": "Total number of brand mentions"},
            {"name": "top_brands", "type": "array<struct>", "description": "Top brands by mention count"}
        ]
    },
    "insight_pulse_ai.silver.transcript_sentiment": {
        "description": "Sentiment analysis of transcripts",
        "columns": [
            {"name": "transcript_id", "type": "string", "description": "ID of the transcript"},
            {"name": "overall_sentiment", "type": "float", "description": "Overall sentiment score (-1 to 1)"},
            {"name": "customer_sentiment", "type": "float", "description": "Customer sentiment score"},
            {"name": "agent_sentiment", "type": "float", "description": "Agent sentiment score"},
            {"name": "emotion_scores", "type": "map<string,float>", "description": "Scores for different emotions"},
            {"name": "sentiment_by_topic", "type": "array<struct>", "description": "Sentiment broken down by topic"}
        ]
    },
    "insight_pulse_ai.gold.reconstructed_transcripts": {
        "description": "Cleaned and reconstructed transcripts",
        "columns": [
            {"name": "transcript_id", "type": "string", "description": "ID of the transcript"},
            {"name": "interaction_id", "type": "string", "description": "ID of the interaction"},
            {"name": "agent_id", "type": "string", "description": "ID of the agent"},
            {"name": "customer_id", "type": "string", "description": "ID of the customer"},
            {"name": "full_transcript", "type": "string", "description": "Complete cleaned transcript"},
            {"name": "transcript_summary", "type": "string", "description": "Summary of the transcript"},
            {"name": "speaker_summary", "type": "string", "description": "Summary of speaker interactions"},
            {"name": "interaction_date", "type": "date", "description": "Date of the interaction"},
            {"name": "topic_categories", "type": "array<string>", "description": "Categories of topics discussed"}
        ]
    },
    "insight_pulse_ai.gold.agent_performance": {
        "description": "Performance metrics for agents",
        "columns": [
            {"name": "agent_id", "type": "string", "description": "ID of the agent"},
            {"name": "date", "type": "date", "description": "Date of performance metrics"},
            {"name": "interaction_count", "type": "integer", "description": "Number of interactions"},
            {"name": "avg_duration", "type": "float", "description": "Average interaction duration in seconds"},
            {"name": "avg_sentiment", "type": "float", "description": "Average customer sentiment score"},
            {"name": "resolution_rate", "type": "float", "description": "Percentage of resolved issues"},
            {"name": "sales_amount", "type": "float", "description": "Total sales amount"},
            {"name": "conversion_rate", "type": "float", "description": "Sales conversion rate"},
            {"name": "performance_score", "type": "float", "description": "Overall performance score"}
        ]
    },
    "insight_pulse_ai.platinum.genai_insights": {
        "description": "GenAI generated insights from transcripts",
        "columns": [
            {"name": "insight_id", "type": "string", "description": "Unique identifier for the insight"},
            {"name": "insight_type", "type": "string", "description": "Type of insight (general, brand, sentiment, trend)"},
            {"name": "insight_title", "type": "string", "description": "Title of the insight"},
            {"name": "insight_text", "type": "string", "description": "Detailed insight text"},
            {"name": "confidence_score", "type": "float", "description": "Confidence score (0.0-1.0)"},
            {"name": "source_transcripts", "type": "array<string>", "description": "Source transcript IDs"},
            {"name": "brands_mentioned", "type": "array<string>", "description": "Brands mentioned in the insight"},
            {"name": "time_period", "type": "string", "description": "Time period covered by the insight"},
            {"name": "generated_by", "type": "string", "description": "Model that generated the insight"},
            {"name": "processing_timestamp", "type": "timestamp", "description": "When the insight was generated"},
            {"name": "summary_tags", "type": "array<string>", "description": "Tags summarizing the insight"}
        ]
    },
    "insight_pulse_ai.platinum.insight_actions": {
        "description": "Recommended actions based on insights",
        "columns": [
            {"name": "action_id", "type": "string", "description": "Unique identifier for the action"},
            {"name": "insight_id", "type": "string", "description": "ID of the insight this action is based on"},
            {"name": "action_text", "type": "string", "description": "Description of the recommended action"},
            {"name": "priority", "type": "string", "description": "Priority level (high, medium, low)"},
            {"name": "category", "type": "string", "description": "Category of action (product, marketing, etc.)"},
            {"name": "status", "type": "string", "description": "Status of the action (pending, in_progress, completed)"},
            {"name": "assigned_to", "type": "string", "description": "Person or team assigned to the action"},
            {"name": "due_date", "type": "date", "description": "Due date for the action"}
        ]
    }
}

def get_table_schema(tables: List[str] = None) -> str:
    """
    Get schema information for specified tables or all tables
    
    Args:
        tables: List of table names to get schema for (None for all tables)
        
    Returns:
        Formatted schema string for Text-to-SQL prompt
    """
    if not tables:
        # Default to all tables
        tables = list(SCHEMA_DEFINITIONS.keys())
    
    schema_parts = []
    for table in tables:
        if table in SCHEMA_DEFINITIONS:
            schema = SCHEMA_DEFINITIONS[table]
            schema_part = f"Table: {table}\nDescription: {schema['description']}\nColumns:\n"
            
            for col in schema["columns"]:
                schema_part += f"  - {col['name']} ({col['type']}): {col['description']}\n"
            
            schema_parts.append(schema_part)
        else:
            logger.warning(f"Schema for table {table} not found")
    
    return "\n".join(schema_parts)