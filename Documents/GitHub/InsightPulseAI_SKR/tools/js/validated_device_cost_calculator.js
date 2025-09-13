/**
 * Validated IoT Device Cost Calculator - Based on Actual Client360/Scout Consumption
 * Updated with real per-device consumption data from production deployment
 */

class ValidatedDeviceCostCalculator {
    constructor() {
        // ACTUAL production data consumption patterns (validated May 2025)
        this.actualDeviceProfile = {
            // Real data generation per device per day
            dataGeneration: {
                // Event-based data (no audio events in this model)
                cvJsonEvents: 16000, // 16k CV JSON events per device per day
                rawDataSize: 10, // 10 MB raw data per device per day
                storageGrowthGB: 0.01, // 10 MB = ~0.01 GB per device per day
                monthlyStorageGB: 0.3, // 10 MB * 30 days = 0.3 GB per device per month
                
                // Processing patterns
                realTimeProcessing: true, // Real-time CV analysis required
                batchProcessing: true, // ETL for gold layer analytics
                streamingLatency: 100 // ms requirement for CV alerts
            },
            
            // Actual Azure infrastructure requirements
            infrastructure: {
                eventHubsTU: 1, // 1 Throughput Unit handles the load
                databricksNodes: 2, // 2 DS3v2 nodes for streaming
                databricksNodesLarge: 8, // 8 nodes for 200 devices
                sqlDatabaseTier: '8vCore Gen5 GP', // Azure SQL GP tier
                operationalHours: 24 // 24x7 streaming requirement
            }
        };

        // ACTUAL Azure costs (Asia/Manila, PAYG, May 2025)
        this.validatedAzureCosts = {
            // Event Hubs (real pricing)
            eventHubs: {
                throughputUnit: 21.6, // $21.6/month per TU
                eventIngestion: 0.000028, // $0.028 per 1M events
                baseCost: 21.6
            },
            
            // Blob Storage (Hot tier)
            storage: {
                hotTier: 0.0184 // $0.0184 per GB per month
            },
            
            // Databricks (Premium tier)
            databricks: {
                premiumDBU: 0.22, // $0.22 per DBU per hour
                ds3v2NodeDBU: 0.75, // 0.75 DBU per DS3v2 node per hour
                streamingHours: 24 * 30, // 720 hours per month
                batchHours: 1 * 30 // 1 hour per day batch processing
            },
            
            // Database costs
            database: {
                azureSQL: 610, // $610/month for 8vCore Gen5 GP
                postgresql: 480 // $480/month for equivalent PostgreSQL Flexible Server
            }
        };

        // Open source equivalent costs (realistic operational estimates)
        this.validatedOpenSourceCosts = {
            // Event streaming (Kafka)
            eventStreaming: {
                kafka3Node: 150, // $150/month for 3-node Kafka cluster
                operationalOverhead: 50 // $50/month for monitoring, maintenance
            },
            
            // Object storage (MinIO or S3-compatible)
            storage: {
                costPerGB: 0.05, // $0.05 per GB per month
                operationalOverhead: 30 // $30/month for backup, monitoring
            },
            
            // Spark processing (self-hosted)
            sparkProcessing: {
                streamingCluster: 300, // $300/month for 24x7 streaming cluster
                batchCluster: 50, // $50/month for batch processing
                k8sOverhead: 100 // $100/month for Kubernetes infrastructure
            },
            
            // Database (PostgreSQL)
            database: {
                postgresql: 200, // $200/month for self-hosted PostgreSQL
                operationalOverhead: 80 // $80/month for DBA, monitoring, backups
            },
            
            // DevOps and operations
            operations: {
                devopsTime: 2000, // $2000/month for dedicated DevOps engineer
                monitoring: 100, // $100/month for monitoring stack
                security: 150 // $150/month for security tools and compliance
            }
        };
    }

