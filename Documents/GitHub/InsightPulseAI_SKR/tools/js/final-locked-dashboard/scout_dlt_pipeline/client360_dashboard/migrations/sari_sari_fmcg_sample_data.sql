-- Sari-Sari Store FMCG Sample Data for TBWA\SMP Clients
-- Focusing exclusively on Sari-Sari stores with FMCG products from key clients

-- Set the date for the migration
\set migration_date '\'' NOW() '\''

-- Clean up existing non-Sari-Sari stores and their related data
DO $$
BEGIN
    -- Delete store-related data for non-Sari-Sari stores
    DELETE FROM store_brand_distribution WHERE store_id IN (
        SELECT store_id FROM stores WHERE store_type_id != 1
    );
    
    DELETE FROM store_product_category_distribution WHERE store_id IN (
        SELECT store_id FROM stores WHERE store_type_id != 1
    );
    
    DELETE FROM store_metrics WHERE store_id IN (
        SELECT store_id FROM stores WHERE store_type_id != 1
    );
    
    -- Finally delete the non-Sari-Sari stores
    DELETE FROM stores WHERE store_type_id != 1;
    
    -- Clean up store types to keep only Sari-Sari stores
    DELETE FROM store_types WHERE store_type_id != 1;
END;
$$;

-- Ensure we have the correct product categories
INSERT INTO product_categories (category_id, category_name, description)
VALUES 
    (1, 'Beverage', 'Drinks including juice, water, soda, and more'),
    (2, 'Snack', 'Packaged snack foods like chips, crackers, cookies'),
    (3, 'Dairy', 'Milk and dairy products'),
    (4, 'Household', 'Cleaning and household maintenance products'),
    (5, 'Personal Care', 'Hygiene and beauty products'),
    (6, 'Sauce', 'Cooking sauces and condiments'),
    (7, 'Pasta', 'Pasta and noodle products')
ON CONFLICT (category_id) DO UPDATE SET
    description = EXCLUDED.description;

-- Update and expand brands with detailed TBWA\SMP client portfolio
DELETE FROM brands WHERE brand_id > 0;

INSERT INTO brands (brand_id, brand_name, company_name, is_tbwa_client)
VALUES
    -- Del Monte Philippines
    (1, 'Del Monte', 'Del Monte Philippines', true),
    (2, 'Fit ''n Right', 'Del Monte Philippines', true),
    (3, 'Today''s', 'Del Monte Philippines', true),
    (4, 'S&W Premium', 'Del Monte Philippines', true),
    
    -- Oishi (Liwayway Marketing)
    (5, 'Oishi', 'Liwayway Marketing', true),
    (6, 'Smart C+', 'Liwayway Marketing', true),
    (7, 'Oaties', 'Liwayway Marketing', true),
    (8, 'Gourmet Picks', 'Liwayway Marketing', true),
    (9, 'Deli Mex', 'Liwayway Marketing', true),
    
    -- Alaska Milk Corporation
    (10, 'Alaska', 'Alaska Milk Corporation', true),
    (11, 'Krem-Top', 'Alaska Milk Corporation', true),
    (12, 'Alpine', 'Alaska Milk Corporation', true),
    (13, 'Cow Bell', 'Alaska Milk Corporation', true),
    
    -- Peerless Products
    (14, 'Champion', 'Peerless Products', true),
    (15, 'Cyclone', 'Peerless Products', true),
    (16, 'Calla', 'Peerless Products', true),
    (17, 'Hana', 'Peerless Products', true),
    (18, 'Pride', 'Peerless Products', true),
    (19, 'Care Plus', 'Peerless Products', true),
    
    -- Competitors (for comparison)
    (20, 'Nestle', 'Nestle Philippines', false),
    (21, 'Unilever', 'Unilever Philippines', false),
    (22, 'Jack n Jill', 'Universal Robina Corporation', false),
    (23, 'Monde Nissin', 'Monde Nissin Corporation', false),
    (24, 'Century Pacific', 'Century Pacific Food Inc', false),
    (25, 'Coca-Cola', 'Coca-Cola Beverages Philippines', false)
