# Claude Integration for Pulser

This document outlines the integration of Claude as a Pulser agent, including behavioral parity validation and agent registration.

## Overview

Claude is integrated into the Pulser ecosystem as a high-performance AI agent with capabilities matching Claude Code CLI. This integration enables seamless routing between Claude and local models based on task complexity and requirements.

## Components

### Agent Registry

Claude is formally registered in the Pulser agent registry, which defines:
- Agent capabilities and interfaces
- Routing rules and fallback behavior
- Resource requirements and metadata

To create or update the agent registry:

```bash
./create_claude_agent_registry.py
```

This generates both YAML and JSON versions of the registry in `~/.pulser/config/`.

### Behavioral Parity Checklist

The integration includes a comprehensive behavioral parity validation checklist that ensures Claude behaves consistently with Pulser expectations:

```bash
./claude_behavior_checklist.py
```

This generates a structured YAML checklist at `~/.pulser/config/claude_behavior_checklist.yaml`.

### Validation Testing

Run the validation test suite to verify Claude's behavioral parity:

```bash
./run_claude_behavior_test.sh
```

This performs a series of tests against the behavioral checklist and generates a detailed log.

## Integration Areas

The Claude integration covers these key areas:

1. **Identity & Capability Parity**: Ensures Claude functions as a proper Pulser agent

2. **Context & Memory Fidelity**: Validates that Claude maintains consistent memory and context

3. **UI/UX Behavior Match**: Tests if Claude mirrors Pulser CLI behaviors

4. **Security & Permission**: Verifies Claude enforces proper boundaries

5. **Update & Version Integrity**: Tracks Claude API changes

6. **Testing & Behavioral Regression**: Prevents regressions in behavior

7. **Design Philosophy Compliance**: Ensures Claude follows Pulser principles

8. **Metrics Logging**: Collects performance metrics

## API Key Management

Claude requires an API key for operation. See [Claude API Key Management](README_CLAUDE_API_KEY.md) for details on configuring and managing your API key.

## Routing Modes

Claude can be used in these modes:

- **Local Mode**: Uses only DeepSeekr1 local model
- **API Mode**: Uses only Claude API
- **Adaptive Mode**: Intelligently routes between models based on task complexity

Change modes using the command:

```
/mode [local|api|adaptive]
```

## Troubleshooting

If you encounter issues with Claude integration:

1. Verify your Claude API key status with `/apikey validate`
2. Check the logs in `~/.pulser/logs/`
3. Run `./run_claude_behavior_test.sh` to identify behavioral issues
4. Consider switching to local mode with `/mode local` if API issues persist