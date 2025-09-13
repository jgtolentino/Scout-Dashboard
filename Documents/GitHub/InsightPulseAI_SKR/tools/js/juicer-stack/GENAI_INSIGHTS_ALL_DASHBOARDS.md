# GenAI Insights Integration for All Dashboards

This guide outlines how to implement GenAI insights across all three Retail Advisor dashboards to ensure consistency and functionality.

## Overview

The Retail Advisor system consists of three primary dashboards, all of which should incorporate GenAI insights:

1. **AI Insights Dashboard** (insights_dashboard.html)
2. **System Operations Dashboard** (juicer_dash_shell.html)
3. **QA Dashboard** (qa.html)

Each dashboard will need to access the same underlying GenAI insights data but will present it in different ways appropriate to the dashboard's purpose.

## Shared Components

### 1. API Access Layer

All dashboards will use the same API endpoints to access insights data:

```javascript
// Common API access functions for all dashboards
class InsightsAPIClient {
  constructor(baseUrl = '/api/insights') {
    this.baseUrl = baseUrl;
  }

  async getInsights(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  }

  async getInsightStats() {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Failed to fetch insight stats');
    return response.json();
  }

  async generateInsights(params = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to generate insights');
    return response.json();
  }
}

// Create shared instance for all dashboards
const insightsClient = new InsightsAPIClient();
```

This shared client should be included in all three dashboards to ensure consistent API access.

### 2. Common Visualization Components

Create reusable visualization components for insights:

```javascript
// Place in a shared file: insights_components.js
class InsightCard {
  constructor(container, insightData) {
    this.container = container;
    this.data = insightData;
  }

  render() {
    // Create card with proper styling based on insight type
    // ...
  }
}

class BrandSentimentChart {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.data = data;
  }

  render() {
    // Create chart using Chart.js
    // ...
  }
}

class TagCloud {
  constructor(container, tags) {
    this.container = container;
    this.tags = tags;
  }

  render() {
    // Create interactive tag cloud
    // ...
  }
}
```

Include this shared file in all three dashboards.

### 3. Common Styling

Ensure consistent styling with a shared CSS file:

```css
/* insights_shared.css */
:root {
  --insight-general: #8a4fff;
  --insight-brand: #00a3e0;
  --insight-sentiment: #ff7e47;
  --insight-trend: #00c389;
}

.card-insight-general .card-header {
  background-color: var(--insight-general);
  color: white;
}

.card-insight-brand .card-header {
  background-color: var(--insight-brand);
  color: white;
}

.card-insight-sentiment .card-header {
  background-color: var(--insight-sentiment);
  color: white;
}

.card-insight-trend .card-header {
  background-color: var(--insight-trend);
  color: white;
}

.confidence-badge {
  float: right;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
}
```

## Dashboard-Specific Implementations

### 1. AI Insights Dashboard (insights_dashboard.html)

This dashboard already has full GenAI insights implementation. Ensure it loads the shared components:

```html
<head>
  <!-- Other head elements -->
  <link rel="stylesheet" href="css/insights_shared.css">
  <script src="js/insights_api_client.js"></script>
  <script src="js/insights_components.js"></script>
</head>
```

### 2. System Operations Dashboard (juicer_dash_shell.html)

Extend this dashboard to include a GenAI insights operational section:

