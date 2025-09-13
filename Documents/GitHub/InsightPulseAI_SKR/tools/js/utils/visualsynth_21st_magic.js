#!/usr/bin/env node

/**
 * VisualSynth 21st Magic Integration
 * 
 * Enhances dashboard visualizations with 21st Magic capabilities:
 * - 3D data visualization components
 * - Animated data transitions and storytelling
 * - Interactive exploration with spatial representation
 * - Real-time data updates with fluid animations
 * 
 * Usage:
 *   node visualsynth_21st_magic.js <wireframe_json> <schema_yaml> <theme> <output_html>
 * 
 * Example:
 *   node visualsynth_21st_magic.js dashboard_wireframe.json kpi_table_mapping.yaml tbwa_magic_dark magic_dashboard.html
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

// 21st Magic Theme configurations
const MAGIC_THEMES = {
  tbwa_magic_dark: {
    primaryColor: '#FF3600',
    secondaryColor: '#121212',
    accentColor: '#00C6FF',
    backgroundColor: '#0A0A0A',
    cardBackground: '#1A1A1A',
    textColor: '#FFFFFF',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    borderRadius: '12px',
    chartColors: ['#FF3600', '#00C6FF', '#7B61FF', '#00E0A1', '#FFB800', '#FF5CB4', '#9B51E0', '#00B2FF'],
    gridGap: '24px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
    animationDuration: '0.5s',
    glowEffects: true,
    particleDensity: 'high',
    depthEffect: true
  },
  tbwa_magic_light: {
    primaryColor: '#FF3600',
    secondaryColor: '#F0F0F0',
    accentColor: '#0055FF',
    backgroundColor: '#FFFFFF',
    cardBackground: '#F9F9F9',
    textColor: '#222222',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    borderRadius: '12px',
    chartColors: ['#FF3600', '#0055FF', '#7B61FF', '#00C170', '#FFB800', '#FF5CB4', '#9B51E0', '#00B2FF'],
    gridGap: '24px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
    animationDuration: '0.5s',
    glowEffects: false,
    particleDensity: 'medium',
    depthEffect: true
  },
  executive_3d: {
    primaryColor: '#0070C0',
    secondaryColor: '#2E3440',
    accentColor: '#FFCC00',
    backgroundColor: '#ECEFF4',
    cardBackground: '#FFFFFF',
    textColor: '#2E3440',
    fontFamily: "'Segoe UI', 'SF Pro Display', Arial, sans-serif",
    borderRadius: '8px',
    chartColors: ['#0070C0', '#00B050', '#C00000', '#7030A0', '#FFC000', '#00B0F0', '#FF6666', '#00FF99'],
    gridGap: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
    animationDuration: '0.7s',
    glowEffects: false,
    particleDensity: 'low',
    depthEffect: true
  },
  retail_interactive: {
    primaryColor: '#6200EA',
    secondaryColor: '#424242',
    accentColor: '#00E5FF',
    backgroundColor: '#FAFAFA',
    cardBackground: '#FFFFFF',
    textColor: '#212121',
    fontFamily: "'SF Pro Display', 'Segoe UI', Arial, sans-serif",
    borderRadius: '16px',
    chartColors: ['#6200EA', '#00E5FF', '#FF4081', '#00B0FF', '#FF9100', '#00C853', '#AA00FF', '#FFD600'],
    gridGap: '24px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
    animationDuration: '0.6s',
    glowEffects: true,
    particleDensity: 'high',
    depthEffect: true
  },
  immersive_data_story: {
    primaryColor: '#FF9800',
    secondaryColor: '#263238',
    accentColor: '#1DE9B6',
    backgroundColor: '#0A1929',
    cardBackground: '#132F4C',
    textColor: '#FFFFFF',
    fontFamily: "'SF Pro Display', 'Segoe UI', Arial, sans-serif",
    borderRadius: '20px',
    chartColors: ['#FF9800', '#1DE9B6', '#00B0FF', '#F44336', '#8BC34A', '#9C27B0', '#FFEB3B', '#00E5FF'],
    gridGap: '28px',
    boxShadow: '0 16px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
    animationDuration: '0.8s',
    glowEffects: true,
    particleDensity: 'high',
    depthEffect: true
  }
};

/**
 * Generate enhanced dashboard HTML code with 21st Magic features
 * @param {object} wireframe - Dashboard wireframe specification
 * @param {object} schemaMapping - Database schema mapping
 * @param {string} themeName - Theme name
 * @return {string} Generated HTML code
 */
