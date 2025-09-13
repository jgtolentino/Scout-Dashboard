#!/usr/bin/env bash
set -euo pipefail

# Configuration
RG="tbwa-client360-dashboard"
APP="tbwa-client360-dashboard-production"
CUSTOM_DOMAIN=${1:-"client360.tbwa.com"}  # Use argument or default

echo "🔒 Binding custom domain to Static Web App..."
az staticwebapp hostname set \
  --resource-group "$RG" \
  --name "$APP" \
  --hostname "$CUSTOM_DOMAIN"

echo "✅ Custom domain binding initiated for: $CUSTOM_DOMAIN"
echo ""
echo "🔶 IMPORTANT DNS SETUP STEPS 🔶"
echo "------------------------------"
echo "1. In your DNS provider, create a CNAME record:"
echo "   - Name: ${CUSTOM_DOMAIN%%.*}"  # Extract subdomain
echo "   - Value: $(az staticwebapp show --name "$APP" --resource-group "$RG" --query "defaultHostname" -o tsv)"
echo ""
echo "2. DNS propagation may take up to 48 hours."
echo ""
echo "3. To verify the domain status:"
echo "   az staticwebapp hostname list --name $APP --resource-group $RG"
echo ""
echo "4. Once DNS propagation is complete, test your site at:"
echo "   https://$CUSTOM_DOMAIN"
echo ""
echo "5. Update your verification script with the new domain:"
echo "   sed -i '' \"s|proud-forest-.*\.azurestaticapps\.net|$CUSTOM_DOMAIN|g\" ./scripts/verify-production.sh"