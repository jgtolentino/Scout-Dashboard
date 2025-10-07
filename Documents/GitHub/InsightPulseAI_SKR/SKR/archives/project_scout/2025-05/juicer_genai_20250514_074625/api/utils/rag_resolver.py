"""
RAG (Retrieval Augmented Generation) Resolver

This module handles the retrieval of relevant documents and context
from unstructured data sources when the structured query approach fails.
"""

import logging
from typing import List, Dict, Any, Optional
import os
import json
import re

logger = logging.getLogger("juicer.rag")

# Constants for RAG configuration
DEFAULT_NUM_RESULTS = 5
DEFAULT_SIMILARITY_THRESHOLD = 0.7
INDEX_PATH = os.environ.get("JUICER_RAG_INDEX_PATH", "/data/juicer/indexes")

# Mock implementation for document store
# In production, this would use a vector database like Chroma, FAISS, etc.
class DocumentStore:
    def __init__(self, index_path: str = INDEX_PATH):
        self.index_path = index_path
        logger.info(f"Initializing document store with index path: {index_path}")
        
        # In production, load actual indexes
        self.mock_documents = [
            {
                "id": "doc_001",
                "content": "Sales for Campaign B showed a 23% uplift compared to Campaign A in the NCR region during Q1 2025.",
                "metadata": {
                    "source": "SalesInteractionTranscripts",
                    "date": "2025-03-15",
                    "author": "Sales Analytics Team"
                }
            },
            {
                "id": "doc_002",
                "content": "Jollibee brand mentions have increased by 15% in the last quarter, with sentiment scores improving from 0.68 to 0.75.",
                "metadata": {
                    "source": "BrandAnalysisReport",
                    "date": "2025-04-02",
                    "author": "Brand Strategy Team"
                }
            },
            {
                "id": "doc_003",
                "content": "Customer sentiment toward expanded vegetarian options has been overwhelmingly positive across all major brands in our analysis.",
                "metadata": {
                    "source": "SentimentAnalysis",
                    "date": "2025-03-22",
                    "author": "Consumer Insights Team"
                }
            }
        ]
    
    def search(self, query: str, limit: int = DEFAULT_NUM_RESULTS) -> List[Dict[str, Any]]:
        """Mock search implementation"""
        # In production, perform vector similarity search
        # For now, simple keyword matching
        results = []
        for doc in self.mock_documents:
            # Calculate a mock score based on keyword overlap
            keywords = set(re.findall(r'\w+', query.lower()))
            doc_words = set(re.findall(r'\w+', doc["content"].lower()))
            overlap = len(keywords.intersection(doc_words))
            score = overlap / max(len(keywords), 1)
            
            if score > 0:
                results.append({
                    "id": doc["id"],
                    "content": doc["content"],
                    "source": doc["metadata"]["source"],
                    "date": doc["metadata"]["date"],
                    "score": score
                })
        
        # Sort by score and limit results
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

# Initialize document store (singleton)
_document_store = None

def get_document_store() -> DocumentStore:
    """Get the document store singleton"""
    global _document_store
    if _document_store is None:
        _document_store = DocumentStore()
    return _document_store

def search_documents(query: str, limit: int = DEFAULT_NUM_RESULTS) -> List[Dict[str, Any]]:
    """
    Search for relevant documents based on the query
    
    Args:
        query: Natural language query
        limit: Maximum number of results to return
        
    Returns:
        List of document dictionaries with content and metadata
    """
    logger.info(f"Searching documents for query: {query}")
    document_store = get_document_store()
    
    try:
        results = document_store.search(query, limit=limit)
        logger.info(f"Found {len(results)} relevant documents")
        
        # Filter low-relevance results
        filtered_results = [r for r in results if r["score"] >= DEFAULT_SIMILARITY_THRESHOLD]
        logger.info(f"After filtering: {len(filtered_results)} documents")
        
        return filtered_results
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return []

def extract_context_from_documents(documents: List[Dict[str, Any]]) -> str:
    """
    Extract context from retrieved documents for LLM consumption
    
    Args:
        documents: List of document dictionaries
        
    Returns:
        Formatted context string
    """
    if not documents:
        return ""
    
    context_parts = []
    for i, doc in enumerate(documents, 1):
        context_parts.append(
            f"[Document {i}] Source: {doc['source']}, Date: {doc.get('date', 'Unknown')}\n"
            f"{doc['content']}\n"
        )
    
    return "\n".join(context_parts)