/**
 * qa_report.js - QA coverage report generator for Pulser CLI
 * 
 * Generates consolidated QA reports for Claudia and Caca agents,
 * providing coverage metrics, test results summaries, and trend analysis.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Configuration
const QA_DIR = path.join(os.homedir(), '.pulser', 'QA');
const REPORTS_DIR = path.join(QA_DIR, 'reports');
const BASELINE_DIR = path.join(QA_DIR, 'baseline');
const AUDIT_LOG_PATH = path.join(os.homedir(), '.pulser', 'logs', 'Claudia.audit');
const CACA_LOG_PATH = path.join(os.homedir(), '.pulser', 'logs', 'Caca.qa');

/**
 * Handle qa_report command
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function handleQaReportCommand(args) {
  const subcommand = args._[0];
  delete args._; // Remove the subcommand
  
  // Show help if requested
  if (args.help) {
    showHelp();
    return { status: 'success' };
  }
  
  try {
    switch (subcommand) {
    case 'generate':
      return await generateReport(args);
      
    case 'view':
      return await viewReport(args);
      
    case 'trend':
      return await analyzeReportTrend(args);
      
    case 'analyze':
      return await analyzeSpecificAgent(args);
      
    default:
      showHelp();
      return { status: 'error', message: `Unknown subcommand: ${subcommand}` };
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

/**
 * Generate a QA coverage report
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Generation result
 */
async function generateReport(args) {
  console.log('Generating QA coverage report...');
  
  try {
    // Ensure reports directory exists
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    
    // Determine report type and parameters
    const agent = args.agent || 'all';
    const format = args.format || 'markdown';
    const detailed = args.detailed === true;
    const startDate = args.since 
      ? new Date(args.since) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = args.until ? new Date(args.until) : new Date();
    
    // Generate timestamp for the report
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const reportFilename = `qa_report_${agent}_${timestamp}.${format === 'json' ? 'json' : 'md'}`;
    const reportPath = path.join(REPORTS_DIR, reportFilename);
    
    // Collect QA data
    const qaData = await collectQaData(agent, startDate, endDate);
    
    // Generate report content based on format
    let reportContent;
    if (format === 'json') {
      reportContent = JSON.stringify(qaData, null, 2);
    } else {
      reportContent = formatMarkdownReport(qaData, agent, startDate, endDate, detailed);
    }
    
    // Write report to file
    await fs.writeFile(reportPath, reportContent);
    
    console.log(`Report generated successfully: ${reportPath}`);
    
    // Log to Claudia.audit
    await logReportGeneration(agent, reportPath);
    
    return { 
      status: 'success', 
      reportPath,
      summary: {
        agent,
        totalTests: qaData.summary.totalTests,
        passRate: qaData.summary.passRate,
        coverage: qaData.summary.coverage
      }
    };
  } catch (error) {
    return { status: 'error', message: `Report generation failed: ${error.message}` };
  }
}

/**
 * View a previously generated report
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} View result
 */
async function viewReport(args) {
  if (!args.path && !args.latest) {
    console.log('Error: Either --path or --latest is required');
    return { status: 'error', message: 'Missing report path' };
  }
  
  try {
    let reportPath;
    
    if (args.latest) {
      // Find the latest report
      const files = await fs.readdir(REPORTS_DIR);
      const reports = files.filter(file => file.startsWith('qa_report_'));
      
      if (reports.length === 0) {
        return { status: 'error', message: 'No reports found' };
      }
      
      // Sort by modification time (newest first)
      const reportStats = await Promise.all(
        reports.map(async file => {
          const filePath = path.join(REPORTS_DIR, file);
          const stats = await fs.stat(filePath);
          return { file, stats };
        })
      );
      
      reportStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
      reportPath = path.join(REPORTS_DIR, reportStats[0].file);
      
      console.log(`Viewing latest report: ${reportPath}`);
    } else {
      reportPath = args.path;
      console.log(`Viewing report: ${reportPath}`);
    }
    
    // Read and display the report
    const reportContent = await fs.readFile(reportPath, 'utf8');
    
    if (reportPath.endsWith('.json')) {
      // Format JSON for display
      const reportData = JSON.parse(reportContent);
      console.log('\nReport Summary:');
      console.log(`Agent: ${reportData.agent}`);
      console.log(`Date Range: ${reportData.startDate} to ${reportData.endDate}`);
      console.log(`Total Tests: ${reportData.summary.totalTests}`);
      console.log(`Pass Rate: ${reportData.summary.passRate}%`);
      console.log(`Coverage: ${reportData.summary.coverage}%`);
      
      if (args.full) {
        console.log('\nFull Report:');
        console.log(JSON.stringify(reportData, null, 2));
      }
    } else {
      // Display markdown report
      console.log('\n' + reportContent);
    }
    
    return { status: 'success', reportPath };
  } catch (error) {
    return { status: 'error', message: `Failed to view report: ${error.message}` };
  }
}

