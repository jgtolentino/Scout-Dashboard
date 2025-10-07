# MCP Bridge for Claude Desktop + Clodrep + Pulser Integration

This MCP (Message Control Protocol) Bridge enables seamless integration between Claude Desktop, Clodrep, and Pulser tools. The bridge allows Claude Desktop to trigger tasks in Clodrep and Pulser and retrieve the results.

## Directory Structure

```
/mcp/
├── dispatch_queue.json     # incoming requests from desktop
├── results/                # processed outputs from clodrep/pulser
│   └── <task_id>.json      # result files
│   └── <task_id>_status.json # status tracking files
├── bridge/
│   ├── claude_mcp_bridge.py   # watches dispatch_queue, routes to CLI
│   ├── status_monitor.py      # updates task status
│   └── mcp_bridge.log         # log file
└── config/
    └── mcp_routes.yaml        # maps task types to handlers
```

## Setup

1. Ensure Python 3.6+ is installed
2. Install required dependencies:
   ```bash
   pip install pyyaml
   ```
3. Make the scripts executable:
   ```bash
   chmod +x mcp/bridge/claude_mcp_bridge.py
   chmod +x mcp/bridge/status_monitor.py
   ```

## Usage

### Starting the MCP Bridge

Start the bridge to listen for tasks:

```bash
cd <repo_root>
python mcp/bridge/claude_mcp_bridge.py
```

For production use, you might want to run it as a background service.

### Monitoring Tasks

To monitor the status of tasks:

```bash
# Single status check
python mcp/bridge/status_monitor.py

# Watch mode (continuous updates)
python mcp/bridge/status_monitor.py --watch --interval 3

# Don't show completed tasks
python mcp/bridge/status_monitor.py --no-completed

# Clean up old task files
python mcp/bridge/status_monitor.py --cleanup --cleanup-days 14
```

### Sending Tasks from Claude Desktop

Use the TypeScript module `claude_desktop_dispatch.ts` in your Electron/React application:

```typescript
import { sendToMCP, pollForResult } from '../mcp/claude_desktop_dispatch';

// Send a code review task
const taskId = await sendToMCP('run_code_review', {
  project_path: '/path/to/project'
});

// Wait for the result
const result = await pollForResult(taskId);
console.log('Code review result:', result);
```

### Configuration

Edit `mcp/config/mcp_routes.yaml` to configure task types and routes:

```yaml
routes:
  run_code_review:
    agent: clodrep
    command: "clodrep :review {{project_path}}"
  generate_prd:
    agent: pulser
    command: "pulser :generate-prd --input {{doc_path}}"
```

## Task Flow

1. Claude Desktop creates a task in `dispatch_queue.json`
2. MCP Bridge detects the task and routes it to Clodrep or Pulser
3. The task is executed and results are saved in the `results` directory
4. Claude Desktop retrieves the results and displays them to the user

## Troubleshooting

- Check `mcp/bridge/mcp_bridge.log` for error messages
- Use `status_monitor.py` to see the status of tasks
- If tasks get stuck, check for permissions issues or command errors

## Custom Handlers

To add custom handlers, update `mcp_routes.yaml` with new routes and implement the corresponding functionality in the CLI tools.

## Security Considerations

- The MCP bridge should run on the same machine as Claude Desktop
- No sensitive data should be included in task parameters
- Consider implementing authentication if needed