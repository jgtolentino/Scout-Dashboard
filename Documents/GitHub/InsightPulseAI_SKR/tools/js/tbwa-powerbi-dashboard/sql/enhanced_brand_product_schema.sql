-- Enhanced Schema for BrandMaster and ProductMaster Tables
-- Adds audit, quality, search, and reference capabilities to support richer metadata and governance

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

-- Create BrandCategoryMaster table for controlled vocabulary
CREATE TABLE dbo.BrandCategoryMaster (
    CategoryID    INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName  NVARCHAR(100) NOT NULL,
    ParentCategoryID INT NULL,
    Description   NVARCHAR(500) NULL,
    IsActive      BIT NOT NULL DEFAULT 1,
    -- Audit columns
    CreatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy     NVARCHAR(100) NOT NULL,
    LastUpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_CategoryName UNIQUE (CategoryName),
    CONSTRAINT FK_CategoryParent FOREIGN KEY (ParentCategoryID) 
        REFERENCES dbo.BrandCategoryMaster(CategoryID)
);

-- Create UnitOfMeasure table for standardized quantity units
CREATE TABLE dbo.UnitOfMeasure (
    UnitID         INT IDENTITY(1,1) PRIMARY KEY,
    UnitCode       VARCHAR(10) NOT NULL,
    UnitName       NVARCHAR(50) NOT NULL,
    UnitType       NVARCHAR(50) NOT NULL, -- 'Weight', 'Volume', 'Count', etc.
    BaseMultiplier DECIMAL(18,6) NULL,    -- For conversion to base unit
    BaseUnitID     INT NULL,              -- Reference to base unit
    -- Audit columns
    CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy      NVARCHAR(100) NOT NULL,
    LastUpdatedAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy  NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_UnitCode UNIQUE (UnitCode),
    CONSTRAINT FK_BaseUnit FOREIGN KEY (BaseUnitID) 
        REFERENCES dbo.UnitOfMeasure(UnitID)
);

-- ============================================================
-- ENHANCED BRAND MASTER TABLE
-- ============================================================

-- Create enhanced BrandMaster table
CREATE TABLE dbo.BrandMaster (
    BrandID            INT IDENTITY(1,1) PRIMARY KEY,
    BrandName          NVARCHAR(100) NOT NULL,
    CategoryID         INT NULL,           -- FK to BrandCategoryMaster
    ParentBrandID      INT NULL,           -- For brand hierarchies
    BrandOwner         NVARCHAR(100) NULL, -- Company/entity that owns the brand
    BrandDescription   NVARCHAR(1000) NULL,
    BrandAliases       NVARCHAR(500) NULL, -- Alternative names, comma-separated
    ContextClues       NVARCHAR(1000) NULL, -- Keywords associated with this brand
    LogoURL            NVARCHAR(500) NULL, -- URL to brand logo
    BrandWebsite       NVARCHAR(255) NULL,
    ActiveFrom         DATE NULL,
    ActiveTo           DATE NULL,          -- NULL = still active
    BrandColor         NVARCHAR(20) NULL,  -- Hex color code for UI
    
    -- Data Source & Quality Metadata
    SourceSystem       NVARCHAR(50) NULL,  -- e.g., "ERP", "PIM", "CSV_IMPORT"
    SourceRecordID     NVARCHAR(100) NULL, -- Original ID in upstream system
    DataQualityScore   DECIMAL(5,2) NULL,  -- 0-100 score from profiling rules
    
    -- Audit & Stewardship Columns
    CreatedAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy          NVARCHAR(100) NOT NULL,
    LastUpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy      NVARCHAR(100) NOT NULL,
    
    -- Computed column for normalized name
    NormalizedName AS LOWER(REPLACE(REPLACE(REPLACE(REPLACE(BrandName, ' ', ''), ',', ''), '.', ''), '-', '')),
    
    CONSTRAINT UQ_BrandName UNIQUE (BrandName),
    CONSTRAINT FK_BrandCategory FOREIGN KEY (CategoryID) 
        REFERENCES dbo.BrandCategoryMaster(CategoryID),
    CONSTRAINT FK_ParentBrand FOREIGN KEY (ParentBrandID) 
        REFERENCES dbo.BrandMaster(BrandID)
);