/**
 * Analyze trends across multiple reports
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Trend analysis result
 */
async function analyzeReportTrend(args) {
  console.log('Analyzing QA report trends...');
  
  try {
    // Find all reports
    const files = await fs.readdir(REPORTS_DIR);
    const reports = files.filter(file => file.startsWith('qa_report_'));
    
    if (reports.length === 0) {
      return { status: 'error', message: 'No reports found for trend analysis' };
    }
    
    // Filter by agent if specified
    const agent = args.agent || 'all';
    const filteredReports = agent === 'all' 
      ? reports 
      : reports.filter(file => file.includes(`qa_report_${agent}_`));
    
    if (filteredReports.length === 0) {
      return { status: 'error', message: `No reports found for agent: ${agent}` };
    }
    
    // Load and parse reports
    const reportData = await Promise.all(
      filteredReports.map(async file => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Parse report content
        let data;
        if (filePath.endsWith('.json')) {
          data = JSON.parse(content);
        } else {
          // Extract basic metrics from markdown report
          data = extractMetricsFromMarkdown(content);
        }
        
        return {
          file,
          date: stats.mtime,
          data
        };
      })
    );
    
    // Sort by date
    reportData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate trends
    const trends = calculateTrends(reportData);
    
    // Generate trend report
    const trendReport = formatTrendReport(trends, agent);
    
    // Save trend report if requested
    if (args.output) {
      await fs.writeFile(args.output, trendReport);
      console.log(`Trend report saved to: ${args.output}`);
    } else {
      console.log('\n' + trendReport);
    }
    
    return { 
      status: 'success', 
      trends,
      reportCount: reportData.length
    };
  } catch (error) {
    return { status: 'error', message: `Trend analysis failed: ${error.message}` };
  }
}

/**
 * Analyze QA metrics for a specific agent
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeSpecificAgent(args) {
  if (!args.agent) {
    console.log('Error: --agent is required');
    return { status: 'error', message: 'Missing agent name' };
  }
  
  const agent = args.agent;
  console.log(`Analyzing QA metrics for agent: ${agent}`);
  
  try {
    // Collect agent-specific QA data
    const startDate = args.since 
      ? new Date(args.since) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to last 90 days
    const endDate = args.until ? new Date(args.until) : new Date();
    
    const qaData = await collectQaData(agent, startDate, endDate);
    
    // Calculate additional metrics for the agent
    const metrics = calculateAgentMetrics(qaData);
    
    // Display metrics
    console.log('\nAgent QA Metrics:');
    console.log(`Total Tests: ${metrics.totalTests}`);
    console.log(`Pass Rate: ${metrics.passRate}%`);
    console.log(`Coverage: ${metrics.coverage}%`);
    console.log(`Tests by Type:`);
    Object.entries(metrics.testsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    if (metrics.failurePatterns.length > 0) {
      console.log('\nCommon Failure Patterns:');
      metrics.failurePatterns.forEach((pattern, idx) => {
        console.log(`${idx + 1}. ${pattern.pattern} (${pattern.count} occurrences)`);
      });
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(metrics, agent);
    console.log('\nRecommendations:');
    recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
    
    // Save analysis to file if requested
    if (args.output) {
      const analysisReport = formatAgentAnalysisReport(metrics, recommendations, agent, startDate, endDate);
      await fs.writeFile(args.output, analysisReport);
      console.log(`\nAnalysis saved to: ${args.output}`);
    }
    
    return { 
      status: 'success', 
      metrics,
      recommendations
    };
  } catch (error) {
    return { status: 'error', message: `Agent analysis failed: ${error.message}` };
  }
}

/**
 * Collect QA data from various sources
 * @param {string} agent - Agent name or 'all'
 * @param {Date} startDate - Start date for data collection
 * @param {Date} endDate - End date for data collection
 * @returns {Promise<Object>} Collected QA data
 */
