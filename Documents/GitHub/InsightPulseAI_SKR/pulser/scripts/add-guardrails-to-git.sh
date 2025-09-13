#!/bin/bash

# Add Guardrails to Git
# This script adds all the guardrail files to git

echo "Adding schema files to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/schemas/*.json

echo "Adding prompt templates to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.prompts/*.md

echo "Adding Husky hooks to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.husky/*

echo "Adding CI/CD workflow to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.github/workflows/ci.yml

echo "Adding feature flags and telemetry utilities to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/utils/feature-flags.js
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/utils/telemetry.js

echo "Adding scripts to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/ai-test-loop.js
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/apply-prompt-template.js
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/create-golden-baseline.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/deploy-canary.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/promote-to-production.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/rollback-to-golden.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/setup-azure-alerts.js
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/verify-against-golden.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/manual-finalize.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/finalize-guardrails.sh
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scripts/validate-schemas.js

echo "Adding linting configurations to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.eslintrc.json
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.prettierrc 
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/.stylelintrc.json

echo "Adding Azure SWA config generator to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/config/azure-swa-config.js

echo "Adding documentation to git..."
git add /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/README_GUARDRAILS.md

echo "Files added to git staging area."
echo "You can now commit the changes with:"
echo "git commit -m \"Add CI/CD guardrails: schema, linters, canary, prompt templates, telemetry\""
echo "git push origin main"