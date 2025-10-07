{{
  config(
    materialized = 'table'
  )
}}

WITH transaction_brands AS (
    -- Get distinct brand combinations within transactions
    SELECT
        transaction_id,
        store_id,
        city,
        state,
        transaction_date,
        brand_standardized AS brand,
        SUM(quantity) AS brand_quantity,
        SUM(item_total) AS brand_total
    FROM {{ ref('sales_interaction_brands') }}
    GROUP BY transaction_id, store_id, city, state, transaction_date, brand_standardized
),

brand_pairs AS (
    -- Self join to create brand pairs within the same transaction
    SELECT
        a.transaction_id,
        a.store_id,
        a.city,
        a.state,
        a.transaction_date,
        a.brand AS brand_a,
        b.brand AS brand_b,
        a.brand_quantity AS quantity_a,
        b.brand_quantity AS quantity_b,
        a.brand_total AS total_a,
        b.brand_total AS total_b
    FROM transaction_brands a
    JOIN transaction_brands b
        ON a.transaction_id = b.transaction_id
        AND a.brand < b.brand -- Ensure unique pairs (A-B but not B-A)
),

brand_combo_metrics AS (
    -- Aggregate metrics for each brand combination
    SELECT
        brand_a,
        brand_b,
        city,
        state,
        COUNT(DISTINCT transaction_id) AS transaction_count,
        COUNT(DISTINCT store_id) AS store_count,
        AVG(quantity_a) AS avg_quantity_a,
        AVG(quantity_b) AS avg_quantity_b,
        SUM(total_a + total_b) AS total_combo_sales,
        MIN(transaction_date) AS first_seen_date,
        MAX(transaction_date) AS last_seen_date
    FROM brand_pairs
    GROUP BY brand_a, brand_b, city, state
),

single_brand_metrics AS (
    -- Get metrics for individual brands for comparison
    SELECT
        brand,
        city,
        state,
        COUNT(DISTINCT transaction_id) AS brand_transaction_count
    FROM transaction_brands
    GROUP BY brand, city, state
),

regional_metrics AS (
    -- Get total transactions by region for calculating ratios
    SELECT
        city,
        state,
        COUNT(DISTINCT transaction_id) AS region_transaction_count
    FROM transaction_brands
    GROUP BY city, state
),

combo_with_context AS (
    -- Join all metrics for full context
    SELECT
        c.brand_a,
        c.brand_b,
        c.city,
        c.state,
        c.transaction_count,
        c.store_count,
        c.avg_quantity_a,
        c.avg_quantity_b,
        c.total_combo_sales,
        c.first_seen_date,
        c.last_seen_date,
        a.brand_transaction_count AS a_transaction_count,
        b.brand_transaction_count AS b_transaction_count,
        r.region_transaction_count,
        -- Calculate affinity metrics
        (c.transaction_count * 1.0 / r.region_transaction_count) AS combo_pct_of_all_transactions,
        (c.transaction_count * 1.0 / a.brand_transaction_count) AS pct_of_brand_a_transactions,
        (c.transaction_count * 1.0 / b.brand_transaction_count) AS pct_of_brand_b_transactions,
        -- Calculate lift (how much more likely brands are purchased together vs. randomly)
        (c.transaction_count * r.region_transaction_count) / (a.brand_transaction_count * b.brand_transaction_count * 1.0) AS lift
    FROM brand_combo_metrics c
    JOIN single_brand_metrics a
        ON c.brand_a = a.brand AND c.city = a.city AND c.state = a.state
    JOIN single_brand_metrics b
        ON c.brand_b = b.brand AND c.city = b.city AND c.state = b.state
    JOIN regional_metrics r
        ON c.city = r.city AND c.state = r.state
),

ranked_combos AS (
    -- Rank combinations within each region
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY state, city ORDER BY transaction_count DESC) AS transaction_count_rank,
        ROW_NUMBER() OVER (PARTITION BY state, city ORDER BY lift DESC) AS lift_rank
    FROM combo_with_context
    WHERE lift > 1.0  -- Only include positive lift (meaningful combinations)
)

SELECT
    brand_a,
    brand_b,
    city,
    state,
    transaction_count,
    store_count,
    avg_quantity_a,
    avg_quantity_b,
    total_combo_sales,
    first_seen_date,
    last_seen_date,
    a_transaction_count,
    b_transaction_count,
    region_transaction_count,
    combo_pct_of_all_transactions,
    pct_of_brand_a_transactions,
    pct_of_brand_b_transactions,
    lift,
    transaction_count_rank,
    lift_rank,
    -- Flag top combos for easy filtering
    CASE WHEN transaction_count_rank <= 10 THEN true ELSE false END AS is_top_10_by_frequency,
    CASE WHEN lift_rank <= 10 THEN true ELSE false END AS is_top_10_by_lift
FROM ranked_combos
-- Limit to top 50 combinations in each region for performance
WHERE transaction_count_rank <= 50 OR lift_rank <= 50