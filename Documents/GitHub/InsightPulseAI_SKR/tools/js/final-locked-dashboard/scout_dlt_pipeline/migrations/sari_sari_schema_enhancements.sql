-- Migration script to enhance schema for Sari-Sari Store transaction metrics
-- This script implements the proposed schema enhancements for better transaction metrics analysis
-- Compatible with Scout DLT Pipeline

-- 1. SalesInteractions Table Enhancements
-- Add new columns to the SalesInteractions table for enhanced transaction metrics
PRINT 'Adding enhanced transaction metrics columns to SalesInteractions table';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionDuration')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD TransactionDuration INT NULL;
    
    PRINT 'Added TransactionDuration to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'ProductCount')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD ProductCount INT NULL;
    
    PRINT 'Added ProductCount to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'BasketValue')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD BasketValue DECIMAL(10,2) NULL;
    
    PRINT 'Added BasketValue to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'TransactionCompleted')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD TransactionCompleted BIT NULL;
    
    PRINT 'Added TransactionCompleted to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'DwellTimeSeconds')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD DwellTimeSeconds INT NULL;
    
    PRINT 'Added DwellTimeSeconds to SalesInteractions';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractions') AND name = 'CustomerExpressions')
BEGIN
    ALTER TABLE dbo.SalesInteractions 
    ADD CustomerExpressions NVARCHAR(MAX) NULL;
    
    PRINT 'Added CustomerExpressions to SalesInteractions';
END

-- 2. Create TransactionProducts Table 
-- This table tracks individual products in each transaction, including substitutions
PRINT 'Creating TransactionProducts table for detailed product tracking';

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.TransactionProducts') AND type = 'U')
BEGIN
    CREATE TABLE dbo.TransactionProducts (
        TransactionProductID INT IDENTITY(1,1) PRIMARY KEY,
        InteractionID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        IsSubstitution BIT NOT NULL DEFAULT 0,
        OriginalProductID INT NULL,
        SubstitutionReason NVARCHAR(255) NULL,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TransactionProducts_SalesInteractions 
            FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID),
        CONSTRAINT FK_TransactionProducts_Products 
            FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID),
        CONSTRAINT FK_TransactionProducts_OriginalProducts 
            FOREIGN KEY (OriginalProductID) REFERENCES dbo.Products(ProductID)
    );
    
    PRINT 'Created TransactionProducts table';
END

-- Create index for better performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TransactionProducts_InteractionID' AND object_id = OBJECT_ID('dbo.TransactionProducts'))
BEGIN
    CREATE INDEX IX_TransactionProducts_InteractionID ON dbo.TransactionProducts(InteractionID);
    PRINT 'Created index IX_TransactionProducts_InteractionID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TransactionProducts_ProductID' AND object_id = OBJECT_ID('dbo.TransactionProducts'))
BEGIN
    CREATE INDEX IX_TransactionProducts_ProductID ON dbo.TransactionProducts(ProductID);
    PRINT 'Created index IX_TransactionProducts_ProductID';
END

-- 3. Create RequestPatterns Table
-- This table categorizes and tracks customer request patterns
PRINT 'Creating RequestPatterns table for request analysis';

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.RequestPatterns') AND type = 'U')
BEGIN
    CREATE TABLE dbo.RequestPatterns (
        RequestPatternID INT IDENTITY(1,1) PRIMARY KEY,
        InteractionID INT NOT NULL,
        RequestType NVARCHAR(50) NOT NULL,
        RequestCategory NVARCHAR(50) NOT NULL,
        RequestFrequency INT NOT NULL DEFAULT 1,
        RegionalAssociation NVARCHAR(50) NULL,
        TimeOfDay TIME NULL,
        DayOfWeek TINYINT NULL,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RequestPatterns_SalesInteractions 
            FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID)
    );
    
    PRINT 'Created RequestPatterns table';
END

