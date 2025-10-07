#!/bin/bash
# Azure Advisor Unified Remediation Script
# Created for TBWA-ProjectScout-Prod subscription
# Combines all remediation approaches with safe defaults
# Created by Claude AI - 2025-05-17

# Color formatting for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default parameters
SUBSCRIPTION_NAME="TBWA-ProjectScout-Prod"
WHATIF="true"  # Default to simulation mode for safety
FIX_COST="false"
FIX_SECURITY="false"
FIX_RELIABILITY="false"
FIX_ALL="false"

# Display script header
function show_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}${BOLD}    Azure Advisor Unified Remediation       ${NC}"
    echo -e "${BLUE}${BOLD}    For TBWA-ProjectScout-Prod              ${NC}"
    if [ "$WHATIF" = "true" ]; then
        echo -e "${YELLOW}${BOLD}    Mode: Simulation (no changes made)     ${NC}"
    else
        echo -e "${GREEN}${BOLD}    Mode: Apply (changes will be made)      ${NC}"
    fi
    echo -e "${BLUE}============================================${NC}"
}

# Display usage instructions
function show_usage() {
    echo -e "${BLUE}Usage:${NC} $0 [options]"
    echo -e "\n${BOLD}Options:${NC}"
    echo -e "  --help                 Show this help message"
    echo -e "  --subscription NAME    Azure subscription name (default: $SUBSCRIPTION_NAME)"
    echo -e "  --apply                Apply changes (default is simulation mode)"
    echo -e "  --fix-cost             Fix cost recommendations"
    echo -e "  --fix-security         Fix security recommendations"
    echo -e "  --fix-reliability      Fix reliability recommendations"
    echo -e "  --fix-all              Fix all recommendations"
    echo
    echo -e "${BOLD}Examples:${NC}"
    echo -e "  $0                               # Run in simulation mode with no fixes"
    echo -e "  $0 --fix-security                # Simulate security fixes"
    echo -e "  $0 --fix-security --apply        # Apply security fixes"
    echo -e "  $0 --fix-all --apply             # Apply all fixes"
    exit 0
}

# Function to handle simulation or actual execution
function run_command() {
    local cmd="$1"
    local description="$2"
    
    if [ "$WHATIF" = "true" ]; then
        echo -e "${YELLOW}[SIMULATION] Would execute:${NC} $cmd"
        echo -e "${YELLOW}[SIMULATION] Purpose:${NC} $description"
        return 0
    else
        echo -e "${BLUE}Executing:${NC} $cmd"
        echo -e "${BLUE}Purpose:${NC} $description"
        eval "$cmd"
        return $?
    fi
}

# Track fixes applied
FIXES_APPLIED=()
function log_fix() {
    local fix_description="$1"
    FIXES_APPLIED+=("$fix_description")
    
    if [ "$WHATIF" = "true" ]; then
        echo -e "${YELLOW}[SIMULATION] Would apply fix:${NC} $fix_description"
    else
        echo -e "${GREEN}Applied fix:${NC} $fix_description"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_usage
            ;;
        --subscription)
            SUBSCRIPTION_NAME="$2"
            shift 2
            ;;
        --apply)
            WHATIF="false"
            shift
            ;;
        --fix-cost)
            FIX_COST="true"
            shift
            ;;
        --fix-security)
            FIX_SECURITY="true"
            shift
            ;;
        --fix-reliability)
            FIX_RELIABILITY="true"
            shift
            ;;
        --fix-all)
            FIX_ALL="true"
            FIX_COST="true"
            FIX_SECURITY="true"
            FIX_RELIABILITY="true"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            ;;
    esac
done

# Display header
show_header

# Check if at least one fix parameter is specified
if [[ "$FIX_COST" = "false" && "$FIX_SECURITY" = "false" && "$FIX_RELIABILITY" = "false" ]]; then
    echo -e "${YELLOW}Warning: No fix parameters specified. Script will analyze recommendations but won't plan any fixes.${NC}"
    echo -e "${YELLOW}Use --fix-cost, --fix-security, --fix-reliability, or --fix-all to specify what to fix.${NC}"
    echo -e "${YELLOW}Run with --help for more information.${NC}"
    echo
fi

# Step 1: Login to Azure
echo -e "\n${YELLOW}Step 1: Logging into Azure...${NC}"
echo "Please authenticate when prompted in your browser."
az login --use-device-code

# Step 2: Set subscription context
echo -e "\n${YELLOW}Step 2: Setting subscription context...${NC}"
az account set --subscription "$SUBSCRIPTION_NAME"
echo -e "${GREEN}Subscription set to $SUBSCRIPTION_NAME${NC}"

# Step 3: Export all Azure Advisor recommendations to a JSON file
echo -e "\n${YELLOW}Step 3: Exporting Azure Advisor recommendations...${NC}"
az advisor recommendation list --output json > advisor_recommendations.json
echo -e "${GREEN}Exported recommendations to advisor_recommendations.json${NC}"

# Create a directory for remediation
DATE=$(date +"%Y%m%d%H%M%S")
REMEDIATION_DIR="advisor_remediation_$DATE"
mkdir -p "$REMEDIATION_DIR"
cp advisor_recommendations.json "$REMEDIATION_DIR/"

# Count total recommendations
TOTAL_RECOMMENDATIONS=$(jq -r '.[] | .id' advisor_recommendations.json | wc -l | tr -d ' ')
COST_RECOMMENDATIONS=$(jq -r '.[] | select(.category == "Cost") | .id' advisor_recommendations.json | wc -l | tr -d ' ')
SECURITY_RECOMMENDATIONS=$(jq -r '.[] | select(.category == "Security") | .id' advisor_recommendations.json | wc -l | tr -d ' ')
RELIABILITY_RECOMMENDATIONS=$(jq -r '.[] | select(.category == "HighAvailability") | .id' advisor_recommendations.json | wc -l | tr -d ' ')

echo -e "\n${BLUE}Analysis Summary:${NC}"
echo -e "Total recommendations: ${BOLD}$TOTAL_RECOMMENDATIONS${NC}"
echo -e "Cost recommendations: ${BOLD}$COST_RECOMMENDATIONS${NC}"
echo -e "Security recommendations: ${BOLD}$SECURITY_RECOMMENDATIONS${NC}"
echo -e "Reliability recommendations: ${BOLD}$RELIABILITY_RECOMMENDATIONS${NC}"

