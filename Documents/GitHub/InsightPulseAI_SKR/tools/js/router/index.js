/**
 * router/index.js
 * 
 * Command routing system for Pulser CLI
 * Handles routing commands to appropriate agents with intelligent fallback
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { executeDeepSeekr1 } = require('../agents/deepseekr1');
const { executeClaudeAPI } = require('../agents/claude');
const { executeSystemCommand } = require('./system');

// Path to mode configuration
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const MODE_CONFIG_PATH = path.join(CONFIG_DIR, 'mode.json');

// Special commands that get handled directly
const SPECIAL_COMMANDS = {
  '/help': handleHelp,
  '/quit': handleQuit,
  '/exit': handleQuit,
  '/trust': handleTrust,
  '/clear': handleClear,
  '/system': handleSystem,
  '/mode': handleMode,
  '/status': handleStatus,
  '/model': handleModelOverride,
  '/cache': handleCacheToggle,
  '/apikey': handleApiKey,
};

// Default mode configuration
const DEFAULT_MODE_CONFIG = {
  mode: 'local', // Default to local mode
  lastChanged: new Date().toISOString()
};

/**
 * Load the current routing mode
 * @returns {Promise<object>} - The current mode configuration
 */
async function loadModeConfig() {
  try {
    // Ensure config directory exists
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }
    
    // Check if mode config exists
    try {
      const data = await fs.readFile(MODE_CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      // If file doesn't exist or can't be parsed, create default
      await saveModeConfig(DEFAULT_MODE_CONFIG);
      return DEFAULT_MODE_CONFIG;
    }
  } catch (error) {
    console.error('Error loading mode config:', error);
    return DEFAULT_MODE_CONFIG;
  }
}

/**
 * Save the current routing mode
 * @param {object} config - The mode configuration to save
 */