async function collectQaData(agent, startDate, endDate) {
  // Placeholder for actual implementation
  // This would integrate with visual_qa.js and other QA sources
  
  // For now, return mock data
  return {
    agent,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalTests: 42,
      passRate: 85.7,
      coverage: 76.3
    },
    tests: [
      {
        id: 'visual-qa-dashboard-20250510',
        type: 'visual',
        name: 'Dashboard',
        result: 'pass',
        date: '2025-05-10T14:23:45Z'
      },
      {
        id: 'visual-qa-profile-20250510',
        type: 'visual',
        name: 'Profile',
        result: 'fail',
        date: '2025-05-10T14:24:12Z',
        diff: '/Users/tbwa/.pulser/QA/diffs/profile-diff-20250510.png'
      }
    ],
    coverage: {
      byFeature: {
        'Dashboard': 100,
        'Profile': 80,
        'Settings': 60,
        'Reports': 70
      },
      byType: {
        'visual': 85,
        'functional': 70,
        'API': 65
      }
    }
  };
}

/**
 * Format a markdown report
 * @param {Object} qaData - Collected QA data
 * @param {string} agent - Agent name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {boolean} detailed - Whether to include details
 * @returns {string} Formatted markdown report
 */
function formatMarkdownReport(qaData, agent, startDate, endDate, detailed) {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  let markdown = `# QA Coverage Report: ${agent === 'all' ? 'All Agents' : agent}\n\n`;
  markdown += `**Report Date:** ${new Date().toISOString().split('T')[0]}\n`;
  markdown += `**Time Period:** ${startDateStr} to ${endDateStr}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${qaData.summary.totalTests}\n`;
  markdown += `- **Pass Rate:** ${qaData.summary.passRate}%\n`;
  markdown += `- **Coverage:** ${qaData.summary.coverage}%\n\n`;
  
  markdown += `## Coverage by Feature\n\n`;
  markdown += `| Feature | Coverage |\n`;
  markdown += `|---------|----------|\n`;
  
  Object.entries(qaData.coverage.byFeature).forEach(([feature, coverage]) => {
    markdown += `| ${feature} | ${coverage}% |\n`;
  });
  
  markdown += `\n## Coverage by Test Type\n\n`;
  markdown += `| Type | Coverage |\n`;
  markdown += `|------|----------|\n`;
  
  Object.entries(qaData.coverage.byType).forEach(([type, coverage]) => {
    markdown += `| ${type} | ${coverage}% |\n`;
  });
  
  if (detailed) {
    markdown += `\n## Test Details\n\n`;
    markdown += `| ID | Type | Name | Result | Date |\n`;
    markdown += `|----|------|------|--------|------|\n`;
    
    qaData.tests.forEach(test => {
      markdown += `| ${test.id} | ${test.type} | ${test.name} | ${test.result === 'pass' ? '✅ Pass' : '❌ Fail'} | ${test.date.split('T')[0]} |\n`;
    });
    
    // Add failure details if any
    const failures = qaData.tests.filter(test => test.result === 'fail');
    if (failures.length > 0) {
      markdown += `\n## Failure Details\n\n`;
      
      failures.forEach(failure => {
        markdown += `### ${failure.name} (${failure.id})\n\n`;
        markdown += `- **Date:** ${failure.date.split('T')[0]}\n`;
        if (failure.diff) {
          markdown += `- **Diff:** \`${failure.diff}\`\n`;
        }
        markdown += `\n`;
      });
    }
  }
  
  markdown += `\n## Recommendations\n\n`;
  markdown += `1. Increase test coverage for Settings feature\n`;
  markdown += `2. Add more API tests to improve backend coverage\n`;
  markdown += `3. Fix failing Profile visual test\n`;
  
  return markdown;
}

