"""
Collaboration Service for PulseDev

This module provides WebSocket-based collaboration features:
- Real-time code editing
- File change notifications
- User presence and activity tracking
- Terminal sharing
"""

import json
import asyncio
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uuid
from datetime import datetime

# --- Models --- #

class User(BaseModel):
    id: str
    name: str
    color: str
    cursor_pos: Optional[Dict[str, int]] = None
    last_active: str

class FileChange(BaseModel):
    file_path: str
    content: str
    user_id: str
    timestamp: str

class TerminalCommand(BaseModel):
    workspace_id: str
    command: str
    user_id: str
    timestamp: str

class CollaborationMessage(BaseModel):
    type: str
    workspace_id: str
    data: Any
    user_id: str
    timestamp: str = None

# --- Manager --- #

class CollaborationManager:
    """Manager for WebSocket-based collaboration features"""
    
    def __init__(self):
        # Workspace_id -> {user_id -> WebSocket}
        self.connections: Dict[str, Dict[str, WebSocket]] = {}
        
        # Workspace_id -> {user_id -> User}
        self.active_users: Dict[str, Dict[str, User]] = {}
        
        # Workspace_id -> {file_path -> FileChange}
        self.file_cache: Dict[str, Dict[str, FileChange]] = {}
        
        # Workspace_id -> List[TerminalCommand]
        self.terminal_history: Dict[str, List[TerminalCommand]] = {}
        
        # Maximum history to keep
        self.max_terminal_history = 100
    
    async def connect(self, websocket: WebSocket, workspace_id: str, user_id: str, user_name: str):
        """
        Connect a new client WebSocket
        
        Args:
            websocket: The client's WebSocket connection
            workspace_id: ID of the workspace
            user_id: User identifier
            user_name: User's display name
        """
        await websocket.accept()
        
        # Initialize collections if needed
        if workspace_id not in self.connections:
            self.connections[workspace_id] = {}
            self.active_users[workspace_id] = {}
            self.file_cache[workspace_id] = {}
            self.terminal_history[workspace_id] = []
        
        # Register the new connection
        self.connections[workspace_id][user_id] = websocket
        
        # Create user record with random color
        colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#33FFF5"]
        user_color = colors[hash(user_id) % len(colors)]
        
        self.active_users[workspace_id][user_id] = User(
            id=user_id,
            name=user_name,
            color=user_color,
            last_active=datetime.now().isoformat()
        )
        
        # Notify everyone about the new user
        await self.broadcast(
            workspace_id,
            CollaborationMessage(
                type="user_joined",
                workspace_id=workspace_id,
                data=self.active_users[workspace_id][user_id],
                user_id=user_id,
                timestamp=datetime.now().isoformat()
            ),
            exclude=None  # Include the new user in this broadcast
        )
        
        # Send current state to the new user
        await self.send_state(websocket, workspace_id, user_id)
    
    async def disconnect(self, workspace_id: str, user_id: str):
        """Handle client disconnection"""
        if (workspace_id in self.connections and 
            user_id in self.connections[workspace_id]):
            # Remove the connection
            del self.connections[workspace_id][user_id]
            
            # Remove the user record
            if user_id in self.active_users[workspace_id]:
                user_data = self.active_users[workspace_id][user_id]
                del self.active_users[workspace_id][user_id]
                
                # Notify others
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="user_left",
                        workspace_id=workspace_id,
                        data=user_data,
                        user_id=user_id,
                        timestamp=datetime.now().isoformat()
                    ),
                    exclude=user_id
                )
    
    async def send_state(self, websocket: WebSocket, workspace_id: str, user_id: str):
        """Send the current state to a new user"""
        # Send active users
        users = list(self.active_users[workspace_id].values())
        await websocket.send_json(
            CollaborationMessage(
                type="users_list",
                workspace_id=workspace_id,
                data=users,
                user_id="system",
                timestamp=datetime.now().isoformat()
            ).dict()
        )
        
        # Send file cache
        files = list(self.file_cache[workspace_id].values())
        await websocket.send_json(
            CollaborationMessage(
                type="files_cache",
                workspace_id=workspace_id,
                data=files,
                user_id="system",
                timestamp=datetime.now().isoformat()
            ).dict()
        )
        
        # Send terminal history
        await websocket.send_json(
            CollaborationMessage(
                type="terminal_history",
                workspace_id=workspace_id,
                data=self.terminal_history[workspace_id],
                user_id="system",
                timestamp=datetime.now().isoformat()
            ).dict()
        )
    
    async def broadcast(self, workspace_id: str, message: CollaborationMessage, exclude: Optional[str] = None):
        """Broadcast a message to all users in a workspace except excluded ones"""
        if workspace_id not in self.connections:
            return
        
        disconnected = []
        message.timestamp = message.timestamp or datetime.now().isoformat()
        message_data = message.dict()
        
        for user_id, websocket in self.connections[workspace_id].items():
            if user_id != exclude:
                try:
                    await websocket.send_json(message_data)
                except Exception:
                    # Mark for removal if sending fails
                    disconnected.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected:
            await self.disconnect(workspace_id, user_id)
    
    async def handle_message(self, workspace_id: str, user_id: str, message_data: Dict):
        """Handle an incoming message from a client"""
        message_type = message_data.get("type")
        data = message_data.get("data")
        
        # Update last active time
        if workspace_id in self.active_users and user_id in self.active_users[workspace_id]:
            self.active_users[workspace_id][user_id].last_active = datetime.now().isoformat()
        
        if message_type == "cursor_update":
            # Update cursor position
            if workspace_id in self.active_users and user_id in self.active_users[workspace_id]:
                self.active_users[workspace_id][user_id].cursor_pos = data
                
                # Broadcast cursor update
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="cursor_update",
                        workspace_id=workspace_id,
                        data={
                            "user_id": user_id,
                            "cursor_pos": data
                        },
                        user_id=user_id
                    ),
                    exclude=user_id
                )
        
        elif message_type == "file_change":
            # Update file cache and broadcast change
            file_path = data.get("file_path")
            content = data.get("content")
            
            if file_path and content is not None:
                # Create file change record
                change = FileChange(
                    file_path=file_path,
                    content=content,
                    user_id=user_id,
                    timestamp=datetime.now().isoformat()
                )
                
                # Update cache
                self.file_cache[workspace_id][file_path] = change
                
                # Broadcast to others
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="file_change",
                        workspace_id=workspace_id,
                        data=change,
                        user_id=user_id
                    ),
                    exclude=user_id
                )
        
        elif message_type == "terminal_command":
            # Record terminal command and broadcast
            command = data.get("command")
            
            if command:
                # Create command record
                cmd_record = TerminalCommand(
                    workspace_id=workspace_id,
                    command=command,
                    user_id=user_id,
                    timestamp=datetime.now().isoformat()
                )
                
                # Add to history
                self.terminal_history[workspace_id].append(cmd_record)
                
                # Trim history if needed
                if len(self.terminal_history[workspace_id]) > self.max_terminal_history:
                    self.terminal_history[workspace_id] = self.terminal_history[workspace_id][-self.max_terminal_history:]
                
                # Broadcast to all including sender
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="terminal_command",
                        workspace_id=workspace_id,
                        data=cmd_record,
                        user_id=user_id
                    )
                )
        
        elif message_type == "terminal_output":
            # Broadcast terminal output
            output = data.get("output")
            command_id = data.get("command_id")
            
            if output is not None:
                # Broadcast to all
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="terminal_output",
                        workspace_id=workspace_id,
                        data={
                            "output": output,
                            "command_id": command_id
                        },
                        user_id=user_id
                    )
                )
        
        elif message_type == "ai_request":
            # Forward AI assistance request
            query = data.get("query")
            context = data.get("context", {})
            
            if query:
                # Broadcast the request (could be handled by a dedicated MCP agent later)
                await self.broadcast(
                    workspace_id,
                    CollaborationMessage(
                        type="ai_request",
                        workspace_id=workspace_id,
                        data={
                            "query": query,
                            "context": context,
                            "request_id": str(uuid.uuid4())
                        },
                        user_id=user_id
                    )
                )
    
    async def handle_ai_response(self, workspace_id: str, request_id: str, response: Dict):
        """Handle AI response and broadcast to workspace"""
        await self.broadcast(
            workspace_id,
            CollaborationMessage(
                type="ai_response",
                workspace_id=workspace_id,
                data={
                    "request_id": request_id,
                    "response": response
                },
                user_id="ai_assistant"
            )
        )

# Create singleton instance
collaboration_manager = CollaborationManager()