{{
  config(
    materialized='table',
    tags=['gold', 'kpi', 'dashboard'],
    indexes=[
      {'columns': ['report_date'], 'unique': True}
    ]
  )
}}

-- Gold Layer: Daily KPI Summary for Scout Dashboard
-- Purpose: Business-ready metrics for real-time dashboard consumption

WITH daily_transactions AS (
    SELECT
        st.transaction_date AS report_date,
        COUNT(*) AS total_transactions,
        SUM(st.peso_value) AS total_sales,
        AVG(st.peso_value) AS avg_transaction_value,
        AVG(st.basket_size) AS avg_basket_size,
        COUNT(DISTINCT st.province_key) AS unique_provinces,
        COUNT(DISTINCT st.brand_key) AS unique_brands,
        COUNT(DISTINCT st.category_key) AS unique_categories
    FROM {{ ref('silver_transactions') }} st
    GROUP BY st.transaction_date
),

provincial_performance AS (
    SELECT
        st.transaction_date,
        st.province_key,
        dp.province_name,
        SUM(st.peso_value) AS province_sales,
        COUNT(*) AS province_transactions,
        ROW_NUMBER() OVER (
            PARTITION BY st.transaction_date 
            ORDER BY SUM(st.peso_value) DESC
        ) AS sales_rank
    FROM {{ ref('silver_transactions') }} st
    LEFT JOIN {{ ref('dim_provinces') }} dp ON st.province_key = dp.province_key
    GROUP BY st.transaction_date, st.province_key, dp.province_name
),

brand_performance AS (
    SELECT
        st.transaction_date,
        st.brand_key,
        db.brand_name,
        SUM(st.peso_value) AS brand_sales,
        COUNT(*) AS brand_transactions,
        ROW_NUMBER() OVER (
            PARTITION BY st.transaction_date 
            ORDER BY SUM(st.peso_value) DESC
        ) AS brand_rank
    FROM {{ ref('silver_transactions') }} st
    LEFT JOIN {{ ref('dim_brands') }} db ON st.brand_key = db.brand_key
    GROUP BY st.transaction_date, st.brand_key, db.brand_name
),

previous_day_metrics AS (
    SELECT
        report_date,
        total_sales,
        total_transactions,
        LAG(total_sales) OVER (ORDER BY report_date) AS prev_day_sales,
        LAG(total_transactions) OVER (ORDER BY report_date) AS prev_day_transactions
    FROM daily_transactions
),

final_kpis AS (
    SELECT
        dt.report_date,
        
        -- Core metrics
        dt.total_transactions,
        dt.total_sales,
        dt.avg_transaction_value,
        dt.avg_basket_size,
        dt.unique_provinces,
        dt.unique_brands,
        dt.unique_categories,
        
        -- Top performers
        pp_top.province_name AS top_performing_province,
        pp_top.province_sales AS top_province_sales,
        bp_top.brand_name AS top_performing_brand,
        bp_top.brand_sales AS top_brand_sales,
        
        -- Growth metrics (day-over-day)
        CASE 
            WHEN pdm.prev_day_sales > 0 THEN 
                ROUND(((dt.total_sales - pdm.prev_day_sales) / pdm.prev_day_sales * 100)::numeric, 2)
            ELSE NULL
        END AS sales_growth_pct,
        
        CASE 
            WHEN pdm.prev_day_transactions > 0 THEN 
                ROUND(((dt.total_transactions - pdm.prev_day_transactions) / pdm.prev_day_transactions::numeric * 100), 2)
            ELSE NULL
        END AS transaction_growth_pct,
        
        -- Business insights flags
        CASE 
            WHEN dt.total_transactions < {{ var('min_records_per_day') }} THEN TRUE
            ELSE FALSE
        END AS is_low_volume_day,
        
        CASE 
            WHEN EXTRACT(DOW FROM dt.report_date) IN (0, 6) THEN TRUE
            ELSE FALSE
        END AS is_weekend,
        
        -- Data freshness
        CURRENT_TIMESTAMP AS last_updated,
        
        -- Quality score (0-1)
        CASE
            WHEN dt.total_transactions >= {{ var('min_records_per_day') }} 
                AND dt.unique_provinces >= 3 
                AND dt.avg_transaction_value > {{ var('transaction_threshold') }}
            THEN 1.0
            WHEN dt.total_transactions >= ({{ var('min_records_per_day') }} * 0.5) 
                AND dt.unique_provinces >= 2
            THEN 0.7
            WHEN dt.total_transactions >= ({{ var('min_records_per_day') }} * 0.2)
            THEN 0.4
            ELSE 0.1
        END AS data_quality_score

    FROM daily_transactions dt
    LEFT JOIN previous_day_metrics pdm ON dt.report_date = pdm.report_date
    LEFT JOIN provincial_performance pp_top ON (
        dt.report_date = pp_top.transaction_date 
        AND pp_top.sales_rank = 1
    )
    LEFT JOIN brand_performance bp_top ON (
        dt.report_date = bp_top.transaction_date 
        AND bp_top.brand_rank = 1
    )
)

SELECT * FROM final_kpis
ORDER BY report_date DESC