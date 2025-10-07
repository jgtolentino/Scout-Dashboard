// VSCode MCP Bridge - Enables Claude to interact with VS Code via MCP
// Part of the Pulser MCP Stack for Creativity Applications

const vscode = require('vscode');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const DEFAULT_MCP_SERVER = 'ws://localhost:9876/mcp/vscode';
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.pulser_mcp_vscode.json');

/**
 * VSCode MCP Bridge extension class
 */
class VSCodeMCPBridge {
    constructor(context) {
        this.context = context;
        this.config = null;
        this.ws = null;
        this.connected = false;
        this.serverUrl = DEFAULT_MCP_SERVER;
        this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        this.status.text = 'MCP: Disconnected';
        this.status.tooltip = 'Pulser MCP Connection Status';
        this.status.command = 'pulser-mcp.toggleConnection';
        this.status.show();
        
        this.sessionId = null;
        this.environmentId = null;
        this.pendingCommands = new Map();
        this.commandTimeouts = new Map();
        this.messageHistory = [];
        this.maxHistory = 100;
        
        // Register commands
        this.registerCommands();
        
        // Load configuration
        this.loadConfig().then(() => {
            // Auto-connect if configured
            if (this.config && this.config.autoConnect) {
                this.connect();
            }
        });
    }
    
