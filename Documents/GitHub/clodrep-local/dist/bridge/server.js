import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import chalk from 'chalk';
export class BridgeServer {
    app;
    server;
    wss;
    config;
    tools;
    port;
    sessions = new Map();
    connections = new Map();
    constructor(config, tools, port = 3000) {
        this.config = config;
        this.tools = tools;
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express.json());
        // CORS middleware
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            const allowedOrigins = this.config.bridge.security.allowedOrigins;
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                res.header('Access-Control-Allow-Credentials', 'true');
            }
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        // Authentication middleware
        this.app.use('/api', this.authenticateToken.bind(this));
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                version: '1.0.0-alpha',
                tools: this.tools.listTools().length,
                sessions: this.sessions.size
            });
        });
        // Tool schema endpoint
        this.app.get('/api/tools/schema', (req, res) => {
            res.json(this.tools.getToolSchema());
        });
        // List available tools
        this.app.get('/api/tools', (req, res) => {
            const tools = this.tools.listTools().map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }));
            res.json({ tools });
        });
        // Execute tool
        this.app.post('/api/tools/execute', async (req, res) => {
            try {
                const { tool, parameters, sessionId } = req.body;
                const result = await this.tools.executeTool({ name: tool, parameters }, { sessionId });
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: `Tool execution failed: ${error}`
                });
            }
        });
        // MCP protocol endpoint (Claude.ai integration)
        this.app.post('/mcp', async (req, res) => {
            try {
                const message = req.body;
                const response = await this.handleMCPMessage(message);
                res.json(response);
            }
            catch (error) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body.id,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: String(error)
                    }
                });
            }
        });
        // MCP metadata endpoint for Claude integration
        this.app.get('/metadata', (req, res) => {
            res.json({
                name: 'Clodrep Local Tools',
                version: '1.0.0',
                description: 'Local Claude-parity tools with secure execution',
                capabilities: ['tools', 'file_operations', 'bash_execution'],
                tools: this.tools.listTools().map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.parameters
                }))
            });
        });
        // Session management
        this.app.post('/api/sessions', (req, res) => {
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                clientId: req.body.clientId || 'unknown',
                tools: this.tools.listTools().map(t => t.name),
                created: new Date(),
                lastActivity: new Date()
            };
            this.sessions.set(sessionId, session);
            res.json({ sessionId, session });
        });
        this.app.get('/api/sessions/:id', (req, res) => {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json({ session });
        });
    }
    authenticateToken(req, res, next) {
        // Check for bridge token in custom header (for Claude.ai integration)
        const bridgeToken = req.headers['x-bridge-token'];
        if (bridgeToken) {
            const expectedToken = process.env.BRIDGE_SECRET || 'clodrep-local-bridge-secret';
            if (bridgeToken === expectedToken) {
                req.user = { type: 'bridge', clientId: 'claude-ai' };
                return next();
            }
            return res.sendStatus(401);
        }
        // Check for JWT in Authorization header (for API access)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.sendStatus(401);
        }
        try {
            const secret = process.env.BRIDGE_SECRET || 'clodrep-local-bridge-secret';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            next();
        }
        catch (error) {
            return res.sendStatus(403);
        }
    }
    async handleMCPMessage(message) {
        const messageId = message.id ?? 'unknown';
        switch (message.method) {
            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id: messageId,
                    result: {
                        tools: this.tools.listTools().map(tool => ({
                            name: tool.name,
                            description: tool.description,
                            inputSchema: tool.parameters
                        }))
                    }
                };
            case 'tools/call':
                const { name, arguments: args } = message.params;
                const result = await this.tools.executeTool({ name, parameters: args });
                return {
                    jsonrpc: '2.0',
                    id: messageId,
                    result: {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(result, null, 2)
                            }]
                    }
                };
            case 'ping':
                return {
                    jsonrpc: '2.0',
                    id: messageId,
                    result: { pong: true }
                };
            default:
                return {
                    jsonrpc: '2.0',
                    id: messageId,
                    error: {
                        code: -32601,
                        message: 'Method not found'
                    }
                };
        }
    }
    async start() {
        this.server = createServer(this.app);
        // Setup WebSocket server for real-time communication
        this.wss = new WebSocketServer({ server: this.server });
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateSessionId();
            this.connections.set(connectionId, ws);
            console.log(chalk.green(`New WebSocket connection: ${connectionId}`));
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    const response = await this.handleMCPMessage(message);
                    ws.send(JSON.stringify(response));
                }
                catch (error) {
                    ws.send(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32700,
                            message: 'Parse error'
                        }
                    }));
                }
            });
            ws.on('close', () => {
                this.connections.delete(connectionId);
                console.log(chalk.yellow(`WebSocket connection closed: ${connectionId}`));
            });
            // Send welcome message
            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'bridge/connected',
                params: {
                    connectionId,
                    tools: this.tools.listTools().length,
                    capabilities: ['tools', 'real-time']
                }
            }));
        });
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    console.log(chalk.green(`🌉 MCP Bridge server running on port ${this.port}`));
                    console.log(chalk.gray(`   HTTP API: http://localhost:${this.port}/api`));
                    console.log(chalk.gray(`   WebSocket: ws://localhost:${this.port}`));
                    console.log(chalk.gray(`   Health: http://localhost:${this.port}/health`));
                    resolve();
                }
            });
        });
    }
    async stop() {
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log(chalk.yellow('MCP Bridge server stopped'));
                    resolve();
                });
            });
        }
    }
    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
    getStatus() {
        return {
            running: !!this.server,
            port: this.port,
            sessions: this.sessions.size,
            connections: this.connections.size,
            tools: this.tools.listTools().length
        };
    }
    // Generate JWT token for authentication
    generateToken(clientId) {
        const secret = process.env.BRIDGE_SECRET || 'clodrep-local-bridge-secret';
        return jwt.sign({ clientId, issued: new Date().toISOString() }, secret, { expiresIn: '24h' });
    }
}
//# sourceMappingURL=server.js.map