# 📄 `CLAUDE.md` — Prompt Engineering & Dashboard Orchestration for Pulser CLI (v2.2.2)

### 🔧 Agents: `PromptEngineer`, `DashboardBuilder` (Dash), `AgentRouter`

**Command Aliases:**

* `:prompt-engineer` → Prompt analysis, tuning, export
* `:build-dash` → Schema-to-dashboard generation
* `:route-task` → Intelligent task routing to specialized agents

**Supervising Agent:** `Claudia`
**Operational Domains:**

* `PromptLifecycleOps` → via `PromptTunerAgent`
* `DataVizOps` → via `VisualSynth → Dash`
* `InterfaceOps` → via Claudia's UI/UX routing
* `AgentOps` → via `AgentRouter → MCP`

---

## 🧠 Agentic Intent

| Agent            | Function                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| `PromptEngineer` | Analyzes and enhances prompts for clarity, effectiveness, and agent transfer |
| `Dash`           | Converts schema + intent into production-ready dashboards                    |
| `AgentRouter`    | Routes tasks to specialized agents based on intent, context, and capabilities|

These agents support seamless chaining from prompt design to dashboard delivery across Pulser workflows, with the AgentRouter enabling a multi-agent ecosystem through MCP integration.

---

## 🧩 CLI Subcommands

### ✍️ Prompt Engineering

| Subcommand   | Description                                    | Route                                |
| ------------ | ---------------------------------------------- | ------------------------------------ |
| `analyze`    | Evaluate prompt effectiveness and weaknesses   | `PromptTunerAgent.analyze`           |
| `improve`    | Refine prompts based on targeted goals         | `PromptTunerAgent.improve`           |
| `variations` | Generate prompt variants for experimentation   | `PromptTunerAgent.generate_variants` |
| `export`     | Save prompt in text, JSON, JSONL, or LangChain | `PromptTunerAgent.export`            |

### 📊 Dashboard Building

| Subcommand | Description                                         | Route                              |
| ---------- | --------------------------------------------------- | ---------------------------------- |
| `build`    | Generate dashboard from structured schema + prompt  | `DashboardBuilder.build_dashboard` |
| `deploy`   | Publish dashboard to Azure Static Web/Vercel        | `DashboardBuilder.deploy_webapp`   |
| `simulate` | Preview dashboard from mock schema                  | `VisualSynth.simulate_layout`      |
| `infer`    | Extract KPIs and layout hints from natural language | `reqparser → schemainfer`          |

### 🔄 Agent Routing

| Subcommand     | Description                                    | Route                             |
| -------------- | ---------------------------------------------- | --------------------------------- |
| `route`        | Route a task to the best specialized agent     | `AgentRouter.routeTask`           |
| `batch-route`  | Route multiple tasks in a single operation     | `AgentRouter.routeBatch`          |
| `suggest`      | Get suggested agents for a product development | `AgentRouter.getSuggestedAgents`  |
| `execute`      | Execute a task through MCP                     | `AgentRouter.executeThroughMCP`   |
| `history`      | View routing history and decisions             | `AgentRouter.getRoutingHistory`   |

### 📋 Plan-Act Automation

| Subcommand    | Description                                           | Route                           |
| ------------- | ----------------------------------------------------- | ------------------------------- |
| `plan-act`    | Process PLAN/ACT blocks with variable substitution    | `PlanActParser.process`         |
| `plan-watch`  | Watch clipboard for PLAN/ACT blocks                  | `PlanActParser.watchClipboard`  |
| `plan-config` | Show current variables and configuration              | `PlanActParser.showConfig`      |
| `plan-set`    | Set a runtime variable for substitution               | `PlanActParser.setVariable`     |

---

## 🚀 CLI Usage Examples

```bash
# Prompt analysis & tuning
:prompt-engineer analyze --prompt "Design a CEO dashboard for marketing impact"
:prompt-engineer improve --prompt "Summarize monthly retail metrics" --goals clarity,kpi-focus,trend-surfacing

# Dashboard generation
:build-dash --source results.json --requirements marketing_kpis.md
:build-dash --simulate mock_sales_schema.json

# Agent routing
:route-task --task "Create unit tests for authentication module" --context "filename:auth.js"
:route-task --task "Set up CI/CD pipeline" --agent basher --environment terminal

# Plan-Act automation
:plan-act "$(pbpaste)"  # Process clipboard content (macOS)
:plan-watch             # Watch clipboard for PLAN/ACT blocks
:plan-act --auto deployment-plan.md  # Auto-approve execution
:plan-set API_URL https://api.example.com  # Set runtime variable
```

---

## 🌐 UI Access

| Tool         | URL                                                         |
| ------------ | ----------------------------------------------------------- |
| Prompt Lab   | `http://localhost:9090/prompt-lab`                          |
| Dash Preview | `/dashboards/generated_dashboard.html` (served via Claudia) |
| MCP Console  | `http://localhost:9315/console` (agent operations console)  |

---

## 🤖 Plan-Act Automation

The Plan-Act system enables automatic execution of AI-generated workflows with intelligent variable substitution:

### Features
- **Auto-detection** of PLAN/ACT blocks from ChatGPT/Claude
- **Variable substitution** for paths, secrets, and configuration
- **Auto-approve mode** for hands-free execution
- **Secure handling** of sensitive values (tokens, keys, passwords)
- **Clipboard watching** for instant paste-and-execute workflows

### Variable Sources
1. Runtime variables (via `:plan-set`)
2. Environment variables
3. `.pulserrc` configuration
4. `.env` files
5. `secrets.yaml` files

