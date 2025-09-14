{{
  config(
    materialized='table',
    tags=['silver', 'dimension', 'geography'],
    indexes=[
      {'columns': ['province_name'], 'unique': False},
      {'columns': ['province_code'], 'unique': True}
    ]
  )
}}

-- Silver Layer: Province Dimension
-- Purpose: Standardized geographic hierarchy for Philippines

WITH source_provinces AS (
    SELECT DISTINCT
        province_code,
        province_name,
        region_name,
        alt_name,
        created_at
    FROM {{ source('dimensions', 'ph_provinces') }}
    WHERE province_name IS NOT NULL
),

bronze_provinces AS (
    SELECT DISTINCT
        province_raw
    FROM {{ ref('bronze_transactions') }}
    WHERE province_raw IS NOT NULL 
    AND province_raw != 'unknown'
),

province_mapping AS (
    SELECT
        bp.province_raw,
        sp.province_code,
        sp.province_name,
        sp.region_name,
        sp.alt_name,
        -- Fuzzy matching logic
        CASE
            WHEN LOWER(TRIM(bp.province_raw)) = LOWER(TRIM(sp.province_name)) THEN 1.0
            WHEN LOWER(TRIM(bp.province_raw)) = LOWER(TRIM(sp.alt_name)) THEN 0.9
            WHEN LOWER(TRIM(bp.province_raw)) LIKE '%' || LOWER(TRIM(sp.province_name)) || '%' THEN 0.7
            WHEN LOWER(TRIM(sp.province_name)) LIKE '%' || LOWER(TRIM(bp.province_raw)) || '%' THEN 0.6
            ELSE 0.0
        END AS match_score
    FROM bronze_provinces bp
    CROSS JOIN source_provinces sp
),

best_matches AS (
    SELECT
        province_raw,
        province_code,
        province_name,
        region_name,
        alt_name,
        match_score,
        ROW_NUMBER() OVER (PARTITION BY province_raw ORDER BY match_score DESC) AS rn
    FROM province_mapping
    WHERE match_score > 0.5
),

final_dimension AS (
    -- Master data provinces
    SELECT
        {{ dbt_utils.generate_surrogate_key(['province_code']) }} AS province_key,
        province_code,
        INITCAP(TRIM(province_name)) AS province_name,
        INITCAP(TRIM(region_name)) AS region_name,
        CASE WHEN alt_name IS NOT NULL THEN INITCAP(TRIM(alt_name)) END AS alt_name,
        CASE 
            WHEN UPPER(region_name) = 'NATIONAL CAPITAL REGION' THEN TRUE
            WHEN UPPER(region_name) = 'NCR' THEN TRUE
            ELSE FALSE
        END AS is_ncr,
        CASE
            WHEN UPPER(region_name) IN ('NATIONAL CAPITAL REGION', 'NCR') THEN 'metro_manila'
            WHEN UPPER(region_name) LIKE '%LUZON%' THEN 'luzon'
            WHEN UPPER(region_name) LIKE '%VISAYAS%' THEN 'visayas'
            WHEN UPPER(region_name) LIKE '%MINDANAO%' THEN 'mindanao'
            ELSE 'other'
        END AS island_group,
        TRUE AS is_official,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at
    FROM source_provinces
    
    UNION ALL
    
    -- Unmapped provinces from transaction data
    SELECT
        {{ dbt_utils.generate_surrogate_key(['bm.province_raw']) }} AS province_key,
        'UNK-' || UPPER(SUBSTRING(bm.province_raw, 1, 3)) AS province_code,
        INITCAP(TRIM(bm.province_name)) AS province_name,
        COALESCE(INITCAP(TRIM(bm.region_name)), 'Unknown Region') AS region_name,
        bm.alt_name AS alt_name,
        FALSE AS is_ncr,
        'other' AS island_group,
        FALSE AS is_official,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at
    FROM best_matches bm
    WHERE bm.rn = 1
    
    UNION ALL
    
    -- Default unknown province
    SELECT
        {{ dbt_utils.generate_surrogate_key(['unknown']) }} AS province_key,
        'UNK' AS province_code,
        'Unknown Province' AS province_name,
        'Unknown Region' AS region_name,
        NULL AS alt_name,
        FALSE AS is_ncr,
        'other' AS island_group,
        FALSE AS is_official,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at
)

SELECT * FROM final_dimension
ORDER BY is_official DESC, province_name