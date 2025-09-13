# Agent Router System for Pulser MCP

## Overview

The Agent Router is a core component of the Pulser Multi-Cloud Provider (MCP) architecture. It analyzes tasks and routes them to the appropriate specialized AI agents based on intent, context, and agent capabilities.

This implementation includes:

- A task routing algorithm with weighted scoring based on multiple factors
- Intent analysis and pattern recognition
- Environment-specific bridges and target determination
- Security and permission model
- Fallback cascade support
- MCP execution integration
- History tracking and synchronization with Claudia's memory

## Quick Start

```javascript
const AgentRouter = require('./agent_router');

// Create a router instance
const router = new AgentRouter({
  defaultAgent: 'claudia',
  logRouting: true
});

// Route a task
const result = router.routeTask(
  "Create a 3D visualization of the sales data from Q2", 
  ["visualization", "data-analysis"],
  null,  // No preferred agent
  { filename: "q2_sales.json" }
);

console.log(`Assigned agent: ${result.assignedAgent}`);
console.log(`Target environment: ${result.target}`);
console.log(`Confidence: ${result.confidence.toFixed(2)}`);
```

## Available Agents

The system includes the following specialized agents:

| Agent ID | Description | Primary Expertise | Skill Level |
|----------|-------------|-------------------|-------------|
| `claudia` | Strategic Orchestrator | Business strategy, market analysis | 9/10 |
| `maya` | Process Architect | Workflow design, PRD creation | 9/10 |
| `kalaw` | Research Indexer | Data storage, knowledge management | 8/10 |
| `echo` | Multimodal Analyzer | UI/UX testing, visual analysis | 8/10 |
| `deckgen` | Visualizer | Presentations, data visualization | 7/10 |
| `caca` | Quality Assurance | Testing, validation, QA automation | 7/10 |
| `tide` | Data Analyst | SQL, data validation, health monitoring | 9/10 |
| `surf` | Engineering Expert | Complex engineering, coding, debugging | 10/10 |
| `basher` | Systems Automator | Shell commands, system automation | 9/10 |
| `claude` | General Purpose AI | Code generation, creative tasks | 10/10 |

## Routing Algorithm

The routing algorithm calculates a score for each agent based on:

1. **Domain Matching (30%)**: How well the agent's domains match the task domains
2. **Environment Capability (20%)**: Whether the agent can operate in the required environment
3. **Expertise Matching (30%)**: How well the agent's expertise matches keywords in the task
4. **Skill Level (20%)**: The agent's general skill level in their domain
5. **Filetype Specialization (bonus 20%)**: Extra points for agents specialized in relevant file types

If no agent scores above 0.3 (30%), the default agent (usually `claudia`) is assigned.

## Target Environments

The system supports routing to various environments:

- `terminal`: Command-line interface
- `vscode`: Code editor environment
- `blender`: 3D modeling and rendering environment
- `database`: SQL and database operations
- `jupyter`: Jupyter notebook environment
- `dashboard`: Web dashboard interface
- `orchestrator`: Multi-environment coordination

## MCP Bridges

Each environment has an associated MCP bridge that handles the communication:

- `terminal_mcp_bridge`
- `vscode_mcp_bridge`
- `blender_mcp_bridge`
- `sql_query_router`
- `jupyter_mcp_bridge`
- `dashboard_mcp_bridge`
- `mcp_orchestrator`

## Security and Permissions

The system includes a security model that controls what operations each agent can perform in different environments:

```javascript
// Check if an operation is allowed
const allowed = router.isOperationAllowed(
  "tide",           // Agent ID
  "query",          // Operation type
  "database"        // Target environment
);
```

## Fallback Cascades

If an agent fails to complete a task, the system supports fallback cascades:

- **Creative cascade**: maya → claude → echo → claudia
- **Technical cascade**: surf → claude → basher → claudia
- **Analytical cascade**: tide → claude → kalaw → claudia

## Usage Examples

### Batch Routing

```javascript
// Route multiple tasks at once
const batchResults = router.routeBatch([
  {
    description: "Update the landing page design",
    domains: ["frontend", "ui-ux-design"],
    context: { filename: "landing.html" }
  },
  {
    description: "Fix the authentication bug in the login form",
    domains: ["security", "bugfix"],
    context: { filename: "auth.js" }
  }
]);
```

### Get Suggested Agents

```javascript
// Get suggested agents for a product
const suggestions = router.getSuggestedAgents(
  "InsightPulse Dashboard",
  ["frontend", "data-integration", "documentation"]
);
```

### Execute Through MCP

```javascript
// Execute a task through MCP
const routingResult = router.routeTask(
  "Generate unit tests for the user service",
  ["testing", "quality"],
  null,
  { filename: "user-service.js" }
);

const mcpResult = await router.executeThroughMCP(routingResult, {
  module: "user-service",
  coverage: "90%",
  framework: "jest"
});
```

## Configuration Options

The router can be configured with the following options:

```javascript
const router = new AgentRouter({
  defaultAgent: 'claudia',      // Default agent when no clear match
  logRouting: true,             // Whether to log routing decisions
  routingHistory: [],           // Initial routing history
  historyPath: './routing.jsonl', // Path to save routing history
  mcpEnabled: true,             // Whether MCP execution is enabled
  mcpPort: 9315,                // MCP server port
  mcpAuthToken: 'your-token'    // MCP authentication token
});
```

## Testing

Run the test script to verify the router's functionality:

```bash
node test_agent_router.js
```

## Integration with MCP

The Agent Router integrates with the MCP server to execute tasks in the appropriate environment. The MCP server provides a standardized API for agent execution:

1. The router determines the appropriate agent and environment
2. The router connects to the MCP server with the routing result
3. The MCP server executes the task using the specified bridge
4. The result is returned to the router

## History and Memory

The router maintains a history of routing decisions and can synchronize with Claudia's memory system:

```javascript
// Get routing history
const history = router.getRoutingHistory();

// Save history to disk
router.saveRoutingHistory();

// Sync with Claudia's memory
router.syncWithClaudia();
```

## Development

### Adding a New Agent

To add a new agent, extend the `agents` object in the constructor:

```javascript
this.agents.newAgent = {
  description: 'New Agent Description',
  expertise: ['area1', 'area2', 'area3'],
  domains: ['domain1', 'domain2'],
  environments: ['env1', 'env2'],
  skillLevel: 8
};
```

### Adding Support for a New Environment

To add a new environment:

1. Add the environment to the agent's `environments` array
2. Add a bridge mapping in `_determineBridge`
3. Update the security model in `environmentCapabilities`
4. Update the target determination in `_determineTargetEnvironment`