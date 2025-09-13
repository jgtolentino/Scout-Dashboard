/**
 * @file export_templates.js
 * @description Manages template configurations for exporting dashboard data
 * @version v2.4.0
 */

/**
 * Class for managing export templates
 */
class ExportTemplates {
  /**
   * Create a new ExportTemplates instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      userPreferences: null, // Optional UserPreferences instance for sync
      storageKey: 'client360_export_templates',
      maxTemplates: 20,
      localStorage: true, // Whether to use localStorage as fallback
      supportedFormats: ['xlsx', 'csv', 'pdf', 'png', 'json'],
      defaultExporters: {
        xlsx: null, // Will be initialized on first use
        csv: null,
        pdf: null,
        png: null,
        json: null
      },
      ...config
    };

    // Map to store templates by ID
    this.templates = new Map();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Load saved templates
    this._loadFromStorage();
    
    // Bind methods
    this.createTemplate = this.createTemplate.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.getAllTemplates = this.getAllTemplates.bind(this);
    this.exportWithTemplate = this.exportWithTemplate.bind(this);
  }

  /**
   * Create a new export template
   * @param {Object} template - Template configuration
   * @returns {Promise<Object>} - The created template with ID
   */
  async createTemplate(template) {
    if (!template || !template.name || !template.format) {
      throw new Error('Template must have at least name and format properties');
    }
    
    // Validate format
    if (!this.config.supportedFormats.includes(template.format)) {
      throw new Error(`Unsupported format: ${template.format}. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }
    
    // Generate unique ID
    const templateId = `template_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create full template object with metadata
    const newTemplate = {
      id: templateId,
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    // Store template
    this.templates.set(templateId, newTemplate);
    
    // Enforce maximum templates
    this._enforceMaxTemplates();
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateCreated', newTemplate);
    
    return newTemplate;
  }

  /**
   * Update an existing template
   * @param {string} templateId - ID of the template to update
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} - The updated template
   */
  async updateTemplate(templateId, updates) {
    // Check if template exists
    if (!this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Get existing template
    const existingTemplate = this.templates.get(templateId);
    
    // Create updated template
    const updatedTemplate = {
      ...existingTemplate,
      ...updates,
      id: templateId, // Ensure ID is not changed
      updatedAt: new Date().toISOString()
    };
    
    // Validate format if it's being updated
    if (updates.format && !this.config.supportedFormats.includes(updates.format)) {
      throw new Error(`Unsupported format: ${updates.format}. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }
    
    // Update template
    this.templates.set(templateId, updatedTemplate);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateUpdated', updatedTemplate);
    
    return updatedTemplate;
  }

  /**
   * Delete a template
   * @param {string} templateId - ID of the template to delete
   * @returns {Promise<boolean>} - True if template was deleted, false if not found
   */
  async deleteTemplate(templateId) {
    // Check if template exists
    if (!this.templates.has(templateId)) {
      return false;
    }
    
    // Store template for event
    const deletedTemplate = this.templates.get(templateId);
    
    // Delete template
    this.templates.delete(templateId);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateDeleted', deletedTemplate);
    
    return true;
  }

  /**
   * Get a template by ID
   * @param {string} templateId - ID of the template to get
   * @returns {Object|null} - The template or null if not found
   */
  getTemplate(templateId) {
    return this.templates.has(templateId) 
      ? { ...this.templates.get(templateId) }
      : null;
  }

  /**
   * Get all templates, optionally filtered by format
   * @param {string|null} format - Format to filter by, or null for all
   * @returns {Array<Object>} - Array of templates
   */
  getAllTemplates(format = null) {
    let templates = Array.from(this.templates.values());
    
    // Filter by format if specified
    if (format) {
      templates = templates.filter(t => t.format === format);
    }
    
    // Sort by updated date (newest first)
    templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return templates;
  }

  /**
   * Export data using a template
   * @param {string} templateId - ID of the template to use
   * @param {*} data - Data to export
   * @param {Object} options - Additional export options
   * @returns {Promise<*>} - The export result
   */
  async exportWithTemplate(templateId, data, options = {}) {
    // Check if template exists
    if (!this.templateId && !this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Get template
    const template = this.templates.get(templateId);
    
    // Update usage count
    template.usageCount += 1;
    template.lastUsed = new Date().toISOString();
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateUsed', { 
      templateId,
      template,
      dataSize: Array.isArray(data) ? data.length : 1
    });
    
    // Perform export
    return await this._performExport(template, data, options);
  }

  /**
   * Register a custom exporter for a format
   * @param {string} format - Format to register exporter for
   * @param {Function} exporterFn - Exporter function
   */
  registerExporter(format, exporterFn) {
    if (typeof exporterFn !== 'function') {
      throw new Error('Exporter must be a function');
    }
    
    // Add to supported formats if not already included
    if (!this.config.supportedFormats.includes(format)) {
      this.config.supportedFormats.push(format);
    }
    
    // Register exporter
    this.config.defaultExporters[format] = exporterFn;
    
    // Emit event
    this._emitEvent('exporterRegistered', { format });
  }

  /**
   * Get supported export formats
   * @returns {Array<string>} - Array of supported format strings
   */
  getSupportedFormats() {
    return [...this.config.supportedFormats];
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove the listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // Return a function to remove the listener
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} - True if listener was removed, false if not found
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      return false;
    }
    
    return this.eventListeners.get(event).delete(callback);
  }

  /**
   * Perform an export using a template
   * @param {Object} template - Template to use
   * @param {*} data - Data to export
   * @param {Object} options - Additional export options
   * @returns {Promise<*>} - The export result
   * @private
   */
  async _performExport(template, data, options = {}) {
    const format = template.format;
    
    // Get exporter for this format
    let exporter = this.config.defaultExporters[format];
    
    // If no exporter is registered, try to get a default one
    if (!exporter) {
      exporter = await this._getDefaultExporter(format);
    }
    
    if (!exporter) {
      throw new Error(`No exporter available for format: ${format}`);
    }
    
    // Merge template options with provided options
    const exportOptions = {
      ...template.options,
      ...options,
      format,
      templateId: template.id,
      templateName: template.name
    };
    
    // Perform the export
    try {
      const result = await exporter(data, exportOptions);
      
      // Emit success event
      this._emitEvent('exportSuccess', {
        templateId: template.id,
        format,
        dataSize: Array.isArray(data) ? data.length : 1
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this._emitEvent('exportError', {
        templateId: template.id,
        format,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get a default exporter for a format
   * @param {string} format - Format to get exporter for
   * @returns {Promise<Function|null>} - The exporter function or null if not available
   * @private
   */
  async _getDefaultExporter(format) {
    switch (format) {
      case 'xlsx':
        // Load XLSX exporter if available
        if (window.ExcelJS) {
          return this._xlsxExporter;
        }
        break;
        
      case 'csv':
        // Simple CSV exporter is always available
        return this._csvExporter;
        
      case 'json':
        // JSON exporter is always available
        return this._jsonExporter;
        
      case 'pdf':
        // Check if PDF generation library is available
        if (window.jsPDF) {
          return this._pdfExporter;
        }
        break;
        
      case 'png':
        // Check if HTML2Canvas is available
        if (window.html2canvas) {
          return this._pngExporter;
        }
        break;
    }
    
    return null;
  }

  /**
   * CSV exporter function
   * @param {Array<Object>} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} - CSV string
   * @private
   */
  async _csvExporter(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }
    
    // Get column headers from first item or options
    const headers = options.headers || Object.keys(data[0] || {});
    
    // Generate CSV header row
    let csv = headers.map(header => {
      // Quote headers with commas or quotes
      const needsQuotes = header.includes(',') || header.includes('"');
      return needsQuotes ? `"${header.replace(/"/g, '""')}"` : header;
    }).join(',') + '\n';
    
    // Generate CSV data rows
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        const strValue = value === null || value === undefined ? '' : String(value);
        
        // Quote values with commas or quotes
        const needsQuotes = strValue.includes(',') || strValue.includes('"');
        return needsQuotes ? `"${strValue.replace(/"/g, '""')}"` : strValue;
      }).join(',');
      
      csv += row + '\n';
    }
    
