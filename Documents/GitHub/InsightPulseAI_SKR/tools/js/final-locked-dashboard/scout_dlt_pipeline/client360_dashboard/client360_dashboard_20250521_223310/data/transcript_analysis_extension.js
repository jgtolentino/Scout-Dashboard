/**
 * Scout DLT Pipeline - Transcript Analysis Extension
 * 
 * Enhanced NLP processing for Sari-Sari store interactions
 * Provides advanced analysis of customer requests, product mentions,
 * and transaction patterns in Tagalog/Filipino speech.
 */

const { pool } = require('./db_connector');
const nlp = require('./nlp_processor');

/**
 * Analyzes a transcript to identify request patterns and product mentions
 * including unbranded items. Uses Filipino language specific patterns.
 * 
 * @param {string} transcript - The transcript text to analyze
 * @param {string} sessionId - The session ID for correlation
 * @param {number} interactionId - The interaction ID from the database
 * @returns {Promise<Object>} Analysis results with request patterns and product mentions
 */
async function analyzeTranscript(transcript, sessionId, interactionId) {
    if (!transcript || !sessionId || !interactionId) {
        throw new Error('Missing required parameters for transcript analysis');
    }

    try {
        // Process transcript for Filipino language patterns
        const processedText = nlp.preprocessTagalog(transcript);
        
        // Extract request patterns (using Filipino language specific rules)
        const requestPatterns = extractRequestPatterns(processedText);
        
        // Extract product mentions, including unbranded items
        const productMentions = extractProductMentions(processedText);
        
        // Extract customer expressions (emotions, intent)
        const customerExpressions = extractCustomerExpressions(processedText);
        
        // Save analysis results to database
        await saveAnalysisResults(interactionId, requestPatterns, productMentions, customerExpressions);
        
        return {
            requestPatterns,
            productMentions,
            customerExpressions
        };
    } catch (error) {
        console.error(`Error analyzing transcript for session ${sessionId}:`, error);
        throw error;
    }
}

/**
 * Extracts request patterns from transcript text, focusing on Filipino/Tagalog patterns
 * 
 * @param {string} text - Preprocessed transcript text
 * @returns {Array<Object>} Identified request patterns
 */
function extractRequestPatterns(text) {
    const patterns = [];
    
    // Price inquiry patterns
    if (text.match(/magkano|presyo|halaga|how much/i)) {
        patterns.push({
            requestType: 'PriceInquiry',
            requestCategory: 'FinancialQuery',
            confidence: 0.9
        });
    }
    
    // Product availability patterns
    if (text.match(/may|meron ba|mayroon pa ba|available pa ba|may stock pa ba/i)) {
        patterns.push({
            requestType: 'ProductAvailability',
            requestCategory: 'InformationSeeking',
            confidence: 0.85
        });
    }
    
    // Product substitution patterns
    if (text.match(/wala na ba|out of stock|replacement|kapalit|substitute|iba na lang/i)) {
        patterns.push({
            requestType: 'ProductSubstitution',
            requestCategory: 'ProductExploration',
            confidence: 0.8
        });
    }
    
    // Mobile load patterns
    if (text.match(/load|pa-load|share a load|pasaload|panload|paloadan/i)) {
        patterns.push({
            requestType: 'MobileLoad',
            requestCategory: 'ServiceRequest',
            confidence: 0.95
        });
    }
    
    // Product recommendation patterns
    if (text.match(/ano (po)? (ang )?(maganda|masarap|mabilis|magaling|mura)|recommend|suggestion/i)) {
        patterns.push({
            requestType: 'Recommendation',
            requestCategory: 'Recommendation',
            confidence: 0.75
        });
    }
    
    // Credit request patterns ("utang" is Filipino for debt/credit)
    if (text.match(/utang|credit|lista|pagkatapos na lang|bayaran ko (na lang)? mamaya|isulat mo muna/i)) {
        patterns.push({
            requestType: 'CreditRequest',
            requestCategory: 'FinancialQuery',
            confidence: 0.9
        });
    }
    
    // Return or exchange patterns
    if (text.match(/palit|exchange|return|ibigay|sira|expired|mali|hindi gumagana/i)) {
        patterns.push({
            requestType: 'ReturnExchange',
            requestCategory: 'Complaint',
            confidence: 0.8
        });
    }
    
    return patterns;
}

/**
 * Extracts product mentions from transcript text, including unbranded items
 * 
 * @param {string} text - Preprocessed transcript text
 * @returns {Array<Object>} Identified product mentions
 */
