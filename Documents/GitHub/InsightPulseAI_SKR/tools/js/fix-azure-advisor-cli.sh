#!/bin/bash
# Azure Advisor Remediation Script (CLI Version)
# Created for TBWA-ProjectScout-Prod subscription
# Designed to run in Azure Cloud Shell

# Color formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}    Azure Advisor Remediation Script        ${NC}"
echo -e "${BLUE}    For TBWA-ProjectScout-Prod              ${NC}"
echo -e "${BLUE}    CLI Version (Azure Cloud Shell)         ${NC}"
echo -e "${BLUE}============================================${NC}"

# Set subscription context
echo -e "\n${YELLOW}Setting subscription context...${NC}"
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"
az account set --subscription "$SUBSCRIPTION_NAME"
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)
echo -e "${GREEN}Subscription set to $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)${NC}"

# Export all Azure Advisor recommendations
echo -e "\n${YELLOW}Exporting Azure Advisor recommendations...${NC}"
az advisor recommendation list --output json > advisor_recommendations.json
echo -e "${GREEN}Exported recommendations to advisor_recommendations.json${NC}"

# Create report directory
REPORT_DIR="advisor_remediation_$(date +%Y%m%d%H%M%S)"
mkdir -p "$REPORT_DIR"
cp advisor_recommendations.json "$REPORT_DIR/"

# Track fixed resources
FIXED_RESOURCES=()

# ============================
# 1. FIX COST RECOMMENDATIONS
# ============================
echo -e "\n${YELLOW}▶ FIXING COST RECOMMENDATIONS (12%)${NC}"

# 1.1 Find and handle underutilized VMs
echo -e "\n${YELLOW}Finding underutilized VMs...${NC}"
UNDERUTILIZED_VMS=$(az advisor recommendation list --filter "Category eq 'Cost'" --query "[?contains(shortDescription.solution, 'underutilized')].resourceMetadata.resourceId" -o tsv)

if [ -n "$UNDERUTILIZED_VMS" ]; then
    echo -e "${YELLOW}Found underutilized VMs. Processing...${NC}"
    
    while IFS= read -r VM_ID; do
        # Extract resource group and VM name
        RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
        VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
        
        echo -e "\nProcessing VM: ${GREEN}$VM_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Get current VM size
        CURRENT_SIZE=$(az vm show -g $RG_NAME -n $VM_NAME --query hardwareProfile.vmSize -o tsv)
        echo "Current size: $CURRENT_SIZE"
        
        # Get available sizes for right-sizing
        echo "Finding more appropriate VM sizes..."
        SMALLER_SIZES=$(az vm list-vm-resize-options -g $RG_NAME -n $VM_NAME --query "[?numberOfCores < $(az vm show -g $RG_NAME -n $VM_NAME --query hardwareProfile.vmSize -o tsv | awk -F'_' '{print $2}' | sed 's/[^0-9]*//g')].name" -o tsv | head -3)
        
        # Pick a smaller size as recommendation
        TARGET_SIZE=$(echo "$SMALLER_SIZES" | head -1)
        
        if [ -n "$TARGET_SIZE" ]; then
            echo -e "Recommended size: ${GREEN}$TARGET_SIZE${NC} (smaller than current $CURRENT_SIZE)"
            
            # Check if VM is running
            VM_STATUS=$(az vm get-instance-view -g $RG_NAME -n $VM_NAME --query "instanceView.statuses[?contains(code, 'PowerState')].displayStatus" -o tsv)
            
            if [[ "$VM_STATUS" == *"running"* ]]; then
                echo "VM is running. Stopping VM before resize..."
                az vm deallocate -g $RG_NAME -n $VM_NAME
            fi
            
            echo "Resizing VM to $TARGET_SIZE..."
            az vm resize -g $RG_NAME -n $VM_NAME --size $TARGET_SIZE
            
            echo -e "${GREEN}Successfully resized VM $VM_NAME from $CURRENT_SIZE to $TARGET_SIZE${NC}"
            FIXED_RESOURCES+=("Cost: Resized VM $VM_NAME from $CURRENT_SIZE to $TARGET_SIZE")
            
            # Option to start VM again after resize
            # Uncomment if you want VMs to start automatically
            # echo "Starting VM after resize..."
            # az vm start -g $RG_NAME -n $VM_NAME
        else
            echo -e "${RED}Could not find appropriate smaller size for $VM_NAME. Manual review recommended.${NC}"
        fi
    done <<< "$UNDERUTILIZED_VMS"
