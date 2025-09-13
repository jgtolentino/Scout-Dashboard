/**
 * QA Overlay Component - PRD Compliant
 * Toggleable QA panel with Alt+Shift+D hotkey
 */

class QaOverlay {
    constructor() {
        this.isOpen = false;
        this.overlay = null;
        this.initialized = false;
        
        this.init();
    }

    /**
     * Initialize QA Overlay
     */
    init() {
        if (this.initialized) return;
        
        console.log('[QaOverlay] Initializing...');
        
        // Create overlay element
        this.createOverlay();
        
        // Add keyboard listener
        this.addKeyboardListener();
        
        this.initialized = true;
        console.log('[QaOverlay] Initialized - Press Alt+Shift+D to toggle');
    }

    /**
     * Create overlay DOM element
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'qa-overlay';
        this.overlay.className = 'qa-overlay hidden';
        
        this.overlay.innerHTML = `
            <div class="qa-overlay-header">
                <h3><i class="fas fa-bug"></i> QA Testing Panel</h3>
                <div class="qa-controls">
                    <span class="qa-hotkey">Alt+Shift+D</span>
                    <button class="qa-close-btn" title="Close QA Panel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="qa-overlay-content">
                <div class="qa-section">
                    <h4>Environment Info</h4>
                    <div class="qa-info">
                        <div class="qa-info-item">
                            <span class="label">Version:</span>
                            <span class="value" id="qa-version">Loading...</span>
                        </div>
                        <div class="qa-info-item">
                            <span class="label">Data Mode:</span>
                            <span class="value" id="qa-data-mode">Loading...</span>
                        </div>
                        <div class="qa-info-item">
                            <span class="label">Timestamp:</span>
                            <span class="value" id="qa-timestamp">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h4>Quick Actions</h4>
                    <div class="qa-actions">
                        <button class="qa-btn qa-btn-primary" id="qa-run-smoke-tests">
                            <i class="fas fa-play"></i> Run Smoke Tests
                        </button>
                        <button class="qa-btn qa-btn-secondary" id="qa-clear-cache">
                            <i class="fas fa-trash"></i> Clear Cache
                        </button>
                        <button class="qa-btn qa-btn-warning" id="qa-toggle-debug">
                            <i class="fas fa-code"></i> Toggle Debug
                        </button>
                        <button class="qa-btn qa-btn-info" id="qa-export-logs">
                            <i class="fas fa-download"></i> Export Logs
                        </button>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h4>Component Status</h4>
                    <div class="qa-status" id="qa-component-status">
                        <div class="status-loading">Checking components...</div>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h4>Console Output</h4>
                    <div class="qa-console" id="qa-console-output">
                        <div class="console-message">QA Panel initialized</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Add keyboard listener for Alt+Shift+D
     */
    addKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Add event listeners to overlay elements
     */
    addEventListeners() {
        // Close button
        this.overlay.querySelector('.qa-close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // QA Action buttons
        this.overlay.querySelector('#qa-run-smoke-tests').addEventListener('click', () => {
            this.runSmokeTests();
        });

        this.overlay.querySelector('#qa-clear-cache').addEventListener('click', () => {
            this.clearCache();
        });

        this.overlay.querySelector('#qa-toggle-debug').addEventListener('click', () => {
            this.toggleDebugMode();
        });

        this.overlay.querySelector('#qa-export-logs').addEventListener('click', () => {
            this.exportLogs();
        });
    }

    /**
     * Show QA overlay
     */
    show() {
        if (!this.overlay) return;
        
        this.isOpen = true;
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('visible');
        
        // Update info when shown
        this.updateInfo();
        this.checkComponentStatus();
        
        console.log('[QaOverlay] Shown');
    }

    /**
     * Hide QA overlay
     */
    hide() {
        if (!this.overlay) return;
        
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        this.overlay.classList.add('hidden');
        
        console.log('[QaOverlay] Hidden');
    }

    /**
     * Toggle QA overlay visibility
     */
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update environment info
     */
    updateInfo() {
        const versionEl = document.getElementById('qa-version');
        const dataModeEl = document.getElementById('qa-data-mode');
        const timestampEl = document.getElementById('qa-timestamp');

        if (versionEl) {
            versionEl.textContent = window.config?.app?.version || 'Unknown';
        }

        if (dataModeEl) {
            const isSimulated = window.dataConfig?.isSimulatedData;
            dataModeEl.textContent = isSimulated ? 'Simulated' : 'Live';
            dataModeEl.className = `value ${isSimulated ? 'simulated' : 'live'}`;
        }

        if (timestampEl) {
            timestampEl.textContent = new Date().toLocaleString();
        }
    }

    /**
     * Check component status
     */
    checkComponentStatus() {
        const statusContainer = document.getElementById('qa-component-status');
        if (!statusContainer) return;

        const components = [
            { name: 'Config', check: () => !!window.config },
            { name: 'Navigation', check: () => !!window.navItems },
            { name: 'Data Config', check: () => !!window.dataConfig },
            { name: 'Demo Data Loader', check: () => !!window.demoDataLoader },
            { name: 'Enhanced Smoke Test', check: () => !!window.enhancedSmokeTest },
            { name: 'Brand Performance Grid', check: () => document.querySelector('.brand-performance-grid') !== null },
            { name: 'Tags Dropdown', check: () => document.querySelector('.tags-dropdown') !== null }
        ];

        const statusHtml = components.map(component => {
            const isWorking = component.check();
            return `
                <div class="status-item ${isWorking ? 'working' : 'failing'}">
                    <i class="fas ${isWorking ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                    <span class="status-name">${component.name}</span>
                    <span class="status-indicator">${isWorking ? 'OK' : 'FAIL'}</span>
                </div>
            `;
        }).join('');

        statusContainer.innerHTML = statusHtml;
    }

    /**
     * QA Actions
     */
    runSmokeTests() {
        this.addConsoleMessage('Running smoke tests...');
        
        if (window.enhancedSmokeTest) {
            window.enhancedSmokeTest.runAllTests().then(success => {
                const message = success ? 'Smoke tests PASSED ✅' : 'Smoke tests FAILED ❌';
                this.addConsoleMessage(message);
            });
        } else {
            this.addConsoleMessage('Enhanced smoke test not available');
        }
    }

    clearCache() {
        this.addConsoleMessage('Clearing cache...');
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear caches if available
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        this.addConsoleMessage('Cache cleared ✅');
    }

    toggleDebugMode() {
        const isDebug = window.config?.app?.debug;
        
        if (window.config?.app) {
            window.config.app.debug = !isDebug;
        }
        
        this.addConsoleMessage(`Debug mode: ${!isDebug ? 'ON' : 'OFF'}`);
        this.updateInfo();
    }

    exportLogs() {
        this.addConsoleMessage('Exporting logs...');
        
        const logs = {
            timestamp: new Date().toISOString(),
            version: window.config?.app?.version,
            dataMode: window.dataConfig?.isSimulatedData ? 'simulated' : 'live',
            selectedTags: window.selectedTags || [],
            userAgent: navigator.userAgent,
            url: location.href,
            console: this.getConsoleMessages()
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addConsoleMessage('Logs exported ✅');
    }

    /**
     * Add message to console output
     */
    addConsoleMessage(message) {
        const consoleOutput = document.getElementById('qa-console-output');
        if (!consoleOutput) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'console-message';
        messageEl.innerHTML = `
            <span class="console-time">${new Date().toLocaleTimeString()}</span>
            <span class="console-text">${message}</span>
        `;

        consoleOutput.appendChild(messageEl);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;

        // Keep only last 50 messages
        const messages = consoleOutput.querySelectorAll('.console-message');
        if (messages.length > 50) {
            messages[0].remove();
        }
    }

    /**
     * Get console messages for export
     */
    getConsoleMessages() {
        const consoleOutput = document.getElementById('qa-console-output');
        if (!consoleOutput) return [];

        return Array.from(consoleOutput.querySelectorAll('.console-message')).map(msg => {
            return {
                time: msg.querySelector('.console-time')?.textContent,
                text: msg.querySelector('.console-text')?.textContent
            };
        });
    }
}

// Global QA Overlay instance
window.qaOverlay = new QaOverlay();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QaOverlay;
}