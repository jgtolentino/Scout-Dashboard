#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';
import { createLogger } from '@tbwa/shared';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('migrate');
async function loadMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    try {
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();
        const migrations = [];
        for (const filename of migrationFiles) {
            const filePath = path.join(migrationsDir, filename);
            const content = await fs.readFile(filePath, 'utf8');
            const match = filename.match(/^(\d+)_(.+)\.sql$/);
            const version = match?.[1] ?? '000';
            const description = match?.[2]?.replace(/_/g, ' ') ?? filename;
            migrations.push({
                filename,
                version,
                description,
                content
            });
        }
        return migrations;
    }
    catch (error) {
        logger.error('Failed to load migrations', error);
        throw error;
    }
}
async function createMigrationsTable() {
    const sql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='migrations' AND xtype='U')
    BEGIN
        CREATE TABLE migrations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            version NVARCHAR(10) NOT NULL UNIQUE,
            filename NVARCHAR(255) NOT NULL,
            description NVARCHAR(500),
            executed_at DATETIME2 DEFAULT GETUTCDATE(),
            success BIT DEFAULT 1,
            error_message NVARCHAR(MAX)
        );
        PRINT 'Created migrations table';
    END
  `;
    try {
        await db.execute(sql);
        logger.info('✅ Migrations table ready');
    }
    catch (error) {
        logger.error('❌ Failed to create migrations table', error);
        throw error;
    }
}
async function getExecutedMigrations() {
    try {
        const result = await db.query(`
      SELECT version FROM migrations 
      WHERE success = 1 
      ORDER BY version
    `);
        return result.recordset.map(row => row.version);
    }
    catch (error) {
        logger.error('Failed to get executed migrations', error);
        return [];
    }
}
async function executeMigration(migration) {
    const startTime = Date.now();
    try {
        logger.info(`🔄 Executing migration ${migration.version}: ${migration.description}`);
        await db.execute(migration.content);
        await db.execute(`
      INSERT INTO migrations (version, filename, description, executed_at, success)
      VALUES (@version, @filename, @description, GETUTCDATE(), 1)
    `, {
            version: migration.version,
            filename: migration.filename,
            description: migration.description
        });
        const duration = Date.now() - startTime;
        logger.info(`✅ Migration ${migration.version} completed in ${duration}ms`);
        return true;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Migration ${migration.version} failed after ${duration}ms:`, errorMessage);
        try {
            await db.execute(`
        INSERT INTO migrations (version, filename, description, executed_at, success, error_message)
        VALUES (@version, @filename, @description, GETUTCDATE(), 0, @error_message)
      `, {
                version: migration.version,
                filename: migration.filename,
                description: migration.description,
                error_message: errorMessage
            });
        }
        catch (recordError) {
            logger.error('Failed to record migration failure', recordError);
        }
        return false;
    }
}
async function runMigrations() {
    const startTime = Date.now();
    try {
        logger.info('🚀 Starting database migration...');
        const healthCheck = await db.healthCheck();
        if (healthCheck.status !== 'healthy') {
            throw new Error(`Database is not healthy: ${JSON.stringify(healthCheck.details)}`);
        }
        logger.info('✅ Database connection verified');
        await createMigrationsTable();
        const migrations = await loadMigrations();
        logger.info(`📁 Found ${migrations.length} migration files`);
        if (migrations.length === 0) {
            logger.info('ℹ️  No migrations to execute');
            return;
        }
        const executedVersions = await getExecutedMigrations();
        logger.info(`📋 ${executedVersions.length} migrations already executed`);
        const pendingMigrations = migrations.filter(migration => !executedVersions.includes(migration.version));
        if (pendingMigrations.length === 0) {
            logger.info('✅ All migrations are up to date');
            return;
        }
        logger.info(`⏳ ${pendingMigrations.length} migrations pending execution`);
        let successCount = 0;
        let failureCount = 0;
        for (const migration of pendingMigrations) {
            const success = await executeMigration(migration);
            if (success) {
                successCount++;
            }
            else {
                failureCount++;
                break;
            }
        }
        const totalDuration = Date.now() - startTime;
        console.log('\n' + '='.repeat(60));
        logger.info(`📊 Migration Summary:`);
        logger.info(`   Total migrations: ${migrations.length}`);
        logger.info(`   Already executed: ${executedVersions.length}`);
        logger.info(`   Pending: ${pendingMigrations.length}`);
        logger.info(`   Successful: ${successCount}`);
        logger.info(`   Failed: ${failureCount}`);
        logger.info(`   Duration: ${totalDuration}ms`);
        console.log('='.repeat(60));
        if (failureCount > 0) {
            throw new Error(`${failureCount} migration(s) failed`);
        }
        logger.info('🎉 All migrations completed successfully!');
    }
    catch (error) {
        logger.error('💥 Migration process failed:', error);
        throw error;
    }
    finally {
        await db.close();
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error.message);
        process.exit(1);
    });
}
export { runMigrations, loadMigrations, executeMigration };
