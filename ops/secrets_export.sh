#!/bin/bash
# Scout Analytics - Secrets Export
# Exports secrets from Keychain to environment variables
# Usage: source ./ops/secrets_export.sh [context]
# Context: remote (default), local, aws, azure, gdrive, all

set -euo pipefail

CONTEXT="${1:-remote}"

echo "🔐 Exporting Scout secrets for context: $CONTEXT"

export_remote() {
    echo "📊 Exporting Supabase remote secrets..."
    export SUPABASE_URL="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_URL -w)"
    export SUPABASE_SERVICE_KEY="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_SERVICE_KEY -w)"
    export SUPABASE_ANON_KEY="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__SUPABASE_ANON_KEY -w)"
    export SUPABASE_PG_URL_POOLER="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_URL_POOLER -w)"
    export SUPABASE_PG_URL_DIRECT="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_URL_DIRECT -w)"
    export SUPABASE_PG_URL_REMOTE="$SUPABASE_PG_URL_POOLER"  # Alias for compatibility
    export SUPABASE_DB_PASSWORD="$(security find-generic-password -a "$USER" -s SCOUT__REMOTE__PG_PASSWORD -w)"
    echo "✅ Remote Supabase secrets loaded"
}

export_local() {
    echo "🏠 Exporting local dev secrets..."
    export SUPABASE_URL_LOCAL="$(security find-generic-password -a "$USER" -s SCOUT__LOCAL__SUPABASE_URL -w)"
    export SUPABASE_PG_URL_LOCAL="$(security find-generic-password -a "$USER" -s SCOUT__LOCAL__PG_URL -w)"
    echo "✅ Local dev secrets loaded"
}

export_aws() {
    echo "☁️ Exporting AWS secrets..."
    export AWS_REGION="$(security find-generic-password -a "$USER" -s SCOUT__AWS__REGION -w)"
    if security find-generic-password -a "$USER" -s SCOUT__AWS__ACCESS_KEY_ID -w >/dev/null 2>&1; then
        export AWS_ACCESS_KEY_ID="$(security find-generic-password -a "$USER" -s SCOUT__AWS__ACCESS_KEY_ID -w)"
        export AWS_SECRET_ACCESS_KEY="$(security find-generic-password -a "$USER" -s SCOUT__AWS__SECRET_ACCESS_KEY -w)"
    else
        echo "⚠️  AWS credentials not set in Keychain"
    fi
    export SCOUT_BRONZE_URI="$(security find-generic-password -a "$USER" -s SCOUT__LAKE__BRONZE_URI -w)"
    export SCOUT_SILVER_URI="$(security find-generic-password -a "$USER" -s SCOUT__LAKE__SILVER_URI -w)"
    export SCOUT_GOLD_URI="$(security find-generic-password -a "$USER" -s SCOUT__LAKE__GOLD_URI -w)"
    export SCOUT_PLATINUM_URI="$(security find-generic-password -a "$USER" -s SCOUT__LAKE__PLATINUM_URI -w)"
    echo "✅ AWS and lake secrets loaded"
}

export_azure() {
    echo "🔵 Exporting Azure SQL secrets..."
    export AZURE_SQL_SERVER="$(security find-generic-password -a "$USER" -s SCOUT__AZURE_SQL__SERVER -w)"
    export AZURE_SQL_DB="$(security find-generic-password -a "$USER" -s SCOUT__AZURE_SQL__DB -w)"
    export AZURE_SQL_USER="$(security find-generic-password -a "$USER" -s SCOUT__AZURE_SQL__USER -w)"
    export AZURE_SQL_PASSWORD="$(security find-generic-password -a "$USER" -s SCOUT__AZURE_SQL__PASSWORD -w)"
    export AZURE_SQL_ODBC_DRIVER="$(security find-generic-password -a "$USER" -s SCOUT__AZURE_SQL__ODBC_DRIVER -w)"
    
    # Construct connection string
    export SQL_CONN_STR="Driver=${AZURE_SQL_ODBC_DRIVER};Server=${AZURE_SQL_SERVER};Database=${AZURE_SQL_DB};Uid=${AZURE_SQL_USER};Pwd=${AZURE_SQL_PASSWORD};"
    echo "✅ Azure SQL secrets loaded"
}

export_gdrive() {
    echo "📁 Exporting Google Drive secrets..."
    export GDRIVE_SERVICE_ACCOUNT_JSON="$(security find-generic-password -a "$USER" -s SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON -w)"
    echo "✅ Google Drive secrets loaded"
}

export_ai() {
    echo "🤖 Exporting AI provider secrets..."
    if security find-generic-password -a "$USER" -s SCOUT__AI__OPENAI_API_KEY -w >/dev/null 2>&1; then
        export OPENAI_API_KEY="$(security find-generic-password -a "$USER" -s SCOUT__AI__OPENAI_API_KEY -w)"
        echo "✅ OpenAI key loaded"
    else
        echo "⚠️  OpenAI API key not set"
    fi
    
    if security find-generic-password -a "$USER" -s SCOUT__AI__ANTHROPIC_API_KEY -w >/dev/null 2>&1; then
        export ANTHROPIC_API_KEY="$(security find-generic-password -a "$USER" -s SCOUT__AI__ANTHROPIC_API_KEY -w)"
        echo "✅ Anthropic key loaded"
    else
        echo "⚠️  Anthropic API key not set"
    fi
}

case "$CONTEXT" in
    remote)
        export_remote
        ;;
    local)
        export_local
        ;;
    aws)
        export_aws
        ;;
    azure)
        export_azure
        ;;
    gdrive)
        export_gdrive
        ;;
    ai)
        export_ai
        ;;
    all)
        export_remote
        export_local
        export_aws
        export_azure
        export_gdrive
        export_ai
        ;;
    *)
        echo "❌ Unknown context: $CONTEXT"
        echo "Valid contexts: remote, local, aws, azure, gdrive, ai, all"
        exit 1
        ;;
esac

echo "🎯 Context '$CONTEXT' exported successfully!"
echo "💡 Use 'env | grep -E \"(SUPABASE|AWS|AZURE|GDRIVE)\"' to verify"