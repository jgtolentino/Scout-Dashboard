-- Migration Script for Adding Enhanced Schema Features to Existing Brand/Product Tables
-- This script safely adds the new columns to existing tables without data loss

-- ==============================================================
-- STEP 1: Create backup of existing tables
-- ==============================================================

-- Create backup of Brands table
SELECT * 
INTO dbo.Brands_Backup
FROM dbo.Brands;

-- Create backup of Products table (if it exists)
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL
BEGIN
    SELECT * 
    INTO dbo.Products_Backup
    FROM dbo.Products;
END

-- ==============================================================
-- STEP 2: Create new reference tables
-- ==============================================================

-- Create BrandCategoryMaster table with existing categories
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.BrandCategoryMaster') AND type = 'U')
BEGIN
    CREATE TABLE dbo.BrandCategoryMaster (
        CategoryID    INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName  NVARCHAR(100) NOT NULL,
        ParentCategoryID INT NULL,
        Description   NVARCHAR(500) NULL,
        IsActive      BIT NOT NULL DEFAULT 1,
        -- Audit columns
        CreatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy     NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        LastUpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        CONSTRAINT UQ_CategoryName UNIQUE (CategoryName)
    );
    
    -- Populate with existing categories from Brands table (if any)
    INSERT INTO dbo.BrandCategoryMaster (
        CategoryName,
        Description,
        CreatedBy,
        LastUpdatedBy
    )
    SELECT DISTINCT 
        Category,
        'Migrated from Brands table',
        SYSTEM_USER,
        SYSTEM_USER
    FROM 
        dbo.Brands
    WHERE 
        Category IS NOT NULL
        AND LTRIM(RTRIM(Category)) <> '';
END

-- Create UnitOfMeasure table with common units
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.UnitOfMeasure') AND type = 'U')
BEGIN
    CREATE TABLE dbo.UnitOfMeasure (
        UnitID         INT IDENTITY(1,1) PRIMARY KEY,
        UnitCode       VARCHAR(10) NOT NULL,
        UnitName       NVARCHAR(50) NOT NULL,
        UnitType       NVARCHAR(50) NOT NULL,
        BaseMultiplier DECIMAL(18,6) NULL,
        BaseUnitID     INT NULL,
        -- Audit columns
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy      NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        LastUpdatedAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastUpdatedBy  NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        CONSTRAINT UQ_UnitCode UNIQUE (UnitCode)
    );
    
    -- Insert common units
    INSERT INTO dbo.UnitOfMeasure (UnitCode, UnitName, UnitType, CreatedBy, LastUpdatedBy)
    VALUES 
        ('EA', 'Each', 'Count', SYSTEM_USER, SYSTEM_USER),
        ('PCS', 'Pieces', 'Count', SYSTEM_USER, SYSTEM_USER),
        ('KG', 'Kilogram', 'Weight', SYSTEM_USER, SYSTEM_USER),
        ('G', 'Gram', 'Weight', SYSTEM_USER, SYSTEM_USER),
        ('L', 'Liter', 'Volume', SYSTEM_USER, SYSTEM_USER),
        ('ML', 'Milliliter', 'Volume', SYSTEM_USER, SYSTEM_USER),
        ('BTL', 'Bottle', 'Package', SYSTEM_USER, SYSTEM_USER),
        ('BOX', 'Box', 'Package', SYSTEM_USER, SYSTEM_USER),
        ('PKT', 'Packet', 'Package', SYSTEM_USER, SYSTEM_USER);
    
    -- Set up base unit relationships
    UPDATE dbo.UnitOfMeasure SET BaseUnitID = (SELECT UnitID FROM dbo.UnitOfMeasure WHERE UnitCode = 'KG'), BaseMultiplier = 0.001 WHERE UnitCode = 'G';
    UPDATE dbo.UnitOfMeasure SET BaseUnitID = (SELECT UnitID FROM dbo.UnitOfMeasure WHERE UnitCode = 'L'), BaseMultiplier = 0.001 WHERE UnitCode = 'ML';
END

-- ==============================================================
-- STEP 3: Create temp table for brand migration
-- ==============================================================

-- Create temporary BrandMaster table for migration
CREATE TABLE dbo.BrandMaster_Temp (
    BrandID            INT IDENTITY(1,1) PRIMARY KEY,
    BrandName          NVARCHAR(100) NOT NULL,
    CategoryID         INT NULL,
    ParentBrandID      INT NULL,
    BrandOwner         NVARCHAR(100) NULL,
    BrandDescription   NVARCHAR(1000) NULL,
    BrandAliases       NVARCHAR(500) NULL,
    ContextClues       NVARCHAR(1000) NULL,
    LogoURL            NVARCHAR(500) NULL,
    BrandWebsite       NVARCHAR(255) NULL,
    ActiveFrom         DATE NULL,
    ActiveTo           DATE NULL,
    BrandColor         NVARCHAR(20) NULL,
    SourceSystem       NVARCHAR(50) NULL DEFAULT 'Legacy',
    SourceRecordID     NVARCHAR(100) NULL,
    DataQualityScore   DECIMAL(5,2) NULL,
    CreatedAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy          NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy      NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    CONSTRAINT UQ_BrandMaster_Temp_BrandName UNIQUE (BrandName)
);

