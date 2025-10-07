/**
 * ClaudeErrorBoundary.js
 * 
 * Error handling system for Claude CLI that mimics Claude Code error structure
 * Provides standardized error formatting and logging
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define error types that match Claude Code CLI
const ERROR_TYPES = {
  API_ERROR: {
    code: 'API_ERROR',
    description: 'Error calling Claude API'
  },
  AUTHENTICATION_ERROR: {
    code: 'AUTH_ERROR',
    description: 'Authentication failure'
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    description: 'Input validation failed'
  },
  COMMAND_ERROR: {
    code: 'COMMAND_ERROR',
    description: 'Invalid command or arguments'
  },
  CONTEXT_ERROR: {
    code: 'CONTEXT_ERROR',
    description: 'Error with context management'
  },
  FILE_SYSTEM_ERROR: {
    code: 'FS_ERROR',
    description: 'File system operation failed'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    description: 'Network connection issue'
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    description: 'Operation timed out'
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    description: 'An unknown error occurred'
  }
};

// Log directory for error logs
const LOG_DIR = path.join(os.homedir(), '.pulser', 'logs');
const ERROR_LOG = path.join(LOG_DIR, 'claude_errors.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    // Silent fail if we can't create the directory
    console.error('Failed to create log directory:', err);
  }
}

/**
 * Map an error to a standardized error type
 * @param {Error} error - The error to map
 * @returns {object} - Standardized error type
 */
function mapErrorType(error) {
  // Check for specific error types based on message or code
  if (error.message?.includes('API key')) {
    return ERROR_TYPES.AUTHENTICATION_ERROR;
  }
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }
  if (error.message?.includes('network') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  if (error.message?.includes('file') || error.code?.startsWith('E') && ['ENOENT', 'EACCES', 'EPERM'].includes(error.code)) {
    return ERROR_TYPES.FILE_SYSTEM_ERROR;
  }
  if (error.message?.includes('invalid command') || error.message?.includes('usage:')) {
    return ERROR_TYPES.COMMAND_ERROR;
  }
  if (error.message?.includes('context')) {
    return ERROR_TYPES.CONTEXT_ERROR;
  }
  if (error.message?.includes('invalid') || error.message?.includes('validation')) {
    return ERROR_TYPES.VALIDATION_ERROR;
  }
  if (error.message?.includes('Claude API') || error.message?.includes('status code')) {
    return ERROR_TYPES.API_ERROR;
  }
  
  // Default to unknown error
  return ERROR_TYPES.UNKNOWN_ERROR;
}

/**
 * Log an error to the error log
 * @param {object} formattedError - The formatted error to log
 */
function logError(formattedError) {
  try {
    const logEntry = `[${formattedError.timestamp}][${formattedError.type}:${formattedError.code}] ${formattedError.message}\n`;
    fs.appendFileSync(ERROR_LOG, logEntry);
  } catch (err) {
    // Silent fail if we can't log
    console.error('Failed to log error:', err);
  }
}

/**
 * Handle an error and format it in a standardized way
 * @param {Error} error - The error to handle
 * @param {object} context - Current context information
 * @returns {object} - Formatted error object
 */
function handle(error, context = {}) {
  // Get the appropriate error type
  const errorType = mapErrorType(error);
  
  // Create a formatted error
  const formattedError = {
    type: errorType.code,
    code: errorType.code,
    message: error.message || errorType.description,
    timestamp: new Date().toISOString(),
    details: {
      originalError: error.toString(),
      stack: error.stack
    },
    context: {
      command: context.command,
      workingDirectory: context.workingDirectory || process.cwd(),
      mode: context.mode
    }
  };
  
  // Log the error
  logError(formattedError);
  
  // Prepare user-facing error message
  const userMessage = `[${errorType.code}] ${formattedError.message}`;
  
  // Return the result
  return {
    success: false,
    error: formattedError,
    userMessage
  };
}

/**
 * Format an error in a standardized way
 * @param {Error} error - The error to format
 * @param {object} errorType - The error type information
 * @param {object} context - Current context information
 * @returns {object} - Formatted error object
 */
function formatError(error, errorType, context = {}) {
  return {
    type: errorType.code,
    code: errorType.code,
    message: error.message || errorType.description,
    timestamp: new Date().toISOString(),
    details: {
      originalError: error.toString(),
      stack: error.stack
    },
    context: {
      command: context.command,
      workingDirectory: context.workingDirectory || process.cwd(),
      mode: context.mode
    }
  };
}

/**
 * Handle an error and format it in a standardized way
 * @param {Error} error - The error to handle
 * @param {object} context - Current context information
 * @returns {object} - Formatted error object
 */
function handle(error, context = {}) {
  // Get the appropriate error type
  const errorType = mapErrorType(error);
  
  // Create a formatted error
  const formattedError = formatError(error, errorType, context);
  
  // Log the error
  logError(formattedError);
  
  // Return the result
  return {
    success: false,
    error: formattedError,
    userMessage: `[${errorType.code}] ${formattedError.message}`
  };
}

module.exports = {
  handle,
  mapErrorType,
  formatError,
  logError,
  ERROR_TYPES
};