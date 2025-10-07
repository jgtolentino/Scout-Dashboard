/**
 * Azure Cost Projection Calculator
 * Based on current spend data: $673.19 (May 1-21), avg $32.06/day
 * Post-optimization forecast: $42-53/day (to be updated after May 23-24)
 */

class AzureCostProjector {
    constructor(currentData) {
        this.currentSpend = currentData.totalSpend || 673.19;
        this.currentDays = currentData.days || 21;
        this.currentDailyAvg = this.currentSpend / this.currentDays;
        this.forecastDailyRange = currentData.forecastRange || { min: 42, max: 53 };
        this.optimizedDailyRate = null; // Will be updated after May 23-24
    }

    // Calculate daily projections
    getDailyProjection(optimizedRate = null) {
        const rate = optimizedRate || this.currentDailyAvg;
        return {
            currentRate: this.currentDailyAvg.toFixed(2),
            projectedRate: rate.toFixed(2),
            dailySavings: (this.currentDailyAvg - rate).toFixed(2),
            savingsPercentage: (((this.currentDailyAvg - rate) / this.currentDailyAvg) * 100).toFixed(1)
        };
    }

    // Calculate monthly projections
    getMonthlyProjection(daysInMonth = 30, optimizedRate = null) {
        const rate = optimizedRate || this.currentDailyAvg;
        const monthlySpend = rate * daysInMonth;
        const currentMonthlyProjection = this.currentDailyAvg * daysInMonth;
        
        return {
            currentMonthlyProjection: currentMonthlyProjection.toFixed(2),
            optimizedMonthlyProjection: monthlySpend.toFixed(2),
            monthlySavings: (currentMonthlyProjection - monthlySpend).toFixed(2),
            annualSavings: ((currentMonthlyProjection - monthlySpend) * 12).toFixed(2)
        };
    }

    // Update with post-optimization data
    updateOptimizedRate(newDailyRate) {
        this.optimizedDailyRate = newDailyRate;
        return this.getProjectionSummary();
    }

    getProjectionSummary() {
        const daily = this.getDailyProjection(this.optimizedDailyRate);
        const monthly = this.getMonthlyProjection(30, this.optimizedDailyRate);
        
        return {
            daily,
            monthly,
            timestamp: new Date().toISOString(),
            dataSource: 'Azure Cost Management',
            lastUpdated: 'May 22, 2025 (awaiting May 23-24 refresh)'
        };
    }
}

// AWS Cost Comparison Model
class AWSCostComparator {
    constructor(azureServices) {
        this.azureServices = azureServices;
        this.awsEquivalents = {
            // Compute
            'Virtual Machines': { service: 'EC2', multiplier: 0.85 }, // Generally 15% cheaper
            'App Service': { service: 'Elastic Beanstalk + EC2', multiplier: 0.90 },
            'Azure Functions': { service: 'Lambda', multiplier: 0.95 },
            
            // Storage
            'Storage Accounts': { service: 'S3', multiplier: 0.80 }, // 20% cheaper
            'Managed Disks': { service: 'EBS', multiplier: 0.88 },
            
            // Database
            'SQL Database': { service: 'RDS', multiplier: 0.92 },
            'Cosmos DB': { service: 'DynamoDB', multiplier: 0.85 },
            
            // Networking
            'Virtual Network': { service: 'VPC', multiplier: 0.95 },
            'Load Balancer': { service: 'ELB/ALB', multiplier: 0.88 },
            
            // Analytics
            'Databricks': { service: 'EMR', multiplier: 0.75 }, // Significant savings
            'Data Factory': { service: 'Glue', multiplier: 0.70 },
            
            // AI/ML
            'Cognitive Services': { service: 'AI Services', multiplier: 0.90 },
            'Machine Learning': { service: 'SageMaker', multiplier: 0.85 }
        };
    }

    calculateAWSEquivalent(azureDailyCost) {
        const estimatedAWSCost = azureDailyCost * 0.85; // Average 15% savings
        return {
            azureDailyCost: azureDailyCost.toFixed(2),
            awsDailyCost: estimatedAWSCost.toFixed(2),
            dailySavings: (azureDailyCost - estimatedAWSCost).toFixed(2),
            monthlyEquivalent: (estimatedAWSCost * 30).toFixed(2),
            monthlySavings: ((azureDailyCost - estimatedAWSCost) * 30).toFixed(2),
            annualSavings: ((azureDailyCost - estimatedAWSCost) * 365).toFixed(2)
        };
    }
}

