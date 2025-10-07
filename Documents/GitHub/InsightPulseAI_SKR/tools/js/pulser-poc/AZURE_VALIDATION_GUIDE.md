# 🚀 Azure Validation Guide - Phase 3A Monitoring

## ✅ **Step 1: Validate in Azure - Complete Implementation Guide**

This guide walks you through validating the Phase 3A monitoring implementation in Azure, setting up Application Insights, and configuring production alerts.

---

## 📋 **Prerequisites**

- Azure CLI installed and logged in (`az login`)
- GitHub CLI installed (`gh auth login`)
- Git repository with the monitoring code
- Azure subscription with appropriate permissions

---

## 🔧 **Step 1: Provision Azure Application Insights**

### **Option A: Automated Setup (Recommended)**

```bash
# Navigate to project directory
cd /path/to/pulser-poc

# Run the automated setup script
./scripts/setup-azure-monitoring.sh
```

### **Option B: Manual Setup**

```bash
# Set variables
RESOURCE_GROUP="pulser-rg"
APP_INSIGHTS_NAME="pulser-ai"
LOCATION="East US"

# Create Application Insights
az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type web \
    --retention-time 90

# Get connection string
AI_CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

# Store in GitHub Secrets
gh secret set APPINSIGHTS_CONNECTION_STRING --body "$AI_CONNECTION_STRING"
```

---

## 🚀 **Step 2: Deploy to Azure Static Web Apps**

### **Update GitHub Workflow**

Add the Application Insights connection string to your deployment workflow:

```yaml
# .github/workflows/production-deployment.yml
- name: Deploy to Azure Static Web Apps
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/"
    api_location: "api"
    output_location: ""
  env:
    APPINSIGHTS_CONNECTION_STRING: ${{ secrets.APPINSIGHTS_CONNECTION_STRING }}
    NODE_ENV: production
    API_VERSION: 1.0.0
```

### **Deploy the Changes**

```bash
# Commit and push the monitoring changes
git add .
git commit -m "feat: add Phase 3A monitoring and observability"
git push origin main

# Monitor deployment in GitHub Actions
gh run list --limit 5
```

---

## 🧪 **Step 3: Validate Monitoring Endpoints**

### **Test Health Endpoints**

Once deployed, test the monitoring endpoints:

```bash
# Get your Azure Static Web App URL
AZURE_URL="https://your-app.azurestaticapps.net"

# Test system status endpoint
curl -s "$AZURE_URL/api/status" | jq '.'

# Expected response:
# {
#   "status": "healthy",
#   "metrics": {
#     "p99": 45,
#     "errorRate": 0.001,
#     "cacheHitRate": 0.85,
#     "uptime": 3600
#   },
#   "issues": [],
#   "lastChecked": "2025-05-24T16:30:00.000Z",
#   "service": "brands-api",
#   "version": "1.0.0"
# }
```

### **Test Detailed Metrics**

```bash
# Test detailed metrics endpoint
curl -s "$AZURE_URL/api/metrics" | jq '.'

# Validate response structure
curl -s "$AZURE_URL/api/metrics" | jq '.requests.responseTime.p99'
```

### **Run Comprehensive Smoke Tests**

```bash
# Run smoke tests against Azure deployment
node scripts/ci-smoke-tests.js --api-url="$AZURE_URL"

# Expected output:
# ✅ Health Check Endpoint - PASSED
# ✅ KPIs Endpoint - PASSED
# ✅ Market Share Endpoint - PASSED
# ✅ Leaderboard Endpoint - PASSED
# ✅ Movers Endpoint - PASSED
# ✅ Insights Endpoint - PASSED
# ✅ Cache Performance Test - PASSED
# ✅ System Status Endpoint - PASSED
# ✅ Detailed Metrics Endpoint - PASSED
# ✅ Performance Test - PASSED
# 📊 Total: 10/10 PASSED
```

---

## 📊 **Step 4: Verify Application Insights Telemetry**

### **Check Telemetry Flow**

1. **Open Azure Portal**: Navigate to your Application Insights resource
2. **Live Metrics**: Verify real-time telemetry is flowing
3. **Logs**: Check for custom events and traces

### **Query Telemetry Data**

```kusto
// Application Insights KQL queries

// Request performance
requests
| where timestamp > ago(1h)
| summarize avg(duration), percentile(duration, 95), percentile(duration, 99) by name
| order by avg_duration desc

// Error rate
requests
| where timestamp > ago(1h)
| summarize total = count(), errors = countif(success == false)
| extend errorRate = todouble(errors) / todouble(total) * 100

// Custom events (cache hits/misses)
customEvents
| where timestamp > ago(1h)
| where name in ("cache_hit", "cache_miss")
| summarize count() by name, bin(timestamp, 5m)
```

### **Validate Distributed Tracing**

