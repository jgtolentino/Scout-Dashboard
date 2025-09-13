#!/bin/bash
# Model Context Protocol (MCP) Server Starter Script
# This script starts the MCP server and initializes the agent routing.

echo "=================================="
echo "        MCP Server Starter        "
echo "=================================="

# Set environment variables
export MCP_PORT=8765
export MCP_HOST=0.0.0.0
export AGENT_CONFIG_PATH="./agent_routing.yaml"
export LOG_LEVEL=info

# Create logs directory if it doesn't exist
mkdir -p logs

# Check for required files
if [ ! -f "$AGENT_CONFIG_PATH" ]; then
    echo "❌ Error: Agent routing configuration file not found at $AGENT_CONFIG_PATH"
    exit 1
fi

# Check if MCP server is already running
if nc -z localhost $MCP_PORT 2>/dev/null; then
    echo "⚠️  MCP server is already running on port $MCP_PORT"
    echo "If you want to restart it, use 'stop_mcp.sh' first."
    exit 1
fi

# Install any missing dependencies
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if the mcp directory exists
if [ ! -d "mcp_server" ]; then
    echo "Creating MCP server directory..."
    mkdir -p mcp_server
fi

# Check for package.json, create if it doesn't exist
if [ ! -f "mcp_server/package.json" ]; then
    echo "Creating package.json for MCP server..."
    cat > mcp_server/package.json << EOF
{
  "name": "mcp-server",
  "version": "1.0.0",
  "description": "Model Context Protocol Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.13.0",
    "yaml": "^2.3.1",
    "uuid": "^9.0.0",
    "node-fetch": "^3.3.1",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "type": "module"
}
EOF
fi

# Create server.js if it doesn't exist
if [ ! -f "mcp_server/server.js" ]; then
    echo "Creating MCP server implementation..."
    cat > mcp_server/server.js << EOF
// Model Context Protocol (MCP) Server
// Handles routing between clients and AI agents

import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.MCP_PORT || 8765;
const HOST = process.env.MCP_HOST || '0.0.0.0';
const AGENT_CONFIG_PATH = process.env.AGENT_CONFIG_PATH || '../agent_routing.yaml';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Logging
const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLogLevel = logLevels[LOG_LEVEL] || logLevels.info;

