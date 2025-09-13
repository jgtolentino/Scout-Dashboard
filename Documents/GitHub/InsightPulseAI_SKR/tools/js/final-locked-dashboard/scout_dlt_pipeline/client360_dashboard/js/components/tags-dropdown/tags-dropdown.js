/**
 * Tags Dropdown Component - PATCH 3: Tags dropdown implementation
 * Implements dynamic tag filtering with multi-select capabilities
 * 
 * PRD Sections Addressed:
 * - Section 6: Global Filter System (Tag-based filtering)
 * - Section 6.1.5: Advanced Filters (Tag management)
 * - Section 5: User Interface (Interactive filter components)
 * 
 * Namespace: PATCH3_TagsDropdown
 */

class PATCH3_TagsDropdown {
    constructor(container, options = {}) {
        this.namespace = 'PATCH3_TagsDropdown';
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        
        if (!this.container) {
            throw new Error(`${this.namespace}: Container not found`);
        }
        
        this.config = {
            placeholder: 'Select tags...',
            maxItems: 50,
            searchThreshold: 3,
            allowCustomTags: true,
            caseSensitive: false,
            separator: ',',
            closeOnSelect: false,
            showClearAll: true,
            showSelectAll: true,
            groupTags: true,
            ...options
        };
        
        this.tags = [];
        this.selectedTags = new Set();
        this.filteredTags = [];
        this.isOpen = false;
        this.searchQuery = '';
        this.listeners = new Set();
        
        this.tagCategories = {
            brands: { label: 'Brands', color: '#2196F3', icon: '🏷️' },
            categories: { label: 'Categories', color: '#4CAF50', icon: '📂' },
            locations: { label: 'Locations', color: '#FF9800', icon: '📍' },
            campaigns: { label: 'Campaigns', color: '#9C27B0', icon: '🎯' },
            segments: { label: 'Segments', color: '#F44336', icon: '👥' },
            products: { label: 'Products', color: '#00BCD4', icon: '📦' },
            channels: { label: 'Channels', color: '#8BC34A', icon: '📺' },
            custom: { label: 'Custom', color: '#607D8B', icon: '⭐' }
        };
        
        this.init();
    }

    init() {
        this.loadTags();
        this.createDropdownStructure();
        this.setupEventListeners();
        this.attachStyles();
        this.loadSavedSelection();
        
        console.log(`[${this.namespace}] Tags dropdown initialized`);
    }

    loadTags() {
        // Load from real data source or generate mock data
        this.tags = this.generateMockTags();
        this.filteredTags = [...this.tags];
    }

