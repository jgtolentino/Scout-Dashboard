# Agent Discovery Report

## Summary
Total agent-related files found: 204
- YAML files: 152
- JSON files: 50
- Markdown files: 2

## Key Agent Profiles Discovered

### 1. Main Agent Registry
- **pulser_agent_registry.yaml**: Contains CLAUDIA, PULSER, KALAW
- **agents/agent_catalog.yaml**: Lists Fully and Doer agents

### 2. Active Agent Implementations

#### Standalone Agents
- **agents/savage/agent.yaml**: Agent Savage (Pattern Generator)
- **agents/memory-agent.yaml**: ClaudeMemoryAgent
- **dayops-agent/agents/dayops.yaml**: DayOps (Daily Operations)
- **voice-project/aqua_voice_agent.yaml**: AquaVoiceAgent

#### Project-Specific Agents
- **scout-dashboard/agents.yaml**: RetailBot
- **scout-analytics-clean/agents/keykey-agent.yaml**: KeyKey Agent
- **enrichment_engine/agents/**: Multiple agents (percy, keykey, visual-diff)
- **ces-jampacked-agentic/agents/**: Echo, Reposynth, Dash, Orchestrator, Gagambi

#### Documentation Suite Agents
- **tbwa-expense-clone/agents/documentation-suite/**:
  - sop-writer-agent.yaml
  - learnbot-agent.yaml
  - deployment-agent.yaml

### 3. Agent Workflows & CI/CD
- **scout-analytics-clean/.github/workflows/repo-agent-ci.yml**
- **scout-dashboard/.github/workflows/deploy-agents.yml**

### 4. MCP-Related Agents
- **mcp-sqlite-server/agents/jampacked/agent.yaml**
- **ces-jampacked-agentic/agents/mcp-docker-agents.yaml**

### 5. Claude Internal Agents
- Multiple JSON files in **.claude/todos/** (internal state management)

## Recommendations

1. **Consolidate Agent Definitions**: Many duplicate agent definitions across projects
2. **Standardize Format**: Mix of formats (id vs name, capabilities structure varies)
3. **Create Central Registry**: Build a unified agent registry importing all discovered agents
4. **Clean Up Obsolete Files**: Many Claude todo JSON files can be archived

## Next Steps

To get a unified view of all agents with their capabilities:

```bash
# Extract all agent names/IDs
grep -h "name:" $(find . -name "*agent*.yaml" -type f) | sort -u

# Extract all capabilities
grep -A5 "capabilities:" $(find . -name "*agent*.yaml" -type f)
```