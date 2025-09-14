#!/bin/bash
# Scout Analytics - Secrets Population
# Populates macOS Keychain with Scout secrets (idempotent)
# Usage: ./ops/secrets_put.sh

set -euo pipefail

echo "🔐 Setting up Scout Analytics secrets in Keychain..."

# Helper function to add/update keychain entries
add_secret() {
    local key="$1"
    local value="$2"
    
    if [[ -z "$value" ]]; then
        echo "⚠️  Skipping $key (empty value)"
        return 0
    fi
    
    # Add or update (using -U flag for update)
    if security add-generic-password -a "$USER" -s "$key" -w "$value" -U 2>/dev/null; then
        echo "✅ SET: $key"
    else
        echo "❌ FAILED: $key"
        return 1
    fi
}

echo "📊 Adding Supabase remote secrets..."
add_secret "SCOUT__REMOTE__SUPABASE_URL" "https://cxzllzyxwpyptfretryc.supabase.co"
add_secret "SCOUT__REMOTE__SUPABASE_SERVICE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIwNjMzNCwiZXhwIjoyMDcwNzgyMzM0fQ.vB9MIfInzX-ch4Kzb-d0_0ndNm-id1MVgQZuDBmtrdw"
add_secret "SCOUT__REMOTE__SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDYzMzQsImV4cCI6MjA3MDc4MjMzNH0.adA0EO89jw5uPH4qdL_aox6EbDPvJ28NcXGYW7u33Ok"
add_secret "SCOUT__REMOTE__PG_URL_POOLER" "postgresql://postgres:Postgres_26@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
add_secret "SCOUT__REMOTE__PG_URL_DIRECT" "postgresql://postgres:Postgres_26@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
add_secret "SCOUT__REMOTE__PG_PASSWORD" "Postgres_26"

echo "🏠 Adding local development secrets..."
add_secret "SCOUT__LOCAL__SUPABASE_URL" "http://127.0.0.1:54321"
add_secret "SCOUT__LOCAL__PG_URL" "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "📁 Adding Google Drive service account..."
add_secret "SCOUT__GDRIVE__SERVICE_ACCOUNT_JSON" '{
  "type": "service_account",
  "project_id": "scout-analytics-ph",
  "private_key_id": "a1b2c3d4e5f6789",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMockup2w...\n-----END PRIVATE KEY-----\n",
  "client_email": "scout-etl@scout-analytics-ph.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/scout-etl%40scout-analytics-ph.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'

echo "🔵 Adding Azure SQL secrets..."
add_secret "SCOUT__AZURE_SQL__SERVER" "sqltbwaprojectscoutserver.database.windows.net"
add_secret "SCOUT__AZURE_SQL__DB" "SQL-TBWA-ProjectScout-Reporting-Prod"
add_secret "SCOUT__AZURE_SQL__USER" "TBWA"
add_secret "SCOUT__AZURE_SQL__PASSWORD" "R@nd0mPA\$\$2025!"
add_secret "SCOUT__AZURE_SQL__ODBC_DRIVER" "ODBC Driver 18 for SQL Server"

echo "☁️ Adding AWS secrets (optional)..."
add_secret "SCOUT__AWS__ACCESS_KEY_ID" "${AWS_ACCESS_KEY_ID:-}"
add_secret "SCOUT__AWS__SECRET_ACCESS_KEY" "${AWS_SECRET_ACCESS_KEY:-}"
add_secret "SCOUT__AWS__REGION" "${AWS_REGION:-ap-southeast-1}"

echo "🗂️ Adding data lake URIs..."
add_secret "SCOUT__LAKE__BRONZE_URI" "s3://scout-analytics-bronze/"
add_secret "SCOUT__LAKE__SILVER_URI" "s3://scout-analytics-silver/"
add_secret "SCOUT__LAKE__GOLD_URI" "s3://scout-analytics-gold/"
add_secret "SCOUT__LAKE__PLATINUM_URI" "s3://scout-analytics-platinum/"

echo "🤖 Adding AI provider secrets (optional)..."
add_secret "SCOUT__AI__OPENAI_API_KEY" "${OPENAI_API_KEY:-}"
add_secret "SCOUT__AI__ANTHROPIC_API_KEY" "${ANTHROPIC_API_KEY:-}"
add_secret "SCOUT__AI__DEEPSEEK_API_KEY" "${DEEPSEEK_API_KEY:-}"

echo ""
echo "🎯 Scout Analytics secrets setup complete!"
echo "💡 Use './ops/secrets_inventory.sh' to view (redacted) or './ops/secrets_validate.sh poc' to verify"