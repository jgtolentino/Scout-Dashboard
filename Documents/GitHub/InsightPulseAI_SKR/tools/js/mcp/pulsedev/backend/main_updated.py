#!/usr/bin/env python3
"""
PulseDev Backend
FastAPI server that acts as an API gateway for the PulseDev platform.
"""

import os
import sys
import json
import asyncio
import logging
import yaml
import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import websockets
import docker
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("pulsedev.log")
    ]
)
logger = logging.getLogger("pulsedev")

# Configuration
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "ws://localhost:9090/mcp")
WORKSPACE_ROOT = os.environ.get("WORKSPACE_ROOT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workspaces"))
CONFIG_PATH = os.environ.get("CONFIG_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "agent_profiles.yaml"))

# Load configuration
def load_config():
    try:
        with open(CONFIG_PATH, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        return {}

config = load_config()

# Initialize FastAPI app
app = FastAPI(
    title="PulseDev API",
    description="API Gateway for PulseDev - Cloud IDE and Code Execution Platform",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Initialize Docker client if available
try:
    docker_client = docker.from_env()
    logger.info("Docker client initialized successfully")
except Exception as e:
    logger.warning(f"Docker not available: {e}")
    docker_client = None

# Pydantic models
class ExecuteCodeRequest(BaseModel):
    language: str
    code: str
    workspace_id: str
    file_path: Optional[str] = None

class FileOperationRequest(BaseModel):
    workspace_id: str
    file_path: str
    content: Optional[str] = None

class WorkspaceRequest(BaseModel):
    name: str
    template: Optional[str] = None

class TerminalCommandRequest(BaseModel):
    workspace_id: str
    command: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.mcp_connections: Dict[str, websockets.WebSocketClientProtocol] = {}
    
    async def connect(self, websocket: WebSocket, workspace_id: str):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)
    
    async def disconnect(self, websocket: WebSocket, workspace_id: str):
        self.active_connections[workspace_id].remove(websocket)
        if not self.active_connections[workspace_id]:
            del self.active_connections[workspace_id]
    
    async def send_message(self, message: dict, workspace_id: str):
        if workspace_id in self.active_connections:
            for connection in self.active_connections[workspace_id]:
                await connection.send_json(message)
    
    async def broadcast(self, message: dict):
        for workspace_id in self.active_connections:
            await self.send_message(message, workspace_id)
    
    async def connect_to_mcp(self, workspace_id: str, environment: str):
        if workspace_id in self.mcp_connections:
            return self.mcp_connections[workspace_id]
        
        try:
            mcp_connection = await websockets.connect(f"{MCP_SERVER_URL}/{environment}")
            self.mcp_connections[workspace_id] = mcp_connection
            logger.info(f"Connected to MCP server for workspace {workspace_id}")
            return mcp_connection
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise

manager = ConnectionManager()

# Workspace management
async def ensure_workspace_exists(workspace_id: str):
    workspace_path = os.path.join(WORKSPACE_ROOT, workspace_id)
    os.makedirs(workspace_path, exist_ok=True)
    return workspace_path

async def create_workspace(name: str, template: Optional[str] = None) -> str:
    workspace_id = str(uuid.uuid4())
    workspace_path = await ensure_workspace_exists(workspace_id)
    
    # Create workspace metadata
    metadata = {
        "id": workspace_id,
        "name": name,
        "created_at": datetime.datetime.now().isoformat(),
        "template": template
    }
    
    # Save metadata
    with open(os.path.join(workspace_path, ".pulsedev.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    
    # Apply template if specified
    if template:
        await apply_template(workspace_path, template)
    else:
        # Create default files
        with open(os.path.join(workspace_path, "index.html"), "w") as f:
            f.write("<!DOCTYPE html>\n<html>\n<head>\n  <title>My PulseDev Project</title>\n</head>\n<body>\n  <h1>Hello, PulseDev!</h1>\n</body>\n</html>")
        
        with open(os.path.join(workspace_path, "script.js"), "w") as f:
            f.write("// Your JavaScript code here\nconsole.log('Hello from PulseDev!');")
        
        with open(os.path.join(workspace_path, "style.css"), "w") as f:
            f.write("/* Your CSS styles here */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 20px;\n}")
    
    return workspace_id

async def apply_template(workspace_path: str, template: str):
    # Template implementation would go here
    # For MVP, just create basic files based on template name
    if template == "html":
        with open(os.path.join(workspace_path, "index.html"), "w") as f:
            f.write("<!DOCTYPE html>\n<html>\n<head>\n  <title>HTML Template</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <h1>HTML Template</h1>\n  <script src=\"script.js\"></script>\n</body>\n</html>")
        
        with open(os.path.join(workspace_path, "script.js"), "w") as f:
            f.write("// Your JavaScript code here\nconsole.log('Template loaded!');")
        
        with open(os.path.join(workspace_path, "style.css"), "w") as f:
            f.write("/* Your CSS styles here */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 20px;\n}")
    
    elif template == "python":
        with open(os.path.join(workspace_path, "main.py"), "w") as f:
            f.write("# Python Template\n\ndef main():\n    print('Hello from PulseDev!')\n\nif __name__ == '__main__':\n    main()")
        
        with open(os.path.join(workspace_path, "requirements.txt"), "w") as f:
            f.write("# Python dependencies\n")
    
    elif template == "node":
        with open(os.path.join(workspace_path, "index.js"), "w") as f:
            f.write("// Node.js Template\n\nconsole.log('Hello from PulseDev!');\n\nfunction sayHello(name) {\n  return `Hello, ${name}!`;\n}\n\nmodule.exports = { sayHello };")
        
        with open(os.path.join(workspace_path, "package.json"), "w") as f:
            f.write('{\n  "name": "pulsedev-project",\n  "version": "1.0.0",\n  "description": "Created with PulseDev",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js"\n  }\n}')

# API routes
@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "version": "0.1.0",
        "mcp_connected": True,  # Would check MCP connection status in production
        "docker_available": docker_client is not None
    }

@app.post("/api/workspaces")
async def create_new_workspace(request: WorkspaceRequest):
    try:
        workspace_id = await create_workspace(request.name, request.template)
        return {
            "workspace_id": workspace_id,
            "name": request.name,
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Failed to create workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str):
    try:
        workspace_path = os.path.join(WORKSPACE_ROOT, workspace_id)
        metadata_path = os.path.join(workspace_path, ".pulsedev.json")
        
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Get files in workspace
        files = []
        for root, dirs, filenames in os.walk(workspace_path):
            for filename in filenames:
                if filename.startswith("."):
                    continue
                    
                file_path = os.path.join(root, filename)
                rel_path = os.path.relpath(file_path, workspace_path)
                
                files.append({
                    "name": filename,
                    "path": rel_path,
                    "size": os.path.getsize(file_path),
                    "modified": os.path.getmtime(file_path)
                })
        
        return {
            "metadata": metadata,
            "files": files
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workspaces/{workspace_id}/files")
async def create_file(workspace_id: str, request: FileOperationRequest):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        file_path = os.path.join(workspace_path, request.file_path)
        
        # Create parent directories if they don't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Write file
        with open(file_path, "w") as f:
            f.write(request.content or "")
        
        return {
            "status": "created",
            "file_path": request.file_path
        }
    except Exception as e:
        logger.error(f"Failed to create file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workspaces/{workspace_id}/files/{file_path:path}")
async def read_file(workspace_id: str, file_path: str):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        file_path = os.path.join(workspace_path, file_path)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read file
        with open(file_path, "r") as f:
            content = f.read()
        
        return {
            "content": content,
            "file_path": file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/workspaces/{workspace_id}/files/{file_path:path}")
async def update_file(workspace_id: str, file_path: str, request: FileOperationRequest):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        file_path = os.path.join(workspace_path, file_path)
        
        # Write file
        with open(file_path, "w") as f:
            f.write(request.content or "")
        
        return {
            "status": "updated",
            "file_path": file_path
        }
    except Exception as e:
        logger.error(f"Failed to update file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/workspaces/{workspace_id}/files/{file_path:path}")
async def delete_file(workspace_id: str, file_path: str):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        file_path = os.path.join(workspace_path, file_path)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete file
        os.remove(file_path)
        
        return {
            "status": "deleted",
            "file_path": file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workspaces/{workspace_id}/execute")
async def execute_code(workspace_id: str, request: ExecuteCodeRequest):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        
        # Connect to MCP server
        mcp_connection = await manager.connect_to_mcp(workspace_id, "code_execution")
        
        # Save code to file if file_path is provided
        if request.file_path:
            file_path = os.path.join(workspace_path, request.file_path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                f.write(request.code)
        
        # Prepare command for MCP
        command = {
            "type": "command",
            "id": str(uuid.uuid4()),
            "command": "execute_code",
            "params": {
                "language": request.language,
                "code": request.code,
                "workspaceId": workspace_id,
                "file_path": request.file_path
            }
        }
        
        # Send command to MCP
        await mcp_connection.send(json.dumps(command))
        
        # Wait for response
        response = await mcp_connection.recv()
        result = json.loads(response)
        
        # Broadcast result to all connected clients for this workspace
        await manager.send_message({
            "type": "execution_result",
            "result": result
        }, workspace_id)
        
        return result
    except Exception as e:
        logger.error(f"Failed to execute code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workspaces/{workspace_id}/terminal")
async def execute_terminal_command(workspace_id: str, request: TerminalCommandRequest):
    try:
        workspace_path = await ensure_workspace_exists(workspace_id)
        
        # Connect to MCP server
        mcp_connection = await manager.connect_to_mcp(workspace_id, "terminal")
        
        # Prepare command for MCP
        command = {
            "type": "command",
            "id": str(uuid.uuid4()),
            "command": "execute_terminal_command",
            "params": {
                "command": request.command,
                "workspaceId": workspace_id,
                "cwd": workspace_path
            }
        }
        
        # Send command to MCP
        await mcp_connection.send(json.dumps(command))
        
        # Wait for response
        response = await mcp_connection.recv()
        result = json.loads(response)
        
        # Broadcast result to all connected clients for this workspace
        await manager.send_message({
            "type": "terminal_result",
            "result": result
        }, workspace_id)
        
        return result
    except Exception as e:
        logger.error(f"Failed to execute terminal command: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: str):
    await manager.connect(websocket, workspace_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "code_change":
                    # Broadcast code changes to all connected clients
                    await manager.send_message({
                        "type": "code_change",
                        "file": message.get("file"),
                        "content": message.get("content"),
                        "user": message.get("user")
                    }, workspace_id)
                
                elif message_type == "cursor_update":
                    # Broadcast cursor position updates
                    await manager.send_message({
                        "type": "cursor_update",
                        "file": message.get("file"),
                        "position": message.get("position"),
                        "user": message.get("user")
                    }, workspace_id)
                
                elif message_type == "execute":
                    # Handle code execution
                    language = message.get("language")
                    code = message.get("code")
                    file_path = message.get("file_path")
                    
                    # Execute code via API route
                    request = ExecuteCodeRequest(
                        language=language,
                        code=code,
                        workspace_id=workspace_id,
                        file_path=file_path
                    )
                    await execute_code(workspace_id, request)
                
                elif message_type == "terminal_command":
                    # Handle terminal command
                    command = message.get("command")
                    
                    # Execute command via API route
                    request = TerminalCommandRequest(
                        workspace_id=workspace_id,
                        command=command
                    )
                    await execute_terminal_command(workspace_id, request)
                
                elif message_type == "ai_assist":
                    # Connect to AI assistant via MCP
                    mcp_connection = await manager.connect_to_mcp(workspace_id, "editor")
                    
                    # Prepare command for MCP
                    command = {
                        "type": "command",
                        "id": str(uuid.uuid4()),
                        "command": "ai_assist",
                        "params": {
                            "query": message.get("query"),
                            "context": message.get("context"),
                            "file": message.get("file"),
                            "selection": message.get("selection"),
                            "workspaceId": workspace_id
                        }
                    }
                    
                    # Send command to MCP
                    await mcp_connection.send(json.dumps(command))
                    
                    # Wait for response
                    response = await mcp_connection.recv()
                    result = json.loads(response)
                    
                    # Send AI assistance response back to this client
                    await websocket.send_json({
                        "type": "ai_assist_response",
                        "result": result
                    })
            
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON: {data}")
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, workspace_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, workspace_id)

# Import and register AI assistant routes
try:
    from routes.ai_assistant import router as ai_assistant_router
    app.include_router(ai_assistant_router)
    logger.info("AI Assistant routes registered")
except ImportError as e:
    logger.warning(f"Failed to import AI Assistant routes: {e}")

# Import and register Claudia Bridge routes
try:
    from routes.claudia_bridge import router as claudia_bridge_router
    app.include_router(claudia_bridge_router)
    logger.info("Claudia Bridge routes registered")
except ImportError as e:
    logger.warning(f"Failed to import Claudia Bridge routes: {e}")

# Import and register SlideForge routes
try:
    from routes.slideforge import router as slideforge_router
    app.include_router(slideforge_router)
    logger.info("SlideForge routes registered")
except ImportError as e:
    logger.warning(f"Failed to import SlideForge routes: {e}")

# Serve static files for frontend
app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"), html=True), name="frontend")

# Start application services in the background
@app.on_event("startup")
async def startup_event():
    # Initialize services
    try:
        # Start Claudia MCP Bridge
        from services.claudia_mcp_bridge import start_claudia_mcp_bridge
        asyncio.create_task(start_claudia_mcp_bridge())
        logger.info("Claudia MCP Bridge started")
    except ImportError as e:
        logger.warning(f"Failed to start Claudia MCP Bridge: {e}")
    
    # Start MCP Direct Bridge
    try:
        from services.mcp_direct_bridge import start_mcp_direct_bridge
        asyncio.create_task(start_mcp_direct_bridge())
        logger.info("MCP Direct Bridge started")
    except ImportError as e:
        logger.warning(f"Failed to start MCP Direct Bridge: {e}")

# Start the app
if __name__ == "__main__":
    import uvicorn
    
    # Create workspaces directory if it doesn't exist
    os.makedirs(WORKSPACE_ROOT, exist_ok=True)
    
    # Create data directory for SlideForge
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "slidedecks"), exist_ok=True)
    
    # Create logs directory
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs"), exist_ok=True)
    
    # Run the app
    uvicorn.run(app, host="0.0.0.0", port=8000)