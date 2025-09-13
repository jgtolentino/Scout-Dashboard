/**
 * webhook_listener.js
 * Webhook listener for Pulser Web Interface
 * 
 * This server handles webhook requests from the Pulser Web Interface
 * and routes them to the appropriate backend components.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3333;

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

// Logging utility
const logEvent = (event, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${event}: ${JSON.stringify(data)}\n`;
  
  fs.appendFileSync(
    path.join(process.env.HOME, '.pulser', 'webhook_log.json'),
    logEntry,
    'utf8'
  );
  
  console.log(`[${timestamp}] ${event}`, data);
};

/**
 * Execute a Pulser CLI command
 * 
 * @param {string} command - The command to execute
 * @param {Object} params - Command parameters
 * @returns {Promise<string>} - Command output
 */
const executePulserCommand = (command, params = {}) => {
  return new Promise((resolve, reject) => {
    const commandStr = `pulser ${command} ${Object.entries(params)
      .map(([key, value]) => `--${key}="${value}"`)
      .join(' ')}`;
    
    logEvent('EXECUTE', { command: commandStr });
    
    exec(commandStr, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        logEvent('ERROR', { error: error.message, stderr });
        reject(error);
        return;
      }
      
      logEvent('OUTPUT', { stdout });
      resolve(stdout);
    });
  });
};

/**
 * Route a message to Claude router
 * 
 * @param {string} message - The message to route
 * @param {string} agent - The agent to route to
 * @returns {Promise<Object>} - Response from claude_router
 */
const routeToClaudeRouter = async (message, agent = 'claudia') => {
  logEvent('ROUTE_TO_CLAUDE', { message, agent });

  try {
    // Check if claude_router.py exists, if not use fallback method
    if (fs.existsSync(path.join(__dirname, 'claude_router.py'))) {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
          path.join(__dirname, 'claude_router.py'),
          '--message', message,
          '--agent', agent
        ]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
          logEvent('CLAUDE_ROUTER_OUTPUT', { output: data.toString() });
        });

        pythonProcess.stderr.on('data', (data) => {
          logEvent('CLAUDE_ROUTER_ERROR', { error: data.toString() });
        });

        // Add a timeout to ensure we don't hang indefinitely
        const timeout = setTimeout(() => {
          pythonProcess.kill();
          logEvent('CLAUDE_ROUTER_TIMEOUT', { message, agent });

          // Return a fallback response if the router times out
          resolve({
            agent: agent,
            message: "I'm sorry, but I'm having trouble processing your request right now. The backend system is running, but the response timed out. Please try again or ask a different question.",
            timestamp: new Date().toISOString(),
            status: 'timeout'
          });
        }, 10000); // 10 second timeout

        pythonProcess.on('close', (code) => {
          clearTimeout(timeout);

          if (code !== 0) {
            logEvent('CLAUDE_ROUTER_EXIT', { code, output });

            // Return a fallback response on error
            resolve({
              agent: agent,
              message: "I apologize, but there was an issue processing your request. The backend system encountered an error. Please try again with a different query.",
              timestamp: new Date().toISOString(),
              status: 'error',
              code
            });
            return;
          }

          try {
            const result = JSON.parse(output);
            logEvent('CLAUDE_ROUTER_SUCCESS', { agent: result.agent });
            resolve(result);
          } catch (e) {
            logEvent('PARSE_ERROR', { error: e.message, output });

            // Return a fallback response on parse error
            resolve({
              agent: agent,
              message: "I received your message, but there was an issue with the response format. The backend is running, but couldn't generate a proper response. Please try again.",
              timestamp: new Date().toISOString(),
              status: 'parse_error'
            });
          }
        });
      });
    } else {
      // Fallback to CLI command
      const output = await executePulserCommand('ask', {
        message,
        agent,
        format: 'json'
      });

      try {
        return JSON.parse(output);
      } catch (e) {
        logEvent('PARSE_ERROR', { error: e.message, output });

        // Return a fallback response on CLI parse error
        return {
          agent: agent,
          message: "I received your message through the CLI, but there was an issue with the response format. Please try again with a simpler query.",
          timestamp: new Date().toISOString(),
          status: 'cli_parse_error'
        };
      }
    }
  } catch (error) {
    logEvent('CLAUDE_ROUTER_ERROR', { error: error.message });

    // Return a fallback response on any other error
    return {
      agent: agent,
      message: "I'm sorry, but an unexpected error occurred while processing your request. The system is running, but encountered an issue. Please try again.",
      timestamp: new Date().toISOString(),
      status: 'unexpected_error'
    };
  }
};

