"""
SlideForge API routes for FastAPI backend
"""

import os
import json
import uuid
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Body, Path, Depends
from pydantic import BaseModel, Field

# Import MCP communication helpers
try:
    from services.mcp_agent import MCPAgentService
except ImportError:
    # Mock implementation if MCP service not yet available
    class MCPAgentService:
        async def execute_agent(self, agent_id, payload):
            return {"status": "mock", "message": "MCP service not implemented"}

# Models for request/response validation
class GenerateDeckRequest(BaseModel):
    topic: str = Field(..., description="The topic or description for the slide deck")
    slides: int = Field(5, description="Number of slides to generate")
    style: str = Field("professional", description="Style of the presentation")
    audience: Optional[str] = Field(None, description="The target audience for the presentation")
    output_file: Optional[str] = Field(None, description="Output filename (without extension)")

class RenderSlidesRequest(BaseModel):
    filename: str = Field(..., description="JSON file to render (without extension)")
    template: str = Field("default", description="Template style to use for rendering")

class ReviewDeckRequest(BaseModel):
    filename: str = Field(..., description="JSON file to review (without extension)")
    focus_areas: List[str] = Field(["tone", "clarity", "pacing"], description="Areas to focus feedback on")

class PublishDeckRequest(BaseModel):
    filename: str = Field(..., description="JSON file to publish (without extension)")
    format: str = Field("html", description="Output format for publishing")
    destination: str = Field("local", description="Where to publish the deck")

class EditSlideRequest(BaseModel):
    filename: str = Field(..., description="JSON file containing the deck")
    slide_index: int = Field(..., description="Index of slide to edit (0-based)")
    changes: Dict[str, Any] = Field(..., description="Changes to apply to the slide")

class SlideDeckResponse(BaseModel):
    id: str = Field(..., description="Unique identifier for the slide deck")
    filename: str = Field(..., description="Filename of the slide deck")
    title: str = Field(..., description="Title of the slide deck")
    slide_count: int = Field(..., description="Number of slides in the deck")
    created_at: str = Field(..., description="Creation timestamp")
    url: Optional[str] = Field(None, description="URL to access the slide deck")

# Router definition
router = APIRouter(
    prefix="/api/slideforge",
    tags=["slideforge"],
    responses={404: {"description": "Not found"}},
)

# Dependency to get MCP service
async def get_mcp_service():
    # In a real implementation, this would get the service from a dependency injection system
    return MCPAgentService()

# Slide deck storage directory
SLIDES_DIR = os.environ.get("SLIDES_DIR", "./data/slides")

# Ensure slides directory exists
os.makedirs(SLIDES_DIR, exist_ok=True)

@router.post("/generate", response_model=SlideDeckResponse)
async def generate_deck(
    request: GenerateDeckRequest, 
    background_tasks: BackgroundTasks,
    mcp_service: MCPAgentService = Depends(get_mcp_service)
):
    """Generate a slide deck from a topic prompt"""
    # Generate a unique ID if filename not provided
    file_id = request.output_file or f"deck_{uuid.uuid4().hex[:8]}"
    
    # Prepare payload for MCP
    payload = {
        "topic": request.topic,
        "slides": request.slides,
        "style": request.style,
        "audience": request.audience,
        "filename": file_id
    }
    
    try:
        # Execute deckgen agent through MCP (non-blocking)
        background_tasks.add_task(mcp_service.execute_agent, "deckgen", payload)
        
        # Return response immediately with a pending status
        return SlideDeckResponse(
            id=file_id,
            filename=f"{file_id}.json",
            title=f"Deck about {request.topic}",
            slide_count=request.slides,
            created_at=datetime.utcnow().isoformat(),
            url=f"/api/slideforge/decks/{file_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate deck: {str(e)}")

