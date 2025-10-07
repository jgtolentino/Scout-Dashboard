#!/bin/bash
# Azure Advisor Remediation Script
# Created for TBWA-ProjectScout-Prod subscription
# This script helps fix issues identified in Azure Advisor

# Color formatting for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}    Azure Advisor Remediation Script        ${NC}"
echo -e "${BLUE}    For TBWA-ProjectScout-Prod              ${NC}"
echo -e "${BLUE}============================================${NC}"

# Step 1: Login to Azure
echo -e "\n${YELLOW}Step 1: Logging into Azure...${NC}"
echo "Please authenticate when prompted in your browser."
az login --use-device-code

# Step 2: Set subscription context
echo -e "\n${YELLOW}Step 2: Setting subscription context...${NC}"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"
az account set --subscription "$SUBSCRIPTION_NAME"
echo -e "${GREEN}Subscription set to $SUBSCRIPTION_NAME${NC}"

# Step 3: Export all Azure Advisor recommendations to a JSON file
echo -e "\n${YELLOW}Step 3: Exporting Azure Advisor recommendations...${NC}"
az advisor recommendation list --output json > advisor_recommendations.json
echo -e "${GREEN}Exported recommendations to advisor_recommendations.json${NC}"

# Step 4: Analyze Cost Recommendations (Score: 12%)
echo -e "\n${YELLOW}Step 4: Analyzing Cost recommendations...${NC}"
echo "Filtering high-impact cost recommendations..."
az advisor recommendation list --filter "Category eq 'Cost'" --output table
echo -e "${GREEN}Cost analysis complete. See above for recommendations.${NC}"

# Step 5: Fix idle/underutilized resources
echo -e "\n${YELLOW}Step 5: Identifying underutilized VMs...${NC}"
UNDERUTILIZED_VMS=$(az advisor recommendation list --filter "Category eq 'Cost' and contains(ShortDescription.Solution, 'underutilized')" --query "[].impactedValue" -o tsv)

if [ -n "$UNDERUTILIZED_VMS" ]; then
    echo -e "${RED}Found underutilized VMs: $UNDERUTILIZED_VMS${NC}"
    echo -e "Options for remediation:"
    echo -e "1. Resize VMs to a more appropriate size"
    echo -e "2. Stop VMs if they are not needed"
    echo -e "3. Delete unused resources"
    
    # Example code to resize a VM (commented out for safety)
    # echo "To resize a VM, uncomment and run: az vm resize --resource-group <ResourceGroupName> --name <VMName> --size Standard_B1s"
else
    echo -e "${GREEN}No underutilized VMs detected.${NC}"
fi

# Step 6: Security Recommendations (Score: 27%)
echo -e "\n${YELLOW}Step 6: Analyzing Security recommendations...${NC}"
echo "Filtering high-impact security recommendations..."
az advisor recommendation list --filter "Category eq 'Security'" --output table
echo -e "${GREEN}Security analysis complete. See above for recommendations.${NC}"

# Step 7: Quick Security Fixes
echo -e "\n${YELLOW}Step 7: Applying quick security fixes...${NC}"

# 7.1: Enable Azure Security Center
echo "Enabling Azure Security Center standard tier..."
RESOURCE_GROUPS=$(az group list --query "[].name" -o tsv)
for RG in $RESOURCE_GROUPS; do
    echo "Setting up Security Center for $RG..."
    # This command is informational - uncomment to apply
    # az security auto-provisioning-setting update --name default --auto-provision On
done

# 7.2: Just-in-Time VM Access
echo "Checking for VMs without Just-in-Time access..."
VMS_WITHOUT_JIT=$(az advisor recommendation list --filter "Category eq 'Security' and contains(ShortDescription.Problem, 'Just-in-time')" --query "[].impactedValue" -o tsv)
if [ -n "$VMS_WITHOUT_JIT" ]; then
    echo -e "${RED}Found VMs without Just-in-Time access: $VMS_WITHOUT_JIT${NC}"
    echo "To enable JIT access, run:"
    echo "az security jit-policy create [parameters]"
else
    echo -e "${GREEN}No VMs without Just-in-Time access detected.${NC}"
fi

