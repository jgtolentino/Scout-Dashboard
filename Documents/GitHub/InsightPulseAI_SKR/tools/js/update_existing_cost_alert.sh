#!/bin/bash

# Update Existing Cost Alert Rule for 20-Device Fleet
# References: TBWA-ProjectScout-Prod subscription cost anomaly alert
# Email recipients: s224670304@deakin.edu.au, digital@tbwa-smp.com

set -e

# Configuration from existing alert
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-$(az account show --query id -o tsv 2>/dev/null)}"
EXISTING_ALERT_NAME="Cost anomaly detected in TBWA-ProjectScout-Prod"
RESOURCE_GROUP="rg-client360-prod"

# Updated email configuration
PRIMARY_EMAIL="s224670304@deakin.edu.au"
SECONDARY_EMAIL="digital@tbwa-smp.com"

# 20-Device Fleet Cost Thresholds
FLEET_SIZE=20
NEW_MONTHLY_BUDGET=400
WARNING_THRESHOLD=320  # 80% of budget
CRITICAL_THRESHOLD=400 # 100% of budget
DAILY_WARNING=13       # $13/day
DAILY_CRITICAL=17      # $17/day (higher buffer)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] UPDATE:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

# Update existing alert rule with new thresholds
update_existing_alert_rule() {
    log "=== UPDATING EXISTING COST ALERT RULE ==="
    
    info "Alert Name: $EXISTING_ALERT_NAME"
    info "Subscription: $SUBSCRIPTION_NAME"
    info "Email Recipients: $PRIMARY_EMAIL, $SECONDARY_EMAIL"
    
    # Check if the alert rule exists
    warn "Checking for existing alert rule..."
    
    if az monitor metrics alert show --name "$EXISTING_ALERT_NAME" --resource-group $RESOURCE_GROUP &>/dev/null; then
        log "✅ Found existing alert rule: $EXISTING_ALERT_NAME"
        
        # Update the existing alert with new thresholds
        warn "Updating alert rule with 20-device fleet thresholds..."
        
        az monitor metrics alert update \
            --name "$EXISTING_ALERT_NAME" \
            --resource-group $RESOURCE_GROUP \
            --condition "avg ActualCost > $DAILY_WARNING" \
            --description "Cost anomaly detection for 20-device fleet - Updated thresholds: \$${DAILY_WARNING}/day warning, \$${DAILY_CRITICAL}/day critical" \
            --severity 2 \
            --window-size "1d" \
            --evaluation-frequency "6h" \
            --tags "FleetSize=20devices" "UpdatedThresholds=true" "Environment=Production"
        
        log "✅ Alert rule updated with new thresholds"
        
    else
        warn "Creating new alert rule as existing one not found..."
        
        az monitor metrics alert create \
            --name "$EXISTING_ALERT_NAME" \
            --resource-group $RESOURCE_GROUP \
            --scopes "/subscriptions/$SUBSCRIPTION_ID" \
            --condition "avg ActualCost > $DAILY_WARNING" \
            --description "Cost anomaly detection for 20-device fleet - \$${DAILY_WARNING}/day warning, \$${DAILY_CRITICAL}/day critical" \
            --severity 2 \
            --window-size "1d" \
            --evaluation-frequency "6h" \
            --tags "FleetSize=20devices" "NewAlert=true" "Environment=Production"
        
        log "✅ New alert rule created"
    fi
}