# ===================================
# FIX COST RECOMMENDATIONS
# ===================================
if [ "$FIX_COST" = "true" ]; then
    echo -e "\n${BLUE}${BOLD}▶ COST RECOMMENDATIONS (Estimated score: 12%)${NC}"
    
    # 1. Reserved Instance Purchase Opportunities
    echo -e "\n${YELLOW}Checking for Reserved Instance purchase opportunities...${NC}"
    RI_RECS=$(jq -r '.[] | select(.category == "Cost" and (.shortDescription.problem | contains("Reserved Instance") or contains("savings plan") or contains("Savings Plan"))) | .extendedProperties.resourceId' advisor_recommendations.json)
    
    if [ -n "$RI_RECS" ]; then
        echo -e "${GREEN}Found Reserved Instance or Savings Plan recommendations${NC}"
        echo -e "These recommendations require approval and purchase through the Azure Portal."
        
        # Create a report for manual action
        RI_REPORT="$REMEDIATION_DIR/reserved_instance_recommendations.txt"
        {
            echo "Reserved Instance/Savings Plan Recommendations"
            echo "=============================================="
            echo "These recommendations require manual purchase through the Azure Portal."
            echo "Visit: https://portal.azure.com/#blade/Microsoft_Azure_Reservations/CreateBlade/referrer/advisor"
            echo ""
            jq -r '.[] | select(.category == "Cost" and (.shortDescription.problem | contains("Reserved Instance") or contains("savings plan") or contains("Savings Plan"))) | "Resource: " + .impactedValue + "\nPotential Annual Savings: $" + .extendedProperties.annualSavingsAmount + "\nProblem: " + .shortDescription.problem + "\nSolution: " + .shortDescription.solution + "\n"' advisor_recommendations.json
        } > "$RI_REPORT"
        
        echo -e "${GREEN}Created Reserved Instance/Savings Plan report: $RI_REPORT${NC}"
        log_fix "Identified Reserved Instance/Savings Plan purchase opportunities (manual action required)"
    else
        echo -e "${GREEN}No Reserved Instance or Savings Plan recommendations found.${NC}"
    fi
    
    # 2. Underutilized Resources
    echo -e "\n${YELLOW}Finding underutilized resources...${NC}"
    UNDERUTILIZED_RESOURCES=$(jq -r '.[] | select(.category == "Cost" and (.shortDescription.problem | contains("underutilized") or contains("idle"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$UNDERUTILIZED_RESOURCES" ]; then
        echo -e "${YELLOW}Found underutilized resources. Processing...${NC}"
        
        echo "$UNDERUTILIZED_RESOURCES" | while read -r RESOURCE_ID; do
            if [ -z "$RESOURCE_ID" ]; then
                continue
            fi
            
            # Extract resource information
            RESOURCE_TYPE=$(echo "$RESOURCE_ID" | cut -d'/' -f7)
            RESOURCE_GROUP=$(echo "$RESOURCE_ID" | cut -d'/' -f5)
            RESOURCE_NAME=$(echo "$RESOURCE_ID" | cut -d'/' -f9)
            
            case "$RESOURCE_TYPE" in
                "virtualMachines")
                    echo -e "\n${YELLOW}Processing underutilized VM: ${BOLD}$RESOURCE_NAME${NC} in resource group ${BOLD}$RESOURCE_GROUP${NC}"
                    
                    # Get current VM size
                    CURRENT_SIZE=$(run_command "az vm show -g $RESOURCE_GROUP -n $RESOURCE_NAME --query hardwareProfile.vmSize -o tsv" "Get current VM size")
                    echo "Current size: $CURRENT_SIZE"
                    
                    # Get suggested smaller size - preferring B-series for cost optimization
                    SMALLER_SIZES=$(run_command "az vm list-vm-resize-options -g $RESOURCE_GROUP -n $RESOURCE_NAME --query \"[?contains(name, 'Standard_B')].name\" -o tsv | head -3" "Find cost-optimized VM sizes")
                    
                    if [ -z "$SMALLER_SIZES" ]; then
                        # If no B-series available, get any smaller sizes
                        SMALLER_SIZES=$(run_command "az vm list-vm-resize-options -g $RESOURCE_GROUP -n $RESOURCE_NAME --query \"[].name\" -o tsv | head -3" "Find alternative VM sizes")
                    fi
                    
                    # Pick a smaller size as recommendation
                    TARGET_SIZE=$(echo "$SMALLER_SIZES" | head -1)
                    
                    if [ -n "$TARGET_SIZE" ]; then
                        echo -e "Recommended size: ${GREEN}$TARGET_SIZE${NC} (more cost-effective than current $CURRENT_SIZE)"
                        
                        # Check if VM is running
                        VM_STATUS=$(run_command "az vm get-instance-view -g $RESOURCE_GROUP -n $RESOURCE_NAME --query \"instanceView.statuses[?contains(code, 'PowerState')].displayStatus\" -o tsv" "Check VM running status")
                        
                        if [[ "$VM_STATUS" == *"running"* ]]; then
                            run_command "az vm deallocate -g $RESOURCE_GROUP -n $RESOURCE_NAME" "Stop VM before resize"
                        fi
                        
                        run_command "az vm resize -g $RESOURCE_GROUP -n $RESOURCE_NAME --size $TARGET_SIZE" "Resize VM to $TARGET_SIZE"
                        
                        log_fix "Resized VM $RESOURCE_NAME from $CURRENT_SIZE to $TARGET_SIZE"
                        
                        # Option to start VM again (commented out by default - uncomment if needed)
                        # run_command "az vm start -g $RESOURCE_GROUP -n $RESOURCE_NAME" "Start VM after resize"
                    else
                        echo -e "${RED}Could not find appropriate smaller size for $RESOURCE_NAME. Manual review recommended.${NC}"
                    fi
                    ;;
                    
                "sqlServers")
                    echo -e "\n${YELLOW}Processing underutilized SQL Server: ${BOLD}$RESOURCE_NAME${NC} in resource group ${BOLD}$RESOURCE_GROUP${NC}"
                    # SQL Server recommendations typically involve scaling down database tiers
                    # This requires identifying the specific databases that need to be scaled down
                    
                    # Get all databases for this server
                    DBS=$(run_command "az sql db list --resource-group $RESOURCE_GROUP --server $RESOURCE_NAME --query \"[].name\" -o tsv" "List all databases on server")
                    
                    echo "$DBS" | while read -r DB_NAME; do
                        if [ -z "$DB_NAME" ] || [ "$DB_NAME" = "master" ]; then
                            continue
                        fi
                        
                        # Get current tier and identify if it can be scaled down
                        CURRENT_TIER=$(run_command "az sql db show --resource-group $RESOURCE_GROUP --server $RESOURCE_NAME --name \"$DB_NAME\" --query \"sku.name\" -o tsv" "Get current database tier")
                        
                        if [[ "$CURRENT_TIER" == *"Premium"* ]]; then
                            TARGET_TIER="Standard"
                            run_command "az sql db update --resource-group $RESOURCE_GROUP --server $RESOURCE_NAME --name \"$DB_NAME\" --edition Standard --capacity 10" "Scale down database from Premium to Standard tier"
                            log_fix "Scaled down SQL database $DB_NAME from $CURRENT_TIER to Standard tier"
                        elif [[ "$CURRENT_TIER" == *"Standard"* ]] && [[ "$CURRENT_TIER" != *"S0"* ]]; then
                            CURRENT_CAPACITY=$(echo $CURRENT_TIER | grep -o '[0-9]\+')
                            if [ -n "$CURRENT_CAPACITY" ] && [ "$CURRENT_CAPACITY" -gt 2 ]; then
                                TARGET_CAPACITY=$((CURRENT_CAPACITY / 2))
                                TARGET_TIER="S$TARGET_CAPACITY"
                                run_command "az sql db update --resource-group $RESOURCE_GROUP --server $RESOURCE_NAME --name \"$DB_NAME\" --edition Standard --capacity $TARGET_CAPACITY" "Scale down database capacity"
                                log_fix "Scaled down SQL database $DB_NAME from $CURRENT_TIER to $TARGET_TIER"
                            fi
                        fi
                    done
                    ;;
                    
                *)
                    echo -e "\n${YELLOW}Underutilized resource of type $RESOURCE_TYPE: $RESOURCE_NAME${NC}"
                    echo -e "Automated right-sizing for this resource type is not implemented."
                    echo -e "Please review in Azure Portal: https://portal.azure.com/#resource$RESOURCE_ID/overview"
                    ;;
            esac
        done
    else
        echo -e "${GREEN}No underutilized resources found.${NC}"
    fi
    
    # 3. Handle unattached disks
    echo -e "\n${YELLOW}Finding unattached disks...${NC}"
    UNATTACHED_DISKS=$(run_command "az disk list --query \"[?diskState=='Unattached'].id\" -o tsv" "List unattached disks")
    
    if [ -n "$UNATTACHED_DISKS" ]; then
        echo -e "${YELLOW}Found unattached disks. Processing...${NC}"
        
        echo "$UNATTACHED_DISKS" | while read -r DISK_ID; do
            if [ -z "$DISK_ID" ]; then
                continue
            fi
            
            # Extract resource group and disk name
            RG_NAME=$(echo $DISK_ID | cut -d'/' -f5)
            DISK_NAME=$(echo $DISK_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Processing unattached disk: ${BOLD}$DISK_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get disk properties for the report
            DISK_SIZE=$(run_command "az disk show --ids $DISK_ID --query diskSizeGb -o tsv" "Get disk size")
            DISK_SKU=$(run_command "az disk show --ids $DISK_ID --query sku.name -o tsv" "Get disk SKU")
            DISK_GEN=$(run_command "az disk show --ids $DISK_ID --query hyperVGeneration -o tsv" "Get disk generation")
            DISK_CREATED=$(run_command "az disk show --ids $DISK_ID --query timeCreated -o tsv" "Get disk creation time")
            
            # Safety check - don't delete disks less than 7 days old
            CURRENT_DATE=$(date +%s)
            DISK_DATE=$(date -d "$DISK_CREATED" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$DISK_CREATED" +%s)
            DAYS_OLD=$(( (CURRENT_DATE - DISK_DATE) / 86400 ))
            
            if [ "$DAYS_OLD" -lt 7 ]; then
                echo -e "${YELLOW}Disk $DISK_NAME is only $DAYS_OLD days old. Skipping for safety.${NC}"
                continue
            fi
            
            # Create a snapshot before deletion (safety measure)
            SNAPSHOT_NAME="${DISK_NAME}-snapshot-$(date +%Y%m%d%H%M%S)"
            DISK_LOCATION=$(run_command "az disk show --ids $DISK_ID --query location -o tsv" "Get disk location")
            
            run_command "az snapshot create -g $RG_NAME -n $SNAPSHOT_NAME --source $DISK_ID --location $DISK_LOCATION" "Create snapshot $SNAPSHOT_NAME before deletion"
            run_command "az disk delete --ids $DISK_ID --yes" "Delete unattached disk $DISK_NAME"
            
            log_fix "Deleted unattached disk $DISK_NAME ($DISK_SIZE GB, $DISK_SKU) with snapshot: $SNAPSHOT_NAME"
        done
    else
        echo -e "${GREEN}No unattached disks found.${NC}"
    fi
    
    # 4. Auto-shutdown for dev/test VMs
    echo -e "\n${YELLOW}Setting up auto-shutdown for development/test VMs...${NC}"
    DEV_TEST_VMS=$(jq -r '.[] | select(.category == "Cost" and (.shortDescription.solution | contains("auto-shutdown"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$DEV_TEST_VMS" ]; then
        echo -e "${YELLOW}Found VMs that could benefit from auto-shutdown. Processing...${NC}"
        
        echo "$DEV_TEST_VMS" | while read -r VM_ID; do
            if [ -z "$VM_ID" ]; then
                continue
            fi
            
            # Extract resource group and VM name
            RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
            VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Setting up auto-shutdown for VM: ${BOLD}$VM_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Default shutdown time at 7 PM
            SHUTDOWN_TIME="1900"
            TIMEZONE=$(run_command "az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv" "Get VM location")
            
            # Configure auto-shutdown
            run_command "az vm auto-shutdown -g $RG_NAME -n $VM_NAME --time $SHUTDOWN_TIME --email 'admin@example.com'" "Configure auto-shutdown for VM $VM_NAME at 7 PM"
            
            log_fix "Enabled auto-shutdown for VM $VM_NAME at 7:00 PM"
        done
    else
        echo -e "${GREEN}No VMs identified for auto-shutdown setup.${NC}"
    fi
fi

# ===================================
# FIX SECURITY RECOMMENDATIONS
# ===================================
if [ "$FIX_SECURITY" = "true" ]; then
    echo -e "\n${BLUE}${BOLD}▶ SECURITY RECOMMENDATIONS (Estimated score: 27%)${NC}"
    
    # 1. Enable Azure Security Center
    echo -e "\n${YELLOW}Enabling Azure Security Center/Microsoft Defender for Cloud...${NC}"
    
    # Enable Microsoft Defender for Cloud for key services
    run_command "az security pricing create -n VirtualMachines --tier 'standard'" "Enable Microsoft Defender for VMs"
    run_command "az security pricing create -n SqlServers --tier 'standard'" "Enable Microsoft Defender for SQL"
    run_command "az security pricing create -n AppServices --tier 'standard'" "Enable Microsoft Defender for App Services"
    run_command "az security pricing create -n StorageAccounts --tier 'standard'" "Enable Microsoft Defender for Storage"
    run_command "az security pricing create -n KeyVaults --tier 'standard'" "Enable Microsoft Defender for Key Vaults"
    run_command "az security pricing create -n KubernetesService --tier 'standard'" "Enable Microsoft Defender for Kubernetes"
    run_command "az security pricing create -n Containers --tier 'standard'" "Enable Microsoft Defender for Containers"
    
    # Enable auto-provisioning of monitoring agent
    run_command "az security auto-provisioning-setting update --name 'default' --auto-provision 'On'" "Enable auto-provisioning of monitoring agent"
    
    log_fix "Enabled Microsoft Defender for Cloud standard tier for key resources"
    
    # 2. JIT VM Access
    echo -e "\n${YELLOW}Enabling Just-in-Time VM access...${NC}"
    JIT_VMS=$(jq -r '.[] | select(.category == "Security" and (.shortDescription.problem | contains("Just-in-time") or contains("JIT"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$JIT_VMS" ]; then
        echo -e "${YELLOW}Found VMs without JIT access. Processing...${NC}"
        
        echo "$JIT_VMS" | while read -r VM_ID; do
            if [ -z "$VM_ID" ]; then
                continue
            fi
            
            # Extract resource group and VM name
            RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
            VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enabling JIT for VM: ${BOLD}$VM_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get VM location
            LOCATION=$(run_command "az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv" "Get VM location")
            
            # Create JIT policy with standard ports (SSH, RDP, PowerShell)
            # Using a template based on the Microsoft standard
            JIT_CONFIG="{\"virtualMachines\":[{\"id\":\"$VM_ID\",\"ports\":[{\"number\":22,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":3389,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":5985,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"},{\"number\":5986,\"protocol\":\"*\",\"allowedSourceAddressPrefix\":\"*\",\"maxRequestAccessDuration\":\"PT3H\"}]}]}"
            
            run_command "az security jit-policy create --kind \"Basic\" --location \"$LOCATION\" --resource-group \"$RG_NAME\" --name \"default\" --virtual-machines \"$JIT_CONFIG\"" "Apply JIT policy for VM $VM_NAME"
            
            log_fix "Enabled Just-in-Time VM access for $VM_NAME"
        done
    else
        echo -e "${GREEN}No VMs without JIT access found.${NC}"
    fi
    
    # 3. Network Security Group Fixes
    echo -e "\n${YELLOW}Addressing Network Security Group issues...${NC}"
    NSG_RECS=$(jq -r '.[] | select(.category == "Security" and (.shortDescription.problem | contains("NSG") or contains("network security group") or contains("Management ports"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$NSG_RECS" ]; then
        echo -e "${YELLOW}Found NSG recommendations. Processing...${NC}"
        
        echo "$NSG_RECS" | while read -r RESOURCE_ID; do
            if [ -z "$RESOURCE_ID" ]; then
                continue
            fi
            
            # Determine if the recommendation relates to an NSG or VM
            if [[ "$RESOURCE_ID" == */networkSecurityGroups/* ]]; then
                # Direct NSG reference
                NSG_NAME=$(echo $RESOURCE_ID | cut -d'/' -f9)
                RG_NAME=$(echo $RESOURCE_ID | cut -d'/' -f5)
                
                echo -e "\n${YELLOW}Processing NSG: ${BOLD}$NSG_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
                
                # List all rules in the NSG
                RULES=$(run_command "az network nsg rule list -g $RG_NAME --nsg-name $NSG_NAME --query \"[?access=='Allow' && sourceAddressPrefix=='*' && (contains(destinationPortRange, '22') || contains(destinationPortRange, '3389') || contains(destinationPortRange, '5985') || contains(destinationPortRange, '5986'))]\" -o json" "Find overly permissive rules for management ports")
                
                if [ -n "$RULES" ] && [ "$RULES" != "[]" ]; then
                    echo -e "${YELLOW}Found overly permissive rules allowing management ports from any source${NC}"
                    
                    # Define a more restrictive source address prefix
                    # In a real implementation, you should use your actual corporate IP ranges
                    CORPORATE_IP="10.0.0.0/24"
                    
                    # Process each rule
                    echo "$RULES" | jq -c '.[]' | while read -r RULE_JSON; do
                        RULE_NAME=$(echo $RULE_JSON | jq -r '.name')
                        PROTOCOL=$(echo $RULE_JSON | jq -r '.protocol')
                        DIRECTION=$(echo $RULE_JSON | jq -r '.direction')
                        SOURCE_PORT_RANGE=$(echo $RULE_JSON | jq -r '.sourcePortRange')
                        DEST_PORT_RANGE=$(echo $RULE_JSON | jq -r '.destinationPortRange')
                        DEST_ADDR_PREFIX=$(echo $RULE_JSON | jq -r '.destinationAddressPrefix')
                        PRIORITY=$(echo $RULE_JSON | jq -r '.priority')
                        
                        echo -e "${YELLOW}Restricting rule $RULE_NAME to specific IP range instead of any-to-any...${NC}"
                        
                        # Update the rule with more restrictive source address
                        run_command "az network nsg rule update -g $RG_NAME --nsg-name $NSG_NAME -n \"$RULE_NAME\" --direction $DIRECTION --protocol $PROTOCOL --source-port-range $SOURCE_PORT_RANGE --destination-port-range $DEST_PORT_RANGE --source-address-prefix $CORPORATE_IP --destination-address-prefix $DEST_ADDR_PREFIX --access Allow --priority $PRIORITY" "Restrict rule $RULE_NAME to allow access only from corporate IP range"
                        
                        log_fix "Restricted overly permissive rule $RULE_NAME in NSG $NSG_NAME to only allow traffic from $CORPORATE_IP"
                    done
                else
                    echo -e "${GREEN}No overly permissive rules found in NSG $NSG_NAME${NC}"
                fi
            elif [[ "$RESOURCE_ID" == */virtualMachines/* ]]; then
                # VM-related NSG issue
                VM_NAME=$(echo $RESOURCE_ID | cut -d'/' -f9)
                RG_NAME=$(echo $RESOURCE_ID | cut -d'/' -f5)
                
                echo -e "\n${YELLOW}Processing network security for VM: ${BOLD}$VM_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
                
                # Get the NIC ID associated with the VM
                NIC_ID=$(run_command "az vm show -g $RG_NAME -n $VM_NAME --query 'networkProfile.networkInterfaces[0].id' -o tsv" "Get VM network interface ID")
                
                if [ -n "$NIC_ID" ]; then
                    NIC_NAME=$(echo "$NIC_ID" | cut -d'/' -f9)
                    
                    # Check if an NSG is already associated with the NIC
                    NSG_ID=$(run_command "az network nic show -g $RG_NAME -n $NIC_NAME --query 'networkSecurityGroup.id' -o tsv" "Check for existing NSG")
                    
                    if [ -z "$NSG_ID" ] || [ "$NSG_ID" = "null" ]; then
                        # No NSG exists, create one
                        NSG_NAME="${VM_NAME}-nsg"
                        run_command "az network nsg create -g $RG_NAME -n $NSG_NAME" "Create NSG for VM $VM_NAME"
                        
                        # Create restricted management port rules
                        CORPORATE_IP="10.0.0.0/24" # Example - replace with actual IP range
                        
                        # Allow SSH from corporate network only
                        run_command "az network nsg rule create -g $RG_NAME --nsg-name $NSG_NAME -n 'Allow-SSH-From-Corporate' --priority 100 --source-address-prefixes $CORPORATE_IP --source-port-ranges '*' --destination-address-prefixes '*' --destination-port-ranges 22 --access Allow --protocol Tcp --description 'Allow SSH from corporate IPs only'" "Create restricted SSH rule"
                        
                        # Allow RDP from corporate network only
                        run_command "az network nsg rule create -g $RG_NAME --nsg-name $NSG_NAME -n 'Allow-RDP-From-Corporate' --priority 110 --source-address-prefixes $CORPORATE_IP --source-port-ranges '*' --destination-address-prefixes '*' --destination-port-ranges 3389 --access Allow --protocol Tcp --description 'Allow RDP from corporate IPs only'" "Create restricted RDP rule"
                        
                        # Block management ports from Internet
                        run_command "az network nsg rule create -g $RG_NAME --nsg-name $NSG_NAME -n 'Deny-Public-Management-Ports' --priority 120 --source-address-prefixes 'Internet' --source-port-ranges '*' --destination-address-prefixes '*' --destination-port-ranges '22,3389,5985,5986' --access Deny --protocol Tcp --description 'Block management ports from public internet'" "Block public access to management ports"
                        
                        # Associate NSG with NIC
                        run_command "az network nic update -g $RG_NAME -n $NIC_NAME --network-security-group $NSG_NAME" "Associate new NSG with VM's network interface"
                        
                        log_fix "Created and applied network security group $NSG_NAME with restricted management port access for VM $VM_NAME"
                    else
                        NSG_NAME=$(echo "$NSG_ID" | cut -d'/' -f9)
                        echo -e "${YELLOW}VM $VM_NAME already has NSG $NSG_NAME. Checking rules...${NC}"
                        
                        # Check for overly permissive rules
                        RULES=$(run_command "az network nsg rule list -g $RG_NAME --nsg-name $NSG_NAME --query \"[?access=='Allow' && sourceAddressPrefix=='*' && (contains(destinationPortRange, '22') || contains(destinationPortRange, '3389') || contains(destinationPortRange, '5985') || contains(destinationPortRange, '5986'))]\" -o json" "Find overly permissive rules for management ports")
                        
                        if [ -n "$RULES" ] && [ "$RULES" != "[]" ]; then
                            echo -e "${YELLOW}Found overly permissive rules allowing management ports from any source${NC}"
                            
                            # Define a more restrictive source address prefix
                            CORPORATE_IP="10.0.0.0/24" # Example - replace with actual IP range
                            
                            # Process each rule
                            echo "$RULES" | jq -c '.[]' | while read -r RULE_JSON; do
                                RULE_NAME=$(echo $RULE_JSON | jq -r '.name')
                                PROTOCOL=$(echo $RULE_JSON | jq -r '.protocol')
                                DIRECTION=$(echo $RULE_JSON | jq -r '.direction')
                                SOURCE_PORT_RANGE=$(echo $RULE_JSON | jq -r '.sourcePortRange')
                                DEST_PORT_RANGE=$(echo $RULE_JSON | jq -r '.destinationPortRange')
                                DEST_ADDR_PREFIX=$(echo $RULE_JSON | jq -r '.destinationAddressPrefix')
                                PRIORITY=$(echo $RULE_JSON | jq -r '.priority')
                                
                                echo -e "${YELLOW}Restricting rule $RULE_NAME to specific IP range instead of any-to-any...${NC}"
                                
                                # Update the rule with more restrictive source address
                                run_command "az network nsg rule update -g $RG_NAME --nsg-name $NSG_NAME -n \"$RULE_NAME\" --direction $DIRECTION --protocol $PROTOCOL --source-port-range $SOURCE_PORT_RANGE --destination-port-range $DEST_PORT_RANGE --source-address-prefix $CORPORATE_IP --destination-address-prefix $DEST_ADDR_PREFIX --access Allow --priority $PRIORITY" "Restrict rule $RULE_NAME to allow access only from corporate IP range"
                                
                                log_fix "Restricted overly permissive rule $RULE_NAME in NSG $NSG_NAME to only allow traffic from $CORPORATE_IP"
                            done
                        else
                            echo -e "${GREEN}No overly permissive rules found in NSG $NSG_NAME${NC}"
                        fi
                    fi
                else
                    echo -e "${RED}Could not find network interface for VM $VM_NAME${NC}"
                fi
            fi
        done
    else
        echo -e "${GREEN}No NSG recommendations found.${NC}"
    fi
    
    # 4. Enable disk encryption
    echo -e "\n${YELLOW}Enabling disk encryption...${NC}"
    DISK_ENC_RECS=$(jq -r '.[] | select(.category == "Security" and (.shortDescription.problem | contains("disk encryption"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$DISK_ENC_RECS" ]; then
        echo -e "${YELLOW}Found disk encryption recommendations. Processing...${NC}"
        
        echo "$DISK_ENC_RECS" | while read -r VM_ID; do
            if [ -z "$VM_ID" ]; then
                continue
            fi
            
            # Extract resource group and VM name
            RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
            VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enabling disk encryption for VM: ${BOLD}$VM_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get VM location
            LOCATION=$(run_command "az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv" "Get VM location")
            
            # Create Key Vault if it doesn't exist
            KV_NAME="${RG_NAME}-kv"
            KV_EXISTS=$(run_command "az keyvault list -g $RG_NAME --query \"[?name=='$KV_NAME'].name\" -o tsv" "Check if Key Vault exists")
            
            if [ -z "$KV_EXISTS" ]; then
                run_command "az keyvault create -n $KV_NAME -g $RG_NAME -l $LOCATION --enabled-for-disk-encryption" "Create Key Vault $KV_NAME for disk encryption"
            fi
            
            # Enable encryption
            run_command "az vm encryption enable -g $RG_NAME -n $VM_NAME --disk-encryption-keyvault $KV_NAME" "Enable disk encryption for VM $VM_NAME"
            
            log_fix "Enabled disk encryption for VM $VM_NAME using Key Vault $KV_NAME"
        done
    else
        echo -e "${GREEN}No disk encryption recommendations found.${NC}"
    fi
    
    # 5. Enable Key Vault Firewalls
    echo -e "\n${YELLOW}Enabling Key Vault Firewalls...${NC}"
    KV_FIREWALL_RECS=$(jq -r '.[] | select(.category == "Security" and (.shortDescription.problem | contains("Firewall should be enabled on Key Vault"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$KV_FIREWALL_RECS" ]; then
        echo -e "${YELLOW}Found Key Vaults requiring firewall configuration. Processing...${NC}"
        
        echo "$KV_FIREWALL_RECS" | while read -r KV_ID; do
            if [ -z "$KV_ID" ]; then
                continue
            fi
            
            # Extract resource group and Key Vault name
            RG_NAME=$(echo $KV_ID | cut -d'/' -f5)
            KV_NAME=$(echo $KV_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enabling firewall for Key Vault: ${BOLD}$KV_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get the current client IP address
            CLIENT_IP=$(run_command "curl -s https://api.ipify.org" "Get current public IP address")
            
            # Enable firewall rules and allow the current IP
            run_command "az keyvault update --name $KV_NAME --resource-group $RG_NAME --default-action Deny" "Set Key Vault network default action to Deny"
            run_command "az keyvault network-rule add --name $KV_NAME --resource-group $RG_NAME --ip-address $CLIENT_IP/32" "Allow current IP address $CLIENT_IP"
            
            # Allow Azure services bypass
            run_command "az keyvault update --name $KV_NAME --resource-group $RG_NAME --bypass AzureServices" "Allow trusted Azure services to bypass firewall"
            
            log_fix "Enabled firewall on Key Vault $KV_NAME with secure network rules"
        done
    else
        echo -e "${GREEN}No Key Vaults requiring firewall configuration found.${NC}"
    fi
    
    # 6. Enable SQL Server Azure AD Admin
    echo -e "\n${YELLOW}Setting up SQL Server AAD Admin...${NC}"
    SQL_AAD_RECS=$(jq -r '.[] | select(.category == "Security" and (.shortDescription.problem | contains("SQL servers should have an Azure Active Directory administrator"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$SQL_AAD_RECS" ]; then
        echo -e "${YELLOW}Found SQL servers requiring AAD Admin. Processing...${NC}"
        
        echo "$SQL_AAD_RECS" | while read -r SQL_ID; do
            if [ -z "$SQL_ID" ]; then
                continue
            fi
            
            # Extract resource group and server name
            RG_NAME=$(echo $SQL_ID | cut -d'/' -f5)
            SERVER_NAME=$(echo $SQL_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Setting up AAD Admin for SQL server: ${BOLD}$SERVER_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get the current signed-in user's object ID (for the AAD admin)
            CURRENT_USER_ID=$(run_command "az ad signed-in-user show --query id -o tsv" "Get current user's object ID")
            CURRENT_USER_NAME=$(run_command "az ad signed-in-user show --query userPrincipalName -o tsv" "Get current user's name")
            
            # Set the current user as the AAD admin
            run_command "az sql server ad-admin create --resource-group $RG_NAME --server-name $SERVER_NAME --display-name \"$CURRENT_USER_NAME\" --object-id $CURRENT_USER_ID" "Set AAD admin for SQL server $SERVER_NAME"
            
            log_fix "Set Azure AD admin ($CURRENT_USER_NAME) for SQL server $SERVER_NAME"
        done
    else
        echo -e "${GREEN}No SQL servers requiring AAD Admin found.${NC}"
    fi
fi

# ===================================
# FIX RELIABILITY RECOMMENDATIONS
# ===================================
if [ "$FIX_RELIABILITY" = "true" ]; then
    echo -e "\n${BLUE}${BOLD}▶ RELIABILITY RECOMMENDATIONS (Estimated score: 72%)${NC}"
    
    # 1. Enable VM backup
    echo -e "\n${YELLOW}Enabling VM backup...${NC}"
    VM_BACKUP_RECS=$(jq -r '.[] | select(.category == "HighAvailability" and (.shortDescription.problem | contains("backup"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$VM_BACKUP_RECS" ]; then
        echo -e "${YELLOW}Found VMs requiring backup. Processing...${NC}"
        
        echo "$VM_BACKUP_RECS" | while read -r VM_ID; do
            if [ -z "$VM_ID" ]; then
                continue
            fi
            
            # Extract resource group and VM name
            RG_NAME=$(echo $VM_ID | cut -d'/' -f5)
            VM_NAME=$(echo $VM_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enabling backup for VM: ${BOLD}$VM_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get VM location
            LOCATION=$(run_command "az vm show -g $RG_NAME -n $VM_NAME --query location -o tsv" "Get VM location")
            
            # Create Recovery Services Vault if it doesn't exist
            VAULT_NAME="${RG_NAME}-vault"
            VAULT_EXISTS=$(run_command "az backup vault list -g $RG_NAME --query \"[?name=='$VAULT_NAME'].name\" -o tsv" "Check if Recovery Services vault exists")
            
            if [ -z "$VAULT_EXISTS" ]; then
                run_command "az backup vault create --name $VAULT_NAME --resource-group $RG_NAME --location $LOCATION" "Create Recovery Services vault $VAULT_NAME"
            fi
            
            # Check if the default policy exists, create it if not
            POLICY_NAME="DefaultPolicy"
            POLICY_EXISTS=$(run_command "az backup policy list -g $RG_NAME -v $VAULT_NAME --query \"[?name=='$POLICY_NAME'].name\" -o tsv" "Check if backup policy exists")
            
            if [ -z "$POLICY_EXISTS" ]; then
                # Creating a basic daily backup policy at 2:30 AM with 30-day retention
                run_command "az backup policy create -n $POLICY_NAME -v $VAULT_NAME -g $RG_NAME --backup-management-type AzureIaasVM --policy '{\"schedulePolicy\":{\"schedulePolicyType\":\"SimpleSchedulePolicy\",\"scheduleRunFrequency\":\"Daily\",\"scheduleRunDays\":null,\"scheduleRunTimes\":[\"2019-09-26T02:30:00+00:00\"],\"scheduleWeeklyFrequency\":0},\"retentionPolicy\":{\"retentionPolicyType\":\"LongTermRetentionPolicy\",\"dailySchedule\":{\"retentionTimes\":[\"2019-09-26T02:30:00+00:00\"],\"retentionDuration\":{\"count\":30,\"durationType\":\"Days\"}}},\"timeZone\":\"UTC\"}'" "Create default daily backup policy"
            fi
            
            # Enable backup
            run_command "az backup protection enable-for-vm -g $RG_NAME -v $VAULT_NAME --vm $VM_ID --policy-name $POLICY_NAME" "Enable backup for VM $VM_NAME"
            
            log_fix "Enabled backup for VM $VM_NAME using vault $VAULT_NAME with daily backup policy"
        done
    else
        echo -e "${GREEN}No VMs requiring backup found.${NC}"
    fi
    
    # 2. Enable Soft Delete for Blob Storage
    echo -e "\n${YELLOW}Enabling Soft Delete for Blob Storage...${NC}"
    SOFT_DELETE_RECS=$(jq -r '.[] | select(.category == "HighAvailability" and (.shortDescription.problem | contains("Enable Soft Delete to protect your blob data"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$SOFT_DELETE_RECS" ]; then
        echo -e "${YELLOW}Found Storage Accounts requiring Soft Delete. Processing...${NC}"
        
        echo "$SOFT_DELETE_RECS" | while read -r STORAGE_ID; do
            if [ -z "$STORAGE_ID" ]; then
                continue
            fi
            
            # Extract resource group and storage account name
            RG_NAME=$(echo $STORAGE_ID | cut -d'/' -f5)
            STORAGE_NAME=$(echo $STORAGE_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enabling Soft Delete for Storage Account: ${BOLD}$STORAGE_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Enable soft delete with a 7-day retention period
            run_command "az storage account blob-service-properties update --account-name $STORAGE_NAME --resource-group $RG_NAME --enable-delete-retention true --delete-retention-days 7" "Enable Soft Delete for Storage Account $STORAGE_NAME with 7-day retention"
            
            log_fix "Enabled Soft Delete with 7-day retention for Storage Account $STORAGE_NAME"
        done
    else
        echo -e "${GREEN}No Storage Accounts requiring Soft Delete found.${NC}"
    fi
    
    # 3. Enable Azure Service Health Alerts
    echo -e "\n${YELLOW}Setting up Azure Service Health alerts...${NC}"
    HEALTH_ALERT_RECS=$(jq -r '.[] | select(.category == "HighAvailability" and (.shortDescription.problem | contains("Create an Azure Service Health alert"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$HEALTH_ALERT_RECS" ] || [ "$HEALTH_ALERT_RECS" = "null" ]; then
        echo -e "${YELLOW}Checking for Service Health alerts...${NC}"
        
        # Create Azure Service Health alert for the subscription
        ALERT_NAME="ServiceHealthAlert"
        LOCATION="australiaeast" # Use your primary region - this should be customized
        RESOURCE_GROUP=$(run_command "az group list --query \"[0].name\" -o tsv" "Get a resource group for alerts")
        
        if [ -z "$RESOURCE_GROUP" ]; then
            echo -e "${RED}No resource groups found. Cannot create Service Health alerts.${NC}"
        else
            # Create action group for email notifications
            ACTION_GROUP_NAME="ServiceHealthActionGroup"
            EMAIL=$(run_command "az account show --query user.name -o tsv" "Get current user email")
            
            if [ -z "$EMAIL" ]; then
                EMAIL="admin@example.com"  # Fallback email - this should be updated
            fi
            
            run_command "az monitor action-group create --name $ACTION_GROUP_NAME --resource-group $RESOURCE_GROUP --action email --email $EMAIL --short-name 'SvcHealth'" "Create action group for Service Health alerts"
            
            # Create Service Health alert
            SUBSCRIPTION_ID=$(run_command "az account show --query id -o tsv" "Get current subscription ID")
            run_command "az monitor activity-log alert create --name $ALERT_NAME --resource-group $RESOURCE_GROUP --scopes /subscriptions/$SUBSCRIPTION_ID --condition category=ServiceHealth --action-group $ACTION_GROUP_NAME" "Create Service Health alert"
            
            log_fix "Created Azure Service Health alert with email notifications to $EMAIL"
        fi
    else
        echo -e "${GREEN}Service Health alerts are already configured.${NC}"
    fi
    
    # 4. Handle storage redundancy
    echo -e "\n${YELLOW}Improving storage redundancy...${NC}"
    STORAGE_REDUNDANCY_RECS=$(jq -r '.[] | select(.category == "HighAvailability" and (.shortDescription.problem | contains("redundancy"))) | .resourceMetadata.resourceId' advisor_recommendations.json | grep "/storageAccounts/")
    
    if [ -n "$STORAGE_REDUNDANCY_RECS" ]; then
        echo -e "${YELLOW}Found storage redundancy recommendations. Processing...${NC}"
        
        echo "$STORAGE_REDUNDANCY_RECS" | while read -r STORAGE_ID; do
            if [ -z "$STORAGE_ID" ]; then
                continue
            fi
            
            # Extract resource group and storage account name
            RG_NAME=$(echo $STORAGE_ID | cut -d'/' -f5)
            STORAGE_NAME=$(echo $STORAGE_ID | cut -d'/' -f9)
            
            echo -e "\n${YELLOW}Enhancing redundancy for storage account: ${BOLD}$STORAGE_NAME${NC} in resource group ${BOLD}$RG_NAME${NC}"
            
            # Get current redundancy
            CURRENT_SKU=$(run_command "az storage account show -n $STORAGE_NAME -g $RG_NAME --query sku.name -o tsv" "Get current storage redundancy")
            echo "Current redundancy (SKU): $CURRENT_SKU"
            
            if [[ "$CURRENT_SKU" == "Standard_LRS" ]]; then
                # Upgrade Standard LRS to GRS
                NEW_SKU="Standard_GRS"
                run_command "az storage account update -n $STORAGE_NAME -g $RG_NAME --sku $NEW_SKU" "Upgrade storage account from Standard_LRS to Standard_GRS"
                log_fix "Upgraded storage account $STORAGE_NAME from $CURRENT_SKU to $NEW_SKU"
            elif [[ "$CURRENT_SKU" == "Premium_LRS" ]]; then
                # Upgrade Premium LRS to ZRS (Premium can't use GRS)
                NEW_SKU="Premium_ZRS"
                run_command "az storage account update -n $STORAGE_NAME -g $RG_NAME --sku $NEW_SKU" "Upgrade storage account from Premium_LRS to Premium_ZRS"
                log_fix "Upgraded storage account $STORAGE_NAME from $CURRENT_SKU to $NEW_SKU"
            else
                echo -e "${GREEN}Storage account $STORAGE_NAME already has adequate redundancy: $CURRENT_SKU${NC}"
            fi
        done
    else
        echo -e "${GREEN}No storage redundancy recommendations found.${NC}"
    fi
    
    # 5. Zone Redundancy Recommendations (manual action)
    echo -e "\n${YELLOW}Identifying Zone Redundancy opportunities...${NC}"
    ZONE_REDUNDANCY_RECS=$(jq -r '.[] | select(.category == "HighAvailability" and (.shortDescription.problem | contains("zone redundancy") or contains("Zone Redundant"))) | .resourceMetadata.resourceId' advisor_recommendations.json)
    
    if [ -n "$ZONE_REDUNDANCY_RECS" ]; then
        echo -e "${YELLOW}Found resources that could benefit from Zone Redundancy. Creating report...${NC}"
        
        # Create a report for manual action - zone redundancy typically requires recreation
        ZONE_REDUNDANCY_REPORT="$REMEDIATION_DIR/zone_redundancy_recommendations.txt"
        {
            echo "Zone Redundancy Recommendations"
            echo "==============================="
            echo "These recommendations typically require downtime and careful migration planning."
            echo "Review each resource and plan for zone redundancy implementation."
            echo ""
            
            echo "$ZONE_REDUNDANCY_RECS" | while read -r RESOURCE_ID; do
                if [ -z "$RESOURCE_ID" ]; then
                    continue
                fi
                
                RESOURCE_TYPE=$(echo "$RESOURCE_ID" | cut -d'/' -f7)
                RESOURCE_GROUP=$(echo "$RESOURCE_ID" | cut -d'/' -f5)
                RESOURCE_NAME=$(echo "$RESOURCE_ID" | cut -d'/' -f9)
                
                echo "Resource: $RESOURCE_NAME"
                echo "Type: $RESOURCE_TYPE"
                echo "Resource Group: $RESOURCE_GROUP"
                echo "Action needed: Enable zone redundancy"
                echo ""
                
                # Provide resource-specific guidance when possible
                case "$RESOURCE_TYPE" in
                    "Microsoft.Sql/servers")
                        echo "  For SQL databases, you can use:"
                        echo "  az sql db update --name <database_name> --resource-group $RESOURCE_GROUP --server $RESOURCE_NAME --zone-redundant true"
                        ;;
                    "Microsoft.Storage/storageAccounts")
                        echo "  For storage accounts, you typically need to recreate the account with ZRS:"
                        echo "  az storage account create --name $RESOURCE_NAME --resource-group $RESOURCE_GROUP --sku Standard_ZRS --location <region-with-zones>"
                        ;;
                    "Microsoft.Network/publicIPAddresses")
                        echo "  For public IP addresses, you need to create a new Standard SKU, zone-redundant IP:"
                        echo "  az network public-ip create --name $RESOURCE_NAME --resource-group $RESOURCE_GROUP --sku Standard --tier Regional --allocation-method Static --zone 1 2 3"
                        ;;
                    "Microsoft.Network/loadBalancers")
                        echo "  For load balancers, you need to recreate as Standard SKU with zone redundancy:"
                        echo "  az network lb create --name $RESOURCE_NAME --resource-group $RESOURCE_GROUP --sku Standard --frontend-ip-zone 1 2 3"
                        ;;
                    *)
                        echo "  This resource type requires specific handling - review in Azure Portal"
                        ;;
                esac
                echo ""
            done
        } > "$ZONE_REDUNDANCY_REPORT"
        
        echo -e "${GREEN}Created Zone Redundancy report: $ZONE_REDUNDANCY_REPORT${NC}"
        log_fix "Identified resources requiring Zone Redundancy (manual action required)"
    else
        echo -e "${GREEN}No Zone Redundancy recommendations found.${NC}"
    fi
fi

# ===================================
# GENERATE COMPREHENSIVE REPORT
# ===================================
echo -e "\n${YELLOW}Creating comprehensive report...${NC}"
REPORT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="$REMEDIATION_DIR/azure_advisor_remediation_report_$REPORT_DATE.txt"

{
    echo "Azure Advisor Unified Remediation Report"
    echo "========================================"
    echo "Date: $REPORT_DATE"
    echo "Subscription: $SUBSCRIPTION_NAME"
    echo "Mode: $(if [ "$WHATIF" = "true" ]; then echo "Simulation (no changes applied)"; else echo "Apply (changes applied)"; fi)"
    echo ""
    echo "SUMMARY OF ACTIONS"
    echo "=================="
    echo "Cost recommendations addressed: $(if [ "$FIX_COST" = "true" ]; then echo "Yes"; else echo "No"; fi)"
    echo "Security recommendations addressed: $(if [ "$FIX_SECURITY" = "true" ]; then echo "Yes"; else echo "No"; fi)"
    echo "Reliability recommendations addressed: $(if [ "$FIX_RELIABILITY" = "true" ]; then echo "Yes"; else echo "No"; fi)"
    echo ""
    echo "RECOMMENDATION BREAKDOWN"
    echo "======================="
    echo "Total recommendations: $TOTAL_RECOMMENDATIONS"
    echo "- Cost: $COST_RECOMMENDATIONS"
    echo "- Security: $SECURITY_RECOMMENDATIONS"
    echo "- Reliability: $RELIABILITY_RECOMMENDATIONS"
    echo ""
    echo "FIXES APPLIED"
    echo "============="
    if [ ${#FIXES_APPLIED[@]} -eq 0 ]; then
        echo "No fixes were applied."
    else
        for fix in "${FIXES_APPLIED[@]}"; do
            echo "- $fix"
        done
    fi
    echo ""
    echo "ARTIFACT FILES"
    echo "=============="
    echo "Recommendations JSON: $REMEDIATION_DIR/advisor_recommendations.json"
    if [ -f "$REMEDIATION_DIR/reserved_instance_recommendations.txt" ]; then
        echo "Reserved Instance Report: $REMEDIATION_DIR/reserved_instance_recommendations.txt"
    fi
    if [ -f "$REMEDIATION_DIR/zone_redundancy_recommendations.txt" ]; then
        echo "Zone Redundancy Report: $REMEDIATION_DIR/zone_redundancy_recommendations.txt"
    fi
    echo ""
    echo "NEXT STEPS"
    echo "=========="
    echo "1. Review the comprehensive report and individual recommendation files"
    echo "2. Address any manual action items identified in the reports"
    echo "3. Run Azure Advisor again to verify improvements"
    echo "4. Schedule regular runs of this script for ongoing optimization"
    echo "5. Consider implementing additional recommended practices:"
    echo "   - Setting up budget alerts"
    echo "   - Implementing resource tagging for better cost management"
    echo "   - Establishing regular review process for Azure Security Score"
    echo ""
    echo "Note: This script addresses the most common Azure Advisor recommendations"
    echo "but may not cover all specific scenarios for your environment."
} > "$REPORT_FILE"

echo -e "${GREEN}Created comprehensive report: $REPORT_FILE${NC}"

# ===================================
# FINAL SUMMARY
# ===================================
echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}Script execution complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}Remediation directory: $REMEDIATION_DIR${NC}"

if [ "$WHATIF" = "true" ]; then
    echo -e "${YELLOW}This was a simulation run. No changes were made to your environment.${NC}"
    echo -e "${YELLOW}To apply changes, run again with the --apply flag and your desired --fix options${NC}"
    echo -e "${YELLOW}Example: $0 --fix-security --apply${NC}"
else
    echo -e "${GREEN}Fixes have been applied to your Azure environment.${NC}"
    echo -e "${GREEN}Please verify the changes in the Azure Portal.${NC}"
fi

if [ ${#FIXES_APPLIED[@]} -gt 0 ]; then
    echo -e "\n${BLUE}Summary of $((${#FIXES_APPLIED[@]})) fixes:${NC}"
    for ((i=0; i<${#FIXES_APPLIED[@]} && i<5; i++)); do
        echo -e "- ${FIXES_APPLIED[$i]}"
    done
    
    if [ ${#FIXES_APPLIED[@]} -gt 5 ]; then
        echo -e "- ... and $((${#FIXES_APPLIED[@]}-5)) more (see full report)"
    fi
fi

echo -e "\n${GREEN}View the full report at: $REPORT_FILE${NC}"
echo -e "${BLUE}============================================${NC}"