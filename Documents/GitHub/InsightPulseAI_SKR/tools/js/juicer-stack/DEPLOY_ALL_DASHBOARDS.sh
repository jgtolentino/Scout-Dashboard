#!/bin/bash
# DEPLOY_ALL_DASHBOARDS.sh
# Script to deploy all three dashboards to Azure with standardized colors and GenAI integration

set -e  # Exit on error

echo "===== Retail Advisor Dashboards Deployment ====="
echo "This script will deploy all three dashboards to Azure with standardized colors."

# Set color variables based on Retail Advisor branding
PRIMARY_COLOR="#F89E1B"     # Orange
SECONDARY_COLOR="#2E2F33"   # Deep Gray
INFO_COLOR="#00a3e0"        # Blue
SUCCESS_COLOR="#28a745"     # Green
WARNING_COLOR="#ffc107"     # Amber
DANGER_COLOR="#dc3545"      # Red

# 1. Create temp directory for deployment files
TEMP_DIR="./deployment_temp"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "✅ Created temporary directory for deployment"

# 2. Apply standard color scheme to all dashboards
echo "Applying color standardization to all dashboards..."

# 2.1 Update QA Dashboard colors
sed -i '' "s/--primary:.*$/--primary: ${PRIMARY_COLOR};/g" ./dashboards/qa.html
sed -i '' "s/--secondary:.*$/--secondary: ${SECONDARY_COLOR};/g" ./dashboards/qa.html

# 2.2 Update Retail Performance Dashboard colors
sed -i '' "s/--primary:.*$/--primary: ${PRIMARY_COLOR};/g" ./dashboards/retail_performance/retail_performance_dashboard.html
sed -i '' "s/--secondary:.*$/--secondary: ${SECONDARY_COLOR};/g" ./dashboards/retail_performance/retail_performance_dashboard.html

# 2.3 Update AI Insights Dashboard colors
sed -i '' "s/--tbwa-primary:.*$/--tbwa-primary: ${PRIMARY_COLOR};/g" ./dashboards/insights_dashboard.html
sed -i '' "s/--tbwa-secondary:.*$/--tbwa-secondary: ${SECONDARY_COLOR};/g" ./dashboards/insights_dashboard.html

echo "✅ Applied color standardization to all dashboards"

# 3. Apply white-labeling to ensure consistent branding
echo "Applying white-labeling to all components..."
./whitelabel.sh --all-dashboards

echo "✅ Applied white-labeling to all dashboards"

# 4. Create shared GenAI insights components directory
mkdir -p $TEMP_DIR/js
mkdir -p $TEMP_DIR/css

# 4.1 Create shared insights API client
cat > $TEMP_DIR/js/insights_api_client.js << 'EOL'
/**
 * Retail Advisor GenAI Insights API Client
 * Provides a consistent interface for all dashboards to access insights data
 */
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

// Create global instance
const insightsClient = new InsightsAPIClient();
EOL

# 4.2 Create shared CSS for insights
cat > $TEMP_DIR/css/insights_shared.css << 'EOL'
/**
 * Retail Advisor GenAI Insights Shared CSS
 * Consistent styling for insights across all dashboards
 */
