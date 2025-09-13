/**
 * Simple runner script for device audit utility
 */

const deviceAudit = require('./utils/device_audit');
const fs = require('fs');

async function main() {
  console.log('Running device audit...');
  
  try {
    // Run the audit
    const auditResult = await deviceAudit.runAudit();
    
    if (auditResult.success) {
      // Print summary report
      console.log(auditResult.summaryReport);
      
      // Optionally save report to file
      const outputPath = './device_audit_report.txt';
      fs.writeFileSync(outputPath, auditResult.summaryReport);
      console.log(`Report saved to ${outputPath}`);
    } else {
      console.error(`Audit failed: ${auditResult.error}`);
    }
  } catch (error) {
    console.error(`Error running audit: ${error.message}`);
  }
}

// Run the main function
main();