#!/usr/bin/env node

/**
 * VisualSynth Layout Generator
 * 
 * Generates a dashboard layout wireframe JSON based on KPI structure and schema mapping.
 * Applies responsive design principles and creates an interactive layout with cross-filtering.
 * 
 * Usage:
 *   node visualsynth_layout_generator.js <kpi_json> <schema_yaml> <template_json> <output_json>
 * 
 * Example:
 *   node visualsynth_layout_generator.js structured_kpi.json kpi_table_mapping.yaml retail.json dashboard_wireframe.json
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

// Dashboard templates - used if no template file is provided
const DEFAULT_TEMPLATES = {
  retail: {
    headerStyle: 'standard',
    kpiCardStyle: 'shadow',
    chartStyle: 'modern',
    layout: 'grid',
    colorScheme: 'tbwa_retail',
    filters: ['date_range', 'region', 'store'],
    mobileBehavior: 'stack',
    interactivity: 'crossfilter'
  },
  executive: {
    headerStyle: 'premium',
    kpiCardStyle: 'bordered',
    chartStyle: 'minimal',
    layout: 'sections',
    colorScheme: 'tbwa_executive',
    filters: ['date_range', 'business_unit'],
    mobileBehavior: 'responsive',
    interactivity: 'drill_through'
  }
};

// Chart type mappings for different visualization types
const CHART_TYPE_MAPPINGS = {
  bar: 'bar',
  line: 'line',
  pie: 'pie',
  ranked_table: 'table',
  scorecard: 'kpi_card',
  heatmap: 'heatmap'
};

/**
 * Generate dashboard wireframe layout based on KPIs and schema
 * @param {object} kpiStructure - Structured KPI JSON
 * @param {object} schemaMapping - Database schema mapping
 * @param {object} template - Dashboard template configuration
 * @return {object} Dashboard wireframe layout
 */