ON CONFLICT (brand_id) DO NOTHING;

-- Create detailed product catalog for FMCG items
DELETE FROM products WHERE TRUE;

INSERT INTO products (productid, productname, brandid, categoryid, upc, defaultprice, isactive)
VALUES
    -- Del Monte Philippines
    (uuid_generate_v4(), 'Del Monte Pineapple Juice 240ml', 1, 1, '4800024556157', 28.50, true),
    (uuid_generate_v4(), 'Del Monte Fruit Cocktail 432g', 1, 2, '4800024110957', 92.75, true),
    (uuid_generate_v4(), 'Del Monte Tomato Sauce 250g', 1, 6, '4800024147625', 24.50, true),
    (uuid_generate_v4(), 'Del Monte Spaghetti Sauce 1kg', 1, 6, '4800024191214', 121.25, true),
    (uuid_generate_v4(), 'Del Monte Spaghetti 1kg', 1, 7, '4800024715416', 87.50, true),
    (uuid_generate_v4(), 'Fit ''n Right Pineapple 330ml', 2, 1, '4800024772624', 25.75, true),
    (uuid_generate_v4(), 'Fit ''n Right Four Seasons 330ml', 2, 1, '4800024772631', 25.75, true),
    (uuid_generate_v4(), 'Today''s Orange Juice 1L', 3, 1, '4800024556201', 85.50, true),
    (uuid_generate_v4(), 'S&W Premium Sliced Peaches 439g', 4, 2, '4800024115259', 112.50, true),
    
    -- Oishi (Liwayway Marketing)
    (uuid_generate_v4(), 'Oishi Prawn Crackers 90g', 5, 2, '4800194123457', 25.50, true),
    (uuid_generate_v4(), 'Oishi Ridges Cheddar 85g', 5, 2, '4800194128957', 32.75, true),
    (uuid_generate_v4(), 'Oishi Pillows Choco 38g', 5, 2, '4800194129152', 15.50, true),
    (uuid_generate_v4(), 'Oishi Crispy Patata 85g', 5, 2, '4800194129398', 29.75, true),
    (uuid_generate_v4(), 'Smart C+ Lemon 500ml', 6, 1, '4800194151283', 32.50, true),
    (uuid_generate_v4(), 'Smart C+ Orange 500ml', 6, 1, '4800194151290', 32.50, true),
    (uuid_generate_v4(), 'Oaties Chocolate Chip 300g', 7, 2, '4800194118811', 55.75, true),
    (uuid_generate_v4(), 'Gourmet Picks Mixed Nuts 150g', 8, 2, '4800194180108', 128.50, true),
    (uuid_generate_v4(), 'Deli Mex Nacho Chips 65g', 9, 2, '4800194145108', 35.25, true),
    
    -- Alaska Milk Corporation
    (uuid_generate_v4(), 'Alaska Evaporated Milk 370ml', 10, 3, '4800570128568', 48.75, true),
    (uuid_generate_v4(), 'Alaska Condensed Milk 300ml', 10, 3, '4800570128575', 54.50, true),
    (uuid_generate_v4(), 'Alaska Powdered Milk 150g', 10, 3, '4800570128582', 82.25, true),
    (uuid_generate_v4(), 'Krem-Top Creamer Sachet 5g', 11, 3, '4800570129268', 3.50, true),
    (uuid_generate_v4(), 'Alpine Low Fat Milk 180g', 12, 3, '4800570130431', 72.75, true),
    (uuid_generate_v4(), 'Cow Bell Coffee Creamer 250g', 13, 3, '4800570131278', 75.50, true),
    
    -- Peerless Products
    (uuid_generate_v4(), 'Champion Detergent Powder 80g', 14, 4, '4806510310128', 10.50, true),
    (uuid_generate_v4(), 'Champion Ultramatic 1kg', 14, 4, '4806510310135', 120.25, true),
    (uuid_generate_v4(), 'Cyclone Bleach 250ml', 15, 4, '4806510320134', 32.50, true),
    (uuid_generate_v4(), 'Calla Body Wash Rose 250ml', 16, 5, '4806510340140', 78.75, true),
    (uuid_generate_v4(), 'Hana Shampoo Regular 180ml', 17, 5, '4806510350149', 65.25, true),
    (uuid_generate_v4(), 'Pride Dishwashing Liquid 250ml', 18, 4, '4806510360156', 48.50, true),
    (uuid_generate_v4(), 'Care Plus Hand Sanitizer 60ml', 19, 5, '4806510370163', 42.75, true);

