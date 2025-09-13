# Codex Agent Deployment Guide

This document explains how to deploy the Codex autonomous coding agent into the Pulser system.

## Setup

I've created the necessary files for the Codex agent:

1. **System prompt:** `/agents/codex/codex_prompt.txt`
2. **Agent configuration:** `/agents/codex/agent_codex.yaml`

## Deployment Options

### Option 1: Using :clodrep command (Recommended)

```bash
:clodrep deploy-agent codex \
  --config-file agents/codex/agent_codex.yaml \
  --prompt-file agents/codex/codex_prompt.txt \
  --register \
  --enable
```

### Option 2: Using zip-based integration

If you have a pre-packaged zip file:

```bash
:clodrep integrate-agent \
  --zip /Users/tbwa/Downloads/codex_agent_pulser_bundle.zip \
  --agent-id codex \
  --mount-path agents/codex \
  --register \
  --enable \
  --run-test ":codex ask --repo ./mockify-creator --query 'What does sync_context() do?'"
```

## Testing the Agent

After deployment, test the agent with:

```bash
# Ask about code
:codex ask --repo ./mockify-advisor-ui --query "How is the authentication implemented?"

# Explain specific code
:codex explain --file ./app.js --line 45-60

# Request a refactor
:codex refactor --file ./utils/feature-flags.js --prompt "Refactor to use a more modular approach"

# Fix an issue
:codex fix --description "Fix the race condition in the async data loading" --files "./src/data-loader.js,./src/utils/async-helpers.js"
```

## Integration with Other Agents

Codex is designed to work with:

- **Claudia** - For task routing and context management
- **Basher** - For shell command execution
- **Maya** - For process logging and documentation
- **Caca** - For quality assurance and testing

## Monitoring

Check agent logs at:

```bash
cat ~/.pulser/logs/codex_agent.log
```

## Troubleshooting

If the agent fails to deploy or run:

1. Verify the agent files exist and have correct permissions
2. Check if the agent is registered: `pulser agents list`
3. Look for errors in the log file
4. Ensure the agent has access to the repositories it needs to analyze