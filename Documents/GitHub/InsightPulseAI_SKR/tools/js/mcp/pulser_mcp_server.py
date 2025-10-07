#!/usr/bin/env python3
# Pulser MCP Server - Orchestration server for the Model Context Protocol
# Enables bidirectional communication between Claude and creative environments

import asyncio
import websockets
import json
import argparse
import os
import ssl
import time
import uuid
import logging
import base64
import hmac
import hashlib
from pathlib import Path
from typing import Dict, List, Set, Any, Optional
import traceback
import aiohttp
from aiohttp import web

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pulser_mcp_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("pulser_mcp")

# Constants
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 9876
DEFAULT_CONFIG_FILE = "~/.pulser_mcp/config.json"
TOKEN_EXPIRY_SECONDS = 86400  # 24 hours

class Environment:
    """Represents a connected creative environment (Blender, VS Code, etc.)"""
    
    def __init__(self, env_id: str, env_type: str, websocket, metadata: dict = None):
        self.id = env_id
        self.type = env_type
        self.websocket = websocket
        self.connected_at = time.time()
        self.last_ping = time.time()
        self.capabilities = {}
        self.metadata = metadata or {}
        self.session_id = None
        
    def update_capabilities(self, capabilities: dict):
        """Update environment capabilities"""
        self.capabilities = capabilities
        logger.info(f"Environment {self.id} ({self.type}) updated capabilities: {capabilities}")
        
    def update_metadata(self, metadata: dict):
        """Update environment metadata"""
        self.metadata.update(metadata)
        
    def ping(self):
        """Update last ping time"""
        self.last_ping = time.time()
        
    def to_dict(self):
        """Convert environment to dict for API responses"""
        return {
            "id": self.id,
            "type": self.type,
            "connected_at": self.connected_at,
            "last_ping": self.last_ping,
            "capabilities": self.capabilities,
            "metadata": self.metadata,
            "session_id": self.session_id
        }

class Session:
    """Represents an active MCP session between Claude and environments"""
    
    def __init__(self, session_id: str, created_by: str):
        self.id = session_id
        self.created_at = time.time()
        self.created_by = created_by
        self.last_activity = time.time()
        self.environments: Dict[str, str] = {}  # env_id -> env_type
        self.metadata = {}
        self.message_history: List[dict] = []
        self.max_history = 100
        
    def add_environment(self, env_id: str, env_type: str):
        """Add an environment to this session"""
        self.environments[env_id] = env_type
        self.last_activity = time.time()
        
    def remove_environment(self, env_id: str):
        """Remove an environment from this session"""
        if env_id in self.environments:
            del self.environments[env_id]
        self.last_activity = time.time()
        
    def add_message(self, message: dict):
        """Add a message to the session history"""
        self.message_history.append({
            "timestamp": time.time(),
            "message": message
        })
        
        # Trim history if needed
        if len(self.message_history) > self.max_history:
            self.message_history = self.message_history[-self.max_history:]
            
        self.last_activity = time.time()
        
    def to_dict(self):
        """Convert session to dict for API responses"""
        return {
            "id": self.id,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "last_activity": self.last_activity,
            "environments": self.environments,
            "metadata": self.metadata
        }

