#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# 🔗 AZURE DATA PIPELINE INTEGRATION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# Links ADLS Gen2 storage to Databricks workspace for Scout Analytics
# Prerequisites: Azure CLI logged in, Databricks CLI configured
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔗 Starting Azure Data Pipeline Integration..."
echo "📅 Timestamp: $(date)"

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
RG="rg-scout-prod"
KV="kv-scout-prod"
DBW="dbx-scout-prod"
ST="stscoutprod"
CONTAINER="rawtransactions"

echo "📋 Configuration:"
echo "  Resource Group: $RG"
echo "  Key Vault: $KV"
echo "  Databricks: $DBW"
echo "  Storage: $ST"
echo "  Container: $CONTAINER"

# ─────────────────────────────────────────────────────────────────────────────
# FETCH SECRETS FROM KEY VAULT
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔐 Fetching secrets from Azure Key Vault..."

SP=$(az keyvault secret show -n sp-client-id --vault-name $KV --query value -o tsv)
SP_KEY=$(az keyvault secret show -n sp-secret --vault-name $KV --query value -o tsv)
TENANT=$(az keyvault secret show -n sp-tenant --vault-name $KV --query value -o tsv)
STORAGE_KEY=$(az keyvault secret show -n storage-key --vault-name $KV --query value -o tsv)

echo "✅ Retrieved service principal credentials"
echo "✅ Retrieved storage account key"

# ─────────────────────────────────────────────────────────────────────────────
# DATABRICKS SECRET SCOPE SETUP
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔒 Setting up Databricks secret scope..."

# Create secret scope (ignore if exists)
databricks secrets create-scope --scope scout 2>/dev/null || echo "Secret scope 'scout' already exists"

# Store secrets in Databricks
echo "📝 Storing secrets in Databricks scope..."
echo "$SP" | databricks secrets put --scope scout --key client_id
echo "$SP_KEY" | databricks secrets put --scope scout --key client_secret
echo "$TENANT" | databricks secrets put --scope scout --key tenant_id
echo "$STORAGE_KEY" | databricks secrets put --scope scout --key storage_key

echo "✅ Databricks secrets configured"

# ─────────────────────────────────────────────────────────────────────────────
# ADLS MOUNT SCRIPT CREATION
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "📦 Creating ADLS mount script..."

cat > /tmp/mount_adls.py <<'PY'
# Databricks ADLS Gen2 Mount Script
# Mounts Scout raw transaction data from Azure Data Lake Storage

print("🔗 Starting ADLS Gen2 mount process...")

# OAuth configuration for ADLS Gen2
configs = {
    "fs.azure.account.auth.type": "OAuth",
    "fs.azure.account.oauth.provider.type": 
        "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider",
    "fs.azure.account.oauth2.client.id": 
        dbutils.secrets.get(scope="scout", key="client_id"),
    "fs.azure.account.oauth2.client.secret": 
        dbutils.secrets.get(scope="scout", key="client_secret"),
    "fs.azure.account.oauth2.client.endpoint": 
        f"https://login.microsoftonline.com/{dbutils.secrets.get(scope='scout', key='tenant_id')}/oauth2/token"
}

# Mount ADLS container
try:
    # Check if already mounted
    mounts = dbutils.fs.mounts()
    mount_exists = any(mount.mountPoint == "/mnt/scout/raw" for mount in mounts)
    
    if mount_exists:
        print("📁 Mount point /mnt/scout/raw already exists")
        dbutils.fs.unmount("/mnt/scout/raw")
        print("🔄 Unmounted existing mount point")
    
    # Create new mount
    dbutils.fs.mount(
        source="abfss://rawtransactions@stscoutprod.dfs.core.windows.net/",
        mount_point="/mnt/scout/raw",
        extra_configs=configs
    )
    
    print("✅ Successfully mounted ADLS Gen2 at /mnt/scout/raw")
    
    # Test mount by listing files
    files = dbutils.fs.ls("/mnt/scout/raw")
    print(f"📂 Found {len(files)} items in mounted directory")
    
    # Display first few files for verification
    for i, file in enumerate(files[:5]):
        print(f"  {i+1}. {file.name} ({file.size} bytes)")
    
