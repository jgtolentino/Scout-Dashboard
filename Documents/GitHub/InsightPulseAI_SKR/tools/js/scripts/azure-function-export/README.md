# Azure Function for Static Metrics Export

This Azure Function automatically exports metrics from Databricks SQL to static JSON files and uploads them to Azure Blob Storage on a scheduled basis.

## Deployment

To deploy this function to Azure:

1. Install Azure Functions Core Tools:
   ```
   npm install -g azure-functions-core-tools@4
   ```

2. Login to Azure:
   ```
   az login
   ```

3. Create a Function App:
   ```
   az functionapp create --resource-group YourResourceGroup --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name YourFunctionAppName --storage-account YourStorageAccountName
   ```

4. Configure environment variables:
   ```
   az functionapp config appsettings set --name YourFunctionAppName --resource-group YourResourceGroup --settings "DATABRICKS_SQL_HOST=your-host" "DATABRICKS_SQL_PATH=your-path" "DATABRICKS_CATALOG=client360_catalog" "DATABRICKS_SCHEMA=client360" "KEY_VAULT_NAME=your-keyvault" "USE_MANAGED_IDENTITY=true"
   ```

5. Enable managed identity:
   ```
   az functionapp identity assign --name YourFunctionAppName --resource-group YourResourceGroup
   ```

6. Grant the managed identity access to Key Vault:
   ```
   az keyvault set-policy --name YourKeyVaultName --object-id $(az functionapp identity show --name YourFunctionAppName --resource-group YourResourceGroup --query principalId -o tsv) --secret-permissions get list
   ```

7. Deploy the function:
   ```
   cd /path/to/azure-function-export
   func azure functionapp publish YourFunctionAppName
   ```

## Schedule

By default, this function runs every 6 hours. To change the schedule, modify the `schedule` property in `function.json` using NCRONTAB format.

## Output

The exported JSON files are stored in two locations:
1. Timestamped folders: `dashboarddata/{date}/{time}/file.json`
2. Latest folder: `dashboarddata/latest/file.json`

This allows your dashboard to always access the most recent data by using the `latest` folder.