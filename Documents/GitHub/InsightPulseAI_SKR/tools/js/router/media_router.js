/**
 * router/media_router.js
 * 
 * Media generation router for Pulser CLI
 * Handles routing for image and video generation tasks
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const chalk = require('chalk');

// Path to routing configuration
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const DEFAULT_CONFIG_PATH = path.join(__dirname, '../config/pulser_task_routing.yaml');
const USER_CONFIG_PATH = path.join(CONFIG_DIR, 'pulser_task_routing.yaml');

// Media output directory
const MEDIA_OUTPUT_DIR = path.join(CONFIG_DIR, 'media_output');

/**
 * Load routing configuration
 * @returns {Promise<object>} - Routing configuration
 */
async function loadRoutingConfig() {
  try {
    // Check if user has a custom config
    try {
      const userConfig = await fs.readFile(USER_CONFIG_PATH, 'utf8');
      return yaml.load(userConfig);
    } catch (err) {
      // If user config doesn't exist, use default
      const defaultConfig = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf8');
      return yaml.load(defaultConfig);
    }
  } catch (error) {
    console.error('Error loading routing configuration:', error);
    throw new Error('Failed to load media routing configuration');
  }
}

/**
 * Detect if a prompt is a media generation task
 * @param {string} prompt - User prompt
 * @param {object} config - Routing configuration
 * @returns {object|null} - Matching rule or null if not a media task
 */
function detectMediaTask(prompt, config) {
  if (!config || !config.routing_rules) {
    return null;
  }
  
  // Convert prompt to lowercase for case-insensitive matching
  const promptLower = prompt.toLowerCase();
  
  // Check each rule
  for (const rule of config.routing_rules) {
    // Skip if no triggers
    if (!rule.triggers) continue;
    
    // Check if all trigger conditions are met
    let allTriggersMatched = true;
    
    for (const trigger of rule.triggers) {
      if (trigger.contains_keywords) {
        // For keyword triggers, at least one keyword must match
        const keywordMatched = trigger.contains_keywords.some(keyword => 
          promptLower.includes(keyword.toLowerCase())
        );
        
        if (!keywordMatched) {
          allTriggersMatched = false;
          break;
        }
      }
      
      // Add other trigger types as needed
    }
    
    if (allTriggersMatched) {
      return rule;
    }
  }
  
  return null;
}

/**
 * Detect input media in the prompt
 * @param {string} prompt - User prompt
 * @param {object} config - Routing configuration
 * @returns {object} - Detected media type if any
 */
function detectInputMedia(prompt, config) {
  const result = {
    hasImageInput: false,
    hasVideoInput: false,
    mediaPath: null,
  };
  
  if (!config || !config.input_detection) return result;
  
  // Check for image input
  if (config.input_detection.image_input && config.input_detection.image_input.enabled) {
    const imageDetection = config.input_detection.image_input;
    
    // Check for phrases that indicate image input
    if (imageDetection.triggers.some(trigger => 
      trigger.contains_phrases && trigger.contains_phrases.some(phrase => 
        prompt.toLowerCase().includes(phrase.toLowerCase())
      )
    )) {
      result.hasImageInput = true;
    }
    
    // Check for URL that ends with image extension
    if (imageDetection.triggers.some(trigger => trigger.url_ends_with)) {
      const urlMatch = prompt.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i);
      if (urlMatch) {
        result.hasImageInput = true;
        result.mediaPath = urlMatch[0];
      }
    }
    
    // Check for local file path
    const localImageMatch = prompt.match(/([a-zA-Z]:)?[\\\/]?(?:[a-zA-Z0-9_-]+[\\\/])*[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)/i);
    if (localImageMatch) {
      result.hasImageInput = true;
      result.mediaPath = localImageMatch[0];
    }
  }
  
  // Check for video input
  if (config.input_detection.video_input && config.input_detection.video_input.enabled) {
    const videoDetection = config.input_detection.video_input;
    
    // Check for phrases that indicate video input
    if (videoDetection.triggers.some(trigger => 
      trigger.contains_phrases && trigger.contains_phrases.some(phrase => 
        prompt.toLowerCase().includes(phrase.toLowerCase())
      )
    )) {
      result.hasVideoInput = true;
    }
    
    // Check for URL that ends with video extension
    if (videoDetection.triggers.some(trigger => trigger.url_ends_with)) {
      const urlMatch = prompt.match(/https?:\/\/\S+\.(mp4|mov|webm)/i);
      if (urlMatch) {
        result.hasVideoInput = true;
        result.mediaPath = urlMatch[0];
      }
    }
    
    // Check for local file path
    const localVideoMatch = prompt.match(/([a-zA-Z]:)?[\\\/]?(?:[a-zA-Z0-9_-]+[\\\/])*[a-zA-Z0-9_-]+\.(mp4|mov|webm)/i);
    if (localVideoMatch) {
      result.hasVideoInput = true;
      result.mediaPath = localVideoMatch[0];
    }
  }
  
  return result;
}