-- Add Full-Text Index for advanced search capabilities
CREATE FULLTEXT CATALOG BrandsCatalog AS DEFAULT;
CREATE FULLTEXT INDEX ON dbo.BrandMaster (
    BrandName,
    BrandAliases,
    ContextClues
) KEY INDEX PK__BrandMaster ON BrandsCatalog WITH CHANGE_TRACKING AUTO;

-- ============================================================
-- ENHANCED PRODUCT MASTER TABLE
-- ============================================================

-- Create enhanced ProductMaster table
CREATE TABLE dbo.ProductMaster (
    ProductID          INT IDENTITY(1,1) PRIMARY KEY,
    ProductName        NVARCHAR(200) NOT NULL,
    ProductDescription NVARCHAR(2000) NULL,
    SKU                NVARCHAR(50) NULL,
    BrandID            INT NULL,          -- FK to BrandMaster
    CategoryID         INT NULL,          -- FK to product category (if separate)
    UnitOfMeasureID    INT NULL,          -- FK to UnitOfMeasure
    DefaultQuantity    DECIMAL(18,6) NULL, -- Default qty per unit
    GTIN               NVARCHAR(14) NULL, -- Global Trade Item Number
    BarCode            NVARCHAR(50) NULL, -- Product barcode
    Price              DECIMAL(18,2) NULL,
    CostPrice          DECIMAL(18,2) NULL,
    Weight             DECIMAL(18,6) NULL,
    WeightUnitID       INT NULL,          -- FK to UnitOfMeasure
    Dimensions         NVARCHAR(100) NULL, -- Format: LxWxH
    Color              NVARCHAR(50) NULL,
    Size               NVARCHAR(50) NULL,
    IsActive           BIT NOT NULL DEFAULT 1,
    ActiveFrom         DATE NULL,
    ActiveTo           DATE NULL,         -- NULL = still active
    
    -- Product Image Reference
    ImageURL           NVARCHAR(500) NULL, -- Pack-shot or CDN URL for UI overlays
    ThumbnailURL       NVARCHAR(500) NULL,
    
    -- Data Source & Quality Metadata
    SourceSystem       NVARCHAR(50) NULL,
    SourceRecordID     NVARCHAR(100) NULL,
    DataQualityScore   DECIMAL(5,2) NULL,
    
    -- Audit & Stewardship Columns
    CreatedAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy          NVARCHAR(100) NOT NULL,
    LastUpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy      NVARCHAR(100) NOT NULL,
    
    -- Computed column for normalized name
    NormalizedName AS LOWER(REPLACE(REPLACE(REPLACE(REPLACE(ProductName, ' ', ''), ',', ''), '.', ''), '-', '')),
    
    CONSTRAINT FK_ProductBrand FOREIGN KEY (BrandID) 
        REFERENCES dbo.BrandMaster(BrandID),
    CONSTRAINT FK_ProductUnit FOREIGN KEY (UnitOfMeasureID) 
        REFERENCES dbo.UnitOfMeasure(UnitID),
    CONSTRAINT FK_ProductWeightUnit FOREIGN KEY (WeightUnitID) 
        REFERENCES dbo.UnitOfMeasure(UnitID)
);

-- Add Full-Text Index for advanced search capabilities
CREATE FULLTEXT INDEX ON dbo.ProductMaster (
    ProductName,
    ProductDescription,
    SKU,
    BarCode
) KEY INDEX PK__ProductMaster ON BrandsCatalog WITH CHANGE_TRACKING AUTO;

-- ============================================================
-- UPDATE EXISTING TABLES WITH AUDIT COLUMNS
-- ============================================================

