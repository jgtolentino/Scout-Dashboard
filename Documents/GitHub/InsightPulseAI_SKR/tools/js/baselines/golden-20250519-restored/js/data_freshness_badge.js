/**
 * Data Freshness Badge Component
 * 
 * This component displays a badge with information about the freshness of the data
 * used in the Scout Edge dashboard. It reads the metadata.json file generated
 * by the dbt data monitoring script.
 */
class DataFreshnessBadge {
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'data-freshness-badge',
      metadataUrl: config.metadataUrl || './assets/data/metadata.json',
      refreshInterval: config.refreshInterval || 300000, // 5 minutes
      onDataLoad: config.onDataLoad || null,
      ...config
    };
    
    this.metadata = null;
    this.refreshTimer = null;
    
    this.init();
  }
  
  init() {
    // Create container if it doesn't exist
    let container = document.getElementById(this.config.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.config.containerId;
      container.className = 'data-freshness-badge';
      document.body.appendChild(container);
    }
    
    // Add styles
    if (!document.getElementById('data-freshness-badge-styles')) {
      const style = document.createElement('style');
      style.id = 'data-freshness-badge-styles';
      style.textContent = `
        .data-freshness-badge {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 5px 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          font-family: Arial, sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .data-freshness-badge:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .data-freshness-badge .badge {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .data-freshness-badge .badge.fresh {
          background-color: #4CAF50;
        }
        .data-freshness-badge .badge.stale {
          background-color: #F44336;
        }
        .data-freshness-badge .badge.unknown {
          background-color: #9E9E9E;
        }
        .data-freshness-badge-details {
          display: none;
          position: absolute;
          top: 30px;
          right: 0;
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          min-width: 300px;
          max-height: 400px;
          overflow-y: auto;
        }
        .data-freshness-badge:hover .data-freshness-badge-details {
          display: block;
        }
        .data-freshness-badge-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-freshness-badge-details table th,
        .data-freshness-badge-details table td {
          padding: 5px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .data-freshness-badge-details table th {
          font-weight: bold;
        }
        .data-freshness-badge-details h4 {
          margin: 10px 0 5px;
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Initial load
    this.loadMetadata();
    
    // Set up refresh timer
    this.refreshTimer = setInterval(() => {
      this.loadMetadata();
    }, this.config.refreshInterval);
  }
  
  loadMetadata() {
    fetch(this.config.metadataUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.metadata = data;
        this.updateUI();
        
        // Call onDataLoad callback if provided
        if (typeof this.config.onDataLoad === 'function') {
          this.config.onDataLoad(data);
        }
      })
      .catch(error => {
        console.error('Error loading metadata:', error);
        this.metadata = null;
        this.updateUI();
      });
  }
  
  updateUI() {
    const container = document.getElementById(this.config.containerId);
    
    if (!this.metadata) {
      container.innerHTML = `
        <span class="badge unknown"></span>
        <span>Data Freshness: Unknown</span>
        <div class="data-freshness-badge-details">
          <p>Unable to load data freshness information</p>
        </div>
      `;
      return;
    }
    
    // Count fresh and stale datasets
    const datasets = this.metadata.datasets || {};
    const totalDatasets = Object.keys(datasets).length;
    const freshDatasets = Object.values(datasets).filter(ds => ds.freshness && ds.freshness.is_fresh).length;
    const staleDatasets = totalDatasets - freshDatasets;
    
    // Determine overall freshness
    const isFresh = staleDatasets === 0;
    const badgeClass = isFresh ? 'fresh' : 'stale';
    const statusText = isFresh ? 'Fresh' : 'Stale';
    
    // Format generated time
    const generatedAt = this.metadata.generated_at 
      ? new Date(this.metadata.generated_at)
      : new Date();
    const formattedTime = generatedAt.toLocaleString();
    
    // Create badge HTML
    const badgeHTML = `
      <span class="badge ${badgeClass}"></span>
      <span>Data: ${statusText} (${freshDatasets}/${totalDatasets})</span>
      <div class="data-freshness-badge-details">
        <h4>Data Freshness Details</h4>
        <p>Last checked: ${formattedTime}</p>
        <p>Freshness threshold: ${this.metadata.freshness_threshold_hours || 24} hours</p>
        
        <h4>Datasets</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Updated</th>
              <th>Age (hrs)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(datasets).map(([name, data]) => `
              <tr>
                <td>${name}</td>
                <td>${data.freshness.last_update ? new Date(data.freshness.last_update).toLocaleString() : 'Unknown'}</td>
                <td>${data.freshness.age_hours?.toFixed(1) || 'Unknown'}</td>
                <td>
                  <span class="badge ${data.freshness.is_fresh ? 'fresh' : 'stale'}"></span>
                  ${data.freshness.is_fresh ? 'Fresh' : 'Stale'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${this.metadata.dbt && this.metadata.dbt.generated_at ? `
          <h4>dbt Information</h4>
          <p>Project: ${this.metadata.dbt.project_name || 'Unknown'}</p>
          <p>Generated: ${new Date(this.metadata.dbt.generated_at).toLocaleString()}</p>
          <p>dbt Version: ${this.metadata.dbt.dbt_version || 'Unknown'}</p>
        ` : ''}
      </div>
    `;
    
    container.innerHTML = badgeHTML;
  }
  
  getMetadata() {
    return this.metadata;
  }
  
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Export for browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataFreshnessBadge;
} else {
  window.DataFreshnessBadge = DataFreshnessBadge;
}