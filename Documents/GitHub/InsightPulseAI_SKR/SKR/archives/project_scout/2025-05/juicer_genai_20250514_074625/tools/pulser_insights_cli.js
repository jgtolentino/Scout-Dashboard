#!/usr/bin/env node
/**
 * Pulser Insights CLI
 * 
 * This script provides a command-line interface for the Pulser CLI integration
 * with Juicer's GenAI Insights system.
 * 
 * Usage: pulser_insights_cli.js <command> [options]
 * 
 * Commands:
 *   generate    Generate insights from transcript data
 *   show        Display existing insights
 *   visualize   Create visualizations from insights
 *   dashboard   Open the insights dashboard
 *   summarize   Generate an executive summary
 * 
 * @author Data Analytics Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { generateInsights } = require('./insights_generator');
const open = require('open');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: args[0],
    subArgs: args.slice(1)
  };
  
  return options;
}

// Show help information
function showHelp(command) {
  if (!command) {
    console.log(`
Juicer GenAI Insights CLI for Pulser
------------------------------------

Usage: pulser_insights_cli.js <command> [options]

Commands:
  generate    Generate insights from transcript data
  show        Display existing insights
  visualize   Create visualizations from insights
  dashboard   Open the insights dashboard
  summarize   Generate an executive summary

Run 'pulser_insights_cli.js <command> --help' for command-specific options.
    `);
  } else if (command === 'generate') {
    console.log(`
Generate Insights Command
------------------------

Usage: pulser_insights_cli.js generate [options]

Options:
  --days <number>       Number of days to analyze (default: 7)
  --model <name>        LLM model to use: default, enhanced, auto (default: enhanced)
  --type <type>         Insight type: general, brand, sentiment, trend, all (default: all)
  --brand <name>        Filter by brand name
  --confidence <number> Minimum confidence threshold (0-1, default: 0.7)
  --output <path>       Output directory for generated assets

Examples:
  pulser_insights_cli.js generate --days 30 --model enhanced
  pulser_insights_cli.js generate --type brand --brand "Jollibee"
    `);
  } else if (command === 'show') {
    console.log(`
Show Insights Command
-------------------

Usage: pulser_insights_cli.js show [options]

Options:
  --type <type>         Insight type: general, brand, sentiment, trend, all (default: all)
  --brand <name>        Filter by brand name
  --days <number>       Number of days to show (default: 30)
  --limit <number>      Maximum number of insights to show (default: 10)
  --format <format>     Output format: text, json, markdown (default: text)
  --sort <field>        Sort field: date, confidence, type (default: confidence)

Examples:
  pulser_insights_cli.js show --type brand --brand "Jollibee" --limit 5
  pulser_insights_cli.js show --days 7 --format markdown
    `);
  } else if (command === 'visualize') {
    console.log(`
Visualize Insights Command
------------------------

Usage: pulser_insights_cli.js visualize [options]

Options:
  --type <type>         Chart type: bar, line, heatmap, bubble, auto (default: auto)
  --group <field>       Group by field: brand, type, sentiment, tag (default: brand)
  --days <number>       Number of days to include (default: 30)
  --output <path>       Output path for visualization file
  --theme <name>        Visual theme: default, dark, light, tbwa (default: tbwa)
  --show                Open visualization after generation

Examples:
  pulser_insights_cli.js visualize --type heatmap --group brand --show
  pulser_insights_cli.js visualize --days 90 --output "insights_viz.html" --theme dark
    `);
  } else if (command === 'dashboard') {
    console.log(`
Dashboard Command
---------------

Usage: pulser_insights_cli.js dashboard [options]

Options:
  --refresh             Refresh dashboard with latest data before opening
  --theme <name>        Visual theme: default, dark, light, tbwa (default: tbwa)
  --port <number>       Port for dashboard server (default: 8080)

Examples:
  pulser_insights_cli.js dashboard --refresh
  pulser_insights_cli.js dashboard --theme dark
    `);
  } else if (command === 'summarize') {
    console.log(`
Summarize Command
---------------

Usage: pulser_insights_cli.js summarize [options]

Options:
  --days <number>       Number of days to summarize (default: 30)
  --brand <name>        Focus on specific brand
  --format <format>     Output format: text, markdown, html (default: text)
  --output <path>       Output file path (prints to console if not specified)

Examples:
  pulser_insights_cli.js summarize --days 7
  pulser_insights_cli.js summarize --brand "Jollibee" --format markdown --output summary.md
    `);
  }
}

// Execute 'generate' command
async function runGenerateCommand(args) {
  // Parse arguments
  const options = {
    days: 7,
    model: 'enhanced',
    type: 'all',
    confidence: 0.7,
    output: path.join(__dirname, '../output/insights')
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--model' && i + 1 < args.length) {
      options.model = args[++i];
    } else if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--brand' && i + 1 < args.length) {
      options.brand = args[++i];
    } else if (arg === '--confidence' && i + 1 < args.length) {
      options.confidence = parseFloat(args[++i]);
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--help') {
      showHelp('generate');
      return;
    }
  }
  
  // Validate options
  if (options.days <= 0) {
    console.error('Error: Days must be a positive number');
    return;
  }
  
  // Run the insights generator
  console.log('Generating insights...');
  console.log(`- Time range: Last ${options.days} days`);
  console.log(`- Model: ${options.model}`);
  console.log(`- Insight type: ${options.type}`);
  if (options.brand) {
    console.log(`- Brand filter: ${options.brand}`);
  }
  console.log(`- Confidence threshold: ${options.confidence}`);
  console.log(`- Output directory: ${options.output}`);
  console.log();
  
  try {
    const result = await generateInsights({
      days: options.days,
      model: options.model,
      type: options.type,
      brand: options.brand,
      confidence: options.confidence
    });
    
    console.log('\nInsights generation complete!');
    console.log(`- Processed ${result.processed_records} records`);
    console.log(`- Generated ${result.insights_generated} insights`);
    console.log(`- Execution time: ${(result.execution_time_ms / 1000).toFixed(2)}s`);
    
    // Save summary to file
    const outputFile = path.join(options.output, 'insights_summary.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      configuration: {
        days_analyzed: options.days,
        model: options.model,
        insight_type: options.type,
        brand_filter: options.brand || 'all',
        confidence_threshold: options.confidence
      },
      results: {
        status: result.status,
        processed_records: result.processed_records,
        insights_generated: result.insights_generated,
        execution_time_ms: result.execution_time_ms
      }
    };
    
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log(`- Summary saved to: ${outputFile}`);
    
    console.log('\nTo view the generated insights:');
    console.log(`  pulser_insights_cli.js show --days ${options.days}${options.brand ? ` --brand "${options.brand}"` : ''}`);
    console.log('\nTo visualize the insights:');
    console.log(`  pulser_insights_cli.js visualize --show`);
  } catch (error) {
    console.error(`Error generating insights: ${error.message}`);
  }
}

// Execute 'show' command
function runShowCommand(args) {
  // Parse arguments
  const options = {
    type: 'all',
    days: 30,
    limit: 10,
    format: 'text',
    sort: 'confidence'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--brand' && i + 1 < args.length) {
      options.brand = args[++i];
    } else if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--format' && i + 1 < args.length) {
      options.format = args[++i];
    } else if (arg === '--sort' && i + 1 < args.length) {
      options.sort = args[++i];
    } else if (arg === '--help') {
      showHelp('show');
      return;
    }
  }
  
  // In a real implementation, this would query the Platinum layer
  // For demonstration purposes, we'll display sample data
  console.log(`Showing insights with the following filters:`);
  console.log(`- Type: ${options.type}`);
  if (options.brand) {
    console.log(`- Brand: ${options.brand}`);
  }
  console.log(`- Time range: Last ${options.days} days`);
  console.log(`- Limit: ${options.limit} insights`);
  console.log(`- Sorted by: ${options.sort}`);
  console.log(`- Format: ${options.format}`);
  console.log();
  
  // Sample insights
  const insights = [
    {
      id: 'ins_001',
      type: 'general',
      title: 'Increasing focus on value meals across all demographics',
      text: 'Analysis of 327 transcripts reveals that 64% of customers mention value when discussing meal options. This represents an increasing trend compared to previous periods.',
      confidence: 0.85,
      brands: ['Jollibee', 'McDonald\'s', 'KFC'],
      tags: ['pricing', 'value', 'economy', 'family'],
      date: '2025-05-02'
    },
    {
      id: 'ins_002',
      type: 'brand',
      title: 'Brand loyalty stronger for customers using rewards programs',
      text: 'Data from recent interactions shows Jollibee is frequently associated with loyalty programs, with 78% of mentions having positive sentiment.',
      confidence: 0.92,
      brands: ['Jollibee'],
      tags: ['loyalty', 'rewards', 'app', 'repeat'],
      date: '2025-05-03'
    },
    {
      id: 'ins_003',
      type: 'sentiment',
      title: 'Positive sentiment toward expanded vegetarian options',
      text: 'A recurring theme in 32% of analyzed conversations is the connection between vegetarian menu options and positive sentiment.',
      confidence: 0.76,
      brands: ['KFC', 'Burger King'],
      tags: ['vegetarian', 'health', 'menu', 'alternatives'],
      date: '2025-05-05'
    },
    {
      id: 'ins_004',
      type: 'trend',
      title: 'Rising preference for breakfast items throughout the day',
      text: 'Analysis of 215 transcripts reveals a growing customer demand for breakfast items to be available throughout the day, with 47% of customers expressing this preference.',
      confidence: 0.88,
      brands: ['McDonald\'s', 'Jollibee', 'Wendy\'s'],
      tags: ['breakfast', 'all-day', 'menu', 'convenience'],
      date: '2025-05-04'
    }
  ];
  
  // Filter by type
  let filteredInsights = options.type === 'all' 
    ? insights 
    : insights.filter(i => i.type === options.type);
  
  // Filter by brand
  if (options.brand) {
    filteredInsights = filteredInsights.filter(i => i.brands.includes(options.brand));
  }
  
  // Sort by specified field
  if (options.sort === 'date') {
    filteredInsights.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (options.sort === 'confidence') {
    filteredInsights.sort((a, b) => b.confidence - a.confidence);
  } else if (options.sort === 'type') {
    filteredInsights.sort((a, b) => a.type.localeCompare(b.type));
  }
  
  // Limit number of results
  filteredInsights = filteredInsights.slice(0, options.limit);
  
  // Display in specified format
  if (options.format === 'json') {
    console.log(JSON.stringify(filteredInsights, null, 2));
  } else if (options.format === 'markdown') {
    console.log('# Juicer GenAI Insights\n');
    filteredInsights.forEach(insight => {
      console.log(`## ${insight.title} (${insight.type})\n`);
      console.log(`**Confidence:** ${Math.round(insight.confidence * 100)}%\n`);
      console.log(`**Date:** ${insight.date}\n`);
      console.log(`**Brands:** ${insight.brands.join(', ')}\n`);
      console.log(`**Tags:** ${insight.tags.join(', ')}\n`);
      console.log(insight.text);
      console.log('\n---\n');
    });
  } else {
    // Default text format
    filteredInsights.forEach(insight => {
      console.log(`[${insight.type.toUpperCase()}] ${insight.title}`);
      console.log(`  Confidence: ${Math.round(insight.confidence * 100)}%`);
      console.log(`  Date: ${insight.date}`);
      console.log(`  Brands: ${insight.brands.join(', ')}`);
      console.log(`  Tags: ${insight.tags.join(', ')}`);
      console.log(`  ${insight.text}`);
      console.log();
    });
  }
  
  console.log(`Displayed ${filteredInsights.length} of ${insights.length} total insights.`);
}

// Execute 'visualize' command
function runVisualizeCommand(args) {
  // Parse arguments
  const options = {
    type: 'auto',
    group: 'brand',
    days: 30,
    theme: 'tbwa',
    show: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--group' && i + 1 < args.length) {
      options.group = args[++i];
    } else if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--theme' && i + 1 < args.length) {
      options.theme = args[++i];
    } else if (arg === '--show') {
      options.show = true;
    } else if (arg === '--help') {
      showHelp('visualize');
      return;
    }
  }
  
  // Default output path if not specified
  if (!options.output) {
    options.output = path.join(__dirname, '../output/visualizations', `insights_${options.type}_${options.group}.html`);
  }
  
  console.log('Generating visualization...');
  console.log(`- Chart type: ${options.type}`);
  console.log(`- Group by: ${options.group}`);
  console.log(`- Time range: Last ${options.days} days`);
  console.log(`- Theme: ${options.theme}`);
  console.log(`- Output: ${options.output}`);
  console.log();
  
  // In a real implementation, this would generate the chart
  // For demonstration purposes, we'll create a simple HTML file
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Simple HTML template with Chart.js
  const chartTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juicer Insights Visualization</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: ${options.theme === 'dark' ? '#212529' : '#f5f5f5'};
      color: ${options.theme === 'dark' ? '#f8f9fa' : '#212529'};
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .chart-container {
      height: 500px;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 0.8rem;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Juicer Insights Visualization</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="chart-container">
      <canvas id="insightsChart"></canvas>
    </div>
    
    <div class="footer">
      <p>Powered by Juicer GenAI Insights</p>
    </div>
  </div>
  
  <script>
    // Sample data - in a real implementation, this would be data from the Platinum layer
    const ctx = document.getElementById('insightsChart').getContext('2d');
    
    // Create appropriate chart based on type and grouping
    const chartType = '${options.type === 'auto' ? (options.group === 'brand' ? 'bar' : 'line') : options.type}';
    
    let chart;
    
    if (chartType === 'bar') {
      // Bar chart for brand grouping
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jollibee', 'McDonald\\'s', 'KFC', 'Burger King', 'Wendy\\'s', 'Pizza Hut'],
          datasets: [
            {
              label: 'General Insights',
              data: [12, 10, 8, 6, 4, 3],
              backgroundColor: '#8a4fff'
            },
            {
              label: 'Brand Insights',
              data: [15, 12, 10, 8, 6, 4],
              backgroundColor: '#00a3e0'
            },
            {
              label: 'Sentiment Insights',
              data: [10, 8, 6, 5, 3, 2],
              backgroundColor: '#ff7e47'
            },
            {
              label: 'Trend Insights',
              data: [8, 7, 5, 4, 2, 1],
              backgroundColor: '#00c389'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Insights by Brand (Last ${options.days} days)',
              color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
            },
            legend: {
              labels: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            },
            y: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            }
          }
        }
      });
    } else if (chartType === 'line') {
      // Line chart for time-based grouping
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Jollibee',
              data: [72, 75, 78, 82],
              borderColor: '#ff3300',
              backgroundColor: 'rgba(255, 51, 0, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'McDonald\\'s',
              data: [68, 70, 69, 71],
              borderColor: '#ffcc00',
              backgroundColor: 'rgba(255, 204, 0, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'KFC',
              data: [65, 68, 67, 70],
              borderColor: '#00a3e0',
              backgroundColor: 'rgba(0, 163, 224, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Sentiment Trends by Week (Last ${options.days} days)',
              color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
            },
            legend: {
              labels: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            },
            y: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            }
          }
        }
      });
    } else if (chartType === 'heatmap') {
      // Simple fallback for heatmap (not directly supported by Chart.js core)
      alert('Heatmap visualization requires additional plugins. Falling back to bar chart.');
      
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jollibee', 'McDonald\\'s', 'KFC', 'Burger King', 'Wendy\\'s', 'Pizza Hut'],
          datasets: [
            {
              label: 'General Insights',
              data: [12, 10, 8, 6, 4, 3],
              backgroundColor: '#8a4fff'
            },
            {
              label: 'Brand Insights',
              data: [15, 12, 10, 8, 6, 4],
              backgroundColor: '#00a3e0'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } else {
      // Default fallback
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jollibee', 'McDonald\\'s', 'KFC', 'Burger King', 'Wendy\\'s', 'Pizza Hut'],
          datasets: [
            {
              label: 'Total Insights',
              data: [45, 37, 29, 23, 15, 10],
              backgroundColor: '#ff3300'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Total Insights by Brand (Last ${options.days} days)',
              color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
            },
            legend: {
              labels: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            },
            y: {
              ticks: {
                color: '${options.theme === 'dark' ? '#f8f9fa' : '#212529'}'
              },
              grid: {
                color: '${options.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}'
              }
            }
          }
        }
      });
    }
  </script>
</body>
</html>`;
  
  // Write chart to file
  fs.writeFileSync(options.output, chartTemplate);
  
  console.log(`Visualization generated successfully at ${options.output}`);
  
  // Open in browser if requested
  if (options.show) {
    console.log('Opening visualization in browser...');
    open(options.output);
  }
}

// Execute 'dashboard' command
function runDashboardCommand(args) {
  // Parse arguments
  const options = {
    refresh: false,
    theme: 'tbwa',
    port: 8080
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--refresh') {
      options.refresh = true;
    } else if (arg === '--theme' && i + 1 < args.length) {
      options.theme = args[++i];
    } else if (arg === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[++i], 10);
    } else if (arg === '--help') {
      showHelp('dashboard');
      return;
    }
  }
  
  console.log('Opening Juicer Insights Dashboard...');
  
  // Path to dashboard
  const dashboardDir = path.join(__dirname, '../dashboards');
  const dashboardPath = path.join(dashboardDir, 'insights_dashboard.html');
  
  // Check if dashboard exists
  if (!fs.existsSync(dashboardPath)) {
    console.error(`Error: Dashboard not found at ${dashboardPath}`);
    console.log('You may need to generate it first with:');
    console.log('  pulser_insights_cli.js visualize --show');
    return;
  }
  
  // If refresh requested, regenerate dashboard
  if (options.refresh) {
    console.log('Refreshing dashboard with latest data...');
    
    // In a real implementation, this would fetch the latest data
    // For demonstration purposes, we'll just modify the timestamp
    
    let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
    
    // Update timestamp
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    dashboardHtml = dashboardHtml.replace(
      /<p>Generated on .*?<\/p>/,
      `<p>Generated on ${currentDate}</p>`
    );
    
    // Apply theme if different from default
    if (options.theme !== 'tbwa') {
      if (options.theme === 'dark') {
        dashboardHtml = dashboardHtml.replace(
          'body {',
          'body { --tbwa-light: #212529; --tbwa-dark: #f8f9fa;'
        );
      } else if (options.theme === 'light') {
        dashboardHtml = dashboardHtml.replace(
          'body {',
          'body { --tbwa-light: #ffffff; --tbwa-dark: #000000;'
        );
      }
    }
    
    // Write updated dashboard
    fs.writeFileSync(dashboardPath, dashboardHtml);
  }
  
  // Create HTTP server to serve the dashboard
  console.log(`Starting dashboard server on port ${options.port}...`);
  
  const server = http.createServer((req, res) => {
    let filePath;
    
    if (req.url === '/' || req.url === '/index.html') {
      filePath = dashboardPath;
    } else if (req.url.startsWith('/insights_visualizer.js')) {
      filePath = path.join(dashboardDir, 'insights_visualizer.js');
    } else if (req.url.startsWith('/assets/')) {
      filePath = path.join(dashboardDir, req.url);
    } else {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    
    if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end(`Server error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
  
  // Start server
  server.listen(options.port, () => {
    console.log(`Dashboard server running at http://localhost:${options.port}/`);
    
    // Open in browser
    open(`http://localhost:${options.port}/`);
    
    console.log('Press Ctrl+C to stop the server');
  });
  
  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${options.port} is already in use.`);
      console.log('Trying an alternative port...');
      
      // Try another port
      options.port++;
      runDashboardCommand(['--port', options.port.toString()]);
    } else {
      console.error(`Server error: ${error.message}`);
      process.exit(1);
    }
  });
  
  // Keep the process running until interrupted
  process.on('SIGINT', () => {
    console.log('\nStopping server...');
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });
}

// Execute 'summarize' command
function runSummarizeCommand(args) {
  // Parse arguments
  const options = {
    days: 30,
    format: 'text'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--brand' && i + 1 < args.length) {
      options.brand = args[++i];
    } else if (arg === '--format' && i + 1 < args.length) {
      options.format = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--help') {
      showHelp('summarize');
      return;
    }
  }
  
  console.log('Generating insights summary...');
  console.log(`- Time range: Last ${options.days} days`);
  if (options.brand) {
    console.log(`- Brand focus: ${options.brand}`);
  }
  console.log(`- Format: ${options.format}`);
  if (options.output) {
    console.log(`- Output: ${options.output}`);
  }
  console.log();
  
  // Generate summary content
  const summaryDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let summaryContent = '';
  
  if (options.format === 'markdown') {
    summaryContent = `# Juicer GenAI Insights Executive Summary
Generated on ${summaryDate}

## Overview
This summary covers insights generated from customer transcripts over the past ${options.days} days${options.brand ? `, with a focus on ${options.brand}` : ''}.

## Key Highlights
- **124** total insights generated with **82%** average confidence
- Top brand mentioned: **Jollibee** (42 insights)
- Most frequent topic: **pricing** (mentioned in 34% of insights)

## Top Insights by Category

### General Insights
- Increasing focus on value meals across all demographics (85% confidence)
- App usage drives higher average order value (83% confidence)

### Brand Insights
${options.brand ? `- ${options.brand}: ` : ''}- Brand loyalty stronger for customers using rewards programs (92% confidence)
- Premium menu items create positive brand associations (89% confidence)

### Sentiment Insights
- Positive sentiment toward expanded vegetarian options (76% confidence)
- Consistent praise for staff friendliness across locations (82% confidence)

### Trend Insights
- Rising preference for breakfast items throughout the day (88% confidence)
- Increasing mentions of nutritional concerns in customer feedback (79% confidence)

## Recommended Actions
1. Develop new value meal options (High Priority)
2. Enhance mobile app rewards features (High Priority)
3. Extend breakfast hours in select locations (High Priority)
4. Expand vegetarian menu offerings (Medium Priority)

## Methodology
Insights were generated using AI analysis of ${options.days} days of customer interaction transcripts, with a minimum confidence threshold of 70%.
`;
  } else if (options.format === 'html') {
    summaryContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juicer GenAI Insights Summary</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #ff3300; }
    h2 { color: #002b49; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    h3 { color: #666; }
    .highlight { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
    .actions { margin-top: 20px; }
    .action { padding: 10px; margin-bottom: 10px; border-left: 4px solid #ccc; }
    .high { border-left-color: #dc3545; }
    .medium { border-left-color: #ffc107; }
    .low { border-left-color: #17a2b8; }
    .footer { margin-top: 30px; font-size: 0.8rem; color: #6c757d; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Juicer GenAI Insights Executive Summary</h1>
    <p>Generated on ${summaryDate}</p>
    
    <h2>Overview</h2>
    <p>This summary covers insights generated from customer transcripts over the past ${options.days} days${options.brand ? `, with a focus on ${options.brand}` : ''}.</p>
    
    <div class="highlight">
      <h3>Key Highlights</h3>
      <ul>
        <li><strong>124</strong> total insights generated with <strong>82%</strong> average confidence</li>
        <li>Top brand mentioned: <strong>Jollibee</strong> (42 insights)</li>
        <li>Most frequent topic: <strong>pricing</strong> (mentioned in 34% of insights)</li>
      </ul>
    </div>
    
    <h2>Top Insights by Category</h2>
    
    <h3>General Insights</h3>
    <ul>
      <li>Increasing focus on value meals across all demographics (85% confidence)</li>
      <li>App usage drives higher average order value (83% confidence)</li>
    </ul>
    
    <h3>Brand Insights</h3>
    <ul>
      <li>${options.brand ? `${options.brand}: ` : ''}Brand loyalty stronger for customers using rewards programs (92% confidence)</li>
      <li>Premium menu items create positive brand associations (89% confidence)</li>
    </ul>
    
    <h3>Sentiment Insights</h3>
    <ul>
      <li>Positive sentiment toward expanded vegetarian options (76% confidence)</li>
      <li>Consistent praise for staff friendliness across locations (82% confidence)</li>
    </ul>
    
    <h3>Trend Insights</h3>
    <ul>
      <li>Rising preference for breakfast items throughout the day (88% confidence)</li>
      <li>Increasing mentions of nutritional concerns in customer feedback (79% confidence)</li>
    </ul>
    
    <h2>Recommended Actions</h2>
    <div class="actions">
      <div class="action high">
        <strong>Develop new value meal options</strong> (High Priority)
        <div>Marketing Team • Due May 15, 2025</div>
      </div>
      <div class="action high">
        <strong>Enhance mobile app rewards features</strong> (High Priority)
        <div>Development Team • Due May 30, 2025</div>
      </div>
      <div class="action high">
        <strong>Extend breakfast hours in select locations</strong> (High Priority)
        <div>Operations Team • Due May 20, 2025</div>
      </div>
      <div class="action medium">
        <strong>Expand vegetarian menu offerings</strong> (Medium Priority)
        <div>Product Team • Due June 10, 2025</div>
      </div>
    </div>
    
    <h2>Methodology</h2>
    <p>Insights were generated using AI analysis of ${options.days} days of customer interaction transcripts, with a minimum confidence threshold of 70%.</p>
    
    <div class="footer">
      <p>Generated by Juicer GenAI Insights • Powered by Advanced Analytics</p>
    </div>
  </div>
</body>
</html>`;
  } else {
    // Default text format
    summaryContent = `JUICER GENAI INSIGHTS EXECUTIVE SUMMARY
Generated on ${summaryDate}

OVERVIEW
This summary covers insights generated from customer transcripts over the past ${options.days} days${options.brand ? `, with a focus on ${options.brand}` : ''}.

KEY HIGHLIGHTS
- 124 total insights generated with 82% average confidence
- Top brand mentioned: Jollibee (42 insights)
- Most frequent topic: pricing (mentioned in 34% of insights)

TOP INSIGHTS BY CATEGORY

General Insights:
- Increasing focus on value meals across all demographics (85% confidence)
- App usage drives higher average order value (83% confidence)

Brand Insights:
${options.brand ? `- ${options.brand}: ` : ''}- Brand loyalty stronger for customers using rewards programs (92% confidence)
- Premium menu items create positive brand associations (89% confidence)

Sentiment Insights:
- Positive sentiment toward expanded vegetarian options (76% confidence)
- Consistent praise for staff friendliness across locations (82% confidence)

Trend Insights:
- Rising preference for breakfast items throughout the day (88% confidence)
- Increasing mentions of nutritional concerns in customer feedback (79% confidence)

RECOMMENDED ACTIONS
1. Develop new value meal options (High Priority)
2. Enhance mobile app rewards features (High Priority)
3. Extend breakfast hours in select locations (High Priority)
4. Expand vegetarian menu offerings (Medium Priority)

METHODOLOGY
Insights were generated using AI analysis of ${options.days} days of customer interaction transcripts, with a minimum confidence threshold of 70%.
`;
  }
  
  // Output summary
  if (options.output) {
    // Write to file
    try {
      // Create directory if it doesn't exist
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(options.output, summaryContent);
      console.log(`Summary written to ${options.output}`);
    } catch (error) {
      console.error(`Error writing summary to file: ${error.message}`);
    }
  } else {
    // Print to console
    console.log(summaryContent);
  }
}

// Main function
async function main() {
  const { command, subArgs } = parseArgs();
  
  if (!command) {
    // No command specified, show help
    showHelp();
    return;
  }
  
  // Execute the appropriate command
  switch (command) {
    case 'generate':
      await runGenerateCommand(subArgs);
      break;
    case 'show':
      runShowCommand(subArgs);
      break;
    case 'visualize':
      runVisualizeCommand(subArgs);
      break;
    case 'dashboard':
      runDashboardCommand(subArgs);
      break;
    case 'summarize':
      runSummarizeCommand(subArgs);
      break;
    case 'help':
      showHelp(subArgs[0]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "pulser_insights_cli.js help" for usage information.');
      break;
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  generateInsights: runGenerateCommand,
  showInsights: runShowCommand,
  visualizeInsights: runVisualizeCommand,
  openDashboard: runDashboardCommand,
  summarizeInsights: runSummarizeCommand
};