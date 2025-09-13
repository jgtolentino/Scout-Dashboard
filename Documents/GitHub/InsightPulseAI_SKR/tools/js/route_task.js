#!/usr/bin/env node
/**
 * Command-line interface for the AgentRouter
 * 
 * Allows users to easily route tasks to specialized agents from the command line.
 * 
 * Usage:
 *   node route_task.js "Create unit tests for the authentication module" --agent=caca
 *   node route_task.js "Optimize database queries" --domains=database,performance
 *   node route_task.js "Create a 3D scene" --filename=scene.blend
 */

const AgentRouter = require('./agent_router');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    task: null,
    agent: null,
    domains: [],
    environment: null,
    filename: null,
    verbose: false,
    execute: false,
    help: false,
    jsonOutput: false
  };

  // Check for help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    params.help = true;
    return params;
  }

  // First non-flag argument is the task
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('-') && !params.task) {
      params.task = arg;
      continue;
    }

    // Parse flags
    if (arg.startsWith('--agent=')) {
      params.agent = arg.substring('--agent='.length);
    } else if (arg.startsWith('--domains=')) {
      params.domains = arg.substring('--domains='.length).split(',');
    } else if (arg.startsWith('--environment=')) {
      params.environment = arg.substring('--environment='.length);
    } else if (arg.startsWith('--filename=')) {
      params.filename = arg.substring('--filename='.length);
    } else if (arg === '--verbose' || arg === '-v') {
      params.verbose = true;
    } else if (arg === '--execute' || arg === '-e') {
      params.execute = true;
    } else if (arg === '--json') {
      params.jsonOutput = true;
    }
  }

  return params;
}

// Display help message
function showHelp() {
  console.log('AgentRouter - Command-line interface for routing tasks to specialized agents');
  console.log('\nUsage:');
  console.log('  node route_task.js "Your task description" [options]');
  console.log('\nOptions:');
  console.log('  --agent=AGENT       Preferred agent to route to (e.g., claudia, maya, surf)');
  console.log('  --domains=D1,D2,D3  Comma-separated list of domains (e.g., frontend,database)');
  console.log('  --environment=ENV   Target environment (e.g., terminal, vscode, database)');
  console.log('  --filename=FILE     Context filename for the task');
  console.log('  --verbose, -v       Enable verbose output');
  console.log('  --execute, -e       Execute the task through MCP');
  console.log('  --json              Output results in JSON format');
  console.log('  --help, -h          Show this help message');
  console.log('\nExamples:');
  console.log('  node route_task.js "Create unit tests for authentication" --agent=caca');
  console.log('  node route_task.js "Optimize database queries" --domains=database,performance');
  console.log('  node route_task.js "Set up CI/CD pipeline" --environment=terminal --execute');
}

// Run the main program
async function main() {
  const params = parseArgs();
  
  if (params.help) {
    showHelp();
    return;
  }
  
  if (!params.task) {
    console.error('Error: No task provided. Use --help for usage information.');
    process.exit(1);
  }
  
  // Create router
  const router = new AgentRouter({
    logRouting: params.verbose,
    mcpEnabled: params.execute
  });
  
  // Build context
  const context = {};
  if (params.environment) context.environment = params.environment;
  if (params.filename) context.filename = params.filename;
  
  // Route the task
  const result = router.routeTask(
    params.task,
    params.domains,
    params.agent,
    context
  );
  
  // Execute if requested
  if (params.execute) {
    try {
      console.log(`Executing task through MCP...`);
      const mcpResult = await router.executeThroughMCP(result, {
        task: params.task,
        timestamp: new Date().toISOString()
      });
      
      if (params.jsonOutput) {
        console.log(JSON.stringify({
          routing: result,
          execution: mcpResult
        }, null, 2));
      } else {
        console.log('\nExecution Result:');
        console.log(`Status: ${mcpResult.status}`);
        console.log(`Execution ID: ${mcpResult.executionId}`);
        console.log(`Agent: ${mcpResult.agent}`);
        console.log(`Target: ${mcpResult.target}`);
        console.log(`Bridge: ${mcpResult.bridge}`);
        console.log(`Timestamp: ${mcpResult.timestamp}`);
      }
    } catch (error) {
      console.error(`Execution failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Output routing result
    if (params.jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\nRouting Result:');
      console.log(`Assigned Agent: ${result.assignedAgent}`);
      console.log(`Confidence: ${result.confidence.toFixed(2)}`);
      console.log(`Target Environment: ${result.target}`);
      console.log(`Bridge: ${result.bridge || 'default'}`);
      
      if (result.fallbackChain && Array.isArray(result.fallbackChain)) {
        console.log(`Fallback Chain: ${result.fallbackChain.join(' → ')}`);
      } else {
        console.log(`Fallback Chain: None`);
      }
      
      if (params.verbose) {
        console.log(`Reasoning: ${result.reasoning}`);
        console.log(`Timestamp: ${result.timestamp}`);
      }
    }
  }
  
  // Save routing history
  router.saveRoutingHistory();
  
  // Try to sync with Claudia if verbose mode
  if (params.verbose) {
    router.syncWithClaudia();
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});