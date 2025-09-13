#!/bin/bash

# Script to create a complete demo package for the dashboard with data toggle functionality
# This creates a self-contained package that can be used for demonstrations

# Set variables
PACKAGE_NAME="scout-dashboard-toggle-demo"
OUTPUT_DIR="./output"
PACKAGE_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}"
ZIP_FILE="${OUTPUT_DIR}/${PACKAGE_NAME}.zip"

# Echo with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Make sure the output directory exists
log "Creating output directory structure..."
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}/css"
mkdir -p "${PACKAGE_DIR}/js"
mkdir -p "${PACKAGE_DIR}/assets/data/simulated"
mkdir -p "${PACKAGE_DIR}/retail_edge/js"
mkdir -p "${PACKAGE_DIR}/retail_edge/assets/data/simulated"
mkdir -p "${PACKAGE_DIR}/images"
mkdir -p "${PACKAGE_DIR}/docs"

# Copy core files
log "Copying core dashboard files..."
cp ./insights_dashboard.html "${PACKAGE_DIR}/"
cp ./index.html "${PACKAGE_DIR}/"
cp ./retail_edge/retail_edge_dashboard.html "${PACKAGE_DIR}/retail_edge/"

# Copy CSS files
log "Copying CSS files..."
cp ./css/shared-theme.css "${PACKAGE_DIR}/css/"
cp ./css/mockify-style.css "${PACKAGE_DIR}/css/"
cp ./css/retail_edge_style_patch.css "${PACKAGE_DIR}/css/"

# Copy JavaScript files
log "Copying JavaScript files..."
cp ./js/insights_visualizer.js "${PACKAGE_DIR}/js/"
cp ./js/dashboard_integrator.js "${PACKAGE_DIR}/js/"
cp ./js/data_source_toggle.js "${PACKAGE_DIR}/js/"
cp ./js/medallion_data_connector.js "${PACKAGE_DIR}/js/"
cp ./js/sql_connector.js "${PACKAGE_DIR}/js/"

# Copy retail edge specific files
log "Copying retail edge specific files..."
cp ./retail_edge/js/dashboard_integrator.js "${PACKAGE_DIR}/retail_edge/js/"
cp ./retail_edge/js/data_source_toggle.js "${PACKAGE_DIR}/retail_edge/js/"
cp ./retail_edge/js/medallion_data_connector.js "${PACKAGE_DIR}/retail_edge/js/"

