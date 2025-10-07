/**
 * CTA Demo Express Route
 * 
 * Handles the CTA generation API endpoint that integrates with ClaudePromptExecutor
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

// Path to the Claude prompt test script
const PROMPT_TEST_SCRIPT = path.resolve(__dirname, '../../../../scripts/claude_prompt_test.sh');
const CTA_PROMPT_PATH = path.resolve(__dirname, '../../../../SKR/prompt_library/cta_generator/prompt.txt');

/**
 * Process template parameters and create a formatted prompt
 * @param {Object} requestData - The request data containing template and parameters
 * @returns {String} - Formatted prompt text
 */
async function createPrompt(requestData) {
  try {
    // Read the base prompt template
    let promptTemplate = await fs.readFile(CTA_PROMPT_PATH, 'utf8');
    
    // Process template conditionals
    if (requestData.template) {
      // Handle template type conditionals (conversion, engagement, urgency)
      promptTemplate = promptTemplate.replace(
        `{{#eq template "${requestData.template}"}}`,
        ''
      );
      
      // Close the relevant template block
      promptTemplate = promptTemplate.replace(
        `{{/eq}}`,
        ''
      );
      
      // Remove other template blocks
      const otherTemplates = ['conversion', 'engagement', 'urgency'].filter(t => t !== requestData.template);
      otherTemplates.forEach(template => {
        const regex = new RegExp(`{{#eq template "${template}"}}[\\s\\S]*?{{/eq}}`, 'g');
        promptTemplate = promptTemplate.replace(regex, '');
      });
    }
    
    // Process parameters
    if (requestData.parameters) {
      Object.keys(requestData.parameters).forEach(key => {
        const value = requestData.parameters[key] || '';
        promptTemplate = promptTemplate.replace(`{{parameters.${key}}}`, value);
      });
    }
    
    // Process options
    if (requestData.options) {
      // Variations option
      if (requestData.options.variations) {
        promptTemplate = promptTemplate.replace('{{#if options.variations}}', '');
        promptTemplate = promptTemplate.replace('{{options.variations}}', '3'); // Default to 3 variations
        promptTemplate = promptTemplate.replace('{{/if}}', '');
      } else {
        // Remove variations block
        const variationsRegex = /{{#if options\.variations}}[\s\S]*?{{\/if}}/g;
        promptTemplate = promptTemplate.replace(variationsRegex, '');
      }
      
      // Emoji option
      if (requestData.options.emoji) {
        promptTemplate = promptTemplate.replace('{{#if options.emoji}}', '');
        promptTemplate = promptTemplate.replace('{{/if}}', '');
      } else {
        // Remove emoji block
        const emojiRegex = /{{#if options\.emoji}}[\s\S]*?{{\/if}}/g;
        promptTemplate = promptTemplate.replace(emojiRegex, '');
      }
    } else {
      // Remove all option blocks if no options provided
      const optionsRegex = /{{#if options\.[a-z]+}}[\s\S]*?{{\/if}}/g;
      promptTemplate = promptTemplate.replace(optionsRegex, '');
    }
    
    return promptTemplate;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw new Error('Failed to create prompt template');
  }
}

/**
 * Execute the prompt with Claude
 * @param {String} promptText - The formatted prompt text
 * @returns {Promise<Object>} - The Claude response
 */
function executeClaudePrompt(promptText) {
  return new Promise((resolve, reject) => {
    // Create a temporary file for the prompt
    const tempFile = path.join('/tmp', `cta_prompt_${Date.now()}.txt`);
    
    // Write the prompt to a temporary file
    fs.writeFile(tempFile, promptText)
      .then(() => {
        // Execute Claude prompt script
        const claudeProcess = spawn(PROMPT_TEST_SCRIPT, [
          '--file', tempFile,
          '--model', 'claude-3-7-sonnet',
          '--nocache' // Always use fresh results for CTAs
        ]);
        
        let stdout = '';
        let stderr = '';
        
        claudeProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        claudeProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        claudeProcess.on('close', (code) => {
          // Clean up the temporary file
          fs.unlink(tempFile).catch(err => {
            console.error('Error deleting temp file:', err);
          });
          
          if (code !== 0) {
            console.error('Claude execution error:', stderr);
            reject(new Error('Failed to execute prompt with Claude'));
            return;
          }
          
          try {
            // Extract the JSON response from Claude's output
            const jsonMatch = stdout.match(/```json([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
              const jsonStr = jsonMatch[1].trim();
              const result = JSON.parse(jsonStr);
              resolve(result);
            } else {
              // Fallback: try to extract any JSON object from the response
              const jsonRegex = /{[\s\S]*}/;
              const match = stdout.match(jsonRegex);
              if (match) {
                const result = JSON.parse(match[0]);
                resolve(result);
              } else {
                // If no JSON found, create a simple response
                resolve({
                  cta: stdout.trim(),
                  explanation: "Generated using Claude"
                });
              }
            }
          } catch (error) {
            console.error('Error parsing Claude response:', error);
            reject(new Error('Failed to parse Claude response'));
          }
        });
        
        claudeProcess.on('error', (error) => {
          console.error('Claude process error:', error);
          reject(new Error('Failed to start Claude process'));
        });
      })
      .catch(error => {
        console.error('Error writing temp file:', error);
        reject(new Error('Failed to prepare prompt for Claude'));
      });
  });
}

/**
 * GET /cta-demo
 * Render the CTA demo page
 */
router.get('/', (req, res) => {
  res.render('cta-demo', {
    title: 'CTA Generator Demo | InsightPulseAI',
    description: 'Generate effective call-to-action text using Claude AI',
    scripts: ['/components/cta-demo/CTADemo.js'],
    styles: ['/components/cta-demo/cta-demo.css']
  });
});

/**
 * POST /api/cta-generator
 * Generate CTA text using Claude
 */
router.post('/api/cta-generator', async (req, res) => {
  try {
    const { prompt, template, parameters, options } = req.body;
    
    let promptText;
    
    // If a direct prompt is provided, use it
    if (prompt && typeof prompt === 'string') {
      promptText = prompt;
    } else {
      // Otherwise, build the prompt from template and parameters
      promptText = await createPrompt({ template, parameters, options });
    }
    
    // Execute the prompt with Claude
    const result = await executeClaudePrompt(promptText);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Failed to generate CTA',
      message: error.message
    });
  }
});

module.exports = router;