# Golden Baseline: golden-20250519-restored

## Overview
Restored golden baseline from the e5a75c8 commit (Add complete CI/CD setup guide) to fix dashboard styling issues

## Details
- **Created:** 2025-05-19
- **Environment:** production
- **Created By:** Claude Code <noreply@anthropic.com>
- **Git Branch:** rollback-dashboard-2025-05-19
- **Git Commit:** e5a75c8
- **Git Tag:** golden-20250519
- **Deployment URL:** https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor

## Contents
- Configuration files
- Build artifacts
- Deployment configurations
- Dashboard HTML/CSS/JS files
- Assets and resources

## Usage
To restore this baseline, run:
```
./scripts/rollback-to-golden.sh --name golden-20250519-restored
```

To verify the integrity of this baseline, run:
```
./scripts/verify-against-golden.sh --name golden-20250519-restored
```

## Notes
This baseline was created to address styling issues in the Scout Advisor dashboard, particularly with the data source toggle. The dashboard was rolled back to a known working state from commit e5a75c8 which had properly styled components.

For a more detailed explanation of the issues and fix, see:
- DASHBOARD_ROLLBACK_SUMMARY.md
- DATA_TOGGLE_FIX_PLAN.md