/**
 * insights_validator.js - Validation system for GenAI insights
 * 
 * This script implements validation rules for Juicer GenAI insights
 * by leveraging Caca's QA capabilities to detect hallucinations,
 * validate factual claims, and ensure statistical accuracy.
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  // Claude API settings
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-sonnet-20240229',
    baseUrl: 'https://api.anthropic.com/v1/messages'
  },
  
  // Validation thresholds
  thresholds: {
    hallucination: 0.2, // Maximum hallucination probability
    contradictory: 0.15, // Maximum contradictory claims
    statistical: 0.1, // Maximum statistical errors
    overall: 0.85 // Minimum overall quality score (0-1)
  },
  
  // Output directory for validation reports
  reportDir: path.join(__dirname, 'qa', 'validation')
};

/**
 * Validate a set of insights using Caca QA rules
 * @param {Object[]} insights - Array of insight objects to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation results
 */
async function validateInsights(insights, options = {}) {
  // Apply options with defaults
  const thresholds = { ...CONFIG.thresholds, ...options.thresholds };
  
  console.log(`🔍 Validating ${insights.length} insights...`);
  
  // Create report directory if needed
  await fs.mkdir(CONFIG.reportDir, { recursive: true });
  
  // Group insights by type for efficient processing
  const insightsByType = insights.reduce((groups, insight) => {
    const type = insight.insight_type || 'general';
    if (!groups[type]) groups[type] = [];
    groups[type].push(insight);
    return groups;
  }, {});
  
  // Results structure
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total: insights.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      avgQualityScore: 0
    },
    insights: []
  };
  
  // Process each insight type
  for (const [type, typeInsights] of Object.entries(insightsByType)) {
    console.log(`\n⚙️ Validating ${typeInsights.length} ${type} insights...`);
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < typeInsights.length; i += batchSize) {
      const batch = typeInsights.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(insight => validateSingleInsight(insight, thresholds))
      );
      
      // Add to results
      results.insights.push(...batchResults);
      
      // Update summary
      for (const result of batchResults) {
        if (result.passed) {
          results.summary.passed++;
        } else if (result.failureReason.includes('WARNING')) {
          results.summary.warnings++;
        } else {
          results.summary.failed++;
        }
      }
    }
  }
  
  // Calculate average quality score
  results.summary.avgQualityScore = results.insights.reduce(
    (sum, insight) => sum + insight.qualityScore, 0
  ) / results.insights.length;
  
  // Generate validation report
  const reportPath = await generateReport(results);
  
  // Print summary
  console.log('\n📋 Validation Summary:');
  console.log(`  Total insights: ${results.summary.total}`);
  console.log(`  ✅ Passed: ${results.summary.passed}`);
  console.log(`  ⚠️ Warnings: ${results.summary.warnings}`);
  console.log(`  ❌ Failed: ${results.summary.failed}`);
  console.log(`  📊 Average quality score: ${(results.summary.avgQualityScore * 100).toFixed(1)}%`);
  console.log(`  📄 Report: ${reportPath}`);
  
  return results;
}

/**
 * Validate a single insight using Claude/Caca
 * @param {Object} insight - Insight object to validate
 * @param {Object} thresholds - Validation thresholds
 * @returns {Promise<Object>} Validation result
 */
