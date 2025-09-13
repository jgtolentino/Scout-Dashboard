/**
 * powerbi_qa.js - Power BI Style QA CLI Command
 * 
 * This module provides CLI access to the Power BI style validation tools
 * for ensuring dashboards maintain the native Power BI look and feel.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get base paths
const BASE_DIR = path.resolve(__dirname, '../../');
const JUICER_DIR = path.join(BASE_DIR, 'juicer-stack');
const TOOLS_DIR = path.join(JUICER_DIR, 'tools');
const OUTPUT_DIR = path.join(JUICER_DIR, 'docs/images');

// Tool paths
const POWERBI_QA_SCRIPT = path.join(TOOLS_DIR, 'run_powerbi_qa.sh');
const DASHBOARD_SERVER_SCRIPT = path.join(TOOLS_DIR, 'serve_retail_dashboards.sh');

/**
 * Get the URL of a running dashboard server
 */
function getDashboardUrl() {
  // Check for a server info file from the serve_retail_dashboards.sh script
  const tmpDirPattern = '/tmp/retail_dashboards_*';
  const serverPortFile = 'server_port.txt';
  
  try {
    // Find the most recent port file using bash
    const portFilePath = execSync(`find ${tmpDirPattern} -name ${serverPortFile} -type f -print | sort -r | head -n 1`).toString().trim();
    
    if (portFilePath && fs.existsSync(portFilePath)) {
      const port = fs.readFileSync(portFilePath, 'utf-8').trim();
      if (port) {
        return `http://localhost:${port}`;
      }
    }
  } catch (error) {
    // Fall back to default port if we can't find the dynamic port
  }
  
  // Default to port 3000
  return 'http://localhost:3000';
}

/**
 * Handle powerbi-qa command
 * @param {Object} args - Command arguments
 * @param {Function} callback - Callback function
 */
function handleCommand(args, callback) {
  // Parse arguments
  const subcommand = args._[0] || 'run';
  const dashboardUrl = args._[1] || getDashboardUrl();
  const outputDir = args.output || args.o || OUTPUT_DIR;
  const verbose = args.verbose || args.v || false;
  
  // Handle help subcommand
  if (subcommand === 'help') {
    const helpMessage = `
Power BI Style QA Tool

Usage:
  powerbi-qa run [url] [options]    Run QA checks on a dashboard
  powerbi-qa serve                  Start a local server and run QA
  powerbi-qa info                   Show information about the QA tool
  powerbi-qa help                   Show this help message

Options:
  --output, -o    Specify output directory for results
  --verbose, -v   Show verbose output
  
Examples:
  powerbi-qa run http://localhost:3000
  powerbi-qa serve
  powerbi-qa run --output ./qa-results
`;
    
    callback(null, { message: helpMessage });
    return;
  }
  
  // Handle info subcommand
  if (subcommand === 'info') {
    const infoMessage = `
Power BI Style QA Tool

This tool checks dashboards for Power BI style compliance, including:
- Typography (Segoe UI font, size, color)
- 8px grid alignment
- KPI card formatting
- Interaction patterns
- Accessibility (WCAG AA)
- Performance metrics
- Visual regression testing

QA checks run against a live dashboard URL and generate reports
with detailed findings and visualizations.

For more information, see:
${path.join(TOOLS_DIR, 'README_POWERBI_QA.md')}
`;
    
    callback(null, { message: infoMessage });
    return;
  }
  
  // Handle serve subcommand
  if (subcommand === 'serve') {
    console.log('Starting local dashboard server...');
    
    // Check if the server script exists
    if (!fs.existsSync(DASHBOARD_SERVER_SCRIPT)) {
      callback(new Error(`Dashboard server script not found at: ${DASHBOARD_SERVER_SCRIPT}`));
      return;
    }
    
    // Execute the server script
    const serverProcess = exec(`bash "${DASHBOARD_SERVER_SCRIPT}"`, { maxBuffer: 1024 * 1024 * 10 });
    
    // Wait for the server to start
    setTimeout(() => {
      const serverUrl = getDashboardUrl();
      console.log(`Running Power BI QA against: ${serverUrl}`);
      
      // Now run the QA script against the local server
      const qaCommand = `bash "${POWERBI_QA_SCRIPT}" "${serverUrl}" "${outputDir}"`;
      
      exec(qaCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        // Kill the server process
        serverProcess.kill();
        
        if (error) {
          callback(error);
          return;
        }
        
        if (stderr && verbose) {
          console.error(`Error output: ${stderr}`);
        }
        
        callback(null, {
          message: 'Power BI QA completed (server auto-terminated)',
          data: { output: stdout }
        });
      });
    }, 3000); // Wait 3 seconds for server to start
    
    return;
  }
  
  // Handle run subcommand (default)
  // Check if the script exists
  if (!fs.existsSync(POWERBI_QA_SCRIPT)) {
    callback(new Error(`Power BI QA script not found at: ${POWERBI_QA_SCRIPT}`));
    return;
  }
  
  console.log(`Running Power BI QA on: ${dashboardUrl}`);
  
  // Execute the script
  const command = `bash "${POWERBI_QA_SCRIPT}" "${dashboardUrl}" "${outputDir}"`;
  
  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      callback(error);
      return;
    }
    
    if (stderr && verbose) {
      console.error(`Error output: ${stderr}`);
    }
    
    // Find the most recent report file
    const reportFiles = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('powerbi_qa_report_') && file.endsWith('.md'))
      .sort()
      .reverse();
    
    let reportSummary = 'QA complete. Check the output directory for results.';
    
    if (reportFiles.length > 0) {
      const latestReport = path.join(outputDir, reportFiles[0]);
      const reportContent = fs.readFileSync(latestReport, 'utf-8');
      
      // Extract summary section
      const summaryMatch = reportContent.match(/## Summary\s+([^#]*)/);
      if (summaryMatch && summaryMatch[1]) {
        reportSummary = summaryMatch[1].trim();
      }
      
      // Add report path
      reportSummary += `\n\nFull report: ${latestReport}`;
    }
    
    callback(null, {
      message: reportSummary,
      data: { output: stdout }
    });
  });
}

module.exports = {
  name: 'powerbi-qa',
  description: 'Power BI Style QA for Dashboards',
  usage: 'powerbi-qa [run|serve|info|help] [url] [options]',
  examples: [
    'powerbi-qa run http://localhost:3000',
    'powerbi-qa serve',
    'powerbi-qa info',
    'powerbi-qa run --output ./qa-results'
  ],
  options: [
    {
      name: '-o, --output',
      description: 'Output directory for QA results'
    },
    {
      name: '-v, --verbose',
      description: 'Show verbose output'
    }
  ],
  handle: handleCommand
};