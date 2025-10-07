/**
 * Scheduled Dashboard Tests
 * 
 * Run automated tests on a schedule to verify dashboard functionality
 * and data freshness
 */

const { verifyDataFreshness } = require('./freshness-probe');
const fetch = require('node-fetch');

// Configuration
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const DASHBOARD_URL = 'https://tbwa-analytics-dashboard.azurewebsites.net';

/**
 * Send alert to Microsoft Teams channel
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {string} color - Card color (red, yellow, green)
 * @returns {Promise<void>}
 */
async function sendTeamsAlert(title, message, color = 'red') {
  if (!TEAMS_WEBHOOK_URL) {
    console.log('Teams webhook URL not configured, skipping alert');
    return;
  }
  
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": color === 'red' ? 'FF0000' : color === 'yellow' ? 'FFC107' : '4CAF50',
    "summary": title,
    "sections": [{
      "activityTitle": title,
      "activitySubtitle": new Date().toISOString(),
      "text": message
    }],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Dashboard",
        "targets": [
          { "os": "default", "uri": DASHBOARD_URL }
        ]
      }
    ]
  };
  
  try {
    await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    });
    
    console.log('Teams alert sent successfully');
  } catch (error) {
    console.error(`Failed to send Teams alert: ${error.message}`);
  }
}

/**
 * Run all scheduled tests
 */
async function runScheduledTests() {
  try {
    console.log('Starting scheduled dashboard tests');
    console.log('-------------------------------------');
    
    // Verify data freshness
    const freshnessResults = await verifyDataFreshness();
    
    if (!freshnessResults.freshness.isFresh) {
      // Send alert for stale data
      await sendTeamsAlert(
        '⚠️ Dashboard Data is Stale',
        `The ETL pipeline may have stalled. Gold layer data is ${freshnessResults.freshness.ageInMinutes} minutes old.\n\nPlease check the ETL pipeline status.`,
        'yellow'
      );
    } else {
      console.log('Data freshness check passed');
    }
    
    console.log('-------------------------------------');
    console.log('All scheduled tests completed');
  } catch (error) {
    console.error(`Scheduled tests failed: ${error.message}`);
    
    // Send critical alert
    await sendTeamsAlert(
      '🚨 Dashboard Tests Failed',
      `Error: ${error.message}\n\nThe dashboard may be unavailable or experiencing issues. Please investigate immediately.`,
      'red'
    );
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runScheduledTests();
}

module.exports = {
  runScheduledTests,
  sendTeamsAlert
};