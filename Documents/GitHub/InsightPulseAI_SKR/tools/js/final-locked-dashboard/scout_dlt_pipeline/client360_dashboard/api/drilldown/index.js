// Azure Function: Drill-Down data for KPI tiles
const { getInstance } = require('../shared/db');

module.exports = async function (context, req) {
  const kpi = req.query.kpi;
  
  if (!kpi) {
    context.res = { 
      status: 400, 
      body: { error: "Missing 'kpi' parameter" } 
    };
    return;
  }

  try {
    // Get database helper instance
    const dbHelper = getInstance();
    const dbConnector = await dbHelper.getConnector();
    
    // Map incoming kpi key to data retrieval methods
    let drilldownData;
    
    switch(kpi) {
      case 'total-sales':
        drilldownData = await getDrilldownSalesData(dbConnector);
        break;
      case 'transactions':
        drilldownData = await getDrilldownTransactionData(dbConnector);
        break;
      case 'brand-sentiment':
        drilldownData = await getDrilldownSentimentData(dbConnector);
        break;
      case 'conversion-rate':
        drilldownData = await getDrilldownConversionData(dbConnector);
        break;
      case 'growth-rate':
        drilldownData = await getDrilldownGrowthData(dbConnector);
        break;
      case 'store-performance':
        drilldownData = await getDrilldownStorePerformanceData(dbConnector);
        break;
      case 'regional-performance':
        drilldownData = await getDrilldownRegionalData(dbConnector);
        break;
      default:
        throw new Error(`Unrecognized KPI key: ${kpi}`);
    }

    context.res = {
      status: 200,
      body: {
        kpi,
        data: drilldownData,
        timestamp: new Date().toISOString(),
        count: drilldownData.length
      }
    };
  } catch (err) {
    context.log.error('Drilldown error:', err);
    context.res = {
      status: 500,
      body: { 
        error: err.message,
        kpi: kpi
      }
    };
  }
};

/**
 * Get drill-down data for total sales KPI
 */
