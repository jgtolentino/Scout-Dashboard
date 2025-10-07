"""
Main FastAPI server for the Creative Intelligence App.
Provides REST API endpoints for creative asset analysis.
"""

import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from extraction.feature_extractor import FeatureExtractor, ExtractedFeatures
from extraction.ocr_layout_parser import LayoutParser
from rag.creative_rag import CreativeRAG, SearchResult

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Creative Intelligence API",
    description="API for analyzing and searching creative assets",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
feature_extractor = FeatureExtractor()
layout_parser = LayoutParser()
rag_system = CreativeRAG()

# Pydantic models
class AssetMetadata(BaseModel):
    """Metadata for a creative asset."""
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    source: Optional[str] = None

class SearchQuery(BaseModel):
    """Search query parameters."""
    query: str
    top_k: int = 5
    filter: Optional[dict] = None

class SearchResponse(BaseModel):
    """Search response with results and insights."""
    results: List[dict]
    insights: str

# API endpoints
@app.post("/assets/upload")
async def upload_asset(
    file: UploadFile = File(...),
    metadata: AssetMetadata = Form(...)
):
    """Upload and process a creative asset."""
    try:
        # Save uploaded file
        file_path = f"data/uploads/{file.filename}"
        os.makedirs("data/uploads", exist_ok=True)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract features
        layout_elements = layout_parser.process_image(file_path)
        features = feature_extractor.extract_features(
            image_path=file_path,
            text=metadata.description,
            layout_elements=layout_elements
        )
        
        # Index in RAG system
        asset_id = os.path.splitext(file.filename)[0]
        success = rag_system.index_asset(
            asset_id=asset_id,
            features={
                'visual_features': features.visual_features.tolist() if features.visual_features is not None else None,
                'text_features': features.text_features.tolist() if features.text_features is not None else None,
                'layout_features': features.layout_features.tolist() if features.layout_features is not None else None
            },
            metadata={
                'title': metadata.title,
                'description': metadata.description,
                'tags': metadata.tags,
                'source': metadata.source,
                'filename': file.filename
            }
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to index asset")
        
        return {"message": "Asset uploaded and processed successfully", "asset_id": asset_id}
        
    except Exception as e:
        logger.error(f"Error processing asset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_assets(query: SearchQuery) -> SearchResponse:
    """Search for similar creative assets and generate insights."""
    try:
        # Search assets
        results = rag_system.search_assets(
            query=query.query,
            top_k=query.top_k,
            filter=query.filter
        )
        
        # Generate insights
        insights = rag_system.generate_insights(
            query=query.query,
            search_results=results
        )
        
        # Convert results to dict format
        results_dict = [
            {
                "id": r.id,
                "score": r.score,
                "metadata": r.metadata
            }
            for r in results
        ]
        
        return SearchResponse(
            results=results_dict,
            insights=insights
        )
        
    except Exception as e:
        logger.error(f"Error searching assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    """Retrieve a specific asset."""
    try:
        asset = rag_system.get_asset(asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return {
            "id": asset.id,
            "metadata": asset.metadata
        }
        
    except Exception as e:
        logger.error(f"Error retrieving asset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    """Delete a specific asset."""
    try:
        success = rag_system.delete_asset(asset_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete asset")
        
        return {"message": "Asset deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting asset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True
    ) 