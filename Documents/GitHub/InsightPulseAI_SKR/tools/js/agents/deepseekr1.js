/**
 * agents/deepseekr1.js
 * 
 * Integration with DeepSeekr1 model for Pulser CLI
 */

const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Configuration file path
const CONFIG_PATH = path.join(os.homedir(), '.pulser_config.json');

// Default configuration
const DEFAULT_CONFIG = {
  api: {
    endpoint: 'http://localhost:8000/v1/chat/completions',
    timeout: 60000,
  },
  model: {
    name: 'deepseekr1-8k',
    temperature: 0.7,
    max_tokens: 1000,
  },
};

/**
 * Get configuration
 * @returns {object} - Configuration object
 */
function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  
  return DEFAULT_CONFIG;
}

/**
 * Execute a request using DeepSeekr1 model
 * @param {string} input - User input to process
 * @param {object} context - Current session context
 * @returns {Promise<string>} - Model response
 */
async function executeDeepSeekr1(input, context) {
  const config = getConfig();
  
  try {
    // Build message history
    const messages = buildMessages(input, context);
    
    // Make API request
    const response = await axios.post(
      config.api.endpoint,
      {
        model: config.model.name,
        messages,
        temperature: config.model.temperature,
        max_tokens: config.model.max_tokens,
      },
      {
        timeout: config.api.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Extract and return the response content
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }
    
    throw new Error('Invalid response format from API');
  } catch (error) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error(`Network error: ${error.message}. Is the API server running?`);
    }
    throw error;
  }
}

/**
 * Build message history from context
 * @param {string} input - Current user input
 * @param {object} context - Session context
 * @returns {Array} - Array of messages
 */
function buildMessages(input, context) {
  // System message
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Respond concisely and accurately to the user\'s questions.',
    },
  ];
  
  // Add context history (limited to last 10 exchanges)
  if (context.history && context.history.length > 0) {
    const recentHistory = context.history.slice(-10);
    
    for (const entry of recentHistory) {
      messages.push({ role: 'user', content: entry.input });
      if (entry.response) {
        messages.push({ role: 'assistant', content: entry.response });
      }
    }
  }
  
  // Add current input
  messages.push({ role: 'user', content: input });
  
  return messages;
}

module.exports = {
  executeDeepSeekr1,
};