/**
 * Log report generation to audit logs
 * @param {string} agent - Agent name
 * @param {string} reportPath - Path to the generated report
 * @returns {Promise<void>}
 */
async function logReportGeneration(agent, reportPath) {
  try {
    const logEntry = `${new Date().toISOString()} | QA_REPORT: Generated for ${agent} | Report: ${reportPath} | User: ${process.env.USER || 'unknown'}\n`;
    
    // Ensure log directory exists
    const logDir = path.dirname(AUDIT_LOG_PATH);
    await fs.mkdir(logDir, { recursive: true });
    
    // Append to Claudia.audit
    await fs.appendFile(AUDIT_LOG_PATH, logEntry);
    
    // If report is for Caca, also log to Caca.qa
    if (agent === 'caca' || agent === 'all') {
      await fs.appendFile(CACA_LOG_PATH, logEntry);
    }
  } catch (error) {
    console.error('Error logging to audit logs:', error);
  }
}

/**
 * Extract metrics from a markdown report
 * @param {string} markdown - Markdown report content
 * @returns {Object} Extracted metrics
 */
function extractMetricsFromMarkdown(markdown) {
  // Extract basic metrics using regex
  const totalTestsMatch = markdown.match(/Total Tests:\s*(\d+)/);
  const passRateMatch = markdown.match(/Pass Rate:\s*([\d.]+)%/);
  const coverageMatch = markdown.match(/Coverage:\s*([\d.]+)%/);
  
  return {
    summary: {
      totalTests: totalTestsMatch ? parseInt(totalTestsMatch[1]) : 0,
      passRate: passRateMatch ? parseFloat(passRateMatch[1]) : 0,
      coverage: coverageMatch ? parseFloat(coverageMatch[1]) : 0
    }
  };
}

/**
 * Calculate trends from report data
 * @param {Array} reportData - Array of report data objects
 * @returns {Object} Calculated trends
 */
function calculateTrends(reportData) {
  // Extract metrics for trend calculation
  const dataPoints = reportData.map(report => ({
    date: report.date,
    metrics: report.data.summary
  }));
  
  // Calculate trend directions
  const firstPoint = dataPoints[0];
  const lastPoint = dataPoints[dataPoints.length - 1];
  
  const trends = {
    totalTests: {
      start: firstPoint.metrics.totalTests,
      end: lastPoint.metrics.totalTests,
      change: lastPoint.metrics.totalTests - firstPoint.metrics.totalTests,
      direction: lastPoint.metrics.totalTests > firstPoint.metrics.totalTests ? 'up' : 'down'
    },
    passRate: {
      start: firstPoint.metrics.passRate,
      end: lastPoint.metrics.passRate,
      change: lastPoint.metrics.passRate - firstPoint.metrics.passRate,
      direction: lastPoint.metrics.passRate > firstPoint.metrics.passRate ? 'up' : 'down'
    },
    coverage: {
      start: firstPoint.metrics.coverage,
      end: lastPoint.metrics.coverage,
      change: lastPoint.metrics.coverage - firstPoint.metrics.coverage,
      direction: lastPoint.metrics.coverage > firstPoint.metrics.coverage ? 'up' : 'down'
    },
    dataPoints: dataPoints.map(dp => ({
      date: dp.date,
      totalTests: dp.metrics.totalTests,
      passRate: dp.metrics.passRate,
      coverage: dp.metrics.coverage
    }))
  };
  
  return trends;
}

/**
 * Format a trend report
 * @param {Object} trends - Calculated trends
 * @param {string} agent - Agent name
 * @returns {string} Formatted trend report
 */