    // Handle downloading if requested
    if (options.download) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `export_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    return csv;
  }

  /**
   * JSON exporter function
   * @param {*} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} - JSON string
   * @private
   */
  async _jsonExporter(data, options = {}) {
    const jsonString = JSON.stringify(data, null, options.indent || 2);
    
    // Handle downloading if requested
    if (options.download) {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `export_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    return jsonString;
  }

  /**
   * Load templates from storage
   * @private
   */
  _loadFromStorage() {
    try {
      let savedTemplates = null;
      
      // Try to load from UserPreferences if available
      if (this.config.userPreferences) {
        savedTemplates = this.config.userPreferences.getPreference('exportTemplates');
      }
      
      // Fall back to localStorage if enabled and templates not found in UserPreferences
      if (!savedTemplates && this.config.localStorage) {
        const storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          savedTemplates = JSON.parse(storedData);
        }
      }
      
      // Initialize templates from loaded data
      if (savedTemplates) {
        this.templates.clear();
        
        // Process saved data
        if (Array.isArray(savedTemplates)) {
          // Handle array format
          for (const template of savedTemplates) {
            if (template && template.id) {
              this.templates.set(template.id, template);
            }
          }
        } else if (typeof savedTemplates === 'object') {
          // Handle object format with IDs as keys
          for (const [id, template] of Object.entries(savedTemplates)) {
            if (template) {
              this.templates.set(id, { ...template, id });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading export templates from storage:', error);
      // Initialize with empty data on error
      this.templates.clear();
    }
  }

  /**
   * Save templates to storage
   * @private
   * @returns {Promise<void>}
   */
  async _saveToStorage() {
    try {
      // Convert Map to object for storage
      const dataToSave = {};
      for (const [id, template] of this.templates.entries()) {
        dataToSave[id] = template;
      }
      
      // Save to UserPreferences if available
      if (this.config.userPreferences) {
        await this.config.userPreferences.setPreference('exportTemplates', dataToSave);
      }
      
      // Also save to localStorage if enabled
      if (this.config.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving export templates to storage:', error);
      // Emit error event
      this._emitEvent('error', { message: 'Failed to save export templates', error });
    }
  }

  /**
   * Enforce maximum templates
   * @private
   */
  _enforceMaxTemplates() {
    // Check if over limit
    if (this.templates.size <= this.config.maxTemplates) {
      return;
    }
    
    // Get all templates as array
    const templates = Array.from(this.templates.values());
    
    // Sort by last used date (oldest first)
    templates.sort((a, b) => {
      // Prioritize by usage count first (least used first)
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      
      // Then by last used date
      const aDate = a.lastUsed ? new Date(a.lastUsed) : new Date(a.createdAt);
      const bDate = b.lastUsed ? new Date(b.lastUsed) : new Date(b.createdAt);
      return aDate - bDate;
    });
    
    // Remove oldest templates until under limit
    const excess = this.templates.size - this.config.maxTemplates;
    const templatesToRemove = templates.slice(0, excess);
    
    // Remove each template
    for (const template of templatesToRemove) {
      this.templates.delete(template.id);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _emitEvent(event, data = null) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    for (const callback of this.eventListeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    }
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportTemplates;
} else {
  window.ExportTemplates = ExportTemplates;
}
