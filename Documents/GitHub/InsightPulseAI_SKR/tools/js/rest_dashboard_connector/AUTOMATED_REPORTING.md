# Automated Reporting & Notification System

This document outlines the implementation of automated report generation, delivery, and notification systems based on the proxy signals data.

## Report Types & Audience

| Report Type | Primary Audience | Frequency | Delivery Method | Key Metrics |
|-------------|------------------|-----------|-----------------|-------------|
| **Store Performance** | Store Managers | Daily | Email, App | Share of shelf, Inventory signals, Foot traffic |
| **Brand Performance** | Brand Managers | Weekly | Email, PowerBI | Brand visibility, Competitive positioning, Sentiment trends |
| **Executive Summary** | Leadership | Monthly | PowerPoint, Dashboard | Market share indicators, Brand health index, Opportunity mapping |
| **Inventory Alerts** | Supply Chain | Real-time | SMS, Email, Dashboard | Critical stock levels, Restock predictions, Distribution recommendations |
| **Competitive Intel** | Marketing | Weekly | Dashboard, Email | Competitor activity, Share shifts, Pricing changes |

## Technical Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Data Sources │────▶│ Report Engine │────▶│   Templates   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ADLS Gen2    │     │ Azure Function│     │ Report Library│
│  Gold Layer   │     │  Timer Trigger│     │  HTML/PPTX/PDF│
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│               Notification Gateway                        │
├───────────────┬───────────────┬────────────┬─────────────┤
│ Email Service │   SMS Gateway │ Teams API  │ Dashboard   │
└───────────────┴───────────────┴────────────┴─────────────┘
```

## Implementation Details

### 1. Report Engine (Azure Functions)

The report generation engine runs as scheduled Azure Functions:

```javascript
// reportGenerator/index.js
module.exports = async function (context, myTimer) {
  const today = new Date();
  context.log(`Report Generator triggered at ${today.toISOString()}`);
  
  try {
    // Identify which reports to generate based on schedule
    const reportsToGenerate = identifyScheduledReports(today);
    context.log(`Generating ${reportsToGenerate.length} reports`);
    
    // Process each report
    const generatedReports = [];
    for (const report of reportsToGenerate) {
      context.log(`Processing report: ${report.type} for ${report.scope}`);
      
      // Fetch data for report
      const reportData = await fetchReportData(report);
      
      // Apply report template
      const renderedReport = await renderReport(report, reportData);
      
      // Save report to storage
      const reportUrl = await saveReport(renderedReport, report);
      
      // Add to delivery queue
      generatedReports.push({
        id: report.id,
        type: report.type,
        scope: report.scope,
        recipients: report.recipients,
        url: reportUrl,
        format: report.format,
        timestamp: today.toISOString()
      });
    }
    
    // Queue reports for delivery
    await queueReportsForDelivery(generatedReports);
    
    context.log(`Successfully queued ${generatedReports.length} reports for delivery`);
  } catch (error) {
    context.log.error(`Error generating reports: ${error.message}`);
    throw error;
  }
};
```

### 2. Report Templates

Templates are stored in Blob storage and use a combination of HTML, Handlebars, and Office JS for different report formats:

#### HTML Email Report Template

```html
<!-- templates/store-performance-email.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4A6FFF; color: white; padding: 20px; text-align: center; }
    .metric-card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 10px 0; }
    .metric-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
    .metric-value { font-size: 24px; font-weight: bold; }
    .metric-trend { font-size: 14px; }
    .trend-up { color: green; }
    .trend-down { color: red; }
    .action-item { background-color: #f9f9f9; padding: 10px; margin-top: 5px; border-left: 4px solid #4A6FFF; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Store Performance Report</h1>
    <p>{{storeInfo.name}} | {{formatDate reportDate "MMMM D, YYYY"}}</p>
  </div>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>{{summary}}</p>
  </div>
  
  <div class="metrics">
    <h2>Key Metrics</h2>
    
    {{#each metrics}}
    <div class="metric-card">
      <div class="metric-title">{{this.name}}</div>
      <div class="metric-value">{{this.value}}{{#if this.unit}} {{this.unit}}{{/if}}</div>
      <div class="metric-trend {{#if this.isPositive}}trend-up{{else}}trend-down{{/if}}">
        {{#if this.isPositive}}▲{{else}}▼{{/if}} {{this.change}}% vs previous period
      </div>
      {{#if this.insight}}
      <div class="action-item">
        {{this.insight}}
      </div>
      {{/if}}
    </div>
    {{/each}}
  </div>
  
  <div class="top-brands">
    <h2>Brand Performance</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="text-align: left; padding: 8px;">Brand</th>
          <th style="text-align: right; padding: 8px;">Share of Shelf</th>
          <th style="text-align: right; padding: 8px;">Availability</th>
          <th style="text-align: right; padding: 8px;">Trend</th>
        </tr>
      </thead>
      <tbody>
        {{#each brands}}
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;">{{this.name}}</td>
          <td style="text-align: right; padding: 8px;">{{this.shareOfShelf}}%</td>
          <td style="text-align: right; padding: 8px;">{{this.availability}}%</td>
          <td style="text-align: right; padding: 8px;" class="{{#if this.isPositive}}trend-up{{else}}trend-down{{/if}}">
            {{#if this.isPositive}}▲{{else}}▼{{/if}} {{this.change}}%
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  
  <div class="action-recommendations">
    <h2>Recommended Actions</h2>
    <ol>
      {{#each actions}}
      <li>
        <strong>{{this.title}}</strong>
        <p>{{this.description}}</p>
        {{#if this.priority}}
        <p><span style="color: {{priorityColor this.priority}};">Priority: {{this.priority}}</span></p>
        {{/if}}
      </li>
      {{/each}}
    </ol>
  </div>
  
  <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
    <p>This report was automatically generated based on data collected from multiple sources.</p>
    <p>Data freshness: {{dataFreshness}}</p>
    <p>View detailed interactive dashboard: <a href="{{dashboardUrl}}">Open Dashboard</a></p>
  </div>
</body>
</html>
```

### 3. Data Fetching Functions

```javascript
/**
 * Fetch data for report generation
 * @param {Object} report - Report configuration
 * @returns {Promise<Object>} - Report data
 */
async function fetchReportData(report) {
  const { type, scope, timeRange } = report;
  
  // Create a data client to access Gold layer
  const dataClient = createDataClient();
  
  // Base data object
  let data = {
    reportDate: new Date(),
    timeRange: timeRange || 'last7days',
    dataFreshness: await getDataFreshness()
  };
  
  // Fetch data based on report type
  switch (type) {
    case 'store-performance':
      // Add store info
      data.storeInfo = await getStoreInfo(scope.storeId);
      
      // Add key metrics
      data.metrics = await getStoreMetrics(scope.storeId, data.timeRange);
      
      // Add top brands in store
      data.brands = await getStoreBrands(scope.storeId, data.timeRange);
      
      // Generate summary
      data.summary = generateStoreSummary(data);
      
      // Generate action recommendations
      data.actions = generateStoreActions(data);
      
      // Add dashboard URL
      data.dashboardUrl = generateDashboardUrl('store', scope.storeId);
      break;
      
    case 'brand-performance':
      // Add brand info
      data.brandInfo = await getBrandInfo(scope.brandId);
      
      // Add brand metrics
      data.metrics = await getBrandMetrics(scope.brandId, data.timeRange);
      
      // Add store performance for this brand
      data.stores = await getBrandByStore(scope.brandId, data.timeRange);
      
      // Add competitor comparison
      data.competitors = await getCompetitorComparison(scope.brandId, data.timeRange);
      
      // Generate summary
      data.summary = generateBrandSummary(data);
      
      // Generate action recommendations
      data.actions = generateBrandActions(data);
      
      // Add dashboard URL
      data.dashboardUrl = generateDashboardUrl('brand', scope.brandId);
      break;
      
    // Additional report types...
  }
  
  return data;
}
```

### 4. Notification Gateway

The notification gateway handles delivering reports through various channels:

```javascript
// reportDelivery/index.js
module.exports = async function (context, queueItem) {
  context.log(`Processing report delivery: ${queueItem.id}`);
  
  try {
    const { id, type, recipients, url, format } = queueItem;
    
    // Load report content
    const reportContent = await loadReportContent(url);
    
    // Process each recipient
    for (const recipient of recipients) {
      context.log(`Delivering report ${id} to ${recipient.email}`);
      
      // Check delivery preferences
      const deliveryMethods = recipient.deliveryMethods || ['email'];
      
      // Deliver via each preferred method
      for (const method of deliveryMethods) {
        switch (method) {
          case 'email':
            await deliverViaEmail(recipient, reportContent, format, type);
            break;
            
          case 'sms':
            if (isUrgent(queueItem)) {
              await deliverViaSms(recipient, getSummary(reportContent), type);
            }
            break;
            
          case 'teams':
            await deliverViaTeams(recipient, reportContent, format, type);
            break;
            
          case 'dashboard':
            await deliverToDashboard(recipient, reportContent, type);
            break;
        }
      }
      
      // Log successful delivery
      context.log(`Successfully delivered report ${id} to ${recipient.email}`);
    }
    
    // Update delivery status
    await updateDeliveryStatus(id, 'delivered');
    
  } catch (error) {
    context.log.error(`Error delivering report: ${error.message}`);
    
    // Update delivery status
    await updateDeliveryStatus(queueItem.id, 'failed', error.message);
    
    throw error;
  }
};
```

### 5. Alert System

Critical alerts are processed separately from regular reports:

```javascript
// alertProcessor/index.js
module.exports = async function (context, myTimer) {
  context.log('Alert processor triggered');
  
  try {
    // Fetch latest proxy signals data
    const proxyData = await fetchLatestProxyData();
    
    // Check for alert conditions
    const alerts = detectAlertConditions(proxyData);
    
    if (alerts.length > 0) {
      context.log(`Detected ${alerts.length} alerts`);
      
      // Process each alert
      for (const alert of alerts) {
        // Determine alert recipients
        const recipients = determineAlertRecipients(alert);
        
        // Check if similar alert was recently sent
        if (await shouldSendAlert(alert)) {
          // Send alert notifications
          await sendAlertNotifications(alert, recipients);
          
          // Log alert
          await logAlert(alert, recipients);
          
          context.log(`Sent alert: ${alert.id} to ${recipients.length} recipients`);
        } else {
          context.log(`Suppressed duplicate alert: ${alert.id}`);
        }
      }
    } else {
      context.log('No alerts detected');
    }
  } catch (error) {
    context.log.error(`Error processing alerts: ${error.message}`);
    throw error;
  }
};

/**
 * Detect alert conditions from proxy data
 * @param {Object} proxyData - Latest proxy signals data
 * @returns {Array} - Detected alerts
 */
function detectAlertConditions(proxyData) {
  const alerts = [];
  
  // Check store-level inventory alerts
  for (const store of proxyData.stores) {
    // Check for critically low inventory
    for (const product of store.products) {
      if (product.availabilityScore < 25) {
        alerts.push({
          id: `inventory-${store.id}-${product.id}-${Date.now()}`,
          type: 'inventory',
          severity: product.availabilityScore < 10 ? 'critical' : 'warning',
          storeId: store.id,
          productId: product.id,
          productName: product.name,
          brandId: product.brandId,
          brandName: product.brandName,
          availabilityScore: product.availabilityScore,
          message: `${product.name} inventory critically low at ${store.name}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for competitor activity
    if (store.competitorActivityScore > 75) {
      alerts.push({
        id: `competitor-${store.id}-${Date.now()}`,
        type: 'competitor',
        severity: 'warning',
        storeId: store.id,
        competitorActivityScore: store.competitorActivityScore,
        competitors: store.topCompetitorChanges,
        message: `Unusual competitor activity detected at ${store.name}`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Check brand-level alerts
  for (const brand of proxyData.brands) {
    // Check for significant sentiment drops
    if (brand.sentimentChange < -15) {
      alerts.push({
        id: `sentiment-${brand.id}-${Date.now()}`,
        type: 'sentiment',
        severity: brand.sentimentChange < -25 ? 'critical' : 'warning',
        brandId: brand.id,
        brandName: brand.name,
        sentimentChange: brand.sentimentChange,
        message: `Significant sentiment drop detected for ${brand.name}`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return alerts;
}
```

## Report Scheduling System

The scheduling system determines which reports should be generated on a given day:

```javascript
/**
 * Identify which reports should be generated based on the current date
 * @param {Date} today - Current date
 * @returns {Array} - Reports to be generated
 */
function identifyScheduledReports(today) {
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = today.getDate(); // 1-31
  
  const reportsToGenerate = [];
  
  // Get all report definitions
  const allReports = getAllReportDefinitions();
  
  // Filter reports based on schedule
  for (const report of allReports) {
    const { id, type, scope, schedule, recipients, format } = report;
    
    let shouldGenerate = false;
    
    switch (schedule.frequency) {
      case 'daily':
        // Generate every day
        shouldGenerate = true;
        break;
        
      case 'weekly':
        // Generate on specified day of week
        shouldGenerate = dayOfWeek === schedule.dayOfWeek;
        break;
        
      case 'monthly':
        // Generate on specified day of month
        shouldGenerate = dayOfMonth === schedule.dayOfMonth;
        break;
        
      case 'custom':
        // Custom schedule evaluation
        shouldGenerate = evaluateCustomSchedule(schedule, today);
        break;
    }
    
    if (shouldGenerate) {
      reportsToGenerate.push({
        id,
        type,
        scope,
        recipients,
        format: format || 'html',
        timeRange: schedule.timeRange || 'last7days'
      });
    }
  }
  
  return reportsToGenerate;
}
```

## Mobile App Notifications

For mobile app users, notifications are delivered through a push notification system:

```javascript
/**
 * Send push notification for alert or report
 * @param {Object} notification - Notification details
 * @param {Array} recipients - Recipient user IDs
 */
async function sendPushNotification(notification, recipients) {
  // Create notification hub client
  const notificationHubService = createNotificationHubService();
  
  // Prepare notification payload
  const payload = {
    notification: {
      title: notification.title,
      body: notification.message
    },
    data: {
      type: notification.type,
      id: notification.id,
      deepLink: notification.deepLink
    }
  };
  
  // Send to each recipient
  for (const userId of recipients) {
    try {
      // Get user's devices
      const userDevices = await getUserDevices(userId);
      
      // Send to each device
      for (const device of userDevices) {
        await notificationHubService.send(
          device.handle,
          payload,
          (error) => {
            if (error) {
              console.error(`Error sending notification to device ${device.id}: ${error}`);
            } else {
              console.log(`Notification sent to device ${device.id}`);
            }
          }
        );
      }
    } catch (error) {
      console.error(`Error sending notification to user ${userId}: ${error.message}`);
    }
  }
}
```

## Report Templates Library

The system includes templates for various report formats:

1. **HTML Email Templates**
   - Store Performance Report
   - Brand Performance Report
   - Executive Summary
   - Competitive Intelligence
   - Inventory Status

2. **PowerPoint Templates**
   - Executive Dashboard
   - Market Analysis
   - Brand Performance Review
   - Strategic Recommendations

3. **PDF Templates**
   - Detailed Store Analysis
   - Brand Health Report
   - Competitive Landscape
   - Share of Shelf Analysis

## Implementation Roadmap

### Phase 1: Core Reporting (Weeks 1-4)
- Deploy report generation engine
- Implement basic HTML email templates
- Create simple notification delivery

### Phase 2: Advanced Reports (Weeks 5-8)
- Add PowerPoint report generation
- Implement PDF report generation
- Create executive dashboard templates

### Phase 3: Alert System (Weeks 9-12)
- Implement real-time alert detection
- Create SMS notification gateway
- Add Teams integration

### Phase 4: Mobile Integration (Weeks 13-16)
- Implement push notification system
- Create mobile app report viewer
- Add interactive charts in reports

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Report Delivery Rate | >99.5% | Delivery confirmation logs |
| Report Open Rate | >60% | Email tracking pixels |
| Alert Response Time | <30 min | Time from alert to action |
| User Satisfaction | >8/10 | In-app feedback survey |
| Report Generation Time | <2 min | Function execution logs |
| System Uptime | >99.9% | Azure monitoring |

---

This document provides the blueprint for implementing a comprehensive automated reporting and notification system that leverages the proxy signals data to deliver actionable insights to stakeholders.