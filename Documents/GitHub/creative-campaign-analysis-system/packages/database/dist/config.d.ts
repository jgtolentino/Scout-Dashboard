export declare const env: {
    AZURE_SQL_SERVER: string;
    AZURE_SQL_DATABASE: string;
    AZURE_SQL_USER: string;
    AZURE_SQL_PASSWORD: string;
    NODE_ENV: "development" | "production" | "test";
    CONNECTION_TIMEOUT: number;
    REQUEST_TIMEOUT: number;
    POOL_MAX: number;
    POOL_MIN: number;
    POOL_IDLE_TIMEOUT: number;
    AZURE_TENANT_ID?: string | undefined;
    AZURE_CLIENT_ID?: string | undefined;
    AZURE_CLIENT_SECRET?: string | undefined;
};
export declare const dbConfig: {
    server: string;
    database: string;
    user: string;
    password: string;
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    };
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    };
};
export type DatabaseConfig = typeof dbConfig;
//# sourceMappingURL=config.d.ts.map