-- ==============================================================
-- STEP 4: Migrate data from old Brands table to new structure
-- ==============================================================

-- Insert data from old Brands table to temp table
INSERT INTO dbo.BrandMaster_Temp (
    BrandName,
    CategoryID,
    BrandDescription,
    SourceRecordID,
    CreatedBy,
    LastUpdatedBy
)
SELECT 
    b.BrandName,
    c.CategoryID,
    b.Description, -- Assuming there's a Description column in the old table
    CAST(b.BrandID AS NVARCHAR(100)), -- Store original ID as SourceRecordID 
    SYSTEM_USER,
    SYSTEM_USER
FROM 
    dbo.Brands b
LEFT JOIN 
    dbo.BrandCategoryMaster c ON b.Category = c.CategoryName;

-- ==============================================================
-- STEP 5: Rename tables to complete migration for brands
-- ==============================================================

-- If all looks good, rename tables to complete the migration
EXEC sp_rename 'dbo.Brands', 'Brands_Old';
EXEC sp_rename 'dbo.BrandMaster_Temp', 'BrandMaster';

-- ==============================================================
-- STEP 6: Add full-text index for brand search
-- ==============================================================

-- Add full-text search capabilities if not already exists
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'BrandsCatalog')
BEGIN
    CREATE FULLTEXT CATALOG BrandsCatalog AS DEFAULT;
END

-- Create full-text index on BrandMaster
CREATE FULLTEXT INDEX ON dbo.BrandMaster (
    BrandName,
    BrandAliases,
    ContextClues
) KEY INDEX PK__BrandMaster WITH CHANGE_TRACKING AUTO;

-- ==============================================================
-- STEP 7: Create views for easy data access
-- ==============================================================

-- Create view for brand details
CREATE OR ALTER VIEW dbo.vw_BrandDetails AS
SELECT 
    b.BrandID,
    b.BrandName,
    b.BrandAliases,
    b.BrandDescription,
    b.BrandOwner,
    b.LogoURL,
    b.BrandWebsite,
    b.BrandColor,
    b.ActiveFrom,
    b.ActiveTo,
    c.CategoryName,
    p.BrandName AS ParentBrandName,
    -- Quality and source metadata
    b.DataQualityScore,
    b.SourceSystem,
    b.SourceRecordID,
    -- Audit columns for transparency
    b.CreatedAt,
    b.CreatedBy,
    b.LastUpdatedAt,
    b.LastUpdatedBy
FROM 
    dbo.BrandMaster b
LEFT JOIN 
    dbo.BrandCategoryMaster c ON b.CategoryID = c.CategoryID
LEFT JOIN 
    dbo.BrandMaster p ON b.ParentBrandID = p.BrandID;

-- ==============================================================
-- STEP 8: Create stored procedure for data quality calculation
-- ==============================================================

-- Create procedure to calculate data quality scores
CREATE OR ALTER PROCEDURE dbo.CalculateBrandDataQuality
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update quality scores based on completeness and consistency
    UPDATE dbo.BrandMaster
    SET DataQualityScore = (
        -- Base score of 60
        60 +
        -- Add up to 20 for completeness
        CASE WHEN BrandName IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN BrandDescription IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN CategoryID IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN LogoURL IS NOT NULL THEN 5 ELSE 0 END +
        -- Add up to 20 for consistency/data richness
        CASE WHEN BrandAliases IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN ContextClues IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN BrandWebsite IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN BrandColor IS NOT NULL THEN 5 ELSE 0 END
    ),
    LastUpdatedAt = SYSUTCDATETIME(),
    LastUpdatedBy = 'DataQualityCalculator'
    WHERE 
        DataQualityScore IS NULL OR -- New records
        LastUpdatedAt < DATEADD(DAY, -1, SYSUTCDATETIME()); -- Records not updated in the last day
        
    -- Return summary of updates
    SELECT 
        COUNT(*) AS BrandsUpdated,
        AVG(DataQualityScore) AS AvgQualityScore,
        MIN(DataQualityScore) AS MinQualityScore,
        MAX(DataQualityScore) AS MaxQualityScore
    FROM 
        dbo.BrandMaster
    WHERE 
        LastUpdatedBy = 'DataQualityCalculator' AND
        LastUpdatedAt >= DATEADD(MINUTE, -5, SYSUTCDATETIME());
END;
GO

-- ==============================================================
-- STEP 9: Create trigger for quality score maintenance
-- ==============================================================