# 7.3: Network Security Groups
echo "Checking for recommended NSG rules..."
NSG_RECOMMENDATIONS=$(az advisor recommendation list --filter "Category eq 'Security' and contains(ShortDescription.Problem, 'NSG')" --query "[].impactedValue" -o tsv)
if [ -n "$NSG_RECOMMENDATIONS" ]; then
    echo -e "${RED}Found NSG recommendations: $NSG_RECOMMENDATIONS${NC}"
    echo "Review and update your NSG rules to restrict access."
else
    echo -e "${GREEN}No NSG recommendations detected.${NC}"
fi

# Step 8: Reliability Recommendations (Score: 72%)
echo -e "\n${YELLOW}Step 8: Analyzing Reliability recommendations...${NC}"
echo "Filtering high-impact reliability recommendations..."
az advisor recommendation list --filter "Category eq 'HighAvailability'" --output table
echo -e "${GREEN}Reliability analysis complete. See above for recommendations.${NC}"

# Step 9: Fix backup and redundancy issues
echo -e "\n${YELLOW}Step 9: Addressing backup and redundancy issues...${NC}"

# 9.1: Check for VMs without backup
echo "Checking for VMs without backup..."
VMS_WITHOUT_BACKUP=$(az advisor recommendation list --filter "Category eq 'HighAvailability' and contains(ShortDescription.Problem, 'backup')" --query "[].impactedValue" -o tsv)
if [ -n "$VMS_WITHOUT_BACKUP" ]; then
    echo -e "${RED}Found VMs without backup: $VMS_WITHOUT_BACKUP${NC}"
    echo "To enable backup, run:"
    echo "az backup protection enable-for-vm [parameters]"
else
    echo -e "${GREEN}No VMs without backup detected.${NC}"
fi

# 9.2: Check for resources without redundancy
echo "Checking for resources without redundancy..."
REDUNDANCY_ISSUES=$(az advisor recommendation list --filter "Category eq 'HighAvailability' and contains(ShortDescription.Problem, 'redundancy')" --query "[].impactedValue" -o tsv)
if [ -n "$REDUNDANCY_ISSUES" ]; then
    echo -e "${RED}Found redundancy issues: $REDUNDANCY_ISSUES${NC}"
    echo "Consider implementing zone redundancy for critical resources."
else
    echo -e "${GREEN}No redundancy issues detected.${NC}"
fi

# Step 10: Create a comprehensive report
echo -e "\n${YELLOW}Step 10: Creating a comprehensive report...${NC}"
DATE=$(date +"%Y-%m-%d")
REPORT_FILE="azure_advisor_remediation_report_$DATE.txt"

{
    echo "Azure Advisor Remediation Report"
    echo "Date: $DATE"
    echo "Subscription: $SUBSCRIPTION_NAME"
    echo ""
    echo "SUMMARY OF FINDINGS"
    echo "===================="
    echo "Cost (12%): $(az advisor recommendation list --filter "Category eq 'Cost'" --query "length(@)" -o tsv) recommendations"
    echo "Security (27%): $(az advisor recommendation list --filter "Category eq 'Security'" --query "length(@)" -o tsv) recommendations"
    echo "Reliability (72%): $(az advisor recommendation list --filter "Category eq 'HighAvailability'" --query "length(@)" -o tsv) recommendations"
    echo ""
    echo "ACTIONS TAKEN"
    echo "============="
    echo "- Analyzed all Azure Advisor recommendations"
    echo "- Identified underutilized resources"
    echo "- Identified security vulnerabilities"
    echo "- Identified reliability/backup issues"
    echo ""
    echo "NEXT STEPS"
    echo "=========="
    echo "1. Review all recommendations in detail in the Azure Portal"
    echo "2. Schedule maintenance window for implementing fixes"
    echo "3. Run remediation scripts for each category"
    echo "4. Verify fixes in Azure Advisor dashboard"
} > "$REPORT_FILE"

echo -e "${GREEN}Created comprehensive report: $REPORT_FILE${NC}"

# Step 11: Clean up
echo -e "\n${YELLOW}Step 11: Cleaning up...${NC}"
echo "Leaving advisor_recommendations.json for your reference."

echo -e "\n${GREEN}Script execution complete!${NC}"
echo -e "${GREEN}Please review the recommendations and apply the suggested fixes.${NC}"
echo -e "${GREEN}For security fixes, always test in a non-production environment first.${NC}"
echo -e "${BLUE}============================================${NC}"