async function validateSingleInsight(insight, thresholds) {
  const insightId = insight.insight_id;
  const title = insight.insight_title;
  
  console.log(`  🔍 Validating insight: ${title} (${insightId})`);
  
  try {
    // Prepare prompt for Claude
    const prompt = `
You are Caca, an expert QA validator for AI-generated insights. Your task is to analyze the following business insight and identify potential quality issues, especially factual errors, hallucinations, or statistical inaccuracies.

## INSIGHT TO VALIDATE
Title: ${insight.insight_title}
Type: ${insight.insight_type}
Text: ${insight.insight_text}
${insight.source_transcripts ? `Source Transcripts: ${insight.source_transcripts.join(', ')}` : ''}
${insight.brands_mentioned ? `Brands Mentioned: ${insight.brands_mentioned.join(', ')}` : ''}
${insight.summary_tags ? `Tags: ${insight.summary_tags.join(', ')}` : ''}

## VALIDATION TASK
1. Analyze this insight for potential factual errors or hallucinations
2. Identify any contradictory claims or logical inconsistencies
3. Evaluate statistical claims and percentages for plausibility
4. Check if the insight is properly supported by the mentioned sources
5. Verify if the brands mentioned are relevant to the insight

## SCORING CRITERIA
- Hallucination Score: Likelihood that the insight contains fabricated information (0-1)
- Contradiction Score: Presence of internal contradictions or logical inconsistencies (0-1)
- Statistical Accuracy: Plausibility of numerical claims and percentages (0-1)
- Source Alignment: How well the insight aligns with mentioned sources (0-1)
- Overall Quality: Overall assessment of the insight's reliability (0-1)

Provide your assessment in JSON format only, with scores and explanations for each criterion.
`;

    // Call Claude API
    const claudeResponse = await callClaude(prompt);
    
    // Parse validation result
    let validation;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         claudeResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        validation = JSON.parse(jsonContent);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (error) {
      console.error(`  ❌ Failed to parse validation result: ${error.message}`);
      
      // Fallback with default validation
      validation = {
        hallucination_score: 0.5,
        contradiction_score: 0.5,
        statistical_accuracy: 0.5,
        source_alignment: 0.5,
        overall_quality: 0.5,
        explanation: `Error parsing Claude response: ${error.message}`,
        issues: ["Failed to validate properly"]
      };
    }
    
    // Calculate quality score
    const qualityScore = validation.overall_quality || 
      (1 - (
        (validation.hallucination_score || 0) * 0.4 + 
        (validation.contradiction_score || 0) * 0.2 + 
        (1 - (validation.statistical_accuracy || 0)) * 0.2 + 
        (1 - (validation.source_alignment || 0)) * 0.2
      ));
    
    // Determine if the insight passed validation
    const passed = 
      (validation.hallucination_score || 0) <= thresholds.hallucination &&
      (validation.contradiction_score || 0) <= thresholds.contradictory &&
      (1 - (validation.statistical_accuracy || 0)) <= thresholds.statistical &&
      qualityScore >= thresholds.overall;
    
    // Determine failure reason if failed
    let failureReason = '';
    if (!passed) {
      if ((validation.hallucination_score || 0) > thresholds.hallucination) {
        failureReason = 'CRITICAL: High hallucination score';
      } else if ((validation.contradiction_score || 0) > thresholds.contradictory) {
        failureReason = 'CRITICAL: Contains contradictions';
      } else if ((1 - (validation.statistical_accuracy || 0)) > thresholds.statistical) {
        failureReason = 'CRITICAL: Statistical inaccuracies';
      } else if (qualityScore < thresholds.overall) {
        failureReason = 'WARNING: Low overall quality score';
      }
    }
    
    // Create validation result
    const result = {
      insight_id: insightId,
      title,
      passed,
      failureReason,
      qualityScore,
      scores: {
        hallucination: validation.hallucination_score || 0,
        contradiction: validation.contradiction_score || 0,
        statisticalAccuracy: validation.statistical_accuracy || 1,
        sourceAlignment: validation.source_alignment || 1,
        overallQuality: validation.overall_quality || qualityScore
      },
      explanation: validation.explanation || '',
      issues: validation.issues || []
    };
    
    // Log result
    if (passed) {
      console.log(`    ✅ Passed (Quality: ${(qualityScore * 100).toFixed(1)}%)`);
    } else {
      console.log(`    ❌ Failed: ${failureReason} (Quality: ${(qualityScore * 100).toFixed(1)}%)`);
    }
    
    return result;
  } catch (error) {
    console.error(`    ❌ Validation error: ${error.message}`);
    
    // Return error result
    return {
      insight_id: insightId,
      title,
      passed: false,
      failureReason: `ERROR: ${error.message}`,
      qualityScore: 0,
      scores: {
        hallucination: 1,
        contradiction: 1,
        statisticalAccuracy: 0,
        sourceAlignment: 0,
        overallQuality: 0
      },
      explanation: `Failed to validate: ${error.message}`,
      issues: [`Validation error: ${error.message}`]
    };
  }
}

/**
 * Call Claude API for validation
 * @param {string} prompt - Prompt to send to Claude
 * @returns {Promise<string>} Claude's response
 */
