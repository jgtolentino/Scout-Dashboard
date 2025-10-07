#!/usr/bin/env node

// Quick MCP Bridge for Claude.ai Integration (CommonJS version)
// Run with: node quick-bridge-commonjs.js

const express = require('express');
const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;
const bridgeToken = process.env.BRIDGE_SECRET || 'clodrep-local-bridge-secret';

console.log('🌉 Starting Quick MCP Bridge for Claude.ai...');
console.log(`Port: ${port}`);
console.log(`Token: ${bridgeToken}`);

// Middleware
app.use(express.json());

// CORS for Claude.ai with proper preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Bridge-Token');
  
  // For HEAD/OPTIONS we acknowledge without auth
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication middleware - only for protected routes
const authenticateToken = (req, res, next) => {
  const token = req.headers['x-bridge-token'];
  
  if (token && token === bridgeToken) {
    req.user = { type: 'bridge', clientId: 'claude-ai' };
    return next();
  }
  
  res.sendStatus(401);
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.get('/metadata', (req, res) => {
  res.json({
    name: 'Clodrep Local Tools',
    description: 'Local MCP tool set',
    version: '0.1.0',
    auth: {
      type: 'header',
      header_name: 'X-Bridge-Token'
    }
  });
});

// MCP endpoints
// HEAD and GET don't require auth (for Claude's preflight checks)
app.head('/mcp', (_req, res) => res.sendStatus(200));
app.get('/mcp', (_req, res) => res.json({ status: 'pong' }));

// POST requires auth
app.post('/mcp', authenticateToken, async (req, res) => {
  try {
    const message = req.body;
    const response = await handleMCPMessage(message);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: String(error)
      }
    });
  }
});

// MCP Message Handler
async function handleMCPMessage(message) {
  const messageId = message.id ?? 'unknown';
  
  switch (message.method) {
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: messageId,
        result: {
          tools: [
            {
              name: 'Read',
              description: 'Read file contents',
              inputSchema: {
                type: 'object',
                properties: {
                  file_path: { type: 'string', description: 'Path to file' }
                },
                required: ['file_path']
              }
            },
            {
              name: 'Write', 
              description: 'Write content to file',
              inputSchema: {
                type: 'object',
                properties: {
                  file_path: { type: 'string', description: 'Path to file' },
                  content: { type: 'string', description: 'File content' }
                },
                required: ['file_path', 'content']
              }
            },
            {
              name: 'Bash',
              description: 'Execute bash commands',
              inputSchema: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'Command to execute' }
                },
                required: ['command']
              }
            }
          ]
        }
      };
    
    case 'tools/call':
      const { name, arguments: args } = message.params;
      const result = await executeTool(name, args);
      
      return {
        jsonrpc: '2.0',
        id: messageId,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      };
    
    case 'ping':
      return {
        jsonrpc: '2.0',
        id: messageId,
        result: { pong: true }
      };
    
    default:
      return {
        jsonrpc: '2.0',
        id: messageId,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
  }
}

// Tool Execution
async function executeTool(name, args) {
  try {
    switch (name) {
      case 'Read':
        if (existsSync(args.file_path)) {
          const content = readFileSync(args.file_path, 'utf-8');
          return {
            success: true,
            content: content,
            metadata: { file_path: args.file_path, size: content.length }
          };
        } else {
          return { success: false, error: 'File not found' };
        }
      
      case 'Write':
        // For demo purposes, don't actually write files
        return {
          success: true,
          content: `Would write to ${args.file_path}: ${args.content.substring(0, 100)}...`,
          metadata: { file_path: args.file_path, size: args.content.length }
        };
      
      case 'Bash':
        return await executeCommand(args.command);
      
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Execute bash command
function executeCommand(command) {
  return new Promise((resolve) => {
    const process = spawn('bash', ['-c', command], { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({
        success: code === 0,
        content: stdout || stderr,
        metadata: { exitCode: code, command }
      });
    });
    
    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGTERM');
        resolve({
          success: false,
          error: 'Command timed out'
        });
      }
    }, 10000);
  });
}

// Start server
const server = createServer(app);

server.listen(port, () => {
  console.log(`✅ MCP Bridge running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📋 Metadata: http://localhost:${port}/metadata`);
  console.log(`🌉 MCP endpoint: http://localhost:${port}/mcp`);
  console.log();
  console.log('📋 Claude.ai Integration:');
  console.log('1. Create tunnel: cloudflared tunnel --url http://localhost:3000');
  console.log('2. Add to Claude.ai Custom Integrations:');
  console.log('   - Name: Clodrep Local Tools');
  console.log('   - URL: https://your-tunnel-url.com/mcp');
  console.log(`   - Header: X-Bridge-Token = ${bridgeToken}`);
  console.log();
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bridge server...');
  server.close();
  process.exit(0);
});