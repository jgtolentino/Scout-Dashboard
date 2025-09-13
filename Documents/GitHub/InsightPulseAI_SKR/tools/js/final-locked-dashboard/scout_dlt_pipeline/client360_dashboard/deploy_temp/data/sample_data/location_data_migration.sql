-- Migration script to populate the location schema with enhanced FMCG location data
-- This script should be run after creating the schema using location_schema.sql

-- Set the date for the migration
\set migration_date '\'' NOW() '\''

-- Insert regions
INSERT INTO regions (region_id, region_name, country) VALUES
('NCR', 'NCR', 'Philippines'),
('CAR', 'CAR', 'Philippines'),
('I', 'Ilocos', 'Philippines'),
('II', 'Cagayan Valley', 'Philippines'),
('III', 'Central Luzon', 'Philippines'),
('IV-A', 'CALABARZON', 'Philippines'),
('IV-B', 'MIMAROPA', 'Philippines'),
('V', 'Bicol', 'Philippines'),
('VI', 'Western Visayas', 'Philippines'),
('VII', 'Central Visayas', 'Philippines'),
('VIII', 'Eastern Visayas', 'Philippines'),
('IX', 'Zamboanga Peninsula', 'Philippines'),
('X', 'Northern Mindanao', 'Philippines'),
('XI', 'Davao', 'Philippines'),
('XII', 'SOCCSKSARGEN', 'Philippines'),
('XIII', 'Caraga', 'Philippines'),
('BARMM', 'BARMM', 'Philippines')
ON CONFLICT (region_id) DO NOTHING;

-- Insert provinces
INSERT INTO provinces (province_id, province_name, region_id) VALUES
('NCR', 'Metro Manila', 'NCR'),
('BEN', 'Benguet', 'CAR'),
('ILN', 'Ilocos Norte', 'I'),
('BTG', 'Batangas', 'IV-A'),
('LEY', 'Leyte', 'VIII'),
('CMS', 'Camarines Sur', 'V'),
('ILO', 'Iloilo', 'VI'),
('CEB', 'Cebu', 'VII'),
('DAV', 'Davao del Sur', 'XI')
ON CONFLICT (province_id) DO NOTHING;

-- Insert cities
INSERT INTO cities (city_id, city_municipality, province_id, city_type, postal_code, urban_classification) VALUES
('NCR-MKT', 'Makati City', 'NCR', 'City', '1200', 'Highly Urban'),
('NCR-MNL', 'Manila City', 'NCR', 'City', '1000', 'Highly Urban'),
('NCR-QZN', 'Quezon City', 'NCR', 'City', '1100', 'Highly Urban'),
('NCR-PSG', 'Pasig City', 'NCR', 'City', '1600', 'Highly Urban'),
('NCR-MND', 'Mandaluyong City', 'NCR', 'City', '1550', 'Highly Urban'),
('NCR-LPNS', 'Las Piñas City', 'NCR', 'City', '1750', 'Highly Urban'),
('NCR-TGG', 'Taguig City', 'NCR', 'City', '1630', 'Highly Urban'),
('NCR-MRK', 'Marikina City', 'NCR', 'City', '1800', 'Urban'),
('CAR-BGU', 'Baguio City', 'BEN', 'City', '2600', 'Urban'),
('I-LAO', 'Laoag City', 'ILN', 'City', '2900', 'Urban'),
('IV-A-BTG', 'Batangas City', 'BTG', 'City', '4200', 'Urban'),
('V-NGA', 'Naga City', 'CMS', 'City', '4400', 'Urban'),
('VI-ILO', 'Iloilo City', 'ILO', 'City', '5000', 'Urban'),
('VII-CEB', 'Cebu City', 'CEB', 'City', '6000', 'Urban'),
('VIII-TAC', 'Tacloban City', 'LEY', 'City', '6500', 'Urban'),
('XI-DVO', 'Davao City', 'DAV', 'City', '8000', 'Urban')
ON CONFLICT (city_id) DO NOTHING;

