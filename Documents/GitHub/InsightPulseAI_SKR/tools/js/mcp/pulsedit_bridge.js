#!/usr/bin/env node
/**
 * PulseEdit Code Execution Bridge
 * Part of the MCP stack - Provides code execution services
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const Docker = require('dockerode');

// Configuration
const MCP_SERVER = process.env.MCP_SERVER || 'ws://localhost:9090/mcp/code_execution';
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(__dirname, 'workspaces');
const MAX_EXECUTION_TIME = parseInt(process.env.MAX_EXECUTION_TIME || '10000'); // 10 seconds
const DEBUG = process.env.DEBUG === 'true';

// Initialize Docker client if available
let docker;
try {
  docker = new Docker();
} catch (error) {
  console.warn('Docker not available, will run code in current process (unsafe)');
}

// Create workspace directory if it doesn't exist
async function ensureWorkspaceExists() {
  try {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
    console.log(`Workspace directory ensured at ${WORKSPACE_ROOT}`);
  } catch (error) {
    console.error('Failed to create workspace directory:', error);
    process.exit(1);
  }
}

// Connect to MCP server
function connectToMCP() {
  const ws = new WebSocket(MCP_SERVER);
  
  ws.on('open', () => {
    console.log('Connected to MCP server');
    
    // Register with the MCP server
    ws.send(JSON.stringify({
      type: 'register',
      environment: 'code_execution',
      capabilities: {
        languages: ['javascript', 'python', 'html', 'css'],
        sandbox: docker ? true : false,
        file_operations: true,
        package_management: true
      }
    }));
  });
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      if (message.type === 'command') {
        // Process the command
        const result = await processCommand(message);
        
        // Send the result back
        ws.send(JSON.stringify({
          type: 'result',
          id: message.id,
          result
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message,
        stack: error.stack
      }));
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    setTimeout(connectToMCP, 5000); // Reconnect after 5 seconds
  });
  
  ws.on('close', () => {
    console.log('Disconnected from MCP server, reconnecting...');
    setTimeout(connectToMCP, 5000); // Reconnect after 5 seconds
  });
  
  return ws;
}

// Process a command from the MCP server
async function processCommand(message) {
  const { command, params } = message;
  
  switch (command) {
    case 'execute_code':
      return executeCode(params);
    
    case 'create_file':
      return createFile(params);
    
    case 'read_file':
      return readFile(params);
    
    case 'update_file':
      return updateFile(params);
    
    case 'delete_file':
      return deleteFile(params);
    
    case 'list_files':
      return listFiles(params);
    
    case 'install_package':
      return installPackage(params);
    
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Execute code in a secure environment
async function executeCode(params) {
  const { language, code, workspaceId } = params;
  
  if (!language) {
    throw new Error('Language is required');
  }
  
  if (!code) {
    throw new Error('Code is required');
  }
  
  // Create or get workspace directory
  const workspaceDir = path.join(WORKSPACE_ROOT, workspaceId || uuidv4());
  await fs.mkdir(workspaceDir, { recursive: true });
  
  // Choose execution strategy based on language
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return executeJavaScript(code, workspaceDir);
    
    case 'python':
    case 'py':
      return executePython(code, workspaceDir);
    
    case 'html':
      return { 
        type: 'preview', 
        content: code,
        message: 'HTML preview is available in the preview panel' 
      };
    
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// Execute JavaScript code
async function executeJavaScript(code, workspaceDir) {
  // Write code to a temporary file
  const filePath = path.join(workspaceDir, `script_${Date.now()}.js`);
  await fs.writeFile(filePath, code);
  
  if (docker) {
    // Execute in Docker container
    return executeInDocker('node:14-alpine', filePath, 'node', [filePath]);
  } else {
    // Execute in current process (unsafe)
    return new Promise((resolve, reject) => {
      const process = spawn('node', [filePath], {
        cwd: workspaceDir,
        timeout: MAX_EXECUTION_TIME
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        });
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Execute Python code
async function executePython(code, workspaceDir) {
  // Write code to a temporary file
  const filePath = path.join(workspaceDir, `script_${Date.now()}.py`);
  await fs.writeFile(filePath, code);
  
  if (docker) {
    // Execute in Docker container
    return executeInDocker('python:3.9-alpine', filePath, 'python', [filePath]);
  } else {
    // Execute in current process (unsafe)
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [filePath], {
        cwd: workspaceDir,
        timeout: MAX_EXECUTION_TIME
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        });
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Execute code in a Docker container
async function executeInDocker(image, filePath, command, args) {
  return new Promise((resolve, reject) => {
    // Pull the image if needed
    docker.pull(image, (pullError, stream) => {
      if (pullError) {
        console.warn(`Failed to pull image ${image}:`, pullError);
        // Continue anyway, it might be available locally
      }
      
      // Create and run container
      docker.run(
        image,
        args,
        [process.stdout, process.stderr],
        {
          Tty: false,
          Binds: [`${filePath}:/app/script:ro`],
          WorkingDir: '/app',
          Memory: 256 * 1024 * 1024, // 256 MB
          MemorySwap: 256 * 1024 * 1024, // 256 MB
          CpuShares: 128,
          NetworkDisabled: true,
          AutoRemove: true
        },
        (runError, data, container) => {
          if (runError) {
            reject(runError);
            return;
          }
          
          resolve({
            success: data.StatusCode === 0,
            stdout: data.stdout,
            stderr: data.stderr,
            exitCode: data.StatusCode
          });
        }
      );
    });
  });
}

// File operations
async function createFile(params) {
  const { workspaceId, filePath, content } = params;
  
  if (!workspaceId || !filePath) {
    throw new Error('workspaceId and filePath are required');
  }
  
  const fullPath = path.join(WORKSPACE_ROOT, workspaceId, filePath);
  const dirPath = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  await fs.mkdir(dirPath, { recursive: true });
  
  // Write file
  await fs.writeFile(fullPath, content || '');
  
  return {
    success: true,
    path: filePath
  };
}

async function readFile(params) {
  const { workspaceId, filePath } = params;
  
  if (!workspaceId || !filePath) {
    throw new Error('workspaceId and filePath are required');
  }
  
  const fullPath = path.join(WORKSPACE_ROOT, workspaceId, filePath);
  
  try {
    const content = await fs.readFile(fullPath, 'utf8');
    
    return {
      success: true,
      content,
      path: filePath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

async function updateFile(params) {
  const { workspaceId, filePath, content } = params;
  
  if (!workspaceId || !filePath) {
    throw new Error('workspaceId and filePath are required');
  }
  
  const fullPath = path.join(WORKSPACE_ROOT, workspaceId, filePath);
  
  try {
    await fs.writeFile(fullPath, content || '');
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

async function deleteFile(params) {
  const { workspaceId, filePath } = params;
  
  if (!workspaceId || !filePath) {
    throw new Error('workspaceId and filePath are required');
  }
  
  const fullPath = path.join(WORKSPACE_ROOT, workspaceId, filePath);
  
  try {
    await fs.unlink(fullPath);
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

async function listFiles(params) {
  const { workspaceId, directory } = params;
  
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  
  const fullPath = path.join(WORKSPACE_ROOT, workspaceId, directory || '');
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = [];
    
    for (const entry of entries) {
      const filePath = path.join(directory || '', entry.name);
      const fullFilePath = path.join(fullPath, entry.name);
      const stats = await fs.stat(fullFilePath);
      
      files.push({
        name: entry.name,
        path: filePath,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }
    
    return {
      success: true,
      path: directory || '',
      files
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${directory || '/'}`);
    }
    throw error;
  }
}

async function installPackage(params) {
  const { workspaceId, packageName, language } = params;
  
  if (!workspaceId || !packageName || !language) {
    throw new Error('workspaceId, packageName, and language are required');
  }
  
  const workspaceDir = path.join(WORKSPACE_ROOT, workspaceId);
  
  // Create workspace directory if it doesn't exist
  await fs.mkdir(workspaceDir, { recursive: true });
  
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return installNodePackage(packageName, workspaceDir);
    
    case 'python':
    case 'py':
      return installPythonPackage(packageName, workspaceDir);
    
    default:
      throw new Error(`Unsupported language for package installation: ${language}`);
  }
}

async function installNodePackage(packageName, workspaceDir) {
  // Check if package.json exists, create if not
  const packageJsonPath = path.join(workspaceDir, 'package.json');
  
  try {
    await fs.access(packageJsonPath);
  } catch (error) {
    // Create a basic package.json
    await fs.writeFile(packageJsonPath, JSON.stringify({
      name: 'pulsedit-project',
      version: '1.0.0',
      description: 'Created with PulseEdit',
      dependencies: {}
    }, null, 2));
  }
  
  // Install package
  return new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['install', packageName], {
      cwd: workspaceDir,
      timeout: 30000 // 30 seconds
    });
    
    let stdout = '';
    let stderr = '';
    
    npmProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    npmProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    npmProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        packageName
      });
    });
    
    npmProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function installPythonPackage(packageName, workspaceDir) {
  // Create venv if it doesn't exist
  const venvPath = path.join(workspaceDir, 'venv');
  
  try {
    await fs.access(venvPath);
  } catch (error) {
    // Create a virtual environment
    await new Promise((resolve, reject) => {
      const venvProcess = spawn('python3', ['-m', 'venv', 'venv'], {
        cwd: workspaceDir,
        timeout: 30000 // 30 seconds
      });
      
      venvProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create virtual environment, exit code ${code}`));
        }
      });
      
      venvProcess.on('error', reject);
    });
  }
  
  // Install package
  return new Promise((resolve, reject) => {
    const pipProcess = spawn(
      path.join(venvPath, 'bin', 'pip'),
      ['install', packageName],
      {
        cwd: workspaceDir,
        timeout: 30000 // 30 seconds
      }
    );
    
    let stdout = '';
    let stderr = '';
    
    pipProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pipProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pipProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        packageName
      });
    });
    
    pipProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Main function
async function main() {
  console.log('Starting PulseEdit Code Execution Bridge');
  await ensureWorkspaceExists();
  
  const ws = connectToMCP();
  
  // Handle exit
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    ws.close();
    process.exit(0);
  });
}

// Start the bridge
main().catch(error => {
  console.error('Failed to start PulseEdit bridge:', error);
  process.exit(1);
});