# Azure Tenant Management Utilities

These utilities help with managing Azure tenants and subscriptions, particularly useful when dealing with tenant restrictions or requiring specific administrative privileges.

## Available Scripts

### 1. Interactive Tenant Switch (`azure_tenant_switch.sh`)

This script helps you interactively switch between Azure tenants where you have proper administrative privileges.

#### Usage:

```bash
./azure_tenant_switch.sh
```

The script will:
1. Authenticate with Azure if needed
2. List all available tenants with their IDs and names
3. Prompt you to select a tenant by number
4. Switch to the selected tenant
5. Set a default subscription if available
6. Display your role assignments

### 2. Non-Interactive Tenant Switch (`azure_tenant_switch_noninteractive.sh`)

This script performs the same tenant switching function but takes the tenant ID as a command-line argument, making it suitable for automation.

#### Usage:

```bash
./azure_tenant_switch_noninteractive.sh <tenant-id>
```

Example:
```bash
./azure_tenant_switch_noninteractive.sh e56592a9-7582-4ce4-ac69-8e53c4b39b44
```

### 3. Azure Role Check (`azure_role_check.sh`)

This script checks your roles and permissions across all accessible Azure subscriptions, helping identify any missing roles required for billing management or resource control.

#### Usage:

```bash
./azure_role_check.sh
```

The script will:
1. Authenticate with Azure if needed
2. Check if you have the Billing Administrator directory role
3. List all accessible subscriptions and your roles in each
4. Provide a summary of your permissions and next steps

### 4. Azure Billing Role Diagnostic (`azure_billing_role_check.sh`)

This specialized diagnostic script identifies the common "split permission" scenario where you have subscription Owner rights but lack the billing administration permissions needed for subscription upgrades.

#### Usage:

```bash
./azure_billing_role_check.sh
```

The script will:
1. Authenticate with Azure if needed
2. Check your subscription ownership status
3. Verify your billing account access and roles
4. Check your directory Billing Administrator role
5. Provide a detailed diagnostic of the permission mismatch
6. Offer specific guidance on how to resolve the split permission issue

## Use Cases

### Resolving Tenant Restrictions

If you're encountering errors like:
```
This subscription is restricted from using All services and resources
```

Or:
```
The subscription you have selected is not permitted to create, acquire, or configure this resource
```

These scripts can help you switch to a tenant where you have Owner or Billing Administrator role, which gives you full administrative privileges.

### Managing Multiple Environments

If you work with multiple Azure tenants (e.g., for development, testing, and production), these scripts make it quick and easy to switch between them.

## Requirements

- Azure CLI installed and configured
- jq (for the interactive script)
- Proper permissions in at least one tenant

## Integration with Pulser

After switching tenants, you may need to update your Pulser CLI configuration to use the new tenant for Azure operations. Check the Pulser documentation for details on configuring Azure credentials.

## Troubleshooting

### No Subscriptions Available

If you switch to a tenant but see "No subscriptions found in this tenant", you'll need to create a new subscription in that tenant via the Azure portal before you can manage resources.

### Authentication Issues

If authentication fails, ensure:
1. You're using the correct credentials
2. You have access to the specified tenant
3. Your Azure CLI installation is up to date