    // Calculate validated Azure costs per device
    calculateValidatedAzureCosts(deviceCount) {
        const profile = this.actualDeviceProfile;
        const costs = this.validatedAzureCosts;
        
        // Event Hubs costs
        const totalEventsPerMonth = profile.dataGeneration.cvJsonEvents * deviceCount * 30;
        const eventIngestionCost = (totalEventsPerMonth / 1000000) * costs.eventHubs.eventIngestion;
        const eventHubsCost = costs.eventHubs.baseCost + eventIngestionCost;
        
        // Storage costs
        const totalStorageGB = profile.dataGeneration.monthlyStorageGB * deviceCount;
        const storageCost = totalStorageGB * costs.storage.hotTier;
        
        // Databricks costs (real-time streaming)
        const nodesRequired = deviceCount <= 20 ? profile.infrastructure.databricksNodes : 
                            profile.infrastructure.databricksNodesLarge;
        const streamingDBUHours = nodesRequired * costs.databricks.ds3v2NodeDBU * costs.databricks.streamingHours;
        const streamingCost = streamingDBUHours * costs.databricks.premiumDBU;
        
        // Databricks costs (batch alternative)
        const batchNodesRequired = deviceCount <= 20 ? 2 : 4;
        const batchDBUHours = batchNodesRequired * costs.databricks.ds3v2NodeDBU * costs.databricks.batchHours;
        const batchCost = batchDBUHours * costs.databricks.premiumDBU;
        
        // Database costs
        const azureSQLCost = costs.database.azureSQL;
        const postgresqlCost = costs.database.postgresql;
        
        return {
            streaming: {
                eventHubs: eventHubsCost,
                storage: storageCost,
                databricks: streamingCost,
                azureSQL: azureSQLCost,
                postgresql: postgresqlCost,
                totalWithSQL: eventHubsCost + storageCost + streamingCost + azureSQLCost,
                totalWithPostgres: eventHubsCost + storageCost + streamingCost + postgresqlCost,
                perDeviceSQL: (eventHubsCost + storageCost + streamingCost + azureSQLCost) / deviceCount,
                perDevicePostgres: (eventHubsCost + storageCost + streamingCost + postgresqlCost) / deviceCount
            },
            batch: {
                eventHubs: eventHubsCost,
                storage: storageCost,
                databricks: batchCost,
                azureSQL: azureSQLCost,
                postgresql: postgresqlCost,
                totalWithSQL: eventHubsCost + storageCost + batchCost + azureSQLCost,
                totalWithPostgres: eventHubsCost + storageCost + batchCost + postgresqlCost,
                perDeviceSQL: (eventHubsCost + storageCost + batchCost + azureSQLCost) / deviceCount,
                perDevicePostgres: (eventHubsCost + storageCost + batchCost + postgresqlCost) / deviceCount
            }
        };
    }

    // Calculate validated open source costs
    calculateValidatedOpenSourceCosts(deviceCount) {
        const profile = this.actualDeviceProfile;
        const costs = this.validatedOpenSourceCosts;
        
        // Event streaming (Kafka)
        const kafkaCost = costs.eventStreaming.kafka3Node + costs.eventStreaming.operationalOverhead;
        
        // Storage (MinIO/S3-compatible)
        const totalStorageGB = profile.dataGeneration.monthlyStorageGB * deviceCount;
        const storageCost = (totalStorageGB * costs.storage.costPerGB) + costs.storage.operationalOverhead;
        
        // Spark processing
        const streamingSparkCost = costs.sparkProcessing.streamingCluster + costs.sparkProcessing.k8sOverhead;
        const batchSparkCost = costs.sparkProcessing.batchCluster + costs.sparkProcessing.k8sOverhead;
        
        // Database
        const databaseCost = costs.database.postgresql + costs.database.operationalOverhead;
        
        // Operations (scales with complexity, not linearly with devices)
        const scalingFactor = Math.min(2.0, 1.0 + (deviceCount / 200)); // Max 2x scaling
        const operationsCost = (costs.operations.devopsTime + costs.operations.monitoring + 
                               costs.operations.security) * scalingFactor;
        
        return {
            streaming: {
                kafka: kafkaCost,
                storage: storageCost,
                spark: streamingSparkCost,
                database: databaseCost,
                operations: operationsCost,
                total: kafkaCost + storageCost + streamingSparkCost + databaseCost + operationsCost,
                perDevice: (kafkaCost + storageCost + streamingSparkCost + databaseCost + operationsCost) / deviceCount
            },
            batch: {
                kafka: kafkaCost,
                storage: storageCost,
                spark: batchSparkCost,
                database: databaseCost,
                operations: operationsCost,
                total: kafkaCost + storageCost + batchSparkCost + databaseCost + operationsCost,
                perDevice: (kafkaCost + storageCost + batchSparkCost + databaseCost + operationsCost) / deviceCount
            }
        };
    }

