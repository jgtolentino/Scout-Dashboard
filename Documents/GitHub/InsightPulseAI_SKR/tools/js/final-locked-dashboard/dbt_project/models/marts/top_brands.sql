{{
  config(
    materialized = 'table'
  )
}}

WITH brand_metrics_by_region AS (
    SELECT
        brand_standardized AS brand,
        state,
        city,
        COUNT(DISTINCT transaction_id) AS transaction_count,
        SUM(quantity) AS total_quantity,
        SUM(item_total) AS total_sales,
        COUNT(DISTINCT store_id) AS store_count,
        MIN(transaction_date) AS first_transaction_date,
        MAX(transaction_date) AS last_transaction_date,
        AVG(item_price) AS avg_price
    FROM {{ ref('sales_interaction_brands') }}
    GROUP BY brand_standardized, state, city
),

regional_metrics AS (
    SELECT
        state,
        city,
        COUNT(DISTINCT transaction_id) AS total_transactions,
        SUM(total_quantity) AS region_total_quantity,
        SUM(total_sales) AS region_total_sales
    FROM {{ ref('sales_interaction_brands') }}
    GROUP BY state, city
),

brand_market_share AS (
    SELECT
        b.brand,
        b.state,
        b.city,
        b.transaction_count,
        b.total_quantity,
        b.total_sales,
        b.store_count,
        b.first_transaction_date,
        b.last_transaction_date,
        b.avg_price,
        r.total_transactions,
        r.region_total_quantity,
        r.region_total_sales,
        (b.transaction_count / r.total_transactions) AS transaction_share,
        (b.total_quantity / r.region_total_quantity) AS quantity_share,
        (b.total_sales / r.region_total_sales) AS sales_share
    FROM brand_metrics_by_region b
    JOIN regional_metrics r
        ON b.state = r.state AND b.city = r.city
),

ranked_brands_by_region AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY state, city ORDER BY sales_share DESC) AS sales_rank,
        ROW_NUMBER() OVER (PARTITION BY state, city ORDER BY transaction_count DESC) AS transaction_rank,
        ROW_NUMBER() OVER (PARTITION BY state, city ORDER BY total_quantity DESC) AS quantity_rank
    FROM brand_market_share
)

SELECT 
    brand,
    state,
    city,
    transaction_count,
    total_quantity,
    total_sales,
    store_count,
    first_transaction_date,
    last_transaction_date,
    avg_price,
    total_transactions,
    region_total_quantity,
    region_total_sales,
    transaction_share,
    quantity_share,
    sales_share,
    sales_rank,
    transaction_rank,
    quantity_rank,
    -- Flag top brands in each region
    CASE WHEN sales_rank <= 5 THEN true ELSE false END AS is_top_5_sales,
    CASE WHEN transaction_rank <= 5 THEN true ELSE false END AS is_top_5_transactions,
    CASE WHEN quantity_rank <= 5 THEN true ELSE false END AS is_top_5_quantity
FROM ranked_brands_by_region
-- Limit to top 50 brands in each region for performance
WHERE sales_rank <= 50 OR transaction_rank <= 50 OR quantity_rank <= 50