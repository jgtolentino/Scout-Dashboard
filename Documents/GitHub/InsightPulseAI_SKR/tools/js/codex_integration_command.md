# Codex Agent Integration Command

To integrate the Codex agent with Pulser CLI, use the following clodrep command:

```bash
:clodrep integrate-agent \
  --zip /Users/tbwa/Downloads/codex_agent_pulser_bundle.zip \
  --agent-id codex \
  --mount-path agents/codex \
  --register \
  --enable \
  --run-test ":codex ask --repo ./mockify-creator --query 'What does sync_context() do?'"
```

## Command Parameters

- `--zip`: Path to the downloaded agent bundle zip file
- `--agent-id`: Unique identifier for the agent (codex)
- `--mount-path`: Directory where the agent will be installed relative to Pulser root
- `--register`: Registers the agent with Pulser CLI
- `--enable`: Activates the agent after installation
- `--run-test`: Optional command to test the agent after installation

## After Installation

Once installed, you can use the Codex agent with commands like:

```bash
:codex ask --repo ./path-to-repo --query "Your question about the codebase"
:codex explain --file ./path/to/file.js --line 25-35
:codex refactor --file ./path/to/file.js --prompt "Extract this function into a separate module"
```

## Troubleshooting

If you encounter issues:

1. Check if the agent was properly registered:
   ```bash
   pulser agents list
   ```

2. Verify the agent directory structure:
   ```bash
   ls -la agents/codex/
   ```

3. Check agent logs:
   ```bash
   cat ~/.pulser/logs/codex_agent.log
   ```