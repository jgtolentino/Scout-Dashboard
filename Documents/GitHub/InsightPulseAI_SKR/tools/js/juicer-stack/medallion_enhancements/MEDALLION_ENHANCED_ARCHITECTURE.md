# Juicer GenAI Insights: Enhanced Medallion Architecture

## Overview

This document describes the enhanced Medallion Architecture implemented for the Juicer GenAI Insights system, following best practices from the Databricks Medallion Azure Well-Architected Framework. The architecture provides a structured approach to data processing, storage, and analysis across multiple layers (Bronze, Silver, Gold, and Platinum), with optimized compute resources, comprehensive monitoring, and robust security controls.

## Medallion Architecture Layers

### Bronze Layer
- **Purpose**: Raw data ingestion from source systems
- **Data Format**: JSON/Delta format with schema enforcement
- **Retention**: Hot tier (30 days) → Cool tier (30-90 days) → Archive tier (90+ days)
- **Dedicated Compute**: BronzeLayerProcessing cluster (2-4 workers, autoscaling)
- **Quality Checks**: Basic schema validation and row count verification
- **Key Features**:
  - Optimized for high-throughput ingestion
  - Preserves raw data in its original form
  - Minimal processing to ensure fast data landing

### Silver Layer
- **Purpose**: Cleaned data with brand mentions and sentiment analysis
- **Data Format**: Delta format with optimized partitioning
- **Retention**: Hot tier (60 days) → Cool tier (60-180 days) → Archive tier (180+ days)
- **Dedicated Compute**: SilverLayerProcessing cluster (2-6 workers, autoscaling)
- **Quality Checks**: Field validation, sentiment score range validation
- **Key Features**:
  - Entity extraction with brand mentions
  - Sentiment analysis for brand mentions
  - Data cleansing and standardization
  - Optimized for efficient query access

### Gold Layer
- **Purpose**: Reconstructed transcripts for analytics
- **Data Format**: Delta format optimized for queries
- **Retention**: Hot tier (90 days) → Cool tier (90+ days)
- **Dedicated Compute**: GoldPlatinumLayerProcessing cluster (2-8 workers, autoscaling)
- **Quality Checks**: Topic and intent validation, enrichment verification
- **Key Features**:
  - Topic modeling and intent classification
  - Enriched with business context
  - Optimized for analytical workloads
  - Feature engineering for downstream ML

### Platinum Layer
- **Purpose**: GenAI-generated insights
- **Data Format**: Delta format optimized for dashboard consumption
- **Retention**: 2-year retention policy
- **Dedicated Compute**: GoldPlatinumLayerProcessing cluster (shared with Gold)
- **Quality Checks**: Confidence score validation, model verification
- **Key Features**:
  - AI-generated insights using Claude/OpenAI/DeepSeek models
  - Aggregated metrics for executive dashboards
  - Business-ready visualizations
  - High-confidence, actionable recommendations

## Enhanced Capabilities

### Compute Isolation
- **Dedicated Clusters**: Separate compute clusters for each logical layer
- **Auto-scaling**: Dynamic scaling based on workload demands (2-8 workers depending on layer)
- **Optimized Configurations**:
  - Bronze: Optimized for ingestion with larger partition bytes
  - Silver: Balanced for transformation workloads
  - Gold/Platinum: Configured for complex analytical queries with caching enabled
- **Resource Tagging**: Each cluster tagged with appropriate layer for cost tracking
- **Implementation**: 
  - Uses Azure Databricks Standard clusters
  - Configured via script with optimal Spark settings for each layer

### Data Quality Framework
- **Automated Validation**: Quality checks between layers using Great Expectations
- **Layer-Specific Rules**:
  - Bronze: Schema validation, non-null ID fields, row count checks
  - Silver: Brand mention validation, sentiment score range (-1.0 to 1.0)
  - Gold: Topic/intent validation, relationship verification
  - Platinum: Confidence score validation (0.0 to 1.0), model verification
- **Quality Metrics**: Stored in dedicated quality tables for trending analysis
- **Dashboards**: Interactive quality monitoring across layers
- **Alerting**: Notifications on quality failures via email
- **Implementation**:
  - Integrated into Databricks jobs as dependent tasks
  - Runs after each layer's processing completes
  - Validation results stored in Delta tables

### Monitoring & Alerting
- **Comprehensive Metrics**: Via Azure Monitor and Log Analytics
- **Custom Dashboards**: Operational metrics for each component
- **Alert Configuration**:
  - Job Failures: Alert on Databricks job failures within 10 minutes
  - Storage Capacity: Alert when storage exceeds 85% capacity
  - Data Quality Issues: Alert on validation failures
  - Security Events: Alert on suspicious Key Vault access attempts
  - Availability: Alert when web app availability falls below 99%
