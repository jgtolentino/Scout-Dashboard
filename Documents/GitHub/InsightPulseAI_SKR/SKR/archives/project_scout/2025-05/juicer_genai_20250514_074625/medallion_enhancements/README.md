# Medallion Architecture Enhancements for Juicer GenAI Insights

This directory contains scripts and configurations to enhance the Juicer GenAI Insights system to fully align with the Databricks Medallion Azure Well-Architected Framework.

## Key Documentation

| Document | Purpose |
|----------|---------|
| [MEDALLION_ENHANCED_ARCHITECTURE.md](./MEDALLION_ENHANCED_ARCHITECTURE.md) | Comprehensive documentation of the enhanced architecture |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Step-by-step implementation plan with verification steps |

## Enhancement Scripts

| Script | Purpose | Dependencies |
|--------|---------|--------------|
| `1_compute_isolation.sh` | Creates dedicated compute clusters for each medallion layer | Azure CLI, Databricks CLI |
| `2_data_quality_framework.py` | Implements data quality checks between layers | Python 3.x, requests |
| `3_monitoring_alerting.sh` | Sets up comprehensive monitoring and alerting | Azure CLI |
| `4_storage_lifecycle_management.sh` | Configures tiered storage and lifecycle policies | Azure CLI |
| `5_security_enhancements.sh` | Implements private endpoints, VNet integration, and key rotation | Azure CLI |
| `6_deploy_medallion_enhancements.sh` | Master script to deploy all enhancements | All of the above |

## Enhanced Architecture Overview

The enhanced Medallion Architecture implements a structured, layered approach to data processing:

1. **Bronze Layer**: Raw data ingestion with minimal transformation
   - Retention: Hot tier (30 days) → Cool tier (30-90 days) → Archive tier (90+ days)
   - Dedicated compute: BronzeLayerProcessing cluster (2-4 workers)

2. **Silver Layer**: Cleaned data with brand mentions and sentiment analysis
   - Retention: Hot tier (60 days) → Cool tier (60-180 days) → Archive tier (180+ days)
   - Dedicated compute: SilverLayerProcessing cluster (2-6 workers)

3. **Gold Layer**: Reconstructed transcripts with topics and intents
   - Retention: Hot tier (90 days) → Cool tier (90+ days)
   - Shared compute: GoldPlatinumLayerProcessing cluster (2-8 workers)

4. **Platinum Layer**: GenAI-generated insights
   - Retention: 2-year retention policy
   - Shared compute: GoldPlatinumLayerProcessing cluster (2-8 workers)

## Key Enhancements

1. **Compute Isolation**: Separate compute clusters for each layer with auto-scaling
2. **Data Quality Framework**: Layer-specific validation with Great Expectations
3. **Monitoring & Alerting**: Comprehensive metrics and alerts via Azure Monitor
4. **Storage Lifecycle Management**: Tiered storage with automated lifecycle policies
5. **Security Enhancements**: Network isolation, private endpoints, and key rotation

## Prerequisites

Before running these scripts, ensure you have:

1. Azure CLI installed and logged in
2. Python 3.x installed
3. Databricks CLI installed
4. Appropriate Azure permissions for resource creation and modification
5. A current deployment of Juicer GenAI Insights in Azure

## Deployment Instructions

### Option 1: All-in-One Deployment

To deploy all enhancements at once, run the master deployment script:

```bash
# Make the script executable
chmod +x 6_deploy_medallion_enhancements.sh

# Run the script
./6_deploy_medallion_enhancements.sh
```

The script will:
1. Verify all dependencies
2. Guide you through the deployment process
3. Create a log file of all actions
4. Generate enhanced architecture documentation

### Option 2: Individual Enhancement Deployment

If you prefer to deploy enhancements individually, you can run each script separately:

```bash
# 1. Compute Isolation
chmod +x 1_compute_isolation.sh
./1_compute_isolation.sh

# 2. Data Quality Framework
python3 2_data_quality_framework.py --workspace-url <databricks-url> --bronze-job-id <job-id> --silver-job-id <job-id> --gold-job-id <job-id> --platinum-job-id <job-id>

# 3. Monitoring & Alerting
chmod +x 3_monitoring_alerting.sh
./3_monitoring_alerting.sh

# 4. Storage Lifecycle Management
chmod +x 4_storage_lifecycle_management.sh
./4_storage_lifecycle_management.sh

# 5. Security Enhancements
chmod +x 5_security_enhancements.sh
./5_security_enhancements.sh
```

## Post-Deployment Verification

After deploying the enhancements, verify the successful implementation with:

1. Azure Portal: Verify new resources and configurations
2. Databricks Workspace: Check new clusters and notebooks
3. Run the Azure deployment verification script:
   ```bash
   ../azure_deployment_verification_custom.sh
   ```

## Framework Alignment

These enhancements address all five pillars of the Azure Well-Architected Framework:

1. **Cost Optimization**: Dedicated compute with auto-scaling, tiered storage
2. **Reliability**: Data quality checks, monitoring, alerting
3. **Operational Excellence**: Standardized processes, documentation, dashboards
4. **Performance Efficiency**: Optimized storage and compute for each layer
5. **Security**: Network isolation, private endpoints, key rotation

## Warning

Some of these enhancements (particularly security enhancements) involve changes to networking and access policies that may temporarily disrupt service connectivity. It is recommended to deploy in a controlled maintenance window.