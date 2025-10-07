import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Handler, SessionContext } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TaskRouter {
  private handlers: Map<string, Handler> = new Map();

  async initialize(): Promise<void> {
    await this.loadHandlers();
  }

  private async loadHandlers(): Promise<void> {
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
        } catch (error) {
          console.warn(`Failed to load handler ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load handlers directory:', error);
    }
  }

  route(input: string, context: SessionContext): { handler: Handler; prompt: string } | null {
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
        prompt: (line: string, ctx: SessionContext) => `You are a helpful coding assistant. Help with: ${line}` 
      },
      prompt: `You are a helpful coding assistant. Help with: ${trimmed}`
    };
  }

  getAvailableHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}