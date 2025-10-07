-- Location Schema for FMCG Client360 Dashboard
-- This schema defines the database structure for the enhanced location data

-- Drop tables if they exist to avoid conflicts
DROP TABLE IF EXISTS store_product_category_distribution;
DROP TABLE IF EXISTS store_brand_distribution;
DROP TABLE IF EXISTS store_metrics;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS barangay_demographics;
DROP TABLE IF EXISTS barangay_brand_distribution;
DROP TABLE IF EXISTS barangay_category_distribution;
DROP TABLE IF EXISTS barangay_store_type_distribution;
DROP TABLE IF EXISTS barangay_metrics;
DROP TABLE IF EXISTS barangays;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS provinces;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS store_types;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS product_categories;

-- Create reference tables
CREATE TABLE regions (
    region_id VARCHAR(10) PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'Philippines'
);

CREATE TABLE provinces (
    province_id VARCHAR(15) PRIMARY KEY,
    province_name VARCHAR(50) NOT NULL,
    region_id VARCHAR(10) NOT NULL REFERENCES regions(region_id)
);

CREATE TABLE cities (
    city_id VARCHAR(20) PRIMARY KEY,
    city_municipality VARCHAR(50) NOT NULL,
    province_id VARCHAR(15) NOT NULL REFERENCES provinces(province_id),
    city_type VARCHAR(15) CHECK (city_type IN ('City', 'Municipality')),
    postal_code VARCHAR(10),
    urban_classification VARCHAR(20) CHECK (urban_classification IN ('Highly Urban', 'Urban', 'Semi-Urban', 'Rural'))
);

CREATE TABLE barangays (
    barangay_id VARCHAR(25) PRIMARY KEY,
    barangay_name VARCHAR(50) NOT NULL,
    city_id VARCHAR(20) NOT NULL REFERENCES cities(city_id)
);

CREATE TABLE store_types (
    store_type_id SMALLINT PRIMARY KEY,
    store_type_name VARCHAR(30) NOT NULL,
    description TEXT
);

CREATE TABLE brands (
    brand_id SMALLINT PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    company_name VARCHAR(100),
    is_tbwa_client BOOLEAN DEFAULT false
);

CREATE TABLE product_categories (
    category_id SMALLINT PRIMARY KEY,
    category_name VARCHAR(30) NOT NULL,
    description TEXT
);

-- Create main store table
CREATE TABLE stores (
    store_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    store_type_id SMALLINT NOT NULL REFERENCES store_types(store_type_id),
    owner VARCHAR(100),
    contact_number VARCHAR(20),
    street_address VARCHAR(100),
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    geolocation_accuracy VARCHAR(10) DEFAULT 'medium',
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create metrics tables
CREATE TABLE store_metrics (
    store_metric_id SERIAL PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL REFERENCES stores(store_id),
    metric_date DATE NOT NULL,
    sales_30d DECIMAL(12, 2),
    sales_7d DECIMAL(12, 2),
    customer_count_30d INTEGER,
    average_basket_size DECIMAL(8, 2),
    growth_rate_pct DECIMAL(5, 2),
    repurchase_rate_pct DECIMAL(5, 2),
    conversion_rate_pct DECIMAL(5, 2),
    digital_payment_pct DECIMAL(5, 2),
    date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, metric_date)
);

-- Create distribution tables
CREATE TABLE store_brand_distribution (
    distribution_id SERIAL PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL REFERENCES stores(store_id),
    brand_id SMALLINT NOT NULL REFERENCES brands(brand_id),
    sales_contribution_pct DECIMAL(5, 2),
    shelf_space_pct DECIMAL(5, 2),
    rank_in_store SMALLINT,
    as_of_date DATE NOT NULL,
    UNIQUE (store_id, brand_id, as_of_date)
);

CREATE TABLE store_product_category_distribution (
    distribution_id SERIAL PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL REFERENCES stores(store_id),
    category_id SMALLINT NOT NULL REFERENCES product_categories(category_id),
    sales_contribution_pct DECIMAL(5, 2),
    shelf_space_pct DECIMAL(5, 2),
    rank_in_store SMALLINT,
    as_of_date DATE NOT NULL,
    UNIQUE (store_id, category_id, as_of_date)
);

-- Create barangay level tables
CREATE TABLE barangay_metrics (
    barangay_metric_id SERIAL PRIMARY KEY,
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    metric_date DATE NOT NULL,
    store_count INTEGER,
    total_sales DECIMAL(14, 2),
    average_sales_per_store DECIMAL(12, 2),
    growth_rate_pct DECIMAL(5, 2),
    date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (barangay_id, metric_date)
);

CREATE TABLE barangay_demographics (
    demographic_id SERIAL PRIMARY KEY,
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    population INTEGER,
    household_count INTEGER,
    avg_household_size DECIMAL(4, 2),
    income_classification VARCHAR(30),
    urban_classification VARCHAR(20),
    as_of_date DATE NOT NULL,
    UNIQUE (barangay_id, as_of_date)
);

CREATE TABLE barangay_store_type_distribution (
    distribution_id SERIAL PRIMARY KEY,
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    store_type_id SMALLINT NOT NULL REFERENCES store_types(store_type_id),
    store_count INTEGER,
    as_of_date DATE NOT NULL,
    UNIQUE (barangay_id, store_type_id, as_of_date)
);

CREATE TABLE barangay_category_distribution (
    distribution_id SERIAL PRIMARY KEY,
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    category_id SMALLINT NOT NULL REFERENCES product_categories(category_id),
    sales_contribution_pct DECIMAL(5, 2),
    as_of_date DATE NOT NULL,
    UNIQUE (barangay_id, category_id, as_of_date)
);