```html
<!-- Add to juicer_dash_shell.html -->
<div class="row mb-4">
  <div class="col-12">
    <div class="card">
      <div class="card-header bg-secondary text-white">
        <h5 class="card-title mb-0">GenAI Insights Operations</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="card">
              <div class="card-body text-center">
                <h5 class="insight-count" id="totalInsightsGenerated">--</h5>
                <p class="insight-label">Total Insights Generated</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-body text-center">
                <h5 class="insight-count" id="avgConfidenceScore">--</h5>
                <p class="insight-label">Avg. Confidence Score</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-body text-center">
                <h5 class="insight-count" id="lastGenerationTime">--</h5>
                <p class="insight-label">Last Generated</p>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-12">
            <h6>Insights Generation History</h6>
            <div class="chart-container" style="height: 200px;">
              <canvas id="insightsGenerationChart"></canvas>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-12">
            <h6>LLM Usage by Provider</h6>
            <div class="chart-container" style="height: 200px;">
              <canvas id="llmProviderChart"></canvas>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-12 text-end">
            <button class="btn btn-primary" id="triggerInsightsGeneration">
              <i class="fas fa-sync me-2"></i>Generate Insights Now
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Add the corresponding JavaScript:

```javascript
// Add to the bottom of juicer_dash_shell.html or in a separate JS file
document.addEventListener('DOMContentLoaded', function() {
  // Load GenAI insights operational metrics
  const loadInsightsOperationalMetrics = async () => {
    try {
      const stats = await insightsClient.getInsightStats();
      
      // Update metrics
      document.getElementById('totalInsightsGenerated').textContent = stats.totalInsights;
      document.getElementById('avgConfidenceScore').textContent = `${stats.avgConfidence.toFixed(1)}%`;
      document.getElementById('lastGenerationTime').textContent = new Date(stats.lastGenerationTime)
        .toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      
      // Update charts
      createGenerationHistoryChart(stats.generationHistory);
      createProviderUsageChart(stats.providerUsage);
    } catch (error) {
      console.error('Failed to load insights metrics:', error);
    }
  };
  
  // Initialize the function
  loadInsightsOperationalMetrics();
  
  // Set up refresh button
  document.getElementById('triggerInsightsGeneration').addEventListener('click', async () => {
    try {
      const button = document.getElementById('triggerInsightsGeneration');
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
      
      await insightsClient.generateInsights({ timeRange: '1d' });
      
      button.innerHTML = '<i class="fas fa-check me-2"></i>Generated Successfully';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-sync me-2"></i>Generate Insights Now';
        loadInsightsOperationalMetrics();
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger insights generation:', error);
      const button = document.getElementById('triggerInsightsGeneration');
      button.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Generation Failed';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-sync me-2"></i>Generate Insights Now';
      }, 3000);
    }
  });
  
  // Chart creation functions
  function createGenerationHistoryChart(data) {
    const ctx = document.getElementById('insightsGenerationChart').getContext('2d');
    // Create chart using Chart.js
    // ...
  }
  
  function createProviderUsageChart(data) {
    const ctx = document.getElementById('llmProviderChart').getContext('2d');
    // Create chart using Chart.js
    // ...
  }
});
```

### 3. QA Dashboard (qa.html)

Add a GenAI insights quality section to the QA dashboard:

```html
<!-- Add to qa.html -->
<div class="row mb-4">
  <div class="col-12">
    <div class="card qa-card">
      <div class="qa-card-header d-flex justify-content-between align-items-center">
        <span><i class="bx bx-bot me-2"></i> GenAI Insights Quality</span>
        <div>
          <button class="btn btn-sm btn-light" id="refreshInsightsQA">
            <i class="bx bx-refresh me-1"></i> Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="insightQualityScore">--</h5>
                <p class="insight-label">Overall Quality Score</p>
                <p class="trend-indicator trend-up">
                  <i class="fas fa-check-circle text-success"></i> Excellent
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="insightValidationRate">--</h5>
                <p class="insight-label">Human Validation Rate</p>
                <p class="trend-indicator trend-up">
                  <i class="fas fa-check-circle text-success"></i> Above target
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="insightRejectionRate">--</h5>
                <p class="insight-label">Rejection Rate</p>
                <p class="trend-indicator trend-up">
                  <i class="fas fa-check-circle text-success"></i> Below threshold
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="insightLLMReliability">--</h5>
                <p class="insight-label">LLM Reliability</p>
                <p class="trend-indicator trend-up">
                  <i class="fas fa-check-circle text-success"></i> High availability
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">Confidence Distribution</h6>
              </div>
              <div class="card-body">
                <canvas id="confidenceDistributionChart"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">LLM Provider Performance</h6>
              </div>
              <div class="card-body">
                <canvas id="providerPerformanceChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">Recent Validation Activity</h6>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Insight ID</th>
                        <th>Type</th>
                        <th>Confidence</th>
                        <th>Validation Status</th>
                        <th>Validator</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody id="validationActivityTable">
                      <!-- Populated via JavaScript -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">Pending Validation</h6>
              </div>
              <div class="card-body">
                <div id="pendingValidationContainer">
                  <!-- Populated via JavaScript -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Add the corresponding JavaScript:

