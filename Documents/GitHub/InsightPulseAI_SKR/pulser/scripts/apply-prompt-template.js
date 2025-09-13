#!/usr/bin/env node

/**
 * Apply Prompt Template Script
 * 
 * This script applies a prompt template to generate a structured prompt for AI-assisted
 * code modifications. It helps ensure that AI code changes follow best practices
 * and address all necessary requirements.
 * 
 * Usage:
 *   node apply-prompt-template.js <template-path> <file-path> [--output=output-file]
 * 
 * Example:
 *   node apply-prompt-template.js .prompts/patch-template.md src/utils/helpers.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node apply-prompt-template.js <template-path> <file-path> [--output=output-file]');
  process.exit(1);
}

const templatePath = args[0];
const filePath = args[1];

// Check for output flag
let outputFile = null;
for (let i = 2; i < args.length; i++) {
  if (args[i].startsWith('--output=')) {
    outputFile = args[i].substring(9);
  }
}

// Validate inputs
if (!fs.existsSync(templatePath)) {
  console.error(`Template file not found: ${templatePath}`);
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Target file not found: ${filePath}`);
  process.exit(1);
}

// Read template file
const templateContent = fs.readFileSync(templatePath, 'utf8');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extract template variables (anything inside {{variable}})
const placeholderRegex = /{{([^}]+)}}/g;
const placeholders = [];
let match;

while ((match = placeholderRegex.exec(templateContent)) !== null) {
  if (!placeholders.includes(match[1])) {
    placeholders.push(match[1]);
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to replace placeholders with values
function replacePlaceholders(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// Collect values for placeholders
const values = {
  file_path: filePath
};

console.log(`\nBuilding prompt for: ${filePath}\n`);

// Helper to process placeholders sequentially
function processPlaceholder(index) {
  if (index >= placeholders.length) {
    // All placeholders processed, generate final prompt
    finalizePreparedPrompt();
    return;
  }

  const placeholder = placeholders[index];
  
  // Skip file_path as it's already set
  if (placeholder === 'file_path') {
    processPlaceholder(index + 1);
    return;
  }
  
  // Format the placeholder for display
  const displayName = placeholder
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();
  
  rl.question(`Enter ${displayName}: `, (answer) => {
    values[placeholder] = answer;
    processPlaceholder(index + 1);
  });
}

// Function to finalize and output the prepared prompt
function finalizePreparedPrompt() {
  // Generate the final prompt with replacements
  const finalPrompt = replacePlaceholders(templateContent, values);
  
  // Add the file content if appropriate
  let completePrompt = finalPrompt;
  
  if (finalPrompt.includes('{{CODE_CONTENT}}')) {
    completePrompt = completePrompt.replace('{{CODE_CONTENT}}', fileContent);
  } else if (!finalPrompt.includes('Original Code:') && !finalPrompt.includes('Current Code:')) {
    // If the template doesn't already have a section for the original code
    completePrompt += `\n\n## Current File Content\n\`\`\`\n${fileContent}\n\`\`\``;
  }
  
  if (outputFile) {
    fs.writeFileSync(outputFile, completePrompt);
    console.log(`\nPrompt written to: ${outputFile}`);
  } else {
    console.log('\n=== GENERATED PROMPT ===\n');
    console.log(completePrompt);
    console.log('\n=== END OF PROMPT ===\n');
  }
  
  rl.close();
}

// Start the process
processPlaceholder(0);

// Close handler
rl.on('close', () => {
  console.log('\nPrompt template application complete.');
});