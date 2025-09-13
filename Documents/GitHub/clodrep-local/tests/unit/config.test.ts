import { describe, it, expect } from 'vitest';
import { loadConfig, getConfigPath, DEFAULT_CONFIG } from '../../src/config/index.js';

describe('Configuration System', () => {
  it('should load default configuration', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.execution.mode).toBe('hybrid');
    expect(config.model.local.provider).toBe('ollama');
  });
  
  it('should return correct config path', () => {
    const path = getConfigPath();
    expect(path).toContain('.clodrep-local');
    expect(path).toContain('config.yaml');
  });
  
  it('should have valid default configuration', () => {
    expect(DEFAULT_CONFIG.execution.mode).toBeOneOf(['local', 'cloud-first', 'hybrid']);
    expect(DEFAULT_CONFIG.security.sandboxMode).toBeOneOf(['docker', 'chroot', 'none']);
    expect(DEFAULT_CONFIG.bridge.port).toBeTypeOf('number');
  });
});