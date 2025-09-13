/**
 * IoT Device Cost Calculator for Client360/Scout Deployment
 * Calculates per-device costs for compute, data usage, batch/streaming processing
 * Scales from 20 to 200+ devices
 */

class IoTDeviceCostCalculator {
    constructor() {
        // Device specifications and usage patterns
        this.deviceProfile = {
            // Raspberry Pi 5 specifications
            hardware: {
                cpu: '4-core ARM Cortex-A76',
                ram: '8GB LPDDR4X',
                storage: '64GB microSD',
                connectivity: 'WiFi 6, Bluetooth 5.0, Ethernet',
                sensors: ['Camera', 'Temperature', 'Humidity', 'Motion', 'Audio']
            },
            
            // Data generation patterns
            dataGeneration: {
                // Per device per day
                sensorReadings: 86400, // Every second for critical metrics
                imageCaptures: 720, // Every 2 minutes during business hours
                audioSamples: 480, // Every 3 minutes during business hours
                transactionEvents: 150, // Average transactions per store per day
                customerInteractions: 200, // Foot traffic, dwell time, etc.
                
                // Data sizes (bytes)
                sensorDataSize: 256, // JSON payload per reading
                imageSize: 2048000, // 2MB average per image
                audioSize: 1024000, // 1MB per 30-second sample
                transactionSize: 1024, // 1KB per transaction record
                interactionSize: 512 // 512B per interaction event
            },
            
            // Processing requirements
            processing: {
                edgeProcessing: 0.3, // 30% processed at edge
                realTimeProcessing: 0.4, // 40% requires real-time processing
                batchProcessing: 0.6, // 60% can be batch processed
                aiInference: 0.2, // 20% requires AI inference
                streamingLatency: 100, // ms requirement
                batchWindow: 3600 // 1 hour batch windows
            }
        };

        // Azure cost structure (current)
        this.azureCosts = {
            // IoT Hub costs
            iotHub: {
                basic: { messagesPerDay: 8000, costPerUnit: 10 }, // $10/month per unit
                standard: { messagesPerDay: 400000, costPerUnit: 50 }, // $50/month per unit
                messageOverage: 0.0004 // $0.0004 per message over limit
            },
            
            // Event Hubs costs
            eventHubs: {
                basic: { throughputUnits: 1, costPerTU: 11 }, // $11/month per TU
                standard: { throughputUnits: 20, costPerTU: 22 }, // $22/month per TU
                ingestionCost: 0.028 // $0.028 per million events
            },
            
            // Storage costs
            storage: {
                hotTier: 0.0184, // $0.0184 per GB per month
                coolTier: 0.01, // $0.01 per GB per month
                archiveTier: 0.00099, // $0.00099 per GB per month
                transactions: 0.0004 // $0.0004 per 10K transactions
            },
            
            // Compute costs (Stream Analytics, Functions, etc.)
            compute: {
                streamAnalytics: 0.11, // $0.11 per streaming unit per hour
                functions: 0.0000002, // $0.0000002 per execution
                databricks: 0.15, // $0.15 per DBU per hour
                sqlDatabase: 4.89 // $4.89 per DTU per month (S1 tier)
            },
            
            // AI/ML costs
            ai: {
                cognitiveServices: 1, // $1 per 1K transactions
                openai: 0.002, // $0.002 per 1K tokens
                customVision: 2, // $2 per 1K images
                speechServices: 1 // $1 per hour of audio
            }
        };

        // Open source alternative costs
        this.openSourceCosts = {
            // Infrastructure per month
            infrastructure: {
                // Kubernetes cluster for 20 devices
                baseCluster: 200, // $200/month for 3-node cluster
                additionalNode: 70, // $70/month per additional node
                storage: 0.05, // $0.05 per GB per month (SSD)
                networkEgress: 0.09 // $0.09 per GB
            },
            
            // Self-hosted services
            services: {
                kafka: 50, // $50/month operational overhead
                postgresql: 30, // $30/month operational overhead
                influxdb: 25, // $25/month operational overhead
                grafana: 10, // $10/month operational overhead
                prometheus: 15, // $15/month operational overhead
                jupyterHub: 20, // $20/month operational overhead
                minio: 20 // $20/month operational overhead
            },
            
            // Maintenance and operations
            operations: {
                devopsTime: 40, // 40 hours per month @ $50/hour
                monitoring: 15, // $15/month for external monitoring
                backups: 25, // $25/month for backup services
                security: 30 // $30/month for security tools
            }
        };
    }

    // Calculate daily data generation per device
    calculateDailyDataPerDevice() {
        const profile = this.deviceProfile.dataGeneration;
        
        const dailyData = {
            sensorData: (profile.sensorReadings * profile.sensorDataSize) / (1024 * 1024), // MB
            imageData: (profile.imageCaptures * profile.imageSize) / (1024 * 1024), // MB
            audioData: (profile.audioSamples * profile.audioSize) / (1024 * 1024), // MB
            transactionData: (profile.transactionEvents * profile.transactionSize) / (1024 * 1024), // MB
            interactionData: (profile.customerInteractions * profile.interactionSize) / (1024 * 1024), // MB
        };
        
        dailyData.total = Object.values(dailyData).reduce((sum, val) => sum + val, 0);
        dailyData.totalGB = dailyData.total / 1024;
        
        return dailyData;
    }