function formatTrendReport(trends, agent) {
  const formatChange = (change, direction) => {
    const sign = direction === 'up' ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  };
  
  let report = `# QA Trend Report: ${agent === 'all' ? 'All Agents' : agent}\n\n`;
  report += `**Report Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  
  report += `## Trends Summary\n\n`;
  report += `| Metric | Start | End | Change |\n`;
  report += `|--------|-------|-----|--------|\n`;
  report += `| Total Tests | ${trends.totalTests.start} | ${trends.totalTests.end} | ${formatChange(trends.totalTests.change, trends.totalTests.direction)} |\n`;
  report += `| Pass Rate | ${trends.passRate.start}% | ${trends.passRate.end}% | ${formatChange(trends.passRate.change, trends.passRate.direction)}% |\n`;
  report += `| Coverage | ${trends.coverage.start}% | ${trends.coverage.end}% | ${formatChange(trends.coverage.change, trends.coverage.direction)}% |\n\n`;
  
  report += `## Interpretation\n\n`;
  
  // Interpret total tests trend
  if (trends.totalTests.direction === 'up') {
    report += `- **Test Count:** Increasing (${formatChange(trends.totalTests.change, 'up')} tests added). Test suite is growing appropriately.\n`;
  } else {
    report += `- **Test Count:** Decreasing (${formatChange(trends.totalTests.change, 'down')} tests removed). Investigate if tests were consolidated or removed incorrectly.\n`;
  }
  
  // Interpret pass rate trend
  if (trends.passRate.direction === 'up') {
    report += `- **Pass Rate:** Improving by ${formatChange(trends.passRate.change, 'up')}%. Quality is trending positively.\n`;
  } else {
    report += `- **Pass Rate:** Declining by ${formatChange(trends.passRate.change, 'down')}%. Investigate recent changes that might be causing regressions.\n`;
  }
  
  // Interpret coverage trend
  if (trends.coverage.direction === 'up') {
    report += `- **Coverage:** Increasing by ${formatChange(trends.coverage.change, 'up')}%. Test expansion is effective.\n`;
  } else {
    report += `- **Coverage:** Decreasing by ${formatChange(trends.coverage.change, 'down')}%. New features may be outpacing test development.\n`;
  }
  
  return report;
}

/**
 * Calculate agent-specific metrics
 * @param {Object} qaData - QA data for the agent
 * @returns {Object} Calculated metrics
 */
function calculateAgentMetrics(qaData) {
  // Count tests by type
  const testsByType = {};
  qaData.tests.forEach(test => {
    testsByType[test.type] = (testsByType[test.type] || 0) + 1;
  });
  
  // Find common failure patterns (mock implementation)
  const failurePatterns = [
    { pattern: 'Visual difference in navigation elements', count: 3 },
    { pattern: 'API timeout on high load', count: 2 }
  ];
  
  return {
    totalTests: qaData.summary.totalTests,
    passRate: qaData.summary.passRate,
    coverage: qaData.summary.coverage,
    testsByType,
    failurePatterns
  };
}

/**
 * Generate recommendations based on metrics
 * @param {Object} metrics - Calculated metrics
 * @param {string} agent - Agent name
 * @returns {Array} List of recommendations
 */
function generateRecommendations(metrics, agent) {
  const recommendations = [];
  
  // Add recommendations based on coverage
  if (metrics.coverage < 80) {
    recommendations.push(`Increase overall test coverage for ${agent} (currently at ${metrics.coverage}%)`);
  }
  
  // Add recommendations based on pass rate
  if (metrics.passRate < 90) {
    recommendations.push(`Improve ${agent} test pass rate (currently at ${metrics.passRate}%)`);
  }
  
  // Add recommendations based on test types
  if (!metrics.testsByType.visual || metrics.testsByType.visual < 5) {
    recommendations.push(`Add more visual tests for ${agent}`);
  }
  
  if (!metrics.testsByType.API || metrics.testsByType.API < 5) {
    recommendations.push(`Add more API tests for ${agent}`);
  }
  
  // Add specific recommendations based on failure patterns
  metrics.failurePatterns.forEach(pattern => {
    recommendations.push(`Address common failure: "${pattern.pattern}" (${pattern.count} occurrences)`);
  });
  
  return recommendations;
}

