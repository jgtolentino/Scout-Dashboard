import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';

export class WorkflowEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.workflows = new Map();
    this.executions = new Map();
    this.nodes = new Map();
    this.connections = new Map();
    
    // Execution queue with concurrency control
    this.queue = new PQueue({ 
      concurrency: config.concurrency || 10,
      autoStart: true 
    });
    
    // Register built-in nodes
    this.registerBuiltInNodes();
  }

  registerBuiltInNodes() {
    // Start node
    this.registerNodeType('start', {
      name: 'Start',
      description: 'Workflow entry point',
      inputs: [],
      outputs: ['main'],
      execute: async (inputs, context) => {
        return { main: [context.inputData || {}] };
      }
    });

    // Claude MCP node
    this.registerNodeType('claude-mcp', {
      name: 'Claude MCP',
      description: 'Execute Claude tools via MCP',
      inputs: ['main'],
      outputs: ['main'],
      parameters: {
        tool: { type: 'string', required: true },
        arguments: { type: 'object', required: true }
      },
      execute: async (inputs, context, parameters) => {
        const { tool, arguments: args } = parameters;
        // TODO: Integrate with MCP bridge
        const result = await this.callMCPTool(tool, args);
        return { main: [result] };
      }
    });

    // HTTP Request node
    this.registerNodeType('http-request', {
      name: 'HTTP Request',
      description: 'Make HTTP requests',
      inputs: ['main'],
      outputs: ['main'],
      parameters: {
        method: { type: 'string', default: 'GET' },
        url: { type: 'string', required: true },
        headers: { type: 'object', default: {} },
        body: { type: 'any' }
      },
      execute: async (inputs, context, parameters) => {
        const axios = (await import('axios')).default;
        const response = await axios({
          method: parameters.method,
          url: parameters.url,
          headers: parameters.headers,
          data: parameters.body
        });
        return { main: [response.data] };
      }
    });

    // Transform node
    this.registerNodeType('transform', {
      name: 'Transform',
      description: 'Transform data with JavaScript',
      inputs: ['main'],
      outputs: ['main'],
      parameters: {
        code: { type: 'string', required: true }
      },
      execute: async (inputs, context, parameters) => {
        const fn = new Function('$input', '$context', parameters.code);
        const result = fn(inputs.main[0], context);
        return { main: [result] };
      }
    });

    // Conditional node
    this.registerNodeType('if', {
      name: 'If',
      description: 'Conditional branching',
      inputs: ['main'],
      outputs: ['true', 'false'],
      parameters: {
        condition: { type: 'string', required: true }
      },
      execute: async (inputs, context, parameters) => {
        const fn = new Function('$input', '$context', `return ${parameters.condition}`);
        const result = fn(inputs.main[0], context);
        return result 
          ? { true: inputs.main, false: [] }
          : { true: [], false: inputs.main };
      }
    });

    // Loop node
    this.registerNodeType('loop', {
      name: 'Loop',
      description: 'Iterate over items',
      inputs: ['main'],
      outputs: ['loop', 'done'],
      parameters: {
        items: { type: 'string', default: '$input' }
      },
      execute: async (inputs, context, parameters) => {
        const fn = new Function('$input', '$context', `return ${parameters.items}`);
        const items = fn(inputs.main[0], context);
        
        if (!Array.isArray(items)) {
          return { loop: [], done: inputs.main };
        }
        
        const results = [];
        for (const item of items) {
          results.push({ ...inputs.main[0], $item: item, $index: results.length });
        }
        
        return { loop: results, done: [{ items: results }] };
      }
    });

    // Webhook node
    this.registerNodeType('webhook', {
      name: 'Webhook',
      description: 'Receive webhook calls',
      inputs: [],
      outputs: ['main'],
      parameters: {
        path: { type: 'string', required: true },
        method: { type: 'string', default: 'POST' }
      },
      execute: async (inputs, context) => {
        // This is triggered by external webhook
        return { main: [context.webhookData || {}] };
      }
    });

    // Schedule node
    this.registerNodeType('schedule', {
      name: 'Schedule',
      description: 'Run on schedule',
      inputs: [],
      outputs: ['main'],
      parameters: {
        cron: { type: 'string', required: true }
      },
      execute: async (inputs, context) => {
        // This is triggered by scheduler
        return { main: [{ timestamp: new Date() }] };
      }
    });
  }

  registerNodeType(type, definition) {
    this.nodes.set(type, definition);
  }

  createWorkflow(definition) {
    const workflow = {
      id: uuidv4(),
      name: definition.name,
      description: definition.description,
      nodes: definition.nodes || [],
      connections: definition.connections || [],
      settings: definition.settings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:created', workflow);
    return workflow;
  }

  async executeWorkflow(workflowId, inputData = {}, options = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution = {
      id: uuidv4(),
      workflowId,
      status: 'running',
      startedAt: new Date(),
      inputData,
      nodeExecutions: new Map(),
      results: {}
    };

    this.executions.set(execution.id, execution);
    this.emit('execution:started', execution);

    try {
      // Build execution graph
      const graph = this.buildExecutionGraph(workflow);
      
      // Execute nodes in topological order
      const result = await this.executeGraph(graph, execution, inputData);
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.results = result;
      
      this.emit('execution:completed', execution);
      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      
      this.emit('execution:failed', execution);
      throw error;
    }
  }

  buildExecutionGraph(workflow) {
    const graph = {
      nodes: new Map(),
      edges: new Map(),
      startNodes: []
    };

    // Add nodes to graph
    workflow.nodes.forEach(node => {
      graph.nodes.set(node.id, {
        ...node,
        inputs: new Set(),
        outputs: new Set()
      });
    });

    // Add connections
    workflow.connections.forEach(conn => {
      const fromNode = graph.nodes.get(conn.from.node);
      const toNode = graph.nodes.get(conn.to.node);
      
      if (fromNode && toNode) {
        fromNode.outputs.add(conn.to.node);
        toNode.inputs.add(conn.from.node);
        
        const key = `${conn.from.node}:${conn.from.output}`;
        if (!graph.edges.has(key)) {
          graph.edges.set(key, []);
        }
        graph.edges.get(key).push({
          node: conn.to.node,
          input: conn.to.input
        });
      }
    });

    // Find start nodes
    graph.nodes.forEach((node, id) => {
      if (node.inputs.size === 0) {
        graph.startNodes.push(id);
      }
    });

    return graph;
  }

  async executeGraph(graph, execution, inputData) {
    const context = {
      execution,
      inputData,
      workflow: this.workflows.get(execution.workflowId)
    };

    const nodeOutputs = new Map();
    const executed = new Set();
    const queue = [...graph.startNodes];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (executed.has(nodeId)) continue;

      const node = graph.nodes.get(nodeId);
      const nodeType = this.nodes.get(node.type);
      
      if (!nodeType) {
        throw new Error(`Unknown node type: ${node.type}`);
      }

      // Check if all inputs are ready
      const inputsReady = Array.from(node.inputs).every(inputId => 
        executed.has(inputId)
      );
      
      if (!inputsReady) {
        queue.push(nodeId);
        continue;
      }

      // Gather inputs
      const inputs = {};
      graph.edges.forEach((targets, key) => {
        const [fromNodeId, outputName] = key.split(':');
        targets.forEach(target => {
          if (target.node === nodeId) {
            const fromOutputs = nodeOutputs.get(fromNodeId);
            if (fromOutputs && fromOutputs[outputName]) {
              inputs[target.input] = fromOutputs[outputName];
            }
          }
        });
      });

      // Execute node
      const nodeExecution = {
        nodeId,
        startedAt: new Date(),
        inputs
      };

      try {
        const outputs = await this.queue.add(async () => {
          return await nodeType.execute(inputs, context, node.parameters || {});
        });
        
        nodeOutputs.set(nodeId, outputs);
        nodeExecution.outputs = outputs;
        nodeExecution.status = 'success';
        nodeExecution.completedAt = new Date();
        
        // Add downstream nodes to queue
        node.outputs.forEach(outputId => {
          queue.push(outputId);
        });
      } catch (error) {
        nodeExecution.status = 'failed';
        nodeExecution.error = error.message;
        nodeExecution.completedAt = new Date();
        throw error;
      } finally {
        execution.nodeExecutions.set(nodeId, nodeExecution);
        executed.add(nodeId);
      }
    }

    return nodeOutputs;
  }

  async callMCPTool(tool, args) {
    // TODO: Integrate with your MCP bridge
    console.log(`Calling MCP tool: ${tool}`, args);
    return { success: true, tool, args };
  }

  // Webhook handling
  handleWebhook(path, method, data) {
    const webhookWorkflows = Array.from(this.workflows.values()).filter(w => {
      return w.nodes.some(n => 
        n.type === 'webhook' && 
        n.parameters?.path === path && 
        n.parameters?.method === method
      );
    });

    webhookWorkflows.forEach(workflow => {
      this.executeWorkflow(workflow.id, data, { 
        trigger: 'webhook',
        webhookData: data 
      });
    });
  }

  // Get workflow execution history
  getExecutions(workflowId = null) {
    const executions = Array.from(this.executions.values());
    if (workflowId) {
      return executions.filter(e => e.workflowId === workflowId);
    }
    return executions;
  }
}