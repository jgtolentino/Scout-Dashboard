# Claude Integration in PulseDev

This document explains the integration between Anthropic Claude and PulseDev through the Model Context Protocol (MCP) architecture.

## Overview

PulseDev integrates Claude's AI capabilities to provide sophisticated code assistance, generation, explanation, and debugging features directly within the IDE. The integration is built on a direct bridge to the MCP server, similar to how Blender integration works.

## Architecture

The integration follows this architecture:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  PulseDev Frontend  │◄───►│  PulseDev Backend   │◄───►│   MCP Direct Bridge │
│  (React/Monaco)     │     │  (FastAPI)          │     │                     │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └──────────┬──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────┐                               ┌─────────────────────┐
│                     │                               │                     │
│  MCP Prompts        │◄──────────────────────────────│  MCP Server         │
│  Collection         │                               │  (WebSocket)        │
│                     │                               │                     │
└─────────────────────┘                               └─────────────────────┘
```

### Components

1. **MCP Direct Bridge** (`mcp_direct_bridge.py`)
   - Connects to the MCP server via WebSockets
   - Translates requests to MCP protocol format
   - Formats responses for the AI assistant service
   - No API key required, uses existing MCP infrastructure
   - Loads and manages system prompts from MCP prompts collection

2. **AI Assistant Service** (`ai_assistant.py`)
   - Provides high-level AI assistance functions
   - Abstracts the MCP communication
   - Handles context creation and query formatting
   - Manages specialized behavior through different system prompts

3. **AI Assistant Routes** (`ai_assistant.py` in routes)
   - Exposes RESTful API endpoints
   - Validates requests and processes responses
   - Adds file context from workspace
   - Provides prompt management endpoints

4. **MCP Prompts Collection** (`mcp_prompts/`)
   - Contains specialized system prompts from various AI tools
   - Organized by source platform (Cursor, Replit, VSCode, etc.)
   - Each prompt tunes Claude to emulate specific tool behaviors
   - Includes a unified prompt combining capabilities from all tools

## Setup

To enable Claude integration in PulseDev:

1. **Ensure MCP Server is Running**
   - The MCP server should be running at the default address (`localhost:8765`)
   - PulseDev will automatically connect to it during startup

2. **Start PulseDev**
   - Run `./launch.sh` which will automatically connect to the MCP server
   - All AI features will work through the existing MCP infrastructure

## Using Claude in PulseDev

The Claude integration provides several AI assistance features:

### 1. Code Assistance

Ask questions about your code and get helpful responses. Examples:

- "How do I fix this React useEffect dependency warning?"
- "What's the best way to implement authentication in Express?"
- "Can you explain how promises work in JavaScript?"

### 2. Code Generation

Generate code based on natural language descriptions. Examples:

- "Create a React component for a login form with validation"
- "Write a Python function to parse CSV files"
- "Generate a RESTful API endpoint for user registration"

### 3. Code Explanation

Get detailed explanations of existing code:

- Select code in the editor and click "Explain" in the context menu
- Ask about specific functions or code blocks
- Get step-by-step explanations of complex algorithms

### 4. Debugging Assistance

Get help with debugging issues:

- Paste error messages to get explanations and fixes
- Analyze runtime errors and exceptions
- Fix syntax and logic issues in your code

## Specialized Assistance with MCP Prompts

PulseDev includes a collection of specialized system prompts that tune Claude to emulate the behavior of various AI tools:

### Available Specialized Modes

| Mode | Prompt | Capabilities |
|------|--------|--------------|
| Code | `cursor/chat_prompt` | General code writing, debugging, refactoring |
| Command | `replit/command_runner` | Terminal commands, package management |
| Design | `lovable/ux_designer` | User experience, interface design, accessibility |
| Component | `rork/component_logic` | UI component architecture, state management |
| Presentation | `gamma/presentation_creator` | Slide decks, visual design, content organization |
| Docs | `same/collaboration_agent` | Technical writing, team coordination |
| Debug | `vscode/code_assistant` | Context-aware coding assistance |
| Project | `devin/autonomous_developer` | Autonomous planning, implementation, testing |
| Agent | `manus/agent_programmer` | Agent design, behavior programming |
| Unified | `combined/pulsedev_unified` | Complete development lifecycle |

### How to Use Specialized Modes

You can use specialized modes in two ways:

1. **Task-Type Endpoint**: Use the `/api/ai/specialized-assistance` endpoint with a `task_type` parameter to automatically select the appropriate prompt.

2. **Manual Prompt Selection**: Specify a `prompt_name` parameter in any request to the AI assistant endpoints.

Example using specific prompts:

```javascript
// Get design assistance
const response = await fetch('/api/ai/code-assistance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Design a user profile page with responsive layout",
    prompt_name: "lovable/ux_designer"
  })
});

// Get presentation assistance
const response = await fetch('/api/ai/code-assistance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Create a slide deck for our new feature launch",
    prompt_name: "gamma/presentation_creator"
  })
});
```

### Managing Prompts

The API provides endpoints for prompt management:

- `GET /api/ai/prompts` - List all available prompts and the active prompt
- `GET /api/ai/prompts/{prompt_name}` - Get detailed information about a specific prompt
- `POST /api/ai/prompts/load` - Load and activate a specific prompt

## Troubleshooting

If you encounter issues with the Claude integration:

1. **Check MCP Connection**: Ensure the MCP server is running at the expected address
2. **Check Logs**: Look at `logs/backend.log` for error messages
3. **Restart PulseDev**: Sometimes restarting with `./shutdown.sh` and then `./launch.sh` can resolve connection issues
4. **Check API Status**: Visit `/api/ai/status` endpoint to check connection status
5. **MCP Server Issues**: If the MCP server is not responding, try restarting it
6. **Prompt Loading Issues**: Check if the specified prompt exists in the `mcp_prompts` directory

## Limitations

- The AI assistant requires a running MCP server
- Performance depends on the MCP server's responsiveness
- Some specialized tasks may require specific MCP agent capabilities
- Initial prompt loading adds a slight delay to the first request

## Future Improvements

- Streaming responses for real-time AI feedback
- Context-aware code completions
- Multi-file project understanding
- Caching for improved performance
- Additional specialized prompts for more tools
- Auto-detection of appropriate prompt based on context