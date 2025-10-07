# Azure SQL User Creation Guide

## Current Issue
- Cannot connect with 'sqladmin' user
- Need admin access to create new user with password: `R@nd0mPA$$2025!`

## Solutions

### Option 1: Azure Portal Method (Recommended)
1. **Log in to Azure Portal**: https://portal.azure.com
2. **Navigate to SQL Server**: `sqltbwaprojectscoutserver`
3. **Go to SQL databases** → `SQL-TBWA-ProjectScout-Reporting-Prod`
4. **Query editor** (or use Azure Data Studio)
5. **Run the commands** from `create-user-commands.sql`

### Option 2: Fix Existing Admin User
The 'sqladmin' user might be:
- **Disabled**: Check in Azure portal under SQL Server → Active Directory admin
- **Different password**: Reset password in Azure portal
- **Firewall blocked**: Add your IP to SQL Server firewall rules

### Option 3: Azure Active Directory Authentication
Instead of SQL authentication, use Azure AD:

```javascript
const config = {
  server: 'sqltbwaprojectscoutserver.database.windows.net',
  database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
  authentication: {
    type: 'azure-active-directory-password',
    options: {
      userName: 'your-email@domain.com',
      password: 'your-azure-password'
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};
```

### Option 4: Connection String with New User
Once user is created, use:

```javascript
const config = {
  server: 'sqltbwaprojectscoutserver.database.windows.net',
  database: 'SQL-TBWA-ProjectScout-Reporting-Prod',
  user: 'tbwa_admin',
  password: 'R@nd0mPA$$2025!',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};
```

## Next Steps
1. **Check Azure portal access**: Can you log in to portal.azure.com?
2. **Verify SQL Server exists**: Look for `sqltbwaprojectscoutserver`
3. **Run user creation commands** using Query editor or SSMS
4. **Test connection** with new credentials

## Firewall Rules
If connection still fails, add your IP address:
1. Go to SQL Server in Azure portal
2. **Networking** → **Firewall rules**
3. **Add your client IP** or **Allow Azure services**

## Alternative: Use Supabase
If Azure SQL continues to have issues, we can:
1. Create TBWA schema in Supabase
2. Populate with campaign intelligence data
3. Connect dashboard to Supabase instead