async function saveModeConfig(config) {
  try {
    await fs.writeFile(MODE_CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving mode config:', error);
  }
}

/**
 * Detect if a task is complex and should be routed to Claude
 * @param {string} prompt - The user prompt to analyze
 * @returns {boolean} - True if the task is complex
 */
function isComplexTask(prompt) {
  const complexPatterns = [
    /refactor/i, /explain this code/i, /summarize.*report/i,
    /generate.*test/i, /create.*architecture/i, /design.*system/i,
    /multimodal/i, /image.*caption/i, /diagram/i, /flowchart/i,
    /complex/i, /difficult/i, /advanced/i, /sophisticated/i,
    /neural network/i, /machine learning/i, /analyze.*data/i,
    /debug.*code/i, /troubleshoot.*issue/i, /optimize.*algorithm/i,
  ];
  
  return complexPatterns.some(pattern => pattern.test(prompt));
}

/**
 * Process a user command and route it to the appropriate handler
 * @param {string} input - User input to process
 * @param {object} context - Current session context
 * @returns {Promise<string>} - The response
 */
async function processCommand(input, context) {
  // Check if it's a special command
  if (input.startsWith('/')) {
    const commandParts = input.split(' ');
    const command = commandParts[0].toLowerCase();
    
    if (SPECIAL_COMMANDS[command]) {
      return await SPECIAL_COMMANDS[command](input, context);
    }
  }
  
  // Handle file path references with trust verification
  if (input.includes('/') && !input.startsWith('/')) {
    const potentialPath = input.trim();
    if (await isFilePath(potentialPath)) {
      return await handleFilePath(potentialPath, context);
    }
  }
  
  // Check if it's a media generation task
  try {
    // Dynamically import media router (to avoid circular dependencies)
    const { routeMediaTask } = require('./media_router');
    
    // Try to route as a media task
    const mediaResult = await routeMediaTask(input, { 
      overrideModel: context.overrideModel,
      noFallback: context.noFallback
    });
    
    // If it's a media task, return the formatted result
    if (mediaResult) {
      return mediaResult.formattedOutput;
    }
  } catch (error) {
    console.error('Media routing error:', error);
    // Continue with normal routing if media routing fails
  }
  
  // Get current mode
  const modeConfig = await loadModeConfig();
  const currentMode = modeConfig.mode;
  
  // Route the command based on mode and complexity
  try {
    return await routeCommand(input, context, currentMode);
  } catch (error) {
    // Handle Claude API authentication error silently
    if (error.message && error.message.includes('Claude API authentication failed')) {
      console.warn('⚠️ Claude API key missing or invalid. API tasks will be skipped until fixed.');
      
      // Log the error to a file
      try {
        const logDir = path.join(os.homedir(), '.pulser', 'logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, 'pulser_error.log');
        fs.appendFileSync(logFile, `${new Date().toISOString()} | Claude API key issue: ${error.message}\n`);
      } catch (logError) {
        // Silently fail if logging fails
      }
      
      // Return a more user-friendly message
      return 'I\'m unable to process complex requests right now. I\'ll continue working with basic functionality.';
    } else {
      // Log other errors normally
      console.error('Command routing error:', error);
      return `I apologize, but I encountered an error processing your request: ${error.message}`;
    }
  }
}

/**
 * Check if a task would benefit from prompt caching
 * @param {string} prompt - The prompt to check
 * @param {object} context - Current session context
 * @returns {boolean} - True if the task would benefit from caching
 */
function isCacheableTask(prompt, context) {
  // If prompt is very long, it's a good candidate for caching
  if (prompt.length > 1000) {
    return true;
  }
  
  // If there's a rich history in the context, caching can help
  if (context.history && context.history.length > 5) {
    return true;
  }
  
  // If the context has system messages or other large content
  if (context.system && context.system.length > 1000) {
    return true;
  }
  
  // Otherwise, not a good candidate
  return false;
}

/**
 * Route the command to the appropriate agent based on mode and complexity
 * @param {string} command - The command to route
 * @param {object} context - Current session context
 * @param {string} mode - The current routing mode
 * @returns {Promise<string>} - The response
 */
async function routeCommand(command, context, mode = 'local') {
  try {
    if (mode === 'local') {
      // Check if this is a task that would benefit from caching
      // If so, and if caching is enabled, use Claude API
      if (context.usePromptCache && isCacheableTask(command, context)) {
        console.log('📦 Task benefits from caching. Routing to Claude API with caching.');
        return await executeClaudeAPI(command, context, { useCache: true });
      }
      
      // Otherwise, use DeepSeekr1
      return await executeDeepSeekr1(command, context);
    } else if (mode === 'api') {
      // API mode: Always use Claude API with caching if enabled
      return await executeClaudeAPI(command, context);
    } else if (mode === 'adaptive') {
      // Adaptive mode: Route based on task complexity and caching needs
      const complexTask = isComplexTask(command);
      const cacheableTask = isCacheableTask(command, context);
      
      if (complexTask) {
        console.log('📝 Task detected as complex. Routing to Claude API.');
        return await executeClaudeAPI(command, context);
      } else if (context.usePromptCache && cacheableTask) {
        console.log('📦 Task benefits from caching. Routing to Claude API with caching.');
        return await executeClaudeAPI(command, context, { useCache: true });
      } else {
        console.log('📝 Using local DeepSeekr1 for standard task.');
        return await executeDeepSeekr1(command, context);
      }
    } else {
      // Demo mode or unknown mode: No actual API calls
      return simulateDemoResponse(command);
    }
  } catch (error) {
    // If local execution fails, fall back to Claude API
    if (mode === 'local' || mode === 'adaptive') {
      // Check if this is a Claude API authentication error
      if (error.message && error.message.includes('Claude API authentication failed')) {
        // Silently handle Claude API authentication errors
        console.warn('⚠️ Claude API key missing or invalid. Using DeepSeekr1 instead.');
        
        // Log the error to a file
        try {
          const logDir = path.join(os.homedir(), '.pulser', 'logs');
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
          
          const logFile = path.join(logDir, 'pulser_error.log');
          fs.appendFileSync(logFile, `${new Date().toISOString()} | Claude API key issue in fallback: ${error.message}\n`);
        } catch (logError) {
          // Silently fail if logging fails
        }
        
        // For adaptive mode, try falling back to DeepSeekr1 for complex tasks
        try {
          console.log('🔄 Trying DeepSeekr1 as fallback...');
          return await executeDeepSeekr1(command, context);
        } catch (deepSeekError) {
          // If even that fails, use a simple response
          return 'I apologize, but I\'m currently operating with limited capabilities. I\'ll continue to do my best with available resources.';
        }
      } else {
        // For other errors, try Claude API as a fallback
        console.warn("⚠️ Local execution failed. Falling back to Claude API.");
        try {
          return await executeClaudeAPI(command, context);
        } catch (fallbackError) {
          // If fallback is also a Claude API authentication issue, handle it silently
          if (fallbackError.message && fallbackError.message.includes('Claude API authentication failed')) {
            console.warn('⚠️ Claude API key missing or invalid. Using basic response.');
            return 'I\'m unable to process this request with my advanced capabilities right now. Please check your API configuration or try a simpler request.';
          }
          
          // For other fallback errors, throw a combined error
          throw new Error(`Both local and API execution failed. Original error: ${error.message}, Fallback error: ${fallbackError.message}`);
        }
      }
    }
    throw error;
  }
}

/**
 * Simulate a demo response (no API calls)
 * @param {string} command - The command to simulate a response for
 * @returns {string} - The simulated response
 */
function simulateDemoResponse(command) {
  return `This is a demo response to: "${command}"\n\nIn demo mode, no actual API calls are made. This is useful for testing the CLI interface without connecting to any AI services.`;
}

/**
 * Check if a string could be a file path
 * @param {string} str - String to check
 * @returns {Promise<boolean>} - True if it looks like a file path
 */
async function isFilePath(str) {
  try {
    const stats = await fs.stat(str);
    return stats.isFile() || stats.isDirectory();
  } catch (e) {
    return false;
  }
}

/**
 * Handle a file path reference
 * @param {string} filePath - The file path
 * @param {object} context - Current session context
 * @returns {Promise<string>} - The response
 */
async function handleFilePath(filePath, context) {
  const absolutePath = path.resolve(filePath);
  
  // Check if the directory is trusted
  const dirPath = path.dirname(absolutePath);
  if (!isTrustedDirectory(dirPath, context)) {
    return `The directory "${dirPath}" is not trusted. Please use '/trust ${dirPath}' to trust this directory.`;
  }
  
  try {
    const stats = await fs.stat(absolutePath);
    
    if (stats.isFile()) {
      const content = await fs.readFile(absolutePath, 'utf8');
      return `File content of ${absolutePath}:\n\n${content}`;
    } else if (stats.isDirectory()) {
      const files = await fs.readdir(absolutePath);
      return `Directory listing of ${absolutePath}:\n\n${files.join('\n')}`;
    }
  } catch (error) {
    return `Error accessing ${absolutePath}: ${error.message}`;
  }
}

/**
 * Check if a directory is trusted
 * @param {string} dirPath - Directory path to check
 * @param {object} context - Current session context
 * @returns {boolean} - True if trusted
 */
function isTrustedDirectory(dirPath, context) {
  const trustedDirs = context.trustedDirectories || [];
  return trustedDirs.some(dir => dirPath.startsWith(dir));
}

/**
 * Handle the /help command
 * @returns {Promise<string>} - Help text
 */
async function handleHelp() {
  // Get current mode
  const modeConfig = await loadModeConfig();
  
  return `
Pulser CLI Commands:

/help - Show this help message
/quit, /exit - Exit the Pulser CLI
/trust <directory> - Add a directory to trusted directories
/clear - Clear the screen
/system <command> - Execute a system command
/mode [local|api|adaptive|demo] - View or change routing mode (current: ${modeConfig.mode})
/status - Show current routing mode and connection status
/model [model_name|clear] - Override model selection for media generation
/cache [enable|disable|status] - Toggle prompt caching for Claude API
/apikey [set|validate|clear] - Manage Claude API key

Current routing mode: ${modeConfig.mode}

Media Generation Features:
- Generate images: "Generate an image of a mountain landscape"
- Create videos: "Create a short video of clouds moving"
- Edit images: "Edit this image to look like a watercolor painting"
- Custom models: Use "/model" to specify image/video generation models

API Setup:
- Set API key: "/apikey set YOUR_API_KEY"
- Validate key: "/apikey validate"
- Remove key: "/apikey clear"

Otherwise, type natural language queries to interact with Pulser.
  `.trim();
}

/**
 * Handle the /quit command
 * @returns {Promise<string>} - Quit message
 */
async function handleQuit() {
  console.log('Exiting Pulser CLI...');
  process.exit(0);
}

/**
 * Handle the /trust command
 * @param {string} input - Full command input
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Response message
 */
async function handleTrust(input, context) {
  const parts = input.split(' ');
  if (parts.length < 2) {
    return 'Usage: /trust <directory>';
  }
  
  const dirPath = parts.slice(1).join(' ');
  const absolutePath = path.resolve(dirPath);
  
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return `"${absolutePath}" is not a directory.`;
    }
    
    // Add to trusted directories
    const trustedDirs = context.trustedDirectories || [];
    if (!trustedDirs.includes(absolutePath)) {
      trustedDirs.push(absolutePath);
      context.trustedDirectories = trustedDirs;
    }
    
    return `Directory "${absolutePath}" is now trusted.`;
  } catch (error) {
    return `Error accessing "${absolutePath}": ${error.message}`;
  }
}

