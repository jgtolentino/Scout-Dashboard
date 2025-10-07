-- Sari-Sari Store Transaction Metrics Enhancement Schema
-- This migration extends the database schema to capture and analyze Sari-Sari store transaction metrics

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if tables exist before making changes
DO $$
BEGIN
    -- Check if SalesInteractions table exists and extend it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'salesinteractions') THEN
        -- Add new fields to SalesInteractions table if they don't exist
        BEGIN
            ALTER TABLE SalesInteractions
            ADD COLUMN IF NOT EXISTS TransactionDuration INTEGER,
            ADD COLUMN IF NOT EXISTS ProductCount INTEGER,
            ADD COLUMN IF NOT EXISTS BasketValue DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS TransactionCompleted BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS DwellTimeSeconds INTEGER,
            ADD COLUMN IF NOT EXISTS CustomerExpressions JSONB;
        EXCEPTION WHEN duplicate_column THEN
            -- Column already exists, do nothing
        END;
    END IF;
END;
$$;

-- Create new tables for enhanced transaction tracking
CREATE TABLE IF NOT EXISTS RequestTypes (
    TypeID SERIAL PRIMARY KEY,
    TypeName VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT
);

CREATE TABLE IF NOT EXISTS RequestCategories (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT
);

CREATE TABLE IF NOT EXISTS ItemCategories (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT
);