    generateMockTags() {
        return [
            // Brand tags
            { id: 'coca-cola', label: 'Coca-Cola', category: 'brands', count: 1250 },
            { id: 'pepsi', label: 'Pepsi', category: 'brands', count: 980 },
            { id: 'sprite', label: 'Sprite', category: 'brands', count: 720 },
            { id: 'fanta', label: 'Fanta', category: 'brands', count: 650 },
            { id: 'mountain-dew', label: 'Mountain Dew', category: 'brands', count: 540 },
            
            // Category tags
            { id: 'beverages', label: 'Beverages', category: 'categories', count: 3200 },
            { id: 'soft-drinks', label: 'Soft Drinks', category: 'categories', count: 2800 },
            { id: 'energy-drinks', label: 'Energy Drinks', category: 'categories', count: 890 },
            { id: 'water', label: 'Water', category: 'categories', count: 1100 },
            { id: 'juices', label: 'Juices', category: 'categories', count: 670 },
            
            // Location tags
            { id: 'metro-manila', label: 'Metro Manila', category: 'locations', count: 1800 },
            { id: 'cebu', label: 'Cebu', category: 'locations', count: 920 },
            { id: 'davao', label: 'Davao', category: 'locations', count: 780 },
            { id: 'baguio', label: 'Baguio', category: 'locations', count: 450 },
            { id: 'iloilo', label: 'Iloilo', category: 'locations', count: 380 },
            
            // Campaign tags
            { id: 'summer-campaign', label: 'Summer Campaign 2024', category: 'campaigns', count: 560 },
            { id: 'holiday-promo', label: 'Holiday Promo', category: 'campaigns', count: 890 },
            { id: 'back-to-school', label: 'Back to School', category: 'campaigns', count: 420 },
            { id: 'new-year-blast', label: 'New Year Blast', category: 'campaigns', count: 340 },
            
            // Segment tags
            { id: 'millennials', label: 'Millennials', category: 'segments', count: 1400 },
            { id: 'gen-z', label: 'Gen Z', category: 'segments', count: 1200 },
            { id: 'families', label: 'Families', category: 'segments', count: 980 },
            { id: 'professionals', label: 'Professionals', category: 'segments', count: 760 },
            
            // Product tags
            { id: 'premium', label: 'Premium', category: 'products', count: 680 },
            { id: 'value', label: 'Value', category: 'products', count: 890 },
            { id: 'limited-edition', label: 'Limited Edition', category: 'products', count: 230 },
            { id: 'new-launch', label: 'New Launch', category: 'products', count: 340 },
            
            // Channel tags
            { id: 'convenience-stores', label: 'Convenience Stores', category: 'channels', count: 1600 },
            { id: 'supermarkets', label: 'Supermarkets', category: 'channels', count: 1200 },
            { id: 'online', label: 'Online', category: 'channels', count: 890 },
            { id: 'vending-machines', label: 'Vending Machines', category: 'channels', count: 450 }
        ];
    }

    createDropdownStructure() {
        this.container.innerHTML = `
            <div class="patch3-tags-dropdown" data-namespace="${this.namespace}">
                <div class="tags-input-container">
                    <div class="selected-tags"></div>
                    <input type="text" 
                           class="tags-search-input" 
                           placeholder="${this.config.placeholder}"
                           autocomplete="off">
                    <div class="tags-dropdown-arrow">
                        <i class="material-icons">expand_more</i>
                    </div>
                </div>
                
                <div class="tags-dropdown-content">
                    <div class="tags-dropdown-header">
                        ${this.config.showSelectAll ? '<button class="tags-select-all">Select All</button>' : ''}
                        ${this.config.showClearAll ? '<button class="tags-clear-all">Clear All</button>' : ''}
                        <span class="tags-count">0 selected</span>
                    </div>
                    
                    <div class="tags-search-container">
                        <i class="material-icons">search</i>
                        <input type="text" class="tags-search" placeholder="Search tags...">
                    </div>
                    
                    <div class="tags-categories"></div>
                    
                    <div class="tags-list"></div>
                    
                    ${this.config.allowCustomTags ? `
                        <div class="tags-custom">
                            <input type="text" class="tags-custom-input" placeholder="Add custom tag...">
                            <button class="tags-add-custom">Add</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.elements = {
            dropdown: this.container.querySelector('.patch3-tags-dropdown'),
            inputContainer: this.container.querySelector('.tags-input-container'),
            selectedTags: this.container.querySelector('.selected-tags'),
            searchInput: this.container.querySelector('.tags-search-input'),
            dropdownArrow: this.container.querySelector('.tags-dropdown-arrow'),
            dropdownContent: this.container.querySelector('.tags-dropdown-content'),
            selectAllBtn: this.container.querySelector('.tags-select-all'),
            clearAllBtn: this.container.querySelector('.tags-clear-all'),
            tagsCount: this.container.querySelector('.tags-count'),
            searchContainer: this.container.querySelector('.tags-search-container'),
            search: this.container.querySelector('.tags-search'),
            categoriesContainer: this.container.querySelector('.tags-categories'),
            tagsList: this.container.querySelector('.tags-list'),
            customInput: this.container.querySelector('.tags-custom-input'),
            addCustomBtn: this.container.querySelector('.tags-add-custom')
        };
        
        this.renderCategories();
        this.renderTags();
    }

