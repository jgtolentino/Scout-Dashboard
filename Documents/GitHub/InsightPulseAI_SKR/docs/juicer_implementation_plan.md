# Juicer Frontend Implementation Plan
InsightPulseAI | Pulser v2.0 | Stacey Integration

## 🎯 Goals
Develop the full web-based REPL interface for Juicer using:
- Pulser-compatible frontend shell
- Command input with autocomplete
- Assistant panel for multi-agent responses
- Sunnies integration for visual feedback (charts, tags, trends)

## 🧩 Core Components

| Component             | Description                                               | Agent Assigned |
|----------------------|-----------------------------------------------------------|----------------|
| AssistantPanel.jsx   | Main output panel for shell-based REPL display            | Stacey         |
| CommandInput.jsx     | Input box with autocomplete, command suggestions          | Stacey         |
| ChartWrapper.jsx     | Embedded Sunnies visual render (chart bridge)             | Stacey         |
| SunniesBridge.js     | JS bridge connecting PulseOps to Sunnies data views       | Stacey         |
| build_stacey_ui.sh   | Setup script to deploy frontend components                | Basher         |

## 🧠 Agent Map

| Role         | Agent     | Responsibility                                    |
|--------------|-----------|---------------------------------------------------|
| Orchestrator | Claudia   | Triggers and routes Juicer commands               |
| Dev Executor | Stacey    | Builds and renders UI components                  |
| GitOps       | Jess      | Ensures version sync, branch controls             |
| SysOps       | Basher    | Executes deploy scripts, handles shell access     |
| QA           | Caca      | Validates CLI output and visual load integrity    |

## 📅 Milestones

- [x] Routing YAML defined (`juicer_frontend.yaml`)
- [x] Frontend components scaffolded
- [x] Deployment script (`build_stacey_ui.sh`) created
- [ ] Visual test for `SunniesBridge.js`
- [ ] PulseShell REPL load validation

## ⚠️ Risks & Dependencies

- Browser compatibility for REPL rendering (test Chrome/Safari)
- Proper permissions for `scripts/` execution
- Ensure all Sunnies chart data endpoints are live before integration

---

## Next Step
Run `bash ./scripts/build_stacey_ui.sh` and validate via `http://localhost:3000` or the assigned dev URL.