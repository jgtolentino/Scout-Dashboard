WITH source AS (
    SELECT * FROM {{ source('raw_data', 'sales_transactions') }}
),

final AS (
    SELECT
        transaction_id,
        store_id,
        transaction_date,
        CAST(JSON_PARSE(items_json) AS ARRAY) AS items,
        total_amount,
        payment_method,
        customer_id
    FROM source
)

SELECT * FROM final