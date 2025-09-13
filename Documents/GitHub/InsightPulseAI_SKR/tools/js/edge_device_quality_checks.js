/**
 * Edge Device Quality Checks
 * Validates data quality at the edge before transmission to cloud
 */

class EdgeDeviceQualityChecker {
    constructor(deviceId, firmwareVersion) {
        this.deviceId = deviceId;
        this.firmwareVersion = firmwareVersion;
        this.qualityMetrics = {
            totalEvents: 0,
            passedEvents: 0,
            failedEvents: 0,
            duplicates: 0,
            schemaViolations: 0,
            missingFields: 0
        };
        this.eventCache = new Map(); // For duplicate detection
        this.CACHE_EXPIRY = 3600000; // 1 hour
    }

    /**
     * Main validation function - call this before sending data
     */
    async validateEvent(event) {
        const validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            qualityScore: 100,
            traceId: this.generateTraceId()
        };

        try {
            // 1. Schema validation
            const schemaErrors = this.validateSchema(event);
            if (schemaErrors.length > 0) {
                validationResult.errors.push(...schemaErrors);
                validationResult.isValid = false;
                validationResult.qualityScore -= 30;
            }

            // 2. Duplicate detection
            if (this.isDuplicate(event)) {
                validationResult.errors.push('Duplicate event detected');
                validationResult.isValid = false;
                this.qualityMetrics.duplicates++;
                return validationResult;
            }

            // 3. Data quality checks
            const qualityIssues = this.checkDataQuality(event);
            validationResult.warnings.push(...qualityIssues.warnings);
            validationResult.qualityScore -= qualityIssues.penalty;

            // 4. Edge-specific validations
            const edgeValidation = this.validateEdgeConstraints(event);
            if (!edgeValidation.valid) {
                validationResult.errors.push(...edgeValidation.errors);
                validationResult.isValid = false;
            }

            // 5. Enrich with metadata
            event.metadata = this.enrichMetadata(event, validationResult);

            // Update metrics
            this.updateMetrics(validationResult.isValid);

            // Cache event for duplicate detection
            if (validationResult.isValid) {
                this.cacheEvent(event);
            }

        } catch (error) {
            validationResult.isValid = false;
            validationResult.errors.push(`Validation error: ${error.message}`);
            validationResult.qualityScore = 0;
        }

