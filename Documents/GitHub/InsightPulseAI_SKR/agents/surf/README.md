# Surf — Autonomous Code Agent

Surf (formerly Winsurf) is an autonomous code agent for the Pulser CLI ecosystem. It specializes in handling complex coding tasks with minimal supervision, following a structured approach to understanding requirements, exploring code, planning, implementing, and validating changes.

## Features

- **Goal-driven execution**: Provide a natural language description of what you want to accomplish
- **Multi-file operations**: Specify file patterns to focus the agent's work
- **Context-aware**: Works with project .env files to understand environment variables
- **Structured approach**: Clear step-by-step planning and execution
- **Multi-backend support**: Dynamically switch between Claude Code and DeepSeekr1 backends

## Usage

```bash
:surf --goal "Refactor auth module to use JWT tokens instead of sessions" \
  --files "src/auth/**/*.js" \
  --env ".env.development" \
  --note "Keep backward compatibility with existing API endpoints" \
  --backend "claude"
```

You can choose between backends:
```bash
# Use Claude Code (better for complex changes)
:surf --goal "Implement new feature" --backend claude

# Use DeepSeekr1 (works offline, lower latency)
:surf --goal "Fix bug in component" --backend deepseekr1
```

See [BACKEND_SWITCHING.md](./BACKEND_SWITCHING.md) for more details.

## Architecture

- **CLI Entrypoint**: `:surf` command in `.pulser_aliases`
- **Command Handler**: `~/.pulser/commands/surf.sh`
- **Agent Definition**: `agents/surf/surf.yaml`
- **Implementation**: `agents/surf/surf_agent.py` (primary agent logic)
- **Execution**: `agents/surf/run.sh` (environment handling)
- **Backend Switching**: Dynamic routing between Claude and DeepSeekr1

## Dependencies

- Uses LLM capabilities for task parsing and plan generation
- Interfaces with the filesystem for code analysis and changes
- Leverages Python for core agent implementation

## Integration

Surf is fully integrated with Pulser 2.0 and all appropriate references have been updated:
- Listed in CLAUDE.md agent registry
- Defined in .pulserrc configuration
- Accessible via `:surf` CLI command

Created by Claude on May 10, 2025