-- Insert barangays
INSERT INTO barangays (barangay_id, barangay_name, city_id) VALUES
('NCR-MKT-POB', 'Poblacion', 'NCR-MKT'),
('NCR-MNL-MLT', 'Malate', 'NCR-MNL'),
('NCR-QZN-STR', 'South Triangle', 'NCR-QZN'),
('NCR-PSG-KPT', 'Kapitolyo', 'NCR-PSG'),
('NCR-MND-WWK', 'Wack Wack', 'NCR-MND'),
('NCR-MKT-BEL', 'Bel-Air', 'NCR-MKT'),
('NCR-LPNS-ALM', 'Almanza Uno', 'NCR-LPNS'),
('NCR-TGG-FTB', 'Fort Bonifacio', 'NCR-TGG'),
('NCR-MRK-BRK', 'Barangka', 'NCR-MRK'),
('CAR-BGU-BRN', 'Burnham', 'CAR-BGU'),
('I-LAO-SNL', 'San Nicolas', 'I-LAO'),
('IV-A-BTG-KMI', 'Kumintang Ilaya', 'IV-A-BTG'),
('V-NGA-CNP', 'Concepcion Pequeña', 'V-NGA'),
('VI-ILO-CTP', 'City Proper', 'VI-ILO'),
('VII-CEB-LHG', 'Lahug', 'VII-CEB'),
('VII-CEB-CPC', 'Cebu Port Center', 'VII-CEB'),
('VIII-TAC-ABU', 'Abucay', 'VIII-TAC'),
('XI-DVO-POB', 'Poblacion', 'XI-DVO')
ON CONFLICT (barangay_id) DO NOTHING;

-- Insert store types
INSERT INTO store_types (store_type_id, store_type_name, description) VALUES
(1, 'Sari-Sari Store', 'Small neighborhood convenience store typically attached to a residence'),
(2, 'Mini Mart', 'Independent small format retail store with a wider assortment than sari-sari'),
(3, 'Grocery', 'Medium sized retail store with food and household goods'),
(4, 'Supermarket', 'Large format retail store with comprehensive selection'),
(5, 'Convenience Store', 'Chain-operated retail store with standardized offerings'),
(6, 'Specialty Store', 'Retail store focused on specific categories like medicine or beauty'),
(7, 'Warehouse Club', 'Large format membership-based retail with bulk offerings')
ON CONFLICT (store_type_id) DO NOTHING;

-- Insert brands (TBWA clients first)
INSERT INTO brands (brand_id, brand_name, company_name, is_tbwa_client) VALUES
(1, 'Del Monte', 'Del Monte Philippines', true),
(2, 'Oishi', 'Liwayway Marketing', true),
(3, 'Alaska', 'Alaska Milk Corporation', true),
(4, 'Peerless', 'Peerless Products', true),
(5, 'Champion', 'Peerless Products', true),
(6, 'Pride', 'Peerless Products', true),
(7, 'Calla', 'Peerless Products', true),
(8, 'Hana', 'Peerless Products', true),
(9, 'Fit ''n Right', 'Del Monte Philippines', true),
(10, 'Today''s', 'Del Monte Philippines', true),
(11, 'Smart C+', 'Liwayway Marketing', true),
(12, 'Krem-Top', 'Alaska Milk Corporation', true),
(13, 'Alpine', 'Alaska Milk Corporation', true),
(14, 'Cow Bell', 'Alaska Milk Corporation', true),
(15, 'S&W Premium', 'Del Monte Philippines', true),
(16, 'Gourmet Picks', 'Liwayway Marketing', true),
(17, 'Oaties', 'Liwayway Marketing', true),
(18, 'Deli Mex', 'Liwayway Marketing', true),
(19, 'Cyclone', 'Peerless Products', true),
(20, 'Care Plus', 'Peerless Products', true)
ON CONFLICT (brand_id) DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (category_id, category_name, description) VALUES
(1, 'Beverage', 'Drinks including juice, water, soda, and more'),
(2, 'Snack', 'Packaged snack foods like chips, crackers, cookies'),
(3, 'Dairy', 'Milk and dairy products'),
(4, 'Household', 'Cleaning and household maintenance products'),
(5, 'Personal Care', 'Hygiene and beauty products')
ON CONFLICT (category_id) DO NOTHING;

-- Insert stores
INSERT INTO stores (
    store_id, name, store_type_id, owner, contact_number, 
    street_address, barangay_id, postal_code, 
    latitude, longitude, geolocation_accuracy, is_active
) VALUES
('sari-001', 'Mang Juan''s Sari-Sari Store', 1, 'Juan Dela Cruz', '+63-917-123-4567', 
 '123 Sampaguita St.', 'NCR-MKT-POB', '1210', 
 14.5547, 121.0244, 'high', true),
('sari-002', 'Maria''s Mini Mart', 2, 'Maria Santos', '+63-918-765-4321', 
 '45 Rizal Ave.', 'VII-CEB-LHG', '6000', 
 10.3157, 123.8854, 'high', true),
('sari-003', 'Aling Rosa''s Store', 1, 'Rosa Reyes', '+63-919-555-1234', 
 '78 Mabini St.', 'XI-DVO-POB', '8000', 
 7.0707, 125.6127, 'high', true),