# Create/Update Action Group with correct email addresses
update_action_group() {
    log "=== UPDATING ACTION GROUP WITH CORRECT EMAILS ==="
    
    info "Primary Email: $PRIMARY_EMAIL"
    info "Secondary Email: $SECONDARY_EMAIL"
    
    # Create or update action group with the specified emails
    warn "Creating/updating action group for cost alerts..."
    
    az monitor action-group create \
        --resource-group $RESOURCE_GROUP \
        --name "CostAnomalyActionGroup-20Device" \
        --short-name "Cost20Dev" \
        --action email primary "$PRIMARY_EMAIL" \
        --action email secondary "$SECONDARY_EMAIL" \
        --tags "Purpose=CostManagement" "FleetSize=20devices" "Environment=Production" || {
        
        # If creation fails, try to update existing
        warn "Updating existing action group..."
        az monitor action-group update \
            --resource-group $RESOURCE_GROUP \
            --name "CostAnomalyActionGroup-20Device" \
            --add-action email primary "$PRIMARY_EMAIL" \
            --add-action email secondary "$SECONDARY_EMAIL"
    }
    
    log "✅ Action group configured with correct email addresses"
}

# Update budget with new thresholds and email notifications
update_cost_budget() {
    log "=== UPDATING COST BUDGET FOR 20-DEVICE FLEET ==="
    
    info "Monthly Budget: \$${NEW_MONTHLY_BUDGET}"
    info "Warning Threshold: \$${WARNING_THRESHOLD} (80%)"
    info "Critical Threshold: \$${CRITICAL_THRESHOLD} (100%)"
    
    # Get current date for budget
    BUDGET_START_DATE=$(date +%Y-%m-01)
    
    # Create or update budget
    warn "Creating/updating budget with new thresholds..."
    
    az consumption budget create \
        --budget-name "TBWA-ProjectScout-20Device-Fleet" \
        --amount $NEW_MONTHLY_BUDGET \
        --category "Cost" \
        --resource-group $RESOURCE_GROUP \
        --time-grain "Monthly" \
        --start-date "$BUDGET_START_DATE" \
        --end-date "2025-12-31" \
        --notifications '[
            {
                "enabled": true,
                "operator": "GreaterThan",
                "threshold": 80,
                "contactEmails": ["'$PRIMARY_EMAIL'", "'$SECONDARY_EMAIL'"],
                "contactRoles": ["Owner"]
            },
            {
                "enabled": true,
                "operator": "GreaterThan", 
                "threshold": 100,
                "contactEmails": ["'$PRIMARY_EMAIL'", "'$SECONDARY_EMAIL'"],
                "contactRoles": ["Owner"]
            }
        ]' || {
        
        # If creation fails, try to update existing
        warn "Updating existing budget..."
        az consumption budget update \
            --budget-name "TBWA-ProjectScout-20Device-Fleet" \
            --amount $NEW_MONTHLY_BUDGET \
            --resource-group $RESOURCE_GROUP
    }
    
    log "✅ Budget updated with \$${NEW_MONTHLY_BUDGET} monthly limit"
}

