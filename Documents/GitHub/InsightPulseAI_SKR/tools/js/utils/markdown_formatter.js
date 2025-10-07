/**
 * Markdown Formatter Utility
 * 
 * Provides utilities for formatting data as markdown, with special
 * focus on tables and structured data.
 */

/**
 * Converts an array of objects into a markdown table
 * 
 * @param {Array<Object>} data - Array of objects with consistent keys
 * @param {Object} options - Options for formatting
 * @param {Array<string>} options.headers - Column headers (defaults to object keys)
 * @param {Array<string>} options.columns - Object keys to include (defaults to all)
 * @param {boolean} options.alignCenter - Whether to center-align all columns
 * @returns {string} Formatted markdown table
 */
function createMarkdownTable(data, options = {}) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // Extract columns from the first item if not provided
  const columns = options.columns || Object.keys(data[0]);
  
  // Use provided headers or default to columns
  const headers = options.headers || columns;
  
  // Create header row
  let table = '| ' + headers.join(' | ') + ' |\n';
  
  // Create separator row with alignment
  const alignment = options.alignCenter ? ':---:' : '---';
  table += '| ' + columns.map(() => alignment).join(' | ') + ' |\n';
  
  // Create data rows
  data.forEach(item => {
    const row = columns.map(col => item[col] || '').join(' | ');
    table += '| ' + row + ' |\n';
  });
  
  return table;
}

/**
 * Formats an array of items as a markdown bullet list
 * 
 * @param {Array<string>} items - Array of items to format as bullets
 * @param {string} prefix - Optional prefix for each bullet
 * @returns {string} Formatted markdown bullet list
 */
function createBulletList(items, prefix = '') {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }
  
  return items.map(item => `* ${prefix}${item}`).join('\n');
}

/**
 * Creates a YAML format string from an object
 * 
 * @param {Object} data - Object to format as YAML
 * @param {number} indent - Initial indentation level
 * @returns {string} Formatted YAML string
 */
function objectToYaml(data, indent = 0) {
  const indentStr = ' '.repeat(indent);
  let yaml = '';
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${indentStr}- \n${objectToYaml(item, indent + 2)}`;
      } else {
        yaml += `${indentStr}- ${item}\n`;
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        yaml += `${indentStr}${key}:\n${objectToYaml(value, indent + 2)}`;
      } else {
        yaml += `${indentStr}${key}: ${value}\n`;
      }
    });
  }
  
  return yaml;
}

/**
 * Creates a section header with optional description
 * 
 * @param {string} title - Section title
 * @param {string} level - Header level (1-6)
 * @param {string} description - Optional description
 * @returns {string} Formatted markdown header with description
 */
function createSection(title, level = 2, description = '') {
  const header = '#'.repeat(level) + ' ' + title;
  
  if (description) {
    return `${header}\n\n${description}\n`;
  }
  
  return `${header}\n\n`;
}

module.exports = {
  createMarkdownTable,
  createBulletList,
  objectToYaml,
  createSection
};