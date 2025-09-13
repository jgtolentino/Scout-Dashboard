WITH source AS (
    SELECT * FROM {{ source('raw_data', 'stores') }}
),

final AS (
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
        -- Add geography point for spatial analysis
        ST_POINT(longitude, latitude) AS geo_point
    FROM source
)

SELECT * FROM final