/**
 * Handle the /clear command
 * @returns {Promise<string>} - Empty string (screen cleared)
 */
async function handleClear() {
  console.clear();
  return '';
}

/**
 * Handle the /system command
 * @param {string} input - Full command input
 * @returns {Promise<string>} - Command output
 */
async function handleSystem(input, context) {
  const parts = input.split(' ');
  if (parts.length < 2) {
    return 'Usage: /system <command>';
  }
  
  const command = parts.slice(1).join(' ');
  return await executeSystemCommand(command);
}

/**
 * Handle the /mode command
 * @param {string} input - Full command input
 * @returns {Promise<string>} - Response message
 */
async function handleMode(input) {
  const parts = input.split(' ');
  const currentConfig = await loadModeConfig();
  
  // If no mode specified, show current mode
  if (parts.length < 2) {
    return `Current routing mode: ${currentConfig.mode}\n\nAvailable modes:\n- local: Use DeepSeekr1 locally\n- api: Use Claude API\n- adaptive: Auto-select based on task complexity\n- demo: Simulated responses (no API calls)`;
  }
  
  // Set new mode
  const newMode = parts[1].toLowerCase();
  const validModes = ['local', 'api', 'adaptive', 'demo'];
  
  if (!validModes.includes(newMode)) {
    return `Invalid mode: "${newMode}". Valid modes are: ${validModes.join(', ')}`;
  }
  
  // Update mode
  const updatedConfig = {
    ...currentConfig,
    mode: newMode,
    lastChanged: new Date().toISOString()
  };
  
  await saveModeConfig(updatedConfig);
  
  return `Routing mode changed to: ${newMode}`;
}

