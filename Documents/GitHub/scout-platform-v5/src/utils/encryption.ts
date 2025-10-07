import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { securityConfig } from '../config/security';

const algorithm = 'aes-256-gcm';
const saltRounds = 10;

// Encrypt sensitive data
export const encrypt = (text: string): { encrypted: string; iv: string; tag: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, securityConfig.encryption.key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
};

// Decrypt sensitive data
export const decrypt = (encryptedData: {
  encrypted: string;
  iv: string;
  tag: string;
}): string => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    securityConfig.encryption.key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Hash passwords
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

// Verify passwords
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate API keys
export const generateApiKey = (): string => {
  const prefix = 'sk_live_';
  const token = crypto.randomBytes(32).toString('hex');
  return `${prefix}${token}`;
};

// Hash API keys for storage
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Encrypt JSON objects
export const encryptJSON = (data: any): string => {
  const jsonString = JSON.stringify(data);
  const { encrypted, iv, tag } = encrypt(jsonString);
  return Buffer.from(JSON.stringify({ encrypted, iv, tag })).toString('base64');
};

// Decrypt JSON objects
export const decryptJSON = (encryptedString: string): any => {
  try {
    const encryptedData = JSON.parse(Buffer.from(encryptedString, 'base64').toString());
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
};

// Secure file name generation
export const generateSecureFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// PII data masking
export const maskPII = (data: string, type: 'email' | 'phone' | 'credit_card'): string => {
  switch (type) {
    case 'email':
      const [localPart, domain] = data.split('@');
      const maskedLocal = localPart.slice(0, 2) + '***';
      return `${maskedLocal}@${domain}`;
    
    case 'phone':
      return data.slice(0, 3) + '****' + data.slice(-4);
    
    case 'credit_card':
      return '**** **** **** ' + data.slice(-4);
    
    default:
      return '***';
  }
};

// Two-factor authentication token generation (simplified)
export const generateTOTP = (secret: string): string => {
  const time = Math.floor(Date.now() / 1000 / 30);
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(time.toString());
  
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
};

// Secure session token
export const generateSessionToken = (): string => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(timestamp + random)
    .digest('hex');
  return hash;
};