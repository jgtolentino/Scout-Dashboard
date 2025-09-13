{{
  config(
    materialized = 'table'
  )
}}

WITH daily_store_metrics AS (
    -- Calculate daily metrics for each store
    SELECT
        store_id,
        DATE(transaction_date) AS date,
        COUNT(DISTINCT transaction_id) AS daily_transactions,
        COUNT(DISTINCT brand_standardized) AS unique_brands_sold,
        SUM(quantity) AS total_items_sold,
        SUM(item_total) AS daily_revenue,
        AVG(item_total) AS avg_item_value
    FROM {{ ref('sales_interaction_brands') }}
    GROUP BY store_id, DATE(transaction_date)
),

store_location_data AS (
    -- Get store location information
    SELECT
        store_id,
        store_name,
        latitude,
        longitude,
        city,
        state,
        country,
        postal_code,
        store_type,
        geo_point
    FROM {{ ref('stg_stores') }}
),

store_brand_metrics AS (
    -- Calculate brand diversity and top brands for each store
    SELECT
        store_id,
        COUNT(DISTINCT brand_standardized) AS total_brands_carried,
        COUNT(DISTINCT category) AS total_categories,
        STRING_AGG(DISTINCT brand_standardized, ', ' ORDER BY brand_standardized LIMIT 5) AS top_5_brands_list
    FROM {{ ref('sales_interaction_brands') }}
    GROUP BY store_id
),

store_time_metrics AS (
    -- Calculate time-based metrics for trend analysis
    SELECT
        store_id,
        MIN(date) AS first_sales_date,
        MAX(date) AS last_sales_date,
        COUNT(DISTINCT date) AS active_days,
        AVG(daily_transactions) AS avg_daily_transactions,
        AVG(daily_revenue) AS avg_daily_revenue,
        SUM(daily_revenue) / COUNT(DISTINCT date) AS revenue_per_active_day
    FROM daily_store_metrics
    GROUP BY store_id
),

regional_averages AS (
    -- Calculate regional averages for benchmarking
    SELECT
        s.city,
        s.state,
        COUNT(DISTINCT s.store_id) AS stores_in_region,
        AVG(t.avg_daily_revenue) AS region_avg_daily_revenue,
        AVG(t.avg_daily_transactions) AS region_avg_daily_transactions,
        AVG(b.total_brands_carried) AS region_avg_brands_carried
    FROM store_location_data s
    JOIN store_time_metrics t ON s.store_id = t.store_id
    JOIN store_brand_metrics b ON s.store_id = b.store_id
    GROUP BY s.city, s.state
)

SELECT
    -- Store information
    s.store_id,
    s.store_name,
    s.latitude,
    s.longitude,
    s.city,
    s.state,
    s.country,
    s.postal_code,
    s.store_type,
    s.geo_point,
    
    -- Brand metrics
    b.total_brands_carried,
    b.total_categories,
    b.top_5_brands_list,
    
    -- Time metrics
    t.first_sales_date,
    t.last_sales_date,
    t.active_days,
    t.avg_daily_transactions,
    t.avg_daily_revenue,
    t.revenue_per_active_day,
    
    -- Regional context
    r.stores_in_region,
    r.region_avg_daily_revenue,
    r.region_avg_daily_transactions,
    r.region_avg_brands_carried,
    
    -- Performance indicators
    (t.avg_daily_revenue / NULLIF(r.region_avg_daily_revenue, 0)) AS revenue_vs_region_avg,
    (t.avg_daily_transactions / NULLIF(r.region_avg_daily_transactions, 0)) AS transactions_vs_region_avg,
    (b.total_brands_carried / NULLIF(r.region_avg_brands_carried, 0)) AS brand_diversity_vs_region_avg,
    
    -- Date of metrics generation
    CURRENT_TIMESTAMP() AS generated_at
FROM store_location_data s
LEFT JOIN store_brand_metrics b ON s.store_id = b.store_id
LEFT JOIN store_time_metrics t ON s.store_id = t.store_id
LEFT JOIN regional_averages r ON s.city = r.city AND s.state = r.state