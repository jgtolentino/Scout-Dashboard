-- Scout Analytics Database Schema
CREATE DATABASE IF NOT EXISTS scout_analytics;
USE scout_analytics;

-- Geography dimension table
CREATE TABLE geography (
    id INT PRIMARY KEY AUTO_INCREMENT,
    region VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_city (city_municipality),
    INDEX idx_barangay (barangay)
);

-- Store information
CREATE TABLE stores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_code VARCHAR(50) UNIQUE NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    store_type ENUM('Sari-sari', 'Convenience', 'Supermarket', 'Hypermarket') NOT NULL,
    geography_id INT,
    address TEXT,
    contact_number VARCHAR(50),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (geography_id) REFERENCES geography(id),
    INDEX idx_store_code (store_code),
    INDEX idx_store_type (store_type)
);

-- Product categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_category_name (category_name)
);

-- Products
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id INT,
    brand VARCHAR(100),
    unit_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_sku (sku),
    INDEX idx_brand (brand)
);

-- Customers
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    geography_id INT,
    registration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (geography_id) REFERENCES geography(id),
    INDEX idx_customer_code (customer_code),
    INDEX idx_email (email)
);

-- Sales transactions
CREATE TABLE sales_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    store_id INT NOT NULL,
    customer_id INT,
    transaction_date DATETIME NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method ENUM('Cash', 'Card', 'Digital Wallet', 'Credit') DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_store_date (store_id, transaction_date)
);

-- Sales transaction details
CREATE TABLE sales_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_product (product_id)
);

-- Inventory tracking
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    product_id INT NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_store_product (store_id, product_id),
    INDEX idx_low_stock (current_stock, min_stock_level)
);

-- AI insights storage
CREATE TABLE ai_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    insight_type ENUM('sales_forecast', 'product_recommendation', 'inventory_optimization', 'customer_behavior') NOT NULL,
    target_id INT,
    target_type VARCHAR(50),
    insight_data JSON,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_type_target (insight_type, target_type, target_id),
    INDEX idx_generated (generated_at)
);

-- User sessions for analytics
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    page_views INT DEFAULT 0,
    INDEX idx_session_id (session_id),
    INDEX idx_start_time (start_time)
);

-- Create views for common queries
CREATE VIEW sales_summary AS
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
GROUP BY DATE(st.transaction_date), s.id;

CREATE VIEW product_performance AS
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
GROUP BY p.id;

-- Insert sample data
INSERT INTO geography (region, city_municipality, barangay, latitude, longitude) VALUES
('NCR', 'Manila', 'Ermita', 14.5823, 120.9748),
('NCR', 'Quezon City', 'Diliman', 14.6507, 121.0494),
('NCR', 'Makati', 'Poblacion', 14.5547, 121.0244),
('Central Luzon', 'Angeles City', 'Balibago', 15.1628, 120.5606),
('Calabarzon', 'Antipolo', 'Dela Paz', 14.6255, 121.1245);

INSERT INTO categories (category_name) VALUES
('Beverages'),
('Snacks'),
('Personal Care'),
('Household Items'),
('Canned Goods');

-- Create indexes for performance
CREATE INDEX idx_sales_date_store ON sales_transactions(transaction_date, store_id);
CREATE INDEX idx_sales_customer_date ON sales_transactions(customer_id, transaction_date);
CREATE INDEX idx_inventory_alerts ON inventory(store_id, current_stock, min_stock_level);