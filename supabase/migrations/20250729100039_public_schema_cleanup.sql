-- Public Schema Cleanup Migration
-- This migration implements the necessary fixes for the Medallion architecture
-- to work properly with Supabase and the existing Bronze ’ Silver ’ Gold stack

-- =========================================================================
-- 1ã ENABLE POSTGIS EXTENSION (Required for geometry/geography types)
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================================================================
-- 2ã CREATE MISSING ENUMS
-- =========================================================================
-- Location and administrative enums
CREATE TYPE IF NOT EXISTS location_status AS ENUM ('active', 'inactive', 'deprecated');
CREATE TYPE IF NOT EXISTS administrative_level AS ENUM ('country', 'region', 'province', 'municipality', 'barangay');

-- Time and payment enums
CREATE TYPE IF NOT EXISTS time_of_day_enum AS ENUM ('morning', 'afternoon', 'evening', 'night');
CREATE TYPE IF NOT EXISTS payment_method_enum AS ENUM ('cash', 'gcash', 'maya', 'credit_card', 'debit_card', 'bank_transfer', 'other');

-- Store and business enums
CREATE TYPE IF NOT EXISTS store_type_enum AS ENUM ('sari_sari', 'grocery', 'supermarket', 'convenience', 'wholesale', 'other');
CREATE TYPE IF NOT EXISTS business_type_enum AS ENUM ('retail', 'wholesale', 'distribution', 'manufacturing', 'service', 'other');

-- Transaction and status enums
CREATE TYPE IF NOT EXISTS transaction_status_enum AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
CREATE TYPE IF NOT EXISTS data_quality_enum AS ENUM ('high', 'medium', 'low', 'unverified');

-- =========================================================================
-- 3ã CREATE MISSING SEQUENCES
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS bronze_raw_transactions_id_seq INCREMENT 1 START 1;
CREATE SEQUENCE IF NOT EXISTS gold_sales_summary_id_seq INCREMENT 1 START 1;
CREATE SEQUENCE IF NOT EXISTS silver_validated_transactions_id_seq INCREMENT 1 START 1;

-- =========================================================================
-- 4ã MOVE MEDALLION TABLES TO APPROPRIATE SCHEMAS
-- =========================================================================
-- Ensure schemas exist
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Move tables to their appropriate schemas (if they exist in public)
DO $$
BEGIN
    -- Move bronze tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bronze_raw_transactions') THEN
        ALTER TABLE public.bronze_raw_transactions SET SCHEMA bronze;
    END IF;
    
    -- Move silver tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'silver_validated_transactions') THEN
        ALTER TABLE public.silver_validated_transactions SET SCHEMA silver;
    END IF;
    
    -- Move gold tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gold_sales_summary') THEN
        ALTER TABLE public.gold_sales_summary SET SCHEMA gold;
    END IF;
END $$;

-- =========================================================================
-- 5ã ENABLE RLS AND CREATE POLICIES FOR MEDALLION TABLES
-- =========================================================================
-- Enable RLS on gold tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = 'gold_sales_summary') THEN
        ALTER TABLE gold.gold_sales_summary ENABLE ROW LEVEL SECURITY;
        
        -- Create select policy
        CREATE POLICY IF NOT EXISTS select_all ON gold.gold_sales_summary
            FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
    END IF;
END $$;

-- =========================================================================
-- 6ã FIX FOREIGN KEY CONSTRAINTS FOR AUTH.USERS
-- =========================================================================
-- Fix profiles table FK to add ON DELETE CASCADE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles
            DROP CONSTRAINT IF EXISTS profiles_id_fkey,
            ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
                REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =========================================================================
-- 7ã CREATE PERFORMANCE INDEXES
-- =========================================================================
-- GIS index for GADM boundaries (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gadm_boundaries') THEN
        CREATE INDEX IF NOT EXISTS idx_gadm_geom_gist ON public.gadm_boundaries USING gist(geometry);
    END IF;
END $$;

-- Text search index for Philippines locations (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'philippines_locations') THEN
        CREATE INDEX IF NOT EXISTS idx_ph_locations_search ON public.philippines_locations USING gin(search_vector);
    END IF;
END $$;

-- Additional useful indexes for medallion tables
DO $$
BEGIN
    -- Bronze indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bronze' AND table_name = 'raw_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_bronze_raw_transactions_created_at ON bronze.raw_transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_bronze_raw_transactions_store_id ON bronze.raw_transactions(store_id);
    END IF;
    
    -- Silver indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'silver' AND table_name = 'validated_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_silver_validated_transactions_date ON silver.validated_transactions(transaction_date);
        CREATE INDEX IF NOT EXISTS idx_silver_validated_transactions_store ON silver.validated_transactions(store_id);
    END IF;
    
    -- Gold indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'gold' AND table_name = 'sales_summary') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_sales_summary_date ON gold.sales_summary(summary_date);
        CREATE INDEX IF NOT EXISTS idx_gold_sales_summary_store ON gold.sales_summary(store_id);
    END IF;
END $$;

-- =========================================================================
-- GRANT SCHEMA PERMISSIONS
-- =========================================================================
-- Grant usage on medallion schemas to authenticated users
GRANT USAGE ON SCHEMA bronze TO authenticated;
GRANT USAGE ON SCHEMA silver TO authenticated;
GRANT USAGE ON SCHEMA gold TO authenticated;

-- Grant select permissions on gold schema tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO authenticated;

-- =========================================================================
-- COMMENTS FOR DOCUMENTATION
-- =========================================================================
COMMENT ON SCHEMA bronze IS 'Raw data ingestion layer - unprocessed data from various sources';
COMMENT ON SCHEMA silver IS 'Cleaned and validated data layer - standardized and enriched';
COMMENT ON SCHEMA gold IS 'Business-ready aggregated data layer - optimized for analytics and reporting';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Public schema cleanup migration completed successfully';
    RAISE NOTICE 'PostGIS enabled, enums created, sequences added, tables moved to medallion schemas';
    RAISE NOTICE 'RLS policies and performance indexes have been applied';
END $$;