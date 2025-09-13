#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Guardrail #1 – only one SWA workflow"
cnt=$(find .github/workflows -name "*.yml" -exec grep -l "static-web-apps-deploy@" {} \; 2>/dev/null | wc -l)
[[ "$cnt" -le 1 ]] || { echo "❌ Found $cnt SWA workflows; expected ≤1" ; exit 1; }

echo "🔍 Guardrail #2 – every api/* folder has function.json"
missing=$(find api -maxdepth 2 -type d -path "api/*" ! -path "api/node_modules*" 2>/dev/null | \
          while read -r d; do [[ -f "$d/function.json" ]] || echo "$d" ; done)
[[ -z "$missing" ]] || { echo "❌ Missing function.json in:"; echo "$missing"; exit 1; }

echo "🔍 Guardrail #3 – secrets leakage scan"
leaks=$(git ls-files -z | xargs -0 grep -Ei --line-number "(AZURE_OPENAI_KEY|PASSWORD|SECRET|TOKEN)=" 2>/dev/null || true)
[[ -z "$leaks" ]] || { echo "❌ Potential secrets committed:"; echo "$leaks"; exit 1; }

echo "✅ Guardrails passed"