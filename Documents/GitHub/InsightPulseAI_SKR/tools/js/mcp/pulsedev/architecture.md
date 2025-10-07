# PulseDev Architecture

## System Overview

PulseDev is a cloud IDE and code execution platform built on the Model Context Protocol (MCP) architecture. It provides an integrated development environment with real-time code execution, AI assistance, and collaborative features.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Frontend           │     │  API Gateway        │     │  MCP Orchestrator   │
│  (React/Monaco)     │◄───►│  (FastAPI)          │◄───►│  (pulser_mcp_server)│
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────┬───────────┘
                                                                   │
                                                                   ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Storage Service    │◄───►│  Code Execution     │◄───►│  Agent Router       │
│  (Workspace Files)  │     │  (Docker/VM)        │     │  (agent_router.py)  │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Components

### 1. Frontend (React/Vite)
- Monaco Editor for code editing (VS Code's editor)
- xterm.js for terminal emulation
- React components for UI
- WebSocket client for real-time updates
- File explorer
- Preview pane for web apps

### 2. API Gateway (FastAPI)
- RESTful endpoints for workspace management
- WebSocket server for real-time communication
- Authentication and session management
- Proxy to MCP server for agent interactions

### 3. MCP Orchestrator
- Central hub for agent communication
- Routes requests to appropriate execution environments
- Manages agent lifecycle and state
- Handles command/query protocol

### 4. Code Execution Service
- Docker-based sandbox environments
- Language runtime support (Node.js, Python, etc.)
- Package management (npm, pip)
- Security isolation
- Resource limits and monitoring

### 5. Storage Service
- Workspace file management
- Project structure and templates
- Version control integration
- File system operations (CRUD)

### 6. Agent Router
- Intent-based routing of tasks
- Agent selection based on capabilities
- Fallback mechanisms
- Context preservation

## Agent Stack

| Agent       | Role                                              |
|-------------|---------------------------------------------------|
| **Tide**    | Language detection and runtime execution          |
| **Claudia** | Workspace orchestration and session management    |
| **Surf**    | Container management and code execution           |
| **Maya**    | Project structure and templates                   |
| **Echo**    | Terminal output and logging                       |
| **Edge**    | AI code assistance and suggestions                |
| **Basher**  | Terminal command execution                        |

## Communication Protocol

The MCP protocol uses a WebSocket-based communication model with command/query patterns:

```json
{
  "type": "command",
  "id": "uuid-here",
  "command": "execute_code",
  "params": {
    "language": "python",
    "code": "print('Hello, PulseDev!')",
    "workspaceId": "workspace-123"
  }
}
```

Response:
```json
{
  "type": "result",
  "id": "uuid-here",
  "status": "success",
  "result": {
    "stdout": "Hello, PulseDev!\n",
    "stderr": "",
    "exitCode": 0
  }
}
```

## Security Model

1. **Execution Isolation**
   - Docker containers with resource limits
   - Network restrictions
   - Filesystem isolation

2. **Permission System**
   - Operation-level permissions
   - Environment-specific controls
   - User-based access control

3. **Input Validation**
   - Command sanitization
   - Parameter validation
   - Rate limiting

## Data Flow

1. User writes code in Monaco Editor
2. Frontend sends code to API Gateway
3. API Gateway forwards to MCP Orchestrator
4. MCP routes to appropriate Code Execution Service
5. Code is executed in isolated container
6. Results are returned through the same path
7. Real-time updates via WebSockets

## Implementation Plan

### Phase 1: MVP
- Basic editor with file explorer
- Docker-based code execution for Python and Node.js
- Simple terminal integration
- File operations

### Phase 2: AI Integration
- Claude integration for code assistance
- Auto-completion suggestions
- Error explanations

### Phase 3: Collaboration
- Real-time collaborative editing
- Shared terminals
- User presence

### Phase 4: Deployment
- Project deployment capabilities
- Custom domain support
- Continuous integration