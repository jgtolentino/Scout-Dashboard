export interface Config {
  model: {
    provider: string;
    name: string;
    temperature: number;
    max_tokens: number;
  };
  context_window: number;
  search_enabled: boolean;
  handlers: string[];
  security: {
    confirm_before_write: boolean;
    offline_mode: boolean;
  };
  logging: {
    level: string;
    max_logs: number;
    directory: string;
  };
  repl: {
    prompt_symbol: string;
    wrap_at: number;
    history_size: number;
  };
}

export interface Handler {
  id: string;
  match: (line: string) => boolean;
  prompt: (line: string, context: SessionContext) => string;
}

export interface SessionContext {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  files: Map<string, string>;
  cwd: string;
}

export interface LLMAdapter {
  generate: (prompt: string, options?: GenerateOptions) => Promise<string>;
  isAvailable: () => Promise<boolean>;
}

export interface GenerateOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}