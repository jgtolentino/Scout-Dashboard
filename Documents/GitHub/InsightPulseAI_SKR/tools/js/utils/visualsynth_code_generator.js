#!/usr/bin/env node

/**
 * VisualSynth Code Generator
 * 
 * Generates responsive HTML/CSS/JS dashboard code from a wireframe specification.
 * Supports multiple themes and ensures proper accessibility and cross-browser compatibility.
 * 
 * Usage:
 *   node visualsynth_code_generator.js <wireframe_json> <schema_yaml> <theme> <output_html>
 * 
 * Example:
 *   node visualsynth_code_generator.js dashboard_wireframe.json kpi_table_mapping.yaml tbwa retail_dashboard.html
 */

const fs = require('fs');
const path = require('path');
let yaml;

// Try to load yaml parser, fallback to JSON if not available
try {
  yaml = require('js-yaml');
} catch (e) {
  yaml = null;
}

// Theme configurations
const THEMES = {
  tbwa: {
    primaryColor: '#FF3600',
    secondaryColor: '#000000',
    backgroundColor: '#F5F5F5',
    cardBackground: '#FFFFFF',
    textColor: '#333333',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    borderRadius: '8px',
    chartColors: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'],
    gridGap: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  dark: {
    primaryColor: '#FF3600',
    secondaryColor: '#3e3e3e',
    backgroundColor: '#121212',
    cardBackground: '#1e1e1e',
    textColor: '#e0e0e0',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    borderRadius: '8px',
    chartColors: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'],
    gridGap: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
  },
  executive: {
    primaryColor: '#007bff',
    secondaryColor: '#004080',
    backgroundColor: '#f8f9fa',
    cardBackground: '#FFFFFF',
    textColor: '#212529',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    borderRadius: '4px',
    chartColors: ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#343a40'],
    gridGap: '24px',
    boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
  }
};

/**
 * Generate dashboard HTML code
 * @param {object} wireframe - Dashboard wireframe specification
 * @param {object} schemaMapping - Database schema mapping
 * @param {string} themeName - Theme name
 * @return {string} Generated HTML code
 */
function generateDashboardCode(wireframe, schemaMapping, themeName) {
  // Get theme configuration
  const theme = THEMES[themeName] || THEMES.tbwa;
  
  // Start HTML template
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${wireframe.title}</title>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
  
  <!-- Dashboard Styles -->
  <style>
    :root {
      --primary-color: ${theme.primaryColor};
      --secondary-color: ${theme.secondaryColor};
      --background-color: ${theme.backgroundColor};
      --card-bg-color: ${theme.cardBackground};
      --text-color: ${theme.textColor};
      --border-radius: ${theme.borderRadius};
      --grid-gap: ${theme.gridGap};
      --box-shadow: ${theme.boxShadow};
    }
    
    body {
      font-family: ${theme.fontFamily};
      margin: 0;
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-color);
    }
    
    .dashboard-container {
      max-width: 1800px;
      margin: 0 auto;
    }
    
    .dashboard-header {
      margin-bottom: 20px;
    }
    
    .dashboard-header h1 {
      margin: 0;
      font-size: 24px;
      color: var(--primary-color);
    }
    
    .dashboard-header p {
      margin: 5px 0 15px 0;
      opacity: 0.8;
    }
    
    .filter-bar {
      background-color: var(--card-bg-color);
      padding: 10px 15px;
      border-radius: var(--border-radius);
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 20px;
      box-shadow: var(--box-shadow);
    }
    
    .filter-item {
      display: flex;
      align-items: center;
    }
    
    .filter-item label {
      margin-right: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .filter-item select, .filter-item input {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-size: 14px;
      background-color: var(--card-bg-color);
      color: var(--text-color);
    }
    
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--grid-gap);
      margin-bottom: 20px;
    }
    
    .kpi-card {
      background-color: var(--card-bg-color);
      border-radius: var(--border-radius);
      padding: 20px;
      box-shadow: var(--box-shadow);
    }
    
    .kpi-card h3 {
      margin: 0 0 5px 0;
      font-size: 16px;
      opacity: 0.8;
    }
    
    .kpi-value {
      font-size: 28px;
      font-weight: 600;
      color: var(--primary-color);
    }
    
    .kpi-comparison {
      font-size: 14px;
      margin-top: 8px;
    }
    
    .kpi-comparison.positive {
      color: #28a745;
    }
    
    .kpi-comparison.negative {
      color: #dc3545;
    }
    
    .dashboard-charts {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--grid-gap);
    }
    
    .chart-card {
      background-color: var(--card-bg-color);
      border-radius: var(--border-radius);
      padding: 20px;
      box-shadow: var(--box-shadow);
    }
    
    .chart-card h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding-bottom: 10px;
    }
    
    .chart-container {
      position: relative;
      height: 300px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th, .data-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    .data-table th {
      font-weight: 600;
      background-color: rgba(0,0,0,0.05);
    }
    
    .data-table tbody tr:hover {
      background-color: rgba(0,0,0,0.03);
    }
    
    /* Width modifiers */
    .w-1 { grid-column: span 1; }
    .w-2 { grid-column: span 2; }
    .w-3 { grid-column: span 3; }
    .w-4 { grid-column: span 4; }
    .w-5 { grid-column: span 5; }
    .w-6 { grid-column: span 6; }
    .w-7 { grid-column: span 7; }
    .w-8 { grid-column: span 8; }
    .w-9 { grid-column: span 9; }
    .w-10 { grid-column: span 10; }
    .w-11 { grid-column: span 11; }
    .w-12 { grid-column: span 12; }
    
    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .kpi-cards {
        grid-template-columns: repeat(2, 1fr);
      }
      .w-6 { grid-column: span 12; }
    }
    
    @media (max-width: 768px) {
      .kpi-cards {
        grid-template-columns: 1fr;
      }
      .w-4, .w-5, .w-6, .w-7, .w-8 { grid-column: span 12; }
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard-container">`;
  
  // Add header section
  if (wireframe.layout && wireframe.layout[0] && wireframe.layout[0].type === 'header') {
    const header = wireframe.layout[0].content;
    
    html += `
    <div class="dashboard-header">
      <h1>${header.title}</h1>
      <p>${header.subtitle || wireframe.description}</p>
      
      <div class="filter-bar">`;
    
    // Add filters
    if (header.filters) {
      header.filters.forEach(filter => {
        if (filter === 'date_range' || filter.includes('date')) {
          html += `
        <div class="filter-item">
          <label for="date-range">Date Range:</label>
          <select id="date-range">
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days" selected>Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="year_to_date">Year to Date</option>
            <option value="custom">Custom...</option>
          </select>
        </div>`;
        } else if (filter === 'region' || filter.includes('region')) {
          html += `
        <div class="filter-item">
          <label for="region-filter">Region:</label>
          <select id="region-filter">
            <option value="all" selected>All Regions</option>
            <option value="north">North</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
          </select>
        </div>`;
        } else if (filter === 'store' || filter.includes('store')) {
          html += `
        <div class="filter-item">
          <label for="store-filter">Store:</label>
          <select id="store-filter">
            <option value="all" selected>All Stores</option>
            <option value="s001">Store 001</option>
            <option value="s002">Store 002</option>
            <option value="s003">Store 003</option>
            <option value="s004">Store 004</option>
            <option value="s005">Store 005</option>
          </select>
        </div>`;
        }
      });
    }
    
    html += `
      </div>
    </div>`;
  }
  
  // Add KPI cards section
  const kpiRow = wireframe.layout && wireframe.layout[1] && wireframe.layout[1].type === 'row' 
    ? wireframe.layout[1].content : [];
  
  if (kpiRow && kpiRow.length > 0) {
    html += `
    <div class="kpi-cards">`;
    
    kpiRow.forEach(kpi => {
      if (kpi.type === 'kpi_card') {
        // Generate KPI card with comparison if available
        let comparisonHtml = '';
        if (kpi.comparison) {
          comparisonHtml = `
        <div class="kpi-comparison positive">
          <span class="arrow">▲</span> 5.2% vs last period
        </div>`;
        }
        
        html += `
      <div class="kpi-card">
        <h3>${kpi.title}</h3>
        <div class="kpi-value">${kpi.format === 'currency' ? '$' : ''}${generateSampleValue(kpi.metric, kpi.format)}</div>${comparisonHtml}
      </div>`;
      }
    });
    
    html += `
    </div>`;
  }
  
  // Add charts section
  html += `
    <div class="dashboard-charts">`;
  
  // Process charts and tables from layout (skip header and KPI row)
  for (let i = 2; i < wireframe.layout.length; i++) {
    const component = wireframe.layout[i];
    
    if (component.type === 'chart') {
      // Chart component
      html += `
      <div class="chart-card w-${component.width || 6}">
        <h2>${component.title}</h2>
        <div class="chart-container">
          <canvas id="${getComponentId(component.title)}"></canvas>
        </div>
      </div>`;
    } else if (component.type === 'table') {
      // Table component
      html += `
      <div class="chart-card w-${component.width || 6}">
        <h2>${component.title}</h2>
        <div class="table-container">
          <table class="data-table" id="${getComponentId(component.title)}">
            <thead>
              <tr>`;
      
      // Add table headers if available
      if (component.data && component.data.columns) {
        component.data.columns.forEach(column => {
          html += `
                <th>${column.label || column.field}</th>`;
        });
      } else {
        // Default headers
        html += `
                <th>SKU</th>
                <th>Product</th>
                <th>Brand</th>
                <th>Units</th>
                <th>Sales</th>`;
      }
      
      html += `
              </tr>
            </thead>
            <tbody>
              <!-- Table data will be populated by JavaScript -->
            </tbody>
          </table>
        </div>
      </div>`;
    }
  }
  
  html += `
    </div>
  </div>

  <script>
    // Dashboard initialization
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize filters
      initializeFilters();
      
      // Load and display dashboard data
      loadDashboardData();
    });
    
    // Filter initialization
    function initializeFilters() {
      const filters = document.querySelectorAll('.filter-item select, .filter-item input');
      filters.forEach(filter => {
        filter.addEventListener('change', function() {
          loadDashboardData();
        });
      });
    }
    
    // Load dashboard data
    function loadDashboardData() {
      // In a real implementation, this would fetch data from an API
      // based on the current filter values
      
      // For this demo, we'll use sample data
      const sampleData = {`;
  
  // Generate sample data for each component
  const charts = [];
  const tables = [];
  
  // Process charts and tables from layout (skip header and KPI row)
  for (let i = 2; i < wireframe.layout.length; i++) {
    const component = wireframe.layout[i];
    const componentId = getComponentId(component.title);
    
    if (component.type === 'chart') {
      charts.push({
        id: componentId,
        type: component.chart_type,
        title: component.title
      });
      
      // Generate sample data based on chart type
      if (component.chart_type === 'bar') {
        html += `
        ${componentId}Data: {
          labels: ['Store A', 'Store B', 'Store C', 'Store D', 'Store E'],
          datasets: [{
            label: '${component.title}',
            data: [${generateRandomValues(5)}],
            backgroundColor: '${theme.chartColors[0]}'
          }]
        },`;
      } else if (component.chart_type === 'line') {
        html += `
        ${componentId}Data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: '${component.title}',
            data: [${generateRandomValues(6)}],
            borderColor: '${theme.chartColors[2]}',
            tension: 0.3,
            fill: false
          }]
        },`;
      }
    } else if (component.type === 'table') {
      tables.push({
        id: componentId,
        title: component.title
      });
      
      // Generate sample data for tables
      if (component.title.includes('SKU') || component.title.includes('Product')) {
        html += `
        ${componentId}Data: [
          { sku: 'SKU001', name: 'Premium Headphones', brand: 'AudioMax', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000} },
          { sku: 'SKU002', name: 'Wireless Earbuds', brand: 'AudioMax', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000} },
          { sku: 'SKU003', name: 'Bluetooth Speaker', brand: 'SoundWave', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000} },
          { sku: 'SKU004', name: 'Phone Case', brand: 'TechShield', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000} },
          { sku: 'SKU005', name: 'Charging Cable', brand: 'PowerLink', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000} }
        ],`;
      }
    }
  }
  
  html += `
      };
      
      // Render charts and tables
      renderDashboard(sampleData);
    }
    
    // Render dashboard components
    function renderDashboard(data) {`;
  
  // Generate render code for each chart
  charts.forEach(chart => {
    if (chart.type === 'bar' || chart.type === 'line') {
      html += `
      // Render ${chart.title}
      renderChart('${chart.id}', '${chart.type}', data.${chart.id}Data);`;
    }
  });
  
  // Generate render code for each table
  tables.forEach(table => {
    html += `
      // Render ${table.title}
      renderTable('${table.id}', data.${table.id}Data);`;
  });
  
  html += `
    }
    
    // Chart rendering function
    function renderChart(elementId, chartType, chartData) {
      const ctx = document.getElementById(elementId).getContext('2d');
      
      // Destroy existing chart if it exists
      if (window[elementId + 'Chart']) {
        window[elementId + 'Chart'].destroy();
      }
      
      // Create new chart
      window[elementId + 'Chart'] = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    
    // Table rendering function
    function renderTable(elementId, tableData) {
      const tableBody = document.querySelector('#' + elementId + ' tbody');
      tableBody.innerHTML = '';
      
      tableData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Dynamic rendering based on available properties
        if (row.sku) tr.innerHTML += \`<td>\${row.sku}</td>\`;
        if (row.name) tr.innerHTML += \`<td>\${row.name}</td>\`;
        if (row.brand) tr.innerHTML += \`<td>\${row.brand}</td>\`;
        if (row.units) tr.innerHTML += \`<td>\${row.units}</td>\`;
        if (row.sales) tr.innerHTML += \`<td>$\${row.sales.toLocaleString()}</td>\`;
        
        tableBody.appendChild(tr);
      });
    }
  </script>
</body>
</html>`;
  
  return html;
}

