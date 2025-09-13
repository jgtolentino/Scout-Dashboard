import { withGuard } from 'api-guards/guard';
import { z } from 'zod';
import { captcha } from '@scout/captcha';
import { ValidationError } from '@scout/errors';
import { log } from 'observability/log';

const ProtectedActionSchema = z.object({
  action: z.enum(['export', 'bulk_update', 'delete']),
  captchaToken: z.string().optional(),
  data: z.any()
});

export const runtime = 'nodejs';

export const POST = withGuard(
  ProtectedActionSchema,
  async (input, ctx) => {
    // Check if action requires captcha
    const requiresCaptcha = ['export', 'bulk_update', 'delete'].includes(input.action);
    
    if (requiresCaptcha && process.env.ENABLE_CAPTCHA === 'true') {
      if (!input.captchaToken) {
        throw new ValidationError('Captcha verification required', [{
          field: 'captchaToken',
          message: 'This action requires human verification'
        }]);
      }
      
      // Get IP from request
      const ip = ctx.headers?.['x-forwarded-for'] || ctx.headers?.['x-real-ip'] || 'unknown';
      
      const isValid = await captcha.verify(input.captchaToken, ip as string);
      if (!isValid) {
        throw new ValidationError('Captcha verification failed', [{
          field: 'captchaToken',
          message: 'Please complete the captcha challenge'
        }]);
      }
    }
    
    // Log high-value action
    log('info', 'Protected action executed', {
      action: input.action,
      userId: ctx.userId,
      captchaRequired: requiresCaptcha,
      captchaProvided: !!input.captchaToken
    });
    
    // Process the action
    switch (input.action) {
      case 'export':
        // Handle export logic
        return {
          success: true,
          message: 'Export initiated',
          jobId: crypto.randomUUID()
        };
        
      case 'bulk_update':
        // Handle bulk update
        return {
          success: true,
          message: 'Bulk update processed',
          affected: 0 // Would be actual count
        };
        
      case 'delete':
        // Handle deletion
        return {
          success: true,
          message: 'Deletion completed'
        };
        
      default:
        throw new ValidationError('Invalid action', [{
          field: 'action',
          message: 'Unknown action type'
        }]);
    }
  }
);