    /**
     * Register VSCode commands
     */
    registerCommands() {
        // Register commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('pulser-mcp.connect', () => this.connect()),
            vscode.commands.registerCommand('pulser-mcp.disconnect', () => this.disconnect()),
            vscode.commands.registerCommand('pulser-mcp.toggleConnection', () => this.toggleConnection()),
            vscode.commands.registerCommand('pulser-mcp.showConfig', () => this.showConfig()),
            vscode.commands.registerCommand('pulser-mcp.editConfig', () => this.editConfig()),
            vscode.commands.registerCommand('pulser-mcp.reloadConfig', () => this.reloadConfig()),
            vscode.commands.registerCommand('pulser-mcp.showLogs', () => this.showLogs()),
            vscode.commands.registerCommand('pulser-mcp.testCommand', () => this.testCommand())
        );
    }
    
    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            // Default config
            this.config = {
                serverUrl: DEFAULT_MCP_SERVER,
                autoConnect: false,
                authToken: '',
                showNotifications: true,
                logLevel: 'info',
                commandTimeout: 30000,  // 30 seconds
                enabledFeatures: ['fileAccess', 'terminalAccess', 'editorControl']
            };
            
            // Check if config file exists
            if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
                const configData = await fs.promises.readFile(DEFAULT_CONFIG_PATH, 'utf8');
                const fileConfig = JSON.parse(configData);
                
                // Merge with default config
                this.config = { ...this.config, ...fileConfig };
                
                // Update server URL
                this.serverUrl = this.config.serverUrl || DEFAULT_MCP_SERVER;
                
                this.log('Config loaded successfully');
            } else {
                // Create default config
                await this.saveConfig();
                this.log('Default config created');
            }
            
            return this.config;
        } catch (error) {
            this.log(`Error loading config: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`MCP: Error loading config: ${error.message}`);
            return this.config;
        }
    }
    
    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            await fs.promises.writeFile(
                DEFAULT_CONFIG_PATH,
                JSON.stringify(this.config, null, 2),
                'utf8'
            );
            this.log('Config saved successfully');
            return true;
        } catch (error) {
            this.log(`Error saving config: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`MCP: Error saving config: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Show configuration in editor
     */
    async showConfig() {
        try {
            const configFile = await vscode.workspace.openTextDocument(
                vscode.Uri.file(DEFAULT_CONFIG_PATH)
            );
            await vscode.window.showTextDocument(configFile);
        } catch (error) {
            vscode.window.showErrorMessage(`Error showing config: ${error.message}`);
        }
    }
    
    /**
     * Edit configuration via UI
     */
    async editConfig() {
        // Server URL
        const serverUrl = await vscode.window.showInputBox({
            prompt: 'MCP Server URL',
            value: this.config.serverUrl,
            placeHolder: DEFAULT_MCP_SERVER
        });
        
        if (serverUrl !== undefined) {
            this.config.serverUrl = serverUrl;
            this.serverUrl = serverUrl;
        }
        
        // Auto-connect
        const autoConnect = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Auto-connect on startup',
            canPickMany: false
        });
        
        if (autoConnect) {
            this.config.autoConnect = autoConnect === 'Yes';
        }
        
        // Auth token
        const authToken = await vscode.window.showInputBox({
            prompt: 'Auth Token (leave empty for none)',
            value: this.config.authToken,
            password: true
        });
        
        if (authToken !== undefined) {
            this.config.authToken = authToken;
        }
        
        // Show notifications
        const showNotifications = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Show notifications for commands',
            canPickMany: false
        });
        
        if (showNotifications) {
            this.config.showNotifications = showNotifications === 'Yes';
        }
        
        // Enable features
        const features = await vscode.window.showQuickPick(
            [
                { label: 'File Access', picked: this.config.enabledFeatures.includes('fileAccess'), feature: 'fileAccess' },
                { label: 'Terminal Access', picked: this.config.enabledFeatures.includes('terminalAccess'), feature: 'terminalAccess' },
                { label: 'Editor Control', picked: this.config.enabledFeatures.includes('editorControl'), feature: 'editorControl' },
                { label: 'Workspace Management', picked: this.config.enabledFeatures.includes('workspaceManagement'), feature: 'workspaceManagement' },
                { label: 'Extension Control', picked: this.config.enabledFeatures.includes('extensionControl'), feature: 'extensionControl' },
                { label: 'Debug Control', picked: this.config.enabledFeatures.includes('debugControl'), feature: 'debugControl' }
            ],
            {
                placeHolder: 'Enabled features',
                canPickMany: true
            }
        );
        
        if (features) {
            this.config.enabledFeatures = features.map(item => item.feature);
        }
        
        // Save config
        await this.saveConfig();
        vscode.window.showInformationMessage('MCP configuration updated');
    }
    
    /**
     * Reload configuration
     */
    async reloadConfig() {
        await this.loadConfig();
        vscode.window.showInformationMessage('MCP configuration reloaded');
    }
    
    /**
     * Connect to MCP server
     */
    connect() {
        if (this.connected || this.ws) {
            this.log('Already connected or connecting');
            return;
        }
        
        try {
            this.log(`Connecting to MCP server: ${this.serverUrl}`);
            this.status.text = 'MCP: Connecting...';
            
            // Setup WebSocket connection
            this.ws = new WebSocket(this.serverUrl);
            
            // Setup event handlers
            this.ws.on('open', () => this.onOpen());
            this.ws.on('message', (data) => this.onMessage(data));
            this.ws.on('error', (error) => this.onError(error));
            this.ws.on('close', (code, reason) => this.onClose(code, reason));
            
            return true;
        } catch (error) {
            this.log(`Connection error: ${error.message}`, 'error');
            this.status.text = 'MCP: Error';
            vscode.window.showErrorMessage(`MCP: Connection error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Disconnect from MCP server
     */
    disconnect() {
        if (!this.connected || !this.ws) {
            this.log('Not connected');
            return;
        }
        
        try {
            this.log('Disconnecting from MCP server');
            this.ws.close();
            
            // Clear any pending command timeouts
            for (const timeoutId of this.commandTimeouts.values()) {
                clearTimeout(timeoutId);
            }
            
            this.commandTimeouts.clear();
            this.pendingCommands.clear();
            
            return true;
        } catch (error) {
            this.log(`Disconnection error: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`MCP: Disconnection error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Toggle connection
     */
    toggleConnection() {
        if (this.connected) {
            return this.disconnect();
        } else {
            return this.connect();
        }
    }
    
    /**
     * WebSocket open event handler
     */
    onOpen() {
        this.connected = true;
        this.status.text = 'MCP: Connected';
        this.log('Connected to MCP server');
        
        // Register with server
        this.sendMessage({
            type: 'register',
            environment: 'vscode',
            version: vscode.version,
            capabilities: this.getCapabilities()
        });
        
        if (this.config.showNotifications) {
            vscode.window.showInformationMessage('Connected to MCP server');
        }
    }
    
    /**
     * WebSocket message event handler
     */
    onMessage(data) {
        try {
            const message = JSON.parse(data);
            this.log(`Received message: ${message.type}`);
            
            // Add to history
            this.addToHistory(message);
            
            // Process message based on type
            switch (message.type) {
                case 'welcome':
                    this.environmentId = message.env_id;
                    this.log(`Received environment ID: ${this.environmentId}`);
                    break;
                    
                case 'session_added':
                    this.sessionId = message.session_id;
                    this.log(`Added to session: ${this.sessionId}`);
                    break;
                    
                case 'session_closed':
                case 'session_expired':
                    this.log(`Session ended: ${message.session_id}`);
                    this.sessionId = null;
                    break;
                    
                case 'ping':
                    this.sendMessage({ type: 'pong' });
                    break;
                    
                case 'command':
                    this.handleCommand(message);
                    break;
                    
                case 'query':
                    this.handleQuery(message);
                    break;
                    
                case 'error':
                    this.log(`Server error: ${message.message}`, 'error');
                    if (this.config.showNotifications) {
                        vscode.window.showErrorMessage(`MCP: ${message.message}`);
                    }
                    break;
                    
                default:
                    this.log(`Unknown message type: ${message.type}`, 'warn');
            }
        } catch (error) {
            this.log(`Error processing message: ${error.message}`, 'error');
        }
    }
    
    /**
     * WebSocket error event handler
     */
    onError(error) {
        this.log(`WebSocket error: ${error.message}`, 'error');
        this.status.text = 'MCP: Error';
        
        if (this.config.showNotifications) {
            vscode.window.showErrorMessage(`MCP connection error: ${error.message}`);
        }
    }
    
    /**
     * WebSocket close event handler
     */
    onClose(code, reason) {
        this.connected = false;
        this.ws = null;
        this.status.text = 'MCP: Disconnected';
        
        this.log(`Disconnected from MCP server: ${code} - ${reason}`);
        
        // Clear any pending command timeouts
        for (const timeoutId of this.commandTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        
        this.commandTimeouts.clear();
        this.pendingCommands.clear();
        
        if (this.config.showNotifications) {
            vscode.window.showInformationMessage('Disconnected from MCP server');
        }
    }
    
    /**
     * Send message to MCP server
     */
    sendMessage(message) {
        if (!this.connected || !this.ws) {
            this.log('Cannot send message: not connected', 'warn');
            return false;
        }
        
        try {
            this.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            this.log(`Error sending message: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Handle command from MCP server
     */
    async handleCommand(message) {
        const { id, command, params } = message;
        
        // Validate command
        if (!command) {
            this.sendErrorResponse(id, 'Missing command parameter');
            return;
        }
        
        // Check if command is allowed
        if (!this.isCommandAllowed(command)) {
            this.sendErrorResponse(id, `Command not allowed: ${command}`);
            return;
        }
        
        // Add to pending commands
        this.pendingCommands.set(id, { command, params, timestamp: Date.now() });
        
        // Set command timeout
        const timeoutId = setTimeout(() => {
            if (this.pendingCommands.has(id)) {
                this.pendingCommands.delete(id);
                this.sendErrorResponse(id, `Command timed out: ${command}`);
            }
        }, this.config.commandTimeout || 30000);
        
        this.commandTimeouts.set(id, timeoutId);
        
        // Handle command based on type
        try {
            let result;
            switch (command) {
                case 'openFile':
                    result = await this.commandOpenFile(params);
                    break;
                
                case 'saveFile':
                    result = await this.commandSaveFile(params);
                    break;
                
                case 'createFile':
                    result = await this.commandCreateFile(params);
                    break;
                
                case 'deleteFile':
                    result = await this.commandDeleteFile(params);
                    break;
                
                case 'editFile':
                    result = await this.commandEditFile(params);
                    break;
                
                case 'insertText':
                    result = await this.commandInsertText(params);
                    break;
                
                case 'replaceText':
                    result = await this.commandReplaceText(params);
                    break;
                
                case 'executeCommand':
                    result = await this.commandExecuteCommand(params);
                    break;
                
                case 'runTerminalCommand':
                    result = await this.commandRunTerminalCommand(params);
                    break;
                
                case 'openTerminal':
                    result = await this.commandOpenTerminal(params);
                    break;
                
                case 'closeTerminal':
                    result = await this.commandCloseTerminal(params);
                    break;
                
                case 'selectText':
                    result = await this.commandSelectText(params);
                    break;
                
                case 'setCursorPosition':
                    result = await this.commandSetCursorPosition(params);
                    break;
                
                case 'openFolder':
                    result = await this.commandOpenFolder(params);
                    break;
                
                case 'findInFiles':
                    result = await this.commandFindInFiles(params);
                    break;
                
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
            
            // Send success response
            this.sendCommandResponse(id, result);
        } catch (error) {
            this.log(`Error executing command ${command}: ${error.message}`, 'error');
            this.sendErrorResponse(id, `Error executing command: ${error.message}`);
        } finally {
            // Clean up
            this.pendingCommands.delete(id);
            if (this.commandTimeouts.has(id)) {
                clearTimeout(this.commandTimeouts.get(id));
                this.commandTimeouts.delete(id);
            }
        }
    }
    
    /**
     * Handle query from MCP server
     */
    async handleQuery(message) {
        const { id, query, params } = message;
        
        // Validate query
        if (!query) {
            this.sendErrorResponse(id, 'Missing query parameter');
            return;
        }
        
        // Check if query is allowed
        if (!this.isQueryAllowed(query)) {
            this.sendErrorResponse(id, `Query not allowed: ${query}`);
            return;
        }
        
        // Add to pending commands
        this.pendingCommands.set(id, { query, params, timestamp: Date.now() });
        
        // Set query timeout
        const timeoutId = setTimeout(() => {
            if (this.pendingCommands.has(id)) {
                this.pendingCommands.delete(id);
                this.sendErrorResponse(id, `Query timed out: ${query}`);
            }
        }, this.config.commandTimeout || 30000);
        
        this.commandTimeouts.set(id, timeoutId);
        
        // Handle query based on type
        try {
            let result;
            switch (query) {
                case 'getActiveFile':
                    result = await this.queryGetActiveFile(params);
                    break;
                
                case 'getFileContent':
                    result = await this.queryGetFileContent(params);
                    break;
                
                case 'getOpenFiles':
                    result = await this.queryGetOpenFiles(params);
                    break;
                
                case 'getWorkspaceFolders':
                    result = await this.queryGetWorkspaceFolders(params);
                    break;
                
                case 'getSelection':
                    result = await this.queryGetSelection(params);
                    break;
                
                case 'getTerminals':
                    result = await this.queryGetTerminals(params);
                    break;
                
                case 'getEditorState':
                    result = await this.queryGetEditorState(params);
                    break;
                
                case 'getExtensions':
                    result = await this.queryGetExtensions(params);
                    break;
                
                default:
                    throw new Error(`Unknown query: ${query}`);
            }
            
            // Send success response
            this.sendQueryResponse(id, result);
        } catch (error) {
            this.log(`Error executing query ${query}: ${error.message}`, 'error');
            this.sendErrorResponse(id, `Error executing query: ${error.message}`);
        } finally {
            // Clean up
            this.pendingCommands.delete(id);
            if (this.commandTimeouts.has(id)) {
                clearTimeout(this.commandTimeouts.get(id));
                this.commandTimeouts.delete(id);
            }
        }
    }
    
    /**
     * Add message to history
     */
    addToHistory(message) {
        this.messageHistory.push({
            timestamp: Date.now(),
            message
        });
        
        // Trim history if needed
        if (this.messageHistory.length > this.maxHistory) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistory);
        }
    }
    
    /**
     * Get VSCode capabilities
     */
    getCapabilities() {
        return {
            version: vscode.version,
            platform: process.platform,
            enabledFeatures: this.config.enabledFeatures,
            supportsCommands: [
                'openFile', 'saveFile', 'createFile', 'deleteFile', 'editFile',
                'insertText', 'replaceText', 'executeCommand', 'runTerminalCommand',
                'openTerminal', 'closeTerminal', 'selectText', 'setCursorPosition',
                'openFolder', 'findInFiles'
            ],
            supportsQueries: [
                'getActiveFile', 'getFileContent', 'getOpenFiles', 'getWorkspaceFolders',
                'getSelection', 'getTerminals', 'getEditorState', 'getExtensions'
            ]
        };
    }
    
    /**
     * Send command response
     */
    sendCommandResponse(id, result) {
        this.sendMessage({
            type: 'command_result',
            id,
            status: 'success',
            result
        });
    }
    
    /**
     * Send query response
     */
    sendQueryResponse(id, result) {
        this.sendMessage({
            type: 'query_result',
            id,
            status: 'success',
            result
        });
    }
    
    /**
     * Send error response
     */
    sendErrorResponse(id, error) {
        this.sendMessage({
            type: 'error',
            id,
            status: 'error',
            error
        });
    }
    
    /**
     * Check if command is allowed based on enabled features
     */
    isCommandAllowed(command) {
        const { enabledFeatures } = this.config;
        
        switch (command) {
            case 'openFile':
            case 'saveFile':
            case 'createFile':
            case 'deleteFile':
            case 'editFile':
            case 'findInFiles':
                return enabledFeatures.includes('fileAccess');
                
            case 'insertText':
            case 'replaceText':
            case 'selectText':
            case 'setCursorPosition':
                return enabledFeatures.includes('editorControl');
                
            case 'runTerminalCommand':
            case 'openTerminal':
            case 'closeTerminal':
                return enabledFeatures.includes('terminalAccess');
                
            case 'openFolder':
                return enabledFeatures.includes('workspaceManagement');
                
            case 'executeCommand':
                return true;  // Always allow, but will verify the specific command
                
            default:
                return false;
        }
    }
    
    /**
     * Check if query is allowed based on enabled features
     */
    isQueryAllowed(query) {
        const { enabledFeatures } = this.config;
        
        switch (query) {
            case 'getFileContent':
                return enabledFeatures.includes('fileAccess');
                
            case 'getActiveFile':
            case 'getSelection':
            case 'getEditorState':
                return enabledFeatures.includes('editorControl');
                
            case 'getTerminals':
                return enabledFeatures.includes('terminalAccess');
                
            case 'getOpenFiles':
            case 'getWorkspaceFolders':
                return enabledFeatures.includes('workspaceManagement');
                
            case 'getExtensions':
                return enabledFeatures.includes('extensionControl');
                
            default:
                return false;
        }
    }
    
    /**
     * Show logs
     */
    showLogs() {
        // Create output channel if it doesn't exist
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('Pulser MCP');
        }
        
        // Show output channel
        this.outputChannel.show();
        
        // Clear output
        this.outputChannel.clear();
        
        // Add history
        this.outputChannel.appendLine('=== MCP Message History ===');
        for (const entry of this.messageHistory) {
            const timestamp = new Date(entry.timestamp).toISOString();
            const type = entry.message.type;
            this.outputChannel.appendLine(`[${timestamp}] ${type}`);
            this.outputChannel.appendLine(JSON.stringify(entry.message, null, 2));
            this.outputChannel.appendLine('---');
        }
    }
    
    /**
     * Log message
     */
    log(message, level = 'info') {
        // Create output channel if it doesn't exist
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('Pulser MCP');
        }
        
        // Check log level
        if (level === 'error' || 
            level === 'warn' || 
            (level === 'info' && this.config.logLevel !== 'debug') || 
            this.config.logLevel === 'debug') {
            
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Test command
     */
    async testCommand() {
        if (!this.connected) {
            vscode.window.showErrorMessage('MCP: Not connected to server');
            return;
        }
        
        // Get current editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('MCP: No active editor');
            return;
        }
        
        // Get editor state
        const result = await this.queryGetEditorState();
        
        // Show result
        vscode.window.showInformationMessage('MCP: Test command completed');
        
        // Show in output channel
        this.log('Test command result:');
        this.log(JSON.stringify(result, null, 2));
    }
    
    // Command implementations
    
    /**
     * Command: Open file
     */
    async commandOpenFile(params) {
        const { filePath, preview = false } = params;
        
        if (!filePath) {
            throw new Error('Missing filePath parameter');
        }
        
        // Open document
        const document = await vscode.workspace.openTextDocument(filePath);
        
        // Show document
        await vscode.window.showTextDocument(document, { preview });
        
        return {
            success: true,
            filePath,
            language: document.languageId,
            lineCount: document.lineCount
        };
    }
    
    /**
     * Command: Save file
     */
    async commandSaveFile(params) {
        const { filePath } = params;
        
        // Get active document if no filePath provided
        if (!filePath) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor');
            }
            
            // Save document
            await editor.document.save();
            
            return {
                success: true,
                filePath: editor.document.uri.fsPath
            };
        }
        
        // Find open document with matching path
        for (const document of vscode.workspace.textDocuments) {
            if (document.uri.fsPath === filePath) {
                await document.save();
                
                return {
                    success: true,
                    filePath
                };
            }
        }
        
        throw new Error(`File not open: ${filePath}`);
    }
    
    /**
     * Command: Create file
     */
    async commandCreateFile(params) {
        const { filePath, content = '' } = params;
        
        if (!filePath) {
            throw new Error('Missing filePath parameter');
        }
        
        // Check if file exists
        const fileUri = vscode.Uri.file(filePath);
        try {
            await vscode.workspace.fs.stat(fileUri);
            throw new Error(`File already exists: ${filePath}`);
        } catch (error) {
            // File doesn't exist, continue
        }
        
        // Create parent directories if needed
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Create file
        const contentBuffer = Buffer.from(content, 'utf8');
        await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
        
        // Open file
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
        
        return {
            success: true,
            filePath,
            created: true
        };
    }
    
    /**
     * Command: Delete file
     */
    async commandDeleteFile(params) {
        const { filePath } = params;
        
        if (!filePath) {
            throw new Error('Missing filePath parameter');
        }
        
        // Check if file exists
        const fileUri = vscode.Uri.file(filePath);
        try {
            await vscode.workspace.fs.stat(fileUri);
        } catch (error) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        // Delete file
        await vscode.workspace.fs.delete(fileUri, { useTrash: true });
        
        return {
            success: true,
            filePath,
            deleted: true
        };
    }
    
    /**
     * Command: Edit file
     */
    async commandEditFile(params) {
        const { filePath, changes } = params;
        
        if (!filePath) {
            throw new Error('Missing filePath parameter');
        }
        
        if (!changes || !Array.isArray(changes)) {
            throw new Error('Missing or invalid changes parameter');
        }
        
        // Open document if not already open
        let document;
        try {
            document = await vscode.workspace.openTextDocument(filePath);
        } catch (error) {
            throw new Error(`Failed to open file: ${filePath}`);
        }
        
        // Show document
        const editor = await vscode.window.showTextDocument(document);
        
        // Apply changes
        await editor.edit(editBuilder => {
            for (const change of changes) {
                const { range, text } = change;
                
                if (!range || !('start' in range) || !('end' in range)) {
                    throw new Error('Invalid range in change');
                }
                
                const start = new vscode.Position(range.start.line, range.start.character);
                const end = new vscode.Position(range.end.line, range.end.character);
                
                const vsRange = new vscode.Range(start, end);
                editBuilder.replace(vsRange, text || '');
            }
        });
        
        // Save document
        await document.save();
        
        return {
            success: true,
            filePath,
            changesApplied: changes.length
        };
    }
    
    /**
     * Command: Insert text
     */
    async commandInsertText(params) {
        const { text, position } = params;
        
        if (!text) {
            throw new Error('Missing text parameter');
        }
        
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }
        
        // Determine insertion position
        let insertPosition;
        if (position) {
            insertPosition = new vscode.Position(position.line, position.character);
        } else {
            // Use current cursor position
            insertPosition = editor.selection.active;
        }
        
        // Insert text
        await editor.edit(editBuilder => {
            editBuilder.insert(insertPosition, text);
        });
        
        return {
            success: true,
            insertedAt: {
                line: insertPosition.line,
                character: insertPosition.character
            },
            textLength: text.length
        };
    }
    
    /**
     * Command: Replace text
     */
    async commandReplaceText(params) {
        const { text, selection, searchText, replaceAll = false } = params;
        
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }
        
        // Determine replacement range
        let replaceRange;
        if (selection) {
            // Use provided selection
            const start = new vscode.Position(selection.start.line, selection.start.character);
            const end = new vscode.Position(selection.end.line, selection.end.character);
            replaceRange = new vscode.Range(start, end);
            
            // Replace text
            await editor.edit(editBuilder => {
                editBuilder.replace(replaceRange, text || '');
            });
            
            return {
                success: true,
                replacedRange: {
                    start: { line: start.line, character: start.character },
                    end: { line: end.line, character: end.character }
                },
                replacementLength: text.length
            };
        } else if (searchText) {
            // Search and replace
            const document = editor.document;
            const documentText = document.getText();
            
            // Find all instances
            const instances = [];
            let searchIndex = 0;
            while (true) {
                const index = documentText.indexOf(searchText, searchIndex);
                if (index === -1) break;
                
                const startPos = document.positionAt(index);
                const endPos = document.positionAt(index + searchText.length);
                instances.push(new vscode.Range(startPos, endPos));
                
                searchIndex = index + searchText.length;
                
                // If not replacing all, stop after finding first instance
                if (!replaceAll) break;
            }
            
            // Check if any instances found
            if (instances.length === 0) {
                throw new Error(`Search text not found: ${searchText}`);
            }
            
            // Replace instances
            await editor.edit(editBuilder => {
                for (const range of instances) {
                    editBuilder.replace(range, text || '');
                }
            });
            
            return {
                success: true,
                replacedCount: instances.length,
                searchText,
                replacementLength: text.length
            };
        } else {
            throw new Error('Must provide either selection or searchText parameter');
        }
    }
    
    /**
     * Command: Execute VS Code command
     */
    async commandExecuteCommand(params) {
        const { command, args = [] } = params;
        
        if (!command) {
            throw new Error('Missing command parameter');
        }
        
        // Check if command is allowed
        const allowedCommands = [
            'editor.action.formatDocument',
            'editor.action.formatSelection',
            'editor.action.commentLine',
            'editor.action.indentLines',
            'editor.action.outdentLines',
            'editor.action.addCommentLine',
            'editor.action.removeCommentLine',
            'editor.action.insertLineAfter',
            'editor.action.insertLineBefore',
            'editor.action.moveLinesDownAction',
            'editor.action.moveLinesUpAction',
            'editor.action.copyLinesDownAction',
            'editor.action.copyLinesUpAction',
            'editor.action.sortLinesAscending',
            'editor.action.sortLinesDescending',
            'editor.action.trimTrailingWhitespace',
            'editor.fold',
            'editor.unfold',
            'editor.foldAll',
            'editor.unfoldAll',
            'workbench.action.files.save',
            'workbench.action.files.saveAll',
            'cursorUndo',
            'cursorRedo',
            'undo',
            'redo',
            'workbench.action.closeActiveEditor',
            'workbench.action.closeAllEditors',
            'workbench.action.nextEditor',
            'workbench.action.previousEditor',
            'workbench.action.splitEditor',
            'workbench.action.splitEditorRight',
            'workbench.action.splitEditorDown',
            'workbench.action.focusFirstEditorGroup',
            'workbench.action.focusSecondEditorGroup'
        ];
        
        if (!allowedCommands.includes(command)) {
            throw new Error(`Command not allowed: ${command}`);
        }
        
        // Execute command
        const result = await vscode.commands.executeCommand(command, ...args);
        
        return {
            success: true,
            command,
            result: result || null
        };
    }
    
    /**
     * Command: Run terminal command
     */
    async commandRunTerminalCommand(params) {
        const { command, terminalName = 'MCP Terminal' } = params;
        
        if (!command) {
            throw new Error('Missing command parameter');
        }
        
        // Find existing terminal or create new one
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        
        // Show terminal
        terminal.show();
        
        // Send command
        terminal.sendText(command);
        
        return {
            success: true,
            terminalName,
            command
        };
    }
    
    /**
     * Command: Open terminal
     */
    async commandOpenTerminal(params) {
        const { name = 'MCP Terminal', cwd } = params;
        
        // Create terminal options
        const options = {
            name
        };
        
        if (cwd) {
            options.cwd = cwd;
        }
        
        // Create terminal
        const terminal = vscode.window.createTerminal(options);
        terminal.show();
        
        return {
            success: true,
            terminalName: name,
            cwd: cwd || null
        };
    }
    
    /**
     * Command: Close terminal
     */
    async commandCloseTerminal(params) {
        const { name } = params;
        
        if (!name) {
            throw new Error('Missing name parameter');
        }
        
        // Find terminal
        const terminal = vscode.window.terminals.find(t => t.name === name);
        if (!terminal) {
            throw new Error(`Terminal not found: ${name}`);
        }
        
        // Dispose terminal
        terminal.dispose();
        
        return {
            success: true,
            terminalName: name
        };
    }
    
    /**
     * Command: Select text
     */
    async commandSelectText(params) {
        const { range } = params;
        
        if (!range || !range.start || !range.end) {
            throw new Error('Missing or invalid range parameter');
        }
        
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }
        
        // Create selection
        const start = new vscode.Position(range.start.line, range.start.character);
        const end = new vscode.Position(range.end.line, range.end.character);
        const selection = new vscode.Selection(start, end);
        
        // Set selection
        editor.selection = selection;
        
        // Reveal selection
        editor.revealRange(selection);
        
        return {
            success: true,
            selection: {
                start: { line: start.line, character: start.character },
                end: { line: end.line, character: end.character }
            }
        };
    }
    
    /**
     * Command: Set cursor position
     */
    async commandSetCursorPosition(params) {
        const { line, character } = params;
        
        if (line === undefined || character === undefined) {
            throw new Error('Missing line or character parameter');
        }
        
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }
        
        // Create position
        const position = new vscode.Position(line, character);
        
        // Set selection
        editor.selection = new vscode.Selection(position, position);
        
        // Reveal position
        editor.revealRange(new vscode.Range(position, position));
        
        return {
            success: true,
            position: { line, character }
        };
    }
    
    /**
     * Command: Open folder
     */
    async commandOpenFolder(params) {
        const { folderPath } = params;
        
        if (!folderPath) {
            throw new Error('Missing folderPath parameter');
        }
        
        // Open folder
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath));
        
        return {
            success: true,
            folderPath
        };
    }
    
    /**
     * Command: Find in files
     */
    async commandFindInFiles(params) {
        const { searchText, includePattern, excludePattern, maxResults = 100 } = params;
        
        if (!searchText) {
            throw new Error('Missing searchText parameter');
        }
        
        // Create search options
        const options = {
            maxResults
        };
        
        if (includePattern) {
            options.includes = includePattern;
        }
        
        if (excludePattern) {
            options.excludes = excludePattern;
        }
        
        // Execute search
        const results = await vscode.workspace.findTextInFiles({ pattern: searchText }, options);
        
        // Format results
        const formattedResults = [];
        for (const [uri, fileResult] of results.entries()) {
            const filePath = uri.fsPath;
            const matches = fileResult.matches.map(match => {
                const range = match.range;
                return {
                    line: range.start.line,
                    character: range.start.character,
                    text: match.text
                };
            });
            
            formattedResults.push({
                filePath,
                matchCount: matches.length,
                matches
            });
        }
        
        return {
            success: true,
            searchText,
            fileCount: formattedResults.length,
            results: formattedResults
        };
    }
    
    // Query implementations
    
    /**
     * Query: Get active file
     */
    async queryGetActiveFile() {
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return {
                activeFile: null
            };
        }
        
        // Get document
        const document = editor.document;
        
        return {
            activeFile: {
                filePath: document.uri.fsPath,
                language: document.languageId,
                lineCount: document.lineCount,
                selection: {
                    start: {
                        line: editor.selection.start.line,
                        character: editor.selection.start.character
                    },
                    end: {
                        line: editor.selection.end.line,
                        character: editor.selection.end.character
                    }
                }
            }
        };
    }
    
    /**
     * Query: Get file content
     */
    async queryGetFileContent(params) {
        const { filePath } = params;
        
        if (!filePath) {
            throw new Error('Missing filePath parameter');
        }
        
        try {
            // Open document
            const document = await vscode.workspace.openTextDocument(filePath);
            
            return {
                filePath,
                content: document.getText(),
                language: document.languageId,
                lineCount: document.lineCount
            };
        } catch (error) {
            throw new Error(`Failed to open file: ${filePath}`);
        }
    }
    
    /**
     * Query: Get open files
     */
    async queryGetOpenFiles() {
        const openFiles = vscode.workspace.textDocuments
            .filter(document => !document.isUntitled && document.uri.scheme === 'file')
            .map(document => ({
                filePath: document.uri.fsPath,
                language: document.languageId,
                lineCount: document.lineCount
            }));
        
        return {
            openFiles
        };
    }
    
    /**
     * Query: Get workspace folders
     */
    async queryGetWorkspaceFolders() {
        const folders = vscode.workspace.workspaceFolders || [];
        
        const workspaceFolders = folders.map(folder => ({
            name: folder.name,
            folderPath: folder.uri.fsPath
        }));
        
        return {
            workspaceFolders
        };
    }
    
    /**
     * Query: Get selection
     */
    async queryGetSelection() {
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }
        
        // Get selection
        const selection = editor.selection;
        
        // Get selected text
        const selectedText = editor.document.getText(selection);
        
        return {
            selection: {
                start: {
                    line: selection.start.line,
                    character: selection.start.character
                },
                end: {
                    line: selection.end.line,
                    character: selection.end.character
                }
            },
            selectedText,
            isMultiline: selection.start.line !== selection.end.line,
            isEmpty: selection.isEmpty
        };
    }
    
    /**
     * Query: Get terminals
     */
    async queryGetTerminals() {
        const terminals = vscode.window.terminals.map(terminal => ({
            name: terminal.name,
            processId: terminal.processId
        }));
        
        return {
            terminals
        };
    }
    
    /**
     * Query: Get editor state
     */
    async queryGetEditorState() {
        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return {
                activeEditor: null,
                openEditors: []
            };
        }
        
        // Get document
        const document = editor.document;
        
        // Get all visible editors
        const visibleEditors = vscode.window.visibleTextEditors.map(e => ({
            filePath: e.document.uri.fsPath,
            language: e.document.languageId,
            viewColumn: e.viewColumn,
            isActive: e === editor
        }));
        
        return {
            activeEditor: {
                filePath: document.uri.fsPath,
                language: document.languageId,
                lineCount: document.lineCount,
                selection: {
                    start: {
                        line: editor.selection.start.line,
                        character: editor.selection.start.character
                    },
                    end: {
                        line: editor.selection.end.line,
                        character: editor.selection.end.character
                    }
                },
                visibleRanges: editor.visibleRanges.map(range => ({
                    start: {
                        line: range.start.line,
                        character: range.start.character
                    },
                    end: {
                        line: range.end.line,
                        character: range.end.character
                    }
                }))
            },
            openEditors: visibleEditors
        };
    }
    
    /**
     * Query: Get extensions
     */
    async queryGetExtensions() {
        const extensions = vscode.extensions.all.map(extension => ({
            id: extension.id,
            isActive: extension.isActive,
            packageJSON: {
                name: extension.packageJSON.name,
                displayName: extension.packageJSON.displayName,
                description: extension.packageJSON.description,
                version: extension.packageJSON.version,
                publisher: extension.packageJSON.publisher
            }
        }));
        
        return {
            extensions
        };
    }
}

// Extension activation
function activate(context) {
    console.log('Pulser MCP Bridge extension is now active');
    
    // Create bridge
    const bridge = new VSCodeMCPBridge(context);
    
    // Store bridge in extension context
    context.subscriptions.push({
        dispose: () => {
            bridge.disconnect();
        }
    });
    
    return bridge;
}

// Extension deactivation
function deactivate() {
    console.log('Pulser MCP Bridge extension deactivated');
}

module.exports = {
    activate,
    deactivate
};