:root {
  /* Main Brand Colors */
  --primary-color: #F89E1B;       /* Orange */
  --secondary-color: #2E2F33;     /* Deep Gray */
  
  /* Functional Colors */
  --success-color: #28a745;       /* Green */
  --info-color: #00a3e0;          /* Blue */
  --warning-color: #ffc107;       /* Amber */
  --danger-color: #dc3545;        /* Red */
  
  /* GenAI Insight Type Colors */
  --insight-general: #8a4fff;     /* Purple */
  --insight-brand: #00a3e0;       /* Blue */
  --insight-sentiment: #ff7e47;   /* Coral */
  --insight-trend: #00c389;       /* Teal */
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

.confidence-high {
  background-color: var(--success-color);
  color: white;
}

.confidence-medium {
  background-color: var(--warning-color);
  color: var(--secondary-color);
}

.confidence-low {
  background-color: var(--danger-color);
  color: white;
}

.insight-card {
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.insight-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}
EOL

echo "✅ Created shared GenAI components"

# 5. Add GenAI insights to Retail Performance Dashboard
echo "Adding GenAI insights to Retail Performance Dashboard..."

# Create a GenAI section for the retail performance dashboard
cat > $TEMP_DIR/retail_genai_section.html << 'EOL'
<!-- GenAI Insights Section -->
<div class="row mb-4">
  <div class="col-12">
    <div class="card">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="fas fa-lightbulb me-2"></i> AI-Generated Insights</h5>
        <div>
          <button class="btn btn-sm btn-light" id="refreshInsights">
            <i class="fas fa-sync-alt me-1"></i> Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="input-group mb-3">
              <span class="input-group-text">Brand</span>
              <select class="form-select" id="insightBrandFilter">
                <option value="all" selected>All Brands</option>
                <!-- Populated via JS -->
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="input-group mb-3">
              <span class="input-group-text">Insight Type</span>
              <select class="form-select" id="insightTypeFilter">
                <option value="all" selected>All Types</option>
                <option value="general">General</option>
                <option value="brand">Brand</option>
                <option value="sentiment">Sentiment</option>
                <option value="trend">Trend</option>
              </select>
            </div>
          </div>
        </div>
        
        <div id="insightsContainer">
          <!-- Insights will be loaded here -->
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading insights...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Insight JavaScript -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Load insights when the page loads
    loadInsights();
    
    // Set up refresh button
    document.getElementById('refreshInsights').addEventListener('click', loadInsights);
    
    // Set up filters
    document.getElementById('insightBrandFilter').addEventListener('change', loadInsights);
    document.getElementById('insightTypeFilter').addEventListener('change', loadInsights);
    
    // Function to load insights
    async function loadInsights() {
      try {
        const brandFilter = document.getElementById('insightBrandFilter').value;
        const typeFilter = document.getElementById('insightTypeFilter').value;
        
        // Show loading state
        document.getElementById('insightsContainer').innerHTML = `
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading insights...</p>
          </div>
        `;
        
        // Prepare parameters
        const params = {
          time_range: '30d',
          confidence: 0.7
        };
        
        if (brandFilter !== 'all') {
          params.brand = brandFilter;
        }
        
        if (typeFilter !== 'all') {
          params.type = typeFilter;
        }
        
        // Fetch insights from API
        const insights = await insightsClient.getInsights(params);
        
        // Update UI with insights
        renderInsights(insights);
        
        // Update brand filter options if needed
        updateBrandOptions(insights);
        
      } catch (error) {
        console.error('Failed to load insights:', error);
        document.getElementById('insightsContainer').innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to load insights. Please try again later.
          </div>
        `;
      }
    }
    
    // Function to render insights
    function renderInsights(insights) {
      const container = document.getElementById('insightsContainer');
      
      if (!insights || insights.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle me-2"></i>
            No insights found for the selected filters.
          </div>
        `;
        return;
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create a row
      const row = document.createElement('div');
      row.className = 'row';
      
      // Add insights to row
      insights.forEach(insight => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        col.innerHTML = `
          <div class="card insight-card card-insight-${insight.insight_type}">
            <div class="card-header">
              <span class="badge bg-light text-dark me-2">${insight.insight_type}</span>
              ${insight.insight_title}
              <span class="confidence-badge confidence-${getConfidenceLevel(insight.confidence_score)}">
                ${Math.round(insight.confidence_score * 100)}% confidence
              </span>
            </div>
            <div class="card-body">
              <p>${insight.insight_text}</p>
              
              <div class="mb-3">
                ${renderBrandTags(insight.brands_mentioned)}
              </div>
              
              <div>
                ${renderTags(insight.summary_tags)}
              </div>
              
              <div class="mt-3 text-end">
                <small class="text-muted">Generated by ${insight.generated_by} • ${formatDate(insight.processing_timestamp)}</small>
              </div>
            </div>
          </div>
        `;
        
        row.appendChild(col);
      });
      
      container.appendChild(row);
    }
    
    // Helper function to determine confidence level
    function getConfidenceLevel(score) {
      if (score >= 0.8) return 'high';
      if (score >= 0.6) return 'medium';
      return 'low';
    }
    
    // Helper function to render brand tags
    function renderBrandTags(brands) {
      if (!brands || brands.length === 0) return '';
      
      return brands.map(brand => `
        <span class="brand-tag">${brand}</span>
      `).join('');
    }
    
    // Helper function to render tags
    function renderTags(tags) {
      if (!tags || tags.length === 0) return '';
      
      return tags.map(tag => `
        <span class="tag">${tag}</span>
      `).join('');
    }
    
    // Helper function to format date
    function formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    }
    
    // Helper function to update brand options
    function updateBrandOptions(insights) {
      // Get unique brands from insights
      const brands = new Set();
      
      insights.forEach(insight => {
        if (insight.brands_mentioned) {
          insight.brands_mentioned.forEach(brand => brands.add(brand));
        }
      });
      
      const brandFilter = document.getElementById('insightBrandFilter');
      const currentValue = brandFilter.value;
      
      // Clear options except "All Brands"
      while (brandFilter.options.length > 1) {
        brandFilter.options.remove(1);
      }
      
      // Add brand options
      brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
      });
      
      // Restore selected value if possible
      if (currentValue !== 'all' && [...brands].includes(currentValue)) {
        brandFilter.value = currentValue;
      }
    }
  });
