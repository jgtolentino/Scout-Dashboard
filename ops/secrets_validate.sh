#!/bin/bash
# Scout Analytics - Secrets Validator
# Validates that required secrets are present for specific contexts
# Usage: ./ops/secrets_validate.sh [context]

set -euo pipefail

CONTEXT="${1:-poc}"

echo "🔍 Validating Scout secrets for context: $CONTEXT"

validate_core() {
    local missing=0
    local required=(
        SCOUT__REMOTE__SUPABASE_URL
        SCOUT__REMOTE__SUPABASE_SERVICE_KEY
        SCOUT__REMOTE__PG_URL_POOLER
        SCOUT__REMOTE__PG_URL_DIRECT
    )
    
    echo "📊 Checking core Supabase secrets..."
    for key in "${required[@]}"; do
        if ! security find-generic-password -a "$USER" -s "$key" >/dev/null 2>&1; then
            echo "❌ MISSING: $key"
            missing=1
        else
            echo "✅ PRESENT: $key"
        fi
    done
    
    return $missing
}

validate_dev() {
    local missing=0
    local required=(
        SCOUT__LOCAL__SUPABASE_URL
        SCOUT__LOCAL__PG_URL
    )
    
    echo "🏠 Checking local dev secrets..."
    for key in "${required[@]}"; do
        if ! security find-generic-password -a "$USER" -s "$key" >/dev/null 2>&1; then
            echo "❌ MISSING: $key"
            missing=1
        else
            echo "✅ PRESENT: $key"
        fi
    done
    
    return $missing
}

validate_production() {
    local missing=0
    
    # Core secrets
    validate_core || missing=1
    
    # AI secrets (optional but recommended)
    echo "🤖 Checking AI provider secrets..."
    local ai_keys=(
        SCOUT__AI__OPENAI_API_KEY
        SCOUT__AI__ANTHROPIC_API_KEY
    )
    
    local ai_present=0
    for key in "${ai_keys[@]}"; do
        if security find-generic-password -a "$USER" -s "$key" >/dev/null 2>&1; then
            echo "✅ PRESENT: $key"
            ai_present=1
        else
            echo "⚠️  OPTIONAL: $key"
        fi
    done
    
    if [[ $ai_present -eq 0 ]]; then
        echo "⚠️  No AI provider keys found - RAG features will be limited"
    fi
    
    return $missing
}

validate_data_pipeline() {
    local missing=0
    
    # Core secrets
    validate_core || missing=1
    
    # Azure SQL
    echo "🔵 Checking Azure SQL secrets..."
    local azure_keys=(
        SCOUT__AZURE_SQL__SERVER
        SCOUT__AZURE_SQL__DB
        SCOUT__AZURE_SQL__USER
        SCOUT__AZURE_SQL__PASSWORD
    )
    
    for key in "${azure_keys[@]}"; do
        if ! security find-generic-password -a "$USER" -s "$key" >/dev/null 2>&1; then
            echo "❌ MISSING: $key"
            missing=1
        else
            echo "✅ PRESENT: $key"
        fi
    done
    
    # Google Drive
    echo "📁 Checking Google Drive secrets..."
    if ! security find-generic-password -a "$USER" -s SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON >/dev/null 2>&1; then
        echo "❌ MISSING: SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON"
        missing=1
    else
        echo "✅ PRESENT: SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON"
    fi
    
    return $missing
}

case "$CONTEXT" in
    poc|core)
        if validate_core; then
            echo "🎉 All core secrets present! Ready for POC"
            exit 0
        else
            echo "💥 Missing core secrets. Run ./ops/secrets_put.sh"
            exit 1
        fi
        ;;
        
    dev|local)
        missing=0
        validate_core || missing=1
        validate_dev || missing=1
        
        if [[ $missing -eq 0 ]]; then
            echo "🎉 All dev secrets present! Ready for local development"
            exit 0
        else
            echo "💥 Missing dev secrets. Run ./ops/secrets_put.sh"
            exit 1
        fi
        ;;
        
    prod|production)
        if validate_production; then
            echo "🎉 All production secrets validated! Ready for deployment"
            exit 0
        else
            echo "💥 Missing production secrets. Run ./ops/secrets_put.sh"
            exit 1
        fi
        ;;
        
    data|pipeline)
        if validate_data_pipeline; then
            echo "🎉 All data pipeline secrets present! Ready for ETL operations"
            exit 0
        else
            echo "💥 Missing data pipeline secrets. Run ./ops/secrets_put.sh"
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Unknown context: $CONTEXT"
        echo "Valid contexts: poc, dev, prod, data"
        echo ""
        echo "Examples:"
        echo "  ./ops/secrets_validate.sh poc     # Core Supabase secrets"
        echo "  ./ops/secrets_validate.sh dev     # Local development"
        echo "  ./ops/secrets_validate.sh prod    # Production deployment"
        echo "  ./ops/secrets_validate.sh data    # Data pipeline (Azure + GDrive)"
        exit 1
        ;;
esac