class MCPServer:
    """Model Context Protocol Server - orchestrates communication between Claude and environments"""
    
    def __init__(self, config: dict = None):
        self.config = config or {}
        self.environments: Dict[str, Environment] = {}
        self.sessions: Dict[str, Session] = {}
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.api_tokens: Dict[str, dict] = {}
        self.connections: Dict[websockets.WebSocketServerProtocol, str] = {}  # websocket -> client_id
        self.environment_types = ["blender", "vscode", "figma", "terminal"]
        self.shutdown_event = asyncio.Event()
        
        # Initialize from config
        self.host = self.config.get("host", DEFAULT_HOST)
        self.port = self.config.get("port", DEFAULT_PORT)
        self.debug = self.config.get("debug", False)
        self.require_auth = self.config.get("require_auth", False)
        self.ssl_cert = self.config.get("ssl_cert")
        self.ssl_key = self.config.get("ssl_key")
        
        if self.debug:
            logger.setLevel(logging.DEBUG)
            
        # Load API tokens from config
        for token_info in self.config.get("api_tokens", []):
            token = token_info.get("token")
            if token:
                self.api_tokens[token] = token_info
                
        logger.info(f"Initialized MCP Server with {len(self.api_tokens)} API tokens")
            
    async def start(self):
        """Start the MCP server"""
        # Create SSL context if SSL is enabled
        ssl_context = None
        if self.ssl_cert and self.ssl_key:
            ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            ssl_context.load_cert_chain(self.ssl_cert, self.ssl_key)
            logger.info(f"SSL enabled with cert: {self.ssl_cert}")
            
        # Start WebSocket server
        logger.info(f"Starting MCP WebSocket server on {self.host}:{self.port}")
        self.websocket_server = await websockets.serve(
            self.handle_websocket_connection,
            self.host,
            self.port,
            ssl=ssl_context
        )
        
        # Start HTTP API server
        logger.info(f"Starting MCP HTTP API server")
        self.http_app = web.Application()
        self.setup_http_routes()
        self.http_runner = web.AppRunner(self.http_app)
        await self.http_runner.setup()
        
        # Determine HTTP port (WebSocket port + 1)
        http_port = self.port + 1
        self.http_site = web.TCPSite(self.http_runner, self.host, http_port, ssl_context=ssl_context)
        await self.http_site.start()
        logger.info(f"HTTP API server running on {self.host}:{http_port}")
        
        # Start background tasks
        self.tasks = [
            asyncio.create_task(self.ping_environments()),
            asyncio.create_task(self.cleanup_expired_sessions())
        ]
        
        # Wait for shutdown
        await self.shutdown_event.wait()
        
        # Clean up
        self.websocket_server.close()
        await self.websocket_server.wait_closed()
        await self.http_runner.cleanup()
        
        for task in self.tasks:
            task.cancel()
            
        logger.info("MCP Server shut down")
        
    def setup_http_routes(self):
        """Set up HTTP API routes"""
        self.http_app.router.add_get("/", self.handle_root)
        self.http_app.router.add_get("/api/status", self.handle_status)
        self.http_app.router.add_get("/api/environments", self.handle_environments)
        self.http_app.router.add_get("/api/sessions", self.handle_sessions)
        self.http_app.router.add_post("/api/sessions", self.handle_create_session)
        self.http_app.router.add_post("/api/token", self.handle_create_token)
        self.http_app.router.add_post("/api/command", self.handle_command)
        
    async def handle_websocket_connection(self, websocket, path):
        """Handle a new WebSocket connection"""
        logger.debug(f"New connection from {websocket.remote_address} to {path}")
        
        # Parse path to determine connection type
        connection_type = "unknown"
        env_type = None
        
        path_parts = path.strip('/').split('/')
        if len(path_parts) >= 2 and path_parts[0] == "mcp":
            if path_parts[1] in self.environment_types:
                connection_type = "environment"
                env_type = path_parts[1]
            elif path_parts[1] == "client":
                connection_type = "client"
                
        # Add to clients set temporarily
        client_id = str(uuid.uuid4())
        self.clients.add(websocket)
        self.connections[websocket] = client_id
        
        try:
            # Handle connection based on type
            if connection_type == "environment" and env_type:
                await self.handle_environment_connection(websocket, env_type, client_id)
            elif connection_type == "client":
                await self.handle_client_connection(websocket, client_id)
            else:
                # Unknown connection type
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Unknown connection type: {path}"
                }))
                await asyncio.sleep(1)
        except websockets.exceptions.ConnectionClosed:
            logger.debug(f"Connection closed by {client_id}")
        except Exception as e:
            logger.error(f"Error handling connection: {str(e)}")
            logger.debug(traceback.format_exc())
        finally:
            # Clean up
            if client_id in self.environments:
                logger.info(f"Environment {client_id} disconnected")
                env = self.environments[client_id]
                if env.session_id and env.session_id in self.sessions:
                    self.sessions[env.session_id].remove_environment(client_id)
                del self.environments[client_id]
                
            if websocket in self.clients:
                self.clients.remove(websocket)
                
            if websocket in self.connections:
                del self.connections[websocket]
                
            logger.debug(f"Connection from {client_id} cleaned up")
    
    async def handle_environment_connection(self, websocket, env_type, client_id):
        """Handle a connection from a creative environment"""
        logger.info(f"New environment connection: {env_type} (ID: {client_id})")
        
        # Create environment object
        env = Environment(client_id, env_type, websocket)
        self.environments[client_id] = env
        
        # Send welcome message
        await websocket.send(json.dumps({
            "type": "welcome",
            "message": f"Connected to MCP Server as {env_type} environment",
            "env_id": client_id
        }))
        
        # Handle messages
        async for message in websocket:
            try:
                data = json.loads(message)
                await self.process_environment_message(env, data)
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from environment {client_id}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON message"
                }))
            except Exception as e:
                logger.error(f"Error processing message from environment {client_id}: {str(e)}")
                logger.debug(traceback.format_exc())
                
    async def handle_client_connection(self, websocket, client_id):
        """Handle a connection from a client (Claude CLI/API)"""
        logger.info(f"New client connection (ID: {client_id})")
        
        # Send welcome message
        await websocket.send(json.dumps({
            "type": "welcome",
            "message": "Connected to MCP Server as client",
            "client_id": client_id
        }))
        
        # Handle messages
        async for message in websocket:
            try:
                data = json.loads(message)
                await self.process_client_message(websocket, client_id, data)
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from client {client_id}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON message"
                }))
            except Exception as e:
                logger.error(f"Error processing message from client {client_id}: {str(e)}")
                logger.debug(traceback.format_exc())
    
    async def process_environment_message(self, env: Environment, data: dict):
        """Process a message from an environment"""
        if "type" not in data:
            await env.websocket.send(json.dumps({
                "type": "error",
                "message": "Missing message type"
            }))
            return
            
        msg_type = data["type"]
        
        # Handle different message types
        if msg_type == "register":
            # Environment registration/capabilities
            capabilities = data.get("capabilities", {})
            env.update_capabilities(capabilities)
            
            # Update metadata
            metadata = {k: v for k, v in data.items() 
                      if k not in ["type", "capabilities"]}
            if metadata:
                env.update_metadata(metadata)
                
            await env.websocket.send(json.dumps({
                "type": "registered",
                "message": "Environment registered successfully"
            }))
            
        elif msg_type == "pong":
            # Ping response
            env.ping()
            
        elif msg_type == "command_result" or msg_type == "query_result":
            # Forward command/query result to session if available
            if env.session_id and env.session_id in self.sessions:
                session = self.sessions[env.session_id]
                session.add_message(data)
                
                # Forward to all clients in this session
                await self.broadcast_to_session_clients(session, {
                    "type": "environment_message",
                    "from_env": {
                        "id": env.id,
                        "type": env.type
                    },
                    "message": data
                })
                
        elif msg_type == "scene_update" or msg_type == "state_update":
            # Environment state update, forward to session
            if env.session_id and env.session_id in self.sessions:
                session = self.sessions[env.session_id]
                session.add_message(data)
                
                # Forward to all clients in this session
                await self.broadcast_to_session_clients(session, {
                    "type": "environment_update",
                    "from_env": {
                        "id": env.id,
                        "type": env.type
                    },
                    "update": data
                })
                
        elif msg_type == "error":
            # Error from environment, log and forward to session
            logger.warning(f"Error from environment {env.id}: {data.get('message', 'Unknown error')}")
            
            if env.session_id and env.session_id in self.sessions:
                session = self.sessions[env.session_id]
                session.add_message(data)
                
                # Forward to all clients in this session
                await self.broadcast_to_session_clients(session, {
                    "type": "environment_error",
                    "from_env": {
                        "id": env.id,
                        "type": env.type
                    },
                    "error": data
                })
                
        else:
            # Unknown message type
            logger.warning(f"Unknown message type from environment {env.id}: {msg_type}")
            await env.websocket.send(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            }))
    
    async def process_client_message(self, websocket, client_id: str, data: dict):
        """Process a message from a client (Claude CLI/API)"""
        if "type" not in data:
            await websocket.send(json.dumps({
                "type": "error",
                "message": "Missing message type"
            }))
            return
            
        msg_type = data["type"]
        
        # Authorize if required
        if self.require_auth and msg_type != "auth":
            # Check authorization
            auth_token = data.get("auth_token")
            if not auth_token or auth_token not in self.api_tokens:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Unauthorized - valid auth_token required"
                }))
                return
        
        # Handle different message types
        if msg_type == "auth":
            # Client authentication
            auth_token = data.get("auth_token")
            if not auth_token:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Missing auth_token"
                }))
                return
                
            if auth_token not in self.api_tokens:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid auth_token"
                }))
                return
                
            # Auth successful
            await websocket.send(json.dumps({
                "type": "auth_success",
                "message": "Authenticated successfully"
            }))
            
        elif msg_type == "list_environments":
            # List available environments
            envs = [env.to_dict() for env in self.environments.values()]
            await websocket.send(json.dumps({
                "type": "environments",
                "environments": envs
            }))
            
        elif msg_type == "list_sessions":
            # List active sessions
            sessions = [session.to_dict() for session in self.sessions.values()]
            await websocket.send(json.dumps({
                "type": "sessions",
                "sessions": sessions
            }))
            
        elif msg_type == "create_session":
            # Create new session
            session_id = str(uuid.uuid4())
            session = Session(session_id, client_id)
            self.sessions[session_id] = session
            
            # Add session metadata if provided
            metadata = data.get("metadata", {})
            if metadata:
                session.metadata = metadata
                
            # Add specified environments if provided
            env_ids = data.get("environments", [])
            for env_id in env_ids:
                if env_id in self.environments:
                    env = self.environments[env_id]
                    session.add_environment(env_id, env.type)
                    env.session_id = session_id
                    
                    # Notify environment of session
                    await env.websocket.send(json.dumps({
                        "type": "session_added",
                        "session_id": session_id
                    }))
            
            # Respond with session info
            await websocket.send(json.dumps({
                "type": "session_created",
                "session": session.to_dict()
            }))
            
        elif msg_type == "join_session":
            # Join existing session
            session_id = data.get("session_id")
            if not session_id or session_id not in self.sessions:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Session not found: {session_id}"
                }))
                return
                
            # Add client to session
            session = self.sessions[session_id]
            
            # Respond with session info and history
            await websocket.send(json.dumps({
                "type": "session_joined",
                "session": session.to_dict(),
                "message_history": session.message_history
            }))
            
        elif msg_type == "add_environment":
            # Add environment to session
            session_id = data.get("session_id")
            env_id = data.get("environment_id")
            
            if not session_id or session_id not in self.sessions:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Session not found: {session_id}"
                }))
                return
                
            if not env_id or env_id not in self.environments:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Environment not found: {env_id}"
                }))
                return
                
            # Add environment to session
            session = self.sessions[session_id]
            env = self.environments[env_id]
            
            session.add_environment(env_id, env.type)
            env.session_id = session_id
            
            # Notify environment of session
            await env.websocket.send(json.dumps({
                "type": "session_added",
                "session_id": session_id
            }))
            
            # Respond with updated session
            await websocket.send(json.dumps({
                "type": "environment_added",
                "session": session.to_dict()
            }))
            
        elif msg_type == "command" or msg_type == "query":
            # Send command/query to environment
            session_id = data.get("session_id")
            env_id = data.get("environment_id")
            
            if not session_id or session_id not in self.sessions:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Session not found: {session_id}"
                }))
                return
                
            if not env_id or env_id not in self.environments:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Environment not found: {env_id}"
                }))
                return
                
            # Check if environment is in this session
            session = self.sessions[session_id]
            if env_id not in session.environments:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Environment {env_id} not in session {session_id}"
                }))
                return
                
            # Forward command/query to environment
            env = self.environments[env_id]
            
            # Add request ID if not present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
                
            # Add to session history
            session.add_message(data)
            
            # Send to environment
            await env.websocket.send(json.dumps(data))
            
            # Acknowledge receipt
            await websocket.send(json.dumps({
                "type": f"{msg_type}_sent",
                "request_id": data["id"],
                "message": f"{msg_type} sent to environment {env_id}"
            }))
            
        elif msg_type == "close_session":
            # Close a session
            session_id = data.get("session_id")
            if not session_id or session_id not in self.sessions:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Session not found: {session_id}"
                }))
                return
                
            # Notify all environments in the session
            session = self.sessions[session_id]
            for env_id in session.environments:
                if env_id in self.environments:
                    env = self.environments[env_id]
                    env.session_id = None
                    
                    await env.websocket.send(json.dumps({
                        "type": "session_closed",
                        "session_id": session_id
                    }))
            
            # Remove session
            del self.sessions[session_id]
            
            # Acknowledge
            await websocket.send(json.dumps({
                "type": "session_closed",
                "session_id": session_id
            }))
            
        else:
            # Unknown message type
            await websocket.send(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            }))
    
    async def broadcast_to_session_clients(self, session: Session, message: dict):
        """Broadcast a message to all clients connected to a session"""
        # TODO: Implement client tracking per session for WebSocket clients
        # For now, we don't track which clients belong to which sessions
        pass
            
    async def ping_environments(self):
        """Periodically ping environments to check if they're still alive"""
        ping_interval = 30  # seconds
        while True:
            try:
                await asyncio.sleep(ping_interval)
                
                # Current time
                now = time.time()
                
                # Send ping to all environments
                disconnected_envs = []
                for env_id, env in self.environments.items():
                    try:
                        # Check if environment has been silent for too long
                        if now - env.last_ping > ping_interval * 3:
                            logger.warning(f"Environment {env_id} unresponsive, marking for removal")
                            disconnected_envs.append(env_id)
                            continue
                            
                        # Send ping
                        await env.websocket.send(json.dumps({
                            "type": "ping"
                        }))
                    except websockets.exceptions.ConnectionClosed:
                        logger.info(f"Environment {env_id} connection closed during ping")
                        disconnected_envs.append(env_id)
                    except Exception as e:
                        logger.error(f"Error pinging environment {env_id}: {str(e)}")
                        disconnected_envs.append(env_id)
                        
                # Remove disconnected environments
                for env_id in disconnected_envs:
                    if env_id in self.environments:
                        env = self.environments[env_id]
                        if env.session_id and env.session_id in self.sessions:
                            self.sessions[env.session_id].remove_environment(env_id)
                        del self.environments[env_id]
                        logger.info(f"Removed disconnected environment: {env_id}")
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in ping_environments: {str(e)}")
                logger.debug(traceback.format_exc())
    
    async def cleanup_expired_sessions(self):
        """Periodically clean up expired sessions"""
        cleanup_interval = 300  # 5 minutes
        session_timeout = 3600  # 1 hour of inactivity
        
        while True:
            try:
                await asyncio.sleep(cleanup_interval)
                
                # Current time
                now = time.time()
                
                # Check for expired sessions
                expired_sessions = []
                for session_id, session in self.sessions.items():
                    if now - session.last_activity > session_timeout:
                        expired_sessions.append(session_id)
                        
                # Remove expired sessions
                for session_id in expired_sessions:
                    session = self.sessions[session_id]
                    
                    # Notify environments
                    for env_id in session.environments:
                        if env_id in self.environments:
                            env = self.environments[env_id]
                            env.session_id = None
                            
                            try:
                                await env.websocket.send(json.dumps({
                                    "type": "session_expired",
                                    "session_id": session_id
                                }))
                            except:
                                pass  # Ignore errors
                    
                    # Remove session
                    del self.sessions[session_id]
                    logger.info(f"Removed expired session: {session_id}")
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup_expired_sessions: {str(e)}")
                logger.debug(traceback.format_exc())
    
    # HTTP API handlers
    async def handle_root(self, request):
        """Handle root endpoint"""
        return web.json_response({
            "name": "Pulser MCP Server",
            "version": "0.1.0",
            "endpoints": [
                "/api/status",
                "/api/environments",
                "/api/sessions",
                "/api/token",
                "/api/command"
            ]
        })
        
    async def handle_status(self, request):
        """Handle status endpoint"""
        return web.json_response({
            "status": "running",
            "uptime": time.time() - self.start_time if hasattr(self, "start_time") else 0,
            "environments": len(self.environments),
            "sessions": len(self.sessions),
            "clients": len(self.clients)
        })
        
    async def handle_environments(self, request):
        """Handle environments endpoint"""
        # Check authorization
        if self.require_auth:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token or token not in self.api_tokens:
                return web.json_response({
                    "error": "Unauthorized"
                }, status=401)
                
        # Return environments
        envs = [env.to_dict() for env in self.environments.values()]
        return web.json_response({
            "environments": envs
        })
        
    async def handle_sessions(self, request):
        """Handle sessions endpoint"""
        # Check authorization
        if self.require_auth:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token or token not in self.api_tokens:
                return web.json_response({
                    "error": "Unauthorized"
                }, status=401)
                
        # Return sessions
        sessions = [session.to_dict() for session in self.sessions.values()]
        return web.json_response({
            "sessions": sessions
        })
        
    async def handle_create_session(self, request):
        """Handle create session endpoint"""
        # Check authorization
        if self.require_auth:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token or token not in self.api_tokens:
                return web.json_response({
                    "error": "Unauthorized"
                }, status=401)
                
        # Parse request
        try:
            data = await request.json()
        except:
            return web.json_response({
                "error": "Invalid JSON"
            }, status=400)
            
        # Create session
        client_id = data.get("client_id", "http-api")
        session_id = str(uuid.uuid4())
        session = Session(session_id, client_id)
        self.sessions[session_id] = session
        
        # Add metadata if provided
        metadata = data.get("metadata", {})
        if metadata:
            session.metadata = metadata
            
        # Add specified environments if provided
        env_ids = data.get("environments", [])
        for env_id in env_ids:
            if env_id in self.environments:
                env = self.environments[env_id]
                session.add_environment(env_id, env.type)
                env.session_id = session_id
                
                # Notify environment of session
                try:
                    await env.websocket.send(json.dumps({
                        "type": "session_added",
                        "session_id": session_id
                    }))
                except:
                    pass  # Ignore errors
        
        # Return session info
        return web.json_response({
            "session": session.to_dict()
        })
        
    async def handle_create_token(self, request):
        """Handle create token endpoint"""
        # Only admin tokens can create new tokens
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token or token not in self.api_tokens:
            return web.json_response({
                "error": "Unauthorized"
            }, status=401)
            
        # Check if token has admin permissions
        token_info = self.api_tokens[token]
        if not token_info.get("admin", False):
            return web.json_response({
                "error": "Admin privileges required"
            }, status=403)
            
        # Parse request
        try:
            data = await request.json()
        except:
            return web.json_response({
                "error": "Invalid JSON"
            }, status=400)
            
        # Generate new token
        new_token = self.generate_token()
        expires_at = time.time() + TOKEN_EXPIRY_SECONDS
        
        # Create token info
        token_info = {
            "token": new_token,
            "name": data.get("name", "generated-token"),
            "created_at": time.time(),
            "expires_at": expires_at,
            "admin": data.get("admin", False),
            "created_by": token
        }
        
        # Add to API tokens
        self.api_tokens[new_token] = token_info
        
        # Save to config
        if "api_tokens" not in self.config:
            self.config["api_tokens"] = []
            
        self.config["api_tokens"].append(token_info)
        await self.save_config()
        
        # Return token info
        return web.json_response({
            "token": new_token,
            "expires_at": expires_at,
            "admin": token_info["admin"]
        })
        
    async def handle_command(self, request):
        """Handle command endpoint (send command to environment)"""
        # Check authorization
        if self.require_auth:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token or token not in self.api_tokens:
                return web.json_response({
                    "error": "Unauthorized"
                }, status=401)
                
        # Parse request
        try:
            data = await request.json()
        except:
            return web.json_response({
                "error": "Invalid JSON"
            }, status=400)
            
        # Validate request
        if "session_id" not in data:
            return web.json_response({
                "error": "Missing session_id"
            }, status=400)
            
        if "environment_id" not in data:
            return web.json_response({
                "error": "Missing environment_id"
            }, status=400)
            
        if "command" not in data and "query" not in data:
            return web.json_response({
                "error": "Missing command or query"
            }, status=400)
            
        # Get session and environment
        session_id = data["session_id"]
        env_id = data["environment_id"]
        
        if session_id not in self.sessions:
            return web.json_response({
                "error": f"Session not found: {session_id}"
            }, status=404)
            
        if env_id not in self.environments:
            return web.json_response({
                "error": f"Environment not found: {env_id}"
            }, status=404)
            
        # Check if environment is in session
        session = self.sessions[session_id]
        if env_id not in session.environments:
            return web.json_response({
                "error": f"Environment {env_id} not in session {session_id}"
            }, status=400)
            
        # Prepare command/query
        env = self.environments[env_id]
        request_id = str(uuid.uuid4())
        
        if "command" in data:
            # Send command
            command_data = {
                "type": "command",
                "id": request_id,
                "command": data["command"]
            }
            
            # Add params if provided
            if "params" in data:
                command_data["params"] = data["params"]
                
            # Add to session history
            session.add_message(command_data)
            
            # Send to environment
            try:
                await env.websocket.send(json.dumps(command_data))
            except Exception as e:
                return web.json_response({
                    "error": f"Failed to send command: {str(e)}"
                }, status=500)
                
        else:
            # Send query
            query_data = {
                "type": "query",
                "id": request_id,
                "query": data["query"]
            }
            
            # Add params if provided
            if "params" in data:
                query_data["params"] = data["params"]
                
            # Add to session history
            session.add_message(query_data)
            
            # Send to environment
            try:
                await env.websocket.send(json.dumps(query_data))
            except Exception as e:
                return web.json_response({
                    "error": f"Failed to send query: {str(e)}"
                }, status=500)
        
        # Return acknowledgement
        return web.json_response({
            "request_id": request_id,
            "status": "sent"
        })
    
    # Utility methods
    def generate_token(self):
        """Generate a random token"""
        return base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")
        
    async def save_config(self):
        """Save configuration to file"""
        if not self.config:
            return
            
        config_path = os.path.expanduser(DEFAULT_CONFIG_FILE)
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        with open(config_path, "w") as f:
            json.dump(self.config, f, indent=2)
            
        logger.info(f"Configuration saved to {config_path}")
        
    def shutdown(self):
        """Shut down the server"""
        logger.info("Shutting down MCP Server")
        self.shutdown_event.set()

