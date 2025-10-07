#!/usr/bin/env node
/**
 * Test script for the enhanced AgentRouter.
 * 
 * Runs various scenarios to test the routing functionality with different tasks,
 * contexts, and configurations.
 */

const AgentRouter = require('./agent_router');

// Create a router instance with verbose logging
const router = new AgentRouter({
  logRouting: true,
  defaultAgent: 'claudia',
  mcpEnabled: true
});

// Define test tasks
const testTasks = [
  {
    description: "Simple code editing: Write a function to parse JSON data and validate it against a schema",
    domains: [],
    context: {}
  },
  {
    description: "3D modeling task: Create a 3D scene with a table and chair for product visualization",
    domains: [],
    context: {}
  },
  {
    description: "Data analysis: Query the database for device health metrics and generate a summary report",
    domains: [],
    context: {}
  },
  {
    description: "Terminal automation: Run the deployment script and verify the application is working correctly",
    domains: [],
    context: {}
  },
  {
    description: "Documentation: Update the user manual with the new features from the latest release",
    domains: [],
    context: {}
  },
  {
    description: "Testing: Create unit tests for the new user authentication module",
    domains: [],
    context: { filename: "auth_tests.test.js" }
  },
  {
    description: "Create a presentation deck for the Q2 results with charts and visual elements",
    domains: [],
    context: {}
  },
  {
    description: "Set up the CI/CD pipeline for automatic deployment to staging environment",
    domains: ["devops", "automation"],
    context: {}
  }
];

// Function to run the tests
async function runTests() {
  console.log("============================================");
  console.log("          AGENT ROUTER TEST SUITE          ");
  console.log("============================================");
  console.log("Testing various task routing scenarios...\n");

  // Run each test task
  for (const [index, task] of testTasks.entries()) {
    console.log(`\n--- TEST ${index + 1}: ${task.description.substring(0, 50)}... ---`);
    
    const result = router.routeTask(task.description, task.domains, null, task.context);
    
    console.log(`Assigned Agent: ${result.assignedAgent}`);
    console.log(`Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`Target: ${result.target}`);
    console.log(`Bridge: ${result.bridge}`);
    console.log(`Fallback Chain: ${result.fallbackChain.join(' → ')}`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log("-------------------------------------------");
  }

  // Test preferred agent routing
  console.log("\n--- TEST: Preferred Agent Routing ---");
  const preferredResult = router.routeTask(
    "Analyze the database schema and suggest optimizations",
    [],
    "tide",
    {}
  );
  console.log(`Assigned Agent: ${preferredResult.assignedAgent}`);
  console.log(`Confidence: ${preferredResult.confidence.toFixed(2)}`);
  console.log(`Target: ${preferredResult.target}`);
  console.log(`Reasoning: ${preferredResult.reasoning}`);
  console.log("-------------------------------------------");

  // Test batch routing
  console.log("\n--- TEST: Batch Routing ---");
  const batchResults = router.routeBatch([
    {
      description: "Create a new component for the dashboard UI",
      domains: ["frontend", "ui-ux-design"],
      context: { filename: "dashboard_component.jsx" }
    },
    {
      description: "Optimize the database queries for better performance",
      domains: ["database", "performance"],
      context: { filename: "queries.sql" }
    }
  ]);
  
  for (const [i, result] of batchResults.entries()) {
    console.log(`\nBatch Result ${i + 1}:`);
    console.log(`Assigned Agent: ${result.assignedAgent}`);
    console.log(`Target: ${result.target}`);
    console.log(`Bridge: ${result.bridge}`);
  }
  console.log("-------------------------------------------");

  // Test suggested agents for product
  console.log("\n--- TEST: Suggested Agents ---");
  const suggestedAgents = router.getSuggestedAgents("InsightPulse Dashboard", [
    "frontend-development",
    "data-integration",
    "documentation",
    "testing",
    "deployment"
  ]);
  
  console.log("Suggested Agent Assignments:");
  for (const agent of suggestedAgents) {
    console.log(`- ${agent.id} (${agent.role}): ${agent.task}`);
    console.log(`  Target: ${agent.target}, Bridge: ${agent.bridge}`);
  }
  console.log("-------------------------------------------");

  // Test operation permission checks
  console.log("\n--- TEST: Operation Permissions ---");
  const permissionTests = [
    { agent: "tide", operation: "query", target: "database" },
    { agent: "tide", operation: "write", target: "database" },
    { agent: "basher", operation: "execute_command", target: "terminal" },
    { agent: "surf", operation: "file_read", target: "vscode" },
    { agent: "claude", operation: "execute_command", target: "blender" }
  ];
  
  for (const test of permissionTests) {
    const allowed = router.isOperationAllowed(test.agent, test.operation, test.target);
    console.log(`${test.agent} → ${test.operation} on ${test.target}: ${allowed ? "ALLOWED" : "DENIED"}`);
  }
  console.log("-------------------------------------------");

  // Test MCP execution (simulated)
  console.log("\n--- TEST: MCP Execution ---");
  try {
    const routingResult = router.routeTask(
      "Generate unit tests for the authentication module",
      ["testing", "quality"],
      null,
      { filename: "auth.js" }
    );
    
    console.log(`Executing through MCP: ${routingResult.assignedAgent} on ${routingResult.target}`);
    
    const mcpResult = await router.executeThroughMCP(routingResult, {
      module: "authentication",
      coverage: "90%",
      framework: "jest"
    });
    
    console.log("MCP Execution Result:");
    console.log(`Status: ${mcpResult.status}`);
    console.log(`Execution ID: ${mcpResult.executionId}`);
    console.log(`Timestamp: ${mcpResult.timestamp}`);
  } catch (error) {
    console.error(`MCP Execution Error: ${error.message}`);
  }
  console.log("-------------------------------------------");

  // Display routing history
  console.log("\n--- ROUTING HISTORY ---");
  const history = router.getRoutingHistory();
  console.log(`Total routing decisions: ${history.length}`);
  console.log("Last 3 routing decisions:");
  
  for (const entry of history.slice(-3)) {
    console.log(`- ${entry.timestamp}: "${entry.task.substring(0, 30)}..." → ${entry.assignedAgent} (${entry.target})`);
  }
  console.log("-------------------------------------------");
  
  // Try to save routing history
  console.log("\n--- SAVING ROUTING HISTORY ---");
  const saved = router.saveRoutingHistory();
  console.log(`Routing history saved: ${saved ? "SUCCESS" : "FAILED"}`);
  
  // Try to sync with Claudia's memory
  console.log("\n--- SYNCING WITH CLAUDIA ---");
  const synced = router.syncWithClaudia();
  console.log(`Sync with Claudia: ${synced ? "SUCCESS" : "FAILED"}`);
  
  console.log("\n============================================");
  console.log("          TEST SUITE COMPLETED            ");
  console.log("============================================");
}

// Run the tests
runTests().catch(error => {
  console.error("Test error:", error);
});