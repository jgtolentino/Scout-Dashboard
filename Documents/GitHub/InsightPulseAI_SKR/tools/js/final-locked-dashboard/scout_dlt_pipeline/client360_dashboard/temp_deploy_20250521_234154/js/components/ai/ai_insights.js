/**
 * AI Insights Component - Client360 Dashboard
 * Implements PRD requirement 5.1 - AI-Powered Insights
 * 
 * This component displays AI-generated recommendations and insights
 * based on the store and brand data in the dashboard.
 */

// Initialize AI Insights component
function initializeAIInsightPanel() {
  console.log('Initializing AI Insights Panel');
  
  // Get references to dashboard sections
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Create AI Insights section if it doesn't exist
  if (!document.querySelector('.ai-insights-section')) {
    createAIInsightsSection(mainContent);
  }
  
  // Load AI insights data
  loadAIInsights();
}

// Create AI Insights section in the dashboard
function createAIInsightsSection(container) {
  const section = document.createElement('section');
  section.className = 'ai-insights-section';
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">AI-Powered Insights</h2>
      <div class="section-controls">
        <div class="insight-type-selector">
          <select id="insight-type-select">
            <option value="all">All Insights</option>
            <option value="sales">Sales Insights</option>
            <option value="brand">Brand Analysis</option>
            <option value="recommendations">Recommendations</option>
          </select>
        </div>
        <div class="data-badge ${window.isSimulatedData ? 'synthetic' : 'live'}">
          ${window.isSimulatedData ? 'Synthetic Data' : 'Live Data'}
        </div>
      </div>
    </div>
    <div class="insights-container">
      <div class="loading-indicator">Loading insights...</div>
    </div>
  `;
  
  // Insert before the rollback section if it exists
  const rollbackSection = container.querySelector('.rollback-dashboard');
  if (rollbackSection) {
    container.insertBefore(section, rollbackSection);
  } else {
    container.appendChild(section);
  }
  
  // Set up event listeners
  const typeSelector = section.querySelector('#insight-type-select');
  typeSelector.addEventListener('change', function() {
    filterInsightsByType(this.value);
  });
}

// Load AI insights data
function loadAIInsights() {
  const insightsContainer = document.querySelector('.insights-container');
  if (!insightsContainer) return;
  
  // Determine if we're using synthetic or live data
  const dataSource = window.isSimulatedData ? 'synthetic' : 'live';
  
  // Set the URL based on environment
  const insightsURL = `/data/ai/insights/all_insights_latest.json`;
  
  // Show loading indicator
  insightsContainer.innerHTML = '<div class="loading-indicator">Loading insights...</div>';
  
  // Fetch insights data
  fetch(insightsURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load insights data: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      renderInsights(data, insightsContainer);
    })
    .catch(error => {
      console.error('Error loading AI insights:', error);
      insightsContainer.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-text">
            <h4>Unable to load insights</h4>
            <p>Please check your connection and try again.</p>
          </div>
        </div>
      `;
    });
}

