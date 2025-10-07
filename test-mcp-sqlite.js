#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('🔍 Testing MCP SQLite Server Connection...');

const dbPath = '/Users/tbwa/Documents/GitHub/ces_intelligence.db';
console.log(`📁 Database path: ${dbPath}`);

// Test 1: Check if database is readable
try {
  const stats = fs.statSync(dbPath);
  console.log(`✅ Database file exists (${stats.size} bytes)`);
} catch (err) {
  console.error(`❌ Database file error: ${err.message}`);
  process.exit(1);
}

// Test 2: Start MCP server
console.log('🚀 Starting MCP SQLite server...');

const server = spawn('npx', ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', dbPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log(`📤 STDOUT: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log(`❌ STDERR: ${data.toString().trim()}`);
});

server.on('close', (code) => {
  console.log(`🔚 Server closed with code: ${code}`);
  if (code === 0) {
    console.log('✅ MCP server started successfully');
  } else {
    console.log('❌ MCP server failed to start');
    console.log('Error output:', errorOutput);
  }
});

server.on('error', (err) => {
  console.error(`❌ Server error: ${err.message}`);
});

// Test 3: Send a simple MCP message
setTimeout(() => {
  console.log('📨 Sending test message...');
  const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(testMessage) + '\n');
}, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('🛑 Stopping server...');
  server.kill();
  process.exit(0);
}, 10000);