/**
 * Execute a task via pulseops
 * 
 * @param {string} task - The task to execute
 * @param {Object} params - Task parameters
 * @returns {Promise<Object>} - Task execution result
 */
const executePulseOpsTask = async (task, params = {}) => {
  logEvent('EXECUTE_TASK', { task, params });
  
  try {
    // Check if pulseops CLI command exists
    const output = await executePulserCommand('execute-task', {
      task,
      ...params,
      format: 'json'
    });
    
    try {
      return JSON.parse(output);
    } catch (e) {
      logEvent('PARSE_ERROR', { error: e.message, output });
      throw e;
    }
  } catch (error) {
    logEvent('PULSEOPS_ERROR', { error: error.message });
    throw error;
  }
};

// Define routes
app.post('/api/message', async (req, res) => {
  try {
    const { message, agent = 'claudia' } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    logEvent('RECEIVED_MESSAGE', { message, agent });

    // Set a timeout for the entire request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 15000); // 15 second timeout
    });

    // Race the router response against the timeout
    try {
      const response = await Promise.race([
        routeToClaudeRouter(message, agent),
        timeoutPromise
      ]);

      logEvent('SENDING_RESPONSE', {
        agent: response.agent,
        messagePreview: response.message?.substring(0, 50)
      });

      return res.json({
        success: true,
        response
      });
    } catch (timeoutError) {
      logEvent('API_TIMEOUT', { message, agent });

      // Send a fallback response if the entire request times out
      return res.json({
        success: true,
        response: {
          agent: agent,
          message: "I'm sorry, but the request took too long to process. The backend system is running, but couldn't generate a response in time. Please try again with a simpler query.",
          timestamp: new Date().toISOString(),
          status: 'api_timeout'
        }
      });
    }
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/message', error: error.message });

    // Even on error, we want to return a valid response to the frontend
    // rather than a 500 error that might not be handled well
    return res.json({
      success: false,
      response: {
        agent: 'claudia',
        message: "I apologize, but there was an unexpected error processing your request. The system is running, but encountered an issue. Please try again.",
        timestamp: new Date().toISOString(),
        status: 'api_error',
        error: error.message
      }
    });
  }
});

app.post('/api/execute-task', async (req, res) => {
  try {
    const { task, params } = req.body;
    
    if (!task) {
      return res.status(400).json({ 
        error: 'Task is required' 
      });
    }
    
    logEvent('RECEIVED_TASK', { task, params });
    
    // Execute the task via pulseops
    const result = await executePulseOpsTask(task, params);
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/execute-task', error: error.message });
    
    return res.status(500).json({
      error: 'Failed to execute task',
      details: error.message
    });
  }
});

app.post('/api/voice', async (req, res) => {
  try {
    const { audioData } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ 
        error: 'Audio data is required' 
      });
    }
    
    logEvent('RECEIVED_VOICE', { dataSize: audioData.length });
    
    // Save audio data to temp file
    const tempFile = path.join(os.tmpdir(), `pulser_audio_${Date.now()}.wav`);
    fs.writeFileSync(tempFile, Buffer.from(audioData, 'base64'));
    
    // Process audio with Echo
    const result = await executePulserCommand('transcribe', { 
      file: tempFile,
      format: 'json'
    });
    
    try {
      const transcription = JSON.parse(result);
      
      // If we have a transcription, route it to Claude
      if (transcription.text) {
        const response = await routeToClaudeRouter(transcription.text, 'echo');
        
        return res.json({
          success: true,
          transcription: transcription.text,
          response
        });
      } else {
        return res.json({
          success: true,
          transcription: { text: '' },
          error: 'Failed to transcribe audio'
        });
      }
    } catch (e) {
      logEvent('PARSE_ERROR', { error: e.message, result });
      throw e;
    }
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/voice', error: error.message });
    
    return res.status(500).json({
      error: 'Failed to process voice input',
      details: error.message
    });
  }
});