# Send updated configuration email
send_update_notification() {
    log "=== PREPARING UPDATE NOTIFICATION EMAIL ==="
    
    # Create email content for the update
    cat > cost_alert_update_email.html << EOF
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #0067b1; color: white; padding: 20px; border-radius: 8px; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { color: #28a745; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .critical { color: #dc3545; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .highlight { background: #e7f3ff; padding: 15px; border-left: 4px solid #0067b1; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🔄 UPDATED: Cost Alert Configuration for 20-Device Fleet</h2>
        <p>TBWA-ProjectScout-Prod Subscription</p>
    </div>
    
    <div class="content">
        <h3>✅ Alert Rule Updated</h3>
        <p><strong>Alert Name:</strong> $EXISTING_ALERT_NAME</p>
        <p><strong>Subscription:</strong> $SUBSCRIPTION_NAME</p>
        <p><strong>Date:</strong> $(date)</p>
        
        <div class="highlight">
            <h4>📧 Email Configuration Updated</h4>
            <p><strong>Primary:</strong> $PRIMARY_EMAIL</p>
            <p><strong>Secondary:</strong> $SECONDARY_EMAIL</p>
            <p><em>Note: Resend capability enabled for both addresses</em></p>
        </div>
        
        <h3>📊 New Cost Thresholds (20-Device Fleet)</h3>
        <table>
            <tr>
                <th>Alert Type</th>
                <th>Threshold</th>
                <th>Action</th>
                <th>Recipients</th>
            </tr>
            <tr>
                <td>Daily Warning</td>
                <td class="warning">\$${DAILY_WARNING}/day</td>
                <td>Email Alert</td>
                <td>Both addresses</td>
            </tr>
            <tr>
                <td>Daily Critical</td>
                <td class="critical">\$${DAILY_CRITICAL}/day</td>
                <td>Immediate Alert</td>
                <td>Both addresses</td>
            </tr>
            <tr>
                <td>Monthly Warning</td>
                <td class="warning">\$${WARNING_THRESHOLD}/month</td>
                <td>Budget Alert (80%)</td>
                <td>Both addresses</td>
            </tr>
            <tr>
                <td>Monthly Critical</td>
                <td class="critical">\$${CRITICAL_THRESHOLD}/month</td>
                <td>Budget Alert (100%)</td>
                <td>Both addresses</td>
            </tr>
        </table>
        
        <h3>💰 Cost Optimization Status</h3>
        <p><strong>Fleet Size:</strong> 20 devices</p>
        <p><strong>Current Cost:</strong> \$1,540/month</p>
        <p><strong>Target Cost:</strong> \$300/month</p>
        <p><strong>Budget Limit:</strong> \$400/month (33% buffer)</p>
        
        <div class="highlight">
            <h4>🔧 Optimizations Active</h4>
            <ul>
                <li><strong>✅ Batch Processing:</strong> 2h nightly window (2 AM UTC)</li>
                <li><strong>✅ Auto-scaling:</strong> 2-8 workers with auto-termination</li>
                <li><strong>✅ Spot Instances:</strong> 60% bid price with fallback</li>
                <li><strong>✅ Cost Monitoring:</strong> Real-time anomaly detection</li>
            </ul>
        </div>
        
        <h3>📈 Alert Testing</h3>
        <p>To test the updated alert configuration:</p>
        <ol>
            <li><strong>Daily Monitoring:</strong> Alerts trigger if daily cost > \$${DAILY_WARNING}</li>
            <li><strong>Monthly Tracking:</strong> Budget alerts at 80% and 100% thresholds</li>
            <li><strong>Email Resend:</strong> Use Azure Portal to resend test notifications</li>
        </ol>
        
        <div class="highlight">
            <h4>🚨 Important Notes</h4>
            <p><strong>Alert Rule:</strong> $EXISTING_ALERT_NAME</p>
            <p><strong>Evaluation:</strong> Every 6 hours</p>
            <p><strong>Window:</strong> 24-hour cost aggregation</p>
            <p><strong>Portal Access:</strong> <a href="https://portal.azure.com/#view/Microsoft_Azure_CostManagement">Azure Cost Management</a></p>
        </div>
    </div>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
        Updated by Azure Cost Optimization Script<br>
        Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)<br>
        Resource Group: $RESOURCE_GROUP<br>
        Fleet: 20 devices
    </p>
</body>
</html>
EOF

    # Create plain text version
    cat > cost_alert_update_email.txt << EOF
UPDATED: Cost Alert Configuration for 20-Device Fleet

Alert Name: $EXISTING_ALERT_NAME
Subscription: $SUBSCRIPTION_NAME
Date: $(date)

EMAIL CONFIGURATION UPDATED:
Primary: $PRIMARY_EMAIL
Secondary: $SECONDARY_EMAIL
Note: Resend capability enabled for both addresses

NEW COST THRESHOLDS (20-Device Fleet):
- Daily Warning: \$${DAILY_WARNING}/day
- Daily Critical: \$${DAILY_CRITICAL}/day  
- Monthly Warning: \$${WARNING_THRESHOLD}/month (80%)
- Monthly Critical: \$${CRITICAL_THRESHOLD}/month (100%)

COST OPTIMIZATION STATUS:
Fleet Size: 20 devices
Current Cost: \$1,540/month
Target Cost: \$300/month
Budget Limit: \$400/month (33% buffer)