-- Add more Sari-Sari stores covering various regions for better geographical distribution
INSERT INTO stores (
    store_id, name, store_type_id, owner, contact_number, 
    street_address, barangay_id, postal_code, 
    latitude, longitude, geolocation_accuracy, is_active
)
VALUES
    -- Metro Manila stores
    ('sari-011', 'Mang Pedro''s Tindahan', 1, 'Pedro Santos', '+63-917-234-5678', 
     '15 Sampaguita St.', 'NCR-QZN-STR', '1103', 
     14.6315, 121.0255, 'high', true),
    
    ('sari-012', 'Ate Nene''s Corner Store', 1, 'Nene Reyes', '+63-918-345-6789', 
     '67 Mabini St.', 'NCR-MND-WWK', '1550', 
     14.5764, 121.0442, 'high', true),
    
    ('sari-013', 'Kuya Ben''s Sari-Sari', 1, 'Benjamin Cruz', '+63-919-456-7890', 
     '23 Rizal Ave.', 'NCR-PSG-KPT', '1600', 
     14.5732, 121.0626, 'high', true),
    
    -- Cebu stores
    ('sari-014', 'Manang Rosa''s Store', 1, 'Rosa Flores', '+63-920-567-8901', 
     '56 Colon St.', 'VII-CEB-CPC', '6000', 
     10.2946, 123.9017, 'high', true),
    
    ('sari-015', 'Tatay Mario''s Tindahan', 1, 'Mario Gomez', '+63-921-678-9012', 
     '89 Mango Ave.', 'VII-CEB-LHG', '6000', 
     10.3106, 123.8909, 'high', true),
    
    -- Davao stores
    ('sari-016', 'Aling Carmen''s Store', 1, 'Carmen Tan', '+63-922-789-0123', 
     '34 Ilustre St.', 'XI-DVO-POB', '8000', 
     7.0650, 125.6102, 'high', true),
    
    ('sari-017', 'Mang Andoy''s Sari-Sari', 1, 'Andres Garcia', '+63-923-890-1234', 
     '102 Claveria St.', 'XI-DVO-POB', '8000', 
     7.0739, 125.6132, 'high', true),
    
    -- Iloilo store
    ('sari-018', 'Nanay Fe''s Mini Store', 1, 'Felisa Gonzales', '+63-924-901-2345', 
     '45 JM Basa St.', 'VI-ILO-CTP', '5000', 
     10.6953, 122.5644, 'high', true),
    
    -- Baguio store
    ('sari-019', 'Manong Tony''s Sari-Sari', 1, 'Antonio Reyes', '+63-925-012-3456', 
     '77 Session Road', 'CAR-BGU-BRN', '2600', 
     16.4137, 120.5977, 'high', true),
    
    -- Batangas store
    ('sari-020', 'Ate Mely''s Corner Store', 1, 'Mely Hernandez', '+63-926-123-4567', 
     '28 P. Burgos St.', 'IV-A-BTG-KMI', '4200', 
     13.7535, 121.0593, 'high', true)
ON CONFLICT (store_id) DO NOTHING;

-- Update store metrics with FMCG-focused data
DELETE FROM store_metrics WHERE store_id IN (
    SELECT store_id FROM stores WHERE store_type_id = 1
);