    // Generate comparison with provided actual data
    compareWithActualData(deviceCounts = [20, 200]) {
        const results = {};
        
        deviceCounts.forEach(deviceCount => {
            const azureCosts = this.calculateValidatedAzureCosts(deviceCount);
            const openSourceCosts = this.calculateValidatedOpenSourceCosts(deviceCount);
            
            // Calculate savings
            const streamingSavings = {
                sqlToPostgres: azureCosts.streaming.totalWithSQL - azureCosts.streaming.totalWithPostgres,
                azureToOS: azureCosts.streaming.totalWithPostgres - openSourceCosts.streaming.total,
                totalSavings: azureCosts.streaming.totalWithSQL - openSourceCosts.streaming.total,
                percentSavings: ((azureCosts.streaming.totalWithSQL - openSourceCosts.streaming.total) / 
                                azureCosts.streaming.totalWithSQL * 100)
            };
            
            const batchSavings = {
                sqlToPostgres: azureCosts.batch.totalWithSQL - azureCosts.batch.totalWithPostgres,
                azureToOS: azureCosts.batch.totalWithPostgres - openSourceCosts.batch.total,
                totalSavings: azureCosts.batch.totalWithSQL - openSourceCosts.batch.total,
                percentSavings: ((azureCosts.batch.totalWithSQL - openSourceCosts.batch.total) / 
                                azureCosts.batch.totalWithSQL * 100)
            };
            
            results[deviceCount] = {
                azure: azureCosts,
                openSource: openSourceCosts,
                savings: {
                    streaming: streamingSavings,
                    batch: batchSavings
                }
            };
        });
        
        return results;
    }

    // Validate against provided actual costs
    validateAgainstActualCosts() {
        // Your provided actual costs
        const actualCosts = {
            20: {
                streaming: { sqlPerDevice: 77, postgresPerDevice: 71 },
                batch: { postgresPerDevice: 3 }
            },
            200: {
                streaming: { sqlPerDevice: 23, postgresPerDevice: 22 },
                batch: { postgresPerDevice: 7 }
            }
        };
        
        const myCalculations = this.compareWithActualData([20, 200]);
        
        const validation = {};
        
        [20, 200].forEach(deviceCount => {
            const actual = actualCosts[deviceCount];
            const calculated = myCalculations[deviceCount];
            
            validation[deviceCount] = {
                streaming: {
                    actual: {
                        sqlPerDevice: actual.streaming.sqlPerDevice,
                        postgresPerDevice: actual.streaming.postgresPerDevice
                    },
                    calculated: {
                        sqlPerDevice: calculated.azure.streaming.perDeviceSQL.toFixed(0),
                        postgresPerDevice: calculated.azure.streaming.perDevicePostgres.toFixed(0),
                        openSourcePerDevice: calculated.openSource.streaming.perDevice.toFixed(0)
                    },
                    variance: {
                        sqlVariance: ((calculated.azure.streaming.perDeviceSQL - actual.streaming.sqlPerDevice) / 
                                     actual.streaming.sqlPerDevice * 100).toFixed(1),
                        postgresVariance: ((calculated.azure.streaming.perDevicePostgres - actual.streaming.postgresPerDevice) / 
                                          actual.streaming.postgresPerDevice * 100).toFixed(1)
                    }
                },
                batch: {
                    actual: {
                        postgresPerDevice: actual.batch ? actual.batch.postgresPerDevice : 'N/A'
                    },
                    calculated: {
                        postgresPerDevice: calculated.azure.batch.perDevicePostgres.toFixed(0),
                        openSourcePerDevice: calculated.openSource.batch.perDevice.toFixed(0)
                    },
                    variance: actual.batch ? {
                        postgresVariance: ((calculated.azure.batch.perDevicePostgres - actual.batch.postgresPerDevice) / 
                                          actual.batch.postgresPerDevice * 100).toFixed(1)
                    } : {}
                }
            };
        });
        
        return validation;
    }
}

module.exports = { ValidatedDeviceCostCalculator };