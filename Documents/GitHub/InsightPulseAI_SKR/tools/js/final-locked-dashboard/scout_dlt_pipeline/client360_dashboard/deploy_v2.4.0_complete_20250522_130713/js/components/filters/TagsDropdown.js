/**
 * TagsDropdown Component
 * Multi-select dropdown for filtering by tags
 * v2.4.0 - PRD Wireframe Implementation
 */

class TagsDropdown {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      placeholder: 'Select tags...',
      maxVisible: 3,
      searchable: true,
      ...options
    };
    
    this.selectedTags = new Set();
    this.availableTags = [];
    this.loadingTags = false;
    
    this.onChangeCallback = null;
    this.isOpen = false;
    
    this.init();
  }
  
  async init() {
    await this.loadTags();
    this.render();
    this.bindEvents();
  }
  
  async loadTags() {
    if (this.loadingTags) return;
    
    this.loadingTags = true;
    try {
      // Use simulation API client if available
      if (window.simApiClient && window.simApiClient.isSimulationMode()) {
        const data = await window.simApiClient.getTags();
        this.availableTags = data;
      } else {
        // Fallback to API call
        const response = await fetch('/api/tags');
        const data = await response.json();
        this.availableTags = data.tags || [];
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Fallback tags for demo
      this.availableTags = [
        { id: 'high-performance', label: 'High Performance', color: '#28a745', count: 67 },
        { id: 'trending', label: 'Trending', color: '#ffc107', count: 234 },
        { id: 'seasonal', label: 'Seasonal', color: '#17a2b8', count: 89 },
        { id: 'premium', label: 'Premium', color: '#6f42c1', count: 45 }
      ];
    } finally {
      this.loadingTags = false;
    }
  }
  
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`TagsDropdown: Container with id '${this.containerId}' not found`);
      return;
    }
    
    container.innerHTML = `
      <div class="tags-dropdown" role="combobox" aria-expanded="false" aria-haspopup="listbox">
        <div class="tags-dropdown-trigger" tabindex="0" aria-label="Tags filter dropdown">
          <div class="selected-tags">
            <span class="placeholder">${this.options.placeholder}</span>
          </div>
          <div class="dropdown-arrow">
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        
        <div class="tags-dropdown-menu" style="display: none;" role="listbox">
          ${this.options.searchable ? `
            <div class="tags-search">
              <input type="text" placeholder="Search tags..." class="tags-search-input" aria-label="Search tags">
              <i class="fas fa-search"></i>
            </div>
          ` : ''}
          
          <div class="tags-list" role="group" aria-label="Available tags">
            ${this.renderTagsList()}
          </div>
          
          <div class="tags-actions">
            <button class="btn-clear-all" type="button">Clear All</button>
            <button class="btn-apply" type="button">Apply Filters</button>
          </div>
        </div>
      </div>
    `;
    
    this.addStyles();
  }
  
  renderTagsList() {
    if (this.availableTags.length === 0) {
      return '<div class="tag-item-loading">Loading tags...</div>';
    }
    
    return this.availableTags.map(tag => `
      <div class="tag-item" data-tag-id="${tag.id}" role="option" tabindex="0" aria-selected="false">
        <div class="tag-checkbox">
          <input type="checkbox" id="tag-${tag.id}" value="${tag.id}">
          <label for="tag-${tag.id}"></label>
        </div>
        <div class="tag-info">
          <span class="tag-label">${tag.label}</span>
          ${tag.count ? `<span class="tag-count">(${tag.count})</span>` : ''}
          <span class="tag-color" style="background-color: ${tag.color}"></span>
        </div>
      </div>
    `).join('');
  }
  
  addStyles() {
    const styleId = 'tags-dropdown-styles';
    if (document.getElementById(styleId)) return;
    
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .tags-dropdown {
        position: relative;
        display: inline-block;
        min-width: 200px;
      }
      
      .tags-dropdown-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;
        min-height: 38px;
      }
      
      .tags-dropdown-trigger:hover,
      .tags-dropdown-trigger:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 103, 177, 0.1);
        outline: none;
      }
      
      .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        flex: 1;
      }
      
      .selected-tags .placeholder {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
      
      .selected-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: var(--primary-color);
        color: white;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
      }
      
      .selected-tag .remove-tag {
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      
      .selected-tag .remove-tag:hover {
        opacity: 1;
      }
      
      .dropdown-arrow {
        color: var(--text-secondary);
        transition: transform 0.2s;
      }
      
      .tags-dropdown[aria-expanded="true"] .dropdown-arrow {
        transform: rotate(180deg);
      }
      
      .tags-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-height: 300px;
        overflow: hidden;
      }
      
      .tags-search {
        position: relative;
        padding: 0.75rem;
        border-bottom: 1px solid var(--border-color);
      }
      
      .tags-search-input {
        width: 100%;
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        font-size: 0.875rem;
        outline: none;
      }
      
      .tags-search-input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 103, 177, 0.1);
      }
      
      .tags-search i {
        position: absolute;
        right: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
      }
      
      .tags-list {
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem 0;
      }
      
      .tag-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .tag-item:hover,
      .tag-item:focus {
        background-color: var(--background-light);
        outline: none;
      }
      
      .tag-item[aria-selected="true"] {
        background-color: rgba(0, 103, 177, 0.1);
      }
      
      .tag-checkbox {
        position: relative;
      }
      
      .tag-checkbox input[type="checkbox"] {
        appearance: none;
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color);
        border-radius: 2px;
        position: relative;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .tag-checkbox input[type="checkbox"]:checked {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      .tag-checkbox input[type="checkbox"]:checked::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: white;
        font-size: 10px;
        font-weight: bold;
      }
      
      .tag-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
      }
      
      .tag-label {
        font-size: 0.875rem;
        color: var(--text-primary);
      }
      
      .tag-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .tags-actions {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        border-top: 1px solid var(--border-color);
        background-color: var(--background-light);
      }
      
      .btn-clear-all,
      .btn-apply {
        padding: 0.25rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        background: white;
        color: var(--text-primary);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-apply {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
      
      .btn-clear-all:hover {
        background-color: var(--background-light);
      }
      
      .btn-apply:hover {
        background-color: #004d8c;
      }
      
      /* Focus styles for accessibility */
      .tags-dropdown-trigger:focus,
      .tag-item:focus,
      .btn-clear-all:focus,
      .btn-apply:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  bindEvents() {
    const container = document.getElementById(this.containerId);
    const trigger = container.querySelector('.tags-dropdown-trigger');
    const menu = container.querySelector('.tags-dropdown-menu');
    const searchInput = container.querySelector('.tags-search-input');
    const clearBtn = container.querySelector('.btn-clear-all');
    const applyBtn = container.querySelector('.btn-apply');
    
    // Toggle dropdown
    trigger.addEventListener('click', () => this.toggle());
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    // Tag selection
    container.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.handleTagToggle(e.target.value, e.target.checked);
      }
    });
    
    // Tag item click
    container.addEventListener('click', (e) => {
      const tagItem = e.target.closest('.tag-item');
      if (tagItem) {
        const checkbox = tagItem.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.handleTagToggle(checkbox.value, checkbox.checked);
      }
    });
    
    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }
    
    // Action buttons
    clearBtn.addEventListener('click', () => this.clearAll());
    applyBtn.addEventListener('click', () => this.applyFilters());
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        this.close();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    const container = document.getElementById(this.containerId);
    const dropdown = container.querySelector('.tags-dropdown');
    const menu = container.querySelector('.tags-dropdown-menu');
    
    this.isOpen = true;
    dropdown.setAttribute('aria-expanded', 'true');
    menu.style.display = 'block';
    
    // Focus search input if available
    const searchInput = container.querySelector('.tags-search-input');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }
  
  close() {
    const container = document.getElementById(this.containerId);
    const dropdown = container.querySelector('.tags-dropdown');
    const menu = container.querySelector('.tags-dropdown-menu');
    
    this.isOpen = false;
    dropdown.setAttribute('aria-expanded', 'false');
    menu.style.display = 'none';
  }
  
  handleTagToggle(tagId, isSelected) {
    if (isSelected) {
      this.selectedTags.add(tagId);
    } else {
      this.selectedTags.delete(tagId);
    }
    
    this.updateSelectedDisplay();
    this.updateTagItemSelection();
  }
  
  updateSelectedDisplay() {
    const container = document.getElementById(this.containerId);
    const selectedContainer = container.querySelector('.selected-tags');
    
    if (this.selectedTags.size === 0) {
      selectedContainer.innerHTML = `<span class="placeholder">${this.options.placeholder}</span>`;
      return;
    }
    
    const selectedTagsArray = Array.from(this.selectedTags);
    const visibleTags = selectedTagsArray.slice(0, this.options.maxVisible);
    const remainingCount = selectedTagsArray.length - visibleTags.length;
    
    let html = '';
    
    visibleTags.forEach(tagId => {
      const tag = this.availableTags.find(t => t.id === tagId);
      if (tag) {
        html += `
          <span class="selected-tag">
            ${tag.label}
            <i class="fas fa-times remove-tag" data-tag-id="${tagId}"></i>
          </span>
        `;
      }
    });
    
    if (remainingCount > 0) {
      html += `<span class="selected-tag">+${remainingCount} more</span>`;
    }
    
    selectedContainer.innerHTML = html;
    
    // Bind remove events
    selectedContainer.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagId = btn.dataset.tagId;
        this.removeTag(tagId);
      });
    });
  }
  
  updateTagItemSelection() {
    const container = document.getElementById(this.containerId);
    container.querySelectorAll('.tag-item').forEach(item => {
      const tagId = item.dataset.tagId;
      const checkbox = item.querySelector('input[type="checkbox"]');
      const isSelected = this.selectedTags.has(tagId);
      
      checkbox.checked = isSelected;
      item.setAttribute('aria-selected', isSelected.toString());
    });
  }
  
  removeTag(tagId) {
    this.selectedTags.delete(tagId);
    this.updateSelectedDisplay();
    this.updateTagItemSelection();
  }
  
  clearAll() {
    this.selectedTags.clear();
    this.updateSelectedDisplay();
    this.updateTagItemSelection();
  }
  
  applyFilters() {
    if (this.onChangeCallback) {
      this.onChangeCallback(Array.from(this.selectedTags));
    }
    this.close();
    
    // Show notification
    this.showFilterNotification();
  }
  
  handleSearch(query) {
    const container = document.getElementById(this.containerId);
    const tagItems = container.querySelectorAll('.tag-item');
    
    tagItems.forEach(item => {
      const label = item.querySelector('.tag-label').textContent.toLowerCase();
      const matches = label.includes(query.toLowerCase());
      item.style.display = matches ? 'flex' : 'none';
    });
  }
  
  showFilterNotification() {
    const count = this.selectedTags.size;
    const message = count === 0 
      ? 'All tag filters cleared' 
      : `Applied ${count} tag filter${count > 1 ? 's' : ''}`;
    
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'filter-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      font-size: 0.875rem;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add slide animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }
  
  // Public API
  onChange(callback) {
    this.onChangeCallback = callback;
  }
  
  getSelectedTags() {
    return Array.from(this.selectedTags);
  }
  
  setSelectedTags(tagIds) {
    this.selectedTags = new Set(tagIds);
    this.updateSelectedDisplay();
    this.updateTagItemSelection();
  }
  
  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
    
    const styles = document.getElementById('tags-dropdown-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Export for use
window.TagsDropdown = TagsDropdown;