#!/bin/bash
# Quick script to deploy a minimal Power BI-styled dashboard 
# Compatible with Azure Static Web Apps

set -e

echo "🚀 Quick Advisor Dashboard Deployment"
echo "===================================="

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
APP_NAME="tbwa-juicer-insights-dashboard"
DEPLOY_DIR="quick-advisor"

# Clean up and create directories
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/advisor"

# Create a simple Power BI style dashboard
cat > "$DEPLOY_DIR/advisor/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retail Advisor Dashboard</title>
    <style>
        :root {
            --primary: #0078d4;
            --primary-light: #e6f2fa;
            --secondary: #2b88d8;
            --success: #107c10;
            --warning: #ffb900;
            --danger: #d13438;
            --background: #f5f5f5;
            --card: #ffffff;
            --text: #252525;
            --text-muted: #666666;
            --border: #e0e0e0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body {
            background-color: var(--background);
            color: var(--text);
            line-height: 1.5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
        }
        
        .date-info {
            font-size: 14px;
            color: var(--text-muted);
        }
        
        .filter-bar {
            background-color: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .filter-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }
        
        .filter-label {
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .filter-select {
            height: 36px;
            min-width: 120px;
            padding: 0 12px;
            border-radius: 4px;
            border: 1px solid var(--border);
            background-color: white;
            font-size: 14px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }
        
        @media (min-width: 640px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (min-width: 1024px) {
            .grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        
        .card {
            background-color: var(--card);
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 16px;
            transition: all 0.2s ease;
        }
        
        .card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .card-title {
            font-size: 14px;
            color: var(--text-muted);
            font-weight: 500;
        }
        
        .card-icon {
            width: 20px;
            height: 20px;
            color: var(--primary);
        }
        
        .card-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .card-trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
        }
        
        .trend-up {
            color: var(--success);
        }
        
        .trend-down {
            color: var(--danger);
        }
        
        .card-footer {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }
        
        .card-subtitle {
            color: var(--text-muted);
        }
        
        .badge {
            background-color: rgba(0, 120, 212, 0.1);
            color: var(--primary);
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .charts-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }
        
        @media (min-width: 768px) {
            .charts-row {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (min-width: 1024px) {
            .charts-row {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        
        .chart-card {
            background-color: var(--card);
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 16px;
            height: 300px;
        }
        
        .chart-title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 16px;
        }
        
        .chart-placeholder {
            height: 230px;
            background-color: var(--primary-light);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
            font-weight: 500;
        }
        
        .insights-section {
            margin-bottom: 24px;
        }
        
        .insights-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .insights-title {
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .button {
            background-color: transparent;
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .button:hover {
            background-color: var(--primary-light);
        }
        
        .insight-card {
            background-color: var(--card);
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .insight-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .insight-title-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .insight-icon {
            color: var(--warning);
            width: 18px;
            height: 18px;
        }
        
        .insight-title {
            font-size: 16px;
            font-weight: 500;
        }
        
        .insight-category {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            background-color: var(--primary-light);
            color: var(--primary);
        }
        
        .insight-category.critical {
            background-color: rgba(209, 52, 56, 0.1);
            color: var(--danger);
        }
        
        .insight-summary {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 12px;
        }
        
        .insight-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .insight-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--text-muted);
        }
        
        .confidence-bar {
            width: 100px;
            height: 6px;
            background-color: var(--border);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .confidence-bar-fill {
            height: 100%;
            background-color: var(--primary);
        }
        
        .confidence-value {
            font-size: 12px;
            margin-left: 4px;
        }
        
        .insight-actions {
            display: flex;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Retail Advisor Dashboard</h1>
            <div class="date-info">Data as of: May 15, 2025 10:30 AM</div>
        </div>
        
        <!-- Filter Bar -->
        <div class="filter-bar">
            <div class="filter-controls">
                <div class="filter-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Filters:
                </div>
                
                <select class="filter-select">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Last 90 Days</option>
                    <option>Custom Range</option>
                </select>
                
                <select class="filter-select">
                    <option>All Organizations</option>
                    <option>TBWA</option>
                    <option>AllianceOne</option>
                    <option>Reebok</option>
                </select>
                
                <select class="filter-select">
                    <option>All Regions</option>
                    <option>North America</option>
                    <option>EMEA</option>
                    <option>APAC</option>
                    <option>LATAM</option>
                </select>
                
                <select class="filter-select">
                    <option>All Categories</option>
                    <option>Brand</option>
                    <option>Competitors</option>
                    <option>Retail</option>
                    <option>ROI</option>
                </select>
            </div>
        </div>
        
        <!-- KPI Cards -->
        <div class="grid">
            <!-- Brand Score -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Brand Score</div>
                    <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                        <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                </div>
                <div class="card-value">84</div>
                <div class="card-trend trend-up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    5.2% vs. prev. period
                </div>
                
                <div class="card-footer">
                    <div class="card-subtitle">Positive mentions increased</div>
                    <div class="badge">Score: 84/100</div>
                </div>
            </div>
            
            <!-- Competitor Analysis -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Competitor Analysis</div>
                    <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                    </svg>
                </div>
                <div class="card-value">Strong</div>
                <div class="card-trend trend-down">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    2.1% vs. prev. period
                </div>
                
                <div class="card-footer">
                    <div class="card-subtitle">Competitor X gaining market share</div>
                    <div class="badge">Score: 72/100</div>
                </div>
            </div>
            
            <!-- Retail Performance -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Retail Performance</div>
                    <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12H2"></path>
                        <path d="M5 12V21"></path>
                        <path d="M19 12V21"></path>
                        <path d="M5 16H19"></path>
                        <path d="M18 3l-6 3l-6-3l-6 3v8l6-3l6 3l6-3V6l-6 3z"></path>
                    </svg>
                </div>
                <div class="card-value">$1.2M</div>
                <div class="card-trend trend-up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    12.8% vs. prev. period
                </div>
                
                <div class="card-footer">
                    <div class="card-subtitle">Revenue from urban centers</div>
                    <div class="badge">Score: 92/100</div>
                </div>
            </div>
            
            <!-- ROI -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">ROI</div>
                    <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <div class="card-value">128%</div>
                <div class="card-trend trend-up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    3.5% vs. prev. period
                </div>
                
                <div class="card-footer">
                    <div class="card-subtitle">Marketing campaign efficiency</div>
                    <div class="badge">Score: 88/100</div>
                </div>
            </div>
        </div>
        
        <!-- Charts Row -->
        <div class="charts-row">
            <!-- Brand Sentiment Trend -->
            <div class="chart-card">
                <h3 class="chart-title">Brand Sentiment Trend</h3>
                <div class="chart-placeholder">
                    <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                            <line x1="6" y1="6" x2="6.01" y2="6"></line>
                            <line x1="6" y1="18" x2="6.01" y2="18"></line>
                        </svg>
                        <p>Bar Chart: Jan-May Sentiment Data</p>
                    </div>
                </div>
            </div>
            
            <!-- Market Share -->
            <div class="chart-card">
                <h3 class="chart-title">Market Share</h3>
                <div class="chart-placeholder">
                    <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            <path d="M2 12h20"></path>
                        </svg>
                        <p>Pie Chart: Competitor Market Share</p>
                    </div>
                </div>
            </div>
            
            <!-- Retail Sales Trend -->
            <div class="chart-card">
                <h3 class="chart-title">Retail Sales Trend</h3>
                <div class="chart-placeholder">
                    <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <p>Line Chart: Weekly Sales Trend</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- AI Insights Section -->
        <div class="insights-section">
            <div class="insights-header">
                <h2 class="insights-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    AI-Generated Insights
                </h2>
                <button class="button">
                    View All Insights
                </button>
            </div>
            
            <!-- Insight Cards -->
            <div class="insight-card">
                <div class="insight-header">
                    <div class="insight-title-wrapper">
                        <svg class="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3 class="insight-title">Brand sentiment shifting towards sustainability messaging</h3>
                    </div>
                    <div class="insight-category">Brand</div>
                </div>
                
                <p class="insight-summary">Analysis shows a 28% increase in positive engagement when sustainability is highlighted in marketing content.</p>
                
                <div class="insight-footer">
                    <div class="insight-meta">
                        <span>May 12, 2025</span>
                        <div style="display: flex; align-items: center;">
                            <div class="confidence-bar">
                                <div class="confidence-bar-fill" style="width: 87%;"></div>
                            </div>
                            <span class="confidence-value">87%</span>
                        </div>
                    </div>
                    
                    <div class="insight-actions">
                        <button class="button">
                            Get Action Plan
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="insight-card">
                <div class="insight-header">
                    <div class="insight-title-wrapper">
                        <svg class="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3 class="insight-title">Competitor X gaining market share in urban markets</h3>
                    </div>
                    <div class="insight-category">Competitive</div>
                </div>
                
                <p class="insight-summary">Competitor X has increased their market presence by 15% in major urban centers over the past quarter.</p>
                
                <div class="insight-footer">
                    <div class="insight-meta">
                        <span>May 10, 2025</span>
                        <div style="display: flex; align-items: center;">
                            <div class="confidence-bar">
                                <div class="confidence-bar-fill" style="width: 76%;"></div>
                            </div>
                            <span class="confidence-value">76%</span>
                        </div>
                    </div>
                    
                    <div class="insight-actions">
                        <button class="button">
                            Get Action Plan
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="insight-card">
                <div class="insight-header">
                    <div class="insight-title-wrapper">
                        <svg class="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3 class="insight-title">Retail performance anomaly detected in Southeast region</h3>
                    </div>
                    <div class="insight-category critical">Critical</div>
                </div>
                
                <p class="insight-summary">Unexpected 18% drop in conversion rates across Southeast retail locations during weekends.</p>
                
                <div class="insight-footer">
                    <div class="insight-meta">
                        <span>May 8, 2025</span>
                        <div style="display: flex; align-items: center;">
                            <div class="confidence-bar">
                                <div class="confidence-bar-fill" style="width: 63%;"></div>
                            </div>
                            <span class="confidence-value">63%</span>
                        </div>
                    </div>
                    
                    <div class="insight-actions">
                        <button class="button">
                            Get Action Plan
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Simple JavaScript to add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Add timestamp
            const dateInfo = document.querySelector('.date-info');
            const now = new Date();
            const formattedDate = now.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            dateInfo.textContent = 'Data as of: ' + formattedDate;
            
            // Make buttons interactive
            const buttons = document.querySelectorAll('.button');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    alert('This feature would open a detailed action plan or insights panel in the full implementation.');
                });
            });
        });
    </script>
</body>
</html>
EOF

# Create advisor.html in the root as a redirect
cat > "$DEPLOY_DIR/advisor.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create insights_dashboard.html as a legacy redirect
cat > "$DEPLOY_DIR/insights_dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create index.html with a dashboard hub
cat > "$DEPLOY_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Scout Dashboard Hub</title>
    <style>
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 40px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 800px;
        }
        h1 {
            color: #0078d4;
            margin-bottom: 20px;
        }
        .dashboard-links {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 30px;
        }
        .dashboard-link {
            display: inline-block;
            padding: 16px 24px;
            background-color: #0078d4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        .dashboard-link:hover {
            background-color: #106ebe;
        }
        .last-updated {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Project Scout Dashboard Hub</h1>
        <p>Welcome to the Project Scout Dashboard Hub. Select a dashboard below to get started.</p>
        
        <div class="dashboard-links">
            <a href="/advisor" class="dashboard-link">Retail Advisor Dashboard</a>
        </div>
        
        <div class="last-updated">
            <p>Last updated: <span id="last-updated-date">May 15, 2025</span></p>
        </div>
    </div>
    
    <script>
        // Update the last updated date to current date
        document.getElementById('last-updated-date').textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    </script>
</body>
</html>
EOF

# Create proper Azure Static Web App config
cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/advisor",
      "rewrite": "/advisor/index.html"
    }
  ]
}
EOF

echo "Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

echo "Deploying to Azure Static Web App..."
npx @azure/static-web-apps-cli deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOY_TOKEN" \
  --app-name "$APP_NAME" \
  --env production

echo "✅ Power BI-styled Advisor Dashboard deployed successfully!"
echo "🌐 Dashboard URL: https://$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)/advisor/"