function generateLayout(kpiStructure, schemaMapping, template) {
  const wireframe = {
    title: kpiStructure.general.title,
    description: kpiStructure.general.description,
    theme: template.colorScheme || 'tbwa_retail',
    layout: [],
    interactions: [],
    mobile_adjustments: {
      breakpoints: {
        xs: 576,
        sm: 768,
        md: 992,
        lg: 1200
      },
      stacking: {
        xs: 'vertical',
        sm: 'vertical',
        md: 'mixed',
        lg: 'horizontal'
      }
    }
  };
  
  // Add header section
  wireframe.layout.push({
    type: 'header',
    content: {
      title: kpiStructure.general.title,
      subtitle: kpiStructure.general.description,
      filters: template.filters || kpiStructure.filters.map(f => f.name.toLowerCase().replace(/\s+/g, '_'))
    }
  });
  
  // Generate KPI cards row for key metrics
  const kpiCards = [];
  const maxKpiCards = 3; // Maximum number of KPI cards to show
  
  for (let i = 0; i < Math.min(kpiStructure.kpis.length, maxKpiCards); i++) {
    const kpi = kpiStructure.kpis[i];
    const kpiKey = kpi.name.replace(/\s+/g, '_');
    const schema = schemaMapping[kpiKey];
    
    // Skip if no schema mapping found
    if (!schema) continue;
    
    // Determine main metric and comparison metric
    let mainMetric, comparisonMetric;
    
    if (kpi.name.includes('Loyalty')) {
      mainMetric = 'loyalty_index';
      comparisonMetric = 'loyalty_change_percent';
    } else if (kpi.name.includes('SKU') || kpi.name.includes('Product')) {
      mainMetric = 'total_sales';
      comparisonMetric = null;
    } else if (kpi.name.includes('Sentiment')) {
      mainMetric = 'sentiment_score';
      comparisonMetric = null;
    } else if (kpi.name.includes('Sales')) {
      mainMetric = 'total_sales';
      comparisonMetric = null;
    } else if (schema.columns && schema.columns.length >= 2) {
      // Default behavior - use first non-ID column as main metric
      mainMetric = schema.columns.find(col => 
        !col.includes('id') && !col.includes('name') && !col.includes('timestamp'));
      comparisonMetric = null;
    }
    
    if (mainMetric) {
      const kpiCard = {
        type: 'kpi_card',
        title: kpi.name,
        metric: mainMetric,
        format: mainMetric.includes('sales') ? 'currency' : 'number',
        width: Math.floor(12 / maxKpiCards)
      };
      
      if (comparisonMetric) {
        kpiCard.comparison = {
          field: comparisonMetric,
          format: comparisonMetric.includes('percent') ? 'percent' : 'number',
          direction: 'higher_is_better'
        };
      }
      
      kpiCards.push(kpiCard);
    }
  }
  
  // Add KPI cards row if we have any
  if (kpiCards.length > 0) {
    wireframe.layout.push({
      type: 'row',
      content: kpiCards
    });
  }
  
  // Add main visualization components
  kpiStructure.kpis.forEach(kpi => {
    const kpiKey = kpi.name.replace(/\s+/g, '_');
    const schema = schemaMapping[kpiKey];
    
    // Skip if no schema mapping found
    if (!schema) return;
    
    // Determine the right component type based on KPI visualization type
    let componentType = 'chart';
    let chartType = CHART_TYPE_MAPPINGS[kpi.type] || 'bar';
    
    if (kpi.type === 'ranked_table') {
      componentType = 'table';
    }
    
    // Determine width based on chart type
    let width = 6; // Default to half width
    if (chartType === 'line' || kpi.name.includes('Sentiment') || kpi.name.includes('Trend')) {
      width = 12; // Full width for time series charts
    }
    
    if (componentType === 'chart') {
      const chartComponent = {
        type: 'chart',
        title: kpi.name + (kpi.dimension ? ` by ${kpi.dimension}` : ''),
        chart_type: chartType,
        width: width,
        data: {
          source: kpiKey
        },
        options: {}
      };
      
      // Add chart-specific configurations
      if (chartType === 'bar') {
        // Configure bar chart
        const xAxis = schema.columns.find(col => col.includes('name') || col.includes('id'));
        const yAxis = schema.columns.find(col => 
          !col.includes('id') && !col.includes('name') && !col.includes('timestamp'));
        
        chartComponent.data.x_axis = xAxis || schema.columns[0];
        chartComponent.data.y_axis = yAxis || schema.columns[1];
        
        // Add color variation if available
        const colorField = schema.columns.find(col => col.includes('change') || col.includes('percent'));
        if (colorField) {
          chartComponent.data.color = colorField;
          chartComponent.options.color_scale = {
            type: 'diverging',
            negative: '#ff9e9e',
            positive: '#a1d99b'
          };
        }
        
        // Add sorting if specified in schema
        if (schema.sorting) {
          chartComponent.options.sort_by = chartComponent.data.y_axis;
          chartComponent.options.sort_order = schema.sorting;
        }
        
        // Add limit if specified in schema
        if (schema.top_n) {
          chartComponent.options.limit = schema.top_n;
        }
      } else if (chartType === 'line') {
        // Configure line chart
        const timeAxis = schema.columns.find(col => 
          col.includes('timestamp') || col.includes('date') || col.includes('time'));
        const valueAxis = schema.columns.find(col => 
          !col.includes('id') && !col.includes('name') && !col.includes('timestamp'));
        
        chartComponent.data.x_axis = timeAxis || schema.columns[0];
        chartComponent.data.y_axis = valueAxis || schema.columns[1];
        
        // Add time granularity if specified
        if (schema.time_granularity) {
          chartComponent.options.time_granularity = schema.time_granularity;
        }
        
        // Add reference lines if specified
        if (schema.reference_lines) {
          chartComponent.data.reference_lines = schema.reference_lines;
        } else {
          // Add default average line
          chartComponent.data.reference_lines = [
            { type: 'average', label: 'Average', style: 'dashed' }
          ];
        }
        
        // Configure series
        chartComponent.data.series = [
          { 
            field: chartComponent.data.y_axis, 
            label: kpi.name, 
            color: '#4e79a7' 
          }
        ];
        
        // Add chart options
        chartComponent.options.show_points = true;
        chartComponent.options.y_axis_min = 0;
        
        // Set appropriate y-axis max for percentage metrics
        if (chartComponent.data.y_axis.includes('percent') || 
            chartComponent.data.y_axis.includes('score') || 
            kpi.name.includes('Sentiment')) {
          chartComponent.options.y_axis_max = 100;
        }
      }
      
      wireframe.layout.push(chartComponent);
    } else if (componentType === 'table') {
      // Configure table component
      const tableComponent = {
        type: 'table',
        title: kpi.name,
        width: width,
        data: {
          source: kpiKey,
          columns: []
        },
        options: {
          pagination: true,
          page_size: schema.top_n || 10,
          sort_enabled: true,
          search_enabled: true
        }
      };
      
      // Add columns from schema
      if (schema.columns) {
        schema.columns.forEach(column => {
          // Skip technical columns like IDs
          if (column.includes('_id') && !column.includes('sku')) {
            return;
          }
          
          const columnObj = {
            field: column,
            label: column
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())
          };
          
          // Add formatting based on column name
          if (column.includes('sales') || column.includes('revenue')) {
            columnObj.format = 'currency';
          } else if (column.includes('percent') || column.includes('margin')) {
            columnObj.format = 'percent';
          } else if (!column.includes('name') && 
                     !column.includes('sku') && 
                     !column.includes('category') && 
                     !column.includes('brand')) {
            columnObj.format = 'number';
          }
          
          tableComponent.data.columns.push(columnObj);
        });
      }
      
      // Configure default sorting
      if (schema.sorting) {
        const sortField = schema.columns.find(col => 
          col.includes('sales') || col.includes('profit') || col.includes('units'));
        
        if (sortField) {
          tableComponent.options.default_sort = {
            field: sortField,
            order: schema.sorting
          };
        }
      }
      
      wireframe.layout.push(tableComponent);
    }
  });
  
  // Generate interactive behaviors if template enables them
  if (template.interactivity === 'crossfilter' && wireframe.layout.length > 3) {
    // Find components to link together
    const components = wireframe.layout.slice(2); // Skip header and KPI cards
    
    if (components.length >= 2) {
      // Find a component to use as filter source
      const sourceComponent = components.find(c => c.title && c.title.includes('Store'));
      if (sourceComponent) {
        // Find ID field to use for filtering
        const sourceSchema = Object.values(schemaMapping).find(s => 
          s.columns && s.columns.some(col => col.includes('store_id')));
        
        if (sourceSchema) {
          // Add cross-filtering interactions
          components.forEach(targetComponent => {
            // Skip self-filtering
            if (targetComponent === sourceComponent) return;
            
            // Only add interaction if target supports store filtering
            const targetKey = targetComponent.title.split(' ')[0].replace(/\s+/g, '_');
            const targetSchema = schemaMapping[targetKey];
            
            if (targetSchema && targetSchema.filters && 
                targetSchema.filters.includes('store')) {
              wireframe.interactions.push({
                source: {
                  component: sourceComponent.title.split(' ')[0].replace(/\s+/g, '_'),
                  selection: 'store_id'
                },
                target: {
                  component: targetComponent.title.split(' ')[0].replace(/\s+/g, '_'),
                  action: 'filter',
                  parameter: 'store'
                }
              });
            }
          });
        }
      }
    }
  }
  
  return wireframe;
}

