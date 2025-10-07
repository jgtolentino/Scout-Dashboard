#!/usr/bin/env python3
"""
DeepSeek API Compatibility Wrapper for Pulser/Codex CLI
Translates between DeepSeek's response format and OpenAI/Claude formats
"""

import json
import re
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional, AsyncGenerator
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FunctionCall:
    """Represents a function call extracted from DeepSeek output"""
    name: str
    arguments: Dict[str, Any]
    
    
class DeepSeekAPIWrapper:
    """Wraps DeepSeek API to provide OpenAI-compatible interface"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "deepseek-coder:6.7b-instruct-q4_K_M"):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    def _extract_function_calls(self, content: str) -> List[FunctionCall]:
        """Extract function calls from DeepSeek's response"""
        function_calls = []
        
        # Pattern 1: JSON-like function calls
        json_pattern = r'```json\s*{[^}]*"function":\s*"([^"]+)"[^}]*"arguments":\s*({[^}]+})[^}]*}\s*```'
        
        # Pattern 2: Python-style function calls
        python_pattern = r'(\w+)\((.*?)\)'
        
        # Try JSON pattern first
        for match in re.finditer(json_pattern, content, re.DOTALL):
            try:
                func_name = match.group(1)
                args_str = match.group(2)
                arguments = json.loads(args_str)
                function_calls.append(FunctionCall(name=func_name, arguments=arguments))
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse function arguments: {args_str}")
                
        # If no JSON calls found, try Python pattern
        if not function_calls and "def " not in content:  # Avoid matching function definitions
            for match in re.finditer(python_pattern, content):
                func_name = match.group(1)
                args_str = match.group(2)
                
                # Skip common false positives
                if func_name in ['print', 'return', 'if', 'for', 'while', 'import']:
                    continue
                    
                # Try to parse arguments
                arguments = self._parse_python_args(args_str)
                if arguments:
                    function_calls.append(FunctionCall(name=func_name, arguments=arguments))
                    
        return function_calls
        
    def _parse_python_args(self, args_str: str) -> Optional[Dict[str, Any]]:
        """Parse Python-style function arguments"""
        if not args_str.strip():
            return {}
            
        try:
            # Handle simple cases
            if '=' in args_str:
                # Named arguments
                args_dict = {}
                for arg in args_str.split(','):
                    if '=' in arg:
                        key, value = arg.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')
                        args_dict[key] = value
                return args_dict
            else:
                # Positional arguments - convert to dict
                values = [v.strip().strip('"\'') for v in args_str.split(',')]
                return {"args": values}
        except:
            return None
            
    async def chat_completion(self, messages: List[Dict[str, str]], 
                            functions: Optional[List[Dict]] = None,
                            **kwargs) -> Dict[str, Any]:
        """OpenAI-compatible chat completion endpoint"""
        
        # Build DeepSeek prompt
        prompt = self._build_prompt(messages, functions)
        
        # Make request to Ollama
        async with self.session.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.2),
                    "top_p": kwargs.get("top_p", 0.95),
                    "num_predict": kwargs.get("max_tokens", 4096),
                }
            }
        ) as response:
            result = await response.json()
            
        # Extract content and function calls
        content = result.get("response", "")
        function_calls = self._extract_function_calls(content) if functions else []
        
        # Format response in OpenAI style
        openai_response = {
            "id": f"deepseek-{result.get('created_at', 'unknown')}",
            "object": "chat.completion",
            "created": int(result.get("created_at", 0)),
            "model": self.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": result.get("prompt_eval_count", 0),
                "completion_tokens": result.get("eval_count", 0),
                "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
            }
        }
        
        # Add function calls if any
        if function_calls:
            openai_response["choices"][0]["message"]["function_call"] = {
                "name": function_calls[0].name,
                "arguments": json.dumps(function_calls[0].arguments)
            }
            
        return openai_response
        
    async def chat_completion_stream(self, messages: List[Dict[str, str]], 
                                   functions: Optional[List[Dict]] = None,
                                   **kwargs) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming chat completion endpoint"""
        
        prompt = self._build_prompt(messages, functions)
        
        async with self.session.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": kwargs.get("temperature", 0.2),
                    "top_p": kwargs.get("top_p", 0.95),
                    "num_predict": kwargs.get("max_tokens", 4096),
                }
            }
        ) as response:
            async for line in response.content:
                if line:
                    try:
                        chunk = json.loads(line)
                        if "response" in chunk:
                            yield {
                                "choices": [{
                                    "delta": {
                                        "content": chunk["response"]
                                    },
                                    "finish_reason": None
                                }]
                            }
                    except json.JSONDecodeError:
                        continue
                        
    def _build_prompt(self, messages: List[Dict[str, str]], 
                     functions: Optional[List[Dict]] = None) -> str:
        """Build DeepSeek prompt from OpenAI messages"""
        
        prompt_parts = []
        
        # Add function definitions if provided
        if functions:
            prompt_parts.append("You have access to the following functions:\n")
            for func in functions:
                prompt_parts.append(f"\nFunction: {func['name']}")
                prompt_parts.append(f"Description: {func.get('description', 'No description')}")
                if 'parameters' in func:
                    prompt_parts.append(f"Parameters: {json.dumps(func['parameters'], indent=2)}")
            prompt_parts.append("\nTo use a function, respond with a JSON block like:")
            prompt_parts.append('```json\n{"function": "function_name", "arguments": {...}}\n```\n')
            
        # Add messages
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            if role == "system":
                prompt_parts.append(f"System: {content}\n")
            elif role == "user":
                prompt_parts.append(f"Human: {content}\n")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}\n")
                
        prompt_parts.append("Assistant: ")
        
        return "".join(prompt_parts)


# FastAPI server implementation (optional)
if __name__ == "__main__":
    from fastapi import FastAPI, Request
    from fastapi.responses import StreamingResponse
    import uvicorn
    
    app = FastAPI(title="DeepSeek OpenAI Compatibility Layer")
    
    @app.post("/v1/chat/completions")
    async def chat_completions(request: Request):
        """OpenAI-compatible chat completions endpoint"""
        data = await request.json()
        
        async with DeepSeekAPIWrapper() as wrapper:
            if data.get("stream", False):
                async def generate():
                    async for chunk in wrapper.chat_completion_stream(
                        messages=data["messages"],
                        functions=data.get("functions"),
                        **data
                    ):
                        yield f"data: {json.dumps(chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                    
                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                result = await wrapper.chat_completion(
                    messages=data["messages"],
                    functions=data.get("functions"),
                    **data
                )
                return result
                
    @app.get("/v1/models")
    async def list_models():
        """List available models"""
        return {
            "object": "list",
            "data": [
                {
                    "id": "deepseek-coder:33b-instruct-q4_K_M",
                    "object": "model",
                    "owned_by": "deepseek",
                    "permission": []
                },
                {
                    "id": "deepseek-coder:6.7b-instruct-q4_K_M",
                    "object": "model",
                    "owned_by": "deepseek",
                    "permission": []
                }
            ]
        }
        
    # Run server
    uvicorn.run(app, host="0.0.0.0", port=8080)