#!/usr/bin/env node

/**
 * Prompt Template Verification Script
 * 
 * This script verifies that prompt templates follow best practices,
 * including safety checks, clear context, and proper formatting.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

// Required sections that should be in a prompt template
const REQUIRED_SECTIONS = [
  'Requirements',  // Requirements for the change
  'Constraints',   // Constraints/limitations to consider
  'Verification',  // Verification steps
  'Self-Test'      // Self-testing prompts
];

// Patterns that indicate good guardrails
const SAFETY_PATTERNS = [
  // Verification-related patterns
  /verif(y|ication)/i,
  /check/i,
  /test/i,
  /validat(e|ion)/i,
  
  // Safety-related patterns
  /security/i,
  /vulnerabilit(y|ies)/i,
  /error handling/i,
  
  // Edge case patterns
  /edge case/i,
  /corner case/i,
  /exception/i,
  
  // Self-reflection patterns
  /self(-|\s)?test/i,
  /review/i,
  /evaluat(e|ion)/i
];

async function verifyPromptTemplate(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Verifying prompt template: ${fileName}`);
    
    const issues = [];
    
    // Check for required sections
    const missingSections = [];
    for (const section of REQUIRED_SECTIONS) {
      if (!content.includes(section)) {
        missingSections.push(section);
      }
    }
    
    if (missingSections.length > 0) {
      issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Check for safety patterns
    const safetyMatches = SAFETY_PATTERNS.filter(pattern => pattern.test(content));
    if (safetyMatches.length < 3) {
      issues.push('Insufficient safety guardrails in prompt template');
    }
    
    // Check for placeholder patterns (e.g., {{variable}})
    const placeholderMatches = content.match(/{{[^}]+}}/g) || [];
    if (placeholderMatches.length === 0) {
      issues.push('No variable placeholders found (e.g., {{variable}})');
    }
    
    // Check for minimum length
    if (content.length < 500) {
      issues.push('Prompt template is too short (< 500 characters)');
    }
    
    // Report results
    if (issues.length === 0) {
      console.log(`✅ ${fileName} passes all verification checks`);
      return { file: fileName, status: 'pass', issues: [] };
    } else {
      console.log(`❌ ${fileName} has verification issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      return { file: fileName, status: 'fail', issues };
    }
  } catch (error) {
    console.error(`Error verifying ${filePath}: ${error.message}`);
    return { file: path.basename(filePath), status: 'error', issues: [error.message] };
  }
}

async function main() {
  try {
    const promptsDir = path.join(__dirname, '..', 'prompts');
    const files = await readdir(promptsDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      console.log('No prompt templates found in the prompts directory');
      process.exit(1);
    }
    
    console.log(`Found ${mdFiles.length} prompt templates to verify`);
    
    const results = [];
    let hasFailures = false;
    
    for (const file of mdFiles) {
      const filePath = path.join(promptsDir, file);
      const result = await verifyPromptTemplate(filePath);
      results.push(result);
      
      if (result.status !== 'pass') {
        hasFailures = true;
      }
    }
    
    // Generate report
    console.log('\nPrompt Template Verification Summary:');
    console.log('=====================================');
    console.log(`Total templates: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.status === 'pass').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'fail').length}`);
    console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);
    
    if (hasFailures) {
      console.log('\nVerification failed. Please fix the issues reported above.');
      process.exit(1);
    } else {
      console.log('\nAll prompt templates verified successfully!');
    }
  } catch (error) {
    console.error(`Error verifying prompt templates: ${error.message}`);
    process.exit(1);
  }
}

main();