// Claude CLI endpoint
app.post('/api/claude_code', async (req, res) => {
  try {
    const { prompt, context = 'shell' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    logEvent('CLAUDE_CLI', { prompt, context });

    // Execute claude_with_context.sh
    const claudeProcess = spawn('bash', [
      path.join(__dirname, 'claude_with_context.sh')
    ]);

    // Write prompt to stdin
    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    let output = '';
    let error = '';

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    claudeProcess.on('close', (code) => {
      logEvent('CLAUDE_CLI_COMPLETE', { code, outputLength: output.length });

      res.json({
        code,
        output: output || error,
      });
    });
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/claude_code', error: error.message });

    res.status(500).json({
      error: 'Failed to execute Claude CLI',
      details: error.message
    });
  }
});

// Sketch generator endpoint - convert prompts into HTML/CSS code
app.post('/api/sketch_generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    logEvent('SKETCH_GENERATE', { prompt, options });

    // Enhance the prompt with specific HTML/CSS generation instructions
    const enhancedPrompt = `
Generate clean, modern HTML and CSS code for the following web UI component:
${prompt}

Please provide:
1. Valid HTML5 with semantic tags
2. Embedded CSS (in a <style> tag)
3. Responsive design that works on mobile and desktop
4. No external dependencies or frameworks
5. Working interactivity using vanilla JavaScript where appropriate

The code should be complete, self-contained, and ready to be rendered in a browser.
DO NOT include markdown code fences or explanations - ONLY return the raw HTML/CSS/JS code.
`;

    // Execute claude_with_context.sh with HTML context
    const claudeProcess = spawn('bash', [
      path.join(__dirname, 'claude_with_context.sh')
    ]);

    // Write prompt to stdin
    claudeProcess.stdin.write(enhancedPrompt);
    claudeProcess.stdin.end();

    let output = '';
    let error = '';

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Add a timeout to ensure we don't hang indefinitely
    const timeout = setTimeout(() => {
      claudeProcess.kill();
      logEvent('SKETCH_GENERATE_TIMEOUT', { prompt });

      // Return a fallback response if the generation times out
      res.json({
        success: false,
        code: -1,
        error: "The request took too long to process. Please try again with a simpler prompt.",
        output: "",
      });
    }, 30000); // 30 second timeout

    claudeProcess.on('close', (code) => {
      clearTimeout(timeout);

      logEvent('SKETCH_GENERATE_COMPLETE', {
        code,
        outputLength: output.length,
        hasError: error.length > 0
      });

      // Clean the output if needed - sometimes Claude might still include markdown fences
      let cleanedOutput = output;
      if (output.includes('```html')) {
        cleanedOutput = output.split('```html')[1].split('```')[0].trim();
      } else if (output.includes('```')) {
        cleanedOutput = output.split('```')[1].split('```')[0].trim();
      }

      res.json({
        success: code === 0,
        code,
        output: cleanedOutput || "",
        error: error || ""
      });
    });
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/sketch_generate', error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to generate sketch',
      details: error.message
    });
  }
});

// LinkedIn CSV processor endpoint
app.post('/api/linkedin/process', async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: 'File path is required'
      });
    }

    logEvent('LINKEDIN_PROCESS', { filePath, options });

    // Import the LinkedIn processor
    const { processLinkedInCSV } = require('./linkedin_csv_processor');

    // Process the file
    const result = await processLinkedInCSV(filePath, options);

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    logEvent('API_ERROR', { endpoint: '/api/linkedin/process', error: error.message });

    return res.status(500).json({
      error: 'Failed to process LinkedIn CSV',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create necessary directories
const ensureDirectoriesExist = () => {
  const pulserDir = path.join(process.env.HOME, '.pulser');
  
  if (!fs.existsSync(pulserDir)) {
    fs.mkdirSync(pulserDir, { recursive: true });
    console.log(`Created directory: ${pulserDir}`);
  }
};

// Start the server
const startServer = () => {
  ensureDirectoriesExist();
  
  app.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
    logEvent('SERVER_START', { port: PORT });
  });
};

startServer();