/**
 * PromptLab.js - Visual Prompt Engineering Editor
 * 
 * This component provides a visual interface for prompt engineering, including analysis,
 * improvement, and variation generation of prompts.
 */

class PromptLab {
  constructor(container) {
    this.container = container;
    this.apiEndpoints = {
      analyze: '/api/prompt_engineer/analyze',
      improve: '/api/prompt_engineer/improve',
      variations: '/api/prompt_engineer/variations',
      templates: '/api/system_prompts/search',
      export: '/api/prompt_engineer/export'
    };
    this.promptHistory = [];
    this.currentPrompt = '';
    this.activeTab = 'editor';
    
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    this.render();
    this.attachEventListeners();
    this.loadPromptHistory();
  }
  
  /**
   * Render the main editor layout
   */
  render() {
    this.container.innerHTML = `
      <div class="editor-layout">
        <div class="editor-sidebar">
          <div class="editor-header">
            <h3 class="editor-title">Prompt Tools</h3>
          </div>
          
          <div class="editor-content">
            <div class="tabs">
              <div class="tab active" data-tab="editor">Editor</div>
              <div class="tab" data-tab="templates">Templates</div>
              <div class="tab" data-tab="history">History</div>
            </div>
            
            <div class="tab-content" id="editorTabContent">
              <!-- Editor Tab Content -->
              <div class="editor-panel">
                <div class="editor-panel-header">Write Your Prompt</div>
                <div class="editor-panel-content">
                  <textarea id="promptTextarea" class="editor-textarea" placeholder="Enter your prompt here..."></textarea>
                  
                  <div class="form-group mt-4">
                    <label class="form-label">Character count: <span id="charCount">0</span></label>
                  </div>
                  
                  <div class="form-group mt-4">
                    <button id="analyzeBtn" class="btn btn-primary">Analyze Prompt</button>
                  </div>
                </div>
              </div>
              
              <div class="editor-panel">
                <div class="editor-panel-header">Improvement Options</div>
                <div class="editor-panel-content">
                  <div class="form-group">
                    <label class="form-label">Improvement Goals</label>
                    <div class="form-checkbox">
                      <input type="checkbox" id="goalClarity" checked>
                      <label for="goalClarity">Clarity</label>
                    </div>
                    <div class="form-checkbox">
                      <input type="checkbox" id="goalExamples" checked>
                      <label for="goalExamples">Examples</label>
                    </div>
                    <div class="form-checkbox">
                      <input type="checkbox" id="goalSpecificity" checked>
                      <label for="goalSpecificity">Specificity</label>
                    </div>
                  </div>
                  
                  <div class="form-group mt-4">
                    <button id="improveBtn" class="btn btn-primary">Improve Prompt</button>
                  </div>
                </div>
              </div>
              
              <div class="editor-panel">
                <div class="editor-panel-header">A/B Testing</div>
                <div class="editor-panel-content">
                  <div class="form-group">
                    <label class="form-label" for="variationCount">Number of Variations</label>
                    <select id="variationCount" class="form-select">
                      <option value="2">2 Variations</option>
                      <option value="3" selected>3 Variations</option>
                      <option value="4">4 Variations</option>
                      <option value="5">5 Variations</option>
                    </select>
                  </div>
                  
                  <div class="form-group mt-4">
                    <button id="generateVariationsBtn" class="btn btn-primary">Generate Variations</button>
                  </div>
                </div>
              </div>
              
              <div class="editor-panel">
                <div class="editor-panel-header">Export Options</div>
                <div class="editor-panel-content">
                  <div class="form-group">
                    <label class="form-label" for="exportFormat">Format</label>
                    <select id="exportFormat" class="form-select">
                      <option value="text">Plain Text</option>
                      <option value="json">JSON</option>
                      <option value="jsonl">JSONL</option>
                      <option value="langchain">LangChain</option>
                    </select>
                  </div>
                  
                  <div class="form-group mt-4">
                    <button id="exportBtn" class="btn btn-outline">Export Prompt</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="tab-content" id="templatesTabContent" style="display: none;">
              <!-- Templates Tab Content -->
              <div class="editor-panel">
                <div class="editor-panel-header">System Prompts Collection</div>
                <div class="editor-panel-content">
                  <div class="form-group">
                    <label class="form-label" for="templateSearch">Search Templates</label>
                    <input type="text" id="templateSearch" class="form-input" placeholder="Search by keyword...">
                  </div>
                  
                  <div class="form-group mt-4">
                    <label class="form-label" for="templateCategory">Filter by Category</label>
                    <select id="templateCategory" class="form-select">
                      <option value="">All Categories</option>
                      <option value="Cursor">Cursor</option>
                      <option value="FULL">FULL v0</option>
                      <option value="Manus">Manus</option>
                      <option value="Replit">Replit Agent</option>
                      <option value="Windsurf">Windsurf Agent</option>
                    </select>
                  </div>
                  
                  <div class="form-group mt-4">
                    <button id="searchTemplatesBtn" class="btn btn-primary">Search Templates</button>
                  </div>
                </div>
              </div>
              
              <div id="templateResults" class="cards-grid mt-4">
                <!-- Template results will be displayed here -->
                <div class="alert alert-info">
                  Search for system prompts to view results.
                </div>
              </div>
            </div>
            
            <div class="tab-content" id="historyTabContent" style="display: none;">
              <!-- History Tab Content -->
              <div class="editor-panel">
                <div class="editor-panel-header">Recent Prompts</div>
                <div class="editor-panel-content">
                  <div id="promptHistoryList">
                    <!-- Prompt history will be displayed here -->
                    <div class="alert alert-info">
                      No prompt history available yet.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="editor-main">
          <div class="editor-header">
            <h3 class="editor-title">Results</h3>
            <div class="editor-actions">
              <button id="clearResultsBtn" class="btn btn-outline">Clear Results</button>
            </div>
          </div>
          
          <div class="editor-content" id="resultsContainer">
            <!-- Results will be displayed here -->
            <div class="alert alert-info">
              Use the tools on the left to analyze, improve, or generate variations of your prompt.
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    // Tab switching
    const tabs = this.container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    // Character count
    const promptTextarea = document.getElementById('promptTextarea');
    promptTextarea.addEventListener('input', () => {
      this.updateCharCount();
      this.currentPrompt = promptTextarea.value;
    });
    
    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', () => {
      this.analyzePrompt();
    });
    
    // Improve button
    document.getElementById('improveBtn').addEventListener('click', () => {
      this.improvePrompt();
    });
    
    // Generate variations button
    document.getElementById('generateVariationsBtn').addEventListener('click', () => {
      this.generateVariations();
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportPrompt();
    });
    
    // Search templates button
    document.getElementById('searchTemplatesBtn').addEventListener('click', () => {
      this.searchTemplates();
    });
    
    // Clear results button
    document.getElementById('clearResultsBtn').addEventListener('click', () => {
      this.clearResults();
    });
  }
  
  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Update tab active states
    const tabs = this.container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content visibility
    document.getElementById('editorTabContent').style.display = tabName === 'editor' ? 'block' : 'none';
    document.getElementById('templatesTabContent').style.display = tabName === 'templates' ? 'block' : 'none';
    document.getElementById('historyTabContent').style.display = tabName === 'history' ? 'block' : 'none';
    
    // Load content for selected tab
    if (tabName === 'history') {
      this.displayPromptHistory();
    }
  }
  
  /**
   * Update character count
   */
  updateCharCount() {
    const promptTextarea = document.getElementById('promptTextarea');
    const charCount = document.getElementById('charCount');
    charCount.textContent = promptTextarea.value.length;
  }
  
  /**
   * Set loading state
   */
  setLoading(isLoading, containerId = 'resultsContainer') {
    const container = document.getElementById(containerId);
    
    if (isLoading) {
      container.innerHTML = `
        <div class="loader">
          <div class="loader-spinner"></div>
        </div>
      `;
    }
  }
  
  /**
   * Clear results container
   */
  clearResults() {
    document.getElementById('resultsContainer').innerHTML = `
      <div class="alert alert-info">
        Use the tools on the left to analyze, improve, or generate variations of your prompt.
      </div>
    `;
  }
  
  /**
   * Display error message
   */
  displayError(message, containerId = 'resultsContainer') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="alert alert-error">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }
  
  /**
   * Add prompt to history
   */
  addToHistory(prompt, type) {
    const timestamp = new Date().toISOString();
    const historyItem = {
      id: `prompt_${Date.now()}`,
      prompt,
      type,
      timestamp
    };
    
    this.promptHistory.unshift(historyItem);
    
    // Keep only the last 50 items
    if (this.promptHistory.length > 50) {
      this.promptHistory = this.promptHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('pulserPromptHistory', JSON.stringify(this.promptHistory));
  }
  
  /**
   * Load prompt history from localStorage
   */
  loadPromptHistory() {
    try {
      const history = localStorage.getItem('pulserPromptHistory');
      if (history) {
        this.promptHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Error loading prompt history:', error);
      this.promptHistory = [];
    }
  }
  
  /**
   * Display prompt history
   */
  displayPromptHistory() {
    const historyList = document.getElementById('promptHistoryList');
    
    if (this.promptHistory.length === 0) {
      historyList.innerHTML = `
        <div class="alert alert-info">
          No prompt history available yet.
        </div>
      `;
      return;
    }
    
    let html = '';
    
    this.promptHistory.forEach(item => {
      const date = new Date(item.timestamp).toLocaleString();
      const typeBadge = this.getTypeBadge(item.type);
      const promptPreview = item.prompt.length > 50 ? 
        `${item.prompt.substring(0, 50)}...` : item.prompt;
      
      html += `
        <div class="editor-panel mb-4">
          <div class="editor-panel-header">
            <div class="flex items-center gap-2">
              ${typeBadge}
              <span>${date}</span>
            </div>
          </div>
          <div class="editor-panel-content">
            <p>${promptPreview}</p>
            <div class="flex justify-between mt-4">
              <button class="btn btn-outline" data-prompt-id="${item.id}" data-action="load">
                Load
              </button>
              <button class="btn btn-outline" data-prompt-id="${item.id}" data-action="delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    historyList.innerHTML = html;
    
    // Add event listeners to history buttons
    const historyButtons = historyList.querySelectorAll('button');
    historyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const promptId = button.dataset.promptId;
        const action = button.dataset.action;
        
        if (action === 'load') {
          this.loadPromptFromHistory(promptId);
        } else if (action === 'delete') {
          this.deletePromptFromHistory(promptId);
        }
      });
    });
  }
  
  /**
   * Get badge HTML for history item type
   */
  getTypeBadge(type) {
    let badgeClass = '';
    
    switch (type) {
      case 'analyze':
        badgeClass = 'badge-blue';
        break;
      case 'improve':
        badgeClass = 'badge-green';
        break;
      case 'variations':
        badgeClass = 'badge-purple';
        break;
      default:
        badgeClass = 'badge-yellow';
    }
    
    return `<span class="badge ${badgeClass}">${type}</span>`;
  }
  
  /**
   * Load prompt from history
   */
  loadPromptFromHistory(promptId) {
    const item = this.promptHistory.find(p => p.id === promptId);
    
    if (item) {
      document.getElementById('promptTextarea').value = item.prompt;
      this.currentPrompt = item.prompt;
      this.updateCharCount();
      this.switchTab('editor');
    }
  }
  
  /**
   * Delete prompt from history
   */
  deletePromptFromHistory(promptId) {
    this.promptHistory = this.promptHistory.filter(p => p.id !== promptId);
    localStorage.setItem('pulserPromptHistory', JSON.stringify(this.promptHistory));
    this.displayPromptHistory();
  }
  
  /**
   * Analyze the current prompt
   */
  async analyzePrompt() {
    const promptText = document.getElementById('promptTextarea').value.trim();
    
    if (!promptText) {
      this.displayError('Please enter a prompt to analyze.');
      return;
    }
    
    this.setLoading(true);
    
    try {
      const response = await fetch(this.apiEndpoints.analyze, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze prompt: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to analyze prompt');
      }
      
      this.displayAnalysisResults(data.analysis, promptText);
      this.addToHistory(promptText, 'analyze');
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      this.displayError(error.message);
    }
  }
  
  /**
   * Display analysis results
   */
  displayAnalysisResults(analysis, promptText) {
    const container = document.getElementById('resultsContainer');
    
    let html = `
      <div class="editor-panel">
        <div class="editor-panel-header">
          <div class="flex items-center justify-between">
            <span>Prompt Analysis</span>
            <span>${analysis.wordCount} words / ${analysis.characters} chars</span>
          </div>
        </div>
        <div class="editor-panel-content">
          <h4 class="mb-4">Original Prompt:</h4>
          <div class="editor-panel mb-6">
            <div class="editor-panel-content">
              <pre>${promptText}</pre>
            </div>
          </div>
    `;
    
    // Strengths
    if (analysis.strengths && analysis.strengths.length > 0) {
      html += `
        <h4 class="mb-4">Strengths:</h4>
        <ul class="mb-6">
      `;
      
      analysis.strengths.forEach(strength => {
        html += `<li>${strength}</li>`;
      });
      
      html += `</ul>`;
    }
    
    // Weaknesses
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      html += `
        <h4 class="mb-4">Weaknesses:</h4>
        <ul class="mb-6">
      `;
      
      analysis.weaknesses.forEach(weakness => {
        html += `<li>${weakness}</li>`;
      });
      
      html += `</ul>`;
    }
    
    // Suggestions
    if (analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0) {
      html += `
        <h4 class="mb-4">Improvement Suggestions:</h4>
        <ul class="mb-6">
      `;
      
      analysis.improvementSuggestions.forEach(suggestion => {
        html += `<li>${suggestion}</li>`;
      });
      
      html += `</ul>`;
    }
    
    html += `
          <div class="flex justify-between mt-4">
            <button id="improveFromAnalysis" class="btn btn-primary">Improve This Prompt</button>
            <button id="exportAnalysisBtn" class="btn btn-outline">Export Analysis</button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners to buttons
    document.getElementById('improveFromAnalysis').addEventListener('click', () => {
      this.improvePrompt();
    });
    
    document.getElementById('exportAnalysisBtn').addEventListener('click', () => {
      this.exportAnalysis(analysis, promptText);
    });
  }
  
  /**
   * Improve the current prompt
   */
  async improvePrompt() {
    const promptText = document.getElementById('promptTextarea').value.trim();
    
    if (!promptText) {
      this.displayError('Please enter a prompt to improve.');
      return;
    }
    
    // Get selected goals
    const goals = [];
    if (document.getElementById('goalClarity').checked) goals.push('clarity');
    if (document.getElementById('goalExamples').checked) goals.push('examples');
    if (document.getElementById('goalSpecificity').checked) goals.push('specificity');
    
    if (goals.length === 0) {
      this.displayError('Please select at least one improvement goal.');
      return;
    }
    
    this.setLoading(true);
    
    try {
      const response = await fetch(this.apiEndpoints.improve, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          goals: goals
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to improve prompt: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to improve prompt');
      }
      
      this.displayImprovedPrompt(data.result, promptText, goals);
      this.addToHistory(promptText, 'improve');
    } catch (error) {
      console.error('Error improving prompt:', error);
      this.displayError(error.message);
    }
  }
  
  /**
   * Display improved prompt
   */
  displayImprovedPrompt(result, originalPrompt, goals) {
    const container = document.getElementById('resultsContainer');
    
    let html = `
      <div class="editor-panel">
        <div class="editor-panel-header">
          <div class="flex items-center justify-between">
            <span>Improved Prompt</span>
            <div>
              ${goals.map(goal => `<span class="badge badge-blue">${goal}</span>`).join(' ')}
            </div>
          </div>
        </div>
        <div class="editor-panel-content">
          <div class="flex items-center justify-between mb-4">
            <h4>Original Prompt:</h4>
            <button class="btn btn-outline" id="useOriginalBtn">Use This</button>
          </div>
          <div class="editor-panel mb-6">
            <div class="editor-panel-content">
              <pre>${originalPrompt}</pre>
            </div>
          </div>
          
          <div class="flex items-center justify-between mb-4">
            <h4>Improved Prompt:</h4>
            <button class="btn btn-primary" id="useImprovedBtn">Use This</button>
          </div>
          <div class="editor-panel mb-6">
            <div class="editor-panel-content">
              <pre>${result.improvedPrompt}</pre>
            </div>
          </div>
    `;
    
    // Changes made
    if (result.changes && result.changes.length > 0) {
      html += `
        <h4 class="mb-4">Changes Made:</h4>
        <ul class="mb-6">
      `;
      
      result.changes.forEach(change => {
        html += `<li>${change}</li>`;
      });
      
      html += `</ul>`;
    }
    
    // Example prompts used
    if (result.examplePromptsUsed && result.examplePromptsUsed.length > 0) {
      html += `
        <h4 class="mb-4">Example Prompts Referenced:</h4>
        <ul class="mb-6">
      `;
      
      result.examplePromptsUsed.forEach(example => {
        html += `<li>${example}</li>`;
      });
      
      html += `</ul>`;
    }
    
    html += `
          <div class="flex justify-between mt-4">
            <button id="generateVariationsFromImproved" class="btn btn-primary">Generate Variations</button>
            <button id="exportImprovedBtn" class="btn btn-outline">Export Results</button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners to buttons
    document.getElementById('useOriginalBtn').addEventListener('click', () => {
      document.getElementById('promptTextarea').value = originalPrompt;
      this.updateCharCount();
    });
    
    document.getElementById('useImprovedBtn').addEventListener('click', () => {
      document.getElementById('promptTextarea').value = result.improvedPrompt;
      this.updateCharCount();
    });
    
    document.getElementById('generateVariationsFromImproved').addEventListener('click', () => {
      document.getElementById('promptTextarea').value = result.improvedPrompt;
      this.updateCharCount();
      this.generateVariations();
    });
    
    document.getElementById('exportImprovedBtn').addEventListener('click', () => {
      this.exportImprovedPrompt(result, originalPrompt);
    });
  }
  
  /**
   * Generate variations of the current prompt
   */
  async generateVariations() {
    const promptText = document.getElementById('promptTextarea').value.trim();
    
    if (!promptText) {
      this.displayError('Please enter a prompt to generate variations.');
      return;
    }
    
    const count = parseInt(document.getElementById('variationCount').value);
    
    this.setLoading(true);
    
    try {
      const response = await fetch(this.apiEndpoints.variations, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          count: count
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate variations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate variations');
      }
      
      this.displayVariations(data.result, promptText);
      this.addToHistory(promptText, 'variations');
    } catch (error) {
      console.error('Error generating variations:', error);
      this.displayError(error.message);
    }
  }
  
  /**
   * Display prompt variations
   */
  displayVariations(result, originalPrompt) {
    const container = document.getElementById('resultsContainer');
    
    let html = `
      <div class="editor-panel">
        <div class="editor-panel-header">
          <div class="flex items-center justify-between">
            <span>Prompt Variations</span>
            <span>${result.variations.length} variations</span>
          </div>
        </div>
        <div class="editor-panel-content">
          <div class="flex items-center justify-between mb-4">
            <h4>Original Prompt:</h4>
            <button class="btn btn-outline" id="useOriginalBtn">Use This</button>
          </div>
          <div class="editor-panel mb-6">
            <div class="editor-panel-content">
              <pre>${originalPrompt}</pre>
            </div>
          </div>
          
          <h4 class="mb-4">Variations:</h4>
          <div class="ab-test-grid">
    `;
    
    result.variations.forEach((variation, index) => {
      html += `
        <div class="ab-test-variant">
          <div class="ab-test-header">
            <span class="ab-test-title">Variation ${index + 1}: ${variation.name}</span>
            <button class="btn btn-outline" data-variation="${index}">Use</button>
          </div>
          <div class="ab-test-content">
            <pre>${variation.prompt}</pre>
          </div>
          <div class="ab-test-footer">
            <span>Focus: ${variation.focus}</span>
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
          
          <div class="flex justify-between mt-4">
            <button id="exportVariationsBtn" class="btn btn-outline">Export Variations</button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners to buttons
    document.getElementById('useOriginalBtn').addEventListener('click', () => {
      document.getElementById('promptTextarea').value = originalPrompt;
      this.updateCharCount();
    });
    
    const variationButtons = container.querySelectorAll('button[data-variation]');
    variationButtons.forEach(button => {
      button.addEventListener('click', () => {
        const variationIndex = parseInt(button.dataset.variation);
        document.getElementById('promptTextarea').value = result.variations[variationIndex].prompt;
        this.updateCharCount();
      });
    });
    
    document.getElementById('exportVariationsBtn').addEventListener('click', () => {
      this.exportVariations(result, originalPrompt);
    });
  }
  
  /**
   * Search system prompt templates
   */
  async searchTemplates() {
    const searchQuery = document.getElementById('templateSearch').value.trim();
    const category = document.getElementById('templateCategory').value;
    
    this.setLoading(true, 'templateResults');
    
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('query', searchQuery);
      if (category) queryParams.append('category', category);
      
      const response = await fetch(`${this.apiEndpoints.templates}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search templates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to search templates');
      }
      
      this.displayTemplateResults(data.results);
    } catch (error) {
      console.error('Error searching templates:', error);
      this.displayError(error.message, 'templateResults');
    }
  }
  
  /**
   * Display template search results
   */
  displayTemplateResults(results) {
    const container = document.getElementById('templateResults');
    
    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          No templates found matching your criteria.
        </div>
      `;
      return;
    }
    
    let html = '';
    
    results.forEach(template => {
      const tags = template.tags && template.tags.length > 0 ? 
        template.tags.map(tag => `<span class="badge badge-blue">${tag}</span>`).join(' ') :
        '';
      
      html += `
        <div class="card">
          <div class="card-header">
            ${template.name}
          </div>
          <div class="card-content">
            <p>${template.preview}</p>
            <div class="mt-4">
              ${tags}
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-outline" data-view-path="${template.path}">View</button>
            <button class="btn btn-primary" data-use-path="${template.path}">Use As Base</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to template buttons
    const viewButtons = container.querySelectorAll('button[data-view-path]');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.viewTemplate(button.dataset.viewPath);
      });
    });
    
    const useButtons = container.querySelectorAll('button[data-use-path]');
    useButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.useTemplate(button.dataset.usePath);
      });
    });
  }
  
  /**
   * View a template
   */
  async viewTemplate(path) {
    this.setLoading(true, 'resultsContainer');
    this.switchTab('editor');
    
    try {
      const response = await fetch(`${this.apiEndpoints.templates}/view?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to view template: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to view template');
      }
      
      this.displayTemplateContent(data.content, path);
    } catch (error) {
      console.error('Error viewing template:', error);
      this.displayError(error.message);
    }
  }
  
  /**
   * Display template content
   */
  displayTemplateContent(content, path) {
    const container = document.getElementById('resultsContainer');
    
    const html = `
      <div class="editor-panel">
        <div class="editor-panel-header">
          <div class="flex items-center justify-between">
            <span>System Prompt Template</span>
            <span>${path.split('/').pop()}</span>
          </div>
        </div>
        <div class="editor-panel-content">
          <pre style="white-space: pre-wrap; max-height: 500px; overflow-y: auto;">${content}</pre>
          
          <div class="flex justify-between mt-4">
            <button id="useTemplateBtn" class="btn btn-primary">Use This Template</button>
            <button id="exportTemplateBtn" class="btn btn-outline">Export Template</button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners to buttons
    document.getElementById('useTemplateBtn').addEventListener('click', () => {
      document.getElementById('promptTextarea').value = content;
      this.updateCharCount();
    });
    
    document.getElementById('exportTemplateBtn').addEventListener('click', () => {
      this.exportTemplateContent(content, path);
    });
  }
  
  /**
   * Use a template as base prompt
   */
  async useTemplate(path) {
    try {
      const response = await fetch(`${this.apiEndpoints.templates}/view?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load template');
      }
      
      document.getElementById('promptTextarea').value = data.content;
      this.updateCharCount();
      this.switchTab('editor');
    } catch (error) {
      console.error('Error loading template:', error);
      this.displayError(error.message);
    }
  }
  
  /**
   * Export the current prompt
   */
  exportPrompt() {
    const promptText = document.getElementById('promptTextarea').value.trim();
    
    if (!promptText) {
      this.displayError('Please enter a prompt to export.');
      return;
    }
    
    const format = document.getElementById('exportFormat').value;
    let exportData = '';
    let filename = `prompt_${Date.now()}`;
    let mimeType = 'text/plain';
    
    switch (format) {
      case 'text':
        exportData = promptText;
        filename += '.txt';
        break;
        
      case 'json':
        exportData = JSON.stringify({
          prompt: promptText,
          metadata: {
            exported_at: new Date().toISOString(),
            character_count: promptText.length,
            word_count: promptText.split(/\s+/).filter(Boolean).length,
            format: 'json'
          }
        }, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
        
      case 'jsonl':
        exportData = JSON.stringify({
          prompt: promptText,
          exported_at: new Date().toISOString()
        });
        filename += '.jsonl';
        mimeType = 'application/jsonl';
        break;
        
      case 'langchain':
        exportData = `from langchain.prompts import PromptTemplate

prompt_template = """${promptText}"""

prompt = PromptTemplate.from_template(prompt_template)

# Example usage:
# result = prompt.format(variable1="value1", variable2="value2")
`;
        filename += '.py';
        mimeType = 'text/plain';
        break;
    }
    
    this.downloadFile(exportData, filename, mimeType);
  }
  
  /**
   * Export analysis results
   */
  exportAnalysis(analysis, promptText) {
    const exportData = JSON.stringify({
      prompt: promptText,
      analysis: analysis,
      metadata: {
        exported_at: new Date().toISOString(),
        format: 'json'
      }
    }, null, 2);
    
    this.downloadFile(exportData, `prompt_analysis_${Date.now()}.json`, 'application/json');
  }
  
  /**
   * Export improved prompt results
   */
  exportImprovedPrompt(result, originalPrompt) {
    const exportData = JSON.stringify({
      original_prompt: originalPrompt,
      improved_prompt: result.improvedPrompt,
      changes: result.changes,
      example_prompts_used: result.examplePromptsUsed,
      metadata: {
        exported_at: new Date().toISOString(),
        format: 'json'
      }
    }, null, 2);
    
    this.downloadFile(exportData, `improved_prompt_${Date.now()}.json`, 'application/json');
  }
  
  /**
   * Export variations
   */
  exportVariations(result, originalPrompt) {
    const exportData = JSON.stringify({
      original_prompt: originalPrompt,
      variations: result.variations,
      metadata: {
        exported_at: new Date().toISOString(),
        format: 'json'
      }
    }, null, 2);
    
    this.downloadFile(exportData, `prompt_variations_${Date.now()}.json`, 'application/json');
  }
  
  /**
   * Export template content
   */
  exportTemplateContent(content, path) {
    const filename = path.split('/').pop() || `template_${Date.now()}.txt`;
    this.downloadFile(content, filename, 'text/plain');
  }
  
  /**
   * Download a file
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export the component
window.PromptLab = PromptLab;