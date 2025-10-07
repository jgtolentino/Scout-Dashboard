#!/usr/bin/env node
/**
 * CLI wrapper for Filipino Elements Analysis Tools
 * 
 * This script provides a command-line interface for analyzing Filipino
 * cultural elements in advertising campaigns from the PH Awards database.
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const FilipinoElementsAnalyzer = require('./filipino_elements_analyzer');
const FilipinoElementsVisualizer = require('./filipino_elements_visualizer');

// Default paths
const DEFAULT_DB_PATH = '/Users/tbwa/ph_awards.db';
const DEFAULT_OUTPUT_DIR = '/Users/tbwa/ph_awards_reports';

// Setup CLI
program
  .name('analyze-filipino-elements')
  .description('Analyze Filipino cultural elements in advertising campaigns')
  .version('1.0.0');

// Basic analysis command
program
  .command('analyze')
  .description('Run basic analysis and generate report')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .option('-o, --output <dir>', 'Output directory for reports', DEFAULT_OUTPUT_DIR)
  .action(async (options) => {
    console.log('Running basic Filipino elements analysis...');
    
    const analyzer = new FilipinoElementsAnalyzer(options.database);
    
    try {
      const reportPath = await analyzer.generateReport();
      console.log('Analysis complete!');
      console.log(`Report saved to: ${reportPath}`);
      
      // Open the report if on macOS
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${reportPath}`);
      }
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      analyzer.close();
    }
  });

// Visualize command
program
  .command('visualize')
  .description('Generate visualizations and enhanced report')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .option('-o, --output <dir>', 'Output directory for reports', DEFAULT_OUTPUT_DIR)
  .action(async (options) => {
    console.log('Generating Filipino elements visualizations...');
    
    const visualizer = new FilipinoElementsVisualizer(options.database);
    
    try {
      const reportPath = await visualizer.generateEnhancedReport();
      console.log('Visualization and report generation complete!');
      console.log(`Enhanced report saved to: ${reportPath}`);
      
      // Open the report if on macOS
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${reportPath}`);
      }
    } catch (err) {
      console.error('Error generating visualizations:', err);
    } finally {
      await visualizer.close();
    }
  });

// Element usage command
program
  .command('usage')
  .description('Show usage of Filipino elements across campaigns')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .action(async (options) => {
    console.log('Analyzing Filipino element usage...');
    
    const analyzer = new FilipinoElementsAnalyzer(options.database);
    
    try {
      const elementUsage = await analyzer.getElementUsage();
      const elements = Object.keys(elementUsage);
      
      // Sort elements by usage percentage
      elements.sort((a, b) => elementUsage[b].percentage - elementUsage[a].percentage);
      
      console.log('\nFilipino Element Usage:');
      console.log('------------------------');
      elements.forEach(element => {
        const usage = elementUsage[element];
        console.log(`${element.padEnd(20)} ${usage.count.toString().padStart(3)} campaigns (${usage.percentage.toFixed(1)}%)`);
      });
      
    } catch (err) {
      console.error('Error analyzing element usage:', err);
    } finally {
      analyzer.close();
    }
  });

// Correlation command
program
  .command('correlations')
  .description('Show correlations between Filipino elements and business metrics')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .option('-s, --sort <metric>', 'Sort by metric (roi, sales_lift, brand_lift, award_count)', 'roi')
  .action(async (options) => {
    console.log('Calculating correlations...');
    
    const analyzer = new FilipinoElementsAnalyzer(options.database);
    
    try {
      const correlations = await analyzer.calculateCorrelations();
      const elements = Object.keys(correlations);
      
      // Sort elements by specified metric
      elements.sort((a, b) => correlations[b][options.sort] - correlations[a][options.sort]);
      
      console.log(`\nFilipino Element Correlations (sorted by ${options.sort}):`);
      console.log('-------------------------------------------------------');
      console.log('Element'.padEnd(20) + 'ROI'.padStart(8) + 'Sales'.padStart(10) + 'Brand'.padStart(10) + 'Awards'.padStart(10));
      console.log('-'.repeat(58));
      
      elements.forEach(element => {
        const corr = correlations[element];
        console.log(
          element.padEnd(20) + 
          corr.roi.toFixed(2).padStart(8) + 
          corr.sales_lift.toFixed(2).padStart(10) + 
          corr.brand_lift.toFixed(2).padStart(10) + 
          corr.award_count.toFixed(2).padStart(10)
        );
      });
      
    } catch (err) {
      console.error('Error calculating correlations:', err);
    } finally {
      analyzer.close();
    }
  });

// Top campaigns command
program
  .command('top-campaigns')
  .description('Show top campaigns by Filipino Index')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .option('-n, --count <number>', 'Number of campaigns to show', 10)
  .action(async (options) => {
    console.log('Finding top campaigns by Filipino Index...');
    
    const analyzer = new FilipinoElementsAnalyzer(options.database);
    
    try {
      const campaigns = await analyzer.getCampaignsWithFilipinoElements();
      const count = Math.min(parseInt(options.count), campaigns.length);
      
      console.log(`\nTop ${count} Campaigns by Filipino Index:`);
      console.log('----------------------------------------');
      console.log('Campaign Name'.padEnd(30) + 'Brand'.padEnd(15) + 'Year'.padEnd(6) + 'Filipino Index'.padEnd(15) + 'ROI'.padEnd(8) + 'Awards');
      console.log('-'.repeat(85));
      
      campaigns.slice(0, count).forEach(campaign => {
        console.log(
          campaign.campaign_name.substring(0, 28).padEnd(30) + 
          campaign.brand.substring(0, 13).padEnd(15) + 
          campaign.year.toString().padEnd(6) + 
          campaign.filipino_index.toFixed(2).padEnd(15) + 
          (campaign.roi ? campaign.roi.toFixed(2).padEnd(8) : 'N/A'.padEnd(8)) + 
          (campaign.award_count || 0)
        );
      });
      
    } catch (err) {
      console.error('Error finding top campaigns:', err);
    } finally {
      analyzer.close();
    }
  });

// Add commands for generating individual visualizations
program
  .command('chart-usage')
  .description('Generate Filipino element usage chart')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .action(async (options) => {
    console.log('Generating Filipino element usage chart...');
    
    const visualizer = new FilipinoElementsVisualizer(options.database);
    
    try {
      const chartPath = await visualizer.generateElementUsageChart();
      console.log(`Chart saved to: ${chartPath}`);
      
      // Open the chart if on macOS
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${chartPath}`);
      }
    } catch (err) {
      console.error('Error generating usage chart:', err);
    } finally {
      await visualizer.close();
    }
  });

program
  .command('chart-correlation')
  .description('Generate correlation heatmap')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .action(async (options) => {
    console.log('Generating correlation heatmap...');
    
    const visualizer = new FilipinoElementsVisualizer(options.database);
    
    try {
      const chartPath = await visualizer.generateCorrelationHeatmap();
      console.log(`Chart saved to: ${chartPath}`);
      
      // Open the chart if on macOS
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${chartPath}`);
      }
    } catch (err) {
      console.error('Error generating correlation heatmap:', err);
    } finally {
      await visualizer.close();
    }
  });

program
  .command('chart-distribution')
  .description('Generate Filipino Index distribution chart')
  .option('-d, --database <path>', 'Path to SQLite database', DEFAULT_DB_PATH)
  .action(async (options) => {
    console.log('Generating Filipino Index distribution chart...');
    
    const visualizer = new FilipinoElementsVisualizer(options.database);
    
    try {
      const chartPath = await visualizer.generateFilipinoIndexDistribution();
      console.log(`Chart saved to: ${chartPath}`);
      
      // Open the chart if on macOS
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${chartPath}`);
      }
    } catch (err) {
      console.error('Error generating distribution chart:', err);
    } finally {
      await visualizer.close();
    }
  });

// Execute CLI
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}