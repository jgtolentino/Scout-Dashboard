// JavaScript code executor for PulseDev
// Listens for code execution commands and runs them in the container

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/home/pulsedev/workspace';
const MAX_OUTPUT_SIZE = process.env.MAX_OUTPUT_SIZE || 1024 * 1024; // 1MB
const DEFAULT_TIMEOUT = process.env.TIMEOUT || 30; // 30 seconds

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

// Helper function to generate a safe temporary filename
function getTempFilename(extension) {
    const hash = crypto.randomBytes(8).toString('hex');
    return path.join('/tmp', `pulsedev_${hash}.${extension}`);
}

// Execute code and return result
function executeCode(language, code, timeout = DEFAULT_TIMEOUT) {
    console.log(`Executing ${language} code (timeout: ${timeout}s)`);
    
    let extension, command;
    switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
            extension = 'js';
            command = 'node';
            break;
        case 'typescript':
        case 'ts':
            extension = 'ts';
            command = 'npx ts-node';
            break;
        case 'python':
        case 'py':
            extension = 'py';
            command = 'python3';
            break;
        case 'shell':
        case 'bash':
        case 'sh':
            extension = 'sh';
            command = 'bash';
            break;
        default:
            return {
                success: false,
                error: `Unsupported language: ${language}`,
                output: '',
                executionTime: 0
            };
    }
    
    // Write code to temp file
    const tempFile = getTempFilename(extension);
    fs.writeFileSync(tempFile, code);
    
    // Make shell scripts executable
    if (extension === 'sh') {
        fs.chmodSync(tempFile, '755');
    }
    
    // Execute with timeout
    const startTime = Date.now();
    let result = {
        success: false,
        error: null,
        output: '',
        executionTime: 0
    };
    
    try {
        // Execute with timeout using 'timeout' command
        const output = execSync(`timeout ${timeout}s ${command} ${tempFile}`, {
            encoding: 'utf8',
            maxBuffer: MAX_OUTPUT_SIZE
        });
        
        result.success = true;
        result.output = output;
    } catch (err) {
        result.success = false;
        
        if (err.status === 124) {
            result.error = `Execution timed out after ${timeout} seconds`;
        } else {
            result.error = err.message;
            result.output = err.stdout || '';
        }
    } finally {
        // Calculate execution time
        result.executionTime = (Date.now() - startTime) / 1000;
        
        // Clean up temp file
        try {
            fs.unlinkSync(tempFile);
        } catch (err) {
            console.error(`Failed to remove temp file ${tempFile}: ${err.message}`);
        }
    }
    
    return result;
}

// Execute file from workspace
function executeFile(filePath, timeout = DEFAULT_TIMEOUT) {
    console.log(`Executing file: ${filePath} (timeout: ${timeout}s)`);
    
    // Resolve path
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    
    // Verify path is within workspace for security
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return {
            success: false,
            error: 'Security error: Attempted to access file outside workspace',
            output: '',
            executionTime: 0
        };
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        return {
            success: false,
            error: `File not found: ${filePath}`,
            output: '',
            executionTime: 0
        };
    }
    
    // Determine language from extension
    const extension = path.extname(fullPath).toLowerCase().slice(1);
    let command;
    
    switch (extension) {
        case 'js':
            command = 'node';
            break;
        case 'ts':
            command = 'npx ts-node';
            break;
        case 'py':
            command = 'python3';
            break;
        case 'sh':
            command = 'bash';
            break;
        default:
            return {
                success: false,
                error: `Unsupported file type: ${extension}`,
                output: '',
                executionTime: 0
            };
    }
    
    // Execute with timeout
    const startTime = Date.now();
    let result = {
        success: false,
        error: null,
        output: '',
        executionTime: 0,
        fileName: filePath
    };
    
    try {
        // Execute with timeout using 'timeout' command
        const output = execSync(`timeout ${timeout}s ${command} ${fullPath}`, {
            encoding: 'utf8',
            maxBuffer: MAX_OUTPUT_SIZE
        });
        
        result.success = true;
        result.output = output;
    } catch (err) {
        result.success = false;
        
        if (err.status === 124) {
            result.error = `Execution timed out after ${timeout} seconds`;
        } else {
            result.error = err.message;
            result.output = err.stdout || '';
        }
    } finally {
        // Calculate execution time
        result.executionTime = (Date.now() - startTime) / 1000;
    }
    
    return result;
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length >= 2) {
    const command = args[0];
    
    if (command === 'exec-code') {
        const language = args[1];
        const code = fs.readFileSync(0, 'utf8'); // Read from stdin
        const timeout = args[2] ? parseInt(args[2], 10) : DEFAULT_TIMEOUT;
        
        const result = executeCode(language, code, timeout);
        console.log(JSON.stringify(result, null, 2));
    } else if (command === 'exec-file') {
        const filePath = args[1];
        const timeout = args[2] ? parseInt(args[2], 10) : DEFAULT_TIMEOUT;
        
        const result = executeFile(filePath, timeout);
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
} else {
    console.log('JavaScript executor for PulseDev');
    console.log('Usage:');
    console.log('  node executor.js exec-code <language> [timeout] < code.js');
    console.log('  node executor.js exec-file <filepath> [timeout]');
}