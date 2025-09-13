#!/usr/bin/env node

/**
 * IoT Device Cost Report Generator
 * Generates comprehensive per-device cost analysis for 20 and 200 devices
 */

const { IoTDeviceCostCalculator } = require('./iot_device_cost_calculator');

function formatCurrency(amount) {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatData(gb) {
    return `${parseFloat(gb).toFixed(2)} GB`;
}

function generateDeviceCostReport() {
    const calculator = new IoTDeviceCostCalculator();
    const report = calculator.generateDeviceCostReport([20, 200], ['batch', 'streaming', 'hybrid']);
    
    console.log('\n📱 IoT DEVICE COST ANALYSIS - CLIENT360/SCOUT');
    console.log('=' .repeat(70));
    console.log(`Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Asia/Manila)`);
    
    // Device Profile Summary
    console.log('\n🔧 DEVICE PROFILE (Raspberry Pi 5)');
    console.log('-'.repeat(50));
    console.log(`Hardware: ${report.deviceProfile.hardware.cpu}, ${report.deviceProfile.hardware.ram}`);
    console.log(`Connectivity: ${report.deviceProfile.hardware.connectivity}`);
    console.log(`Sensors: ${report.deviceProfile.hardware.sensors.join(', ')}`);
    
    // Daily Data Generation
    console.log('\n📊 DAILY DATA GENERATION PER DEVICE');
    console.log('-'.repeat(50));
    const dailyData = report.dailyDataPerDevice;
    console.log(`Sensor Data: ${formatData(dailyData.sensorData / 1024)} (${report.deviceProfile.dataGeneration.sensorReadings.toLocaleString()} readings/day)`);
    console.log(`Image Data: ${formatData(dailyData.imageData / 1024)} (${report.deviceProfile.dataGeneration.imageCaptures} captures/day)`);
    console.log(`Audio Data: ${formatData(dailyData.audioData / 1024)} (${report.deviceProfile.dataGeneration.audioSamples} samples/day)`);
    console.log(`Transaction Data: ${formatData(dailyData.transactionData / 1024)} (${report.deviceProfile.dataGeneration.transactionEvents} events/day)`);
    console.log(`Interaction Data: ${formatData(dailyData.interactionData / 1024)} (${report.deviceProfile.dataGeneration.customerInteractions} interactions/day)`);
    console.log(`📈 Total Daily Data: ${formatData(dailyData.totalGB)}`);
    console.log(`📈 Total Monthly Data: ${formatData(dailyData.totalGB * 30)}`);
    
    // Cost Analysis by Scenario
    console.log('\n💰 COST ANALYSIS BY SCENARIO');
    console.log('=' .repeat(70));
    
    // Group scenarios by device count
    const deviceGroups = {};
    report.scenarios.forEach(scenario => {
        if (!deviceGroups[scenario.deviceCount]) {
            deviceGroups[scenario.deviceCount] = [];
        }
        deviceGroups[scenario.deviceCount].push(scenario);
    });
    
    Object.keys(deviceGroups).forEach(deviceCount => {
        console.log(`\n🏭 ${deviceCount} DEVICES DEPLOYMENT`);
        console.log('-'.repeat(50));
        
        deviceGroups[deviceCount].forEach(scenario => {
            console.log(`\n📋 ${scenario.processingType.toUpperCase()} PROCESSING`);
            console.log(`    ${scenario.pattern.description}`);
            console.log(`    Latency: ${scenario.pattern.latency}`);
            
            console.log(`\n    🔵 AZURE COSTS:`);
            console.log(`       Per Device: ${formatCurrency(scenario.azure.perDevice)}/month`);
            console.log(`       Total: ${formatCurrency(scenario.azure.total)}/month`);
            console.log(`       Annual: ${formatCurrency(scenario.azure.total * 12)}`);
            
            console.log(`\n    🟢 OPEN SOURCE COSTS:`);
            console.log(`       Per Device: ${formatCurrency(scenario.openSource.perDevice)}/month`);
            console.log(`       Total: ${formatCurrency(scenario.openSource.total)}/month`);
            console.log(`       Annual: ${formatCurrency(scenario.openSource.total * 12)}`);
            
            console.log(`\n    💰 SAVINGS:`);
            console.log(`       Per Device: ${formatCurrency(scenario.savings.perDevice)}/month`);
            console.log(`       Total: ${formatCurrency(scenario.savings.total)}/month`);
            console.log(`       Annual: ${formatCurrency(scenario.savings.total * 12)}`);
            console.log(`       Percentage: ${scenario.savings.percentage.toFixed(1)}%`);
        });
    });
    
    // TCO Analysis
    console.log('\n💼 TOTAL COST OF OWNERSHIP (3-YEAR)');
    console.log('=' .repeat(70));
    
    [20, 200].forEach(deviceCount => {
        ['batch', 'streaming', 'hybrid'].forEach(processingType => {
            const tco = calculator.calculateTCO(deviceCount, 3, processingType);
            
            console.log(`\n🏭 ${deviceCount} DEVICES - ${processingType.toUpperCase()} PROCESSING`);
            console.log('-'.repeat(50));
            
            console.log(`🔵 AZURE 3-YEAR TCO:`);
            console.log(`   Setup & Training: ${formatCurrency(tco.azure.oneTime)}`);
            console.log(`   Monthly Operational: ${formatCurrency(tco.azure.monthly)}`);
            console.log(`   Annual Operational: ${formatCurrency(tco.azure.annual)}`);
            console.log(`   Total 3-Year Cost: ${formatCurrency(tco.azure.total)}`);
            
            console.log(`\n🟢 OPEN SOURCE 3-YEAR TCO:`);
            console.log(`   Setup & Training: ${formatCurrency(tco.openSource.oneTime)}`);
            console.log(`   Monthly Operational: ${formatCurrency(tco.openSource.monthly)}`);
            console.log(`   Annual Operational: ${formatCurrency(tco.openSource.annual)}`);
            console.log(`   Total 3-Year Cost: ${formatCurrency(tco.openSource.total)}`);
            
            console.log(`\n💰 3-YEAR SAVINGS:`);
            console.log(`   Total Savings: ${formatCurrency(tco.savings.total)}`);
            console.log(`   Percentage Savings: ${tco.savings.percentage.toFixed(1)}%`);
            console.log(`   Break-even: ${tco.savings.breakEvenMonths} months`);
        });
    });
    
    // Detailed Cost Breakdown for Key Scenarios
    console.log('\n🔍 DETAILED COST BREAKDOWN');
    console.log('=' .repeat(70));
    
    // Focus on 20 devices hybrid and 200 devices hybrid
    const keyScenarios = report.scenarios.filter(s => 
        s.processingType === 'hybrid' && [20, 200].includes(s.deviceCount)
    );
    
    keyScenarios.forEach(scenario => {
        console.log(`\n🎯 ${scenario.deviceCount} DEVICES - HYBRID PROCESSING`);
        console.log('-'.repeat(50));
        
        console.log(`🔵 AZURE BREAKDOWN:`);
        Object.entries(scenario.azure.breakdown).forEach(([service, cost]) => {
            console.log(`   ${service}: ${formatCurrency(cost)}/month`);
        });
        
        console.log(`\n🟢 OPEN SOURCE BREAKDOWN:`);
        Object.entries(scenario.openSource.breakdown).forEach(([component, cost]) => {
            console.log(`   ${component}: ${formatCurrency(cost)}/month`);
        });
        
        console.log(`\n📊 DATA USAGE:`);
        if (scenario.azure && scenario.azure.dataUsage) {
            console.log(`   Per Device: ${formatData(scenario.azure.dataUsage.monthlyGBPerDevice)}/month`);
            console.log(`   Total: ${formatData(scenario.azure.dataUsage.totalMonthlyGB)}/month`);
            console.log(`   Annual: ${formatData(scenario.azure.dataUsage.totalMonthlyGB * 12)}`);
        } else {
            console.log(`   Data usage information not available`);
        }
    });
    
    // Scaling Analysis
    console.log('\n📈 SCALING ANALYSIS');
    console.log('=' .repeat(70));
    
    const scalingPoints = [20, 50, 100, 200, 500, 1000];
    console.log(`\n📊 HYBRID PROCESSING COSTS BY SCALE:`);
    console.log('Devices | Azure/Month | Open Source/Month | Savings/Month | Savings %');
    console.log('-'.repeat(70));
    
    scalingPoints.forEach(deviceCount => {
        const costs = calculator.calculateProcessingCosts(deviceCount, 'hybrid');
        const azureCost = costs.azure.total;
        const openSourceCost = costs.openSource.total;
        const savings = costs.savings.total;
        const savingsPercent = costs.savings.percentage;
        
        console.log(`${deviceCount.toString().padEnd(7)} | ${formatCurrency(azureCost).padEnd(11)} | ${formatCurrency(openSourceCost).padEnd(17)} | ${formatCurrency(savings).padEnd(13)} | ${savingsPercent.toFixed(1)}%`);
    });
    
    // Recommendations
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('=' .repeat(70));
    
    console.log(`\n🏆 OPTIMAL CONFIGURATIONS:`);
    
    console.log(`\n📱 20 DEVICES (Small Deployment):`);
    console.log(`   🥇 RECOMMENDED: Hybrid Processing with Open Source`);
    console.log(`   💰 Cost: ${formatCurrency(calculator.calculateProcessingCosts(20, 'hybrid').openSource.perDevice)}/device/month`);
    console.log(`   💰 Total: ${formatCurrency(calculator.calculateProcessingCosts(20, 'hybrid').openSource.total)}/month`);
    console.log(`   💰 Annual Savings: ${formatCurrency(calculator.calculateProcessingCosts(20, 'hybrid').savings.total * 12)}`);
    console.log(`   ⚡ Benefits: Balanced latency, cost-effective, easier to manage`);
    
    console.log(`\n🏭 200 DEVICES (Large Deployment):`);
    console.log(`   🥇 RECOMMENDED: Batch Processing with Open Source`);
    console.log(`   💰 Cost: ${formatCurrency(calculator.calculateProcessingCosts(200, 'batch').openSource.perDevice)}/device/month`);
    console.log(`   💰 Total: ${formatCurrency(calculator.calculateProcessingCosts(200, 'batch').openSource.total)}/month`);
    console.log(`   💰 Annual Savings: ${formatCurrency(calculator.calculateProcessingCosts(200, 'batch').savings.total * 12)}`);
    console.log(`   ⚡ Benefits: Maximum cost efficiency, scales well, manageable complexity`);
    
    console.log(`\n⚠️  CONSIDERATIONS:`);
    console.log(`   🔸 Open source requires DevOps expertise`);
    console.log(`   🔸 Azure provides managed services with less operational overhead`);
    console.log(`   🔸 Hybrid approach balances cost and performance`);
    console.log(`   🔸 Batch processing significantly reduces costs for large deployments`);
    console.log(`   🔸 Consider data compliance requirements for each approach`);
    
    console.log(`\n🚀 IMPLEMENTATION STRATEGY:`);
    console.log(`   1. Start with 20-device pilot using hybrid processing`);
    console.log(`   2. Validate open source infrastructure and operations`);
    console.log(`   3. Scale to 200 devices with batch processing optimization`);
    console.log(`   4. Implement real-time streaming for critical alerts only`);
    console.log(`   5. Monitor costs and performance for continuous optimization`);
    
    return report;
}

// Run the report if called directly
if (require.main === module) {
    try {
        const report = generateDeviceCostReport();
        
        // Also save to file
        const fs = require('fs');
        const outputPath = `./output/device_cost_analysis_${new Date().toISOString().slice(0, 10)}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error generating device cost report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateDeviceCostReport };