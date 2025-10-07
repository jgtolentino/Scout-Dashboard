"""
Collaboration WebSocket routes for PulseDev

This module provides WebSocket endpoints for real-time collaboration:
- WebSocket connection management
- Message routing for collaborative editing
- User presence and activity tracking
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import Optional, Dict
import json
import uuid
from datetime import datetime

from ..services.collaboration import collaboration_manager
from ..services.filesystem import filesystem_service

router = APIRouter(prefix="/api/collaboration", tags=["collaboration"])

# --- WebSocket Routes --- #

@router.websocket("/ws/{workspace_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    workspace_id: str,
    user_id: Optional[str] = Query(None),
    user_name: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time collaboration"""
    # Validate workspace exists
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        await websocket.close(code=4004, reason="Workspace not found")
        return
    
    # Use provided user_id or generate a new one
    user_id = user_id or str(uuid.uuid4())
    user_name = user_name or f"User-{user_id[:6]}"
    
    try:
        # Connect this client
        await collaboration_manager.connect(websocket, workspace_id, user_id, user_name)
        
        # Handle messages
        while True:
            try:
                # Receive and parse message
                data = await websocket.receive_json()
                
                # Handle message
                await collaboration_manager.handle_message(workspace_id, user_id, data)
                
            except json.JSONDecodeError:
                # Invalid JSON data
                continue
                
    except WebSocketDisconnect:
        # Handle disconnection
        await collaboration_manager.disconnect(workspace_id, user_id)
    
    except Exception as e:
        # Handle other errors
        print(f"Error in WebSocket for {workspace_id}/{user_id}: {e}")
        try:
            await collaboration_manager.disconnect(workspace_id, user_id)
        except:
            pass