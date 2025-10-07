import { Command, Flags } from '@oclif/core';
import { BridgeServer } from '../bridge/server.js';
import { ToolFramework } from '../tools/index.js';
import { SecurityGateway } from '../security/index.js';
import { loadConfig } from '../config/index.js';
import chalk from 'chalk';
import { randomBytes } from 'crypto';
export default class Bridge extends Command {
    static description = 'MCP bridge management commands';
    static examples = [
        '$ clodrep bridge start --port 3000',
        '$ clodrep bridge start --token $BRIDGE_SECRET',
        '$ clodrep bridge register --target web',
        '$ clodrep bridge status'
    ];
    static flags = {
        port: Flags.integer({
            char: 'p',
            description: 'bridge server port',
            default: 3000
        }),
        token: Flags.string({
            char: 't',
            description: 'bridge authentication token'
        }),
        target: Flags.string({
            description: 'registration target',
            options: ['web', 'desktop']
        })
    };
    static args = {
        action: {
            name: 'action',
            description: 'bridge action (start|status|register|token)',
            required: true
        }
    };
    async run() {
        const { args, flags } = await this.parse(Bridge);
        switch (args.action) {
            case 'start':
                await this.startBridge(flags.port, flags.token);
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'register':
                await this.registerWithClaude(flags.target || 'web');
                break;
            case 'token':
                this.generateToken();
                break;
            default:
                this.error(`Unknown action: ${args.action}`);
        }
    }
    async startBridge(port, token) {
        console.log(chalk.blue('🌉 Starting MCP Bridge Server...'));
        // Generate token if not provided
        const bridgeToken = token || process.env.BRIDGE_SECRET || randomBytes(16).toString('hex');
        process.env.BRIDGE_SECRET = bridgeToken;
        try {
            // Initialize components
            const config = await loadConfig();
            const security = new SecurityGateway(config);
            await security.initialize();
            const tools = new ToolFramework(config, security);
            await tools.initialize();
            // Start bridge server
            const bridge = new BridgeServer(config, tools, port);
            await bridge.start();
            console.log(chalk.green(`✓ MCP Bridge server running on port ${port}`));
            console.log(chalk.blue('Bridge Configuration:'));
            console.log(`  Port: ${port}`);
            console.log(`  Token: ${bridgeToken}`);
            console.log(`  Tools: ${tools.listTools().length}`);
            console.log(chalk.yellow('\n📋 Claude.ai Integration Setup:'));
            console.log(chalk.gray('1. Create a secure tunnel:'));
            console.log(chalk.white('   cloudflared tunnel run clodrep-bridge'));
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
            await new Promise(() => { });
        }
        catch (error) {
            console.error(chalk.red('Failed to start bridge:'), error);
            process.exit(1);
        }
    }
    async showStatus() {
        console.log(chalk.blue('🌉 MCP Bridge Status'));
        const token = process.env.BRIDGE_SECRET;
        if (token) {
            console.log(chalk.green('✓ Bridge token configured'));
            console.log(`  Token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}`);
        }
        else {
            console.log(chalk.red('✗ No bridge token configured'));
            console.log(chalk.gray('  Run: export BRIDGE_SECRET=$(openssl rand -hex 16)'));
        }
        // Try to ping local bridge
        try {
            const response = await fetch('http://localhost:3000/health');
            if (response.ok) {
                const data = await response.json();
                console.log(chalk.green('✓ Bridge server is running'));
                console.log(`  Port: 3000`);
                console.log(`  Tools: ${data.tools}`);
                console.log(`  Sessions: ${data.sessions}`);
            }
        }
        catch (error) {
            console.log(chalk.red('✗ Bridge server not reachable'));
            console.log(chalk.gray('  Start with: clodrep bridge start'));
        }
    }
    async registerWithClaude(target) {
        console.log(chalk.blue(`📝 Registering with Claude ${target}...`));
        const token = process.env.BRIDGE_SECRET;
        if (!token) {
            console.log(chalk.red('✗ No bridge token configured'));
            console.log(chalk.gray('  Run: export BRIDGE_SECRET=$(openssl rand -hex 16)'));
            return;
        }
        switch (target) {
            case 'web':
                console.log(chalk.yellow('Manual registration required for Claude.ai web:'));
                console.log(chalk.white('1. Go to Claude.ai → Settings → Custom Integrations'));
                console.log(chalk.white('2. Click "Add Integration"'));
                console.log(chalk.white('3. Fill in the form:'));
                console.log(chalk.gray('   Integration name: Clodrep Local Tools'));
                console.log(chalk.gray('   Integration URL: https://your-tunnel-url.com/mcp'));
                console.log(chalk.gray('   Custom header: X-Bridge-Token'));
                console.log(chalk.gray(`   Header value: ${token}`));
                break;
            case 'desktop':
                console.log(chalk.yellow('Claude Desktop MCP registration:'));
                console.log(chalk.white('Add to ~/.claude/mcp_servers.json:'));
                console.log(chalk.gray(JSON.stringify({
                    "clodrep-local": {
                        "command": "node",
                        "args": [process.cwd() + "/dist/bridge/server.js"],
                        "env": {
                            "BRIDGE_SECRET": token
                        }
                    }
                }, null, 2)));
                break;
            default:
                this.error(`Unknown target: ${target}`);
        }
    }
    generateToken() {
        const token = randomBytes(32).toString('hex');
        console.log(chalk.blue('🔐 Generated bridge token:'));
        console.log(chalk.white(token));
        console.log(chalk.gray('\nTo use this token:'));
        console.log(chalk.white(`export BRIDGE_SECRET=${token}`));
        console.log(chalk.white('clodrep bridge start --token $BRIDGE_SECRET'));
    }
}
//# sourceMappingURL=bridge.js.map