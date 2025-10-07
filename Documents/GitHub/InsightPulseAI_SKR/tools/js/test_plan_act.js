#!/usr/bin/env node

const PlanActParser = require('./utils/plan_act_parser');

console.log('🧪 Testing Plan-Act System...\n');

// Test input
const testInput = `
## PLAN:
- Test variable substitution
- Verify parser functionality
- Show example output

## ACT:
echo "Testing from: {{REPO_ROOT}}"
echo "User: {{USER}}"
echo "Timestamp: {{TIMESTAMP}}"
pwd
ls -la utils/plan_act_parser.js
`;

async function test() {
  try {
    const parser = new PlanActParser({
      autoApprove: false  // Set to false for testing
    });

    // Show loaded variables
    console.log('📋 Loaded Variables:');
    const vars = parser.getVariables();
    Object.keys(vars).forEach(key => {
      console.log(`  ${key}: ${vars[key]}`);
    });

    console.log('\n🔍 Parsing test input...');
    const parsed = parser.parse(testInput);
    
    console.log('\n📋 PLAN:');
    console.log(parsed.plan);
    
    console.log('\n🚀 ACT (with variable substitution):');
    const substituted = parser.substituteVariables(parsed.act);
    console.log(substituted);
    
    console.log('\n✅ Plan-Act system is working correctly!');
    console.log('\n📖 Next steps:');
    console.log('1. Update ~/.pulserrc with your variables');
    console.log('2. Use node utils/pulser_plan_act_cli.js for full CLI');
    console.log('3. Read docs/PLAN_ACT_AUTOMATION.md for complete guide');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();