function log(level, message, data = null) {
  if (logLevels[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const logMessage = \`[\${timestamp}] [\${level.toUpperCase()}] \${message}\`;
    console.log(logMessage);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Load agent routing configuration
let agentConfig = {};
try {
  const configPath = path.resolve(__dirname, AGENT_CONFIG_PATH);
  log('info', \`Loading agent config from \${configPath}\`);
  const configFile = fs.readFileSync(configPath, 'utf8');
  agentConfig = yaml.parse(configFile);
  log('info', 'Agent routing configuration loaded successfully');
} catch (err) {
  log('error', \`Failed to load agent config: \${err.message}\`);
  process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MCP Server Running');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Connection tracking
const clients = new Map();  // clientId -> WebSocket
const agents = new Map();   // agentId -> { ws, capabilities, environment }

// Intent recognition
function recognizeIntent(message) {
  let intent = 'general';
  
  // Check patterns in agent config
  for (const [intentName, patterns] of Object.entries(agentConfig.intent_patterns || {})) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(message.query || message.command || message.text || '')) {
        return intentName;
      }
    }
  }
  
  return intent;
}

// Agent selection
function selectAgent(intent, environment) {
  // Check if there's a direct route for this intent and environment
  const route = agentConfig.routes.find(r => 
    r.intent === intent && 
    (!r.environment || r.environment === environment)
  );
  
  if (route) {
    log('debug', \`Found direct route for intent "\${intent}" to agent "\${route.agent}"\`);
    return route.agent;
  }
  
  // Check fallback cascades
  const fallbacks = agentConfig.fallback_cascades || {};
  if (fallbacks[intent]) {
    log('debug', \`Using fallback cascade for intent "\${intent}"\`);
    for (const agentId of fallbacks[intent]) {
      if (agents.has(agentId)) {
        return agentId;
      }
    }
  }
  
  // Default fallback
  if (fallbacks.default) {
    for (const agentId of fallbacks.default) {
      if (agents.has(agentId)) {
        return agentId;
      }
    }
  }
  
  log('warn', \`No agent found for intent "\${intent}" in environment "\${environment}"\`);
  return null;
}

// Message handling
function handleMessage(ws, message, clientId) {
  try {
    const data = JSON.parse(message);
    
    // Handle registration
    if (data.type === 'register') {
      if (data.client_type === 'agent') {
        const agentId = data.agent_id || data.client_id;
        log('info', \`Agent registered: \${agentId}\`, {
          capabilities: data.capabilities || [],
          environment: data.environment || 'default'
        });
        
        agents.set(agentId, {
          ws,
          capabilities: data.capabilities || [],
          environment: data.environment || 'default'
        });
        
        ws.send(JSON.stringify({
          type: 'registration_success',
          agent_id: agentId
        }));
        return;
      } else {
        // Client registration
        const newClientId = data.client_id || uuidv4();
        log('info', \`Client registered: \${newClientId}\`);
        clients.set(newClientId, ws);
        
        ws.send(JSON.stringify({
          type: 'registration_success',
          client_id: newClientId
        }));
        return;
      }
    }
    
    // Route request from client to agent
    if (data.type === 'request' && clientId) {
      const intent = recognizeIntent(data);
      const environment = data.environment || 'default';
      
      log('debug', \`Recognized intent "\${intent}" for message\`, data);
      
      const agentId = selectAgent(intent, environment);
      if (!agentId || !agents.has(agentId)) {
        ws.send(JSON.stringify({
          type: 'error',
          request_id: data.request_id,
          error: 'No suitable agent available',
          intent: intent
        }));
        return;
      }
      
      // Forward to agent
      const agent = agents.get(agentId);
      log('info', \`Routing request from client \${clientId} to agent \${agentId}\`);
      
      // Add client info to the request
      const request = {
        ...data,
        client_id: clientId,
        _internal: {
          intent: intent,
          environment: environment,
          timestamp: new Date().toISOString()
        }
      };
      
      agent.ws.send(JSON.stringify(request));
    }
    
    // Route response from agent to client
    if (data.type === 'response' && data.client_id && clients.has(data.client_id)) {
      log('info', \`Routing response from agent to client \${data.client_id}\`);
      
      // Remove internal fields before sending to client
      const response = { ...data };
      delete response._internal;
      
      clients.get(data.client_id).send(JSON.stringify(response));
    }
    
  } catch (err) {
    log('error', \`Error handling message: \${err.message}\`);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Invalid message format'
    }));
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  log('info', \`New connection: \${clientId}\`);
  
  // Handle messages
  ws.on('message', (message) => {
    handleMessage(ws, message, clientId);
  });
  
  // Handle disconnection
  ws.on('close', () => {
    log('info', \`Connection closed: \${clientId}\`);
    
    // Remove from clients if it's a client
    if (clients.has(clientId)) {
      clients.delete(clientId);
    }
    
    // Remove from agents if it's an agent
    for (const [agentId, agent] of agents.entries()) {
      if (agent.ws === ws) {
        log('info', \`Agent disconnected: \${agentId}\`);
        agents.delete(agentId);
        break;
      }
    }
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MCP Server',
    client_id: clientId
  }));
});

// Start server
server.listen(PORT, HOST, () => {
  log('info', \`MCP Server listening on \${HOST}:\${PORT}\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down MCP Server...');
  wss.close();
  server.close();
  process.exit(0);
});
EOF
fi

# Create stop script
if [ ! -f "stop_mcp.sh" ]; then
    echo "Creating stop script..."
    cat > stop_mcp.sh << EOF
#!/bin/bash
# Stop MCP Server

echo "Stopping MCP server..."
pid=\$(lsof -t -i:\$MCP_PORT)
if [ -n "\$pid" ]; then
    kill \$pid
    echo "MCP server stopped."
else
    echo "No MCP server running on port \$MCP_PORT."
fi
EOF
    chmod +x stop_mcp.sh
fi

# Install dependencies
echo "Installing dependencies..."
cd mcp_server
npm install
cd ..

# Start the server
echo "Starting MCP server..."
cd mcp_server
nohup node server.js > ../logs/mcp_server.log 2>&1 &
MCP_PID=$!
echo $MCP_PID > ../logs/mcp_server.pid
cd ..

echo "MCP server started (PID: $MCP_PID)"
echo "Server is running on ws://$MCP_HOST:$MCP_PORT"
echo ""
echo "To stop the server, run: ./stop_mcp.sh"
echo ""
echo "To check logs: cat logs/mcp_server.log"