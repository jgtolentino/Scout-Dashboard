/**
 * Global teardown for Client360 Dashboard E2E tests
 * 
 * This runs once after all tests to:
 * - Clean up test data
 * - Generate final reports
 * - Archive test artifacts
 */

async function globalTeardown(config) {
  console.log('🧹 Cleaning up after Client360 Dashboard E2E tests...');
  
  try {
    // Generate test summary if needed
    const testResultsPath = 'test-results/results.json';
    
    // Check if we have test results to process
    const fs = require('fs');
    if (fs.existsSync(testResultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
        
        console.log('📊 Test Summary:');
        console.log(`   Total tests: ${results.stats?.total || 'N/A'}`);
        console.log(`   Passed: ${results.stats?.passed || 'N/A'}`);
        console.log(`   Failed: ${results.stats?.failed || 'N/A'}`);
        console.log(`   Skipped: ${results.stats?.skipped || 'N/A'}`);
        console.log(`   Duration: ${results.stats?.duration || 'N/A'}ms`);
        
        // Log any failures
        if (results.stats?.failed > 0) {
          console.log('❌ Failed tests detected. Check the HTML report for details.');
        } else {
          console.log('✅ All tests passed successfully!');
        }
        
      } catch (error) {
        console.warn('⚠️  Could not parse test results:', error.message);
      }
    }
    
    // Archive screenshots and videos if they exist
    if (fs.existsSync('test-results/')) {
      const files = fs.readdirSync('test-results/');
      const screenshots = files.filter(f => f.endsWith('.png')).length;
      const videos = files.filter(f => f.endsWith('.webm')).length;
      
      if (screenshots > 0 || videos > 0) {
        console.log(`📸 Captured ${screenshots} screenshots and ${videos} videos`);
      }
    }
    
    // Clean up temporary files if needed
    // Note: Be careful not to delete important test artifacts
    
    console.log('✅ Global teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here as it might mask test failures
  }
}

module.exports = globalTeardown;