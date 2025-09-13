/**
 * Demo script for the ReverseSnapshot tool
 * 
 * This script shows how to use the ReverseSnapshot tool to analyze
 * a product and generate a PRD-style report.
 */

const ReverseSnapshot = require('./reverse_snapshot');

/**
 * Demo function to show how to use ReverseSnapshot
 */
function runReverseSnapshotDemo() {
  console.log('Running ReverseSnapshot demo...');
  
  // Create a new ReverseSnapshot instance
  const reverseSnapshot = new ReverseSnapshot({
    outputFormat: 'markdown',
    includeAgents: ['maya', 'claudia', 'kalaw', 'echo', 'deckgen']
  });
  
  // Set the target product to analyze
  reverseSnapshot.setTarget('Codex Relaunch by OpenAI', {
    owner: 'OpenAI',
    context: 'Relaunched after acquiring Windsurf (Codeium) for $3B',
    competitors: ['GitHub Copilot', 'Amazon CodeWhisperer', 'Tabnine']
  });
  
  // Analyze the product
  reverseSnapshot.analyze();
  
  // Generate the output
  const output = reverseSnapshot.generateOutput();
  
  // Log the output
  console.log('ReverseSnapshot Output:');
  console.log('-------------------------');
  console.log(output);
  
  return output;
}

// Export the demo function
module.exports = { runReverseSnapshotDemo };

// Run the demo if this file is executed directly
if (require.main === module) {
  runReverseSnapshotDemo();
}