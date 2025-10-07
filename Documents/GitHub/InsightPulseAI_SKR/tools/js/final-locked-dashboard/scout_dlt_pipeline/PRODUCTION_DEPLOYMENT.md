# Scout ETL Pipeline Production Deployment Guide

This guide provides detailed instructions for deploying the Scout ETL pipeline in a production environment. The pipeline processes data from Raspberry Pi devices in retail stores, including audio (speech-to-text) and visual (face/gesture detection) data, and transforms it into actionable insights.

## Prerequisites

Before deployment, ensure you have:

1. **Azure Subscription** with Contributor access
2. **Databricks Workspace** - Premium tier recommended
3. **Tools installed:**
   - Azure CLI (`az`)
   - Terraform
   - Databricks CLI
   - jq

## Deployment Steps

The deployment process is fully automated through the `production_deploy.sh` script, which performs the following:

1. **Infrastructure Deployment:**
   - Resource Group
   - Event Hub Namespace with 4 Event Hubs
   - Storage Account with container for backup data
   - Key Vault for secure credentials storage

2. **Security & Access Management:**
   - Authorization rules for Event Hub access
   - Secure storage of connection strings in Key Vault
   - Databricks secret scope for secure access to Event Hubs

3. **Data Pipeline Deployment:**
   - Delta Live Tables pipeline in Databricks
   - Bronze, Silver, and Gold data layers
   - Continuous processing configuration

4. **Raspberry Pi Client Setup:**
   - Client scripts for edge devices
   - Connection configuration
   - Systemd service for automatic startup

## Executing Deployment

To deploy the pipeline:

```bash
# Make the script executable
chmod +x production_deploy.sh

# Run the deployment
./production_deploy.sh
```

The script is interactive and will prompt for:
- Azure login (if not already logged in)
- Confirmation of subscription selection
- Databricks workspace URL
- Databricks access token

## Architecture Overview

The deployed system follows a medallion architecture:

1. **Bronze Layer (Raw Data)**
   - `eh-pi-stt-raw`: Raw speech-to-text data
   - `eh-pi-visual-stream`: Raw visual detection data
   - Data backup in Azure Blob Storage

2. **Silver Layer (Transformed Data)**
   - `eh-pi-annotated-events`: Processed multimodal events
   - `eh-device-heartbeat`: Device health monitoring
   - Entity resolution and data cleaning

3. **Gold Layer (Business Insights)**
   - Brand mentions analysis
   - Customer interaction insights
   - Store performance metrics

## Post-Deployment Tasks

After successful deployment:

1. **Deploy to Raspberry Pi Devices:**
   - Copy the `pi_deployment/setup_pi_client.sh` script to each device
   - Execute the script on each device
   - Configure device-specific settings in `.env` file

2. **Monitoring Setup:**
   - Configure Databricks alerts for pipeline failures
   - Set up Key Vault diagnostic settings
   - Enable monitoring for Event Hubs

3. **Dashboard Connection:**
   - Connect Power BI or Superset to Gold tables
   - Configure automatic refresh

## Security Considerations

The deployment follows security best practices:

- **Network Security:**
  - All connections use HTTPS/TLS 1.2+
  - Event Hub connections use SAS tokens with minimal permissions

- **Data Protection:**
  - PII data is tagged in the Unity Catalog
  - Sensitive information stored in Key Vault
  - RBAC enforced for all resources

- **Compliance:**
  - Resource tagging for cost allocation
  - Audit logging enabled

## Troubleshooting

Common issues and solutions:

1. **Event Hub Connection Issues:**
   - Verify connection strings in Key Vault
   - Check namespace firewall settings
   - Confirm consumer group exists

2. **Databricks Pipeline Failures:**
   - Check secret scope access
   - Verify notebook permissions
   - Review cluster configurations

3. **Raspberry Pi Client Issues:**
   - Check device network connectivity
   - Verify camera and microphone access
   - Review systemd service logs

## Contact

For assistance with deployment:
- **DevOps Team:** devops@example.com
- **Data Engineering:** data-eng@example.com

## License

Copyright © 2025 Project Scout Team. All rights reserved.