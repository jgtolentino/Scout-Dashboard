# Diff-Aware Deployment Guide for Client360 Dashboard v2.3.3

This guide explains the optimized deployment approach for Client360 Dashboard that only deploys files that have changed since the last deployment. This approach has been enhanced in v2.3.3 to support Azure OpenAI integration and improved version tracking.

## 🚀 Benefits of Diff-Aware Deployment

1. **Faster Deployments** - Only changed files are uploaded, significantly reducing deployment time
2. **Reduced Network Usage** - Minimizes bandwidth consumption with selective file transfers
3. **Lower Risk** - Smaller, targeted deployments reduce the risk of unintended changes
4. **Better Traceability** - Each deployment is precisely documented with actual changes
5. **More Frequent Updates** - Enables component-level updates without full redeployments
6. **Version Control Integration** - Seamlessly compares changes between git tags or commits

## 📦 Key Components in v2.3.3

### 1. `patch-deploy-diff-aware.sh`

This enhanced script is the primary deployment tool that:
- Uses `git diff` to detect changes between version tags
- Groups changes by component (AI Insights, Store Map, etc.)
- Creates a package of only changed files
- Deploys selectively using either:
  - Azure Storage direct file upload (preferred)
  - Azure Static Web App API (fallback)
- Creates detailed deployment records
- **NEW in v2.3.3**: Handles Azure OpenAI configuration updates

**Usage:**
```bash
# Deploy changes from v2.3.2 to v2.3.3
./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3

# Force full deployment regardless of detected changes
./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3 --force

# Dry run without actual deployment
./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3 --dry-run
```

### 2. `file-integrity-check.sh`

This script implements file integrity tracking via:
- SHA256 hashes of all files
- ETag values from Azure Storage
- Size and modification time metadata

**NEW in v2.3.3**: Enhanced to support validation of Azure OpenAI responses and detect potential Data Source toggle changes.

**Usage:**
```bash
# Basic integrity check with ETags
./file-integrity-check.sh

# Check v2.3.3 files
./file-integrity-check.sh --source-dir ./deploy_v2.3.3

# Generate verification report
./file-integrity-check.sh --format html --output verification_report.html
```

### 3. `verify_v2.3.3_deployment.sh`

New comprehensive verification script that:
- Checks all required files for v2.3.3
- Validates version references in key files
- Generates file checksums
- Creates a detailed verification report
- **NEW**: Azure OpenAI connectivity testing

```bash
# Full verification
./verify_v2.3.3_deployment.sh

# File integrity check only
./verify_v2.3.3_deployment.sh --integrity-only

# Generate HTML report
./verify_v2.3.3_deployment.sh --output-format html
```

## ⚙️ Deployment Workflow for v2.3.3

### Pre-Deployment Preparation

1. **Create and verify the v2.3.3 package**:
   ```bash
   # Compare files between versions
   git diff --name-status v2.3.2 v2.3.3

   # Initialize integrity tracking for v2.3.3
   ./file-integrity-check.sh --source-dir ./deploy_v2.3.3
   ```

2. **Configure Azure OpenAI resources** (see AI_INSIGHTS_DEPLOYMENT_GUIDE.md)

### Deployment Process

1. **Execute diff-aware deployment**:
   ```bash
   ./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3
   ```

2. **Update Azure App Configuration**:
   ```bash
   # The script will automatically update these settings
   az staticwebapp appsettings set \
     --name tbwa-client360-dashboard-production \
     --resource-group tbwa-client360-dashboard \
     --setting-names \
     AZURE_OPENAI_ENDPOINT="https://tbwa-client360-openai.openai.azure.com" \
     AZURE_OPENAI_DEPLOYMENT_NAME="client360-insights" \
     AZURE_OPENAI_API_VERSION="2023-05-15" \
     ENABLE_SIMULATION_MODE="false"
   ```

3. **Verify deployment**:
   ```bash
   ./verify_v2.3.3_deployment.sh
   ```

### Component-Specific Deployment

