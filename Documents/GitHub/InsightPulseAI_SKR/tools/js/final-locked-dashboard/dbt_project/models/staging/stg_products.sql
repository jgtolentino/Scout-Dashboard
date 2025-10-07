WITH source AS (
    SELECT * FROM {{ source('raw_data', 'products') }}
),

final AS (
    SELECT
        product_id,
        product_name,
        brand,
        category,
        subcategory,
        sku,
        price,
        -- Add standardized brand name field for consistent analysis
        COALESCE(NULLIF(TRIM(brand), ''), 'Unknown') AS brand_standardized
    FROM source
)

SELECT * FROM final