import { Command, Flags } from '@oclif/core';
import { loadConfig } from '../config/index.js';
import { REPLInterface } from '../core/repl.js';
import { LLMManager } from '../core/llm-manager.js';
import { ToolFramework } from '../tools/index.js';
import { MemorySystem } from '../memory/index.js';
import { SecurityGateway } from '../security/index.js';
import { WorkflowOrchestrator } from '../orchestration/index.js';
import chalk from 'chalk';
import ora from 'ora';
export default class ClodreptCommand extends Command {
    static description = 'Claude-Parity Local CLI with MCP Bridge Integration';
    static examples = [
        '$ clodrep',
        '$ clodrep --mode hybrid',
        '$ clodrep --model deepseek-coder:13b',
        '$ clodrep --offline'
    ];
    static flags = {
        mode: Flags.string({
            char: 'm',
            description: 'execution mode',
            options: ['local', 'cloud-first', 'hybrid'],
            default: 'hybrid'
        }),
        model: Flags.string({
            description: 'LLM model to use',
            default: 'deepseek-coder:13b-instruct'
        }),
        offline: Flags.boolean({
            description: 'force offline mode (no cloud fallback)',
            default: false
        }),
        bridge: Flags.boolean({
            description: 'start MCP bridge server',
            default: false
        }),
        port: Flags.integer({
            description: 'bridge server port',
            default: 3000
        }),
        debug: Flags.boolean({
            description: 'enable debug logging',
            default: false
        })
    };
    async run() {
        const { flags } = await this.parse(ClodreptCommand);
        const spinner = ora('Initializing Clodrep Local CLI...').start();
        try {
            // Load configuration
            spinner.text = 'Loading configuration...';
            const config = await loadConfig();
            // Override config with flags
            if (flags.mode)
                config.execution.mode = flags.mode;
            if (flags.model)
                config.model.local.name = flags.model;
            if (flags.offline)
                config.execution.offline = true;
            if (flags.debug)
                config.logging.level = 'debug';
            // Initialize core systems
            spinner.text = 'Initializing LLM manager...';
            const llmManager = new LLMManager(config);
            await llmManager.initialize();
            spinner.text = 'Initializing security gateway...';
            const security = new SecurityGateway(config);
            await security.initialize();
            spinner.text = 'Initializing tool framework...';
            const tools = new ToolFramework(config, security);
            await tools.initialize();
            spinner.text = 'Initializing memory system...';
            const memory = new MemorySystem(config);
            await memory.initialize();
            spinner.text = 'Initializing workflow orchestrator...';
            const orchestrator = new WorkflowOrchestrator(config, tools, memory);
            await orchestrator.initialize();
            // Start bridge server if requested
            if (flags.bridge) {
                spinner.text = 'Starting MCP bridge server...';
                const { BridgeServer } = await import('../bridge/server.js');
                const bridge = new BridgeServer(config, tools, flags.port);
                await bridge.start();
                console.log(chalk.green(`✓ MCP bridge server running on port ${flags.port}`));
            }
            spinner.succeed('Clodrep Local CLI initialized successfully');
            // Show banner
            this.showBanner(config, flags);
            // Start REPL
            const repl = new REPLInterface(config, {
                llmManager,
                tools,
                memory,
                orchestrator,
                security
            });
            await repl.start();
        }
        catch (error) {
            spinner.fail('Failed to initialize Clodrep Local CLI');
            console.error(chalk.red('Error:'), error);
            process.exit(1);
        }
    }
    showBanner(config, flags) {
        console.log(chalk.bold.magenta('\n🚀 Clodrep Local CLI'));
        console.log(chalk.gray('Claude-Parity Local Assistant with MCP Bridge\n'));
        console.log(chalk.blue('Configuration:'));
        console.log(chalk.gray(`  Mode: ${config.execution.mode}`));
        console.log(chalk.gray(`  Model: ${config.model.local.name}`));
        console.log(chalk.gray(`  Offline: ${config.execution.offline ? 'Yes' : 'No'}`));
        if (flags.bridge) {
            console.log(chalk.blue('\nBridge Status:'));
            console.log(chalk.green(`  ✓ MCP server running on port ${flags.port}`));
            console.log(chalk.gray('  Register with Claude: clodrep bridge register'));
        }
        console.log(chalk.blue('\nCommands:'));
        console.log(chalk.gray('  /help     - Show help'));
        console.log(chalk.gray('  /status   - Show system status'));
        console.log(chalk.gray('  /bridge   - Bridge management'));
        console.log(chalk.gray('  /tools    - List available tools'));
        console.log(chalk.gray('  /memory   - Memory management'));
        console.log(chalk.gray('  /quit     - Exit CLI'));
        console.log(chalk.green('\nReady! Type your request or use /help for assistance.\n'));
    }
}
//# sourceMappingURL=index.js.map