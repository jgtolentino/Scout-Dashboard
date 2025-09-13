-- Schema Migration for Store Location Hierarchy
-- Client360 Dashboard - May 21, 2025
-- Updates the Stores table to include admin-level location hierarchy fields
-- Supports F6 filtering, F8 geospatial map, and F9 InsightPanel requirements

-- Check if table exists before attempting to modify it
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND type in (N'U'))
BEGIN
    -- Check if columns already exist to avoid errors
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'Region')
    BEGIN
        PRINT 'Adding Region column to Stores table';
        ALTER TABLE dbo.Stores ADD Region NVARCHAR(200) NULL;
    END
    ELSE
    BEGIN
        PRINT 'Region column already exists';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'CityMunicipality')
    BEGIN
        PRINT 'Adding CityMunicipality column to Stores table';
        ALTER TABLE dbo.Stores ADD CityMunicipality NVARCHAR(200) NULL;
    END
    ELSE
    BEGIN
        PRINT 'CityMunicipality column already exists';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'Barangay')
    BEGIN
        PRINT 'Adding Barangay column to Stores table';
        ALTER TABLE dbo.Stores ADD Barangay NVARCHAR(200) NULL;
    END
    ELSE
    BEGIN
        PRINT 'Barangay column already exists';
    END

    -- Add computed column for full location string (optional)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'FullLocationString')
    BEGIN
        PRINT 'Adding FullLocationString computed column to Stores table';
        ALTER TABLE dbo.Stores ADD FullLocationString AS 
            CONCAT(
                ISNULL(Barangay + ', ', ''),
                ISNULL(CityMunicipality + ', ', ''),
                ISNULL(Region, '')
            ) PERSISTED;
    END
    ELSE
    BEGIN
        PRINT 'FullLocationString column already exists';
    END

    -- Update existing records with derived values if possible
    PRINT 'Updating existing records with location data where possible';
    
    -- Attempt to parse existing Location field if it exists
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'Location')
    BEGIN
        -- Sample update logic - this is approximate and would need to be 
        -- customized based on actual Location field format
        UPDATE dbo.Stores
        SET 
            -- Extract region from the last part of the location string
            -- This is an approximate algorithm and may need adjustment
            Region = CASE 
                WHEN Location LIKE '%,%' 
                THEN TRIM(SUBSTRING(Location, CHARINDEX(',', Location, LEN(Location) - 30) + 1, LEN(Location)))
                ELSE NULL 
            END
        WHERE 
            Region IS NULL AND 
            Location IS NOT NULL;
    END

    -- Create index for filtering efficiency
    PRINT 'Creating indexes to optimize location-based filtering';
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stores_Region' AND object_id = OBJECT_ID('dbo.Stores'))
    BEGIN
        CREATE INDEX IX_Stores_Region ON dbo.Stores(Region);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stores_CityMunicipality' AND object_id = OBJECT_ID('dbo.Stores'))
    BEGIN
        CREATE INDEX IX_Stores_CityMunicipality ON dbo.Stores(CityMunicipality);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stores_Barangay' AND object_id = OBJECT_ID('dbo.Stores'))
    BEGIN
        CREATE INDEX IX_Stores_Barangay ON dbo.Stores(Barangay);
    END
    
    -- Create composite index for cascading filters
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stores_LocationHierarchy' AND object_id = OBJECT_ID('dbo.Stores'))
    BEGIN
        CREATE INDEX IX_Stores_LocationHierarchy ON dbo.Stores(Region, CityMunicipality, Barangay);
    END
    
    -- Create spatial index if GeoLatitude and GeoLongitude exist
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'GeoLatitude')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'GeoLongitude')
    BEGIN
        -- Check if we already have a computed geography column
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND name = 'GeoPoint')
        BEGIN
            -- Add computed geography column
            ALTER TABLE dbo.Stores ADD GeoPoint AS 
                geography::Point(GeoLatitude, GeoLongitude, 4326) PERSISTED;
                
            -- Create spatial index
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'SPATIAL_Stores_GeoPoint' AND object_id = OBJECT_ID('dbo.Stores'))
            BEGIN
                CREATE SPATIAL INDEX SPATIAL_Stores_GeoPoint ON dbo.Stores(GeoPoint);
            END
        END
    END

    PRINT 'Migration completed successfully';
END
ELSE
BEGIN
    PRINT 'Stores table does not exist. Please create the base table structure first.';
END

-- Create view for hierarchical filtering
PRINT 'Creating or updating location hierarchy view';
GO

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_StoreLocationHierarchy')
BEGIN
    DROP VIEW dbo.vw_StoreLocationHierarchy;
END
GO

CREATE VIEW dbo.vw_StoreLocationHierarchy AS
SELECT
    Region,
    CityMunicipality,
    Barangay,
    COUNT(*) AS StoreCount
FROM
    dbo.Stores
WHERE
    Region IS NOT NULL
GROUP BY
    Region,
    CityMunicipality,
    Barangay
GO

-- Create stored procedure for cascading filters
PRINT 'Creating or updating stored procedure for cascading location filters';
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetLocationHierarchy')
BEGIN
    DROP PROCEDURE dbo.sp_GetLocationHierarchy;
END
GO

CREATE PROCEDURE dbo.sp_GetLocationHierarchy
    @Region NVARCHAR(200) = NULL,
    @CityMunicipality NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Region IS NULL AND @CityMunicipality IS NULL
    BEGIN
        -- Return all regions
        SELECT DISTINCT Region, COUNT(*) AS StoreCount
        FROM dbo.Stores
        WHERE Region IS NOT NULL
        GROUP BY Region
        ORDER BY Region;
    END
    ELSE IF @Region IS NOT NULL AND @CityMunicipality IS NULL
    BEGIN
        -- Return cities/municipalities for a specific region
        SELECT DISTINCT CityMunicipality, COUNT(*) AS StoreCount
        FROM dbo.Stores
        WHERE Region = @Region AND CityMunicipality IS NOT NULL
        GROUP BY CityMunicipality
        ORDER BY CityMunicipality;
    END
    ELSE IF @Region IS NOT NULL AND @CityMunicipality IS NOT NULL
    BEGIN
        -- Return barangays for a specific city/municipality
        SELECT DISTINCT Barangay, COUNT(*) AS StoreCount
        FROM dbo.Stores
        WHERE 
            Region = @Region AND 
            CityMunicipality = @CityMunicipality AND 
            Barangay IS NOT NULL
        GROUP BY Barangay
        ORDER BY Barangay;
    END
END
GO

PRINT 'Schema migration script completed';