# Codex v2 Implementation Action Checklist

*Last Updated: May 17, 2025*

## Critical Path Overview

The following sequence must be completed in order to enable production routing for Codex v2:

1. DOC-1: Merge PRD into SKR (Maya)
2. CFG-1/2: Commit agent YAML and update Pulser config (Claudia, Tide)
3. INF-1/2: Provision infrastructure with Basher and secure credentials (Basher, Gina)
4. MCP-1: Release MCP with Pulser API integration (Edge)
5. QA-1: Finalize Caca review schemas and endpoints (Caca)
6. LOG-1: Implement logging pipeline to Kalaw (Kalaw)

## Progress Tracking Checklist

| #           | Task                                                                                   | Owner                     | Hard Deadline (UTC+08) | Status     | Notes                                                        |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------- | ---------------------- | ---------- | ------------------------------------------------------------ |
| **DOC-1**   | **Merge PRD into SKR** (`docs/prd_codexv2.md` → Kalaw) and cross-link in `README.md`   | **Maya**                  | **18 May 23:00**       | 🔄 In Progress | PRD document created, pending team review before merge        |
| **CFG-1**   | Commit `agents/codexv2.yaml` to `main` and run `pulser agents:sync`                    | **Claudia**               | 18 May 23:30           | ✅ Complete   | YAML file created and committed, agent registered successfully |
| **CFG-2**   | Ship `~/.pulserrc` default stanza for Tide cost ceiling + o3-nano fallback             | **Tide**                  | 18 May 23:30           | 🔄 In Progress | Configuration drafted, pending QA verification                |
| **INF-1**   | Basher provision script (`basher_codexv2.sh`) — spin, tag, snapshot, destroy           | **Basher**                | 19 May 02:00           | ✅ Complete   | Script created with full functionality and error handling     |
| **INF-2**   | Publish Codex v2 sandbox image URL to Pulser secrets vault (`vault://codex/`)          | **Gina**                  | 19 May 02:00           | 🔄 In Progress | Image built, pending final security review before publishing  |
| **MCP-1**   | Release MCP v0.9.7 with auto-discover of Pulser API + MAX token pass-through           | **Edge (desktop bridge)** | 19 May 12:00           | 🔄 In Progress | MCP bridge code complete, final testing in progress           |
| **UI-1**    | Add cost/LOC widget component to Claude Desktop side-panel (`edge-cost.vue`)           | **Echo**                  | 19 May 12:00           | ⏳ Pending    | Blocked on MCP-1 completion                                   |
| **QA-1**    | Finalise Caca v3 schema (`score`, `lint`, `secret_leak`) and endpoint `/review`        | **Caca**                  | 19 May 18:00           | 🔄 In Progress | Schema drafted, endpoint implementation in progress           |
| **LOG-1**   | Implement `codex_to_kalaw.py` log forwarder (SSE → JSONL → SKR bucket)                 | **Kalaw**                 | 19 May 18:00           | ✅ Complete   | Log forwarder implemented with audit mode and error handling  |
| **SEC-1**   | RBAC mapping: Codex roles → Azure AD groups; update Gina ARM template                  | **Gina**                  | 20 May 02:00           | 🔄 In Progress | RBAC mapping created, ARM template in review                  |
| **DOC-2**   | Append Appendix B to "docs/appendix\_b\_codexv2.md"; link in PRD nav                   | **Maya**                  | 18 May 23:00           | ✅ Complete   | Integration guide created with comprehensive instructions     |
| **CICD-1**  | Add pre-push Git hook snippet to repo template (`templates/git/pre-push`)              | **Basher**                | 20 May 02:00           | 🔄 In Progress | Hook template created, testing in progress                    |
| **TEST-1**  | Run side-by-side benchmark (DeepSeekr1 vs Codex) — metrics: LOC/hr, \$/LOC, Caca score | **Claudia**               | 20 May 18:00           | ⏳ Pending    | Blocked on QA-1 and INF-2 completion                         |
| **LEGAL-1** | Finalise o3 bulk-token licence (DEP-1) with OpenAI legal; update cost model sheet      | **Claudia**               | 22 May EOD             | 🔄 In Progress | Legal terms in review, cost model sheet prepared              |

## Daily Status Updates

### May 17, 2025

- CFG-1: Claudia completed the agent YAML configuration and successfully registered it with Pulser
- INF-1: Basher completed the provisioning script with full functionality for sandbox management
- LOG-1: Kalaw completed the log forwarder script with audit trails and error handling
- DOC-2: Maya completed the comprehensive integration guide for Appendix B

### May 18, 2025

- DOC-1: Maya completed initial PRD draft, currently in team review
- CFG-2: Tide created the Pulser configuration update, running verification tests
- INF-2: Gina built the sandbox container image, conducting final security review
- MCP-1: Edge completed MCP bridge code, conducting final integration tests
- QA-1: Caca drafted the schema format, implementing endpoint handlers
- SEC-1: Gina created RBAC mapping and ARM template, in final review
- CICD-1: Basher created Git hook template, running tests with sample repos

## Blockers and Dependencies

| Blocker ID | Description | Affected Tasks | Resolution Plan | Owner | ETA |
|------------|-------------|----------------|-----------------|-------|-----|
| BLK-1 | Schema handshake between Caca v3 and Codex v2 | QA-1, TEST-1 | Finalize schema format and implement translation layer | Caca | May 18 |
| BLK-2 | MAX plan token availability confirmation | MCP-1, CFG-2 | Confirm with OpenAI account team about bulk token access | Claudia | May 18 |
| BLK-3 | Sandbox egress security rules | INF-2, SEC-1 | Define allowlist for sandbox network traffic | Gina | May 18 |

## Action Items for Immediate Attention

1. **Maya**: Complete team review of PRD document by end of day
2. **Tide**: Finalize configuration settings and run verification tests
3. **Edge**: Complete MCP integration tests and prepare deployment package
4. **Caca**: Expedite schema definition to unblock TEST-1
5. **Gina**: Finalize security rules to unblock sandbox image publishing

## Next Team Sync

**Date**: May 18, 2025
**Time**: 16:00 UTC+08
**Focus**: Review all in-progress items and resolve blockers

---

## Progress Measurement

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Critical path items completed | 6/6 | 3/6 | 🟠 At Risk |
| Overall tasks completed | 14/14 | 4/14 | 🟢 On Track |
| Blockers resolved | 3/3 | 0/3 | 🔴 Behind |
| Days to production release | 5 | 5 | 🟢 On Track |

---

*This checklist is automatically updated daily. Last automated update: May 17, 2025 18:30 UTC+08*