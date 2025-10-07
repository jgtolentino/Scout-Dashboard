#!/bin/bash

# Post-Migration Setup Script
# Run this after successful migration to set up the production environment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Setup functions
setup_git_hooks() {
    log "Setting up Git hooks..."
    
    # Pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to run linting

echo "Running pre-commit checks..."

# Run linting
npm run lint || {
    echo "❌ Linting failed. Please fix errors before committing."
    exit 1
}

echo "✅ Pre-commit checks passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    success "Git hooks configured"
}

setup_branch_protection() {
    log "Branch protection rules (manual setup required)..."
    
    cat > branch-protection-rules.md << 'EOF'
# Branch Protection Rules for GitHub

## Main Branch Protection

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators
   - ✅ Required status checks:
     - build
     - lint
     - test

## Auto-merge Settings
- Enable auto-merge for PRs that pass all checks
- Automatically delete head branches after merge
EOF
    
    warning "See branch-protection-rules.md for manual GitHub setup"
}

setup_secrets_template() {
    log "Creating secrets documentation..."
    
    cat > .github/SECRETS.md << 'EOF'
# Required GitHub Secrets

Configure these secrets in Settings → Secrets → Actions:

## Azure Deployment
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - From Azure Portal → Static Web App → Deployment token

## Azure OpenAI (if using premium features)
- `AZURE_OPENAI_KEY` - Azure OpenAI resource key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL

## Database (if using)
- `DB_CONNECTION_STRING` - Full connection string
- `DB_SERVER` - Server hostname
- `DB_NAME` - Database name
- `DB_USER` - Username
- `DB_PASSWORD` - Password

## Monitoring (optional)
- `AZURE_APP_INSIGHTS_KEY` - Application Insights instrumentation key

## Environment URLs
- `PRODUCTION_URL` - Production app URL for smoke tests
EOF
    
    success "Secrets documentation created"
}

setup_codeowners() {
    log "Setting up CODEOWNERS..."
    
    cat > .github/CODEOWNERS << 'EOF'
# Code Owners for automated review requests

# Global owners
* @tbwa

# Frontend
/frontend/ @tbwa

# API
/api/ @tbwa

# CI/CD
/.github/ @tbwa
/scripts/ @tbwa

# Documentation
*.md @tbwa
/docs/ @tbwa
EOF
    
    success "CODEOWNERS file created"
}

setup_vscode_workspace() {
    log "Setting up VS Code workspace..."
    
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  }
}
EOF
    
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-azurefunctions",
    "ms-azuretools.vscode-azurestaticwebapps",
    "ms-vscode.vscode-typescript-next"
  ]
}
EOF
    
    success "VS Code workspace configured"
}

create_pr_template() {
    log "Creating PR template..."
    
    mkdir -p .github/pull_request_template.md
    cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs or debugging code

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #
EOF
    
    success "PR template created"
}

create_issue_templates() {
    log "Creating issue templates..."
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- Browser: [e.g. Chrome 92]
- OS: [e.g. macOS]
- Node version: [e.g. 18.x]
EOF
    
    cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution**
What you want to happen

**Alternatives considered**
Other solutions you've considered

**Additional context**
Any other context or screenshots
EOF
    
    success "Issue templates created"
}

setup_env_example() {
    log "Creating environment example..."
    
    cat > .env.example << 'EOF'
# Azure Static Web Apps
AZURE_STATIC_WEB_APPS_API_TOKEN=your_deployment_token

# Azure OpenAI (for premium features)
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/

# Database (if using)
DB_CONNECTION_STRING=your_connection_string

# Environment
NODE_ENV=development
PORT=3000

# Feature Flags
ENABLE_PREMIUM_INSIGHTS=false
ENABLE_ROLE_GATING=false
EOF
    
    success "Environment example created"
}

# Main execution
main() {
    log "=== Post-Migration Production Setup ==="
    
    # Ensure we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d ".git" ]]; then
        warning "Run this script from your main repository root"
        exit 1
    fi
    
    setup_git_hooks
    setup_branch_protection
    setup_secrets_template
    setup_codeowners
    setup_vscode_workspace
    create_pr_template
    create_issue_templates
    setup_env_example
    
    echo ""
    success "=== Setup Complete! ==="
    echo ""
    log "Manual steps required:"
    echo "1. Configure branch protection rules (see branch-protection-rules.md)"
    echo "2. Add secrets to GitHub (see .github/SECRETS.md)"
    echo "3. Update team access and notifications"
    echo "4. Set up monitoring and alerts"
    echo ""
    log "Optional next steps:"
    echo "- Set up staging environment"
    echo "- Configure custom domain"
    echo "- Enable Azure Application Insights"
    echo "- Set up error tracking (Sentry, etc.)"
}

main "$@"