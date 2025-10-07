/**
 * Pulser API Connector
 * Handles connections to various LLM providers (Anthropic, OpenAI, local)
 */

import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// In ESM, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PulserApiConnector {
  constructor(options = {}) {
    this.provider = options.provider || 'anthropic';
    this.model = options.model || 'opus-20240229';
    this.apiKey = this.getApiKey(this.provider);
    this.thinking = options.thinking || false;
    this.debug = options.debug || false;
  }

  // Get API key from environment or config file
  getApiKey(provider) {
    // Check environment variables first
    if (provider === 'anthropic') {
      if (process.env.ANTHROPIC_API_KEY) {
        return process.env.ANTHROPIC_API_KEY;
      }
    } else if (provider === 'openai') {
      if (process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
      }
    }

    // Check config files
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    let apiKeyFile;
    
    if (provider === 'anthropic') {
      apiKeyFile = path.join(homeDir, '.anthropic', 'api_key');
      if (fs.existsSync(apiKeyFile)) {
        return fs.readFileSync(apiKeyFile, 'utf8').trim();
      }
      
      apiKeyFile = path.join(homeDir, '.config', 'anthropic', 'api_key');
      if (fs.existsSync(apiKeyFile)) {
        return fs.readFileSync(apiKeyFile, 'utf8').trim();
      }
    } else if (provider === 'openai') {
      apiKeyFile = path.join(homeDir, '.openai', 'api_key');
      if (fs.existsSync(apiKeyFile)) {
        return fs.readFileSync(apiKeyFile, 'utf8').trim();
      }
      
      apiKeyFile = path.join(homeDir, '.config', 'openai', 'api_key');
      if (fs.existsSync(apiKeyFile)) {
        return fs.readFileSync(apiKeyFile, 'utf8').trim();
      }
    }
    
    // Try reading from .pulser config
    const pulserConfigFile = path.join(homeDir, '.pulser', 'config', 'api_keys.json');
    if (fs.existsSync(pulserConfigFile)) {
      try {
        const config = JSON.parse(fs.readFileSync(pulserConfigFile, 'utf8'));
        if (config[provider]) {
          return config[provider];
        }
      } catch (error) {
        if (this.debug) {
          console.error(`Error reading API key from config: ${error.message}`);
        }
      }
    }
    
    return null;
  }
  
  // Connect to Anthropic API
  async callAnthropic(prompt) {
    if (!this.apiKey) {
      throw new Error(
        "No Anthropic API key found. Set the ANTHROPIC_API_KEY environment variable or create a ~/.anthropic/api_key file."
      );
    }
    
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey
      }
    };
    
    const modelName = this.model.includes('opus') ? 'claude-3-opus-20240229' :
                     this.model.includes('sonnet') ? 'claude-3-sonnet-20240229' :
                     this.model.includes('haiku') ? 'claude-3-haiku-20240307' :
                     'claude-3-opus-20240229';
    
    const requestData = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const jsonResponse = JSON.parse(data);
              const tokenCount = {
                prompt: jsonResponse.usage?.input_tokens || 0,
                completion: jsonResponse.usage?.output_tokens || 0,
                total: jsonResponse.usage?.input_tokens + jsonResponse.usage?.output_tokens || 0
              };
              
              resolve({
                text: jsonResponse.content[0].text,
                tokens: tokenCount,
                model: jsonResponse.model
              });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`API request error: ${error.message}`));
      });
      
      req.write(JSON.stringify(requestData));
      req.end();
    });
  }
  
  // Connect to OpenAI API
  async callOpenAI(prompt) {
    if (!this.apiKey) {
      throw new Error(
        "No OpenAI API key found. Set the OPENAI_API_KEY environment variable or create a ~/.openai/api_key file."
      );
    }
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };
    
    const modelName = this.model.includes('gpt-4') ? 'gpt-4' :
                     this.model.includes('gpt-3.5') ? 'gpt-3.5-turbo' :
                     'gpt-4';
    
    const requestData = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const jsonResponse = JSON.parse(data);
              const tokenCount = {
                prompt: jsonResponse.usage?.prompt_tokens || 0,
                completion: jsonResponse.usage?.completion_tokens || 0,
                total: jsonResponse.usage?.total_tokens || 0
              };
              
              resolve({
                text: jsonResponse.choices[0].message.content,
                tokens: tokenCount,
                model: jsonResponse.model
              });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`API request error: ${error.message}`));
      });
      
      req.write(JSON.stringify(requestData));
      req.end();
    });
  }
  
  // Connect to local LLM server (e.g., Ollama)
  async callLocalLLM(prompt) {
    const options = {
      hostname: 'localhost',
      path: '/api/generate',
      port: 11434,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const modelName = this.model || 'llama2';
    
    const requestData = {
      model: modelName,
      prompt: prompt,
      stream: false
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const jsonResponse = JSON.parse(data);
              
              resolve({
                text: jsonResponse.response,
                tokens: {
                  prompt: jsonResponse.prompt_eval_count || 0,
                  completion: jsonResponse.eval_count || 0,
                  total: (jsonResponse.prompt_eval_count || 0) + (jsonResponse.eval_count || 0)
                },
                model: jsonResponse.model
              });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Local LLM request error: ${error.message}. Is Ollama running?`));
      });
      
      req.write(JSON.stringify(requestData));
      req.end();
    });
  }
  
  // Main entry point
  async generateResponse(prompt) {
    if (this.thinking) {
      console.log(`Sending prompt to ${this.provider} using model ${this.model}`);
    }
    
    try {
      let response;
      
      if (this.provider === 'anthropic') {
        response = await this.callAnthropic(prompt);
      } else if (this.provider === 'openai') {
        response = await this.callOpenAI(prompt);
      } else if (this.provider === 'deepseek' || this.provider === 'local') {
        response = await this.callLocalLLM(prompt);
      } else {
        throw new Error(`Unsupported provider: ${this.provider}`);
      }
      
      return response;
    } catch (error) {
      if (this.debug) {
        console.error(`Error generating response: ${error.message}`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
      throw error;
    }
  }
}

export default PulserApiConnector;