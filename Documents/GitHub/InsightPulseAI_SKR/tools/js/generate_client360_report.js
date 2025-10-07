#!/usr/bin/env node

/**
 * Client360/Scout Specific Cost Optimization Report Generator
 */

const { Client360CostOptimizer } = require('./client360_cost_optimization_plan');

function formatCurrency(amount) {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function generateClient360Report() {
    const optimizer = new Client360CostOptimizer();
    const report = optimizer.generateFullReport();
    
    console.log('\n🎯 CLIENT360/SCOUT AZURE COST OPTIMIZATION REPORT');
    console.log('=' .repeat(65));
    console.log(`Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Asia/Manila)`);
    
    // Executive Summary
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('-'.repeat(45));
    console.log(`Current Monthly Azure Cost: ${formatCurrency(report.summary.currentMonthlyCost)}`);
    console.log(`Open Source Alternative Cost: ${formatCurrency(report.summary.openSourceMonthlyCost)}`);
    console.log(`Monthly Savings Potential: ${formatCurrency(report.summary.monthlySavings)}`);
    console.log(`Annual Savings Potential: ${formatCurrency(report.summary.annualSavings)}`);
    console.log(`Cost Reduction: ${report.summary.costReduction}`);
    
    // Current Infrastructure Analysis
    console.log('\n🏗️  CURRENT INFRASTRUCTURE BREAKDOWN');
    console.log('-'.repeat(45));
    
    report.serviceDetails.forEach(service => {
        const current = service.current;
        const alt = service.alternative;
        
        if (!current || !alt) return;
        
        console.log(`\n📦 ${current.service}`);
        console.log(`   Current Cost: ${formatCurrency(current.currentCost)}/month`);
        console.log(`   Usage: ${current.usage}`);
        console.log(`   Criticality: ${current.criticality.toUpperCase()}`);
        console.log(`   Alternative: ${alt.alternative}`);
        console.log(`   Potential Savings: ${formatCurrency(alt.savings)}/month (${Math.round((alt.savings/current.currentCost)*100)}%)`);
        console.log(`   Implementation: ${alt.complexity} complexity, ${alt.timeline}`);
    });
    
    // Migration Plan
    console.log('\n🗺️  PHASED MIGRATION PLAN');
    console.log('-'.repeat(45));
    
    Object.keys(report.migrationPlan).forEach(phaseKey => {
        const phase = report.migrationPlan[phaseKey];
        console.log(`\n${phaseKey.toUpperCase()}: ${phase.name}`);
        console.log(`   Effort Level: ${phase.effort}`);
        console.log(`   Risk Level: ${phase.risk}`);
        console.log(`   Monthly Savings: ${formatCurrency(phase.totalSavings)}`);
        console.log(`   Services: ${phase.services.join(', ')}`);
    });
    
    // Detailed Implementation Examples
    console.log('\n🔧 DETAILED IMPLEMENTATION EXAMPLES');
    console.log('-'.repeat(45));
    
    // Show implementation for top 3 priority services
    const priorityServices = ['staticWebApps', 'sqlDatabases', 'databricks'];
    
    priorityServices.forEach(serviceName => {
        const guide = optimizer.generateImplementationGuide(serviceName);
        if (guide.error) return;
        
        console.log(`\n🎯 ${guide.currentService.service} → ${guide.alternative.alternative}`);
        console.log(`   Monthly Savings: ${formatCurrency(guide.roi.monthlySavings)}`);
        console.log(`   Implementation Cost: ${formatCurrency(guide.roi.implementationCost)}`);
        console.log(`   Break-even: ${guide.roi.breakEvenMonths} months`);
        console.log(`   Timeline: ${guide.implementation.timeline}`);
        
        console.log(`   Key Steps:`);
        guide.implementation.steps.slice(0, 5).forEach((step, index) => {
            console.log(`     ${step}`);
        });
        if (guide.implementation.steps.length > 5) {
            console.log(`     ... and ${guide.implementation.steps.length - 5} more steps`);
        }
    });
    
    // Recommendations
    console.log('\n🎯 STRATEGIC RECOMMENDATIONS');
    console.log('-'.repeat(45));
    
    report.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'HIGH' ? '🔥' : rec.priority === 'MEDIUM' ? '⚡' : '💡';
        console.log(`\n${priority} ${rec.priority}: ${rec.action}`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   Timeline: ${rec.timeline}`);
        console.log(`   Impact: ${rec.impact}`);
    });
    
    // Risk Assessment
    console.log('\n⚠️  RISK ASSESSMENT & MITIGATION');
    console.log('-'.repeat(45));
    console.log(`\n🔴 HIGH RISK SERVICES:`);
    console.log(`   • Databricks (Core ETL processing)`);
    console.log(`   • SQL Databases (Critical data storage)`);
    console.log(`   • Event Hubs (Real-time IoT data)`);
    console.log(`   
   Mitigation Strategy:`);
    console.log(`   - Maintain parallel systems during migration`);
    console.log(`   - Extensive testing with production data`);
    console.log(`   - 24/7 monitoring during cutover`);
    console.log(`   - Immediate rollback procedures ready`);
    
    console.log(`\n🟡 MEDIUM RISK SERVICES:`);
    console.log(`   • Storage Accounts (Data lake infrastructure)`);
    console.log(`   • Azure OpenAI (AI insights generation)`);
    console.log(`   • IoT Hub (Pi5 device management)`);
    console.log(`   
   Mitigation Strategy:`);
    console.log(`   - Pilot with non-production workloads first`);
    console.log(`   - Gradual migration with data validation`);
    console.log(`   - Performance monitoring and optimization`);
    
    console.log(`\n🟢 LOW RISK SERVICES:`);
    console.log(`   • Static Web Apps (Dashboard hosting)`);
    console.log(`   • App Service (Application hosting)`);
    console.log(`   
   Mitigation Strategy:`);
    console.log(`   - Standard deployment practices`);
    console.log(`   - DNS failover capability`);
    console.log(`   - Quick rollback via configuration`);
    
    // Implementation Timeline
    console.log('\n📅 RECOMMENDED IMPLEMENTATION TIMELINE');
    console.log('-'.repeat(45));
    console.log(`
Month 1-2:  🟢 Phase 1 - Quick Wins
            • Migrate Static Web Apps to self-hosted
            • Move App Service to containerized hosting
            • Expected savings: ${formatCurrency(280)}/month

Month 2-4:  🟡 Phase 2 - Foundation Services  
            • Implement MinIO for object storage
            • Set up Mosquitto + InfluxDB for IoT
            • Deploy HashiCorp Vault
            • Expected savings: ${formatCurrency(330)}/month

Month 4-8:  🔴 Phase 3 - Core Infrastructure
            • Migrate SQL databases to PostgreSQL
            • Implement Kafka for event streaming
            • Deploy self-hosted AI services
            • Expected savings: ${formatCurrency(1170)}/month

Month 8-12: 🔥 Phase 4 - Advanced Analytics
            • Replace Databricks with Spark + PostgreSQL
            • Complete data warehouse migration
            • Final optimization and monitoring
            • Expected savings: ${formatCurrency(1600)}/month

TOTAL ANNUAL SAVINGS: ${formatCurrency(report.summary.annualSavings)}
IMPLEMENTATION INVESTMENT: ~${formatCurrency(151000)} over 12 months`);
    
    // Next Steps
    console.log('\n🚀 IMMEDIATE NEXT STEPS');
    console.log('-'.repeat(45));
    console.log(`1. 📋 Team Assessment:`);
    console.log(`   - Evaluate current DevOps capabilities`);
    console.log(`   - Identify skill gaps and training needs`);
    console.log(`   - Consider hiring specialized talent`);
    
    console.log(`\n2. 💰 Budget Approval:`);
    console.log(`   - Phase 1 pilot budget: ${formatCurrency(8000)}`);
    console.log(`   - Annual implementation budget: ${formatCurrency(151000)}`);
    console.log(`   - ROI timeline: 12-18 months`);
    
    console.log(`\n3. 🎯 Pilot Selection:`);
    console.log(`   - Start with Static Web App migration`);
    console.log(`   - Choose non-critical database for PostgreSQL pilot`);
    console.log(`   - Set success criteria and rollback triggers`);
    
    console.log(`\n4. 📊 Monitoring Setup:`);
    console.log(`   - Establish baseline performance metrics`);
    console.log(`   - Set up cost tracking dashboard`);
    console.log(`   - Create automated alerting for issues`);
    
    return report;
}

// Run the report if called directly
if (require.main === module) {
    try {
        const report = generateClient360Report();
        
        // Also save to file
        const fs = require('fs');
        const outputPath = `./output/client360_cost_optimization_${new Date().toISOString().slice(0, 10)}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error generating Client360 report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateClient360Report };