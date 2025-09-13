#!/usr/bin/env node
/**
 * Filter Safety Implementation Helper
 * Automates common filter safety fixes across the codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common unsafe patterns and their fixes
const FILTER_SAFETY_PATTERNS = [
  {
    name: 'Unsafe length access',
    pattern: /(\w+)\.length/g,
    replacement: '$1?.length ?? 0',
    testPattern: /\?\./,
    files: ['*.tsx', '*.ts']
  },
  {
    name: 'Unsafe map calls',
    pattern: /(\w+)\.map\(/g,
    replacement: '($1 ?? []).map(',
    testPattern: /\?\?/,
    files: ['*.tsx', '*.ts']
  },
  {
    name: 'Unsafe filter calls',
    pattern: /(\w+)\.filter\(/g,
    replacement: '($1 ?? []).filter(',
    testPattern: /\?\?/,
    files: ['*.tsx', '*.ts']
  },
  {
    name: 'Array.from workarounds',
    pattern: /Array\.from\((\w+)\s*\|\|\s*\[\]\)/g,
    replacement: '$1 ?? []',
    files: ['*.tsx', '*.ts']
  },
  {
    name: 'Direct array access',
    pattern: /(\w+)\[(\d+)\]/g,
    replacement: '$1?.[$2]',
    testPattern: /\?\.\[/,
    files: ['*.tsx', '*.ts']
  }
];

// SQL injection prevention patterns
const SQL_SAFETY_PATTERNS = [
  {
    name: 'String concatenation in queries',
    pattern: /query\s*\+\s*['"`].*['"`]\s*\+\s*(\w+)/g,
    dangerous: true,
    message: 'SQL string concatenation detected - use parameterized queries'
  },
  {
    name: 'Template literals in SQL',
    pattern: /`.*\$\{[^}]+\}.*`.*(?:WHERE|AND|OR)/gi,
    dangerous: true,
    message: 'Template literal in SQL query - use parameterized queries'
  }
];

// Safe filter implementation templates
const SAFE_TEMPLATES = {
  filterToggle: `
const toggleFilter = useCallback((filterType: string, value: string) => {
  setFilters(prev => {
    const currentValues = prev?.[filterType] ?? [];
    const isSelected = currentValues.includes(value);
    
    return {
      ...prev,
      [filterType]: isSelected
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
    };
  });
}, []);`,

  filterReset: `
const resetFilters = useCallback(() => {
  setFilters(prevFilters => ({
    ...DEFAULT_FILTERS,
    // Preserve any runtime-specific fields
    _lastUpdated: Date.now()
  }));
}, []);`,

  safeArrayAccess: `
// Safe array access helper
const safeGet = <T>(arr: T[] | undefined, index: number): T | undefined => {
  return arr?.[index];
};`,

  errorBoundary: `
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FilterErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Filter error caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold">Filter Error</h3>
          <p className="text-red-600">The filters encountered an error and have been reset.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}`
};

// File scanner
function scanFiles(directory, patterns) {
  const issues = [];
  const files = glob.sync('**/*.{ts,tsx}', { 
    cwd: directory,
    ignore: ['node_modules/**', 'dist/**', 'build/**']
  });

  files.forEach(file => {
    const content = fs.readFileSync(path.join(directory, file), 'utf8');
    const lines = content.split('\n');

    patterns.forEach(pattern => {
      lines.forEach((line, index) => {
        if (pattern.pattern.test(line)) {
          // Check if already fixed
          if (pattern.testPattern && pattern.testPattern.test(line)) {
            return;
          }

          issues.push({
            file,
            line: index + 1,
            pattern: pattern.name,
            content: line.trim(),
            fix: pattern.replacement,
            dangerous: pattern.dangerous
          });
        }
      });
    });
  });

  return issues;
}

// Report generator
function generateReport(issues) {
  console.log('\n🔍 Filter Safety Scan Report');
  console.log('===========================\n');

  const byPattern = {};
  issues.forEach(issue => {
    if (!byPattern[issue.pattern]) {
      byPattern[issue.pattern] = [];
    }
    byPattern[issue.pattern].push(issue);
  });

  Object.keys(byPattern).forEach(pattern => {
    const patternIssues = byPattern[pattern];
    const isDangerous = patternIssues[0].dangerous;
    
    console.log(`${isDangerous ? '🚨' : '⚠️ '} ${pattern}: ${patternIssues.length} instances`);
    
    // Show first 3 examples
    patternIssues.slice(0, 3).forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      if (issue.fix) {
        console.log(`   ✅ Fix: Apply pattern '${issue.fix}'`);
      }
    });
    
    if (patternIssues.length > 3) {
      console.log(`   ... and ${patternIssues.length - 3} more\n`);
    } else {
      console.log('');
    }
  });

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total issues: ${issues.length}`);
  console.log(`Files affected: ${new Set(issues.map(i => i.file)).size}`);
  console.log(`Critical (SQL): ${issues.filter(i => i.dangerous).length}`);
  
  return issues;
}

// Auto-fix generator
function generateAutoFix(issues) {
  const fixes = {};
  
  issues.forEach(issue => {
    if (!issue.fix || issue.dangerous) return;
    
    if (!fixes[issue.file]) {
      fixes[issue.file] = [];
    }
    
    fixes[issue.file].push({
      line: issue.line,
      pattern: issue.pattern,
      original: issue.content,
      fixed: issue.content.replace(new RegExp(issue.pattern), issue.fix)
    });
  });
  
  // Generate fix script
  const fixScript = `#!/bin/bash
# Auto-generated filter safety fixes
# Review each change before applying!

echo "🔧 Applying filter safety fixes..."
`;

  Object.keys(fixes).forEach(file => {
    console.log(`\n📝 Fixes for ${file}:`);
    fixes[file].forEach(fix => {
      console.log(`   Line ${fix.line}: ${fix.pattern}`);
      console.log(`   - ${fix.original}`);
      console.log(`   + ${fix.fixed}`);
    });
  });
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || './src';
  
  console.log(`Scanning ${directory} for filter safety issues...`);
  
  // Scan for unsafe patterns
  const filterIssues = scanFiles(directory, FILTER_SAFETY_PATTERNS);
  const sqlIssues = scanFiles(directory, SQL_SAFETY_PATTERNS);
  
  const allIssues = [...filterIssues, ...sqlIssues];
  
  // Generate report
  generateReport(allIssues);
  
  // Generate fixes if requested
  if (args.includes('--fix')) {
    generateAutoFix(allIssues);
  }
  
  // Export templates if requested
  if (args.includes('--templates')) {
    console.log('\n📋 Safe Implementation Templates:');
    Object.keys(SAFE_TEMPLATES).forEach(name => {
      console.log(`\n=== ${name} ===`);
      console.log(SAFE_TEMPLATES[name]);
    });
  }
  
  // Exit with error if critical issues found
  if (sqlIssues.length > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}