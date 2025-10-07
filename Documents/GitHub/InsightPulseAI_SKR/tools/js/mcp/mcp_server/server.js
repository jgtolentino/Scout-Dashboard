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
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
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
  log('info', `Loading agent config from ${configPath}`);
  const configFile = fs.readFileSync(configPath, 'utf8');
  agentConfig = yaml.parse(configFile);
  log('info', 'Agent routing configuration loaded successfully');
} catch (err) {
  log('error', `Failed to load agent config: ${err.message}`);
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
    log('debug', `Found direct route for intent "${intent}" to agent "${route.agent}"`);
    return route.agent;
  }
  
  // Check fallback cascades
  const fallbacks = agentConfig.fallback_cascades || {};
  if (fallbacks[intent]) {
    log('debug', `Using fallback cascade for intent "${intent}"`);
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
  
  log('warn', `No agent found for intent "${intent}" in environment "${environment}"`);
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
        log('info', `Agent registered: ${agentId}`, {
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
        log('info', `Client registered: ${newClientId}`);
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
      
      log('debug', `Recognized intent "${intent}" for message`, data);
      
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
      log('info', `Routing request from client ${clientId} to agent ${agentId}`);
      
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
      log('info', `Routing response from agent to client ${data.client_id}`);
      
      // Remove internal fields before sending to client
      const response = { ...data };
      delete response._internal;
      
      clients.get(data.client_id).send(JSON.stringify(response));
    }
    
  } catch (err) {
    log('error', `Error handling message: ${err.message}`);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Invalid message format'
    }));
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  log('info', `New connection: ${clientId}`);
  
  // Handle messages
  ws.on('message', (message) => {
    handleMessage(ws, message, clientId);
  });
  
  // Handle disconnection
  ws.on('close', () => {
    log('info', `Connection closed: ${clientId}`);
    
    // Remove from clients if it's a client
    if (clients.has(clientId)) {
      clients.delete(clientId);
    }
    
    // Remove from agents if it's an agent
    for (const [agentId, agent] of agents.entries()) {
      if (agent.ws === ws) {
        log('info', `Agent disconnected: ${agentId}`);
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
  log('info', `MCP Server listening on ${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down MCP Server...');
  wss.close();
  server.close();
  process.exit(0);
});
