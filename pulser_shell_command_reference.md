# Pulser Warrior Mode - Command Reference

## Warrior Teams CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `:pulseops register-warriors` | Register warrior teams configuration | `:pulseops register-warriors --config ./warrior_teams.yaml` |
| `:task flow-warriors` | Activate a warrior team for a task | `:task flow-warriors finance_warriors --task "Audit Q2 data" --priority high` |
| `:pulseops combat-mode` | Run a predefined combat flow | `:pulseops combat-mode emergency_audit --priority critical` |
| `:task watch-warriors` | Monitor active warrior team progress | `:task watch-warriors finance_warriors` |
| `:pulseops deactivate-warriors` | Deactivate an active warrior team | `:pulseops deactivate-warriors finance_warriors` |

## Command Shortcuts

To facilitate quick access, we've created two command shortcuts:

1. **Launch PulserShell**: `/Users/tbwa/Desktop/Launch_PulserShell.command`
2. **Activate Warriors**: `/Users/tbwa/activate_warriors.command`

## Warrior Team Configurations

The warrior teams are defined in `/Users/tbwa/warrior_teams.yaml` with three primary structures:

### 1. Task-Class Warriors

Function-specific teams led by a designated agent:

```yaml
warrior_teams:
  finance_warriors:
    leader: TALA
    members: [CLAUDIA, KALAW, CACA]
    priority: high
```

### 2. Role-Based Warriors

Cross-functional teams organized by operational roles:

```yaml
warrior_roles:
  first_responders:
    agents: [CLAUDIA, ECHO, CACA]
    responsibility: "Triage and initial assessment"
```

### 3. Combat-Mode Flows

High-pressure task sequences with minimal interaction:

```yaml
combat_flows:
  emergency_audit:
    phases:
      - name: "Detection"
        agent: ECHO
        timeout: 120
```

## Examples

### Example 1: Financial Audit with Warriors

```bash
:task flow-warriors finance_warriors --task "Perform Q2 2025 emergency audit" --priority high --notify finance@example.com
```

### Example 2: Security Incident Response

```bash
:pulseops combat-mode security_incident --priority critical --notify security@example.com --auto-document true
```

### Example 3: Chaining Warrior Roles

```bash
:task activate-warrior-sequence "Security audit" --start first_responders --chain deep_operators --end qa_oversight
```

## Configuration Parameters

### Global Settings

- `warrior_global_settings.log_path`: Location for warrior logs
- `warrior_global_settings.combat_mode_timeout`: Maximum time (seconds) for combat operations
- `warrior_global_settings.disable_warning_filters`: Whether to disable warning filters during operations
- `warrior_global_settings.human_approval_required`: Actions requiring human confirmation

### Team Parameters

- `leader`: Primary agent responsible for the team
- `members`: Additional agents on the team
- `priority`: Default priority level
- `auto_escalation`: Whether to automatically escalate critical issues
- `max_concurrent_tasks`: Maximum tasks the team can handle simultaneously

### Combat Flow Parameters

- `phases`: Ordered sequence of operational phases
- `timeout`: Maximum time (seconds) for each phase
- `agent`: Agent responsible for executing each phase

## Log Files

All warrior operations are logged to `/Users/tbwa/.pulser/warrior_logs/` with detailed execution records and timestamps.