-- Create index for better performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequestPatterns_InteractionID' AND object_id = OBJECT_ID('dbo.RequestPatterns'))
BEGIN
    CREATE INDEX IX_RequestPatterns_InteractionID ON dbo.RequestPatterns(InteractionID);
    PRINT 'Created index IX_RequestPatterns_InteractionID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequestPatterns_RequestCategory' AND object_id = OBJECT_ID('dbo.RequestPatterns'))
BEGIN
    CREATE INDEX IX_RequestPatterns_RequestCategory ON dbo.RequestPatterns(RequestCategory);
    PRINT 'Created index IX_RequestPatterns_RequestCategory';
END

-- 4. Create UnbrandedItems Table
-- This table tracks non-branded commodities mentioned or purchased
PRINT 'Creating UnbrandedItems table for tracking generic products';

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.UnbrandedItems') AND type = 'U')
BEGIN
    CREATE TABLE dbo.UnbrandedItems (
        UnbrandedItemID INT IDENTITY(1,1) PRIMARY KEY,
        InteractionID INT NOT NULL,
        ItemDescription NVARCHAR(255) NOT NULL,
        CategoryAssociation NVARCHAR(50) NULL,
        Quantity INT NOT NULL DEFAULT 1,
        RecognitionConfidence FLOAT NULL,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_UnbrandedItems_SalesInteractions 
            FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID)
    );
    
    PRINT 'Created UnbrandedItems table';
END

-- Create index for better performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UnbrandedItems_InteractionID' AND object_id = OBJECT_ID('dbo.UnbrandedItems'))
BEGIN
    CREATE INDEX IX_UnbrandedItems_InteractionID ON dbo.UnbrandedItems(InteractionID);
    PRINT 'Created index IX_UnbrandedItems_InteractionID';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UnbrandedItems_CategoryAssociation' AND object_id = OBJECT_ID('dbo.UnbrandedItems'))
BEGIN
    CREATE INDEX IX_UnbrandedItems_CategoryAssociation ON dbo.UnbrandedItems(CategoryAssociation);
    PRINT 'Created index IX_UnbrandedItems_CategoryAssociation';
END

-- 5. Create reference tables for categorization

-- Create RequestType reference table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.RequestTypes') AND type = 'U')
BEGIN
    CREATE TABLE dbo.RequestTypes (
        RequestTypeID INT IDENTITY(1,1) PRIMARY KEY,
        TypeName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
    );
    
    PRINT 'Created RequestTypes reference table';
    
    -- Insert common request types for Sari-Sari stores
    INSERT INTO dbo.RequestTypes (TypeName, Description)
    VALUES 
        ('PriceInquiry', 'Customer asking for the price of an item'),
        ('ProductAvailability', 'Customer asking if a product is available'),
        ('ProductSubstitution', 'Customer asking for an alternative product'),
        ('MobileLoad', 'Customer requesting mobile load purchase'),
        ('Recommendation', 'Customer asking for product recommendation'),
        ('CreditRequest', 'Customer asking to purchase on credit'),
        ('BulkPurchase', 'Customer purchasing multiple items of same product'),
        ('ReturnExchange', 'Customer wanting to return or exchange a product'),
        ('ProductUsage', 'Customer asking how to use a product'),
        ('ExpiryDate', 'Customer asking about product expiration date');
        
    PRINT 'Populated RequestTypes with common Sari-Sari store request types';
END

-- Create RequestCategory reference table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.RequestCategories') AND type = 'U')
BEGIN
    CREATE TABLE dbo.RequestCategories (
        RequestCategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
    );
    
    PRINT 'Created RequestCategories reference table';
    
    -- Insert common request categories for Sari-Sari stores
    INSERT INTO dbo.RequestCategories (CategoryName, Description)
    VALUES 
        ('InformationSeeking', 'Customer looking for information'),
        ('TransactionRelated', 'Related to purchase or transaction'),
        ('ServiceRequest', 'Requesting a service like mobile loading'),
        ('ProductExploration', 'Exploring product options'),
        ('FinancialQuery', 'Related to pricing, credit, or payment'),
        ('PreferenceExpression', 'Expressing preferences or dislikes'),
        ('SpecialRequest', 'Non-standard requests for special items'),
        ('Complaint', 'Expressing dissatisfaction'),
        ('Comparison', 'Comparing between products'),
        ('Recommendation', 'Seeking advice on products');
        
    PRINT 'Populated RequestCategories with common Sari-Sari store request categories';