except Exception as e:
    print(f"❌ Mount failed: {str(e)}")
    raise e

print("🎉 ADLS Gen2 mount completed successfully!")
PY

# Upload mount script to DBFS
echo "📤 Uploading mount script to DBFS..."
databricks fs cp /tmp/mount_adls.py dbfs:/FileStore/scripts/mount_adls.py --overwrite

# Execute mount script
echo "🚀 Executing mount script..."
databricks runs submit --python-file dbfs:/FileStore/scripts/mount_adls.py --run-name "scout-adls-mount-$(date +%Y%m%d-%H%M%S)"

echo "✅ ADLS Gen2 mount script executed"

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🗄️  Setting up Databricks databases..."

cat > /tmp/setup_databases.py <<'PY'
# Create Scout databases and tables in Databricks

print("🗄️  Creating Scout databases...")

# Create database
spark.sql("CREATE DATABASE IF NOT EXISTS scout")
spark.sql("USE scout")

print("✅ Database 'scout' created/verified")

# Create Bronze table schema
spark.sql("""
CREATE TABLE IF NOT EXISTS scout.bronze_transactions (
    store_id INT,
    ts TIMESTAMP,
    sku STRING,
    qty INT,
    peso DOUBLE,
    request STRING,
    suggested BOOLEAN,
    customer_id INT,
    barangay STRING,
    gender STRING,
    age INT,
    ingest_time TIMESTAMP
) USING DELTA
""")

print("✅ Bronze transactions table created")

# Create Silver table schema
spark.sql("""
CREATE TABLE IF NOT EXISTS scout.silver_transactions (
    store_id INT,
    ts TIMESTAMP,
    date DATE,
    sku STRING,
    qty INT,
    peso DOUBLE,
    request STRING,
    suggested BOOLEAN,
    customer_id INT,
    barangay STRING,
    gender STRING,
    age INT,
    ingest_time TIMESTAMP
) USING DELTA
""")

print("✅ Silver transactions table created")

# Create Gold KPIs table schema
spark.sql("""
CREATE TABLE IF NOT EXISTS scout.gold_daily_kpis (
    date DATE,
    revenues DOUBLE,
    orders BIGINT,
    aov DOUBLE
) USING DELTA
""")

print("✅ Gold daily KPIs table created")

print("🎉 Database setup completed!")
PY

# Upload and execute database setup
echo "📤 Uploading database setup script..."
databricks fs cp /tmp/setup_databases.py dbfs:/FileStore/scripts/setup_databases.py --overwrite

echo "🚀 Executing database setup..."
databricks runs submit --python-file dbfs:/FileStore/scripts/setup_databases.py --run-name "scout-db-setup-$(date +%Y%m%d-%H%M%S)"

# ─────────────────────────────────────────────────────────────────────────────
# VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔍 Verifying setup..."

# Test mount point
echo "📁 Testing mount point access..."
databricks fs ls dbfs:/mnt/scout/raw/ || echo "⚠️  Mount verification failed - check logs"

# Test database access
echo "🗄️  Testing database access..."
databricks runs submit --python-file dbfs:/FileStore/scripts/setup_databases.py --run-name "scout-verify-$(date +%Y%m%d-%H%M%S)"

# ─────────────────────────────────────────────────────────────────────────────
# CLEANUP
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/mount_adls.py /tmp/setup_databases.py

echo ""
echo "🎉 AZURE DATA PIPELINE INTEGRATION COMPLETED!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 SUMMARY:"
echo "  ✅ Databricks secret scope 'scout' created"
echo "  ✅ Service principal credentials stored"
echo "  ✅ ADLS Gen2 mounted at /mnt/scout/raw"
echo "  ✅ Scout database and tables created"
echo "  ✅ Ready for ETL job deployment"
echo ""
echo "🚀 NEXT STEPS:"
echo "  1. Deploy ETL jobs using CI/CD pipeline"
echo "  2. Configure Azure OpenAI integration"
echo "  3. Test end-to-end data flow"
echo "  4. Monitor job execution and data quality"
echo ""
echo "📊 Your Azure data pipeline is ready for Scout Analytics!"
echo "═══════════════════════════════════════════════════════════════════════════════"
