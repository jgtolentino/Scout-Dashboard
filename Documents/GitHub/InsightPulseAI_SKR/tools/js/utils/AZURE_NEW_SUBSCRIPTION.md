# Creating a New Azure Subscription with Full Ownership

This guide explains how to create a new Azure subscription where you have both resource (Owner) and billing control.

## Prerequisites

- A Microsoft account (personal or work/school)
- A valid credit card or other payment method
- No existing restrictions on your Microsoft account

## Step-by-Step Instructions

### 1. Sign out of any existing Azure sessions

```bash
# Use this command to sign out from Azure CLI
az logout

# Clear browser cookies and cache as well
```

### 2. Create or use a Microsoft account where you want to be the billing owner

- Use an account where you are the primary owner
- Ensure it's not managed by an educational institution or employer
- Verify you can access https://account.microsoft.com without restrictions

### 3. Sign up for a new Azure subscription

1. Visit: https://azure.microsoft.com/free/
2. Click "Start free" or "Buy now"
3. Sign in with your Microsoft account
4. Complete the identity verification (phone or credit card)
5. Provide your payment information
   - This is required even for free tier subscriptions
   - A temporary authorization hold may be placed

### 4. Set up your new subscription

1. Choose a subscription type:
   - Free tier (12 months of popular services free)
   - Pay-As-You-Go (standard usage-based billing)
   - Visual Studio subscription (if you have eligible credentials)

2. Complete the registration process:
   - Accept the subscription agreement
   - Confirm your identity
   - Set up initial account preferences

### 5. Verify your new subscription and billing ownership

```bash
# Login with your new subscription account
az login

# Verify you are the owner
az role assignment list --include-classic-administrators --query "[?principalName=='your-email@example.com'].roleDefinitionName" -o tsv

# Verify billing access
az billing account list
```

You should see:
- Owner role in the subscription
- Access to billing information

### 6. Migrating resources (optional)

If you need to migrate resources from the old subscription:

1. Export ARM templates from original subscription resources
2. Export any data using appropriate tools
3. Redeploy resources to the new subscription
4. Update connection strings and endpoints

## Benefits of this approach

- **Complete control**: You own both the billing and resources
- **No permission issues**: You can upgrade, modify billing, or change subscription types
- **Fresh start**: Avoid inheriting any policy or configuration restrictions
- **Simple tenant structure**: Clean relationship between your account, tenant, and subscription

## Need automation?

If you need to automate the resource migration, use these commands with the Azure CLI:

```bash
# Export resource group template
az group export --name OldResourceGroup --subscription OldSubscriptionId > resources.json

# Deploy to new subscription
az deployment sub create --location eastus --template-file resources.json --subscription NewSubscriptionId
```

## Important considerations

- **Costs**: New subscriptions start fresh billing cycles
- **Service limits**: Be aware of subscription-level quotas and limits
- **DNS & global resources**: Update any unique name dependencies
- **IP addresses**: Resources will receive new IPs unless specifically configured

---

For TBWA-ProjectScout-Prod, creating a new subscription is often simpler than trying to resolve complex permission issues in the existing subscription.