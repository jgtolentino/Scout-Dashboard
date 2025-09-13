#!/usr/bin/env node

/**
 * VisualSynth NLP - Natural Language Dashboard Requirements Parser
 * 
 * This script processes natural language dashboard requirements and converts them
 * into a structured JSON format that defines KPIs, dimensions, and visualization types.
 * 
 * Usage:
 *   node visualsynth_nlp.js <input_file> <output_json>
 * 
 * Example:
 *   node visualsynth_nlp.js requirements.txt structured_kpi.json
 */

const fs = require('fs');
const path = require('path');

// Common retail KPI patterns and their visualization types
const KPI_PATTERNS = [
  { pattern: /\b(sales|revenue|earnings)\b/i, type: 'bar', dimension: 'Time', name: 'Sales' },
  { pattern: /\b(profit|margin)\b/i, type: 'line', dimension: 'Time', name: 'Profit' },
  { pattern: /\b(customer|client)\s+(satisfaction|sentiment)\b/i, type: 'line', dimension: 'Time', name: 'Customer Sentiment' },
  { pattern: /\b(inventory|stock)\b/i, type: 'bar', dimension: 'Product', name: 'Inventory' },
  { pattern: /\b(top|best)\s+(selling|performers)\b/i, type: 'ranked_table', dimension: 'Product', name: 'Top-Selling Products' },
  { pattern: /\b(customer|client)\s+(retention|loyalty)\b/i, type: 'bar', dimension: 'Store', name: 'Customer Loyalty' },
  { pattern: /\b(conversion|success)\s+rate\b/i, type: 'line', dimension: 'Time', name: 'Conversion Rate' },
  { pattern: /\b(traffic|visitors|footfall)\b/i, type: 'line', dimension: 'Time', name: 'Store Traffic' },
  { pattern: /\bsku\b/i, type: 'ranked_table', dimension: 'SKU', name: 'Top-Selling SKUs' },
  { pattern: /\b(brand)\b/i, type: 'bar', dimension: 'Brand', name: 'Brand Performance' }
];

// Common dimension patterns
const DIMENSION_PATTERNS = [
  { pattern: /\bby\s+(region|country|location|territory|area|zone)\b/i, dimension: 'Region' },
  { pattern: /\bby\s+(time|date|month|year|weekly|monthly|yearly|quarter)\b/i, dimension: 'Time' },
  { pattern: /\bby\s+(product|item|category|sku)\b/i, dimension: 'Product' },
  { pattern: /\bby\s+(store|shop|outlet|branch)\b/i, dimension: 'Store' },
  { pattern: /\bby\s+(customer|client|buyer|demographic)\b/i, dimension: 'Customer' },
  { pattern: /\bby\s+(brand|manufacturer|vendor)\b/i, dimension: 'Brand' }
];

// Dashboard types and their default configurations
const DASHBOARD_TYPES = {
  retail: {
    title: 'Retail Advisor Dashboard',
    description: 'Key performance indicators for retail store performance',
    filters: [
      { name: 'Date Range', type: 'daterange', default: 'last_30_days' },
      { name: 'Region', type: 'multiselect', default: 'all' },
      { name: 'Store', type: 'multiselect', default: 'all' }
    ],
    layout_preferences: {
      orientation: 'horizontal',
      color_scheme: 'tbwa_retail',
      responsive: true,
      mobile_first: true
    }
  },
  executive: {
    title: 'Executive Summary Dashboard',
    description: 'High-level overview of key business metrics',
    filters: [
      { name: 'Date Range', type: 'daterange', default: 'last_quarter' },
      { name: 'Business Unit', type: 'select', default: 'all' }
    ],
    layout_preferences: {
      orientation: 'vertical',
      color_scheme: 'tbwa_executive',
      responsive: true,
      mobile_first: false
    }
  }
};

/**
 * Parse natural language requirements and extract KPIs
 * @param {string} requirementsText - Natural language requirements
 * @return {object} Structured KPI JSON
 */
function parseRequirements(requirementsText) {
  // Identify dashboard type - use retail as default
  let dashboardType = 'retail';
  if (/\bexecutive\b/i.test(requirementsText)) {
    dashboardType = 'executive';
  }
  
  // Extract KPIs based on pattern matching
  const extractedKpis = [];
  
  // Split into sentences or comma-separated phrases
  const phrases = requirementsText
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(phrase => phrase.trim())
    .filter(phrase => phrase.length > 0);
  
  phrases.forEach(phrase => {
    // Try to match KPI patterns
    for (const kpiPattern of KPI_PATTERNS) {
      if (kpiPattern.pattern.test(phrase)) {
        const kpi = {
          name: kpiPattern.name,
          dimension: kpiPattern.dimension,
          type: kpiPattern.type
        };
        
        // Check if there's a more specific dimension
        for (const dimPattern of DIMENSION_PATTERNS) {
          if (dimPattern.pattern.test(phrase)) {
            kpi.dimension = dimPattern.dimension;
            break;
          }
        }
        
        // Add to extracted KPIs if not a duplicate
        if (!extractedKpis.some(existing => existing.name === kpi.name)) {
          extractedKpis.push(kpi);
        }
      }
    }
  });
  
  // If no KPIs were extracted, add some defaults based on dashboard type
  if (extractedKpis.length === 0) {
    if (dashboardType === 'retail') {
      extractedKpis.push(
        { name: 'Sales', dimension: 'Time', type: 'bar' },
        { name: 'Customer Sentiment', dimension: 'Time', type: 'line' },
        { name: 'Top-Selling Products', dimension: 'Product', type: 'ranked_table' }
      );
    } else {
      extractedKpis.push(
        { name: 'Revenue', dimension: 'Time', type: 'line' },
        { name: 'Profit Margin', dimension: 'Business Unit', type: 'bar' },
        { name: 'Key Performance Indicators', dimension: 'Metric', type: 'scorecard' }
      );
    }
  }
  
  // Build the full response object
  const response = {
    kpis: extractedKpis,
    general: {
      title: DASHBOARD_TYPES[dashboardType].title,
      description: DASHBOARD_TYPES[dashboardType].description,
      refresh_rate: 'daily',
      target_users: dashboardType === 'retail' 
        ? ['store_managers', 'retail_advisors', 'regional_directors']
        : ['executives', 'directors', 'managers']
    },
    filters: DASHBOARD_TYPES[dashboardType].filters,
    layout_preferences: DASHBOARD_TYPES[dashboardType].layout_preferences
  };
  
  return response;
}

// Main function
function main() {
  // Check arguments
  if (process.argv.length < 4) {
    console.error('Usage: node visualsynth_nlp.js <input_file> <output_json>');
    process.exit(1);
  }
  
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  
  try {
    // Read input file
    let requirementsText = '';
    if (fs.existsSync(inputPath)) {
      requirementsText = fs.readFileSync(inputPath, 'utf8');
    } else {
      // Assume direct input string
      requirementsText = inputPath;
      // Also write to output directory for reference
      fs.writeFileSync(outputPath.replace('structured_kpi.json', 'input.txt'), requirementsText);
    }
    
    // Parse requirements
    const parsedKpis = parseRequirements(requirementsText);
    
    // Write output file
    fs.writeFileSync(outputPath, JSON.stringify(parsedKpis, null, 2));
    
    console.log(`Requirements successfully parsed and saved to ${outputPath}`);
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
  parseRequirements
};