**v2.3.3 introduces modular components** that can be deployed individually:

1. **AI Insights Components:**
   ```bash
   COMPONENT="ai-insights" ./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3
   ```

2. **Enhanced Map Component:**
   ```bash
   COMPONENT="store-map" ./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3
   ```

3. **Core Dashboard:**
   ```bash
   COMPONENT="dashboard-core" ./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3
   ```

## 🔍 v2.3.3 Change Detection Enhancements

The diff-aware system in v2.3.3 includes these improvements:

1. **Component-Based Diffing** - Changes are tracked at the component level
2. **Dependency Awareness** - Understands component dependencies to avoid broken deployments
3. **Configuration Tracking** - Monitors Azure App Configuration to ensure correct settings
4. **Version Tag Control** - Strict version tag comparison with semantic versioning

## 🔄 Automatic Rollback

v2.3.3 introduces automated rollback capabilities:

```bash
# Rollback to v2.3.2 if issues are detected
./rollback.sh --to-version v2.3.2
```

The rollback process will:
1. Restore the previous version's files
2. Reset Azure App Configuration settings
3. Generate a rollback report
4. Update version references

## 📊 Enhanced Deployment Records

v2.3.3 generates more comprehensive deployment records:

1. **Verification Report** - `deploy_v2.3.3/verification_report.html`
2. **Changed Files List** - `reports/changed_files_v2.3.2_to_v2.3.3_TIMESTAMP.json`
3. **Deployment Log** - `logs/deployment_v2.3.3_TIMESTAMP.log`
4. **Checksums** - `output/checksums_v2.3.3_TIMESTAMP.md5`
5. **Diff Report** - `output/diff_v2.3.2_to_v2.3.3_TIMESTAMP.txt`

## 🎯 Best Practices for v2.3.3

1. **Always Use Version Tags** - Maintain clear semantic version tags for each release
2. **Test in Staging First** - Deploy to staging environment before production
3. **Verify All Azure Settings** - Confirm OpenAI configuration with each deployment
4. **Document Component Changes** - Keep clear records of what changed in each component
5. **Run Full Verification** - Always run the verification script after deployment
6. **Keep Backups** - Maintain copies of previous version directories

## 🧪 Troubleshooting v2.3.3 Deployments

### Azure OpenAI Issues

If the AI Insights panel shows errors:

1. Check Azure OpenAI connectivity:
   ```bash
   # Test connectivity
   curl -X POST "https://your-resource.openai.azure.com/openai/deployments/client360-insights/completions?api-version=2023-05-15" \
     -H "Content-Type: application/json" \
     -H "api-key: YOUR_API_KEY" \
     -d '{"prompt": "Test prompt", "max_tokens": 5}'
   ```

2. Verify Azure App Settings:
   ```bash
   az staticwebapp appsettings list \
     --name tbwa-client360-dashboard-production \
     --resource-group tbwa-client360-dashboard \
     --query "[?name.startsWith('AZURE_OPENAI')]"
   ```

### Deployment Failures

If the deployment fails:

1. Check for file conflicts:
   ```bash
   git diff --name-status v2.3.2 v2.3.3
   ```

2. Run with debugging:
   ```bash
   ./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3 --verbose
   ```

3. Try a full deployment as fallback:
   ```bash
   ./deploy_v2.3.3_to_azure.sh --full
   ```

## 🔒 Security Enhancements in v2.3.3

1. **API Key Protection** - Azure OpenAI API keys stored in Key Vault
2. **Enhanced Integrity Verification** - More comprehensive file integrity checks
3. **Access Logging** - Added logging for data source toggle changes
4. **Defense in Depth** - Fallback mechanisms for data source failures

## 📚 Additional Resources

- [Azure OpenAI Integration Guide](./AI_INSIGHTS_DEPLOYMENT_GUIDE.md)
- [Client360 v2.3.3 Release Notes](./RELEASE_2.3.3.md)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Git Diff Documentation](https://git-scm.com/docs/git-diff)