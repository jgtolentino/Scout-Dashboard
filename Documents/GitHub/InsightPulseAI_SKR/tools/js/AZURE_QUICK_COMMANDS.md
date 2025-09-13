# 🚀 Azure Static Web Apps - Quick Commands Reference

## 🔥 **One-Command Clean Deployment**

```bash
# Execute the complete clean deployment script
./AZURE_CLEAN_DEPLOY.sh
```

This script will:
- List and optionally delete existing Static Web Apps
- Create a fresh Azure Static Web App
- Deploy the Scout Dashboard
- Test the deployment
- Provide the live URL

---

## 📋 **Manual Step-by-Step Commands**

### **Step 1: Clean Up Old Deployments**

```bash
# Login to Azure
az login

# List existing Static Web Apps
az staticwebapp list --output table

# Delete specific old app (replace values)
az staticwebapp delete --name <old-app-name> --resource-group <resource-group> --yes
```

### **Step 2: Create Fresh Static Web App**

```bash
# Set variables
APP_NAME="scout-dashboard-prod"
RESOURCE_GROUP="scout-dashboard-rg"
LOCATION="centralus"

# Create resource group (if needed)
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Static Web App
az staticwebapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source ./deploy \
  --output-location "." \
  --sku Free
```

### **Step 3: Deploy Dashboard Content**

```bash
# Navigate to deploy directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy

# Upload content
az staticwebapp upload \
  --name scout-dashboard-prod \
  --resource-group scout-dashboard-rg \
  --source .
```

### **Step 4: Get Live URL**

```bash
# Get the dashboard URL
az staticwebapp show \
  --name scout-dashboard-prod \
  --resource-group scout-dashboard-rg \
  --query "defaultHostname" \
  -o tsv
```

---

## 🛠️ **Troubleshooting Commands**

### **Check Deployment Status**

```bash
# View app details
az staticwebapp show --name scout-dashboard-prod --resource-group scout-dashboard-rg

# List all deployments
az staticwebapp environment list --name scout-dashboard-prod --resource-group scout-dashboard-rg
```

### **Test API Connectivity**

```bash
# Test Scout Dashboard APIs
curl -s https://scout-dashboard-poc-api-v2.azurewebsites.net/api/transactions | head -100
curl -s https://scout-dashboard-poc-api-v2.azurewebsites.net/api/geographic | head -100
```

### **Re-deploy Content**

```bash
# If you need to update the dashboard
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy
az staticwebapp upload --name scout-dashboard-prod --resource-group scout-dashboard-rg --source .
```

---

## 🎯 **Verification Checklist**

After deployment, verify:

- [ ] Dashboard loads at the Azure Static Web Apps URL
- [ ] All 5 analytics modules are visible
- [ ] "Test API" buttons return HTTP 200 responses
- [ ] Transaction Trends shows 547+ transactions
- [ ] Geographic Heatmap shows 8 store locations
- [ ] Mobile responsive design works
- [ ] No console errors in browser developer tools

---

## 📞 **Support Commands**

### **View Logs**

```bash
# Get deployment logs (if available)
az staticwebapp show --name scout-dashboard-prod --resource-group scout-dashboard-rg --query "repositoryUrl"
```

### **Delete and Start Over**

```bash
# If you need to completely start over
az staticwebapp delete --name scout-dashboard-prod --resource-group scout-dashboard-rg --yes
```

---

## 🔗 **Expected Results**

**Successful deployment should provide:**
- Live URL: `https://[app-name].azurestaticapps.net`
- HTTP 200 response from dashboard
- All 5 analytics modules functional
- API integration working
- Mobile-responsive interface

**If deployment fails:**
1. Check resource group permissions
2. Verify deploy directory contains index.html
3. Ensure Azure CLI is updated
4. Try alternative hosting (Vercel/Netlify) as backup

---

**Ready for copy-paste execution in Azure Cloud Shell or local terminal with Azure CLI installed.**