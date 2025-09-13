import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BridgeServer } from '../../src/bridge/server.js';
import { ToolFramework } from '../../src/tools/index.js';
import { SecurityGateway } from '../../src/security/index.js';
import { DEFAULT_CONFIG } from '../../src/config/index.js';

describe('MCP Bridge Integration UAT', () => {
  let bridge: BridgeServer;
  let tools: ToolFramework;
  let security: SecurityGateway;
  const testPort = 3001;
  
  beforeAll(async () => {
    security = new SecurityGateway(DEFAULT_CONFIG);
    await security.initialize();
    
    tools = new ToolFramework(DEFAULT_CONFIG, security);
    await tools.initialize();
    
    bridge = new BridgeServer(DEFAULT_CONFIG, tools, testPort);
    await bridge.start();
  });
  
  afterAll(async () => {
    await bridge.stop();
  });
  
  it('UAT-80: Bridge server startup', async () => {
    const response = await fetch(`http://localhost:${testPort}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.tools).toBeGreaterThan(0);
  });
  
  it('UAT-81: Tool schema endpoint', async () => {
    // This would require authentication in a real implementation
    const response = await fetch(`http://localhost:${testPort}/api/tools/schema`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    // Expect 401 since we don't have valid auth
    expect(response.status).toBe(401);
  });
  
  it('UAT-83: MCP protocol support', async () => {
    const mcpMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'ping'
    };
    
    const response = await fetch(`http://localhost:${testPort}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(mcpMessage)
    });
    
    // Expect 401 since we don't have valid auth
    expect(response.status).toBe(401);
  });
}, 10000);