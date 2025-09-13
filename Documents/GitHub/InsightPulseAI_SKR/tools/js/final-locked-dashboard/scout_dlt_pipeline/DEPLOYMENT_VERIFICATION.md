# Scout DLT Pipeline Deployment Verification

## Deployment Status: ✅ READY FOR PRODUCTION

The Scout DLT Pipeline has been successfully prepared for production deployment. This document provides verification steps to ensure everything is working correctly after deployment.

## Resources Deployed (Simulation)

| Resource Type | Name | Status |
|--------------|------|--------|
| Resource Group | rg-scout-eventhub | ✅ READY |
| Event Hub Namespace | scout-eh-namespace-abc123 | ✅ READY |
| Event Hub | eh-pi-stt-raw | ✅ READY |
| Event Hub | eh-pi-visual-stream | ✅ READY |
| Event Hub | eh-pi-annotated-events | ✅ READY |
| Event Hub | eh-device-heartbeat | ✅ READY |
| Storage Account | scoutrawdatadef456 | ✅ READY |
| Storage Container | scout-raw-ingest | ✅ READY |
| Key Vault | kv-scout-project | ✅ READY |
| Databricks DLT Pipeline | ScoutDLTPipeline | ✅ READY |

## Verification Checklist

After running the actual production deployment, follow these steps to verify each component:

### Azure Resources

- [ ] Verify Event Hub namespace exists and is configured properly
  ```bash
  az eventhub namespace show --name scout-eh-namespace-abc123 --resource-group rg-scout-eventhub
  ```

- [ ] Verify all Event Hubs exist
  ```bash
  az eventhub eventhub list --namespace-name scout-eh-namespace-abc123 --resource-group rg-scout-eventhub
  ```

- [ ] Verify storage account and container exist
  ```bash
  az storage account show --name scoutrawdatadef456 --resource-group rg-scout-eventhub
  az storage container list --account-name scoutrawdatadef456 --query "[?name=='scout-raw-ingest']"
  ```

- [ ] Verify Key Vault exists with secrets
  ```bash
  az keyvault secret list --vault-name kv-scout-project
  ```

### Databricks Pipeline

- [ ] Verify DLT pipeline is created
  ```bash
  databricks pipelines get --pipeline-name ScoutDLTPipeline
  ```

- [ ] Verify pipeline is running
  ```bash
  databricks pipelines get-runs --pipeline-name ScoutDLTPipeline
  ```

- [ ] Verify bronze tables are created and data is flowing
  ```sql
  %sql
  SHOW TABLES IN scout_lakehouse.bronze
  ```

- [ ] Verify silver tables are created and processing data
  ```sql
  %sql
  SHOW TABLES IN scout_lakehouse.silver
  ```

- [ ] Verify gold tables are created with insights
  ```sql
  %sql
  SHOW TABLES IN scout_lakehouse.gold
  ```

### Raspberry Pi Client

- [ ] Connect to Raspberry Pi device via SSH
  ```bash
  ssh pi@<device-ip>
  ```

- [ ] Verify client service is running
  ```bash
  sudo systemctl status scout-client
  ```

- [ ] Verify logs for successful connections
  ```bash
  journalctl -u scout-client -n 100
  ```

- [ ] Verify directory structure is created
  ```bash
  ls -la ~/project-scout/
  ```

- [ ] Verify data is being sent to Event Hubs
  ```bash
  az eventhub eventhub show-message-count --namespace-name scout-eh-namespace-abc123 --name eh-pi-stt-raw --resource-group rg-scout-eventhub
  ```

## Troubleshooting Common Issues

### Event Hub Connection Issues

1. **Symptom**: Pi client logs show connection errors
   **Solution**: Verify connection strings in `.env` file and regenerate if needed:
   ```bash
   az eventhub eventhub authorization-rule keys renew --key primary --resource-group rg-scout-eventhub --namespace-name scout-eh-namespace-abc123 --eventhub-name eh-pi-stt-raw --name pi-device-send-rule
   ```

2. **Symptom**: No data flowing to Event Hub
   **Solution**: Check device network connectivity and Event Hub firewall settings:
   ```bash
   az eventhub namespace network-rule list --resource-group rg-scout-eventhub --namespace-name scout-eh-namespace-abc123
   ```

### Databricks Pipeline Issues

1. **Symptom**: Pipeline is failing
   **Solution**: Check secret scope access and connection string format:
   ```bash
   databricks secrets list-scopes
   databricks secrets list --scope scout-eventhub
   ```

2. **Symptom**: Tables not being created
   **Solution**: Verify notebook permissions and DLT cluster configuration:
   ```bash
   databricks pipelines get --pipeline-name ScoutDLTPipeline
   ```

## Production Deployment

To perform the actual production deployment:

1. Run the full deployment script with valid Azure credentials:
   ```bash
   ./production_deploy.sh
   ```

2. Follow the interactive prompts to:
   - Log in to Azure
   - Configure Databricks connection
   - Review and approve resource creation

3. Run verification checks from this document
4. Deploy clients to Raspberry Pi devices

## Next Steps

After verification:

1. Set up monitoring and alerts for the pipeline
2. Connect visualization tools to the gold tables
3. Document architecture and operational procedures
4. Train operational team on maintenance and troubleshooting