/**
 * Basic tests for the unified_genai_insights.js module
 * These are simplified tests that don't require complex mocking
 */

describe('Basic Dashboard Tests', () => {
  test('Verify package.json version is 2.2.1', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.version).toBe('2.2.1');
  });

  test('Verify unified_genai_insights.js version comment', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for version in header comment
    expect(fileContent).toMatch(/@version 2\.2\.1/);
  });
  
  test('Fixed critical issues documented in UNIFIED_GENAI_FIXES.md', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../UNIFIED_GENAI_FIXES.md');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check that the fixes document exists and contains key sections
    expect(fileContent).toContain('# Unified GenAI Insights Dashboard - Audit Fixes');
    expect(fileContent).toContain('## 1. Syntax & Runtime Errors');
    expect(fileContent).toContain('## 2. Element Selection & Event Binding');
    expect(fileContent).toContain('## 3. Security & XSS Prevention');
  });

  test('Key functions exist in unified_genai_insights.js', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for required function definitions
    expect(fileContent).toMatch(/function\s+init\s*\(\s*\)/);
    expect(fileContent).toMatch(/function\s+loadInsightsData\s*\(\s*\)/);
    expect(fileContent).toMatch(/function\s+createInsightCard\s*\(\s*insight\s*\)/);
    expect(fileContent).toMatch(/function\s+escapeHtml\s*\(\s*str\s*\)/);
  });
  
  test('No direct innerHTML injection with user data', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check that we're not using innerHTML directly with insight data
    // We should be creating DOM elements properly instead
    const directInjection = fileContent.match(/innerHTML\s*=\s*[\`\'\"]\s*\$\{insight\..*?\}/g);
    expect(directInjection).toBeNull();
  });
  
  test('DOM element caching is implemented', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for caching implementation
    expect(fileContent).toMatch(/cachedElements/);
    expect(fileContent).toMatch(/cacheElements\s*\(\s*\)/);
  });
  
  test('Properly handles interval clearing', () => {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for interval clearing logic
    expect(fileContent).toMatch(/clearInterval\s*\(/);
  });
});