#!/usr/bin/env node
/**
 * Official MCP Server for Claude
 * Based on Anthropic's documentation: https://support.anthropic.com/en/articles/11175166-about-custom-integrations-using-remote-mcp
 * 
 * This server implements the required MCP endpoints to integrate Claude with local tools.
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  port: 9315,
  auth_token: 'claude-code-cli-token',
  log_dir: path.join(process.env.HOME || process.env.USERPROFILE, '.mcp'),
  log_file: 'mcp.log'
};

// Ensure log directory exists
if (!fs.existsSync(config.log_dir)) {
  fs.mkdirSync(config.log_dir, { recursive: true });
}

const logFilePath = path.join(config.log_dir, config.log_file);

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
  console.log(logMessage.trim());
}

// Available tools
const tools = [
  {
    name: 'execute_command',
    description: 'Run a shell command on the local machine',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: 'Read a file from the local filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read'
        }
      },
      required: ['path']
    }
  }
];

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Log request
  log(`${req.method} ${pathname}`);
  
  // Health endpoint (required)
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  // Status endpoint (required)
  if (pathname === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime()
    }));
    return;
  }
  
  // Capabilities endpoint (required)
  if (pathname === '/capabilities' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools }));
    return;
  }
  
  // Command endpoint (authenticated)
  if (pathname === '/command' && req.method === 'POST') {
    // Check authentication
    let token = null;
    
    // Check for token in query param
    if (parsedUrl.query.token) {
      token = parsedUrl.query.token;
    }
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    
    // Validate token
    if (token !== config.auth_token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      }));
      return;
    }
    
    // Read request body
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { tool_name, parameters } = data;
        
        if (!tool_name || !parameters) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: 'Missing tool_name or parameters'
          }));
          return;
        }
        
        // Handle tool execution
        switch (tool_name) {
          case 'execute_command':
            handleExecuteCommand(parameters, res);
            break;
            
          case 'read_file':
            handleReadFile(parameters, res);
            break;
            
          default:
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Bad Request',
              message: `Unknown tool: ${tool_name}`
            }));
        }
      } catch (error) {
        log(`Error processing request: ${error.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON payload'
        }));
      }
    });
    return;
  }
  
  // Handle unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Endpoint not found: ${pathname}`
  }));
});

// Tool handlers
function handleExecuteCommand(parameters, res) {
  const { command } = parameters;
  
  if (!command) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Request',
      message: 'Missing command parameter'
    }));
    return;
  }
  
  log(`Executing command: ${command}`);
  
  try {
    // Execute command - Note: This is synchronous for simplicity
    const output = execSync(command, { encoding: 'utf8' });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      output: output
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Execution Error',
      message: error.message,
      stderr: error.stderr ? error.stderr.toString() : null
    }));
  }
}

function handleReadFile(parameters, res) {
  const { path: filePath } = parameters;
  
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Request',
      message: 'Missing path parameter'
    }));
    return;
  }
  
  log(`Reading file: ${filePath}`);
  
  try {
    // Read file - Note: This is synchronous for simplicity
    const content = fs.readFileSync(filePath, 'utf8');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      content: content
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'File Error',
      message: error.message
    }));
  }
}

// Start server
server.listen(config.port, () => {
  log(`MCP Server running at http://localhost:${config.port}`);
  log(`Authentication token: ${config.auth_token}`);
  log(`Log file: ${logFilePath}`);
  
  log('Available endpoints:');
  log(`  GET  /health       - Health check endpoint`);
  log(`  GET  /status       - Server status endpoint`);
  log(`  GET  /capabilities - Available tools endpoint`);
  log(`  POST /command      - Execute tool (authenticated)`);
});