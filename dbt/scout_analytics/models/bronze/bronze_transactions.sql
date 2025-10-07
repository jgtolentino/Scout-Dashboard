{{
  config(
    materialized='view',
    tags=['bronze', 'transactions']
  )
}}

-- Bronze Layer: Raw transactions with minimal transformations
-- Purpose: Ingest raw data with basic validation and metadata

SELECT
    -- Primary key and identifiers
    id AS transaction_id,
    tenant_id,
    
    -- Financial data
    peso_value,
    CASE 
        WHEN peso_value < {{ var('transaction_threshold') }} THEN TRUE
        ELSE FALSE
    END AS is_low_value_flag,
    
    -- Temporal data
    transaction_date,
    created_at,
    
    -- Raw dimensional attributes (no normalization yet)
    TRIM(LOWER(COALESCE(province, 'unknown'))) AS province_raw,
    TRIM(LOWER(COALESCE(brand, 'unknown'))) AS brand_raw,
    TRIM(LOWER(COALESCE(category, 'unknown'))) AS category_raw,
    
    -- Behavioral data
    COALESCE(basket_size, 1) AS basket_size,
    
    -- Data lineage and quality metadata
    'scout.transactions' AS _source_table,
    CURRENT_TIMESTAMP AS _ingestion_timestamp,
    
    -- Data quality flags
    CASE
        WHEN peso_value IS NULL THEN TRUE
        WHEN transaction_date IS NULL THEN TRUE  
        WHEN id IS NULL THEN TRUE
        ELSE FALSE
    END AS _has_data_quality_issues,
    
    -- Row hash for change detection
    {{ dbt_utils.generate_surrogate_key([
        'id', 
        'peso_value', 
        'transaction_date',
        'province',
        'brand', 
        'category',
        'basket_size'
    ]) }} AS _row_hash

FROM {{ source('scout', 'transactions') }}

-- Basic data quality filters
WHERE 1=1
    AND id IS NOT NULL
    AND peso_value IS NOT NULL
    AND transaction_date IS NOT NULL
    AND peso_value >= {{ var('transaction_threshold') }}
    
    -- Date range filter for development
    {% if var('start_date', none) %}
    AND transaction_date >= '{{ var('start_date') }}'
    {% endif %}