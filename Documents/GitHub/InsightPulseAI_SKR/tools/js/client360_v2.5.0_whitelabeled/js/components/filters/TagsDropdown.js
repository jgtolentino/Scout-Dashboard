/**
 * Tags Dropdown Component - PRD Compliant
 * Fetches and renders filter tags with real data endpoint switching
 */

class TagsDropdown {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.tags = [];
        this.selectedTags = window.selectedTags || [];
        
        if (!this.container) {
            console.error(`[TagsDropdown] Container not found: ${containerId}`);
            return;
        }
        
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        try {
            console.log('[TagsDropdown] Initializing...');
            
            // Show loading state
            this.showLoading();
            
            // Fetch tags data
            await this.fetchTags();
            
            // Render the dropdown
            this.render();
            
            console.log('[TagsDropdown] Initialized successfully');
        } catch (error) {
            console.error('[TagsDropdown] Initialization failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Fetch tags from configured endpoint
     */
    async fetchTags() {
        try {
            const endpoint = window.dataConfig?.getTagEndpoint() || '/data/sim/tags.json';
            
            console.log(`[TagsDropdown] Fetching from: ${endpoint}`);
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.tags = await response.json();
            
            if (!Array.isArray(this.tags)) {
                throw new Error('Invalid tags format: expected array');
            }
            
            console.log(`[TagsDropdown] Loaded ${this.tags.length} tags`);
            
        } catch (error) {
            console.error('[TagsDropdown] Fetch failed:', error);
            
            // Use fallback tags
            this.tags = ["NCR", "Visayas", "Mindanao", "Coca-Cola", "Pepsi", "Nestlé"];
            console.log('[TagsDropdown] Using fallback tags');
        }
    }

    /**
     * Render the tags dropdown
     */
    render() {
        if (!this.tags || this.tags.length === 0) {
            this.showError('No tags available');
            return;
        }

        const dropdownHtml = `
            <div class="tags-dropdown">
                <div class="tags-header">
                    <span class="tags-label">Filter by:</span>
                    <span class="tags-count">${this.selectedTags.length}/${this.tags.length} selected</span>
                </div>
                <div class="tags-container">
                    ${this.tags.map(tag => this.renderTagPill(tag)).join('')}
                </div>
                <div class="tags-actions">
                    <button class="btn-clear-all" ${this.selectedTags.length === 0 ? 'disabled' : ''}>
                        Clear All
                    </button>
                    <button class="btn-select-all" ${this.selectedTags.length === this.tags.length ? 'disabled' : ''}>
                        Select All
                    </button>
                </div>
            </div>
        `;

        this.container.innerHTML = dropdownHtml;
        
        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Render individual tag pill
     */
    renderTagPill(tag) {
        const isSelected = this.selectedTags.includes(tag);
        const categoryClass = this.getTagCategory(tag);
        
        return `
            <button class="tag-pill ${isSelected ? 'selected' : ''} ${categoryClass}" 
                    data-tag="${tag}">
                <span class="tag-text">${tag}</span>
                ${isSelected ? '<i class="fas fa-check"></i>' : ''}
            </button>
        `;
    }

    /**
     * Get tag category for styling
     */
    getTagCategory(tag) {
        const regions = ['NCR', 'Visayas', 'Mindanao'];
        const brands = ['Coca-Cola', 'Pepsi', 'Nestlé'];
        const types = ['Sari-Sari', 'Client', 'Promo'];
        
        if (regions.includes(tag)) return 'category-region';
        if (brands.includes(tag)) return 'category-brand';
        if (types.includes(tag)) return 'category-type';
        return 'category-other';
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Tag pill clicks
        this.container.querySelectorAll('.tag-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const tag = pill.dataset.tag;
                this.toggleTag(tag);
            });
        });

        // Clear all button
        this.container.querySelector('.btn-clear-all')?.addEventListener('click', () => {
            this.clearAllTags();
        });

        // Select all button
        this.container.querySelector('.btn-select-all')?.addEventListener('click', () => {
            this.selectAllTags();
        });
    }

    /**
     * Toggle tag selection
     */
    toggleTag(tag) {
        console.log(`[TagsDropdown] Toggling tag: ${tag}`);
        
        const index = this.selectedTags.indexOf(tag);
        
        if (index > -1) {
            // Remove tag
            this.selectedTags.splice(index, 1);
        } else {
            // Add tag
            this.selectedTags.push(tag);
        }
        
        // Update global state
        window.selectedTags = this.selectedTags;
        
        // Re-render to update UI
        this.render();
        
        // Trigger dashboard refresh
        this.triggerDashboardRefresh();
        
        // Emit custom event
        const event = new CustomEvent('tagsChanged', {
            detail: { 
                selectedTags: this.selectedTags,
                toggledTag: tag
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear all selected tags
     */
    clearAllTags() {
        console.log('[TagsDropdown] Clearing all tags');
        
        this.selectedTags = [];
        window.selectedTags = [];
        
        this.render();
        this.triggerDashboardRefresh();
        
        // Emit event
        document.dispatchEvent(new CustomEvent('tagsCleared'));
    }

    /**
     * Select all tags
     */
    selectAllTags() {
        console.log('[TagsDropdown] Selecting all tags');
        
        this.selectedTags = [...this.tags];
        window.selectedTags = this.selectedTags;
        
        this.render();
        this.triggerDashboardRefresh();
        
        // Emit event
        document.dispatchEvent(new CustomEvent('allTagsSelected'));
    }

    /**
     * Trigger dashboard data refresh
     */
    triggerDashboardRefresh() {
        // Call global refresh function if available
        if (typeof window.dashboard?.refreshData === 'function') {
            window.dashboard.refreshData();
        }
        
        // Call demo data loader refresh if available
        if (window.demoDataLoader?.refresh) {
            window.demoDataLoader.refresh();
        }
        
        // Show notification
        this.showTagsNotification();
    }

    /**
     * Show tags selection notification
     */
    showTagsNotification() {
        const notification = document.createElement('div');
        notification.className = 'tags-notification';
        notification.innerHTML = `
            <i class="fas fa-filter"></i>
            Filters updated: ${this.selectedTags.length} tags selected
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="tags-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading filter tags...</div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="tags-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button class="retry-btn" onclick="this.closest('.tags-error').parentElement.tagsDropdown.init()">
                    Retry
                </button>
            </div>
        `;
        
        // Store reference for retry
        this.container.tagsDropdown = this;
    }

    /**
     * Get selected tags
     */
    getSelectedTags() {
        return this.selectedTags;
    }

    /**
     * Set selected tags programmatically
     */
    setSelectedTags(tags) {
        this.selectedTags = Array.isArray(tags) ? tags : [];
        window.selectedTags = this.selectedTags;
        this.render();
    }

    /**
     * Refresh component
     */
    async refresh() {
        console.log('[TagsDropdown] Refreshing...');
        await this.init();
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Look for tags dropdown containers
    const containers = document.querySelectorAll('.filter-tags, #tags-filter, .tags-dropdown-container');
    
    containers.forEach(container => {
        if (!container.tagsDropdown) {
            container.tagsDropdown = new TagsDropdown(container.id || 'tags-filter');
        }
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagsDropdown;
}