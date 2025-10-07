/**
 * Enhanced Tags Dropdown Component with JSON Data Integration
 * PRD Requirement: Multi-select tags filter with search capability
 */

class TagsDropdown {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      multiSelect: true,
      searchable: true,
      categorized: true,
      maxTags: 10,
      placeholder: 'Search and select tags...',
      ...options
    };
    
    this.tags = [];
    this.categories = [];
    this.selectedTags = [];
    this.isOpen = false;
    this.searchTerm = '';
    
    this.init();
  }

  async init() {
    await this.loadTagsData();
    this.render();
    this.attachEventListeners();
  }

  async loadTagsData() {
    try {
      const response = await fetch('./data/tags.json');
      const data = await response.json();
      this.tags = data.tags || [];
      this.categories = data.categories || [];
      console.log('✅ Tags data loaded:', this.tags.length, 'tags');
    } catch (error) {
      console.warn('Could not load tags data, using fallback:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.tags = [
      { id: 'fmcg', label: 'FMCG Products', category: 'industry', count: 847, color: '#0067b1' },
      { id: 'del-monte', label: 'Del Monte', category: 'brand', count: 189, color: '#228b22' },
      { id: 'oishi', label: 'Oishi', category: 'brand', count: 156, color: '#ff6b35' },
      { id: 'alaska', label: 'Alaska Milk', category: 'brand', count: 142, color: '#4a90e2' },
      { id: 'peerless', label: 'Peerless', category: 'brand', count: 98, color: '#7b68ee' },
      { id: 'ncr', label: 'National Capital Region', category: 'region', count: 324, color: '#ffd700' },
      { id: 'snacks', label: 'Snacks & Confectionery', category: 'category', count: 256, color: '#ff4500' }
    ];
    
    this.categories = [
      { id: 'brand', label: 'Brand', icon: 'fas fa-tag' },
      { id: 'region', label: 'Region', icon: 'fas fa-map-marker-alt' },
      { id: 'category', label: 'Category', icon: 'fas fa-boxes' }
    ];
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="tags-dropdown-container">
        <div class="tags-dropdown-header" id="tags-dropdown-header">
          <div class="selected-tags-display">
            ${this.renderSelectedTags()}
          </div>
          <div class="dropdown-search">
            <input 
              type="text" 
              class="tag-search-input" 
              placeholder="${this.options.placeholder}"
              id="tag-search-input"
            >
            <i class="fas fa-chevron-down dropdown-arrow" id="dropdown-arrow"></i>
          </div>
        </div>
        
        <div class="tags-dropdown-menu ${this.isOpen ? 'open' : ''}" id="tags-dropdown-menu">
          <div class="dropdown-content">
            ${this.renderTagCategories()}
          </div>
        </div>
      </div>
    `;

    this.updateDropdownState();
  }

  renderSelectedTags() {
    if (this.selectedTags.length === 0) {
      return '<span class="no-tags-placeholder">No tags selected</span>';
    }

    return this.selectedTags.map(tagId => {
      const tag = this.tags.find(t => t.id === tagId);
      if (!tag) return '';
      
      return `
        <span class="selected-tag" style="background-color: ${tag.color}15; border-color: ${tag.color}; color: ${tag.color};">
          ${tag.label}
          <i class="fas fa-times tag-remove" data-tag-id="${tag.id}"></i>
        </span>
      `;
    }).join('');
  }

  renderTagCategories() {
    if (!this.options.categorized) {
      return this.renderTagList(this.getFilteredTags());
    }

    return this.categories.map(category => {
      const categoryTags = this.getFilteredTags().filter(tag => tag.category === category.id);
      if (categoryTags.length === 0) return '';

      return `
        <div class="tag-category">
          <div class="category-header">
            <i class="${category.icon}"></i>
            <span class="category-label">${category.label}</span>
            <span class="category-count">(${categoryTags.length})</span>
          </div>
          <div class="category-tags">
            ${this.renderTagList(categoryTags)}
          </div>
        </div>
      `;
    }).join('');
  }

  renderTagList(tags) {
    return tags.map(tag => {
      const isSelected = this.selectedTags.includes(tag.id);
      return `
        <div class="tag-item ${isSelected ? 'selected' : ''}" data-tag-id="${tag.id}">
          <div class="tag-info">
            <span class="tag-color-indicator" style="background-color: ${tag.color};"></span>
            <span class="tag-label">${tag.label}</span>
            <span class="tag-count">${tag.count}</span>
          </div>
          <div class="tag-selection">
            ${isSelected ? '<i class="fas fa-check"></i>' : '<i class="far fa-square"></i>'}
          </div>
        </div>
      `;
    }).join('');
  }

  getFilteredTags() {
    if (!this.searchTerm) return this.tags;
    
    const searchLower = this.searchTerm.toLowerCase();
    return this.tags.filter(tag => 
      tag.label.toLowerCase().includes(searchLower) ||
      tag.category.toLowerCase().includes(searchLower)
    );
  }

  attachEventListeners() {
    // Header click to toggle dropdown
    const header = document.getElementById('tags-dropdown-header');
    if (header) {
      header.addEventListener('click', (e) => {
        if (!e.target.closest('.tag-remove') && !e.target.closest('.tag-search-input')) {
          this.toggleDropdown();
        }
      });
    }

    // Search input
    const searchInput = document.getElementById('tag-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.updateDropdownContent();
      });

      searchInput.addEventListener('focus', () => {
        this.openDropdown();
      });
    }

    // Tag selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.tag-item')) {
        const tagId = e.target.closest('.tag-item').dataset.tagId;
        this.toggleTag(tagId);
      }

      // Remove tag
      if (e.target.closest('.tag-remove')) {
        const tagId = e.target.closest('.tag-remove').dataset.tagId;
        this.removeTag(tagId);
      }

      // Close dropdown when clicking outside
      if (!e.target.closest('.tags-dropdown-container')) {
        this.closeDropdown();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
      }
    });
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen = true;
    this.updateDropdownState();
    
    // Focus search input
    setTimeout(() => {
      const searchInput = document.getElementById('tag-search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  }

  closeDropdown() {
    this.isOpen = false;
    this.searchTerm = '';
    this.updateDropdownState();
    
    // Clear search
    const searchInput = document.getElementById('tag-search-input');
    if (searchInput) searchInput.value = '';
  }

  updateDropdownState() {
    const menu = document.getElementById('tags-dropdown-menu');
    const arrow = document.getElementById('dropdown-arrow');
    
    if (menu) {
      menu.classList.toggle('open', this.isOpen);
    }
    
    if (arrow) {
      arrow.style.transform = this.isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    
    if (this.isOpen) {
      this.updateDropdownContent();
    }
  }

  updateDropdownContent() {
    const content = document.querySelector('.dropdown-content');
    if (content) {
      content.innerHTML = this.renderTagCategories();
    }
  }

  toggleTag(tagId) {
    const index = this.selectedTags.indexOf(tagId);
    
    if (index === -1) {
      // Add tag
      if (this.selectedTags.length < this.options.maxTags) {
        this.selectedTags.push(tagId);
      } else {
        this.showMaxTagsWarning();
        return;
      }
    } else {
      // Remove tag
      this.selectedTags.splice(index, 1);
    }
    
    this.updateDisplay();
    this.notifyChange();
  }

  removeTag(tagId) {
    const index = this.selectedTags.indexOf(tagId);
    if (index !== -1) {
      this.selectedTags.splice(index, 1);
      this.updateDisplay();
      this.notifyChange();
    }
  }

  updateDisplay() {
    // Update selected tags display
    const selectedDisplay = document.querySelector('.selected-tags-display');
    if (selectedDisplay) {
      selectedDisplay.innerHTML = this.renderSelectedTags();
    }
    
    // Update dropdown content to reflect selection state
    this.updateDropdownContent();
  }

  showMaxTagsWarning() {
    console.warn(`Maximum ${this.options.maxTags} tags allowed`);
    // Could show toast notification
  }

  notifyChange() {
    // Get selected tag objects
    const selectedTagObjects = this.selectedTags.map(tagId => 
      this.tags.find(tag => tag.id === tagId)
    ).filter(Boolean);

    // Dispatch custom event
    const event = new CustomEvent('tagsChanged', {
      detail: {
        selectedIds: this.selectedTags,
        selectedTags: selectedTagObjects,
        count: this.selectedTags.length
      }
    });

    document.dispatchEvent(event);
    
    // Console log for debugging
    console.log('📋 Tags selected:', selectedTagObjects.map(t => t.label));
  }

  // Public API methods
  getSelectedTags() {
    return this.selectedTags.map(tagId => 
      this.tags.find(tag => tag.id === tagId)
    ).filter(Boolean);
  }

  setSelectedTags(tagIds) {
    this.selectedTags = Array.isArray(tagIds) ? tagIds : [];
    this.updateDisplay();
    this.notifyChange();
  }

  clearAllTags() {
    this.selectedTags = [];
    this.updateDisplay();
    this.notifyChange();
  }

  addTag(tagId) {
    if (!this.selectedTags.includes(tagId)) {
      this.toggleTag(tagId);
    }
  }

  onTagsChange(callback) {
    document.addEventListener('tagsChanged', callback);
  }
}

// Add CSS styles for the component
const tagsDropdownStyles = `
<style>
.tags-dropdown-container {
  position: relative;
  width: 100%;
  min-width: 300px;
}

.tags-dropdown-header {
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-card);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.tags-dropdown-header:hover {
  border-color: var(--primary-color);
}

.selected-tags-display {
  padding: 0.5rem;
  min-height: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.no-tags-placeholder {
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.5rem;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.tag-remove:hover {
  opacity: 1;
}

.dropdown-search {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding: 0.5rem;
}

.tag-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
}

.dropdown-arrow {
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.tags-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  display: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tags-dropdown-menu.open {
  display: block;
}

.tag-category {
  border-bottom: 1px solid var(--border-color);
}

.tag-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background-light);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.category-count {
  color: var(--text-secondary);
  font-weight: normal;
}

.category-tags {
  padding: 0.25rem 0;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-item:hover {
  background-color: var(--background-light);
}

.tag-item.selected {
  background-color: rgba(0, 103, 177, 0.1);
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tag-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag-label {
  font-weight: 500;
  color: var(--text-primary);
}

.tag-count {
  color: var(--text-secondary);
  font-size: 0.75rem;
  background: var(--background-light);
  padding: 0.125rem 0.375rem;
  border-radius: 1rem;
}

.tag-selection {
  color: var(--primary-color);
}

.tag-item.selected .tag-selection {
  color: var(--success-color);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', tagsDropdownStyles);

// Export for use
if (typeof window !== 'undefined') {
  window.TagsDropdown = TagsDropdown;
}