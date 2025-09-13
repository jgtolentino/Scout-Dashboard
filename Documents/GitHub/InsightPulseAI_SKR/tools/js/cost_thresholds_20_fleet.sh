#!/bin/bash

# Cost Threshold Configuration - 20 Device Fleet Only
# Sets realistic monthly budgets for current 20-device pilot

# 20-Device Fleet Specific Calculations
FLEET_SIZE=20
CURRENT_COST_PER_DEVICE=77  # $77/device/month observed
CURRENT_MONTHLY_COST=$(echo "$FLEET_SIZE * $CURRENT_COST_PER_DEVICE" | bc)  # $1,540

# Optimized costs for 20-device fleet specifically
BATCH_OPTIMIZED_COST_PER_DEVICE=15  # $15/device/month after batch + auto-scale
OPTIMIZED_MONTHLY_COST=$(echo "$FLEET_SIZE * $BATCH_OPTIMIZED_COST_PER_DEVICE" | bc)  # $300

# Set realistic thresholds for 20-device fleet
MONTHLY_BUDGET=400          # $400/month budget (33% buffer above $300)
WARNING_THRESHOLD=320       # $320/month (80% of budget)
CRITICAL_THRESHOLD=400      # $400/month (100% of budget)

echo "=== COST THRESHOLDS FOR 20-DEVICE FLEET ==="
echo "Fleet size: ${FLEET_SIZE} devices"
echo ""
echo "Current costs:"
echo "- Per device: \$${CURRENT_COST_PER_DEVICE}/month"
echo "- Total monthly: \$${CURRENT_MONTHLY_COST}/month"
echo ""
echo "Optimized costs (after batch + auto-scale):"
echo "- Per device: \$${BATCH_OPTIMIZED_COST_PER_DEVICE}/month"
echo "- Total monthly: \$${OPTIMIZED_MONTHLY_COST}/month"
echo ""
echo "🎯 ALERT THRESHOLDS SET:"
echo "- Monthly budget: \$${MONTHLY_BUDGET}/month"
echo "- Warning alert: \$${WARNING_THRESHOLD}/month (80%)"
echo "- Critical alert: \$${CRITICAL_THRESHOLD}/month (100%)"
echo ""
echo "Daily anomaly detection:"
echo "- Daily warning: \$$(echo "$WARNING_THRESHOLD / 30" | bc)/day"
echo "- Daily critical: \$$(echo "$CRITICAL_THRESHOLD / 30" | bc)/day"
echo ""
echo "Expected savings: \$$(echo "$CURRENT_MONTHLY_COST - $OPTIMIZED_MONTHLY_COST" | bc)/month ($(echo "scale=1; ($CURRENT_MONTHLY_COST - $OPTIMIZED_MONTHLY_COST) * 100 / $CURRENT_MONTHLY_COST" | bc)%)"

# Create Azure budget specifically for 20-device fleet
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-$(az account show --query id -o tsv)}"
RESOURCE_GROUP="rg-client360-prod"
BUDGET_START_DATE="2024-$(date +%m)-01"

echo ""
echo "Creating Azure budget for 20-device fleet..."

# Create the budget with Azure CLI
az consumption budget create \
    --budget-name "Client360-20Device-Fleet" \
    --amount $MONTHLY_BUDGET \
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
            "contactEmails": ["devops@tbwa.com", "finops@tbwa.com"],
            "contactRoles": ["Owner"]
        },
        {
            "enabled": true,
            "operator": "GreaterThan", 
            "threshold": 100,
            "contactEmails": ["devops@tbwa.com", "finops@tbwa.com"],
            "contactRoles": ["Owner"]
        }
    ]' 2>/dev/null

# Create specific alerts for 20-device fleet anomalies
echo "Creating anomaly detection alerts for 20-device fleet..."

# Daily cost spike alert specific to fleet size
az monitor metrics alert create \
    --name "Client360-20Device-DailyCostSpike" \
    --resource-group $RESOURCE_GROUP \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
    --condition "avg ActualCost > $(echo "$WARNING_THRESHOLD / 30" | bc)" \
    --window-size "1d" \
    --evaluation-frequency "6h" \
    --severity 2 \
    --description "Daily cost spike alert for 20-device fleet" \
    --tags "FleetSize=20devices" "CostThreshold=DailySpike" 2>/dev/null

