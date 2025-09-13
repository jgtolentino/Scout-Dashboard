/**
 * Navigation Manager - PATCH 1: Nav cleanup & config.js consolidation
 * Implements clean navigation structure aligned with PRD requirements
 * 
 * PRD Sections Addressed:
 * - Section 2: Dashboard Navigation (Clean menu structure)
 * - Section 5: User Interface (Consistent navigation patterns)
 * 
 * Namespace: PATCH1_NavManager
 */

class PATCH1_NavManager {
    constructor() {
        this.namespace = 'PATCH1_NavManager';
        this.navItems = [];
        this.activeSection = null;
        this.config = {
            mainSections: [
                { id: 'overview', label: 'Overview', icon: 'dashboard', prdSection: '2.1' },
                { id: 'brands', label: 'Brand Performance', icon: 'trending_up', prdSection: '3.1' },
                { id: 'transactions', label: 'Transaction Analytics', icon: 'receipt', prdSection: '4.1' },
                { id: 'locations', label: 'Location Intelligence', icon: 'map', prdSection: '2.3' },
                { id: 'insights', label: 'AI Insights', icon: 'psychology', prdSection: '1.1' }
            ],
            subSections: {
                overview: [
                    { id: 'kpi-summary', label: 'KPI Summary', prdSection: '2.1.1' },
                    { id: 'real-time-alerts', label: 'Real-time Alerts', prdSection: '2.1.2' }
                ],
                brands: [
                    { id: 'brand-comparison', label: 'Brand Comparison', prdSection: '3.1.1' },
                    { id: 'competitive-analysis', label: 'Competitive Analysis', prdSection: '3.1.2' },
                    { id: 'brand-health', label: 'Brand Health Indicators', prdSection: '3.1.3' }
                ],
                transactions: [
                    { id: 'substitution-analysis', label: 'Product Substitution', prdSection: '4.1.1' },
                    { id: 'customer-patterns', label: 'Customer Patterns', prdSection: '4.1.2' },
                    { id: 'unbranded-detection', label: 'Unbranded Detection', prdSection: '4.1.3' }
                ],
                locations: [
                    { id: 'store-performance', label: 'Store Performance', prdSection: '2.3.1' },
                    { id: 'geographic-trends', label: 'Regional Trends', prdSection: '2.3.2' }
                ],
                insights: [
                    { id: 'ai-recommendations', label: 'AI Recommendations', prdSection: '1.1.1' },
                    { id: 'predictive-analytics', label: 'Predictive Analytics', prdSection: '1.1.2' }
                ]
            }
        };
        
        this.init();
    }

    init() {
        this.cleanupExistingNav();
        this.createNavStructure();
        this.setupEventListeners();
        this.loadActiveSection();
    }

    cleanupExistingNav() {
        // Remove placeholder navigation elements
        const placeholderNavs = document.querySelectorAll('.nav-placeholder, .temp-nav, .legacy-nav');
        placeholderNavs.forEach(nav => nav.remove());
        
        // Clean up conflicting nav IDs
        const conflictingElements = document.querySelectorAll('#nav, #navigation, .navigation');
        conflictingElements.forEach(el => {
            if (el.classList.contains('placeholder') || el.dataset.temp) {
                el.remove();
            }
        });
        
        console.log(`[${this.namespace}] Cleaned up existing navigation elements`);
    }

    createNavStructure() {
        const navContainer = this.getOrCreateNavContainer();
        
        const navHTML = `
            <nav class="patch1-nav-manager" id="patch1-main-nav">
                <div class="nav-header">
                    <h2>Client360 Dashboard</h2>
                    <span class="version-tag">v2.4.0</span>
                </div>
                <div class="nav-sections">
                    ${this.renderMainSections()}
                </div>
                <div class="nav-footer">
                    <div class="nav-controls">
                        <button class="nav-collapse-btn" title="Collapse Navigation">
                            <i class="material-icons">chevron_left</i>
                        </button>
                    </div>
                </div>
            </nav>
        `;
        
        navContainer.innerHTML = navHTML;
        this.attachNavigationStyles();
    }

