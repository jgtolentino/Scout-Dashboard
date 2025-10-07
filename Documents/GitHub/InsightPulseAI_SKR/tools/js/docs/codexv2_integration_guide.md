# Codex v2 Integration Guide

## Comprehensive Integration with Pulser 2.0, MCP, and Claude Desktop

*Version 1.0.1 - Last Updated: May 17, 2025*

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Agent Registration](#3-agent-registration)
4. [Sandbox Provisioning](#4-sandbox-provisioning)
5. [Pulser Configuration](#5-pulser-configuration)
6. [MCP Bridge Setup](#6-mcp-bridge-setup)
7. [Logging Infrastructure](#7-logging-infrastructure)
8. [CI/CD Integration](#8-cicd-integration)
9. [RBAC and Security](#9-rbac-and-security)
10. [UI Components](#10-ui-components)
11. [Monitoring and Alerts](#11-monitoring-and-alerts)
12. [Troubleshooting](#12-troubleshooting)
13. [Appendices](#13-appendices)

---

## 1. Overview

This guide provides comprehensive instructions for integrating Codex v2 with Pulser 2.0, MCP, and Claude Desktop. Codex v2 is OpenAI's next-generation autonomous software engineering agent, built on the o3 model and enhanced with Windsurf's Cascade routing and Supercomplete technology.

The integration enables:

- Full code generation, debugging, test writing, and PR automation capabilities
- Seamless task routing through MCP and Claude Desktop
- Secure sandbox execution with isolated environments
- Comprehensive logging and monitoring
- Controlled access through role-based permissions
- Quality gates via Caca

---

## 2. Prerequisites

Before beginning the integration, ensure you have:

- Pulser CLI 2.0+ installed and configured
- Access to necessary secrets in the Pulser vault
- Administrative access to your organization's Azure AD
- Sudo privileges on deployment machines
- Claude Desktop MCP 0.9.7+

Verify your environment:

```bash
pulser --version  # Should be 2.0.0+
pulser vault:check --path codex/openai_api_key
pulser agents:list  # Should include tide, caca, basher, claudia
```

---

## 3. Agent Registration

### 3.1 Codex v2 Agent Configuration

Create the agent YAML configuration:

```bash
# Create the agent config directory if it doesn't exist
mkdir -p ./agents

# Create the agent YAML configuration
cat > ./agents/codexv2.yaml << 'EOF'
id: codexv2
name: Codex v2
description: Autonomous software-engineering agent (OpenAI o3 + Windsurf Cascade)
version: 2.0.1
endpoint: https://api.openai.com/v2/codex
model: o3
temperature: 0.15
max_tokens: 4096
sandbox_image: ghcr.io/openai/codexv2-sandbox:latest

# Task definitions
tasks:
  implement:   "Generate or modify production code"
  refactor:    "Improve existing code for readability/perf"
  write-tests: "Create unit / integration tests"
  debug:       "Diagnose and patch failing tests"
  propose-pr:  "Open pull request with rationale"
  explain:     "Produce step-by-step rationale for human review"

# Quality gate configuration
qa_gate:
  agent: caca
  min_score: 0.85

# Cost management
cost:
  token_budget_per_task: 25000
  alert_threshold_pct: 80
  ceiling_per_day_usd: 150

# Sandbox configuration
sandbox:
  ttl_hours: 4
  cpu_cores: 8
  ram_gb: 16
  persistent_storage_gb: 10
EOF
```

### 3.2 Register the Agent

Register the agent with Pulser:

```bash
pulser agents:add ./agents/codexv2.yaml
pulser agents:sync
```

Verify the agent was registered:

```bash
pulser agents:get codexv2 --format json
```

---

## 4. Sandbox Provisioning

### 4.1 Basher Provisioning Script

The Basher provisioning script creates, manages, and monitors the Codex v2 sandbox.

```bash
# Download the provisioning script
curl -o ./basher_codexv2_provisioning.sh https://raw.githubusercontent.com/your-org/codex-integration/main/basher_codexv2_provisioning.sh

# Make it executable
chmod +x ./basher_codexv2_provisioning.sh
```

### 4.2 Configure Secrets

Ensure the necessary secrets are stored in the Pulser vault:

```bash
pulser vault:set codex/openai_api_key "your-openai-api-key"
pulser vault:set codex/github_token "your-github-token"
pulser vault:set slack/codex_alerts_webhook "your-slack-webhook-url"
```

### 4.3 Provision the Sandbox

Provision the sandbox using the Basher script:

```bash
./basher_codexv2_provisioning.sh provision --name codexv2_sandbox --cpu 8 --ram 16
```

For production environments, consider using a larger sandbox:

```bash
./basher_codexv2_provisioning.sh provision --name codexv2_sandbox_prod --cpu 16 --ram 32 --ttl 12
```

---

## 5. Pulser Configuration

### 5.1 Update `~/.pulserrc`

Update your Pulser configuration to support Codex v2:

```bash
cat >> ~/.pulserrc << 'EOF'

# Codex v2 Configuration
codex:
  enabled: true
  sandbox_uri: "auto-discovered"  # Will be set by the provisioning script
  model: claude-4.1-opus  # Primary model
  fallback_model: deepseekr1  # Fallback model for cost optimization
  max_token_budget: 150000
  auto_snapshot: true

# Tide Configuration for Codex v2
tide:
  cost_ceiling_per_day_usd: 150
  fallback_model: o3-nano
  alert_threshold_pct: 80
  batch_size: 8  # Batch up to 8 concurrent model calls

# Claude Configuration
claude:
  config_file: ~/.claude/config.json
  max_plan: true
EOF
```

### 5.2 Update Claude Configuration

Ensure Claude Desktop is configured with MAX plan settings:

```bash
mkdir -p ~/.claude

cat > ~/.claude/config.json << 'EOF'
{
  "user": {
    "max_plan": true,
    "plan_tier": "max",
    "token_budget_daily": 250000
  },
  "api": {
    "endpoint": "https://api.anthropic.com/v1",
    "default_model": "claude-4.1-opus"
  },
  "mcp": {
    "enabled": true,
    "auto_discover_pulser": true
  }
}
EOF
```

---

## 6. MCP Bridge Setup

### 6.1 Configure MCP for Pulser Integration

Create or update the MCP configuration:

```bash
mkdir -p ~/.mcp

cat > ~/.mcp/config.yaml << 'EOF'
pulser_api:
  host: "http://127.0.0.1:9315"
  token: ${PULSER_API_TOKEN}
  auto_discover: true

codex:
  enabled: true
  commands:
    - name: "implement"
      alias: "codex-implement"
      description: "Generate code based on requirements"
    - name: "refactor"
      alias: "codex-refactor"
      description: "Improve existing code"
    - name: "write-tests"
      alias: "codex-test"
      description: "Generate tests for code"
    - name: "debug"
      alias: "codex-debug"
      description: "Fix failing code"
    - name: "propose-pr"
      alias: "codex-pr"
      description: "Create a pull request"
EOF
```

### 6.2 Add UI Components

Configure the UI components for Claude Desktop:

```bash
cat > ~/.mcp/ui_config.yaml << 'EOF'
components:
  codex_task_status:
    enabled: true
    position: "right-sidebar"
  cost_tracker:
    enabled: true
    position: "right-sidebar"
    alert_threshold: 80
  pr_reviewer:
    enabled: true
    position: "main-panel"
  code_explanation:
    enabled: true
    position: "expandable"
    default_state: "collapsed"
EOF
```

---

## 7. Logging Infrastructure

### 7.1 Log Forwarder Configuration

Set up the log forwarder to send Codex v2 logs to Kalaw:

```bash
# Download the log forwarder
curl -o ./codex_to_kalaw_log_forwarder.py https://raw.githubusercontent.com/your-org/codex-integration/main/codex_to_kalaw_log_forwarder.py

# Make it executable
chmod +x ./codex_to_kalaw_log_forwarder.py
```

### 7.2 Create Systemd Service

Create a systemd service for the log forwarder:

```bash
sudo tee /etc/systemd/system/codex_to_kalaw.service > /dev/null << 'EOF'
[Unit]
Description=Codex v2 Log Forwarder to Kalaw
After=network.target

[Service]
Type=simple
User=pulser
ExecStart=/path/to/codex_to_kalaw_log_forwarder.py --log-level info --audit-mode
Restart=on-failure
RestartSec=5
StartLimitInterval=60
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOF
```

### 7.3 Enable and Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable codex_to_kalaw
sudo systemctl start codex_to_kalaw
sudo systemctl status codex_to_kalaw
```

---

## 8. CI/CD Integration

### 8.1 Git Pre-Push Hook

Create a Git pre-push hook to enforce quality gates:

```bash
mkdir -p templates/git

cat > templates/git/pre-push << 'EOF'
#!/bin/bash

# Codex v2 Quality Gate Pre-Push Hook
# This hook ensures code quality before pushing to remote repositories

# Get the current branch
current_branch=$(git symbolic-ref --short HEAD)

# Skip checks for certain branches
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    echo "Skipping checks for $current_branch branch"
    exit 0
fi

echo "Running quality checks before push..."

# Run code linting and cost analysis
echo "Running token cost analysis..."
pulser exec tide:lint-cost --repo "$(git rev-parse --show-toplevel)" --branch "$current_branch"
if [ $? -ne 0 ]; then
    echo "❌ Token cost analysis failed. Push aborted."
    exit 1
fi

# Run quality gate
echo "Running Caca quality gate..."
pulser exec caca:prepush-audit --repo "$(git rev-parse --show-toplevel)" --branch "$current_branch"
if [ $? -ne 0 ]; then
    echo "❌ Quality gate failed. Push aborted."
    exit 1
fi

# Check for secrets
echo "Checking for secrets..."
pulser exec gina:secrets-scan --repo "$(git rev-parse --show-toplevel)" --branch "$current_branch"
if [ $? -ne 0 ]; then
    echo "❌ Secrets detected. Push aborted."
    exit 1
fi

echo "✅ All checks passed. Proceeding with push."
exit 0
EOF

chmod +x templates/git/pre-push
```

### 8.2 Install the Pre-Push Hook

Add the following to your project's README or documentation:

```markdown
## Setup Git Hooks

Install the pre-push hook to enable quality gates:

```bash
mkdir -p .git/hooks
cp templates/git/pre-push .git/hooks/
chmod +x .git/hooks/pre-push
```
```

---

## 9. RBAC and Security

### 9.1 RBAC Configuration

Create an RBAC mapping template for Azure AD:

```bash
mkdir -p ./rbac

cat > ./rbac/codexv2_rbac_mapping.json << 'EOF'
{
  "version": "1.0",
  "roles": [
    {
      "name": "codex_user",
      "description": "Basic Codex v2 user with run and read permissions",
      "azureAdGroup": "Codex_Users",
      "permissions": ["run", "read"]
    },
    {
      "name": "codex_reviewer",
      "description": "Can review and approve Codex v2 PRs",
      "azureAdGroup": "Codex_Reviewers",
      "permissions": ["run", "read", "approve"]
    },
    {
      "name": "codex_admin",
      "description": "Full administrative access to Codex v2",
      "azureAdGroup": "Codex_Admins",
      "permissions": ["run", "read", "approve", "configure", "manage"]
    }
  ],
  "default_role": "codex_user",
  "require_authentication": true,
  "audit_access": true
}
EOF
```

### 9.2 Update Gina ARM Template

Create an ARM template for Gina to configure RBAC in Azure:

```bash
mkdir -p ./arm-templates

cat > ./arm-templates/codexv2_rbac.json << 'EOF'
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "adminGroupObjectId": {
      "type": "string",
      "metadata": {
        "description": "Object ID of the Codex Admins Azure AD group"
      }
    },
    "reviewerGroupObjectId": {
      "type": "string",
      "metadata": {
        "description": "Object ID of the Codex Reviewers Azure AD group"
      }
    },
    "userGroupObjectId": {
      "type": "string",
      "metadata": {
        "description": "Object ID of the Codex Users Azure AD group"
      }
    }
  },
  "resources": [
    {
      "type": "Microsoft.Authorization/roleDefinitions",
      "apiVersion": "2022-04-01",
      "name": "[guid('codex-admin-role')]",
      "properties": {
        "roleName": "Codex Admin",
        "description": "Full administrative access to Codex v2",
        "type": "CustomRole",
        "permissions": [
          {
            "actions": [
              "Microsoft.ContainerInstance/containerGroups/read",
              "Microsoft.ContainerInstance/containerGroups/write",
              "Microsoft.ContainerInstance/containerGroups/delete",
              "Microsoft.Storage/storageAccounts/read",
              "Microsoft.Storage/storageAccounts/blobServices/containers/read",
              "Microsoft.Storage/storageAccounts/blobServices/containers/write"
            ],
            "notActions": []
          }
        ],
        "assignableScopes": [
          "[resourceGroup().id]"
        ]
      }
    },
    {
      "type": "Microsoft.Authorization/roleDefinitions",
      "apiVersion": "2022-04-01",
      "name": "[guid('codex-reviewer-role')]",
      "properties": {
        "roleName": "Codex Reviewer",
        "description": "Can review and approve Codex v2 PRs",
        "type": "CustomRole",
        "permissions": [
          {
            "actions": [
              "Microsoft.ContainerInstance/containerGroups/read",
              "Microsoft.Storage/storageAccounts/read",
              "Microsoft.Storage/storageAccounts/blobServices/containers/read"
            ],
            "notActions": []
          }
        ],
        "assignableScopes": [
          "[resourceGroup().id]"
        ]
      }
    },
    {
      "type": "Microsoft.Authorization/roleDefinitions",
      "apiVersion": "2022-04-01",
      "name": "[guid('codex-user-role')]",
      "properties": {
        "roleName": "Codex User",
        "description": "Basic Codex v2 user with run and read permissions",
        "type": "CustomRole",
        "permissions": [
          {
            "actions": [
              "Microsoft.ContainerInstance/containerGroups/read"
            ],
            "notActions": []
          }
        ],
        "assignableScopes": [
          "[resourceGroup().id]"
        ]
      }
    },
    {
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceGroup().id, parameters('adminGroupObjectId'), 'codex-admin-role')]",
      "properties": {
        "roleDefinitionId": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-admin-role'))]",
        "principalId": "[parameters('adminGroupObjectId')]",
        "principalType": "Group"
      },
      "dependsOn": [
        "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-admin-role'))]"
      ]
    },
    {
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceGroup().id, parameters('reviewerGroupObjectId'), 'codex-reviewer-role')]",
      "properties": {
        "roleDefinitionId": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-reviewer-role'))]",
        "principalId": "[parameters('reviewerGroupObjectId')]",
        "principalType": "Group"
      },
      "dependsOn": [
        "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-reviewer-role'))]"
      ]
    },
    {
      "type": "Microsoft.Authorization/roleAssignments",
      "apiVersion": "2022-04-01",
      "name": "[guid(resourceGroup().id, parameters('userGroupObjectId'), 'codex-user-role')]",
      "properties": {
        "roleDefinitionId": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-user-role'))]",
        "principalId": "[parameters('userGroupObjectId')]",
        "principalType": "Group"
      },
      "dependsOn": [
        "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-user-role'))]"
      ]
    }
  ],
  "outputs": {
    "adminRoleId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-admin-role'))]"
    },
    "reviewerRoleId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-reviewer-role'))]"
    },
    "userRoleId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Authorization/roleDefinitions', guid('codex-user-role'))]"
    }
  }
}
EOF
```

### 9.3 Deploy the RBAC Configuration

To deploy the RBAC configuration:

```bash
# Get the Azure AD group Object IDs
ADMIN_GROUP_ID=$(az ad group show --group "Codex_Admins" --query "id" -o tsv)
REVIEWER_GROUP_ID=$(az ad group show --group "Codex_Reviewers" --query "id" -o tsv)
USER_GROUP_ID=$(az ad group show --group "Codex_Users" --query "id" -o tsv)

# Deploy the ARM template
az deployment group create \
  --name codexv2-rbac-deployment \
  --resource-group your-resource-group \
  --template-file ./arm-templates/codexv2_rbac.json \
  --parameters adminGroupObjectId="$ADMIN_GROUP_ID" \
               reviewerGroupObjectId="$REVIEWER_GROUP_ID" \
               userGroupObjectId="$USER_GROUP_ID"
```

---

## 10. UI Components

### 10.1 Cost Widget for Claude Desktop

To integrate the cost/LOC widget into Claude Desktop:

```bash
# Create the UI components directory
mkdir -p ui/components

# Create the cost widget component
cat > ui/components/edge-cost.vue << 'EOF'
<template>
  <div class="cost-widget">
    <div class="widget-header">
      <h3>Codex v2 Costs</h3>
      <span class="refresh-button" @click="refreshData">⟳</span>
    </div>
    <div class="cost-metrics">
      <div class="metric">
        <span class="label">Today's Usage:</span>
        <span class="value">${{ todayUsage.toFixed(2) }}</span>
      </div>
      <div class="metric">
        <span class="label">Daily Budget:</span>
        <span class="value">${{ dailyBudget.toFixed(2) }}</span>
      </div>
      <div class="metric">
        <span class="label">Cost per LOC:</span>
        <span class="value">${{ costPerLoc.toFixed(5) }}</span>
      </div>
    </div>
    <div class="budget-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: budgetPercentage + '%', backgroundColor: progressColor }"
        ></div>
      </div>
      <div class="progress-label">{{ budgetPercentage }}% of budget used</div>
    </div>
    <div class="active-jobs" v-if="activeJobs.length > 0">
      <h4>Active Jobs:</h4>
      <ul>
        <li v-for="job in activeJobs" :key="job.id">
          {{ job.type }}: ${{ job.cost.toFixed(2) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CostWidget',
  data() {
    return {
      todayUsage: 0,
      dailyBudget: 150,
      costPerLoc: 0.00145,
      activeJobs: [],
      lastUpdated: null,
      updateInterval: null
    };
  },
  computed: {
    budgetPercentage() {
      return Math.min(Math.round((this.todayUsage / this.dailyBudget) * 100), 100);
    },
    progressColor() {
      if (this.budgetPercentage < 50) return '#4CAF50';
      if (this.budgetPercentage < 80) return '#FFC107';
      return '#F44336';
    }
  },
  methods: {
    async fetchData() {
      try {
        // Call the MCP bridge to get cost data from Pulser
        const response = await fetch('/api/mcp/codex/costs');
        const data = await response.json();
        
        this.todayUsage = data.today_usage || 0;
        this.dailyBudget = data.daily_budget || 150;
        this.costPerLoc = data.cost_per_loc || 0.00145;
        this.activeJobs = data.active_jobs || [];
        this.lastUpdated = new Date();
      } catch (error) {
        console.error('Error fetching cost data:', error);
      }
    },
    refreshData() {
      this.fetchData();
    }
  },
  mounted() {
    this.fetchData();
    // Update every 5 minutes
    this.updateInterval = setInterval(this.fetchData, 5 * 60 * 1000);
  },
  beforeDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
};
</script>

<style scoped>
.cost-widget {
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.widget-header h3 {
  margin: 0;
  font-size: 16px;
}

.refresh-button {
  cursor: pointer;
  font-size: 16px;
}

.cost-metrics {
  margin-bottom: 12px;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.budget-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 12px;
  text-align: right;
  margin-top: 4px;
}

.active-jobs h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.active-jobs ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
}
</style>
EOF
```

---

## 11. Monitoring and Alerts

### 11.1 Edge Dashboard Configuration

Create an Edge dashboard configuration for Codex v2 monitoring:

```bash
mkdir -p edge/dashboards

cat > edge/dashboards/codexv2.json << 'EOF'
{
  "title": "Codex v2 Dashboard",
  "refresh_interval_seconds": 300,
  "layout": {
    "type": "grid",
    "columns": 12
  },
  "widgets": [
    {
      "title": "Daily Token Usage",
      "type": "line_chart",
      "width": 6,
      "height": 4,
      "data_source": "tide:token_usage",
      "params": {
        "timeframe": "last_24h",
        "granularity": "hourly"
      }
    },
    {
      "title": "Cost per LOC",
      "type": "line_chart",
      "width": 6,
      "height": 4,
      "data_source": "tide:cost_per_loc",
      "params": {
        "timeframe": "last_7d",
        "granularity": "daily"
      }
    },
    {
      "title": "Active Sandbox Instances",
      "type": "gauge",
      "width": 3,
      "height": 3,
      "data_source": "basher:active_sandboxes",
      "params": {
        "min": 0,
        "max": 10,
        "thresholds": [
          {
            "value": 5,
            "color": "yellow"
          },
          {
            "value": 8,
            "color": "red"
          }
        ]
      }
    },
    {
      "title": "PR Success Rate",
      "type": "gauge",
      "width": 3,
      "height": 3,
      "data_source": "caca:pr_success_rate",
      "params": {
        "min": 0,
        "max": 100,
        "unit": "%",
        "thresholds": [
          {
            "value": 75,
            "color": "red"
          },
          {
            "value": 90,
            "color": "green"
          }
        ]
      }
    },
    {
      "title": "Log Forwarding Status",
      "type": "status",
      "width": 3,
      "height": 3,
      "data_source": "kalaw:log_forwarder_status",
      "params": {
        "check_interval_seconds": 60
      }
    },
    {
      "title": "Sandbox Health",
      "type": "status",
      "width": 3,
      "height": 3,
      "data_source": "basher:sandbox_health",
      "params": {
        "check_interval_seconds": 60
      }
    },
    {
      "title": "Recent Tasks",
      "type": "table",
      "width": 12,
      "height": 6,
      "data_source": "codexv2:recent_tasks",
      "params": {
        "limit": 10,
        "columns": [
          "task_id",
          "task_type",
          "repo",
          "status",
          "tokens_used",
          "cost",
          "created_at",
          "completed_at",
          "caca_score"
        ]
      }
    }
  ],
  "filters": [
    {
      "name": "timerange",
      "type": "timerange",
      "default": "last_24h",
      "options": [
        "last_hour",
        "last_24h",
        "last_7d",
        "last_30d",
        "custom"
      ]
    },
    {
      "name": "repo",
      "type": "multiselect",
      "data_source": "codexv2:repos"
    }
  ]
}
EOF
```

### 11.2 Deploy the Dashboard

To deploy the Edge dashboard:

```bash
pulser exec edge:deploy-dashboard --config ./edge/dashboards/codexv2.json --path /dash/codexv2
```

---

## 12. Troubleshooting

### 12.1 Sandbox Issues

If you encounter issues with the Codex v2 sandbox:

```bash
# Check sandbox status
./basher_codexv2_provisioning.sh list

# Restart a troubled sandbox
./basher_codexv2_provisioning.sh destroy --name codexv2_sandbox
./basher_codexv2_provisioning.sh provision --name codexv2_sandbox

# Check sandbox logs
pulser exec basher:logs --name codexv2_sandbox --tail 100
```

### 12.2 Log Forwarder Issues

If the log forwarder isn't working properly:

```bash
# Check log forwarder status
sudo systemctl status codex_to_kalaw

# View log forwarder logs
sudo journalctl -u codex_to_kalaw -n 100

# Restart log forwarder
sudo systemctl restart codex_to_kalaw
```

### 12.3 Connection Issues

If MCP can't connect to Pulser:

```bash
# Check Pulser API status
curl -s http://localhost:9315/status

# Restart MCP bridge
pulser restart mcp

# Check MCP logs
cat ~/.mcp/logs/bridge.log
```

---

## 13. Appendices

### 13.1 CLI Commands Reference

Here's a quick reference of key Codex v2 CLI commands:

| Command | Description |
| ------- | ----------- |
| `pulser exec codexv2:implement --repo <URL> --task "Description"` | Generate code based on task description |
| `pulser exec codexv2:write-tests --repo <URL> --path src/` | Generate tests for code in specified path |
| `pulser exec codexv2:refactor --repo <URL> --file <path>` | Improve existing code |
| `pulser exec codexv2:debug --repo <URL> --test <path>` | Fix failing tests |
| `pulser exec codexv2:propose-pr --repo <URL> --base main` | Create a pull request |
| `pulser exec caca:review --pr <number>` | Review a pull request with Caca |
| `pulser exec claudia:merge_if_pass --pr <number>` | Merge PR if it passes quality gate |

### 13.2 Quick Setup Script

Here's a single script that performs all the essential setup steps:

```bash
#!/bin/bash
# codexv2_quick_setup.sh - Quick setup for Codex v2 integration

set -e

echo "Setting up Codex v2 integration..."

# Create necessary directories
mkdir -p ./agents ~/.mcp ~/.claude

# Download required scripts
curl -o ./basher_codexv2_provisioning.sh https://raw.githubusercontent.com/your-org/codex-integration/main/basher_codexv2_provisioning.sh
curl -o ./codex_to_kalaw_log_forwarder.py https://raw.githubusercontent.com/your-org/codex-integration/main/codex_to_kalaw_log_forwarder.py

# Make scripts executable
chmod +x ./basher_codexv2_provisioning.sh
chmod +x ./codex_to_kalaw_log_forwarder.py

# Create agent YAML
cat > ./agents/codexv2.yaml << 'EOF'
id: codexv2
name: Codex v2
description: Autonomous software-engineering agent (OpenAI o3 + Windsurf Cascade)
version: 2.0.1
endpoint: https://api.openai.com/v2/codex
model: o3
temperature: 0.15
max_tokens: 4096
sandbox_image: ghcr.io/openai/codexv2-sandbox:latest

# Task definitions
tasks:
  implement:   "Generate or modify production code"
  refactor:    "Improve existing code for readability/perf"
  write-tests: "Create unit / integration tests"
  debug:       "Diagnose and patch failing tests"
  propose-pr:  "Open pull request with rationale"
  explain:     "Produce step-by-step rationale for human review"

# Quality gate configuration
qa_gate:
  agent: caca
  min_score: 0.85
EOF

# Update Pulser configuration
cat >> ~/.pulserrc << 'EOF'

# Codex v2 Configuration
codex:
  enabled: true
  model: claude-4.1-opus
  fallback_model: deepseekr1
  max_token_budget: 150000

tide:
  cost_ceiling_per_day_usd: 150
  fallback_model: o3-nano
  alert_threshold_pct: 80
EOF

# Register agent
pulser agents:add ./agents/codexv2.yaml
pulser agents:sync

# Provision sandbox
./basher_codexv2_provisioning.sh provision

# Set up MCP config
cat > ~/.mcp/config.yaml << 'EOF'
pulser_api:
  host: "http://127.0.0.1:9315"
  auto_discover: true

codex:
  enabled: true
EOF

# Start log forwarder in background
./codex_to_kalaw_log_forwarder.py --daemon

echo "Codex v2 integration setup complete!"
```

### 13.3 Example Workflow

Here's an example workflow using Codex v2 for implementing a feature:

```bash
# Clone repository
git clone https://github.com/example/repo.git
cd repo

# Create feature branch
git checkout -b feature/oauth2

# Implement OAuth2 flow
pulser exec codexv2:implement --repo . --task "Add OAuth2 login flow with GitHub and Google providers"

# Wait for implementation to complete
# Review the changes

# Write tests for the implementation
pulser exec codexv2:write-tests --repo . --path src/auth/

# Fix any issues detected by tests
pulser exec codexv2:debug --repo . --test tests/auth/

# Create a pull request
pulser exec codexv2:propose-pr --repo . --base main --title "Add OAuth2 authentication"

# Run quality gate on the PR
pulser exec caca:review --pr 97

# If quality gate passes, merge the PR
pulser exec claudia:merge_if_pass --pr 97
```

---

*End of Integration Guide*