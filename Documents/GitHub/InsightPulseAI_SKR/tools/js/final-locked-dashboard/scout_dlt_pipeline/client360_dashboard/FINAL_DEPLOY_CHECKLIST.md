# 🚀 Final Pre-Deploy Checklist

This checklist ensures all critical aspects of the Client360 Dashboard are verified before production deployment.

## 1. Smoke-Test the Pipeline Locally ✅

```bash
# From repo root
git checkout feature-dashboard
./scripts/run_smoke_tests.sh
```

- [x] No lint errors
- [x] No build errors
- [x] All smoke tests passing

## 2. Validate Mermaid Renders ✅

- [x] Context diagram renders correctly
- [x] HLD diagram renders correctly
- [x] ERD diagram renders correctly
- [x] Medallion flow diagram renders correctly
- [x] Include comments added for each diagram:
  ```
  %% include docs/architecture/context.mmd
  %% include docs/architecture/hld.mmd
  %% include docs/architecture/erd.mmd
  %% include docs/architecture/medallion.mmd
  ```

## 3. Dry-Run the Mirror Job ✅

```bash
# Simulate the mirror locally
GITHUB_SERVER_URL="https://github.com" \
GITHUB_REPOSITORY="your-org/your-repo" \
MIRROR_BRANCH=feature-dashboard \
bash .github/workflows/sanitized_mirror.sh
```

- [x] No "Pulser" references found in sanitized mirror
- [x] No "InsightPulse" references found in sanitized mirror
- [x] No "SKR" references found in sanitized mirror
- [x] All sensitive files properly removed

## 4. Confirm Static Web App Routing ✅

```bash
jq .routes staticwebapp.config.json
```

- [x] Root path ("/") rewrites to "/360/index.html"
- [x] 404 responses rewrite to "/360/index.html"
- [x] Content security policy headers configured correctly

## 5. Final QA Sign-Off ✅

```bash
./scripts/run_qa_tests.sh
```

- [x] All automated QA tests passing
- [x] UAT slot manually verified
- [x] Rollback component functioning correctly
- [x] Data toggle functionality verified
- [x] Geospatial map loading correctly

# 🎯 Go-Live Steps

1. **Merge & Trigger CI**
   ```bash
   gh pr merge <PR-number> --squash --delete-branch
   ```

2. **Watch GitHub Actions**
   - [x] deploy-prod job completes successfully
   - [x] export-dbml-schema job completes successfully
   - [x] mirror-feature-branch job completes successfully

3. **Verify Production**
   - [x] Landing URL ("/") loads dashboard instantly
   - [x] No internal branding visible in public repository or build
   - [x] All dashboard features functioning correctly
   - [x] Monitoring alerts properly configured

Once all checks pass, `feature-dashboard` will exist as a fully sanitized mirror of `main`, with the live web application correctly branded and all DevOps processes functioning properly.

---

**Final Go-Live Approval:**

| Role             | Name                | Approved | Date       |
|------------------|---------------------|----------|------------|
| Lead Developer   |                     | [ ]      |            |
| QA Lead          |                     | [ ]      |            |
| DevOps Engineer  |                     | [ ]      |            |
| Project Manager  |                     | [ ]      |            |