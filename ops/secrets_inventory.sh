#!/bin/bash
# Scout Analytics - Secrets Inventory
# Shows which secrets are available in Keychain (redacted values)
# Usage: ./ops/secrets_inventory.sh [format]
# Format: table (default), json

set -eo pipefail

FORMAT="${1:-table}"

# List of all expected secrets with descriptions
SECRETS=(
    "SCOUT__REMOTE__SUPABASE_URL:Supabase remote URL"
    "SCOUT__REMOTE__SUPABASE_SERVICE_KEY:Service role key (server-side)"
    "SCOUT__REMOTE__SUPABASE_ANON_KEY:Anonymous key (client-side)"
    "SCOUT__REMOTE__PG_URL_POOLER:Postgres pooler URL (6543)"
    "SCOUT__REMOTE__PG_URL_DIRECT:Postgres direct URL (5432)"
    "SCOUT__REMOTE__PG_PASSWORD:Postgres password"
    "SCOUT__LOCAL__SUPABASE_URL:Local Supabase URL"
    "SCOUT__LOCAL__PG_URL:Local Postgres URL"
    "SCOUT__AI__OPENAI_API_KEY:OpenAI API key"
    "SCOUT__AI__ANTHROPIC_API_KEY:Anthropic API key"
    "SCOUT__AI__DEEPSEEK_API_KEY:DeepSeek API key"
    "SCOUT__AWS__ACCESS_KEY_ID:AWS access key ID"
    "SCOUT__AWS__SECRET_ACCESS_KEY:AWS secret access key"
    "SCOUT__AWS__REGION:AWS region"
    "SCOUT__LAKE__BRONZE_URI:Bronze layer URI"
    "SCOUT__LAKE__SILVER_URI:Silver layer URI"
    "SCOUT__LAKE__GOLD_URI:Gold layer URI"
    "SCOUT__LAKE__PLATINUM_URI:Platinum layer URI"
    "SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON:Google Drive service account"
    "SCOUT__AZURE_SQL__SERVER:Azure SQL server"
    "SCOUT__AZURE_SQL__DB:Azure SQL database"
    "SCOUT__AZURE_SQL__USER:Azure SQL user"
    "SCOUT__AZURE_SQL__PASSWORD:Azure SQL password"
    "SCOUT__AZURE_SQL__ODBC_DRIVER:Azure SQL ODBC driver"
)

redact_value() {
    local value="$1"
    local length=${#value}
    
    if [[ $length -le 8 ]]; then
        echo "***"
    elif [[ $length -le 16 ]]; then
        echo "${value:0:3}...${value: -3}"
    elif [[ $length -le 32 ]]; then
        echo "${value:0:4}...${value: -4}"
    else
        echo "${value:0:6}...${value: -6}"
    fi
}

check_secret() {
    local key="$1"
    if security find-generic-password -a "$USER" -s "$key" -w >/dev/null 2>&1; then
        local value="$(security find-generic-password -a "$USER" -s "$key" -w)"
        local redacted="$(redact_value "$value")"
        echo "$redacted"
        return 0
    else
        echo "MISSING"
        return 1
    fi
}

case "$FORMAT" in
    table)
        echo "🔐 Scout Analytics - Secrets Inventory"
        echo "========================================"
        printf "%-35s %-30s %-15s\n" "KEY" "DESCRIPTION" "STATUS"
        echo "------------------------------------------------------------------------"
        
        for entry in "${SECRETS[@]}"; do
            key="${entry%%:*}"
            description="${entry#*:}"
            value=$(check_secret "$key")
            if [[ "$value" == "MISSING" ]]; then
                status="❌ MISSING"
            else
                status="✅ $value"
            fi
            printf "%-35s %-30s %-15s\n" "$key" "$description" "$status"
        done
        ;;
        
    json)
        echo "{"
        first=true
        for entry in "${SECRETS[@]}"; do
            key="${entry%%:*}"
            description="${entry#*:}"
            [[ $first == false ]] && echo ","
            value=$(check_secret "$key")
            if [[ "$value" == "MISSING" ]]; then
                printf '  "%s": {"status": "missing", "description": "%s"}' "$key" "$description"
            else
                printf '  "%s": {"status": "present", "value": "%s", "description": "%s"}' "$key" "$value" "$description"
            fi
            first=false
        done
        echo ""
        echo "}"
        ;;
        
    *)
        echo "❌ Unknown format: $FORMAT"
        echo "Valid formats: table, json"
        exit 1
        ;;
esac