INSERT INTO store_metrics (
    store_id, metric_date, sales_30d, sales_7d, customer_count_30d,
    average_basket_size, growth_rate_pct, repurchase_rate_pct,
    conversion_rate_pct, digital_payment_pct
)
SELECT 
    s.store_id,
    :migration_date,
    -- Total sales between 30,000 and 60,000 for a typical Sari-Sari store
    ROUND(30000 + random() * 30000, 2) as sales_30d,
    -- Last 7 days sales (approximately 20-25% of monthly)
    ROUND((30000 + random() * 30000) * (0.20 + random() * 0.05), 2) as sales_7d,
    -- Monthly customer count between 200-450
    FLOOR(200 + random() * 250) as customer_count_30d,
    -- Average basket size between 120-180 pesos
    ROUND(120 + random() * 60, 2) as average_basket_size,
    -- Growth rate between 3-15%
    ROUND(3 + random() * 12, 1) as growth_rate_pct,
    -- Repurchase rate between 55-75%
    ROUND(55 + random() * 20, 1) as repurchase_rate_pct,
    -- Conversion rate between 65-85%
    ROUND(65 + random() * 20, 1) as conversion_rate_pct,
    -- Digital payment adoption between 20-45%
    ROUND(20 + random() * 25, 1) as digital_payment_pct
FROM 
    stores s
WHERE 
    s.store_type_id = 1;

-- Update brand distribution within stores with TBWA clients taking top positions
DELETE FROM store_brand_distribution WHERE store_id IN (
    SELECT store_id FROM stores WHERE store_type_id = 1
);

-- For each store, insert top 8 brands with TBWA clients prominently featured
DO $$
DECLARE
    v_store RECORD;
    v_rank INTEGER;
    v_brand_ids INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
    v_tbwa_brand_ids INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    v_brand_id INTEGER;
    v_sales_contribution DECIMAL(5,2);
    v_shelf_space DECIMAL(5,2);
    v_used_brands INTEGER[] := '{}';
