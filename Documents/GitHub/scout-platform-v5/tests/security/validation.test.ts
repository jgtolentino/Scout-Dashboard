import { describe, it, expect } from '@jest/globals';
import {
  emailSchema,
  passwordSchema,
  sanitizeSQL,
  sanitizeHTML,
  validateInput,
  campaignSchema,
} from '../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@company.co.uk',
        'admin+tag@domain.org',
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Complex$Pass9',
      ];

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',          // Too short
        'alllowercase',   // No uppercase, numbers, or special chars
        'ALLUPPERCASE',   // No lowercase, numbers, or special chars
        'NoNumbers!',     // No numbers
        'NoSpecial123',   // No special characters
        'No Uppercase1!', // Contains space
      ];

      weakPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM campaigns;",
        "/* comment */ SELECT * FROM users",
      ];

      const expectedOutputs = [
        "'''' DROP TABLE users ",
        "1'' OR ''1''=''1",
        "admin''",
        "1 DELETE FROM campaigns",
        " comment  SELECT * FROM users",
      ];

      maliciousInputs.forEach((input, index) => {
        expect(sanitizeSQL(input)).toBe(expectedOutputs[index]);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize HTML to prevent XSS', () => {
      const maliciousHTML = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">Click me</a>',
        '<div onclick="alert(1)">Test</div>',
      ];

      maliciousHTML.forEach((html) => {
        const sanitized = sanitizeHTML(html);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onclick=');
      });
    });

    it('should preserve safe HTML tags', () => {
      const safeHTML = '<p>This is <b>bold</b> and <i>italic</i> text with a <a href="https://example.com">link</a></p>';
      const sanitized = sanitizeHTML(safeHTML);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<b>');
      expect(sanitized).toContain('<i>');
      expect(sanitized).toContain('<a href="https://example.com">');
    });
  });

  describe('Campaign Validation', () => {
    it('should validate valid campaign data', () => {
      const validCampaign = {
        campaign_name: 'Summer Sale 2024',
        brand_name: 'TBWA',
        start_date: '2024-06-01T00:00:00Z',
        end_date: '2024-08-31T23:59:59Z',
        budget: 50000,
        status: 'active',
        tags: ['summer', 'sale', 'promotion'],
      };

      expect(() => campaignSchema.parse(validCampaign)).not.toThrow();
    });

    it('should reject invalid campaign data', () => {
      const invalidCampaigns = [
        {
          // Missing required fields
          campaign_name: 'Test',
        },
        {
          // Invalid date format
          campaign_name: 'Test',
          brand_name: 'Brand',
          start_date: 'not-a-date',
          end_date: '2024-12-31',
          status: 'active',
        },
        {
          // Invalid status
          campaign_name: 'Test',
          brand_name: 'Brand',
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-12-31T23:59:59Z',
          status: 'invalid-status',
        },
      ];

      invalidCampaigns.forEach((campaign) => {
        expect(() => campaignSchema.parse(campaign)).toThrow();
      });
    });
  });

  describe('validateInput Helper', () => {
    it('should validate and return parsed data', () => {
      const input = { email: 'test@example.com' };
      const result = validateInput(emailSchema, input.email);
      expect(result).toBe(input.email);
    });

    it('should throw descriptive error for invalid input', () => {
      const input = 'invalid-email';
      expect(() => validateInput(emailSchema, input)).toThrow('Validation error:');
    });
  });
});