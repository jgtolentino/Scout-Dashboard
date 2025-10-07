import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: ['../../.env.local', '../../.env', '.env.local', '.env'] });
const envSchema = z.object({
    AZURE_SQL_SERVER: z.string().default('sqltbwaprojectscoutserver.database.windows.net'),
    AZURE_SQL_DATABASE: z.string().default('SQL-TBWA-ProjectScout-Reporting-Prod'),
    AZURE_SQL_USER: z.string().default('sqladmin'),
    AZURE_SQL_PASSWORD: z.string(),
    AZURE_TENANT_ID: z.string().optional(),
    AZURE_CLIENT_ID: z.string().optional(),
    AZURE_CLIENT_SECRET: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CONNECTION_TIMEOUT: z.coerce.number().default(30000),
    REQUEST_TIMEOUT: z.coerce.number().default(30000),
    POOL_MAX: z.coerce.number().default(10),
    POOL_MIN: z.coerce.number().default(0),
    POOL_IDLE_TIMEOUT: z.coerce.number().default(30000),
});
export const env = envSchema.parse(process.env);
export const dbConfig = {
    server: env.AZURE_SQL_SERVER,
    database: env.AZURE_SQL_DATABASE,
    user: env.AZURE_SQL_USER,
    password: env.AZURE_SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: env.REQUEST_TIMEOUT,
        connectionTimeout: env.CONNECTION_TIMEOUT,
        enableArithAbort: true,
    },
    pool: {
        max: env.POOL_MAX,
        min: env.POOL_MIN,
        idleTimeoutMillis: env.POOL_IDLE_TIMEOUT,
        acquireTimeoutMillis: 30000,
    },
};
