/**
 * Feedback Modal Component - PRD Compliant
 * Handles feedback/UAT button clicks and modal display
 */

class FeedbackModal {
    constructor() {
        this.modal = null;
        this.initialized = false;
        
        this.init();
    }

    /**
     * Initialize feedback modal
     */
    init() {
        if (this.initialized) return;
        
        console.log('[FeedbackModal] Initializing...');
        
        // Create modal element
        this.createModal();
        
        // Wire up feedback buttons
        this.wireFeedbackButtons();
        
        this.initialized = true;
        console.log('[FeedbackModal] Initialized');
    }

    /**
     * Wire up feedback buttons in the UI
     */
    wireFeedbackButtons() {
        // Look for feedback buttons
        const feedbackButtons = document.querySelectorAll(
            '#feedback-btn, .feedback-btn, [data-action="feedback"], .uat-btn'
        );
        
        feedbackButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.show();
            });
        });
        
        console.log(`[FeedbackModal] Wired ${feedbackButtons.length} feedback buttons`);
    }

    /**
     * Create modal DOM element
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'feedback-modal';
        this.modal.className = 'feedback-modal hidden';
        
        this.modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-comment-alt"></i> Feedback & UAT</h3>
                    <button class="modal-close" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="feedback-form" class="feedback-form">
                        <div class="form-group">
                            <label for="feedback-type">Feedback Type:</label>
                            <select id="feedback-type" name="type" required>
                                <option value="">Select type...</option>
                                <option value="bug">🐛 Bug Report</option>
                                <option value="feature">💡 Feature Request</option>
                                <option value="improvement">🔧 Improvement</option>
                                <option value="uat">✅ UAT Feedback</option>
                                <option value="other">📝 Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-priority">Priority:</label>
                            <select id="feedback-priority" name="priority" required>
                                <option value="">Select priority...</option>
                                <option value="critical">🔴 Critical</option>
                                <option value="high">🟠 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🔵 Low</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-title">Title:</label>
                            <input type="text" id="feedback-title" name="title" required 
                                   placeholder="Brief description of the issue or request">
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-description">Description:</label>
                            <textarea id="feedback-description" name="description" required 
                                     placeholder="Detailed description. For bugs, include steps to reproduce."
                                     rows="5"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-browser">Browser/Environment:</label>
                            <input type="text" id="feedback-browser" name="browser" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-page">Current Page/Section:</label>
                            <input type="text" id="feedback-page" name="page" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="feedback-contact">Contact Email (Optional):</label>
                            <input type="email" id="feedback-contact" name="contact" 
                                   placeholder="your.email@company.com">
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="feedback-urgent" name="urgent">
                                <span class="checkmark"></span>
                                This is urgent and requires immediate attention
                            </label>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="feedback-screenshot" name="screenshot">
                                <span class="checkmark"></span>
                                Include automatic screenshot of current view
                            </label>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-feedback">Cancel</button>
                    <button type="submit" form="feedback-form" class="btn btn-primary" id="submit-feedback">
                        <i class="fas fa-paper-plane"></i>
                        Submit Feedback
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Close modal events
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hide();
        });
        
        this.modal.querySelector('#cancel-feedback').addEventListener('click', () => {
            this.hide();
        });
        
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.hide();
        });
        
        // Form submission
        this.modal.querySelector('#feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });
        
        // Auto-fill environment info when shown
        this.modal.addEventListener('transitionend', () => {
            if (!this.modal.classList.contains('hidden')) {
                this.fillEnvironmentInfo();
            }
        });
    }

    /**
     * Show feedback modal
     */
    show() {
        if (!this.modal) return;
        
        this.modal.classList.remove('hidden');
        this.modal.classList.add('visible');
        
        // Fill environment info
        this.fillEnvironmentInfo();
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('#feedback-type');
            if (firstInput) firstInput.focus();
        }, 100);
        
        console.log('[FeedbackModal] Shown');
    }

    /**
     * Hide feedback modal
     */
    hide() {
        if (!this.modal) return;
        
        this.modal.classList.remove('visible');
        this.modal.classList.add('hidden');
        
        // Reset form
        this.modal.querySelector('#feedback-form').reset();
        
        console.log('[FeedbackModal] Hidden');
    }

    /**
     * Fill environment information
     */
    fillEnvironmentInfo() {
        const browserField = this.modal.querySelector('#feedback-browser');
        const pageField = this.modal.querySelector('#feedback-page');
        
        if (browserField) {
            browserField.value = `${navigator.userAgent} | Screen: ${screen.width}x${screen.height}`;
        }
        
        if (pageField) {
            pageField.value = `${window.location.pathname} | Title: ${document.title}`;
        }
    }

    /**
     * Submit feedback
     */
    async submitFeedback() {
        const form = this.modal.querySelector('#feedback-form');
        const formData = new FormData(form);
        
        // Convert to object
        const feedback = {};
        for (let [key, value] of formData.entries()) {
            feedback[key] = value;
        }
        
        // Add metadata
        feedback.timestamp = new Date().toISOString();
        feedback.url = window.location.href;
        feedback.version = window.config?.app?.version || 'unknown';
        feedback.dataMode = window.dataConfig?.isSimulatedData ? 'simulated' : 'live';
        feedback.selectedTags = window.selectedTags || [];
        
        // Add screenshot if requested
        if (feedback.screenshot === 'on') {
            try {
                feedback.screenshot = await this.captureScreenshot();
            } catch (error) {
                console.warn('Screenshot capture failed:', error);
                feedback.screenshot = 'Failed to capture';
            }
        }
        
        console.log('[FeedbackModal] Submitting feedback:', feedback);
        
        try {
            // Show loading state
            this.showSubmitLoading(true);
            
            // Submit feedback (simulated for now)
            await this.sendFeedback(feedback);
            
            // Show success message
            this.showSuccess();
            
        } catch (error) {
            console.error('[FeedbackModal] Submit failed:', error);
            this.showError(error.message);
        } finally {
            this.showSubmitLoading(false);
        }
    }

    /**
     * Send feedback to endpoint
     */
    async sendFeedback(feedback) {
        // For now, simulate sending feedback
        // In production, this would hit a real endpoint
        
        const endpoint = window.dataConfig?.isSimulatedData 
            ? '/data/sim/feedback-submit' 
            : '/api/feedback';
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo purposes, save to localStorage
        const existingFeedback = JSON.parse(localStorage.getItem('dashboardFeedback') || '[]');
        feedback.id = Date.now().toString();
        existingFeedback.push(feedback);
        localStorage.setItem('dashboardFeedback', JSON.stringify(existingFeedback));
        
        console.log('[FeedbackModal] Feedback saved to localStorage');
        
        // In production, would be:
        // const response = await fetch(endpoint, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(feedback)
        // });
        // 
        // if (!response.ok) {
        //     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        // }
        
        return { success: true, id: feedback.id };
    }

    /**
     * Capture screenshot
     */
    async captureScreenshot() {
        if (!('html2canvas' in window)) {
            throw new Error('Screenshot library not available');
        }
        
        // This would require html2canvas library
        // For now, return placeholder
        return 'Screenshot capture not implemented';
    }

    /**
     * Show submit loading state
     */
    showSubmitLoading(loading) {
        const submitBtn = this.modal.querySelector('#submit-feedback');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
        }
    }

    /**
     * Show success message
     */
    showSuccess() {
        const modalBody = this.modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="feedback-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Feedback Submitted Successfully!</h4>
                <p>Thank you for your feedback. We'll review it and get back to you if needed.</p>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="window.feedbackModal.hide()">
                        Close
                    </button>
                    <button class="btn btn-secondary" onclick="window.feedbackModal.showForm()">
                        Submit Another
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        const modalBody = this.modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="feedback-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Submission Failed</h4>
                <p>Sorry, we couldn't submit your feedback: ${message}</p>
                <div class="error-actions">
                    <button class="btn btn-secondary" onclick="window.feedbackModal.hide()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="window.feedbackModal.showForm()">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show form (restore from success/error state)
     */
    showForm() {
        // Recreate modal content
        this.modal.remove();
        this.createModal();
        this.show();
    }
}

// Global feedback modal instance
window.feedbackModal = new FeedbackModal();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackModal;
}