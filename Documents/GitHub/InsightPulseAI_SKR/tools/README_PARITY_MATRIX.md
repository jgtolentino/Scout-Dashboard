# Claude Parity Matrix for Pulser

This document explains the Claude-Pulser parity matrix and how to use it with Kalaw and Claudia.

## Overview

The Claude parity matrix is a structured YAML document that:
- Tracks feature parity between Claude Code CLI and Pulser
- Identifies implementation gaps and partial implementations
- Provides context for each feature comparison

## Location

The parity matrix is registered in:
- Main config: `~/.pulser/config/claude_parity_matrix.yaml`
- Kalaw registry: `~/.pulser/config/kalaw_registry/claude_parity_matrix.yaml`

## Using with Kalaw

Kalaw's registry system now has access to the parity matrix, which allows it to:
1. Make intelligent routing decisions based on feature implementation
2. Provide warnings about unimplemented features
3. Track parity improvements over time

## Integration with Claudia's Dashboard

To include this matrix in Claudia's dashboard:

1. Run the included diagnostic script:
   ```bash
   ./pulser-claude-compare.sh
   ```

2. The script generates a summary that can be used for dashboard visualizations

3. To set up automatic syncing with Claudia's dashboard, add a cron job:
   ```bash
   # Add to crontab to run weekly
   0 0 * * 0 /path/to/pulser-claude-compare.sh > ~/.pulser/logs/claude_parity_$(date +\%Y\%m\%d).log
   ```

## Using for Routing Decisions

To use the parity matrix for routing decisions:

1. The matrix can inform router.js about which features require fallback to local implementation
2. Features marked as `implemented: false` should trigger alternative routes
3. Features marked as `implemented: partial` can use either mechanism depending on complexity

## Updating the Matrix

The parity matrix should be updated when:
1. New features are added to Claude Code CLI
2. Pulser implementations of existing features are improved
3. Major version changes occur in either system

Use the following command to update the parity matrix in all locations:
```bash
cp /path/to/updated_matrix.yaml ~/.pulser/config/claude_parity_matrix.yaml && \
cp /path/to/updated_matrix.yaml ~/.pulser/config/kalaw_registry/claude_parity_matrix.yaml
```