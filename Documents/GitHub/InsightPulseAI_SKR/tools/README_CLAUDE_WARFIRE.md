# 🔥 CLAUDE PARITY WARFIRE 🔥

**PRIORITY OVERRIDE - WAR ROOM PROTOCOL**

This document provides instructions for engaging with the Claude Parity Warfire protocol, activated to address critical behavioral parity issues between Claude and Pulser v1.1.1.

## War Room Activation

To activate or join the war room:

```bash
./tools/scripts/claude_parity_warfire.sh
```

This will:
1. Set up tactical reviews (every 3 hours)
2. Configure exploit detection
3. Prepare command gap fixes
4. Set up fallback agent deployment
5. Offer options for alerts, briefings, and testing

## War Room Directory Structure

```
~/.pulser/
├── logs/
│   └── claude-parity-war/     # War room logs
├── status/
│   └── claude-parity-war.json # War status dashboard
└── config/
    ├── claude_parity_matrix.yaml  # Current parity status
    ├── claude_fallback.yaml       # Fallback config
    └── kalaw_registry/
        └── claude_parity_matrix.yaml  # Synced to Kalaw
```

## Tactical Reviews

Tactical reviews run automatically every 3 hours and:
1. Run the parity comparison script
2. Update the war status JSON
3. Sync the parity matrix to Kalaw registry
4. Send notifications if configured

To run a tactical review manually:

```bash
~/.pulser/scripts/claude_tactical_review.sh
```

## Exploit Detection

The war room protocol includes detection for Claude's edge cases:
- API latency issues
- Shell scope confusion
- Context window overflow
- Command confusion
- Version misalignment

Run exploit detection:

```bash
~/.pulser/scripts/claude_exploit_detection.sh
```

## Command Gap Fixes

Patches for command gaps are prepared in:
- `tools/patches/claude_command_patches.js` - Core command patches
- `tools/patches/apply_claude_patches.js` - Integration script

These patches implement missing functionality:
- Command registry structure
- Context-manager
- Agent-execute logic
- Error boundaries

## Fallback Agent Deployment

During the war, unmatched prompts are temporarily delegated to fallback agents:
- **Claudia**: For high-complexity tasks
- **Echo**: For basic functionality

Configuration in: `~/.pulser/config/claude_fallback.yaml`

## War Dashboard

The war dashboard is available in JSON format at:
`~/.pulser/status/claude-parity-war.json`

This provides real-time status of:
- Current parity score
- Vulnerability status
- Tactical review history
- Time remaining until deadline

## Communications

- **War Room Channel**: #claude-parity-warfire
- **Ops Team Alerts**: #pulseops-alerts
- **Stakeholder Briefings**: Generated in war logs directory

## Emergency Procedures

If the situation deteriorates:
1. Use the fallback deployment
2. Consider Claude agent isolation
3. Initiate emergency stakeholder meeting

## Resolution

War room will be deactivated only when:
1. 100% parity score is achieved
2. All vulnerabilities are patched
3. Full test suite passes

## Remember

**CLAUDE PARITY IS NON-NEGOTIABLE**