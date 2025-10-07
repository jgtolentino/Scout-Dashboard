{{
  config(
    materialized = 'table',
    partition_by = 'DATE(transaction_date)',
    cluster_by = ['brand_standardized', 'state', 'city']
  )
}}

WITH final AS (
    SELECT
        transaction_id,
        store_id,
        transaction_date,
        product_id,
        product_name,
        brand_standardized,
        category,
        subcategory,
        quantity,
        item_price,
        quantity * item_price AS item_total,
        latitude,
        longitude,
        city,
        state,
        country,
        geo_point,
        -- Add date parts for time-based analysis
        EXTRACT(YEAR FROM transaction_date) AS year,
        EXTRACT(MONTH FROM transaction_date) AS month,
        EXTRACT(DAY FROM transaction_date) AS day,
        EXTRACT(DAYOFWEEK FROM transaction_date) AS day_of_week,
        -- Add trx hash for combination analysis
        CONCAT(transaction_id, '_', product_id) AS transaction_product_id
    FROM {{ ref('int_sales_interaction_brands') }}
    WHERE brand_standardized IS NOT NULL AND brand_standardized != 'Unknown'
)

SELECT * FROM final