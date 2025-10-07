/**
 * Filipino Elements Visualizer
 * 
 * Generates visualizations for Filipino elements analysis using Chart.js
 * and exports them as images for reports.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');
const FilipinoElementsAnalyzer = require('./filipino_elements_analyzer');

// Constants
const OUTPUT_DIR = '/Users/tbwa/ph_awards_reports';
const VISUALIZATION_DIR = path.join(OUTPUT_DIR, 'visualizations');

// TBWA brand colors
const TBWA_COLORS = {
  primary: '#FF3600',    // TBWA Red/Orange
  secondary: '#000000',  // Black
  tertiary: '#FFFFFF',   // White
  accent1: '#FFB800',    // Yellow
  accent2: '#00C2FF',    // Blue
  accent3: '#00FF90',    // Green
  accent4: '#B066FF',    // Purple
  accent5: '#FF66C4',    // Pink
  gray1: '#333333',
  gray2: '#666666',
  gray3: '#999999',
  gray4: '#CCCCCC',
};

// Create visualization directory if it doesn't exist
if (!fs.existsSync(VISUALIZATION_DIR)) {
  fs.mkdirSync(VISUALIZATION_DIR, { recursive: true });
}

class FilipinoElementsVisualizer {
  constructor(dbPath) {
    this.analyzer = new FilipinoElementsAnalyzer(dbPath);
  }

  async close() {
    await this.analyzer.close();
  }

  // Generate element usage bar chart
  async generateElementUsageChart() {
    const elementUsage = await this.analyzer.getElementUsage();
    const elements = Object.keys(elementUsage);
    
    // Sort elements by usage percentage
    elements.sort((a, b) => elementUsage[b].percentage - elementUsage[a].percentage);
    
    // Prepare data for chart
    const labels = elements.map(e => e.replace(/_/g, ' '));
    const data = elements.map(e => elementUsage[e].percentage);
    
    // Create color gradient based on usage
    const colors = elements.map((_, index) => {
      const ratio = index / elements.length;
      // Blend from primary color to accent color based on position
      return this._interpolateColor(TBWA_COLORS.primary, TBWA_COLORS.accent1, ratio);
    });
    
    // Create canvas and chart
    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = TBWA_COLORS.tertiary;
    ctx.fillRect(0, 0, width, height);
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Usage Percentage',
          data,
          backgroundColor: colors,
          borderColor: TBWA_COLORS.secondary,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Filipino Elements Usage in Campaigns',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percentage of Campaigns (%)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Filipino Element'
            }
          }
        }
      }
    });
    
    // Save chart to file
    const outputFile = path.join(VISUALIZATION_DIR, 'filipino_elements_usage.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    
    return outputFile;
  }
  
  // Generate correlation heatmap
  async generateCorrelationHeatmap() {
    const correlations = await this.analyzer.calculateCorrelations();
    const elements = Object.keys(correlations);
    const metrics = ['roi', 'sales_lift', 'brand_lift', 'award_count'];
    
    // Prepare data for heatmap
    const labels = elements.map(e => e.replace(/_/g, ' '));
    const metricLabels = metrics.map(m => {
      // Format metric labels for display
      if (m === 'roi') return 'ROI';
      if (m === 'sales_lift') return 'Sales Lift';
      if (m === 'brand_lift') return 'Brand Lift';
      if (m === 'award_count') return 'Award Count';
      return m;
    });
    
    // Create dataset for each metric
    const datasets = metrics.map((metric, index) => {
      return {
        label: metricLabels[index],
        data: elements.map(element => correlations[element][metric]),
        backgroundColor: (context) => {
          const value = context.raw;
          if (value > 0.5) return this._interpolateColor(TBWA_COLORS.gray4, TBWA_COLORS.accent3, (value - 0.5) * 2);
          if (value > 0) return this._interpolateColor(TBWA_COLORS.gray4, TBWA_COLORS.accent2, value * 2);
          if (value > -0.5) return this._interpolateColor(TBWA_COLORS.gray4, TBWA_COLORS.accent1, Math.abs(value) * 2);
          return this._interpolateColor(TBWA_COLORS.gray4, TBWA_COLORS.primary, (Math.abs(value) - 0.5) * 2);
        }
      };
    });
    
    // Create canvas and chart
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = TBWA_COLORS.tertiary;
    ctx.fillRect(0, 0, width, height);
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Correlation between Filipino Elements and Business Metrics',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Correlation: ${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            min: -1,
            max: 1,
            title: {
              display: true,
              text: 'Correlation Coefficient'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Filipino Element'
            }
          }
        }
      }
    });
    
    // Save chart to file
    const outputFile = path.join(VISUALIZATION_DIR, 'filipino_elements_correlation.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    
    return outputFile;
  }
  
  // Generate Filipino Index Distribution
  async generateFilipinoIndexDistribution() {
    const campaigns = await this.analyzer.getCampaignsWithFilipinoElements();
    
    // Group campaigns by filipino index ranges
    const ranges = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = ranges.slice(0, -1).map((min, i) => {
      const max = ranges[i + 1];
      const count = campaigns.filter(c => 
        c.filipino_index >= min && c.filipino_index < max
      ).length;
      return {
        range: `${(min * 100).toFixed(0)}%-${(max * 100).toFixed(0)}%`,
        count,
        min,
        max
      };
    });
    
    // Prepare data for chart
    const labels = distribution.map(d => d.range);
    const data = distribution.map(d => d.count);
    
    // Create color gradient based on filipino index
    const colors = distribution.map(d => {
      // Blend from accent to primary color based on filipino index
      return this._interpolateColor(TBWA_COLORS.accent2, TBWA_COLORS.primary, d.min);
    });
    
    // Create canvas and chart
    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = TBWA_COLORS.tertiary;
    ctx.fillRect(0, 0, width, height);
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Number of Campaigns',
          data,
          backgroundColor: colors,
          borderColor: TBWA_COLORS.secondary,
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Distribution of Filipino Index across Campaigns',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Campaigns'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Filipino Index Range'
            }
          }
        }
      }
    });
    
    // Save chart to file
    const outputFile = path.join(VISUALIZATION_DIR, 'filipino_index_distribution.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    
    return outputFile;
  }
  
  // Generate enhanced report with visualizations
  async generateEnhancedReport() {
    try {
      // Generate visualizations
      const usageChartPath = await this.generateElementUsageChart();
      const correlationHeatmapPath = await this.generateCorrelationHeatmap();
      const distributionChartPath = await this.generateFilipinoIndexDistribution();
      
      // Get report data
      const campaigns = await this.analyzer.getCampaignsWithFilipinoElements();
      const elementUsage = await this.analyzer.getElementUsage();
      const correlations = await this.analyzer.calculateCorrelations();
      
      // Generate markdown report
      const elements = Object.keys(elementUsage);
      
      let markdown = `# Filipino Elements Analysis Report\n\n`;
      markdown += `*Generated on ${new Date().toISOString().split('T')[0]}*\n\n`;
      
      // Summary statistics
      markdown += `## Summary Statistics\n\n`;
      markdown += `- Total campaigns analyzed: ${campaigns.length}\n`;
      markdown += `- Average Filipino Index: ${(campaigns.reduce((sum, c) => sum + c.filipino_index, 0) / campaigns.length).toFixed(2)}\n\n`;
      
      // Add distribution chart
      markdown += `### Filipino Index Distribution\n\n`;
      markdown += `![Filipino Index Distribution](./visualizations/filipino_index_distribution.png)\n\n`;
      
      // Element Usage with chart
      markdown += `## Filipino Element Usage\n\n`;
      markdown += `![Filipino Elements Usage](./visualizations/filipino_elements_usage.png)\n\n`;
      markdown += `| Element | Count | Percentage |\n`;
      markdown += `|---------|-------|------------|\n`;
      
      elements.forEach(element => {
        const usage = elementUsage[element];
        markdown += `| ${element.replace(/_/g, ' ')} | ${usage.count} | ${usage.percentage.toFixed(1)}% |\n`;
      });
      
      markdown += `\n`;
      
      // Correlations with heatmap
      markdown += `## Correlations with Business Metrics\n\n`;
      markdown += `![Correlation Heatmap](./visualizations/filipino_elements_correlation.png)\n\n`;
      markdown += `| Element | ROI | Sales Lift | Brand Lift | Award Count |\n`;
      markdown += `|---------|-----|------------|------------|-------------|\n`;
      
      elements.forEach(element => {
        const correlation = correlations[element];
        markdown += `| ${element.replace(/_/g, ' ')} | ${correlation.roi.toFixed(2)} | ${correlation.sales_lift.toFixed(2)} | ${correlation.brand_lift.toFixed(2)} | ${correlation.award_count.toFixed(2)} |\n`;
      });
      
      markdown += `\n`;
      
      // Key Insights
      markdown += `## Key Insights\n\n`;
      
      // Find top elements by ROI
      const topROIElements = [...elements]
        .sort((a, b) => correlations[b].roi - correlations[a].roi)
        .slice(0, 3);
      
      markdown += `### Top Elements for ROI\n\n`;
      markdown += `The following Filipino elements showed the strongest positive correlation with ROI:\n\n`;
      topROIElements.forEach(element => {
        markdown += `- **${element.replace(/_/g, ' ')}**: ${correlations[element].roi.toFixed(2)} correlation coefficient\n`;
      });
      markdown += `\n`;
      
      // Find top elements for awards
      const topAwardElements = [...elements]
        .sort((a, b) => correlations[b].award_count - correlations[a].award_count)
        .slice(0, 3);
      
      markdown += `### Top Elements for Awards\n\n`;
      markdown += `The following Filipino elements showed the strongest positive correlation with awards:\n\n`;
      topAwardElements.forEach(element => {
        markdown += `- **${element.replace(/_/g, ' ')}**: ${correlations[element].award_count.toFixed(2)} correlation coefficient\n`;
      });
      markdown += `\n`;
      
      // Top Filipino Campaigns
      markdown += `## Top Campaigns by Filipino Index\n\n`;
      markdown += `| Campaign Name | Brand | Year | Filipino Index | ROI | Awards |\n`;
      markdown += `|---------------|-------|------|----------------|-----|--------|\n`;
      
      campaigns.slice(0, 10).forEach(campaign => {
        markdown += `| ${campaign.campaign_name} | ${campaign.brand} | ${campaign.year} | ${campaign.filipino_index.toFixed(2)} | ${campaign.roi?.toFixed(2) || 'N/A'} | ${campaign.award_count || 0} |\n`;
      });
      
      // Write report to file
      const reportPath = path.join(OUTPUT_DIR, 'filipino_elements_analysis_enhanced.md');
      fs.writeFileSync(reportPath, markdown);
      
      console.log(`Enhanced report generated: ${reportPath}`);
      return reportPath;
    } catch (err) {
      console.error('Error generating enhanced report:', err);
      throw err;
    }
  }
  
  // Helper function to interpolate colors
  _interpolateColor(color1, color2, factor) {
    if (factor < 0) factor = 0;
    if (factor > 1) factor = 1;
    
    const result = '#';
    
    for (let i = 1; i <= 3; i++) {
      const c1 = parseInt(color1.substr(i*2-1, 2), 16);
      const c2 = parseInt(color2.substr(i*2-1, 2), 16);
      let hex = Math.round(c1 + (c2 - c1) * factor).toString(16);
      
      if (hex.length < 2) {
        hex = '0' + hex;
      }
      
      result += hex;
    }
    
    return result;
  }
}

// Command line interface
async function main() {
  const visualizer = new FilipinoElementsVisualizer();
  
  try {
    const reportPath = await visualizer.generateEnhancedReport();
    console.log('Visualization and report generation complete!');
    console.log(`Enhanced report saved to: ${reportPath}`);
  } catch (err) {
    console.error('Error running visualization:', err);
  } finally {
    await visualizer.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FilipinoElementsVisualizer;