/**
 * Format an agent analysis report
 * @param {Object} metrics - Agent metrics
 * @param {Array} recommendations - List of recommendations
 * @param {string} agent - Agent name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Formatted report
 */
function formatAgentAnalysisReport(metrics, recommendations, agent, startDate, endDate) {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  let report = `# ${agent} QA Analysis Report\n\n`;
  report += `**Report Date:** ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Time Period:** ${startDateStr} to ${endDateStr}\n\n`;
  
  report += `## Metrics Summary\n\n`;
  report += `- **Total Tests:** ${metrics.totalTests}\n`;
  report += `- **Pass Rate:** ${metrics.passRate}%\n`;
  report += `- **Coverage:** ${metrics.coverage}%\n\n`;
  
  report += `## Tests by Type\n\n`;
  report += `| Type | Count |\n`;
  report += `|------|-------|\n`;
  
  Object.entries(metrics.testsByType).forEach(([type, count]) => {
    report += `| ${type} | ${count} |\n`;
  });
  
  if (metrics.failurePatterns.length > 0) {
    report += `\n## Common Failure Patterns\n\n`;
    report += `| Pattern | Occurrences |\n`;
    report += `|---------|-------------|\n`;
    
    metrics.failurePatterns.forEach(pattern => {
      report += `| ${pattern.pattern} | ${pattern.count} |\n`;
    });
  }
  
  report += `\n## Recommendations\n\n`;
  recommendations.forEach((rec, idx) => {
    report += `${idx + 1}. ${rec}\n`;
  });
  
  return report;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
QA Report Command
----------------

Generate and analyze QA coverage reports for Claudia and Caca agents.

Usage:
  pulser qa_report generate [options]  Generate a new QA coverage report
  pulser qa_report view [options]      View a previously generated report
  pulser qa_report trend [options]     Analyze trends across multiple reports
  pulser qa_report analyze [options]   Analyze QA metrics for a specific agent

Generate Options:
  --agent NAME        Agent to generate report for (claudia, caca, all)
  --format FORMAT     Output format (markdown, json)
  --detailed          Include detailed test information
  --since DATE        Start date for report period (YYYY-MM-DD)
  --until DATE        End date for report period (YYYY-MM-DD)

View Options:
  --path PATH         Path to the report file
  --latest            View the most recent report
  --full              Show full report content (for JSON reports)

Trend Options:
  --agent NAME        Filter trend analysis by agent
  --output PATH       Save trend report to a file

Analyze Options:
  --agent NAME        Agent to analyze (required)
  --since DATE        Start date for analysis period (YYYY-MM-DD)
  --until DATE        End date for analysis period (YYYY-MM-DD)
  --output PATH       Save analysis report to a file

Examples:
  pulser qa_report generate --agent claudia --format markdown --detailed
  pulser qa_report view --latest
  pulser qa_report trend --agent caca --output trend_report.md
  pulser qa_report analyze --agent claudia --since 2025-01-01
  `);
}

// Export the command
module.exports = {
  command: 'qa_report',
  description: 'Generate QA coverage reports for agents',
  args: [
    { name: 'agent', type: 'string', description: 'Agent to generate report for' },
    { name: 'format', type: 'string', description: 'Output format (markdown, json)' },
    { name: 'detailed', type: 'boolean', description: 'Include detailed test information' },
    { name: 'since', type: 'string', description: 'Start date (YYYY-MM-DD)' },
    { name: 'until', type: 'string', description: 'End date (YYYY-MM-DD)' },
    { name: 'path', type: 'string', description: 'Path to the report file' },
    { name: 'latest', type: 'boolean', description: 'View the most recent report' },
    { name: 'full', type: 'boolean', description: 'Show full report content' },
    { name: 'output', type: 'string', description: 'Output file path' }
  ],
  handler: handleQaReportCommand
};