END

-- Create ItemCategory reference table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.ItemCategories') AND type = 'U')
BEGIN
    CREATE TABLE dbo.ItemCategories (
        ItemCategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
    );
    
    PRINT 'Created ItemCategories reference table';
    
    -- Insert common item categories for Sari-Sari stores
    INSERT INTO dbo.ItemCategories (CategoryName, Description)
    VALUES 
        ('Grains', 'Rice, corn, wheat, etc.'),
        ('Condiments', 'Salt, sugar, vinegar, etc.'),
        ('CannedGoods', 'Sardines, tuna, corned beef, etc.'),
        ('InstantNoodles', 'Instant noodles and pasta'),
        ('Beverages', 'Soda, juice, water, coffee, tea, etc.'),
        ('Snacks', 'Chips, biscuits, candies, etc.'),
        ('PersonalCare', 'Soap, shampoo, toothpaste, etc.'),
        ('Household', 'Detergent, cleaning supplies, etc.'),
        ('TobaccoProducts', 'Cigarettes and tobacco products'),
        ('SchoolSupplies', 'Pencils, paper, notebooks, etc.'),
        ('FrozenFoods', 'Ice cream, frozen meals, etc.'),
        ('VegetablesFruits', 'Fresh or preserved produce'),
        ('BreadPastries', 'Bread, pan de sal, etc.'),
        ('MobileLoading', 'Mobile load cards and services'),
        ('Medicines', 'Over-the-counter medicines'),
        ('Others', 'Miscellaneous items');
        
    PRINT 'Populated ItemCategories with common Sari-Sari store item categories';
END

-- 6. Add view for Transaction Analysis
PRINT 'Creating TransactionAnalysisView for simplified reporting';

IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'TransactionAnalysisView')
BEGIN
    DROP VIEW dbo.TransactionAnalysisView;
    PRINT 'Dropped existing TransactionAnalysisView';
END

