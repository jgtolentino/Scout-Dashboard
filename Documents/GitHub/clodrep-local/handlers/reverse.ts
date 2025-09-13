import type { Handler, SessionContext } from '../src/types.js';

export const id = 'reverse';

export const match = (line: string): boolean => {
  return /^reverse\b/i.test(line.trim());
};

export const prompt = (line: string, context: SessionContext): string => {
  const target = line.replace(/^reverse\s+/i, '').trim();
  
  return `You are a reverse engineering specialist. Analyze and reverse engineer:

${target}

Current directory: ${context.cwd}

Provide:
1. **Architecture Analysis**: System components, data flow, and key patterns
2. **Technology Stack**: Frameworks, libraries, and tools identified
3. **Implementation Approach**: Step-by-step recreation strategy
4. **Key Features**: Core functionality and business logic
5. **Technical Specifications**: APIs, data models, and interfaces

Focus on actionable insights for rebuilding or understanding the system. Include PRD-style requirements where applicable.`;
};

export default { id, match, prompt } as Handler;