import type { Handler, SessionContext } from '../src/types.js';

export const id = 'test';

export const match = (line: string): boolean => {
  return /^test\b/i.test(line.trim());
};

export const prompt = (line: string, context: SessionContext): string => {
  const target = line.replace(/^test\s+/i, '').trim();
  
  const recentFiles = Array.from(context.files.entries())
    .slice(-2)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');
  
  return `You are a coding assistant. Create comprehensive tests for:

${target}

${recentFiles ? `\nCode context:\n${recentFiles}` : ''}

Current directory: ${context.cwd}

Provide:
1. Unit tests with appropriate test framework (Jest, Vitest, etc.)
2. Edge cases and error scenarios
3. Mocking strategies if needed
4. Clear test descriptions

Use modern testing patterns and best practices. Include setup/teardown if required.`;
};

export default { id, match, prompt } as Handler;