        return validationResult;
    }

    /**
     * Schema validation against expected structure
     */
    validateSchema(event) {
        const errors = [];
        
        // Required fields
        const requiredFields = [
            'eventId',
            'timestamp',
            'storeId',
            'deviceId',
            'eventType',
            'data'
        ];

        for (const field of requiredFields) {
            if (!event[field]) {
                errors.push(`Missing required field: ${field}`);
                this.qualityMetrics.missingFields++;
            }
        }

        // Timestamp validation
        if (event.timestamp) {
            const eventTime = new Date(event.timestamp);
            const now = new Date();
            const timeDiff = Math.abs(now - eventTime);
            
            // Check for future timestamps or old data
            if (timeDiff > 86400000) { // 24 hours
                errors.push(`Invalid timestamp: ${event.timestamp} (too far from current time)`);
            }
        }

        // Event type validation
        const validEventTypes = [
            'transaction',
            'customer_interaction',
            'device_health',
            'inventory_update',
            'environment_reading'
        ];

        if (event.eventType && !validEventTypes.includes(event.eventType)) {
            errors.push(`Invalid event type: ${event.eventType}`);
        }

        // Data structure validation based on event type
        if (event.eventType === 'transaction' && event.data) {
            if (!event.data.items || !Array.isArray(event.data.items)) {
                errors.push('Transaction must include items array');
            }
            if (typeof event.data.totalAmount !== 'number' || event.data.totalAmount < 0) {
                errors.push('Transaction must have valid totalAmount');
            }
        }

        return errors;
    }

    /**
     * Check for duplicate events
     */
    isDuplicate(event) {
        const eventKey = this.generateEventKey(event);
        
        // Clean expired entries
        this.cleanExpiredCache();
        
        // Check if event exists in cache
        if (this.eventCache.has(eventKey)) {
            return true;
        }
        
        return false;
    }

    /**
     * Generate unique key for event
     */
    generateEventKey(event) {
        return `${event.deviceId}_${event.eventType}_${event.timestamp}_${JSON.stringify(event.data)}`;
    }

    /**
     * Cache event for duplicate detection
     */
    cacheEvent(event) {
        const eventKey = this.generateEventKey(event);
        this.eventCache.set(eventKey, {
            timestamp: Date.now(),
            eventId: event.eventId
        });
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.eventCache.entries()) {
            if (now - value.timestamp > this.CACHE_EXPIRY) {
                this.eventCache.delete(key);
            }
        }
    }

    /**
     * Check data quality issues
     */
    checkDataQuality(event) {
        const issues = {
            warnings: [],
            penalty: 0
        };

        // Check for customer identification
        if (event.eventType === 'customer_interaction') {
            if (!event.data?.customerPhone && !event.data?.customerId) {
                issues.warnings.push('Missing customer identification');
                issues.penalty += 10;
            }
            
            // Check transcript quality
            if (event.data?.transcript) {
                if (event.data.transcript.length < 10) {
                    issues.warnings.push('Transcript too short');
                    issues.penalty += 5;
                }
                if (!event.data.transcriptConfidence || event.data.transcriptConfidence < 0.7) {
                    issues.warnings.push('Low transcript confidence');
                    issues.penalty += 5;
                }
            }
        }

        // Check for location data
        if (!event.location || !event.location.latitude || !event.location.longitude) {
            issues.warnings.push('Missing GPS coordinates');
            issues.penalty += 5;
        }

        // Check device health
        if (event.deviceHealth) {
            if (event.deviceHealth.batteryLevel < 20) {
                issues.warnings.push('Low battery level');
                issues.penalty += 10;
            }
            if (event.deviceHealth.signalStrength < -80) {
                issues.warnings.push('Poor signal strength');
                issues.penalty += 5;
            }
        }

        return issues;
    }

    /**
     * Validate edge-specific constraints
     */
    validateEdgeConstraints(event) {
        const validation = {
            valid: true,
            errors: []
        };

        // Check firmware compatibility
        if (this.firmwareVersion < '2.1.0') {
            validation.errors.push('Firmware version too old - please update to 2.1.0+');
            validation.valid = false;
        }

        // Check device authentication
        if (!event.deviceAuth || !this.validateDeviceAuth(event.deviceAuth)) {
            validation.errors.push('Invalid device authentication');
            validation.valid = false;
        }

        // Check data size constraints (edge devices have limited memory)
        const eventSize = JSON.stringify(event).length;
        if (eventSize > 10240) { // 10KB limit
            validation.errors.push('Event size exceeds edge device limit');
            validation.valid = false;
        }

        return validation;
    }

    /**
     * Validate device authentication token
     */
    validateDeviceAuth(auth) {
        // Simple validation - in production, verify JWT or similar
        return auth && auth.token && auth.token.length > 20;
    }

    /**
     * Enrich event with quality metadata
     */
    enrichMetadata(event, validationResult) {
        return {
            deviceId: this.deviceId,
            firmwareVersion: this.firmwareVersion,
            traceId: validationResult.traceId,
            qualityScore: validationResult.qualityScore,
            validationTimestamp: new Date().toISOString(),
            edgeProcessingTime: Date.now() - new Date(event.timestamp).getTime(),
            networkType: this.getNetworkType(),
            deviceHealth: this.getDeviceHealth()
        };
    }

    /**
     * Generate unique trace ID for end-to-end tracking
     */
    generateTraceId() {
        return `${this.deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current network type
     */
    getNetworkType() {
        // Simplified - in production, check actual network status
        return 'wifi'; // wifi, cellular, offline
    }

    /**
     * Get device health metrics
     */
    getDeviceHealth() {
        // Simplified - in production, get actual device metrics
        return {
            batteryLevel: 85,
            memoryUsage: 45,
            cpuUsage: 30,
            temperature: 28,
            signalStrength: -65
        };
    }

    /**
     * Update quality metrics
     */
    updateMetrics(isValid) {
        this.qualityMetrics.totalEvents++;
        if (isValid) {
            this.qualityMetrics.passedEvents++;
        } else {
            this.qualityMetrics.failedEvents++;
        }
    }

    /**
     * Get current quality metrics
     */
    getQualityMetrics() {
        const passRate = this.qualityMetrics.totalEvents > 0 
            ? (this.qualityMetrics.passedEvents / this.qualityMetrics.totalEvents) * 100 
            : 0;

        return {
            ...this.qualityMetrics,
            passRate: passRate.toFixed(2),
            duplicateRate: this.qualityMetrics.totalEvents > 0 
                ? ((this.qualityMetrics.duplicates / this.qualityMetrics.totalEvents) * 100).toFixed(2)
                : 0
        };
    }

    /**
     * Reset quality metrics (call daily)
     */
    resetMetrics() {
        this.qualityMetrics = {
            totalEvents: 0,
            passedEvents: 0,
            failedEvents: 0,
            duplicates: 0,
            schemaViolations: 0,
            missingFields: 0
        };
    }
}

/**
 * Edge Device Buffer for offline data collection
 */
class EdgeDeviceBuffer {
    constructor(maxSize = 1000) {
        this.buffer = [];
        this.maxSize = maxSize;
        this.failedTransmissions = [];
    }

    /**
     * Add event to buffer
     */
    addEvent(event, validationResult) {
        if (this.buffer.length >= this.maxSize) {
            // Remove oldest event
            this.buffer.shift();
        }

        this.buffer.push({
            event,
            validationResult,
            bufferedAt: Date.now(),
            retryCount: 0
        });
    }

    /**
     * Get events ready for transmission
     */
    getEventsForTransmission(batchSize = 100) {
        const events = this.buffer
            .filter(item => item.validationResult.isValid)
            .slice(0, batchSize);
        
        return events;
    }

    /**
     * Mark events as transmitted
     */
    markTransmitted(eventIds) {
        this.buffer = this.buffer.filter(item => 
            !eventIds.includes(item.event.eventId)
        );
    }

    /**
     * Mark transmission failure
     */
    markFailed(eventId, error) {
        const item = this.buffer.find(item => item.event.eventId === eventId);
        if (item) {
            item.retryCount++;
            item.lastError = error;
            
            // Move to failed queue after 3 retries
            if (item.retryCount >= 3) {
                this.failedTransmissions.push(item);
                this.buffer = this.buffer.filter(i => i.event.eventId !== eventId);
            }
        }
    }

    /**
     * Get buffer statistics
     */
    getStats() {
        return {
            bufferSize: this.buffer.length,
            failedCount: this.failedTransmissions.length,
            oldestEvent: this.buffer.length > 0 
                ? new Date(this.buffer[0].bufferedAt).toISOString() 
                : null,
            avgRetryCount: this.buffer.reduce((sum, item) => sum + item.retryCount, 0) / (this.buffer.length || 1)
        };
    }
}

// Export for use in edge devices
module.exports = {
    EdgeDeviceQualityChecker,
    EdgeDeviceBuffer
};

// Example usage on edge device
if (require.main === module) {
    const checker = new EdgeDeviceQualityChecker('EDGE_001', '2.1.0');
    const buffer = new EdgeDeviceBuffer();

    // Sample event
    const event = {
        eventId: 'evt_' + Date.now(),
        timestamp: new Date().toISOString(),
        storeId: 'STORE_001',
        deviceId: 'EDGE_001',
        eventType: 'customer_interaction',
        deviceAuth: {
            token: 'sample_auth_token_1234567890'
        },
        data: {
            customerPhone: '09171234567',
            transcript: 'I want to buy Del Monte pineapple juice',
            transcriptConfidence: 0.92,
            items: ['DM001'],
            totalAmount: 35.00
        },
        location: {
            latitude: 14.5547,
            longitude: 121.0244
        }
    };

    // Validate event
    const result = checker.validateEvent(event);
    console.log('Validation Result:', JSON.stringify(result, null, 2));

    // Add to buffer if valid
    if (result.isValid) {
        buffer.addEvent(event, result);
        console.log('Event added to buffer');
    }

    // Get quality metrics
    console.log('Quality Metrics:', checker.getQualityMetrics());
    console.log('Buffer Stats:', buffer.getStats());
}