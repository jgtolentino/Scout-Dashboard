#!/usr/bin/env node
/**
 * Database Status Check Script
 * Provides comprehensive database health and schema status
 */

import { db } from './connection.js';
import { createLogger } from '@tbwa/shared';

const logger = createLogger('db-status');

interface TableInfo {
  name: string;
  row_count: number;
  size_mb: number;
  last_updated?: Date;
}

interface IndexInfo {
  table_name: string;
  index_name: string;
  type: string;
  is_unique: boolean;
  columns: string[];
}

interface DatabaseStatus {
  connection: {
    status: 'healthy' | 'unhealthy';
    server: string;
    database: string;
    version?: string;
    uptime?: string;
  };
  schema: {
    tables: TableInfo[];
    indexes: IndexInfo[];
    views: string[];
    procedures: string[];
  };
  migrations: {
    total: number;
    executed: number;
    pending: number;
    last_migration?: {
      version: string;
      description: string;
      executed_at: Date;
    };
    failed: number;
  };
  pageindex: {
    total_files: number;
    total_chunks: number;
    avg_quality_score: number;
    processing_status: Record<string, number>;
    file_types: Record<string, number>;
    recent_activity: Array<{
      operation: string;
      count: number;
      last_occurrence: Date;
    }>;
  };
}

async function checkConnection(): Promise<DatabaseStatus['connection']> {
  try {
    const healthCheck = await db.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      // Get database version and uptime
      const versionResult = await db.query<{ version: string }>(`
        SELECT @@VERSION as version
      `);
      
      const uptimeResult = await db.query<{ uptime: string }>(`
        SELECT sqlserver_start_time as uptime 
        FROM sys.dm_os_sys_info
      `);
      
      return {
        status: 'healthy',
        server: process.env.AZURE_SQL_SERVER || 'unknown',
        database: process.env.AZURE_SQL_DATABASE || 'unknown',
        version: versionResult.recordset[0]?.version?.split('\n')[0] || 'unknown',
        uptime: uptimeResult.recordset[0]?.uptime || 'unknown'
      };
    } else {
      return {
        status: 'unhealthy',
        server: process.env.AZURE_SQL_SERVER || 'unknown',
        database: process.env.AZURE_SQL_DATABASE || 'unknown'
      };
    }
  } catch (error) {
    logger.error('Connection check failed', error);
    return {
      status: 'unhealthy',
      server: process.env.AZURE_SQL_SERVER || 'unknown',
      database: process.env.AZURE_SQL_DATABASE || 'unknown'
    };
  }
}