async function getDrilldownSalesData(dbConnector) {
  const query = `
    SELECT 
      r.region_name,
      SUM(m.sales_30d) AS total_sales,
      SUM(m.sales_7d) AS sales_7d,
      COUNT(DISTINCT s.store_id) AS store_count,
      AVG(m.growth_rate_pct) AS avg_growth_rate,
      m.as_of_date
    FROM 
      client360.gold_store_metrics m
    JOIN 
      client360.gold_stores s ON m.store_id = s.store_id
    JOIN 
      client360.gold_barangays b ON s.barangay_id = b.barangay_id
    JOIN 
      client360.gold_cities c ON b.city_id = c.city_id
    JOIN 
      client360.gold_provinces p ON c.province_id = p.province_id
    JOIN 
      client360.gold_regions r ON p.region_id = r.region_id
    WHERE 
      s.store_type_id = 1 
      AND m.as_of_date >= CURRENT_DATE() - INTERVAL 30 DAY
    GROUP BY 
      r.region_id, r.region_name, m.as_of_date
    ORDER BY 
      total_sales DESC, m.as_of_date DESC
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for transactions KPI
 */
async function getDrilldownTransactionData(dbConnector) {
  const query = `
    SELECT 
      s.store_name,
      s.store_id,
      COUNT(i.interaction_id) AS transaction_count,
      SUM(CASE WHEN i.transaction_completed = true THEN 1 ELSE 0 END) AS completed_transactions,
      AVG(i.basket_value) AS avg_basket_value,
      AVG(i.duration_sec) AS avg_duration_sec,
      DATE(i.timestamp) AS transaction_date
    FROM 
      client360.gold_store_interaction_metrics i
    JOIN 
      client360.gold_stores s ON i.store_id = s.store_id
    WHERE 
      i.timestamp >= CURRENT_DATE() - INTERVAL 7 DAY
      AND s.store_type_id = 1
    GROUP BY 
      s.store_id, s.store_name, DATE(i.timestamp)
    ORDER BY 
      transaction_count DESC, transaction_date DESC
    LIMIT 50
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for brand sentiment KPI
 */
async function getDrilldownSentimentData(dbConnector) {
  const query = `
    SELECT 
      b.brand_name,
      b.company_name,
      b.is_tbwa_client,
      AVG(ts.avg_sentiment_score) AS avg_sentiment,
      SUM(ts.positive_count) AS positive_mentions,
      SUM(ts.negative_count) AS negative_mentions,
      SUM(ts.neutral_count) AS neutral_mentions,
      COUNT(DISTINCT ts.store_id) AS stores_mentioned,
      MAX(ts.window_end) AS last_updated
    FROM 
      client360.gold_transcript_sentiment_analysis ts
    JOIN 
      client360.gold_stores s ON ts.store_id = s.store_id
    JOIN 
      client360.gold_store_brand_distribution bd ON s.store_id = bd.store_id
    JOIN 
      client360.gold_brands b ON bd.brand_id = b.brand_id
    WHERE 
      ts.window_end >= CURRENT_DATE() - INTERVAL 30 DAY
      AND s.store_type_id = 1
    GROUP BY 
      b.brand_id, b.brand_name, b.company_name, b.is_tbwa_client
    ORDER BY 
      avg_sentiment DESC, positive_mentions DESC
    LIMIT 20
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for conversion rate KPI
 */
async function getDrilldownConversionData(dbConnector) {
  const query = `
    SELECT 
      s.store_name,
      s.store_id,
      m.conversion_rate_pct,
      m.customer_count_30d,
      m.sales_30d,
      m.average_basket_size,
      r.region_name,
      c.city_name,
      m.as_of_date
    FROM 
      client360.gold_store_metrics m
    JOIN 
      client360.gold_stores s ON m.store_id = s.store_id
    JOIN 
      client360.gold_barangays b ON s.barangay_id = b.barangay_id
    JOIN 
      client360.gold_cities c ON b.city_id = c.city_id
    JOIN 
      client360.gold_provinces p ON c.province_id = p.province_id
    JOIN 
      client360.gold_regions r ON p.region_id = r.region_id
    WHERE 
      s.store_type_id = 1
      AND m.as_of_date >= CURRENT_DATE() - INTERVAL 30 DAY
    ORDER BY 
      m.conversion_rate_pct DESC, m.sales_30d DESC
    LIMIT 30
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for growth rate KPI
 */
async function getDrilldownGrowthData(dbConnector) {
  const query = `
    SELECT 
      s.store_name,
      s.store_id,
      m.growth_rate_pct,
      m.sales_30d,
      m.sales_7d,
      (m.sales_30d - LAG(m.sales_30d, 1) OVER (PARTITION BY s.store_id ORDER BY m.as_of_date)) AS sales_change,
      r.region_name,
      c.city_name,
      m.as_of_date
    FROM 
      client360.gold_store_metrics m
    JOIN 
      client360.gold_stores s ON m.store_id = s.store_id
    JOIN 
      client360.gold_barangays b ON s.barangay_id = b.barangay_id
    JOIN 
      client360.gold_cities c ON b.city_id = c.city_id
    JOIN 
      client360.gold_provinces p ON c.province_id = p.province_id
    JOIN 
      client360.gold_regions r ON p.region_id = r.region_id
    WHERE 
      s.store_type_id = 1
      AND m.as_of_date >= CURRENT_DATE() - INTERVAL 60 DAY
    ORDER BY 
      m.growth_rate_pct DESC, m.as_of_date DESC
    LIMIT 30
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for store performance KPI
 */
async function getDrilldownStorePerformanceData(dbConnector) {
  const query = `
    SELECT 
      s.store_id,
      s.store_name,
      s.owner_name,
      m.sales_30d,
      m.conversion_rate_pct,
      m.growth_rate_pct,
      m.customer_count_30d,
      m.average_basket_size,
      m.digital_payment_pct,
      r.region_name,
      c.city_name,
      p.province_name,
      s.latitude,
      s.longitude,
      m.as_of_date
    FROM 
      client360.gold_store_metrics m
    JOIN 
      client360.gold_stores s ON m.store_id = s.store_id
    JOIN 
      client360.gold_barangays b ON s.barangay_id = b.barangay_id
    JOIN 
      client360.gold_cities c ON b.city_id = c.city_id
    JOIN 
      client360.gold_provinces p ON c.province_id = p.province_id
    JOIN 
      client360.gold_regions r ON p.region_id = r.region_id
    WHERE 
      s.store_type_id = 1
      AND m.as_of_date >= CURRENT_DATE() - INTERVAL 30 DAY
    ORDER BY 
      m.sales_30d DESC, m.conversion_rate_pct DESC
    LIMIT 50
  `;
  
  return await dbConnector.executeQuery(query);
}

/**
 * Get drill-down data for regional performance KPI
 */
async function getDrilldownRegionalData(dbConnector) {
  const query = `
    SELECT 
      r.region_name,
      r.region_id,
      COUNT(DISTINCT s.store_id) AS total_stores,
      SUM(m.sales_30d) AS total_regional_sales,
      AVG(m.conversion_rate_pct) AS avg_conversion_rate,
      AVG(m.growth_rate_pct) AS avg_growth_rate,
      AVG(m.average_basket_size) AS avg_basket_size,
      SUM(m.customer_count_30d) AS total_customers,
      MAX(m.as_of_date) AS last_updated
    FROM 
      client360.gold_regions r
    JOIN 
      client360.gold_provinces p ON r.region_id = p.region_id
    JOIN 
      client360.gold_cities c ON p.province_id = c.province_id
    JOIN 
      client360.gold_barangays b ON c.city_id = b.city_id
    JOIN 
      client360.gold_stores s ON b.barangay_id = s.barangay_id
    JOIN 
      client360.gold_store_metrics m ON s.store_id = m.store_id
    WHERE 
      s.store_type_id = 1
      AND m.as_of_date >= CURRENT_DATE() - INTERVAL 30 DAY
    GROUP BY 
      r.region_id, r.region_name
    ORDER BY 
      total_regional_sales DESC
  `;
  
  return await dbConnector.executeQuery(query);
}