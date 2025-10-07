#!/usr/bin/env node

/**
 * VisualSynth Schema Mapper
 * 
 * Maps structured KPIs to database schema, creating detailed mappings
 * for each KPI to appropriate tables, columns, and filtering options.
 * 
 * Usage:
 *   node visualsynth_schema_mapper.js <input_kpi_json> <output_yaml>
 * 
 * Example:
 *   node visualsynth_schema_mapper.js structured_kpi.json kpi_table_mapping.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // Note: requires js-yaml package

// Database schema mapping templates based on KPI types
const KPI_SCHEMA_TEMPLATES = {
  'Brand Loyalty': {
    table: 'customer_loyalty',
    columns: [
      'store_id',
      'store_name',
      'loyalty_index',
      'previous_month_loyalty',
      'loyalty_change_percent'
    ],
    filters: [
      'date_range',
      'region'
    ],
    aggregation: 'average',
    sorting: 'desc',
    top_n: 10
  },
  'Top-Selling SKUs': {
    table: 'sales_data',
    joins: [
      {
        table: 'products',
        columns: ['product_name', 'category', 'brand'],
        on: 'sales_data.sku = products.sku'
      }
    ],
    columns: [
      'sku',
      'product_name',
      'category',
      'brand',
      'total_sales',
      'units_sold',
      'profit_margin'
    ],
    filters: [
      'date_range',
      'region',
      'store'
    ],
    aggregation: 'sum',
    sorting: 'desc',
    top_n: 5
  },
  'Customer Sentiment': {
    table: 'sentiment_logs',
    columns: [
      'timestamp',
      'sentiment_score',
      'feedback_count',
      'positive_ratio',
      'negative_ratio',
      'neutral_ratio'
    ],
    filters: [
      'date_range',
      'region',
      'store'
    ],
    aggregation: 'average',
    time_granularity: 'daily',
    reference_lines: [
      {
        type: 'average',
        label: 'Average Sentiment'
      },
      {
        type: 'threshold',
        value: 75,
        label: 'Target'
      }
    ]
  },
  'Sales': {
    table: 'sales_data',
    columns: [
      'timestamp',
      'store_id',
      'store_name',
      'total_sales',
      'transaction_count',
      'average_transaction_value'
    ],
    filters: [
      'date_range',
      'region',
      'store',
      'product_category'
    ],
    aggregation: 'sum',
    time_granularity: 'daily'
  },
  'Profit': {
    table: 'sales_data',
    columns: [
      'timestamp',
      'store_id',
      'profit',
      'profit_margin',
      'cost_of_goods',
      'total_sales'
    ],
    filters: [
      'date_range',
      'region',
      'store',
      'product_category'
    ],
    aggregation: 'sum',
    time_granularity: 'daily'
  },
  'Inventory': {
    table: 'inventory',
    columns: [
      'sku',
      'product_name',
      'stock_level',
      'reorder_point',
      'days_of_supply',
      'last_restock_date'
    ],
    filters: [
      'store',
      'product_category',
      'brand'
    ],
    aggregation: 'sum',
    sorting: 'asc',
    thresholds: [
      {
        level: 'warning',
        condition: 'stock_level <= reorder_point',
        color: '#FFBF00'
      },
      {
        level: 'critical',
        condition: 'days_of_supply < 7',
        color: '#FF3600'
      }
    ]
  },
  'Top-Selling Products': {
    table: 'sales_data',
    joins: [
      {
        table: 'products',
        columns: ['product_name', 'category', 'brand', 'unit_price'],
        on: 'sales_data.product_id = products.id'
      }
    ],
    columns: [
      'product_id',
      'product_name',
      'category',
      'brand',
      'units_sold',
      'total_sales'
    ],
    filters: [
      'date_range',
      'region',
      'store'
    ],
    aggregation: 'sum',
    sorting: 'desc',
    top_n: 10
  },
  'Store Traffic': {
    table: 'store_traffic',
    columns: [
      'timestamp',
      'store_id',
      'visitor_count',
      'conversion_rate',
      'bounce_rate',
      'avg_dwell_time'
    ],
    filters: [
      'date_range',
      'region',
      'store',
      'day_of_week'
    ],
    aggregation: 'sum',
    time_granularity: 'hourly'
  }
};

// Default schema mapping for unrecognized KPIs
const DEFAULT_SCHEMA = {
  table: 'metrics',
  columns: [
    'timestamp',
    'metric_name',
    'metric_value',
    'dimension_name',
    'dimension_value'
  ],
  filters: [
    'date_range'
  ],
  aggregation: 'sum',
  time_granularity: 'daily'
};

/**
 * Map KPIs to database schema
 * @param {object} kpiStructure - Structured KPI JSON
 * @return {object} Database schema mapping
 */
