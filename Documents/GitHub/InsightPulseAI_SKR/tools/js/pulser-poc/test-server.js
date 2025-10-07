// Quick test script to verify server works before Replit deployment
const { exec } = require('child_process');
const http = require('http');

console.log('🧪 Testing production server setup...\n');

// Start the server
const server = exec('node server.js');

server.stdout.on('data', (data) => {
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Wait for server to start then test endpoints
setTimeout(() => {
  console.log('\n📡 Testing API endpoints...\n');
  
  // Test health endpoint
  http.get('http://localhost:3000/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Health Check:', res.statusCode === 200 ? 'PASSED' : 'FAILED');
      if (res.statusCode === 200) {
        const json = JSON.parse(data);
        console.log('   Status:', json.status);
        console.log('   Records:', json.data.recordCount);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Health Check FAILED:', err.message);
  });

  // Test lightweight KPIs endpoint
  http.get('http://localhost:3000/api/brands-lightweight?type=kpis', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ KPIs Endpoint:', res.statusCode === 200 ? 'PASSED' : 'FAILED');
      if (res.statusCode === 200) {
        const json = JSON.parse(data);
        console.log('   Total Revenue: ₱' + json.totalRevenue.toLocaleString());
      }
    });
  }).on('error', (err) => {
    console.error('❌ KPIs Endpoint FAILED:', err.message);
  });

  // Cleanup after tests
  setTimeout(() => {
    console.log('\n🛑 Stopping test server...');
    server.kill();
    process.exit(0);
  }, 3000);
}, 2000);