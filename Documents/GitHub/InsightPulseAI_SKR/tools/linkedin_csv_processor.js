/**
 * linkedin_csv_processor.js
 * Process LinkedIn applicant CSV data for Pulser
 *
 * This module processes LinkedIn applicant CSV exports and formats the data
 * for integration with the Pulser system. It can be used directly or via
 * the webhook_listener.js API.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const { exec } = require('child_process');
const os = require('os');

// Configure paths
const PULSER_HOME = process.env.HOME ? path.join(process.env.HOME, '.pulser') : '.';
const DATA_DIR = path.join(PULSER_HOME, 'data', 'linkedin');
const LOGS_DIR = path.join(PULSER_HOME, 'logs');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log path
const LOG_FILE = path.join(LOGS_DIR, 'linkedin_processor.log');

/**
 * Log a message with timestamp
 *
 * @param {string} message - The message to log
 * @param {Object} data - Optional data to include
 */
const logMessage = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}\n`;
  
  fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  console.log(`[${timestamp}] ${message}`, data || '');
};

/**
 * Process a LinkedIn CSV file and extract applicant data
 *
 * @param {string} csvFilePath - Path to the CSV file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - The processed data
 */
const processLinkedInCSV = async (csvFilePath, options = {}) => {
  logMessage(`Processing LinkedIn CSV: ${csvFilePath}`);
  
  try {
    // Ensure the file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File does not exist: ${csvFilePath}`);
    }
    
    // Parse CSV file
    const jsonArray = await csv().fromFile(csvFilePath);
    logMessage(`Parsed ${jsonArray.length} records from CSV file`);
    
    // Process and transform the data
    const processedData = {
      applicants: [],
      metadata: {
        processedAt: new Date().toISOString(),
        filename: path.basename(csvFilePath),
        recordCount: jsonArray.length,
        options
      }
    };
    
    // Map the fields based on LinkedIn's export format
    jsonArray.forEach(record => {
      const applicant = {
        fullName: record['First Name'] + ' ' + record['Last Name'],
        firstName: record['First Name'],
        lastName: record['Last Name'],
        email: record['Email'],
        phoneNumber: record['Phone Number'] || record['Mobile Phone'],
        profile: record['LinkedIn Profile'] || record['Profile URL'],
        title: record['Job Title'] || record['Current Position'],
        company: record['Company'] || record['Current Company'],
        dateApplied: record['Date Applied'] || record['Application Date'],
        resumeLink: record['Resume'] || record['Resume URL'],
        status: record['Status'] || 'New',
        notes: record['Notes'] || '',
        tags: options.tags || [],
        source: 'LinkedIn',
        rawData: options.includeRaw ? record : undefined
      };
      
      processedData.applicants.push(applicant);
    });
    
    // Sort applicants by application date (latest first)
    processedData.applicants.sort((a, b) => {
      const dateA = new Date(a.dateApplied || 0);
      const dateB = new Date(b.dateApplied || 0);
      return dateB - dateA;
    });
    
    // Save the processed data
    const outputFilename = options.outputFile || 
      `linkedin_applicants_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const outputPath = path.join(DATA_DIR, outputFilename);
    
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf8');
    logMessage(`Processed data saved to: ${outputPath}`);
    
    // Generate a summary report
    const summary = {
      totalApplicants: processedData.applicants.length,
      dateRange: {
        from: processedData.applicants.length ? processedData.applicants[processedData.applicants.length - 1].dateApplied : null,
        to: processedData.applicants.length ? processedData.applicants[0].dateApplied : null,
      },
      outputPath,
      status: 'success'
    };
    
    // Optionally create a Markdown report
    if (options.generateReport) {
      const reportPath = path.join(DATA_DIR, `${path.basename(outputFilename, '.json')}_report.md`);
      const reportContent = generateMarkdownReport(processedData, options);
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      summary.reportPath = reportPath;
      logMessage(`Report generated at: ${reportPath}`);
    }
    
    return summary;
  } catch (error) {
    logMessage(`Error processing CSV: ${error.message}`, { error: error.stack });
    throw error;
  }
};

/**
 * Generate a Markdown report of the processed data
 *
 * @param {Object} data - The processed data
 * @param {Object} options - Report options
 * @returns {string} - Markdown report content
 */
const generateMarkdownReport = (data, options) => {
  const now = new Date().toISOString().split('T')[0];
  const title = options.title || 'LinkedIn Applicants Report';
  
  let markdown = `# ${title}\n\n`;
  markdown += `Generated: ${now}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Applicants**: ${data.applicants.length}\n`;
  markdown += `- **Source File**: ${data.metadata.filename}\n`;
  markdown += `- **Process Date**: ${data.metadata.processedAt.split('T')[0]}\n`;
  
  if (options.tags && options.tags.length) {
    markdown += `- **Tags**: ${options.tags.join(', ')}\n`;
  }
  
  markdown += `\n## Applicants\n\n`;
  markdown += `| Name | Title | Company | Date Applied | Email | Profile |\n`;
  markdown += `|------|-------|---------|--------------|-------|--------|\n`;
  
  data.applicants.forEach(applicant => {
    const profile = applicant.profile ? `[Link](${applicant.profile})` : 'N/A';
    markdown += `| ${applicant.fullName} | ${applicant.title || 'N/A'} | ${applicant.company || 'N/A'} | ${applicant.dateApplied || 'N/A'} | ${applicant.email || 'N/A'} | ${profile} |\n`;
  });
  
  markdown += `\n## Next Steps\n\n`;
  markdown += `1. Review applicants in the system\n`;
  markdown += `2. Update status using the Pulser CLI\n`;
  markdown += `3. Schedule interviews for promising candidates\n`;
  
  return markdown;
};

