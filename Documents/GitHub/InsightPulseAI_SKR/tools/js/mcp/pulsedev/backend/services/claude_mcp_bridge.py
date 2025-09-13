"""
Claude MCP Bridge for PulseDev

This module provides a bridge between Model Context Protocol (MCP) and Anthropic's Claude API.
It handles the following tasks:
- Translating MCP requests to Claude API calls
- Formatting Claude responses for MCP
- Managing Claude API sessions
- Optimizing prompts for code-related tasks
"""

import os
import json
import asyncio
import websockets
import anthropic
import httpx
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

# MCP Configuration
MCP_HOST = os.environ.get("MCP_HOST", "localhost")
MCP_PORT = int(os.environ.get("MCP_PORT", 8765))
MCP_URL = f"ws://{MCP_HOST}:{MCP_PORT}/ws"

# Claude API Configuration
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")
DEFAULT_MODEL = os.environ.get("CLAUDE_MODEL", "claude-3-sonnet-20240229")

class ClaudeMCPBridge:
    """Bridge between MCP and Claude API"""
    
    def __init__(self):
        """Initialize the Claude MCP Bridge"""
        self.mcp_connected = False
        self.ws = None
        self.client = None
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.mcp_task = None
        self.request_counter = 0
        
        # Initialize Claude client if key is available
        if CLAUDE_API_KEY:
            self.client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
    async def connect_to_mcp(self):
        """Connect to the MCP server"""
        if self.mcp_connected:
            return
        
        try:
            self.ws = await websockets.connect(MCP_URL)
            self.mcp_connected = True
            
            # Start background task to listen for messages
            self.mcp_task = asyncio.create_task(self._listen_for_mcp_messages())
            
            # Register with MCP
            await self._send_to_mcp({
                "type": "register",
                "agent_id": "claude-mcp-bridge",
                "capabilities": ["ai_code_assistant", "claude", "code_generation", "explanation"]
            })
            
            print("Connected to MCP server")
            
        except Exception as e:
            print(f"Failed to connect to MCP server: {e}")
            self.mcp_connected = False
            self.ws = None
    
    async def disconnect_from_mcp(self):
        """Disconnect from the MCP server"""
        if not self.mcp_connected or not self.ws:
            return
        
        try:
            await self.ws.close()
        except:
            pass
        
        self.mcp_connected = False
        self.ws = None
        
        if self.mcp_task:
            self.mcp_task.cancel()
            self.mcp_task = None
    
    async def _listen_for_mcp_messages(self):
        """Listen for messages from the MCP server"""
        if not self.ws:
            return
        
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    await self._handle_mcp_message(data)
                except json.JSONDecodeError:
                    print("Received invalid JSON from MCP")
                    continue
        except websockets.exceptions.ConnectionClosed:
            print("MCP connection closed")
            self.mcp_connected = False
            self.ws = None
        except asyncio.CancelledError:
            # Task was cancelled, exit gracefully
            pass
        except Exception as e:
            print(f"Error in MCP message listener: {e}")
            self.mcp_connected = False
            self.ws = None
    
    async def _handle_mcp_message(self, message: Dict):
        """Handle a message from the MCP server"""
        message_type = message.get("type")
        
        if message_type == "request":
            # Handle incoming request
            request_id = message.get("request_id", str(uuid.uuid4()))
            action = message.get("action", "")
            data = message.get("data", {})
            
            # Process the request based on action
            if action == "code_assistance":
                response = await self._handle_code_assistance(data, request_id)
            elif action == "generate_code":
                response = await self._handle_generate_code(data, request_id)
            elif action == "explain_code":
                response = await self._handle_explain_code(data, request_id)
            elif action == "debug_code":
                response = await self._handle_debug_code(data, request_id)
            else:
                response = {
                    "type": "error",
                    "request_id": request_id,
                    "error": f"Unknown action: {action}"
                }
            
            # Send response back to MCP
            await self._send_to_mcp(response)
    
    async def _send_to_mcp(self, message: Dict) -> None:
        """Send a message to the MCP server"""
        if not self.mcp_connected or not self.ws:
            await self.connect_to_mcp()
            if not self.mcp_connected or not self.ws:
                raise RuntimeError("Not connected to MCP server")
        
        try:
            await self.ws.send(json.dumps(message))
        except Exception as e:
            print(f"Error sending message to MCP: {e}")
            self.mcp_connected = False
            self.ws = None
            raise RuntimeError(f"Failed to send message to MCP: {e}")
    
    async def _call_claude_api(self, messages: List[Dict], model: str = None, stream: bool = False) -> Dict:
        """Call the Claude API with the given messages"""
        if not self.client:
            raise RuntimeError("Claude API client not initialized. Check CLAUDE_API_KEY.")
        
        # Use default model if not specified
        model = model or DEFAULT_MODEL
        
        try:
            # Make the API call
            response = self.client.messages.create(
                model=model,
                messages=messages,
                max_tokens=4000,
                stream=stream
            )
            
            if stream:
                # For streaming, we need to handle differently
                return {
                    "status": "streaming",
                    "stream": response
                }
            else:
                # Return the full response
                return {
                    "status": "success",
                    "content": response.content[0].text,
                    "model": model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens
                    }
                }
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _build_system_prompt(self, action: str, context: Dict = None) -> str:
        """Build a system prompt based on the action and context"""
        
        # Base system prompt for code tasks
        base_prompt = """You are Claude, an AI assistant embedded in a cloud IDE called PulseDev. 
You specialize in helping developers with coding tasks, explanations, and debugging.
Always provide practical, direct, and educational assistance.
Focus on providing code that works correctly and follows best practices.
When appropriate, explain your code solutions to help the developer learn.

When generating code:
- Write clean, idiomatic, production-ready code that follows best practices
- Include helpful comments explaining complex parts
- Follow standard style conventions for the language
- Respect existing code style and patterns when extending existing code
- Consider edge cases and error handling

When explaining code:
- Break down complex concepts into digestible parts
- Highlight important patterns and techniques
- Explain the "why" behind coding decisions
- Be concise but thorough

When debugging:
- Carefully analyze the error message and code
- Identify likely causes of the issue
- Suggest specific fixes with explanations
- Consider alternative solutions if appropriate"""

        # Context-specific additions
        if action == "code_assistance":
            return base_prompt + """
            
For general code assistance:
- Provide direct and concise answers to coding questions
- Include code examples when relevant
- Suggest improvements when appropriate
- Reference documentation or resources when helpful"""
            
        elif action == "generate_code":
            return base_prompt + """
            
For code generation:
- Focus on creating well-structured, functional code
- Follow the user's requirements precisely
- Include reasonable input validation and error handling
- Structure your response with the code clearly demarcated
- Consider performance and efficiency in your implementation"""
            
        elif action == "explain_code":
            return base_prompt + """
            
For code explanation:
- Break down the code into logical components
- Explain the purpose of each major section
- Highlight any notable patterns or techniques
- Identify potential issues or areas for improvement
- Use a step-by-step approach to explain the code flow"""
            
        elif action == "debug_code":
            return base_prompt + """
            
For debugging:
- Analyze the error message carefully
- Identify the root cause of the issue
- Explain why the error is occurring
- Provide a clear solution with corrected code
- Explain how the fix resolves the issue
- Suggest any additional improvements to prevent similar issues"""
            
        return base_prompt
    
    def _format_file_context(self, context: Dict) -> str:
        """Format file context for inclusion in prompts"""
        formatted = ""
        
        if context.get("file_path"):
            formatted += f"\nFile: {context['file_path']}\n"
        
        if context.get("language"):
            formatted += f"Language: {context['language']}\n"
        
        if context.get("full_file_content"):
            formatted += f"\nFull file content:\n```\n{context['full_file_content']}\n```\n"
        elif context.get("code_context"):
            formatted += f"\nRelevant code context:\n```\n{context['code_context']}\n```\n"
            
        return formatted
    
    async def _handle_code_assistance(self, data: Dict, request_id: str) -> Dict:
        """Handle code assistance request"""
        query = data.get("query", "")
        context = data.get("context", {})
        
        if not query:
            return {
                "type": "error",
                "request_id": request_id,
                "error": "Query is required for code assistance"
            }
        
        # Build prompt with context
        system_prompt = self._build_system_prompt("code_assistance", context)
        context_text = self._format_file_context(context)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"I need help with the following code question:\n\n{query}\n\n{context_text}"}
        ]
        
        # Call Claude API
        claude_response = await self._call_claude_api(messages)
        
        if claude_response.get("status") == "error":
            return {
                "type": "error",
                "request_id": request_id,
                "error": claude_response.get("error", "Unknown error")
            }
        
        # Format response for MCP
        return {
            "type": "response",
            "request_id": request_id,
            "data": {
                "response": claude_response.get("content", ""),
                "model": claude_response.get("model", DEFAULT_MODEL),
                "usage": claude_response.get("usage", {})
            }
        }
    
    async def _handle_generate_code(self, data: Dict, request_id: str) -> Dict:
        """Handle code generation request"""
        prompt = data.get("prompt", "")
        language = data.get("language", "")
        context = data.get("context", {})
        
        if not prompt or not language:
            return {
                "type": "error",
                "request_id": request_id,
                "error": "Prompt and language are required for code generation"
            }
        
        # Build prompt with context
        system_prompt = self._build_system_prompt("generate_code", context)
        context_text = self._format_file_context(context)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate {language} code that does the following:\n\n{prompt}\n\n{context_text}"}
        ]
        
        # Call Claude API
        claude_response = await self._call_claude_api(messages)
        
        if claude_response.get("status") == "error":
            return {
                "type": "error",
                "request_id": request_id,
                "error": claude_response.get("error", "Unknown error")
            }
        
        # Extract code from response
        content = claude_response.get("content", "")
        code = self._extract_code_block(content, language)
        
        # Format response for MCP
        return {
            "type": "response",
            "request_id": request_id,
            "data": {
                "code": code,
                "explanation": content,
                "language": language,
                "model": claude_response.get("model", DEFAULT_MODEL),
                "usage": claude_response.get("usage", {})
            }
        }
    
    async def _handle_explain_code(self, data: Dict, request_id: str) -> Dict:
        """Handle code explanation request"""
        code = data.get("code", "")
        language = data.get("language", "")
        
        if not code:
            return {
                "type": "error",
                "request_id": request_id,
                "error": "Code is required for explanation"
            }
        
        # Build prompt for code explanation
        system_prompt = self._build_system_prompt("explain_code")
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Please explain this {language} code in detail:\n\n```{language}\n{code}\n```"}
        ]
        
        # Call Claude API
        claude_response = await self._call_claude_api(messages)
        
        if claude_response.get("status") == "error":
            return {
                "type": "error",
                "request_id": request_id,
                "error": claude_response.get("error", "Unknown error")
            }
        
        # Format response for MCP
        explanation = claude_response.get("content", "")
        
        return {
            "type": "response",
            "request_id": request_id,
            "data": {
                "explanation": explanation,
                "model": claude_response.get("model", DEFAULT_MODEL),
                "usage": claude_response.get("usage", {})
            }
        }
    
    async def _handle_debug_code(self, data: Dict, request_id: str) -> Dict:
        """Handle code debugging request"""
        code = data.get("code", "")
        error = data.get("error", "")
        language = data.get("language", "")
        
        if not code or not error:
            return {
                "type": "error",
                "request_id": request_id,
                "error": "Code and error are required for debugging"
            }
        
        # Build prompt for debugging
        system_prompt = self._build_system_prompt("debug_code")
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Please debug this {language} code that's giving the following error:\n\nError:\n{error}\n\nCode:\n```{language}\n{code}\n```\n\nIdentify the issue, explain the problem, and provide a corrected version of the code."}
        ]
        
        # Call Claude API
        claude_response = await self._call_claude_api(messages)
        
        if claude_response.get("status") == "error":
            return {
                "type": "error",
                "request_id": request_id,
                "error": claude_response.get("error", "Unknown error")
            }
        
        # Format response for MCP
        content = claude_response.get("content", "")
        fixed_code = self._extract_code_block(content, language)
        
        return {
            "type": "response",
            "request_id": request_id,
            "data": {
                "diagnosis": content,
                "fixed_code": fixed_code,
                "model": claude_response.get("model", DEFAULT_MODEL),
                "usage": claude_response.get("usage", {})
            }
        }
    
    def _extract_code_block(self, text: str, language: str) -> str:
        """Extract code block from Claude response"""
        import re
        
        # Look for language-specific code block
        pattern = f"```{language}(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            return matches[0].strip()
        
        # Try generic code block
        pattern = r"```(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            # Check if first line is language identifier and remove it if so
            code = matches[0].strip()
            lines = code.split('\n')
            if lines[0].strip().lower() == language.lower():
                return '\n'.join(lines[1:]).strip()
            return code
        
        return text  # Return full text if no code block found

# Create singleton instance
claude_mcp_bridge = ClaudeMCPBridge()

# Async function to start the bridge
async def start_claude_mcp_bridge():
    """Start the Claude MCP Bridge"""
    await claude_mcp_bridge.connect_to_mcp()
    
    # Keep the bridge running
    try:
        while True:
            await asyncio.sleep(60)
            
            # Reconnect if disconnected
            if not claude_mcp_bridge.mcp_connected:
                await claude_mcp_bridge.connect_to_mcp()
    except asyncio.CancelledError:
        # Gracefully disconnect on cancellation
        await claude_mcp_bridge.disconnect_from_mcp()

# Entry point for running as a script
if __name__ == "__main__":
    asyncio.run(start_claude_mcp_bridge())