```javascript
// Add to the bottom of qa.html or in a separate JS file
document.addEventListener('DOMContentLoaded', function() {
  // Load GenAI insights quality metrics
  const loadInsightsQualityMetrics = async () => {
    try {
      // Fetch quality metrics from API
      // In production, this would be a real API call
      const qaMetrics = {
        qualityScore: 94.7,
        validationRate: 88.2,
        rejectionRate: 3.4,
        llmReliability: 99.8,
        confidenceDistribution: {
          labels: ['Low (50-70%)', 'Medium (70-85%)', 'High (85-100%)'],
          data: [15, 42, 43]
        },
        providerPerformance: {
          labels: ['Claude', 'OpenAI', 'DeepSeek'],
          confidenceScores: [86, 83, 79],
          speedScores: [92, 89, 94]
        },
        recentValidations: [
          { id: 'ins_872e4f23', type: 'brand', confidence: 92, status: 'Approved', validator: 'A. Smith', timestamp: '2025-05-13 09:34' },
          { id: 'ins_57ab9c12', type: 'sentiment', confidence: 76, status: 'Approved with edits', validator: 'J. Chen', timestamp: '2025-05-13 08:22' },
          { id: 'ins_c41d8e7f', type: 'general', confidence: 88, status: 'Approved', validator: 'S. Johnson', timestamp: '2025-05-12 17:45' },
          { id: 'ins_90e3f2a1', type: 'trend', confidence: 63, status: 'Rejected', validator: 'M. Garcia', timestamp: '2025-05-12 16:11' },
          { id: 'ins_34b7d9e5', type: 'brand', confidence: 81, status: 'Approved', validator: 'A. Smith', timestamp: '2025-05-12 15:03' }
        ],
        pendingValidations: [
          { id: 'ins_562f8a1c', title: 'Increasing focus on sustainable packaging', type: 'trend', confidence: 68 },
          { id: 'ins_7c9d4b3e', title: 'Negative sentiment toward recent price changes', type: 'sentiment', confidence: 72 }
        ]
      };
      
      // Update metrics
      document.getElementById('insightQualityScore').textContent = `${qaMetrics.qualityScore}%`;
      document.getElementById('insightValidationRate').textContent = `${qaMetrics.validationRate}%`;
      document.getElementById('insightRejectionRate').textContent = `${qaMetrics.rejectionRate}%`;
      document.getElementById('insightLLMReliability').textContent = `${qaMetrics.llmReliability}%`;
      
      // Create charts
      createConfidenceDistributionChart(qaMetrics.confidenceDistribution);
      createProviderPerformanceChart(qaMetrics.providerPerformance);
      
      // Populate tables
      populateValidationActivityTable(qaMetrics.recentValidations);
      populatePendingValidations(qaMetrics.pendingValidations);
    } catch (error) {
      console.error('Failed to load insights quality metrics:', error);
    }
  };
  
  // Initialize the function
  loadInsightsQualityMetrics();
  
  // Set up refresh button
  document.getElementById('refreshInsightsQA').addEventListener('click', loadInsightsQualityMetrics);
  
  // Chart creation functions
  function createConfidenceDistributionChart(data) {
    const ctx = document.getElementById('confidenceDistributionChart').getContext('2d');
    // Create confidence distribution chart
    // ...
  }
  
  function createProviderPerformanceChart(data) {
    const ctx = document.getElementById('providerPerformanceChart').getContext('2d');
    // Create provider performance chart 
    // ...
  }
  
  // Table population functions
  function populateValidationActivityTable(validations) {
    const tbody = document.getElementById('validationActivityTable');
    tbody.innerHTML = '';
    
    validations.forEach(validation => {
      const row = document.createElement('tr');
      // Create and populate table row
      // ...
      tbody.appendChild(row);
    });
  }
  
  function populatePendingValidations(pendingValidations) {
    const container = document.getElementById('pendingValidationContainer');
    container.innerHTML = '';
    
    if (pendingValidations.length === 0) {
      container.innerHTML = '<div class="alert alert-success">No insights pending validation!</div>';
      return;
    }
    
    pendingValidations.forEach(insight => {
      // Create pending validation card
      // ...
      container.appendChild(card);
    });
  }
});
```

## Deployment Steps

1. **Create Shared Files**:
   - Create `js/insights_api_client.js` with the shared API client
   - Create `js/insights_components.js` with shared visualization components
   - Create `css/insights_shared.css` with shared styling

2. **Update AI Insights Dashboard**:
   - Ensure it references the shared files
   - Verify all functionality works as expected

3. **Update System Operations Dashboard**:
   - Add the GenAI insights operations section
   - Include the shared JavaScript files
   - Test the insights generation functionality

4. **Update QA Dashboard**:
   - Add the GenAI insights quality section
   - Include the shared JavaScript files
   - Test the quality metrics and validation workflows

5. **Test Cross-Dashboard Integration**:
   - Generate insights from the System Operations dashboard
   - Verify they appear in the AI Insights dashboard
   - Validate insights in the QA dashboard
   - Ensure consistent styling and functionality across all dashboards

6. **White-Label All Components**:
   - Run the white-labeling script to ensure consistent branding
   - Verify no references to "InsightPulseAI," "Pulser," or "Sunnies" remain

## Conclusion

By implementing GenAI insights across all three dashboards, the Retail Advisor system provides a comprehensive view of business insights, operational metrics, and quality assurance. Each dashboard presents insights in a way that's appropriate to its purpose, while maintaining consistent data access, visualization components, and styling.