import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },
  
  pulser: {
    mcpUrl: process.env.PULSER_MCP_URL,
    mcpToken: process.env.PULSER_MCP_TOKEN,
    webhookSecret: process.env.PULSER_WEBHOOK_SECRET
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://*.onrender.com',
      'https://*.vercel.app'
    ]
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  },
  
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: 'tbwa_hris_'
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '))
  console.error('Please check your .env file and ensure all required variables are set.')
  process.exit(1)
}

export default config