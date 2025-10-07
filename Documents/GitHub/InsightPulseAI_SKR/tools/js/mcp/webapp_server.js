#!/usr/bin/env node
/**
 * Server-side component for the Pulser Robot webapp
 * Provides API endpoints and proxies requests to the MCP server
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 3000;
const MCP_HOST = process.env.MCP_HOST || 'localhost';
const MCP_PORT = process.env.MCP_PORT || 9090;
const BLENDER_SCRIPT_PATH = path.join(__dirname, 'pulser_robot_3d.py');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'webapp/build')));

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

// Connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      if (data.type === 'request_status') {
        checkMcpStatus().then(status => {
          ws.send(JSON.stringify({
            type: 'status_update',
            status
          }));
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
  });
  
  // Send initial status
  checkMcpStatus().then(status => {
    ws.send(JSON.stringify({
      type: 'status_update',
      status
    }));
  });
});

// Check if MCP server is running
async function checkMcpStatus() {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://${MCP_HOST}:${MCP_PORT}/mcp/status`);
    
    const timeout = setTimeout(() => {
      socket.terminate();
      resolve('disconnected');
    }, 1000);
    
    socket.on('open', () => {
      clearTimeout(timeout);
      socket.close();
      resolve('connected');
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve('disconnected');
    });
  });
}

// Broadcast status to all clients
async function broadcastStatus() {
  const status = await checkMcpStatus();
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'status_update',
        status
      }));
    }
  }
}

// API Routes
app.get('/api/status', async (req, res) => {
  const status = await checkMcpStatus();
  res.json({ status });
});

// Proxy command to Blender via MCP
app.post('/api/blender/command', async (req, res) => {
  const { command, params } = req.body;
  
  try {
    // Check if MCP is running
    const status = await checkMcpStatus();
    if (status !== 'connected') {
      return res.status(503).json({
        status: 'error',
        message: 'MCP server is not running'
      });
    }
    
    // Handle create_pulser_robot command directly if needed
    if (command === 'create_pulser_robot') {
      // Run the Blender script directly for testing without MCP
      const directMode = process.env.DIRECT_MODE === 'true';
      
      if (directMode) {
        console.log('Running in direct mode');
        
        const blenderProcess = spawn('blender', [
          '--background',
          '--python', BLENDER_SCRIPT_PATH
        ]);
        
        let stdoutData = '';
        let stderrData = '';
        
        blenderProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });
        
        blenderProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
          console.error(`Blender Error: ${data}`);
        });
        
        blenderProcess.on('close', (code) => {
          if (code === 0) {
            // Check if image was created
            const imagePath = path.join(__dirname, 'pulser_robot.png');
            
            if (fs.existsSync(imagePath)) {
              const imageData = fs.readFileSync(imagePath);
              const base64Image = imageData.toString('base64');
              
              return res.json({
                status: 'success',
                message: 'Robot created successfully in direct mode',
                image_data: base64Image
              });
            } else {
              return res.json({
                status: 'success',
                message: 'Robot created successfully in direct mode, but no image was found'
              });
            }
          } else {
            return res.status(500).json({
              status: 'error',
              message: `Blender exited with code ${code}`,
              error: stderrData
            });
          }
        });
        
        return;
      }
      
      // Connect to MCP server via WebSocket
      const socket = new WebSocket(`ws://${MCP_HOST}:${MCP_PORT}/mcp/blender`);
      
      socket.on('open', () => {
        // Send command
        socket.send(JSON.stringify({
          type: 'command',
          command,
          params
        }));
      });
      
      socket.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          socket.close();
          res.json(response);
        } catch (error) {
          socket.close();
          res.status(500).json({
            status: 'error',
            message: 'Failed to parse MCP response',
            error: error.message
          });
        }
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to connect to MCP server',
          error: error.message
        });
      });
    } else {
      // For all other commands, proxy to MCP
      res.status(501).json({
        status: 'error',
        message: 'Command not implemented'
      });
    }
  } catch (error) {
    console.error('Error processing command:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'webapp/build', 'index.html'));
});

// Start periodic status check
setInterval(broadcastStatus, 5000);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MCP server expected at ${MCP_HOST}:${MCP_PORT}`);
});