1. **Transaction Search**: Look for end-to-end request traces
2. **Application Map**: Verify service dependencies
3. **Performance**: Check for performance bottlenecks

---

## 🚨 **Step 5: Set Up Production Alerts**

### **Create Alert Rules**

```bash
# High P99 latency alert
az monitor metrics alert create \
    --name "High P99 Latency" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
    --condition "avg requests/duration > 800" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --severity 2 \
    --description "P99 latency exceeds 800ms threshold"

# High error rate alert
az monitor metrics alert create \
    --name "High Error Rate" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
    --condition "avg requests/failed > 5" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --severity 1 \
    --description "Error rate exceeds 5% threshold"
```

### **Configure Notification Channels**

```bash
# Create action group for notifications
az monitor action-group create \
    --name "api-alerts" \
    --resource-group "$RESOURCE_GROUP" \
    --short-name "api-alerts" \
    --email-receivers name="admin" email="admin@yourcompany.com"

# Link alerts to action group
az monitor metrics alert update \
    --name "High P99 Latency" \
    --resource-group "$RESOURCE_GROUP" \
    --add-action-groups "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/api-alerts"
```

---

## 🎯 **Step 6: Dashboard Integration**

### **Add SystemHealth Component to MockifyCreator**

```jsx
// In your MockifyCreator dashboard
import SystemHealth from './components/SystemHealth';

function Dashboard() {
  return (
    <div className="dashboard">
      {/* Existing dashboard content */}
      
      {/* Add system health widget */}
      <div className="widget-container">
        <SystemHealth 
          apiUrl="https://your-app.azurestaticapps.net"
          refreshInterval={60000}
          showDetails={true}
          onStatusChange={(status, metrics, issues) => {
            // Handle status changes (optional)
            if (status === 'error') {
              console.warn('API health degraded:', issues);
            }
          }}
        />
      </div>
    </div>
  );
}
```

### **Compact Version for Header**

```jsx
// For header or status bar
import { SystemHealthCompact } from './components/SystemHealth';

function Header() {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>MockifyCreator Dashboard</h1>
      </div>
      <div className="header-right">
        <SystemHealthCompact 
          apiUrl="https://your-app.azurestaticapps.net"
          refreshInterval={30000}
        />
      </div>
    </header>
  );
}
```

---

## 📈 **Step 7: Monitor & Validate**

### **48-Hour Monitoring Checklist**

- [ ] **Live Metrics**: Verify real-time telemetry flow
- [ ] **Performance**: Monitor P99 latency trends
- [ ] **Error Rate**: Track error patterns
- [ ] **Cache Performance**: Validate hit/miss ratios
- [ ] **Alerts**: Test alert firing and notifications
- [ ] **Dashboard Widget**: Verify UI integration

### **Performance Baselines**

Monitor these key metrics over 48 hours:

```
Target Thresholds:
- P99 Latency: < 800ms
- Error Rate: < 5%
- Cache Hit Rate: > 90%
- Uptime: > 99.9%
```

### **Threshold Adjustments**

Based on real traffic patterns, you may need to adjust:

```javascript
// In api/metrics.js
const HEALTH_THRESHOLDS = {
  errorRate: 0.05,    // Adjust based on baseline
  p99Latency: 800,    // Adjust based on P99 trends
  p95Latency: 500     // Adjust based on P95 trends
};
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

1. **No Telemetry Data**
   - Check `APPINSIGHTS_CONNECTION_STRING` environment variable
   - Verify OpenTelemetry initialization in logs
   - Check Azure Static Web App configuration

2. **High Latency**
   - Review Application Insights performance data
   - Check for cold start issues
   - Validate cache hit rates

3. **Alert Not Firing**
   - Verify alert rule configuration
   - Check metric data availability
   - Validate action group settings

### **Debug Commands**

```bash
# Check environment variables
az staticwebapp appsettings list \
    --name "your-app-name" \
    --resource-group "$RESOURCE_GROUP"

# View recent logs
az monitor activity-log list \
    --resource-group "$RESOURCE_GROUP" \
    --max-events 10

# Test connectivity
curl -v "https://your-app.azurestaticapps.net/api/status"
```

---

## ✅ **Validation Checklist**

- [ ] Application Insights resource created
- [ ] GitHub Secrets configured
- [ ] Deployment successful
- [ ] `/api/status` endpoint responding
- [ ] `/api/metrics` endpoint responding
- [ ] Telemetry flowing to Application Insights
- [ ] Alerts configured and tested
- [ ] Dashboard widget integrated
- [ ] 48-hour monitoring baseline established

---

## 🚀 **Next Steps: Phase 3B**

Once validation is complete, you're ready for:

1. **Geo-redundant Redis caching**
2. **CDN edge configuration**
3. **Blue/green deployments**
4. **Global load balancing**
5. **"Five nines" availability architecture**

Your monitoring foundation is now solid and ready for global scale!
