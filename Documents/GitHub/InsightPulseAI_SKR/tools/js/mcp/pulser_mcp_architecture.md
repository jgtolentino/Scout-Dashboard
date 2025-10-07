# Pulser MCP Architecture

The Pulser Model Context Protocol (MCP) stack enables bidirectional communication between Claude and various creative environments like Blender, VS Code, terminal, and potentially other applications. This document outlines the architecture, components, and communication flow of the MCP system.

## Overview

The MCP architecture follows a client-server model with WebSocket-based communication for real-time bidirectional interactions. It allows Claude to:

1. Query the state of creative environments
2. Issue commands to manipulate those environments
3. Receive real-time updates about environment changes
4. Render visual scenes, edit code, and control applications

## Core Components

The MCP stack consists of these key components:

```
                  ┌─────────────────┐
                  │                 │
                  │    Claude CLI   │
                  │   or API Client │
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────┐
│                                                    │
│               MCP Orchestrator Server              │
│                                                    │
└──┬─────────────────┬────────────────┬──────────────┘
   │                 │                │
   ▼                 ▼                ▼
┌──────────┐   ┌──────────┐    ┌────────────┐
│          │   │          │    │            │
│  Blender │   │  VS Code │    │  Terminal  │
│  Bridge  │   │  Bridge  │    │  Bridge    │
│          │   │          │    │            │
└──────────┘   └──────────┘    └────────────┘
```

1. **MCP Orchestrator Server**
   - Core server that manages connections between Claude and environments
   - Implements WebSocket endpoints for client/environment connections
   - Handles authentication, session management, and environment routing
   - Exposes REST API for configuration and monitoring

2. **Environment Bridges**
   - Specific connectors for each creative environment
   - Translate generic MCP commands to environment-specific actions
   - Provide environment capabilities information
   - Capture state and render output for Claude

3. **Claude MCP Client**
   - Extends Claude with MCP capabilities
   - Communicates with MCP server via WebSockets
   - Includes client libraries for different programming languages

## Communication Protocol

The MCP protocol uses JSON messages over WebSockets with the following message types:

### Core Message Types

1. **Command**: Request to perform an action in an environment
   ```json
   {
     "type": "command",
     "id": "cmd-uuid",
     "command": "createObject",
     "params": {
       "type": "cube",
       "position": [0, 0, 0]
     }
   }
   ```

2. **Query**: Request to get information from an environment
   ```json
   {
     "type": "query",
     "id": "qry-uuid",
     "query": "getSceneObjects",
     "params": {
       "filter": "visible"
     }
   }
   ```

3. **Response**: Result of a command or query
   ```json
   {
     "type": "command_result",
     "id": "cmd-uuid",
     "status": "success",
     "result": {
       "objectId": "obj-123",
       "position": [0, 0, 0]
     }
   }
   ```

4. **Update**: Asynchronous event notification
   ```json
   {
     "type": "scene_update",
     "timestamp": 1715123456789,
     "scene": "main",
     "changes": [
       {"object": "obj-123", "property": "position", "value": [1, 0, 0]}
     ]
   }
   ```

### Connection Lifecycle

1. **Registration**: Environment connects and registers capabilities
   ```json
   {
     "type": "register",
     "environment": "blender",
     "version": "3.6.0",
     "capabilities": {
       "commands": ["createObject", "transform", "render"],
       "queries": ["getObjects", "getRender"]
     }
   }
   ```

2. **Session Creation**: Client creates a session with specific environments
   ```json
   {
     "type": "create_session",
     "client_id": "claude-cli",
     "environments": ["env-uuid-1", "env-uuid-2"]
   }
   ```

3. **Heartbeat**: Keep connections alive
   ```json
   {"type": "ping"}
   {"type": "pong"}
   ```

## Environment-Specific Capabilities

### Blender Bridge

- **Commands**:
  - `createObject`: Create a 3D object (cube, sphere, etc.)
  - `transform`: Move, rotate, scale objects
  - `setMaterial`: Apply materials and textures
  - `captureRender`: Render current scene and return image
  - `runScript`: Execute Python script in Blender context

