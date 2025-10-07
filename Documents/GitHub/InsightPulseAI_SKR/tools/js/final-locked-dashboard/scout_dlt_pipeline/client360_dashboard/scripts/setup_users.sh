#!/bin/bash
# Script to set up user access for Client360 Dashboard
set -e

echo "👥 Setting up user access for Client360 Dashboard..."

# Resource group and app name
RG="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"

# Get the resource ID for the Static Web App
RESOURCE_ID=$(az staticwebapp show --name "$APP_NAME" --resource-group "$RG" --query id -o tsv)

if [ -z "$RESOURCE_ID" ]; then
    echo "❌ Could not find Static Web App $APP_NAME"
    exit 1
fi

echo "📍 Found Static Web App: $RESOURCE_ID"

# User roles to assign
declare -A USERS=(
    ["admin@tbwa.com"]="Owner"
    ["dashboard-team@tbwa.com"]="Contributor"
    ["manager@tbwa.com"]="Reader"
    ["analyst@tbwa.com"]="Reader"
)

# Assign roles to users
for email in "${!USERS[@]}"; do
    role="${USERS[$email]}"
    echo "🔑 Granting $role access to $email..."
    
    # Check if user exists in Azure AD
    USER_ID=$(az ad user list --filter "mail eq '$email'" --query "[0].id" -o tsv 2>/dev/null || echo "")
    
    if [ -z "$USER_ID" ]; then
        echo "⚠️ User $email not found in Azure AD. Skipping..."
        continue
    fi
    
    # Assign role
    az role assignment create \
        --assignee "$USER_ID" \
        --role "$role" \
        --scope "$RESOURCE_ID"
    
    echo "✅ Successfully granted $role access to $email"
done

# Create invitation email template
EMAIL_TEMPLATE="client360_invitation.html"
cat > "$EMAIL_TEMPLATE" << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Client360 Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #002B80; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #00C3EC; color: #002B80; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Client360 Dashboard</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You have been granted access to the TBWA Client360 Dashboard. This powerful tool provides insights into store performance, brand analysis, and customer interactions.</p>
            
            <p><strong>Dashboard URL:</strong><br>
            <a href="https://proud-forest-0224c7a0f.6.azurestaticapps.net/">https://proud-forest-0224c7a0f.6.azurestaticapps.net/</a></p>
            
            <p><strong>Getting Started:</strong></p>
            <ul>
                <li>Sign in with your Azure credentials</li>
                <li>Explore the store map and KPI dashboard</li>
                <li>Review the documentation in the Help section</li>
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
                <a href="https://proud-forest-0224c7a0f.6.azurestaticapps.net/" class="button">Access Dashboard Now</a>
            </p>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please reach out to <a href="mailto:dashboard-support@tbwa.com">dashboard-support@tbwa.com</a>.</p>
            
            <p>Best regards,<br>
            TBWA Client360 Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to you because you have been granted access to the Client360 Dashboard. If you believe this was sent in error, please contact us.</p>
        </div>
    </div>
</body>
</html>
EOF

echo "📧 Created email template: $EMAIL_TEMPLATE"
echo "✅ Access setup complete!"
echo ""
echo "Next steps:"
echo "1. Send the invitation email to users"
echo "2. Schedule onboarding sessions for new users"
echo "3. Monitor access logs for first-time logins"