import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
export class SessionLogger {
    logDir;
    sessionId;
    entries = [];
    constructor(logDirectory) {
        this.logDir = logDirectory || join(homedir(), '.clodrep-local', 'logs');
        this.sessionId = this.generateSessionId();
        // Ensure log directory exists
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }
    generateSessionId() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    }
    log(type, content, handler) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            content,
            handler: handler || ''
        };
        this.entries.push(entry);
        this.writeToFile();
    }
    writeToFile() {
        const markdownPath = join(this.logDir, `${this.sessionId}.md`);
        const jsonPath = join(this.logDir, `${this.sessionId}.json`);
        // Write Markdown log
        const markdown = this.generateMarkdown();
        writeFileSync(markdownPath, markdown, 'utf8');
        // Write JSON log
        const jsonData = {
            sessionId: this.sessionId,
            startTime: this.entries[0]?.timestamp,
            endTime: this.entries[this.entries.length - 1]?.timestamp,
            entries: this.entries
        };
        writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    }
    generateMarkdown() {
        let markdown = `# Clodrep Session ${this.sessionId}\\n\\n`;
        markdown += `**Started:** ${this.entries[0]?.timestamp || 'Unknown'}\\n`;
        markdown += `**Last Updated:** ${this.entries[this.entries.length - 1]?.timestamp || 'Unknown'}\\n\\n`;
        for (const entry of this.entries) {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            switch (entry.type) {
                case 'user':
                    markdown += `## [${time}] User\\n\\n`;
                    markdown += `${entry.content}\\n\\n`;
                    break;
                case 'assistant':
                    const handler = entry.handler ? ` (${entry.handler})` : '';
                    markdown += `## [${time}] Assistant${handler}\\n\\n`;
                    markdown += `${entry.content}\\n\\n`;
                    break;
                case 'system':
                    markdown += `> **System [${time}]:** ${entry.content}\\n\\n`;
                    break;
            }
        }
        return markdown;
    }
    getSessionPath() {
        return join(this.logDir, `${this.sessionId}.md`);
    }
}
//# sourceMappingURL=logger.js.map