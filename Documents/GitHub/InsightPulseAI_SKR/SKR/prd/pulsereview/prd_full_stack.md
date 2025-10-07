# **Product Requirements Document (PRD)**

**Project Codename**: *PulseReview*
**Target Benchmark**: Reverse-engineered from CodeRabbit
**Objective**: Deliver an AI-powered code review and diagram generation system with multi-agent orchestration, backend switching, cursor-style prompts, CI/CD guarantees, and zero-regret deployments.

---

## **1. Overview**

PulseReview is designed to replace and improve upon CodeRabbit by embedding:

* Modular prompts (Cursor-style)
* Multi-model routing (via Tide)
* Audit-verified outputs (via Caca)
* Real-time DevOps resilience (via Basher + Claudia)
* CI/CD protection mechanisms
* Fully version-controlled diagram and review artifacts

---

## **2. User Personas**

| Persona         | Role                                              |
| --------------- | ------------------------------------------------- |
| Developer       | Requests reviews, generates diagrams              |
| Tech Lead       | Ensures SOP compliance, reviews PR integrity      |
| QA Agent (Caca) | Validates output before merge                     |
| DevOps Lead     | Oversees CI/CD, failure recovery                  |
| Infra Engineer  | Manages model backends, prompt policy enforcement |

---

## **3. Functional Requirements**

### A. AI-Powered Code Review

* Multi-agent inline comments (logic, security, UX)
* Routed via Tide to Claude, DeepSeekr1, or local
* Fingerprinted prompts using SHA256 for audit trace

### B. Diagram Generation

* Accepts source code or prompt
* Renders sequence or architecture diagrams via Deckgen
* Exported as `.svg` with signed metadata and prompt trace

### C. Cursor-Style Prompt System

* Stored in `prompt_library.yaml`, versioned and ID-tagged
* CLI-routable via `:plist` or `:pcode`
* Enforced freeze via `.pulser_prompts.lock`

### D. Tide Routing Layer

* Smart routing logic:

  ```yaml
  claude-opus → deepseekr1 → fallback_yaml
  ```
* Logs prompt origin, backend used, fallback reason
* Trace saved in `tide_trace.json`

---

## **4. CI/CD Infrastructure**

### A. Triggered Events

* On PR open:

  * Run Caca validation
  * Check prompt fingerprint
  * Validate diagram generation completes in latency budget
* On merge to main:

  * Basher auto-packages PulseReview CLI (GitHub Action)
  * Logs artifacts in `logs/deploy_trace.json`

### B. CI/CD Config Output

* `ci_cd.agent.yaml`: defines execution steps
* `.pulser_prompts.lock`: locks prompt content
* `output_signatures.json`: stores SHA256, agent\_id, prompt\_id per artifact

---

## **5. Failure Recovery Protocols**

**Defined in `failure_handling.md`:**

| Failure Case         | Resolution                                |
| -------------------- | ----------------------------------------- |
| Claude timeout       | Reroute to DeepSeekr1                     |
| Deckgen crash        | Trigger CLI debug render                  |
| Caca rejects diagram | PR merge blocked, log fail reason         |
| Prompt hash mismatch | Raise `prompt_drift_error` with diff link |

---

## **6. Artifact Integrity and Logging**

* All AI-generated outputs must include:

```yaml
output_signature:
  file: diagram.svg
  sha256: b2f0...
  prompt_id: review_cursor_v1
  agent: claude-opus
  timestamp: 2025-05-15T21:13+08:00
```

* Saved in `logs/artifacts/` and linked to Claudia's orchestration records

---

## **7. SLI/SLO Performance Metrics**

| Task                    | SLO      | Threshold      |
| ----------------------- | -------- | -------------- |
| Code review generation  | < 3000ms | Alert if >3.5s |
| Diagram rendering       | < 4000ms | Fail if >5s    |
| Prompt routing via Tide | < 500ms  |                |

Metrics stored in `metrics/performance.yaml`, reviewed weekly by Claudia + Echo.

---

## **8. Improvements Over CodeRabbit**

| Area                | PulseReview Upgrade                           |
| ------------------- | --------------------------------------------- |
| Prompt Modularity   | Cursor-style, versioned, reusable             |
| Backend Flexibility | Tide handles Claude, DeepSeekr1, fallback     |
| Output Validation   | Caca enforces QA gates                        |
| Auditability        | SHA256 + prompt trace per file                |
| Deployment Safety   | Basher-controlled CI/CD with drift protection |

---

## **9. Architecture Overview**

```mermaid
graph TD
User -->|Prompt| Tide
Tide -->|Route| Claude
Claude -->|Review| Claudia
Claudia --> Caca -->|Validate| Deckgen
Deckgen -->|Render| SVG
Caca -->|Sign| Output
Claudia --> Maya -->|Index| SKR
Claudia --> Basher -->|Deploy| GitHub CI
```

---

## **10. Deliverables**

| Milestone | Agent(s)       | Output                                            |
| --------- | -------------- | ------------------------------------------------- |
| M1        | Claudia + Maya | `prd_pulsereview.md`, `ci_cd.agent.yaml`          |
| M2        | Tide           | `tide_trace.json`, `.pulser_prompts.lock`         |
| M3        | Caca           | `output_signatures.json`, `qa_results.yaml`       |
| M4        | Basher         | GitHub Action installer for PulseReview           |
| M5        | Echo           | `performance.yaml` logs + prompt latency tracking |