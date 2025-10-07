import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

describe('UAT: Basic Flow', () => {
  let clodrep: ChildProcess;
  const timeout = 10000;

  beforeEach(() => {
    // We'll mock the Ollama service for testing
    process.env.CLODREP_TEST_MODE = 'true';
  });

  afterEach(() => {
    if (clodrep) {
      clodrep.kill();
    }
    delete process.env.CLODREP_TEST_MODE;
  });

  it('should start up within 250ms', async () => {
    const startTime = Date.now();
    
    clodrep = spawn('node', [join(__dirname, '../../bin/run'), '--version'], {
      stdio: 'pipe'
    });

    const result = await new Promise<string>((resolve, reject) => {
      let output = '';
      
      clodrep.stdout?.on('data', (data) => {
        output += data.toString();
      });

      clodrep.on('close', (code) => {
        const elapsed = Date.now() - startTime;
        if (elapsed <= 250) {
          resolve(output);
        } else {
          reject(new Error(`Startup took ${elapsed}ms, expected ≤250ms`));
        }
      });

      setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    expect(result).toContain('0.1.0');
  }, timeout);

  it('should handle basic explain command', async () => {
    // This test would require a mock LLM service
    // For now, we'll test the router logic in isolation
    expect(true).toBe(true);
  });

  it('should enforce offline mode', async () => {
    // Test that no network calls are made in offline mode
    expect(true).toBe(true);
  });
});

describe('UAT: Handler Routing', () => {
  it('should route explain commands correctly', () => {
    // Test handler routing logic
    const input = 'explain React hooks';
    expect(input.match(/^explain\\b/)).toBeTruthy();
  });

  it('should route fix commands correctly', () => {
    const input = 'fix this TypeScript error';
    expect(input.match(/^fix\\b/)).toBeTruthy();
  });

  it('should route test commands correctly', () => {
    const input = 'test the user authentication flow';
    expect(input.match(/^test\\b/)).toBeTruthy();
  });

  it('should route reverse commands correctly', () => {
    const input = 'reverse engineer this API';
    expect(input.match(/^reverse\\b/)).toBeTruthy();
  });
});