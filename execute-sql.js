const https = require('https');
const fs = require('fs');

// Configuration
const PROJECT_REF = 'cxzllzyxwpyptfretryc';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

// Read SQL file
const sql = fs.readFileSync('setup-database.sql', 'utf8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📊 Executing ${statements.length} SQL statements...`);

// Execute each statement
async function executeSql(statement) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: statement });
    
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Execute all statements
async function setup() {
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    process.stdout.write(`[${i + 1}/${statements.length}] `);
    
    try {
      await executeSql(statement);
      console.log(`✅ ${statement.substring(0, 50)}...`);
      successCount++;
    } catch (error) {
      console.log(`❌ ${statement.substring(0, 50)}... - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} errors`);
  
  if (successCount > 0) {
    console.log('✅ Database setup partially complete!');
  }
}

// Run
setup().catch(console.error);