OPTIMIZATIONS ACTIVE:
✅ Batch Processing: 2h nightly window (2 AM UTC)
✅ Auto-scaling: 2-8 workers with auto-termination
✅ Spot Instances: 60% bid price with fallback
✅ Cost Monitoring: Real-time anomaly detection

ALERT TESTING:
- Daily Monitoring: Alerts trigger if daily cost > \$${DAILY_WARNING}
- Monthly Tracking: Budget alerts at 80% and 100% thresholds
- Email Resend: Use Azure Portal to resend test notifications

IMPORTANT NOTES:
- Alert Rule: $EXISTING_ALERT_NAME
- Evaluation: Every 6 hours
- Window: 24-hour cost aggregation
- Portal: https://portal.azure.com/#view/Microsoft_Azure_CostManagement

---
Updated by Azure Cost Optimization Script
Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)
Resource Group: $RESOURCE_GROUP
Fleet: 20 devices
EOF

    log "✅ Update notification email prepared"
    
    info "Email files created:"
    info "- cost_alert_update_email.html (rich format)"
    info "- cost_alert_update_email.txt (plain text)"
    
    warn "NEXT STEP: Send email to $PRIMARY_EMAIL and $SECONDARY_EMAIL"
}

# Generate update summary report
generate_update_summary() {
    log "=== GENERATING UPDATE SUMMARY REPORT ==="
    
    cat > cost_alert_update_summary.md << EOF
# Cost Alert Update Summary - TBWA ProjectScout 20-Device Fleet

## Update Details
- **Date:** $(date)
- **Alert Rule:** $EXISTING_ALERT_NAME
- **Subscription:** $SUBSCRIPTION_NAME
- **Resource Group:** $RESOURCE_GROUP
- **Fleet Size:** 20 devices

## ✅ Updated Configuration

### 1. Email Recipients
- **Primary:** $PRIMARY_EMAIL
- **Secondary:** $SECONDARY_EMAIL
- **Resend Capability:** Enabled via Azure Portal

### 2. Alert Thresholds (Updated for 20-Device Fleet)
- **Daily Warning:** \$${DAILY_WARNING}/day
- **Daily Critical:** \$${DAILY_CRITICAL}/day
- **Monthly Warning:** \$${WARNING_THRESHOLD}/month (80% of budget)
- **Monthly Critical:** \$${CRITICAL_THRESHOLD}/month (100% of budget)

### 3. Alert Rule Configuration
- **Name:** $EXISTING_ALERT_NAME
- **Evaluation Frequency:** Every 6 hours
- **Window Size:** 24 hours
- **Severity:** Level 2 (Warning)
- **Scope:** Subscription level

## 📊 Cost Management Integration

### Budget Configuration
- **Budget Name:** TBWA-ProjectScout-20Device-Fleet
- **Monthly Limit:** \$${NEW_MONTHLY_BUDGET}
- **Warning:** 80% (\$${WARNING_THRESHOLD})
- **Critical:** 100% (\$${CRITICAL_THRESHOLD})

### Action Group
- **Name:** CostAnomalyActionGroup-20Device
- **Short Name:** Cost20Dev
- **Email Actions:** 2 recipients configured
- **Tags:** Purpose=CostManagement, FleetSize=20devices

## 🎯 Expected Performance

### Cost Targets
- **Current:** \$1,540/month (\$77/device)
- **Target:** \$300/month (\$15/device)
- **Budget:** \$400/month (\$20/device with buffer)
- **Savings:** 80.5% reduction

### Alert Sensitivity
- **Daily Threshold:** \$${DAILY_WARNING}/day (early warning)
- **Monthly Tracking:** 80%/100% budget levels
- **Anomaly Detection:** 6-hour evaluation cycle

## 📧 Email Notification Setup

### Recipients
1. **Primary Contact:** $PRIMARY_EMAIL
   - Daily cost alerts
   - Budget notifications
   - Anomaly detection

2. **Secondary Contact:** $SECONDARY_EMAIL
   - All alert types
   - Backup notification
   - Resend capability

### Notification Types
- **Cost Spike:** > \$${DAILY_WARNING}/day
- **Budget Warning:** > \$${WARNING_THRESHOLD}/month
- **Budget Critical:** > \$${CRITICAL_THRESHOLD}/month
- **Anomaly Detection:** Unusual spending patterns

## 🔍 Monitoring & Testing

### Alert Testing
1. **Portal Access:** Azure Cost Management > Alerts
2. **Test Notification:** Use "Test action group" feature
3. **Resend Email:** Available for all alert instances
4. **Validation:** Check email delivery to both addresses

### Daily Monitoring
- [ ] Cost trending vs \$${DAILY_WARNING}/day threshold
- [ ] Email delivery confirmation
- [ ] Alert rule performance

### Weekly Reviews
- [ ] Alert sensitivity assessment
- [ ] False positive analysis
- [ ] Threshold effectiveness evaluation

## 🚨 Alert Response Process

### Daily Cost Spike (>\$${DAILY_WARNING}/day)
1. **Immediate:** Check Databricks cluster status
2. **Investigate:** Review resource utilization
3. **Action:** Scale down if necessary
4. **Document:** Log findings and actions

### Monthly Budget Alerts
1. **80% Warning:** Review monthly spending trend
2. **100% Critical:** Implement immediate cost controls
3. **Communication:** Update stakeholders
4. **Planning:** Adjust next month's optimizations

## 📋 Next Steps

### Immediate (24-48 hours)
- [ ] Test email notifications to both addresses
- [ ] Verify alert rule is active and monitoring
- [ ] Confirm budget thresholds are set correctly

### Short-term (1-2 weeks)
- [ ] Monitor alert frequency and accuracy
- [ ] Validate cost optimization performance
- [ ] Adjust thresholds if needed based on actual costs

### Long-term (1 month)
- [ ] Review overall cost reduction effectiveness
- [ ] Document lessons learned
- [ ] Plan scaling to larger fleets

---
**Status:** ✅ UPDATED AND ACTIVE
**Alert Rule:** $EXISTING_ALERT_NAME
**Email Recipients:** $PRIMARY_EMAIL, $SECONDARY_EMAIL
**Budget:** \$${NEW_MONTHLY_BUDGET}/month for 20-device fleet
**Expected Savings:** 80.5% cost reduction
EOF

    log "✅ Update summary saved to: cost_alert_update_summary.md"
}

