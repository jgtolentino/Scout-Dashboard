"""
SlideForge API Routes

Routes for managing and rendering slide decks.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import time
from datetime import datetime

router = APIRouter(prefix="/api/slideforge", tags=["slideforge"])

# Models
class SlideBase(BaseModel):
    type: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    imageUrl: Optional[str] = None
    alt: Optional[str] = None
    bullets: Optional[List[str]] = None
    code: Optional[str] = None
    codeLanguage: Optional[str] = None
    leftContent: Optional[str] = None
    rightContent: Optional[str] = None

class SlideDeckBase(BaseModel):
    title: str
    description: Optional[str] = None
    author: Optional[str] = None
    theme: Optional[str] = "default"
    slides: List[SlideBase]

class SlideDeckCreate(SlideDeckBase):
    pass

class SlideDeck(SlideDeckBase):
    id: str
    createdAt: str
    lastModified: str

# In-memory storage for example
slide_decks = {}

# Helper functions
def get_slide_deck_path(deck_id: str) -> str:
    """Get the file path for a slide deck"""
    # In a real implementation, this would use a proper data store
    storage_dir = os.path.join(os.path.dirname(__file__), "../data/slidedecks")
    os.makedirs(storage_dir, exist_ok=True)
    return os.path.join(storage_dir, f"{deck_id}.json")

@router.get("/decks", response_model=List[SlideDeck])
async def list_slide_decks():
    """Get all slide decks"""
    return list(slide_decks.values())

@router.get("/decks/{deck_id}", response_model=SlideDeck)
async def get_slide_deck(deck_id: str):
    """Get a specific slide deck"""
    if deck_id not in slide_decks:
        raise HTTPException(status_code=404, detail="Slide deck not found")
    return slide_decks[deck_id]

@router.post("/decks", response_model=SlideDeck, status_code=201)
async def create_slide_deck(slide_deck: SlideDeckCreate):
    """Create a new slide deck"""
    # Generate a unique ID
    deck_id = f"deck_{int(time.time())}"
    
    # Create the complete slide deck with metadata
    new_deck = SlideDeck(
        id=deck_id,
        createdAt=datetime.now().isoformat(),
        lastModified=datetime.now().isoformat(),
        **slide_deck.dict()
    )
    
    # Store it
    slide_decks[deck_id] = new_deck.dict()
    
    # In a real implementation, save to a database or file
    with open(get_slide_deck_path(deck_id), "w") as f:
        json.dump(new_deck.dict(), f)
    
    return new_deck

@router.put("/decks/{deck_id}", response_model=SlideDeck)
async def update_slide_deck(deck_id: str, slide_deck: SlideDeckCreate):
    """Update an existing slide deck"""
    if deck_id not in slide_decks:
        raise HTTPException(status_code=404, detail="Slide deck not found")
    
    # Update the deck
    updated_deck = SlideDeck(
        id=deck_id,
        createdAt=slide_decks[deck_id]["createdAt"],
        lastModified=datetime.now().isoformat(),
        **slide_deck.dict()
    )
    
    slide_decks[deck_id] = updated_deck.dict()
    
    # In a real implementation, update in database or file
    with open(get_slide_deck_path(deck_id), "w") as f:
        json.dump(updated_deck.dict(), f)
    
    return updated_deck

@router.delete("/decks/{deck_id}", status_code=204)
async def delete_slide_deck(deck_id: str):
    """Delete a slide deck"""
    if deck_id not in slide_decks:
        raise HTTPException(status_code=404, detail="Slide deck not found")
    
    del slide_decks[deck_id]
    
    # In a real implementation, delete from database or file
    file_path = get_slide_deck_path(deck_id)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    return None

@router.get("/render/{deck_id}", response_class=HTMLResponse)
async def render_slide_deck(deck_id: str, request: Request, theme: str = "default"):
    """
    SSR render a slide deck
    
    This is a placeholder for the actual SSR rendering which would be 
    implemented with a Node.js service or similar.
    """
    if deck_id not in slide_decks:
        raise HTTPException(status_code=404, detail="Slide deck not found")
    
    # In a real implementation, this would call a Node.js service
    # to server-side render the React component
    
    # For now, return a placeholder HTML
    deck = slide_decks[deck_id]
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{deck['title']}</title>
        <style>
            body {{ font-family: system-ui, sans-serif; margin: 0; padding: 20px; }}
            .ssr-message {{ background: #f0f0f0; border: 1px solid #ddd; padding: 20px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <h1>{deck['title']}</h1>
        <p>{deck.get('description', '')}</p>
        
        <div class="ssr-message">
            <h3>SSR Placeholder</h3>
            <p>This is a placeholder for the actual server-side rendered slide deck.</p>
            <p>In a production environment, this would render the actual SlideViewerSSR React component.</p>
            <p>Theme requested: {theme}</p>
        </div>
        
        <h3>Slide Deck Preview</h3>
        <pre>{json.dumps(deck, indent=2)}</pre>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)