@router.post("/render", response_model=Dict[str, Any])
async def render_slides(
    request: RenderSlidesRequest,
    background_tasks: BackgroundTasks,
    mcp_service: MCPAgentService = Depends(get_mcp_service)
):
    """Render slide JSON into HTML/React components"""
    try:
        # Check if the file exists
        file_path = os.path.join(SLIDES_DIR, f"{request.filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Slide deck not found: {request.filename}")
        
        # Prepare payload for MCP
        payload = {
            "filename": request.filename,
            "template": request.template
        }
        
        # Execute slidebuilder agent through MCP (non-blocking)
        background_tasks.add_task(mcp_service.execute_agent, "slidebuilder", payload)
        
        # Return response immediately with pending status
        return {
            "status": "rendering",
            "message": f"Rendering '{request.filename}' with template '{request.template}'",
            "rendering_url": f"/api/slideforge/render/{request.filename}",
            "html_url": f"/slides/{request.filename}.html"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render slides: {str(e)}")

@router.post("/review", response_model=Dict[str, Any])
async def review_deck(
    request: ReviewDeckRequest,
    background_tasks: BackgroundTasks,
    mcp_service: MCPAgentService = Depends(get_mcp_service)
):
    """Review deck for tone, clarity, and improvements"""
    try:
        # Check if the file exists
        file_path = os.path.join(SLIDES_DIR, f"{request.filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Slide deck not found: {request.filename}")
        
        # Prepare payload for MCP
        payload = {
            "filename": request.filename,
            "focus_areas": request.focus_areas
        }
        
        # Execute feedback agent through MCP (non-blocking)
        background_tasks.add_task(mcp_service.execute_agent, "feedback", payload)
        
        # Return response immediately with pending status
        return {
            "status": "reviewing",
            "message": f"Reviewing '{request.filename}' focusing on {', '.join(request.focus_areas)}",
            "feedback_url": f"/api/slideforge/feedback/{request.filename}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review deck: {str(e)}")

@router.post("/publish", response_model=Dict[str, Any])
async def publish_deck(request: PublishDeckRequest):
    """Publish the deck as HTML, PDF, or other formats"""
    try:
        # Check if the file exists
        file_path = os.path.join(SLIDES_DIR, f"{request.filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Slide deck not found: {request.filename}")
        
        # For now, just return the URL to the rendered HTML
        # (actual publishing to PDF or other platforms would be implemented here)
        output_url = f"/slides/{request.filename}.html"
        
        if request.format == "pdf":
            # Placeholder for PDF generation
            output_url = f"/slides/{request.filename}.pdf"
        elif request.format == "pptx":
            # Placeholder for PowerPoint export
            output_url = f"/slides/{request.filename}.pptx"
        
        return {
            "status": "published",
            "format": request.format,
            "destination": request.destination,
            "url": output_url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish deck: {str(e)}")

@router.get("/decks", response_model=List[SlideDeckResponse])
async def list_decks():
    """List all available slide decks"""
    try:
        decks = []
        for filename in os.listdir(SLIDES_DIR):
            if filename.endswith('.json') and not filename.endswith('_feedback.json'):
                file_path = os.path.join(SLIDES_DIR, filename)
                try:
                    with open(file_path, 'r') as f:
                        deck_data = json.load(f)
                    
                    base_name = filename.replace('.json', '')
                    decks.append(SlideDeckResponse(
                        id=base_name,
                        filename=filename,
                        title=deck_data.get('title', 'Untitled Deck'),
                        slide_count=len(deck_data.get('slides', [])),
                        created_at=datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                        url=f"/api/slideforge/decks/{base_name}"
                    ))
                except:
                    # Skip malformed files
                    continue
        
        return decks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list decks: {str(e)}")

@router.get("/decks/{deck_id}", response_model=Dict[str, Any])
async def get_deck(deck_id: str):
    """Get a specific slide deck"""
    try:
        file_path = os.path.join(SLIDES_DIR, f"{deck_id}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Slide deck not found: {deck_id}")
        
        with open(file_path, 'r') as f:
            deck_data = json.load(f)
        
        return deck_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deck: {str(e)}")

@router.get("/feedback/{deck_id}", response_model=Dict[str, Any])
async def get_feedback(deck_id: str):
    """Get feedback for a specific slide deck"""
    try:
        file_path = os.path.join(SLIDES_DIR, f"{deck_id}_feedback.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Feedback not found for deck: {deck_id}")
        
        with open(file_path, 'r') as f:
            feedback_data = json.load(f)
        
        return feedback_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feedback: {str(e)}")

@router.put("/decks/{deck_id}/slide/{slide_index}", response_model=Dict[str, Any])
async def update_slide(
    deck_id: str, 
    slide_index: int, 
    changes: Dict[str, Any] = Body(..., description="Changes to apply to the slide")
):
    """Update a specific slide in a deck"""
    try:
        file_path = os.path.join(SLIDES_DIR, f"{deck_id}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Slide deck not found: {deck_id}")
        
        with open(file_path, 'r') as f:
            deck_data = json.load(f)
        
        # Check if slide index is valid
        if not deck_data.get('slides') or slide_index < 0 or slide_index >= len(deck_data['slides']):
            raise HTTPException(status_code=400, detail=f"Invalid slide index: {slide_index}")
        
        # Update the slide with the changes
        for key, value in changes.items():
            deck_data['slides'][slide_index][key] = value
        
        # Save the updated deck
        with open(file_path, 'w') as f:
            json.dump(deck_data, f, indent=2)
        
        return {
            "status": "updated",
            "deck_id": deck_id,
            "slide_index": slide_index,
            "updated_slide": deck_data['slides'][slide_index]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update slide: {str(e)}")

# Function to register routes to the main app
def register_routes(app):
    app.include_router(router)