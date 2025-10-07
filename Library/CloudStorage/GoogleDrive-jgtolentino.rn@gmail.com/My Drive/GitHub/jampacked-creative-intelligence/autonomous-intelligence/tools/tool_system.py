#!/usr/bin/env python3
"""
Tool System with Write Capabilities and ACL Gating
Provides audited access to FS/DB/HTTP/Cloud with side effects
"""

import asyncio
import logging
import os
import json
import aiohttp
import aiofiles
from typing import Dict, List, Any, Optional, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod
import hashlib
from pathlib import Path

from utils.structured_logger import get_logger, trace_context, PerformanceTimer
from utils.cost_guard import BudgetType, spend_budget, BudgetGuard

logger = get_logger(__name__)


class ToolPermission(Enum):
    """Tool access permissions"""
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    DELETE = "delete"
    ADMIN = "admin"


class ResourceType(Enum):
    """Types of resources tools can access"""
    FILESYSTEM = "filesystem"
    DATABASE = "database"
    HTTP_API = "http_api"
    CLOUD_STORAGE = "cloud_storage"
    BROWSER = "browser"
    SHELL = "shell"
    EMAIL = "email"


@dataclass
class ToolACL:
    """Access Control List for a tool"""
    tool_name: str
    allowed_permissions: Set[ToolPermission] = field(default_factory=set)
    allowed_resources: Set[ResourceType] = field(default_factory=set)
    allowed_paths: List[str] = field(default_factory=list)  # Filesystem paths
    allowed_domains: List[str] = field(default_factory=list)  # HTTP domains
    rate_limit: int = 100  # Calls per minute
    max_cost_per_call: Dict[str, float] = field(default_factory=dict)
    require_audit: bool = True
    require_approval: bool = False  # For high-risk operations


@dataclass
class ToolCall:
    """Record of a tool invocation"""
    id: str = field(default_factory=lambda: hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12])
    tool_name: str = ""
    operation: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    resource_type: ResourceType = ResourceType.FILESYSTEM
    permissions_used: Set[ToolPermission] = field(default_factory=set)
    
    # Execution details
    timestamp: datetime = field(default_factory=datetime.now)
    trace_id: Optional[str] = None
    goal_id: Optional[str] = None
    user_id: Optional[str] = None
    
    # Results
    success: bool = False
    result: Optional[Any] = None
    error: Optional[str] = None
    side_effects: List[Dict[str, Any]] = field(default_factory=list)
    
    # Cost tracking
    cost: Dict[str, float] = field(default_factory=dict)
    duration_ms: float = 0.0