// Render insights in the container
function renderInsights(insights, container) {
  if (!insights || insights.length === 0) {
    container.innerHTML = '<p class="no-data-message">No insights available.</p>';
    return;
  }
  
  // Group insights by category
  const salesInsights = insights.filter(insight => insight.category === 'sales_insights');
  const brandInsights = insights.filter(insight => insight.category === 'brand_analysis');
  const recommendationInsights = insights.filter(insight => insight.category === 'store_recommendations');
  
  let html = '';
  
  // Add Sales Insights
  if (salesInsights.length > 0) {
    html += `
      <div class="insight-group" data-type="sales">
        <h3 class="insight-group-title">Sales Performance Insights</h3>
        <div class="insight-cards">
          ${renderInsightCards(salesInsights, 'sales')}
        </div>
      </div>
    `;
  }
  
  // Add Brand Analysis
  if (brandInsights.length > 0) {
    html += `
      <div class="insight-group" data-type="brand">
        <h3 class="insight-group-title">Brand Analysis</h3>
        <div class="insight-cards">
          ${renderInsightCards(brandInsights, 'brand')}
        </div>
      </div>
    `;
  }
  
  // Add Recommendations
  if (recommendationInsights.length > 0) {
    html += `
      <div class="insight-group" data-type="recommendations">
        <h3 class="insight-group-title">Strategic Recommendations</h3>
        <div class="insight-cards">
          ${renderInsightCards(recommendationInsights, 'recommendations')}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Add event listeners to insight cards
  const insightCards = container.querySelectorAll('.insight-card');
  insightCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // Only expand if the click was not on the button
      if (e.target.classList.contains('insight-expand-btn')) {
        const expanded = !e.target.closest('.insight-card').classList.contains('expanded');
        expandInsightCard(e.target.closest('.insight-card'), expanded);
        e.stopPropagation();
      } else if (!e.target.closest('.insight-details')) {
        expandInsightCard(this, !this.classList.contains('expanded'));
      }
    });
    
    // Add specific listener for expand button
    const expandBtn = card.querySelector('.insight-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', function(e) {
        const card = this.closest('.insight-card');
        expandInsightCard(card, !card.classList.contains('expanded'));
        e.stopPropagation();
      });
    }
  });
}

// Render individual insight cards
function renderInsightCards(insights, type) {
  return insights.map(insight => {
    // Determine priority class if available
    const priorityClass = insight.content && insight.content.priority 
      ? `priority-${insight.content.priority.toLowerCase()}` 
      : '';
    
    // Format the date
    const date = new Date(insight.GeneratedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `
      <div class="insight-card ${priorityClass}" data-id="${insight.InsightID}">
        <div class="insight-header">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</div>
        </div>
        <div class="insight-content">
          <p class="insight-summary">${insight.summary}</p>
          <div class="insight-details hidden">
            ${renderInsightDetails(insight, type)}
          </div>
        </div>
        <div class="insight-footer">
          <div class="insight-date">${formattedDate}</div>
          ${priorityClass ? `<div class="insight-priority">${insight.content.priority}</div>` : ''}
          <button class="insight-expand-btn">Details</button>
        </div>
      </div>
    `;
  }).join('');
}

// Render the detailed content for an insight
function renderInsightDetails(insight, type) {
  if (!insight.content) return '';
  
  let detailsHTML = '';
  
  switch (type) {
    case 'sales':
      // Sales insights details
      if (insight.content.details) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Key Findings</h4>
            <ul class="detail-list">
              ${insight.content.details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      if (insight.content.recommendations) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Recommendations</h4>
            <ul class="detail-list">
              ${insight.content.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      break;
      
    case 'brand':
      // Brand analysis details
      if (insight.content.sentiment_analysis) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Sentiment Analysis</h4>
            <div class="sentiment-score">
              <span>Overall Score: </span>
              <span class="score-value">${insight.content.sentiment_analysis.overall_score}</span>
            </div>
            <p>${insight.content.sentiment_analysis.interpretation || ''}</p>
          </div>
        `;
      }
      
      if (insight.content.recommendations) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Brand Recommendations</h4>
            <ul class="detail-list">
              ${insight.content.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      break;
      
    case 'recommendations':
      // Store recommendations details
      if (insight.content.store_assessment) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Store Assessment</h4>
            <div class="assessment-score">
              <span>Rating: </span>
              <span class="score-value">${insight.content.store_assessment.overall_rating}/10</span>
            </div>
            
            <div class="assessment-strengths">
              <h5>Strengths</h5>
              <ul>
                ${insight.content.store_assessment.strengths.map(str => `<li>${str}</li>`).join('')}
              </ul>
            </div>
            
            ${insight.content.store_assessment.weaknesses ? `
              <div class="assessment-weaknesses">
                <h5>Areas for Improvement</h5>
                <ul>
                  ${insight.content.store_assessment.weaknesses.map(weak => `<li>${weak}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      }
      
      if (insight.content.action_plan) {
        detailsHTML += `
          <div class="detail-section">
            <h4>Action Plan</h4>
            <ul class="action-steps">
              ${insight.content.action_plan.map(step => `
                <li class="action-step">
                  <div class="action-title">${step.action}</div>
                  <div class="action-timeline">Timeline: ${step.timeline}</div>
                  ${step.expected_outcome ? `<div class="action-outcome">Expected Outcome: ${step.expected_outcome}</div>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      break;
  }
  
  return detailsHTML || '<p>No additional details available.</p>';
}

// Expand or collapse an insight card
function expandInsightCard(card, shouldExpand) {
  const detailsSection = card.querySelector('.insight-details');
  const expandButton = card.querySelector('.insight-expand-btn');
  
  if (shouldExpand) {
    detailsSection.classList.remove('hidden');
    expandButton.textContent = 'Collapse';
    card.classList.add('expanded');
  } else {
    detailsSection.classList.add('hidden');
    expandButton.textContent = 'Details';
    card.classList.remove('expanded');
  }
}

// Filter insights by selected type
function filterInsightsByType(type) {
  const insightGroups = document.querySelectorAll('.insight-group');
  
  if (type === 'all') {
    insightGroups.forEach(group => group.style.display = 'block');
  } else {
    insightGroups.forEach(group => {
      if (group.dataset.type === type) {
        group.style.display = 'block';
      } else {
        group.style.display = 'none';
      }
    });
  }
}

// Set window.isSimulatedData if not already defined
if (typeof window.isSimulatedData === 'undefined') {
  window.isSimulatedData = true; // Default to simulated data
}

// Add to window initialization
window.addEventListener('DOMContentLoaded', function() {
  // Expose the function so it can be called from the main dashboard initialization
  window.initializeAIInsightPanel = initializeAIInsightPanel;
  
  // Auto-initialize if not called by the main dashboard.js
  setTimeout(function() {
    if (!document.querySelector('.ai-insights-section')) {
      initializeAIInsightPanel();
    }
  }, 500);
});