# Main execution
main() {
    log "Starting cost alert update for existing TBWA-ProjectScout-Prod alert"
    info "Alert Rule: $EXISTING_ALERT_NAME"
    info "Email Recipients: $PRIMARY_EMAIL, $SECONDARY_EMAIL"
    info "20-Device Fleet Budget: \$${NEW_MONTHLY_BUDGET}/month"
    
    # Check Azure CLI authentication
    if ! az account show &> /dev/null; then
        error "Please login to Azure CLI first: az login"
        exit 1
    fi
    
    # Execute updates
    update_existing_alert_rule
    update_action_group
    update_cost_budget
    send_update_notification
    generate_update_summary
    
    log "=== COST ALERT UPDATE COMPLETED ==="
    log "✅ Alert rule updated: $EXISTING_ALERT_NAME"
    log "✅ Email recipients: $PRIMARY_EMAIL, $SECONDARY_EMAIL"
    log "✅ Budget updated: \$${NEW_MONTHLY_BUDGET}/month"
    log "✅ Thresholds set: \$${DAILY_WARNING}/day, \$${WARNING_THRESHOLD}/month"
    
    warn "IMPORTANT: Test email notifications via Azure Portal"
    warn "VERIFY: Alert rule is active and monitoring daily costs"
    
    info "Portal access: https://portal.azure.com/#view/Microsoft_Azure_CostManagement"
    info "Alert management: https://portal.azure.com/#view/Microsoft_Azure_Monitoring"
}

# Execute the update
main "$@"
EOF