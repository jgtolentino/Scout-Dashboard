"""
Terminal Service for PulseDev

This module provides a terminal execution service via Docker containers:
- Command execution in isolated environments
- Terminal session management
- Output streaming
"""

import os
import uuid
import asyncio
import docker
from docker.errors import DockerException
import tempfile
from datetime import datetime
from typing import Dict, Optional, List, Union
import time
import json
import shutil
from pathlib import Path

# Docker client
client = docker.from_env()

# Base directory for all workspaces
WORKSPACE_ROOT = Path("/tmp/pulsedev_workspaces")

class TerminalService:
    """Service for terminal execution in Docker containers"""
    
    def __init__(self):
        """Initialize the terminal service"""
        self.sessions: Dict[str, Dict] = {}
        self.container_base_image = "pulsedev-executor:latest"
        self._ensure_base_image()
    
    def _ensure_base_image(self):
        """Ensure the base container image exists, build if needed"""
        try:
            client.images.get(self.container_base_image)
            print(f"Base image {self.container_base_image} exists")
        except DockerException:
            print(f"Base image {self.container_base_image} not found, will use fallback")
            # In a real implementation, we would build the image here
            # For now, we'll use a fallback public image
            self.container_base_image = "node:16-buster"
    
    async def create_session(self, workspace_id: str) -> Dict:
        """
        Create a new terminal session for a workspace
        
        Args:
            workspace_id: ID of the workspace
            
        Returns:
            Session information
        """
        # Generate a unique session ID
        session_id = str(uuid.uuid4())
        
        # Get workspace path
        workspace_path = WORKSPACE_ROOT / workspace_id
        if not workspace_path.exists():
            raise ValueError(f"Workspace {workspace_id} not found")
        
        try:
            # Create a new container
            container = client.containers.run(
                self.container_base_image,
                command="sleep infinity",  # Keep container running
                detach=True,
                auto_remove=True,  # Remove container when stopped
                volumes={
                    str(workspace_path.absolute()): {
                        'bind': '/workspace',
                        'mode': 'rw'
                    }
                },
                working_dir="/workspace",
                network_mode="bridge",
                # Resource limits
                mem_limit="256m",
                memswap_limit="512m",
                cpu_period=100000,  # microseconds
                cpu_quota=50000,    # 50% of CPU
                environment={
                    "WORKSPACE_ID": workspace_id,
                    "SESSION_ID": session_id,
                    "TERM": "xterm-256color"
                }
            )
            
            # Store session info
            self.sessions[session_id] = {
                "id": session_id,
                "workspace_id": workspace_id,
                "container_id": container.id,
                "created_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "status": "running"
            }
            
            return self.sessions[session_id]
            
        except DockerException as e:
            raise RuntimeError(f"Failed to create terminal session: {e}")
    
    async def execute_command(self, session_id: str, command: str) -> Dict:
        """
        Execute a command in a terminal session
        
        Args:
            session_id: ID of the terminal session
            command: Command to execute
            
        Returns:
            Execution result
        """
        if session_id not in self.sessions:
            raise ValueError(f"Terminal session {session_id} not found")
        
        session = self.sessions[session_id]
        container_id = session["container_id"]
        
        try:
            # Get container
            container = client.containers.get(container_id)
            
            # Execute command
            exec_id = container.exec_run(
                cmd=["/bin/bash", "-c", command],
                stdout=True,
                stderr=True,
                stream=True
            )
            
            # Update session activity time
            self.sessions[session_id]["last_activity"] = datetime.now().isoformat()
            
            return {
                "session_id": session_id,
                "command": command,
                "exec_id": exec_id.id
            }
            
        except DockerException as e:
            # Container might have died
            self.sessions[session_id]["status"] = "error"
            raise RuntimeError(f"Failed to execute command: {e}")
    
    async def read_output(self, session_id: str, exec_id: str) -> str:
        """
        Read the output from a command execution
        
        Args:
            session_id: ID of the terminal session
            exec_id: ID of the execution
            
        Returns:
            Command output
        """
        if session_id not in self.sessions:
            raise ValueError(f"Terminal session {session_id} not found")
        
        try:
            # Get the output
            container = client.containers.get(self.sessions[session_id]["container_id"])
            output = container.exec_inspect(exec_id)
            
            # Return the output
            return output["Output"]
            
        except DockerException as e:
            raise RuntimeError(f"Failed to read output: {e}")
    
    async def list_sessions(self, workspace_id: str) -> List[Dict]:
        """List all terminal sessions for a workspace"""
        return [
            session for session in self.sessions.values()
            if session["workspace_id"] == workspace_id
        ]
    
    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Get terminal session details"""
        return self.sessions.get(session_id)
    
    async def terminate_session(self, session_id: str) -> bool:
        """Terminate a terminal session"""
        if session_id not in self.sessions:
            return False
        
        try:
            # Get container
            container_id = self.sessions[session_id]["container_id"]
            container = client.containers.get(container_id)
            
            # Stop container
            container.stop()
            
            # Update session status
            self.sessions[session_id]["status"] = "terminated"
            
            return True
            
        except DockerException:
            # Container might be already gone
            self.sessions[session_id]["status"] = "terminated"
            return True
    
    async def cleanup_idle_sessions(self, max_idle_time: int = 3600) -> int:
        """
        Clean up idle terminal sessions
        
        Args:
            max_idle_time: Maximum idle time in seconds
            
        Returns:
            Number of sessions cleaned up
        """
        now = time.time()
        sessions_to_terminate = []
        
        for session_id, session in self.sessions.items():
            if session["status"] == "running":
                # Parse last activity time
                last_activity = datetime.fromisoformat(session["last_activity"])
                idle_seconds = (datetime.now() - last_activity).total_seconds()
                
                if idle_seconds > max_idle_time:
                    sessions_to_terminate.append(session_id)
        
        # Terminate idle sessions
        terminated_count = 0
        for session_id in sessions_to_terminate:
            if await self.terminate_session(session_id):
                terminated_count += 1
        
        return terminated_count

# Create a singleton instance
terminal_service = TerminalService()