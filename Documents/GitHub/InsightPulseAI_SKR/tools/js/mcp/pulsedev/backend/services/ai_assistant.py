"""
AI Assistant Service for PulseDev

This module provides AI assistance features through MCP:
- Code understanding and explanation
- Code generation and completion
- Error debugging
- Language-specific assistance
- Specialized behavior through different system prompts
"""

import json
import asyncio
import websockets
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime
import aiohttp
import os

# Import MCP bridges
from .mcp_direct_bridge import mcp_direct_bridge

# MCP Configuration
MCP_HOST = os.environ.get("MCP_HOST", "localhost")
MCP_PORT = int(os.environ.get("MCP_PORT", 8765))
MCP_URL = f"ws://{MCP_HOST}:{MCP_PORT}/ws"

class AIAssistantService:
    """Service for AI assistance through MCP"""
    
    def __init__(self):
        """Initialize the AI assistant service"""
        self.connected = False
        self.ws = None
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.mcp_task = None
        self.active_prompt = None
    
    async def connect(self):
        """Connect to the MCP server via the direct bridge"""
        try:
            # Connect using the direct bridge
            await mcp_direct_bridge.connect_to_mcp()
            self.connected = mcp_direct_bridge.mcp_connected
            self.active_prompt = mcp_direct_bridge.active_prompt
            
            print(f"Connected to MCP server via direct bridge using prompt: {self.active_prompt}")
            
        except Exception as e:
            print(f"Failed to connect to MCP server: {e}")
            self.connected = False
    
    async def disconnect(self):
        """Disconnect from the MCP server"""
        await mcp_direct_bridge.disconnect_from_mcp()
        self.connected = False
    
    async def load_prompt(self, prompt_name: str) -> bool:
        """
        Load a specific MCP prompt
        
        Args:
            prompt_name: Name of the prompt to load
            
        Returns:
            Success status
        """
        result = await mcp_direct_bridge.load_prompt(prompt_name)
        if result:
            self.active_prompt = prompt_name
        return result
    
    def get_available_prompts(self, include_metadata: bool = False, access_level: str = None) -> List[Dict] or List[str]:
        """
        Get a list of available MCP prompts
        
        Args:
            include_metadata: Whether to include prompt metadata in the results
            access_level: If specified, filter prompts by access level (public, beta, internal)
            
        Returns:
            List of prompt names or dictionaries with prompt information
        """
        return mcp_direct_bridge.get_available_prompts(include_metadata, access_level)
    
    def get_prompt_info(self, prompt_name: str) -> Dict:
        """
        Get information about a specific prompt
        
        Args:
            prompt_name: Name of the prompt
            
        Returns:
            Prompt information
        """
        return mcp_direct_bridge.get_prompt_info(prompt_name)
    
    def get_active_prompt(self) -> str:
        """
        Get the currently active prompt name
        
        Returns:
            Active prompt name or None
        """
        return mcp_direct_bridge.active_prompt
    
    async def get_code_assistance(self, query: str, context: Dict = None, prompt_name: str = None) -> Dict:
        """
        Get code assistance from the AI
        
        Args:
            query: The user's query
            context: Optional context like file contents, language, etc.
            prompt_name: Optional prompt to use for this request
            
        Returns:
            AI response
        """
        # Ensure connected to MCP
        if not self.connected:
            await self.connect()
        
        try:
            # Use the direct bridge to get assistance
            response = await mcp_direct_bridge.get_code_assistance(query, context, prompt_name)
            return response
        except Exception as e:
            print(f"Error getting code assistance: {e}")
            
            # Fallback response if MCP is not available
            return {
                "response": "I'm having trouble connecting to the AI service. Please try again later.",
                "type": "error",
                "suggestions": []
            }
    
    async def generate_code(self, prompt: str, language: str, context: Dict = None, prompt_name: str = None) -> Dict:
        """
        Generate code based on a prompt
        
        Args:
            prompt: Description of code to generate
            language: Programming language
            context: Optional context like surrounding code
            prompt_name: Optional prompt to use for this request
            
        Returns:
            Generated code and explanation
        """
        # Ensure connected to MCP
        if not self.connected:
            await self.connect()
        
        try:
            # Use the direct bridge to generate code
            response = await mcp_direct_bridge.generate_code(prompt, language, context, prompt_name)
            return response
        except Exception as e:
            print(f"Error generating code: {e}")
            
            # Fallback response
            return {
                "code": "// Error generating code",
                "explanation": f"I encountered an error while generating code: {str(e)}",
                "type": "error"
            }
    
    async def explain_code(self, code: str, language: str, prompt_name: str = None) -> Dict:
        """
        Explain code snippet
        
        Args:
            code: Code to explain
            language: Programming language
            prompt_name: Optional prompt to use for this request
            
        Returns:
            Explanation of the code
        """
        # Ensure connected to MCP
        if not self.connected:
            await self.connect()
        
        try:
            # Use the direct bridge to explain code
            response = await mcp_direct_bridge.explain_code(code, language, prompt_name)
            return response
        except Exception as e:
            print(f"Error explaining code: {e}")
            
            # Fallback response
            return {
                "explanation": f"I encountered an error while explaining this code: {str(e)}",
                "points": [],
                "type": "error"
            }
    
    async def debug_code(self, code: str, error: str, language: str, prompt_name: str = None) -> Dict:
        """
        Debug code with an error
        
        Args:
            code: Code with error
            error: Error message or description
            language: Programming language
            prompt_name: Optional prompt to use for this request
            
        Returns:
            Debugging suggestions
        """
        # Ensure connected to MCP
        if not self.connected:
            await self.connect()
        
        try:
            # Use the direct bridge to debug code
            response = await mcp_direct_bridge.debug_code(code, error, language, prompt_name)
            return response
        except Exception as e:
            print(f"Error debugging code: {e}")
            
            # Fallback response
            return {
                "diagnosis": f"I encountered an error while debugging: {str(e)}",
                "suggestions": [],
                "fixed_code": "",
                "type": "error"
            }
    
    async def extract_prompt_hint(self, query: str) -> str or None:
        """
        Extract a prompt hint from the query text
        
        Args:
            query: The user's query
            
        Returns:
            Extracted prompt hint or None
        """
        return mcp_direct_bridge._extract_prompt_hint(query)
        
    async def get_specialized_assistance(self, task_type: str, query: str, context: Dict = None) -> Dict:
        """
        Get specialized assistance by automatically selecting the appropriate prompt
        
        Args:
            task_type: Type of task (code, design, docs, presentation, etc.)
            query: The user's query
            context: Optional context information
            
        Returns:
            AI response
        """
        # Extended task type mapping with aliases
        prompt_mapping = {
            # Primary task types
            "code": "cursor/chat_prompt",
            "command": "replit/command_runner",
            "design": "lovable/ux_designer", 
            "component": "rork/component_logic",
            "presentation": "gamma/presentation_creator",
            "docs": "same/collaboration_agent",
            "debug": "vscode/code_assistant",
            "project": "devin/autonomous_developer",
            "agent": "manus/agent_programmer",
            "general": "combined/pulsedev_unified",
            
            # Aliases
            "ui": "lovable/ux_designer",
            "ux": "lovable/ux_designer",
            "interface": "lovable/ux_designer",
            "slides": "gamma/presentation_creator",
            "deck": "gamma/presentation_creator",
            "pitch": "gamma/presentation_creator",
            "documentation": "same/collaboration_agent",
            "writing": "same/collaboration_agent",
            "terminal": "replit/command_runner",
            "shell": "replit/command_runner",
            "fix": "vscode/code_assistant",
            "editor": "vscode/code_assistant",
            "autonomous": "devin/autonomous_developer",
            "implementation": "devin/autonomous_developer",
            "feature": "devin/autonomous_developer",
            "prototype": "devin/autonomous_developer"
        }
        
        # If we have a task type hint in the query itself, use that instead
        query_hint = await self.extract_prompt_hint(query)
        effective_task = task_type.lower() if task_type else None
        
        # Extract prompt hint from metadata if available
        meta_hint = None
        if context and context.get("meta") and context["meta"].get("prompt_hint"):
            meta_hint = context["meta"]["prompt_hint"]
        
        # Priority: meta_hint > query_hint > provided task_type
        effective_task = meta_hint or query_hint or effective_task or "general"
        
        # Get the appropriate prompt for this task type
        prompt_name = prompt_mapping.get(effective_task.lower(), "combined/pulsedev_unified")
        
        # Check if prompt exists, fallback to unified if not
        if not await mcp_direct_bridge.load_prompt(prompt_name):
            prompt_name = "combined/pulsedev_unified"
        
        # Add task type information to context
        context = context or {}
        if "meta" not in context:
            context["meta"] = {}
        context["meta"]["task_type"] = effective_task
        context["meta"]["prompt_hint"] = prompt_name
        
        # Get assistance using the selected prompt
        return await self.get_code_assistance(query, context, prompt_name)

# Create singleton instance
ai_assistant_service = AIAssistantService()