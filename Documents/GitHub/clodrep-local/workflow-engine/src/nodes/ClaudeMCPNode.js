import axios from 'axios';

export class ClaudeMCPNode {
  constructor(mcpBridgeUrl = 'http://localhost:3000') {
    this.mcpBridgeUrl = mcpBridgeUrl;
    this.bridgeToken = process.env.BRIDGE_SECRET || 'f70df21ff3f240b82f9d5a481a024e3f';
  }

  async execute(inputs, context, parameters) {
    const { tool, arguments: args, prompt } = parameters;
    
    // If prompt is provided, use it as a template
    let processedArgs = { ...args };
    if (prompt) {
      processedArgs = this.processTemplate(prompt, inputs.main?.[0] || {}, context);
    }

    try {
      // Call MCP bridge
      const response = await axios.post(
        `${this.mcpBridgeUrl}/mcp`,
        {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: tool,
            arguments: processedArgs
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Bridge-Token': this.bridgeToken
          }
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      // Extract result from MCP response
      const result = response.data.result?.content?.[0]?.text;
      const parsed = result ? JSON.parse(result) : {};
      
      return { 
        main: [{
          ...inputs.main?.[0],
          claudeResult: parsed,
          tool,
          timestamp: new Date()
        }]
      };
    } catch (error) {
      console.error('Claude MCP Error:', error);
      throw new Error(`Claude MCP failed: ${error.message}`);
    }
  }

  processTemplate(template, data, context) {
    // Simple template processing
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value = { ...data, ...context };
      
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }
      
      return value !== undefined ? value : match;
    });
  }

  // Available Claude tools
  static getAvailableTools() {
    return [
      {
        name: 'Read',
        description: 'Read file contents',
        parameters: {
          file_path: { type: 'string', required: true }
        }
      },
      {
        name: 'Write',
        description: 'Write content to file',
        parameters: {
          file_path: { type: 'string', required: true },
          content: { type: 'string', required: true }
        }
      },
      {
        name: 'Bash',
        description: 'Execute bash commands',
        parameters: {
          command: { type: 'string', required: true }
        }
      }
    ];
  }
}

// Enhanced node definition for workflow engine
export const claudeMCPNodeDefinition = {
  name: 'Claude MCP',
  description: 'Execute Claude tools via MCP bridge',
  category: 'Integration',
  inputs: ['main'],
  outputs: ['main', 'error'],
  parameters: {
    tool: {
      type: 'select',
      required: true,
      options: ['Read', 'Write', 'Bash'],
      default: 'Read'
    },
    arguments: {
      type: 'object',
      required: false,
      default: {}
    },
    prompt: {
      type: 'string',
      required: false,
      description: 'Template for dynamic arguments (use {{variable}} syntax)'
    }
  },
  execute: async (inputs, context, parameters) => {
    const node = new ClaudeMCPNode();
    try {
      const result = await node.execute(inputs, context, parameters);
      return { main: result.main, error: [] };
    } catch (error) {
      return { 
        main: [], 
        error: [{
          ...inputs.main?.[0],
          error: error.message,
          timestamp: new Date()
        }]
      };
    }
  }
};