async function checkSchema(): Promise<DatabaseStatus['schema']> {
  try {
    // Get table information
    const tablesResult = await db.query<{
      table_name: string;
      row_count: number;
      size_mb: number;
    }>(`
      SELECT 
        t.TABLE_NAME as table_name,
        ISNULL(p.rows, 0) as row_count,
        ISNULL(
          CAST(
            (SUM(a.total_pages) * 8.0 / 1024.0) as DECIMAL(10,2)
          ), 0.0
        ) as size_mb
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.tables st ON t.TABLE_NAME = st.name
      LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0, 1)
      LEFT JOIN sys.allocation_units a ON p.partition_id = a.container_id
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_SCHEMA = 'dbo'
      GROUP BY t.TABLE_NAME, p.rows
      ORDER BY t.TABLE_NAME
    `);

    // Get index information
    const indexesResult = await db.query<{
      table_name: string;
      index_name: string;
      type_desc: string;
      is_unique: boolean;
      column_names: string;
    }>(`
      SELECT 
        t.name as table_name,
        i.name as index_name,
        i.type_desc,
        i.is_unique,
        STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) as column_names
      FROM sys.indexes i
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.name IS NOT NULL
      GROUP BY t.name, i.name, i.type_desc, i.is_unique
      ORDER BY t.name, i.name
    `);

    // Get views
    const viewsResult = await db.query<{ view_name: string }>(`
      SELECT TABLE_NAME as view_name
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    // Get stored procedures
    const proceduresResult = await db.query<{ procedure_name: string }>(`
      SELECT ROUTINE_NAME as procedure_name
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_SCHEMA = 'dbo'
      ORDER BY ROUTINE_NAME
    `);

    return {
      tables: tablesResult.recordset.map(row => ({
        name: row.table_name,
        row_count: row.row_count || 0,
        size_mb: row.size_mb || 0
      })),
      indexes: indexesResult.recordset.map(row => ({
        table_name: row.table_name,
        index_name: row.index_name,
        type: row.type_desc,
        is_unique: row.is_unique,
        columns: row.column_names ? row.column_names.split(', ') : []
      })),
      views: viewsResult.recordset.map(row => row.view_name),
      procedures: proceduresResult.recordset.map(row => row.procedure_name)
    };
  } catch (error) {
    logger.error('Schema check failed', error);
    return {
      tables: [],
      indexes: [],
      views: [],
      procedures: []
    };
  }
}

async function checkMigrations(): Promise<DatabaseStatus['migrations']> {
  try {
    // Check if migrations table exists
    const migrationsTableExists = await db.query<{ exists: number }>(`
      SELECT COUNT(*) as exists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'migrations' AND TABLE_SCHEMA = 'dbo'
    `);

    if (migrationsTableExists.recordset[0]?.exists === 0) {
      return {
        total: 0,
        executed: 0,
        pending: 0,
        failed: 0
      };
    }

    // Get migration statistics
    const statsResult = await db.query<{
      total: number;
      executed: number;
      failed: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as executed,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM migrations
    `);

    // Get last successful migration
    const lastMigrationResult = await db.query<{
      version: string;
      description: string;
      executed_at: Date;
    }>(`
      SELECT TOP 1 version, description, executed_at
      FROM migrations
      WHERE success = 1
      ORDER BY executed_at DESC
    `);

    const stats = statsResult.recordset[0];
    const lastMigration = lastMigrationResult.recordset[0];

    const result = {
      total: stats?.total || 0,
      executed: stats?.executed || 0,
      pending: (stats?.total || 0) - (stats?.executed || 0),
      failed: stats?.failed || 0,
    };

    if (lastMigration) {
      return {
        ...result,
        last_migration: {
          version: lastMigration.version,
          description: lastMigration.description,
          executed_at: lastMigration.executed_at
        }
      };
    }

    return result;
  } catch (error) {
    logger.error('Migrations check failed', error);
    return {
      total: 0,
      executed: 0,
      pending: 0,
      failed: 0
    };
  }
}

