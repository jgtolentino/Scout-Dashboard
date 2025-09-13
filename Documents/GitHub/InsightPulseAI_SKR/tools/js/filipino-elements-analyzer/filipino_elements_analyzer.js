/**
 * Filipino Elements Analyzer
 * 
 * A tool to analyze and visualize Filipino cultural elements in advertising campaigns
 * and their correlation with business outcomes from the PH Awards SQLite database.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const { execSync } = require('child_process');

// Database connection
const DB_PATH = '/Users/tbwa/ph_awards.db';
const OUTPUT_DIR = '/Users/tbwa/ph_awards_reports';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to run SQL queries as promises
function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main analyzer class
class FilipinoElementsAnalyzer {
  constructor(dbPath = DB_PATH) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
      }
      console.log('Connected to the PH Awards database.');
    });
  }

  // Close database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }

  // Get all Filipino elements from the database
  async getFilipinoElements() {
    // Get column names that represent Filipino elements
    const tableInfo = await runQuery(this.db, "PRAGMA table_info(PH_Filipino_Metrics)");
    
    // Filter columns that start with 'has_' which represent Filipino elements
    const elementColumns = tableInfo
      .filter(col => col.name.startsWith('has_'))
      .map(col => col.name.replace('has_', ''));
    
    return elementColumns;
  }

  // Get campaigns with Filipino elements
  async getCampaignsWithFilipinoElements() {
    const query = `
      SELECT 
        c.id, 
        c.campaign_name, 
        c.brand, 
        c.year,
        f.filipino_index,
        b.roi,
        b.sales_lift,
        b.brand_lift,
        p.award_count
      FROM PH_Awards_Campaigns c
      JOIN PH_Filipino_Metrics f ON c.id = f.campaign_id
      LEFT JOIN PH_Business_Impact b ON c.id = b.campaign_id
      LEFT JOIN PH_Awards_Performance p ON c.id = p.campaign_id
      ORDER BY f.filipino_index DESC
    `;
    
    return await runQuery(this.db, query);
  }

  // Get element usage across campaigns
  async getElementUsage() {
    const elements = await this.getFilipinoElements();
    
    // Create a query that counts usage of each element
    const selects = elements.map(element => 
      `SUM(has_${element}) AS ${element}_count, AVG(has_${element}) * 100 AS ${element}_pct`
    ).join(', ');
    
    const query = `SELECT ${selects} FROM PH_Filipino_Metrics`;
    
    const results = await runQuery(this.db, query);
    
    // Transform results to more usable format
    const usage = {};
    elements.forEach(element => {
      usage[element] = {
        count: results[0][`${element}_count`],
        percentage: results[0][`${element}_pct`]
      };
    });
    
    return usage;
  }

  // Calculate correlation between Filipino elements and business metrics
  async calculateCorrelations() {
    const elements = await this.getFilipinoElements();
    const metrics = ['roi', 'sales_lift', 'brand_lift', 'award_count'];
    
    const correlations = {};
    
    for (const element of elements) {
      correlations[element] = {};
      
      for (const metric of metrics) {
        // Create correlation query based on metric
        let query;
        
        if (metric === 'award_count') {
          query = `
            SELECT 
              COALESCE((
                SELECT CASE
                  WHEN (SQRT((SUM(has_${element}*has_${element}) - (SUM(has_${element})*SUM(has_${element})/COUNT(*))) * SQRT((SUM(p.award_count*p.award_count) - (SUM(p.award_count)*SUM(p.award_count)/COUNT(*))))) = 0 THEN 0
                  ELSE ((SUM(has_${element}*p.award_count) - (SUM(has_${element})*SUM(p.award_count)/COUNT(*))) / 
                    (SQRT((SUM(has_${element}*has_${element}) - (SUM(has_${element})*SUM(has_${element})/COUNT(*))) * SQRT((SUM(p.award_count*p.award_count) - (SUM(p.award_count)*SUM(p.award_count)/COUNT(*))))))
                END
                FROM PH_Filipino_Metrics f
                JOIN PH_Awards_Performance p ON f.campaign_id = p.campaign_id
              ), 0) AS correlation
          `;
        } else {
          query = `
            SELECT 
              COALESCE((
                SELECT CASE
                  WHEN (SQRT((SUM(has_${element}*has_${element}) - (SUM(has_${element})*SUM(has_${element})/COUNT(*))) * SQRT((SUM(b.${metric}*b.${metric}) - (SUM(b.${metric})*SUM(b.${metric})/COUNT(*))))) = 0 THEN 0
                  ELSE ((SUM(has_${element}*b.${metric}) - (SUM(has_${element})*SUM(b.${metric})/COUNT(*))) / 
                    (SQRT((SUM(has_${element}*has_${element}) - (SUM(has_${element})*SUM(has_${element})/COUNT(*))) * SQRT((SUM(b.${metric}*b.${metric}) - (SUM(b.${metric})*SUM(b.${metric})/COUNT(*))))))
                END
                FROM PH_Filipino_Metrics f
                JOIN PH_Business_Impact b ON f.campaign_id = b.campaign_id
                WHERE b.${metric} IS NOT NULL
              ), 0) AS correlation
          `;
        }
        
        const result = await runQuery(this.db, query);
        correlations[element][metric] = result[0].correlation;
      }
    }
    
    return correlations;
  }

  // Generate summary report
  async generateReport() {
    const campaigns = await this.getCampaignsWithFilipinoElements();
    const elementUsage = await this.getElementUsage();
    const correlations = await this.calculateCorrelations();
    
    // Generate markdown report
    const elements = Object.keys(elementUsage);
    
    let markdown = `# Filipino Elements Analysis Report\n\n`;
    markdown += `*Generated on ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    // Summary statistics
    markdown += `## Summary Statistics\n\n`;
    markdown += `- Total campaigns analyzed: ${campaigns.length}\n`;
    markdown += `- Average Filipino Index: ${(campaigns.reduce((sum, c) => sum + c.filipino_index, 0) / campaigns.length).toFixed(2)}\n\n`;
    
    // Element Usage
    markdown += `## Filipino Element Usage\n\n`;
    markdown += `| Element | Count | Percentage |\n`;
    markdown += `|---------|-------|------------|\n`;
    
    elements.forEach(element => {
      const usage = elementUsage[element];
      markdown += `| ${element.replace(/_/g, ' ')} | ${usage.count} | ${usage.percentage.toFixed(1)}% |\n`;
    });
    
    markdown += `\n`;
    
    // Correlations
    markdown += `## Correlations with Business Metrics\n\n`;
    markdown += `| Element | ROI | Sales Lift | Brand Lift | Award Count |\n`;
    markdown += `|---------|-----|------------|------------|-------------|\n`;
    
    elements.forEach(element => {
      const correlation = correlations[element];
      markdown += `| ${element.replace(/_/g, ' ')} | ${correlation.roi.toFixed(2)} | ${correlation.sales_lift.toFixed(2)} | ${correlation.brand_lift.toFixed(2)} | ${correlation.award_count.toFixed(2)} |\n`;
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
    const reportPath = path.join(OUTPUT_DIR, 'filipino_elements_analysis.md');
    fs.writeFileSync(reportPath, markdown);
    
    console.log(`Report generated: ${reportPath}`);
    return reportPath;
  }
}

// Command line interface
async function main() {
  const analyzer = new FilipinoElementsAnalyzer();
  
  try {
    const reportPath = await analyzer.generateReport();
    console.log('Analysis complete!');
    console.log(`Report saved to: ${reportPath}`);
  } catch (err) {
    console.error('Error running analysis:', err);
  } finally {
    analyzer.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FilipinoElementsAnalyzer;