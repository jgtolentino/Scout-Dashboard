/**
 * prompt-engineer.js - Utilities for prompt engineering using system prompts as examples
 *
 * This module provides tools for prompt engineering, including prompt improvement,
 * analysis, and variation generation using collected system prompts as examples.
 */

const promptTools = require('./prompt-tools');

/**
 * Analyze a prompt and provide feedback
 * @param {string} promptText - The prompt to analyze
 * @returns {Promise<object>} Analysis result
 */
async function analyzePrompt(promptText) {
  try {
    // Simple analysis - in a real implementation this would use an LLM
    const analysis = {
      wordCount: promptText.split(/\s+/).filter(Boolean).length,
      characters: promptText.length,
      sections: [],
      strengths: [],
      weaknesses: [],
      improvementSuggestions: []
    };
    
    // Identify sections
    if (promptText.includes('```')) {
      analysis.sections.push('Code blocks');
    }
    
    if (promptText.includes('Example:') || promptText.includes('For example')) {
      analysis.sections.push('Examples');
    }
    
    if (promptText.match(/\d+\.\s+/)) {
      analysis.sections.push('Numbered list');
    }
    
    // Simple heuristic checks - in a real implementation this would be more sophisticated
    
    // Check for strengths
    if (analysis.wordCount > 50) {
      analysis.strengths.push('Detailed prompt with good length');
    }
    
    if (promptText.includes('```') && promptText.includes('example')) {
      analysis.strengths.push('Uses both code blocks and examples');
    }
    
    // Check for weaknesses
    if (analysis.wordCount < 20) {
      analysis.weaknesses.push('Prompt may be too short for complex tasks');
      analysis.improvementSuggestions.push('Expand the prompt with more details and examples');
    }
    
    if (!promptText.includes('example') && !promptText.includes('for instance')) {
      analysis.weaknesses.push('No examples included');
      analysis.improvementSuggestions.push('Add an example of desired output');
    }
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    throw error;
  }
}

/**
 * Improve a prompt based on goals and system prompts as examples
 * @param {string} basePrompt - The original prompt
 * @param {object} goals - Improvement goals
 * @returns {Promise<object>} Improved prompt and explanation
 */
async function improvePrompt(basePrompt, goals) {
  try {
    // Get relevant system prompts as examples
    const relevantPrompts = await findRelevantExamples(goals);
    
    // In a real implementation, this would use an LLM
    // For now, just add some suggested improvements based on goals
    
    let improvedPrompt = basePrompt;
    const changes = [];
    
    // Simple rule-based improvements
    if (goals.includes('clarity')) {
      // Simplify language
      improvedPrompt = improvedPrompt.replace(/utilize/g, 'use');
      improvedPrompt = improvedPrompt.replace(/implement/g, 'create');
      changes.push('Simplified language for clarity');
    }
    
    if (goals.includes('examples')) {
      if (!improvedPrompt.toLowerCase().includes('example')) {
        improvedPrompt += '\n\nExample: [Add a relevant example here]';
        changes.push('Added placeholder for an example');
      }
    }
    
    if (goals.includes('specificity')) {
      if (!improvedPrompt.includes('exactly') && !improvedPrompt.includes('precisely')) {
        improvedPrompt = improvedPrompt.replace(/create/i, 'create exactly');
        changes.push('Added precision terms for specificity');
      }
    }
    
    return {
      originalPrompt: basePrompt,
      improvedPrompt,
      changes,
      examplePromptsUsed: relevantPrompts.map(p => p.name)
    };
  } catch (error) {
    console.error('Error improving prompt:', error);
    throw error;
  }
}

/**
 * Generate variations of a prompt for A/B testing
 * @param {string} basePrompt - The original prompt
 * @param {number} numVariations - Number of variations to generate
 * @returns {Promise<object>} Prompt variations
 */
async function generateVariations(basePrompt, numVariations = 3) {
  try {
    // In a real implementation, this would use an LLM
    // For now, just create simple variations
    
    const variations = [];
    
    // Variation 1: More detailed
    let variation1 = basePrompt + '\n\nPlease be detailed and thorough in your response.';
    variations.push({
      name: 'Detailed Variation',
      prompt: variation1,
      focus: 'Detail and thoroughness'
    });
    
    // Variation 2: More concise
    let variation2 = 'Provide a concise response to the following: \n' + basePrompt;
    variations.push({
      name: 'Concise Variation',
      prompt: variation2,
      focus: 'Brevity and clarity'
    });
    
    // Variation 3: Example-focused
    let variation3 = basePrompt + '\n\nInclude concrete examples in your response.';
    variations.push({
      name: 'Example-focused Variation',
      prompt: variation3,
      focus: 'Practical examples'
    });
    
    // If more variations requested, add them
    if (numVariations > 3) {
      for (let i = 4; i <= numVariations; i++) {
        variations.push({
          name: `Variation ${i}`,
          prompt: basePrompt + `\n\nThis is variation ${i} with a unique focus.`,
          focus: `Experimental variant ${i}`
        });
      }
    }
    
    return {
      originalPrompt: basePrompt,
      variations: variations.slice(0, numVariations)
    };
  } catch (error) {
    console.error('Error generating prompt variations:', error);
    throw error;
  }
}

/**
 * Find relevant system prompts as examples based on goals
 * @param {string[]} goals - The goals for prompt improvement
 * @returns {Promise<Array>} Relevant prompts
 */
async function findRelevantExamples(goals) {
  try {
    // Convert goals to search criteria
    const criteria = {
      tags: []
    };
    
    // Map goals to relevant tags
    if (goals.includes('clarity')) criteria.tags.push('tool_use');
    if (goals.includes('examples')) criteria.tags.push('coding');
    if (goals.includes('specificity')) criteria.tags.push('agent');
    
    // If no specific tags identified, search for general prompts
    if (criteria.tags.length === 0) {
      criteria.query = 'instruction';
    }
    
    // Search for relevant prompts
    const results = await promptTools.searchPrompts(criteria);
    
    // Return top 3 results
    return results.slice(0, 3);
  } catch (error) {
    console.error('Error finding relevant prompt examples:', error);
    return []; // Return empty array on error
  }
}

/**
 * Export a prompt in various formats
 * @param {string} promptText - The prompt text to export
 * @param {string} format - The export format (text, json, jsonl, langchain)
 * @returns {Object} Exported prompt in the specified format
 */
function exportPrompt(promptText, format = 'text') {
  try {
    switch (format) {
      case 'text':
        return {
          content: promptText,
          mimeType: 'text/plain',
          extension: 'txt'
        };

      case 'json':
        return {
          content: JSON.stringify({
            prompt: promptText,
            metadata: {
              exported_at: new Date().toISOString(),
              character_count: promptText.length,
              word_count: promptText.split(/\s+/).filter(Boolean).length,
              format: 'json'
            }
          }, null, 2),
          mimeType: 'application/json',
          extension: 'json'
        };

      case 'jsonl':
        return {
          content: JSON.stringify({
            prompt: promptText,
            exported_at: new Date().toISOString()
          }),
          mimeType: 'application/jsonl',
          extension: 'jsonl'
        };

      case 'langchain':
        return {
          content: `from langchain.prompts import PromptTemplate

prompt_template = """${promptText}"""

prompt = PromptTemplate.from_template(prompt_template)

# Example usage:
# result = prompt.format(variable1="value1", variable2="value2")
`,
          mimeType: 'text/plain',
          extension: 'py'
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting prompt:', error);
    throw error;
  }
}

module.exports = {
  analyzePrompt,
  improvePrompt,
  generateVariations,
  findRelevantExamples,
  exportPrompt
};