('sari-004', 'Pedro''s General Merchandise', 3, 'Pedro Gonzales', '+63-920-888-7777', 
 '15 Luna St.', 'CAR-BGU-BRN', '2600', 
 16.4023, 120.5960, 'high', true),
('sari-005', 'Luz Mini Grocery', 3, 'Luz Mendoza', '+63-921-222-3333', 
 '32 Bonifacio St.', 'VI-ILO-CTP', '5000', 
 10.7202, 122.5726, 'high', true),
('sari-006', 'Tindahan ni Mila', 1, 'Mila Garcia', '+63-922-444-5555', 
 '56 Aguinaldo St.', 'I-LAO-SNL', '2900', 
 18.1982, 120.5960, 'high', true),
('sari-007', 'Kuya Ben''s Store', 1, 'Benjamin Tan', '+63-923-777-8888', 
 '89 Magsaysay Blvd.', 'VIII-TAC-ABU', '6500', 
 11.2543, 125.0008, 'high', true),
('sari-008', 'Ate Joy''s Sari-Sari', 1, 'Joy Aquino', '+63-924-111-9999', 
 '12 Quezon St.', 'V-NGA-CNP', '4400', 
 13.6192, 123.7509, 'high', true),
('sari-009', 'Carinderia ni Lola', 1, 'Lola Carmela', '+63-925-333-2222', 
 '67 Burgos St.', 'IV-A-BTG-KMI', '4200', 
 13.7565, 121.0582, 'high', true),
('sari-010', 'Tatay Romy''s Corner Store', 1, 'Romeo Villanueva', '+63-926-666-7777', 
 '23 Rizal St.', 'NCR-MRK-BRK', '1803', 
 14.6292, 121.0965, 'high', true),
('mm-001', 'Mercury Minimart', 2, 'Mercury Retail Inc.', '+63-927-888-9999', 
 '45 Taft Avenue', 'NCR-MNL-MLT', '1004', 
 14.5763, 120.9889, 'high', true),
('mm-002', 'Green Basket Mini Mart', 2, 'Green Retail Group', '+63-928-111-2222', 
 '78 Shaw Boulevard', 'NCR-PSG-KPT', '1603', 
 14.5736, 121.0574, 'high', true),
('sm-001', 'SM Supermarket - Megamall', 4, 'SM Retail Inc.', '+63-929-333-4444', 
 'EDSA corner Julia Vargas Ave.', 'NCR-MND-WWK', '1550', 
 14.5832, 121.0572, 'high', true),
('sm-002', 'SM Supermarket - Cebu', 4, 'SM Retail Inc.', '+63-930-555-6666', 
 'Cebu Business Park', 'VII-CEB-CPC', '6000', 
 10.3124, 123.9069, 'high', true),
('cv-001', '7-Eleven - Makati Avenue', 5, 'Philippine Seven Corp.', '+63-931-777-8888', 
 '123 Makati Avenue', 'NCR-MKT-POB', '1210', 
 14.5624, 121.0297, 'high', true),
('cv-002', '7-Eleven - Taft Avenue', 5, 'Philippine Seven Corp.', '+63-932-999-0000', 
 '2401 Taft Avenue', 'NCR-MNL-MLT', '1004', 
 14.5655, 120.9919, 'high', true),
('dr-001', 'Mercury Drug - Quezon Avenue', 6, 'Mercury Drug Corp.', '+63-933-123-4567', 
 '56 Quezon Avenue', 'NCR-QZN-STR', '1103', 
 14.6394, 121.0187, 'high', true),
('dr-002', 'Mercury Drug - Ayala Avenue', 6, 'Mercury Drug Corp.', '+63-934-567-8901', 
 '89 Ayala Avenue', 'NCR-MKT-BEL', '1209', 
 14.5558, 121.0247, 'high', true),
('wh-001', 'S&R Membership Shopping - Alabang', 7, 'S&R Membership Shopping', '+63-935-890-1234', 
 'Alabang-Zapote Road', 'NCR-LPNS-ALM', '1750', 
 14.4299, 121.0261, 'high', true),
('wh-002', 'S&R Membership Shopping - BGC', 7, 'S&R Membership Shopping', '+63-936-234-5678', 
 '32nd Street', 'NCR-TGG-FTB', '1634', 
 14.5496, 121.0523, 'high', true)
ON CONFLICT (store_id) DO NOTHING;

