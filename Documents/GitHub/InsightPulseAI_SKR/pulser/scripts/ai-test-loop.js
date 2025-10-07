#!/usr/bin/env node

/**
 * AI Test Feedback Loop
 * 
 * This script integrates AI code generation with immediate test feedback.
 * It captures test failures after AI code changes and feeds them back into the AI
 * for immediate correction.
 * 
 * Usage:
 *   node ai-test-loop.js <file-path> <prompt>
 *   node ai-test-loop.js --template=<template-path> <file-path>
 * 
 * Example:
 *   node ai-test-loop.js src/utils/helpers.js "Fix the date formatting bug"
 *   node ai-test-loop.js --template=.prompts/bug-fix-template.md src/utils/helpers.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node ai-test-loop.js <file-path> <prompt>');
  console.error('   or: node ai-test-loop.js --template=<template-path> <file-path>');
  process.exit(1);
}

// Check if a template was specified
let templatePath = null;
let filePath = args[0];
let prompt = args[1] || '';

// Parse template option if it exists
if (args[0].startsWith('--template=')) {
  templatePath = args[0].substring(11);
  filePath = args[1];
  prompt = args[2] || '';
}

// Validate inputs
if (templatePath && !fs.existsSync(templatePath)) {
  console.error(`Template file not found: ${templatePath}`);
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Target file not found: ${filePath}`);
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to run tests and capture results
async function runTests() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npm', ['test'], { 
      stdio: ['inherit', 'pipe', 'pipe'] 
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });
    
    testProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      process.stderr.write(chunk);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ 
          success: false, 
          output,
          errorOutput,
          failureOutput: output.includes('FAIL') ? output : errorOutput
        });
      }
    });
  });
}

// Apply the template if specified
async function applyTemplate() {
  if (!templatePath) {
    return prompt;
  }
  
  return new Promise((resolve) => {
    // Use an existing template application script if it exists
    const applyScriptPath = path.join(__dirname, 'apply-prompt-template.js');
    
    if (fs.existsSync(applyScriptPath)) {
      const tempOutputPath = path.join(os.tmpdir(), `prompt-${Date.now()}.md`);
      execSync(`node ${applyScriptPath} ${templatePath} ${filePath} --output=${tempOutputPath}`);
      const result = fs.readFileSync(tempOutputPath, 'utf8');
      fs.unlinkSync(tempOutputPath);
      resolve(result);
    } else {
      // Simplified template application
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Basic replacements
      let result = templateContent
        .replace(/{{file_path}}/g, filePath)
        .replace(/{{CODE_CONTENT}}/g, fileContent);
      
      resolve(result);
    }
  });
}

// Function to save file backup
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Function to restore file from backup
function restoreFile(filePath, backupPath) {
  fs.copyFileSync(backupPath, filePath);
  fs.unlinkSync(backupPath);
}

// Main function
async function main() {
  // Prepare the prompt based on template
  const finalPrompt = await applyTemplate();
  
  // Backup the file before making changes
  const backupPath = backupFile(filePath);
  
  // Initial state
  let aiResponse = null;
  let testResult = null;
  let iterations = 0;
  const maxIterations = 3;
  
  console.log(`Starting AI-Test feedback loop for: ${filePath}`);
  console.log(`Prompt: ${finalPrompt.substring(0, 100)}${finalPrompt.length > 100 ? '...' : ''}`);
  
  // Get initial content
  const originalContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n== Iteration ${iterations} ==`);
      
      // In a real implementation, we would send the prompt to an AI system
      // For this example, we'll simulate the response
      if (iterations === 1) {
        console.log('Sending prompt to AI system...');
        // Simulate AI response - in production this would call an AI API
        aiResponse = simulateAiResponse(finalPrompt, filePath);
      } else {
        console.log('Sending feedback to AI system...');
        // Add the test results to the prompt for feedback
        const feedbackPrompt = `${finalPrompt}\n\n====== TEST RESULTS ======\n${testResult.failureOutput}\n\nPlease fix the issues in the code to make the tests pass.`;
        aiResponse = simulateAiResponse(feedbackPrompt, filePath);
      }
      
      // Apply the AI changes
      console.log('Applying AI-generated changes...');
      fs.writeFileSync(filePath, aiResponse.updatedCode);
      
      // Run tests
      console.log('Running tests...');
      testResult = await runTests();
      
      if (testResult.success) {
        console.log('\n✅ Tests passed successfully!');
        break;
      } else {
        console.log('\n❌ Tests failed. Analyzing failures...');
        
        if (iterations === maxIterations) {
          console.log(`\nReached maximum iterations (${maxIterations}). Rolling back changes.`);
          fs.writeFileSync(filePath, originalContent);
          break;
        }
        
        // Continue to next iteration
      }
    }
    
    // Handle final state
    if (testResult && testResult.success) {
      console.log('\nChanges applied successfully! 🎉');
      console.log('The AI has fixed the issues and the tests are now passing.');
      
      // Clean up backup
      fs.unlinkSync(backupPath);
      
      // Summarize changes
      const diff = execSync(`git diff ${filePath}`, { encoding: 'utf8' });
      console.log('\nChanges made:');
      console.log(diff);
    } else {
      console.log('\nUnable to fix the issues automatically. 😞');
      console.log('Rolling back to original version.');
      
      // Restore from backup
      restoreFile(filePath, backupPath);
    }
  } catch (error) {
    console.error('Error in AI-Test loop:', error);
    
    // Restore from backup
    console.log('Rolling back changes due to error...');
    restoreFile(filePath, backupPath);
  }
  
  rl.close();
}

// Simulate AI response function (for demonstration purposes)
function simulateAiResponse(prompt, filePath) {
  // Read original file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // In a real implementation, this would call an AI API
  console.log('(This is a simulation of an AI response. In production, this would call an actual AI API)');
  
  // Simple simulation - just fix a common bug pattern for demo purposes
  let updatedCode = content;
  
  // Simulate fixing common issues
  if (content.includes('console.log(')) {
    updatedCode = content.replace(/console\.log\(/g, '// console.log(');
  } else if (content.includes('new Date().getYear()')) {
    updatedCode = content.replace(/new Date\(\)\.getYear\(\)/g, 'new Date().getFullYear()');
  } else if (content.includes('===')) {
    updatedCode = content.replace(/===/g, '==');
  }
  
  // If no changes were made, introduce a simple change for demo
  if (updatedCode === content) {
    if (content.includes('function')) {
      // Add input validation to the first function
      updatedCode = content.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/,
        'function $1($2) {\n  // Added validation\n  if ($2 === undefined) {\n    return null;\n  }'
      );
    } else {
      // Add a comment at the top
      updatedCode = `// File improved by AI\n${content}`;
    }
  }
  
  return {
    explanation: "Fixed potential issues in the code.",
    updatedCode
  };
}

// Start the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});