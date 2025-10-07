import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { ClodreptConfig } from '../config/index.js';
import { ToolCall, ToolContext } from '../tools/index.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export class SecurityGateway {
  private config: ClodreptConfig;
  private auditLog: AuditEvent[] = [];
  
  constructor(config: ClodreptConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    // Ensure security directories exist
    const securityDir = join(this.config.logging.logDirectory, 'security');
    if (!existsSync(securityDir)) {
      mkdirSync(securityDir, { recursive: true });
    }
    
    console.log('Security gateway initialized');
  }
  
  isPathAllowed(path: string, operation: 'read' | 'write'): boolean {
    const absolutePath = resolve(path);
    
    // Check blocked paths first
    const blockedPaths = this.config.tools.fileAccess.blockedPaths;
    for (const blockedPath of blockedPaths) {
      const resolvedBlocked = resolve(blockedPath.replace('~', process.env.HOME || ''));
      if (absolutePath.startsWith(resolvedBlocked)) {
        this.logAuditEvent({
          type: 'path_access_denied',
          path: absolutePath,
          operation,
          reason: 'blocked_path',
          timestamp: new Date()
        });
        return false;
      }
    }
    
    // Check allowed paths
    const allowedPaths = operation === 'read' 
      ? this.config.tools.fileAccess.readPaths 
      : this.config.tools.fileAccess.writePaths;
    
    for (const allowedPath of allowedPaths) {
      const resolvedAllowed = resolve(allowedPath.replace('~', process.env.HOME || ''));
      if (absolutePath.startsWith(resolvedAllowed)) {
        this.logAuditEvent({
          type: 'path_access_granted',
          path: absolutePath,
          operation,
          timestamp: new Date()
        });
        return true;
      }
    }
    
    this.logAuditEvent({
      type: 'path_access_denied',
      path: absolutePath,
      operation,
      reason: 'not_in_allowed_paths',
      timestamp: new Date()
    });
    
    return false;
  }
  
  async validateToolCall(call: ToolCall, context: ToolContext): Promise<boolean> {
    this.logAuditEvent({
      type: 'tool_call_attempt',
      tool: call.name,
      parameters: call.parameters,
      timestamp: new Date()
    });
    
    // Check if tool is allowed
    const allowedTools = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'NotebookRead', 'Task'];
    if (!allowedTools.includes(call.name)) {
      this.logAuditEvent({
        type: 'tool_call_denied',
        tool: call.name,
        reason: 'tool_not_allowed',
        timestamp: new Date()
      });
      return false;
    }
    
    // Validate specific tool parameters
    switch (call.name) {
      case 'Bash':
        return await this.validateBashCommand(call.parameters.command);
      
      case 'Write':
      case 'Edit':
        if (this.config.security.confirmBeforeWrite) {
          const filePath = call.parameters.file_path || call.parameters.filePath;
          return await this.requestConfirmation(`Allow write to ${filePath}?`);
        }
        break;
      
      case 'WebFetch':
        return this.validateWebRequest(call.parameters.url);
    }
    
    this.logAuditEvent({
      type: 'tool_call_approved',
      tool: call.name,
      timestamp: new Date()
    });
    
    return true;
  }
  
  private async validateBashCommand(command: string): Promise<boolean> {
    // Check blocked commands
    for (const blocked of this.config.tools.execution.blockedCommands) {
      if (command.includes(blocked)) {
        this.logAuditEvent({
          type: 'command_blocked',
          command,
          reason: `contains_blocked_command: ${blocked}`,
          timestamp: new Date()
        });
        return false;
      }
    }
    
    // Check if command requires confirmation
    for (const requiresConfirm of this.config.tools.execution.requireConfirmation) {
      if (command.includes(requiresConfirm)) {
        const confirmed = await this.requestConfirmation(
          `Execute command containing '${requiresConfirm}': ${command}?`
        );
        if (!confirmed) {
          this.logAuditEvent({
            type: 'command_denied_by_user',
            command,
            timestamp: new Date()
          });
          return false;
        }
      }
    }
    
    // Check allowed commands (if not in sandbox mode)
    if (!this.config.tools.execution.sandbox) {
      const commandName = command.split(' ')[0];
      if (!this.config.tools.execution.allowedCommands.includes(commandName)) {
        this.logAuditEvent({
          type: 'command_not_allowed',
          command,
          commandName,
          timestamp: new Date()
        });
        return false;
      }
    }
    
    return true;
  }
  
  private validateWebRequest(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Check blocked domains
      for (const blocked of this.config.tools.network.blockedDomains) {
        if (blocked === '*' || domain.includes(blocked)) {
          this.logAuditEvent({
            type: 'web_request_blocked',
            url,
            domain,
            reason: `blocked_domain: ${blocked}`,
            timestamp: new Date()
          });
          return false;
        }
      }
      
      // Check allowed domains
      if (this.config.tools.network.allowedDomains.length > 0) {
        const isAllowed = this.config.tools.network.allowedDomains.some(allowed => 
          domain.includes(allowed)
        );
        
        if (!isAllowed) {
          this.logAuditEvent({
            type: 'web_request_blocked',
            url,
            domain,
            reason: 'domain_not_in_allowed_list',
            timestamp: new Date()
          });
          return false;
        }
      }
      
      this.logAuditEvent({
        type: 'web_request_allowed',
        url,
        domain,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      this.logAuditEvent({
        type: 'web_request_blocked',
        url,
        reason: 'invalid_url',
        error: String(error),
        timestamp: new Date()
      });
      return false;
    }
  }
  
  async requestConfirmation(message: string): Promise<boolean> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: chalk.yellow(`🔒 Security Confirmation: ${message}`),
          default: false
        }
      ]);
      
      this.logAuditEvent({
        type: 'user_confirmation',
        message,
        response: response.confirmed,
        timestamp: new Date()
      });
      
      return response.confirmed;
    } catch (error) {
      // In non-interactive environments, deny by default
      this.logAuditEvent({
        type: 'confirmation_failed',
        message,
        error: String(error),
        timestamp: new Date()
      });
      return false;
    }
  }
  
  async createBackup(filePath: string): Promise<void> {
    if (!existsSync(filePath)) {
      return;
    }
    
    const backupDir = join(dirname(filePath), '.clodrep-backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `${basename(filePath)}.${timestamp}.backup`);
    
    try {
      copyFileSync(filePath, backupPath);
      
      this.logAuditEvent({
        type: 'backup_created',
        originalPath: filePath,
        backupPath,
        timestamp: new Date()
      });
    } catch (error) {
      this.logAuditEvent({
        type: 'backup_failed',
        originalPath: filePath,
        error: String(error),
        timestamp: new Date()
      });
      throw error;
    }
  }
  
  private logAuditEvent(event: AuditEvent): void {
    this.auditLog.push(event);
    
    if (this.config.security.auditLogging) {
      // Log to console in debug mode
      if (this.config.logging.level === 'debug') {
        console.log(chalk.gray(`[AUDIT] ${event.type}:`), event);
      }
      
      // TODO: Implement file-based audit logging
    }
  }
  
  getAuditLog(): AuditEvent[] {
    return [...this.auditLog];
  }
  
  getStatus(): any {
    return {
      auditLogging: this.config.security.auditLogging,
      confirmBeforeWrite: this.config.security.confirmBeforeWrite,
      sandboxMode: this.config.security.sandboxMode,
      auditEvents: this.auditLog.length
    };
  }
}

interface AuditEvent {
  type: string;
  timestamp: Date;
  [key: string]: any;
}

function basename(path: string): string {
  return path.split('/').pop() || path;
}