    renderCategories() {
        if (!this.config.groupTags) return;
        
        const categories = Object.entries(this.tagCategories)
            .filter(([key]) => this.tags.some(tag => tag.category === key));
        
        this.elements.categoriesContainer.innerHTML = categories.map(([key, category]) => `
            <button class="tag-category" data-category="${key}">
                <span class="category-icon">${category.icon}</span>
                <span class="category-label">${category.label}</span>
                <span class="category-count">${this.tags.filter(tag => tag.category === key).length}</span>
            </button>
        `).join('');
    }

    renderTags() {
        const tagsToRender = this.filteredTags.slice(0, this.config.maxItems);
        
        if (this.config.groupTags) {
            this.renderGroupedTags(tagsToRender);
        } else {
            this.renderFlatTags(tagsToRender);
        }
        
        this.updateTagsCount();
    }

    renderGroupedTags(tags) {
        const groupedTags = tags.reduce((groups, tag) => {
            const category = tag.category || 'custom';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(tag);
            return groups;
        }, {});
        
        this.elements.tagsList.innerHTML = Object.entries(groupedTags)
            .map(([category, categoryTags]) => `
                <div class="tag-group" data-category="${category}">
                    <div class="tag-group-header">
                        <span class="tag-group-icon">${this.tagCategories[category]?.icon || '📋'}</span>
                        <span class="tag-group-title">${this.tagCategories[category]?.label || category}</span>
                        <span class="tag-group-count">(${categoryTags.length})</span>
                    </div>
                    <div class="tag-group-items">
                        ${categoryTags.map(tag => this.renderTagItem(tag)).join('')}
                    </div>
                </div>
            `).join('');
    }

    renderFlatTags(tags) {
        this.elements.tagsList.innerHTML = tags.map(tag => this.renderTagItem(tag)).join('');
    }

    renderTagItem(tag) {
        const isSelected = this.selectedTags.has(tag.id);
        const category = this.tagCategories[tag.category] || this.tagCategories.custom;
        
        return `
            <div class="tag-item ${isSelected ? 'selected' : ''}" data-tag-id="${tag.id}">
                <div class="tag-checkbox">
                    <i class="material-icons">${isSelected ? 'check_box' : 'check_box_outline_blank'}</i>
                </div>
                <div class="tag-content">
                    <span class="tag-label">${tag.label}</span>
                    <span class="tag-count">${tag.count || 0}</span>
                </div>
                <div class="tag-category-indicator" style="background-color: ${category.color}"></div>
            </div>
        `;
    }

