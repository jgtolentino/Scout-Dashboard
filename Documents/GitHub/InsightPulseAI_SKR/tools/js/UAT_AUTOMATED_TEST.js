#!/usr/bin/env node

/**
 * Scout Dashboard - Automated UAT Testing Script
 * Cross-validates deployed dashboard against client requirements
 */

const fs = require('fs');
const path = require('path');

class ScoutDashboardUATValidator {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        this.deployPath = path.join(__dirname, 'deploy');
        this.apiEndpoint = 'https://scout-dashboard-poc-api-v2.azurewebsites.net/api';
    }

    log(level, message, test = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        console.log(logMessage);
        
        if (test) {
            this.testResults.tests.push({
                test,
                level,
                message,
                timestamp
            });
            
            switch(level.toLowerCase()) {
                case 'pass':
                    this.testResults.passed++;
                    break;
                case 'fail':
                    this.testResults.failed++;
                    break;
                case 'warn':
                    this.testResults.warnings++;
                    break;
            }
        }
    }

    async validateFileStructure() {
        this.log('info', '🔍 Validating file structure...');
        
        const requiredFiles = [
            'index.html',
            'js/dashboard_static_integration.js',
            'js/insights_visualizer.js',
            'js/static_data_connector.js',
            'data/metadata.json',
            'data/kpis.json',
            'data/brands.json',
            'staticwebapp.config.json'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.deployPath, file);
            if (fs.existsSync(filePath)) {
                this.log('pass', `✅ Required file exists: ${file}`, 'File Structure');
            } else {
                this.log('fail', `❌ Missing required file: ${file}`, 'File Structure');
            }
        }
    }

    async validateHTMLContent() {
        this.log('info', '📄 Validating HTML content...');
        
        const indexPath = path.join(this.deployPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            this.log('fail', 'index.html not found', 'HTML Content');
            return;
        }

        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        const requiredElements = [
            { pattern: /<title>.*Scout Dashboard.*<\/title>/i, name: 'Dashboard Title' },
            { pattern: /Transaction Trends/i, name: 'Transaction Trends Module' },
            { pattern: /Geographic Heatmap/i, name: 'Geographic Heatmap Module' },
            { pattern: /Product Mix/i, name: 'Product Mix Module' },
            { pattern: /Consumer Behavior/i, name: 'Consumer Behavior Module' },
            { pattern: /Customer Profiling/i, name: 'Customer Profiling Module' },
            { pattern: /Test API/i, name: 'API Testing Buttons' },
            { pattern: /https:\/\/scout-dashboard-poc-api-v2\.azurewebsites\.net/i, name: 'API Endpoint Reference' }
        ];

        for (const element of requiredElements) {
            if (element.pattern.test(htmlContent)) {
                this.log('pass', `✅ Found: ${element.name}`, 'HTML Content');
            } else {
                this.log('fail', `❌ Missing: ${element.name}`, 'HTML Content');
            }
        }
    }

    async validateJavaScriptModules() {
        this.log('info', '🔧 Validating JavaScript modules...');
        
        const jsFiles = [
            'js/dashboard_static_integration.js',
            'js/insights_visualizer.js',
            'js/static_data_connector.js'
        ];

        for (const jsFile of jsFiles) {
            const jsPath = path.join(this.deployPath, jsFile);
            if (fs.existsSync(jsPath)) {
                const jsContent = fs.readFileSync(jsPath, 'utf8');
                
                // Check for common functions and patterns
                const patterns = [
                    { pattern: /function.*load/i, name: 'Load Functions' },
                    { pattern: /fetch|XMLHttpRequest/i, name: 'API Calls' },
                    { pattern: /chart|visualization/i, name: 'Visualization Code' }
                ];

                let moduleValid = true;
                for (const pattern of patterns) {
                    if (pattern.pattern.test(jsContent)) {
                        this.log('pass', `✅ ${jsFile}: Contains ${pattern.name}`, 'JavaScript Modules');
                    } else {
                        this.log('warn', `⚠️ ${jsFile}: Missing ${pattern.name}`, 'JavaScript Modules');
                        moduleValid = false;
                    }
                }

                if (moduleValid) {
                    this.log('pass', `✅ Module validation passed: ${jsFile}`, 'JavaScript Modules');
                }
            } else {
                this.log('fail', `❌ JavaScript module missing: ${jsFile}`, 'JavaScript Modules');
            }
        }
    }

    async validateDataFiles() {
        this.log('info', '📊 Validating data files...');
        
        const dataFiles = [
            { file: 'data/metadata.json', requiredFields: ['version', 'lastUpdated'] },
            { file: 'data/kpis.json', requiredFields: ['totalTransactions', 'totalStores'] },
            { file: 'data/brands.json', requiredFields: [] }
        ];

        for (const dataFile of dataFiles) {
            const dataPath = path.join(this.deployPath, dataFile.file);
            if (fs.existsSync(dataPath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                    this.log('pass', `✅ Valid JSON: ${dataFile.file}`, 'Data Files');
                    
                    // Check required fields
                    for (const field of dataFile.requiredFields) {
                        if (data.hasOwnProperty(field)) {
                            this.log('pass', `✅ ${dataFile.file}: Has required field '${field}'`, 'Data Files');
                        } else {
                            this.log('warn', `⚠️ ${dataFile.file}: Missing field '${field}'`, 'Data Files');
                        }
                    }
                } catch (error) {
                    this.log('fail', `❌ Invalid JSON: ${dataFile.file} - ${error.message}`, 'Data Files');
                }
            } else {
                this.log('fail', `❌ Data file missing: ${dataFile.file}`, 'Data Files');
            }
        }
    }

    async validateConfiguration() {
        this.log('info', '⚙️ Validating configuration files...');
        
        const configPath = path.join(this.deployPath, 'staticwebapp.config.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                
                const requiredConfig = [
                    { path: 'routes', type: 'object', name: 'Routing Configuration' },
                    { path: 'navigationFallback', type: 'object', name: 'Navigation Fallback' },
                    { path: 'globalHeaders', type: 'object', name: 'Security Headers' }
                ];

                for (const requirement of requiredConfig) {
                    if (config.hasOwnProperty(requirement.path)) {
                        this.log('pass', `✅ Configuration has: ${requirement.name}`, 'Configuration');
                    } else {
                        this.log('warn', `⚠️ Configuration missing: ${requirement.name}`, 'Configuration');
                    }
                }
            } catch (error) {
                this.log('fail', `❌ Invalid configuration JSON: ${error.message}`, 'Configuration');
            }
        } else {
            this.log('fail', '❌ staticwebapp.config.json missing', 'Configuration');
        }
    }

    async validateClientRequirements() {
        this.log('info', '🎯 Validating against client requirements...');
        
        const indexPath = path.join(this.deployPath, 'index.html');
        if (!fs.existsSync(indexPath)) return;
        
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        const clientRequirements = [
            { pattern: /transaction.*trend/i, name: 'Transaction Trends Analysis', weight: 'critical' },
            { pattern: /geographic.*heatmap/i, name: 'Geographic Heatmap', weight: 'critical' },
            { pattern: /product.*mix/i, name: 'Product Mix & SKU Analysis', weight: 'critical' },
            { pattern: /consumer.*behavior/i, name: 'Consumer Behavior Analysis', weight: 'critical' },
            { pattern: /customer.*profiling/i, name: 'Customer Profiling', weight: 'critical' },
            { pattern: /toggle|filter/i, name: 'Interactive Controls', weight: 'important' },
            { pattern: /api.*test/i, name: 'API Integration Testing', weight: 'important' },
            { pattern: /responsive|mobile/i, name: 'Mobile Responsive Design', weight: 'important' }
        ];

        for (const requirement of clientRequirements) {
            if (requirement.pattern.test(htmlContent)) {
                this.log('pass', `✅ Client requirement met: ${requirement.name}`, 'Client Requirements');
            } else {
                const level = requirement.weight === 'critical' ? 'fail' : 'warn';
                this.log(level, `${level === 'fail' ? '❌' : '⚠️'} Client requirement issue: ${requirement.name}`, 'Client Requirements');
            }
        }
    }

    generateReport() {
        this.log('info', '📋 Generating UAT report...');
        
        const report = {
            testSummary: {
                total: this.testResults.passed + this.testResults.failed + this.testResults.warnings,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                warnings: this.testResults.warnings,
                score: Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100) || 0
            },
            timestamp: new Date().toISOString(),
            tests: this.testResults.tests
        };

        const reportPath = path.join(__dirname, 'UAT_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const markdownPath = path.join(__dirname, 'UAT_REPORT.md');
        fs.writeFileSync(markdownPath, markdownReport);
        
        this.log('pass', `✅ UAT report generated: ${reportPath}`, 'Report Generation');
        this.log('pass', `✅ Markdown report generated: ${markdownPath}`, 'Report Generation');
        
        return report;
    }

    generateMarkdownReport(report) {
        return `# 🧪 Scout Dashboard - UAT Test Report

## 📊 Test Summary

- **Total Tests**: ${report.testSummary.total}
- **Passed**: ${report.testSummary.passed} ✅
- **Failed**: ${report.testSummary.failed} ❌
- **Warnings**: ${report.testSummary.warnings} ⚠️
- **Success Rate**: ${report.testSummary.score}%
- **Generated**: ${new Date(report.timestamp).toLocaleString()}

## 🎯 Test Results by Category

${this.generateCategoryResults(report.tests)}

## 📋 Detailed Test Results

${report.tests.map(test => `### ${test.test}
- **Status**: ${test.level.toUpperCase()}
- **Message**: ${test.message}
- **Time**: ${new Date(test.timestamp).toLocaleString()}
`).join('\n')}

## 🚀 Deployment Readiness

${report.testSummary.score >= 85 ? '✅ **READY FOR DEPLOYMENT**' : '⚠️ **REQUIRES ATTENTION**'}

${report.testSummary.score >= 85 
    ? 'The Scout Dashboard meets the minimum requirements for production deployment.'
    : 'The Scout Dashboard requires fixes before production deployment.'}

---
*Generated by Scout Dashboard UAT Validator*`;
    }

    generateCategoryResults(tests) {
        const categories = {};
        tests.forEach(test => {
            if (!categories[test.test]) {
                categories[test.test] = { passed: 0, failed: 0, warnings: 0 };
            }
            categories[test.test][test.level === 'pass' ? 'passed' : test.level === 'fail' ? 'failed' : 'warnings']++;
        });

        return Object.entries(categories).map(([category, results]) => 
            `- **${category}**: ${results.passed} ✅ | ${results.failed} ❌ | ${results.warnings} ⚠️`
        ).join('\n');
    }

    async runFullValidation() {
        console.log('🚀 Starting Scout Dashboard UAT Validation...');
        console.log('================================================');
        
        await this.validateFileStructure();
        await this.validateHTMLContent();
        await this.validateJavaScriptModules();
        await this.validateDataFiles();
        await this.validateConfiguration();
        await this.validateClientRequirements();
        
        const report = this.generateReport();
        
        console.log('================================================');
        console.log(`🎯 UAT Validation Complete!`);
        console.log(`📊 Score: ${report.testSummary.score}% (${report.testSummary.passed}/${report.testSummary.total} tests passed)`);
        console.log(`📄 Reports generated: UAT_REPORT.json, UAT_REPORT.md`);
        
        if (report.testSummary.score >= 85) {
            console.log('✅ READY FOR DEPLOYMENT');
        } else {
            console.log('⚠️ REQUIRES ATTENTION BEFORE DEPLOYMENT');
        }
        
        return report;
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new ScoutDashboardUATValidator();
    validator.runFullValidation().catch(error => {
        console.error('❌ UAT Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ScoutDashboardUATValidator;