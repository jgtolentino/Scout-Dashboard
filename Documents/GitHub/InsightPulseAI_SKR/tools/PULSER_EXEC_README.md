# Pulser Unified Executor Integration

This document describes how the `pulser_exec.sh` script integrates with the Surf agent for task execution. The script implements the execution policy outlined in the original `pulser_exec.md` document.

## Overview

The Pulser Executor is a command router that delegates tasks to either Claude (for regular user-space tasks) or Basher (for privileged operations) based on a simple permission model.

## Enhanced with Surf Agent

The implementation has been enhanced to integrate with the Surf agent when the label is `surf_task`:

1. For regular tasks, Surf will use the Claude backend
2. For privileged tasks, Surf will use the DeepSeekr1 backend

## Usage Examples

### Standard Command Execution

```bash
# User-space task – handled by Claude
./tools/pulser_exec.sh register_dataset superset register-dataset --table SalesInteractionTranscripts

# Privileged task – delegated to Basher
./tools/pulser_exec.sh install_driver sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17
```

### Surf Agent Integration

```bash
# Task handled by Surf with Claude backend
./tools/pulser_exec.sh surf_task "Implement form validation in login component"

# Privileged task handled by Surf with DeepSeekr1 backend
./tools/pulser_exec.sh surf_task "Configure Docker setup for the application"
```

## Logging

All commands and their results are logged to:
`~/.pulser/logs/pulser_exec.log`

## Audit & Documentation Flow

1. **Claudia** logs every task label with status (success/failure)
2. **Caca** parses `pulser_exec.log`, flags any task that bypasses the dispatcher
3. **Maya** updates the PulseOps runbook when the dispatcher is modified
4. **Surf** provides autonomous code execution for complex tasks

## Integration with .pulserrc

The Surf agent is configured in `.pulserrc` and supports dynamic backend switching as specified in this implementation.