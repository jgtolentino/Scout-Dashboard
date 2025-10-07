# Plan-Act Template Examples

Copy these templates and customize for your specific needs. All use variable substitution for security and flexibility.

## 🚀 Deployment Templates

### Azure Static Web App Deployment
```markdown
## PLAN:
- Build the dashboard
- Run tests
- Deploy to Azure Static Web Apps
- Verify deployment

## ACT:
cd {{REPO_ROOT}}/dashboard
npm install
npm run test
npm run build
az staticwebapp upload --app-name {{AZURE_APP_NAME}} --token {{AZURE_TOKEN}} --output-location ./dist
curl -s {{DASHBOARD_URL}} | grep -q "<!DOCTYPE html" && echo "✅ Deployment verified"
```

### Multi-Environment Deployment
```markdown
## PLAN:
- Deploy to staging
- Run smoke tests
- Deploy to production
- Update monitoring

## ACT:
# Staging deployment
pulser :deploy --env staging --target {{STAGING_URL}}
pulser :test --env staging --suite smoke

# Production deployment (if staging passes)
pulser :deploy --env production --target {{PRODUCTION_URL}}
pulser :notify --slack "Deployed v{{VERSION}} to production"

# Update monitoring
az monitor app-insights component update --app {{APP_INSIGHTS_NAME}} --resource-group {{RESOURCE_GROUP}}
```

## 🔧 Client Onboarding Templates

### New Client Setup
```markdown
## PLAN:
- Create client directory structure
- Initialize Azure resources
- Set up CI/CD pipeline
- Configure monitoring

## ACT:
# Create directory structure
mkdir -p {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/{dashboard,api,data,docs}
cp -r {{REPO_ROOT}}/templates/client-starter/* {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/

# Azure resources
az group create --name rg-{{CLIENT_NAME}}-{{ENVIRONMENT}} --location {{AZURE_REGION}}
az storage account create --name st{{CLIENT_NAME}}{{ENVIRONMENT}} --resource-group rg-{{CLIENT_NAME}}-{{ENVIRONMENT}}
az sql server create --name sql-{{CLIENT_NAME}}-{{ENVIRONMENT}} --resource-group rg-{{CLIENT_NAME}}-{{ENVIRONMENT}} --admin-user {{SQL_ADMIN}} --admin-password {{SQL_PASSWORD}}

# CI/CD setup
cp {{REPO_ROOT}}/templates/azure-pipelines.yml {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/.azure/
sed -i 's/CLIENT_NAME/{{CLIENT_NAME}}/g' {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/.azure/azure-pipelines.yml

# Commit changes
cd {{REPO_ROOT}}/clients/{{CLIENT_NAME}}
git init
git add .
git commit -m "Initial setup for {{CLIENT_NAME}}"
git remote add origin {{CLIENT_REPO_URL}}
```

### Client Dashboard Configuration
```markdown
## PLAN:
- Copy base dashboard template
- Apply client branding
- Configure data sources
- Deploy preview

## ACT:
# Copy and brand
cp -r {{REPO_ROOT}}/templates/dashboard-base {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/dashboard
pulser :snowwhite apply-branding --client {{CLIENT_NAME}} --colors "{{PRIMARY_COLOR}},{{SECONDARY_COLOR}}"

# Configure data sources
cat > {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/dashboard/config.json << EOF
{
  "client": "{{CLIENT_NAME}}",
  "api_endpoint": "{{API_URL}}",
  "sql_server": "{{SQL_SERVER}}",
  "database": "{{SQL_DATABASE}}",
  "features": {
    "realtime": {{ENABLE_REALTIME}},
    "ai_insights": {{ENABLE_AI}}
  }
}
EOF

# Deploy preview
cd {{REPO_ROOT}}/clients/{{CLIENT_NAME}}/dashboard
npm install
npm run build
pulser :deploy --preview --url {{PREVIEW_URL}}
```

## 🗄️ Database Management Templates

### Database Migration
```markdown
## PLAN:
- Backup current database
- Run migration scripts
- Verify data integrity
- Update indexes

## ACT:
# Backup
export SQLCMDPASSWORD={{SQL_PASSWORD}}
sqlcmd -S {{SQL_SERVER}} -U {{SQL_USER}} -Q "BACKUP DATABASE {{DB_NAME}} TO DISK='{{BACKUP_PATH}}/{{DB_NAME}}_{{TIMESTAMP}}.bak'"

# Run migrations
cd {{REPO_ROOT}}/migrations
for script in $(ls *.sql | sort); do
  echo "Running $script..."
  sqlcmd -S {{SQL_SERVER}} -U {{SQL_USER}} -d {{DB_NAME}} -i $script
done

# Verify
pulser :db verify --server {{SQL_SERVER}} --database {{DB_NAME}} --checksums
pulser :db index-stats --rebuild-if-fragmented
```

### Data Quality Checks
```markdown
## PLAN:
- Run data quality validations
- Generate quality report
- Alert on critical issues

## ACT:
# Run quality checks
pulser :tide validate --config {{REPO_ROOT}}/quality/rules.yaml --database {{DB_NAME}}

# Generate report
pulser :tide report --format html --output {{REPO_ROOT}}/reports/quality_{{TIMESTAMP}}.html

# Check for critical issues
CRITICAL_COUNT=$(pulser :tide count --severity critical)
if [ $CRITICAL_COUNT -gt 0 ]; then
  pulser :notify --urgent "Found $CRITICAL_COUNT critical data quality issues"
  pulser :slack send --channel {{ALERT_CHANNEL}} --file {{REPO_ROOT}}/reports/quality_{{TIMESTAMP}}.html
fi
```

