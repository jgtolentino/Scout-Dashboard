import { format, parseISO, differenceInMilliseconds } from 'date-fns';
export const formatDate = (date, pattern = 'yyyy-MM-dd HH:mm:ss') => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, pattern);
};
export const calculateDuration = (start, end) => {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    return differenceInMilliseconds(endDate, startDate);
};
export const getFileExtension = (filename) => {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
};
export const getMimeType = (filename) => {
    const ext = getFileExtension(filename);
    const mimeTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        wmv: 'video/x-ms-wmv',
        txt: 'text/plain',
        html: 'text/html',
        css: 'text/css',
        js: 'text/javascript',
        json: 'application/json',
        xml: 'application/xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};
export const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};
export const isValidFileType = (filename) => {
    const ext = getFileExtension(filename);
    const supportedExtensions = [
        'pdf', 'doc', 'docx', 'ppt', 'pptx',
        'jpg', 'jpeg', 'png', 'gif', 'bmp',
        'mp4', 'avi', 'mov', 'wmv'
    ];
    return supportedExtensions.includes(ext);
};
export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
};
export const cleanText = (text) => {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\-_.]/g, '')
        .trim();
};
export const extractKeywords = (text, maxKeywords = 10) => {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !commonStopWords.includes(word));
    const wordCounts = {};
    words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    return Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word);
};
const commonStopWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'throughout', 'despite',
    'towards', 'upon', 'concerning', 'a', 'an', 'as', 'are', 'was', 'were',
    'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
];
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
export const chunk = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
export const unique = (array) => {
    return [...new Set(array)];
};
export const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
};
export const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
};
export const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
export const isEmpty = (value) => {
    if (value == null)
        return true;
    if (Array.isArray(value) || typeof value === 'string')
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
};
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
export const retry = async (fn, options = {}) => {
    const { attempts = 3, delay = 1000, backoff = 2 } = options;
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, i)));
            }
        }
    }
    throw lastError;
};
export const measure = async (fn, label) => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    if (label) {
        console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    return { result, duration };
};
export const debounce = (func, wait, immediate = false) => {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate)
                func(...args);
        };
        const callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func(...args);
    };
};
export const throttle = (func, limit) => {
    let inThrottle;
    return function throttledFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
export const isAppError = (error) => {
    return error instanceof AppError;
};
export const createErrorResponse = (error) => {
    if (isAppError(error)) {
        return {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
        };
    }
    return {
        success: false,
        error: error.message || 'An unexpected error occurred',
    };
};
export const parseEnvBoolean = (value, defaultValue = false) => {
    if (value === undefined)
        return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};
export const parseEnvNumber = (value, defaultValue) => {
    if (value === undefined)
        return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
export const parseEnvArray = (value, separator = ',') => {
    if (!value)
        return [];
    return value.split(separator).map(item => item.trim()).filter(Boolean);
};
export const createLogger = (context) => {
    return {
        debug: (message, data) => console.debug(`[${context}] ${message}`, data || ''),
        info: (message, data) => console.log(`[${context}] ${message}`, data || ''),
        warn: (message, data) => console.warn(`[${context}] ${message}`, data || ''),
        error: (message, error) => console.error(`[${context}] ${message}`, error || ''),
    };
};
