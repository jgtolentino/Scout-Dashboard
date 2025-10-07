import { Command, Flags } from '@oclif/core';
import { BridgeServer } from '../../bridge/server.js';
import { ToolFramework } from '../../tools/index.js';
import { SecurityGateway } from '../../security/index.js';
import { loadConfig } from '../../config/index.js';
import chalk from 'chalk';
import { randomBytes } from 'crypto';

export default class BridgeStart extends Command {
  static override description = 'Start MCP bridge server';
  
  static override examples = [
    '$ clodrep bridge start',
    '$ clodrep bridge start --port 3000',
    '$ clodrep bridge start --token $BRIDGE_SECRET'
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'bridge server port',
      default: 3000
    }),
    token: Flags.string({
      char: 't',
      description: 'bridge authentication token'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BridgeStart);
    
    console.log(chalk.blue('🌉 Starting MCP Bridge Server...'));
    
    // Generate token if not provided
    const bridgeToken = flags.token || process.env.BRIDGE_SECRET || randomBytes(16).toString('hex');
    process.env.BRIDGE_SECRET = bridgeToken;
    
    try {
      // Initialize components
      const config = await loadConfig();
      const security = new SecurityGateway(config);
      await security.initialize();
      
      const tools = new ToolFramework(config, security);
      await tools.initialize();
      
      // Start bridge server
      const bridge = new BridgeServer(config, tools, flags.port);
      await bridge.start();
      
      console.log(chalk.green(`✓ MCP Bridge server running on port ${flags.port}`));
      console.log(chalk.blue('Bridge Configuration:'));
      console.log(`  Port: ${flags.port}`);
      console.log(`  Token: ${bridgeToken}`);
      console.log(`  Tools: ${tools.listTools().length}`);
      
      console.log(chalk.yellow('\n📋 Claude.ai Integration Setup:'));
      console.log(chalk.gray('1. Create a secure tunnel:'));
      console.log(chalk.white('   cloudflared tunnel --url http://localhost:3000'));
      console.log(chalk.gray('   # or'));
      console.log(chalk.white('   ngrok http 3000'));
      
      console.log(chalk.gray('\n2. Add to Claude.ai Custom Integrations:'));
      console.log(chalk.white('   Integration name: Clodrep Local Tools'));
      console.log(chalk.white('   Integration URL: https://your-tunnel-url.com/mcp'));
      console.log(chalk.white('   Custom header: X-Bridge-Token'));
      console.log(chalk.white(`   Header value: ${bridgeToken}`));
      
      console.log(chalk.gray('\n3. Test with: curl https://your-tunnel-url.com/health'));
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Shutting down bridge server...'));
        process.exit(0);
      });
      
      // Keep alive
      await new Promise(() => {});
      
    } catch (error) {
      console.error(chalk.red('Failed to start bridge:'), error);
      process.exit(1);
    }
  }
}