## 🔐 Security Templates

### Secret Rotation
```markdown
## PLAN:
- Generate new secrets
- Update Azure Key Vault
- Update application configs
- Restart services

## ACT:
# Generate new secrets
NEW_API_KEY=$(openssl rand -hex 32)
NEW_DB_PASSWORD=$(openssl rand -base64 32)

# Update Key Vault
az keyvault secret set --vault-name {{KEY_VAULT_NAME}} --name api-key --value $NEW_API_KEY
az keyvault secret set --vault-name {{KEY_VAULT_NAME}} --name db-password --value $NEW_DB_PASSWORD

# Update SQL password
sqlcmd -S {{SQL_SERVER}} -U {{SQL_ADMIN}} -Q "ALTER LOGIN {{SQL_USER}} WITH PASSWORD = '$NEW_DB_PASSWORD'"

# Restart services
az webapp restart --name {{APP_NAME}} --resource-group {{RESOURCE_GROUP}}
az functionapp restart --name {{FUNCTION_APP_NAME}} --resource-group {{RESOURCE_GROUP}}
```

## 🧪 Testing Templates

### Comprehensive Test Suite
```markdown
## PLAN:
- Run unit tests
- Run integration tests
- Run E2E tests
- Generate coverage report

## ACT:
cd {{REPO_ROOT}}

# Unit tests
npm run test:unit -- --coverage

# Integration tests
export TEST_DB={{TEST_DATABASE}}
export TEST_API={{TEST_API_URL}}
npm run test:integration

# E2E tests
npm run test:e2e -- --headless

# Merge coverage
npx nyc merge coverage coverage/merged.json
npx nyc report --reporter=html --reporter=text

# Check thresholds
COVERAGE=$(npx nyc report --reporter=json-summary | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ Coverage below 80%: $COVERAGE%"
  exit 1
fi
```

## 🔄 CI/CD Templates

### GitHub Actions Workflow Update
```markdown
## PLAN:
- Update workflow with new steps
- Add security scanning
- Configure deployment gates

## ACT:
# Update workflow
cat >> {{REPO_ROOT}}/.github/workflows/deploy.yml << 'EOF'
      - name: Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          
      - name: Quality Gate
        run: |
          pulser :caca validate --strict
          pulser :tide check --database {{DB_NAME}}
EOF

# Configure branch protection
gh api repos/{{GITHUB_ORG}}/{{GITHUB_REPO}}/branches/main/protection -X PUT -f required_status_checks='{"strict":true,"contexts":["build","test","security-scan"]}'

# Add deployment environment
gh api repos/{{GITHUB_ORG}}/{{GITHUB_REPO}}/environments/production -X PUT -f reviewers='[{"type":"User","id":{{REVIEWER_ID}}}]'
```

## 🎨 Dashboard Customization

### Apply Theme and Features
```markdown
## PLAN:
- Apply TBWA theme
- Enable requested features
- Update navigation
- Deploy changes

## ACT:
cd {{REPO_ROOT}}/dashboard

# Apply theme
pulser :dash theme --name {{THEME_NAME}} --primary "{{PRIMARY_COLOR}}" --secondary "{{SECONDARY_COLOR}}"

# Enable features
jq '.features.ai_insights = {{ENABLE_AI}} | .features.realtime = {{ENABLE_REALTIME}} | .features.export = {{ENABLE_EXPORT}}' config.json > config.tmp && mv config.tmp config.json

# Update navigation
cat > src/navigation.json << EOF
{
  "items": [
    {"label": "{{NAV_ITEM_1}}", "path": "/{{NAV_PATH_1}}"},
    {"label": "{{NAV_ITEM_2}}", "path": "/{{NAV_PATH_2}}"},
    {"label": "{{NAV_ITEM_3}}", "path": "/{{NAV_PATH_3}}"}
  ]
}
EOF

# Build and deploy
npm run build
pulser :deploy --target {{DASHBOARD_URL}}
```

## 📊 Monitoring Setup

### Configure Azure Monitoring
```markdown
## PLAN:
- Set up Application Insights
- Configure alerts
- Create dashboard
- Set up log analytics

## ACT:
# Create Application Insights
az monitor app-insights component create --app {{APP_INSIGHTS_NAME}} --location {{AZURE_REGION}} --resource-group {{RESOURCE_GROUP}}

# Configure alerts
az monitor metrics alert create --name high-response-time --resource-group {{RESOURCE_GROUP}} --scopes {{APP_ID}} --condition "avg requests/duration > 1000" --window-size 5m --evaluation-frequency 1m

az monitor metrics alert create --name error-rate --resource-group {{RESOURCE_GROUP}} --scopes {{APP_ID}} --condition "sum requests/failed > 10" --window-size 5m --evaluation-frequency 1m

# Create log query
cat > {{REPO_ROOT}}/monitoring/queries.json << EOF
{
  "slow_queries": "requests | where duration > 1000 | summarize count() by name",
  "error_trends": "exceptions | summarize count() by type, bin(timestamp, 1h)",
  "user_activity": "pageViews | summarize count() by client_City"
}
EOF

# Configure retention
az monitor log-analytics workspace update --resource-group {{RESOURCE_GROUP}} --workspace-name {{WORKSPACE_NAME}} --retention-time 90
```

## Usage Tips

1. **Customize Variables**: Replace placeholder variables with your actual values in `.pulserrc`
2. **Test First**: Run with auto-approve disabled to verify substitutions
3. **Chain Commands**: Use `&&` to ensure each step succeeds before continuing
4. **Add Validation**: Include verification steps to confirm successful execution
5. **Use Conditionals**: Bash conditionals work within ACT blocks for dynamic workflows