    // Calculate Azure costs per device
    calculateAzureCostPerDevice(deviceCount) {
        const dailyData = this.calculateDailyDataPerDevice();
        const monthlyDataGB = dailyData.totalGB * 30;
        
        // IoT Hub costs
        const messagesPerDay = this.deviceProfile.dataGeneration.sensorReadings + 
                              this.deviceProfile.dataGeneration.transactionEvents +
                              this.deviceProfile.dataGeneration.customerInteractions;
        
        const totalMessagesPerDay = messagesPerDay * deviceCount;
        let iotHubCost = 0;
        
        if (totalMessagesPerDay <= 8000) {
            iotHubCost = this.azureCosts.iotHub.basic.costPerUnit;
        } else {
            const basicUnits = Math.ceil(totalMessagesPerDay / 8000);
            iotHubCost = basicUnits * this.azureCosts.iotHub.basic.costPerUnit;
        }
        
        // Event Hubs costs (for streaming)
        const streamingEvents = totalMessagesPerDay * this.deviceProfile.processing.realTimeProcessing * 30;
        const eventHubCost = Math.ceil(streamingEvents / 1000000) * this.azureCosts.eventHubs.ingestionCost +
                            this.azureCosts.eventHubs.basic.costPerTU;
        
        // Storage costs
        const totalStorageGB = monthlyDataGB * deviceCount;
        const hotStorageCost = totalStorageGB * 0.3 * this.azureCosts.storage.hotTier; // 30% hot
        const coolStorageCost = totalStorageGB * 0.7 * this.azureCosts.storage.coolTier; // 70% cool
        const storageCost = hotStorageCost + coolStorageCost;
        
        // Compute costs
        const streamAnalyticsCost = this.azureCosts.compute.streamAnalytics * 24 * 30; // 1 SU 24/7
        const databricksCost = this.azureCosts.compute.databricks * 8 * 30; // 8 hours/day
        const sqlDatabaseCost = this.azureCosts.compute.sqlDatabase * 4; // 4 DTUs
        
        // AI/ML costs
        const imageProcessingCost = (this.deviceProfile.dataGeneration.imageCaptures * deviceCount * 30 / 1000) * 
                                   this.azureCosts.ai.customVision;
        const audioProcessingCost = (this.deviceProfile.dataGeneration.audioSamples * deviceCount * 0.5 / 60) * // 30-sec samples
                                   this.azureCosts.ai.speechServices;
        const aiInferenceCost = (messagesPerDay * deviceCount * 30 * this.deviceProfile.processing.aiInference / 1000) *
                               this.azureCosts.ai.openai;
        
        const totalMonthlyCost = iotHubCost + eventHubCost + storageCost + streamAnalyticsCost + 
                                databricksCost + sqlDatabaseCost + imageProcessingCost + 
                                audioProcessingCost + aiInferenceCost;
        
        return {
            perDevice: totalMonthlyCost / deviceCount,
            total: totalMonthlyCost,
            breakdown: {
                iotHub: iotHubCost,
                eventHub: eventHubCost,
                storage: storageCost,
                streamAnalytics: streamAnalyticsCost,
                databricks: databricksCost,
                sqlDatabase: sqlDatabaseCost,
                imageProcessing: imageProcessingCost,
                audioProcessing: audioProcessingCost,
                aiInference: aiInferenceCost
            },
            dataUsage: {
                monthlyGBPerDevice: monthlyDataGB,
                totalMonthlyGB: totalStorageGB
            }
        };
    }

    // Calculate open source costs per device
    calculateOpenSourceCostPerDevice(deviceCount) {
        const dailyData = this.calculateDailyDataPerDevice();
        const monthlyDataGB = dailyData.totalGB * 30;
        
        // Infrastructure scaling
        const nodesNeeded = Math.ceil(deviceCount / 50); // 50 devices per node
        const clusterCost = this.openSourceCosts.infrastructure.baseCluster + 
                           (nodesNeeded - 1) * this.openSourceCosts.infrastructure.additionalNode;
        
        // Storage costs
        const totalStorageGB = monthlyDataGB * deviceCount;
        const storageCost = totalStorageGB * this.openSourceCosts.infrastructure.storage;
        
        // Network costs (assuming 20% of data egress)
        const networkCost = totalStorageGB * 0.2 * this.openSourceCosts.infrastructure.networkEgress;
        
        // Service operational costs (fixed)
        const servicesCost = Object.values(this.openSourceCosts.services).reduce((sum, cost) => sum + cost, 0);
        
        // Operations costs (scales with device count)
        const operationsCost = Object.values(this.openSourceCosts.operations).reduce((sum, cost) => sum + cost, 0);
        const scaledOperationsCost = operationsCost * Math.max(1, deviceCount / 100); // Scale ops cost
        
        const totalMonthlyCost = clusterCost + storageCost + networkCost + servicesCost + scaledOperationsCost;
        
        return {
            perDevice: totalMonthlyCost / deviceCount,
            total: totalMonthlyCost,
            breakdown: {
                cluster: clusterCost,
                storage: storageCost,
                network: networkCost,
                services: servicesCost,
                operations: scaledOperationsCost
            },
            dataUsage: {
                monthlyGBPerDevice: monthlyDataGB,
                totalMonthlyGB: totalStorageGB
            }
        };
    }

