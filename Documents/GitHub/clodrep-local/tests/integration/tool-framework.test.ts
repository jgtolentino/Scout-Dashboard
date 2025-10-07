import { describe, it, expect, beforeEach } from 'vitest';
import { ToolFramework } from '../../src/tools/index.js';
import { SecurityGateway } from '../../src/security/index.js';
import { DEFAULT_CONFIG } from '../../src/config/index.js';

describe('Tool Framework Integration', () => {
  let tools: ToolFramework;
  let security: SecurityGateway;
  
  beforeEach(async () => {
    security = new SecurityGateway(DEFAULT_CONFIG);
    await security.initialize();
    
    tools = new ToolFramework(DEFAULT_CONFIG, security);
    await tools.initialize();
  });
  
  it('should initialize with all core tools', async () => {
    const toolList = tools.listTools();
    expect(toolList.length).toBeGreaterThan(0);
    
    const toolNames = toolList.map(t => t.name);
    expect(toolNames).toContain('FileOperations');
    expect(toolNames).toContain('Execution');
    expect(toolNames).toContain('Web');
  });
  
  it('should execute Read tool successfully', async () => {
    const result = await tools.executeTool({
      name: 'FileOperations',
      parameters: {
        operation: 'Read',
        file_path: './package.json'
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('@clodrep/cli');
  });
  
  it('should handle invalid tool gracefully', async () => {
    const result = await tools.executeTool({
      name: 'NonExistentTool',
      parameters: {}
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});