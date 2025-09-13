/**
 * @file feedback_system.js
 * @description Feedback and UAT System for Client360 Dashboard
 * @version v2.4.0
 */

class FeedbackSystem {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.isOpen = false;
    this.feedbackData = {
      ratings: {},
      comments: [],
      issues: [],
      suggestions: []
    };
    this.config = {
      feedbackUrl: 'https://forms.google.com/client360-feedback', // Replace with actual form
      apiEndpoint: '/api/feedback',
      categories: [
        'UI/UX Design',
        'Data Accuracy',
        'Performance',
        'Feature Request',
        'Bug Report',
        'General Feedback'
      ],
      priorities: ['Low', 'Medium', 'High', 'Critical']
    };
    this.init();
  }

  init() {
    this.createFeedbackButton();
    this.createFeedbackModal();
    this.attachEventListeners();
    this.loadSavedFeedback();
  }

  createFeedbackButton() {
    // Create floating feedback button
    const feedbackBtn = document.createElement('div');
    feedbackBtn.id = 'feedback-button';
    feedbackBtn.className = 'feedback-floating-btn';
    feedbackBtn.innerHTML = `
      <button class="feedback-btn" title="Provide Feedback">
        <svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="feedback-text">Feedback</span>
      </button>
    `;
    
    document.body.appendChild(feedbackBtn);

    // Also add UAT button to header if it exists
    const header = document.querySelector('.dashboard-header, .header-controls');
    if (header) {
      const uatBtn = document.createElement('button');
      uatBtn.id = 'uat-button';
      uatBtn.className = 'btn btn-outline uat-btn';
      uatBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        UAT Feedback
      `;
      header.appendChild(uatBtn);
    }
  }

  createFeedbackModal() {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'feedback-modal';
    modal.innerHTML = `
      <div class="feedback-modal-overlay"></div>
      <div class="feedback-modal-content">
        <div class="feedback-modal-header">
          <h3 class="feedback-modal-title">Client360 Dashboard Feedback</h3>
          <button class="feedback-modal-close" id="close-feedback">&times;</button>
        </div>
        
        <div class="feedback-modal-body">
          <div class="feedback-tabs">
            <button class="feedback-tab-btn active" data-tab="quick">Quick Feedback</button>
            <button class="feedback-tab-btn" data-tab="detailed">Detailed Report</button>
            <button class="feedback-tab-btn" data-tab="uat">UAT Checklist</button>
          </div>
          
          <div class="feedback-tab-content">
            <!-- Quick Feedback Tab -->
            <div id="quick-tab" class="feedback-tab-panel active">
              <div class="quick-feedback">
                <div class="rating-section">
                  <h4>How would you rate this dashboard?</h4>
                  <div class="star-rating" id="overall-rating">
                    ${this.createStarRating('overall', 5)}
                  </div>
                </div>
                
                <div class="category-ratings">
                  <div class="rating-item">
                    <label>Ease of Use</label>
                    <div class="star-rating" id="ease-rating">
                      ${this.createStarRating('ease', 5)}
                    </div>
                  </div>
                  
                  <div class="rating-item">
                    <label>Data Clarity</label>
                    <div class="star-rating" id="clarity-rating">
                      ${this.createStarRating('clarity', 5)}
                    </div>
                  </div>
                  
                  <div class="rating-item">
                    <label>Visual Design</label>
                    <div class="star-rating" id="design-rating">
                      ${this.createStarRating('design', 5)}
                    </div>
                  </div>
                  
                  <div class="rating-item">
                    <label>Performance</label>
                    <div class="star-rating" id="performance-rating">
                      ${this.createStarRating('performance', 5)}
                    </div>
                  </div>
                </div>
                
                <div class="comment-section">
                  <label for="quick-comment">Quick Comment (Optional)</label>
                  <textarea id="quick-comment" placeholder="Any additional thoughts or suggestions..."></textarea>
                </div>
              </div>
            </div>
            
            <!-- Detailed Report Tab -->
            <div id="detailed-tab" class="feedback-tab-panel">
              <div class="detailed-feedback">
                <div class="feedback-form">
                  <div class="form-group">
                    <label for="feedback-category">Category</label>
                    <select id="feedback-category">
                      ${this.config.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="feedback-priority">Priority</label>
                    <select id="feedback-priority">
                      ${this.config.priorities.map(pri => `<option value="${pri}">${pri}</option>`).join('')}
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="feedback-title">Issue/Suggestion Title</label>
                    <input type="text" id="feedback-title" placeholder="Brief description of the issue or suggestion">
                  </div>
                  
                  <div class="form-group">
                    <label for="feedback-description">Detailed Description</label>
                    <textarea id="feedback-description" rows="4" placeholder="Please provide detailed information about the issue, steps to reproduce, or your suggestion..."></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label for="feedback-browser">Browser & Device Info</label>
                    <input type="text" id="feedback-browser" readonly>
                  </div>
                  
                  <div class="form-group">
                    <label for="feedback-url">Current Page</label>
                    <input type="text" id="feedback-url" readonly>
                  </div>
                  
                  <div class="form-group">
                    <label>
                      <input type="checkbox" id="include-screenshot">
                      Include screenshot (auto-captured)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- UAT Checklist Tab -->
            <div id="uat-tab" class="feedback-tab-panel">
              <div class="uat-checklist">
                <div class="uat-header">
                  <h4>User Acceptance Testing Checklist</h4>
                  <p>Please test the following features and mark as ✓ Pass or ✗ Fail</p>
                </div>
                
                <div class="uat-sections">
                  <div class="uat-section">
                    <h5>Core Functionality</h5>
                    <div class="uat-items">
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="dashboard-load">✓</button>
                          <button class="uat-fail" data-item="dashboard-load">✗</button>
                        </div>
                        <span class="uat-label">Dashboard loads without errors</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="kpi-display">✓</button>
                          <button class="uat-fail" data-item="kpi-display">✗</button>
                        </div>
                        <span class="uat-label">KPI tiles display correct data</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="map-functionality">✓</button>
                          <button class="uat-fail" data-item="map-functionality">✗</button>
                        </div>
                        <span class="uat-label">Map displays and is interactive</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="filters-working">✓</button>
                          <button class="uat-fail" data-item="filters-working">✗</button>
                        </div>
                        <span class="uat-label">Filters apply correctly to data</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="uat-section">
                    <h5>New Features (v2.4.0)</h5>
                    <div class="uat-items">
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="ai-insights">✓</button>
                          <button class="uat-fail" data-item="ai-insights">✗</button>
                        </div>
                        <span class="uat-label">AI Insights panel generates responses</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="user-preferences">✓</button>
                          <button class="uat-fail" data-item="user-preferences">✗</button>
                        </div>
                        <span class="uat-label">User preferences save and persist</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="enhanced-maps">✓</button>
                          <button class="uat-fail" data-item="enhanced-maps">✗</button>
                        </div>
                        <span class="uat-label">Enhanced map features work (heat, regions)</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                      
                      <div class="uat-item">
                        <div class="uat-controls">
                          <button class="uat-pass" data-item="export-templates">✓</button>
                          <button class="uat-fail" data-item="export-templates">✗</button>
                        </div>
                        <span class="uat-label">Export templates function correctly</span>
                        <textarea class="uat-comment" placeholder="Comments (if failed)"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="uat-summary">
                  <div class="uat-stats">
                    <span id="uat-passed">0 Passed</span>
                    <span id="uat-failed">0 Failed</span>
                    <span id="uat-remaining">8 Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="feedback-modal-footer">
          <div class="feedback-actions">
            <button id="save-draft" class="btn btn-outline">Save Draft</button>
            <button id="submit-feedback" class="btn btn-primary">Submit Feedback</button>
            <button id="open-external-form" class="btn btn-secondary">Open Full Form</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  createStarRating(name, count) {
    return Array.from({length: count}, (_, i) => 
      `<span class="star" data-rating="${name}" data-value="${i + 1}">☆</span>`
    ).join('');
  }

  attachEventListeners() {
    // Feedback button clicks
    document.getElementById('feedback-button')?.addEventListener('click', () => {
      this.openFeedbackModal();
    });
    
    document.getElementById('uat-button')?.addEventListener('click', () => {
      this.openFeedbackModal('uat');
    });

    // Modal controls
    document.getElementById('close-feedback')?.addEventListener('click', () => {
      this.closeFeedbackModal();
    });

    document.querySelector('.feedback-modal-overlay')?.addEventListener('click', () => {
      this.closeFeedbackModal();
    });

    // Tab switching
    document.querySelectorAll('.feedback-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchFeedbackTab(e.target.dataset.tab);
      });
    });

    // Star ratings
    document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', (e) => {
        this.setStarRating(e.target.dataset.rating, e.target.dataset.value);
      });
      
      star.addEventListener('mouseover', (e) => {
        this.previewStarRating(e.target.dataset.rating, e.target.dataset.value);
      });
    });

    // UAT controls
    document.querySelectorAll('.uat-pass, .uat-fail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setUATResult(e.target.dataset.item, btn.classList.contains('uat-pass'));
      });
    });

    // Form submission
    document.getElementById('submit-feedback')?.addEventListener('click', () => {
      this.submitFeedback();
    });

    document.getElementById('save-draft')?.addEventListener('click', () => {
      this.saveFeedbackDraft();
    });

    document.getElementById('open-external-form')?.addEventListener('click', () => {
      this.openExternalForm();
    });

    // Auto-populate browser info
    this.populateTechnicalInfo();
  }

  openFeedbackModal(initialTab = 'quick') {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('active');
    this.isOpen = true;
    this.switchFeedbackTab(initialTab);
    
    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('active');
    this.isOpen = false;
  }

  switchFeedbackTab(tabName) {
    document.querySelectorAll('.feedback-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.feedback-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });
  }

  setStarRating(ratingName, value) {
    this.feedbackData.ratings[ratingName] = parseInt(value);
    this.updateStarDisplay(ratingName, value);
  }

  previewStarRating(ratingName, value) {
    this.updateStarDisplay(ratingName, value, true);
  }

  updateStarDisplay(ratingName, value, isPreview = false) {
    const stars = document.querySelectorAll(`[data-rating="${ratingName}"]`);
    stars.forEach((star, index) => {
      if (index < value) {
        star.textContent = '★';
        star.classList.add(isPreview ? 'preview' : 'selected');
      } else {
        star.textContent = '☆';
        star.classList.remove(isPreview ? 'preview' : 'selected');
      }
    });
  }

  setUATResult(itemName, passed) {
    if (!this.feedbackData.uat) {
      this.feedbackData.uat = {};
    }
    
    this.feedbackData.uat[itemName] = passed;
    
    // Update UI
    const item = document.querySelector(`[data-item="${itemName}"]`).closest('.uat-item');
    const passBtn = item.querySelector('.uat-pass');
    const failBtn = item.querySelector('.uat-fail');
    
    if (passed) {
      passBtn.classList.add('active');
      failBtn.classList.remove('active');
      item.classList.add('passed');
      item.classList.remove('failed');
    } else {
      failBtn.classList.add('active');
      passBtn.classList.remove('active');
      item.classList.add('failed');
      item.classList.remove('passed');
    }
    
    this.updateUATStats();
  }

  updateUATStats() {
    const results = Object.values(this.feedbackData.uat || {});
    const passed = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;
    const total = 8; // Total number of UAT items
    const remaining = total - results.length;
    
    document.getElementById('uat-passed').textContent = `${passed} Passed`;
    document.getElementById('uat-failed').textContent = `${failed} Failed`;
    document.getElementById('uat-remaining').textContent = `${remaining} Remaining`;
  }

  populateTechnicalInfo() {
    const browserInfo = `${navigator.userAgent}`;
    const currentUrl = window.location.href;
    
    document.getElementById('feedback-browser').value = browserInfo;
    document.getElementById('feedback-url').value = currentUrl;
  }

  collectFeedbackData() {
    const activeTab = document.querySelector('.feedback-tab-btn.active').dataset.tab;
    
    const feedbackData = {
      type: activeTab,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ratings: this.feedbackData.ratings,
      uat: this.feedbackData.uat
    };

    if (activeTab === 'quick') {
      feedbackData.comment = document.getElementById('quick-comment').value;
    } else if (activeTab === 'detailed') {
      feedbackData.category = document.getElementById('feedback-category').value;
      feedbackData.priority = document.getElementById('feedback-priority').value;
      feedbackData.title = document.getElementById('feedback-title').value;
      feedbackData.description = document.getElementById('feedback-description').value;
      feedbackData.includeScreenshot = document.getElementById('include-screenshot').checked;
    } else if (activeTab === 'uat') {
      feedbackData.uatComments = this.collectUATComments();
    }

    return feedbackData;
  }

  collectUATComments() {
    const comments = {};
    document.querySelectorAll('.uat-comment').forEach(textarea => {
      const item = textarea.closest('.uat-item');
      const itemName = item.querySelector('.uat-pass, .uat-fail').dataset.item;
      if (textarea.value.trim()) {
        comments[itemName] = textarea.value.trim();
      }
    });
    return comments;
  }

  async submitFeedback() {
    const feedbackData = this.collectFeedbackData();
    
    try {
      // Show loading state
      document.getElementById('submit-feedback').textContent = 'Submitting...';
      document.getElementById('submit-feedback').disabled = true;
      
      // Simulate API call (replace with actual endpoint)
      await this.sendFeedbackToAPI(feedbackData);
      
      // Show success message
      this.showFeedbackSuccess();
      
      // Close modal after delay
      setTimeout(() => {
        this.closeFeedbackModal();
        this.resetFeedbackForm();
      }, 2000);
      
    } catch (error) {
      console.error('Feedback submission error:', error);
      this.showFeedbackError();
    } finally {
      document.getElementById('submit-feedback').textContent = 'Submit Feedback';
      document.getElementById('submit-feedback').disabled = false;
    }
  }

  async sendFeedbackToAPI(data) {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Feedback submitted:', data);
        resolve();
      }, 1000);
    });
  }

  saveFeedbackDraft() {
    const feedbackData = this.collectFeedbackData();
    localStorage.setItem('client360_feedback_draft', JSON.stringify(feedbackData));
    this.showMessage('Draft saved successfully', 'success');
  }

  loadSavedFeedback() {
    try {
      const saved = localStorage.getItem('client360_feedback_draft');
      if (saved) {
        const data = JSON.parse(saved);
        // Restore form data
        Object.keys(data.ratings || {}).forEach(rating => {
          this.setStarRating(rating, data.ratings[rating]);
        });
        
        if (data.comment) {
          document.getElementById('quick-comment').value = data.comment;
        }
        
        // Show notification about saved draft
        this.showMessage('Restored saved draft', 'info');
      }
    } catch (e) {
      console.warn('Could not load saved feedback:', e);
    }
  }

  openExternalForm() {
    window.open(this.config.feedbackUrl, '_blank');
  }

  showFeedbackSuccess() {
    this.showMessage('Feedback submitted successfully! Thank you for your input.', 'success');
  }

  showFeedbackError() {
    this.showMessage('Failed to submit feedback. Please try again or use the external form.', 'error');
  }

  showMessage(message, type = 'info') {
    // Create or update message display
    let messageEl = document.querySelector('.feedback-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'feedback-message';
      document.querySelector('.feedback-modal-body').prepend(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `feedback-message ${type}`;
    
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  resetFeedbackForm() {
    // Reset all form elements
    document.querySelectorAll('.feedback-modal input, .feedback-modal textarea, .feedback-modal select').forEach(el => {
      if (el.type === 'checkbox') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });
    
    // Reset star ratings
    document.querySelectorAll('.star').forEach(star => {
      star.textContent = '☆';
      star.classList.remove('selected', 'preview');
    });
    
    // Reset UAT buttons
    document.querySelectorAll('.uat-pass, .uat-fail').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Clear feedback data
    this.feedbackData = {
      ratings: {},
      comments: [],
      issues: [],
      suggestions: []
    };
    
    // Remove saved draft
    localStorage.removeItem('client360_feedback_draft');
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.FeedbackSystem = FeedbackSystem;
}

export default FeedbackSystem;