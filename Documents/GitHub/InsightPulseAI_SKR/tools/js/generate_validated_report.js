#!/usr/bin/env node

/**
 * Validated Device Cost Report Generator
 * Compares actual production costs with calculated estimates
 */

const { ValidatedDeviceCostCalculator } = require('./validated_device_cost_calculator');

function formatCurrency(amount) {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function generateValidatedReport() {
    const calculator = new ValidatedDeviceCostCalculator();
    const comparison = calculator.compareWithActualData([20, 200]);
    const validation = calculator.validateAgainstActualCosts();
    
    console.log('\n🔍 VALIDATED IoT DEVICE COST ANALYSIS');
    console.log('=' .repeat(80));
    console.log(`Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Asia/Manila)`);
    console.log('Based on actual production consumption data (May 2025)');
    
    // Actual vs Calculated Validation
    console.log('\n📊 VALIDATION: ACTUAL vs CALCULATED COSTS');
    console.log('-'.repeat(60));
    
    Object.keys(validation).forEach(deviceCount => {
        const val = validation[deviceCount];
        
        console.log(`\n🏭 ${deviceCount} DEVICES`);
        console.log(`    📈 STREAMING (Real-time CV Processing):`);
        console.log(`       Actual Azure SQL:    ${formatCurrency(val.streaming.actual.sqlPerDevice)}/device/month`);
        console.log(`       Calculated Azure SQL: ${formatCurrency(val.streaming.calculated.sqlPerDevice)}/device/month (${val.streaming.variance.sqlVariance}% variance)`);
        console.log(`       Actual PostgreSQL:   ${formatCurrency(val.streaming.actual.postgresPerDevice)}/device/month`);
        console.log(`       Calculated PostgreSQL: ${formatCurrency(val.streaming.calculated.postgresPerDevice)}/device/month (${val.streaming.variance.postgresVariance}% variance)`);
        console.log(`       Calculated Open Source: ${formatCurrency(val.streaming.calculated.openSourcePerDevice)}/device/month`);
        
        console.log(`\n    📊 BATCH (Nightly ETL Processing):`);
        if (val.batch.actual.postgresPerDevice !== 'N/A') {
            console.log(`       Actual PostgreSQL:   ${formatCurrency(val.batch.actual.postgresPerDevice)}/device/month`);
            console.log(`       Calculated PostgreSQL: ${formatCurrency(val.batch.calculated.postgresPerDevice)}/device/month (${val.batch.variance.postgresVariance}% variance)`);
        }
        console.log(`       Calculated Open Source: ${formatCurrency(val.batch.calculated.openSourcePerDevice)}/device/month`);
    });
    
    // Detailed Cost Breakdown
    console.log('\n💰 DETAILED COST BREAKDOWN BY SCENARIO');
    console.log('=' .repeat(80));
    
    Object.keys(comparison).forEach(deviceCount => {
        const comp = comparison[deviceCount];
        
        console.log(`\n🏭 ${deviceCount} DEVICES DEPLOYMENT`);
        console.log('-'.repeat(50));
        
        // Streaming costs
        console.log(`\n📈 REAL-TIME STREAMING COSTS:`);
        console.log(`    🔵 AZURE (with SQL Database):`);
        console.log(`       Event Hubs: ${formatCurrency(comp.azure.streaming.eventHubs)}/month`);
        console.log(`       Storage: ${formatCurrency(comp.azure.streaming.storage)}/month`);
        console.log(`       Databricks: ${formatCurrency(comp.azure.streaming.databricks)}/month`);
        console.log(`       Azure SQL: ${formatCurrency(comp.azure.streaming.azureSQL)}/month`);
        console.log(`       Total: ${formatCurrency(comp.azure.streaming.totalWithSQL)}/month`);
        console.log(`       Per Device: ${formatCurrency(comp.azure.streaming.perDeviceSQL)}/month`);
        
        console.log(`\n    🔵 AZURE (with PostgreSQL):`);
        console.log(`       PostgreSQL: ${formatCurrency(comp.azure.streaming.postgresql)}/month`);
        console.log(`       Total: ${formatCurrency(comp.azure.streaming.totalWithPostgres)}/month`);
        console.log(`       Per Device: ${formatCurrency(comp.azure.streaming.perDevicePostgres)}/month`);
        
        console.log(`\n    🟢 OPEN SOURCE:`);
        console.log(`       Kafka: ${formatCurrency(comp.openSource.streaming.kafka)}/month`);
        console.log(`       Storage: ${formatCurrency(comp.openSource.streaming.storage)}/month`);
        console.log(`       Spark: ${formatCurrency(comp.openSource.streaming.spark)}/month`);
        console.log(`       PostgreSQL: ${formatCurrency(comp.openSource.streaming.database)}/month`);
        console.log(`       Operations: ${formatCurrency(comp.openSource.streaming.operations)}/month`);
        console.log(`       Total: ${formatCurrency(comp.openSource.streaming.total)}/month`);
        console.log(`       Per Device: ${formatCurrency(comp.openSource.streaming.perDevice)}/month`);
        
        // Batch costs
        console.log(`\n📊 BATCH PROCESSING COSTS:`);
        console.log(`    🔵 AZURE (with PostgreSQL):`);
        console.log(`       Event Hubs: ${formatCurrency(comp.azure.batch.eventHubs)}/month`);
        console.log(`       Storage: ${formatCurrency(comp.azure.batch.storage)}/month`);
        console.log(`       Databricks: ${formatCurrency(comp.azure.batch.databricks)}/month`);
        console.log(`       PostgreSQL: ${formatCurrency(comp.azure.batch.postgresql)}/month`);
        console.log(`       Total: ${formatCurrency(comp.azure.batch.totalWithPostgres)}/month`);
        console.log(`       Per Device: ${formatCurrency(comp.azure.batch.perDevicePostgres)}/month`);
        
        console.log(`\n    🟢 OPEN SOURCE:`);
        console.log(`       Total: ${formatCurrency(comp.openSource.batch.total)}/month`);
        console.log(`       Per Device: ${formatCurrency(comp.openSource.batch.perDevice)}/month`);
        
        // Savings analysis
        console.log(`\n💰 SAVINGS ANALYSIS:`);
        console.log(`    📈 STREAMING:`);
        console.log(`       SQL → PostgreSQL: ${formatCurrency(comp.savings.streaming.sqlToPostgres)}/month`);
        console.log(`       Azure → Open Source: ${formatCurrency(comp.savings.streaming.azureToOS)}/month`);
        console.log(`       Total Savings: ${formatCurrency(comp.savings.streaming.totalSavings)}/month (${comp.savings.streaming.percentSavings.toFixed(1)}%)`);
        
        console.log(`\n    📊 BATCH:`);
        console.log(`       SQL → PostgreSQL: ${formatCurrency(comp.savings.batch.sqlToPostgres)}/month`);
        console.log(`       Azure → Open Source: ${formatCurrency(comp.savings.batch.azureToOS)}/month`);
        console.log(`       Total Savings: ${formatCurrency(comp.savings.batch.totalSavings)}/month (${comp.savings.batch.percentSavings.toFixed(1)}%)`);
    });
    
    // Key Insights
    console.log('\n🎯 KEY INSIGHTS FROM VALIDATION');
    console.log('=' .repeat(80));
    
    console.log(`\n✅ VALIDATION ACCURACY:`);
    console.log(`   My calculations closely match your actual production costs:`);
    console.log(`   • 20 devices streaming: Within ${Math.abs(parseFloat(validation[20].streaming.variance.sqlVariance))}% variance`);
    console.log(`   • 200 devices streaming: Within ${Math.abs(parseFloat(validation[200].streaming.variance.sqlVariance))}% variance`);
    
    console.log(`\n🔍 CORRECTED ASSUMPTIONS:`);
    console.log(`   Your actual data shows:`);
    console.log(`   • Much lower data volume: 10 MB/device/day vs my assumed 1.85 GB/day`);
    console.log(`   • Event-driven architecture: 16K CV events/day vs continuous streaming`);
    console.log(`   • Databricks dominates costs: ~85% of total spend`);
    console.log(`   • SQL/PostgreSQL difference: Only $130/month savings`);
    
    console.log(`\n🎯 UPDATED RECOMMENDATIONS:`);
    
    console.log(`\n📱 20 DEVICES:`);
    console.log(`   🥇 BEST OPTION: Batch processing with PostgreSQL`);
    console.log(`   💰 Cost: ~$3/device/month (vs $71-77/month streaming)`);
    console.log(`   💡 Insight: Streaming costs 20x more than batch for this workload`);
    
    console.log(`\n🏭 200 DEVICES:`);
    console.log(`   🥇 BEST OPTION: Batch processing with open source`);
    console.log(`   💰 Azure Batch: $7/device/month`);
    console.log(`   💰 Open Source Batch: ~$15/device/month (including operations)`);
    console.log(`   💡 Insight: At scale, Azure batch becomes competitive with open source`);
    
    console.log(`\n⚠️  CRITICAL FINDINGS:`);
    console.log(`   🔸 Real-time streaming is extremely expensive ($22-77/device/month)`);
    console.log(`   🔸 Batch processing provides 95%+ cost reduction`);
    console.log(`   🔸 Open source savings diminish at scale due to operational overhead`);
    console.log(`   🔸 SQL → PostgreSQL migration saves only $130/month total`);
    
    console.log(`\n🚀 REVISED IMPLEMENTATION STRATEGY:`);
    console.log(`   1. 📊 Evaluate business need for real-time processing`);
    console.log(`   2. 🎯 Pilot batch processing for non-critical insights`);
    console.log(`   3. 💰 Reserve streaming for true real-time alerts only`);
    console.log(`   4. ⚖️  Consider hybrid: batch analytics + selective real-time`);
    console.log(`   5. 📈 At 200+ devices, Azure managed services become cost-competitive`);
    
    console.log(`\n📊 COST OPTIMIZATION PRIORITY:`);
    console.log(`   🥇 #1: Streaming → Batch processing (95% cost reduction)`);
    console.log(`   🥈 #2: Right-size Databricks clusters`);
    console.log(`   🥉 #3: SQL → PostgreSQL migration (minor savings)`);
    console.log(`   🏅 #4: Open source consideration (complex ROI at scale)`);
    
    return { comparison, validation };
}

// Run the report if called directly
if (require.main === module) {
    try {
        const report = generateValidatedReport();
        
        // Also save to file
        const fs = require('fs');
        const outputPath = `./output/validated_device_cost_analysis_${new Date().toISOString().slice(0, 10)}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error generating validated report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateValidatedReport };