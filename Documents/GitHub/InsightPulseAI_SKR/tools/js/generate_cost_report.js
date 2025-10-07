#!/usr/bin/env node

/**
 * Cost Analysis Report Generator
 * Run this to get comprehensive cost projections and optimization recommendations
 */

const { generateCostAnalysisReport } = require('./azure_cost_projections');

function formatCurrency(amount) {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateReport() {
    const report = generateCostAnalysisReport();
    
    console.log('\n🔵 AZURE COST ANALYSIS & OPTIMIZATION REPORT');
    console.log('=' .repeat(60));
    console.log(`Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Asia/Manila)`);
    
    // Current Azure Projections
    console.log('\n📊 CURRENT AZURE PROJECTIONS');
    console.log('-'.repeat(40));
    console.log(`Current Daily Rate: ${formatCurrency(report.azureProjection.daily.currentRate)}`);
    console.log(`Projected Daily Rate: ${formatCurrency(report.azureProjection.daily.projectedRate)}`);
    console.log(`Current Monthly Projection: ${formatCurrency(report.azureProjection.monthly.currentMonthlyProjection)}`);
    console.log(`Optimized Monthly Projection: ${formatCurrency(report.azureProjection.monthly.optimizedMonthlyProjection)}`);
    console.log(`Annual Savings (post-optimization): ${formatCurrency(report.azureProjection.monthly.annualSavings)}`);
    
    // AWS Comparison
    console.log('\n🟠 AWS EQUIVALENT COSTS');
    console.log('-'.repeat(40));
    console.log(`Azure Daily Cost: ${formatCurrency(report.awsComparison.azureDailyCost)}`);
    console.log(`AWS Daily Cost: ${formatCurrency(report.awsComparison.awsDailyCost)}`);
    console.log(`Daily Savings: ${formatCurrency(report.awsComparison.dailySavings)}`);
    console.log(`Monthly Savings: ${formatCurrency(report.awsComparison.monthlySavings)}`);
    console.log(`Annual Savings: ${formatCurrency(report.awsComparison.annualSavings)}`);
    
    // Google Cloud Comparison
    console.log('\n🔴 GOOGLE CLOUD EQUIVALENT COSTS');
    console.log('-'.repeat(40));
    console.log(`Azure Daily Cost: ${formatCurrency(report.gcpComparison.azureDailyCost)}`);
    console.log(`GCP Daily Cost: ${formatCurrency(report.gcpComparison.gcpDailyCost)}`);
    console.log(`Daily Savings: ${formatCurrency(report.gcpComparison.dailySavings)}`);
    console.log(`Monthly Savings: ${formatCurrency(report.gcpComparison.monthlySavings)}`);
    console.log(`Annual Savings: ${formatCurrency(report.gcpComparison.annualSavings)}`);
    
    // Open Source Analysis
    console.log('\n🟢 OPEN SOURCE SUBSTITUTION ANALYSIS');
    console.log('-'.repeat(40));
    
    report.openSourceAnalysis.forEach(analysis => {
        if (analysis.message) {
            console.log(`❌ ${analysis.message}`);
            return;
        }
        
        console.log(`\n📦 ${analysis.azureService} → ${analysis.openSourceAlternative}`);
        console.log(`   Current Monthly Cost: ${formatCurrency(analysis.currentMonthlyCost)}`);
        console.log(`   Potential Monthly Savings: ${formatCurrency(analysis.potentialMonthlySavings)}`);
        console.log(`   Implementation Cost: ${formatCurrency(analysis.implementationCost)}`);
        console.log(`   Monthly Maintenance: ${formatCurrency(analysis.monthlyMaintenanceCost)}`);
        console.log(`   Net Monthly Savings: ${formatCurrency(analysis.netMonthlySavings)}`);
        console.log(`   Break-even: ${analysis.breakEvenMonths} months`);
        console.log(`   Recommendation Score: ${analysis.recommendationScore}/100`);
        console.log(`   Recommended: ${analysis.recommended ? '✅ Yes' : '❌ No'}`);
    });
    
    // Summary
    console.log('\n💰 COST OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Current Azure Monthly Spend: ${formatCurrency(report.summary.currentMonthlySpend)}`);
    console.log(`\nPotential Monthly Savings:`);
    console.log(`  📈 AWS Migration: ${formatCurrency(report.summary.awsMonthlySavings)} (15% average)`);
    console.log(`  📈 GCP Migration: ${formatCurrency(report.summary.gcpMonthlySavings)} (22% average)`);
    console.log(`  📈 Open Source Substitution: ${formatCurrency(report.summary.totalOpenSourceSavings)}`);
    
    // Recommendations
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    const awsSavings = parseFloat(report.summary.awsMonthlySavings);
    const gcpSavings = parseFloat(report.summary.gcpMonthlySavings);
    const ossSavings = parseFloat(report.summary.totalOpenSourceSavings);
    
    if (gcpSavings > awsSavings && gcpSavings > ossSavings) {
        console.log('🥇 PRIMARY: Consider Google Cloud migration for maximum savings');
        console.log('🥈 SECONDARY: Implement selective open-source substitutions');
        console.log('🥉 TERTIARY: Azure optimization with current tools');
    } else if (ossSavings > gcpSavings && ossSavings > awsSavings) {
        console.log('🥇 PRIMARY: Implement open-source substitutions within Azure');
        console.log('🥈 SECONDARY: Consider hybrid approach with GCP for specific workloads');
        console.log('🥉 TERTIARY: Full cloud migration as long-term strategy');
    } else {
        console.log('🥇 PRIMARY: AWS migration for balance of savings and ease');
        console.log('🥈 SECONDARY: Selective open-source substitutions');
        console.log('🥉 TERTIARY: Continue Azure optimization efforts');
    }
    
    console.log('\n📋 IMMEDIATE ACTION ITEMS');
    console.log('-'.repeat(40));
    console.log('1. Wait for Azure cost refresh (May 23-24) to validate optimization impact');
    console.log('2. Pilot open-source substitution for Databricks (highest ROI)');
    console.log('3. Conduct detailed AWS/GCP migration feasibility study');
    console.log('4. Implement hybrid cloud strategy for non-critical workloads');
    console.log('5. Review licensing costs quarterly for optimization opportunities');
    
    console.log('\n⚠️  IMPORTANT NOTES');
    console.log('-'.repeat(40));
    console.log('• Migration costs not included in projections');
    console.log('• Open-source solutions require dedicated DevOps expertise');
    console.log('• Compliance requirements may limit substitution options');
    console.log('• Volume discounts may apply for enterprise contracts');
    console.log('• Regional pricing variations not considered');
    
    return report;
}

// Run the report if called directly
if (require.main === module) {
    try {
        const report = generateReport();
        
        // Also save to file
        const fs = require('fs');
        const outputPath = `./output/cost_analysis_report_${new Date().toISOString().slice(0, 10)}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error generating report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateReport };