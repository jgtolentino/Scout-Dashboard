#!/usr/bin/env node
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
declare function getDatabaseStatus(): Promise<DatabaseStatus>;
declare function formatStatus(status: DatabaseStatus): void;
declare function runStatusCheck(): Promise<void>;
export { getDatabaseStatus, formatStatus, runStatusCheck };
//# sourceMappingURL=status.d.ts.map