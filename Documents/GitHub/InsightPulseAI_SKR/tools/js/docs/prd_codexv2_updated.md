# Product Requirements Document — **Codex v2** (Post-Windsurf Acquisition)

---

## 0. Change Log  
| Date (UTC+08) | Version | Author           | Summary                                  |
|---------------|---------|------------------|------------------------------------------|
| 2025-05-17    | 2.0.1   | Claudia N. CUDA  | Added missing sections; corrected formatting |

---

## 1. Product Objective  
Deliver an **autonomous, full-stack software-engineering agent** by combining OpenAI's o3 reasoning models with Windsurf's Cascade/Supercomplete platform—providing end-to-end feature dev, testing, PR automation, and audit-ready logs in a secure cloud sandbox.

---

## 2. Strategic Improvements over Codex v1  

| Area             | Codex v1                          | Codex v2 (Relaunch)                        |
|------------------|-----------------------------------|--------------------------------------------|
| Core function    | Code completion                   | Multi-task agent (write/debug/test/PR)     |
| UX               | VS Code autocomplete plugin       | Cloud IDE + taskboard + inline reasoning   |
| Model backend    | GPT-3.5‐based Codex               | o3 reasoning with parallel orchestration   |
| Scope of context | Single file / prompt window       | Full repo context, cross-repo imports      |
| Acquisition lift | —                                 | Windsurf Cascade routing + Supercomplete   |

---

## 3. Key Features  
- **Parallel Agent Execution** in isolated sandbox  
- **Cascade Routing** for FE/BE/infra specialization  
- **Supercomplete** repo-wide context inference  
- **Autonomous PR Creation** with human-readable rationale  
- **Role-based Workflows** for individuals, teams, enterprise  

---

## 4. UI/UX Simplification Plan (Echo + Deckgen)  
1. **"Try Codex v2"** one-click sandbox spawn (< 5 s)  
2. **Taskboard** for real-time agent progress  
3. **Inline Reasoning Pane** with LLM logs and cost rundown  
4. **Safe-Mode Toggle** (read-only preview before writes)  

---

## 5. Suggested Enhancements (Maya + Claudia)  
- Prompt replay & version history  
- GitHub Copilot fallback bridge  
- Exportable dev-journal logs  
- Live token-cost dashboard panel  
- `codex-cli` offline companion  

---

## 6. Go-to-Market Segmentation (Claudia)  
- **Indie Devs**: Free tier, 200 compute-mins/mo  
- **Pro Users**: $30/mo, GitHub sync, cost panel  
- **Enterprise**: SOC-2 II container, SLA 99.9 %  

---

## 7. Risks & Mitigations  

| Risk                          | Mitigation                                      | Owner     |
|-------------------------------|-------------------------------------------------|-----------|
| Overlap with Copilot          | Position as autonomous agent; publish benchmarks| Claudia   |
| High compute cost             | Tide→o3-nano default; batch requests; $150/day cap | Tide/Basher |
| Auto-PR trust concerns        | Enforce Caca ≥ 0.85 gate → human review         | Caca      |
| Legacy confusion              | Rename binary `codexv2`; Windsurf badge in UI  | Maya/Echo |
| Token-cost opacity            | Live cost widget; Slack digest via Edge        | Edge      |
| Compliance requirements       | On-prem container; SOC-2 II, ISO 27001 roadmap  | Gina      |

---

## 8. Functional Specifications  

### 8.1 API Endpoints  
| Method | Path                    | Purpose                               | Auth   |
|--------|-------------------------|---------------------------------------|--------|
| POST   | `/v2/codex/tasks`       | Submit `{ repo, branch, task }`       | Bearer |
| GET    | `/v2/codex/tasks/{id}`  | Stream SSE status & logs              | Bearer |
| POST   | `/v2/codex/snapshots`   | Create sandbox snapshot               | Bearer |

### 8.2 CLI Commands  
```bash
pulser exec codexv2:implement  --repo <URL> --task "Add OAuth2"
pulser exec codexv2:write-tests --path src/
pulser exec codexv2:propose-pr   --base main
```

### 8.3 IDE Hooks

* **Web IDE**: Monaco + diff view + cost widget
* **VS Code**: Language-server integration for local previews
* **Webhooks**: `task_completed`, `pr_opened`, `caca_scored`

---

## 9. Non-Functional Requirements

| Category       | Target                                  |
| -------------- | --------------------------------------- |
| Latency (95%)  | ≤ 8 s per 500 LOC generation            |
| Availability   | 99.9 % monthly                          |
| Cost SLO       | ≤ \$0.002 / merged LOC                  |
| Security       | SOC-2 II, ISO 27001, SLSA-3 build chain |
| Data residency | Tenant-selectable EU/US                 |
| Sandbox egress | Port 443 only                           |

