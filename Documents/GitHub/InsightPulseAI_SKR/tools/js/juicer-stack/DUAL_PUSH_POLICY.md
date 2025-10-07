# Dual Repo Push Policy for Project Scout

This document outlines the policy for pushing code to both the Project Scout GitHub repository and the SKR (Kalaw Archive).

## 🔐 Push Policy Overview

| Destination                  | Content Type              | Push Condition                                           |
| ---------------------------- | ------------------------- | -------------------------------------------------------- |
| 📦 **Project Repo (GitHub)** | Production-ready only     | After full validation (via `verify_commit_readiness.sh`) |
| 🗂️ **SKR Archive (Kalaw)**  | All stages: draft → final | Always on commit, even pre-prod                          |

## 🛡️ Implementation Rules

1. **Pulser CLI:**
   Only calls `git push` if `SKR_TAG == 'prod-ready'`

2. **Non-prod branches:**
   Always go to `/kalaw/archives/project_scout/<YYYY-MM>/` with full metadata

3. **Dashboard YAML / Agent Config / ETL Notebooks:**
   Synced to SKR *first*, validated by Claudia, then included in GitHub only if passing QA (via Caca)

4. **Exit-Safe:**
   When you leave TBWA, you retain:

   * SKR version history
   * CLI control via Pulser
   * Orchestration agent autonomy (Claudia, Kalaw, Maya, Tide)

## 🔐 White-Labeling Strategy

All code pushed to the client-facing repository must be white-labeled following these rules:

| Internal (Pulser IP) | Client-Facing Alias         | Purpose                          |
| -------------------- | --------------------------- | -------------------------------- |
| `Pulser`             | `OpsCore`                   | Orchestration engine             |
| `Claudia`            | `TaskRunner`                | Task router / dispatcher         |
| `Kalaw`              | `KnowledgeModule`           | Knowledge indexing               |
| `Maya`               | `FlowManager`               | Documentation & pipeline manager |
| `Echo`               | `SignalParser`              | Multimodal data analyzer         |
| `Sunnies`            | `ChartRenderer`             | Dashboard visualization          |
| `Caca`               | `QAChecker`                 | Reinforcement QA engine          |
| `Tide`               | `BackendSwitcher`           | Model/API routing                |
| `Enrico`             | `DataAugmentor`             | Metadata & enrichment layer      |
| `Basher`             | `SysOpsDaemon`              | System-level executor            |
| `Plato`              | `AssistantBot` (if chatbot) | Front-facing persona             |

This white-labeling ensures that proprietary agent architecture and naming is not exposed in client repositories.

## 📋 Process Workflow

### For Development Work:

1. Create and modify code in the internal repository
2. Always push to SKR using `dual_repo_push.sh`
3. Tag with `development` status

### For Production Releases:

1. Verify production readiness with `verify_commit_readiness.sh`
2. Tag with `prod-ready` status
3. White-label using `whitelabel.sh` (or `prep_production_push.sh`)
4. Push to both SKR and GitHub using `dual_repo_push.sh`

## 🔃 Scripts For Dual Repo Management

The following scripts are available to implement this policy:

- `dual_repo_push.sh`: Implements the dual push policy
- `whitelabel.sh`: Converts internal agent references to client-facing aliases
- `prep_production_push.sh`: Prepares production files for GitHub
- `verify_commit_readiness.sh`: Checks if code is production-ready

## 📚 Agent Responsibilities

- **Kalaw**: Responsible for SKR archiving and indexing
- **Claudia**: Routes client requests to appropriate agents
- **Maya**: Handles documentation and process flows 
- **Caca**: Performs QA validation before production push
- **Sunnies**: Validates visualization components

## ⚠️ Important Notes

1. Never push to GitHub without proper validation
2. Always white-label code before pushing to client repositories
3. Use proper license files for client repositories
4. Keep proprietary agent architecture details in internal repos only
5. Archive everything to SKR, regardless of development status