# 🔐 Azure Static Web Apps Authorization Guide

## 🚨 **Issue**: Build and Deploy Job (pull_request) Failing

**Root Cause**: The `AzureAppServiceCLI` GitHub App lacks authorization to deploy from the `jgtolentino/pulser` repository.

## ⚡ **Quick Fix Script**

Run the authorization helper:

```bash
./scripts/authorize_azure_app.sh
```

## 🛠️ **Manual Authorization Steps**

### **Option 1: Organization-Level (Recommended)**

1. **Go to Organization Settings**
   ```
   https://github.com/organizations/tbwa-smp/settings/installations
   ```

2. **Find AzureAppServiceCLI**
   - Look for "AzureAppServiceCLI" in installed apps
   - Click **Configure**

3. **Grant Repository Access**
   - Select `jgtolentino/pulser` repository
   - Ensure permissions include:
     - ✅ Actions
     - ✅ Contents 
     - ✅ Deployments
     - ✅ Pull requests
   - Click **Save**

### **Option 2: Direct App Installation**

1. **Visit GitHub App Page**
   ```
   https://github.com/apps/azureappservicecli
   ```

2. **Configure Installation**
   - Click **Configure**
   - Select `jgtolentino/pulser`
   - Click **Install & Authorize**

### **Option 3: Repository Settings**

1. **Go to Repository Installations**
   ```
   https://github.com/jgtolentino/pulser/settings/installations
   ```

2. **Configure AzureAppServiceCLI**
   - Find "AzureAppServiceCLI" 
   - Click **Configure**
   - Verify permissions are enabled

## ✅ **Verification Steps**

After authorization:

1. **Wait 2-3 minutes** for GitHub to propagate permissions

2. **Re-run PR Checks**
   ```bash
   gh pr view 6 --repo jgtolentino/pulser
   # Click "Re-run all jobs" or close/reopen the PR
   ```

3. **Expected Results**
   - ✅ Build and Deploy Job (pull_request) → **SUCCESS**
   - ✅ API smoke tests → **PASS**
   - ✅ Guardrails check → **PASS** 
   - ✅ Lighthouse performance → **PASS**
   - ✅ All quality gates → **GREEN**

## 🎯 **What This Fixes**

| Before Authorization | After Authorization |
|---------------------|-------------------|
| ❌ "Error: You need to authorize AzureAppServiceCLI" | ✅ Successful SWA deployments |
| ❌ PR builds fail with auth errors | ✅ All PRs deploy cleanly |
| ❌ No deployment previews | ✅ PR preview environments |
| ❌ Broken CI/CD pipeline | ✅ Full enterprise pipeline active |

## 🚀 **Why This Matters**

Once authorized, **every future PR** will:
- ✅ **Deploy successfully** to Azure Static Web Apps
- ✅ **Pass all quality gates** (tests, security, performance)
- ✅ **Generate preview URLs** for stakeholder review
- ✅ **Maintain production standards** automatically

## 🆘 **Troubleshooting**

### Still seeing auth errors?

1. **Check app permissions** - Ensure all required scopes are granted
2. **Wait for propagation** - GitHub can take 2-3 minutes to update
3. **Try different authorization method** - Use Option 2 if Option 1 fails
4. **Contact org admin** - May need higher-level permissions

### Different error messages?

If you see different failures after authorization:
- **"Multiple SWA workflows"** → Check guardrails are passing
- **"Build output not found"** → Verify app_location/output_location paths
- **"Performance budget exceeded"** → Lighthouse thresholds need adjustment

## 📱 **Contact & Support**

- **GitHub App**: https://github.com/apps/azureappservicecli
- **Repository**: https://github.com/jgtolentino/pulser
- **PR with Hardening Suite**: https://github.com/jgtolentino/pulser/pull/6

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**