# Copy simulated data
log "Copying simulated data files..."
cp ./assets/data/simulated/*.json "${PACKAGE_DIR}/assets/data/simulated/"
cp ./retail_edge/assets/data/simulated/*.json "${PACKAGE_DIR}/retail_edge/assets/data/simulated/"

# Copy documentation
log "Copying documentation..."
cp ./README.md "${PACKAGE_DIR}/docs/ORIGINAL_README.md"
cp ./retail_edge/README_DATA_TOGGLE.md "${PACKAGE_DIR}/docs/"

# Create a DEMO HTML page
log "Creating demo landing page..."
cat > "${PACKAGE_DIR}/DEMO.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Scout Dashboard Demo</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/shared-theme.css">
    <style>
        .card-demo {
            margin-bottom: 20px;
            transition: transform 0.3s;
            height: 100%;
        }
        .card-demo:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .dashboard-screenshot {
            width: 100%;
            height: auto;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        .demo-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background-color: #ffc107;
            color: #000;
            font-weight: bold;
            border-radius: 3px;
            font-size: 0.8rem;
        }
        .feature-list {
            list-style-type: none;
            padding-left: 0;
        }
        .feature-list li {
            padding: 5px 0;
        }
        .feature-list li:before {
            content: "✓";
            color: #28a745;
            margin-right: 10px;
            font-weight: bold;
        }
        .header-banner {
            background: linear-gradient(135deg, #4a0079, #9c27b0);
            color: white;
            padding: 30px 0;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="header-banner">
        <div class="container">
            <h1><i class="fas fa-chart-bar"></i> Project Scout Dashboard Demo</h1>
            <p class="lead">Interactive demonstration package with data source toggle functionality</p>
        </div>
    </div>

    <div class="container">
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    This demo package showcases the Project Scout dashboard with data toggle functionality. Switch between real and simulated data sources to demonstrate dashboard capabilities without requiring a backend connection.
                </div>
            </div>
        </div>

        <div class="row mb-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h2>Quick Start</h2>
                        <p>Follow these steps to get started with the demo:</p>
                        <ol>
                            <li>Open one of the dashboard links below</li>
                            <li>Use the data toggle in the dashboard header</li>
                            <li>Observe how the dashboard updates with different data sources</li>
                            <li>Refer to <code>DEMO_QUICK_START.md</code> for detailed instructions</li>
                        </ol>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h2>Key Features</h2>
                        <ul class="feature-list">
                            <li>Seamless toggle between real and simulated data</li>
                            <li>Visual indicators showing data source status</li>
                            <li>Persistent user preferences with localStorage</li>
                            <li>Simulated data for all dashboard components</li>
                            <li>Support for filters (time range, region, store type)</li>
                            <li>DEMO watermark when using simulated data</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <h2 class="mb-4">Available Dashboards</h2>
        
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card card-demo">
                    <div class="demo-badge">DEMO</div>
                    <div class="card-body">
                        <h3>Retail Edge Dashboard</h3>
                        <p>Complete retail analysis dashboard with data toggle functionality.</p>
                        <img src="images/retail_edge_preview.png" alt="Retail Edge Dashboard" class="dashboard-screenshot mb-3" onerror="this.src='https://via.placeholder.com/800x400?text=Retail+Edge+Dashboard';this.onerror='';">
                        <div class="d-grid gap-2">
                            <a href="retail_edge/retail_edge_dashboard.html" class="btn btn-primary"><i class="fas fa-external-link-alt"></i> Open Dashboard</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card card-demo">
                    <div class="demo-badge">DEMO</div>
                    <div class="card-body">
                        <h3>Insights Dashboard</h3>
                        <p>Strategic insights dashboard with visualized analytics.</p>
                        <img src="images/insights_preview.png" alt="Insights Dashboard" class="dashboard-screenshot mb-3" onerror="this.src='https://via.placeholder.com/800x400?text=Insights+Dashboard';this.onerror='';">
                        <div class="d-grid gap-2">
                            <a href="insights_dashboard.html" class="btn btn-primary"><i class="fas fa-external-link-alt"></i> Open Dashboard</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-5">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-body">
                        <h2>Documentation</h2>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="d-grid gap-2">
                                    <a href="DEMO_QUICK_START.md" class="btn btn-outline-primary mb-2"><i class="fas fa-book"></i> Quick Start Guide</a>
                                    <a href="docs/README_DATA_TOGGLE.md" class="btn btn-outline-primary mb-2"><i class="fas fa-exchange-alt"></i> Data Toggle Documentation</a>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-grid gap-2">
                                    <a href="docs/ORIGINAL_README.md" class="btn btn-outline-secondary mb-2"><i class="fas fa-file-alt"></i> Original README</a>
                                    <a href="run_demo_server.sh" class="btn btn-outline-success mb-2"><i class="fas fa-server"></i> Run Local Server Script</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer class="my-5 pt-5 text-muted text-center text-small">
            <p class="mb-1">© 2025 Project Scout Dashboard Demo</p>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
EOF

# Create the DEMO_QUICK_START.md file
log "Creating quick start guide..."
cat > "${PACKAGE_DIR}/DEMO_QUICK_START.md" << EOF
# Project Scout Dashboard Demo - Quick Start Guide

This guide provides everything you need to get started with the Project Scout Dashboard Demo package, which showcases the data toggle functionality for presentation and demonstration purposes.

## Setup Instructions

### Option 1: Use a Local Web Server (Recommended)

1. **Run the included server script:**
   ```bash
   # Make the script executable
   chmod +x run_demo_server.sh
   
   # Run the server
   ./run_demo_server.sh
   ```

2. **Access the demo in your browser:**
   Open [http://localhost:8080/DEMO.html](http://localhost:8080/DEMO.html)

### Option 2: Open Files Directly

You can open the HTML files directly in your browser, but some functionality might be limited due to browser security restrictions.

## Dashboard Navigation

The demo package includes two main dashboards:

1. **Retail Edge Dashboard**: Comprehensive retail analytics
   - Path: \`retail_edge/retail_edge_dashboard.html\`

2. **Insights Dashboard**: Strategic business insights 
   - Path: \`insights_dashboard.html\`

## Using the Data Toggle

The data toggle feature allows you to switch between real and simulated data sources for demonstration purposes without requiring a backend connection.

### How to Toggle Data Sources

1. Locate the toggle switch in the dashboard header (after the main navigation)
2. Click the switch to change between real and simulated data
   - **Right position (ON)**: Using real data (LIVE)
   - **Left position (OFF)**: Using simulated data (DEMO)

![Data Toggle Screenshot](images/data_toggle_example.png)

### Key Features

- The toggle persists your preference using localStorage
- When using simulated data, a "DEMO" watermark appears on charts and data sections
- Visual indicators throughout the dashboard show the current data source state
- The dashboard automatically refreshes data when toggling

## Common Demo Scenarios

Here are some suggested demonstration scenarios:

### Scenario 1: Data Independence

**Goal**: Show how the dashboard can operate without a live backend connection

1. Start with the Retail Edge Dashboard
2. Ensure the toggle is set to "Using Simulated Data"
3. Point out the "DEMO" indicators
4. Highlight how all charts and tables are populated with meaningful sample data
5. Mention that this allows for effective presentations in environments without internet access

### Scenario 2: Seamless Transition

**Goal**: Demonstrate the smooth transition between data sources

1. Open the Retail Edge Dashboard
2. Toggle between real and simulated data a few times
3. Highlight how the dashboard refreshes and updates all components
4. Point out the visual indicators that change to show which data source is active
5. Explain that this architecture allows for testing and validation without affecting production data

### Scenario 3: Feature Exploration

**Goal**: Showcase dashboard functionality with reliable data

1. Start with the toggle set to "Using Simulated Data"
2. Walk through each dashboard section and explain the metrics
3. Use the time range filters to show how the dashboard responds
4. Demonstrate the interaction between different components
5. Emphasize that simulated data is designed to showcase all dashboard features

## Talking Points

- **Medallion Architecture**: The dashboard implements a medallion data architecture with Bronze (raw), Silver (cleaned), Gold (enriched), and Platinum (AI insights) layers.

- **Real-time Capabilities**: When using real data, the dashboard can connect to APIs for real-time updates.

- **Performance Optimization**: The data connector includes caching mechanisms to improve performance.

- **User Experience**: The toggle provides clear visual indicators to ensure users always know which data source they're viewing.

- **Extensibility**: The architecture allows for easily adding new data sources or extending existing ones.

## Troubleshooting Tips

### Issue: Dashboard shows no data

**Solution**: 
- Check that the simulated data files are in the correct location: \`/assets/data/simulated/\`
- Verify any browser console errors (Press F12 to open developer tools)
- Try refreshing the page with a hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Issue: Toggle doesn't change data

**Solution**:
- Clear browser cache and localStorage (from developer tools)
- Check browser console for JavaScript errors
- Verify that all required JavaScript files are loaded

### Issue: Charts not rendering

**Solution**:
- Ensure Chart.js is properly loaded
- Check for any JavaScript errors in the console
- Verify the data structure in the simulated data files

## Additional Resources

- **Data Toggle Documentation**: See \`docs/README_DATA_TOGGLE.md\`
- **Original Dashboard README**: See \`docs/ORIGINAL_README.md\`
- **Implementation Details**: Review the JavaScript files in \`js/\` directory
EOF

# Create server script
log "Creating local server script..."
cat > "${PACKAGE_DIR}/run_demo_server.sh" << EOF
#!/bin/bash

# Simple script to run a local web server for the demo
# This makes it easy for presenters to run the demo

echo "Starting local web server for Scout Dashboard Demo..."
echo "Press Ctrl+C to stop the server when finished"

# Check for Python version
if command -v python3 &>/dev/null; then
    echo "Starting server using Python 3..."
    echo "Demo available at: http://localhost:8080/DEMO.html"
    python3 -m http.server 8080
elif command -v python &>/dev/null; then
    # Check Python version
    PY_VERSION=\$(python -c 'import sys; print(sys.version_info.major)')
    if [ "\$PY_VERSION" -eq 3 ]; then
        echo "Starting server using Python 3..."
        echo "Demo available at: http://localhost:8080/DEMO.html"
        python -m http.server 8080
    else
        echo "Starting server using Python 2..."
        echo "Demo available at: http://localhost:8080/DEMO.html"
        python -m SimpleHTTPServer 8080
    fi
else
    echo "Python not found. Please install Python or use a different web server."
    echo "You can also open the HTML files directly in your browser."
    exit 1
fi
EOF
chmod +x "${PACKAGE_DIR}/run_demo_server.sh"

# Create modified data_source_toggle.js with DEMO watermark
log "Creating enhanced data source toggle with DEMO watermark..."
cat > "${PACKAGE_DIR}/js/data_source_toggle.js" << EOF
/**
 * Data Source Toggle with DEMO Watermark
 * 
 * This script provides functionality to toggle between real and simulated data sources
 * for the dashboard. It's useful for development, testing, and demonstration purposes.
 * 
 * Enhanced version with DEMO watermark for presentations.
 */

