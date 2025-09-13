WITH exploded_items AS (
    SELECT
        t.transaction_id,
        t.store_id,
        t.transaction_date,
        t.total_amount,
        t.payment_method,
        t.customer_id,
        i.product_id,
        i.quantity,
        i.item_price
    FROM {{ ref('stg_sales_transactions') }} t,
    UNNEST(t.items) i
),

transaction_with_products AS (
    SELECT
        e.transaction_id,
        e.store_id,
        e.transaction_date,
        e.total_amount,
        e.payment_method,
        e.customer_id,
        e.product_id,
        e.quantity,
        e.item_price,
        p.product_name,
        p.brand_standardized,
        p.category,
        p.subcategory,
        s.latitude,
        s.longitude,
        s.city,
        s.state,
        s.country,
        s.geo_point
    FROM exploded_items e
    LEFT JOIN {{ ref('stg_products') }} p
        ON e.product_id = p.product_id
    LEFT JOIN {{ ref('stg_stores') }} s
        ON e.store_id = s.store_id
)

SELECT * FROM transaction_with_products