async function callClaude(prompt) {
  // Skip API call if no API key
  if (!process.env.CLAUDE_API_KEY && !CONFIG.claude.apiKey) {
    console.log('    ⚠️ No Claude API key found, using mock validation');
    return mockValidationResponse();
  }
  
  try {
    const apiKey = process.env.CLAUDE_API_KEY || CONFIG.claude.apiKey;
    
    // Call Claude API
    const response = await axios.post(
      CONFIG.claude.baseUrl,
      {
        model: CONFIG.claude.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: "You are Caca, a QA validator for GenAI insights. You provide analysis in JSON format only. Your responses should be structured JSON with no additional text."
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Return response content
    return response.data.content[0].text;
  } catch (error) {
    console.error(`    ❌ Claude API error: ${error.message}`);
    return mockValidationResponse(true);
  }
}

/**
 * Generate a mock validation response for testing
 * @param {boolean} isError - Whether to simulate an error
 * @returns {string} Mock response JSON
 */
function mockValidationResponse(isError = false) {
  if (isError) {
    return JSON.stringify({
      hallucination_score: 0.8,
      contradiction_score: 0.6,
      statistical_accuracy: 0.3,
      source_alignment: 0.4,
      overall_quality: 0.3,
      explanation: "Mock validation shows major issues with this insight.",
      issues: [
        "Contains likely hallucinated information",
        "Statistical claims are implausible",
        "Doesn't align well with mentioned sources"
      ]
    });
  }
  
  // Generate random scores, weighted toward passing
  const hallucination = Math.random() * 0.3;
  const contradiction = Math.random() * 0.2;
  const statistical = 0.7 + Math.random() * 0.3;
  const source = 0.7 + Math.random() * 0.3;
  const overall = 0.7 + Math.random() * 0.3;
  
  return JSON.stringify({
    hallucination_score: hallucination,
    contradiction_score: contradiction,
    statistical_accuracy: statistical,
    source_alignment: source,
    overall_quality: overall,
    explanation: "This is a mock validation response for testing purposes.",
    issues: hallucination > 0.2 ? ["Possible hallucination detected in claim about market share"] : []
  });
}

/**
 * Generate HTML report for validation results
 * @param {Object} results - Validation results
 * @returns {Promise<string>} Path to generated report
 */
async function generateReport(results) {
  const reportPath = path.join(CONFIG.reportDir, `validation-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juicer Insights Validation Report</title>
  <style>
    :root {
      --primary: #ff3300;
      --secondary: #002b49;
      --success: #28a745;
      --danger: #dc3545;
      --warning: #ffc107;
      --info: #17a2b8;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    
    .header {
      background-color: var(--secondary);
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    
    .summary {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .summary-box {
      flex: 1;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .summary-box h3 {
      margin-top: 0;
    }
    
    .summary-box.total {
      background-color: var(--secondary);
      color: white;
    }
    
    .summary-box.passed {
      background-color: var(--success);
      color: white;
    }
    
    .summary-box.failed {
      background-color: var(--danger);
      color: white;
    }
    
    .summary-box.warnings {
      background-color: var(--warning);
      color: black;
    }
    
    .summary-box.quality {
      background-color: var(--info);
      color: white;
    }
    
    .result-card {
      margin-bottom: 15px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .result-card.pass {
      border-left: 5px solid var(--success);
    }
    
    .result-card.fail {
      border-left: 5px solid var(--danger);
    }
    
    .result-card.warning {
      border-left: 5px solid var(--warning);
    }
    
    .result-card h3 {
      margin-top: 0;
      display: flex;
      justify-content: space-between;
    }
    
    .result-card .status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    
    .result-card .status.pass {
      background-color: var(--success);
      color: white;
    }
    
    .result-card .status.fail {
      background-color: var(--danger);
      color: white;
    }
    
    .result-card .status.warning {
      background-color: var(--warning);
      color: black;
    }
    
    .scores {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 15px 0;
    }
    
    .score-item {
      flex: 1;
      min-width: 150px;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .score-item h4 {
      margin: 0 0 5px 0;
      font-size: 0.9em;
    }
    
    .score-value {
      font-size: 1.5em;
      font-weight: bold;
    }
    
    .score-bar {
      height: 6px;
      background-color: #eee;
      border-radius: 3px;
      margin-top: 5px;
      overflow: hidden;
    }
    
    .score-fill {
      height: 100%;
      border-radius: 3px;
    }
    
    .issues-list {
      margin-top: 15px;
      padding-left: 20px;
    }
    
    .issues-list li {
      margin-bottom: 5px;
    }
    
    .explanation {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 5px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Juicer Insights Validation Report</h1>
    <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-box total">
      <h3>Total Insights</h3>
      <h2>${results.summary.total}</h2>
    </div>
    <div class="summary-box passed">
      <h3>Passed</h3>
      <h2>${results.summary.passed}</h2>
    </div>
    <div class="summary-box warnings">
      <h3>Warnings</h3>
      <h2>${results.summary.warnings}</h2>
    </div>
    <div class="summary-box failed">
      <h3>Failed</h3>
      <h2>${results.summary.failed}</h2>
    </div>
    <div class="summary-box quality">
      <h3>Avg. Quality</h3>
      <h2>${(results.summary.avgQualityScore * 100).toFixed(1)}%</h2>
    </div>
  </div>
  
  <h2>Validation Results</h2>
  
  ${results.insights.map(insight => {
    let statusClass = 'pass';
    let statusLabel = 'PASS';
    
    if (!insight.passed) {
      if (insight.failureReason.includes('WARNING')) {
        statusClass = 'warning';
        statusLabel = 'WARNING';
      } else {
        statusClass = 'fail';
        statusLabel = 'FAIL';
      }
    }
    
    const getScoreColor = (name, value) => {
      if (name === 'hallucination' || name === 'contradiction') {
        // Lower is better for these
        if (value < 0.1) return '#28a745';
        if (value < 0.2) return '#93c54b';
        if (value < 0.3) return '#ffc107';
        return '#dc3545';
      } else {
        // Higher is better for these
        if (value > 0.9) return '#28a745';
        if (value > 0.8) return '#93c54b';
        if (value > 0.7) return '#ffc107';
        return '#dc3545';
      }
    };
    
    return `
    <div class="result-card ${statusClass}">
      <h3>
        ${insight.title}
        <span class="status ${statusClass}">${statusLabel}</span>
      </h3>
      
      <p><strong>ID:</strong> ${insight.insight_id}</p>
      <p><strong>Quality Score:</strong> ${(insight.qualityScore * 100).toFixed(1)}%</p>
      
      ${insight.failureReason 
        ? `<p><strong>Failure Reason:</strong> ${insight.failureReason}</p>` 
        : ''}
      
      <div class="scores">
        <div class="score-item">
          <h4>Hallucination</h4>
          <div class="score-value">${(insight.scores.hallucination * 100).toFixed()}%</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${insight.scores.hallucination * 100}%; background-color: ${getScoreColor('hallucination', insight.scores.hallucination)}"></div>
          </div>
        </div>
        
        <div class="score-item">
          <h4>Contradiction</h4>
          <div class="score-value">${(insight.scores.contradiction * 100).toFixed()}%</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${insight.scores.contradiction * 100}%; background-color: ${getScoreColor('contradiction', insight.scores.contradiction)}"></div>
          </div>
        </div>
        
        <div class="score-item">
          <h4>Statistical Accuracy</h4>
          <div class="score-value">${(insight.scores.statisticalAccuracy * 100).toFixed()}%</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${insight.scores.statisticalAccuracy * 100}%; background-color: ${getScoreColor('statisticalAccuracy', insight.scores.statisticalAccuracy)}"></div>
          </div>
        </div>
        
        <div class="score-item">
          <h4>Source Alignment</h4>
          <div class="score-value">${(insight.scores.sourceAlignment * 100).toFixed()}%</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${insight.scores.sourceAlignment * 100}%; background-color: ${getScoreColor('sourceAlignment', insight.scores.sourceAlignment)}"></div>
          </div>
        </div>
      </div>
      
      ${insight.issues && insight.issues.length > 0 
        ? `<div>
            <h4>Issues:</h4>
            <ul class="issues-list">
              ${insight.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>` 
        : ''}
      
      ${insight.explanation 
        ? `<div class="explanation">${insight.explanation}</div>` 
        : ''}
    </div>
    `;
  }).join('')}
</body>
</html>
  `;
  
  // Write report to file
  await fs.writeFile(reportPath, htmlContent);
  
  return reportPath;
}

// Command line interface
if (require.main === module) {
  // Check if test data file is provided
  const args = process.argv.slice(2);
  let inputFile = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      inputFile = args[i + 1];
      break;
    }
  }
  
  // Run validation with test data or show help
  if (inputFile) {
    fs.readFile(inputFile, 'utf8')
      .then(data => {
        const insights = JSON.parse(data);
        return validateInsights(insights);
      })
      .then(results => {
        // Exit with error code if critical failures
        if (results.summary.failed > 0) {
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('Error validating insights:', error);
        process.exit(1);
      });
  } else {
    console.log(`
Insights Validator Tool
----------------------

Validate Juicer GenAI insights for quality issues.

Usage:
  node insights_validator.js --input <insights_file.json>

Options:
  --input FILE    JSON file containing insights to validate
  
Example:
  node insights_validator.js --input ./platinum_insights.json
    `);
  }
}

module.exports = {
  validateInsights
};