-- Scout Analytics Database Schema for PostgreSQL
CREATE TABLE IF NOT EXISTS geography (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_region ON geography(region);
CREATE INDEX idx_city ON geography(city_municipality);
CREATE INDEX idx_barangay ON geography(barangay);

-- Store information
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    store_code VARCHAR(50) UNIQUE NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    store_type VARCHAR(50) CHECK (store_type IN ('Sari-sari', 'Convenience', 'Supermarket', 'Hypermarket')) NOT NULL,
    geography_id INT REFERENCES geography(id),
    address TEXT,
    contact_number VARCHAR(50),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_store_code ON stores(store_code);
CREATE INDEX idx_store_type ON stores(store_type);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id INT DEFAULT NULL REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_name ON categories(category_name);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id INT REFERENCES categories(id),
    brand VARCHAR(100),
    unit_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sku ON products(sku);
CREATE INDEX idx_brand ON products(brand);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    geography_id INT REFERENCES geography(id),
    registration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_code ON customers(customer_code);
CREATE INDEX idx_email ON customers(email);

-- Sales transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    store_id INT NOT NULL REFERENCES stores(id),
    customer_id INT REFERENCES customers(id),
    transaction_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Card', 'Digital Wallet', 'Credit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_id ON sales_transactions(transaction_id);
CREATE INDEX idx_transaction_date ON sales_transactions(transaction_date);
CREATE INDEX idx_store_date ON sales_transactions(store_id, transaction_date);

-- Sales transaction details
CREATE TABLE IF NOT EXISTS sales_details (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES sales_transactions(id),
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction ON sales_details(transaction_id);
CREATE INDEX idx_product ON sales_details(product_id);

-- Inventory tracking
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    store_id INT NOT NULL REFERENCES stores(id),
    product_id INT NOT NULL REFERENCES products(id),
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

CREATE INDEX idx_low_stock ON inventory(current_stock, min_stock_level);

-- AI insights storage
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    insight_type VARCHAR(50) CHECK (insight_type IN ('sales_forecast', 'product_recommendation', 'inventory_optimization', 'customer_behavior')) NOT NULL,
    target_id INT,
    target_type VARCHAR(50),
    insight_data JSONB,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_type_target ON ai_insights(insight_type, target_type, target_id);
CREATE INDEX idx_generated ON ai_insights(generated_at);

-- User sessions for analytics
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    page_views INT DEFAULT 0
);

CREATE INDEX idx_session_id ON user_sessions(session_id);
CREATE INDEX idx_start_time ON user_sessions(start_time);

-- Create views for common queries
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    DATE(st.transaction_date) as sale_date,
    s.store_code,
    s.store_name,
    s.store_type,
    g.region,
    g.city_municipality,
    g.barangay,
    COUNT(DISTINCT st.id) as transaction_count,
    COUNT(DISTINCT st.customer_id) as unique_customers,
    SUM(st.total_amount) as total_sales,
    AVG(st.total_amount) as avg_transaction_value
FROM sales_transactions st
JOIN stores s ON st.store_id = s.id
JOIN geography g ON s.geography_id = g.id
GROUP BY DATE(st.transaction_date), s.id, s.store_code, s.store_name, s.store_type, g.region, g.city_municipality, g.barangay;

CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.sku,
    p.product_name,
    p.brand,
    c.category_name,
    COUNT(DISTINCT sd.transaction_id) as times_sold,
    SUM(sd.quantity) as total_quantity_sold,
    SUM(sd.total_price) as total_revenue,
    AVG(sd.unit_price) as avg_selling_price
FROM products p
JOIN sales_details sd ON p.id = sd.product_id
JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.sku, p.product_name, p.brand, c.category_name;

-- Insert sample data
INSERT INTO geography (region, city_municipality, barangay, latitude, longitude) VALUES
('NCR', 'Manila', 'Ermita', 14.5823, 120.9748),
('NCR', 'Quezon City', 'Diliman', 14.6507, 121.0494),
('NCR', 'Makati', 'Poblacion', 14.5547, 121.0244),
('Central Luzon', 'Angeles City', 'Balibago', 15.1628, 120.5606),
('Calabarzon', 'Antipolo', 'Dela Paz', 14.6255, 121.1245)
ON CONFLICT DO NOTHING;

INSERT INTO categories (category_name) VALUES
('Beverages'),
('Snacks'),
('Personal Care'),
('Household Items'),
('Canned Goods')
ON CONFLICT DO NOTHING;