async def load_config():
    """Load configuration from file"""
    config_path = os.path.expanduser(DEFAULT_CONFIG_FILE)
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
                
            logger.info(f"Loaded configuration from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            
    # Default config
    return {
        "host": DEFAULT_HOST,
        "port": DEFAULT_PORT,
        "debug": False,
        "require_auth": False,
        "api_tokens": []
    }

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Pulser MCP Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host to bind to")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument("--require-auth", action="store_true", help="Require authentication")
    parser.add_argument("--ssl-cert", help="SSL certificate file")
    parser.add_argument("--ssl-key", help="SSL key file")
    parser.add_argument("--config", help="Path to config file")
    
    args = parser.parse_args()
    
    # Load config
    config_path = args.config or DEFAULT_CONFIG_FILE
    config = await load_config()
    
    # Override with command line args
    if args.host != DEFAULT_HOST:
        config["host"] = args.host
        
    if args.port != DEFAULT_PORT:
        config["port"] = args.port
        
    if args.debug:
        config["debug"] = True
        
    if args.require_auth:
        config["require_auth"] = True
        
    if args.ssl_cert:
        config["ssl_cert"] = args.ssl_cert
        
    if args.ssl_key:
        config["ssl_key"] = args.ssl_key
    
    # Create and start server
    server = MCPServer(config)
    server.start_time = time.time()
    
    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    finally:
        server.shutdown()

if __name__ == "__main__":
    asyncio.run(main())