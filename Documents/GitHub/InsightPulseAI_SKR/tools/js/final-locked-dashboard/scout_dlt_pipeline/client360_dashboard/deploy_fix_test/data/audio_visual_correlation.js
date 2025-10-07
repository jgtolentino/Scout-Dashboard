/**
 * Scout DLT Pipeline - Audio-Visual Correlation Engine
 * 
 * Integrates and correlates speech-to-text data with visual detection data
 * to create a unified view of customer interactions in Sari-Sari stores.
 * Enables enhanced transaction metrics extraction and multimodal analysis.
 */

const { pool } = require('./db_connector');
const nlp = require('./nlp_processor');
const vision = require('./vision_processor');

/**
 * Correlates audio (STT) and visual data for a given session to provide
 * enhanced transaction metrics, focusing on Sari-Sari store interactions
 * 
 * @param {string} sessionId - The session ID to correlate
 * @returns {Promise<Object>} Correlation results with transaction metrics
 */
async function correlateAudioVisual(sessionId) {
    try {
        // Get all speech transcript events for this session
        const sttData = await fetchSpeechData(sessionId);
        
        // Get all visual detection events for this session
        const visualData = await fetchVisualData(sessionId);
        
        // Skip if either data source is missing
        if (!sttData.length || !visualData.length) {
            console.log(`Insufficient data for correlation in session ${sessionId}`);
            return {
                success: false,
                error: 'Insufficient data for correlation'
            };
        }
        
        // Perform correlation analysis
        const correlationResults = performCorrelation(sttData, visualData);
        
        // Extract transaction metrics
        const transactionMetrics = extractTransactionMetrics(correlationResults);
        
        // Save results to database
        await saveCorrelationResults(sessionId, correlationResults, transactionMetrics);
        
        return {
            success: true,
            sessionId,
            transactionMetrics,
            correlationEvents: correlationResults.events.length
        };
    } catch (error) {
        console.error(`Error correlating audio-visual data for session ${sessionId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fetches speech transcript data for a given session
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of speech transcript events
 */
async function fetchSpeechData(sessionId) {
    const result = await pool.query(
        `SELECT sit.TranscriptID, sit.InteractionID, si.InteractionTimestamp, 
         sit.TranscriptText, sit.TranscriptConfidence, si.DeviceID, si.StoreID
         FROM dbo.SalesInteractionTranscripts sit
         JOIN dbo.SalesInteractions si ON sit.InteractionID = si.InteractionID
         WHERE si.SessionID = $1
         ORDER BY si.InteractionTimestamp`,
        [sessionId]
    );
    
    return result.rows;
}

/**
 * Fetches visual detection data for a given session
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of visual detection events
 */
async function fetchVisualData(sessionId) {
    const result = await pool.query(
        `SELECT vd.DetectionID, vd.InteractionID, si.InteractionTimestamp,
         vd.DetectionType, vd.Confidence, vd.BoundingBox, vd.ZoneID,
         vd.ObjectClass, si.DeviceID, si.StoreID
         FROM dbo.bronze_vision_detections vd
         JOIN dbo.SalesInteractions si ON vd.InteractionID = si.InteractionID
         WHERE si.SessionID = $1
         ORDER BY si.InteractionTimestamp`,
        [sessionId]
    );
    
    return result.rows;
}

/**
 * Performs correlation between speech and visual data
 * 
 * @param {Array} sttData - Speech transcript events
 * @param {Array} visualData - Visual detection events
 * @returns {Object} Correlation results
 */
function performCorrelation(sttData, visualData) {
    const events = [];
    const products = new Map();
    let dwell = 0;
    let completed = false;
    
    // Compute time windows for correlation using timestamp proximity
    const timeWindows = computeTimeWindows(sttData, visualData);
    
    // Create correlated events by time window
    timeWindows.forEach(window => {
        const correlatedEvent = {
            timestamp: window.centerTime,
            speech: window.speechEvents,
            visual: window.visualEvents,
            products: [],
            correlationScore: calculateCorrelationScore(window)
        };
        
        // Extract products from visual detections
        window.visualEvents.forEach(visual => {
            if (visual.DetectionType === 'product' && visual.ObjectClass) {
                // Add to this event's products
                correlatedEvent.products.push({
                    productClass: visual.ObjectClass,
                    confidence: visual.Confidence,
                    zone: visual.ZoneID
                });
                
                // Track in overall products map
                if (products.has(visual.ObjectClass)) {
                    products.set(visual.ObjectClass, products.get(visual.ObjectClass) + 1);
                } else {
                    products.set(visual.ObjectClass, 1);
                }
            }
        });
        
        // Calculate dwell time from visual detections
        if (window.visualEvents.length > 0) {
            // Filter to face detections with dwell time
            const faceDwells = window.visualEvents
                .filter(v => v.DetectionType === 'face' && v.DwellTime)
                .map(v => parseFloat(v.DwellTime) || 0);
                
            if (faceDwells.length > 0) {
                // Use max dwell time from this window
                const windowDwell = Math.max(...faceDwells);
                dwell = Math.max(dwell, windowDwell);
            }
        }
        
        // Check for transaction completion signals in speech
        window.speechEvents.forEach(speech => {
            if (speech.TranscriptText && 
                (speech.TranscriptText.toLowerCase().includes('thank you') || 
                 speech.TranscriptText.toLowerCase().includes('salamat') ||
                 speech.TranscriptText.toLowerCase().includes('bayad'))) {
                completed = true;
            }
        });
        
        events.push(correlatedEvent);
    });
    
    // Calculate basket value from product detections
    // This would normally fetch prices from a product database
    const basketValue = calculateBasketValue(products);
    
    return {
        events,
        metrics: {
            productCount: products.size,
            productQuantities: Array.from(products.entries()),
            dwell: dwell,
            completed: completed,
            basketValue: basketValue
        }
    };
}

/**
 * Computes time windows for correlating speech and visual events
 * 
 * @param {Array} sttData - Speech transcript events
 * @param {Array} visualData - Visual detection events
 * @returns {Array} Time windows with associated events
 */
function computeTimeWindows(sttData, visualData) {
    const windows = [];
    const allTimestamps = [
        ...sttData.map(e => ({ time: new Date(e.InteractionTimestamp), type: 'speech' })),
        ...visualData.map(e => ({ time: new Date(e.InteractionTimestamp), type: 'visual' }))
    ].sort((a, b) => a.time - b.time);
    
    // Use a sliding window approach with 2-second windows
    const WINDOW_SIZE_MS = 2000;
    
    for (let i = 0; i < allTimestamps.length; i++) {
        const centerTime = allTimestamps[i].time;
        const windowStart = new Date(centerTime.getTime() - WINDOW_SIZE_MS/2);
        const windowEnd = new Date(centerTime.getTime() + WINDOW_SIZE_MS/2);
        
        // Find all events in this window
        const speechEvents = sttData.filter(e => {
            const time = new Date(e.InteractionTimestamp);
            return time >= windowStart && time <= windowEnd;
        });
        
        const visualEvents = visualData.filter(e => {
            const time = new Date(e.InteractionTimestamp);
            return time >= windowStart && time <= windowEnd;
        });
        
        // Only create windows that have both speech and visual events
        if (speechEvents.length > 0 && visualEvents.length > 0) {
            windows.push({
                centerTime,
                windowStart,
                windowEnd,
                speechEvents,
                visualEvents
            });
        }
    }
    
    // Merge overlapping windows
    return mergeOverlappingWindows(windows);
}

/**
 * Merges overlapping time windows
 * 
 * @param {Array} windows - Time windows to merge
 * @returns {Array} Merged time windows
 */
function mergeOverlappingWindows(windows) {
    if (windows.length <= 1) return windows;
    
    windows.sort((a, b) => a.windowStart - b.windowStart);
    
    const merged = [windows[0]];
    
    for (let i = 1; i < windows.length; i++) {
        const current = windows[i];
        const previous = merged[merged.length - 1];
        
        if (current.windowStart <= previous.windowEnd) {
            // Merge windows
            previous.windowEnd = new Date(Math.max(previous.windowEnd, current.windowEnd));
            previous.centerTime = new Date((previous.windowStart.getTime() + previous.windowEnd.getTime()) / 2);
            
            // Merge speech events (avoiding duplicates)
            const speechIds = new Set(previous.speechEvents.map(e => e.TranscriptID));
            current.speechEvents.forEach(e => {
                if (!speechIds.has(e.TranscriptID)) {
                    previous.speechEvents.push(e);
                    speechIds.add(e.TranscriptID);
                }
            });
            
            // Merge visual events (avoiding duplicates)
            const visualIds = new Set(previous.visualEvents.map(e => e.DetectionID));
            current.visualEvents.forEach(e => {
                if (!visualIds.has(e.DetectionID)) {
                    previous.visualEvents.push(e);
                    visualIds.add(e.DetectionID);
                }
            });
        } else {
            merged.push(current);
        }
    }
    
    return merged;
}

/**
 * Calculates correlation score for a time window based on event alignment
 * 
 * @param {Object} window - Time window with events
 * @returns {number} Correlation score (0-1)
 */
function calculateCorrelationScore(window) {
    // Base alignment score
    let score = 0.5;
    
    // Better score if there are multiple of each type of event
    if (window.speechEvents.length > 1 && window.visualEvents.length > 1) {
        score += 0.2;
    }
    
    // Analyze speech for product mentions
    const allText = window.speechEvents.map(e => e.TranscriptText).join(' ');
    const productMentions = nlp.extractProductMentions(allText);
    
    // Look for product visual detections
    const productDetections = window.visualEvents
        .filter(v => v.DetectionType === 'product')
        .map(v => v.ObjectClass);
    
    // Bonus for speech-visual product alignment
    if (productMentions.length > 0 && productDetections.length > 0) {
        // Check for any matching products between speech and visual
        const matches = productMentions.some(mention => 
            productDetections.some(detection => 
                detection.toLowerCase().includes(mention.toLowerCase())
            )
        );
        
        if (matches) {
            score += 0.3;
        }
    }
    
    return Math.min(1, score);
}

/**
 * Extracts transaction metrics from correlation results
 * 
 * @param {Object} correlationResults - Results from correlation
 * @returns {Object} Transaction metrics
 */
function extractTransactionMetrics(correlationResults) {
    const { events, metrics } = correlationResults;
    
    // Calculate session length (first to last event timestamp)
    let sessionStart = null;
    let sessionEnd = null;
    
    if (events.length > 0) {
        sessionStart = events[0].timestamp;
        sessionEnd = events[events.length - 1].timestamp;
    }
    
    const sessionDuration = sessionStart && sessionEnd
        ? Math.round((sessionEnd - sessionStart) / 1000) // in seconds
        : 0;
    
    return {
        transactionDuration: sessionDuration,
        productCount: metrics.productCount,
        transactionCompleted: metrics.completed,
        dwellTimeSeconds: Math.round(metrics.dwell),
        basketValue: metrics.basketValue,
        productQuantities: Object.fromEntries(metrics.productQuantities)
    };
}

/**
 * Calculates basket value from product quantities
 * Would normally involve database lookup for real product prices
 * 
 * @param {Map} productMap - Map of product name to quantity
 * @returns {number} Estimated basket value
 */
function calculateBasketValue(productMap) {
    // Mock price lookup function (in production, this would query a database)
    function getProductPrice(productName) {
        // Map common Sari-Sari products to typical prices (in PHP)
        const priceMap = {
            'milo_sachet': 8.0,
            'coke_can': 45.0,
            'tide_sachet': 10.0,
            'smart_card': 50.0,
            'nestle_cream': 30.0,
            'colgate': 20.0,
            'lucky_me_pancit_canton': 15.0,
            'sprite_bottle': 38.0,
            'clover_chips': 10.0,
            'nescafe_3in1_box': 75.0,
            'gardenia_loaf': 65.0,
            'eden_cheese': 45.0
        };
        
        // Try to match the product name to the price map
        const productKey = Object.keys(priceMap).find(key => 
            productName.toLowerCase().includes(key.toLowerCase())
        );
        
        return productKey ? priceMap[productKey] : 15.0; // Default price if unknown
    }
    
    // Calculate total basket value
    let total = 0;
    productMap.forEach((quantity, product) => {
        const price = getProductPrice(product);
        total += price * quantity;
    });
    
    return total;
}

/**
 * Saves correlation results to the database
 * 
 * @param {string} sessionId - The session ID
 * @param {Object} correlationResults - Results from correlation
 * @param {Object} transactionMetrics - Extracted transaction metrics
 * @returns {Promise<void>}
 */
async function saveCorrelationResults(sessionId, correlationResults, transactionMetrics) {
    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // Update SalesInteractions with transaction metrics
        await pool.query(
            `UPDATE dbo.SalesInteractions
             SET TransactionDuration = $1,
                 ProductCount = $2,
                 BasketValue = $3,
                 TransactionCompleted = $4,
                 DwellTimeSeconds = $5
             WHERE SessionID = $6`,
            [
                transactionMetrics.transactionDuration,
                transactionMetrics.productCount,
                transactionMetrics.basketValue,
                transactionMetrics.transactionCompleted,
                transactionMetrics.dwellTimeSeconds,
                sessionId
            ]
        );
        
        // Get the InteractionID for this session
        const interactionResult = await pool.query(
            `SELECT InteractionID FROM dbo.SalesInteractions
             WHERE SessionID = $1 LIMIT 1`,
            [sessionId]
        );
        
        if (interactionResult.rows.length > 0) {
            const interactionId = interactionResult.rows[0].InteractionID;
            
            // Insert into TransactionProducts table
            for (const [product, quantity] of correlationResults.metrics.productQuantities) {
                // Get ProductID by product name (in production we'd have a proper product name to ID mapping)
                const productResult = await pool.query(
                    `SELECT ProductID FROM dbo.Products
                     WHERE ProductName LIKE $1 LIMIT 1`,
                    [`%${product}%`]
                );
                
                if (productResult.rows.length > 0) {
                    const productId = productResult.rows[0].ProductID;
                    
                    // Insert product with quantity
                    await pool.query(
                        `INSERT INTO dbo.TransactionProducts
                         (InteractionID, ProductID, Quantity)
                         VALUES ($1, $2, $3)`,
                        [interactionId, productId, quantity]
                    );
                } else {
                    // Handle unbranded or unknown product
                    await pool.query(
                        `INSERT INTO dbo.UnbrandedItems
                         (InteractionID, ItemDescription, Quantity)
                         VALUES ($1, $2, $3)`,
                        [interactionId, product, quantity]
                    );
                }
            }
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error saving correlation results:', error);
        throw error;
    }
}

module.exports = {
    correlateAudioVisual,
    extractTransactionMetrics
};