---

## 10. User Stories & Acceptance

| ID    | Story                                          | Acceptance Criteria                                        |
| ----- | ---------------------------------------------- | ---------------------------------------------------------- |
| US-01 | As a dev, I need OAuth2 login code generation. | PR created, tests pass, Caca ≥ 0.85                        |
| US-02 | As a lead, I need a live cost dashboard.       | Edge panel shows daily spend & LOC within 5 % of Tide logs |
| US-03 | As an auditor, I need immutable audit logs.    | Kalaw exports JSONL with SHA-256 checksums                 |

---

## 11. Metrics & KPIs

| Metric                     | Target  | Owner   |
| -------------------------- | ------- | ------- |
| Weekly active repos        | ≥ 5 000 | Claudia |
| PR merge success rate      | ≥ 90 %  | Caca    |
| Mean cost per LOC (USD)    | ≤ 0.002 | Tide    |
| Sandbox failure rate / day | 0       | Basher  |

*Displayed on Edge dashboard `/dash/codexv2`.*

---

## 12. Release Plan & Phasing

| Phase     | Scope                                     | ETA      |
| --------- | ----------------------------------------- | -------- |
| **Alpha** | Invite-only, read-only mode, 50 repos     | Jun 2025 |
| **Beta**  | Pro tier PR writes + cost panel           | Aug 2025 |
| **GA**    | Enterprise on-prem container + SLA + RBAC | Oct 2025 |

---

## 13. Open Issues & Dependencies

| ID    | Item                                      | Blocker               |
| ----- | ----------------------------------------- | --------------------- |
| DEP-1 | Sandbox on-prem image size > 10 GB        | Gina's storage budget |
| DEP-2 | Caca v3 schema handshake                  | Caca v3 release       |
| DEP-3 | o3 Parallelism licensing (covered by MAX) | N/A                   |

---

## 14. Appendix A — Agent Suggestions

```yaml
agents:
  - id: maya     # Process Architect
    role: Process Architect
    task: Structure PRD, workflow improvements, version history
  - id: claudia  # Strategic Orchestrator
    role: Strategic Orchestrator
    task: Align Codex GTM, enterprise segmentation, pricing logic
  - id: kalaw    # Research Indexer
    role: Research Indexer
    task: Store Codex 1 vs 2 benchmark data, Windsurf acquisition archive
  - id: echo     # Multimodal Analyzer
    role: Multimodal Analyzer
    task: UI/UX deltas, video demo analysis, agent logs
  - id: deckgen  # Visualizer
    role: Visualizer
    task: Generate Codex relaunch roadmap deck (from PRD+Echo data)
```

---

## 15. Appendix B — Integration Guide

See `/docs/appendix_b_codexv2.md` for the full end-to-end Pulser CLI, MCP bridge, Basher, Tide, Caca, Gina, Edge, and Claude Desktop integration recipe.

---

## 🚩 Immediate Action Checklist

* [ ] **DOC-1**: Merge `docs/prd_codexv2.md` into SKR & link in `README.md` (Maya)
* [ ] **CFG-1**: Commit `agents/codexv2.yaml` → `main` & run `pulser agents:sync` (Claudia)
* [ ] **CFG-2**: Update `~/.pulserrc` for `claude-4.1-opus` primary, `deepseekr1` fallback (Tide)
* [ ] **CFG-3**: Verify `~/.claude/config.json` MAX plan settings (Edge)
* [ ] **INF-1**: Publish sandbox image in Pulser vault `vault://codex/` (Gina)
* [ ] **INF-2**: Release Basher script for sandbox spin/rotate/cleanup (Basher)
* [ ] **MCP-1**: Ship MCP v0.9.7 with Pulser auto-discover & MAX token passthrough (Edge)
* [ ] **UI-1**: Add cost/token widget to Claude Desktop side-panel (Echo)
* [ ] **QA-1**: Finalize Caca v3 `/review` endpoint & schema (Caca)
* [ ] **LOG-1**: Deliver `codex_to_kalaw.py` forwarder (SSE→SKR) (Kalaw)
* [ ] **SEC-1**: Configure RBAC mapping in Gina's ARM templates (Gina)
* [ ] **DOC-2**: Publish Appendix B as `/docs/appendix_b_codexv2.md` (Maya)
* [ ] **CICD-1**: Add Git pre-push hook template in repo scaffold (Basher)
* [ ] **TEST-1**: Run bench (DeepSeekr1 vs Claude 4.1) for LOC/hr, cost, QA (Claudia)