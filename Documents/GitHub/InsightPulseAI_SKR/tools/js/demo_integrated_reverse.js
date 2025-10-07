/**
 * Demo for Integrated ReverseSnapshot Tool
 * 
 * This script demonstrates how to use the integrated ReverseSnapshot tool
 * with agent routing capabilities to analyze a product and generate a
 * PRD-style report.
 */

const ReverseSnapshot = require('./reverse_snapshot_integrated');

/**
 * Demo function to show how to use the integrated ReverseSnapshot tool
 */
function runIntegratedReverseDemo() {
  console.log('*****************************************************');
  console.log('* Running Integrated ReverseSnapshot Demo with Agent Routing');
  console.log('*****************************************************');
  console.log('');
  
  // Create a new ReverseSnapshot instance with agent routing enabled
  const reverseSnapshot = new ReverseSnapshot({
    outputFormat: 'markdown',
    includeAgents: ['maya', 'claudia', 'kalaw', 'echo', 'deckgen'],
    logAgentRouting: true // Enable logging of agent routing decisions
  });
  
  // Set the target product to analyze with more detailed context
  reverseSnapshot.setTarget('Codex Relaunch by OpenAI', {
    owner: 'OpenAI',
    context: 'Relaunched after acquiring Windsurf (Codeium) for $3B',
    competitors: ['GitHub Copilot', 'Amazon CodeWhisperer', 'Tabnine'],
    type: 'developer-tool',
    taskDomains: [
      'product-planning', 
      'market-analysis', 
      'ui-ux-design',
      'development',
      'visualization'
    ]
  });
  
  console.log('Starting product analysis...');
  
  // Analyze the product
  reverseSnapshot.analyze();
  
  console.log('Analysis complete, generating output...');
  
  // Generate the output
  const output = reverseSnapshot.generateOutput();
  
  // Save the output to a file
  const fs = require('fs');
  const outputPath = './output/reverse_snapshot_result.md';
  
  // Create the output directory if it doesn't exist
  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }
  
  fs.writeFileSync(outputPath, output);
  
  console.log(`Output saved to ${outputPath}`);
  console.log('');
  console.log('Sample of the output:');
  console.log('-------------------');
  
  // Print the first 20 lines of the output
  const outputLines = output.split('\n');
  outputLines.slice(0, 20).forEach(line => console.log(line));
  
  console.log('...');
  console.log(`(${outputLines.length} lines total)`);
  
  return output;
}

/**
 * Run the demo as a command line script
 */
function runFromCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node demo_integrated_reverse.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h      Show this help message');
    console.log('  --save-only     Generate the output but don\'t print to console');
    console.log('  --format=<fmt>  Output format (markdown, json, yaml)');
    console.log('');
    process.exit(0);
  }
  
  const saveOnly = args.includes('--save-only');
  
  // Parse format option
  let format = 'markdown';
  const formatArg = args.find(arg => arg.startsWith('--format='));
  if (formatArg) {
    format = formatArg.split('=')[1];
  }
  
  // Create a new ReverseSnapshot instance with the specified format
  const reverseSnapshot = new ReverseSnapshot({
    outputFormat: format,
    includeAgents: ['maya', 'claudia', 'kalaw', 'echo', 'deckgen'],
    logAgentRouting: !saveOnly // Only log if not in save-only mode
  });
  
  // Set the target product to analyze
  reverseSnapshot.setTarget('Codex Relaunch by OpenAI', {
    owner: 'OpenAI',
    context: 'Relaunched after acquiring Windsurf (Codeium) for $3B',
    competitors: ['GitHub Copilot', 'Amazon CodeWhisperer', 'Tabnine'],
    type: 'developer-tool'
  });
  
  // Analyze the product
  reverseSnapshot.analyze();
  
  // Generate the output
  const output = reverseSnapshot.generateOutput();
  
  // Save the output to a file
  const fs = require('fs');
  const outputPath = `./output/reverse_snapshot_result.${format === 'markdown' ? 'md' : format}`;
  
  // Create the output directory if it doesn't exist
  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }
  
  fs.writeFileSync(outputPath, output);
  
  if (!saveOnly) {
    console.log(output);
  }
  
  console.log(`Output saved to ${outputPath}`);
}

// Export the demo function
module.exports = { runIntegratedReverseDemo };

// Run the demo if this file is executed directly
if (require.main === module) {
  if (process.argv.length > 2) {
    runFromCommandLine();
  } else {
    runIntegratedReverseDemo();
  }
}