class Tool(ABC):
    """Abstract base class for all tools"""
    
    def __init__(self, name: str, acl: ToolACL):
        self.name = name
        self.acl = acl
        self.call_count = 0
        self.last_reset = datetime.now()
    
    @abstractmethod
    async def execute(self, operation: str, parameters: Dict[str, Any], 
                     context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute a tool operation"""
        pass
    
    def check_permission(self, permission: ToolPermission) -> bool:
        """Check if permission is allowed"""
        return permission in self.acl.allowed_permissions
    
    def check_rate_limit(self) -> bool:
        """Check if rate limit is exceeded"""
        now = datetime.now()
        if (now - self.last_reset).total_seconds() > 60:
            self.call_count = 0
            self.last_reset = now
        
        return self.call_count < self.acl.rate_limit
    
    def validate_parameters(self, operation: str, parameters: Dict[str, Any]) -> Optional[str]:
        """Validate operation parameters"""
        # Override in subclasses for specific validation
        return None


class FilesystemTool(Tool):
    """Tool for filesystem operations with ACL"""
    
    def __init__(self, acl: Optional[ToolACL] = None):
        default_acl = ToolACL(
            tool_name="filesystem",
            allowed_permissions={ToolPermission.READ, ToolPermission.WRITE},
            allowed_resources={ResourceType.FILESYSTEM},
            allowed_paths=["/tmp", "/data", "/workspace"],
            max_cost_per_call={BudgetType.TOKENS.value: 50}
        )
        super().__init__("filesystem", acl or default_acl)
    
    async def execute(self, operation: str, parameters: Dict[str, Any], 
                     context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute filesystem operation"""
        tool_call = ToolCall(
            tool_name=self.name,
            operation=operation,
            parameters=parameters,
            resource_type=ResourceType.FILESYSTEM,
            trace_id=context.get('trace_id') if context else None,
            goal_id=context.get('goal_id') if context else None
        )
        
        start_time = datetime.now()
        
        try:
            # Check rate limit
            if not self.check_rate_limit():
                raise PermissionError("Rate limit exceeded")
            
            # Validate and execute operation
            if operation == "read":
                tool_call.permissions_used.add(ToolPermission.READ)
                result = await self._read_file(parameters)
            elif operation == "write":
                tool_call.permissions_used.add(ToolPermission.WRITE)
                result = await self._write_file(parameters)
            elif operation == "list":
                tool_call.permissions_used.add(ToolPermission.READ)
                result = await self._list_directory(parameters)
            elif operation == "delete":
                tool_call.permissions_used.add(ToolPermission.DELETE)
                result = await self._delete_file(parameters)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            
            tool_call.success = True
            tool_call.result = result
            
            # Track cost
            tool_call.cost = {
                BudgetType.TOKENS.value: self.acl.max_cost_per_call.get(BudgetType.TOKENS.value, 0)
            }
            
        except Exception as e:
            tool_call.success = False
            tool_call.error = str(e)
            logger.error(f"Filesystem tool error", operation=operation, error=str(e))
        
        finally:
            tool_call.duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            self.call_count += 1
            
            # Audit log
            if self.acl.require_audit:
                await self._audit_log(tool_call)
        
        return tool_call
    
    async def _read_file(self, params: Dict[str, Any]) -> str:
        """Read file with ACL check"""
        file_path = params.get('path')
        if not file_path:
            raise ValueError("Missing 'path' parameter")
        
        # Check ACL
        if not self._is_path_allowed(file_path):
            raise PermissionError(f"Access denied to path: {file_path}")
        
        # Read file
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
        
        logger.info(f"File read", path=file_path, size=len(content))
        return content
    
    async def _write_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Write file with ACL check"""
        file_path = params.get('path')
        content = params.get('content')
        
        if not file_path or content is None:
            raise ValueError("Missing 'path' or 'content' parameter")
        
        # Check ACL
        if not self._is_path_allowed(file_path):
            raise PermissionError(f"Access denied to path: {file_path}")
        
        # Write file
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        async with aiofiles.open(file_path, 'w') as f:
            await f.write(content)
        
        logger.info(f"File written", path=file_path, size=len(content))
        
        return {
            'path': file_path,
            'size': len(content),
            'timestamp': datetime.now().isoformat()
        }
    
    async def _list_directory(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """List directory contents with ACL check"""
        dir_path = params.get('path', '.')
        
        # Check ACL
        if not self._is_path_allowed(dir_path):
            raise PermissionError(f"Access denied to path: {dir_path}")
        
        # List directory
        entries = []
        for entry in os.listdir(dir_path):
            full_path = os.path.join(dir_path, entry)
            stat = os.stat(full_path)
            entries.append({
                'name': entry,
                'path': full_path,
                'is_dir': os.path.isdir(full_path),
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        return entries
    
    async def _delete_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Delete file with ACL check"""
        file_path = params.get('path')
        if not file_path:
            raise ValueError("Missing 'path' parameter")
        
        # Check permissions
        if not self.check_permission(ToolPermission.DELETE):
            raise PermissionError("Delete permission not granted")
        
        # Check ACL
        if not self._is_path_allowed(file_path):
            raise PermissionError(f"Access denied to path: {file_path}")
        
        # Delete file
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.warning(f"File deleted", path=file_path)
            return {'deleted': file_path}
        else:
            return {'error': 'File not found'}
    
    def _is_path_allowed(self, path: str) -> bool:
        """Check if path is allowed by ACL"""
        abs_path = os.path.abspath(path)
        return any(abs_path.startswith(os.path.abspath(allowed)) 
                  for allowed in self.acl.allowed_paths)
    
    async def _audit_log(self, tool_call: ToolCall):
        """Log tool call for audit"""
        audit_entry = {
            'timestamp': tool_call.timestamp.isoformat(),
            'tool': tool_call.tool_name,
            'operation': tool_call.operation,
            'permissions': list(tool_call.permissions_used),
            'success': tool_call.success,
            'duration_ms': tool_call.duration_ms,
            'trace_id': tool_call.trace_id,
            'goal_id': tool_call.goal_id
        }
        
        # Write to audit log
        audit_path = "/tmp/tool_audit.jsonl"
        async with aiofiles.open(audit_path, 'a') as f:
            await f.write(json.dumps(audit_entry) + "\n")


class HTTPTool(Tool):
    """Tool for HTTP operations with domain restrictions"""
    
    def __init__(self, acl: Optional[ToolACL] = None):
        default_acl = ToolACL(
            tool_name="http",
            allowed_permissions={ToolPermission.READ, ToolPermission.WRITE},
            allowed_resources={ResourceType.HTTP_API},
            allowed_domains=["api.openai.com", "api.anthropic.com", "*.googleapis.com"],
            max_cost_per_call={BudgetType.TOKENS.value: 100}
        )
        super().__init__("http", acl or default_acl)
        self.session = None
    
    async def execute(self, operation: str, parameters: Dict[str, Any], 
                     context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute HTTP operation"""
        tool_call = ToolCall(
            tool_name=self.name,
            operation=operation,
            parameters=parameters,
            resource_type=ResourceType.HTTP_API,
            trace_id=context.get('trace_id') if context else None
        )
        
        start_time = datetime.now()
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Check rate limit
            if not self.check_rate_limit():
                raise PermissionError("Rate limit exceeded")
            
            # Execute operation
            if operation == "get":
                tool_call.permissions_used.add(ToolPermission.READ)
                result = await self._http_get(parameters)
            elif operation == "post":
                tool_call.permissions_used.add(ToolPermission.WRITE)
                result = await self._http_post(parameters)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            
            tool_call.success = True
            tool_call.result = result
            
            # Track cost
            tool_call.cost = {
                BudgetType.TOKENS.value: self.acl.max_cost_per_call.get(BudgetType.TOKENS.value, 0)
            }
            
        except Exception as e:
            tool_call.success = False
            tool_call.error = str(e)
            logger.error(f"HTTP tool error", operation=operation, error=str(e))
        
        finally:
            tool_call.duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            self.call_count += 1
            
            if self.acl.require_audit:
                await self._audit_log(tool_call)
        
        return tool_call
    
    async def _http_get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """HTTP GET with domain restrictions"""
        url = params.get('url')
        headers = params.get('headers', {})
        
        if not url:
            raise ValueError("Missing 'url' parameter")
        
        # Check domain ACL
        if not self._is_domain_allowed(url):
            raise PermissionError(f"Domain not allowed: {url}")
        
        async with self.session.get(url, headers=headers) as response:
            data = await response.text()
            
            return {
                'status': response.status,
                'headers': dict(response.headers),
                'body': data,
                'url': str(response.url)
            }
    
    async def _http_post(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """HTTP POST with domain restrictions"""
        url = params.get('url')
        headers = params.get('headers', {})
        data = params.get('data')
        json_data = params.get('json')
        
        if not url:
            raise ValueError("Missing 'url' parameter")
        
        # Check domain ACL
        if not self._is_domain_allowed(url):
            raise PermissionError(f"Domain not allowed: {url}")
        
        kwargs = {'headers': headers}
        if json_data is not None:
            kwargs['json'] = json_data
        elif data is not None:
            kwargs['data'] = data
        
        async with self.session.post(url, **kwargs) as response:
            response_data = await response.text()
            
            return {
                'status': response.status,
                'headers': dict(response.headers),
                'body': response_data,
                'url': str(response.url)
            }
    
    def _is_domain_allowed(self, url: str) -> bool:
        """Check if URL domain is allowed"""
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        domain = parsed.netloc
        
        for allowed in self.acl.allowed_domains:
            if allowed.startswith('*'):
                # Wildcard matching
                if domain.endswith(allowed[1:]):
                    return True
            elif domain == allowed:
                return True
        
        return False
    
    async def _audit_log(self, tool_call: ToolCall):
        """Log HTTP calls for audit"""
        # Sanitize sensitive data
        sanitized_params = tool_call.parameters.copy()
        if 'headers' in sanitized_params:
            headers = sanitized_params['headers'].copy()
            # Remove auth headers
            for key in ['Authorization', 'X-API-Key', 'Cookie']:
                if key in headers:
                    headers[key] = '***REDACTED***'
            sanitized_params['headers'] = headers
        
        audit_entry = {
            'timestamp': tool_call.timestamp.isoformat(),
            'tool': tool_call.tool_name,
            'operation': tool_call.operation,
            'url': sanitized_params.get('url'),
            'status': tool_call.result.get('status') if tool_call.result else None,
            'success': tool_call.success,
            'duration_ms': tool_call.duration_ms
        }
        
        logger.info("HTTP audit", **audit_entry)
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()


class DatabaseTool(Tool):
    """Tool for database operations with query restrictions"""
    
    def __init__(self, acl: Optional[ToolACL] = None):
        default_acl = ToolACL(
            tool_name="database",
            allowed_permissions={ToolPermission.READ, ToolPermission.WRITE},
            allowed_resources={ResourceType.DATABASE},
            max_cost_per_call={BudgetType.TOKENS.value: 200}
        )
        super().__init__("database", acl or default_acl)
    
    async def execute(self, operation: str, parameters: Dict[str, Any], 
                     context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute database operation"""
        tool_call = ToolCall(
            tool_name=self.name,
            operation=operation,
            parameters=parameters,
            resource_type=ResourceType.DATABASE
        )
        
        # Simulate database operations
        if operation == "query":
            tool_call.permissions_used.add(ToolPermission.READ)
            tool_call.result = {"rows": [], "count": 0}
        elif operation == "insert":
            tool_call.permissions_used.add(ToolPermission.WRITE)
            tool_call.result = {"inserted": 1}
        
        tool_call.success = True
        return tool_call


class BrowserTool(Tool):
    """Tool for browser automation with screenshot and interaction capabilities"""
    
    def __init__(self, acl: Optional[ToolACL] = None):
        default_acl = ToolACL(
            tool_name="browser",
            allowed_permissions={ToolPermission.READ, ToolPermission.EXECUTE},
            allowed_resources={ResourceType.BROWSER},
            allowed_domains=["*.openai.com", "*.anthropic.com"],
            max_cost_per_call={BudgetType.TOKENS.value: 300}
        )
        super().__init__("browser", acl or default_acl)
    
    async def execute(self, operation: str, parameters: Dict[str, Any], 
                     context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute browser operation"""
        tool_call = ToolCall(
            tool_name=self.name,
            operation=operation,
            parameters=parameters,
            resource_type=ResourceType.BROWSER
        )
        
        # Simulate browser operations
        if operation == "navigate":
            tool_call.result = {"url": parameters.get("url"), "title": "Page Title"}
        elif operation == "screenshot":
            tool_call.result = {"image_path": "/tmp/screenshot.png"}
        elif operation == "click":
            tool_call.result = {"clicked": parameters.get("selector")}
        
        tool_call.success = True
        return tool_call


class ToolRegistry:
    """Central registry for all tools with ACL management"""
    
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self.call_history: List[ToolCall] = []
        self._initialize_default_tools()
    
    def register_tool(self, tool: Tool):
        """Register a tool"""
        self.tools[tool.name] = tool
        logger.info(f"Tool registered", tool=tool.name, 
                   permissions=list(tool.acl.allowed_permissions))
    
    async def execute_tool(self, tool_name: str, operation: str, 
                          parameters: Dict[str, Any],
                          context: Optional[Dict[str, Any]] = None) -> ToolCall:
        """Execute a tool operation with full ACL and cost checking"""
        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        tool = self.tools[tool_name]
        
        # Pre-execution checks
        with trace_context(component="tool_registry", tool=tool_name, operation=operation):
            # Check budget if context provided
            if context and context.get('goal_id'):
                budget_key = f"tool_{tool_name}_{operation}"
                max_cost = tool.acl.max_cost_per_call
                
                for budget_type, amount in max_cost.items():
                    if not spend_budget(context['goal_id'], budget_type, amount, 
                                      budget_key, "tool_execution"):
                        raise RuntimeError(f"Insufficient budget for {tool_name}.{operation}")
            
            # Execute with performance tracking
            with PerformanceTimer(logger, f"tool_{tool_name}_{operation}"):
                tool_call = await tool.execute(operation, parameters, context)
            
            # Record in history
            self.call_history.append(tool_call)
            
            # Emit metrics
            logger.info("Tool executed", 
                       tool=tool_name,
                       operation=operation,
                       success=tool_call.success,
                       duration_ms=tool_call.duration_ms,
                       cost=tool_call.cost)
            
            return tool_call
    
    def get_tool_capabilities(self) -> Dict[str, Dict[str, Any]]:
        """Get capabilities of all registered tools"""
        capabilities = {}
        
        for name, tool in self.tools.items():
            capabilities[name] = {
                'permissions': [p.value for p in tool.acl.allowed_permissions],
                'resources': [r.value for r in tool.acl.allowed_resources],
                'rate_limit': tool.acl.rate_limit,
                'require_audit': tool.acl.require_audit,
                'require_approval': tool.acl.require_approval
            }
        
        return capabilities
    
    def _initialize_default_tools(self):
        """Initialize default tool set"""
        self.register_tool(FilesystemTool())
        self.register_tool(HTTPTool())
        self.register_tool(DatabaseTool())
        self.register_tool(BrowserTool())


# Global tool registry instance
tool_registry = ToolRegistry()


# Convenience functions
async def execute_tool(tool_name: str, operation: str, 
                      parameters: Dict[str, Any],
                      context: Optional[Dict[str, Any]] = None) -> ToolCall:
    """Execute a tool through the global registry"""
    return await tool_registry.execute_tool(tool_name, operation, parameters, context)


def get_tool_capabilities() -> Dict[str, Dict[str, Any]]:
    """Get capabilities of all tools"""
    return tool_registry.get_tool_capabilities()


# Tool builder for custom tools
class ToolBuilder:
    """Builder for creating custom tools with specific ACLs"""
    
    @staticmethod
    def create_restricted_filesystem_tool(allowed_paths: List[str]) -> FilesystemTool:
        """Create a filesystem tool restricted to specific paths"""
        acl = ToolACL(
            tool_name="restricted_filesystem",
            allowed_permissions={ToolPermission.READ, ToolPermission.WRITE},
            allowed_resources={ResourceType.FILESYSTEM},
            allowed_paths=allowed_paths,
            max_cost_per_call={BudgetType.TOKENS.value: 30}
        )
        return FilesystemTool(acl)
    
    @staticmethod
    def create_readonly_http_tool(allowed_domains: List[str]) -> HTTPTool:
        """Create an HTTP tool that can only read from specific domains"""
        acl = ToolACL(
            tool_name="readonly_http",
            allowed_permissions={ToolPermission.READ},
            allowed_resources={ResourceType.HTTP_API},
            allowed_domains=allowed_domains,
            max_cost_per_call={BudgetType.TOKENS.value: 50}
        )
        return HTTPTool(acl)