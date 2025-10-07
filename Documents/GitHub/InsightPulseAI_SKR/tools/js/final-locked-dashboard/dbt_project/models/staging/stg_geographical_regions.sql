WITH source AS (
    SELECT * FROM {{ source('raw_data', 'geographical_regions') }}
),

final AS (
    SELECT
        region_id,
        region_name,
        region_type,
        parent_region_id,
        geojson,
        -- Parse and validate the GeoJSON
        TRY_CAST(geojson AS STRING) AS geojson_valid
    FROM source
)

SELECT * FROM final