/**
 * Handle the /status command
 * @returns {Promise<string>} - Status information
 */
async function handleStatus() {
  const modeConfig = await loadModeConfig();
  
  // Get caching status if available
  let cachingInfo = "";
  try {
    const { getCachingStatus, getClaudeApiKey } = require('../agents/claude');
    const cachingStatus = await getCachingStatus();
    cachingInfo = `\nPrompt Caching: ${cachingStatus.enabled ? 'Enabled ✅' : 'Disabled ❌'}`;
    
    // Check for Claude API key status
    const apiKey = getClaudeApiKey();
    const needsApiKey = modeConfig.mode === 'api' || modeConfig.mode === 'adaptive';
    
    if (needsApiKey) {
      if (!apiKey) {
        cachingInfo += `\n\n⚠️  Claude API key missing. Use "/apikey set YOUR_API_KEY" to configure.`;
      } else {
        // Show masked version of key
        const maskedKey = apiKey.length <= 6 ? 
          '[too short to display safely]' : 
          `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`;
        
        cachingInfo += `\nClaude API Key: Present (${maskedKey})`;
      }
    }
  } catch (error) {
    // Ignore errors if Claude module not available
  }
  
  return `
Pulser CLI Status:

Routing Mode: ${modeConfig.mode}
Last Mode Change: ${new Date(modeConfig.lastChanged).toLocaleString()}
DeepSeekr1 API: http://localhost:8000${cachingInfo}
Config Directory: ${CONFIG_DIR}
  `.trim();
}

