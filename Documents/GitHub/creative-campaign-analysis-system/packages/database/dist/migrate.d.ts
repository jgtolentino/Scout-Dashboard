#!/usr/bin/env node
interface MigrationFile {
    filename: string;
    version: string;
    description: string;
    content: string;
}
declare function loadMigrations(): Promise<MigrationFile[]>;
declare function executeMigration(migration: MigrationFile): Promise<boolean>;
declare function runMigrations(): Promise<void>;
export { runMigrations, loadMigrations, executeMigration };
//# sourceMappingURL=migrate.d.ts.map