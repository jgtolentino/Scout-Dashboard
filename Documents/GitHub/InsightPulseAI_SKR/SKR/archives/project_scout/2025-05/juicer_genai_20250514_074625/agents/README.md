# InsightPulseAI Agent Directory

This directory contains YAML configuration files for the agents used in the Juicer system. Each agent has a specific role in the data processing, analysis, and visualization pipeline.

## Core Agents

| Agent Name | File | Role |
|------------|------|------|
| Claudia | `claudia.yaml` | CLI task routing and orchestration for `:juicer` commands |
| Maya | `maya.yaml` | Documentation and visualization templates via `juicer_hook.yaml` |
| Kalaw | `kalaw.yaml` | Knowledge extraction from enriched SQL + entity metadata |
| Echo | `echo.yaml` | Signal extraction, transcription sentiment enrichment |
| Sunnies | `sunnies.yaml` | Visual rendering of charts and dashboard blocks |
| Caca | `caca.yaml` | QA validation and hallucination detection for GenAI insights |
| Snow White | `snowwhite.yaml` | White-labeling & rebranding for client deliverables |

## Agent System Architecture

```
Claudia (Orchestrator)
│
├── Kalaw (Knowledge/Metadata)
│   └── Echo (Signal Extraction)
│
├── Maya (Documentation/Visualization)
│   └── Sunnies (Chart Rendering)
│
├── Caca (QA/Validation)
│
└── Snow White (White-Labeling)
```

## How Agents Interact

1. **Claudia** receives commands via CLI and orchestrates the overall process
2. **Kalaw** manages the knowledge repository and metadata for all insights
3. **Echo** processes raw transcripts and extracts brand mentions
4. **Maya** generates documentation and visualization templates
5. **Sunnies** renders charts and dashboard components
6. **Caca** validates generated insights for quality and accuracy
7. **Snow White** manages white-labeling for client deliverables

## Adding a New Agent

To add a new agent to the system:

1. Create a YAML configuration file in this directory
2. Add the agent to the appropriate orchestration hooks
3. Update the CLI command registry
4. Implement agent logic in the appropriate scripts directory
5. Update this README to document the agent's role

## Maintaining Agent Consistency

When modifying agents, ensure:

1. Consistent naming conventions
2. Clear role definition
3. Proper integration with existing agents
4. Documentation of the agent's capabilities
5. Test coverage for agent functionality