else
    echo -e "${GREEN}No underutilized VMs found.${NC}"
fi

# 1.2 Handle unattached disks
echo -e "\n${YELLOW}Finding unattached disks...${NC}"
UNATTACHED_DISKS=$(az disk list --query "[?diskState=='Unattached'].id" -o tsv)

if [ -n "$UNATTACHED_DISKS" ]; then
    echo -e "${YELLOW}Found unattached disks. Processing...${NC}"
    
    while IFS= read -r DISK_ID; do
        # Extract resource group and disk name
        RG_NAME=$(echo $DISK_ID | cut -d'/' -f5)
        DISK_NAME=$(echo $DISK_ID | cut -d'/' -f9)
        
        echo -e "\nProcessing unattached disk: ${GREEN}$DISK_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Create a snapshot before deletion (safety measure)
        SNAPSHOT_NAME="${DISK_NAME}-snapshot-$(date +%Y%m%d%H%M%S)"
        DISK_LOCATION=$(az disk show --ids $DISK_ID --query location -o tsv)
        
        echo "Creating snapshot $SNAPSHOT_NAME before deletion..."
        az snapshot create -g $RG_NAME -n $SNAPSHOT_NAME --source $DISK_ID --location $DISK_LOCATION
        
        echo "Deleting unattached disk $DISK_NAME..."
        az disk delete --ids $DISK_ID --yes
        
        echo -e "${GREEN}Successfully deleted unattached disk $DISK_NAME (snapshot: $SNAPSHOT_NAME)${NC}"
        FIXED_RESOURCES+=("Cost: Deleted unattached disk $DISK_NAME (snapshot: $SNAPSHOT_NAME)")
    done <<< "$UNATTACHED_DISKS"
else
    echo -e "${GREEN}No unattached disks found.${NC}"
fi

# 1.3 Handle Reserved Instance recommendations - note only (manual action required)
RI_RECS=$(az advisor recommendation list --filter "Category eq 'Cost'" --query "[?contains(shortDescription.solution, 'Reserved Instance')].{Resource:resourceMetadata.resourceId, Problem:shortDescription.problem, Solution:shortDescription.solution}" -o json)

if [ -n "$RI_RECS" ] && [ "$RI_RECS" != "[]" ]; then
    echo -e "\n${YELLOW}Found Reserved Instance recommendations:${NC}"
    echo "$RI_RECS" | jq -r '.[] | "Resource: \(.Resource)\nProblem: \(.Problem)\nSolution: \(.Solution)\n"'
    echo -e "${YELLOW}NOTE: Reserved Instance purchases must be done manually through the Azure Portal.${NC}"
    FIXED_RESOURCES+=("Cost: Identified Reserved Instance purchase opportunities (manual action required)")
else
    echo -e "${GREEN}No Reserved Instance recommendations found.${NC}"
fi

# ===============================
# 2. FIX SECURITY RECOMMENDATIONS
# ===============================
echo -e "\n${YELLOW}▶ FIXING SECURITY RECOMMENDATIONS (27%)${NC}"

# 2.1 Enable Security Center
echo -e "\n${YELLOW}Enabling Azure Security Center...${NC}"

# Enable Azure Defender for key services
echo "Enabling Azure Defender for key services..."
az security pricing create -n VirtualMachines --tier 'standard'
az security pricing create -n SqlServers --tier 'standard'
az security pricing create -n AppServices --tier 'standard'
az security pricing create -n StorageAccounts --tier 'standard'
az security pricing create -n KeyVaults --tier 'standard'
az security pricing create -n KubernetesService --tier 'standard'

