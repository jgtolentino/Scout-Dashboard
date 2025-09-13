import sql from 'mssql';
declare class DatabaseConnection {
    private pool;
    private connecting;
    getPool(): Promise<sql.ConnectionPool>;
    query<T = any>(sqlQuery: string, params?: Record<string, any>): Promise<sql.IResult<T>>;
    execute(sqlQuery: string, params?: Record<string, any>): Promise<sql.IResult<any>>;
    close(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
}
export declare const db: DatabaseConnection;
export type { DatabaseConnection };
export default db;
//# sourceMappingURL=connection.d.ts.map