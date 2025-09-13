# Plan-Act Automation with Variable Substitution

This guide explains how to use Pulser's Plan-Act automation to turn ChatGPT/Claude responses into executable workflows with automatic variable substitution.

## Overview

The Plan-Act pattern allows you to:
1. Copy AI-generated plans and actions
2. Paste them into Pulser
3. Have variables automatically substituted
4. Execute with optional auto-approval

## Quick Start

### 1. Set Up Your Configuration

Create a `.pulserrc` file in your project or home directory:

```json
{
  "auto_approve": false,
  "variables": {
    "REPO_ROOT": "/path/to/your/repo",
    "AZURE_TOKEN": "{{from_env}}",
    "API_URL": "https://api.yourservice.com"
  }
}
```

### 2. Format Your AI Prompts

When asking ChatGPT/Claude, request output in this format:

```markdown
## PLAN:
- Brief description of what will be done
- Step by step plan

## ACT:
pulser :snowwhite sanitize --target={{REPO_ROOT}}/deploy
export AZURE_STATIC_WEB_APPS_API_TOKEN={{AZURE_TOKEN}}
git remote set-url origin {{GITHUB_REPO_URL}}
```

### 3. Execute

Simply paste the output into Pulser:

```bash
# Direct execution
pulser-plan-act "$(pbpaste)"  # macOS

# Watch clipboard for auto-execution
pulser-plan-act --watch

# Execute with auto-approve
pulser-plan-act --auto deployment-plan.md
```

## Variable Substitution

### Supported Patterns

- `{{VAR_NAME}}` - Recommended format
- `$VAR_NAME` - Bash-style variables

### Variable Sources (in order of precedence)

1. Runtime variables (set with `--set`)
2. Environment variables
3. `.pulserrc` variables
4. `.env` file
5. `secrets.yaml` file

### Security

Sensitive variables (containing TOKEN, KEY, SECRET, PASSWORD, API) are:
- Never logged to console
- Required to exist (throws error if missing)
- Masked in output logs

## Examples

### Example 1: Deploy Dashboard

AI Response:
```markdown
## PLAN:
- Sanitize the dashboard code
- Deploy to Azure Static Web Apps
- Update DNS records

## ACT:
pulser :snowwhite sanitize --target={{REPO_ROOT}}/dashboard
cd {{REPO_ROOT}}/dashboard
npm run build
az staticwebapp upload --app-name {{AZURE_APP_NAME}} --token {{AZURE_TOKEN}}
pulser :notify "Dashboard deployed to {{DASHBOARD_URL}}"
```

### Example 2: Client Onboarding

AI Response:
```markdown
## PLAN:
- Create new client workspace
- Set up Azure resources
- Configure CI/CD pipeline

## ACT:
mkdir -p {{REPO_ROOT}}/clients/{{CLIENT_NAME}}
az group create --name rg-{{CLIENT_NAME}}-prod --location {{AZURE_REGION}}
az storage account create --name st{{CLIENT_NAME}}prod --resource-group rg-{{CLIENT_NAME}}-prod
git remote add {{CLIENT_NAME}} {{CLIENT_REPO_URL}}
cp {{REPO_ROOT}}/templates/ci-cd.yml .github/workflows/{{CLIENT_NAME}}-deploy.yml
```

### Example 3: Database Migration

AI Response:
```markdown
## PLAN:
- Backup current database
- Run migration scripts
- Verify data integrity

## ACT:
export SQLCMDPASSWORD={{SQL_PASSWORD}}
sqlcmd -S {{SQL_SERVER}} -U {{SQL_USER}} -Q "BACKUP DATABASE {{DB_NAME}} TO DISK='{{BACKUP_PATH}}'"
pulser :migrate --database {{DB_NAME}} --scripts {{REPO_ROOT}}/migrations
pulser :verify --database {{DB_NAME}} --checksums
```

## Configuration Reference

### .pulserrc Structure

```json
{
  "auto_approve": false,
  "variables": {
    // Your project-specific variables
  },
  "plan_act": {
    "auto_approve": false,
    "continue_on_error": false,
    "log_commands": true,
    "sanitize_logs": true,
    "timeout": 300000
  },
  "security": {
    "mask_secrets": true,
    "allowed_commands": ["pulser", "git", "npm", "az"],
    "forbidden_patterns": ["rm -rf /"]
  }
}
```

### Environment Variables

- `PULSER_AUTO_APPROVE=true` - Enable auto-approval globally
- `PULSER_CONFIG_PATH=/path/to/.pulserrc` - Custom config location
- `PULSER_SECRETS_PATH=/path/to/secrets.yaml` - Custom secrets location

## Best Practices

1. **Never commit secrets** - Use variables for all sensitive values
2. **Test first** - Run without auto-approve to verify substitutions
3. **Use descriptive variable names** - Makes templates self-documenting
4. **Version control templates** - Save successful PLAN/ACT patterns
5. **Validate critical operations** - Add verification steps in your ACT blocks

## Integration with VS Code

Add this to your VS Code settings:

```json
{
  "pulser.planAct.autoApprove": false,
  "pulser.planAct.watchClipboard": true,
  "pulser.planAct.notifyOnComplete": true
}
```

## Troubleshooting

### Variable not found
- Check spelling in both template and config
- Verify file exists and is readable
- Use `pulser-plan-act --config` to see loaded variables

### Command fails
- Check if command is in allowed list
- Verify all required variables are set
- Look for typos in substituted values

### Auto-approve not working
- Check both .pulserrc and environment variable
- Ensure JSON is valid in config file
- Try `pulser-plan-act --auto` for single execution

## Advanced Usage

### Conditional Execution

```markdown
## ACT:
[ -d {{REPO_ROOT}}/dist ] && rm -rf {{REPO_ROOT}}/dist
{{#if ENVIRONMENT == 'production'}}
  pulser :deploy --production
{{else}}
  pulser :deploy --staging
{{/if}}
```

### Parallel Execution

```markdown
## ACT:
pulser :parallel <<EOF
  pulser :test --suite unit
  pulser :test --suite integration
  pulser :lint
EOF
```

### Error Handling

```markdown
## ACT:
pulser :backup || echo "Backup failed, continuing..."
pulser :deploy && pulser :notify "Success" || pulser :rollback
```

## Security Considerations

1. **Secrets Management**
   - Use Azure Key Vault or similar for production
   - Never put actual secrets in PLAN/ACT blocks
   - Rotate credentials regularly

2. **Command Injection**
   - Pulser validates against forbidden patterns
   - Use allowed_commands whitelist
   - Escape user input in variables

3. **Audit Trail**
   - All executions are logged
   - Sensitive values are masked
   - Integration with monitoring tools available