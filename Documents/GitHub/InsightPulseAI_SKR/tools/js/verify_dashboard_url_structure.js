#!/usr/bin/env node

/**
 * Scout Dashboard URL Structure Verification Tool
 * 
 * This script checks a deployed Scout Dashboard to verify it follows the
 * URL structure requirements specified in CLAUDE.md.
 * 
 * Usage:
 *   node verify_dashboard_url_structure.js <base_url>
 * 
 * Example:
 *   node verify_dashboard_url_structure.js https://wonderful-desert-03a292c00.6.azurestaticapps.net
 */

const https = require('https');
const { URL } = require('url');

// Dashboard routes to check
const routesToCheck = [
  { path: '/', name: 'Root', required: true },
  { path: '/advisor', name: 'Advisor Directory', required: true },
  { path: '/advisor.html', name: 'Advisor Flat File', required: true },
  { path: '/edge', name: 'Edge Directory', required: true },
  { path: '/edge.html', name: 'Edge Flat File', required: true },
  { path: '/ops', name: 'Ops Directory', required: true },
  { path: '/ops.html', name: 'Ops Flat File', required: true },
  { path: '/insights_dashboard.html', name: 'Legacy URL', required: true, expectRedirect: '/advisor' }
];

// Function to check a single URL
function checkUrl(baseUrl, route) {
  return new Promise((resolve) => {
    const url = new URL(route.path, baseUrl);
    const options = {
      method: 'GET',
      timeout: 15000
    };

    const req = https.request(url, options, (res) => {
      const status = res.statusCode;
      const isSuccess = status >= 200 && status < 400;
      const redirectLocation = res.headers.location;
      
      let result = {
        route: route.path,
        name: route.name,
        status,
        isSuccess,
        redirectTo: redirectLocation
      };

      // Check if we expected a redirect
      if (route.expectRedirect) {
        const redirectMatches = redirectLocation && 
          (redirectLocation === route.expectRedirect || 
           redirectLocation.endsWith(route.expectRedirect));
        
        result.expectedRedirect = route.expectRedirect;
        result.redirectMatches = redirectMatches;
        result.isSuccess = status >= 300 && status < 400 && redirectMatches;
      }

      resolve(result);
    });

    req.on('error', (error) => {
      resolve({
        route: route.path,
        name: route.name,
        status: 'Error',
        error: error.message,
        isSuccess: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        route: route.path,
        name: route.name,
        status: 'Timeout',
        error: 'Request timed out',
        isSuccess: false
      });
    });

    req.end();
  });
}

// Main function
async function verifyDashboardUrls(baseUrl) {
  console.log(`\n🔍 Scout Dashboard URL Structure Verification`);
  console.log(`🌐 Testing: ${baseUrl}\n`);

  // Check if URL is valid
  try {
    new URL(baseUrl);
  } catch (error) {
    console.error(`❌ Invalid URL: ${baseUrl}`);
    console.error(`   Please provide a valid URL (e.g., https://example.com)\n`);
    process.exit(1);
  }

  // Check each route
  const results = [];
  for (const route of routesToCheck) {
    const result = await checkUrl(baseUrl, route);
    results.push(result);
  }

  // Display results
  console.log('📋 URL Verification Results:');
  console.log('─'.repeat(80));
  console.log(`${'Route'.padEnd(25)} | ${'Status'.padEnd(10)} | ${'Result'.padEnd(15)} | Details`);
  console.log('─'.repeat(80));

  let passedChecks = 0;
  let failedChecks = 0;

  for (const result of results) {
    let statusDisplay = `${result.status}`.padEnd(10);
    let resultDisplay = (result.isSuccess ? '✅ PASS' : '❌ FAIL').padEnd(15);
    let details = '';

    if (result.expectedRedirect) {
      details = `Expected redirect to ${result.expectedRedirect}`;
      if (result.redirectTo) {
        details += `, got ${result.redirectTo}`;
      } else {
        details += `, but no redirect occurred`;
      }
    } else if (result.error) {
      details = result.error;
    } else if (result.redirectTo) {
      details = `Redirects to ${result.redirectTo}`;
    }

    console.log(`${result.route.padEnd(25)} | ${statusDisplay} | ${resultDisplay} | ${details}`);
    
    if (result.isSuccess) {
      passedChecks++;
    } else {
      failedChecks++;
    }
  }

  console.log('─'.repeat(80));
  
  // Summary
  const totalChecks = routesToCheck.length;
  const passPercentage = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} checks passed (${passPercentage}%)\n`);

  if (failedChecks === 0) {
    console.log(`✅ SUCCESS: All URL structure requirements passed!`);
    console.log(`   The dashboard follows the required URL structure pattern from CLAUDE.md.\n`);
  } else {
    console.log(`❌ FAILED: ${failedChecks} URL structure checks failed.`);
    console.log(`   Please fix the URL structure using the fix_scout_dashboard_404.sh script.`);
    console.log(`   See README_SCOUT_URL_STRUCTURE.md for more information.\n`);
  }
}

// Get base URL from command line args
const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error('\n❌ Error: No base URL provided');
  console.error('Usage: node verify_dashboard_url_structure.js <base_url>');
  console.error('Example: node verify_dashboard_url_structure.js https://example.azurestaticapps.net\n');
  process.exit(1);
}

// Run the verification
verifyDashboardUrls(baseUrl).catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});