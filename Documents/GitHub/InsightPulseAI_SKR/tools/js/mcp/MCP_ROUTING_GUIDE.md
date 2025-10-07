# MCP Routing Guide for Pulser 2.0

This guide explains how the Model Context Protocol (MCP) routing system directs tasks to the appropriate agents and environments based on intent, context, and task content.

## Quick Start

The MCP routing system analyzes user tasks and determines which agent and environment would be best suited to handle it. For example:

- "Create a 3D scene with a table and chair" → Claude in Blender environment
- "Fix the bug in the device monitoring code" → Claude in VS Code environment
- "Query the database for devices with missing customer IDs" → Tide in database environment

## Understanding the Routing System

The routing system works by:

1. **Intent Detection**: Analyzing the task to identify its primary purpose
2. **Route Matching**: Finding the best agent and environment for that intent
3. **Fallback Handling**: Determining alternatives if the primary agent fails
4. **Security Validation**: Ensuring the operation is allowed in the target environment

## Agents and Their Specializations

| Agent   | Primary Specializations                           | Preferred Environments     |
|---------|--------------------------------------------------|----------------------------|
| Claude  | Code generation, creative tasks, 3D design        | VS Code, Blender, Terminal |
| Claudia | Orchestration, session sync, task routing         | All                        |
| Kalaw   | Knowledge repo, documentation, metadata indexing  | VS Code, Terminal          |
| Caca    | QA, testing, validation                           | VS Code, Terminal, Database|
| Echo    | Signal extraction, visual parsing, speech         | Terminal, Media processors |
| Maya    | Workflow architecture, diagramming, visualization | VS Code, Blender           |
| Basher  | Shell commands, system automation, deployment     | Terminal                   |
| Edge    | Sales, customer interaction, frontend UI          | Dashboard, Terminal        |
| Tala    | Finance, invoice tracking, billing                | Database, Dashboard        |
| Stacey  | Deployment, infrastructure, DevOps                | Terminal, Dashboard        |
| Surf    | Complex engineering, autonomous coding, debugging | VS Code, Terminal          |
| Tide    | Data analytics, SQL, validation, health monitoring| Database, Jupyter          |

## Environment Capabilities

| Environment | Key Capabilities                                   | Example Tasks                         |
|-------------|---------------------------------------------------|--------------------------------------|
| Blender     | 3D modeling, rendering, scene manipulation         | Create, modify, render 3D scenes      |
| VS Code     | Code editing, file operations, terminal integration| Edit code, create files, run commands |
| Terminal    | Command execution, script running, system ops      | Run commands, execute scripts         |
| Database    | SQL queries, data validation, health monitoring    | Query data, validate relationships    |
| Jupyter     | Data analysis, visualization, notebook execution   | Analyze data, create visualizations   |
| Dashboard   | UI interaction, data display, reporting            | Display data, create reports          |

## Routing Examples

### Example 1: 3D Scene Creation

User task: "Create a 3D model of a conference room with a table and chairs"

Routing process:
1. Intent detection identifies keywords "3D model", "create"
2. Matches the "3D scene manipulation" intent
3. Routes to Claude agent in Blender environment
4. Uses blender_mcp_bridge as the connector

### Example 2: Code Debugging

User task: "Fix the bug in the device health monitoring code where it's not capturing CustomerID"

Routing process:
1. Intent detection identifies keywords "bug", "code", "device health", "CustomerID"
2. Matches both "code editing" and "device health monitoring" intents
3. Analyzes that code editing is the primary intent
4. Routes to Claude agent in VS Code environment
5. Fallback is set to Surf agent if Claude fails

### Example 3: Data Validation

User task: "Find all devices with firmware versions below 2.0 and missing customer IDs"

Routing process:
1. Intent detection identifies keywords "devices", "firmware", "customer IDs"
2. Matches the "data validation or SQL query" intent
3. Routes to Tide agent in database environment
4. Uses sql_query_router as the connector

## Customizing Routing Behavior

You can customize the routing behavior by editing the `agent_routing.yaml` file. Key areas to modify:

- **Add new routes** for specific types of tasks
- **Update intent recognition patterns** to better identify task types
- **Modify agent capabilities** as agents evolve
- **Adjust fallback cascades** for more robust error handling

## How to Influence Routing Decisions

When formulating tasks, you can influence the routing by:

1. **Being specific** about the environment: "In VS Code, create a new file..."
2. **Mentioning the agent**: "Have Tide query the database for..."
3. **Including file context**: "Edit the file device_monitor.js to fix..."
4. **Specifying intent**: "I need to visualize this data in 3D..."

## Fallback Mechanism

If the primary agent can't handle a task, the system uses fallback cascades:

### Creative Cascade
Maya → Claude → Echo → Claudia

### Technical Cascade
Surf → Claude → Basher → Claudia

### Analytical Cascade
Tide → Claude → Kalaw → Claudia

## Security and Permissions

MCP routing enforces security rules to protect your environment:

- **File Access**: Controls which parts of the filesystem agents can access
- **Terminal Commands**: May require approval for potentially risky commands 
- **Database Operations**: Limited to specific operation types (e.g., SELECT only)
- **Execution Timeouts**: Prevents long-running operations from consuming resources

## Troubleshooting

If tasks aren't being routed correctly:

1. Check the `routing_history.jsonl` file to see routing decisions
2. Ensure your task description clearly indicates the intent
3. Verify the agent and environment you need are available
4. Check if the operation is allowed by security policies

## Advanced: Agent YAML Routing Profile

The complete routing configuration is defined in `agent_routing.yaml`. The structure includes:

- `routes`: Array of routing rules based on intent
- `default_route`: Fallback when no route matches
- `intent_recognition`: Patterns for identifying task intent
- `fallback_cascades`: Sequences of alternate agents
- `agent_capabilities`: Skills and environments for each agent
- `security`: Permission model and environment restrictions

For most users, you won't need to modify this file directly, but it's available for advanced customization.