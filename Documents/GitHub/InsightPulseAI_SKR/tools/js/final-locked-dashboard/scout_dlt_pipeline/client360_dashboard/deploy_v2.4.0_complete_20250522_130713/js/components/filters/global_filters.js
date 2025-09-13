/**
 * @file global_filters.js
 * @description Global Filter System for Client360 Dashboard (PRD Section 6.1)
 * @version v2.4.0
 */

class GlobalFilters {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.filters = {
      dateRange: { start: null, end: null },
      organization: null,
      region: null,
      category: null,
      channel: null,
      tags: []
    };
    
    this.filterOptions = {
      organizations: ['All Brands', 'Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G'],
      regions: ['All Regions', 'NCR', 'Luzon', 'Visayas', 'Mindanao', 'Metro Manila', 'Cebu', 'Davao'],
      categories: ['All Categories', 'Beverages', 'Snacks', 'Personal Care', 'Household', 'Health & Wellness'],
      channels: ['All Channels', 'Sari-Sari Store', 'Convenience Store', 'Supermarket', 'Online'],
      tags: ['Premium', 'Value', 'New Launch', 'Seasonal', 'Promotional', 'Local Favorite']
    };
    
    this.callbacks = [];
    this.init();
  }

  init() {
    this.createFilterUI();
    this.attachEventListeners();
    this.setDefaultFilters();
  }

  createFilterUI() {
    const filterContainer = document.getElementById('global-filters') || this.createFilterContainer();
    
    filterContainer.innerHTML = `
      <div class="filter-bar">
        <div class="filter-section">
          <label class="filter-label">Date Range</label>
          <div class="date-range-picker">
            <input type="date" id="filter-date-start" class="filter-input date-input">
            <span class="date-separator">to</span>
            <input type="date" id="filter-date-end" class="filter-input date-input">
          </div>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Organization</label>
          <select id="filter-organization" class="filter-input filter-select">
            ${this.renderOptions(this.filterOptions.organizations)}
          </select>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Region</label>
          <select id="filter-region" class="filter-input filter-select">
            ${this.renderOptions(this.filterOptions.regions)}
          </select>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Category</label>
          <select id="filter-category" class="filter-input filter-select">
            ${this.renderOptions(this.filterOptions.categories)}
          </select>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Channel</label>
          <select id="filter-channel" class="filter-input filter-select">
            ${this.renderOptions(this.filterOptions.channels)}
          </select>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Tags</label>
          <div class="tag-filter-container">
            ${this.renderTagFilters()}
          </div>
        </div>
        
        <div class="filter-actions">
          <button id="filter-apply" class="btn btn-primary">Apply Filters</button>
          <button id="filter-reset" class="btn btn-secondary">Reset</button>
          <button id="filter-save" class="btn btn-outline">Save Preset</button>
        </div>
        
        <div class="filter-status">
          <span id="filter-active-count" class="active-filters-count">0 filters active</span>
          <div class="data-freshness">
            <span class="freshness-indicator">●</span>
            <span id="last-updated">Last updated: <span class="timestamp">--</span></span>
          </div>
        </div>
      </div>
    `;
  }

  createFilterContainer() {
    const container = document.createElement('div');
    container.id = 'global-filters';
    container.className = 'global-filter-container';
    
    // Find the best insertion point
    const dashboard = document.querySelector('.dashboard-container');
    const header = document.querySelector('.dashboard-header');
    
    if (header) {
      header.after(container);
    } else if (dashboard) {
      dashboard.prepend(container);
    } else {
      document.body.prepend(container);
    }
    
    return container;
  }

  renderOptions(options) {
    return options.map(option => 
      `<option value="${option.toLowerCase().replace(/\s+/g, '-')}">${option}</option>`
    ).join('');
  }

  renderTagFilters() {
    return this.filterOptions.tags.map(tag => `
      <label class="tag-filter-item">
        <input type="checkbox" value="${tag.toLowerCase().replace(/\s+/g, '-')}" class="tag-checkbox">
        <span class="tag-label">${tag}</span>
      </label>
    `).join('');
  }

  attachEventListeners() {
    // Date range inputs
    document.getElementById('filter-date-start')?.addEventListener('change', (e) => {
      this.filters.dateRange.start = e.target.value;
      this.updateActiveCount();
    });
    
    document.getElementById('filter-date-end')?.addEventListener('change', (e) => {
      this.filters.dateRange.end = e.target.value;
      this.updateActiveCount();
    });

    // Select filters
    ['organization', 'region', 'category', 'channel'].forEach(filterType => {
      document.getElementById(`filter-${filterType}`)?.addEventListener('change', (e) => {
        this.filters[filterType] = e.target.value === 'all-brands' || e.target.value === 'all-regions' || 
                                   e.target.value === 'all-categories' || e.target.value === 'all-channels' 
                                   ? null : e.target.value;
        this.updateActiveCount();
      });
    });

    // Tag checkboxes
    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.tags.push(e.target.value);
        } else {
          this.filters.tags = this.filters.tags.filter(tag => tag !== e.target.value);
        }
        this.updateActiveCount();
      });
    });

    // Action buttons
    document.getElementById('filter-apply')?.addEventListener('click', () => {
      this.applyFilters();
    });
    
    document.getElementById('filter-reset')?.addEventListener('click', () => {
      this.resetFilters();
    });
    
    document.getElementById('filter-save')?.addEventListener('click', () => {
      this.saveFilterPreset();
    });
  }

  setDefaultFilters() {
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startInput = document.getElementById('filter-date-start');
    const endInput = document.getElementById('filter-date-end');
    
    if (startInput && endInput) {
      startInput.value = startDate.toISOString().split('T')[0];
      endInput.value = endDate.toISOString().split('T')[0];
      this.filters.dateRange.start = startInput.value;
      this.filters.dateRange.end = endInput.value;
    }
    
    this.updateActiveCount();
    this.updateDataFreshness();
  }

  applyFilters() {
    // Validate date range
    if (this.filters.dateRange.start && this.filters.dateRange.end) {
      if (new Date(this.filters.dateRange.start) > new Date(this.filters.dateRange.end)) {
        this.showError('Start date cannot be later than end date');
        return;
      }
    }

    // Show loading state
    this.showLoadingState();
    
    // Apply filters to dashboard
    this.notifyFilterChange();
    
    // Update UI
    this.updateDataFreshness();
    this.saveFiltersToStorage();
    
    // Hide loading state
    setTimeout(() => {
      this.hideLoadingState();
      this.showSuccess('Filters applied successfully');
    }, 1000);
  }

  resetFilters() {
    this.filters = {
      dateRange: { start: null, end: null },
      organization: null,
      region: null,
      category: null,
      channel: null,
      tags: []
    };

    // Reset UI
    document.getElementById('filter-date-start').value = '';
    document.getElementById('filter-date-end').value = '';
    document.getElementById('filter-organization').value = 'all-brands';
    document.getElementById('filter-region').value = 'all-regions';
    document.getElementById('filter-category').value = 'all-categories';
    document.getElementById('filter-channel').value = 'all-channels';
    
    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });

    this.updateActiveCount();
    this.setDefaultFilters();
    this.notifyFilterChange();
  }

  updateActiveCount() {
    let activeCount = 0;
    
    if (this.filters.dateRange.start || this.filters.dateRange.end) activeCount++;
    if (this.filters.organization) activeCount++;
    if (this.filters.region) activeCount++;
    if (this.filters.category) activeCount++;
    if (this.filters.channel) activeCount++;
    if (this.filters.tags.length > 0) activeCount++;
    
    const countElement = document.getElementById('filter-active-count');
    if (countElement) {
      countElement.textContent = `${activeCount} filter${activeCount !== 1 ? 's' : ''} active`;
      countElement.className = `active-filters-count ${activeCount > 0 ? 'has-filters' : ''}`;
    }
  }

  updateDataFreshness() {
    const timestampElement = document.querySelector('.timestamp');
    if (timestampElement) {
      timestampElement.textContent = new Date().toLocaleString();
    }
    
    const indicator = document.querySelector('.freshness-indicator');
    if (indicator) {
      indicator.className = 'freshness-indicator fresh';
      setTimeout(() => {
        indicator.className = 'freshness-indicator';
      }, 3000);
    }
  }

  notifyFilterChange() {
    // Notify dashboard components
    if (this.dashboard && typeof this.dashboard.refreshData === 'function') {
      this.dashboard.refreshData(this.getActiveFilters());
    }
    
    // Notify registered callbacks
    this.callbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback(this.getActiveFilters());
      }
    });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('filtersChanged', {
      detail: this.getActiveFilters()
    }));
  }

  getActiveFilters() {
    return {
      ...this.filters,
      isActive: this.hasActiveFilters()
    };
  }

  hasActiveFilters() {
    return !!(
      this.filters.dateRange.start || 
      this.filters.dateRange.end || 
      this.filters.organization || 
      this.filters.region || 
      this.filters.category || 
      this.filters.channel || 
      this.filters.tags.length > 0
    );
  }

  onFilterChange(callback) {
    this.callbacks.push(callback);
  }

  saveFilterPreset() {
    const presetName = prompt('Enter a name for this filter preset:');
    if (presetName) {
      const presets = this.getFilterPresets();
      presets[presetName] = { ...this.filters };
      localStorage.setItem('client360_filter_presets', JSON.stringify(presets));
      this.showSuccess(`Filter preset "${presetName}" saved`);
    }
  }

  getFilterPresets() {
    try {
      return JSON.parse(localStorage.getItem('client360_filter_presets') || '{}');
    } catch (e) {
      return {};
    }
  }

  saveFiltersToStorage() {
    localStorage.setItem('client360_current_filters', JSON.stringify(this.filters));
  }

  loadFiltersFromStorage() {
    try {
      const saved = localStorage.getItem('client360_current_filters');
      if (saved) {
        this.filters = { ...this.filters, ...JSON.parse(saved) };
        this.applyStoredFiltersToUI();
      }
    } catch (e) {
      console.warn('Could not load saved filters:', e);
    }
  }

  applyStoredFiltersToUI() {
    if (this.filters.dateRange.start) {
      document.getElementById('filter-date-start').value = this.filters.dateRange.start;
    }
    if (this.filters.dateRange.end) {
      document.getElementById('filter-date-end').value = this.filters.dateRange.end;
    }
    if (this.filters.organization) {
      document.getElementById('filter-organization').value = this.filters.organization;
    }
    if (this.filters.region) {
      document.getElementById('filter-region').value = this.filters.region;
    }
    if (this.filters.category) {
      document.getElementById('filter-category').value = this.filters.category;
    }
    if (this.filters.channel) {
      document.getElementById('filter-channel').value = this.filters.channel;
    }
    
    this.filters.tags.forEach(tag => {
      const checkbox = document.querySelector(`.tag-checkbox[value="${tag}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    this.updateActiveCount();
  }

  showLoadingState() {
    document.getElementById('filter-apply').innerHTML = '⟳ Applying...';
    document.getElementById('filter-apply').disabled = true;
  }

  hideLoadingState() {
    document.getElementById('filter-apply').innerHTML = 'Apply Filters';
    document.getElementById('filter-apply').disabled = false;
  }

  showError(message) {
    console.error('Filter Error:', message);
    // Could integrate with toast notification system
  }

  showSuccess(message) {
    console.log('Filter Success:', message);
    // Could integrate with toast notification system
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.GlobalFilters = GlobalFilters;
}

export default GlobalFilters;