/**
 * promptApi.js
 * 
 * API client for interacting with the Pulser prompt engineering endpoints.
 * Provides functions for fetching, analyzing, and improving prompts.
 */

// Base API URL - adjust this to match your server configuration
const API_BASE_URL = '/api';

/**
 * Fetch a prompt by its path
 * @param {string} path - Path to the prompt file
 * @returns {Promise<Object>} The prompt object
 */
export async function fetchPrompt(path) {
  try {
    const response = await fetch(`${API_BASE_URL}/system_prompts/view?path=${encodeURIComponent(path)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch prompt');
    }
    
    const data = await response.json();
    
    return {
      id: path,
      path,
      name: path.split('/').pop().replace(/\.[^/.]+$/, ''),
      content: data.content,
      category: inferCategoryFromPath(path),
      tags: inferTagsFromContent(data.content)
    };
  } catch (error) {
    console.error('Error fetching prompt:', error);
    throw error;
  }
}

/**
 * Search for prompts matching criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Array of matching prompts
 */
export async function searchPrompts(criteria = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (criteria.query) {
      queryParams.append('query', criteria.query);
    }
    
    if (criteria.tags && criteria.tags.length > 0) {
      queryParams.append('tags', criteria.tags.join(','));
    }
    
    if (criteria.category) {
      queryParams.append('category', criteria.category);
    }
    
    const response = await fetch(`${API_BASE_URL}/system_prompts/search?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search prompts');
    }
    
    const data = await response.json();
    
    return data.results;
  } catch (error) {
    console.error('Error searching prompts:', error);
    throw error;
  }
}

/**
 * Get information about the prompt collection
 * @returns {Promise<Object>} Collection information
 */
export async function getPromptCollectionInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/system_prompts/info`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get collection info');
    }
    
    const data = await response.json();
    
    return data.info;
  } catch (error) {
    console.error('Error getting collection info:', error);
    throw error;
  }
}

/**
 * Analyze a prompt
 * @param {string} promptText - The prompt text to analyze
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzePrompt(promptText) {
  try {
    const response = await fetch(`${API_BASE_URL}/prompt_engineer/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze prompt');
    }
    
    const data = await response.json();
    
    // Add scores if not present
    if (!data.analysis.scores) {
      data.analysis.scores = calculateScoresFromAnalysis(data.analysis);
    }
    
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    throw error;
  }
}

/**
 * Improve a prompt based on goals
 * @param {string} promptText - The prompt text to improve
 * @param {Array} goals - Improvement goals
 * @returns {Promise<Object>} Improvement results
 */
export async function improvePrompt(promptText, goals) {
  try {
    const response = await fetch(`${API_BASE_URL}/prompt_engineer/improve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        goals: Array.isArray(goals) ? goals : [goals]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to improve prompt');
    }
    
    const data = await response.json();
    
    return data.result;
  } catch (error) {
    console.error('Error improving prompt:', error);
    throw error;
  }
}

/**
 * Generate variations of a prompt
 * @param {string} promptText - The prompt text to create variations of
 * @param {number} count - Number of variations to generate
 * @returns {Promise<Object>} Variation results
 */
export async function generateVariations(promptText, count = 3) {
  try {
    const response = await fetch(`${API_BASE_URL}/prompt_engineer/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        count: count
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate variations');
    }
    
    const data = await response.json();
    
    return data.result;
  } catch (error) {
    console.error('Error generating variations:', error);
    throw error;
  }
}

/**
 * Infer category from path
 * @param {string} path - Prompt file path
 * @returns {string} Inferred category
 */
function inferCategoryFromPath(path) {
  const parts = path.split('/');
  
  // Try to determine category from path structure
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  
  return 'Uncategorized';
}

/**
 * Infer tags from prompt content
 * @param {string} content - Prompt content
 * @returns {Array} Inferred tags
 */
function inferTagsFromContent(content) {
  const tags = [];
  
  // Look for common patterns in prompts
  if (content.toLowerCase().includes('you are an assistant')) {
    tags.push('assistant');
  }
  
  if (content.toLowerCase().includes('code') || content.toLowerCase().includes('programming')) {
    tags.push('coding');
  }
  
  if (content.toLowerCase().includes('creative') || content.toLowerCase().includes('story')) {
    tags.push('creative');
  }
  
  if (content.toLowerCase().includes('expert') || content.toLowerCase().includes('professional')) {
    tags.push('expert');
  }
  
  if (content.toLowerCase().includes('analyze') || content.toLowerCase().includes('analysis')) {
    tags.push('analysis');
  }
  
  return tags;
}

/**
 * Calculate scores from analysis data
 * @param {Object} analysis - Analysis results
 * @returns {Object} Score metrics
 */
function calculateScoresFromAnalysis(analysis) {
  // Default scores
  const scores = {
    clarity: 3,
    specificity: 3,
    completeness: 3,
    conciseness: 3,
    effectiveness: 3
  };
  
  // Adjust scores based on strengths and weaknesses
  if (analysis.strengths) {
    analysis.strengths.forEach(strength => {
      if (strength.toLowerCase().includes('clear')) {
        scores.clarity = Math.min(5, scores.clarity + 1);
      }
      
      if (strength.toLowerCase().includes('specific')) {
        scores.specificity = Math.min(5, scores.specificity + 1);
      }
      
      if (strength.toLowerCase().includes('complete') || strength.toLowerCase().includes('thorough')) {
        scores.completeness = Math.min(5, scores.completeness + 1);
      }
      
      if (strength.toLowerCase().includes('concise')) {
        scores.conciseness = Math.min(5, scores.conciseness + 1);
      }
      
      if (strength.toLowerCase().includes('effective')) {
        scores.effectiveness = Math.min(5, scores.effectiveness + 1);
      }
    });
  }
  
  if (analysis.weaknesses) {
    analysis.weaknesses.forEach(weakness => {
      if (weakness.toLowerCase().includes('clear')) {
        scores.clarity = Math.max(1, scores.clarity - 1);
      }
      
      if (weakness.toLowerCase().includes('specific')) {
        scores.specificity = Math.max(1, scores.specificity - 1);
      }
      
      if (weakness.toLowerCase().includes('incomplete') || weakness.toLowerCase().includes('missing')) {
        scores.completeness = Math.max(1, scores.completeness - 1);
      }
      
      if (weakness.toLowerCase().includes('verbose') || weakness.toLowerCase().includes('lengthy')) {
        scores.conciseness = Math.max(1, scores.conciseness - 1);
      }
      
      if (weakness.toLowerCase().includes('ineffective')) {
        scores.effectiveness = Math.max(1, scores.effectiveness - 1);
      }
    });
  }
  
  return scores;
}

export default {
  fetchPrompt,
  searchPrompts,
  getPromptCollectionInfo,
  analyzePrompt,
  improvePrompt,
  generateVariations
};