/**
 * Unified GenAI Insights Integration
 * Enhances SQL analytics with GenAI-powered insights for Scout Advanced Analytics
 * 
 * @version 2.2.1
 * @license MIT
 */

const UnifiedGenAI = (function() {
  // -----------------------------
  // Module configuration
  // -----------------------------
  const config = {
    apiEndpoint: '../assets/data/insights_data.json',
    insightsContainer: '.insights-grid',
    refreshButtonSelector: '[data-refresh-insights]', // Use data attribute instead of icon
    refreshInterval: 300000, // 5 minutes
    maxDisplayedInsights: 6,
    confidenceThreshold: 0.7,
    minInsightsToShow: 3, // Minimum number of insights to show
    fallbackConfidenceThreshold: 0.5 // Lower threshold for fallback insights if needed
  };
  
  // -----------------------------
  // Module state
  // -----------------------------
  let state = {
    insights: [],
    metadata: {},
    cachedElements: {}, // For storing DOM references
    refreshTimer: null
  };
  
  // -----------------------------
  // Core functions
  // -----------------------------
  
  // Initialize the module
  function init() {
    console.log('Unified GenAI v2.2.1 initializing...');
    
    // Cache DOM elements for better performance
    cacheElements();
    
    // Load initial insights data
    loadInsightsData();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Clear any existing refresh interval to prevent multiple timers
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
    }
    
    // Set up refresh interval
    if (config.refreshInterval > 0) {
      state.refreshTimer = setInterval(loadInsightsData, config.refreshInterval);
    }
    
    // Enhance existing insight elements
    enhanceExistingInsights();
    
    // Return true to indicate successful initialization
    return true;
  }
  
  // Cache DOM elements for better performance
  function cacheElements() {
    // Cache the insights container
    state.cachedElements.container = document.querySelector(config.insightsContainer);
    
    // Cache the refresh button if it exists
    const refreshButton = document.querySelector(config.refreshButtonSelector) || 
                         document.querySelector('.header-btn .fa-sync-alt')?.closest('button');
    
    if (refreshButton) {
      state.cachedElements.refreshButton = refreshButton;
      // Add a data attribute for more reliable selection in the future
      refreshButton.setAttribute('data-refresh-insights', 'true');
    }
    
    // Cache filter dropdown and items if they exist
    state.cachedElements.filterDropdown = document.getElementById('insightFilterDropdown');
    state.cachedElements.filterItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
    
    // Cache the dark mode toggle if it exists
    state.cachedElements.darkModeToggle = document.getElementById('darkModeToggle');
  }
  
  // Set up all event handlers
  function setupEventHandlers() {
    // Set up filter dropdown handlers
    setupFilterHandlers();
    
    // Set up refresh button handler
    setupRefreshHandler();
    
    // Set up dark mode detection and handling
    setupThemeHandler();
    
    // Listen for SQL data visualization events
    document.addEventListener('sql-data-rendered', enhanceWithGenAIInsights);
  }
  
  // -----------------------------
  // Data loading functions
  // -----------------------------
  
  // Load insights data from API endpoint
  function loadInsightsData() {
    console.log('Loading insights data from:', config.apiEndpoint);
    
    fetch(config.apiEndpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Received insights data:', data);
        state.insights = data.insights || [];
        state.metadata = data.metadata || {};
        renderInsights(state.insights);
        updateDashboardMetadata(state.metadata);
        
        // Dispatch event that data was loaded
        window.dispatchEvent(new CustomEvent('insights-data-loaded', {
          detail: {
            count: state.insights.length,
            types: getAvailableInsightTypes(),
            timestamp: new Date()
          }
        }));
      })
      .catch(error => {
        console.error('Error fetching insights:', error);
        useFallbackInsights();
      });
  }
  
  // Use fallback insights if API fails
  function useFallbackInsights() {
    console.log('Using fallback insights data');
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    const fallbackData = {
      metadata: {
        generated_at: currentDate.toISOString(),
        time_period: 'Last 30 days',
        model: 'retail-advisor-gpt-fallback',
        insights_count: 6
      },
      insights: [
        {
          id: 'fallback-001',
          type: 'general',
          title: 'Increasing focus on value meals across all demographics',
          text: 'Analysis of customer data shows increased interest in value options across all age groups and income levels, especially in urban locations.',
          confidence: 0.92,
          brands: ['Brand A', 'Brand B', 'Brand C'],
          tags: ['pricing', 'value', 'economy', 'family'],
          date: formattedDate
        },
        {
          id: 'fallback-002',
          type: 'brand',
          title: 'Brand loyalty stronger for customers using rewards programs',
          text: 'Customer retention is significantly higher when enrolled in loyalty programs, with 23% longer customer lifetime value observed.',
          confidence: 0.89,
          brands: ['Brand A', 'Brand C'],
          tags: ['loyalty', 'rewards', 'app', 'repeat'],
          date: formattedDate
        },
        {
          id: 'fallback-003',
          type: 'trend',
          title: 'Weekend traffic peaks 2 hours earlier than historical average',
          text: 'Store visit patterns show peak shopping times shifting earlier on weekends, suggesting changing consumer behavior worth adjusting staffing for.',
          confidence: 0.78,
          brands: [],
          tags: ['traffic', 'staffing', 'weekends'],
          date: formattedDate
        },
        {
          id: 'fallback-004',
          type: 'sentiment',
          title: 'Positive sentiment for rebranded packaging across social channels',
          text: 'Social media analysis shows 83% positive response to new eco-friendly packaging, with 47% more user-generated content featuring products.',
          confidence: 0.76,
          brands: ['Brand B'],
          tags: ['packaging', 'eco-friendly', 'social'],
          date: formattedDate
        },
        {
          id: 'fallback-005',
          type: 'general',
          title: 'Mobile app users show 34% higher repeat purchase rate',
          text: 'Analysis reveals significantly higher customer loyalty metrics for mobile app users compared to non-app customers across all store types.',
          confidence: 0.85,
          brands: [],
          tags: ['mobile', 'digital', 'retention'],
          date: formattedDate
        },
        {
          id: 'fallback-006',
          type: 'trend',
          title: 'Bundle promotions generating 23% higher average transaction value',
          text: 'Product bundle strategy showing strong impact on basket size, particularly when combining core products with seasonal items.',
          confidence: 0.87,
          brands: ['All Brands'],
          tags: ['bundles', 'promotions', 'basket-size'],
          date: formattedDate
        }
      ]
    };
    
    state.insights = fallbackData.insights;
    state.metadata = fallbackData.metadata;
    
    renderInsights(state.insights);
    updateDashboardMetadata(state.metadata);
  }
  
  // Get available insight types from the data
  function getAvailableInsightTypes() {
    if (!state.insights || state.insights.length === 0) return [];
    
    // Extract unique insight types from the data
    const typeSet = new Set();
    state.insights.forEach(insight => {
      if (insight.type) {
        typeSet.add(insight.type);
      }
    });
    
    return Array.from(typeSet);
  }
  
  // -----------------------------
  // Rendering functions
  // -----------------------------
  
  // Render insights into the insights container
  function renderInsights(insights, filter) {
    const container = state.cachedElements.container || document.querySelector(config.insightsContainer);
    if (!container) {
      console.error('Insights container not found:', config.insightsContainer);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // If we have no insights at all, show empty state
    if (!insights || insights.length === 0) {
      renderEmptyState(container, filter, 'No insights available');
      return;
    }
    
    // Filter insights if specified
    let filteredInsights = insights;
    if (filter && filter !== 'all') {
      filteredInsights = insights.filter(insight => insight.type === filter);
    }
    
    // Apply confidence threshold
    let highConfidenceInsights = filteredInsights.filter(insight => 
      insight.confidence >= config.confidenceThreshold
    );
    
    // If we don't have enough high-confidence insights, fall back to lower confidence ones
    let displayInsights = highConfidenceInsights;
    if (highConfidenceInsights.length < config.minInsightsToShow) {
      const lowerConfidenceInsights = filteredInsights.filter(insight => 
        insight.confidence >= config.fallbackConfidenceThreshold && 
        insight.confidence < config.confidenceThreshold
      );
      
      // Add enough lower confidence insights to reach the minimum
      const neededCount = Math.min(
        config.minInsightsToShow - highConfidenceInsights.length, 
        lowerConfidenceInsights.length
      );
      
      if (neededCount > 0) {
        const extraInsights = lowerConfidenceInsights
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, neededCount);
        
        displayInsights = [...highConfidenceInsights, ...extraInsights];
      }
    }
    
    // Sort by confidence score (descending)
    displayInsights.sort((a, b) => b.confidence - a.confidence);
    
    // Limit to maximum number of insights
    displayInsights = displayInsights.slice(0, config.maxDisplayedInsights);
    
    // Render each insight
    if (displayInsights.length === 0) {
      renderEmptyState(container, filter, `No ${filter || ''} insights available`);
    } else {
      const fragment = document.createDocumentFragment();
      
      displayInsights.forEach(insight => {
        const card = createInsightCard(insight);
        fragment.appendChild(card);
      });
      
      container.appendChild(fragment);
    }
    
    // Dispatch event that insights were rendered
    window.dispatchEvent(new CustomEvent('insights-rendered', {
      detail: {
        count: displayInsights.length,
        total: filteredInsights.length,
        filter: filter || 'all',
        timestamp: new Date()
      }
    }));
  }
  
  // Create an insight card element
  function createInsightCard(insight) {
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.setAttribute('data-insight-id', insight.id);
    card.setAttribute('data-insight-type', insight.type);
    
    const confidenceLevel = getConfidenceLevel(insight.confidence);
    
    // Create card header
    const header = document.createElement('div');
    header.className = 'insight-header';
    
    // Create type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `insight-type-badge ${insight.type}`;
    typeBadge.textContent = capitalizeFirstLetter(insight.type);
    header.appendChild(typeBadge);
    
    // Create confidence badge
    const confidenceBadge = document.createElement('span');
    confidenceBadge.className = `confidence-badge confidence-${confidenceLevel}`;
    confidenceBadge.textContent = `${Math.round(insight.confidence * 100)}% confidence`;
    header.appendChild(confidenceBadge);
    
    // Create card body
    const body = document.createElement('div');
    body.className = 'insight-body';
    
    // Create title
    const title = document.createElement('h4');
    title.textContent = insight.title;
    body.appendChild(title);
    
    // Create text
    const text = document.createElement('p');
    text.textContent = insight.text;
    body.appendChild(text);
    
    // Add tags if present
    if (insight.tags && insight.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'mt-3';
      
      insight.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'insight-tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      
      body.appendChild(tagsDiv);
    }
    
    // Add brands if present
    if (insight.brands && insight.brands.length > 0) {
      const brandsDiv = document.createElement('div');
      brandsDiv.className = 'mt-2';
      
      insight.brands.forEach(brand => {
        const brandSpan = document.createElement('span');
        brandSpan.className = 'brand-tag';
        brandSpan.textContent = brand;
        brandsDiv.appendChild(brandSpan);
      });
      
      body.appendChild(brandsDiv);
    }
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'insight-footer';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-robot';
    footer.appendChild(icon);
    
    const footerText = document.createTextNode(` Generated by AI • ${formatDate(insight.date)}`);
    footer.appendChild(footerText);
    
    // Assemble card
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    
    return card;
  }
  
  // Render empty state when no insights match filter
  function renderEmptyState(container, filter, message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state-container';
    
    const emptyStateInner = document.createElement('div');
    emptyStateInner.className = 'empty-state';
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-filter-circle-xmark';
    emptyStateInner.appendChild(icon);
    
    // Add heading
    const heading = document.createElement('h5');
    heading.textContent = message || `No ${filter || ''} insights available`;
    emptyStateInner.appendChild(heading);
    
    // Add text
    const text = document.createElement('p');
    text.textContent = 'Try adjusting your filters or check back later for new insights.';
    emptyStateInner.appendChild(text);
    
    // Add reset button if filter is active
    if (filter && filter !== 'all') {
      const resetButton = document.createElement('button');
      resetButton.className = 'btn btn-outline-primary btn-sm';
      resetButton.textContent = 'Reset Filter';
      resetButton.dataset.action = 'reset-filter'; // Use data attribute instead of class
      
      resetButton.addEventListener('click', () => {
        if (state.cachedElements.filterDropdown) {
          state.cachedElements.filterDropdown.innerHTML = '<i class="fas fa-filter me-1"></i> All Insights';
        }
        renderInsights(state.insights);
      });
      
      emptyStateInner.appendChild(resetButton);
    }
    
    emptyState.appendChild(emptyStateInner);
    container.appendChild(emptyState);
  }
  
  // Enhance SQL data visualization with GenAI insights
  function enhanceWithGenAIInsights(event) {
    if (!event.detail || !event.detail.reportType) {
      console.warn('Missing report type in SQL data event');
      return;
    }
    
    const reportType = event.detail.reportType;
    const reportContainer = document.querySelector('.report-summary');
    
    if (!reportContainer) {
      console.warn('Report summary container not found');
      return;
    }
    
    // Add unified GenAI badge to the insights summary
    const summaryTitle = reportContainer.querySelector('h4');
    if (summaryTitle && !summaryTitle.querySelector('.genai-badge')) {
      const badge = document.createElement('span');
      badge.className = 'genai-badge';
      badge.textContent = 'Unified GenAI';
      summaryTitle.appendChild(badge);
    }
    
    // Generate relevant insights for this report type
    const relevantInsights = generateContextualInsights(reportType, event.detail.data);
    
    // Add GenAI insights section if it doesn't exist
    let insightsSection = reportContainer.querySelector('.genai-insights-section');
    if (!insightsSection) {
      insightsSection = document.createElement('div');
      insightsSection.className = 'genai-insights-section mt-4';
      reportContainer.appendChild(insightsSection);
    }
    
    // Clear existing insights
    insightsSection.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'insights-header';
    
    const heading = document.createElement('h5');
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-lightbulb text-warning me-2';
    heading.appendChild(icon);
    
    const headingText = document.createTextNode('AI-Powered Insights');
    heading.appendChild(headingText);
    
    header.appendChild(heading);
    insightsSection.appendChild(header);
    
    // Add insights using a document fragment for performance
    const fragment = document.createDocumentFragment();
    
    relevantInsights.forEach(insight => {
      const insightElement = document.createElement('div');
      insightElement.className = 'sql-insight-item';
      
      // Create content div with insight text
      const contentDiv = document.createElement('div');
      contentDiv.className = 'insight-content';
      
      const paragraph = document.createElement('p');
      paragraph.textContent = insight.text;
      contentDiv.appendChild(paragraph);
      
      // Create metadata div with confidence pill
      const metadataDiv = document.createElement('div');
      metadataDiv.className = 'insight-metadata';
      
      const confidenceLevel = getConfidenceLevel(insight.confidenceScore);
      const confidencePill = document.createElement('span');
      confidencePill.className = `confidence-pill confidence-${confidenceLevel}`;
      confidencePill.textContent = `${Math.round(insight.confidenceScore * 100)}% confidence`;
      
      metadataDiv.appendChild(confidencePill);
      
      // Assemble the insight element
      insightElement.appendChild(contentDiv);
      insightElement.appendChild(metadataDiv);
      
      fragment.appendChild(insightElement);
    });
    
    insightsSection.appendChild(fragment);
  }
  
  // Apply unified styling to existing insight elements
  function enhanceExistingInsights() {
    // Look for existing insight cards
    const insightCards = document.querySelectorAll('.insight-card');
    
    if (insightCards.length === 0) {
      // No cards to enhance
      return;
    }
    
    console.log(`Enhancing ${insightCards.length} existing insight cards`);
    
    insightCards.forEach(card => {
      // Remove any model-specific badges
      const modelBadges = card.querySelectorAll('.model-badge, .model-indicator');
      modelBadges.forEach(badge => badge.remove());
      
      // Replace any model attribution text with generic AI generation text
      const attributionText = card.querySelector('.insight-footer');
      if (attributionText) {
        // Extract date from existing text, safely
        const fullText = attributionText.textContent || '';
        const parts = fullText.split('•');
        const dateText = parts.length > 1 ? parts[1].trim() : '';
        
        // Create new content with icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot';
        
        attributionText.innerHTML = '';
        attributionText.appendChild(icon);
        attributionText.appendChild(document.createTextNode(` Generated by AI • ${dateText}`));
      }
    });
  }
  
  // -----------------------------
  // Event handling functions
  // -----------------------------
  
  // Set up insight filter dropdown handlers
  function setupFilterHandlers() {
    const filterItems = state.cachedElements.filterItems || 
                       document.querySelectorAll('.dropdown-menu .dropdown-item');
    
    if (!filterItems || filterItems.length === 0) {
      console.log('No filter items found, skipping filter setup');
      return;
    }
    
    filterItems.forEach(item => {
      // Remove any existing event listeners to prevent duplicates
      const newItem = item.cloneNode(true);
      if (item.parentNode) {
        item.parentNode.replaceChild(newItem, item);
      }
      
      newItem.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get filter value from data attribute or text content
        const filterValue = newItem.getAttribute('data-filter') || newItem.textContent.toLowerCase();
        
        // Update dropdown button text
        const dropdownButton = state.cachedElements.filterDropdown || 
                              document.getElementById('insightFilterDropdown');
                              
        if (dropdownButton) {
          dropdownButton.innerHTML = `<i class="fas fa-filter me-1"></i> ${newItem.textContent}`;
        }
        
        // Apply filter
        if (filterValue === 'all insights') {
          renderInsights(state.insights);
        } else {
          renderInsights(state.insights, filterValue);
        }
      });
    });
  }
  
  // Set up refresh button handler
  function setupRefreshHandler() {
    const refreshButton = state.cachedElements.refreshButton || 
                         document.querySelector('[data-refresh-insights]') ||
                         document.querySelector('.header-btn .fa-sync-alt')?.closest('button');
    
    if (!refreshButton) {
      console.log('Refresh button not found, skipping refresh handler setup');
      return;
    }
    
    // Remove any existing event listeners to prevent duplicates
    const newButton = refreshButton.cloneNode(true);
    if (refreshButton.parentNode) {
      refreshButton.parentNode.replaceChild(newButton, refreshButton);
    }
    
    // Store the new reference
    state.cachedElements.refreshButton = newButton;
    
    // Add the data attribute for more reliable selection
    newButton.setAttribute('data-refresh-insights', 'true');
    
    newButton.addEventListener('click', () => {
      // Show loading indicator
      const originalContent = newButton.innerHTML;
      newButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Refreshing...';
      newButton.disabled = true;
      
      // Reload insights data
      loadInsightsData();
      
      // Reset button after delay
      setTimeout(() => {
        newButton.innerHTML = originalContent;
        newButton.disabled = false;
      }, 1000);
    });
  }
  
  // Set up theme handler for dark mode support
  function setupThemeHandler() {
    const darkModeToggle = state.cachedElements.darkModeToggle || 
                          document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
      // Remove any existing event listeners to prevent duplicates
      const newToggle = darkModeToggle.cloneNode(true);
      if (darkModeToggle.parentNode) {
        darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);
      }
      
      // Store the new reference
      state.cachedElements.darkModeToggle = newToggle;
      
      newToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', newToggle.checked);
        
        // Apply theme-specific styling to insights
        applyThemeStyling(newToggle.checked ? 'dark' : 'light');
      });
      
      // Apply initial theme
      if (newToggle.checked) {
        applyThemeStyling('dark');
      }
    } else {
      // Check for system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyThemeStyling('dark');
      }
      
      // Listen for changes to system preference
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Use the modern event listener method with fallback
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', e => {
          applyThemeStyling(e.matches ? 'dark' : 'light');
        });
      } else if (darkModeMediaQuery.addListener) {
        // For older browsers
        darkModeMediaQuery.addListener(e => {
          applyThemeStyling(e.matches ? 'dark' : 'light');
        });
      }
    }
  }
  
  // -----------------------------
  // UI update functions
  // -----------------------------
  
  // Update dashboard metadata with insights data
  function updateDashboardMetadata(metadata) {
    if (!metadata) return;
    
    // Update last updated timestamp
    const lastUpdatedElements = document.querySelectorAll('.last-updated');
    lastUpdatedElements.forEach(element => {
      if (element) {
        const date = new Date(metadata.generated_at);
        element.textContent = `Last updated: ${formatDateTime(date)}`;
      }
    });
    
    // Update insights counts
    updateInsightCounts(metadata);
  }
  
  // Update insight count statistics
  function updateInsightCounts(metadata) {
    // Skip if no insights data
    if (!state.insights || state.insights.length === 0) return;
    
    const insightCounts = {};
    
    // Count insights by type
    state.insights.forEach(insight => {
      if (!insightCounts[insight.type]) {
        insightCounts[insight.type] = 0;
      }
      insightCounts[insight.type]++;
    });
    
    // Update count displays if they exist
    const countElements = {
      total: document.querySelector('.kpi-value[data-count="total-insights"]'),
      general: document.querySelector('.kpi-value[data-count="general-insights"]'),
      brand: document.querySelector('.kpi-value[data-count="brand-insights"]'),
      sentiment: document.querySelector('.kpi-value[data-count="sentiment-insights"]'),
      trend: document.querySelector('.kpi-value[data-count="trend-insights"]')
    };
    
    // Update total insights count
    if (countElements.total) {
      countElements.total.textContent = metadata.insights_count || state.insights.length;
    }
    
    // Update type-specific counts
    for (const type in insightCounts) {
      if (countElements[type]) {
        countElements[type].textContent = insightCounts[type];
      }
    }
  }
  
  // Apply theme-specific styling to insights
  function applyThemeStyling(theme) {
    const insightCards = document.querySelectorAll('.insight-card');
    
    insightCards.forEach(card => {
      card.classList.toggle('dark-theme', theme === 'dark');
    });
  }
  
  // -----------------------------
  // Data generation functions
  // -----------------------------
  
  // Generate contextual insights based on SQL data
  function generateContextualInsights(reportType, data) {
    // In a real implementation, this would analyze the data
    // For demonstration, we'll return pre-defined insights based on report type
    
    const contextualInsights = {
      'sales': [
        {
          text: 'Weekend sales are growing 23% faster than weekday sales across all store formats',
          confidenceScore: 0.92
        },
        {
          text: 'Promotions with digital pre-registration drive 34% higher conversion rates',
          confidenceScore: 0.88
        }
      ],
      'customer': [
        {
          text: 'Customer segments showing highest growth also demonstrate 37% higher brand loyalty metrics',
          confidenceScore: 0.91
        },
        {
          text: 'First-time customers who download the app have 56% higher 90-day retention',
          confidenceScore: 0.85
        }
      ],
      'inventory': [
        {
          text: 'Bundle promotions are reducing excess seasonal inventory by 18% compared to single-item discounts',
          confidenceScore: 0.89
        },
        {
          text: 'Dynamic pricing algorithm reduces waste of perishable items by 22%',
          confidenceScore: 0.87
        }
      ],
      'default': [
        {
          text: 'Cross-category shopping behavior is increasing, with 28% more customers buying across 3+ departments',
          confidenceScore: 0.86
        },
        {
          text: 'Optimized staff scheduling based on traffic patterns has improved conversion rates by 7%',
          confidenceScore: 0.83
        }
      ]
    };
    
    return contextualInsights[reportType] || contextualInsights.default;
  }
  
  // -----------------------------
  // Utility functions
  // -----------------------------
  
  // Get confidence level from numeric score
  function getConfidenceLevel(confidence) {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }
  
  // Format date for display
  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  // Format date and time for display
  function formatDateTime(date) {
    if (!date) return 'Unknown date';
    
    try {
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      
      return `${formattedDate} at ${formattedTime}`;
    } catch (e) {
      return date.toString();
    }
  }
  
  // Capitalize first letter of a string
  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Escape HTML in a string
  function escapeHtml(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // -----------------------------
  // Public API
  // -----------------------------
  return {
    // Core methods
    init: init,
    loadInsights: loadInsightsData,
    
    // Helper methods
    generateInsights: generateContextualInsights,
    getInsightTypes: getAvailableInsightTypes,
    
    // For debugging
    getState: () => ({ ...state })
  };
})();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', UnifiedGenAI.init);