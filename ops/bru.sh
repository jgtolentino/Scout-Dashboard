#!/bin/bash
# Bruno wrapper script - reads secrets from Keychain and runs tests
# Usage: ./ops/bru.sh [test-name]

set -euo pipefail

# Load secrets using the export system
source "$(dirname "$0")/secrets_export.sh" remote

echo "🔑 Loaded secrets from Keychain"
echo "📍 SUPABASE_URL: $SUPABASE_URL"

cd "$(dirname "$0")/../bruno/scout-analytics"

if [ $# -eq 0 ]; then
    echo "🧪 Running all tests..."
    bru run health-check.bru --env-file environments/production.bru \
      --env-var SUPABASE_URL="$SUPABASE_URL" \
      --env-var SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
      
    bru run install-platinum-rpc.bru --env-file environments/production.bru \
      --env-var SUPABASE_URL="$SUPABASE_URL" \
      --env-var SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
else
    echo "🧪 Running specific test: $1"
    bru run "$1" --env-file environments/production.bru \
      --env-var SUPABASE_URL="$SUPABASE_URL" \
      --env-var SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
fi

echo "✅ Bruno tests completed"