import * as readline from 'readline';
import chalk from 'chalk';
import { ClodreptConfig } from '../config/index.js';
import { LLMManager } from './llm-manager.js';
import { ToolFramework } from '../tools/index.js';
import { MemorySystem } from '../memory/index.js';
import { SecurityGateway } from '../security/index.js';
import { WorkflowOrchestrator } from '../orchestration/index.js';

export interface REPLContext {
  llmManager: LLMManager;
  tools: ToolFramework;
  memory: MemorySystem;
  orchestrator: WorkflowOrchestrator;
  security: SecurityGateway;
}

export class REPLInterface {
  private config: ClodreptConfig;
  private context: REPLContext;
  private rl: readline.Interface;
  private sessionId: string;
  
  constructor(config: ClodreptConfig, context: REPLContext) {
    this.config = config;
    this.context = context;
    this.sessionId = this.generateSessionId();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.magenta('▶ ')
    });
    
    this.setupSignalHandlers();
  }
  
  async start(): Promise<void> {
    console.log(chalk.gray('Starting interactive session...\n'));
    
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      const line = input.trim();
      
      if (line === '') {
        this.rl.prompt();
        return;
      }
      
      try {
        await this.handleInput(line);
      } catch (error) {
        console.error(chalk.red('Error:'), error);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log(chalk.gray('\nGoodbye! 👋'));
      process.exit(0);
    });
  }
  
  private async handleInput(input: string): Promise<void> {
    // Handle commands
    if (input.startsWith('/')) {
      await this.handleCommand(input);
      return;
    }
    
    // Handle tool calls (starting with :)
    if (input.startsWith(':')) {
      await this.handleToolCall(input);
      return;
    }
    
    // Regular AI interaction
    await this.handleAIInteraction(input);
  }
  
  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    switch (cmd) {
      case 'help':
        this.showHelp();
        break;
      
      case 'status':
        this.showStatus();
        break;
      
      case 'tools':
        this.showTools();
        break;
      
      case 'memory':
        await this.handleMemoryCommand(args);
        break;
      
      case 'bridge':
        await this.handleBridgeCommand(args);
        break;
      
      case 'config':
        await this.handleConfigCommand(args);
        break;
      
      case 'quit':
      case 'exit':
        this.rl.close();
        break;
      
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type /help for available commands'));
    }
  }
  
  private async handleToolCall(input: string): Promise<void> {
    // Parse tool call syntax: :toolname param1=value1 param2=value2
    const parts = input.slice(1).split(' ');
    const toolName = parts[0];
    const params: Record<string, any> = {};
    
    for (let i = 1; i < parts.length; i++) {
      const param = parts[i];
      if (param.includes('=')) {
        const [key, value] = param.split('=');
        params[key] = value;
      }
    }
    
    console.log(chalk.blue(`Executing tool: ${toolName}`));
    
    const result = await this.context.tools.executeTool(
      { name: toolName, parameters: params },
      { sessionId: this.sessionId }
    );
    
    if (result.success) {
      console.log(chalk.green('✓ Tool executed successfully'));
      if (result.content) {
        console.log(result.content);
      }
    } else {
      console.log(chalk.red('✗ Tool execution failed'));
      console.log(chalk.red(result.error));
    }
  }
  
  private async handleAIInteraction(input: string): Promise<void> {
    console.log(chalk.blue('🤔 Thinking...'));
    
    try {
      // Store user input in memory
      await this.context.memory.addMessage('user', input, this.sessionId);
      
      // Check if orchestration is needed
      const needsOrchestration = await this.context.orchestrator.shouldOrchestrate(input);
      
      let response: string;
      
      if (needsOrchestration) {
        console.log(chalk.yellow('🔧 Planning workflow...'));
        response = await this.context.orchestrator.execute(input, {
          sessionId: this.sessionId,
          tools: this.context.tools,
          memory: this.context.memory
        });
      } else {
        // Direct LLM interaction
        const context = await this.context.memory.getContext(this.sessionId);
        const prompt = this.buildPrompt(input, context);
        
        const llmResponse = await this.context.llmManager.generate(prompt);
        response = llmResponse.content;
      }
      
      // Store AI response in memory
      await this.context.memory.addMessage('assistant', response, this.sessionId);
      
      // Display response
      console.log(chalk.cyan('🤖 Assistant:'));
      console.log(response);
      
    } catch (error) {
      console.error(chalk.red('Failed to process request:'), error);
    }
  }
  
  private buildPrompt(input: string, context: any): string {
    const systemPrompt = `You are Clodrep, a Claude-parity local AI assistant with access to powerful tools.

Available tools:
${this.context.tools.listTools().map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

You can execute tools by responding with JSON in this format:
{
  "tool_calls": [
    {
      "name": "ToolName",
      "parameters": { "param1": "value1" }
    }
  ]
}

Context from previous conversation:
${context ? JSON.stringify(context, null, 2) : 'No previous context'}

Guidelines:
- Be helpful, accurate, and concise
- Use tools when needed to complete tasks
- Explain your reasoning
- Ask for clarification if needed
- Respect security constraints`;

    return `${systemPrompt}\n\nUser: ${input}\n\nAssistant:`;
  }
  
  private showHelp(): void {
    console.log(chalk.bold('\n📚 Clodrep Local CLI Help\n'));
    
    console.log(chalk.blue('Commands:'));
    console.log('  /help          - Show this help message');
    console.log('  /status        - Show system status');
    console.log('  /tools         - List available tools');
    console.log('  /memory clear  - Clear session memory');
    console.log('  /bridge status - Show bridge status');
    console.log('  /config show   - Show configuration');
    console.log('  /quit          - Exit the CLI');
    
    console.log(chalk.blue('\nTool Calls:'));
    console.log('  :Read file_path=/path/to/file');
    console.log('  :Write file_path=/path/to/file content="Hello World"');
    console.log('  :Bash command="ls -la"');
    
    console.log(chalk.blue('\nAI Interaction:'));
    console.log('  Just type your request naturally and press Enter');
    console.log('  Example: "Analyze the code in src/index.ts"');
    console.log('  Example: "Create a function to calculate fibonacci numbers"');
    console.log();
  }
  
  private showStatus(): void {
    console.log(chalk.bold('\n📊 System Status\n'));
    
    console.log(chalk.blue('LLM Manager:'));
    const llmStatus = this.context.llmManager.getStatus();
    console.log(`  Mode: ${llmStatus.mode}`);
    console.log(`  Local Provider: ${llmStatus.localProvider ? '✓' : '✗'}`);
    console.log(`  Cloud Provider: ${llmStatus.cloudProvider ? '✓' : '✗'}`);
    console.log(`  Offline: ${llmStatus.offline ? 'Yes' : 'No'}`);
    
    console.log(chalk.blue('\nTools:'));
    const toolStatus = this.context.tools.getStatus();
    console.log(`  Available: ${toolStatus.toolCount}`);
    console.log(`  Security: ${toolStatus.security.auditLogging ? 'Enabled' : 'Disabled'}`);
    
    console.log(chalk.blue('\nMemory:'));
    const memoryStatus = this.context.memory.getStatus();
    console.log(`  Sessions: ${memoryStatus.activeSessions}`);
    console.log(`  Messages: ${memoryStatus.totalMessages}`);
    
    console.log(chalk.blue('\nSecurity:'));
    const securityStatus = this.context.security.getStatus();
    console.log(`  Sandbox Mode: ${securityStatus.sandboxMode}`);
    console.log(`  Audit Events: ${securityStatus.auditEvents}`);
    console.log();
  }
  
  private showTools(): void {
    console.log(chalk.bold('\n🔧 Available Tools\n'));
    
    const tools = this.context.tools.listTools();
    for (const tool of tools) {
      console.log(chalk.blue(`${tool.name}:`));
      console.log(`  ${tool.description}`);
      console.log();
    }
  }
  
  private async handleMemoryCommand(args: string[]): Promise<void> {
    const [action] = args;
    
    switch (action) {
      case 'clear':
        await this.context.memory.clearSession(this.sessionId);
        console.log(chalk.green('✓ Session memory cleared'));
        break;
      
      case 'status':
        const status = this.context.memory.getStatus();
        console.log(chalk.blue('Memory Status:'));
        console.log(JSON.stringify(status, null, 2));
        break;
      
      default:
        console.log(chalk.red('Unknown memory command. Available: clear, status'));
    }
  }
  
  private async handleBridgeCommand(args: string[]): Promise<void> {
    const [action] = args;
    
    switch (action) {
      case 'status':
        console.log(chalk.blue('Bridge Status:'));
        console.log('  Bridge server not implemented in this demo');
        break;
      
      default:
        console.log(chalk.red('Unknown bridge command. Available: status'));
    }
  }
  
  private async handleConfigCommand(args: string[]): Promise<void> {
    const [action] = args;
    
    switch (action) {
      case 'show':
        console.log(chalk.blue('Configuration:'));
        console.log(JSON.stringify(this.config, null, 2));
        break;
      
      default:
        console.log(chalk.red('Unknown config command. Available: show'));
    }
  }
  
  private setupSignalHandlers(): void {
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nReceived SIGINT. Use /quit to exit gracefully.'));
      this.rl.prompt();
    });
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}