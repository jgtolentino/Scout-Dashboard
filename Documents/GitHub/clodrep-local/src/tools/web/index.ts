import { Tool, ToolResult, ToolContext } from '../index.js';

export class WebFetchTool implements Tool {
  name = 'WebFetch';
  description = 'Fetches content from web URLs';
  parameters = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch content from'
      },
      prompt: {
        type: 'string',
        description: 'What to look for in the content'
      }
    },
    required: ['url', 'prompt']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { url, prompt } = params;
    
    try {
      // Check if web access is allowed
      if (context.config.execution.offline) {
        return {
          success: false,
          error: 'Web access disabled in offline mode'
        };
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const content = await response.text();
      
      return {
        success: true,
        content: `Fetched content from ${url}:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`,
        metadata: {
          url,
          contentLength: content.length,
          status: response.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch URL: ${error}`
      };
    }
  }
}

export class WebTool implements Tool {
  name = 'Web';
  description = 'Web-related operations';
  parameters = {};
  
  private webFetchTool = new WebFetchTool();
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    return await this.webFetchTool.execute(params, context);
  }
}