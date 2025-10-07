# PulseDev - Cloud IDE and Code Execution Platform

PulseDev is a Replit-like cloud IDE and code execution platform built on the Model Context Protocol (MCP) architecture. It provides a collaborative, browser-based development environment with real-time collaboration, terminal access, and AI assistance.

## Architecture

PulseDev follows a modern architecture with the following components:

### Backend Components
- **FastAPI Server**: Provides API endpoints for workspace management, file operations, and code execution
- **WebSocket Server**: Enables real-time collaboration and communication
- **Docker Runner**: Executes code in isolated containers for security and reproducibility
- **MCP Connector**: Integrates with the Model Context Protocol for AI assistance

### Frontend Components
- **React Application**: Responsive, modern UI built with React
- **Monaco Editor**: VS Code's editor component for web-based code editing
- **xterm.js**: Terminal emulation in the browser
- **WebSocket Client**: Real-time collaboration and communication
- **AI Assistant**: Embedded AI assistance powered by Claude via MCP

## Features

- **Collaborative Code Editing**: Real-time editing with multiple users
- **File System Management**: Create, read, update, and delete files and directories
- **Terminal Access**: Full terminal emulation for command-line operations
- **Code Execution**: Run code in various languages (Python, Node.js, etc.)
- **AI Assistance**: Integrated AI help for code understanding, generation, and debugging
- **Workspaces**: Isolated environments for different projects
- **Templates**: Quick-start templates for various project types

## Development Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker
- MCP Server running

### Backend Setup
1. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

The API documentation is available at http://localhost:8000/docs when the backend server is running.

### Key Endpoints

- `POST /api/workspaces`: Create a new workspace
- `GET /api/workspaces/{workspace_id}`: Get workspace metadata and files
- `POST /api/workspaces/{workspace_id}/files`: Create a new file
- `GET /api/workspaces/{workspace_id}/files/{file_path}`: Read file content
- `PUT /api/workspaces/{workspace_id}/files/{file_path}`: Update file content
- `DELETE /api/workspaces/{workspace_id}/files/{file_path}`: Delete a file
- `POST /api/workspaces/{workspace_id}/execute`: Execute code
- `POST /api/workspaces/{workspace_id}/terminal`: Execute terminal command
- `WebSocket /ws/{workspace_id}`: WebSocket endpoint for real-time collaboration

## AI Assistant Integration

PulseDev integrates with the MCP architecture to provide AI assistance powered by Claude. The AI assistant can:

- Answer code-related questions
- Generate code based on descriptions
- Explain existing code
- Debug errors
- Suggest improvements
- Emulate specialized AI tools

Assistance is accessed through:
1. Direct API requests to `/api/ai/code-assistance`
2. The AI chat panel in the UI
3. Context menu options in the editor
4. Specialized task endpoints (e.g., `/api/ai/specialized-assistance`)

### Specialized AI Tools

PulseDev includes a collection of specialized system prompts that tune Claude to emulate various AI tools:

| Tool | Focus Area | Access |
|------|------------|--------|
| Cursor | Code writing, debugging, refactoring | `cursor/chat_prompt` |
| Replit | Terminal commands, package management | `replit/command_runner` |
| Windsurf | API integration, workflow automation | `windsurf/tools` |
| Rork | UI component architecture | `rork/component_logic` |
| Gamma | Presentations and slide decks | `gamma/presentation_creator` |
| VSCode | Context-aware coding assistance | `vscode/code_assistant` |
| Devin | Autonomous development | `devin/autonomous_developer` |
| Same.dev | Technical writing and documentation | `same/collaboration_agent` |
| Lovable | UX design and interface development | `lovable/ux_designer` |
| Manus | Agent behavior programming | `manus/agent_programmer` |
| Unified | Combined capabilities | `combined/pulsedev_unified` |

See [README_CLAUDE_INTEGRATION.md](README_CLAUDE_INTEGRATION.md) for details on these specialized capabilities.

### CLI Prompt Management

PulseDev includes CLI tools for managing the specialized AI behaviors:

```bash
# List available prompts
./prompt_switch.sh list

# Get detailed info about a prompt
./prompt_switch.sh info gamma/presentation_creator

# Switch to a specific prompt
./prompt_switch.sh switch vscode/code_assistant

# Get prompt recommendations based on a query
./prompt_switch.sh recommend "Design a responsive navigation component"
```

Add convenient aliases to your shell by sourcing `prompt_aliases.sh`:

```bash
# Add to your ~/.zshrc
source /path/to/prompt_aliases.sh

# Then use shortcuts like:
plist    # List all prompts
pux      # Switch to UX design mode
pslides  # Switch to presentation creation mode
```

### Prompt Library Integration

PulseDev can be integrated with the Pulser Prompt Library system to use distilled, legally-safe prompt templates:

```bash
# Integrate distilled prompt library with PulseDev
./integrate_prompt_library.sh

# Use Claude model prompts
phaiku   # Fast, efficient Claude 3 Haiku
psonnet  # Balanced Claude 3 Sonnet
popus    # Advanced Claude 3 Opus
```

See [PROMPT_LIBRARY_INTEGRATION.md](PROMPT_LIBRARY_INTEGRATION.md) for detailed instructions on using the prompt library with PulseDev.

### Development and Verification Tools

PulseDev includes tools for verifying and exploring MCP prompts:

```bash
# Verify all MCP prompts via REST API
./verify_prompts.sh

# Build an HTML PromptBook for browsing prompts
./build_promptbook.sh
```

The verification script tests prompt activation via the REST API and generates a detailed report with test results.

The PromptBook provides a user-friendly interface for exploring all MCP prompts, with features for searching, filtering, and copying prompt templates.

## Docker Execution Environment

Code execution happens in isolated Docker containers with:
- Resource limitations (CPU, memory)
- Filesystem isolation
- Network restrictions
- Timeout controls

Each workspace gets its own container to maintain state between executions.

## WebSocket-Based Collaboration

Real-time collaboration features include:
- Synchronized editing
- Cursor position tracking
- User presence indicators
- Terminal output sharing
- Execution result broadcasting

## Security Considerations

- All code runs in isolated Docker containers
- Resource limits prevent abuse
- User authentication (to be implemented)
- Input validation on all endpoints
- CORS protection for production

## License

MIT

## Acknowledgements

PulseDev is built on the MCP architecture and integrates with several open-source technologies:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [xterm.js](https://xtermjs.org/)
- [Docker](https://www.docker.com/)