/**
 * Utility functions for exporting data in various formats
 */

/**
 * Convert data to CSV format
 * 
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (defaults to object keys)
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (!data || data.length === 0) {
    return '';
  }
  
  // If headers not provided, use keys from first data object
  const keysToUse = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = keysToUse.map(key => `"${key}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return keysToUse.map(key => {
      const value = item[key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '""';
      }
      
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        } else {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
      }
      
      // Escape quotes in string values
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return `"${value}"`;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Download data as a CSV file
 * 
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download
 * @param headers Optional custom headers (defaults to object keys)
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  // Convert data to CSV
  const csv = convertToCSV(data, headers);
  
  // Create a blob with the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a date object or string for display
 * 
 * @param date Date to format
 * @param format Format style (default, short, or full)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'default' | 'short' | 'full' = 'default'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString();
  }
  
  if (format === 'full') {
    return dateObj.toLocaleString();
  }
  
  // Default format: YYYY-MM-DD
  return dateObj.toISOString().split('T')[0];
}