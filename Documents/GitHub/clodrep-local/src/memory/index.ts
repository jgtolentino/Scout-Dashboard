import { ClodreptConfig } from '../config/index.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sessionId: string;
}

export class MemorySystem {
  private config: ClodreptConfig;
  private messages: Map<string, Message[]> = new Map();
  
  constructor(config: ClodreptConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    console.log('Memory system initialized');
  }
  
  async addMessage(role: 'user' | 'assistant' | 'system', content: string, sessionId: string): Promise<void> {
    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, []);
    }
    
    const messages = this.messages.get(sessionId)!;
    messages.push({
      role,
      content,
      timestamp: new Date(),
      sessionId
    });
    
    // Keep only recent messages
    if (messages.length > this.config.memory.sessionHistory) {
      messages.splice(0, messages.length - this.config.memory.sessionHistory);
    }
  }
  
  async getContext(sessionId: string): Promise<any> {
    const messages = this.messages.get(sessionId) || [];
    return {
      messages: messages.slice(-this.config.memory.sessionHistory),
      sessionId
    };
  }
  
  async clearSession(sessionId: string): Promise<void> {
    this.messages.delete(sessionId);
  }
  
  getStatus(): any {
    return {
      activeSessions: this.messages.size,
      totalMessages: Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
    };
  }
}