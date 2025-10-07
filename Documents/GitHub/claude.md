# Claude Development Instructions

## CRITICAL: Verification Requirements

You MUST follow these verification protocols for ALL development tasks in this project.

### 1. NEVER Claim Success Without Proof

Success claims require ALL of the following:
- Build logs showing completion
- Live URL responding with actual content
- Screenshot or curl output as evidence
- Specific success criteria met

### 2. Deployment Verification Protocol

When deploying or claiming a fix works:

```bash
# REQUIRED STEPS IN ORDER:
1. Show local build success first
2. Git push and show commit hash
3. Wait minimum 90 seconds for deployment
4. Check build logs for "Success" or "Ready"
5. Verify with: curl -s $DEPLOY_URL | grep -E "(actual content not loading message)"
6. Run: node scripts/verify-deployment.js (if exists)
7. Only claim success if ALL checks pass
```

### 3. Error Response Protocol

If something fails:
- Say: "The deployment appears to have failed because..."
- Show the exact error message
- Do NOT assume it will work on next try
- Do NOT claim partial success

### 4. Verification Commands

Always use these commands to verify:

```bash
# Check if site is actually working (not just returning 200)
curl -s https://[DEPLOY_URL] | grep -c "Loading" # Should be 0
curl -s https://[DEPLOY_URL] | wc -c # Should be > 5000 bytes

# Check for React app mount
curl -s https://[DEPLOY_URL] | grep -E "root.*<div" # Should find populated root

# Check for console errors (if Playwright available)
node -e "
const checkErrors = async () => {
  const browser = await require('playwright').chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('https://[DEPLOY_URL]');
  await page.waitForTimeout(3000);
  await browser.close();
  if (errors.length > 0) {
    console.log('❌ Console errors found:', errors);
    process.exit(1);
  } else {
    console.log('✅ No console errors');
  }
};
checkErrors();
"
```

### 5. Project-Specific Success Criteria

For THIS project, successful deployment means:
- [ ] Site loads without JavaScript errors
- [ ] Main heading/hero text is visible
- [ ] API endpoints return data (not errors)
- [ ] Build size is reasonable (<10MB)
- [ ] Core functionality works (dashboards, data visualization)

### 6. Common False Positives to Avoid

DO NOT trust these as success indicators:
- ❌ "Build started" messages
- ❌ HTTP 200 status alone (could be error page)
- ❌ Deployment platform saying "deployed" (could be broken)
- ❌ Local tests passing (production might differ)
- ❌ Previous deployment working (new one might not)

### 7. Required Waiting Periods

- After git push: Wait 90 seconds minimum
- After deployment trigger: Wait 2 minutes
- Between verification attempts: Wait 30 seconds
- If deployment platform shows "building": Wait until "ready"

### 8. Incremental Development Rules

When making changes:
1. Make ONE change at a time
2. Verify it works locally
3. Deploy and verify
4. Only then make next change
5. If multiple changes needed, list them first and do sequentially

### 9. Communication Style for Verification

Use this language:
- ✅ "I've verified the deployment is working by checking..."
- ✅ "The verification failed with error: [exact error]"
- ✅ "I cannot confirm this is working because..."
- ✅ "Local tests pass, but deployment verification shows..."

Never say:
- ❌ "It should be working now"
- ❌ "The deployment succeeded" (without verification)
- ❌ "Everything looks good" (without specific checks)
- ❌ "Try refreshing" (as a solution)

### 10. Project-Specific Context

This repository contains multiple projects:
- **360/**: Dashboard projects
- **InsightPulseAI_SKR/**: AI agent orchestration system
- **Scout Dashboard/**: Retail analytics dashboard
- **retail-insights-dashboard-ph/**: Philippines retail insights
- **pulser-live/**: Live deployment system
- **bruno-agentic-cli/**: CLI tooling

Before working on any project, check which subdirectory you're in and follow the appropriate build/deploy process for that specific project.

### 11. Build Commands by Project

```bash
# For React/Vite projects (360/, client/, etc.)
npm install
npm run build
npm run preview  # Local verification

# For Node.js backend projects
npm install
npm test
npm start

# For dashboard projects
npm run dev    # Development
npm run build  # Production build
npm run preview # Verify build locally
```

### 12. Git Workflow Requirements

Always verify git status before claiming completion:

```bash
git status                    # Check working directory
git log --oneline -3         # Show recent commits
git push origin main         # Push changes
git log --oneline -1         # Confirm push successful
```

### 13. Development Workflow

1. **Before Starting Any Task**
   - Read these instructions
   - Check current deployment status
   - Verify development environment works
   - Identify which project/subdirectory you're working in

2. **During Development**
   - Test changes locally first
   - Commit with descriptive messages
   - Run verification after each significant change

3. **After Changes**
   - Wait for full deployment
   - Run ALL verification checks
   - Document what was verified

### 14. Error Handling Standards

When encountering errors:
1. Show the EXACT error message
2. Identify which step failed
3. Do NOT make assumptions about the cause
4. Test one potential fix at a time
5. Verify each fix attempt with evidence

### 15. Available Project Scripts

Check for these common verification commands:
- `npm run verify` - Run local verification
- `npm run test` - Run test suite
- `npm run build` - Production build
- `npm run lint` - Code quality check
- `npm run typecheck` - TypeScript verification

### 16. Multi-Project Repository Rules

Since this is a mono-repository:
1. Always specify which project you're working on
2. Use correct working directory for commands
3. Check if changes affect other projects
4. Test integration between related projects

## Emergency Procedures

If deployment is broken:
1. DO NOT make multiple quick fixes
2. First, identify the exact error
3. Test fix locally thoroughly
4. Deploy with careful verification
5. If still broken, consider rollback

## Remember

> "A deployment without verification is a guess. We don't guess in production."

---
**Last Updated:** December 2024  
**Version:** 1.0  
**Applies to:** All projects in this repository