function extractProductMentions(text) {
    const mentions = [];
    
    // Check for branded products
    const brandedProducts = nlp.extractEntities(text, ['PRODUCT', 'BRAND']);
    
    brandedProducts.forEach(product => {
        mentions.push({
            type: 'branded',
            name: product.text,
            confidence: product.confidence
        });
    });
    
    // Common unbranded items in Sari-Sari stores (Filipino terms)
    const unbrandedPatterns = [
        { pattern: /bigas|rice/i, category: 'Grains' },
        { pattern: /asukal|sugar/i, category: 'Condiments' },
        { pattern: /asin|salt/i, category: 'Condiments' },
        { pattern: /suka|vinegar/i, category: 'Condiments' },
        { pattern: /mantika|oil|cooking oil/i, category: 'Condiments' },
        { pattern: /sibuyas|onion/i, category: 'VegetablesFruits' },
        { pattern: /bawang|garlic/i, category: 'VegetablesFruits' },
        { pattern: /kamatis|tomato/i, category: 'VegetablesFruits' },
        { pattern: /itlog|egg/i, category: 'Others' },
        { pattern: /tinapay|bread/i, category: 'BreadPastries' },
        { pattern: /kendi|candy/i, category: 'Snacks' },
        { pattern: /gatas|milk/i, category: 'Beverages' },
        { pattern: /tubig|water/i, category: 'Beverages' },
        { pattern: /load|pa-load/i, category: 'MobileLoading' },
        { pattern: /kape|coffee/i, category: 'Beverages' },
        { pattern: /softdrinks|soda/i, category: 'Beverages' }
    ];
    
    unbrandedPatterns.forEach(item => {
        if (text.match(item.pattern)) {
            mentions.push({
                type: 'unbranded',
                name: item.pattern.source.split('|')[0], // Use first term as name
                category: item.category,
                confidence: 0.8
            });
        }
    });
    
    return mentions;
}

/**
 * Extracts customer expressions, emotions and intent from transcript
 * 
 * @param {string} text - Preprocessed transcript text
 * @returns {Array<string>} Identified customer expressions
 */
function extractCustomerExpressions(text) {
    const expressions = [];
    
    // Filipino/English expressions of satisfaction
    if (text.match(/masaya|happy|gaan ng loob|satisfied|okay na okay|napakaganda|thank you|salamat|maraming salamat/i)) {
        expressions.push('happy');
    }
    
    // Filipino/English expressions of confusion
    if (text.match(/confused|nalilito|di ko alam|hindi ko maintindihan|magulo|di ko gets/i)) {
        expressions.push('confused');
    }
    
    // Filipino/English expressions of disappointment
    if (text.match(/disappointed|sad|malungkot|sayang|hindi available|wala na pala/i)) {
        expressions.push('disappointed');
    }
    
    // Filipino/English expressions of surprise
    if (text.match(/surprised|nagulat|talaga|ganun ba|grabe|ang mahal pala/i)) {
        expressions.push('surprised');
    }
    
    // Filipino/English expressions of frustration/anger
    if (text.match(/angry|galit|inis|nakakainis|bakit ganun|grabe naman/i)) {
        expressions.push('angry');
    }
    
    return expressions;
}

/**
 * Saves transcript analysis results to the database
 * 
 * @param {number} interactionId - The interaction ID
 * @param {Array<Object>} requestPatterns - Request patterns identified
 * @param {Array<Object>} productMentions - Product mentions identified
 * @param {Array<string>} customerExpressions - Customer expressions identified
 * @returns {Promise<void>}
 */
async function saveAnalysisResults(interactionId, requestPatterns, productMentions, customerExpressions) {
    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // Save request patterns
        for (const pattern of requestPatterns) {
            await pool.query(
                `INSERT INTO dbo.RequestPatterns 
                 (InteractionID, RequestType, RequestCategory, RequestFrequency, TimeOfDay, DayOfWeek) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIME, EXTRACT(DOW FROM CURRENT_TIMESTAMP))`,
                [interactionId, pattern.requestType, pattern.requestCategory, 1]
            );
        }
        
        // Save unbranded product mentions
        for (const mention of productMentions) {
            if (mention.type === 'unbranded') {
                await pool.query(
                    `INSERT INTO dbo.UnbrandedItems 
                     (InteractionID, ItemDescription, CategoryAssociation, Quantity, RecognitionConfidence) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [interactionId, mention.name, mention.category, 1, mention.confidence]
                );
            }
        }
        
        // Save customer expressions as JSON
        if (customerExpressions.length > 0) {
            const expressionsJson = JSON.stringify(customerExpressions);
            await pool.query(
                `UPDATE dbo.SalesInteractions 
                 SET CustomerExpressions = $1
                 WHERE InteractionID = $2`,
                [expressionsJson, interactionId]
            );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error saving transcript analysis results:', error);
        throw error;
    }
}

module.exports = {
    analyzeTranscript,
    extractRequestPatterns,
    extractProductMentions,
    extractCustomerExpressions
};