BEGIN
    FOR v_store IN SELECT store_id FROM stores WHERE store_type_id = 1
    LOOP
        v_used_brands := '{}';
        
        -- Ensure at least 4-6 TBWA brands in top positions
        FOR v_rank IN 1..FLOOR(4 + random() * 3)
        LOOP
            -- Pick random TBWA brand not yet used
            LOOP
                v_brand_id := v_tbwa_brand_ids[FLOOR(1 + random() * array_length(v_tbwa_brand_ids, 1))];
                EXIT WHEN v_brand_id != ALL(v_used_brands);
            END LOOP;
            v_used_brands := array_append(v_used_brands, v_brand_id);
            
            -- Higher contribution for top brands
            v_sales_contribution := ROUND((30 - v_rank * 2) + random() * 5, 1);
            v_shelf_space := ROUND(v_sales_contribution - random() * 2, 1);
            
            INSERT INTO store_brand_distribution 
                (store_id, brand_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
            VALUES 
                (v_store.store_id, v_brand_id, v_sales_contribution, v_shelf_space, v_rank, :migration_date);
        END LOOP;
        
        -- Fill remaining positions with other brands
        FOR v_rank IN (array_length(v_used_brands, 1) + 1)..8
        LOOP
            -- Pick random brand not yet used
            LOOP
                v_brand_id := v_brand_ids[FLOOR(1 + random() * array_length(v_brand_ids, 1))];
                EXIT WHEN v_brand_id != ALL(v_used_brands);
            END LOOP;
            v_used_brands := array_append(v_used_brands, v_brand_id);
            
            -- Lower contribution for bottom brands
            v_sales_contribution := ROUND((30 - v_rank * 2) + random() * 3, 1);
            v_shelf_space := ROUND(v_sales_contribution - random() * 2, 1);
            
            INSERT INTO store_brand_distribution 
                (store_id, brand_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date)
            VALUES 
                (v_store.store_id, v_brand_id, v_sales_contribution, v_shelf_space, v_rank, :migration_date);
        END LOOP;
    END LOOP;
END;
$$;

-- Update product category distribution
DELETE FROM store_product_category_distribution WHERE store_id IN (
    SELECT store_id FROM stores WHERE store_type_id = 1
);

-- Insert category distribution data for each store
INSERT INTO store_product_category_distribution (
    store_id, category_id, sales_contribution_pct, shelf_space_pct, rank_in_store, as_of_date
)
SELECT 
    s.store_id,
    pc.category_id,
    CASE 
        WHEN pc.category_id = 2 THEN ROUND(25 + random() * 10, 1) -- Snacks (highest)
        WHEN pc.category_id = 1 THEN ROUND(20 + random() * 8, 1)  -- Beverages (2nd)
        WHEN pc.category_id = 3 THEN ROUND(15 + random() * 8, 1)  -- Dairy (3rd)
        WHEN pc.category_id = 4 THEN ROUND(12 + random() * 6, 1)  -- Household (4th)
        WHEN pc.category_id = 5 THEN ROUND(10 + random() * 5, 1)  -- Personal Care (5th)
        WHEN pc.category_id = 6 THEN ROUND(8 + random() * 4, 1)   -- Sauce (6th)
        WHEN pc.category_id = 7 THEN ROUND(5 + random() * 3, 1)   -- Pasta (7th)
        ELSE ROUND(5 + random() * 3, 1)
    END as sales_contribution_pct,
    CASE 
        WHEN pc.category_id = 2 THEN ROUND(22 + random() * 8, 1)  -- Snacks (highest)
        WHEN pc.category_id = 1 THEN ROUND(18 + random() * 8, 1)  -- Beverages (2nd)
        WHEN pc.category_id = 3 THEN ROUND(13 + random() * 7, 1)  -- Dairy (3rd)
        WHEN pc.category_id = 4 THEN ROUND(10 + random() * 6, 1)  -- Household (4th)
        WHEN pc.category_id = 5 THEN ROUND(8 + random() * 5, 1)   -- Personal Care (5th)
        WHEN pc.category_id = 6 THEN ROUND(7 + random() * 4, 1)   -- Sauce (6th)
        WHEN pc.category_id = 7 THEN ROUND(4 + random() * 3, 1)   -- Pasta (7th)
        ELSE ROUND(4 + random() * 3, 1)
    END as shelf_space_pct,
    pc.category_id as rank_in_store,
    :migration_date
FROM 
    stores s
CROSS JOIN 
    product_categories pc
WHERE 
    s.store_type_id = 1 AND
    pc.category_id BETWEEN 1 AND 7;

-- Create sample SalesInteractions data
INSERT INTO SalesInteractions (
    InteractionID, SessionID, StoreID, CustomerID, 
    InteractionTimestamp, InteractionDuration, InteractionType
)
SELECT 
    uuid_generate_v4()::VARCHAR as InteractionID,
    uuid_generate_v4()::VARCHAR as SessionID,
    s.store_id,
    uuid_generate_v4()::VARCHAR as CustomerID,
    -- Interactions within the last 30 days
    (:migration_date::TIMESTAMP - (INTERVAL '1 day' * (random() * 30))) as InteractionTimestamp,
    -- Duration between 60 and 600 seconds
    FLOOR(60 + random() * 540) as InteractionDuration,
    CASE 
        WHEN random() < 0.7 THEN 'Purchase'
        WHEN random() < 0.9 THEN 'Inquiry'
        ELSE 'Browse'
    END as InteractionType
FROM 
    stores s
CROSS JOIN 
    generate_series(1, 10) as i -- 10 interactions per store
WHERE 
    s.store_type_id = 1;

-- Add transaction metrics to SalesInteractions
UPDATE SalesInteractions
SET 
    TransactionDuration = FLOOR(60 + random() * 540),
    ProductCount = FLOOR(2 + random() * 6),
    BasketValue = ROUND((100 + random() * 200)::numeric, 2),
    TransactionCompleted = CASE WHEN random() < 0.85 THEN TRUE ELSE FALSE END,
    DwellTimeSeconds = FLOOR(90 + random() * 360),
    CustomerExpressions = jsonb_build_object(
        'satisfaction', (ARRAY['low', 'medium', 'high'])[FLOOR(random() * 3 + 1)],
        'emotionalCues', jsonb_build_array(
            (ARRAY['neutral', 'interested', 'happy', 'confused', 'concerned'])[FLOOR(random() * 5 + 1)],
            (ARRAY['neutral', 'interested', 'happy', 'confused', 'concerned'])[FLOOR(random() * 5 + 1)]
        ),
        'urgency', (ARRAY['low', 'medium', 'high'])[FLOOR(random() * 3 + 1)],
        'confidence', (ARRAY['low', 'medium', 'high'])[FLOOR(random() * 3 + 1)]
    );

-- Create TransactionProducts records
INSERT INTO TransactionProducts (
    InteractionID, ProductID, ProductName, ProductCategory, 
    Quantity, IsSubstitution, RequestedNotAvailable
)
SELECT 
    si.InteractionID,
    p.product_id,
    p.product_name,
    pc.category_name,
    FLOOR(1 + random() * 3) as Quantity,
    CASE WHEN random() < 0.2 THEN TRUE ELSE FALSE END as IsSubstitution,
    CASE WHEN random() < 0.15 THEN TRUE ELSE FALSE END as RequestedNotAvailable
FROM 
    SalesInteractions si
CROSS JOIN LATERAL (
    SELECT product_id, product_name, category_id
    FROM products
    ORDER BY random()
    LIMIT FLOOR(1 + random() * 5) -- 1-5 products per transaction
) p
JOIN product_categories pc ON p.category_id = pc.category_id
WHERE 
    si.TransactionCompleted = TRUE;

-- Create RequestPatterns records
INSERT INTO RequestPatterns (
    InteractionID, RequestType, RequestCategory, RequestFrequency, RequestTimeSeconds
)
SELECT 
    si.InteractionID,
    rt.TypeName,
    rc.CategoryName,
    FLOOR(1 + random() * 2) as RequestFrequency,
    FLOOR(10 + random() * 60) as RequestTimeSeconds
FROM 
    SalesInteractions si
CROSS JOIN LATERAL (
    SELECT TypeName
    FROM RequestTypes
    ORDER BY random()
    LIMIT FLOOR(1 + random() * 3) -- 1-3 request types per interaction
) rt
JOIN RequestCategories rc ON random() < 0.25 -- Random category assignment
WHERE 
    si.InteractionDuration > 30;

-- Create UnbrandedItems records
INSERT INTO UnbrandedItems (
    InteractionID, ItemDescription, CategoryAssociation, Quantity
)
SELECT 
    si.InteractionID,
    -- Common unbranded products in Sari-Sari stores
    (ARRAY[
        'Rice (per kilo)', 'Sugar (per kilo)', 'Salt (per pack)', 
        'Cooking Oil (per bottle)', 'Vinegar (per bottle)',
        'Bread', 'Eggs (per piece)', 'Candies', 'Instant Coffee Sachet',
        'Powdered Milk Sachet', 'Instant Noodles', 'Canned Goods',
        'Biscuits', 'Cigarettes', 'Matches', 'Phone Load'
    ])[FLOOR(random() * 16 + 1)] as ItemDescription,
    ic.CategoryName,
    FLOOR(1 + random() * 3) as Quantity
FROM 
    SalesInteractions si
CROSS JOIN LATERAL (
    SELECT CategoryName
    FROM ItemCategories
    ORDER BY random()
    LIMIT 1 -- One category per unbranded item
) ic
WHERE 
    random() < 0.4; -- Only about 40% of interactions include unbranded items

-- Create SalesInteractionBrands records for brand mentions
INSERT INTO SalesInteractionBrands (
    InteractionID, BrandID, MentionCount, Sentiment
)
SELECT 
    si.InteractionID,
    b.brand_id,
    FLOOR(1 + random() * 3) as MentionCount,
    (ARRAY['negative', 'neutral', 'positive'])[FLOOR(1 + random() * 3)] as Sentiment
FROM 
    SalesInteractions si
CROSS JOIN LATERAL (
    SELECT brand_id
    FROM brands
    WHERE is_tbwa_client = TRUE -- Focus on TBWA clients
    ORDER BY random()
    LIMIT FLOOR(1 + random() * 4) -- 1-4 brand mentions per interaction
) b
WHERE 
    si.InteractionDuration > 30;

-- Create SalesInteractionTranscripts records
INSERT INTO SalesInteractionTranscripts (
    InteractionID, TranscriptText, Language, ConfidenceScore
)
SELECT 
    si.InteractionID,
    CASE FLOOR(random() * 5)
        WHEN 0 THEN 'Customer: Magkano po yung Alaska milk? Meron po ba kayo nung maliit na tin? Sales associate: Meron po, 48 pesos po yung maliit. Customer: Sige, isa nga. Tapos yung Oishi Prawn Crackers. Sales associate: 25 pesos po. Customer: Okay, dalawa na lang.'
        WHEN 1 THEN 'Customer: Pabili nga ng Del Monte ketchup, yung maliit. Sales associate: 24 pesos po. Customer: Pabili din ng Champion, yung 80 grams. Wala ba kayong Pride? Sales associate: Meron po, 48 pesos naman po yun.'
        WHEN 2 THEN 'Customer: Ate, pabili ng Smart C+, yung orange. Sales associate: 32 pesos po. Customer: Sige, dalawa. Meron din ba kayong Fit n Right? Sales associate: Wala na po eh, kahapon pa ubos. Alaska na lang po meron.'
        WHEN 3 THEN 'Customer: Manong, magkano yung Hana shampoo? Sales associate: 65 pesos po. Customer: Ay mahal pala. Sige, Care Plus na lang, yung hand sanitizer. Sales associate: 42 pesos po yun. Customer: Sige, isa nga.'
        WHEN 4 THEN 'Customer: Pabili ng Alaska evap, yung dalawang piraso. Sales associate: 97 pesos po lahat. Customer: Sige. Tapos isang Del Monte spaghetti sauce. Sales associate: 121 pesos po. Gusto niyo rin po ng pasta? Customer: Hindi na, salamat.'
    END as TranscriptText,
    'tl-PH' as Language, -- Tagalog-Philippines
    ROUND((0.7 + random() * 0.25)::numeric, 2) as ConfidenceScore
FROM 
    SalesInteractions si
WHERE 
    random() < 0.7; -- 70% of interactions have transcripts

-- Update Barangay metrics to match store-level changes
UPDATE barangay_metrics bm
SET 
    store_count = (
        SELECT COUNT(*) 
        FROM stores 
        WHERE barangay_id = bm.barangay_id AND store_type_id = 1
    ),
    total_sales = (
        SELECT COALESCE(SUM(sm.sales_30d), 0)
        FROM store_metrics sm
        JOIN stores s ON sm.store_id = s.store_id
        WHERE s.barangay_id = bm.barangay_id AND s.store_type_id = 1
    ),
    average_sales_per_store = (
        SELECT COALESCE(AVG(sm.sales_30d), 0)
        FROM store_metrics sm
        JOIN stores s ON sm.store_id = s.store_id
        WHERE s.barangay_id = bm.barangay_id AND s.store_type_id = 1
    ),
    growth_rate_pct = (
        SELECT COALESCE(AVG(sm.growth_rate_pct), 0)
        FROM store_metrics sm
        JOIN stores s ON sm.store_id = s.store_id
        WHERE s.barangay_id = bm.barangay_id AND s.store_type_id = 1
    )
WHERE EXISTS (
    SELECT 1 
    FROM stores 
    WHERE barangay_id = bm.barangay_id AND store_type_id = 1
);

-- Add comment for documentation
COMMENT ON DATABASE postgres IS 'Sari-Sari Store FMCG Sample Data migration completed on ' || CAST(:migration_date AS TEXT);

-- Final verification of data loaded
SELECT 'Brands' as entity, COUNT(*) as record_count FROM brands WHERE is_tbwa_client = TRUE
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Sari-Sari Stores', COUNT(*) FROM stores WHERE store_type_id = 1
UNION ALL
SELECT 'Interactions', COUNT(*) FROM SalesInteractions
UNION ALL
SELECT 'Transaction Products', COUNT(*) FROM TransactionProducts
UNION ALL
SELECT 'Brand Mentions', COUNT(*) FROM SalesInteractionBrands
UNION ALL
SELECT 'Transcripts', COUNT(*) FROM SalesInteractionTranscripts;