/**
 * context.js
 * 
 * Context management for Claude command-line interface
 * Implements the --context flag and working directory context
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG_DIR = path.join(os.homedir(), '.pulser', 'config');
const CONTEXT_DIR = path.join(CONFIG_DIR, 'contexts');

// Ensure directories exist
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}
if (!fs.existsSync(CONTEXT_DIR)) {
  fs.mkdirSync(CONTEXT_DIR, { recursive: true });
}

/**
 * Save the current context to a named file
 * @param {string} name - Context name
 * @param {object} context - Context data to save
 * @returns {Promise<object>} - Result object
 */
async function saveContext(name, context) {
  try {
    const normalizedName = normalizeContextName(name);
    const contextPath = path.join(CONTEXT_DIR, `${normalizedName}.json`);
    
    // Add metadata to the context
    const contextToSave = {
      ...context,
      _meta: {
        name: normalizedName,
        savedAt: new Date().toISOString(),
        workingDirectory: process.cwd()
      }
    };
    
    await fs.promises.writeFile(
      contextPath, 
      JSON.stringify(contextToSave, null, 2)
    );
    
    return {
      success: true,
      message: `Context saved as '${normalizedName}'`,
      path: contextPath
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save context: ${error.message}`
    };
  }
}

/**
 * Load a saved context by name
 * @param {string} name - Context name
 * @returns {Promise<object>} - The loaded context or error
 */
async function loadContext(name) {
  try {
    const normalizedName = normalizeContextName(name);
    const contextPath = path.join(CONTEXT_DIR, `${normalizedName}.json`);
    
    if (!fs.existsSync(contextPath)) {
      return {
        success: false,
        error: `Context '${normalizedName}' not found`
      };
    }
    
    const contextData = await fs.promises.readFile(contextPath, 'utf8');
    const loadedContext = JSON.parse(contextData);
    
    // Check if working directory is specified and valid
    if (loadedContext._meta && loadedContext._meta.workingDirectory) {
      if (fs.existsSync(loadedContext._meta.workingDirectory)) {
        // In a full implementation, this would change the working directory
        console.log(`Note: Original working directory was: ${loadedContext._meta.workingDirectory}`);
      }
    }
    
    return {
      success: true,
      context: loadedContext,
      message: `Context '${normalizedName}' loaded successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load context: ${error.message}`
    };
  }
}

/**
 * List all available contexts
 * @returns {Promise<object>} - List of contexts
 */
async function listContexts() {
  try {
    const files = await fs.promises.readdir(CONTEXT_DIR);
    const contextFiles = files.filter(file => file.endsWith('.json'));
    
    const contexts = [];
    for (const file of contextFiles) {
      try {
        const contextPath = path.join(CONTEXT_DIR, file);
        const contextData = await fs.promises.readFile(contextPath, 'utf8');
        const context = JSON.parse(contextData);
        
        contexts.push({
          name: path.basename(file, '.json'),
          savedAt: context._meta?.savedAt || 'Unknown',
          workingDirectory: context._meta?.workingDirectory || 'Unknown'
        });
      } catch (err) {
        // Skip invalid context files
        console.warn(`Skipping invalid context file: ${file}`);
      }
    }
    
    return {
      success: true,
      contexts
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to list contexts: ${error.message}`
    };
  }
}

/**
 * Delete a saved context
 * @param {string} name - Context name
 * @returns {Promise<object>} - Result object
 */
async function deleteContext(name) {
  try {
    const normalizedName = normalizeContextName(name);
    const contextPath = path.join(CONTEXT_DIR, `${normalizedName}.json`);
    
    if (!fs.existsSync(contextPath)) {
      return {
        success: false,
        error: `Context '${normalizedName}' not found`
      };
    }
    
    await fs.promises.unlink(contextPath);
    
    return {
      success: true,
      message: `Context '${normalizedName}' deleted`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete context: ${error.message}`
    };
  }
}

/**
 * Apply a working directory context to a command
 * @param {string} command - Command to process
 * @param {string} contextPath - Working directory path
 * @returns {object} - Modified command and context
 */
function applyWorkingDirectoryContext(command, contextPath) {
  // In a full implementation, this would modify the command based on context
  // For now, we'll just return the command with context info
  
  return {
    command,
    workingDirectory: contextPath || process.cwd(),
    appliedContext: !!contextPath
  };
}

/**
 * Parse context flag from arguments
 * @param {string} input - Input string with possible --context flag
 * @returns {object} - Parsed command and context
 */
function parseContextFlag(input) {
  // Match --context=PATH or --context PATH pattern
  const contextRegex = /--context(?:=|\s+)(['"]?)(.*?)\1(?:\s|$)/;
  const match = input.match(contextRegex);
  
  if (match) {
    const contextPath = match[2];
    // Remove the flag from the input
    const cleanInput = input.replace(contextRegex, '').trim();
    
    return {
      command: cleanInput,
      contextPath
    };
  }
  
  return {
    command: input,
    contextPath: null
  };
}

/**
 * Normalize context name for file storage
 * @param {string} name - Context name
 * @returns {string} - Normalized name
 */
function normalizeContextName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

module.exports = {
  saveContext,
  loadContext,
  listContexts,
  deleteContext,
  applyWorkingDirectoryContext,
  parseContextFlag
};