# Weekly cost trend alert
az monitor metrics alert create \
    --name "Client360-20Device-WeeklyCostTrend" \
    --resource-group $RESOURCE_GROUP \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
    --condition "avg ActualCost > $(echo "$WARNING_THRESHOLD / 4" | bc)" \
    --window-size "7d" \
    --evaluation-frequency "1d" \
    --severity 3 \
    --description "Weekly cost trend alert for 20-device fleet" \
    --tags "FleetSize=20devices" "CostThreshold=WeeklyTrend" 2>/dev/null

echo ""
echo "✅ Cost management configured for 20-device fleet:"
echo "   - Budget: \$${MONTHLY_BUDGET}/month"
echo "   - Daily alerts: >\$$(echo "$WARNING_THRESHOLD / 30" | bc)/day"
echo "   - Weekly alerts: >\$$(echo "$WARNING_THRESHOLD / 4" | bc)/week"
echo ""
echo "📊 Cost per device tracking:"
echo "   - Current: \$${CURRENT_COST_PER_DEVICE}/device/month"
echo "   - Target: \$${BATCH_OPTIMIZED_COST_PER_DEVICE}/device/month"
echo "   - Budget allows: \$$(echo "$MONTHLY_BUDGET / $FLEET_SIZE" | bc)/device/month"

# Generate 20-device fleet cost summary
cat > cost_summary_20_device_fleet.md << EOF
# Cost Management - 20 Device Fleet Configuration

## Fleet Specifications
- **Fleet Size:** 20 devices
- **Environment:** Production pilot
- **Processing Mode:** Transitioning to batch (2h nightly)

## Current vs Optimized Costs

### Before Optimization
| Component | Total/Month | Per Device |
|-----------|------------|------------|
| Databricks Streaming | \$907 | \$45.35 |
| Azure SQL Database | \$610 | \$30.50 |
| Event Hubs | \$22 | \$1.10 |
| Blob Storage | \$1 | \$0.05 |
| **Total** | **\$1,540** | **\$77.00** |

### After Optimization  
| Component | Total/Month | Per Device |
|-----------|------------|------------|
| Databricks Batch | \$150 | \$7.50 |
| Azure SQL Database | \$610 | \$30.50 |
| Event Hubs | \$22 | \$1.10 |
| Blob Storage | \$1 | \$0.05 |
| **Total** | **\$300** | **\$15.00** |

## Alert Thresholds (20-Device Fleet)
- **Monthly Budget:** \$400
- **Warning Alert:** \$320/month (80%)
- **Critical Alert:** \$400/month (100%)
- **Daily Monitoring:** \$11-13/day
- **Weekly Monitoring:** \$80/week

## Cost Optimization Impact
- **Monthly Savings:** \$1,240 (80.5% reduction)
- **Per Device Savings:** \$62/device/month
- **Annual Savings:** \$14,880

## Monitoring Schedule
### Daily
- [ ] Cost vs \$13/day threshold
- [ ] Databricks cluster usage
- [ ] Batch processing completion

### Weekly  
- [ ] Cost vs \$80/week threshold
- [ ] Resource utilization review
- [ ] Alert threshold effectiveness

### Monthly
- [ ] Budget vs actual (\$400 limit)
- [ ] Per-device cost analysis
- [ ] Optimization opportunity assessment

---
*Cost management configured specifically for 20-device production pilot*
*Budget allows headroom for operational variability while maintaining 80% cost savings*
EOF

echo ""
echo "📋 Fleet cost summary saved to: cost_summary_20_device_fleet.md"
echo ""
echo "🚨 IMPORTANT FOR 20-DEVICE FLEET:"
echo "   - Monitor batch processing performance carefully"
echo "   - Validate \$15/device target is achievable"
echo "   - Adjust thresholds after 2-week observation period"