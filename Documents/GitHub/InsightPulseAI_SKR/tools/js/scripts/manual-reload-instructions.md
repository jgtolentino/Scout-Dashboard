# Codex Agent Reload Instructions

The guardrails policy has been successfully added to the repository, but we need to reload the Codex agent to activate the runtime enforcement. Follow these steps to complete the deployment:

## Option 1: Using the Pulser CLI

If you have the Pulser CLI installed on your system, run the following command:

```bash
pulser clodrep deploy-agent codex --reload
```

## Option 2: Using the `:clodrep` Command

If you're using the Pulser shell with command aliases, run:

```bash
:clodrep deploy-agent codex --reload
```

## Option 3: Manual Reload

If the options above don't work:

1. Navigate to your Pulser agents directory:
   ```bash
   cd ~/.pulser/agents
   ```

2. Check if the Codex agent is running:
   ```bash
   ps aux | grep codex
   ```

3. If it's running, restart it:
   ```bash
   kill <process-id>
   ./launch_agent.sh codex
   ```

## Verification

To verify that the guardrails are active, run a test command:

```bash
:clodrep patch dashboard-interactivity.js "Fix the loading state handling"
```

Look for messages about schema validation, linting, or other guardrails being enforced during the patch process.

## Troubleshooting

If you encounter any issues with the guardrails:

1. Check that the path to the guardrails policy is correct in `agent_codex.yaml`
2. Ensure all referenced scripts and schemas exist
3. Look at the agent logs for any error messages:
   ```bash
   cat ~/.pulser/logs/codex_agent.log
   ```