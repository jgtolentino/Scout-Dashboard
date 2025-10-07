/**
 * Feedback System Component
 * PRD Requirement: Wire feedback/UAT button to functional modal/form system
 * Integrates with existing feedback modal in the dashboard
 */

class FeedbackSystem {
  constructor() {
    this.isInitialized = false;
    this.feedbackData = {
      session_id: this.generateSessionId(),
      feedback_entries: [],
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    this.init();
  }

  init() {
    this.attachFeedbackListeners();
    this.enhanceExistingModal();
    this.enableShortcuts();
    console.log('💬 Feedback system initialized');
    this.isInitialized = true;
  }

  attachFeedbackListeners() {
    // Find and wire existing feedback buttons
    const feedbackButtons = document.querySelectorAll('[data-feedback], .feedback-btn, #feedback-btn, .btn-feedback');
    
    feedbackButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openFeedbackModal();
      });
    });

    // Wire header feedback button if it exists
    const headerFeedback = document.querySelector('.header-actions .btn-feedback');
    if (headerFeedback) {
      headerFeedback.addEventListener('click', (e) => {
        e.preventDefault();
        this.openFeedbackModal();
      });
    }

    // Add global feedback shortcut (Ctrl+Shift+F)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.openFeedbackModal();
      }
    });
  }

  enhanceExistingModal() {
    // Find existing feedback modal
    let modal = document.getElementById('feedbackModal');
    
    if (!modal) {
      // Create feedback modal if it doesn't exist
      modal = this.createFeedbackModal();
      document.body.appendChild(modal);
    }

    // Enhance the existing modal with better functionality
    this.enhanceModalContent(modal);
    this.attachModalListeners(modal);
  }

  createFeedbackModal() {
    const modal = document.createElement('div');
    modal.id = 'feedbackModal';
    modal.className = 'modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'feedbackModalTitle');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
      <div class="modal-overlay" aria-hidden="true"></div>
      <div class="modal-content" role="document">
        <div class="modal-header">
          <h3 id="feedbackModalTitle">Dashboard Feedback</h3>
          <button class="modal-close" aria-label="Close feedback modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="feedbackForm" class="feedback-form">
            <!-- Form content will be added by enhanceModalContent -->
          </form>
        </div>
      </div>
    `;
    
    return modal;
  }

  enhanceModalContent(modal) {
    const form = modal.querySelector('#feedbackForm');
    if (!form) return;

    form.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-context">
          <div class="context-item">
            <strong>Page:</strong> Client360 Dashboard v2.4.0
          </div>
          <div class="context-item">
            <strong>Session:</strong> ${this.feedbackData.session_id}
          </div>
          <div class="context-item">
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-type">Type of Feedback:</label>
        <select id="feedback-type" name="type" required>
          <option value="">Select feedback type</option>
          <option value="bug">🐛 Bug Report</option>
          <option value="feature">💡 Feature Request</option>
          <option value="uat">🧪 UAT Issue</option>
          <option value="usability">👤 Usability Issue</option>
          <option value="performance">⚡ Performance Issue</option>
          <option value="data">📊 Data Quality Issue</option>
          <option value="general">💬 General Feedback</option>
        </select>
      </div>

      <div class="form-group">
        <label for="feedback-priority">Priority Level:</label>
        <select id="feedback-priority" name="priority" required>
          <option value="low">🟢 Low - Nice to have</option>
          <option value="medium" selected>🟡 Medium - Should fix</option>
          <option value="high">🟠 High - Important issue</option>
          <option value="critical">🔴 Critical - Blocking issue</option>
        </select>
      </div>

      <div class="form-group">
        <label for="feedback-component">Dashboard Component:</label>
        <select id="feedback-component" name="component">
          <option value="">Select component (optional)</option>
          <option value="kpi-tiles">KPI Tiles</option>
          <option value="brand-performance">Brand Performance</option>
          <option value="device-health">Device Health Grid</option>
          <option value="map-component">Geospatial Map</option>
          <option value="ai-insights">AI Insights Panel</option>
          <option value="drill-down">Drill-down Drawer</option>
          <option value="filters">Filter Bar</option>
          <option value="navigation">Navigation</option>
          <option value="export">Export Functions</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="feedback-title">Issue Title:</label>
        <input type="text" id="feedback-title" name="title" required 
               placeholder="Brief description of the issue or suggestion" 
               maxlength="100">
        <div class="char-counter">
          <span id="title-counter">0</span>/100 characters
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-description">Detailed Description:</label>
        <textarea id="feedback-description" name="description" required 
                  placeholder="Please provide detailed information about the issue, steps to reproduce, expected vs actual behavior, or your suggestion..."
                  rows="6" maxlength="2000"></textarea>
        <div class="char-counter">
          <span id="description-counter">0</span>/2000 characters
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-steps">Steps to Reproduce (for bugs):</label>
        <textarea id="feedback-steps" name="steps" 
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                  rows="4" maxlength="1000"></textarea>
        <div class="char-counter">
          <span id="steps-counter">0</span>/1000 characters
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-browser">Browser & Device Info:</label>
        <textarea id="feedback-browser" name="browser" readonly
                  rows="2">${this.getBrowserInfo()}</textarea>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="feedback-screenshot" name="screenshot">
          <span class="checkmark"></span>
          I can provide a screenshot if needed
        </label>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="feedback-contact" name="contact">
          <span class="checkmark"></span>
          I'm available for follow-up questions
        </label>
      </div>

      <div class="form-group" id="contact-info-group" style="display: none;">
        <label for="feedback-email">Contact Email (optional):</label>
        <input type="email" id="feedback-email" name="email" 
               placeholder="your.email@company.com">
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-paper-plane"></i>
          Submit Feedback
        </button>
        <button type="button" class="btn btn-secondary" id="feedback-cancel">
          <i class="fas fa-times"></i>
          Cancel
        </button>
        <button type="button" class="btn btn-outline" id="feedback-draft">
          <i class="fas fa-save"></i>
          Save Draft
        </button>
      </div>

      <div class="feedback-footer">
        <small>
          <i class="fas fa-info-circle"></i>
          Your feedback helps improve the dashboard experience. 
          Thank you for taking the time to share your insights!
        </small>
      </div>
    `;

    this.attachFormListeners(form);
  }

  attachModalListeners(modal) {
    // Close modal listeners
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const cancelBtn = modal.querySelector('#feedback-cancel');

    [closeBtn, overlay, cancelBtn].forEach(element => {
      element?.addEventListener('click', () => {
        this.closeFeedbackModal();
      });
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        this.closeFeedbackModal();
      }
    });
  }

  attachFormListeners(form) {
    // Character counters
    const textInputs = [
      { input: '#feedback-title', counter: '#title-counter' },
      { input: '#feedback-description', counter: '#description-counter' },
      { input: '#feedback-steps', counter: '#steps-counter' }
    ];

    textInputs.forEach(({ input, counter }) => {
      const inputElement = form.querySelector(input);
      const counterElement = form.querySelector(counter);
      
      if (inputElement && counterElement) {
        inputElement.addEventListener('input', () => {
          counterElement.textContent = inputElement.value.length;
        });
      }
    });

    // Contact info toggle
    const contactCheckbox = form.querySelector('#feedback-contact');
    const contactGroup = form.querySelector('#contact-info-group');
    
    contactCheckbox?.addEventListener('change', () => {
      if (contactGroup) {
        contactGroup.style.display = contactCheckbox.checked ? 'block' : 'none';
      }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitFeedback(form);
    });

    // Save draft
    const draftBtn = form.querySelector('#feedback-draft');
    draftBtn?.addEventListener('click', () => {
      this.saveFeedbackDraft(form);
    });

    // Auto-save every 30 seconds
    setInterval(() => {
      if (!document.getElementById('feedbackModal').classList.contains('hidden')) {
        this.autoSaveDraft(form);
      }
    }, 30000);
  }

  openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('#feedback-type');
      if (firstInput) firstInput.focus();
      
      // Load draft if exists
      this.loadFeedbackDraft();
      
      console.log('💬 Feedback modal opened');
    }
  }

  closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      console.log('💬 Feedback modal closed');
    }
  }

  async submitFeedback(form) {
    const formData = new FormData(form);
    const feedbackData = {
      ...this.feedbackData,
      type: formData.get('type'),
      priority: formData.get('priority'),
      component: formData.get('component'),
      title: formData.get('title'),
      description: formData.get('description'),
      steps: formData.get('steps'),
      screenshot_available: formData.get('screenshot') === 'on',
      contact_available: formData.get('contact') === 'on',
      email: formData.get('email'),
      submitted_at: new Date().toISOString()
    };

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
      // In production, this would send to actual feedback API
      await this.sendFeedbackToAPI(feedbackData);
      
      // Show success message
      this.showFeedbackSuccess();
      
      // Clear draft
      this.clearFeedbackDraft();
      
      // Close modal after delay
      setTimeout(() => {
        this.closeFeedbackModal();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showFeedbackError();
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async sendFeedbackToAPI(feedbackData) {
    // Mock API call - in production, replace with actual endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📨 Feedback submitted:', feedbackData);
        
        // Store locally for demo purposes
        const existingFeedback = JSON.parse(localStorage.getItem('dashboard_feedback') || '[]');
        existingFeedback.push(feedbackData);
        localStorage.setItem('dashboard_feedback', JSON.stringify(existingFeedback));
        
        resolve();
      }, 1500);
    });
  }

  showFeedbackSuccess() {
    this.showFeedbackMessage('✅ Thank you! Your feedback has been submitted successfully.', 'success');
  }

  showFeedbackError() {
    this.showFeedbackMessage('❌ Sorry, there was an error submitting your feedback. Please try again.', 'error');
  }

  showFeedbackMessage(message, type) {
    const modal = document.getElementById('feedbackModal');
    const existingMessage = modal.querySelector('.feedback-message');
    
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `feedback-message ${type}`;
    messageDiv.innerHTML = message;
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.insertBefore(messageDiv, modalBody.firstChild);
  }

  saveFeedbackDraft(form) {
    const formData = new FormData(form);
    const draft = {
      type: formData.get('type'),
      priority: formData.get('priority'),
      component: formData.get('component'),
      title: formData.get('title'),
      description: formData.get('description'),
      steps: formData.get('steps'),
      contact: formData.get('contact') === 'on',
      email: formData.get('email'),
      saved_at: new Date().toISOString()
    };
    
    localStorage.setItem('feedback_draft', JSON.stringify(draft));
    this.showFeedbackMessage('💾 Draft saved successfully', 'info');
    
    setTimeout(() => {
      const message = document.querySelector('.feedback-message');
      if (message) message.remove();
    }, 2000);
  }

  autoSaveDraft(form) {
    const title = form.querySelector('#feedback-title').value;
    const description = form.querySelector('#feedback-description').value;
    
    // Only auto-save if there's meaningful content
    if (title.length > 3 || description.length > 10) {
      this.saveFeedbackDraft(form);
    }
  }

  loadFeedbackDraft() {
    const draft = localStorage.getItem('feedback_draft');
    if (!draft) return;
    
    try {
      const draftData = JSON.parse(draft);
      const form = document.getElementById('feedbackForm');
      
      // Populate form fields
      if (draftData.type) form.querySelector('#feedback-type').value = draftData.type;
      if (draftData.priority) form.querySelector('#feedback-priority').value = draftData.priority;
      if (draftData.component) form.querySelector('#feedback-component').value = draftData.component;
      if (draftData.title) form.querySelector('#feedback-title').value = draftData.title;
      if (draftData.description) form.querySelector('#feedback-description').value = draftData.description;
      if (draftData.steps) form.querySelector('#feedback-steps').value = draftData.steps;
      if (draftData.contact) form.querySelector('#feedback-contact').checked = draftData.contact;
      if (draftData.email) form.querySelector('#feedback-email').value = draftData.email;
      
      // Update character counters
      form.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.dispatchEvent(new Event('input'));
      });
      
      this.showFeedbackMessage('📝 Draft loaded from previous session', 'info');
      
      setTimeout(() => {
        const message = document.querySelector('.feedback-message');
        if (message) message.remove();
      }, 3000);
      
    } catch (error) {
      console.warn('Could not load feedback draft:', error);
    }
  }

  clearFeedbackDraft() {
    localStorage.removeItem('feedback_draft');
  }

  enableShortcuts() {
    // Quick feedback shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+B for bug report
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        this.openFeedbackModal();
        setTimeout(() => {
          document.getElementById('feedback-type').value = 'bug';
        }, 100);
      }
    });
  }

  getBrowserInfo() {
    return `Browser: ${navigator.userAgent}
Viewport: ${window.innerWidth}x${window.innerHeight}
Screen: ${screen.width}x${screen.height}
Platform: ${navigator.platform}`;
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  // Public API
  isActive() {
    return this.isInitialized;
  }

  getFeedbackHistory() {
    return JSON.parse(localStorage.getItem('dashboard_feedback') || '[]');
  }
}

// Add CSS styles for enhanced feedback system
const feedbackSystemStyles = `
<style>
.feedback-form {
  max-height: 70vh;
  overflow-y: auto;
}

.feedback-header {
  background: var(--background-light);
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.feedback-context {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.context-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.char-counter {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkmark {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.feedback-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.feedback-footer small {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.feedback-message {
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.feedback-message.success {
  background-color: rgba(40, 167, 69, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.feedback-message.error {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--danger-color);
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.feedback-message.info {
  background-color: rgba(23, 162, 184, 0.1);
  color: var(--info-color);
  border: 1px solid rgba(23, 162, 184, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .feedback-context {
    grid-template-columns: 1fr;
  }
}
</style>
`;

// Inject styles and initialize
document.head.insertAdjacentHTML('beforeend', feedbackSystemStyles);

// Auto-initialize feedback system
if (typeof window !== 'undefined') {
  window.FeedbackSystem = FeedbackSystem;
  
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.feedbackSystem = new FeedbackSystem();
    });
  } else {
    window.feedbackSystem = new FeedbackSystem();
  }
}