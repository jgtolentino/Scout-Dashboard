# PH Awards Analysis System - Authentication Solution

## Overview

This document provides solutions for the Azure SQL Database authentication issues encountered during setup of the PH Awards Analysis System.

## Diagnosis

We identified several potential issues that may be causing authentication failures:

1. **SQL Authentication Issues**:
   - Incorrect username/password combinations
   - User doesn't exist in the database
   - User doesn't have proper permissions

2. **Azure AD Authentication Issues**:
   - Microsoft Entra (Azure AD) timeout during interactive authentication
   - Missing role assignments for the current user

3. **Network/Firewall Issues**:
   - Current IP might not be allowed in the SQL Server firewall rules

## Solution Files

I've prepared several scripts to address these issues:

1. `debug_azure_auth.py`: Diagnoses authentication issues
2. `create_ph_awards_service_principal.sh`: Creates a service principal for non-interactive authentication
3. `deploy_tables_sp.py`: Deploys tables using service principal authentication

## Authentication Methods

### 1. SQL Authentication

If the TBWA user exists in the database, this is the simplest method:

```python
connection_string = (
    f"Driver={{ODBC Driver 17 for SQL Server}};"
    f"Server=tbwa-ces-model-server.database.windows.net;"
    f"Database=CESDatabank;"
    f"Uid=TBWA;"
    f"Pwd=R@nd0mPA$$2025!;"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
    f"Connection Timeout=30;"
)
```

### 2. Microsoft Entra (Azure AD) Authentication

This requires interactive login through a browser:

```python
connection_string = (
    f"Driver={{ODBC Driver 17 for SQL Server}};"
    f"Server=tbwa-ces-model-server.database.windows.net;"
    f"Database=CESDatabank;"
    f"Authentication=ActiveDirectoryInteractive;"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
    f"Connection Timeout=60;"
)
```

### 3. Service Principal Authentication (Recommended)

This provides non-interactive authentication for automation:

```python
connection_string = (
    f"Driver={{ODBC Driver 17 for SQL Server}};"
    f"Server=tbwa-ces-model-server.database.windows.net;"
    f"Database=CESDatabank;"
    f"Authentication=ActiveDirectoryServicePrincipal;"
    f"UID={client_id};"
    f"PWD={client_secret};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
    f"Connection Timeout=30;"
)
```

## Step-by-Step Solution

### Step 1: Debug Authentication Issues

Run the debug script to identify specific issues:

```bash
python3 /Users/tbwa/debug_azure_auth.py
```

This script will:
- Test your ODBC driver installation
- Check Azure CLI authentication
- Verify SQL Server firewall rules
- Test various authentication methods
- Provide specific recommendations

### Step 2: Create a Service Principal (Recommended)

If authentication issues persist, create a service principal:

```bash
bash /Users/tbwa/create_ph_awards_service_principal.sh
```

This will:
- Create a service principal in Azure AD
- Assign necessary permissions to access the database
- Save credentials to `/Users/tbwa/ph_awards_sp_credentials.json`
- Create an environment variables script at `/Users/tbwa/ph_awards_env_vars.sh`

### Step 3: Deploy Database Tables

Use the service principal to deploy tables:

```bash
# First, source the environment variables
source /Users/tbwa/ph_awards_env_vars.sh

# Then run the deployment script
python3 /Users/tbwa/deploy_tables_sp.py
```

This script will:
- Try multiple deployment methods (Azure CLI, sqlcmd, direct connection)
- Verify successful table creation
- Provide clear feedback on the deployment status

## Fallback Option: Azure Portal

If all automated methods fail, use the Azure Portal Query Editor:

1. Login to Azure Portal at https://portal.azure.com
2. Navigate to SQL server 'tbwa-ces-model-server'
3. Select the 'CESDatabank' database
4. Click on 'Query editor'
5. Run the SQL script from `/Users/tbwa/ph_awards_schema.sql`

After tables are created, return to the command line to import data:

```bash
python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results
```

## Troubleshooting

If you encounter issues:

1. **Firewall Errors**: Ensure your current IP is allowed in the firewall rules
2. **Authentication Errors**: Verify credentials and permissions
3. **Connection Timeouts**: Check network connectivity and VPN settings
4. **ODBC Driver Errors**: Install the ODBC Driver 17 for SQL Server:
   ```bash
   brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
   brew update
   brew install msodbcsql17 mssql-tools
   ```

## Next Steps

After successfully deploying the database tables:

1. Import the analysis data:
   ```bash
   python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results
   ```

2. Verify the complete setup:
   ```bash
   python3 /Users/tbwa/verify_ph_awards_setup.py
   ```

3. View the analysis dashboard:
   ```bash
   open /Users/tbwa/analysis_results/ph_awards_dashboard.html
   ```