// Google Cloud Cost Comparison Model
class GCPCostComparator {
    constructor(azureServices) {
        this.azureServices = azureServices;
        this.gcpEquivalents = {
            // Compute
            'Virtual Machines': { service: 'Compute Engine', multiplier: 0.80 }, // 20% cheaper
            'App Service': { service: 'App Engine', multiplier: 0.85 },
            'Azure Functions': { service: 'Cloud Functions', multiplier: 0.90 },
            
            // Storage
            'Storage Accounts': { service: 'Cloud Storage', multiplier: 0.75 }, // 25% cheaper
            'Managed Disks': { service: 'Persistent Disk', multiplier: 0.82 },
            
            // Database
            'SQL Database': { service: 'Cloud SQL', multiplier: 0.88 },
            'Cosmos DB': { service: 'Firestore', multiplier: 0.80 },
            
            // Analytics
            'Databricks': { service: 'Dataproc', multiplier: 0.70 }, // Major savings
            'Data Factory': { service: 'Cloud Dataflow', multiplier: 0.65 },
            
            // AI/ML
            'Cognitive Services': { service: 'AI Platform', multiplier: 0.85 },
            'Machine Learning': { service: 'Vertex AI', multiplier: 0.80 }
        };
    }

    calculateGCPEquivalent(azureDailyCost) {
        const estimatedGCPCost = azureDailyCost * 0.78; // Average 22% savings
        return {
            azureDailyCost: azureDailyCost.toFixed(2),
            gcpDailyCost: estimatedGCPCost.toFixed(2),
            dailySavings: (azureDailyCost - estimatedGCPCost).toFixed(2),
            monthlyEquivalent: (estimatedGCPCost * 30).toFixed(2),
            monthlySavings: ((azureDailyCost - estimatedGCPCost) * 30).toFixed(2),
            annualSavings: ((azureDailyCost - estimatedGCPCost) * 365).toFixed(2)
        };
    }
}

// Open Source Substitution Analyzer
class OpenSourceSubstitutionAnalyzer {
    constructor() {
        this.substitutions = {
            // Database & Analytics
            'SQL Database': {
                openSource: 'PostgreSQL + Docker',
                licensingSavings: 0.70, // 70% cost reduction
                implementationEffort: 'Medium',
                maintenanceOverhead: 'High',
                recommended: true
            },
            'Databricks': {
                openSource: 'Apache Spark + Jupyter',
                licensingSavings: 0.85, // 85% cost reduction
                implementationEffort: 'High',
                maintenanceOverhead: 'High',
                recommended: true
            },
            'Power BI': {
                openSource: 'Apache Superset + Grafana',
                licensingSavings: 0.90, // 90% cost reduction
                implementationEffort: 'Medium',
                maintenanceOverhead: 'Medium',
                recommended: true
            },
            
            // Data Processing
            'Data Factory': {
                openSource: 'Apache Airflow',
                licensingSavings: 0.75,
                implementationEffort: 'Medium',
                maintenanceOverhead: 'Medium',
                recommended: true
            },
            
            // Monitoring & Logging
            'Application Insights': {
                openSource: 'Prometheus + Grafana + ELK Stack',
                licensingSavings: 0.80,
                implementationEffort: 'High',
                maintenanceOverhead: 'High',
                recommended: true
            },
            
            // Container Orchestration
            'Azure Kubernetes Service': {
                openSource: 'Self-managed Kubernetes',
                licensingSavings: 0.60, // Lower savings due to management overhead
                implementationEffort: 'Very High',
                maintenanceOverhead: 'Very High',
                recommended: false // Unless you have dedicated DevOps team
            },
            
            // CI/CD
            'Azure DevOps': {
                openSource: 'GitLab CE + Jenkins',
                licensingSavings: 0.85,
                implementationEffort: 'Medium',
                maintenanceOverhead: 'Medium',
                recommended: true
            }
        };
    }

