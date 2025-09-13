import { spawn } from 'child_process';
import { Tool, ToolResult, ToolContext } from '../index.js';

export class BashTool implements Tool {
  name = 'Bash';
  description = 'Executes bash commands in a secure sandbox';
  parameters = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
        default: 30000
      }
    },
    required: ['command']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { command, timeout = 30000 } = params;
    
    try {
      // Validate command through security gateway
      const allowed = await context.security.validateToolCall(
        { name: 'Bash', parameters: { command } },
        context
      );
      
      if (!allowed) {
        return {
          success: false,
          error: 'Command execution denied by security policy'
        };
      }
      
      return await this.executeCommand(command, timeout);
    } catch (error) {
      return {
        success: false,
        error: `Command execution failed: ${error}`
      };
    }
  }
  
  private async executeCommand(command: string, timeout: number): Promise<ToolResult> {
    return new Promise((resolve) => {
      const process = spawn('bash', ['-c', command], {
        stdio: 'pipe',
        timeout
      });
      
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
          metadata: {
            exitCode: code,
            command
          }
        });
      });
      
      process.on('error', (error) => {
        resolve({
          success: false,
          error: `Process error: ${error.message}`
        });
      });
      
      // Handle timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGTERM');
          resolve({
            success: false,
            error: `Command timed out after ${timeout}ms`
          });
        }
      }, timeout);
    });
  }
}

export class ExecutionTool implements Tool {
  name = 'Execution';
  description = 'Secure command execution tool';
  parameters = {};
  
  private bashTool = new BashTool();
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    return await this.bashTool.execute(params, context);
  }
}