-- Insert store metrics
INSERT INTO store_metrics (
    store_id, metric_date, sales_30d, sales_7d, customer_count_30d,
    average_basket_size, growth_rate_pct, repurchase_rate_pct,
    conversion_rate_pct, digital_payment_pct
) VALUES
('sari-001', :migration_date, 42500, 8900, 312, 137, 8.7, 65.4, 67.5, 32.7),
('sari-002', :migration_date, 38750, 7650, 287, 135, 7.2, 60.2, 72.8, 56.8),
('sari-003', :migration_date, 51200, 10500, 378, 135, 12.8, 68.3, 76.5, 35.2),
('sari-004', :migration_date, 47300, 9100, 341, 139, 5.4, 63.8, 74.7, 45.8),
('sari-005', :migration_date, 35900, 7200, 265, 135, 6.8, 59.7, 71.5, 41.3),
('sari-006', :migration_date, 31200, 6400, 229, 136, 7.5, 62.8, 70.2, 28.7),
('sari-007', :migration_date, 41500, 8300, 305, 136, 9.3, 65.7, 72.8, 34.5),
('sari-008', :migration_date, 37800, 7600, 278, 136, 8.5, 63.2, 71.4, 36.7),
('sari-009', :migration_date, 49700, 9800, 366, 136, 11.2, 67.3, 73.5, 38.2),
('sari-010', :migration_date, 33500, 6700, 246, 136, 6.2, 59.8, 68.7, 41.7),
('mm-001', :migration_date, 87600, 18700, 745, 118, 13.5, 58.7, 73.2, 65.4),
('mm-002', :migration_date, 92300, 19800, 785, 118, 15.2, 60.3, 75.8, 68.7),
('sm-001', :migration_date, 4326500, 954300, 37560, 115, 7.8, 64.5, 82.3, 88.9),
('sm-002', :migration_date, 3876500, 854300, 33560, 116, 6.9, 62.7, 80.7, 86.3),
('cv-001', :migration_date, 156700, 32400, 4675, 33, 12.5, 42.8, 65.8, 87.6),
('cv-002', :migration_date, 148900, 30600, 4450, 33, 13.1, 41.5, 64.3, 85.8),
('dr-001', :migration_date, 123450, 25600, 3250, 38, 9.7, 57.2, 73.2, 78.3),
('dr-002', :migration_date, 134560, 27800, 3520, 38, 10.2, 59.3, 75.8, 80.5),
('wh-001', :migration_date, 5678900, 1234560, 12540, 453, 8.7, 72.5, 84.7, 92.3),
('wh-002', :migration_date, 6123450, 1345670, 13580, 451, 9.1, 75.8, 86.2, 93.5);