// Main function
function main() {
  // Check arguments
  if (process.argv.length < 5) {
    console.error('Usage: node visualsynth_layout_generator.js <kpi_json> <schema_yaml> <template_json> <output_json>');
    process.exit(1);
  }
  
  const kpiPath = process.argv[2];
  const schemaPath = process.argv[3];
  const templatePath = process.argv[4];
  const outputPath = process.argv[5];
  
  try {
    // Read KPI structure
    const kpiStructure = JSON.parse(fs.readFileSync(kpiPath, 'utf8'));
    
    // Read schema mapping, supporting YAML or JSON
    let schemaMapping;
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (yaml && schemaPath.endsWith('.yaml') || schemaPath.endsWith('.yml')) {
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
    
    // Read template or use default
    let template;
    try {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } catch (e) {
      // If template file doesn't exist or is invalid, use default based on name
      const templateName = path.basename(templatePath, '.json');
      template = DEFAULT_TEMPLATES[templateName] || DEFAULT_TEMPLATES.retail;
    }
    
    // Generate layout
    const wireframe = generateLayout(kpiStructure, schemaMapping, template);
    
    // Write output
    fs.writeFileSync(outputPath, JSON.stringify(wireframe, null, 2));
    
    console.log(`Dashboard wireframe layout generated and saved to ${outputPath}`);
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
  generateLayout
};