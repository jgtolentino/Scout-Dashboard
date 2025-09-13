# PulseDev Agent Integration

This document describes the integration of PulseDev's MCP prompts system with Pulser's agent orchestration layer via Claudia and knowledge indexing via Kalaw.

## Overview

PulseDev's Model Context Protocol (MCP) prompts system provides specialized AI behaviors that tune Claude to emulate various AI tools (Cursor, Replit, VSCode, etc.). This integration connects these prompts to the broader Pulser ecosystem:

1. **Claudia Integration**: Enables agent-layer orchestration, allowing Claudia to control prompt selection and usage based on task requirements
2. **Kalaw Integration**: Indexes MCP prompts in the Structured Knowledge Repository (SKR) for knowledge retrieval and reuse
3. **Pulser CLI Integration**: Provides command-line access to the MCP prompts system through the Pulser CLI

## Components

### 1. Claudia MCP Bridge

Located at `backend/services/claudia_mcp_bridge.py`, this component bridges Claudia's orchestration capabilities with PulseDev's MCP system:

- Auto-selects appropriate prompts based on task descriptions
- Tracks prompt usage metrics and telemetry
- Provides an API for Claudia to control prompt selection
- Manages session tracking for multi-step tasks

### 2. Kalaw Knowledge Index

Located at `kalaw_mcp_prompts.yaml`, this YAML file indexes the MCP prompts collection for Kalaw:

- Defines metadata for the entire collection
- Catalogs each prompt with its capabilities and relationships
- Includes conceptual knowledge for retrieval and integration
- Specifies search keywords and example queries

### 3. API Integration

Located at `backend/routes/claudia_bridge.py`, these API endpoints enable integration with Claudia:

- `/api/claudia/task`: Execute tasks with auto or manual prompt selection
- `/api/claudia/switch`: Switch to the appropriate prompt for a task
- `/api/claudia/metrics`: Get prompt usage metrics
- `/api/claudia/kalaw/*`: Endpoints for Kalaw knowledge integration
- `/api/claudia/status`: Check the status of all integrated components

### 4. Pulser CLI Integration

Located at `pulser_integration.sh`, this script integrates MCP prompts with the Pulser CLI:

- Adds an `mcp_prompts` command to the Pulser CLI
- Creates aliases for quick access to different prompt types
- Updates Pulser's configuration with MCP prompt information
- Adds MCP prompt details to the `CLAUDE.md` file for memory persistence

## Usage

### Starting the Integrated System

```bash
# Start PulseDev with Claudia and Kalaw integration
./launch_claudia_integrated.sh
```

### Pulser CLI Commands

After integration, the following commands become available in the Pulser CLI:

```bash
# List all available prompts
pulser mcp_prompts list

# Get information about a specific prompt
pulser mcp_prompts info cursor/chat_prompt

# Switch to a different prompt
pulser mcp_prompts switch gamma/presentation_creator

# Get prompt recommendations for a task
pulser mcp_prompts recommend "Create a React component for a login form"

# Check the status of the MCP prompts system
pulser mcp_prompts status
```

### Quick Access Aliases

The following aliases are added to Pulser for quick access:

```bash
# General commands
plist    # List all prompts
pinfo    # Get prompt info
pswitch  # Switch prompts
prec     # Get recommendations
pstatus  # Show system status

# Tool-specific shortcuts
pcode    # Cursor-style coding assistance
pcmd     # Replit-style terminal operations
papi     # API/tools integration
pux      # UX design focus
pcomp    # Component architecture
pslides  # Presentation creation
pdocs    # Documentation focus
pdev     # IDE assistance
pauto    # Autonomous development
pagent   # Agent behavior programming
pall     # Combined capabilities
```

## Metrics and Telemetry

The integration collects usage metrics to improve prompt selection:

- Tracks which prompts are most frequently used
- Records success rates and errors for each prompt
- Analyzes task types and contexts where prompts are used
- Stores metrics in the SKR directory at `SKR/metrics/prompt_usage/`

## Architecture

```
                             ┌─────────────┐
                             │   Claudia   │
                             │(Orchestrator)│
                             └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │    Kalaw    │
                             │  (Knowledge) │
                             └──────┬──────┘
                                    │
┌─────────────────────────────────────────────────────┐
│                  PulseDev MCP                       │
│  ┌──────────────┐     ┌──────────────┐              │
│  │  claudia_mcp_│     │  AI Assistant │              │
│  │    bridge    │◄────►     Service   │              │
│  └──────┬───────┘     └───────┬──────┘              │
│         │                     │                     │
│  ┌──────▼───────┐     ┌───────▼──────┐              │
│  │     API      │     │  MCP Direct  │              │
│  │    Routes    │     │    Bridge    │              │
│  └──────────────┘     └──────────────┘              │
└─────────────────────────────────────────────────────┘
                             │
                      ┌──────▼──────┐
                      │   Claude    │
                      └─────────────┘
```

## Setup Instructions

1. Register MCP prompts with Kalaw:
   ```bash
   ./register_with_kalaw.sh
   ```

2. Integrate with Pulser CLI:
   ```bash
   ./pulser_integration.sh
   ```

3. Launch the integrated system:
   ```bash
   ./launch_claudia_integrated.sh
   ```

4. Verify the integration:
   ```bash
   curl http://localhost:8000/api/claudia/status
   ```

## Troubleshooting

- If the Claudia integration fails, check the logs at `logs/claudia_mcp.log`
- If Kalaw registration fails, manually copy the `kalaw_mcp_prompts.yaml` file to `SKR/metadata/`
- If Pulser CLI integration fails, check that the command registry exists at the expected location

## Development

To extend the integration:

1. Add new prompts to the `mcp_prompts` directory
2. Update the Kalaw index in `kalaw_mcp_prompts.yaml`
3. Run `./register_with_kalaw.sh` to register the updates
4. Update aliases in `prompt_aliases.sh` if needed