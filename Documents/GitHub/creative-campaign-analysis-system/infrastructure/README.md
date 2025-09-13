# Creative Campaign Analysis Infrastructure

This directory contains the Terraform configuration for provisioning the Azure infrastructure needed for the Creative Campaign Analysis system.

## Architecture Overview

The infrastructure includes:
- Azure Data Lake Storage Gen2 with Medallion architecture
- Azure OpenAI Service with GPT-4 Turbo
- Databricks Workspace with ML pipeline
- Private networking with service endpoints
- Cost monitoring and budget alerts

## Prerequisites

1. Azure CLI installed and configured
2. Terraform v1.0.0 or later
3. Azure subscription with appropriate permissions
4. Team IP address for network access

## Deployment Steps

1. Initialize Terraform:
```bash
cd infrastructure/terraform
terraform init
```

2. Create a `terraform.tfvars` file with your configuration:
```hcl
team_ip = "YOUR_TEAM_IP"
environment = "dev"
budget_amount = 5000
notification_emails = ["your.email@example.com"]
```

3. Plan the deployment:
```bash
terraform plan -out creative_plan
```

4. Apply the configuration:
```bash
terraform apply creative_plan
```

## Infrastructure Components

### Storage (ADLS2)
- Raw zone for initial data ingestion
- Bronze zone for validated data
- Silver zone for enriched features
- Gold zone for business insights
- ML Models zone for trained models

### AI Services
- GPT-4 Turbo for creative analysis
- CLIP for image analysis
- Whisper for audio/video analysis

### Databricks
- Premium workspace
- Medallion pipeline
- GPU-enabled clusters for ML
- Delta Lake integration

### Security
- Private endpoints
- Network security rules
- Service principal authentication
- RBAC assignments

## Cost Management

- Monthly budget alerts at 80%
- Resource tagging for cost allocation
- Auto-scaling for compute resources
- Storage lifecycle management

## Monitoring

- Azure Monitor integration
- Log Analytics workspace
- Application Insights
- Cost analysis dashboards

## Maintenance

1. Regular updates:
```bash
terraform get -update
terraform plan
terraform apply
```

2. State management:
```bash
terraform state list
terraform state show <resource>
```

3. Cleanup:
```bash
terraform destroy
```

## Support

For infrastructure issues:
1. Check Azure Monitor logs
2. Review Terraform state
3. Verify network connectivity
4. Check service health status 