-- Create transaction tracking tables
CREATE TABLE IF NOT EXISTS TransactionProducts (
    TransactionProductID SERIAL PRIMARY KEY,
    InteractionID VARCHAR(36) REFERENCES SalesInteractions(InteractionID),
    ProductID VARCHAR(36),
    ProductName VARCHAR(100),
    ProductCategory VARCHAR(50),
    Quantity INTEGER DEFAULT 1,
    IsSubstitution BOOLEAN DEFAULT FALSE,
    OriginalProductID VARCHAR(36),
    RequestedNotAvailable BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS RequestPatterns (
    RequestPatternID SERIAL PRIMARY KEY,
    InteractionID VARCHAR(36) REFERENCES SalesInteractions(InteractionID),
    RequestType VARCHAR(50) REFERENCES RequestTypes(TypeName),
    RequestCategory VARCHAR(50) REFERENCES RequestCategories(CategoryName),
    RequestFrequency INTEGER DEFAULT 1,
    RequestTimeSeconds INTEGER,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UnbrandedItems (
    UnbrandedItemID SERIAL PRIMARY KEY,
    InteractionID VARCHAR(36) REFERENCES SalesInteractions(InteractionID),
    ItemDescription VARCHAR(100),
    CategoryAssociation VARCHAR(50) REFERENCES ItemCategories(CategoryName),
    Quantity INTEGER DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Populate reference data
INSERT INTO RequestTypes (TypeName, Description)
VALUES 
    ('PriceInquiry', 'Customer asking about product price'),
    ('Availability', 'Customer checking if product is available'),
    ('Substitution', 'Customer asking for product substitution'),
    ('CreditRequest', 'Customer asking to purchase on credit (utang)'),
    ('BulkPurchase', 'Customer buying in bulk quantities'),
    ('ItemLocation', 'Customer asking where to find specific item'),
    ('Bargaining', 'Customer attempting to negotiate price'),
    ('Recommendation', 'Customer asking for product recommendation')
ON CONFLICT (TypeName) DO NOTHING;

INSERT INTO RequestCategories (CategoryName, Description)
VALUES 
    ('InformationSeeking', 'Customer seeking information about products'),
    ('TransactionFacilitation', 'Customer trying to complete transaction'),
    ('ValueOptimization', 'Customer trying to maximize value'),
    ('ProductAssessment', 'Customer evaluating product suitability')
ON CONFLICT (CategoryName) DO NOTHING;

INSERT INTO ItemCategories (CategoryName, Description)
VALUES 
    ('Beverage', 'Drinks including juice, water, soda'),
    ('Snack', 'Packaged snack foods'),
    ('Household', 'Cleaning and household items'),
    ('PersonalCare', 'Hygiene and personal care items'),
    ('Condiment', 'Flavor enhancers and cooking ingredients'),
    ('BreakfastItem', 'Items typically consumed for breakfast'),
    ('BabyProduct', 'Products for infants and toddlers'),
    ('Produce', 'Fresh fruits and vegetables'),
    ('Tobacco', 'Cigarettes and tobacco products'),
    ('LoadCredit', 'Mobile phone load/credits')
ON CONFLICT (CategoryName) DO NOTHING;

-- Create or replace view for simplified analysis
CREATE OR REPLACE VIEW TransactionAnalysisView AS
SELECT 
    si.InteractionID,
    si.SessionID,
    si.StoreID,
    si.CustomerID,
    si.InteractionTimestamp,
    si.TransactionDuration,
    si.ProductCount,
    si.BasketValue,
    si.TransactionCompleted,
    si.DwellTimeSeconds,
    si.CustomerExpressions,
    COUNT(DISTINCT tp.TransactionProductID) AS TotalProducts,
    COUNT(DISTINCT CASE WHEN tp.IsSubstitution = TRUE THEN tp.TransactionProductID END) AS TotalSubstitutions,
    COUNT(DISTINCT rp.RequestPatternID) AS TotalRequests,
    COUNT(DISTINCT ui.UnbrandedItemID) AS TotalUnbrandedItems
FROM 
    SalesInteractions si
LEFT JOIN 
    TransactionProducts tp ON si.InteractionID = tp.InteractionID
LEFT JOIN 
    RequestPatterns rp ON si.InteractionID = rp.InteractionID
LEFT JOIN 
    UnbrandedItems ui ON si.InteractionID = ui.InteractionID
GROUP BY 
    si.InteractionID, si.SessionID, si.StoreID, si.CustomerID, si.InteractionTimestamp,
    si.TransactionDuration, si.ProductCount, si.BasketValue, si.TransactionCompleted,
    si.DwellTimeSeconds, si.CustomerExpressions;

-- Create stored procedures
CREATE OR REPLACE FUNCTION CalculateTransactionMetrics(
    p_interactionID VARCHAR(36)
)
RETURNS VOID AS $$
DECLARE
    v_productCount INTEGER;
    v_basketValue DECIMAL(10, 2);
    v_transactionCompleted BOOLEAN;
BEGIN
    -- Calculate product count
    SELECT COUNT(TransactionProductID) INTO v_productCount
    FROM TransactionProducts
    WHERE InteractionID = p_interactionID;
    
    -- Default transaction completion status based on product count
    v_transactionCompleted := (v_productCount > 0);
    
    -- Calculate basket value (would be based on product pricing in real implementation)
    -- Here we're simulating with a simple calculation
    SELECT COALESCE(SUM(100.00 * Quantity), 0) INTO v_basketValue
    FROM TransactionProducts
    WHERE InteractionID = p_interactionID;
    
    -- Update the transaction metrics
    UPDATE SalesInteractions
    SET 
        ProductCount = v_productCount,
        BasketValue = v_basketValue,
        TransactionCompleted = v_transactionCompleted
    WHERE InteractionID = p_interactionID;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ExtractCustomerExpressions(
    p_interactionID VARCHAR(36),
    p_transcript TEXT
)
RETURNS VOID AS $$
DECLARE
    v_expressions JSONB;
BEGIN
    -- This would contain complex logic to analyze transcript text
    -- Simplified example here
    v_expressions := jsonb_build_object(
        'satisfaction', 'neutral',
        'emotionalCues', jsonb_build_array('neutral', 'interested'),
        'urgency', 'low',
        'confidence', 'medium'
    );
    
    -- Update the customer expressions
    UPDATE SalesInteractions
    SET CustomerExpressions = v_expressions
    WHERE InteractionID = p_interactionID;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_products_interaction ON TransactionProducts(InteractionID);
CREATE INDEX IF NOT EXISTS idx_request_patterns_interaction ON RequestPatterns(InteractionID);
CREATE INDEX IF NOT EXISTS idx_unbranded_items_interaction ON UnbrandedItems(InteractionID);
CREATE INDEX IF NOT EXISTS idx_request_patterns_type ON RequestPatterns(RequestType);
CREATE INDEX IF NOT EXISTS idx_request_patterns_category ON RequestPatterns(RequestCategory);

-- Add comments for documentation
COMMENT ON TABLE TransactionProducts IS 'Tracks individual products in a transaction, including substitutions';
COMMENT ON TABLE RequestPatterns IS 'Captures different request types identified in customer interactions';
COMMENT ON TABLE UnbrandedItems IS 'Records generic or unbranded product mentions';
COMMENT ON FUNCTION CalculateTransactionMetrics IS 'Updates transaction metrics based on products and interactions';
COMMENT ON FUNCTION ExtractCustomerExpressions IS 'Analyzes transcripts to identify customer emotional expressions';