/**
 * Handle the /model command for overriding model selection
 * @param {string} input - Full command input
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Response message
 */
async function handleModelOverride(input, context) {
  const parts = input.split(' ');
  
  // If no model specified, show current override
  if (parts.length < 2) {
    const currentOverride = context.overrideModel || 'None';
    
    // Load available models from the media routing config
    try {
      const { loadRoutingConfig } = require('./media_router');
      const config = await loadRoutingConfig();
      const availableModels = new Set();
      
      if (config && config.routing_rules) {
        config.routing_rules.forEach(rule => {
          if (rule.route_to) availableModels.add(rule.route_to);
          if (rule.fallback) availableModels.add(rule.fallback);
        });
      }
      
      const modelsList = Array.from(availableModels).join(', ');
      
      return `Current model override: ${currentOverride}\n\nAvailable models: ${modelsList}\n\nUsage: /model <model_name> or /model clear`;
    } catch (error) {
      return `Current model override: ${currentOverride}\n\nUsage: /model <model_name> or /model clear`;
    }
  }
  
  // Get the specified model
  const modelName = parts[1].toLowerCase();
  
  // Clear the override
  if (modelName === 'clear' || modelName === 'none' || modelName === 'reset') {
    context.overrideModel = null;
    return 'Model override cleared. Using default routing logic.';
  }
  
  // Set the override
  context.overrideModel = modelName;
  return `Model override set to: ${modelName}. This will be used for all applicable tasks until cleared.`;
}

/**
 * Handle the /cache command for toggling prompt caching
 * @param {string} input - Full command input
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Response message
 */
async function handleCacheToggle(input, context) {
  try {
    // Dynamically import claude agent to avoid circular dependencies
    const { togglePromptCaching, getCachingStatus } = require('../agents/claude');
    
    const parts = input.split(' ');
    
    // If only /cache, show status
    if (parts.length < 2) {
      const status = await getCachingStatus();
      return `Prompt caching is currently ${status.enabled ? 'enabled' : 'disabled'}\n\nSettings:\n- Minimum chunk size: ${status.minChunkSize} characters\n- Maximum cached chunks: ${status.maxCachedChunks}\n\nUsage:\n- /cache enable - Turn on prompt caching\n- /cache disable - Turn off prompt caching\n- /cache status - Show current status`;
    }
    
    const action = parts[1].toLowerCase();
    
    if (action === 'enable' || action === 'on') {
      // Enable caching globally
      const result = await togglePromptCaching(true);
      
      // Also set in current context
      context.usePromptCache = true;
      
      return `${result}\n\nPrompt caching will be used for all Claude API calls. Long prompt sections will be cached to reduce token usage.`;
    } else if (action === 'disable' || action === 'off') {
      // Disable caching globally
      const result = await togglePromptCaching(false);
      
      // Also set in current context
      context.usePromptCache = false;
      
      return `${result}\n\nPrompt caching is now disabled. All prompts will be sent in full for each request.`;
    } else if (action === 'status') {
      const status = await getCachingStatus();
      
      // Calculate estimated token savings if enabled
      let savingsInfo = '';
      if (status.enabled && context.history && context.history.length > 0) {
        // Rough estimate of tokens saved based on history
        const cachedChars = context.history.reduce((sum, entry) => {
          if (entry.input && entry.input.length > status.minChunkSize) {
            return sum + entry.input.length;
          }
          return sum;
        }, 0);
        
        const estimatedTokens = Math.floor(cachedChars / 4);
        if (estimatedTokens > 0) {
          savingsInfo = `\n\nEstimated token savings this session: ~${estimatedTokens} tokens`;
        }
      }
      
      return `Prompt caching status:\n\n- Enabled: ${status.enabled ? 'Yes ✅' : 'No ❌'}\n- Minimum chunk size: ${status.minChunkSize} characters\n- Maximum cached chunks: ${status.maxCachedChunks}${savingsInfo}`;
    } else {
      return `Unknown cache command: "${action}"\n\nValid commands are:\n- /cache enable\n- /cache disable\n- /cache status`;
    }
  } catch (error) {
    return `Error handling cache command: ${error.message}`;
  }
}