- **Integration**: With action groups for email notifications
- **Implementation**:
  - Centralized Log Analytics workspace
  - Diagnostic settings for all resources
  - KQL queries for complex alert conditions

### Storage Lifecycle Management
- **Tiered Strategy**: Hot → Cool → Archive based on data layer
- **Layer-Specific Policies**:
  - Bronze: 30 days Hot → Cool, 90 days → Archive
  - Silver: 60 days Hot → Cool, 180 days → Archive
  - Gold: 90 days Hot → Cool
  - Platinum: 2-year retention with no archiving
  - Logs: 30 days → Archive, 365 days → Delete
- **Inventory Management**: Daily blob inventory reports
- **Dashboard**: Storage metrics with capacity by tier
- **Data Protection**: 14-day soft delete for blobs and containers
- **Implementation**:
  - Azure Storage lifecycle policies
  - Container-specific inventory configuration
  - Tiered access tailored to query patterns

### Security Enhancements
- **Network Isolation**:
  - Virtual Network (VNET) with dedicated subnets
  - Private endpoints for Storage and Key Vault
  - Subnet isolation for different services
- **Access Controls**:
  - Network security rules with default deny
  - Service endpoints for Azure services
  - VNET integration for Databricks
- **Key Management**:
  - Automated API key rotation every 90 days
  - Key backup and versioning
  - Secrets managed in Key Vault
- **Monitoring**:
  - Security alerts for suspicious access
  - Audit logging for all operations
- **Implementation**:
  - Azure Automation for scheduled key rotation
  - Network security groups with least privilege
  - Private DNS zones for service resolution

## Deployment Information

- **Architecture Version**: 1.0
- **Deployment Script**: 6_deploy_medallion_enhancements.sh
- **Component Scripts**:
  - 1_compute_isolation.sh
  - 2_data_quality_framework.py
  - 3_monitoring_alerting.sh
  - 4_storage_lifecycle_management.sh
  - 5_security_enhancements.sh

## Resources

- **Databricks Workspace**: tbwa-juicer-databricks
- **Storage Account**: tbwajuicerstorage
- **Key Vault**: kv-tbwa-juicer-insights2
- **Virtual Network**: juicer-vnet
- **Log Analytics**: juicer-log-analytics
- **Automation Account**: juicer-key-rotation

## Framework Alignment

This enhanced architecture addresses the key pillars of the Azure Well-Architected Framework:

### Cost Optimization
- Auto-scaling compute resources
- Tiered storage for cost-efficient retention
- Resource tagging for cost allocation
- Dedicated compute for specific workloads

### Reliability
- Data quality validation at each layer
- Automated alerting on failures
- Soft delete protection for data
- Comprehensive monitoring

### Operational Excellence
- Standardized layer definitions
- Automated deployment scripts
- Consistent monitoring dashboards
- Documented architecture and processes

### Performance Efficiency
- Layer-specific compute optimization
- Storage tier alignment with access patterns
- Caching for frequently accessed data
- Right-sized infrastructure for each workload

### Security
- Network isolation with private endpoints
- Automated key rotation
- Least privilege access controls
- Comprehensive audit logging
- Threat detection and alerting

## Diagrams

### Logical Architecture
```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Bronze Layer │     │  Silver Layer │     │   Gold Layer  │     │ Platinum Layer│
│  (Raw Data)   │ ==> │  (Cleansed)   │ ==> │  (Enriched)   │ ==> │  (Insights)   │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Quality Rules │     │ Quality Rules │     │ Quality Rules │     │ Quality Rules │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────────────────────────────┐
│ Bronze Cluster│     │ Silver Cluster│     │        Gold/Platinum Cluster          │
└───────────────┘     └───────────────┘     └───────────────────────────────────────┘
```

### Storage Lifecycle
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Hot Storage (Premium) ──► Cool Storage ──► Archive Storage ──► Delete
│  (Active Queries)         (Recent History)   (Long-term Retention)  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Bronze: 30d               30-90d              90d+
     Silver: 60d               60-180d             180d+
     Gold:   90d               90d+                -
     Platinum: All data kept in Hot/Cool for 2 years, then deleted
```

## Best Practices

- **Data Quality**: Validate at each layer transition
- **Storage Management**: Match storage tier to access patterns
- **Security**: Apply defense-in-depth with multiple security controls
- **Monitoring**: Monitor both data quality and infrastructure health
- **Cost Control**: Use auto-scaling and tiered storage appropriately
- **Documentation**: Maintain this document as architecture evolves

## Next Steps

1. Integrate with CI/CD pipeline for automated deployments
2. Implement A/B testing framework for model evaluation
3. Enhance observability with additional custom metrics
4. Develop data lineage tracking across layers
5. Implement enhanced data retention policies based on usage patterns