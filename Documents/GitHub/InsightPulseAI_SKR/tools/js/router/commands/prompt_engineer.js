/**
 * prompt_engineer.js - Command for prompt engineering using system prompts collection
 * 
 * Provides functionality to analyze, improve, and create variations of prompts
 * using collected system prompts as examples and best practices.
 */

const promptEngineer = require('../../utils/prompt-engineer');
const fs = require('fs').promises;
const path = require('path');

// Command handler for the prompt_engineer command
async function handlePromptEngineerCommand(args) {
  const subcommand = args._[0];
  delete args._; // Remove the subcommand
  
  // Show help if requested
  if (args.help) {
    showHelp();
    return { status: 'success' };
  }
  
  try {
    switch (subcommand) {
    case 'analyze':
      return await analyzePrompt(args);

    case 'improve':
      return await improvePrompt(args);

    case 'variations':
      return await generateVariations(args);

    case 'export':
      return await exportPrompt(args);

    default:
      showHelp();
      return { status: 'error', message: `Unknown subcommand: ${subcommand}` };
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

/**
 * Analyze a prompt and provide feedback
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function analyzePrompt(args) {
  if (!args.prompt && !args.file) {
    console.log('Error: Either --prompt or --file is required');
    return { status: 'error', message: 'Missing prompt text or file' };
  }
  
  try {
    let promptText;
    
    if (args.file) {
      // Read prompt from file
      promptText = await fs.readFile(args.file, 'utf8');
    } else {
      promptText = args.prompt;
    }
    
    console.log('\nAnalyzing prompt...\n');
    
    const analysis = await promptEngineer.analyzePrompt(promptText);
    
    // Display the analysis
    console.log('Prompt Analysis:');
    console.log('---------------');
    console.log(`Word count: ${analysis.wordCount}`);
    console.log(`Character count: ${analysis.characters}`);
    
    if (analysis.sections.length > 0) {
      console.log('\nDetected sections:');
      analysis.sections.forEach(section => console.log(`- ${section}`));
    }
    
    if (analysis.strengths.length > 0) {
      console.log('\nStrengths:');
      analysis.strengths.forEach(strength => console.log(`+ ${strength}`));
    }
    
    if (analysis.weaknesses.length > 0) {
      console.log('\nWeaknesses:');
      analysis.weaknesses.forEach(weakness => console.log(`- ${weakness}`));
    }
    
    if (analysis.improvementSuggestions.length > 0) {
      console.log('\nImprovement suggestions:');
      analysis.improvementSuggestions.forEach(suggestion => console.log(`* ${suggestion}`));
    }
    
    // Save analysis to file if requested
    if (args.output) {
      await fs.writeFile(
        args.output, 
        JSON.stringify(analysis, null, 2),
        'utf8'
      );
      console.log(`\nAnalysis saved to ${args.output}`);
    }
    
    return { status: 'success', analysis };
  } catch (error) {
    return { status: 'error', message: `Analysis failed: ${error.message}` };
  }
}

/**
 * Improve a prompt based on goals
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function improvePrompt(args) {
  if (!args.prompt && !args.file) {
    console.log('Error: Either --prompt or --file is required');
    return { status: 'error', message: 'Missing prompt text or file' };
  }
  
  if (!args.goals) {
    console.log('Error: --goals is required (comma-separated list)');
    return { status: 'error', message: 'Missing improvement goals' };
  }
  
  try {
    let promptText;
    
    if (args.file) {
      // Read prompt from file
      promptText = await fs.readFile(args.file, 'utf8');
    } else {
      promptText = args.prompt;
    }
    
    const goals = args.goals.split(',').map(g => g.trim().toLowerCase());
    
    console.log('\nImproving prompt with goals:', goals.join(', '), '\n');
    
    const result = await promptEngineer.improvePrompt(promptText, goals);
    
    // Display the result
    console.log('Original Prompt:');
    console.log('---------------');
    console.log(result.originalPrompt);
    
    console.log('\nImproved Prompt:');
    console.log('---------------');
    console.log(result.improvedPrompt);
    
    if (result.changes.length > 0) {
      console.log('\nChanges made:');
      result.changes.forEach(change => console.log(`* ${change}`));
    }
    
    if (result.examplePromptsUsed && result.examplePromptsUsed.length > 0) {
      console.log('\nExample prompts referenced:');
      result.examplePromptsUsed.forEach(ex => console.log(`- ${ex}`));
    }
    
    // Save improved prompt to file if requested
    if (args.output) {
      await fs.writeFile(args.output, result.improvedPrompt, 'utf8');
      console.log(`\nImproved prompt saved to ${args.output}`);
      
      if (args.saveReport) {
        const reportPath = args.saveReport === true 
          ? `${args.output}.report.json` 
          : args.saveReport;
          
        await fs.writeFile(
          reportPath,
          JSON.stringify({
            original: result.originalPrompt,
            improved: result.improvedPrompt,
            changes: result.changes,
            examplePromptsUsed: result.examplePromptsUsed
          }, null, 2),
          'utf8'
        );
        
        console.log(`Improvement report saved to ${reportPath}`);
      }
    }
    
    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', message: `Improvement failed: ${error.message}` };
  }
}

/**
 * Generate variations of a prompt for A/B testing
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function generateVariations(args) {
  if (!args.prompt && !args.file) {
    console.log('Error: Either --prompt or --file is required');
    return { status: 'error', message: 'Missing prompt text or file' };
  }

  try {
    let promptText;

    if (args.file) {
      // Read prompt from file
      promptText = await fs.readFile(args.file, 'utf8');
    } else {
      promptText = args.prompt;
    }

    const count = parseInt(args.count) || 3;

    console.log(`\nGenerating ${count} prompt variations...\n`);

    const result = await promptEngineer.generateVariations(promptText, count);

    // Display the result
    console.log('Original Prompt:');
    console.log('---------------');
    console.log(result.originalPrompt);

    result.variations.forEach((variation, idx) => {
      console.log(`\nVariation ${idx + 1}: ${variation.name}`);
      console.log(`Focus: ${variation.focus}`);
      console.log('---------------');
      console.log(variation.prompt);
    });

    // Save variations to files if requested
    if (args.output) {
      // Ensure directory exists
      const outputDir = args.output;
      await fs.mkdir(outputDir, { recursive: true });

      // Save original
      await fs.writeFile(
        path.join(outputDir, 'original.txt'),
        result.originalPrompt,
        'utf8'
      );

      // Save variations
      for (let i = 0; i < result.variations.length; i++) {
        const variation = result.variations[i];
        await fs.writeFile(
          path.join(outputDir, `variation_${i + 1}.txt`),
          variation.prompt,
          'utf8'
        );
      }

      // Save metadata
      await fs.writeFile(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify({
          createdAt: new Date().toISOString(),
          originalPrompt: result.originalPrompt,
          variations: result.variations.map(v => ({
            name: v.name,
            focus: v.focus
          }))
        }, null, 2),
        'utf8'
      );

      console.log(`\nVariations saved to ${outputDir}`);
    }

    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', message: `Generating variations failed: ${error.message}` };
  }
}

/**
 * Export a prompt in various formats
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function exportPrompt(args) {
  if (!args.prompt && !args.file) {
    console.log('Error: Either --prompt or --file is required');
    return { status: 'error', message: 'Missing prompt text or file' };
  }

  try {
    let promptText;

    if (args.file) {
      // Read prompt from file
      promptText = await fs.readFile(args.file, 'utf8');
    } else {
      promptText = args.prompt;
    }

    const format = args.format || 'text';
    const validFormats = ['text', 'json', 'jsonl', 'langchain'];

    if (!validFormats.includes(format)) {
      console.log(`Error: Invalid format '${format}'`);
      console.log(`Valid formats: ${validFormats.join(', ')}`);
      return { status: 'error', message: `Invalid format: ${format}` };
    }

    console.log(`\nExporting prompt in ${format} format...\n`);

    const result = promptEngineer.exportPrompt(promptText, format);

    // Display the result
    console.log(`Prompt prepared for export as ${format.toUpperCase()} format.`);

    // Save to file if output path is provided
    if (args.output) {
      await fs.writeFile(
        args.output,
        result.content,
        'utf8'
      );
      console.log(`\nExported prompt saved to ${args.output}`);
    } else {
      // Otherwise, display the content (truncated for large prompts)
      const maxDisplayLength = 500;
      if (result.content.length > maxDisplayLength) {
        console.log(`\n${result.content.substring(0, maxDisplayLength)}...\n[Content truncated, use --output to save full content]`);
      } else {
        console.log(`\n${result.content}`);
      }
    }

    return {
      status: 'success',
      result: {
        content: result.content.substring(0, 1000) + (result.content.length > 1000 ? '...' : ''),
        mimeType: result.mimeType,
        extension: result.extension,
        format
      }
    };
  } catch (error) {
    return { status: 'error', message: `Export failed: ${error.message}` };
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Prompt Engineering Command
-------------------------

Use the system prompts collection to analyze, improve, and create variations of prompts.

Usage:
  pulser prompt_engineer analyze [options]    Analyze a prompt and provide feedback
  pulser prompt_engineer improve [options]    Improve a prompt based on goals
  pulser prompt_engineer variations [options] Generate variations of a prompt for A/B testing
  pulser prompt_engineer export [options]     Export a prompt in different formats

Analyze Options:
  --prompt TEXT    Prompt text to analyze
  --file PATH      Path to file containing the prompt
  --output PATH    Save analysis results to a file

Improve Options:
  --prompt TEXT       Prompt text to improve
  --file PATH         Path to file containing the prompt
  --goals LIST        Comma-separated list of improvement goals (required)
                      Valid goals: clarity, examples, specificity
  --output PATH       Save improved prompt to a file
  --saveReport PATH   Save improvement report to a file

Variations Options:
  --prompt TEXT    Prompt text to create variations of
  --file PATH      Path to file containing the prompt
  --count NUMBER   Number of variations to generate (default: 3)
  --output DIR     Save variations to files in this directory

Export Options:
  --prompt TEXT    Prompt text to export
  --file PATH      Path to file containing the prompt
  --format FORMAT  Export format: text, json, jsonl, langchain (default: text)
  --output PATH    Save exported prompt to a file

Examples:
  pulser prompt_engineer analyze --prompt "Write a blog post about AI."
  pulser prompt_engineer improve --file myPrompt.txt --goals clarity,examples
  pulser prompt_engineer variations --prompt "Explain quantum computing" --count 5
  `);
}

// Export the command
module.exports = {
  command: 'prompt_engineer',
  description: 'Analyze, improve, and create variations of prompts',
  args: [
    { name: 'prompt', type: 'string', description: 'Prompt text' },
    { name: 'file', type: 'string', description: 'Path to a file containing the prompt' },
    { name: 'output', type: 'string', description: 'Output file path' },
    { name: 'goals', type: 'string', description: 'Comma-separated improvement goals' },
    { name: 'count', type: 'number', description: 'Number of variations to generate' },
    { name: 'saveReport', type: 'boolean', description: 'Save improvement report' },
    { name: 'format', type: 'string', description: 'Export format (text, json, jsonl, langchain)' }
  ],
  handler: handlePromptEngineerCommand
};