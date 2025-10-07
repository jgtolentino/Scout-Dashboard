import readline from 'readline';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { TaskRouter } from './router.js';
export class REPL {
    rl;
    context;
    config;
    llm;
    router;
    constructor(config, llm) {
        this.config = config;
        this.llm = llm;
        this.router = new TaskRouter();
        this.context = {
            history: [],
            files: new Map(),
            cwd: process.cwd()
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.magenta(config.repl.prompt_symbol)
        });
    }
    async start() {
        await this.router.initialize();
        console.log(chalk.cyan('🤖 Clodrep-Local v0.1.0'));
        console.log(chalk.gray('Type /help for commands, /quit to exit'));
        console.log();
        this.rl.prompt();
        this.rl.on('line', async (input) => {
            await this.handleInput(input.trim());
            this.rl.prompt();
        });
        this.rl.on('close', () => {
            console.log(chalk.gray('\\nGoodbye!'));
            process.exit(0);
        });
    }
    async handleInput(input) {
        if (!input)
            return;
        // Handle special commands
        if (input.startsWith('/')) {
            await this.handleCommand(input);
            return;
        }
        // Handle file operations
        if (input.startsWith(':')) {
            await this.handleFileOperation(input);
            return;
        }
        // Add to history
        this.context.history.push({ role: 'user', content: input });
        // Trim history if too long
        if (this.context.history.length > this.config.repl.history_size) {
            this.context.history = this.context.history.slice(-this.config.repl.history_size);
        }
        try {
            // Route the input
            const routed = this.router.route(input, this.context);
            if (!routed) {
                console.log(chalk.red('No handler found for input'));
                return;
            }
            console.log(chalk.gray(`Using handler: ${routed.handler.id}`));
            // Generate response
            const response = await this.llm.generate(routed.prompt, {
                temperature: this.config.model.temperature,
                max_tokens: this.config.model.max_tokens
            });
            // Display response with word wrapping
            this.displayResponse(response);
            // Add to history
            this.context.history.push({ role: 'assistant', content: response });
        }
        catch (error) {
            console.log(chalk.red(`Error: ${error}`));
        }
    }
    async handleCommand(command) {
        const cmd = command.slice(1).toLowerCase();
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'reset':
                this.context.history = [];
                this.context.files.clear();
                console.log(chalk.yellow('Session reset'));
                break;
            case 'quit':
            case 'exit':
                this.rl.close();
                break;
            case 'handlers':
                console.log(chalk.cyan('Available handlers:'), this.router.getAvailableHandlers().join(', '));
                break;
            default:
                console.log(chalk.red(`Unknown command: ${command}`));
        }
    }
    async handleFileOperation(operation) {
        const parts = operation.split(' ');
        const op = parts[0].slice(1); // Remove ':'
        switch (op) {
            case 'read':
                if (parts.length < 2) {
                    console.log(chalk.red('Usage: :read <file_path>'));
                    return;
                }
                await this.readFile(parts[1]);
                break;
            case 'write':
                if (parts.length < 2) {
                    console.log(chalk.red('Usage: :write <file_path> <<EOF ... EOF'));
                    return;
                }
                console.log(chalk.yellow('Write operations require confirmation. Use /write command for secure writes.'));
                break;
            default:
                console.log(chalk.red(`Unknown file operation: ${operation}`));
        }
    }
    async readFile(filePath) {
        try {
            const resolvedPath = resolve(this.context.cwd, filePath);
            if (!existsSync(resolvedPath)) {
                console.log(chalk.red(`File not found: ${filePath}`));
                return;
            }
            const content = readFileSync(resolvedPath, 'utf8');
            this.context.files.set(filePath, content);
            console.log(chalk.green(`✓ Loaded file: ${filePath} (${content.length} chars)`));
        }
        catch (error) {
            console.log(chalk.red(`Failed to read file: ${error}`));
        }
    }
    displayResponse(response) {
        const wrapAt = this.config.repl.wrap_at;
        const lines = response.split('\\n');
        for (const line of lines) {
            if (line.length <= wrapAt) {
                console.log(line);
            }
            else {
                // Simple word wrapping
                const words = line.split(' ');
                let currentLine = '';
                for (const word of words) {
                    if ((currentLine + word).length <= wrapAt) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    }
                    else {
                        if (currentLine)
                            console.log(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine)
                    console.log(currentLine);
            }
        }
    }
    showHelp() {
        console.log(chalk.cyan('Clodrep-Local Commands:'));
        console.log();
        console.log(chalk.white('Task Commands:'));
        console.log('  explain <topic>     - Explain code, concepts, or technologies');
        console.log('  fix <issue>         - Fix code problems or errors');
        console.log('  test <target>       - Generate tests for code');
        console.log('  reverse <target>    - Reverse engineer systems or code');
        console.log();
        console.log(chalk.white('File Operations:'));
        console.log('  :read <file>        - Load file into context');
        console.log('  :write <file>       - Write content to file (with confirmation)');
        console.log();
        console.log(chalk.white('REPL Commands:'));
        console.log('  /help               - Show this help');
        console.log('  /status             - Show system status');
        console.log('  /handlers           - List available handlers');
        console.log('  /reset              - Clear session history');
        console.log('  /quit               - Exit REPL');
    }
    async showStatus() {
        const isLLMAvailable = await this.llm.isAvailable();
        console.log(chalk.cyan('System Status:'));
        console.log(`  Model: ${this.config.model.name}`);
        console.log(`  Provider: ${this.config.model.provider}`);
        console.log(`  LLM Available: ${isLLMAvailable ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`  Offline Mode: ${this.config.security.offline_mode ? chalk.green('✓') : chalk.yellow('✗')}`);
        console.log(`  History: ${this.context.history.length} items`);
        console.log(`  Files: ${this.context.files.size} loaded`);
        console.log(`  Working Dir: ${this.context.cwd}`);
    }
}
//# sourceMappingURL=repl.js.map