#!/bin/bash

# Realistic Cost Threshold Configuration
# Sets more practical monthly budgets and anomaly detection

# Updated realistic projections
CURRENT_MONTHLY_COST=1540
REALISTIC_BATCH_SAVINGS=0.75    # 75% savings (more conservative)
REALISTIC_DATABRICKS_SAVINGS=0.50  # 50% savings (more conservative)

# Calculate realistic thresholds
REALISTIC_PROJECTED_COST=$(echo "$CURRENT_MONTHLY_COST * (1 - $REALISTIC_BATCH_SAVINGS) * (1 - $REALISTIC_DATABRICKS_SAVINGS)" | bc -l)
MONTHLY_BUDGET=$(echo "$REALISTIC_PROJECTED_COST * 1.5" | bc -l | cut -d. -f1)  # 50% buffer
WARNING_THRESHOLD=$(echo "$MONTHLY_BUDGET * 0.8" | bc -l | cut -d. -f1)         # 80% of budget
CRITICAL_THRESHOLD=$MONTHLY_BUDGET

echo "=== REALISTIC COST THRESHOLD CONFIGURATION ==="
echo "Current monthly cost: \$${CURRENT_MONTHLY_COST}"
echo "Realistic projected cost: \$$(printf '%.0f' $REALISTIC_PROJECTED_COST)"
echo "Monthly budget (with buffer): \$${MONTHLY_BUDGET}"
echo "Warning threshold (80%): \$${WARNING_THRESHOLD}"
echo "Critical threshold (100%): \$${CRITICAL_THRESHOLD}"
echo ""
echo "Daily anomaly detection:"
echo "- Daily warning: \$$(echo "$WARNING_THRESHOLD / 30" | bc -l | cut -d. -f1)"
echo "- Daily critical: \$$(echo "$CRITICAL_THRESHOLD / 30" | bc -l | cut -d. -f1)"

# Update Azure budget with realistic thresholds
az consumption budget create \
    --budget-name "Client360-RealisticBudget" \
    --amount $MONTHLY_BUDGET \
    --category "Cost" \
    --resource-group "rg-client360-prod" \
    --time-grain "Monthly" \
    --start-date "$(date -d "$(date +%Y-%m-01) +1 month" +%Y-%m-%d)" \
    --end-date "2025-12-31" \
    --notifications '[
        {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 80,
            "contactEmails": ["devops@tbwa.com", "finops@tbwa.com"]
        },
        {
            "enabled": true,
            "operator": "GreaterThan", 
            "threshold": 100,
            "contactEmails": ["devops@tbwa.com", "finops@tbwa.com"]
        }
    ]'

echo "✅ Realistic cost budget created: \$${MONTHLY_BUDGET}/month"
echo "✅ Warning alerts at: \$${WARNING_THRESHOLD}/month"
echo "✅ Critical alerts at: \$${CRITICAL_THRESHOLD}/month"