/**
 * Process a media generation task using the appropriate model
 * @param {string} prompt - User prompt
 * @param {object} rule - Matching rule from config
 * @param {object} inputMedia - Detected input media
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Generation result
 */
async function processMediaTask(prompt, rule, inputMedia, options = {}) {
  // Ensure output directory exists
  await fs.mkdir(MEDIA_OUTPUT_DIR, { recursive: true });
  
  const modelToUse = options.overrideModel || rule.route_to;
  console.log(chalk.blue(`📷 Routing media task to ${modelToUse}`));
  
  // Extract parameters from rule
  const parameters = rule.parameters || {};
  
  // Prepare result object
  const result = {
    taskId: rule.id,
    model: modelToUse,
    prompt: prompt,
    outputPaths: [],
    metadata: {
      timestamp: new Date().toISOString(),
      parameters: parameters,
    }
  };
  
  try {
    // Simulate media generation - in a real implementation, this would call the actual model APIs
    switch (modelToUse) {
      case 'gemini-pro-vision':
        result.outputPaths = await simulateImageGeneration(prompt, parameters, 'gemini');
        break;
      case 'dalle-3':
        result.outputPaths = await simulateImageGeneration(prompt, parameters, 'dalle');
        break;
      case 'runway-gen2':
        result.outputPaths = await simulateVideoGeneration(prompt, parameters, 'runway');
        break;
      case 'synthesia-studio':
        result.outputPaths = await simulateVideoGeneration(prompt, parameters, 'synthesia');
        break;
      case 'clipdrop-stable-diffusion-xl':
        result.outputPaths = await simulateImageEditing(prompt, inputMedia, parameters, 'clipdrop');
        break;
      case 'midjourney':
        result.outputPaths = await simulateImageGeneration(prompt, parameters, 'midjourney');
        break;
      default:
        throw new Error(`Unsupported media generation model: ${modelToUse}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing media task with ${modelToUse}:`, error);
    
    // Try fallback if available and not already using it
    if (rule.fallback && !options.noFallback && modelToUse !== rule.fallback) {
      console.log(chalk.yellow(`⚠️ Falling back to ${rule.fallback}`));
      return processMediaTask(prompt, { ...rule, route_to: rule.fallback }, inputMedia, { ...options, noFallback: true });
    }
    
    throw error;
  }
}

/**
 * Simulate image generation (for demo purposes)
 * @param {string} prompt - User prompt
 * @param {object} parameters - Generation parameters
 * @param {string} model - Model name
 * @returns {Promise<string[]>} - Generated image paths
 */
async function simulateImageGeneration(prompt, parameters, model) {
  // In a real implementation, this would call the actual image generation API
  
  // For demo purposes, just return a mock result
  const timestamp = Date.now();
  const filename = `${model}_generated_${timestamp}.png`;
  const outputPath = path.join(MEDIA_OUTPUT_DIR, filename);
  
  // Create a fake image file for demo purposes
  await fs.writeFile(outputPath, `This is a simulated image file for: ${prompt}`);
  
  // Log for demo
  console.log(chalk.green(`🖼️ Simulated image generation with ${model}`));
  console.log(chalk.white(`   Prompt: ${prompt}`));
  console.log(chalk.white(`   Output: ${outputPath}`));
  
  return [outputPath];
}

/**
 * Simulate video generation (for demo purposes)
 * @param {string} prompt - User prompt
 * @param {object} parameters - Generation parameters
 * @param {string} model - Model name
 * @returns {Promise<string[]>} - Generated video paths
 */
async function simulateVideoGeneration(prompt, parameters, model) {
  // In a real implementation, this would call the actual video generation API
  
  // For demo purposes, just return a mock result
  const timestamp = Date.now();
  const filename = `${model}_generated_${timestamp}.mp4`;
  const outputPath = path.join(MEDIA_OUTPUT_DIR, filename);
  
  // Create a fake video file for demo purposes
  await fs.writeFile(outputPath, `This is a simulated video file for: ${prompt}`);
  
  // Log for demo
  console.log(chalk.green(`🎬 Simulated video generation with ${model}`));
  console.log(chalk.white(`   Prompt: ${prompt}`));
  console.log(chalk.white(`   Output: ${outputPath}`));
  
  return [outputPath];
}

/**
 * Simulate image editing (for demo purposes)
 * @param {string} prompt - User prompt
 * @param {object} inputMedia - Input media info
 * @param {object} parameters - Generation parameters
 * @param {string} model - Model name
 * @returns {Promise<string[]>} - Edited image paths
 */
async function simulateImageEditing(prompt, inputMedia, parameters, model) {
  // In a real implementation, this would call the actual image editing API
  
  // For demo purposes, just return a mock result
  const timestamp = Date.now();
  const filename = `${model}_edited_${timestamp}.png`;
  const outputPath = path.join(MEDIA_OUTPUT_DIR, filename);
  
  // Create a fake image file for demo purposes
  await fs.writeFile(outputPath, `This is a simulated edited image file for: ${prompt}`);
  
  // Log for demo
  console.log(chalk.green(`✏️ Simulated image editing with ${model}`));
  console.log(chalk.white(`   Prompt: ${prompt}`));
  console.log(chalk.white(`   Input: ${inputMedia.mediaPath || 'None'}`));
  console.log(chalk.white(`   Output: ${outputPath}`));
  
  return [outputPath];
}

/**
 * Format media generation result for display
 * @param {object} result - Media generation result
 * @returns {string} - Formatted result
 */
function formatMediaResult(result) {
  const model = result.model;
  const outputPaths = result.outputPaths;
  
  let formattedResult = '';
  
  if (result.taskId.includes('image')) {
    formattedResult += `🖼️ Generated image with ${model}:\n\n`;
  } else if (result.taskId.includes('video')) {
    formattedResult += `🎬 Generated video with ${model}:\n\n`;
  } else {
    formattedResult += `📷 Media generated with ${model}:\n\n`;
  }
  
  // Add output paths
  formattedResult += outputPaths.map(path => `File saved at: ${path}`).join('\n');
  
  // Add timestamp
  formattedResult += `\n\nGenerated at: ${new Date(result.metadata.timestamp).toLocaleString()}`;
  
  return formattedResult;
}

/**
 * Main entry point for media routing
 * @param {string} prompt - User prompt
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Result of processing or null if not a media task
 */
async function routeMediaTask(prompt, options = {}) {
  try {
    // Load routing configuration
    const config = await loadRoutingConfig();
    
    // Detect if this is a media task
    const matchingRule = detectMediaTask(prompt, config);
    
    if (!matchingRule) {
      return null; // Not a media task
    }
    
    // Detect input media
    const inputMedia = detectInputMedia(prompt, config);
    
    // Process the media task
    const result = await processMediaTask(prompt, matchingRule, inputMedia, options);
    
    // Format the result
    result.formattedOutput = formatMediaResult(result);
    
    return result;
  } catch (error) {
    console.error('Error in media routing:', error);
    throw error;
  }
}

module.exports = {
  routeMediaTask,
  loadRoutingConfig,
  detectMediaTask,
  detectInputMedia,
};