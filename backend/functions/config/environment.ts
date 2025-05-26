import dotenv from 'dotenv'
import Joi from 'joi'

// Load environment variables
dotenv.config()

// Define environment schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  
  // JWT Configuration
  JWT_SECRET: Joi.string()
    .required()
    .description('Secret key for JWT token signing'),
  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT token expiration time'),
  
  // Azure Storage Configuration
  AZURE_STORAGE_CONNECTION_STRING: Joi.string()
    .required()
    .description('Azure Storage connection string'),
  
  // Database Configuration
  DB_SERVER: Joi.string()
    .required()
    .description('Database server hostname'),
  DB_DATABASE: Joi.string()
    .required()
    .description('Database name'),
  DB_USER: Joi.string()
    .required()
    .description('Database username'),
  DB_PASSWORD: Joi.string()
    .required()
    .description('Database password'),
  DB_PORT: Joi.number()
    .default(1433)
    .description('Database port'),
  
  // CORS Configuration
  CORS_ORIGIN: Joi.string()
    .default('*')
    .description('CORS allowed origins'),
  
  // API Configuration
  API_RATE_LIMIT: Joi.number()
    .default(100)
    .description('API rate limit per minute'),
  API_TIMEOUT: Joi.number()
    .default(30000)
    .description('API timeout in milliseconds')
}).unknown(true) // Allow additional environment variables

// Validate environment variables
const { error, value: validatedEnv } = envSchema.validate(process.env, {
  abortEarly: false
})

if (error) {
  console.error('Environment validation error:', error.message)
  
  // In production, throw error to prevent startup
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Environment validation failed: ${error.message}`)
  }
  
  // In development, use defaults where possible
  console.warn('Running with incomplete environment configuration')
}

// Export validated configuration
export const config = {
  NODE_ENV: validatedEnv.NODE_ENV || 'development',
  
  // JWT Configuration
  JWT_SECRET: validatedEnv.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN || '24h',
  
  // Azure Storage Configuration
  AZURE_STORAGE_CONNECTION_STRING: validatedEnv.AZURE_STORAGE_CONNECTION_STRING || '',
  
  // Database Configuration
  DB_SERVER: validatedEnv.DB_SERVER || 'localhost',
  DB_DATABASE: validatedEnv.DB_DATABASE || 'scout_dashboard',
  DB_USER: validatedEnv.DB_USER || 'sa',
  DB_PASSWORD: validatedEnv.DB_PASSWORD || 'password',
  DB_PORT: validatedEnv.DB_PORT || 1433,
  
  // CORS Configuration
  CORS_ORIGIN: validatedEnv.CORS_ORIGIN || '*',
  
  // API Configuration
  API_RATE_LIMIT: validatedEnv.API_RATE_LIMIT || 100,
  API_TIMEOUT: validatedEnv.API_TIMEOUT || 30000
}

// Type-safe config
export type Config = typeof config