class DataSourceToggle {
  /**
   * Initialize the data source toggle
   * 
   * @param {Object} options Configuration options
   * @param {string} options.containerId The ID of the container element where the toggle will be rendered
   * @param {Function} options.onToggle Callback when toggle state changes
   * @param {boolean} options.defaultUseRealData Start with real data (true) or simulated data (false)
   * @param {Object} options.dataSourceConfig Configuration for different data sources
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'data-source-toggle-container';
    this.onToggle = options.onToggle || (() => {});
    this.useRealData = options.defaultUseRealData !== undefined ? options.defaultUseRealData : false;

    // Data source configuration
    this.dataSourceConfig = options.dataSourceConfig || {
      real: {
        bronzeLayer: '/api/events/realtime',
        silverLayer: '/api/silver/brand-mentions',
        goldLayer: '/api/gold/topic-analysis',
        platinumLayer: '/api/insights',
        unified: '/api/dashboard/summary'
      },
      simulated: {
        bronzeLayer: '/retail_edge/assets/data/simulated/bronze_events.json',
        silverLayer: '/retail_edge/assets/data/simulated/silver_brand_mentions.json',
        goldLayer: '/retail_edge/assets/data/simulated/gold_topic_analysis.json', 
        platinumLayer: '/retail_edge/assets/data/simulated/platinum_insights.json',
        unified: '/retail_edge/assets/data/simulated/dashboard_summary.json'
      }
    };

    // State persistence key
    this.storageKey = 'retail_edge_data_source_preference';
    
    // Load saved preference
    this.loadPreference();
    
    // Create the toggle UI
    this.render();
    
    // Report initial state
    this.reportState();
    
    // Add demo watermark if using simulated data
    if (!this.useRealData) {
      this.addDemoWatermark();
    }
  }

  /**
   * Load user preference from localStorage
   */
  loadPreference() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        this.useRealData = saved === 'true';
      }
    } catch (error) {
      console.warn('Failed to load data source preference from localStorage');
    }
  }

  /**
   * Save user preference to localStorage
   */
  savePreference() {
    try {
      localStorage.setItem(this.storageKey, this.useRealData.toString());
    } catch (error) {
      console.warn('Failed to save data source preference to localStorage');
    }
  }

  /**
   * Get the current data endpoints based on toggle state
   * 
   * @returns {Object} The data endpoints configuration
   */
  getDataEndpoints() {
    return this.useRealData ? this.dataSourceConfig.real : this.dataSourceConfig.simulated;
  }

  /**
   * Toggle between real and simulated data
   */
  toggle() {
    this.useRealData = !this.useRealData;
    this.savePreference();
    this.updateUI();
    this.reportState();
    
    // Toggle the demo watermark
    if (this.useRealData) {
      this.removeDemoWatermark();
    } else {
      this.addDemoWatermark();
    }
    
    // Call the provided callback
    this.onToggle(this.useRealData, this.getDataEndpoints());
  }

  /**
   * Update the UI to reflect current state
   */
  updateUI() {
    const toggle = document.getElementById(\`\${this.containerId}-switch\`);
    const label = document.getElementById(\`\${this.containerId}-label\`);
    const statusBadge = document.getElementById(\`\${this.containerId}-status\`);
    
    if (toggle) toggle.checked = this.useRealData;
    
    if (label) {
      label.textContent = this.useRealData ? 'Using Real Data' : 'Using Simulated Data';
    }
    
    if (statusBadge) {
      statusBadge.className = this.useRealData 
        ? 'badge badge-success' 
        : 'badge badge-warning';
      statusBadge.textContent = this.useRealData 
        ? 'LIVE' 
        : 'DEMO';
    }

    // Update status indicators throughout the dashboard
    this.updateDataSourceIndicators();
  }

  /**
   * Update data source indicators throughout the dashboard
   */
  updateDataSourceIndicators() {
    // Find all data source indicator elements
    const indicators = document.querySelectorAll('.data-source-indicator');
    
    indicators.forEach(indicator => {
      // Clear existing classes
      indicator.classList.remove('data-source-real', 'data-source-simulated');
      
      // Add appropriate class
      indicator.classList.add(this.useRealData ? 'data-source-real' : 'data-source-simulated');
      
      // Update text if it has this attribute
      if (indicator.hasAttribute('data-update-text')) {
        indicator.textContent = this.useRealData ? 'LIVE' : 'DEMO';
      }
    });
  }

  /**
   * Add a demo watermark to the page when using simulated data
   */
  addDemoWatermark() {
    // Remove any existing watermark first
    this.removeDemoWatermark();
    
    // Create watermark element
    const watermark = document.createElement('div');
    watermark.id = 'demo-watermark';
    watermark.style.position = 'fixed';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
    watermark.style.fontSize = '6rem';
    watermark.style.fontWeight = 'bold';
    watermark.style.color = 'rgba(255, 193, 7, 0.15)';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '9999';
    watermark.style.userSelect = 'none';
    watermark.style.whiteSpace = 'nowrap';
    watermark.textContent = 'DEMO MODE';
    
    // Add to the body
    document.body.appendChild(watermark);
    
    // Add a class to the body for additional styling
    document.body.classList.add('demo-mode');
  }

  /**
   * Remove the demo watermark
   */
  removeDemoWatermark() {
    const existingWatermark = document.getElementById('demo-watermark');
    if (existingWatermark) {
      existingWatermark.remove();
    }
    
    // Remove the body class
    document.body.classList.remove('demo-mode');
  }

  /**
   * Report the current state to the console for debugging
   */
  reportState() {
    console.log(\`Data Source: \${this.useRealData ? 'REAL' : 'SIMULATED'}\`);
    console.log('Endpoints:', this.getDataEndpoints());
  }

  /**
   * Render the toggle UI
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(\`Container #\${this.containerId} not found for data source toggle\`);
      return;
    }

    container.innerHTML = \`
      <div class="data-source-toggle">
        <div class="toggle-wrapper">
          <div class="toggle-label-container">
            <span id="\${this.containerId}-label" class="toggle-label">
              \${this.useRealData ? 'Using Real Data' : 'Using Simulated Data'}
            </span>
            <span id="\${this.containerId}-status" class="badge \${this.useRealData ? 'badge-success' : 'badge-warning'}">
              \${this.useRealData ? 'LIVE' : 'DEMO'}
            </span>
          </div>
          <label class="switch">
            <input type="checkbox" id="\${this.containerId}-switch" \${this.useRealData ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        <div class="toggle-info">
          <i class="fas fa-info-circle"></i>
          <span>Toggle between real and simulated data sources</span>
        </div>
      </div>
    \`;

    // Add event listener to the toggle
    const toggleSwitch = document.getElementById(\`\${this.containerId}-switch\`);
    if (toggleSwitch) {
      toggleSwitch.addEventListener('change', () => this.toggle());
    }
  }
}

// Export to global scope
window.DataSourceToggle = DataSourceToggle;
EOF

# Create the same enhanced toggle for the retail_edge folder
cp "${PACKAGE_DIR}/js/data_source_toggle.js" "${PACKAGE_DIR}/retail_edge/js/data_source_toggle.js"

# Create placeholder images directory for screenshots
log "Creating placeholder screenshot directory..."
mkdir -p "${PACKAGE_DIR}/images"

cat > "${PACKAGE_DIR}/images/data_toggle_example.png" << EOF
PNG placeholder - this would be a real screenshot in the final package
EOF

# Add CSS for demo mode watermark
log "Adding DEMO mode styling to CSS..."
cat >> "${PACKAGE_DIR}/css/shared-theme.css" << EOF

/* Demo Mode Styling */
.demo-mode .card {
  position: relative;
  overflow: hidden;
}

.data-source-indicator {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 8px;
}

.data-source-real {
  background-color: #28a745;
  color: white;
}

.data-source-simulated {
  background-color: #ffc107;
  color: black;
}

/* Make the watermark more prominent when hovering on cards */
.demo-mode .card:hover {
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);
}
EOF

# Create a simple README file for the package
log "Creating README file..."
cat > "${PACKAGE_DIR}/README.md" << EOF
# Project Scout Dashboard Demo Package

This package contains a complete demonstration setup for the Project Scout dashboard with data toggle functionality. It allows presenters to showcase dashboard capabilities without requiring a backend connection.

## Quick Start

1. Open \`DEMO.html\` in your browser to access the demo landing page
2. For a local server experience, run \`./run_demo_server.sh\`
3. Follow instructions in \`DEMO_QUICK_START.md\` for detailed usage

## Key Features

- Interactive toggle between real and simulated data sources
- Visual DEMO watermark when using simulated data
- Complete documentation for presentations
- Self-contained package with all required files

## Contents

- \`DEMO.html\` - Main landing page
- \`retail_edge/\` - Retail Edge Dashboard
- \`js/\` - JavaScript components
- \`css/\` - Styling
- \`assets/\` - Data files and assets
- \`docs/\` - Documentation

## Support

For questions or support, contact the Project Scout team.
EOF

# Create a ZIP file of the package
log "Creating ZIP archive..."
cd "${OUTPUT_DIR}"
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}"
cd ..

log "Package creation complete!"
log "Output: ${ZIP_FILE}"
log "You can also access the uncompressed files at: ${PACKAGE_DIR}"