function mapKpisToSchema(kpiStructure) {
  const mappings = {};
  
  kpiStructure.kpis.forEach(kpi => {
    // Generate key from KPI name
    const key = kpi.name.replace(/\s+/g, '_');
    
    // Find matching schema template or use default
    let schemaMapping;
    if (KPI_SCHEMA_TEMPLATES[kpi.name]) {
      schemaMapping = { ...KPI_SCHEMA_TEMPLATES[kpi.name] };
    } else {
      schemaMapping = { ...DEFAULT_SCHEMA };
      schemaMapping.table = `${key.toLowerCase()}_data`;
    }
    
    // Customize based on KPI dimension if needed
    if (kpi.dimension) {
      const dimensionKey = kpi.dimension.toLowerCase();
      
      // Add dimension-specific filters if not already present
      if (dimensionKey === 'region' && !schemaMapping.filters.includes('region')) {
        schemaMapping.filters.push('region');
      } else if (dimensionKey === 'store' && !schemaMapping.filters.includes('store')) {
        schemaMapping.filters.push('store');
      } else if (dimensionKey === 'product' && !schemaMapping.filters.includes('product_category')) {
        schemaMapping.filters.push('product_category');
      } else if (dimensionKey === 'time' && !schemaMapping.time_granularity) {
        schemaMapping.time_granularity = 'daily';
      }
    }
    
    // Customize based on visualization type
    if (kpi.type === 'ranked_table' && !schemaMapping.top_n) {
      schemaMapping.top_n = 10;
      schemaMapping.sorting = 'desc';
    } else if (kpi.type === 'line' && !schemaMapping.time_granularity) {
      schemaMapping.time_granularity = 'daily';
    }
    
    // Store the mapping
    mappings[key] = schemaMapping;
  });
  
  return mappings;
}

// Main function
function main() {
  // Check arguments
  if (process.argv.length < 4) {
    console.error('Usage: node visualsynth_schema_mapper.js <input_kpi_json> <output_yaml>');
    process.exit(1);
  }
  
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  
  try {
    // Read input KPI structure
    const kpiStructure = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // Map KPIs to database schema
    const schemaMappings = mapKpisToSchema(kpiStructure);
    
    // Convert to YAML
    let yamlOutput;
    try {
      yamlOutput = yaml.dump(schemaMappings, {
        indent: 2,
        lineWidth: 100,
        noCompatMode: true
      });
    } catch (e) {
      // Fallback to JSON if YAML package is not available
      yamlOutput = JSON.stringify(schemaMappings, null, 2);
    }
    
    // Write output file
    fs.writeFileSync(outputPath, yamlOutput);
    
    console.log(`Schema mapping successfully created and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  // Check if js-yaml is available, otherwise alert user
  try {
    require.resolve('js-yaml');
  } catch (e) {
    console.warn('Warning: js-yaml package not found. Output will be in JSON format.');
    console.warn('To install: npm install js-yaml');
  }
  
  main();
}

module.exports = {
  mapKpisToSchema
};