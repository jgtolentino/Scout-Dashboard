#!/bin/bash

# Deploy Codex Guardrails Script
# Commits the guardrails policy and agent update, then reloads the agent

set -e

echo "Committing Codex guardrails policy..."
git add agents/codex_guardrails.yml
git add agents/codex/agent_codex.yaml

git commit -m "Add Codex guardrails policy and integration

- Add guardrails policy for runtime enforcement
- Update agent_codex.yaml to reference the policy
- Enable schema checks, linting, feature flags, and telemetry"

echo "Pushing changes to remote repository..."
git push origin main

echo "Reloading Codex agent..."
pulser clodrep deploy-agent codex --reload

echo "✅ Codex guardrails successfully deployed and agent reloaded!"
echo ""
echo "Codex will now auto-enforce:"
echo "- Schema validation for configuration files"
echo "- Linting and code formatting"
echo "- Feature flag requirements"
echo "- Test feedback loops"
echo "- Telemetry implementation"
echo ""
echo "To see the guardrails in action, try running:"
echo "  :clodrep patch dashboard-interactivity.js \"Fix the loading state handling\""