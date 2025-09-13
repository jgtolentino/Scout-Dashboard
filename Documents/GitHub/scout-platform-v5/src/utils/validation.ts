import { z } from 'zod';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .refine((email) => validator.isEmail(email), 'Invalid email address');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Date validation
export const dateSchema = z.string().refine((date) => validator.isISO8601(date), {
  message: 'Invalid date format',
});

// URL validation
export const urlSchema = z.string().refine((url) => validator.isURL(url), {
  message: 'Invalid URL format',
});

// Phone validation
export const phoneSchema = z.string().refine((phone) => validator.isMobilePhone(phone), {
  message: 'Invalid phone number',
});

// SQL Injection prevention
export const sanitizeSQL = (input: string): string => {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '');
};

// XSS prevention
export const sanitizeHTML = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
};

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().refine((name) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
    return validExtensions.some((ext) => name.toLowerCase().endsWith(ext));
  }, 'Invalid file type'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
});

// Campaign data validation
export const campaignSchema = z.object({
  campaign_name: z.string().min(1).max(255),
  brand_name: z.string().min(1).max(255),
  start_date: dateSchema,
  end_date: dateSchema,
  budget: z.number().positive().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  tags: z.array(z.string()).optional(),
});

// User registration validation
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2).max(100),
  phone: phoneSchema.optional(),
  role: z.enum(['admin', 'manager', 'analyst', 'viewer']).default('viewer'),
});

// API request validation
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  endpoint: z.string().regex(/^\/api\/[a-zA-Z0-9\-\/]+$/),
  params: z.record(z.string()).optional(),
  body: z.any().optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Search query validation
export const searchSchema = z.object({
  query: z.string().min(1).max(100).transform(sanitizeSQL),
  filters: z.record(z.string()).optional(),
  dateRange: z
    .object({
      start: dateSchema,
      end: dateSchema,
    })
    .optional(),
});

// Validate and sanitize input
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
};

// Express middleware for validation
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};