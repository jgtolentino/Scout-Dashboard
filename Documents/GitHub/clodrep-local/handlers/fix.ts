import type { Handler, SessionContext } from '../src/types.js';

export const id = 'fix';

export const match = (line: string): boolean => {
  return /^fix\b/i.test(line.trim());
};

export const prompt = (line: string, context: SessionContext): string => {
  const target = line.replace(/^fix\s+/i, '').trim();
  
  // Check if there are recent files in context
  const recentFiles = Array.from(context.files.entries())
    .slice(-3)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');
  
  return `You are a coding assistant. Fix the following issue:

${target}

${recentFiles ? `\nRecent files for context:\n${recentFiles}` : ''}

Current directory: ${context.cwd}

Provide:
1. Clear identification of the problem
2. Exact code fix with proper syntax
3. Brief explanation of the solution

Format your response with code blocks using appropriate language tags.`;
};

export default { id, match, prompt } as Handler;