function generateMagicDashboardCode(wireframe, schemaMapping, themeName) {
  // Get theme configuration
  const theme = MAGIC_THEMES[themeName] || MAGIC_THEMES.tbwa_magic_dark;
  
  // Start HTML template
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${wireframe.title} | 21st Magic Visualization</title>
  
  <!-- Required libraries -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.9.1/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/d3@7.3.0/dist/d3.min.js"></script>
  
  <!-- 21st Magic Core Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/21st-magic-viz@latest/dist/magic-viz.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/21st-magic-viz@latest/dist/magic-particles.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/21st-magic-viz@latest/dist/magic-transitions.min.js"></script>
  
  <!-- Dashboard Styles -->
  <style>
    :root {
      --primary-color: ${theme.primaryColor};
      --secondary-color: ${theme.secondaryColor};
      --accent-color: ${theme.accentColor};
      --background-color: ${theme.backgroundColor};
      --card-bg-color: ${theme.cardBackground};
      --text-color: ${theme.textColor};
      --border-radius: ${theme.borderRadius};
      --grid-gap: ${theme.gridGap};
      --box-shadow: ${theme.boxShadow};
      --animation-duration: ${theme.animationDuration};
    }
    
    * {
      box-sizing: border-box;
      transition: all 0.3s ease;
    }
    
    body {
      font-family: ${theme.fontFamily};
      margin: 0;
      padding: 20px;
      background-color: var(--background-color);
      color: var(--text-color);
      overflow-x: hidden;
    }
    
    .dashboard-container {
      max-width: 1800px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      animation: fadeIn 0.8s forwards;
    }
    
    @keyframes fadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dashboard-header {
      margin-bottom: 30px;
      position: relative;
    }
    
    .dashboard-header h1 {
      margin: 0;
      font-size: 32px;
      color: var(--primary-color);
      position: relative;
      display: inline-block;
    }
    
    .dashboard-header h1::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 4px;
      background-color: var(--primary-color);
      border-radius: 2px;
    }
    
    .dashboard-header p {
      margin: 15px 0;
      opacity: 0.8;
      font-size: 16px;
      max-width: 700px;
    }
    
    .filter-bar {
      background-color: var(--card-bg-color);
      padding: 15px 20px;
      border-radius: var(--border-radius);
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;
      margin-bottom: 30px;
      box-shadow: var(--box-shadow);
      backdrop-filter: blur(10px);
    }
    
    .filter-item {
      display: flex;
      align-items: center;
    }
    
    .filter-item label {
      margin-right: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
      opacity: 0.8;
    }
    
    .filter-item select, .filter-item input {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(125, 125, 125, 0.2);
      font-size: 14px;
      background-color: var(--card-bg-color);
      color: var(--text-color);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    .filter-item select:hover, .filter-item input:hover {
      border-color: var(--primary-color);
    }
    
    .filter-item select:focus, .filter-item input:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
    }
    
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--grid-gap);
      margin-bottom: 30px;
    }
    
    .kpi-card {
      background-color: var(--card-bg-color);
      border-radius: var(--border-radius);
      padding: 25px;
      box-shadow: var(--box-shadow);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .kpi-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
    }
    
    .kpi-card h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      opacity: 0.8;
      position: relative;
      z-index: 2;
    }
    
    .kpi-value {
      font-size: 36px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 10px;
      position: relative;
      z-index: 2;
    }
    
    .kpi-comparison {
      font-size: 14px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    
    .kpi-comparison.positive {
      color: #00E676;
    }
    
    .kpi-comparison.negative {
      color: #FF5252;
    }
    
    .kpi-comparison .arrow {
      margin-right: 5px;
    }
    
    .kpi-background {
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 100%;
      opacity: 0.1;
      z-index: 1;
    }
    
    .dashboard-charts {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--grid-gap);
    }
    
    .chart-card {
      background-color: var(--card-bg-color);
      border-radius: var(--border-radius);
      padding: 25px;
      box-shadow: var(--box-shadow);
      transition: transform 0.3s ease;
      position: relative;
      min-height: 350px;
    }
    
    .chart-card:hover {
      transform: translateY(-3px);
    }
    
    .chart-card h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      position: relative;
      padding-bottom: 12px;
    }
    
    .chart-card h2::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background-color: var(--primary-color);
      border-radius: 1.5px;
    }
    
    .chart-container {
      position: relative;
      height: 300px;
      z-index: 1;
    }
    
    .chart-container canvas {
      border-radius: 6px;
    }
    
    .chart-container-3d {
      position: relative;
      height: 400px;
      z-index: 1;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th, .data-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid rgba(125, 125, 125, 0.1);
    }
    
    .data-table th {
      font-weight: 600;
      opacity: 0.8;
    }
    
    .data-table tbody tr {
      transition: background-color 0.3s ease;
    }
    
    .data-table tbody tr:hover {
      background-color: rgba(var(--primary-color-rgb), 0.1);
    }
    
    .data-table td .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .data-table td .status.green {
      background-color: rgba(0, 200, 83, 0.1);
      color: #00C853;
    }
    
    .data-table td .status.red {
      background-color: rgba(255, 82, 82, 0.1);
      color: #FF5252;
    }
    
    .data-table td .status.yellow {
      background-color: rgba(255, 193, 7, 0.1);
      color: #FFC107;
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
    
    /* Height modifiers */
    .h-tall { height: 500px; }
    
    /* 21st Magic Special Effects */
    ${theme.glowEffects ? `
    .glow-effect {
      position: relative;
    }
    
    .glow-effect::before {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      border-radius: calc(var(--border-radius) + 5px);
      background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
      opacity: 0.5;
      filter: blur(15px);
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .glow-effect:hover::before {
      opacity: 0.7;
    }
    ` : ''}
    
    /* Particle background */
    #particle-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      opacity: 0.2;
      pointer-events: none;
    }
    
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
      .chart-container-3d {
        height: 300px;
      }
    }
    
    /* Animation classes */
    .animate-fade-in {
      animation: fadeIn 0.5s forwards;
    }
    
    .animate-slide-up {
      animation: slideUp 0.5s forwards;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Theme toggle switch */
    .theme-switch {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .theme-switch label {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--secondary-color);
      transition: .4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: var(--primary-color);
    }
    
    input:focus + .slider {
      box-shadow: 0 0 1px var(--primary-color);
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    /* Loading overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--background-color);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-color);
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <!-- Loading overlay -->
  <div class="loading-overlay" id="loading-overlay">
    <div class="loading-spinner"></div>
  </div>

  <!-- Theme switch -->
  <div class="theme-switch">
    <label>Toggle theme</label>
    <label class="switch">
      <input type="checkbox" id="theme-toggle">
      <span class="slider"></span>
    </label>
  </div>
  
  <!-- Particle background -->
  <div id="particle-container"></div>
  
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
          <select id="date-range" class="magic-filter" data-filter-type="date">
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
          <select id="region-filter" class="magic-filter" data-filter-type="region">
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
          <select id="store-filter" class="magic-filter" data-filter-type="store">
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
    
    kpiRow.forEach((kpi, index) => {
      if (kpi.type === 'kpi_card') {
        // Generate KPI card with comparison if available
        let comparisonHtml = '';
        let comparisonClass = 'positive';
        let comparisonArrow = '▲';
        let comparisonValue = Math.floor(Math.random() * 10) + 1;
        
        // Randomly make some comparisons negative
        if (Math.random() > 0.7) {
          comparisonClass = 'negative';
          comparisonArrow = '▼';
          comparisonValue = Math.floor(Math.random() * 5) + 1;
        }
        
        if (kpi.comparison !== false) {
          comparisonHtml = `
        <div class="kpi-comparison ${comparisonClass}">
          <span class="arrow">${comparisonArrow}</span> ${comparisonValue}.${Math.floor(Math.random() * 9)}% vs last period
        </div>`;
        }
        
        // Generate background pattern based on KPI type
        let backgroundSvg = `
        <svg class="kpi-background" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 Q25,${Math.random() * 50 + 25} 50,50 T100,50 T150,50 T200,50" stroke="${theme.primaryColor}" stroke-width="2" fill="none" />
          <path d="M0,70 Q25,${Math.random() * 50 + 25} 50,70 T100,70 T150,70 T200,70" stroke="${theme.primaryColor}" stroke-width="2" fill="none" />
          <path d="M0,30 Q25,${Math.random() * 50 + 25} 50,30 T100,30 T150,30 T200,30" stroke="${theme.primaryColor}" stroke-width="2" fill="none" />
        </svg>`;
        
        // Different pattern for every card
        if (index % 3 === 1) {
          backgroundSvg = `
          <svg class="kpi-background" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="170" cy="50" r="30" fill="${theme.primaryColor}" fill-opacity="0.2" />
            <circle cx="170" cy="50" r="20" fill="${theme.primaryColor}" fill-opacity="0.3" />
            <circle cx="170" cy="50" r="10" fill="${theme.primaryColor}" fill-opacity="0.4" />
          </svg>`;
        } else if (index % 3 === 2) {
          backgroundSvg = `
          <svg class="kpi-background" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="140" y="20" width="15" height="60" fill="${theme.primaryColor}" fill-opacity="0.2" />
            <rect x="160" y="10" width="15" height="80" fill="${theme.primaryColor}" fill-opacity="0.3" />
            <rect x="180" y="30" width="15" height="40" fill="${theme.primaryColor}" fill-opacity="0.4" />
          </svg>`;
        }
        
        html += `
      <div class="kpi-card${theme.glowEffects ? ' glow-effect' : ''}" id="kpi-card-${index}" data-aos="fade-up" data-aos-delay="${index * 100}">
        <h3>${kpi.title}</h3>
        <div class="kpi-value" id="kpi-value-${index}">${kpi.format === 'currency' ? '$' : ''}${generateSampleValue(kpi.metric, kpi.format)}</div>${comparisonHtml}
        ${backgroundSvg}
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
    const componentId = getComponentId(component.title);
    
    if (component.type === 'chart') {
      // Determine if this should be a 3D chart based on component properties
      const is3D = component.visualization_mode === '3d' || 
                  (component.title && (component.title.includes('3D') || component.title.includes('3d')));
      
      // Chart component
      html += `
      <div class="chart-card w-${component.width || 6}" id="chart-card-${componentId}" data-aos="fade-up" data-aos-delay="${(i-2) * 100}">
        <h2>${component.title}</h2>
        <div class="${is3D ? 'chart-container-3d' : 'chart-container'}">
          <canvas id="${componentId}" ${is3D ? 'class="magic-3d-chart"' : 'class="magic-chart"'} data-chart-type="${component.chart_type || 'bar'}"></canvas>
        </div>
      </div>`;
    } else if (component.type === 'table') {
      // Table component
      html += `
      <div class="chart-card w-${component.width || 6}" id="table-card-${componentId}" data-aos="fade-up" data-aos-delay="${(i-2) * 100}">
        <h2>${component.title}</h2>
        <div class="table-container">
          <table class="data-table" id="${componentId}">
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
                <th>Sales</th>
                <th>Status</th>`;
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
      // Initialize 21st Magic components
      initializeMagic();
      
      // Initialize filters
      initializeFilters();
      
      // Set up theme toggle
      initializeThemeToggle();
      
      // Load and display dashboard data
      loadDashboardData();
      
      // Hide loading overlay when everything is ready
      setTimeout(() => {
        document.getElementById('loading-overlay').style.opacity = '0';
        document.getElementById('loading-overlay').style.visibility = 'hidden';
      }, 1000);
    });
    
    // Initialize 21st Magic components
    function initializeMagic() {
      // Initialize particle background
      if (window.MagicParticles) {
        new MagicParticles({
          container: document.getElementById('particle-container'),
          density: '${theme.particleDensity}',
          color: '${theme.primaryColor}',
          opacityMin: 0.1,
          opacityMax: 0.3,
          sizeMin: 1,
          sizeMax: 3,
          speed: 0.5,
          responsive: true
        });
      }
      
      // Initialize animations for elements (if AOS doesn't exist, create simple version)
      if (!window.AOS) {
        window.AOS = {
          init: function() {
            document.querySelectorAll('[data-aos]').forEach(el => {
              setTimeout(() => {
                el.classList.add('animate-fade-in');
              }, parseInt(el.getAttribute('data-aos-delay') || 0));
            });
          }
        };
      }
      
      window.AOS.init();
    }
    
    // Filter initialization
    function initializeFilters() {
      const filters = document.querySelectorAll('.magic-filter');
      filters.forEach(filter => {
        filter.addEventListener('change', function() {
          animateFilterChange(this.getAttribute('data-filter-type'));
          loadDashboardData();
        });
      });
    }
    
    // Animate filter changes
    function animateFilterChange(filterType) {
      // Animate related charts when filter changes
      document.querySelectorAll('.chart-card').forEach(card => {
        card.style.opacity = 0.5;
        setTimeout(() => {
          card.style.opacity = 1;
        }, 300);
      });
      
      // Animate KPI cards
      document.querySelectorAll('.kpi-card').forEach(card => {
        card.style.transform = 'translateY(5px)';
        setTimeout(() => {
          card.style.transform = 'translateY(0)';
        }, 300);
      });
    }
    
    // Initialize theme toggle
    function initializeThemeToggle() {
      const toggle = document.getElementById('theme-toggle');
      toggle.addEventListener('change', function() {
        if (this.checked) {
          document.documentElement.setAttribute('data-theme', 'light');
          switchToLightTheme();
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          switchToDarkTheme();
        }
      });
      
      // Set initial state based on theme
      if (isLightTheme()) {
        toggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        toggle.checked = false;
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
    
    function isLightTheme() {
      const themeName = '${themeName}';
      return themeName.includes('light');
    }
    
    function switchToDarkTheme() {
      document.documentElement.style.setProperty('--background-color', '${MAGIC_THEMES.tbwa_magic_dark.backgroundColor}');
      document.documentElement.style.setProperty('--card-bg-color', '${MAGIC_THEMES.tbwa_magic_dark.cardBackground}');
      document.documentElement.style.setProperty('--text-color', '${MAGIC_THEMES.tbwa_magic_dark.textColor}');
      
      // Redraw charts with dark theme
      updateChartThemes('dark');
    }
    
    function switchToLightTheme() {
      document.documentElement.style.setProperty('--background-color', '${MAGIC_THEMES.tbwa_magic_light.backgroundColor}');
      document.documentElement.style.setProperty('--card-bg-color', '${MAGIC_THEMES.tbwa_magic_light.cardBackground}');
      document.documentElement.style.setProperty('--text-color', '${MAGIC_THEMES.tbwa_magic_light.textColor}');
      
      // Redraw charts with light theme
      updateChartThemes('light');
    }
    
    function updateChartThemes(theme) {
      // Update all charts with new theme
      Object.keys(window.dashboardCharts || {}).forEach(chartId => {
        const chart = window.dashboardCharts[chartId];
        if (chart && chart.options) {
          if (theme === 'dark') {
            chart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.options.scales.x.ticks.color = 'rgba(255, 255, 255, 0.7)';
            chart.options.scales.y.ticks.color = 'rgba(255, 255, 255, 0.7)';
          } else {
            chart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.x.ticks.color = 'rgba(0, 0, 0, 0.7)';
            chart.options.scales.y.ticks.color = 'rgba(0, 0, 0, 0.7)';
          }
          chart.update();
        }
      });
      
      // Update 3D charts if available
      if (window.Magic3DCharts) {
        Object.keys(window.Magic3DCharts).forEach(chartId => {
          const chart = window.Magic3DCharts[chartId];
          if (chart && chart.setTheme) {
            chart.setTheme(theme);
          }
        });
      }
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
  const magic3DCharts = [];
  
  // Process charts and tables from layout (skip header and KPI row)
  for (let i = 2; i < wireframe.layout.length; i++) {
    const component = wireframe.layout[i];
    const componentId = getComponentId(component.title);
    
    if (component.type === 'chart') {
      const is3D = component.visualization_mode === '3d' || 
                 (component.title && (component.title.includes('3D') || component.title.includes('3d')));
      
      if (is3D) {
        magic3DCharts.push({
          id: componentId,
          type: component.chart_type || 'bar3d',
          title: component.title
        });
        
        // Generate 3D chart data
        html += `
        ${componentId}Data: {
          labels: ['Store A', 'Store B', 'Store C', 'Store D', 'Store E'],
          datasets: [{
            label: '${component.title}',
            data: [${generateRandomValues(5)}],
            backgroundColor: ${JSON.stringify(theme.chartColors.slice(0, 5))},
            hoverBackgroundColor: ${JSON.stringify(theme.chartColors.slice(0, 5).map(color => color.replace(')', ', 0.8)').replace('rgb', 'rgba')))}
          }]
        },`;
      } else {
        charts.push({
          id: componentId,
          type: component.chart_type || 'bar',
          title: component.title
        });
        
        // Generate sample data based on chart type
        if (component.chart_type === 'bar' || !component.chart_type) {
          html += `
          ${componentId}Data: {
            labels: ['Store A', 'Store B', 'Store C', 'Store D', 'Store E'],
            datasets: [{
              label: '${component.title}',
              data: [${generateRandomValues(5)}],
              backgroundColor: ${JSON.stringify(theme.chartColors.slice(0, 5))},
              borderColor: ${JSON.stringify(theme.chartColors.slice(0, 5))},
              borderWidth: 1
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
              borderWidth: 2,
              tension: 0.4,
              fill: false,
              pointBackgroundColor: '${theme.chartColors[2]}',
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },`;
        } else if (component.chart_type === 'pie' || component.chart_type === 'doughnut') {
          html += `
          ${componentId}Data: {
            labels: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
            datasets: [{
              data: [${generateRandomValues(5)}],
              backgroundColor: ${JSON.stringify(theme.chartColors.slice(0, 5))},
              borderColor: '${theme.cardBackground}',
              borderWidth: 2,
              hoverOffset: 10
            }]
          },`;
        }
      }
    } else if (component.type === 'table') {
      tables.push({
        id: componentId,
        title: component.title
      });
      
      // Generate sample data for tables
      if (component.title.includes('SKU') || component.title.includes('Product') || component.title.toLowerCase().includes('sales')) {
        html += `
        ${componentId}Data: [
          { sku: 'SKU001', name: 'Premium Headphones', brand: 'AudioMax', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000}, status: 'green' },
          { sku: 'SKU002', name: 'Wireless Earbuds', brand: 'AudioMax', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000}, status: 'green' },
          { sku: 'SKU003', name: 'Bluetooth Speaker', brand: 'SoundWave', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000}, status: 'yellow' },
          { sku: 'SKU004', name: 'Phone Case', brand: 'TechShield', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000}, status: 'green' },
          { sku: 'SKU005', name: 'Charging Cable', brand: 'PowerLink', units: ${Math.floor(Math.random() * 1000) + 500}, sales: ${Math.floor(Math.random() * 50000) + 10000}, status: 'red' }
        ],`;
      }
    }
  }
  
  html += `
      };
      
      // Render charts and tables with animation
      renderDashboard(sampleData);
      
      // Simulate real-time updates every 10 seconds
      setupLiveDataSimulation();
    }
    
    // Render dashboard components
    function renderDashboard(data) {
      // Prepare storage for chart instances
      window.dashboardCharts = window.dashboardCharts || {};
      window.Magic3DCharts = window.Magic3DCharts || {};`;
  
  // Generate render code for each regular chart
  charts.forEach(chart => {
    html += `
      // Render ${chart.title}
      renderMagicChart('${chart.id}', '${chart.type}', data.${chart.id}Data);`;
  });
  
  // Generate render code for each 3D chart
  magic3DCharts.forEach(chart => {
    html += `
      // Render 3D ${chart.title}
      renderMagic3DChart('${chart.id}', '${chart.type}', data.${chart.id}Data);`;
  });
  
  // Generate render code for each table
  tables.forEach(table => {
    html += `
      // Render ${table.title}
      renderMagicTable('${table.id}', data.${table.id}Data);`;
  });
  
  html += `
    }
    
    // Chart rendering function with animations
    function renderMagicChart(elementId, chartType, chartData) {
      const ctx = document.getElementById(elementId).getContext('2d');
      
      // Destroy existing chart if it exists
      if (window.dashboardCharts[elementId]) {
        window.dashboardCharts[elementId].destroy();
      }
      
      // Default animation settings
      const defaultAnimations = {
        y: {
          easing: 'easeOutCubic',
          duration: 2000,
          from: (ctx) => {
            if (ctx.type === 'data' || ctx.type === 'dataset') {
              return 0;
            }
            return ctx.max;
          }
        }
      };
      
      // Chart options based on type
      let options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: defaultAnimations,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: '${theme.fontFamily}',
                size: 12
              },
              color: '${theme.textColor}'
            }
          },
          tooltip: {
            backgroundColor: '${theme.cardBackground}',
            titleColor: '${theme.textColor}',
            bodyColor: '${theme.textColor}',
            borderColor: '${theme.primaryColor}',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              family: '${theme.fontFamily}',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: '${theme.fontFamily}',
              size: 13
            },
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 3,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString();
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: ${isLightTheme()} ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              font: {
                family: '${theme.fontFamily}',
                size: 12
              },
              color: ${isLightTheme()} ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
            }
          },
          y: {
            grid: {
              display: true,
              color: ${isLightTheme()} ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              font: {
                family: '${theme.fontFamily}',
                size: 12
              },
              color: ${isLightTheme()} ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
            },
            beginAtZero: true
          }
        }
      };
      
      // Create new chart
      window.dashboardCharts[elementId] = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: options
      });
    }
    
    // 3D Chart rendering function
    function renderMagic3DChart(elementId, chartType, chartData) {
      const canvas = document.getElementById(elementId);
      
      // If Magic3D library is available, use it
      if (window.MagicViz && window.MagicViz.create3DChart) {
        // Destroy existing chart if it exists
        if (window.Magic3DCharts[elementId]) {
          window.Magic3DCharts[elementId].destroy();
        }
        
        // Create new 3D chart
        window.Magic3DCharts[elementId] = window.MagicViz.create3DChart(canvas, {
          type: chartType,
          data: chartData,
          options: {
            theme: ${isLightTheme()} ? 'light' : 'dark',
            backgroundColor: '${theme.cardBackground}',
            colors: ${JSON.stringify(theme.chartColors)},
            animation: {
              enabled: true,
              duration: 1000,
              easing: 'easeOutCubic'
            },
            depth: ${theme.depthEffect ? 'true' : 'false'},
            lighting: true,
            interactive: true,
            tooltip: {
              enabled: true,
              backgroundColor: '${theme.cardBackground}',
              textColor: '${theme.textColor}',
              borderColor: '${theme.primaryColor}'
            }
          }
        });
      } else {
        // Fallback to regular Chart.js if 3D is not available
        renderMagicChart(elementId, chartType === 'bar3d' ? 'bar' : 'line', chartData);
        console.warn('21st Magic 3D visualization library not available, falling back to 2D');
      }
    }
    
    // Enhanced table rendering with animations
    function renderMagicTable(elementId, tableData) {
      const tableBody = document.querySelector('#' + elementId + ' tbody');
      tableBody.innerHTML = '';
      
      tableData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.opacity = '0';
        tr.style.transform = 'translateY(10px)';
        
        // Dynamic rendering based on available properties
        if (row.sku) tr.innerHTML += \`<td>\${row.sku}</td>\`;
        if (row.name) tr.innerHTML += \`<td>\${row.name}</td>\`;
        if (row.brand) tr.innerHTML += \`<td>\${row.brand}</td>\`;
        if (row.units) tr.innerHTML += \`<td>\${row.units.toLocaleString()}</td>\`;
        if (row.sales) tr.innerHTML += \`<td>$\${row.sales.toLocaleString()}</td>\`;
        
        // Add status indicator if available
        if (row.status) {
          let statusText = 'Normal';
          if (row.status === 'green') statusText = 'In Stock';
          if (row.status === 'yellow') statusText = 'Low Stock';
          if (row.status === 'red') statusText = 'Out of Stock';
          
          tr.innerHTML += \`<td><span class="status \${row.status}">\${statusText}</span></td>\`;
        }
        
        tableBody.appendChild(tr);
        
        // Animate row entrance
        setTimeout(() => {
          tr.style.transition = 'all 0.5s ease';
          tr.style.opacity = '1';
          tr.style.transform = 'translateY(0)';
        }, 50 * index);
      });
    }
    
    // Setup simulated real-time data updates
    function setupLiveDataSimulation() {
      setInterval(() => {
        // Update a random KPI card
        updateRandomKPI();
        
        // Update a random chart
        updateRandomChart();
      }, 10000);
    }
    
    // Update a random KPI card with animation
    function updateRandomKPI() {
      const kpiCards = document.querySelectorAll('.kpi-value');
      if (kpiCards.length === 0) return;
      
      const randomIndex = Math.floor(Math.random() * kpiCards.length);
      const kpiCard = kpiCards[randomIndex];
      const kpiCardId = kpiCard.id;
      
      // Get current value
      let currentValue = parseInt(kpiCard.textContent.replace(/\\D/g, ''));
      if (isNaN(currentValue)) currentValue = 1000;
      
      // Calculate new value (±5-10%)
      const changePercent = (Math.random() * 10 + 5) * (Math.random() < 0.5 ? -1 : 1);
      const newValue = Math.max(100, Math.floor(currentValue * (1 + changePercent / 100)));
      
      // Animate the change
      if (window.gsap) {
        gsap.to({value: currentValue}, {
          value: newValue,
          duration: 1,
          ease: "power2.out",
          onUpdate: function() {
            const value = Math.floor(this.targets()[0].value);
            kpiCard.textContent = kpiCard.textContent.includes('$') ? 
              '$' + value.toLocaleString() : 
              value.toLocaleString();
          }
        });
      } else {
        // Simple animation fallback
        kpiCard.textContent = kpiCard.textContent.includes('$') ? 
          '$' + newValue.toLocaleString() : 
          newValue.toLocaleString();
        
        // Flash effect
        kpiCard.style.color = changePercent > 0 ? '#00E676' : '#FF5252';
        setTimeout(() => {
          kpiCard.style.color = '';
        }, 1000);
      }
      
      // Update comparison text if exists
      const parentCard = kpiCard.closest('.kpi-card');
      const comparisonEl = parentCard.querySelector('.kpi-comparison');
      if (comparisonEl) {
        const newComparisonValue = (Math.floor(Math.random() * 10) + 1) + '.' + Math.floor(Math.random() * 9);
        const isPositive = Math.random() > 0.4;
        
        comparisonEl.className = 'kpi-comparison ' + (isPositive ? 'positive' : 'negative');
        comparisonEl.innerHTML = \`
          <span class="arrow">\${isPositive ? '▲' : '▼'}</span> \${newComparisonValue}% vs last period
        \`;
      }
    }
    
    // Update a random chart with new data
    function updateRandomChart() {
      if (!window.dashboardCharts || Object.keys(window.dashboardCharts).length === 0) return;
      
      // Pick a random chart
      const chartIds = Object.keys(window.dashboardCharts);
      const randomChartId = chartIds[Math.floor(Math.random() * chartIds.length)];
      const chart = window.dashboardCharts[randomChartId];
      
      if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return;
      
      // Generate new data
      const dataset = chart.data.datasets[0];
      const newData = [];
      
      for (let i = 0; i < dataset.data.length; i++) {
        // Change by ±15%
        const currentValue = dataset.data[i];
        const changePercent = (Math.random() * 15) * (Math.random() < 0.5 ? -1 : 1);
        const newValue = Math.max(10, Math.floor(currentValue * (1 + changePercent / 100)));
        newData.push(newValue);
      }
      
      // Apply the new data with animation
      chart.data.datasets[0].data = newData;
      chart.update('active');
      
      // Add a subtle highlight to the updated chart card
      const chartCard = document.getElementById('chart-card-' + randomChartId);
      if (chartCard) {
        chartCard.style.boxShadow = '0 0 15px rgba(var(--primary-color-rgb), 0.5)';
        setTimeout(() => {
          chartCard.style.boxShadow = '';
        }, 2000);
      }
      
      // Also update 3D charts if they exist
      if (window.Magic3DCharts && window.Magic3DCharts[randomChartId]) {
        const chart3D = window.Magic3DCharts[randomChartId];
        if (chart3D && chart3D.updateData) {
          chart3D.updateData(newData);
        }
      }
    }
    
    // Helper function to check if we're using light theme
    function isLightTheme() {
      return '${themeName}'.includes('light');
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
  } else if (metric && (metric.includes('score') || metric.includes('index'))) {
    return (Math.floor(Math.random() * 30) + 70).toLocaleString();
  } else {
    return Math.floor(Math.random() * 10000).toLocaleString();
  }
}

// Helper function to generate random values for charts
function generateRandomValues(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 100) + 10).join(', ');
}

// Main function
function main() {
  // Check arguments
  if (process.argv.length < 5) {
    console.error('Usage: node visualsynth_21st_magic.js <wireframe_json> <schema_yaml> <theme> <output_html>');
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
    const htmlCode = generateMagicDashboardCode(wireframe, schemaMapping, themeName);
    
    // Write output
    fs.writeFileSync(outputPath, htmlCode);
    
    console.log(`21st Magic dashboard code generated and saved to ${outputPath}`);
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
  generateMagicDashboardCode
};