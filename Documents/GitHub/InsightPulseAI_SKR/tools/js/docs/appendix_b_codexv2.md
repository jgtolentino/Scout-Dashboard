# Appendix B: Integration Guide — Codex v2 ↔ Pulser 2.0 / MCP / Claude Desktop

## Scope

This appendix provides a paste-ready, end-to-end integration recipe for Codex v2 with Pulser 2.0, MCP, and Claude Desktop. It assumes Pulser 2.0 is already running with Basher, Tide, Claudia, Caca, Gina, Edge and the default SKR stack.

## B-1 Agent Registration

### agents/codexv2.yaml

```yaml
id: codexv2
name: Codex v2
description: Autonomous software-engineering agent (OpenAI o3 + Windsurf Cascade)
version: 2.0.0
endpoint: https://api.openai.com/v2/codex
model: o3            # Pulser model alias; Tide will down-route to o3-nano when idle
temperature: 0.15
max_tokens: 4096
sandbox_image: ghcr.io/openai/codexv2-sandbox:latest
tasks:
  implement:   "Generate or modify production code"
  refactor:    "Improve existing code for readability/perf"
  write-tests: "Create unit / integration tests"
  debug:       "Diagnose and patch failing tests"
  propose-pr:  "Open pull request with rationale"
  explain:     "Produce step-by-step rationale for human review"
qa_gate:
  agent: caca
  min_score: 0.85
```

Register the agent:

```bash
pulser agents:add ./agents/codexv2.yaml
```

## B-2 Provision the Cloud Sandbox (Basher)

```bash
pulser exec basher:provision \
      --name codexv2_sandbox \
      --image ghcr.io/openai/codexv2-sandbox:latest \
      --cpu 8 --ram 16Gi --ttl 4h
```

Basher returns the sandbox URI and injects it into Codex v2's runtime context.

## B-3 Typical Workflow (CLI)

```bash
# 1 – Attach a repo
pulser exec codexv2:implement \
      --repo https://github.com/acme/shop \
      --branch feature/oauth2 \
      --task "Add full OAuth2 login flow with GitHub + Google"

# 2 – Quality gate
pulser exec caca:review --pr 97      # returns score + inline comments

# 3 – Conditional merge
pulser exec claudia:merge_if_pass --pr 97
```

If caca scores < 0.85, Claudia routes the PR back to Codex v2 with Caca's diff-hint payload for re-work and re-runs the gate.

## B-4 Cost & Model Optimisation (Tide)

- **Token Batching:** Tide aggregates ≤ 8 concurrent Codex calls into a single o3 request
- **Dynamic Downgrade:** Idle phases are served by o3-nano; heavy tasks auto-escalate
- **Live Cost Widget:** Edge surfaces $/LOC metrics in the Claude Desktop side-panel

Add to ~/.pulserrc:

```yaml
tide:
  cost_ceiling_per_day_usd: 150
  fallback_model: o3-nano
  alert_threshold_pct: 80   # Edge fires Slack alert when cost > 80% ceiling
```

## B-5 MCP Bridge (Claude Desktop ↔ Pulser)

### ~/.mcp/config.yaml

```yaml
pulser_api:
  host: "http://127.0.0.1:9315"
  token: ${PULSER_API_TOKEN}
```

Example Desktop command:

```
/pulser codexv2 implement --repo ~/proj/app --task "Stripe webhook handler"
```

MCP streams stdout + Edge notifications directly into the Claude Desktop chat pane.

## B-6 CI/CD Hook (Git pre-push)

### .git/hooks/pre-push

```bash
#!/usr/bin/env bash
pulser exec tide:lint-cost --repo "$(git rev-parse --show-toplevel)"
pulser exec caca:prepush-audit --repo .
```

Ensures no merge if (a) cost spike > ceiling; (b) QA gate fails; (c) secrets leak detected.

## B-7 Security & Compliance

| Control | Enforcement Agent | Implementation Notes |
| ------- | ----------------- | -------------------- |
| RBAC | Gina | Map Codex roles to Azure AD groups (Dev, Reviewer, Admin) |
| Sandbox Egress | Basher | Only port 443; deny *.githubusercontent.com except during PR creation |
| Secrets | Tide & Basher | Use Pulser Vault mount vault://codex/ injected at runtime |
| Audit Trail | Kalaw | All Codex prompts, diffs, and Caca scores logged, immutable |

## B-8 Rollback / Disaster Recovery

```bash
pulser exec basher:snapshot --name codexv2_sandbox --tag pre-deploy
pulser exec claudia:rollback --pr 97 --snapshot pre-deploy
```

Snapshots kept 14 days; longer retention configurable via Gina.

## B-9 Key Metrics (Edge Dashboard)

| Metric | Target | Source |
| ------ | ------ | ------ |
| Mean end-to-end task latency | ≤ 120s | Codex logs |
| Cost per merged LOC | ≤ $0.002 | Tide cost tracker |
| PR auto-merge success rate | ≥ 90% | Caca + Claudia |
| Sandbox failure rate (24h) | 0 | Basher |

Edge auto-publishes the metrics board at /dash/codexv2.

## B-10 One-Line Bootstrap (for new repos)

```bash
pulser init codexv2 --repo https://github.com/acme/newproj \
       --tasks implement,write-tests,propose-pr \
       --compliance soc2-iso27001 \
       --cost-cap 50
```

## B-11 Logging Infrastructure

### Using codex_to_kalaw.py

The log forwarder script connects to Codex v2's SSE log stream and forwards logs to Kalaw in batches:

```bash
# Start log forwarder
python codex_to_kalaw.py --log-level info --batch-size 100 --flush-interval 60
```

For production deployment, use the provided systemd service:

```bash
# Install service
sudo cp codex_to_kalaw.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable codex_to_kalaw
sudo systemctl start codex_to_kalaw

# Check status
sudo systemctl status codex_to_kalaw
```

### Log Query Examples

Query logs from Kalaw using:

```bash
# Get all logs from the last hour
pulser exec kalaw:query --bucket skr://codex-logs/ --timeframe "now-1h" --limit 1000

# Get error logs only
pulser exec kalaw:query --bucket skr://codex-logs/ --filter 'level="error"' --limit 100

# Get logs for a specific PR
pulser exec kalaw:query --bucket skr://codex-logs/ --filter 'pr_number=97' --timeframe "now-24h"
```

## B-12 MCP UI Components

The MCP bridge provides the following UI components for Claude Desktop:

1. **Codex Task Status Widget** - Shows active Codex tasks and their status
2. **Cost Tracker** - Live cost per task and daily budget usage
3. **PR Reviewer** - Inline PR review with diff highlighting
4. **Code Explanation** - Collapsible panels with Codex's reasoning

To enable these components, add to ~/.mcp/ui_config.yaml:

```yaml
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
```