# Auto-Approval & Auto-Action Configuration Guide

## Overview

This guide helps you configure Claude/LLM automation with appropriate safety measures for auto-approval and auto-action capabilities.

## 🔍 Quick Check: Is Auto-Approval Enabled?

Run the audit script:
```bash
./audit_auto_approval.sh
```

### Signs Auto-Approval is ENABLED:
- ✅ Scripts contain `--auto-approve`, `--force`, `--no-confirm`
- ✅ Workflows auto-commit and push without user input
- ✅ Deployments happen automatically on fixes
- ✅ No manual approval gates in critical paths

### Signs Auto-Approval is DISABLED:
- ✅ Scripts contain `read -p "Confirm? (y/N)"`
- ✅ Workflows require PR reviews
- ✅ Manual deployment steps required
- ✅ Branch protection rules enforce reviews

## 🚀 Safe Auto-Approval Configuration

### Level 1: Low-Risk Auto-Approval
**Safe for**: Config fixes, documentation updates, minor style changes

```yaml
# .github/workflows/auto-fix-safe.yml
name: Safe Auto-Fix

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0'  # Weekly

jobs:
  auto-fix-safe:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'  # Only on develop branch
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Auto-fix safe issues
      run: |
        # Only fix low-risk items
        npm run lint --fix
        npm run format
        
        # Check if changes are minimal
        CHANGED_FILES=$(git diff --name-only | wc -l)
        if [ "$CHANGED_FILES" -gt 5 ]; then
          echo "Too many changes ($CHANGED_FILES files). Manual review required."
          exit 1
        fi
        
        # Auto-commit only if changes are small
        if [ "$CHANGED_FILES" -gt 0 ]; then
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git commit -m "auto-fix: safe formatting and linting fixes
          
          Files changed: $CHANGED_FILES
          Auto-approved: Low-risk changes only
          
          🤖 Generated with automated workflow"
          git push
        fi
    
    - name: Create PR for manual review
      if: failure()
      run: |
        # If auto-fix failed, create PR instead
        git checkout -b auto-fix-$(date +%Y%m%d-%H%M%S)
        git push origin auto-fix-$(date +%Y%m%d-%H%M%S)
        gh pr create --title "Auto-fix: Manual review required" --body "Automated fixes require manual review"
```

### Level 2: Medium-Risk with Approval Gates

```yaml
# .github/workflows/auto-fix-gated.yml
name: Gated Auto-Fix

on:
  issue_comment:
    types: [created]

jobs:
  auto-fix-gated:
    runs-on: ubuntu-latest
    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/auto-fix') &&
      github.event.comment.user.login == github.repository_owner
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Apply Claude/LLM fixes
      run: |
        # Run LLM-powered fixes
        ./scripts/claude_auto_fix.sh
        
        # Create summary
        echo "## Auto-Fix Summary" > fix_summary.md
        echo "Changes applied by: Claude/LLM" >> fix_summary.md
        echo "Triggered by: ${{ github.actor }}" >> fix_summary.md
        echo "Files changed:" >> fix_summary.md
        git diff --name-only >> fix_summary.md
        
    - name: Require manual approval for commit
      run: |
        echo "Changes ready. Manual approval required to commit."
        echo "Review the changes and run: git commit -m 'Approved auto-fix'"
        exit 1  # Stops here - requires manual action
```

### Level 3: Full Auto-Approval (High Risk)

```yaml
# .github/workflows/auto-fix-full.yml
name: Full Auto-Fix (USE WITH CAUTION)

on:
  schedule:
    - cron: '0 1 * * *'  # Daily

jobs:
  auto-fix-full:
    runs-on: ubuntu-latest
    environment: production  # Requires environment approval
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Backup before changes
      run: |
        # Create backup branch
        git checkout -b backup/auto-fix-$(date +%Y%m%d-%H%M%S)
        git push origin backup/auto-fix-$(date +%Y%m%d-%H%M%S)
        git checkout main
    
    - name: Run Claude/LLM auto-fix
      run: |
        # Full automated fixing
        ./scripts/claude_auto_fix_advanced.sh --auto-approve --force
        
    - name: Auto-test and deploy
      run: |
        # Run tests
        npm test
        
        # Auto-deploy if tests pass
        if [ $? -eq 0 ]; then
          npm run deploy --auto-approve
          
          # Log the action
          echo "Auto-deployed at $(date)" >> deployment_log.txt
          git add deployment_log.txt
          git commit -m "auto-deploy: successful auto-fix deployment"
          git push
        else
          echo "Tests failed. Rolling back."
          git reset --hard HEAD~1
          exit 1
        fi
    
    - name: Notify on failure
      if: failure()
      run: |
        # Send alert on failure
        curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Auto-fix failed in production"}' \
        ${{ secrets.SLACK_WEBHOOK }}
```