async function checkPageIndex(): Promise<DatabaseStatus['pageindex']> {
  try {
    // Check if PageIndex tables exist
    const tablesExist = await db.query<{ table_count: number }>(`
      SELECT COUNT(*) as table_count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN ('fileMetadata', 'pageIndex', 'campaignInsights')
        AND TABLE_SCHEMA = 'dbo'
    `);

    if ((tablesExist.recordset[0]?.table_count ?? 0) < 3) {
      return {
        total_files: 0,
        total_chunks: 0,
        avg_quality_score: 0,
        processing_status: {},
        file_types: {},
        recent_activity: []
      };
    }

    // Get file and chunk counts
    const countsResult = await db.query<{
      total_files: number;
      total_chunks: number;
      avg_quality: number;
    }>(`
      SELECT 
        COUNT(DISTINCT fm.file_id) as total_files,
        COUNT(pi.chunk_id) as total_chunks,
        AVG(ISNULL(pi.visual_quality_score, 0)) as avg_quality
      FROM fileMetadata fm
      LEFT JOIN pageIndex pi ON fm.file_id = pi.file_id
    `);

    // Get processing status distribution
    const statusResult = await db.query<{
      processing_status: string;
      count: number;
    }>(`
      SELECT processing_status, COUNT(*) as count
      FROM fileMetadata
      GROUP BY processing_status
    `);

    // Get file type distribution
    const typeResult = await db.query<{
      file_type: string;
      count: number;
    }>(`
      SELECT file_type, COUNT(*) as count
      FROM fileMetadata
      GROUP BY file_type
    `);

    // Get recent activity from processing logs
    const activityResult = await db.query<{
      operation_type: string;
      count: number;
      last_occurrence: Date;
    }>(`
      SELECT 
        operation_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM processingLogs
      WHERE created_at >= DATEADD(day, -7, GETUTCDATE())
      GROUP BY operation_type
      ORDER BY last_occurrence DESC
    `);

    const counts = countsResult.recordset[0];

    return {
      total_files: counts?.total_files ?? 0,
      total_chunks: counts?.total_chunks ?? 0,
      avg_quality_score: counts?.avg_quality ?? 0,
      processing_status: statusResult.recordset.reduce((acc, row) => {
        acc[row.processing_status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      file_types: typeResult.recordset.reduce((acc, row) => {
        acc[row.file_type] = row.count;
        return acc;
      }, {} as Record<string, number>),
      recent_activity: activityResult.recordset.map(row => ({
        operation: row.operation_type,
        count: row.count,
        last_occurrence: row.last_occurrence
      }))
    };
  } catch (error) {
    logger.error('PageIndex check failed', error);
    return {
      total_files: 0,
      total_chunks: 0,
      avg_quality_score: 0,
      processing_status: {},
      file_types: {},
      recent_activity: []
    };
  }
}

async function getDatabaseStatus(): Promise<DatabaseStatus> {
  logger.info('🔍 Checking database status...');

  const [connection, schema, migrations, pageindex] = await Promise.all([
    checkConnection(),
    checkSchema(),
    checkMigrations(),
    checkPageIndex()
  ]);

  return {
    connection,
    schema,
    migrations,
    pageindex
  };
}

function formatStatus(status: DatabaseStatus): void {
  console.log('\n' + '='.repeat(80));
  console.log('🗃️  TBWA CES Database Status Report');
  console.log('='.repeat(80));

  // Connection Status
  console.log('\n📡 CONNECTION STATUS');
  console.log('─'.repeat(40));
  console.log(`Status: ${status.connection.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`Server: ${status.connection.server}`);
  console.log(`Database: ${status.connection.database}`);
  if (status.connection.version) {
    console.log(`Version: ${status.connection.version}`);
  }
  if (status.connection.uptime) {
    console.log(`Started: ${status.connection.uptime}`);
  }

  // Schema Status
  console.log('\n🏗️  SCHEMA STATUS');
  console.log('─'.repeat(40));
  console.log(`Tables: ${status.schema.tables.length}`);
  console.log(`Indexes: ${status.schema.indexes.length}`);
  console.log(`Views: ${status.schema.views.length}`);
  console.log(`Procedures: ${status.schema.procedures.length}`);

  if (status.schema.tables.length > 0) {
    console.log('\nTable Details:');
    status.schema.tables.forEach(table => {
      console.log(`  • ${table.name}: ${table.row_count.toLocaleString()} rows (${table.size_mb.toFixed(2)} MB)`);
    });
  }

  // Migration Status
  console.log('\n🔄 MIGRATION STATUS');
  console.log('─'.repeat(40));
  console.log(`Total Migrations: ${status.migrations.total}`);
  console.log(`Executed: ${status.migrations.executed}`);
  console.log(`Pending: ${status.migrations.pending}`);
  console.log(`Failed: ${status.migrations.failed}`);

  if (status.migrations.last_migration) {
    console.log(`Last Migration: ${status.migrations.last_migration.version} - ${status.migrations.last_migration.description}`);
    console.log(`Executed At: ${status.migrations.last_migration.executed_at}`);
  }

  // PageIndex Status
  console.log('\n🔍 PAGEINDEX STATUS');
  console.log('─'.repeat(40));
  console.log(`Total Files: ${status.pageindex.total_files.toLocaleString()}`);
  console.log(`Total Chunks: ${status.pageindex.total_chunks.toLocaleString()}`);
  console.log(`Avg Quality Score: ${(status.pageindex.avg_quality_score * 100).toFixed(1)}%`);

  if (Object.keys(status.pageindex.processing_status).length > 0) {
    console.log('\nProcessing Status:');
    Object.entries(status.pageindex.processing_status).forEach(([status, count]) => {
      console.log(`  • ${status}: ${count.toLocaleString()}`);
    });
  }

  if (Object.keys(status.pageindex.file_types).length > 0) {
    console.log('\nFile Types:');
    Object.entries(status.pageindex.file_types).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count.toLocaleString()}`);
    });
  }

  if (status.pageindex.recent_activity.length > 0) {
    console.log('\nRecent Activity (Last 7 days):');
    status.pageindex.recent_activity.forEach(activity => {
      console.log(`  • ${activity.operation}: ${activity.count} operations (last: ${activity.last_occurrence})`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

async function runStatusCheck(): Promise<void> {
  try {
    const status = await getDatabaseStatus();
    formatStatus(status);

    // Exit with error code if unhealthy
    if (status.connection.status === 'unhealthy') {
      process.exit(1);
    }
  } catch (error) {
    logger.error('Status check failed', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runStatusCheck();
}

export { getDatabaseStatus, formatStatus, runStatusCheck };