/**
 * Handle the /apikey command for setting or validating Claude API key
 * @param {string} input - Full command input
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Response message
 */
async function handleApiKey(input, context) {
  try {
    const { getClaudeApiKey, saveClaudeApiKey, validateClaudeApiKey } = require('../agents/claude');
    
    const parts = input.split(' ');
    
    // If just "/apikey", show status and help
    if (parts.length < 2) {
      const currentKey = getClaudeApiKey();
      const hasKey = !!currentKey;
      
      let keyStatus = hasKey ? 
        "A Claude API key is configured" : 
        "No Claude API key is configured";
        
      if (hasKey) {
        // Show obfuscated version of key
        const visiblePart = 6; // Show first and last 3 characters
        const obfuscated = currentKey.length <= visiblePart ? 
          '[too short to display safely]' : 
          `${currentKey.substring(0, 3)}...${currentKey.substring(currentKey.length - 3)}`;
        
        keyStatus += ` (${obfuscated})`;
      }
      
      return `${keyStatus}\n\nUsage:\n- /apikey set YOUR_API_KEY - Set your Claude API key\n- /apikey validate - Test if your API key is valid\n- /apikey clear - Remove saved API key`;
    }
    
    const action = parts[1].toLowerCase();
    
    if (action === 'set') {
      // "/apikey set YOUR_API_KEY"
      if (parts.length < 3) {
        return 'Please provide an API key. Usage: /apikey set YOUR_API_KEY';
      }
      
      const apiKey = parts.slice(2).join(' ').trim();
      
      // Save the API key
      await saveClaudeApiKey(apiKey);
      
      // Try to validate it
      let validationMessage = '';
      try {
        const isValid = await validateClaudeApiKey(apiKey);
        validationMessage = isValid ? 
          '\n\nAPI key validated successfully! ✅' : 
          '\n\nWarning: API key was saved but validation failed. The key may be invalid or there may be connectivity issues. ⚠️';
      } catch (validationError) {
        validationMessage = '\n\nWarning: API key was saved but validation could not be completed. ⚠️';
      }
      
      return `Claude API key has been saved.${validationMessage}`;
    } else if (action === 'validate') {
      // "/apikey validate" - Test the current key
      const currentKey = getClaudeApiKey();
      
      if (!currentKey) {
        return 'No API key is configured. Use "/apikey set YOUR_API_KEY" to set one.';
      }
      
      const isValid = await validateClaudeApiKey(currentKey);
      
      return isValid ? 
        'API key validation successful! ✅ Your Claude API key is working correctly.' : 
        'API key validation failed. ❌ Your key may be invalid, expired, or there may be connectivity issues.';
    } else if (action === 'clear' || action === 'remove') {
      // "/apikey clear" - Remove the saved key
      const apiKeyPath = path.join(CONFIG_DIR, 'claude_api_key.txt');
      
      if (fs.existsSync(apiKeyPath)) {
        await fs.unlink(apiKeyPath);
        return 'Claude API key has been removed.';
      } else {
        return 'No API key file found.';
      }
    } else {
      return `Unknown apikey command: "${action}"\n\nValid commands are:\n- /apikey set YOUR_API_KEY\n- /apikey validate\n- /apikey clear`;
    }
  } catch (error) {
    return `Error handling API key command: ${error.message}`;
  }
}

module.exports = {
  processCommand,
  loadModeConfig,
  saveModeConfig,
};