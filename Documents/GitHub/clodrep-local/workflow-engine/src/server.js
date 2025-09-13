import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { WorkflowEngine } from './core/WorkflowEngine.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Initialize workflow engine
const engine = new WorkflowEngine({
  concurrency: 10
});

// API Routes

// Get all workflows
app.get('/api/workflows', (req, res) => {
  const workflows = Array.from(engine.workflows.values());
  res.json(workflows);
});

// Get single workflow
app.get('/api/workflows/:id', (req, res) => {
  const workflow = engine.workflows.get(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json(workflow);
});

// Create workflow
app.post('/api/workflows', (req, res) => {
  try {
    const workflow = engine.createWorkflow(req.body);
    res.json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update workflow
app.put('/api/workflows/:id', (req, res) => {
  const workflow = engine.workflows.get(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  
  Object.assign(workflow, req.body, { updatedAt: new Date() });
  res.json(workflow);
});

// Delete workflow
app.delete('/api/workflows/:id', (req, res) => {
  if (!engine.workflows.has(req.params.id)) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  engine.workflows.delete(req.params.id);
  res.json({ success: true });
});

// Execute workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const execution = await engine.executeWorkflow(req.params.id, req.body);
    res.json(execution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get executions
app.get('/api/executions', (req, res) => {
  const workflowId = req.query.workflowId;
  const executions = engine.getExecutions(workflowId);
  res.json(executions);
});

// Get execution details
app.get('/api/executions/:id', (req, res) => {
  const execution = engine.executions.get(req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  
  // Include node executions
  execution.nodeExecutions = Array.from(execution.nodeExecutions.entries()).map(([nodeId, exec]) => ({
    nodeId,
    ...exec
  }));
  
  res.json(execution);
});

// Get available node types
app.get('/api/nodes', (req, res) => {
  const nodes = Array.from(engine.nodes.entries()).map(([type, def]) => ({
    type,
    ...def
  }));
  res.json(nodes);
});

// Webhook endpoint
app.all('/webhook/:path', (req, res) => {
  engine.handleWebhook(req.params.path, req.method, {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  res.json({ success: true });
});

// Create HTTP server
const server = createServer(app);

// WebSocket for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    workflows: Array.from(engine.workflows.values()),
    executions: Array.from(engine.executions.values())
  }));
  
  // Subscribe to engine events
  const listeners = {
    'workflow:created': (workflow) => {
      ws.send(JSON.stringify({ type: 'workflow:created', workflow }));
    },
    'execution:started': (execution) => {
      ws.send(JSON.stringify({ type: 'execution:started', execution }));
    },
    'execution:completed': (execution) => {
      ws.send(JSON.stringify({ type: 'execution:completed', execution }));
    },
    'execution:failed': (execution) => {
      ws.send(JSON.stringify({ type: 'execution:failed', execution }));
    }
  };
  
  Object.entries(listeners).forEach(([event, handler]) => {
    engine.on(event, handler);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    Object.entries(listeners).forEach(([event, handler]) => {
      engine.off(event, handler);
    });
  });
});

// Example workflows
function createExampleWorkflows() {
  // Simple HTTP workflow
  engine.createWorkflow({
    name: 'Fetch Weather',
    description: 'Get weather data and process it',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 }
      },
      {
        id: 'fetch',
        type: 'http-request',
        parameters: {
          method: 'GET',
          url: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY'
        },
        position: { x: 300, y: 100 }
      },
      {
        id: 'transform',
        type: 'transform',
        parameters: {
          code: `
            return {
              city: $input.name,
              temp: Math.round($input.main.temp - 273.15),
              description: $input.weather[0].description
            };
          `
        },
        position: { x: 500, y: 100 }
      }
    ],
    connections: [
      {
        from: { node: 'start', output: 'main' },
        to: { node: 'fetch', input: 'main' }
      },
      {
        from: { node: 'fetch', output: 'main' },
        to: { node: 'transform', input: 'main' }
      }
    ]
  });

  // Claude integration workflow
  engine.createWorkflow({
    name: 'Claude Analysis',
    description: 'Use Claude to analyze data',
    nodes: [
      {
        id: 'webhook',
        type: 'webhook',
        parameters: {
          path: 'analyze',
          method: 'POST'
        },
        position: { x: 100, y: 200 }
      },
      {
        id: 'claude',
        type: 'claude-mcp',
        parameters: {
          tool: 'analyze',
          arguments: {
            prompt: 'Analyze this data: {{$input.data}}'
          }
        },
        position: { x: 300, y: 200 }
      }
    ],
    connections: [
      {
        from: { node: 'webhook', output: 'main' },
        to: { node: 'claude', input: 'main' }
      }
    ]
  });
}

// Start server
server.listen(port, () => {
  console.log(`🔧 Workflow Engine running on port ${port}`);
  console.log(`📡 API: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
  console.log(`🎯 Webhook endpoint: http://localhost:${port}/webhook/:path`);
  
  // Create example workflows
  createExampleWorkflows();
});