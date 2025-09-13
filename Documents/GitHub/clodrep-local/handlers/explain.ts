import type { Handler, SessionContext } from '../src/types.js';

export const id = 'explain';

export const match = (line: string): boolean => {
  return /^explain\b/i.test(line.trim());
};

export const prompt = (line: string, context: SessionContext): string => {
  const target = line.replace(/^explain\s+/i, '').trim();
  
  return `You are a coding assistant. Explain the following in a clear, concise way:

${target}

Context:
- Current directory: ${context.cwd}
- Available files: ${Array.from(context.files.keys()).join(', ')}

Provide a clear explanation with practical examples where helpful. Focus on implementation details and practical usage.`;
};

export default { id, match, prompt } as Handler;