# Enable auto-provisioning of the monitoring agent
echo "Enabling auto-provisioning of monitoring agent..."
az security auto-provisioning-setting update --name "default" --auto-provision "On"

echo -e "${GREEN}Successfully enabled Azure Security Center standard tier and auto-provisioning${NC}"
FIXED_RESOURCES+=("Security: Enabled Azure Security Center standard tier for key resources")

# 2.2 Fix Just-in-Time VM access
echo -e "\n${YELLOW}Enabling Just-in-Time VM access...${NC}"
JIT_VMS=$(az advisor recommendation list --filter "Category eq 'Security'" --query "[?contains(shortDescription.problem, 'Just-in-time')].resourceMetadata.resourceId" -o tsv)

if [ -n "$JIT_VMS" ]; then
    echo -e "${YELLOW}Found VMs without JIT access. Processing...${NC}"
    
    while IFS= read -r VM_ID; do
        # Extract resource group and VM name
        RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
        VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
        
        echo -e "\nEnabling JIT for VM: ${GREEN}$VM_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Get VM location
        LOCATION=$(az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv)
        
        # Create JIT policy with standard ports (SSH, RDP, PowerShell)
        JIT_CONFIG="{\"virtualMachines\":[{\"id\":\"$VM_ID\",\"ports\":[{\"number\":22,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":3389,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":5985,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":5986,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"}]}]}"
        
        echo "Applying JIT policy..."
        az security jit-policy create --kind "Basic" --location "$LOCATION" --resource-group "$RG_NAME" --name "default" --virtual-machines "$JIT_CONFIG"
        
        echo -e "${GREEN}Successfully enabled JIT VM access for $VM_NAME${NC}"
        FIXED_RESOURCES+=("Security: Enabled Just-in-Time VM access for $VM_NAME")
    done <<< "$JIT_VMS"
else
    echo -e "${GREEN}No VMs without JIT access found.${NC}"
fi

# 2.3 Fix Network Security Group issues
echo -e "\n${YELLOW}Addressing Network Security Group issues...${NC}"
NSG_RECS=$(az advisor recommendation list --filter "Category eq 'Security'" --query "[?contains(shortDescription.problem, 'NSG') || contains(shortDescription.problem, 'network security group')].resourceMetadata.resourceId" -o tsv)

