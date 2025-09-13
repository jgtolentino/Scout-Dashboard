export declare const formatDate: (date: Date | string, pattern?: string) => string;
export declare const calculateDuration: (start: Date | string, end: Date | string) => number;
export declare const getFileExtension: (filename: string) => string;
export declare const getMimeType: (filename: string) => string;
export declare const formatFileSize: (bytes: number) => string;
export declare const isValidFileType: (filename: string) => boolean;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const cleanText: (text: string) => string;
export declare const extractKeywords: (text: string, maxKeywords?: number) => string[];
export declare const generateUUID: () => string;
export declare const isValidUUID: (uuid: string) => boolean;
export declare const chunk: <T>(array: T[], size: number) => T[][];
export declare const unique: <T>(array: T[]) => T[];
export declare const groupBy: <T, K extends keyof T>(array: T[], key: K) => Record<string, T[]>;
export declare const omit: <T extends object, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>;
export declare const pick: <T extends object, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>;
export declare const isEmpty: (value: any) => boolean;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidUrl: (url: string) => boolean;
export declare const retry: <T>(fn: () => Promise<T>, options?: {
    attempts?: number;
    delay?: number;
    backoff?: number;
}) => Promise<T>;
export declare const measure: <T>(fn: () => Promise<T>, label?: string) => Promise<{
    result: T;
    duration: number;
}>;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number, immediate?: boolean) => ((...args: Parameters<T>) => void);
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    details?: any | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined, details?: any | undefined);
}
export declare const isAppError: (error: any) => error is AppError;
export declare const createErrorResponse: (error: any) => {
    success: boolean;
    error: string;
    code: string | undefined;
    details: any;
} | {
    success: boolean;
    error: any;
    code?: never;
    details?: never;
};
export declare const parseEnvBoolean: (value: string | undefined, defaultValue?: boolean) => boolean;
export declare const parseEnvNumber: (value: string | undefined, defaultValue: number) => number;
export declare const parseEnvArray: (value: string | undefined, separator?: string) => string[];
export declare const createLogger: (context: string) => {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
};
//# sourceMappingURL=index.d.ts.map