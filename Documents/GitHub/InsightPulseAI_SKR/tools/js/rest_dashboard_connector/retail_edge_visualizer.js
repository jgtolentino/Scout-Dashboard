/**
 * Retail Edge Visualizer
 * Data adapter for connecting dashboards to ADLS Gen2 via Azure Function proxy
 */

// Base API URL for data function
const API_BASE_URL = process.env.API_BASE_URL || 'https://tbwa-analytics-api.azurewebsites.net/api';

/**
 * Fetch KPI data from data API
 * @param {string} table - Table path in Gold container (e.g., 'scout/semantic/brand_kpi_latest')
 * @returns {Promise<Object>} - JSON data from the specified table
 */
async function fetchKpi(table) {
  try {
    const response = await fetch(`${API_BASE_URL}/data?table=${encodeURIComponent(table)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching KPI data: ${error.message}`);
    throw error;
  }
}

/**
 * Check data freshness by fetching the heartbeat file
 * @returns {Promise<Object>} - Freshness status with timestamp and age
 */
async function checkDataFreshness() {
  try {
    const response = await fetch(`${API_BASE_URL}/data?table=heartbeat.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch heartbeat: ${response.status}`);
    }
    
    const { updated } = await response.json();
    const updatedTime = Date.parse(updated);
    const ageInMs = Date.now() - updatedTime;
    const ageInMinutes = Math.floor(ageInMs / (60 * 1000));
    
    return {
      lastUpdated: updated,
      ageInMinutes,
      isFresh: ageInMinutes < 60, // Consider data fresh if less than 60 minutes old
      status: ageInMinutes < 60 ? 'fresh' : 'stale'
    };
  } catch (error) {
    console.error(`Error checking data freshness: ${error.message}`);
    return {
      error: error.message,
      status: 'error'
    };
  }
}

/**
 * Initialize dashboard with brand KPI data
 * @param {string} selector - CSS selector for dashboard container
 * @returns {Promise<void>}
 */
async function initDashboard(selector) {
  const container = document.querySelector(selector);
  if (!container) {
    console.error(`Dashboard container not found: ${selector}`);
    return;
  }
  
  try {
    // Check data freshness
    const freshness = await checkDataFreshness();
    
    // Add freshness indicator to dashboard
    const freshnessIndicator = document.createElement('div');
    freshnessIndicator.className = `data-freshness ${freshness.status}`;
    freshnessIndicator.innerHTML = `
      <span class="indicator-dot"></span>
      <span class="freshness-text">
        Data ${freshness.status}: ${freshness.lastUpdated || 'Unknown'}
        ${freshness.ageInMinutes ? `(${freshness.ageInMinutes} minutes ago)` : ''}
      </span>
    `;
    container.appendChild(freshnessIndicator);
    
    // Fetch and display brand KPIs
    const kpiData = await fetchKpi('scout/semantic/brand_kpi_latest');
    
    // Render KPI cards (implementation depends on your visualization library)
    renderKpiCards(container, kpiData);
    
  } catch (error) {
    console.error(`Dashboard initialization error: ${error.message}`);
    container.innerHTML = `<div class="error-message">
      Failed to load dashboard data: ${error.message}
    </div>`;
  }
}

/**
 * Render KPI cards from data
 * @param {HTMLElement} container - Container element
 * @param {Object} data - KPI data
 */
function renderKpiCards(container, data) {
  // Implementation depends on your visualization library (D3, Chart.js, etc.)
  // This is a placeholder
  
  const kpiContainer = document.createElement('div');
  kpiContainer.className = 'kpi-container';
  
  // Render each KPI as a card
  if (data.kpis && Array.isArray(data.kpis)) {
    data.kpis.forEach(kpi => {
      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `
        <h3>${kpi.name}</h3>
        <div class="kpi-value">${kpi.value}</div>
        <div class="kpi-change ${kpi.change > 0 ? 'positive' : kpi.change < 0 ? 'negative' : 'neutral'}">
          ${kpi.change > 0 ? '↑' : kpi.change < 0 ? '↓' : '−'} ${Math.abs(kpi.change)}%
        </div>
      `;
      kpiContainer.appendChild(card);
    });
  }
  
  container.appendChild(kpiContainer);
}

// Export functions for use in dashboard
module.exports = {
  fetchKpi,
  checkDataFreshness,
  initDashboard
};