// Helper function to generate a component ID from title
function getComponentId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to generate sample values for KPIs
function generateSampleValue(metric, format) {
  if (format === 'currency') {
    return Math.floor(Math.random() * 1000000).toLocaleString();
  } else if (format === 'percent') {
    return (Math.floor(Math.random() * 100)).toLocaleString() + '%';
  } else if (metric.includes('score') || metric.includes('index')) {
    return (Math.floor(Math.random() * 30) + 70).toLocaleString();
  } else {
    return Math.floor(Math.random() * 10000).toLocaleString();
  }
}

// Helper function to generate random values for charts
function generateRandomValues(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 100));
}

// Main function
function main() {
  // Check arguments
  if (process.argv.length < 5) {
    console.error('Usage: node visualsynth_code_generator.js <wireframe_json> <schema_yaml> <theme> <output_html>');
    process.exit(1);
  }
  
  const wireframePath = process.argv[2];
  const schemaPath = process.argv[3];
  const themeName = process.argv[4];
  const outputPath = process.argv[5];
  
  try {
    // Read wireframe
    const wireframe = JSON.parse(fs.readFileSync(wireframePath, 'utf8'));
    
    // Read schema mapping, supporting YAML or JSON
    let schemaMapping;
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (yaml && (schemaPath.endsWith('.yaml') || schemaPath.endsWith('.yml'))) {
      schemaMapping = yaml.load(schemaContent);
    } else {
      // Try parsing as JSON
      try {
        schemaMapping = JSON.parse(schemaContent);
      } catch (e) {
        // If both YAML and JSON parsing fail, use a simple line-based parser
        // This is a fallback for when js-yaml is not available
        schemaMapping = {};
        const lines = schemaContent.split('\n');
        let currentKey = null;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // New key starts
          if (!line.startsWith(' ') && line.includes(':')) {
            const [key, value] = line.split(':', 2);
            currentKey = key.trim();
            schemaMapping[currentKey] = {};
          } 
          // Key properties
          else if (currentKey && line.includes(':')) {
            const [key, value] = line.split(':', 2).map(s => s.trim());
            if (value === '') {
              schemaMapping[currentKey][key] = [];
            } else if (value.startsWith('[') && value.endsWith(']')) {
              schemaMapping[currentKey][key] = value
                .substring(1, value.length - 1)
                .split(',')
                .map(s => s.trim());
            } else {
              schemaMapping[currentKey][key] = value;
            }
          }
        }
      }
    }
    
    // Generate dashboard code
    const htmlCode = generateDashboardCode(wireframe, schemaMapping, themeName);
    
    // Write output
    fs.writeFileSync(outputPath, htmlCode);
    
    console.log(`Dashboard code generated and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  generateDashboardCode
};