# SQL Server Consolidation Plan

## Current State

We currently have three SQL server instances in our Azure environment:

1. **sqltbwaprojectscoutserver.database.windows.net** (Main Production Server)
   - Primary databases: TBWA_ProjectScout_DB, SQL-TBWA-ProjectScout-Reporting-Prod
   - Used by: ML resources, analytics pipelines, main application
   - Resource Group: RG-TBWA-ProjectScout-Compute
   - Location: Australia East

2. **retail-advisor-sql.database.windows.net** (Retail Dashboard Server)
   - Database: RetailAdvisorDB
   - Used by: Retail Advisor dashboard, SQL API
   - Referenced in: sql_connector.js, run_sql_api.sh

3. **scout-edge-sql.database.windows.net** (Edge Analytics Server)
   - Database: RetailAdvisor
   - Used by: Scout Edge dashboard
   - Referenced in: config.json

## Consolidation Approach

Our approach is to consolidate into a single SQL Server instance to reduce management overhead, simplify the architecture, and optimize costs.

### Target State

**sqltbwaprojectscoutserver.database.windows.net** will be our consolidated server, containing:

1. Existing databases:
   - TBWA_ProjectScout_DB
   - SQL-TBWA-ProjectScout-Reporting-Prod

2. Migrated databases (new):
   - RetailAdvisorDB (from retail-advisor-sql)
   - RetailAdvisor (from scout-edge-sql)

## Migration Plan

### Phase 1: Preparation and Assessment (1-2 days)

1. **Database Schema and Size Assessment**
   - Identify database schemas, tables, and stored procedures for each database
   - Estimate database sizes and growth patterns
   - Document dependencies between databases

2. **Application Dependency Mapping**
   - Identify all applications and services that connect to each database
   - Document connection strings and authentication methods
   - Validate access permissions and roles

3. **Pre-Migration Testing**
   - Test current application performance baselines
   - Validate database integrity and consistency

### Phase 2: Database Migration (1 day per database)

1. **Create Target Databases**
   - Create RetailAdvisorDB in sqltbwaprojectscoutserver
   - Create RetailAdvisor in sqltbwaprojectscoutserver
   - Configure appropriate settings (collation, compatibility level)

2. **Database Migration**
   - For each database:
     - Create database backup from source server
     - Restore backup to target server
     - Verify data integrity post-migration
     - Set up necessary security roles and permissions

3. **Schema Validation**
   - Compare schema between source and target databases
   - Ensure all tables, views, stored procedures, and functions are migrated
   - Verify indexing and performance optimizations

### Phase 3: Application Reconfiguration (2-3 days)

1. **Update Connection Strings**
   - Modify the following files to point to consolidated server:
     - `/final-locked-dashboard/js/sql_connector.js`
     - `/final-locked-dashboard/run_sql_api.sh`
     - `/final-locked-dashboard/scripts/config.json`
     - `/juicer-stack/notebooks/juicer_ingest_bronze.sql`
     - Other identified connection points

2. **Update ML Pipeline Configurations**
   - Modify Databricks notebooks for the new connection:
     - Update JDBC connection in `juicer_ingest_bronze.sql`
     - Test notebook functionality with new connections

3. **Update Dashboard Configurations**
   - Modify SQL API configuration
   - Update any hardcoded connection references

### Phase 4: Testing and Validation (2-3 days)

1. **Functional Testing**
   - Test each application with the new database connections
   - Verify end-to-end data flow from ingestion to visualization
   - Validate ML pipeline functionality

2. **Performance Testing**
   - Benchmark query performance against previous configuration
   - Identify and resolve any performance degradation
   - Optimize as needed (indexing, query tuning)

3. **Integration Testing**
   - Test full data pipeline from ingestion to dashboard
   - Verify ML notebook functionality
   - Test real-time data processing

### Phase 5: Cutover and Decommissioning (1 day)

1. **Final Cutover**
   - Schedule a maintenance window
   - Make final configuration changes
   - Switch all applications to the consolidated server

2. **Monitoring Period**
   - Monitor application performance for 48 hours
   - Watch for errors or performance issues
   - Be prepared to roll back if necessary

3. **Decommissioning**
   - After successful migration and monitoring:
     - Backup source databases for archival
     - Schedule decommissioning of redundant SQL servers

## Rollback Plan

In case of migration issues, we will:

1. Revert connection strings to original configuration
2. Restore applications to use original SQL servers
3. Diagnose and address issues before attempting migration again

## Resource Requirements

- Database admin for migration execution
- Developer support for application configuration changes
- QA resource for testing and validation
- Maintenance window for final cutover (ideally off-hours)

## Cost Impact

- Estimated monthly savings: Approximately $200-300/month per eliminated SQL Server instance
- Total annual savings: $4,800-7,200
- One-time migration cost: 40-60 person-hours

## Timeline

Total estimated time: 7-10 business days
- Preparation and assessment: 1-2 days
- Database migration: 2 days
- Application reconfiguration: 2-3 days
- Testing and validation: 2-3 days
- Cutover and decommissioning: 1 day

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Low | Perform full backups before migration |
| Application downtime | Medium | Medium | Schedule work during off-hours |
| Performance degradation | Medium | Medium | Benchmark and optimize before cutover |
| Integration failure | High | Low | Thorough testing before cutover |
| Security permission issues | Medium | Medium | Document and verify all permissions |