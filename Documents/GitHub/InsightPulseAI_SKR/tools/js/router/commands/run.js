/**
 * commands/run.js
 * 
 * Command module for 'run' command in the Claude CLI
 * Executes a command through Claude with context support
 */

const { parseContextFlag, applyWorkingDirectoryContext } = require('../context');
const { executeClaudeAPI } = require('../../agents/claude');

/**
 * Execute the 'run' command
 * @param {string} args - Command-line arguments
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Command output
 */
async function execute(args, context) {
  // Parse context flag from arguments
  const { command, contextPath } = parseContextFlag(args);
  
  // Apply working directory context if specified
  const { command: finalCommand, workingDirectory } = applyWorkingDirectoryContext(command, contextPath);
  
  // Add working directory to context
  const enrichedContext = {
    ...context,
    workingDirectory
  };
  
  // Execute the command through Claude API
  try {
    return await executeClaudeAPI(finalCommand, enrichedContext);
  } catch (error) {
    throw new Error(`Failed to execute command: ${error.message}`);
  }
}

/**
 * Get help information for this command
 * @returns {string} - Help text
 */
function getHelp() {
  return `
Usage: run [options] <command>

Options:
  --context=<path>    Specify working directory context for the command

Examples:
  run 'echo Hello World'                     # Run a simple command
  run --context=/tmp 'ls -la'                # Run with specific context
  run 'describe function calculateTotal()'   # Analyze code
`;
}

module.exports = {
  execute,
  getHelp,
  flags: {
    context: {
      description: 'Specify working directory context',
      type: 'string',
      default: process.cwd()
    }
  }
};