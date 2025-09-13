# ADLS Gen2 Lake Structure Design

This document describes the Bronze/Silver/Gold pattern implemented for TBWA's data lake structure in Azure Data Lake Storage Gen2.

## Overall Architecture

The data lake is structured into three distinct tiers, following the industry-standard medallion architecture:

```
tbwadata.dfs.core.windows.net/
├── raw/        # Landing zone for raw data (original format)
├── bronze/     # Standardized, partitioned data (Delta/Parquet)
├── silver/     # Enriched, transformed data (Delta)
└── gold/       # Business-ready semantic layer (Delta or Iceberg)
```

## Container Structure

### Raw (Landing Zone)

The `raw` container serves as the initial landing zone for data before processing.

```
/raw/
├── iot/                        # IoT device data
│   └── yyyymmdd/               # Partitioned by ingestion date
├── crm/                        # CRM system data
│   └── yyyymmdd/               # Partitioned by ingestion date
└── social/                     # Social media data
    └── yyyymmdd/               # Partitioned by ingestion date
```

- **Storage Format**: Original file format (JSON, CSV, etc.)
- **Partitioning**: By ingestion date (`yyyymmdd`)
- **Purpose**: Preserve original data without modification

### Bronze (Standardized Data)

The `bronze` container holds data after initial processing and standardization.

```
/bronze/
├── scout/
│   ├── interactions/           # Standardized interaction data
│   │   └── date=yyyy-mm-dd/    # Partitioned by date
│   ├── brands/                 # Brand data
│   └── channels/               # Channel data
└── retail/
    ├── transactions/           # Retail transaction data
    │   └── date=yyyy-mm-dd/    # Partitioned by date
    └── inventory/              # Inventory data
        └── date=yyyy-mm-dd/    # Partitioned by date
```

- **Storage Format**: Delta/Parquet
- **Partitioning**: By date using `date=yyyy-mm-dd` format
- **Purpose**: Standardize schemas, apply data types

### Silver (Enriched Data)

The `silver` container contains enriched and transformed data.

```
/silver/
├── scout/
│   ├── fact_interactions/                  # Fact table for interactions
│   │   ├── date=yyyy-mm-dd/                # Partitioned by date
│   │   └── brandKey=xyz/                   # Partitioned by brand key
│   ├── dim_brand/                          # Brand dimension
│   ├── dim_channel/                        # Channel dimension
│   └── dim_time/                           # Time dimension
└── retail/
    ├── fact_transactions/                  # Fact table for transactions
    │   ├── date=yyyy-mm-dd/                # Partitioned by date
    │   └── storeKey=xyz/                   # Partitioned by store key
    └── dim_store/                          # Store dimension
```

- **Storage Format**: Delta with Z-ORDER on high-cardinality keys
- **Partitioning**: By date and business keys (e.g., brandKey)
- **Purpose**: Join disparate sources, enrich data, transform into dimensional model

### Gold (Business-Ready)

The `gold` container provides business-ready semantic views optimized for BI tools.

```
/gold/
├── scout/
│   └── semantic/
│       ├── fact_interaction/               # Optimized fact table
│       ├── brand_kpi_latest/               # Latest brand KPIs
│       │   └── _latest.json                # Latest snapshot for dashboards
│       ├── brand_mentions_monthly/         # Monthly brand mention aggregates
│       └── brand_heatmap/                  # Heatmap data for visualization
├── retail/
│   └── perf/
│       ├── store_performance_daily/        # Daily store performance metrics
│       └── product_analysis/               # Product analysis data
└── heartbeat.json                          # Freshness indicator updated by ETL
```

- **Storage Format**: Delta or Iceberg (vacuum/log retention = 7 days)
- **Partitioning**: Minimal or none for small datasets
- **Purpose**: Semantic layer with business metrics and aggregates

## Security Model

Security is implemented using a combination of Azure RBAC roles and POSIX ACLs.

### Container-Level Access Controls

| Container | Role | Purpose |
|-----------|------|---------|
| `raw` | Storage Blob Data Contributor | ETL processes need read/write access |
| `bronze` | Storage Blob Data Contributor | ETL processes need read/write access |
| `silver` | Storage Blob Data Contributor | ETL processes need read/write access |
| `gold` | Storage Blob Data Reader | Dashboards need read-only access |

### Directory-Level POSIX ACLs

For granular access control within containers (especially for PII or brand-specific data):

```bash
# Example: Only Digital Marketing group can access Adidas data
setfacl -m "group:digital-marketing:r-x" /gold/scout/semantic/brand=ADIDAS
```

### Managed Identity Authentication

Dashboards and applications use Azure Managed Identity to authenticate to the data lake:

1. Assign Storage Blob Data Reader role to the dashboard's managed identity
2. Grant access only to the `gold` container
3. Use DefaultAzureCredential in the application code

```javascript
// Example Azure Function using managed identity
const { DefaultAzureCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

// Uses the managed identity of the Azure Function
const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(
    "https://tbwadata.dfs.core.windows.net",
    credential
);
```

## Data Lifecycle Management

- **Raw data**: Retained for 30 days, then archived to cool storage
- **Bronze data**: Retained for 90 days, then archived to cool storage
- **Silver data**: Retained for 1 year, then archived to cool storage
- **Gold data**: Retained indefinitely in hot storage

Lifecycle policies are implemented using Azure Storage Lifecycle Management.

## Freshness Monitoring

A `heartbeat.json` file in the Gold container is updated by the ETL pipeline after each successful run:

```json
{
  "updated": "2025-05-12T15:30:00Z",
  "pipeline": "scout-brand-etl",
  "status": "success",
  "recordsProcessed": 12345
}
```

Dashboards and monitoring tools check this file to verify data freshness.

## Next Steps for Enhanced Structure

1. Implement **Delta Live Tables** or **Fabric Pipelines** for declarative ETL
2. Add weekly **OPTIMIZE** and **VACUUM** operations to maintain performance
3. Integrate **Azure Purview** for data catalog and lineage tracking
4. Implement **Schema Registry** (Azure Event Hubs) for schema validation
5. Add **Data Quality rules** using Great Expectations or dbt tests