### Example Workflow
```markdown
## PLAN:
- Deploy dashboard to Azure
- Update DNS records

## ACT:
pulser :snowwhite sanitize --target={{REPO_ROOT}}/dashboard
az staticwebapp upload --app-name {{AZURE_APP_NAME}} --token {{AZURE_TOKEN}}
pulser :notify "Deployed to {{DASHBOARD_URL}}"
```

Variables like `{{REPO_ROOT}}` and `{{AZURE_TOKEN}}` are automatically substituted from your configuration.

---

## 🔁 Claudia Integration

```bash
pulser system_prompts clone     # Sync prompt templates from SKR
pulser system_prompts index     # Index for Claudia routing
pulser dashboards deploy        # Push generated dashboards to web host
pulser agent-router sync        # Sync agent capabilities with memory system
```

> Claudia tracks all outputs. Dashboards are registered in Kalaw with trace ID, source schema, and export target. Agent routing decisions are logged in the routing history file.

---

## 📦 Output Directory (from Dash Agent)

| Path                                   | Type   | Purpose                         |
| -------------------------------------- | ------ | ------------------------------- |
| `/dashboards/generated_dashboard.html` | HTML   | Final dashboard UI              |
| `/dashboards/assets/`                  | JS/CSS | Charts, filters, styles         |
| `/dashboards/config.json`              | JSON   | Logic, filters, layout settings |

---

## 🤖 Agent Ecosystem

The Pulser MCP architecture integrates multiple specialized agents that can be routed to via the AgentRouter:

| Agent ID | Description           | Primary Expertise                      | Target Environments             |
|----------|-----------------------|----------------------------------------|---------------------------------|
| `claudia`| Strategic Orchestrator| Business strategy, market analysis     | all                             |
| `maya`   | Process Architect     | Workflow design, PRD creation          | vscode, blender, orchestrator   |
| `kalaw`  | Research Indexer      | Data storage, knowledge management     | vscode, terminal                |
| `echo`   | Multimodal Analyzer   | UI/UX testing, visual analysis         | terminal, media processors      |
| `deckgen`| Visualizer            | Presentations, data visualization      | vscode, terminal                |
| `caca`   | Quality Assurance     | Testing, validation, QA automation     | vscode, terminal, database      |
| `tide`   | Data Analyst          | SQL, data validation, health monitoring| database, jupyter, dashboard    |
| `surf`   | Engineering Expert    | Complex engineering, coding, debugging | vscode, terminal                |
| `basher` | Systems Automator     | Shell commands, system automation      | terminal                        |
| `claude` | General Purpose AI    | Code generation, creative tasks        | vscode, blender, terminal, jupyter|

---

## 🔌 MCP Architecture

The Multi-Cloud Provider (MCP) architecture enables Claudia to interact with different environments through specialized bridges:

```
┌──────────┐      ┌──────────────┐      ┌───────────────┐      ┌───────────────┐
│          │      │              │      │ ┌───────────┐ │      │  ┌──────────┐ │
│  Claude  │─────▶│ AgentRouter  │─────▶│ │ MCP Agent │ │─────▶│  │ Terminal │ │
│          │      │              │      │ └───────────┘ │      │  └──────────┘ │
└──────────┘      └──────────────┘      │ ┌───────────┐ │      │  ┌──────────┐ │
                                        │ │MCP Bridges│ │─────▶│  │  VSCode  │ │
                                        │ └───────────┘ │      │  └──────────┘ │
                                        └───────────────┘      │  ┌──────────┐ │
                                                               │  │ Database │ │
                                                               │  └──────────┘ │
                                                               └───────────────┘
```

The MCP server exposes standardized endpoints:
- `/health` - System health check
- `/status` - Current status and capabilities
- `/capabilities` - Available tools and agents
- `/command` - Execute commands through the appropriate bridge

---

## ✅ Lifecycle Protocols

* **Prompt outputs** are memory-tagged by Kalaw:
  `clarity-checked`, `ab-tested`, `persona-matched`

* **Dashboards** are stored under:
  `Kalaw > VisualSynth > Dash Output Log`
  and can be deployed via Azure CLI or Vercel CLI.

* **Agent routing** decisions are logged in:
  `./.mcp/routing_history.jsonl`
  and synchronized with Claudia's memory system.

---

## 🔒 Global Policies

```yaml
policies:
  global:
    - ./agents/codex_guardrails.yml
  
  enforcement:
    level: strict
    exceptions:
      - path: "tests/**/*"
        reason: "Test files may intentionally contain edge cases"
      - path: "scripts/demo_*.js"
        reason: "Demo files for illustration purposes only"
  
  compliance:
    validate_on_commit: true
    require_policy_check: true
    
  security:
    default_permissions: "read_only"
    admin_agents: ["Claudia", "Claude"]
    execution_timeouts:
      blender: 120  # seconds
      vscode: 60
      terminal: 30
      database: 60
```

These global policies enforce guardrails across all agents in the system, ensuring consistent schema validation, feature flagging, and security practices.

---

## 🧩 Fallback Cascades

The system supports graceful degradation through fallback cascades:

```yaml
fallback_cascades:
  creative:
    sequence: ["maya", "claude", "echo", "claudia"]
  technical:
    sequence: ["surf", "claude", "basher", "claudia"]
  analytical:
    sequence: ["tide", "claude", "kalaw", "claudia"]
```

If a primary agent fails to complete a task, the system automatically tries the next agent in the cascade.