EXEC('
CREATE VIEW dbo.TransactionAnalysisView AS
SELECT 
    si.InteractionID,
    si.SessionID,
    si.StoreID,
    st.StoreName,
    st.Region,
    si.InteractionTimestamp,
    si.TransactionDuration,
    si.ProductCount,
    si.BasketValue,
    si.TransactionCompleted,
    si.DwellTimeSeconds,
    COUNT(tp.TransactionProductID) AS ProductVarietyCount,
    SUM(CASE WHEN tp.IsSubstitution = 1 THEN 1 ELSE 0 END) AS SubstitutionCount,
    COUNT(rp.RequestPatternID) AS RequestCount,
    COUNT(ui.UnbrandedItemID) AS UnbrandedItemCount
FROM 
    dbo.SalesInteractions si
LEFT JOIN 
    dbo.Stores st ON si.StoreID = st.StoreID
LEFT JOIN 
    dbo.TransactionProducts tp ON si.InteractionID = tp.InteractionID
LEFT JOIN 
    dbo.RequestPatterns rp ON si.InteractionID = rp.InteractionID
LEFT JOIN 
    dbo.UnbrandedItems ui ON si.InteractionID = ui.InteractionID
GROUP BY
    si.InteractionID,
    si.SessionID,
    si.StoreID,
    st.StoreName,
    st.Region,
    si.InteractionTimestamp,
    si.TransactionDuration,
    si.ProductCount,
    si.BasketValue,
    si.TransactionCompleted,
    si.DwellTimeSeconds
');

PRINT 'Created TransactionAnalysisView';

-- 7. Update the existing functions/procedures to accommodate new fields
-- Add function to calculate transaction metrics based on STT and visual data
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.CalculateTransactionMetrics') AND type = 'P')
BEGIN
    DROP PROCEDURE dbo.CalculateTransactionMetrics;
    PRINT 'Dropped existing CalculateTransactionMetrics procedure';
END

EXEC('
CREATE PROCEDURE dbo.CalculateTransactionMetrics
    @SessionID NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate and update transaction duration
    UPDATE si
    SET 
        TransactionDuration = DATEDIFF(SECOND, SessionStart, SessionEnd),
        ProductCount = (SELECT COUNT(*) FROM dbo.TransactionProducts tp WHERE tp.InteractionID = si.InteractionID),
        BasketValue = (SELECT SUM(p.Price * tp.Quantity) 
                        FROM dbo.TransactionProducts tp 
                        JOIN dbo.Products p ON tp.ProductID = p.ProductID 
                        WHERE tp.InteractionID = si.InteractionID),
        TransactionCompleted = CASE 
                                WHEN EXISTS (SELECT 1 
                                            FROM dbo.SalesInteractionTranscripts sit 
                                            WHERE sit.InteractionID = si.InteractionID 
                                            AND sit.TranscriptText LIKE ''%thank you%'' OR sit.TranscriptText LIKE ''%salamat%'') 
                                THEN 1 
                                ELSE 0 
                                END
    FROM dbo.SalesInteractions si
    WHERE si.SessionID = @SessionID;
    
    PRINT ''Updated transaction metrics for session: '' + @SessionID;
END
');

PRINT 'Created CalculateTransactionMetrics procedure';

-- Add function to extract customer expressions from transcript
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.ExtractCustomerExpressions') AND type = 'P')
BEGIN
    DROP PROCEDURE dbo.ExtractCustomerExpressions;
    PRINT 'Dropped existing ExtractCustomerExpressions procedure';
END

EXEC('
CREATE PROCEDURE dbo.ExtractCustomerExpressions
    @InteractionID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @transcript NVARCHAR(MAX);
    DECLARE @expressions NVARCHAR(MAX) = ''[]'';
    
    -- Get the transcript
    SELECT @transcript = TranscriptText
    FROM dbo.SalesInteractionTranscripts
    WHERE InteractionID = @InteractionID;
    
    IF @transcript IS NULL
        RETURN;
    
    -- Simple expression extraction logic (would be more sophisticated in production)
    IF @transcript LIKE ''%happy%'' OR @transcript LIKE ''%masaya%''
        SET @expressions = JSON_MODIFY(@expressions, ''append $'', ''happy'');
        
    IF @transcript LIKE ''%confused%'' OR @transcript LIKE ''%nalilito%'' OR @transcript LIKE ''%di ko alam%''
        SET @expressions = JSON_MODIFY(@expressions, ''append $'', ''confused'');
        
    IF @transcript LIKE ''%disappointed%'' OR @transcript LIKE ''%sad%'' OR @transcript LIKE ''%malungkot%''
        SET @expressions = JSON_MODIFY(@expressions, ''append $'', ''disappointed'');
        
    IF @transcript LIKE ''%surprised%'' OR @transcript LIKE ''%nagulat%''
        SET @expressions = JSON_MODIFY(@expressions, ''append $'', ''surprised'');
        
    IF @transcript LIKE ''%angry%'' OR @transcript LIKE ''%galit%'' OR @transcript LIKE ''%inis%''
        SET @expressions = JSON_MODIFY(@expressions, ''append $'', ''angry'');
    
    -- Update the SalesInteractions table
    UPDATE dbo.SalesInteractions
    SET CustomerExpressions = @expressions
    WHERE InteractionID = @InteractionID;
    
    PRINT ''Extracted customer expressions for interaction: '' + CAST(@InteractionID AS NVARCHAR(20));
END
');

PRINT 'Created ExtractCustomerExpressions procedure';

PRINT 'Schema enhancement migration completed successfully!';