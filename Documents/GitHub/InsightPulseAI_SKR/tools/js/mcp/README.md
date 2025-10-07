# Pulser Model Context Protocol (MCP)

The Model Context Protocol enables bidirectional communication between Claude and various creative environments like VS Code and Blender.

## Quick Start

1. Launch the MCP system:
   ```bash
   ./launch_mcp.sh
   ```

2. This will:
   - Start the MCP server on localhost:9090
   - Launch available environment bridges (Blender, etc.)
   - Set up the routing system using agent_routing.yaml

3. Connect Claude or another agent to the MCP system using the Pulser CLI:
   ```bash
   pulser -r claude --mcp
   ```

## Components

- **pulser_mcp_server.py**: Core server orchestrating communication
- **agent_router.py**: Analyzes tasks and routes to appropriate environments
- **agent_routing.yaml**: Configuration for routing rules and agent capabilities
- **environment bridges**:
  - **blender_mcp_bridge.py**: Connects to Blender for 3D tasks
  - **vscode_mcp_bridge.js**: Connects to VS Code for code editing
  - Terminal and database bridges available as needed

## Usage Examples

- **3D modeling**: "Create a 3D model of a conference room with a table and chairs"
- **Code editing**: "Fix the bug in the device health monitoring code"
- **Data analysis**: "Find all devices with firmware versions below 2.0"

For more detailed examples and usage instructions, see [MCP_ROUTING_GUIDE.md](./MCP_ROUTING_GUIDE.md).

## Architecture

The MCP system follows a hub-and-spoke architecture:
- The MCP server acts as the central hub
- Environment bridges connect as spokes
- The agent router determines which spoke should handle each task
- All communication happens over WebSockets with a JSON-based protocol

For detailed architectural information, see [pulser_mcp_architecture.md](./pulser_mcp_architecture.md).

## Security

The MCP system includes a comprehensive security model:
- Environment sandboxing
- Operation permissions
- Execution timeouts
- File access restrictions

See the security section in agent_routing.yaml for configuration details.

## Configuration

Customize the system by editing agent_routing.yaml:
- Add new routes for specific task types
- Update intent recognition patterns
- Modify agent capabilities
- Adjust security settings

## Requirements

- Python 3.8+
- Node.js 14+ (for VS Code extension)
- Blender 2.8+ (for 3D modeling functions)
- Required Python packages: websockets, pyyaml, asyncio