    analyzeSubstitution(azureService, currentMonthlyCost) {
        const substitution = this.substitutions[azureService];
        if (!substitution) {
            return { message: `No open-source alternative identified for ${azureService}` };
        }

        const potentialSavings = currentMonthlyCost * substitution.licensingSavings;
        const implementationCost = this.estimateImplementationCost(substitution.implementationEffort);
        const monthlyMaintenanceCost = this.estimateMaintenanceCost(substitution.maintenanceOverhead, currentMonthlyCost);

        return {
            azureService,
            openSourceAlternative: substitution.openSource,
            currentMonthlyCost: currentMonthlyCost.toFixed(2),
            potentialMonthlySavings: potentialSavings.toFixed(2),
            implementationCost: implementationCost.toFixed(2),
            monthlyMaintenanceCost: monthlyMaintenanceCost.toFixed(2),
            netMonthlySavings: (potentialSavings - monthlyMaintenanceCost).toFixed(2),
            breakEvenMonths: (implementationCost / (potentialSavings - monthlyMaintenanceCost)).toFixed(1),
            recommendationScore: this.calculateRecommendationScore(substitution),
            recommended: substitution.recommended
        };
    }

    estimateImplementationCost(effort) {
        const costs = {
            'Low': 5000,
            'Medium': 15000,
            'High': 35000,
            'Very High': 75000
        };
        return costs[effort] || 15000;
    }

    estimateMaintenanceCost(overhead, currentCost) {
        const multipliers = {
            'Low': 0.05,
            'Medium': 0.15,
            'High': 0.25,
            'Very High': 0.40
        };
        return currentCost * (multipliers[overhead] || 0.15);
    }

    calculateRecommendationScore(substitution) {
        let score = 0;
        score += substitution.licensingSavings * 40; // 40% weight on savings
        score += (5 - this.getEffortScore(substitution.implementationEffort)) * 15; // 15% weight on ease
        score += (5 - this.getEffortScore(substitution.maintenanceOverhead)) * 25; // 25% weight on maintenance
        score += substitution.recommended ? 20 : 0; // 20% weight on general recommendation
        return Math.round(score);
    }

    getEffortScore(effort) {
        const scores = { 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
        return scores[effort] || 2;
    }
}

// Usage Example and Report Generator
function generateCostAnalysisReport() {
    const azureProjector = new AzureCostProjector({
        totalSpend: 673.19,
        days: 21,
        forecastRange: { min: 42, max: 53 }
    });

    const awsComparator = new AWSCostComparator();
    const gcpComparator = new GCPCostComparator();
    const osAnalyzer = new OpenSourceSubstitutionAnalyzer();

    const currentDailyRate = 32.06;
    const optimizedDailyRate = 47.5; // Midpoint of forecast range

    const azureProjection = azureProjector.getProjectionSummary();
    const awsComparison = awsComparator.calculateAWSEquivalent(currentDailyRate);
    const gcpComparison = gcpComparator.calculateGCPEquivalent(currentDailyRate);

    // Analyze key services for open-source substitution
    const keyServiceAnalysis = [
        osAnalyzer.analyzeSubstitution('Databricks', 400), // Estimated monthly cost
        osAnalyzer.analyzeSubstitution('SQL Database', 300),
        osAnalyzer.analyzeSubstitution('Power BI', 200),
        osAnalyzer.analyzeSubstitution('Data Factory', 150)
    ];

    return {
        azureProjection,
        awsComparison,
        gcpComparison,
        openSourceAnalysis: keyServiceAnalysis,
        summary: {
            currentMonthlySpend: (currentDailyRate * 30).toFixed(2),
            awsMonthlySavings: awsComparison.monthlySavings,
            gcpMonthlySavings: gcpComparison.monthlySavings,
            totalOpenSourceSavings: keyServiceAnalysis.reduce((sum, analysis) => 
                sum + (parseFloat(analysis.netMonthlySavings) || 0), 0).toFixed(2)
        }
    };
}

module.exports = {
    AzureCostProjector,
    AWSCostComparator,
    GCPCostComparator,
    OpenSourceSubstitutionAnalyzer,
    generateCostAnalysisReport
};