/**
 * Command line interface for the processor
 *
 * @param {Array} args - Command line arguments
 */
const cli = async (args) => {
  // Default options
  const options = {
    generateReport: true,
    includeRaw: false,
    tags: []
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' && i + 1 < args.length) {
      options.file = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      options.outputFile = args[++i];
    } else if (arg === '--title' && i + 1 < args.length) {
      options.title = args[++i];
    } else if (arg === '--tag' && i + 1 < args.length) {
      options.tags.push(args[++i]);
    } else if (arg === '--no-report') {
      options.generateReport = false;
    } else if (arg === '--include-raw') {
      options.includeRaw = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
LinkedIn CSV Processor
----------------------

Process LinkedIn applicant CSV exports for the Pulser system.

Usage:
  node linkedin_csv_processor.js --file FILE [options]

Options:
  --file FILE       Path to the LinkedIn CSV export file (required)
  --output FILE     Output filename (defaults to timestamped name)
  --title TEXT      Title for the report (defaults to "LinkedIn Applicants Report")
  --tag TAG         Add a tag to all applicants (can be used multiple times)
  --no-report       Don't generate a Markdown report
  --include-raw     Include raw CSV data in the output
  --help, -h        Show this help text

Examples:
  node linkedin_csv_processor.js --file ~/Downloads/linkedin_applicants.csv
  node linkedin_csv_processor.js --file ~/Downloads/linkedin_applicants.csv --tag "Frontend" --tag "2025-Q2"
      `);
      process.exit(0);
    }
  }
  
  // Validate inputs
  if (!options.file) {
    console.error('Error: --file argument is required');
    process.exit(1);
  }
  
  try {
    // Process the CSV file
    const result = await processLinkedInCSV(options.file, options);
    console.log('LinkedIn CSV processed successfully:');
    console.log(`- Total applicants: ${result.totalApplicants}`);
    console.log(`- Data saved to: ${result.outputPath}`);
    
    if (result.reportPath) {
      console.log(`- Report saved to: ${result.reportPath}`);
    }
    
    // Output JSON representation for parsing by other tools
    if (process.stdout.isTTY) {
      console.log('\nProcess complete.');
    } else {
      // If not in a TTY, just output JSON for piping
      console.log(JSON.stringify(result));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for use as a module
module.exports = {
  processLinkedInCSV,
  generateMarkdownReport
};

// Run as a CLI if executed directly
if (require.main === module) {
  cli(process.argv.slice(2));
}