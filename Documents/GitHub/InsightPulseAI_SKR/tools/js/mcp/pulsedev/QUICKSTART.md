# PulseDev MCP Prompts Quick Start Guide

This guide helps you quickly start using PulseDev's specialized MCP prompts with Claudia orchestration and Pulser CLI integration.

## Setup (One-time)

Make sure you've already followed the installation guide. If not, see [INSTALLATION.md](INSTALLATION.md).

```bash
# Register with Kalaw knowledge system
./register_with_kalaw.sh

# Integrate with Pulser CLI
./pulser_integration.sh

# Add prompt aliases to your shell (add to ~/.zshrc)
source /path/to/pulsedev/prompt_aliases.sh
```

## Start the System

```bash
# Launch PulseDev with Claudia integration
./launch_claudia_integrated.sh
```

## Basic Pulser CLI Commands

```bash
# List all available prompts
pulser mcp_prompts list

# Get details about a prompt
pulser mcp_prompts info cursor/chat_prompt

# Switch to a specific prompt
pulser mcp_prompts switch vscode/code_assistant

# Get prompt recommendations for a task
pulser mcp_prompts recommend "Create a login form with React"

# Check system status
pulser mcp_prompts status
```

## Using Quick Aliases

The following aliases are available after sourcing `prompt_aliases.sh`:

```bash
# List all prompts
plist

# Tool-specific prompts
pcode     # Cursor-style coding assistance
pcmd      # Replit-style terminal operations
pdev      # VSCode-style IDE assistance
pux       # UX design focus
pcomp     # Component architecture
pslides   # Presentation creation
pdocs     # Technical documentation
pauto     # Autonomous development
pagent    # Agent behavior programming
pall      # All capabilities combined

# Claude model prompts (after running integrate_prompt_library.sh)
phaiku    # Claude 3 Haiku (fast, efficient)
psonnet   # Claude 3 Sonnet (balanced)
popus     # Claude 3 Opus (advanced, complex reasoning)
```

## Prompt Library Integration

To integrate with the distilled prompt library:

```bash
# Integrate the distilled prompt library with PulseDev
./integrate_prompt_library.sh

# The script will:
# 1. Import the distilled prompts
# 2. Convert them to MCP format
# 3. Register them with Kalaw
# 4. Update your .pulserrc file
# 5. Add aliases for the Claude models
```

## Prompt Guide

| Alias | Focus | Best For |
|-------|-------|----------|
| pcode | Code writing & debugging | General programming tasks |
| pcmd | Terminal commands | Command-line operations |
| pdev | IDE assistance | Code exploration & documentation |
| pux | UX design | User interfaces & experiences |
| pcomp | Component architecture | UI components & app structure |
| pslides | Presentations | Creating slide decks & presentations |
| pdocs | Documentation | Technical writing & documentation |
| pauto | Autonomous development | End-to-end project implementation |
| pagent | Agent programming | Creating & tuning AI agents |
| pall | Combined capabilities | General-purpose assistance |

## Web Interface

Access the web interface at: http://localhost:5173

The UI allows you to:
- Switch between prompts
- View prompt details
- See usage metrics
- Access task history

## API Endpoints

### Claudia Bridge API

```bash
# Get system status
curl http://localhost:8000/api/claudia/status

# Execute a task with automatic prompt selection
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Create a login form with React"}'

# Switch to a specific prompt
curl -X POST http://localhost:8000/api/claudia/switch \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Create a login form", "prompt_name": "rork/component_logic"}'

# Get usage metrics
curl http://localhost:8000/api/claudia/metrics
```

## Example Workflows

### Web Development

```bash
# Switch to component architecture mode
pcomp

# Task: Create a responsive navbar
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Create a responsive navbar with React"}'

# Switch to UX design mode for styling
pux

# Task: Style the navbar
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Style the navbar with a modern look"}'
```

### Documentation

```bash
# Switch to documentation mode
pdocs

# Task: Generate API documentation
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Generate API documentation for the user authentication endpoints"}'
```

### Presentation Creation

```bash
# Switch to presentation mode
pslides

# Task: Create a product pitch
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{"task_description": "Create a product pitch deck for our new AI feature"}'
```

## Troubleshooting

If you encounter issues:

1. Check system status:
   ```bash
   pulser mcp_prompts status
   ```

2. Restart the system:
   ```bash
   ./shutdown.sh
   ./launch_claudia_integrated.sh
   ```

3. Check logs:
   ```bash
   cat logs/claudia_mcp.log
   cat logs/backend.log
   ```

## Additional Resources

- [README_AGENT_INTEGRATION.md](README_AGENT_INTEGRATION.md) - Detailed integration documentation
- [README_CLAUDE_INTEGRATION.md](README_CLAUDE_INTEGRATION.md) - Claude integration details