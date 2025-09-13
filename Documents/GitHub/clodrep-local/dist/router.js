import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class TaskRouter {
    handlers = new Map();
    async initialize() {
        await this.loadHandlers();
    }
    async loadHandlers() {
        const handlersDir = join(__dirname, '../handlers');
        try {
            const files = await readdir(handlersDir);
            const handlerFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.js'));
            for (const file of handlerFiles) {
                try {
                    const handlerPath = join(handlersDir, file);
                    const module = await import(handlerPath);
                    const handler = module.default || module;
                    if (handler.id && handler.match && handler.prompt) {
                        this.handlers.set(handler.id, handler);
                        console.log(`✓ Loaded handler: ${handler.id}`);
                    }
                }
                catch (error) {
                    console.warn(`Failed to load handler ${file}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Failed to load handlers directory:', error);
        }
    }
    route(input, context) {
        const trimmed = input.trim();
        // Find matching handler
        for (const handler of this.handlers.values()) {
            if (handler.match(trimmed)) {
                const prompt = handler.prompt(trimmed, context);
                return { handler, prompt };
            }
        }
        // Default handler for general queries
        return {
            handler: {
                id: 'default',
                match: () => true,
                prompt: (line, ctx) => `You are a helpful coding assistant. Help with: ${line}`
            },
            prompt: `You are a helpful coding assistant. Help with: ${trimmed}`
        };
    }
    getAvailableHandlers() {
        return Array.from(this.handlers.keys());
    }
}
//# sourceMappingURL=router.js.map