    // Calculate processing costs for different patterns
    calculateProcessingCosts(deviceCount, processingType = 'hybrid') {
        const dailyData = this.calculateDailyDataPerDevice();
        
        const processingPatterns = {
            batch: {
                azureMultiplier: 0.7, // 30% savings for batch processing
                openSourceMultiplier: 0.5, // 50% savings for batch processing
                latency: '1-4 hours',
                description: 'Process data in hourly batches'
            },
            streaming: {
                azureMultiplier: 1.3, // 30% premium for real-time
                openSourceMultiplier: 1.2, // 20% premium for real-time
                latency: '< 100ms',
                description: 'Real-time event processing'
            },
            hybrid: {
                azureMultiplier: 1.0, // Baseline costs
                openSourceMultiplier: 0.8, // 20% savings due to flexibility
                latency: '100ms - 1 hour',
                description: 'Critical events real-time, analytics batch'
            }
        };
        
        const pattern = processingPatterns[processingType];
        const azureCosts = this.calculateAzureCostPerDevice(deviceCount);
        const openSourceCosts = this.calculateOpenSourceCostPerDevice(deviceCount);
        
        return {
            processingType,
            pattern,
            azure: {
                perDevice: (azureCosts.perDevice * pattern.azureMultiplier),
                total: (azureCosts.total * pattern.azureMultiplier),
                breakdown: azureCosts.breakdown
            },
            openSource: {
                perDevice: (openSourceCosts.perDevice * pattern.openSourceMultiplier),
                total: (openSourceCosts.total * pattern.openSourceMultiplier),
                breakdown: openSourceCosts.breakdown
            },
            savings: {
                perDevice: (azureCosts.perDevice * pattern.azureMultiplier) - 
                          (openSourceCosts.perDevice * pattern.openSourceMultiplier),
                total: (azureCosts.total * pattern.azureMultiplier) - 
                      (openSourceCosts.total * pattern.openSourceMultiplier),
                percentage: (((azureCosts.total * pattern.azureMultiplier) - 
                             (openSourceCosts.total * pattern.openSourceMultiplier)) / 
                             (azureCosts.total * pattern.azureMultiplier) * 100)
            }
        };
    }

    // Generate comprehensive report
    generateDeviceCostReport(deviceCounts = [20, 200], processingTypes = ['batch', 'streaming', 'hybrid']) {
        const report = {
            deviceProfile: this.deviceProfile,
            dailyDataPerDevice: this.calculateDailyDataPerDevice(),
            scenarios: []
        };

        deviceCounts.forEach(deviceCount => {
            processingTypes.forEach(processingType => {
                const costs = this.calculateProcessingCosts(deviceCount, processingType);
                report.scenarios.push({
                    deviceCount,
                    processingType,
                    ...costs
                });
            });
        });

        return report;
    }

    // Calculate TCO (Total Cost of Ownership) over time
    calculateTCO(deviceCount, years = 3, processingType = 'hybrid') {
        const costs = this.calculateProcessingCosts(deviceCount, processingType);
        
        // Additional one-time costs
        const oneTimeCosts = {
            azure: {
                setup: deviceCount * 50, // $50 setup per device
                training: 5000, // $5K training
                migration: 0 // No migration cost
            },
            openSource: {
                setup: deviceCount * 30, // $30 setup per device  
                training: 15000, // $15K training for open source
                migration: 25000 // $25K migration from Azure
            }
        };

        const azureTCO = {
            oneTime: Object.values(oneTimeCosts.azure).reduce((sum, cost) => sum + cost, 0),
            monthly: costs.azure.total,
            annual: costs.azure.total * 12,
            total: Object.values(oneTimeCosts.azure).reduce((sum, cost) => sum + cost, 0) + 
                   (costs.azure.total * 12 * years)
        };

        const openSourceTCO = {
            oneTime: Object.values(oneTimeCosts.openSource).reduce((sum, cost) => sum + cost, 0),
            monthly: costs.openSource.total,
            annual: costs.openSource.total * 12,
            total: Object.values(oneTimeCosts.openSource).reduce((sum, cost) => sum + cost, 0) + 
                   (costs.openSource.total * 12 * years)
        };

        return {
            deviceCount,
            processingType,
            years,
            azure: azureTCO,
            openSource: openSourceTCO,
            savings: {
                total: azureTCO.total - openSourceTCO.total,
                percentage: ((azureTCO.total - openSourceTCO.total) / azureTCO.total * 100),
                breakEvenMonths: Math.ceil(oneTimeCosts.openSource.migration / costs.savings.total)
            }
        };
    }
}

module.exports = { IoTDeviceCostCalculator };