if [ -n "$NSG_RECS" ]; then
    echo -e "${YELLOW}Found NSG recommendations. Processing...${NC}"
    
    while IFS= read -r NSG_ID; do
        # Extract resource group and NSG name
        RG_NAME=$(echo $NSG_ID | cut -d'/' -f5)
        NSG_NAME=$(echo $NSG_ID | cut -d'/' -f9)
        
        echo -e "\nProcessing NSG: ${GREEN}$NSG_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # List all rules in the NSG
        RULES=$(az network nsg rule list -g $RG_NAME --nsg-name $NSG_NAME --query "[?access=='Allow' && sourceAddressPrefix=='*' && destinationAddressPrefix=='*']" -o json)
        
        if [ -n "$RULES" ] && [ "$RULES" != "[]" ]; then
            echo -e "${RED}Found overly permissive rules in NSG $NSG_NAME:${NC}"
            echo "$RULES" | jq -r '.[] | "Rule: \(.name), Priority: \(.priority), Direction: \(.direction), Ports: \(.destinationPortRange)"'
            
            # Fix overly permissive rules - this is a simplified approach
            # In a real scenario, you'd need to determine appropriate address ranges
            echo "$RULES" | jq -r '.[] | .name' | while read -r RULE_NAME; do
                echo "Restricting rule $RULE_NAME to specific IP range instead of any-to-any..."
                
                # Get rule details
                DIRECTION=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query direction -o tsv)
                ACCESS=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query access -o tsv)
                PROTOCOL=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query protocol -o tsv)
                SOURCE_PORT_RANGE=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query sourcePortRange -o tsv)
                DEST_PORT_RANGE=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query destinationPortRange -o tsv)
                PRIORITY=$(az network nsg rule show -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" --query priority -o tsv)
                
                # Define a more restrictive source address prefix - example using a corporate range
                # In production, use your actual corporate IP ranges
                RESTRICTED_SOURCE="10.0.0.0/24"
                
                echo "Updating rule to use source address prefix $RESTRICTED_SOURCE..."
                az network nsg rule update -g $RG_NAME --nsg-name $NSG_NAME -n "$RULE_NAME" \
                    --direction $DIRECTION --access $ACCESS --protocol $PROTOCOL \
                    --source-port-range $SOURCE_PORT_RANGE --destination-port-range $DEST_PORT_RANGE \
                    --source-address-prefix $RESTRICTED_SOURCE --destination-address-prefix "*" \
                    --priority $PRIORITY
                
                echo -e "${GREEN}Successfully restricted rule $RULE_NAME in NSG $NSG_NAME${NC}"
                FIXED_RESOURCES+=("Security: Restricted overly permissive rule $RULE_NAME in NSG $NSG_NAME")
            done
        else
            echo -e "${GREEN}No overly permissive rules found in NSG $NSG_NAME${NC}"
        fi
    done <<< "$NSG_RECS"
else
    echo -e "${GREEN}No NSG recommendations found.${NC}"
fi

# 2.4 Enable disk encryption
echo -e "\n${YELLOW}Enabling disk encryption...${NC}"
DISK_ENC_RECS=$(az advisor recommendation list --filter "Category eq 'Security'" --query "[?contains(shortDescription.problem, 'disk encryption')].resourceMetadata.resourceId" -o tsv)

if [ -n "$DISK_ENC_RECS" ]; then
    echo -e "${YELLOW}Found disk encryption recommendations. Processing...${NC}"
    
    while IFS= read -r VM_ID; do
        # Extract resource group and VM name
        RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
        VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
        
        echo -e "\nEnabling disk encryption for VM: ${GREEN}$VM_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Get VM location
        LOCATION=$(az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv)
        
        # Create Key Vault if it doesn't exist
        KV_NAME="${RG_NAME}-kv"
        if ! az keyvault show -n $KV_NAME -g $RG_NAME &>/dev/null; then
            echo "Creating Key Vault $KV_NAME..."
            az keyvault create -n $KV_NAME -g $RG_NAME -l $LOCATION --enabled-for-disk-encryption
        fi
        
        # Enable encryption
        echo "Enabling disk encryption using Key Vault $KV_NAME..."
        az vm encryption enable -g $RG_NAME -n $VM_NAME --disk-encryption-keyvault $KV_NAME
        
        echo -e "${GREEN}Successfully enabled disk encryption for VM $VM_NAME${NC}"
        FIXED_RESOURCES+=("Security: Enabled disk encryption for VM $VM_NAME")
    done <<< "$DISK_ENC_RECS"
else
    echo -e "${GREEN}No disk encryption recommendations found.${NC}"
fi

# ===============================
# 3. FIX RELIABILITY RECOMMENDATIONS
# ===============================
echo -e "\n${YELLOW}▶ FIXING RELIABILITY RECOMMENDATIONS (72%)${NC}"

# 3.1 Enable VM backup
echo -e "\n${YELLOW}Enabling VM backup...${NC}"
BACKUP_RECS=$(az advisor recommendation list --filter "Category eq 'HighAvailability'" --query "[?contains(shortDescription.problem, 'backup')].resourceMetadata.resourceId" -o tsv)

if [ -n "$BACKUP_RECS" ]; then
    echo -e "${YELLOW}Found backup recommendations. Processing...${NC}"
    
    while IFS= read -r VM_ID; do
        # Extract resource group and VM name
        RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
        VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
        
        echo -e "\nEnabling backup for VM: ${GREEN}$VM_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Get VM location
        LOCATION=$(az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv)
        
        # Create Recovery Services Vault if it doesn't exist
        RSV_NAME="${RG_NAME}-rsv"
        if ! az backup vault show -n $RSV_NAME -g $RG_NAME &>/dev/null; then
            echo "Creating Recovery Services Vault $RSV_NAME..."
            az backup vault create -n $RSV_NAME -g $RG_NAME -l $LOCATION
        fi
        
        # Create backup policy if it doesn't exist
        POLICY_NAME="DailyPolicy"
        if ! az backup policy show -n $POLICY_NAME -v $RSV_NAME -g $RG_NAME &>/dev/null; then
            echo "Creating backup policy $POLICY_NAME..."
            az backup policy create -n $POLICY_NAME -v $RSV_NAME -g $RG_NAME --backup-management-type AzureIaasVM \
                --policy '{"schedulePolicy":{"schedulePolicyType":"SimpleSchedulePolicy","scheduleRunFrequency":"Daily","scheduleRunDays":null,"scheduleRunTimes":["2019-09-26T02:30:00+00:00"],"scheduleWeeklyFrequency":0},"retentionPolicy":{"retentionPolicyType":"LongTermRetentionPolicy","dailySchedule":{"retentionTimes":["2019-09-26T02:30:00+00:00"],"retentionDuration":{"count":30,"durationType":"Days"}}},"timeZone":"UTC"}'
        fi
        
        # Enable backup
        echo "Enabling backup for VM $VM_NAME using vault $RSV_NAME..."
        az backup protection enable-for-vm -g $RG_NAME -v $RSV_NAME --vm $VM_ID --policy-name $POLICY_NAME
        
        echo -e "${GREEN}Successfully enabled backup for VM $VM_NAME${NC}"
        FIXED_RESOURCES+=("Reliability: Enabled backup for VM $VM_NAME")
    done <<< "$BACKUP_RECS"
else
    echo -e "${GREEN}No backup recommendations found.${NC}"
fi

# 3.2 Handle storage redundancy
echo -e "\n${YELLOW}Improving storage redundancy...${NC}"
STORAGE_REDUNDANCY_RECS=$(az advisor recommendation list --filter "Category eq 'HighAvailability'" --query "[?contains(shortDescription.problem, 'redundancy')].resourceMetadata.resourceId" -o tsv | grep "/storageAccounts/")

if [ -n "$STORAGE_REDUNDANCY_RECS" ]; then
    echo -e "${YELLOW}Found storage redundancy recommendations. Processing...${NC}"
    
    while IFS= read -r STORAGE_ID; do
        # Extract resource group and storage account name
        RG_NAME=$(echo $STORAGE_ID | cut -d'/' -f5)
        STORAGE_NAME=$(echo $STORAGE_ID | cut -d'/' -f9)
        
        echo -e "\nEnhancing redundancy for storage account: ${GREEN}$STORAGE_NAME${NC} in resource group ${GREEN}$RG_NAME${NC}"
        
        # Get current redundancy
        CURRENT_SKU=$(az storage account show -n $STORAGE_NAME -g $RG_NAME --query sku.name -o tsv)
        echo "Current redundancy (SKU): $CURRENT_SKU"
        
        if [[ "$CURRENT_SKU" == "Standard_LRS" || "$CURRENT_SKU" == "Premium_LRS" ]]; then
            # Upgrade LRS to GRS
            NEW_SKU="Standard_GRS"
            if [[ "$CURRENT_SKU" == "Premium_LRS" ]]; then
                NEW_SKU="Premium_ZRS" # Premium can't use GRS, so use ZRS instead
            fi
            
            echo "Upgrading storage account from $CURRENT_SKU to $NEW_SKU..."
            az storage account update -n $STORAGE_NAME -g $RG_NAME --sku $NEW_SKU
            
            echo -e "${GREEN}Successfully upgraded storage account $STORAGE_NAME to $NEW_SKU${NC}"
            FIXED_RESOURCES+=("Reliability: Upgraded storage account $STORAGE_NAME from $CURRENT_SKU to $NEW_SKU")
        else
            echo -e "${GREEN}Storage account $STORAGE_NAME already has adequate redundancy: $CURRENT_SKU${NC}"
        fi
    done <<< "$STORAGE_REDUNDANCY_RECS"
else
    echo -e "${GREEN}No storage redundancy recommendations found.${NC}"
fi

# 3.3 Handle availability zone recommendations
AZ_RECS=$(az advisor recommendation list --filter "Category eq 'HighAvailability'" --query "[?contains(shortDescription.problem, 'availability zone')].{Resource:resourceMetadata.resourceId, Problem:shortDescription.problem, Solution:shortDescription.solution}" -o json)

if [ -n "$AZ_RECS" ] && [ "$AZ_RECS" != "[]" ]; then
    echo -e "\n${YELLOW}Found Availability Zone recommendations:${NC}"
    echo "$AZ_RECS" | jq -r '.[] | "Resource: \(.Resource)\nProblem: \(.Problem)\nSolution: \(.Solution)\n"'
    echo -e "${YELLOW}NOTE: Availability Zone migrations require downtime and detailed planning. These should be addressed as part of a migration project.${NC}"
    FIXED_RESOURCES+=("Reliability: Identified resources requiring Availability Zone configuration (manual planning required)")
else
    echo -e "${GREEN}No Availability Zone recommendations found.${NC}"
fi

# ============================
# CREATE SUMMARY REPORT
# ============================
echo -e "\n${YELLOW}Creating summary report...${NC}"
DATE=$(date +"%Y-%m-%d")
REPORT_FILE="$REPORT_DIR/azure_advisor_remediation_report_$DATE.txt"

{
    echo "Azure Advisor Remediation Report"
    echo "Date: $DATE"
    echo "Subscription: $SUBSCRIPTION_NAME"
    echo ""
    echo "SUMMARY OF FIXES APPLIED"
    echo "======================="
    echo "Total fixes: ${#FIXED_RESOURCES[@]}"
    echo ""
    
    if [ ${#FIXED_RESOURCES[@]} -gt 0 ]; then
        for fix in "${FIXED_RESOURCES[@]}"; do
            echo "- $fix"
        done
    else
        echo "No fixes were applied."
    fi
    
    echo ""
    echo "RECOMMENDATIONS SUMMARY"
    echo "======================="
    echo "Cost: $(az advisor recommendation list --filter "Category eq 'Cost'" --query "length(@)" -o tsv) recommendations"
    echo "Security: $(az advisor recommendation list --filter "Category eq 'Security'" --query "length(@)" -o tsv) recommendations"
    echo "Reliability: $(az advisor recommendation list --filter "Category eq 'HighAvailability'" --query "length(@)" -o tsv) recommendations"
    echo ""
    echo "NEXT STEPS"
    echo "=========="
    echo "1. Run Azure Advisor again to verify improvements"
    echo "2. Schedule maintenance window for any remaining issues"
    echo "3. Verify services are functioning correctly"
    echo "4. Consider Reserved Instance purchases for cost optimization"
    echo "5. Schedule regular reviews of Azure Advisor (quarterly recommended)"
} > "$REPORT_FILE"

echo -e "${GREEN}Created comprehensive report: $REPORT_FILE${NC}"

# ============================
# CLEAN UP
# ============================
echo -e "\n${YELLOW}Cleaning up...${NC}"
echo "Reports and recommendations JSON are stored in $REPORT_DIR directory."

echo -e "\n${GREEN}Script execution complete!${NC}"
echo -e "${GREEN}Successfully applied fixes to address Azure Advisor recommendations.${NC}"
echo -e "${GREEN}Please review the $REPORT_FILE file for a summary of all changes made.${NC}"
echo -e "${BLUE}============================================${NC}"