export class MemorySystem {
    config;
    messages = new Map();
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        console.log('Memory system initialized');
    }
    async addMessage(role, content, sessionId) {
        if (!this.messages.has(sessionId)) {
            this.messages.set(sessionId, []);
        }
        const messages = this.messages.get(sessionId);
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
    async getContext(sessionId) {
        const messages = this.messages.get(sessionId) || [];
        return {
            messages: messages.slice(-this.config.memory.sessionHistory),
            sessionId
        };
    }
    async clearSession(sessionId) {
        this.messages.delete(sessionId);
    }
    getStatus() {
        return {
            activeSessions: this.messages.size,
            totalMessages: Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
        };
    }
}
//# sourceMappingURL=index.js.map