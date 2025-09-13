/**
 * diagram_qa.js - CLI Command for Architecture Diagram QA
 * 
 * This module provides CLI commands for validating and checking
 * architecture diagrams through the Pulser CLI interface.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get base paths
const BASE_DIR = path.resolve(__dirname, '../../');
const JUICER_DIR = path.join(BASE_DIR, 'juicer-stack');
const TOOLS_DIR = path.join(JUICER_DIR, 'tools');
const DOCS_DIR = path.join(JUICER_DIR, 'docs');

// Diagram tools paths
const QUICK_QA_SCRIPT = path.join(TOOLS_DIR, 'run_quick_diagram_qa.sh');
const FULL_QA_SCRIPT = path.join(TOOLS_DIR, 'run_complete_diagram_qa.sh');
const PREVIEW_SCRIPT = path.join(TOOLS_DIR, 'preview_diagram.sh');

/**
 * List available diagrams in the repository
 */
function listDiagrams() {
  const diagrams = [];
  
  // Look in common diagram directories
  const diagramDirs = [
    path.join(DOCS_DIR, 'diagrams'),
    path.join(DOCS_DIR, 'architecture_src'),
    path.join(JUICER_DIR, 'docs/diagrams'),
    path.join(JUICER_DIR, 'docs/architecture_src')
  ];
  
  diagramDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.drawio')) {
          diagrams.push({
            name: file.replace('.drawio', ''),
            path: path.join(dir, file),
            lastModified: fs.statSync(path.join(dir, file)).mtime
          });
        }
      });
    }
  });
  
  // Sort by most recently modified
  diagrams.sort((a, b) => b.lastModified - a.lastModified);
  
  return diagrams;
}

/**
 * Handle diagram QA command
 * @param {Object} args - Command arguments
 * @param {Function} callback - Callback function
 */
function handleCommand(args, callback) {
  // Parse arguments
  const subcommand = args._[0] || 'quick';
  const diagramName = args._[1] || 'project_scout_with_genai';
  const verbose = args.verbose || args.v || false;
  
  // Handle list subcommand
  if (subcommand === 'list') {
    const diagrams = listDiagrams();
    
    if (diagrams.length === 0) {
      callback(null, {
        message: 'No diagrams found in repository',
        data: []
      });
      return;
    }
    
    // Format output
    let message = 'Available diagrams:\n\n';
    
    diagrams.forEach((diagram, index) => {
      const dateStr = diagram.lastModified.toISOString().split('T')[0];
      message += `${index + 1}. ${diagram.name}\n`;
      message += `   Path: ${diagram.path}\n`;
      message += `   Last modified: ${dateStr}\n\n`;
    });
    
    callback(null, {
      message,
      data: diagrams
    });
    return;
  }
  
  // Determine script to run
  let scriptPath = QUICK_QA_SCRIPT;
  let scriptName = 'Quick QA';
  
  if (subcommand === 'full') {
    scriptPath = FULL_QA_SCRIPT;
    scriptName = 'Full QA';
  } else if (subcommand === 'preview') {
    scriptPath = PREVIEW_SCRIPT;
    scriptName = 'Preview';
  }
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    callback(new Error(`${scriptName} script not found at: ${scriptPath}`));
    return;
  }
  
  // Execute the script
  console.log(`Running ${scriptName} on diagram: ${diagramName}`);
  
  const command = `bash "${scriptPath}" "${diagramName}"`;
  
  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      callback(error);
      return;
    }
    
    if (stderr && verbose) {
      console.error(`Error output: ${stderr}`);
    }
    
    // For preview command, which runs a server in the background
    if (subcommand === 'preview') {
      callback(null, {
        message: 'Diagram preview started in browser window.',
        data: { diagramName }
      });
      return;
    }
    
    // Look for QA results file
    const qaResults = path.join(JUICER_DIR, 'docs/images', 
      subcommand === 'quick' ? 'quick_qa_results.md' : 'full_qa_report.md');
    
    let resultContent = '';
    if (fs.existsSync(qaResults)) {
      resultContent = fs.readFileSync(qaResults, 'utf-8');
    }
    
    // Format output for terminal
    const output = stdout.toString().trim();
    let message = `${scriptName} completed for diagram: ${diagramName}\n\n`;
    
    if (resultContent) {
      // Extract a summary from the results file
      const summaryMatch = resultContent.match(/## Summary\s+([\s\S]+?)(?=##|$)/);
      if (summaryMatch && summaryMatch[1]) {
        message += 'Summary:\n' + summaryMatch[1].trim() + '\n\n';
      }
      
      message += `Full results saved to: ${qaResults}\n`;
    } else {
      message += output;
    }
    
    callback(null, {
      message,
      data: {
        diagramName,
        output,
        resultPath: qaResults
      }
    });
  });
}

module.exports = {
  name: 'diagram-qa',
  description: 'Architecture Diagram QA Tools',
  usage: 'diagram-qa [quick|full|preview|list] [diagram-name]',
  examples: [
    'diagram-qa list',
    'diagram-qa quick project_scout_with_genai',
    'diagram-qa full azure_medallion',
    'diagram-qa preview retail_architecture'
  ],
  options: [
    {
      name: '-v, --verbose',
      description: 'Show verbose output'
    }
  ],
  handle: handleCommand
};