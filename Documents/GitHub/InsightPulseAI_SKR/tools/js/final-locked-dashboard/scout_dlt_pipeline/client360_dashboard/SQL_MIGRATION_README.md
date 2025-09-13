# SQL Migration Scripts for Client360 Dashboard

This directory contains SQL migration scripts to set up and maintain the database schema for the Client360 Dashboard. These scripts create and populate the necessary tables for location data, sales interactions, and Sari-Sari store transaction analytics.

## Migration Scripts Overview

The migration process is split into three main parts, which should be executed in the following order:

1. **Location Schema Migration**: Creates the base location schema with regions, provinces, cities, barangays, and store data.
2. **SalesInteractions Schema Migration**: Creates tables for sales interactions, transcripts, and product data.
3. **Sari-Sari Store Schema Enhancements**: Extends the schema with advanced analytics for Sari-Sari store transactions.

## Prerequisites

- PostgreSQL 12+ client tools installed
- Database access credentials
- Proper permissions to create tables and schemas

## Running the Migrations

### Option 1: Run All Migrations at Once

To run all migrations in sequence, use the master script:

```bash
./scripts/run_all_migrations.sh -h 127.0.0.1 -p 5432 -d client360 -u your_username --create-db
```

This script will:
1. Create the database if it doesn't exist (with the `--create-db` flag)
2. Run all migration scripts in the correct order
3. Provide a summary of successful and failed migrations

### Option 2: Run Individual Migrations

If you prefer to run migrations individually, execute them in this order:

```bash
# 1. Location Schema Migration
./scripts/run_sql_migration.sh -h 127.0.0.1 -p 5432 -d client360 -u your_username

# 2. SalesInteractions Schema Migration
./scripts/run_sales_interactions_migration.sh -h 127.0.0.1 -p 5432 -d client360 -u your_username

# 3. Sari-Sari Store Schema Enhancements
./scripts/run_sari_sari_migration.sh -h 127.0.0.1 -p 5432 -d client360 -u your_username
```

## Script Options

All migration scripts support the following command-line options:

| Option       | Description                                  | Default    |
|--------------|----------------------------------------------|------------|
| `-h, --host` | Database host                                | 127.0.0.1  |
| `-p, --port` | Database port                                | 5432       |
| `-d, --db`   | Database name                                | client360  |
| `-u, --user` | Database user                                | postgres   |
| `--help`     | Display help information                     |            |
| `--create-db`| Create database if it doesn't exist (master script only) | |

## Schema Components

### Location Schema

- **Regions, Provinces, Cities, Barangays**: Hierarchical location data
- **Stores**: Store information with geolocation data
- **Store Metrics**: Performance metrics for stores
- **Brand Distribution**: Brand presence and performance in stores
- **Category Distribution**: Product category analytics

### SalesInteractions Schema

- **SalesInteractions**: Core table for customer interactions
- **SalesInteractionBrands**: Brand mentions in interactions
- **SalesInteractionTranscripts**: Speech transcriptions
- **TranscriptChunkAudit**: Quality analysis for transcripts
- **Products**: Product catalog
- **Customers**: Basic customer reference data
- **EdgeDeviceRegistry**: Store device registry

### Sari-Sari Store Enhancements

- **TransactionProducts**: Products within transactions
- **RequestPatterns**: Customer request patterns
- **UnbrandedItems**: Unbranded product mentions
- **RequestTypes/Categories**: Reference data for classification
- **TransactionAnalysisView**: Simplified reporting view

## Log Files

All migration scripts generate detailed logs in the `logs/` directory:

- `sql_migration_TIMESTAMP.log`: Location schema migration logs
- `sales_interactions_migration_TIMESTAMP.log`: SalesInteractions schema logs 
- `sari_sari_migration_TIMESTAMP.log`: Sari-Sari store enhancements logs
- `all_migrations_TIMESTAMP.log`: Master migration script logs

## Troubleshooting

Common issues and solutions:

- **Database Connection Errors**: Verify host, port, and credentials
- **Permission Denied**: Ensure database user has required privileges
- **Table Already Exists**: Scripts use IF NOT EXISTS clauses to handle this
- **Failed Foreign Key Constraints**: Ensure migrations are run in the correct order

For detailed error information, check the log files in the `logs/` directory.

## Future Migrations

New migration scripts should be added to the `migrations/` directory and follow the naming convention:

- `YYYYMMDD_description.sql`

Update the `run_all_migrations.sh` script to include new migrations in the correct sequence.