    renderMainSections() {
        return this.config.mainSections.map(section => `
            <div class="nav-section" data-section="${section.id}" data-prd="${section.prdSection}">
                <div class="nav-section-header" data-section-id="${section.id}">
                    <i class="material-icons">${section.icon}</i>
                    <span class="section-label">${section.label}</span>
                    <i class="material-icons expand-icon">expand_more</i>
                </div>
                <div class="nav-subsections" data-parent="${section.id}">
                    ${this.renderSubSections(section.id)}
                </div>
            </div>
        `).join('');
    }

    renderSubSections(sectionId) {
        const subSections = this.config.subSections[sectionId] || [];
        return subSections.map(subSection => `
            <div class="nav-subsection" data-subsection="${subSection.id}" data-prd="${subSection.prdSection}">
                <span class="subsection-label">${subSection.label}</span>
                <span class="prd-indicator" title="PRD Section ${subSection.prdSection}">
                    ${subSection.prdSection}
                </span>
            </div>
        `).join('');
    }

    getOrCreateNavContainer() {
        let container = document.getElementById('patch1-nav-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'patch1-nav-container';
            container.className = 'patch1-nav-container';
            
            // Insert at the beginning of body or after header
            const header = document.querySelector('header, .header');
            if (header) {
                header.insertAdjacentElement('afterend', container);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }
        return container;
    }

    setupEventListeners() {
        // Section header clicks - expand/collapse
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-section-header')) {
                const header = e.target.closest('.nav-section-header');
                const sectionId = header.dataset.sectionId;
                this.toggleSection(sectionId);
            }
        });

        // Subsection clicks - navigate
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-subsection')) {
                const subsection = e.target.closest('.nav-subsection');
                const subsectionId = subsection.dataset.subsection;
                const prdSection = subsection.dataset.prd;
                this.navigateToSubsection(subsectionId, prdSection);
            }
        });

        // Collapse navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-collapse-btn')) {
                this.toggleNavCollapse();
            }
        });
    }

    toggleSection(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        const subsections = section.querySelector('.nav-subsections');
        const expandIcon = section.querySelector('.expand-icon');
        
        const isExpanded = section.classList.contains('expanded');
        
        // Collapse all other sections first
        document.querySelectorAll('.nav-section.expanded').forEach(s => {
            if (s !== section) {
                s.classList.remove('expanded');
                s.querySelector('.expand-icon').textContent = 'expand_more';
            }
        });
        
        // Toggle current section
        if (isExpanded) {
            section.classList.remove('expanded');
            expandIcon.textContent = 'expand_more';
        } else {
            section.classList.add('expanded');
            expandIcon.textContent = 'expand_less';
        }
    }

    navigateToSubsection(subsectionId, prdSection) {
        this.activeSection = subsectionId;
        
        // Update active states
        document.querySelectorAll('.nav-subsection.active').forEach(s => s.classList.remove('active'));
        document.querySelector(`[data-subsection="${subsectionId}"]`).classList.add('active');
        
        // Dispatch navigation event for other components to listen
        const navEvent = new CustomEvent('patch1NavChanged', {
            detail: {
                subsectionId,
                prdSection,
                timestamp: Date.now(),
                namespace: this.namespace
            }
        });
        document.dispatchEvent(navEvent);
        
        // Store in localStorage for persistence
        localStorage.setItem('patch1_active_section', subsectionId);
        
        console.log(`[${this.namespace}] Navigated to ${subsectionId} (PRD ${prdSection})`);
    }

    loadActiveSection() {
        const saved = localStorage.getItem('patch1_active_section');
        if (saved) {
            const element = document.querySelector(`[data-subsection="${saved}"]`);
            if (element) {
                const prdSection = element.dataset.prd;
                this.navigateToSubsection(saved, prdSection);
                
                // Expand parent section
                const parentSection = element.closest('.nav-section');
                const sectionId = parentSection.dataset.section;
                this.toggleSection(sectionId);
            }
        } else {
            // Default to overview
            this.navigateToSubsection('kpi-summary', '2.1.1');
        }
    }

    toggleNavCollapse() {
        const nav = document.getElementById('patch1-main-nav');
        const container = document.getElementById('patch1-nav-container');
        
        nav.classList.toggle('collapsed');
        container.classList.toggle('collapsed');
        
        const isCollapsed = nav.classList.contains('collapsed');
        localStorage.setItem('patch1_nav_collapsed', isCollapsed);
        
        // Dispatch event for layout adjustments
        document.dispatchEvent(new CustomEvent('patch1NavCollapsed', {
            detail: { collapsed: isCollapsed, namespace: this.namespace }
        }));
    }

    attachNavigationStyles() {
        if (document.getElementById('patch1-nav-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'patch1-nav-styles';
        styles.textContent = `
            .patch1-nav-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 280px;
                height: 100vh;
                background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                z-index: 1000;
                transition: all 0.3s ease;
                border-right: 1px solid rgba(255,255,255,0.1);
            }
            
            .patch1-nav-container.collapsed {
                width: 60px;
            }
            
            .patch1-nav-manager {
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .patch1-nav-manager.collapsed .section-label,
            .patch1-nav-manager.collapsed .subsection-label,
            .patch1-nav-manager.collapsed .nav-header h2,
            .patch1-nav-manager.collapsed .version-tag {
                display: none;
            }
            
            .nav-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .nav-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .version-tag {
                background: #4CAF50;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .nav-sections {
                flex: 1;
                overflow-y: auto;
                padding: 10px 0;
            }
            
            .nav-section {
                margin-bottom: 5px;
            }
            
            .nav-section-header {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .nav-section-header:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .nav-section-header .material-icons:first-child {
                margin-right: 12px;
                font-size: 20px;
            }
            
            .section-label {
                flex: 1;
                font-weight: 500;
            }
            
            .expand-icon {
                transition: transform 0.2s ease;
            }
            
            .nav-section.expanded .expand-icon {
                transform: rotate(180deg);
            }
            
            .nav-subsections {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: rgba(0,0,0,0.2);
            }
            
            .nav-section.expanded .nav-subsections {
                max-height: 300px;
            }
            
            .nav-subsection {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 20px 10px 52px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
            }
            
            .nav-subsection:hover {
                background: rgba(255,255,255,0.05);
                border-left-color: rgba(255,255,255,0.3);
            }
            
            .nav-subsection.active {
                background: rgba(76, 175, 80, 0.2);
                border-left-color: #4CAF50;
            }
            
            .subsection-label {
                font-size: 14px;
            }
            
            .prd-indicator {
                font-size: 10px;
                background: rgba(255,255,255,0.2);
                padding: 2px 6px;
                border-radius: 8px;
                font-family: monospace;
            }
            
            .nav-footer {
                padding: 15px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            .nav-controls {
                display: flex;
                justify-content: center;
            }
            
            .nav-collapse-btn {
                background: none;
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                padding: 8px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .nav-collapse-btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.4);
            }
            
            /* Adjust main content when nav is present */
            body {
                margin-left: 280px;
                transition: margin-left 0.3s ease;
            }
            
            body.patch1-nav-collapsed {
                margin-left: 60px;
            }
            
            @media (max-width: 768px) {
                .patch1-nav-container {
                    transform: translateX(-100%);
                }
                
                .patch1-nav-container.mobile-open {
                    transform: translateX(0);
                }
                
                body {
                    margin-left: 0;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Public API methods
    getCurrentSection() {
        return this.activeSection;
    }

    navigateTo(subsectionId) {
        const element = document.querySelector(`[data-subsection="${subsectionId}"]`);
        if (element) {
            const prdSection = element.dataset.prd;
            this.navigateToSubsection(subsectionId, prdSection);
            return true;
        }
        return false;
    }

    getNavigationState() {
        return {
            activeSection: this.activeSection,
            collapsed: document.getElementById('patch1-main-nav')?.classList.contains('collapsed') || false,
            availableSections: this.config.mainSections,
            namespace: this.namespace
        };
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PATCH1_NavManager = new PATCH1_NavManager();
    });
} else {
    window.PATCH1_NavManager = new PATCH1_NavManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PATCH1_NavManager;
}