import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Security
  JWT_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  
  // App version
  NEXT_PUBLIC_APP_VERSION: z.string().default('5.2.0'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_ORIGIN: z.string().url().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

// Validate environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

// Export validated config
export const config = validateEnv();

// Security configuration
export const securityConfig = {
  jwt: {
    secret: config.JWT_SECRET,
    refreshSecret: config.REFRESH_TOKEN_SECRET,
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    issuer: 'scout-dashboard',
    audience: 'scout-dashboard-api',
  },
  
  session: {
    secret: config.SESSION_SECRET,
    name: 'scout.sid',
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const,
    },
  },
  
  cors: {
    origins: config.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  },
  
  rateLimit: {
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS),
  },
  
  encryption: {
    algorithm: 'aes-256-gcm',
    key: Buffer.from(config.ENCRYPTION_KEY || '', 'hex'),
  },
  
  headers: {
    contentSecurityPolicy: config.NODE_ENV === 'production',
    hsts: config.NODE_ENV === 'production',
  },
};

// Database configuration
export const databaseConfig = {
  url: config.DATABASE_URL,
  supabase: {
    url: config.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
  },
};

// Redis configuration
export const redisConfig = {
  url: config.REDIS_URL || 'redis://localhost:6379',
  options: {
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  },
};

// Monitoring configuration
export const monitoringConfig = {
  sentry: {
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
  logtail: {
    sourceToken: config.LOGTAIL_SOURCE_TOKEN,
  },
};

// Export individual configs
export default {
  ...config,
  security: securityConfig,
  database: databaseConfig,
  redis: redisConfig,
  monitoring: monitoringConfig,
};