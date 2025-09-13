# Escalation Controls Implementation Guide

## Overview

This document provides implementation details for the escalation controls specified in CLAUDE.md. These controls define specific categories of tasks that require human approval and cannot be executed by Claude, Basher, or Pulser agents without explicit sign-off from Jake Tolentino.

## Implementation Components

The implementation consists of three main components:

1. **Escalation Command Handler**: Detects and handles explicit escalation commands with special tags
2. **Task Filtering System**: Analyzes all incoming tasks for potential escalation needs  
3. **Claudia Tagging System**: Maintains a permanent audit trail of escalation events

## Files Added

The following files have been added to implement the escalation controls:

1. `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/router/commands/escalate.js`
   - Implements escalation command handling for explicit escalation tags
   - Defines scope detection and logging functionality

2. `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/router/commands/task_filter.js`
   - Implements task filtering to catch tasks requiring escalation
   - Enforces escalation policy on all tasks regardless of explicit tagging

3. `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/claudia_tagging.js`
   - Implements session tagging for audit trail
   - Maintains logs of all escalated tasks and sessions

## Usage Instructions

### 1. Using Explicit Escalation Tags

When a task explicitly falls into a protected category, use the appropriate tag:

- `:escalate_rbac` - For RBAC and Row-Level Security tasks
- `:escalate_billing` - For billing and cloud provisioning tasks
- `:escalate_compliance` - For compliance and legal governance tasks

Example:
```
:escalate_rbac assign John to admin role in Superset
```

### 2. Using the Human Override

In certain situations, you may need to bypass escalation controls for testing or emergencies. This is done by setting the `ALLOW_HUMAN_OVERRIDE` environment variable:

```bash
export ALLOW_HUMAN_OVERRIDE=true
```

**IMPORTANT**: This override should only be used by Jake Tolentino and only in necessary circumstances. All override uses are logged for audit purposes.

### 3. Viewing Escalation Logs

Escalation events are logged in two locations:

1. `/Users/tbwa/.pulser/escalation_log.json` - JSON format log of all escalation events
2. `/Users/tbwa/.pulser/logs/Claudia.audit` - Plain text audit log

You can view the most recent escalation events with:

```bash
tail -n 20 ~/.pulser/logs/Claudia.audit
```

## Integration Notes

### CLI Router Integration

The escalation controls are integrated into the Pulser CLI router. The router's `processCommand` function checks all incoming commands against the escalation policy.

### When to Use Escalation

Tasks that should be escalated include:

1. **RBAC & Row-Level Security**:
   - Adding, modifying, or removing user roles in Superset
   - Configuring row-level security filters on datasets
   - Changing tenant data visibility settings

2. **Billing & Cloud Provisioning**:
   - Changing VM sizes or SKU tiers
   - Adding new Azure services that incur costs
   - Managing storage quotas that affect billing

3. **Compliance & Legal Governance**:
   - Exporting audit logs for compliance reviews
   - Implementing data retention policies
   - Handling GDPR data erasure requests
   - Responding to data breach workflows

## Maintenance

The escalation control system should be reviewed periodically to ensure it aligns with current organizational policies. The `CLAUDE.md` file serves as the authoritative source for escalation policy definitions.