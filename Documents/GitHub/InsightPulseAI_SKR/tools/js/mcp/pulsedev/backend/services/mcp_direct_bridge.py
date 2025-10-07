"""
MCP Direct Bridge for PulseDev

This module provides a direct bridge to the existing MCP server without
requiring Claude API keys. It routes AI requests directly through the
existing MCP infrastructure, similar to how Blender integration works.
"""

import os
import json
import asyncio
import websockets
import uuid
import yaml
import pathlib
from typing import Dict, List, Optional, Any

# MCP Configuration
MCP_HOST = os.environ.get("MCP_HOST", "localhost")
MCP_PORT = int(os.environ.get("MCP_PORT", 8765))
MCP_URL = f"ws://{MCP_HOST}:{MCP_PORT}/ws"

# Prompts configuration
PROMPTS_DIR = pathlib.Path(__file__).parents[2] / "mcp_prompts"

class MCPDirectBridge:
    """Direct bridge to MCP without requiring Claude API keys"""
    
    def __init__(self):
        """Initialize the MCP Direct Bridge"""
        self.mcp_connected = False
        self.ws = None
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.mcp_task = None
        self.request_counter = 0
        self.loaded_prompts = {}
        self.active_prompt = None
        
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
                "agent_id": "pulsedev-direct-bridge",
                "capabilities": ["code_completion", "code_explanation", "debugging"]
            })
            
            # Load the default unified prompt
            await self.load_prompt("combined/pulsedev_unified")
            
            print("Connected to MCP server directly")
            
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
        request_id = message.get("id") or message.get("request_id")
        
        if message_type == "response" and request_id in self.pending_requests:
            # Complete the future with the response
            future = self.pending_requests.pop(request_id)
            future.set_result(message.get("result", {}))
        
        elif message_type == "error" and request_id in self.pending_requests:
            # Complete the future with an error
            future = self.pending_requests.pop(request_id)
            future.set_exception(Exception(message.get("error", "Unknown error")))
    
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
    
    async def _send_request(self, message: Dict) -> Dict:
        """Send a request to the MCP server and wait for response"""
        # Generate a request ID if not provided
        request_id = message.get("id", str(uuid.uuid4()))
        message["id"] = request_id
        
        # Create a future for the response
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        # Send the request
        await self._send_to_mcp(message)
        
        try:
            # Wait for the response with timeout
            return await asyncio.wait_for(future, timeout=120.0)
        except asyncio.TimeoutError:
            # Remove the pending request
            self.pending_requests.pop(request_id, None)
            raise RuntimeError("Request timed out")

    async def load_prompt(self, prompt_name: str) -> bool:
        """
        Load an MCP prompt by name
        
        Args:
            prompt_name: Name of the prompt to load (e.g., "cursor/chat_prompt")
            
        Returns:
            Success status
        """
        if prompt_name in self.loaded_prompts:
            self.active_prompt = prompt_name
            print(f"Activated cached prompt: {prompt_name}")
            return True
            
        try:
            prompt_path = PROMPTS_DIR / f"{prompt_name}.mcp.yaml"
            with open(prompt_path, 'r') as f:
                prompt_data = yaml.safe_load(f)
                
            if "system_prompt" not in prompt_data:
                print(f"Invalid prompt format: {prompt_name}")
                return False
                
            self.loaded_prompts[prompt_name] = prompt_data
            self.active_prompt = prompt_name
            print(f"Loaded and activated prompt: {prompt_name}")
            return True
            
        except Exception as e:
            print(f"Error loading prompt {prompt_name}: {e}")
            return False
    
    def get_available_prompts(self, include_metadata: bool = False, access_level: str = None) -> List[Dict] or List[str]:
        """
        Get a list of available MCP prompts
        
        Args:
            include_metadata: Whether to include prompt metadata in the results
            access_level: If specified, filter prompts by access level (public, beta, internal)
            
        Returns:
            List of prompt names or dictionaries with prompt information
        """
        prompt_files = list(PROMPTS_DIR.glob("**/*.mcp.yaml"))
        prompts = []
        
        for file in prompt_files:
            # Convert path to relative prompt name (without .mcp.yaml extension)
            rel_path = file.relative_to(PROMPTS_DIR)
            prompt_name = str(rel_path.with_suffix("")).replace(".mcp", "")
            
            # If we need to filter by access level or include metadata
            if include_metadata or access_level:
                info = self.get_prompt_info(prompt_name)
                
                # Filter by access level if specified
                if access_level and info.get("access_level") != access_level:
                    continue
                    
                if include_metadata:
                    prompts.append(info)
                else:
                    prompts.append(prompt_name)
            else:
                prompts.append(prompt_name)
            
        return prompts
            
    def get_prompt_info(self, prompt_name: str) -> Dict:
        """
        Get information about a specific prompt
        
        Args:
            prompt_name: Name of the prompt
            
        Returns:
            Prompt information
        """
        if prompt_name in self.loaded_prompts:
            prompt_data = self.loaded_prompts[prompt_name]
        else:
            prompt_path = PROMPTS_DIR / f"{prompt_name}.mcp.yaml"
            try:
                with open(prompt_path, 'r') as f:
                    prompt_data = yaml.safe_load(f)
            except:
                return {"error": f"Prompt {prompt_name} not found"}
        
        # Extract optional access level for security control
        metadata = prompt_data.get("metadata", {})
        access_level = metadata.get("access_level", "internal")
        
        return {
            "name": prompt_name,
            "metadata": metadata,
            "active": prompt_name == self.active_prompt,
            "access_level": access_level,
            "requires": metadata.get("requires", []),
            "aliases": metadata.get("aliases", [])
        }
        
    def _get_active_system_prompt(self) -> str:
        """
        Get the currently active system prompt
        
        Returns:
            System prompt string
        """
        if not self.active_prompt or self.active_prompt not in self.loaded_prompts:
            # Load and use default if no active prompt
            return """You are Claude, an AI assistant embedded in PulseDev.
            You help users with coding tasks, documentation, and software development."""
            
        return self.loaded_prompts[self.active_prompt]["system_prompt"]
        
    def find_prompt_by_alias(self, alias: str) -> str:
        """
        Find a prompt by its alias
        
        Args:
            alias: The alias to search for
            
        Returns:
            Prompt name or None if not found
        """
        # First check exact matches in prompt names
        all_prompts = self.get_available_prompts(include_metadata=True)
        
        # Check for direct name match
        for prompt in all_prompts:
            name = prompt if isinstance(prompt, str) else prompt["name"]
            if alias.lower() in name.lower():
                return name
        
        # Check for alias match
        for prompt in all_prompts:
            if isinstance(prompt, str):
                continue
                
            aliases = prompt.get("metadata", {}).get("aliases", [])
            if any(alias.lower() in a.lower() for a in aliases):
                return prompt["name"]
                
        # Default to unified prompt if no match
        return "combined/pulsedev_unified"
        
    def check_dependencies(self, prompt_name: str, available_modules: List[str] = None) -> Dict:
        """
        Check if all required dependencies for a prompt are available
        
        Args:
            prompt_name: Name of the prompt to check
            available_modules: List of available modules (if None, assumes all are available)
            
        Returns:
            Dictionary with status and missing dependencies
        """
        info = self.get_prompt_info(prompt_name)
        required = info.get("requires", [])
        
        # If no requirements or no modules specified, assume all are available
        if not required or available_modules is None:
            return {"status": "ok", "missing": []}
            
        missing = [req for req in required if req not in available_modules]
        status = "ok" if not missing else "missing_dependencies"
        
        return {
            "status": status,
            "missing": missing,
            "prompt": prompt_name
        }
    
    async def get_code_assistance(self, query: str, context: Dict = None, prompt_name: str = None) -> Dict:
        """
        Get code assistance from MCP
        
        Args:
            query: The user's query
            context: Optional context like file contents, language, etc.
            prompt_name: Optional prompt name to use for this request
            
        Returns:
            MCP response
        """
        # Ensure connected to MCP
        if not self.mcp_connected:
            await self.connect_to_mcp()
        
        # Check for prompt hints in the query
        prompt_hint = self._extract_prompt_hint(query)
        meta_hint = context.get("meta", {}).get("prompt_hint") if context and context.get("meta") else None
        
        # Determine which prompt to use, with priority:
        # 1. Explicit prompt_name parameter
        # 2. Metadata hint from context
        # 3. Hint extracted from query
        # 4. Current active prompt
        effective_prompt = prompt_name or meta_hint or prompt_hint or self.active_prompt
        
        # If we have a hint but not a full path, try to find by alias
        if effective_prompt and '/' not in effective_prompt:
            effective_prompt = self.find_prompt_by_alias(effective_prompt)
        
        # Load the determined prompt
        if effective_prompt and effective_prompt != self.active_prompt:
            await self.load_prompt(effective_prompt)
        
        # Get system prompt
        system_prompt = self._get_active_system_prompt()
        
        # Check dependencies if available modules are provided
        if context and context.get("available_modules"):
            dep_check = self.check_dependencies(self.active_prompt, context["available_modules"])
            if dep_check["status"] != "ok":
                # Append warning about missing dependencies
                system_prompt += f"\n\nWARNING: Some required modules are not available: {', '.join(dep_check['missing'])}\n" \
                                f"You should inform the user that these capabilities may be limited.\n"
        
        # Format context information
        context_str = ""
        if context:
            if context.get("file_path"):
                context_str += f"File: {context['file_path']}\n"
            if context.get("language"):
                context_str += f"Language: {context['language']}\n"
            if context.get("full_file_content"):
                context_str += f"\nFile content:\n```\n{context['full_file_content']}\n```\n"
            elif context.get("code_context"):
                context_str += f"\nCode context:\n```\n{context['code_context']}\n```\n"
        
        # Create request
        request = {
            "type": "query",
            "model": "claude",
            "system_prompt": system_prompt,
            "query": f"{query}\n\n{context_str}",
            "intent": "code_assistance"
        }
        
        # Send request and wait for response
        try:
            response = await self._send_request(request)
            return {
                "response": response.get("text", ""),
                "type": "success",
                "prompt_used": self.active_prompt,
                "prompt_source": prompt_name or meta_hint or prompt_hint or "default"
            }
        except Exception as e:
            print(f"Error getting code assistance: {e}")
            
            # Fallback response
            return {
                "response": f"I encountered an error while processing your request: {str(e)}",
                "type": "error"
            }
            
    def _extract_prompt_hint(self, query: str) -> str or None:
        """
        Extract prompt hint from query text
        
        Args:
            query: The user's query
            
        Returns:
            Extracted prompt hint or None
        """
        # Common patterns for prompt hints
        patterns = [
            r"(?:use|with|in|using|like)\s+([\w-]+)(?:-style|\s+style|\s+mode)\s+(?:to|approach|logic)",
            r"(?:as|like|similar to)\s+(?:a|an)\s+([\w-]+)\s+would",
            r"(?:in|with)\s+(?:a|an)\s+([\w-]+)(?:-like|\s+like)\s+(?:way|manner|approach)"
        ]
        
        query_lower = query.lower()
        
        for pattern in patterns:
            import re
            matches = re.search(pattern, query_lower)
            if matches:
                return matches.group(1)
                
        # Check for direct tool mentions
        tool_keywords = {
            "cursor": "cursor",
            "replit": "replit",
            "vscode": "vscode",
            "gamma": "gamma",
            "slide": "gamma",
            "presentation": "gamma",
            "deck": "gamma",
            "lovable": "lovable",
            "ui": "lovable",
            "ux": "lovable",
            "design": "lovable",
            "rork": "rork",
            "component": "rork",
            "devin": "devin",
            "autonomous": "devin",
            "same.dev": "same",
            "collaborate": "same",
            "docs": "same",
            "documentation": "same",
            "manus": "manus",
            "agent": "manus"
        }
        
        for keyword, tool in tool_keywords.items():
            if keyword in query_lower:
                # Return the tool directory
                return f"{tool}"
                
        return None
    
    async def generate_code(self, prompt: str, language: str, context: Dict = None, prompt_name: str = None) -> Dict:
        """
        Generate code based on a prompt through MCP
        
        Args:
            prompt: Description of code to generate
            language: Programming language
            context: Optional context like surrounding code
            prompt_name: Optional prompt name to use for this request
            
        Returns:
            Generated code and explanation
        """
        # Ensure connected to MCP
        if not self.mcp_connected:
            await self.connect_to_mcp()
        
        # Load specific prompt if requested
        if prompt_name:
            await self.load_prompt(prompt_name)
        
        # Get system prompt
        system_prompt = self._get_active_system_prompt()
        
        # Format context information
        context_str = ""
        if context:
            if context.get("file_path"):
                context_str += f"File: {context['file_path']}\n"
            if context.get("full_file_content"):
                context_str += f"\nExisting file content:\n```\n{context['full_file_content']}\n```\n"
            elif context.get("code_context"):
                context_str += f"\nSurrounding code:\n```\n{context['code_context']}\n```\n"
        
        # Create request
        request = {
            "type": "query",
            "model": "claude",
            "system_prompt": system_prompt,
            "query": f"Generate {language} code that does the following:\n\n{prompt}\n\n{context_str}\n\nPlease provide clean, well-commented code with a brief explanation of how it works.",
            "intent": "code_generation"
        }
        
        # Send request and wait for response
        try:
            response = await self._send_request(request)
            
            # Extract code from response
            content = response.get("text", "")
            code = self._extract_code_block(content, language)
            
            return {
                "code": code,
                "explanation": content,
                "language": language,
                "type": "success",
                "prompt_used": self.active_prompt
            }
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
        Explain code snippet through MCP
        
        Args:
            code: Code to explain
            language: Programming language
            prompt_name: Optional prompt name to use for this request
            
        Returns:
            Explanation of the code
        """
        # Ensure connected to MCP
        if not self.mcp_connected:
            await self.connect_to_mcp()
        
        # Load specific prompt if requested
        if prompt_name:
            await self.load_prompt(prompt_name)
        
        # Get system prompt
        system_prompt = self._get_active_system_prompt()
        
        # Create request
        request = {
            "type": "query",
            "model": "claude",
            "system_prompt": system_prompt,
            "query": f"Please explain this {language} code in detail:\n\n```{language}\n{code}\n```\n\nBreak down how it works, explain any important patterns or concepts, and identify any potential issues or improvements.",
            "intent": "code_explanation"
        }
        
        # Send request and wait for response
        try:
            response = await self._send_request(request)
            return {
                "explanation": response.get("text", ""),
                "type": "success",
                "prompt_used": self.active_prompt
            }
        except Exception as e:
            print(f"Error explaining code: {e}")
            
            # Fallback response
            return {
                "explanation": f"I encountered an error while explaining this code: {str(e)}",
                "type": "error"
            }
    
    async def debug_code(self, code: str, error: str, language: str, prompt_name: str = None) -> Dict:
        """
        Debug code with an error through MCP
        
        Args:
            code: Code with error
            error: Error message or description
            language: Programming language
            prompt_name: Optional prompt name to use for this request
            
        Returns:
            Debugging suggestions
        """
        # Ensure connected to MCP
        if not self.mcp_connected:
            await self.connect_to_mcp()
        
        # Load specific prompt if requested
        if prompt_name:
            await self.load_prompt(prompt_name)
        
        # Get system prompt
        system_prompt = self._get_active_system_prompt()
        
        # Create request
        request = {
            "type": "query",
            "model": "claude",
            "system_prompt": system_prompt,
            "query": f"Please debug this {language} code that's giving the following error:\n\nError:\n{error}\n\nCode:\n```{language}\n{code}\n```\n\nIdentify the issue, explain the problem, and provide a corrected version of the code.",
            "intent": "code_debugging"
        }
        
        # Send request and wait for response
        try:
            response = await self._send_request(request)
            
            # Extract fixed code from response
            content = response.get("text", "")
            fixed_code = self._extract_code_block(content, language)
            
            return {
                "diagnosis": content,
                "fixed_code": fixed_code,
                "type": "success",
                "prompt_used": self.active_prompt
            }
        except Exception as e:
            print(f"Error debugging code: {e}")
            
            # Fallback response
            return {
                "diagnosis": f"I encountered an error while debugging: {str(e)}",
                "fixed_code": "",
                "type": "error"
            }
    
    def _extract_code_block(self, text: str, language: str) -> str:
        """Extract code block from response text"""
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
mcp_direct_bridge = MCPDirectBridge()

# Async function to start the bridge
async def start_mcp_direct_bridge():
    """Start the MCP Direct Bridge"""
    await mcp_direct_bridge.connect_to_mcp()
    
    # Keep the bridge running
    try:
        while True:
            await asyncio.sleep(60)
            
            # Reconnect if disconnected
            if not mcp_direct_bridge.mcp_connected:
                await mcp_direct_bridge.connect_to_mcp()
    except asyncio.CancelledError:
        # Gracefully disconnect on cancellation
        await mcp_direct_bridge.disconnect_from_mcp()

# Entry point for running as a script
if __name__ == "__main__":
    asyncio.run(start_mcp_direct_bridge())