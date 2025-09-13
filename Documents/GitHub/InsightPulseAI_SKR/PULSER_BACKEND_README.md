# Pulser Web Interface Backend

This directory contains the backend components for the Pulser Web Interface, providing the connection between the frontend deployed at https://pulser-ai.app and the Pulser agent system.

## Components

1. **Webhook Listener** (`tools/webhook_listener.js`)
   - Express.js server that handles API requests from the frontend
   - Routes messages to appropriate agents via claude_router.py
   - Handles task execution via pulseops
   - Processes voice input from Echo

2. **Claude Router** (`tools/claude_router.py`)
   - Agent orchestration system that routes messages to the appropriate agents
   - Detects which agent should handle each message based on content
   - Maintains conversation context for more coherent responses
   - Handles special requests like "is this live?"

3. **Shogun Agent** (`tools/shogun_runner.py`)
   - UI automation agent for browser and desktop tasks
   - Specializes in DNS and domain management
   - Can take screenshots to document actions
   - Integrates with Vercel CLI for domain management

4. **API Connector** (`pulseweb-renamed/api-connector.js`)
   - Frontend utility for communicating with the backend
   - Provides methods for sending messages, executing tasks, and processing voice input
   - Handles error conditions and provides a clean interface for frontend components

## Setup and Activation

Run the activation script to deploy all components:

```bash
./activate_pulser_system.sh
```

This will:
1. Install all required dependencies
2. Start the webhook listener on port 3333
3. Configure the agent orchestration system
4. Connect the frontend to the backend services

## Endpoints

The webhook listener provides the following endpoints:

- `POST /api/message` - Send a message to the agent system
  - Request: `{ "message": "string", "agent": "string" }`
  - Response: `{ "success": true, "response": { ... } }`

- `POST /api/execute-task` - Execute a task via pulseops
  - Request: `{ "task": "string", "params": { ... } }`
  - Response: `{ "success": true, "result": { ... } }`

- `POST /api/voice` - Process voice input
  - Request: `{ "audioData": "base64 string" }`
  - Response: `{ "success": true, "transcription": "string", "response": { ... } }`

- `GET /health` - Check backend health
  - Response: `{ "status": "ok", "timestamp": "ISO string" }`

## Agent System

The backend integrates with the following agents:

- **Claudia** - Primary orchestration agent
- **Echo** - Voice and perception agent
- **Kalaw** - Knowledge agent
- **Maya** - Workflow agent
- **Caca** - QA agent
- **Basher** - System operation agent
- **Shogun** - UI automation agent

Each agent specializes in different tasks and can be triggered by specific keywords in user messages.

## File Structure

- `tools/webhook_listener.js` - Main webhook listener
- `tools/claude_router.py` - Agent orchestration router
- `tools/shogun_runner.py` - UI automation agent
- `tools/launch_backend.sh` - Backend startup script
- `tools/package.json` - Backend dependencies
- `pulseweb-renamed/api-connector.js` - Frontend API connector
- `activate_pulser_system.sh` - Complete system activation script

## Logs and Data

All logs and data are stored in the `~/.pulser` directory:

- `~/.pulser/backend.log` - Backend server logs
- `~/.pulser/claude_router.log` - Agent router logs
- `~/.pulser/shogun.log` - Shogun agent logs
- `~/.pulser/webhook_log.json` - Webhook event logs
- `~/.pulser/context/` - Conversation context storage
- `~/.pulser/screenshots/` - Screenshots taken by Shogun

## Troubleshooting

If the backend fails to start, check the logs at `~/.pulser/backend.log`.

To restart the backend:

```bash
# Stop existing backend
kill $(cat ~/.pulser/backend.pid)

# Start backend again
./tools/launch_backend.sh
```

For frontend issues, please see the Pulser Web Interface README.