-- Insert store brand distribution (top 3 brands per store)
-- Store: sari-001
INSERT INTO store_brand_distribution (store_id, brand_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
VALUES 
('sari-001', 1, 24.5, 22.3, 1, :migration_date),
('sari-001', 2, 21.7, 19.8, 2, :migration_date),
('sari-001', 3, 16.8, 15.7, 3, :migration_date);

-- Store: sari-002
INSERT INTO store_brand_distribution (store_id, brand_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
VALUES 
('sari-002', 2, 26.8, 24.5, 1, :migration_date),
('sari-002', 1, 22.3, 20.7, 2, :migration_date),
('sari-002', 4, 15.6, 14.3, 3, :migration_date);

-- Store: sari-003
INSERT INTO store_brand_distribution (store_id, brand_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
VALUES 
('sari-003', 4, 25.7, 23.8, 1, :migration_date),
('sari-003', 3, 22.3, 20.5, 2, :migration_date),
('sari-003', 2, 18.5, 17.2, 3, :migration_date);

-- Insert store product category distribution (for all stores)
-- Just showing first few for brevity, similar patterns for remaining stores
INSERT INTO store_product_category_distribution (store_id, category_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
VALUES 
-- Store: sari-001
('sari-001', 1, 37.8, 35.6, 1, :migration_date),
('sari-001', 2, 28.6, 26.7, 2, :migration_date),
('sari-001', 3, 15.3, 14.5, 3, :migration_date),
('sari-001', 4, 10.5, 9.8, 4, :migration_date),
('sari-001', 5, 7.8, 7.2, 5, :migration_date),

-- Store: sari-002
('sari-002', 2, 34.7, 32.5, 1, :migration_date),
('sari-002', 1, 32.5, 30.8, 2, :migration_date),
('sari-002', 5, 14.2, 13.7, 3, :migration_date),
('sari-002', 3, 10.5, 9.8, 4, :migration_date),
('sari-002', 4, 8.1, 7.5, 5, :migration_date);

-- Insert barangay metrics
INSERT INTO barangay_metrics (barangay_id, metric_date, store_count, total_sales, average_sales_per_store, growth_rate_pct)
VALUES
('NCR-MKT-POB', :migration_date, 134, 8756900, 65350, 12.7),
('VII-CEB-LHG', :migration_date, 156, 6789200, 43520, 14.2),
('XI-DVO-POB', :migration_date, 178, 7123400, 40020, 13.7),
('CAR-BGU-BRN', :migration_date, 87, 3876000, 44550, 10.2),
('VI-ILO-CTP', :migration_date, 143, 5612000, 39240, 11.7),
('I-LAO-SNL', :migration_date, 98, 3123000, 31870, 9.8),
('VIII-TAC-ABU', :migration_date, 123, 4567000, 37130, 12.5),
('V-NGA-CNP', :migration_date, 103, 3456000, 33550, 10.8),
('IV-A-BTG-KMI', :migration_date, 134, 5432000, 40540, 13.2),
('NCR-MRK-BRK', :migration_date, 112, 5123000, 45740, 11.7),
('NCR-MNL-MLT', :migration_date, 145, 9786000, 67490, 14.7),
('NCR-PSG-KPT', :migration_date, 98, 6789000, 69280, 15.7);

-- Insert barangay demographics
INSERT INTO barangay_demographics (barangay_id, population, household_count, avg_household_size, income_classification, urban_classification, as_of_date)
VALUES
('NCR-MKT-POB', 65430, 15670, 4.2, 'Middle to Upper', 'Highly Urban', :migration_date),
('VII-CEB-LHG', 87650, 21440, 4.1, 'Middle', 'Urban', :migration_date),
('XI-DVO-POB', 96540, 23870, 4.0, 'Middle', 'Urban', :migration_date),
('CAR-BGU-BRN', 34560, 8760, 3.9, 'Middle to Upper', 'Urban', :migration_date),
('VI-ILO-CTP', 76540, 18970, 4.0, 'Middle', 'Urban', :migration_date),
('I-LAO-SNL', 45670, 11450, 4.0, 'Middle', 'Urban', :migration_date),
('VIII-TAC-ABU', 67890, 16780, 4.0, 'Middle to Lower', 'Urban', :migration_date),
('V-NGA-CNP', 54320, 13580, 4.0, 'Middle to Lower', 'Urban', :migration_date),
('IV-A-BTG-KMI', 76540, 18970, 4.0, 'Middle', 'Urban', :migration_date),
('NCR-MRK-BRK', 67890, 16970, 4.0, 'Middle', 'Urban', :migration_date),
('NCR-MNL-MLT', 98760, 24690, 4.0, 'Middle', 'Highly Urban', :migration_date),
('NCR-PSG-KPT', 54320, 13580, 4.0, 'Upper Middle', 'Highly Urban', :migration_date),
('NCR-MND-WWK', 42360, 10590, 4.0, 'Upper Middle to High', 'Highly Urban', :migration_date);

-- Insert barangay store type distribution
-- For Poblacion, Makati
INSERT INTO barangay_store_type_distribution (barangay_id, store_type_id, store_count, as_of_date)
VALUES
('NCR-MKT-POB', 1, 98, :migration_date),
('NCR-MKT-POB', 2, 21, :migration_date),
('NCR-MKT-POB', 5, 12, :migration_date),
('NCR-MKT-POB', 6, 3, :migration_date);

-- Insert barangay category distribution
-- For Poblacion, Makati
INSERT INTO barangay_category_distribution (barangay_id, category_id, sales_contribution_pct, as_of_date)
VALUES
('NCR-MKT-POB', 1, 37.8, :migration_date),
('NCR-MKT-POB', 2, 28.6, :migration_date),
('NCR-MKT-POB', 3, 15.3, :migration_date),
('NCR-MKT-POB', 4, 10.5, :migration_date),
('NCR-MKT-POB', 5, 7.8, :migration_date);

-- Insert barangay brand distribution
-- For Poblacion, Makati (top 5 brands)
INSERT INTO barangay_brand_distribution (barangay_id, brand_id, sales_contribution_pct, rank_in_barangay, as_of_date)
VALUES
('NCR-MKT-POB', 1, 24.5, 1, :migration_date),
('NCR-MKT-POB', 2, 21.7, 2, :migration_date),
('NCR-MKT-POB', 3, 16.8, 3, :migration_date),
('NCR-MKT-POB', 4, 12.4, 4, :migration_date),
('NCR-MKT-POB', 11, 8.3, 5, :migration_date);

-- Insert migration log (this could be done in a separate migration log table)
-- But we'll just add a comment here for tracking
COMMENT ON DATABASE postgres IS 'Location migration completed on ' || CAST(:migration_date AS TEXT);