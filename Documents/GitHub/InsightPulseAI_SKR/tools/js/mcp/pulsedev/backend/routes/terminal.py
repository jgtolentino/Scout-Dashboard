"""
Terminal API routes for PulseDev

This module provides API endpoints for terminal operations:
- Terminal session management
- Command execution
- Output reading
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import asyncio
import json

from ..services.terminal import terminal_service
from ..services.filesystem import filesystem_service

router = APIRouter(prefix="/api/terminal", tags=["terminal"])

# --- Models --- #

class CommandExecute(BaseModel):
    command: str

# --- Terminal routes --- #

@router.post("/{workspace_id}/sessions")
async def create_terminal_session(workspace_id: str):
    """Create a new terminal session for a workspace"""
    # Verify workspace exists
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    try:
        session = await terminal_service.create_session(workspace_id)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workspace_id}/sessions")
async def list_terminal_sessions(workspace_id: str):
    """List all terminal sessions for a workspace"""
    # Verify workspace exists
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    sessions = await terminal_service.list_sessions(workspace_id)
    return sessions

@router.get("/sessions/{session_id}")
async def get_terminal_session(session_id: str):
    """Get terminal session details"""
    session = await terminal_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    
    return session

@router.delete("/sessions/{session_id}")
async def terminate_terminal_session(session_id: str):
    """Terminate a terminal session"""
    success = await terminal_service.terminate_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    
    return {"success": True}

@router.post("/sessions/{session_id}/execute")
async def execute_command(session_id: str, command_data: CommandExecute):
    """Execute a command in a terminal session"""
    session = await terminal_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    
    try:
        result = await terminal_service.execute_command(session_id, command_data.command)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- WebSocket for terminal streaming --- #

@router.websocket("/ws/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for terminal streaming"""
    # Verify session exists
    session = await terminal_service.get_session(session_id)
    if not session:
        await websocket.close(code=4004, reason="Terminal session not found")
        return
    
    await websocket.accept()
    
    try:
        while True:
            # Wait for commands from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "execute":
                    # Execute command
                    command = message.get("command")
                    if command:
                        try:
                            result = await terminal_service.execute_command(session_id, command)
                            
                            # Stream output back
                            exec_id = result["exec_id"]
                            output = await terminal_service.read_output(session_id, exec_id)
                            
                            # Send output
                            await websocket.send_json({
                                "type": "output",
                                "command": command,
                                "output": output,
                                "exec_id": exec_id
                            })
                            
                        except Exception as e:
                            await websocket.send_json({
                                "type": "error",
                                "message": str(e)
                            })
                
                elif message_type == "ping":
                    # Respond with pong to keep connection alive
                    await websocket.send_json({"type": "pong"})
                    
            except json.JSONDecodeError:
                # Invalid message
                continue
                
    except WebSocketDisconnect:
        # Client disconnected
        pass
    
    except Exception as e:
        # Other error
        print(f"Terminal WebSocket error for session {session_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Server error")
        except:
            pass