import cors from 'cors';
import { Request } from 'express';

// Define allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
  ];

  // Add production domains
  if (process.env.NODE_ENV === 'production') {
    origins.push(
      'https://scout-dashboard.vercel.app',
      'https://scout.tbwa.com',
      'https://analytics.tbwa.com'
    );
  }

  // Add custom allowed origins from environment
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }

  return origins;
};

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// Preflight handler for complex requests
export const handlePreflight = cors(corsOptions);

// Dynamic CORS for specific routes
export const dynamicCors = (allowedOrigins: string[]) => {
  return cors({
    ...corsOptions,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });
};

// Strict CORS for admin routes
export const adminCors = cors({
  ...corsOptions,
  origin: process.env.ADMIN_ORIGIN || 'https://admin.scout.tbwa.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});