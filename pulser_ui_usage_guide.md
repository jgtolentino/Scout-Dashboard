# PulserShell UI Usage Guide

## Starting the UI
Navigate to the pulser-ui-shell directory and run:
```bash
cd /Users/tbwa/pulser-ui-shell
npm run dev
```

Then open a browser to: http://localhost:3000

## Basic Commands

The PulserShell supports both slash commands and natural language input:

### Essential Commands

- `/help` - Shows all available commands
- `/show-agents` - Displays the status of all agents
- `/task` - Commands for task management
- `/pulseops` - System operations
- `/clear` - Clears the terminal

### Task Management

- `/task list` - Lists all current tasks
- `/task add "Task title" --assignee "AGENT" --priority high|medium|low --tag tag1,tag2 --note "Task description"`
- `/task scaffold-agent AGENT_ID` - Activates a standby agent (e.g., TALA, GINA, SUNNIES)

### Pulser Operations

- `/pulseops sync-agents` - Synchronizes agent registry
- `/pulseops status` - Shows system status

## Keyboard Navigation

- **Up/Down arrows**: Navigate through command history
- **Tab**: Autocomplete commands
- **Enter**: Execute command

## Using Natural Language

You can also type natural language inputs, which will be processed by CLAUDIA:

```
Extract financial data from my latest Gmail invoices and create a Q2 tax summary
```

The system will:
1. Parse the intent
2. Route to appropriate agents
3. Compress context for token efficiency
4. Execute the necessary tasks

## Agent Visualization

When agents are active, you'll see their responses in the terminal with their ID prefixed:

```
[CLAUDIA]: Task routed to TALA for financial processing
[TALA]: Found 78 invoices from Gmail, processing...
```

## Permission System

For risky operations, a permission modal will appear requiring explicit approval:

```
/pulseops sync-agents
```

This will display a modal asking for confirmation before execution.

## Context Compression

The system automatically compresses context to save tokens. If you exceed token limits, you'll see warnings:

```
⚠️ KALAW: Context exceeding token limit (4500/4000)
Recommended actions: 
- Remove redundant code comments
- Omit detailed implementation code
```

## Example Workflow

Here's a typical workflow:

1. `/show-agents` - Check available agents
2. `/task scaffold-agent TALA` - Activate TALA agent
3. `/task add "Parse Gmail invoices" --assignee "TALA" --priority high --tag finance,invoice`
4. `/task scaffold-agent SUNNIES` - Activate SUNNIES for visualization
5. `/task add "Create dashboard" --assignee "SUNNIES" --priority medium`
6. `/pulseops status` - Check system status

This will set up a chain of tasks similar to the simulation we've already created.