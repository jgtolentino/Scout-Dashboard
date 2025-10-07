/**
 * ExportTemplates - Manages template configurations for exporting dashboard data
 * Part of the User Personalization Framework for Client360 Dashboard v2.4.0
 */
class ExportTemplates {
  /**
   * Creates a new ExportTemplates instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      storageKey: 'client360_export_templates',
      maxTemplates: 20,                      // Maximum number of templates to store
      syncWithServer: false,                 // Whether to sync with server
      serverEndpoint: '/api/export-templates',
      userPreferences: null,                 // UserPreferences instance for integration
      defaultFormats: ['xlsx', 'csv', 'pdf', 'png', 'pptx', 'json'],
      // Default template types
      templateTypes: {
        REPORT: 'report',          // Full formatted report
        DATA_EXPORT: 'data',       // Raw data export
        VISUALIZATION: 'viz',      // Single visualization export
        DASHBOARD: 'dashboard',    // Full dashboard export
        CUSTOM: 'custom'           // User-defined custom export
      },
      ...config
    };
    
    // Core properties
    this.templates = new Map();        // Map of export templates by id
    this.eventHandlers = new Map();
    this.userPreferences = this.config.userPreferences;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the export templates system
   */
  init() {
    this._loadFromStorage();
  }
  
  /**
   * Create a new export template
   * @param {Object} template - Template configuration
   * @param {string} template.name - User-friendly template name
   * @param {string} template.type - Template type (from templateTypes)
   * @param {string} template.format - Export format (xlsx, csv, pdf, etc.)
   * @param {Object} template.config - Template-specific configuration
   * @returns {string} - Generated template ID or null if failed
   */
  createTemplate(template) {
    if (!template || !template.name || !template.type || !template.format) {
      console.error('Invalid template format for export templates:', template);
      return null;
    }
    
    // Validate template type
    const validTypes = Object.values(this.config.templateTypes);
    if (!validTypes.includes(template.type)) {
      console.warn(`Unknown template type: ${template.type}`);
      // Continue anyway for forward compatibility
    }
    
    // Validate export format
    if (!this.config.defaultFormats.includes(template.format)) {
      console.warn(`Unknown export format: ${template.format}`);
      // Continue anyway for forward compatibility
    }
    
    // Generate unique ID
    const templateId = `template_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create complete template object
    const newTemplate = {
      id: templateId,
      name: template.name,
      type: template.type,
      format: template.format,
      config: template.config || {},
      created: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    };
    
    // Add to templates map
    this.templates.set(templateId, newTemplate);
    
    // Enforce max templates limit
    this._enforceMaxTemplates();
    
    // Save changes
    this._saveToStorage();
    
    // Trigger event
    this._triggerEvent('templateCreated', newTemplate);
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
    
    return templateId;
  }
  
  /**
   * Get a template by ID
   * @param {string} templateId - ID of the template to retrieve
   * @returns {Object|null} - The template or null if not found
   */
  getTemplate(templateId) {
    if (!templateId) {
      console.error('Template ID is required');
      return null;
    }
    
    if (!this.templates.has(templateId)) {
      console.warn(`Template ${templateId} not found`);
      return null;
    }
    
    return { ...this.templates.get(templateId) };
  }
  
  /**
   * Update an existing template
   * @param {string} templateId - ID of the template to update
   * @param {Object} updates - Properties to update
   * @returns {boolean} - Success status
   */
  updateTemplate(templateId, updates) {
    if (!templateId || !updates) {
      console.error('Both templateId and updates are required');
      return false;
    }
    
    if (!this.templates.has(templateId)) {
      console.warn(`Template ${templateId} not found`);
      return false;
    }
    
    const template = this.templates.get(templateId);
    
    // Prevent updating ID
    const { id, created, ...updatableFields } = updates;
    
    // Update template
    const updatedTemplate = {
      ...template,
      ...updatableFields,
      // Always preserve original values for these fields
      id: template.id,
      created: template.created
    };
    
    // Save updated template
    this.templates.set(templateId, updatedTemplate);
    
    // Save changes
    this._saveToStorage();
    
    // Trigger event
    this._triggerEvent('templateUpdated', updatedTemplate);
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
    
    return true;
  }
  
  /**
   * Delete a template
   * @param {string} templateId - ID of the template to delete
   * @returns {boolean} - Success status
   */
  deleteTemplate(templateId) {
    if (!templateId) {
      console.error('Template ID is required');
      return false;
    }
    
    if (!this.templates.has(templateId)) {
      console.warn(`Template ${templateId} not found`);
      return false;
    }
    
    // Get template before removal (for event)
    const template = this.templates.get(templateId);
    
    // Remove template
    this.templates.delete(templateId);
    
    // Save changes
    this._saveToStorage();
    
    // Trigger event
    this._triggerEvent('templateDeleted', template);
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
    
    return true;
  }
  
  /**
   * Get all available templates
   * @param {string} type - Optional filter by template type
   * @returns {Array} - Array of templates
   */
  getAllTemplates(type = null) {
    const templates = Array.from(this.templates.values());
    
    // Filter by type if specified
    if (type) {
      return templates.filter(template => template.type === type);
    }
    
    return templates;
  }
  
  /**
   * Record template usage
   * @param {string} templateId - ID of the template that was used
   * @returns {boolean} - Success status
   */
  recordTemplateUsage(templateId) {
    if (!templateId) {
      console.error('Template ID is required');
      return false;
    }
    
    if (!this.templates.has(templateId)) {
      console.warn(`Template ${templateId} not found`);
      return false;
    }
    
    const template = this.templates.get(templateId);
    
    // Update usage statistics
    const updatedTemplate = {
      ...template,
      lastUsed: new Date().toISOString(),
      usageCount: (template.usageCount || 0) + 1
    };
    
    // Save updated template
    this.templates.set(templateId, updatedTemplate);
    
    // Save changes
    this._saveToStorage();
    
    // No event or sync for usage updates to reduce overhead
    
    return true;
  }
  
  /**
   * Generate an export using a template
   * @param {string} templateId - ID of the template to use
   * @param {Object} data - Data to be exported
   * @param {Object} options - Additional export options
   * @returns {Promise<Object>} - Export result
   */
  async exportWithTemplate(templateId, data, options = {}) {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    if (!this.templates.has(templateId)) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const template = this.templates.get(templateId);
    
    try {
      // Record usage
      this.recordTemplateUsage(templateId);
      
      // Trigger export started event
      this._triggerEvent('exportStarted', { template, data, options });
      
      // Perform the export based on template type and format
      // This would call the appropriate export function based on the template
      const exportResult = await this._performExport(template, data, options);
      
      // Trigger export completed event
      this._triggerEvent('exportCompleted', { 
        template, 
        data, 
        options,
        result: exportResult
      });
      
      return exportResult;
    } catch (error) {
      console.error('Export failed:', error);
      
      // Trigger export error event
      this._triggerEvent('exportError', { 
        template, 
        data, 
        options,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Clone an existing template
   * @param {string} templateId - ID of the template to clone
   * @param {string} newName - Optional new name for the cloned template
   * @returns {string|null} - New template ID or null if failed
   */
  cloneTemplate(templateId, newName = null) {
    if (!templateId) {
      console.error('Template ID is required');
      return null;
    }
    
    if (!this.templates.has(templateId)) {
      console.warn(`Template ${templateId} not found`);
      return null;
    }
    
    const template = this.templates.get(templateId);
    
    // Create a new template based on the existing one
    const clonedTemplate = {
      ...template,
      name: newName || `${template.name} (Copy)`,
      created: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    };
    
    // Remove the existing ID so a new one will be generated
    delete clonedTemplate.id;
    
    // Use the createTemplate method to add the clone
    return this.createTemplate(clonedTemplate);
  }
  
  /**
   * Register event handler
   * @param {string} eventName - Event name to listen for
   * @param {Function} handler - Handler function
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
  }
  
  /**
   * Unregister event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Load stored data from localStorage or UserPreferences
   * @private
   */
  _loadFromStorage() {
    try {
      let storedData;
      
      // Try to load from UserPreferences if available
      if (this.userPreferences) {
        storedData = this.userPreferences.getPreference('exportTemplates');
      } else {
        // Fall back to localStorage
        storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          storedData = JSON.parse(storedData);
        }
      }
      
      if (storedData && Array.isArray(storedData)) {
        // Convert stored array to Map
        this.templates.clear();
        
        storedData.forEach(template => {
          if (template && template.id) {
            this.templates.set(template.id, template);
          }
        });
        
        this._triggerEvent('loaded');
      }
    } catch (error) {
      console.error('Error loading export templates from storage:', error);
      // Initialize with empty data on error
      this.templates.clear();
    }
  }
  
  /**
   * Save data to localStorage or UserPreferences
   * @private
   */
  _saveToStorage() {
    try {
      // Convert Map to array for storage
      const templatesArray = Array.from(this.templates.values());
      
      // Save to UserPreferences if available
      if (this.userPreferences) {
        this.userPreferences.setPreference('exportTemplates', templatesArray);
      } else {
        // Fall back to localStorage
        localStorage.setItem(this.config.storageKey, JSON.stringify(templatesArray));
      }
      
      this._triggerEvent('saved');
    } catch (error) {
      console.error('Error saving export templates to storage:', error);
    }
  }
  
  /**
   * Enforce maximum templates limit
   * @private
   */
  _enforceMaxTemplates() {
    if (this.templates.size <= this.config.maxTemplates) {
      return;
    }
    
    // Sort templates by last used (oldest first)
    const templatesArray = Array.from(this.templates.entries());
    
    templatesArray.sort(([, a], [, b]) => {
      // If never used, sort by creation date
      const aDate = a.lastUsed ? new Date(a.lastUsed) : new Date(a.created);
      const bDate = b.lastUsed ? new Date(b.lastUsed) : new Date(b.created);
      
      return aDate - bDate;
    });
    
    // Remove oldest templates beyond the limit
    const templatesToRemove = templatesArray.slice(0, templatesArray.length - this.config.maxTemplates);
    
    for (const [id] of templatesToRemove) {
      this.templates.delete(id);
    }
  }
  
  /**
   * Perform the actual export operation
   * @param {Object} template - The template to use
   * @param {Object} data - The data to export
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Export result
   * @private
   */
  async _performExport(template, data, options) {
    // This is a placeholder implementation
    // In a real application, this would dispatch to format-specific exporters
    
    const exporters = {
      xlsx: this._exportToExcel.bind(this),
      csv: this._exportToCsv.bind(this),
      pdf: this._exportToPdf.bind(this),
      png: this._exportToPng.bind(this),
      pptx: this._exportToPowerPoint.bind(this),
      json: this._exportToJson.bind(this)
    };
    
    // Check if we have an exporter for this format
    if (!exporters[template.format]) {
      throw new Error(`Unsupported export format: ${template.format}`);
    }
    
    // Call the appropriate exporter
    return exporters[template.format](template, data, options);
  }
  
  /**
   * Export to Excel format
   * @private
   */
  async _exportToExcel(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to Excel with template: ${template.name}`);
    