-- Example for adding audit columns to an existing SalesInteractionBrands table
-- Uncomment and adjust as needed for your existing tables
/*
ALTER TABLE dbo.SalesInteractionBrands
ADD 
    CreatedAt        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy        NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    LastUpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastUpdatedBy    NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER;

-- Create a trigger to update LastUpdatedAt and LastUpdatedBy
CREATE TRIGGER dbo.trg_SalesInteractionBrands_Update
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
END;
*/

-- ============================================================
-- VIEWS FOR DATA ACCESS
-- ============================================================

-- Create a view for brand details including category
CREATE VIEW dbo.vw_BrandDetails AS
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

-- Create a view for product details with brand information
CREATE VIEW dbo.vw_ProductDetails AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.ProductDescription,
    p.SKU,
    p.GTIN,
    p.BarCode,
    p.Price,
    p.CostPrice,
    p.Weight,
    wu.UnitName AS WeightUnit,
    p.Dimensions,
    p.Color,
    p.Size,
    p.IsActive,
    p.ImageURL,
    p.ThumbnailURL,
    -- Brand details
    b.BrandID,
    b.BrandName,
    b.BrandColor,
    c.CategoryName,
    -- Unit information
    u.UnitCode,
    u.UnitName,
    p.DefaultQuantity,
    -- Data quality information
    p.DataQualityScore,
    -- Audit trail
    p.CreatedAt,
    p.CreatedBy,
    p.LastUpdatedAt,
    p.LastUpdatedBy
FROM 
    dbo.ProductMaster p
LEFT JOIN 
    dbo.BrandMaster b ON p.BrandID = b.BrandID
LEFT JOIN 
    dbo.BrandCategoryMaster c ON b.CategoryID = c.CategoryID
LEFT JOIN 
    dbo.UnitOfMeasure u ON p.UnitOfMeasureID = u.UnitID
LEFT JOIN 
    dbo.UnitOfMeasure wu ON p.WeightUnitID = wu.UnitID;

-- ============================================================
-- STORED PROCEDURES FOR DATA GOVERNANCE
-- ============================================================

-- Procedure to calculate data quality scores
CREATE PROCEDURE dbo.CalculateBrandDataQuality
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

-- Sample procedure to import brands from external system
CREATE PROCEDURE dbo.ImportBrandsFromExternalSystem
    @SourceSystem NVARCHAR(50),
    @ImportedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- This would be replaced with actual import logic in a real implementation
    -- Example assumes a staging table called ExternalBrandImport exists
    
    MERGE dbo.BrandMaster AS target
    USING (
        SELECT 
            BrandName,
            BrandDescription,
            ExternalID,
            ExternalCategory
        FROM 
            staging.ExternalBrandImport
    ) AS source
    ON target.BrandName = source.BrandName
    
    -- When record exists, update it
    WHEN MATCHED THEN
        UPDATE SET
            BrandDescription = source.BrandDescription,
            SourceRecordID = source.ExternalID,
            LastUpdatedAt = SYSUTCDATETIME(),
            LastUpdatedBy = @ImportedBy
            
    -- When record doesn't exist, insert it
    WHEN NOT MATCHED THEN
        INSERT (
            BrandName, 
            BrandDescription,
            SourceSystem,
            SourceRecordID,
            CreatedAt,
            CreatedBy,
            LastUpdatedAt,
            LastUpdatedBy
        )
        VALUES (
            source.BrandName,
            source.BrandDescription,
            @SourceSystem,
            source.ExternalID,
            SYSUTCDATETIME(),
            @ImportedBy,
            SYSUTCDATETIME(),
            @ImportedBy
        );
        
    -- Return summary of import operation
    SELECT 
        @@ROWCOUNT AS TotalRecordsProcessed,
        (SELECT COUNT(*) FROM dbo.BrandMaster WHERE SourceSystem = @SourceSystem) AS TotalImportedBrands;
END;
GO

-- ============================================================
-- DATA QUALITY TRIGGER
-- ============================================================

-- Trigger to maintain data quality scores when records are updated
CREATE TRIGGER trg_BrandMaster_QualityScore
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