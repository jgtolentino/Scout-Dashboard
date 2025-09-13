# Key Vault Secrets Backup & Migration Plan

## ✅ NO DATA LOSS - Here's Why:

### What Key Vaults Store:
- **API Keys** (text strings)
- **Connection strings** (text)
- **Passwords** (text)
- **Certificates** (can export)
- **NOT data files** - just configuration secrets

### Safe Migration Process:

#### Step 1: Export All Secrets (Before Deletion)
```bash
# Create secrets backup file
echo "# Azure Key Vault Secrets Backup $(date)" > keyvault_secrets_backup.sh
echo "# KEEP THIS FILE SECURE!" >> keyvault_secrets_backup.sh

# Export each vault's secrets
for vault in kv-projectscout-prod ai-agency-secrets kv-scout-tbwa-1750202017 adsbot-ces-validator-kv scout-analytics-vault kv-tbwa-juicer-insights2; do
    echo -e "\n# Vault: $vault" >> keyvault_secrets_backup.sh
    for secret in $(az keyvault secret list --vault-name $vault --query "[].name" -o tsv); do
        value=$(az keyvault secret show --vault-name $vault --name "$secret" --query "value" -o tsv)
        echo "export ${secret//-/_}='$value'" >> keyvault_secrets_backup.sh
    done
done

# Encrypt the backup
openssl enc -aes-256-cbc -salt -in keyvault_secrets_backup.sh -out keyvault_secrets_backup.enc
```

#### Step 2: Store in PostgreSQL
```sql
-- Create secure secrets table
CREATE TABLE app_secrets (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert secrets
INSERT INTO app_secrets (key, value, description) VALUES
('AZURE_OPENAI_ENDPOINT', 'https://...', 'OpenAI API endpoint'),
('DATABASE_URL', 'postgresql://...', 'Main database connection'),
('CLAUDE_API_KEY', 'sk-...', 'Claude API key'),
-- etc...

-- Secure with row-level security
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
```

#### Step 3: Application Access
```python
# Python example
import os
import psycopg2

def get_secret(key):
    # Try environment variable first
    if key in os.environ:
        return os.environ[key]
    
    # Fall back to database
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT value FROM app_secrets WHERE key = %s", (key,))
    result = cur.fetchone()
    return result[0] if result else None

# Usage
api_key = get_secret('OPENAI_API_KEY')
```

## 🔒 Data Safety Checklist:

✅ **Before deleting Key Vaults:**
1. Export ALL secrets to encrypted file
2. Import into PostgreSQL secrets table
3. Test application with new secret source
4. Keep encrypted backup file

✅ **No data loss because:**
- Secrets are just text configurations
- All exported before deletion
- Stored in PostgreSQL (encrypted at rest)
- Backup file as safety net

## ⚠️ Important Notes:

### Security Considerations:
- PostgreSQL encrypts data at rest ✓
- Use SSL/TLS connections ✓
- Implement row-level security ✓
- Rotate secrets regularly

### What Changes:
- **Before**: `az keyvault secret show`
- **After**: `SELECT value FROM app_secrets`

### What Stays Same:
- All secret values preserved
- Same security (encrypted storage)
- Programmatic access

## 💡 Migration Commands:

```bash
# 1. Backup all secrets
./backup-keyvault-secrets.sh

# 2. Create PostgreSQL table
psql -h your-postgres.postgres.database.azure.com -U admin -d yourdb -f create_secrets_table.sql

# 3. Import secrets to PostgreSQL
./import-secrets-to-postgres.sh

# 4. Verify all secrets migrated
./verify-secrets-migration.sh

# 5. Delete Key Vaults (after verification)
az keyvault delete --name kv-projectscout-prod
# ... repeat for all 6 vaults
```

## 🎯 Result:
- **$33/month** (PostgreSQL only)
- **Zero data loss**
- **All secrets preserved**
- **Simpler architecture**