</script>
EOL

echo "✅ Created GenAI section for Retail Performance Dashboard"

# 6. Add GenAI quality section to QA Dashboard
echo "Adding GenAI quality section to QA Dashboard..."

# Create a GenAI quality section for the QA dashboard
cat > $TEMP_DIR/qa_genai_section.html << 'EOL'
<!-- GenAI Insights Quality Section -->
<div class="row mb-4">
  <div class="col-12">
    <div class="card qa-card">
      <div class="qa-card-header d-flex justify-content-between align-items-center">
        <span><i class="fas fa-robot me-2"></i> GenAI Insights Quality</span>
        <div>
          <button class="btn btn-sm btn-light" id="refreshInsightsQA">
            <i class="fas fa-sync-alt me-1"></i> Refresh
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
                  <i class="fas fa-check-circle text-success"></i> <span id="qualityStatus">Excellent</span>
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
                  <i class="fas fa-check-circle text-success"></i> <span id="validationStatus">Above target</span>
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
                  <i class="fas fa-check-circle text-success"></i> <span id="rejectionStatus">Below threshold</span>
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
                  <i class="fas fa-check-circle text-success"></i> <span id="reliabilityStatus">High availability</span>
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
      </div>
    </div>
  </div>
</div>

<!-- GenAI Quality JavaScript -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Load GenAI insights quality metrics
    loadInsightsQualityMetrics();
    
    // Set up refresh button
    document.getElementById('refreshInsightsQA').addEventListener('click', loadInsightsQualityMetrics);
    
    // Function to load GenAI insights quality metrics
    async function loadInsightsQualityMetrics() {
      try {
        // In a real implementation, this would fetch metrics from API
        // For demo, we'll use simulated data
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
          ]
        };
        
        // Update metrics
        document.getElementById('insightQualityScore').textContent = `${qaMetrics.qualityScore}%`;
        document.getElementById('insightValidationRate').textContent = `${qaMetrics.validationRate}%`;
        document.getElementById('insightRejectionRate').textContent = `${qaMetrics.rejectionRate}%`;
        document.getElementById('insightLLMReliability').textContent = `${qaMetrics.llmReliability}%`;
        
        // Update status indicators
        updateStatusIndicator('qualityStatus', qaMetrics.qualityScore, 95, 80);
        updateStatusIndicator('validationStatus', qaMetrics.validationRate, 85, 70);
        updateStatusIndicator('rejectionStatus', qaMetrics.rejectionRate, 5, 10, true);
        updateStatusIndicator('reliabilityStatus', qaMetrics.llmReliability, 99, 95);
        
        // Create charts
        createConfidenceDistributionChart(qaMetrics.confidenceDistribution);
        createProviderPerformanceChart(qaMetrics.providerPerformance);
        
        // Populate tables
        populateValidationActivityTable(qaMetrics.recentValidations);
        
      } catch (error) {
        console.error('Failed to load insights quality metrics:', error);
      }
    }
    
    // Helper function to update status indicator
    function updateStatusIndicator(elementId, value, highThreshold, lowThreshold, isInverted = false) {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const parentElement = element.parentElement;
      const iconElement = parentElement.querySelector('i');
      
      let status, iconClass;
      
      if (isInverted) {
        // For metrics where lower is better (like rejection rate)
        if (value <= lowThreshold) {
          status = 'Excellent';
          iconClass = 'fas fa-check-circle text-success';
          parentElement.className = 'trend-indicator trend-up';
        } else if (value <= highThreshold) {
          status = 'Acceptable';
          iconClass = 'fas fa-info-circle text-info';
          parentElement.className = 'trend-indicator';
        } else {
          status = 'Needs improvement';
          iconClass = 'fas fa-exclamation-circle text-warning';
          parentElement.className = 'trend-indicator trend-down';
        }
      } else {
        // For metrics where higher is better
        if (value >= highThreshold) {
          status = 'Excellent';
          iconClass = 'fas fa-check-circle text-success';
          parentElement.className = 'trend-indicator trend-up';
        } else if (value >= lowThreshold) {
          status = 'Acceptable';
          iconClass = 'fas fa-info-circle text-info';
          parentElement.className = 'trend-indicator';
        } else {
          status = 'Needs improvement';
          iconClass = 'fas fa-exclamation-circle text-warning';
          parentElement.className = 'trend-indicator trend-down';
        }
      }
      
      element.textContent = status;
      iconElement.className = iconClass;
    }
    
    // Function to create confidence distribution chart
    function createConfidenceDistributionChart(data) {
      const ctx = document.getElementById('confidenceDistributionChart').getContext('2d');
      
      if (window.confidenceChart) {
        window.confidenceChart.destroy();
      }
      
      window.confidenceChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.data,
            backgroundColor: [
              'rgba(220, 53, 69, 0.7)',   // Low - Red
              'rgba(255, 193, 7, 0.7)',   // Medium - Yellow
              'rgba(40, 167, 69, 0.7)'    // High - Green
            ],
            borderColor: [
              'rgba(220, 53, 69, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(40, 167, 69, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
    
    // Function to create provider performance chart
    function createProviderPerformanceChart(data) {
      const ctx = document.getElementById('providerPerformanceChart').getContext('2d');
      
      if (window.providerChart) {
        window.providerChart.destroy();
      }
      
      window.providerChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Confidence',
              data: data.confidenceScores,
              backgroundColor: 'rgba(0, 163, 224, 0.7)',
              borderColor: 'rgba(0, 163, 224, 1)',
              borderWidth: 1
            },
            {
              label: 'Speed',
              data: data.speedScores,
              backgroundColor: 'rgba(248, 158, 27, 0.7)',
              borderColor: 'rgba(248, 158, 27, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
    
    // Function to populate validation activity table
    function populateValidationActivityTable(validations) {
      const tbody = document.getElementById('validationActivityTable');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      validations.forEach(validation => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${validation.id}</td>
          <td>${validation.type}</td>
          <td>${validation.confidence}%</td>
          <td>${getStatusBadge(validation.status)}</td>
          <td>${validation.validator}</td>
          <td>${validation.timestamp}</td>
        `;
        
        tbody.appendChild(row);
      });
    }
    
    // Helper function to get status badge
    function getStatusBadge(status) {
      if (status === 'Approved') {
        return '<span class="badge bg-success">Approved</span>';
      } else if (status === 'Approved with edits') {
        return '<span class="badge bg-warning text-dark">Approved with edits</span>';
      } else if (status === 'Rejected') {
        return '<span class="badge bg-danger">Rejected</span>';
      } else {
        return '<span class="badge bg-secondary">Unknown</span>';
      }
    }
  });
</script>
EOL

echo "✅ Created GenAI quality section for QA Dashboard"

# 7. Prepare for Azure deployment
echo "Preparing Azure deployment files..."

# Create Azure deployment script
cat > $TEMP_DIR/deploy_to_azure.sh << 'EOL'
#!/bin/bash
# Script to deploy dashboards to Azure

# Set your Azure resource names here (or use environment variables)
RESOURCE_GROUP=${RESOURCE_GROUP:-"RG-TBWA-ProjectScout-Retail"}
STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-"tbwaretailadvisor"}
CONTAINER=${CONTAINER:-"$web"}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI not found. Please install it first."
    exit 1
fi

# Check if logged in to Azure
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Check if resource group exists
az group show --name $RESOURCE_GROUP &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating resource group $RESOURCE_GROUP..."
    az group create --name $RESOURCE_GROUP --location eastus
fi

# Check if storage account exists
az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating storage account $STORAGE_ACCOUNT..."
    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --location eastus \
        --sku Standard_LRS \
        --kind StorageV2 \
        --enable-static-website
fi

# Get storage account key
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query "[0].value" -o tsv)

# Check if container exists
az storage container show --name $CONTAINER --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY &> /dev/null
if [ $? -ne 0 ]; then
    echo "Creating container $CONTAINER..."
    az storage container create --name $CONTAINER --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY --public-access blob
fi

# Upload files to Azure Storage
echo "Uploading dashboard files to Azure Storage..."
az storage blob upload-batch \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --destination $CONTAINER \
    --source ./dashboards \
    --overwrite

# Enable static website hosting
echo "Enabling static website hosting..."
az storage blob service-properties update \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --static-website \
    --index-document index.html \
    --404-document error.html

# Get website URL
WEBSITE_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query "primaryEndpoints.web" \
    --output tsv)

echo "================================================"
echo "✅ Deployment complete!"
echo "Website URL: $WEBSITE_URL"
echo "================================================"
EOL

chmod +x $TEMP_DIR/deploy_to_azure.sh

echo "✅ Created Azure deployment script"

# 8. Add GenAI insights to all dashboards
echo "Adding GenAI insights to all dashboards..."

# 8.1 Copy shared components to dashboards directory
mkdir -p ./dashboards/js
mkdir -p ./dashboards/css
cp $TEMP_DIR/js/insights_api_client.js ./dashboards/js/
cp $TEMP_DIR/css/insights_shared.css ./dashboards/css/

# 8.2 Add GenAI section to retail performance dashboard
# Extract closing body tag position
RETAIL_DASH_PATH="./dashboards/retail_performance/retail_performance_dashboard.html"
CLOSING_BODY_LINE=$(grep -n "</body>" $RETAIL_DASH_PATH | cut -d: -f1)

# Insert GenAI section before closing body tag
head -n $((CLOSING_BODY_LINE-1)) $RETAIL_DASH_PATH > $TEMP_DIR/retail_temp.html
cat $TEMP_DIR/retail_genai_section.html >> $TEMP_DIR/retail_temp.html
echo "</body>" >> $TEMP_DIR/retail_temp.html
echo "</html>" >> $TEMP_DIR/retail_temp.html
mv $TEMP_DIR/retail_temp.html $RETAIL_DASH_PATH

# 8.3 Add GenAI quality section to QA dashboard
QA_DASH_PATH="./dashboards/qa.html"
CLOSING_MAIN_LINE=$(grep -n "</main>" $QA_DASH_PATH | cut -d: -f1)

# Insert GenAI quality section before closing main tag
head -n $((CLOSING_MAIN_LINE-1)) $QA_DASH_PATH > $TEMP_DIR/qa_temp.html
cat $TEMP_DIR/qa_genai_section.html >> $TEMP_DIR/qa_temp.html
echo "</main>" >> $TEMP_DIR/qa_temp.html
tail -n +$CLOSING_MAIN_LINE $QA_DASH_PATH | tail -n +2 >> $TEMP_DIR/qa_temp.html
mv $TEMP_DIR/qa_temp.html $QA_DASH_PATH

# 8.4 Add shared CSS and JS references to all dashboards
# (Insights dashboard already has these)

# Add to retail performance dashboard
RETAIL_HEAD_END=$(grep -n "</head>" $RETAIL_DASH_PATH | cut -d: -f1)
head -n $((RETAIL_HEAD_END-1)) $RETAIL_DASH_PATH > $TEMP_DIR/retail_head_temp.html
echo '  <link rel="stylesheet" href="../css/insights_shared.css">' >> $TEMP_DIR/retail_head_temp.html
echo '  <script src="../js/insights_api_client.js"></script>' >> $TEMP_DIR/retail_head_temp.html
echo '</head>' >> $TEMP_DIR/retail_head_temp.html
tail -n +$RETAIL_HEAD_END $RETAIL_DASH_PATH | tail -n +2 >> $TEMP_DIR/retail_head_temp.html
mv $TEMP_DIR/retail_head_temp.html $RETAIL_DASH_PATH

# Add to QA dashboard
QA_HEAD_END=$(grep -n "</head>" $QA_DASH_PATH | cut -d: -f1)
head -n $((QA_HEAD_END-1)) $QA_DASH_PATH > $TEMP_DIR/qa_head_temp.html
echo '  <link rel="stylesheet" href="css/insights_shared.css">' >> $TEMP_DIR/qa_head_temp.html
echo '  <script src="js/insights_api_client.js"></script>' >> $TEMP_DIR/qa_head_temp.html
echo '</head>' >> $TEMP_DIR/qa_head_temp.html
tail -n +$QA_HEAD_END $QA_DASH_PATH | tail -n +2 >> $TEMP_DIR/qa_head_temp.html
mv $TEMP_DIR/qa_head_temp.html $QA_DASH_PATH

echo "✅ Added GenAI insights to all dashboards"

# 9. Create final verification script
cat > verify_dashboards.sh << 'EOL'
#!/bin/bash
# Script to verify dashboard integration

echo "===== Verifying Dashboard Integration ====="

# Check if shared components exist
if [ -f "./dashboards/js/insights_api_client.js" ] && [ -f "./dashboards/css/insights_shared.css" ]; then
    echo "✅ Shared GenAI components verified"
else
    echo "❌ Shared GenAI components missing"
fi

# Check Retail Performance Dashboard
if grep -q "GenAI Insights Section" ./dashboards/retail_performance/retail_performance_dashboard.html; then
    echo "✅ Retail Performance Dashboard has GenAI integration"
else
    echo "❌ Retail Performance Dashboard missing GenAI integration"
fi

# Check QA Dashboard
if grep -q "GenAI Insights Quality" ./dashboards/qa.html; then
    echo "✅ QA Dashboard has GenAI quality section"
else
    echo "❌ QA Dashboard missing GenAI quality section"
fi

# Check Insights Dashboard (should already have GenAI by default)
if grep -q "AI-Generated Business Insights" ./dashboards/insights_dashboard.html; then
    echo "✅ Insights Dashboard has GenAI content"
else
    echo "❌ Insights Dashboard missing GenAI content"
fi

# Check color standardization
if grep -q "#F89E1B" ./dashboards/qa.html && \
   grep -q "#F89E1B" ./dashboards/retail_performance/retail_performance_dashboard.html && \
   grep -q "#F89E1B" ./dashboards/insights_dashboard.html; then
    echo "✅ Color standardization applied across all dashboards"
else
    echo "❌ Color standardization inconsistent across dashboards"
fi

echo "===== Verification Complete ====="
EOL

chmod +x verify_dashboards.sh

echo "✅ Created dashboard verification script"

# 10. Clean up and deploy
echo "Running verification..."
./verify_dashboards.sh

echo "Deployment complete! To deploy to Azure, run:"
echo "./deployment_temp/deploy_to_azure.sh"

# Remove temporary directory (optional)
# rm -rf $TEMP_DIR

echo "To verify all dashboards:"
echo "./verify_dashboards.sh"