## 🛡️ Safety Mechanisms

### 1. Change Size Limits
```bash
# In your auto-fix script
CHANGED_FILES=$(git diff --name-only | wc -l)
CHANGED_LINES=$(git diff --numstat | awk '{sum+=$1+$2} END {print sum}')

if [ "$CHANGED_FILES" -gt 10 ] || [ "$CHANGED_LINES" -gt 100 ]; then
    echo "Changes too large for auto-approval"
    exit 1
fi
```

### 2. Rollback Mechanisms
```bash
# Create rollback point
ROLLBACK_COMMIT=$(git rev-parse HEAD)
echo "$ROLLBACK_COMMIT" > .rollback_point

# In case of failure
rollback() {
    ROLLBACK_COMMIT=$(cat .rollback_point)
    git reset --hard "$ROLLBACK_COMMIT"
    git push --force-with-lease
}
```

### 3. Monitoring and Alerts
```bash
# Log all auto-actions
log_action() {
    echo "$(date): $1" >> /var/log/auto-approval.log
    # Send to monitoring system
    curl -X POST "$MONITORING_WEBHOOK" -d "{\"action\":\"$1\"}"
}
```

### 4. Environment Protection
```yaml
# In repository settings > Environments
production:
  protection_rules:
    - type: required_reviewers
      required_reviewers: ["admin-user"]
    - type: wait_timer  
      wait_timer: 5  # 5 minute delay
```

## 🔧 Configuration Examples

### Disable Auto-Approval (Maximum Safety)
```bash
# In scripts, always require confirmation
read -p "Apply these changes? (y/N): " -n 1 -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 1
fi
```

### Enable Auto-Approval (with limits)
```bash
# Auto-approve only for small, safe changes
if [ "$RISK_LEVEL" = "low" ] && [ "$CHANGED_FILES" -lt 3 ]; then
    echo "Auto-approving low-risk changes"
    apply_changes --auto-approve
else
    echo "Manual approval required for these changes"
    exit 1
fi
```

## 📊 Monitoring Auto-Approval

### Dashboard Metrics
- Number of auto-approvals per day
- Success/failure rate of auto-deployments
- Time saved vs. manual process
- Number of rollbacks required

### Alerts to Set Up
- Auto-approval failure
- Unusual number of auto-changes
- Rollback triggered
- Large change attempted

### Audit Trail
```bash
# Log format for auto-approvals
{
  "timestamp": "2025-05-24T10:30:00Z",
  "action": "auto-approve",
  "trigger": "claude-fix",
  "files_changed": 3,
  "lines_changed": 45,
  "risk_level": "low",
  "success": true,
  "rollback_point": "abc123def"
}
```

## 🚨 Emergency Procedures

### Disable Auto-Approval Immediately
```bash
# Emergency disable script
git config --global alias.emergency-disable '!git checkout main && git revert HEAD && git push'

# Or via GitHub API
curl -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_ID" \
  -d '{"state":"disabled"}'
```

### Rollback Auto-Changes
```bash
# Find last manual commit
LAST_MANUAL=$(git log --grep="auto-" --invert-grep -1 --format="%H")
git reset --hard "$LAST_MANUAL"
git push --force-with-lease
```

## 📋 Best Practices Checklist

### Before Enabling Auto-Approval:
- [ ] Test in staging environment extensively
- [ ] Set up comprehensive monitoring
- [ ] Define clear rollback procedures
- [ ] Implement change size limits
- [ ] Create approval gates for high-risk changes
- [ ] Set up alerting for failures
- [ ] Document emergency procedures
- [ ] Train team on monitoring and response

### Regular Reviews:
- [ ] Weekly review of auto-approval logs
- [ ] Monthly assessment of success rates
- [ ] Quarterly review of safety mechanisms
- [ ] Annual audit of automation scope

This configuration ensures you have appropriate safety measures while enabling automation where it's most beneficial.