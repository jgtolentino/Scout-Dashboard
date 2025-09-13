#!/bin/bash
# Network Security Group Review and Enhancement Script
# Analyzes NSG rules and recommends security improvements

echo "==== Network Security Group Review and Enhancement ===="
echo "Analyzing and enhancing network security group rules in TBWA-ProjectScout-Prod subscription"
echo ""

# Create output directory
OUTPUT_DIR="nsg_security_$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

# Get all NSGs
echo "Retrieving Network Security Groups..."
az network nsg list --query "[].{Name:name,ResourceGroup:resourceGroup,Location:location}" -o json > "$OUTPUT_DIR/nsgs.json"

# Identify NSGs from the inventory
NSGS=(
  "projectscout-superset-vmNSG:RG-TBWA-ProjectScout-Compute"
  "workers-sg:databricks-rg-tbwa-juicer-databricks-qbewkrq702bx5"
)

echo "=== Network Security Group Analysis Results ===" > "$OUTPUT_DIR/nsg_security_results.txt"

# Process each NSG
for NSG_INFO in "${NSGS[@]}"; do
  NSG_NAME=$(echo "$NSG_INFO" | cut -d':' -f1)
  RESOURCE_GROUP=$(echo "$NSG_INFO" | cut -d':' -f2)
  
  echo "Processing NSG: $NSG_NAME in resource group: $RESOURCE_GROUP..."
  echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "Network Security Group: $NSG_NAME" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "Resource Group: $RESOURCE_GROUP" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "---------------------------------" >> "$OUTPUT_DIR/nsg_security_results.txt"
  
  # Check if NSG exists
  if ! az network nsg show --name "$NSG_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "❌ NSG $NSG_NAME not found or access denied." >> "$OUTPUT_DIR/nsg_security_results.txt"
    continue
  fi
  
  # 1. Analyze NSG rules
  echo "Analyzing NSG rules..."
  
  # Get all security rules
  az network nsg rule list --nsg-name "$NSG_NAME" --resource-group "$RESOURCE_GROUP" -o json > "$OUTPUT_DIR/${NSG_NAME}_rules.json"
  
  # Identify overly permissive rules
  OVERLY_PERMISSIVE=$(jq '.[] | select(.sourceAddressPrefix=="*" and .destinationAddressPrefix=="*" and .access=="Allow") | .name' "$OUTPUT_DIR/${NSG_NAME}_rules.json" -r)
  
  if [ -n "$OVERLY_PERMISSIVE" ]; then
    echo "⚠️ Found overly permissive rules:" >> "$OUTPUT_DIR/nsg_security_results.txt"
    for RULE in $OVERLY_PERMISSIVE; do
      echo "  - $RULE" >> "$OUTPUT_DIR/nsg_security_results.txt"
    done
    echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
  else
    echo "✅ No overly permissive rules found" >> "$OUTPUT_DIR/nsg_security_results.txt"
  fi
  
  # Check for management ports exposed to the internet
  MANAGEMENT_PORTS_EXPOSED=$(jq '.[] | select(.sourceAddressPrefix=="*" and .access=="Allow" and (.destinationPortRange=="22" or .destinationPortRange=="3389" or .destinationPortRange=="5985" or .destinationPortRange=="5986")) | .name' "$OUTPUT_DIR/${NSG_NAME}_rules.json" -r)
  
  if [ -n "$MANAGEMENT_PORTS_EXPOSED" ]; then
    echo "⚠️ Found management ports exposed to internet:" >> "$OUTPUT_DIR/nsg_security_results.txt"
    for RULE in $MANAGEMENT_PORTS_EXPOSED; do
      echo "  - $RULE" >> "$OUTPUT_DIR/nsg_security_results.txt"
    done
    echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
    
    # Generate remediation commands for management ports
    echo "Remediation commands to restrict management ports:" >> "$OUTPUT_DIR/nsg_security_results.txt"
    for RULE in $MANAGEMENT_PORTS_EXPOSED; do
      # Get rule details
      RULE_JSON=$(jq --arg rule "$RULE" '.[] | select(.name==$rule)' "$OUTPUT_DIR/${NSG_NAME}_rules.json")
      PRIORITY=$(echo "$RULE_JSON" | jq '.priority')
      DIRECTION=$(echo "$RULE_JSON" | jq -r '.direction')
      DEST_PORT=$(echo "$RULE_JSON" | jq -r '.destinationPortRange')
      
      echo "  # Restrict rule $RULE to only allow from corporate network" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "  az network nsg rule update --name \"$RULE\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --nsg-name \"$NSG_NAME\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --resource-group \"$RESOURCE_GROUP\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --source-address-prefix \"10.0.0.0/8\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --priority $PRIORITY \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --direction \"$DIRECTION\"" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
      
      # Create deny rule for public access
      NEW_PRIORITY=$((PRIORITY + 1))
      echo "  # Add deny rule for public access to port $DEST_PORT" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "  az network nsg rule create --name \"Deny${DEST_PORT}FromInternet\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --nsg-name \"$NSG_NAME\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --resource-group \"$RESOURCE_GROUP\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --source-address-prefix \"Internet\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --destination-address-prefix \"*\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --destination-port-range \"$DEST_PORT\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --access Deny \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --protocol \"*\" \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --priority $NEW_PRIORITY \\" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "    --direction \"$DIRECTION\"" >> "$OUTPUT_DIR/nsg_security_results.txt"
      echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
    done
  else
    echo "✅ No management ports exposed to internet" >> "$OUTPUT_DIR/nsg_security_results.txt"
  fi
  
  # Check for documented rules
  DOCUMENTED_RULES=$(jq '.[] | select(.description==null or .description=="") | .name' "$OUTPUT_DIR/${NSG_NAME}_rules.json" -r)
  
  if [ -n "$DOCUMENTED_RULES" ]; then
    echo "⚠️ Found rules without documentation:" >> "$OUTPUT_DIR/nsg_security_results.txt"
    for RULE in $DOCUMENTED_RULES; do
      echo "  - $RULE" >> "$OUTPUT_DIR/nsg_security_results.txt"
    done
    echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
  else
    echo "✅ All rules have documentation" >> "$OUTPUT_DIR/nsg_security_results.txt"
  fi
  
  # 2. Additional security recommendations
  echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "Additional security recommendations:" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "1. Consider implementing Azure Firewall or Application Gateway for additional protection" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "2. Implement Just-In-Time VM access for virtual machines" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "3. Use Service Endpoints to secure services like SQL and Storage" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "4. Implement Azure Private Link for sensitive PaaS services" >> "$OUTPUT_DIR/nsg_security_results.txt"
  echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
done

# Create a summary of findings and recommendations
echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "=== Summary of Network Security Findings ===" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "Based on the analysis, the following actions are recommended:" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "1. Restrict management port access (SSH/RDP) to specific IP ranges" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "2. Add descriptive documentation to all NSG rules" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "3. Review and tighten overly permissive rules" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "4. Implement recommended security services (Azure Firewall, Just-In-Time access)" >> "$OUTPUT_DIR/nsg_security_results.txt"
echo "" >> "$OUTPUT_DIR/nsg_security_results.txt"

echo "Network security group analysis complete. Results saved to $OUTPUT_DIR/nsg_security_results.txt"
echo ""
echo "Review the recommended changes in $OUTPUT_DIR/nsg_security_results.txt and apply them manually after validation."
echo "Custom rules should be carefully reviewed to ensure they don't impact required application functionality."