    // In a real implementation, this would use a library like SheetJS
    return {
      success: true,
      format: 'xlsx',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      // Additional result information
    };
  }
  
  /**
   * Export to CSV format
   * @private
   */
  async _exportToCsv(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to CSV with template: ${template.name}`);
    
    return {
      success: true,
      format: 'csv',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.csv`,
      // Additional result information
    };
  }
  
  /**
   * Export to PDF format
   * @private
   */
  async _exportToPdf(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to PDF with template: ${template.name}`);
    
    return {
      success: true,
      format: 'pdf',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.pdf`,
      // Additional result information
    };
  }
  
  /**
   * Export to PNG format
   * @private
   */
  async _exportToPng(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to PNG with template: ${template.name}`);
    
    return {
      success: true,
      format: 'png',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.png`,
      // Additional result information
    };
  }
  
  /**
   * Export to PowerPoint format
   * @private
   */
  async _exportToPowerPoint(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to PowerPoint with template: ${template.name}`);
    
    return {
      success: true,
      format: 'pptx',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.pptx`,
      // Additional result information
    };
  }
  
  /**
   * Export to JSON format
   * @private
   */
  async _exportToJson(template, data, options) {
    // Placeholder implementation
    console.log(`Exporting to JSON with template: ${template.name}`);
    
    return {
      success: true,
      format: 'json',
      fileName: `${template.name}_${new Date().toISOString().slice(0, 10)}.json`,
      data: JSON.stringify(data, null, 2),
      // Additional result information
    };
  }
  
  /**
   * Trigger an event to all registered handlers
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   * @private
   */
  _triggerEvent(eventName, data = null) {
    if (!this.eventHandlers.has(eventName)) return;
    
    for (const handler of this.eventHandlers.get(eventName)) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in export templates event handler for ${eventName}:`, error);
      }
    }
  }
  
  /**
   * Synchronize templates with server
   * @private
   */
  async _syncWithServer() {
    if (!this.config.syncWithServer) return;
    
    try {
      // Convert Map to array for API
      const templatesArray = Array.from(this.templates.values());
      
      // Send to server
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templatesArray)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get updated data from server
      const serverData = await response.json();
      
      // Update local data if server provided updates
      if (serverData && Array.isArray(serverData)) {
        // Replace local templates with server data
        this.templates.clear();
        
        serverData.forEach(template => {
          if (template && template.id) {
            this.templates.set(template.id, template);
          }
        });
        
        this._triggerEvent('synced', serverData);
      }
    } catch (error) {
      console.error('Error syncing export templates with server:', error);
      this._triggerEvent('syncError', error);
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportTemplates;
} else if (typeof window !== 'undefined') {
  window.ExportTemplates = ExportTemplates;
}