CREATE TABLE barangay_brand_distribution (
    distribution_id SERIAL PRIMARY KEY,
    barangay_id VARCHAR(25) NOT NULL REFERENCES barangays(barangay_id),
    brand_id SMALLINT NOT NULL REFERENCES brands(brand_id),
    sales_contribution_pct DECIMAL(5, 2),
    rank_in_barangay SMALLINT,
    as_of_date DATE NOT NULL,
    UNIQUE (barangay_id, brand_id, as_of_date)
);

-- Create indexes for performance optimization
CREATE INDEX idx_stores_barangay ON stores(barangay_id);
CREATE INDEX idx_stores_store_type ON stores(store_type_id);
CREATE INDEX idx_store_metrics_store ON store_metrics(store_id);
CREATE INDEX idx_store_metrics_date ON store_metrics(metric_date);
CREATE INDEX idx_store_brand_dist ON store_brand_distribution(store_id, brand_id);
CREATE INDEX idx_store_cat_dist ON store_product_category_distribution(store_id, category_id);
CREATE INDEX idx_barangay_metrics_date ON barangay_metrics(metric_date);
CREATE INDEX idx_barangay_city ON barangays(city_id);
CREATE INDEX idx_city_province ON cities(province_id);
CREATE INDEX idx_province_region ON provinces(region_id);

-- Create views for easier querying
CREATE VIEW vw_store_details AS
SELECT 
    s.store_id,
    s.name AS store_name,
    st.store_type_name,
    s.owner,
    s.contact_number,
    s.street_address,
    b.barangay_name,
    c.city_municipality,
    p.province_name,
    r.region_name,
    s.postal_code,
    s.latitude,
    s.longitude,
    s.is_active
FROM 
    stores s
JOIN 
    store_types st ON s.store_type_id = st.store_type_id
JOIN 
    barangays b ON s.barangay_id = b.barangay_id
JOIN 
    cities c ON b.city_id = c.city_id
JOIN 
    provinces p ON c.province_id = p.province_id
JOIN 
    regions r ON p.region_id = r.region_id;

CREATE VIEW vw_store_performance AS
SELECT 
    s.store_id,
    s.name AS store_name,
    st.store_type_name,
    b.barangay_name,
    c.city_municipality,
    p.province_name,
    r.region_name,
    sm.sales_30d,
    sm.customer_count_30d,
    sm.average_basket_size,
    sm.growth_rate_pct,
    sm.metric_date
FROM 
    stores s
JOIN 
    store_types st ON s.store_type_id = st.store_type_id
JOIN 
    barangays b ON s.barangay_id = b.barangay_id
JOIN 
    cities c ON b.city_id = c.city_id
JOIN 
    provinces p ON c.province_id = p.province_id
JOIN 
    regions r ON p.region_id = r.region_id
JOIN 
    store_metrics sm ON s.store_id = sm.store_id
WHERE 
    sm.metric_date = (SELECT MAX(metric_date) FROM store_metrics);

CREATE VIEW vw_barangay_performance AS
SELECT 
    b.barangay_id,
    b.barangay_name,
    c.city_municipality,
    p.province_name,
    r.region_name,
    bm.store_count,
    bm.total_sales,
    bm.average_sales_per_store,
    bm.growth_rate_pct,
    bd.population,
    bd.household_count,
    bd.avg_household_size,
    bd.income_classification,
    bd.urban_classification,
    bm.metric_date
FROM 
    barangays b
JOIN 
    cities c ON b.city_id = c.city_id
JOIN 
    provinces p ON c.province_id = p.province_id
JOIN 
    regions r ON p.region_id = r.region_id
JOIN 
    barangay_metrics bm ON b.barangay_id = bm.barangay_id
LEFT JOIN 
    barangay_demographics bd ON b.barangay_id = bd.barangay_id
WHERE 
    bm.metric_date = (SELECT MAX(metric_date) FROM barangay_metrics)
AND 
    (bd.as_of_date = (SELECT MAX(as_of_date) FROM barangay_demographics) OR bd.as_of_date IS NULL);

-- Create geo-based view for map visualization
CREATE VIEW vw_store_map_data AS
SELECT 
    s.store_id,
    s.name AS store_name,
    st.store_type_name,
    b.barangay_name,
    c.city_municipality,
    p.province_name,
    r.region_name,
    s.latitude,
    s.longitude,
    sm.sales_30d,
    sm.growth_rate_pct,
    (
        SELECT STRING_AGG(br.brand_name, ',')
        FROM store_brand_distribution sbd
        JOIN brands br ON sbd.brand_id = br.brand_id
        WHERE sbd.store_id = s.store_id
        AND sbd.rank_in_store <= 3
        AND sbd.as_of_date = (SELECT MAX(as_of_date) FROM store_brand_distribution)
    ) AS top_brands
FROM 
    stores s
JOIN 
    store_types st ON s.store_type_id = st.store_type_id
JOIN 
    barangays b ON s.barangay_id = b.barangay_id
JOIN 
    cities c ON b.city_id = c.city_id
JOIN 
    provinces p ON c.province_id = p.province_id
JOIN 
    regions r ON p.region_id = r.region_id
LEFT JOIN 
    store_metrics sm ON s.store_id = sm.store_id
WHERE 
    s.latitude IS NOT NULL
AND 
    s.longitude IS NOT NULL
AND 
    s.is_active = true
AND 
    (sm.metric_date = (SELECT MAX(metric_date) FROM store_metrics) OR sm.metric_date IS NULL);

-- Comment for schema documentation
COMMENT ON SCHEMA public IS 'Enhanced location schema for FMCG Client360 Dashboard tracking store performance at barangay, city/municipality, and regional levels.';