- **Queries**:
  - `sceneInfo`: Get information about the current scene
  - `objectInfo`: Get details about a specific object
  - `materialInfo`: Get material properties
  - `getRender`: Get most recent rendered image

### VS Code Bridge

- **Commands**:
  - `openFile`: Open a file in the editor
  - `saveFile`: Save current file
  - `createFile`: Create a new file
  - `editFile`: Make changes to a file
  - `runTerminalCommand`: Execute command in integrated terminal

- **Queries**:
  - `getActiveFile`: Get current open file
  - `getFileContent`: Get the content of a file
  - `getOpenFiles`: List all open files
  - `getEditorState`: Get editor configuration details

## Session Management

Sessions in MCP provide a context for interaction between Claude and one or more environments. Key aspects:

1. **Session Creation**: Client creates a session and selects environments to include
2. **Environment Association**: Environments are added to the session
3. **Command Routing**: Commands are directed to specific environments in the session
4. **Result Aggregation**: Results and updates are collected and sent to the client
5. **Session Cleanup**: Environments are released when session ends or times out

## Security Considerations

The MCP architecture implements several security measures:

1. **Authentication**:
   - API token-based authentication for clients
   - Environment registration validation
   - Session-based authorization

2. **Permission Model**:
   - Granular permissions for command types
   - Environment-specific access controls
   - Read-only vs. read-write permissions

3. **Sandboxing**:
   - Environment bridges run with limited privileges
   - Execution limits on resource-intensive operations
   - Timeouts for long-running operations

4. **Data Protection**:
   - No persistent storage of generated content by default
   - Local network communication only by default
   - Optional SSL/TLS encryption for remote connections

## Deployment Options

The MCP stack supports several deployment configurations:

1. **Local Development**:
   - All components run on a single machine
   - Ideal for development and single-user scenarios

2. **Split Process**:
   - MCP server and environment bridges run as separate processes
   - Allows for distributing components across a workstation

3. **Network Distributed**:
   - Components communicate over a network
   - Allows for specialized hardware (e.g., GPU rendering node)
   - Requires SSL/TLS and proper authentication

## Extension Mechanism

The MCP architecture supports extension through:

1. **New Environment Bridges**:
   - Implement the MCP WebSocket protocol
   - Register supported commands and queries
   - Handle environment-specific operations

2. **Custom Commands**:
   - Define new command types
   - Register with the MCP server
   - Implement handlers in bridges

3. **Pipeline Hooks**:
   - Pre-command processing
   - Result transformation
   - Custom authentication or authorization

## Usage Patterns

Common usage patterns for the MCP stack:

1. **Iterative Creation**:
   - Claude guides creation process
   - User provides feedback
   - Claude adjusts based on feedback
   - Bridge provides real-time visualization

2. **Code Generation and Refinement**:
   - Claude generates initial code
   - VS Code bridge executes and tests
   - Claude refines based on results
   - Final code is saved to project

3. **Multi-environment Workflows**:
   - Claude coordinates across environments
   - E.g., generating code that controls Blender
   - Results flow between environments

## Implementation Status

Current implementation status:

- **Core Server**: Complete basic functionality
- **Blender Bridge**: Initial implementation complete
- **VS Code Bridge**: Basic functionality implemented
- **Terminal Bridge**: Planned
- **Client Libraries**: Python and Node.js versions in progress

## Next Steps

Planned enhancements:

1. Improve error handling and recovery
2. Add support for more environments (Figma, UE5, Unity)
3. Implement robust authentication system
4. Create richer client libraries
5. Develop visual monitoring and debugging tools

## Reference Implementation

A reference implementation of the MCP stack is available in the Pulser repository:

- `mcp/pulser_mcp_server.py`: Core MCP orchestrator server
- `mcp/blender_mcp_bridge.py`: Blender environment bridge
- `mcp/vscode_mcp_bridge.js`: VS Code environment bridge
- `mcp/pulser_mcp_architecture.md`: This architecture document