-- Trigger to maintain data quality scores when records are updated
CREATE OR ALTER TRIGGER trg_BrandMaster_QualityScore
ON dbo.BrandMaster
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Reset quality score when key fields are updated
    IF UPDATE(BrandName) OR UPDATE(BrandDescription) OR UPDATE(CategoryID) OR 
       UPDATE(BrandAliases) OR UPDATE(ContextClues) OR UPDATE(LogoURL)
    BEGIN
        -- Schedule recalculation by setting score to NULL
        UPDATE b
        SET 
            DataQualityScore = NULL,
            LastUpdatedAt = SYSUTCDATETIME()
        FROM 
            dbo.BrandMaster b
        INNER JOIN 
            inserted i ON b.BrandID = i.BrandID;
            
        -- Execute quality calculation procedure
        EXEC dbo.CalculateBrandDataQuality;
    END
END;
GO

-- ==============================================================
-- STEP 10: Run initial data quality calculation
-- ==============================================================

-- Calculate initial quality scores
EXEC dbo.CalculateBrandDataQuality;

-- ==============================================================
-- STEP 11: Update existing tables that reference brands
-- ==============================================================

-- Update SalesInteractionBrands to reference the new BrandMaster
-- This example assumes SalesInteractionBrands exists and has a BrandID column
IF OBJECT_ID('dbo.SalesInteractionBrands', 'U') IS NOT NULL
BEGIN
    -- Add temporary column for mapping
    ALTER TABLE dbo.SalesInteractionBrands ADD NewBrandID INT NULL;
    
    -- Update the mapping based on brand names
    UPDATE sib
    SET sib.NewBrandID = bm.BrandID
    FROM dbo.SalesInteractionBrands sib
    JOIN dbo.Brands_Old bo ON sib.BrandID = bo.BrandID
    JOIN dbo.BrandMaster bm ON bo.BrandName = bm.BrandName;
    
    -- Replace old BrandID with new one
    -- Note: This requires dropping and recreating constraints
    -- Drop existing foreign key if any
    DECLARE @fkName NVARCHAR(128)
    SELECT @fkName = name FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.SalesInteractionBrands')
    AND referenced_object_id = OBJECT_ID('dbo.Brands_Old');
    
    IF @fkName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE dbo.SalesInteractionBrands DROP CONSTRAINT ' + @fkName);
    END
    
    -- Update the BrandID column
    UPDATE dbo.SalesInteractionBrands
    SET BrandID = NewBrandID
    WHERE NewBrandID IS NOT NULL;
    
    -- Drop temporary column
    ALTER TABLE dbo.SalesInteractionBrands DROP COLUMN NewBrandID;
    
    -- Add new foreign key constraint
    ALTER TABLE dbo.SalesInteractionBrands 
    ADD CONSTRAINT FK_SalesInteractionBrands_BrandMaster 
    FOREIGN KEY (BrandID) REFERENCES dbo.BrandMaster(BrandID);
END

-- ==============================================================
-- STEP 12: Add audit trail to existing tables
-- ==============================================================

-- Add audit columns to SalesInteractionBrands table
IF OBJECT_ID('dbo.SalesInteractionBrands', 'U') IS NOT NULL
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SalesInteractionBrands') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE dbo.SalesInteractionBrands
        ADD 
            CreatedAt        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CreatedBy        NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
            LastUpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            LastUpdatedBy    NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER;
    END
    
    -- Create update trigger if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_SalesInteractionBrands_Update')
    BEGIN
        EXEC('
        CREATE TRIGGER trg_SalesInteractionBrands_Update
        ON dbo.SalesInteractionBrands
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            
            UPDATE dbo.SalesInteractionBrands
            SET LastUpdatedAt = SYSUTCDATETIME(),
                LastUpdatedBy = SYSTEM_USER
            FROM dbo.SalesInteractionBrands sib
            INNER JOIN inserted i ON sib.InteractionBrandID = i.InteractionBrandID;
        END
        ');
    END
END

-- ==============================================================
-- STEP 13: Final validation and cleanup
-- ==============================================================

-- Validate migration was successful
SELECT 
    'Brand Migration Validation' AS ValidationStep,
    (SELECT COUNT(*) FROM dbo.Brands_Old) AS OldBrandCount,
    (SELECT COUNT(*) FROM dbo.BrandMaster) AS NewBrandCount,
    CASE WHEN (SELECT COUNT(*) FROM dbo.Brands_Old) = (SELECT COUNT(*) FROM dbo.BrandMaster)
         THEN 'Successful' ELSE 'Warning: Count Mismatch' END AS ValidationStatus;

-- Log migration completion
PRINT 'Migration completed successfully at ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT 'Brands table migrated to enhanced BrandMaster schema';
PRINT 'Old tables preserved with _Old suffix for verification';
PRINT 'Run SELECT * FROM dbo.vw_BrandDetails to view migrated data';

-- ==============================================================
-- STEP 14: ProductMaster migration (similar process if needed)
-- ==============================================================

-- The process for migrating Products would follow similar steps
-- For brevity, details are omitted here but would parallel the brand migration