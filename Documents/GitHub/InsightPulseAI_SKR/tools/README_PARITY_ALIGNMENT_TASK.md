# Claude Parity Alignment Task

This document provides information about the Claude behavioral parity alignment task with Pulser v1.1.1.

## Task Overview

Task ID: `claude_parity_alignment_2025_05`
Objective: Ensure Claude agent reaches full behavioral parity with Pulser v1.1.1 feature set

The task involves identifying and implementing missing features, improving partially implemented features, and ensuring Claude's behavior matches Pulser v1.1.1 expectations.

## Files and Structure

- **Task Definition**: `/tools/tasks/claude_parity_alignment_2025_05.yaml`
- **Parity Matrix**: `~/.pulser/config/claude_parity_matrix.yaml` and `~/.pulser/config/kalaw_registry/claude_parity_matrix.yaml`
- **Diagnostic Script**: `/tools/pulser-claude-compare.sh`
- **Testing Scheduler**: `/tools/scripts/schedule_parity_tests.sh`

## Getting Started

1. **Review the Current Parity Status**:
   ```bash
   ./tools/pulser-claude-compare.sh
   ```

2. **Schedule Automated Tests** (daily, weekly, or hourly):
   ```bash
   ./tools/scripts/schedule_parity_tests.sh daily
   ```

3. **Run a Test Immediately**:
   ```bash
   ./tools/scripts/schedule_parity_tests.sh run
   ```

## Subtasks

The task is broken down into 7 subtasks (T1-T7) assigned to different owners:

1. **T1**: Review all ❌ (failed) and ⚠️ (partial) features from diagnostic script (Claudia)
2. **T2**: Implement missing feature: Context Snapshot Save/Restore (DevOps)
3. **T3**: Implement missing feature: Session ID Persistence (Backend)
4. **T4**: Improve Error Boundary Reporting (Susi)
5. **T5**: Rerun comparison and sync updated parity matrix (Claudia)
6. **T6**: Auto-sync updated matrix to Kalaw and Claudia dashboards (Kalaw)
7. **T7**: Log update to `/logs/claude_parity_test.log` and JSON export (Claudia)

## Escalation

To escalate this task to Pulser-level priority:

1. Update the priority field in the task YAML:
   ```yaml
   priority: critical
   ```

2. Assign additional agents by adding them to the agent_assignments section.

3. Increase the testing frequency:
   ```bash
   ./tools/scripts/schedule_parity_tests.sh hourly
   ```

## Metrics and Goals

- **Current Parity Score**: 70%
- **Target Parity Score**: 95%
- **Target Completion Date**: May 7, 2025 @ 18:00 PHT

## Dashboard Integration

The automated tests generate a JSON file at `~/.pulser/logs/claude_parity_latest.json` which can be integrated with Claudia's dashboard for visualization.

## Additional Resources

- Pulser v1.1.1 Documentation
- Claude Code CLI npm package: `@anthropic-ai/claude-code`
- Task logs: `~/.pulser/logs/claude_parity_*.log`