    setupEventListeners() {
        // Input container click - toggle dropdown
        this.elements.inputContainer.addEventListener('click', (e) => {
            if (!e.target.closest('.selected-tag .remove-tag')) {
                this.toggleDropdown();
            }
        });
        
        // Search input
        this.elements.search.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Tag selection
        this.elements.tagsList.addEventListener('click', (e) => {
            const tagItem = e.target.closest('.tag-item');
            if (tagItem) {
                const tagId = tagItem.dataset.tagId;
                this.toggleTag(tagId);
            }
        });
        
        // Category filter
        this.elements.categoriesContainer.addEventListener('click', (e) => {
            const categoryBtn = e.target.closest('.tag-category');
            if (categoryBtn) {
                this.filterByCategory(categoryBtn.dataset.category);
            }
        });
        
        // Select all / Clear all
        if (this.elements.selectAllBtn) {
            this.elements.selectAllBtn.addEventListener('click', () => this.selectAll());
        }
        
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());
        }
        
        // Custom tag addition
        if (this.elements.customInput && this.elements.addCustomBtn) {
            this.elements.addCustomBtn.addEventListener('click', () => this.addCustomTag());
            this.elements.customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomTag();
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Keyboard navigation
        this.elements.dropdown.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (query.length < this.config.searchThreshold && query.length > 0) {
            return;
        }
        
        if (query === '') {
            this.filteredTags = [...this.tags];
        } else {
            this.filteredTags = this.tags.filter(tag => 
                tag.label.toLowerCase().includes(this.searchQuery) ||
                tag.category.toLowerCase().includes(this.searchQuery)
            );
        }
        
        this.renderTags();
    }

    filterByCategory(category) {
        // Toggle category filter
        const categoryBtn = this.elements.categoriesContainer.querySelector(`[data-category="${category}"]`);
        const isActive = categoryBtn.classList.contains('active');
        
        // Clear all active categories
        this.elements.categoriesContainer.querySelectorAll('.tag-category').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (!isActive) {
            categoryBtn.classList.add('active');
            this.filteredTags = this.tags.filter(tag => tag.category === category);
        } else {
            this.filteredTags = [...this.tags];
        }
        
        this.renderTags();
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
        this.elements.dropdown.classList.add('open');
        this.elements.dropdownArrow.querySelector('.material-icons').textContent = 'expand_less';
        this.elements.search.focus();
        
        this.notifyListeners('dropdown-opened');
    }

    closeDropdown() {
        this.isOpen = false;
        this.elements.dropdown.classList.remove('open');
        this.elements.dropdownArrow.querySelector('.material-icons').textContent = 'expand_more';
        
        if (!this.config.closeOnSelect) {
            this.elements.searchInput.blur();
        }
        
        this.notifyListeners('dropdown-closed');
    }

    toggleTag(tagId) {
        const tag = this.tags.find(t => t.id === tagId);
        if (!tag) return;
        
        if (this.selectedTags.has(tagId)) {
            this.selectedTags.delete(tagId);
            this.notifyListeners('tag-removed', tag);
        } else {
            this.selectedTags.add(tagId);
            this.notifyListeners('tag-added', tag);
        }
        
        this.updateSelectedTagsDisplay();
        this.updateTagsCount();
        this.saveSelection();
        this.notifyListeners('selection-changed', this.getSelectedTags());
        
        // Re-render tags to update selection state
        this.renderTags();
        
        if (this.config.closeOnSelect && this.selectedTags.size > 0) {
            this.closeDropdown();
        }
    }

    selectAll() {
        this.filteredTags.forEach(tag => {
            this.selectedTags.add(tag.id);
        });
        
        this.updateSelectedTagsDisplay();
        this.updateTagsCount();
        this.saveSelection();
        this.renderTags();
        this.notifyListeners('all-selected', this.getSelectedTags());
    }

    clearAll() {
        this.selectedTags.clear();
        this.updateSelectedTagsDisplay();
        this.updateTagsCount();
        this.saveSelection();
        this.renderTags();
        this.notifyListeners('all-cleared');
    }

    addCustomTag() {
        const input = this.elements.customInput;
        const label = input.value.trim();
        
        if (!label) return;
        
        // Check if tag already exists
        const existingTag = this.tags.find(t => 
            t.label.toLowerCase() === label.toLowerCase()
        );
        
        if (existingTag) {
            this.toggleTag(existingTag.id);
            input.value = '';
            return;
        }
        
        // Create new custom tag
        const customTag = {
            id: `custom-${Date.now()}`,
            label: label,
            category: 'custom',
            count: 0,
            isCustom: true
        };
        
        this.tags.push(customTag);
        this.filteredTags = [...this.tags];
        this.toggleTag(customTag.id);
        
        input.value = '';
        this.renderTags();
        this.notifyListeners('custom-tag-added', customTag);
    }

    updateSelectedTagsDisplay() {
        const selectedTagsData = this.getSelectedTags();
        
        this.elements.selectedTags.innerHTML = selectedTagsData.map(tag => `
            <span class="selected-tag" data-tag-id="${tag.id}">
                <span class="selected-tag-label">${tag.label}</span>
                <button class="remove-tag" title="Remove ${tag.label}">
                    <i class="material-icons">close</i>
                </button>
            </span>
        `).join('');
        
        // Add remove event listeners
        this.elements.selectedTags.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagId = btn.closest('.selected-tag').dataset.tagId;
                this.toggleTag(tagId);
            });
        });
        
        // Update input placeholder
        if (selectedTagsData.length > 0) {
            this.elements.searchInput.placeholder = '';
        } else {
            this.elements.searchInput.placeholder = this.config.placeholder;
        }
    }

    updateTagsCount() {
        const count = this.selectedTags.size;
        this.elements.tagsCount.textContent = `${count} selected`;
    }

    handleKeyboardNavigation(e) {
        // Implement keyboard navigation for accessibility
        if (e.key === 'Escape') {
            this.closeDropdown();
        } else if (e.key === 'Enter' && e.target.classList.contains('tags-search')) {
            e.preventDefault();
            const firstTag = this.elements.tagsList.querySelector('.tag-item:not(.selected)');
            if (firstTag) {
                this.toggleTag(firstTag.dataset.tagId);
            }
        }
    }

    // Public API methods
    getSelectedTags() {
        return Array.from(this.selectedTags).map(id => 
            this.tags.find(tag => tag.id === id)
        ).filter(Boolean);
    }

    getSelectedTagIds() {
        return Array.from(this.selectedTags);
    }

    setSelectedTags(tagIds) {
        this.selectedTags.clear();
        tagIds.forEach(id => {
            if (this.tags.find(tag => tag.id === id)) {
                this.selectedTags.add(id);
            }
        });
        
        this.updateSelectedTagsDisplay();
        this.updateTagsCount();
        this.renderTags();
        this.saveSelection();
        this.notifyListeners('selection-changed', this.getSelectedTags());
    }

    addTag(tag) {
        if (!this.tags.find(t => t.id === tag.id)) {
            this.tags.push(tag);
            this.filteredTags = [...this.tags];
            this.renderTags();
            this.renderCategories();
        }
    }

    removeTag(tagId) {
        this.tags = this.tags.filter(tag => tag.id !== tagId);
        this.selectedTags.delete(tagId);
        this.filteredTags = [...this.tags];
        this.updateSelectedTagsDisplay();
        this.renderTags();
        this.renderCategories();
        this.saveSelection();
    }

    updateTagCounts(counts) {
        this.tags.forEach(tag => {
            if (counts[tag.id] !== undefined) {
                tag.count = counts[tag.id];
            }
        });
        this.renderTags();
    }

    // Event system
    onSelectionChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data, this.getSelectedTags());
            } catch (error) {
                console.error(`[${this.namespace}] Listener error:`, error);
            }
        });
    }

    // Persistence
    saveSelection() {
        try {
            localStorage.setItem(`${this.namespace}_selection`, JSON.stringify(Array.from(this.selectedTags)));
        } catch (error) {
            console.warn(`[${this.namespace}] Failed to save selection:`, error);
        }
    }

    loadSavedSelection() {
        try {
            const saved = localStorage.getItem(`${this.namespace}_selection`);
            if (saved) {
                const tagIds = JSON.parse(saved);
                this.setSelectedTags(tagIds);
            }
        } catch (error) {
            console.warn(`[${this.namespace}] Failed to load saved selection:`, error);
        }
    }

    attachStyles() {
        if (document.getElementById('patch3-tags-dropdown-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'patch3-tags-dropdown-styles';
        styles.textContent = `
            .patch3-tags-dropdown {
                position: relative;
                width: 100%;
                min-width: 200px;
            }
            
            .tags-input-container {
                display: flex;
                align-items: center;
                min-height: 40px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tags-input-container:hover {
                border-color: #999;
            }
            
            .patch3-tags-dropdown.open .tags-input-container {
                border-color: #2196F3;
                box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
            }
            
            .selected-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                flex: 1;
            }
            
            .selected-tag {
                display: inline-flex;
                align-items: center;
                padding: 2px 6px;
                background: #e3f2fd;
                color: #1976d2;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
            }
            
            .selected-tag-label {
                margin-right: 4px;
            }
            
            .remove-tag {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                border-radius: 2px;
            }
            
            .remove-tag:hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .remove-tag .material-icons {
                font-size: 14px;
            }
            
            .tags-search-input {
                flex: 1;
                border: none;
                outline: none;
                padding: 4px;
                font-size: 14px;
                min-width: 60px;
            }
            
            .tags-dropdown-arrow {
                margin-left: 8px;
                color: #666;
                transition: transform 0.2s ease;
            }
            
            .patch3-tags-dropdown.open .tags-dropdown-arrow {
                transform: rotate(180deg);
            }
            
            .tags-dropdown-content {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                max-height: 400px;
                display: none;
            }
            
            .patch3-tags-dropdown.open .tags-dropdown-content {
                display: block;
            }
            
            .tags-dropdown-header {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
                gap: 8px;
            }
            
            .tags-select-all,
            .tags-clear-all {
                background: none;
                border: 1px solid #ddd;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .tags-select-all:hover,
            .tags-clear-all:hover {
                background: #f5f5f5;
                border-color: #999;
            }
            
            .tags-count {
                margin-left: auto;
                font-size: 12px;
                color: #666;
            }
            
            .tags-search-container {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
                gap: 8px;
            }
            
            .tags-search-container .material-icons {
                color: #666;
                font-size: 20px;
            }
            
            .tags-search {
                flex: 1;
                border: none;
                outline: none;
                padding: 4px;
                font-size: 14px;
            }
            
            .tags-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
            }
            
            .tag-category {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .tag-category:hover {
                background: #e0e0e0;
            }
            
            .tag-category.active {
                background: #e3f2fd;
                border-color: #2196F3;
                color: #1976d2;
            }
            
            .category-icon {
                font-size: 14px;
            }
            
            .category-count {
                background: rgba(0, 0, 0, 0.1);
                padding: 1px 4px;
                border-radius: 8px;
                font-size: 10px;
            }
            
            .tags-list {
                max-height: 250px;
                overflow-y: auto;
            }
            
            .tag-group {
                border-bottom: 1px solid #f0f0f0;
            }
            
            .tag-group-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: #fafafa;
                font-weight: 500;
                font-size: 13px;
                color: #666;
                border-bottom: 1px solid #eee;
            }
            
            .tag-group-count {
                margin-left: auto;
                font-size: 11px;
                color: #999;
            }
            
            .tag-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #f5f5f5;
            }
            
            .tag-item:hover {
                background: #f8f9fa;
            }
            
            .tag-item.selected {
                background: #e8f5e8;
            }
            
            .tag-checkbox {
                margin-right: 8px;
                color: #666;
            }
            
            .tag-item.selected .tag-checkbox {
                color: #4CAF50;
            }
            
            .tag-content {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tag-label {
                font-size: 14px;
            }
            
            .tag-count {
                font-size: 12px;
                color: #999;
                background: #f0f0f0;
                padding: 1px 6px;
                border-radius: 8px;
            }
            
            .tag-category-indicator {
                width: 3px;
                height: 20px;
                border-radius: 2px;
                margin-left: 8px;
            }
            
            .tags-custom {
                display: flex;
                gap: 8px;
                padding: 8px 12px;
                border-top: 1px solid #eee;
            }
            
            .tags-custom-input {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .tags-add-custom {
                padding: 6px 12px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s ease;
            }
            
            .tags-add-custom:hover {
                background: #1976D2;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PATCH3_TagsDropdown;
}

// Global access
window.PATCH3_TagsDropdown = PATCH3_TagsDropdown;