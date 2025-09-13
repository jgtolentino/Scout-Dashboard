/**
 * SQL Queries for Scout DLT Pipeline Dashboard
 * 
 * This module contains all SQL queries needed to fetch data from the Scout DLT Pipeline
 * to power the TBWA Client 360 Dashboard.
 */

// Helper to build WHERE clause based on filter parameters
const buildWhereClause = (filters) => {
    const conditions = [];
    
    // Date range filter
    if (filters.lookback) {
        conditions.push(`date_trunc('day', timestamp) >= current_date - interval '${filters.lookback} days'`);
    }
    
    // Region filter
    if (filters.region && filters.region !== 'all') {
        conditions.push(`region_name = '${filters.region}'`);
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
        conditions.push(`category_name = '${filters.category}'`);
    }
    
    // Brand filter
    if (filters.brand && filters.brand !== 'all') {
        conditions.push(`brand_name = '${filters.brand}'`);
    }
    
    // Channel filter
    if (filters.channel && filters.channel !== 'all') {
        conditions.push(`channel_name = '${filters.channel}'`);
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

// KPI Queries
const getKPIs = `
    SELECT
        -- Total Sales
        SUM(sales_amount) AS total_sales,
        (SUM(sales_amount) - LAG(SUM(sales_amount)) OVER (ORDER BY date_trunc('month', current_date))) / 
        LAG(SUM(sales_amount)) OVER (ORDER BY date_trunc('month', current_date)) * 100 AS sales_change,
        
        -- Conversion Rate
        AVG(conversion_rate) AS conversion_rate,
        (AVG(conversion_rate) - LAG(AVG(conversion_rate)) OVER (ORDER BY date_trunc('month', current_date))) / 
        LAG(AVG(conversion_rate)) OVER (ORDER BY date_trunc('month', current_date)) * 100 AS conversion_change,
        
        -- Marketing ROI
        AVG(marketing_roi) AS marketing_roi,
        (AVG(marketing_roi) - LAG(AVG(marketing_roi)) OVER (ORDER BY date_trunc('month', current_date))) AS roi_change,
        
        -- Brand Sentiment
        AVG(sentiment_score) * 100 AS brand_sentiment,
        (AVG(sentiment_score) - LAG(AVG(sentiment_score)) OVER (ORDER BY date_trunc('month', current_date))) * 100 AS sentiment_change
    FROM gold_store_interaction_metrics gm
    JOIN gold_transcript_sentiment_analysis gs ON gm.store_id = gs.store_id AND gm.window_start = gs.window_start
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY date_trunc('month', current_date)
    ORDER BY date_trunc('month', current_date) DESC
    LIMIT 1;
`;

// Brand Performance Query
const getBrandPerformance = `
    SELECT
        b.brand_name,
        AVG(b.mention_score) * 100 AS performance_score
    FROM platinum_brand_insights b
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', channel: '$4'})}
    GROUP BY b.brand_name
    ORDER BY performance_score DESC
    LIMIT 10;
`;

// Competitor Analysis Query
const getCompetitorAnalysis = `
    SELECT
        AVG(market_share) * 100 AS market_share,
        AVG(market_share_target) * 100 AS market_share_target,
        CASE WHEN AVG(market_share) < AVG(market_share_target) THEN true ELSE false END AS market_share_attention,
        
        AVG(brand_recognition) * 100 AS brand_recognition,
        AVG(brand_recognition_target) * 100 AS brand_recognition_target,
        CASE WHEN AVG(brand_recognition) < AVG(brand_recognition_target) THEN true ELSE false END AS brand_recognition_attention,
        
        AVG(customer_satisfaction) * 100 AS customer_satisfaction,
        AVG(customer_satisfaction_target) * 100 AS customer_satisfaction_target,
        CASE WHEN AVG(customer_satisfaction) < AVG(customer_satisfaction_target) THEN true ELSE false END AS customer_satisfaction_attention
    FROM platinum_market_metrics
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', channel: '$4'})}
    LIMIT 1;
`;

// Retail Performance Query
const getRetailPerformance = `
    -- Total row
    SELECT
        'Total' AS region_name,
        SUM(sales_amount) AS sales_value,
        NULL AS sales_change,
        to_json(ARRAY[
            AVG(CASE WHEN extract(month from window_start) = 1 THEN sales_amount ELSE NULL END),
            AVG(CASE WHEN extract(month from window_start) = 2 THEN sales_amount ELSE NULL END),
            AVG(CASE WHEN extract(month from window_start) = 3 THEN sales_amount ELSE NULL END),
            AVG(CASE WHEN extract(month from window_start) = 4 THEN sales_amount ELSE NULL END),
            AVG(CASE WHEN extract(month from window_start) = 5 THEN sales_amount ELSE NULL END),
            AVG(CASE WHEN extract(month from window_start) = 6 THEN sales_amount ELSE NULL END)
        ]) AS trend
    FROM gold_store_interaction_metrics g
    JOIN store_metadata s ON g.store_id = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    -- Region breakdown
    SELECT
        s.region_name,
        SUM(g.sales_amount) AS sales_value,
        (SUM(g.sales_amount) - LAG(SUM(g.sales_amount)) OVER (PARTITION BY s.region_name ORDER BY date_trunc('month', g.window_start))) / 
        LAG(SUM(g.sales_amount)) OVER (PARTITION BY s.region_name ORDER BY date_trunc('month', g.window_start)) * 100 AS sales_change,
        NULL AS trend
    FROM gold_store_interaction_metrics g
    JOIN store_metadata s ON g.store_id = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY s.region_name, date_trunc('month', g.window_start)
    ORDER BY date_trunc('month', g.window_start) DESC, sales_value DESC
    LIMIT 5;
`;

// Marketing ROI Query
const getMarketingROI = `
    -- Overall ROI
    SELECT
        'Overall' AS channel_name,
        AVG(roi_value) AS roi_value,
        NULL AS roi_change
    FROM platinum_marketing_roi
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    -- Channel breakdown
    SELECT
        channel_name,
        AVG(roi_value) AS roi_value,
        (AVG(roi_value) - LAG(AVG(roi_value)) OVER (PARTITION BY channel_name ORDER BY date_trunc('month', timestamp))) AS roi_change
    FROM platinum_marketing_roi
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY channel_name, date_trunc('month', timestamp)
    ORDER BY date_trunc('month', timestamp) DESC, roi_value DESC
    LIMIT 5;
`;

// Insights Query
const getInsights = `
    -- Recommendations
    SELECT
        'recommendation' AS insight_type,
        insight_text,
        NULL AS top_brands,
        NULL AS brand_associations,
        NULL AS peak_time,
        NULL AS contextual_insights,
        NULL AS products,
        NULL AS correlation,
        NULL AS potential_increase
    FROM platinum_insight_recommendations
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    ORDER BY confidence_score DESC
    LIMIT 3
    
    UNION ALL
    
    -- Brand Dictionary
    SELECT
        'brand_dictionary' AS insight_type,
        NULL AS insight_text,
        to_json(ARRAY(
            SELECT brand_name 
            FROM platinum_brand_insights 
            WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
            ORDER BY mention_count DESC 
            LIMIT 3
        )) AS top_brands,
        to_json(ARRAY(
            SELECT json_build_object('brand', brand_name, 'association', association)
            FROM platinum_brand_associations
            WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
            ORDER BY association_strength DESC
            LIMIT 2
        )) AS brand_associations,
        NULL AS peak_time,
        NULL AS contextual_insights,
        NULL AS products,
        NULL AS correlation,
        NULL AS potential_increase
    FROM platinum_brand_insights
    WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
    LIMIT 1
    
    UNION ALL
    
    -- Emotional Analysis
    SELECT
        'emotional_analysis' AS insight_type,
        NULL AS insight_text,
        NULL AS top_brands,
        NULL AS brand_associations,
        peak_purchase_time AS peak_time,
        to_json(ARRAY(
            SELECT contextual_insight
            FROM platinum_contextual_insights
            WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
            ORDER BY confidence_score DESC
            LIMIT 2
        )) AS contextual_insights,
        NULL AS products,
        NULL AS correlation,
        NULL AS potential_increase
    FROM platinum_customer_behavior
    WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
    LIMIT 1
    
    UNION ALL
    
    -- Bundling Opportunities
    SELECT
        'bundling' AS insight_type,
        NULL AS insight_text,
        NULL AS top_brands,
        NULL AS brand_associations,
        NULL AS peak_time,
        NULL AS contextual_insights,
        to_json(ARRAY[product1, product2]) AS products,
        correlation_percentage AS correlation,
        estimated_basket_increase AS potential_increase
    FROM platinum_bundling_opportunities
    WHERE date_trunc('day', timestamp) >= current_date - interval '$1 days'
    ORDER BY correlation_percentage DESC
    LIMIT 1;
`;

// Sales Drill Down Query
const getSalesDrillDown = `
    SELECT
        s.region_name,
        SUM(g.sales_amount) AS value,
        SUM(g.sales_amount) / SUM(SUM(g.sales_amount)) OVER () * 100 AS percentage,
        (SUM(g.sales_amount) - LAG(SUM(g.sales_amount)) OVER (PARTITION BY s.region_name ORDER BY date_trunc('month', g.window_start))) / 
        LAG(SUM(g.sales_amount)) OVER (PARTITION BY s.region_name ORDER BY date_trunc('month', g.window_start)) * 100 AS change
    FROM gold_store_interaction_metrics g
    JOIN store_metadata s ON g.store_id = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY s.region_name, date_trunc('month', g.window_start)
    ORDER BY date_trunc('month', g.window_start) DESC, value DESC
    LIMIT 5;
`;

// Conversion Drill Down Query
const getConversionDrillDown = `
    -- Funnel data
    SELECT
        'Store Visits' AS stage,
        SUM(total_interactions) AS value,
        100 AS percentage
    FROM gold_store_interaction_metrics
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    SELECT
        'Product Interactions' AS stage,
        SUM(browsing_count) AS value,
        SUM(browsing_count) * 100.0 / SUM(total_interactions) AS percentage
    FROM gold_store_interaction_metrics
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    SELECT
        'Basket Additions' AS stage,
        SUM(purchase_intent_count) AS value,
        SUM(purchase_intent_count) * 100.0 / SUM(total_interactions) AS percentage
    FROM gold_store_interaction_metrics
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    SELECT
        'Purchases' AS stage,
        SUM(checkout_count) AS value,
        SUM(checkout_count) * 100.0 / SUM(total_interactions) AS percentage
    FROM gold_store_interaction_metrics
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    
    UNION ALL
    
    -- Store type conversion rates
    SELECT
        store_type AS stage,
        NULL AS value,
        AVG(checkout_conversion_rate) * 100 AS percentage
    FROM gold_store_interaction_metrics g
    JOIN store_metadata s ON g.store_id = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY store_type
    ORDER BY store_type;
`;

// ROI Drill Down Query
const getROIDrillDown = `
    -- Channel breakdown
    SELECT
        channel_name,
        SUM(marketing_spend) AS investment,
        SUM(attributed_revenue) AS revenue,
        AVG(roi_value) AS roi,
        (AVG(roi_value) - LAG(AVG(roi_value)) OVER (PARTITION BY channel_name ORDER BY date_trunc('month', timestamp))) AS change
    FROM platinum_marketing_roi
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4'})}
    GROUP BY channel_name, date_trunc('month', timestamp)
    ORDER BY date_trunc('month', timestamp) DESC, roi DESC
    LIMIT 5;
`;

// Sentiment Drill Down Query
const getSentimentDrillDown = `
    -- Sentiment trend
    SELECT
        to_char(window_start, 'Mon') AS month,
        AVG(positive_rate) * 100 AS positive,
        AVG(neutral_count) * 100.0 / AVG(total_transcripts) AS neutral,
        AVG(negative_rate) * 100 AS negative
    FROM gold_transcript_sentiment_analysis
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY to_char(window_start, 'Mon'), date_part('month', window_start)
    ORDER BY date_part('month', window_start)
    LIMIT 6;
`;

// Transaction Metrics Query
const getTransactionMetrics = `
    SELECT
        AVG(si.TransactionDuration) AS avg_transaction_duration,
        AVG(si.ProductCount) AS avg_product_count,
        AVG(si.BasketValue) AS avg_basket_value,
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN si.TransactionCompleted = true THEN 1 END) * 100.0 / COUNT(*) AS completion_rate,
        AVG(si.DwellTimeSeconds) AS avg_dwell_time,
        COUNT(DISTINCT si.SessionID) AS unique_sessions
    FROM dbo.SalesInteractions si
    JOIN store_metadata s ON si.StoreID = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    WHERE si.InteractionTimestamp >= current_date - interval '$1 days';
`;

// Product Substitutions Query
const getProductSubstitutions = `
    SELECT
        p.ProductName AS original_product,
        ps.ProductName AS substitution_product,
        COUNT(*) AS substitution_count,
        SUM(tp.Quantity) AS total_quantity,
        STRING_AGG(DISTINCT tp.SubstitutionReason, ', ') AS common_reasons
    FROM dbo.TransactionProducts tp
    JOIN dbo.Products p ON tp.OriginalProductID = p.ProductID
    JOIN dbo.Products ps ON tp.ProductID = ps.ProductID
    JOIN dbo.SalesInteractions si ON tp.InteractionID = si.InteractionID
    JOIN store_metadata s ON si.StoreID = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    WHERE tp.IsSubstitution = true
      AND si.InteractionTimestamp >= current_date - interval '$1 days'
    GROUP BY p.ProductName, ps.ProductName
    ORDER BY substitution_count DESC
    LIMIT 10;
`;

// Request Patterns Query
const getRequestPatterns = `
    SELECT
        rp.RequestCategory,
        rp.RequestType,
        COUNT(*) AS request_count,
        AVG(rp.RequestFrequency) AS avg_frequency,
        STRING_AGG(DISTINCT rp.RegionalAssociation, ', ') AS regions,
        to_json(ARRAY[
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 0 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 1 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 2 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 3 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 4 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 5 THEN 1 END),
            COUNT(CASE WHEN EXTRACT(DOW FROM si.InteractionTimestamp) = 6 THEN 1 END)
        ]) AS day_distribution
    FROM dbo.RequestPatterns rp
    JOIN dbo.SalesInteractions si ON rp.InteractionID = si.InteractionID
    JOIN store_metadata s ON si.StoreID = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    WHERE si.InteractionTimestamp >= current_date - interval '$1 days'
    GROUP BY rp.RequestCategory, rp.RequestType
    ORDER BY request_count DESC
    LIMIT 10;
`;

// Unbranded Items Query
const getUnbrandedItems = `
    SELECT
        ui.ItemDescription,
        ui.CategoryAssociation,
        COUNT(*) AS occurrence_count,
        SUM(ui.Quantity) AS total_quantity,
        AVG(ui.RecognitionConfidence) AS avg_confidence,
        COUNT(DISTINCT si.SessionID) AS unique_sessions
    FROM dbo.UnbrandedItems ui
    JOIN dbo.SalesInteractions si ON ui.InteractionID = si.InteractionID
    JOIN store_metadata s ON si.StoreID = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    WHERE si.InteractionTimestamp >= current_date - interval '$1 days'
    GROUP BY ui.ItemDescription, ui.CategoryAssociation
    ORDER BY occurrence_count DESC
    LIMIT 15;
`;

// Customer Expressions Query
const getCustomerExpressions = `
    SELECT
        json_array_elements_text(si.CustomerExpressions) AS expression,
        COUNT(*) AS expression_count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo.SalesInteractions 
                            WHERE CustomerExpressions IS NOT NULL
                            AND InteractionTimestamp >= current_date - interval '$1 days') AS percentage
    FROM dbo.SalesInteractions si
    JOIN store_metadata s ON si.StoreID = s.store_id
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    WHERE si.CustomerExpressions IS NOT NULL
      AND si.InteractionTimestamp >= current_date - interval '$1 days'
    GROUP BY expression
    ORDER BY expression_count DESC;
`;

// SQL queries module
module.exports = {
    getKPIs,
    getBrandPerformance,
    getCompetitorAnalysis,
    getRetailPerformance,
    getMarketingROI,
    getInsights,
    getSalesDrillDown,
    getConversionDrillDown,
    getROIDrillDown,
    getSentimentDrillDown,
    // Sari-Sari store transaction metrics queries
    getTransactionMetrics,
    getProductSubstitutions,
    getRequestPatterns,
    getUnbrandedItems,
    getCustomerExpressions
};