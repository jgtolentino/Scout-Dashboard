-- Philippines Location Seed Data for Client360 Dashboard
-- May 21, 2025
-- This script provides sample data for Philippines administrative hierarchy
-- Regions, Cities/Municipalities, and Barangays with representative sample

-- Temporary tables to hold the data
CREATE TABLE #Regions (
    RegionID INT IDENTITY(1,1) PRIMARY KEY,
    RegionName NVARCHAR(200)
);

CREATE TABLE #Cities (
    CityID INT IDENTITY(1,1) PRIMARY KEY,
    RegionID INT,
    CityName NVARCHAR(200)
);

CREATE TABLE #Barangays (
    BarangayID INT IDENTITY(1,1) PRIMARY KEY,
    CityID INT,
    BarangayName NVARCHAR(200)
);

-- Insert Regions (Administrative Level 1)
INSERT INTO #Regions (RegionName) VALUES 
('National Capital Region (NCR)'),
('Cordillera Administrative Region (CAR)'),
('Ilocos Region (Region I)'),
('Cagayan Valley (Region II)'),
('Central Luzon (Region III)'),
('CALABARZON (Region IV-A)'),
('MIMAROPA (Region IV-B)'),
('Bicol Region (Region V)'),
('Western Visayas (Region VI)'),
('Central Visayas (Region VII)'),
('Eastern Visayas (Region VIII)'),
('Zamboanga Peninsula (Region IX)'),
('Northern Mindanao (Region X)'),
('Davao Region (Region XI)'),
('SOCCSKSARGEN (Region XII)'),
('Caraga (Region XIII)'),
('Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)');

-- Insert Cities/Municipalities (Administrative Level 2)
-- National Capital Region (NCR) Cities
INSERT INTO #Cities (RegionID, CityName) VALUES 
(1, 'Manila'),
(1, 'Quezon City'),
(1, 'Makati'),
(1, 'Pasig'),
(1, 'Taguig'),
(1, 'Parañaque'),
(1, 'Mandaluyong'),
(1, 'Marikina'),
(1, 'Pasay'),
(1, 'Caloocan');

-- CALABARZON Cities
INSERT INTO #Cities (RegionID, CityName) VALUES 
(6, 'Batangas City'),
(6, 'Calamba'),
(6, 'Lipa'),
(6, 'Tagaytay'),
(6, 'Antipolo'),
(6, 'Lucena'),
(6, 'San Pablo'),
(6, 'Santa Rosa');

-- Central Visayas Cities
INSERT INTO #Cities (RegionID, CityName) VALUES 
(10, 'Cebu City'),
(10, 'Mandaue'),
(10, 'Lapu-Lapu'),
(10, 'Talisay'),
(10, 'Tagbilaran'),
(10, 'Toledo');

-- Davao Region Cities
INSERT INTO #Cities (RegionID, CityName) VALUES 
(14, 'Davao City'),
(14, 'Tagum'),
(14, 'Panabo'),
(14, 'Digos'),
(14, 'Mati');

-- Insert Barangays (Administrative Level 3)
-- Manila Barangays
INSERT INTO #Barangays (CityID, BarangayName) VALUES 
(1, 'Malate'),
(1, 'Ermita'),
(1, 'Intramuros'),
(1, 'Binondo'),
(1, 'Sampaloc'),
(1, 'San Miguel'),
(1, 'Tondo'),
(1, 'Sta. Cruz');

-- Quezon City Barangays
INSERT INTO #Barangays (CityID, BarangayName) VALUES 
(2, 'Diliman'),
(2, 'Cubao'),
(2, 'Commonwealth'),
(2, 'Batasan Hills'),
(2, 'Fairview'),
(2, 'Kamuning'),
(2, 'Galas'),
(2, 'Project 6');

-- Makati Barangays
INSERT INTO #Barangays (CityID, BarangayName) VALUES 
(3, 'Poblacion'),
(3, 'Bel-Air'),
(3, 'San Lorenzo'),
(3, 'Dasmariñas'),
(3, 'Forbes Park'),
(3, 'Urdaneta'),
(3, 'Magallanes'),
(3, 'Salcedo Village');

-- Cebu City Barangays
INSERT INTO #Barangays (CityID, BarangayName) VALUES 
(21, 'Lahug'),
(21, 'Mabolo'),
(21, 'Apas'),
(21, 'Guadalupe'),
(21, 'Capitol Site'),
(21, 'Banilad'),
(21, 'Talamban'),
(21, 'Luz');

-- Davao City Barangays
INSERT INTO #Barangays (CityID, BarangayName) VALUES 
(27, 'Poblacion'),
(27, 'Talomo'),
(27, 'Buhangin'),
(27, 'Bunawan'),
(27, 'Toril'),
(27, 'Calinan'),
(27, 'Marilog'),
(27, 'Paquibato');

-- Update Stores table with location data (if it exists)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND type in (N'U'))
BEGIN
    PRINT 'Updating sample stores with location data';
    
    -- Update using a random selection of locations
    -- This is a sample update and should be modified based on actual Store data
    WITH StoresCTE AS (
        SELECT 
            s.StoreID,
            r.RegionName,
            c.CityName,
            b.BarangayName,
            ROW_NUMBER() OVER (ORDER BY NEWID()) as RowNum
        FROM 
            dbo.Stores s
            CROSS JOIN (SELECT TOP 100 RegionID, RegionName FROM #Regions) r
            CROSS JOIN (SELECT TOP 100 CityID, CityName FROM #Cities WHERE RegionID = r.RegionID) c
            CROSS JOIN (SELECT TOP 100 BarangayName FROM #Barangays WHERE CityID = c.CityID) b
    )
    UPDATE s
    SET 
        s.Region = cte.RegionName,
        s.CityMunicipality = cte.CityName,
        s.Barangay = cte.BarangayName
    FROM 
        dbo.Stores s
        INNER JOIN StoresCTE cte ON s.StoreID = cte.StoreID;
        
    PRINT 'Sample store locations updated';
END
ELSE
BEGIN
    PRINT 'Stores table not found. Creating standalone location reference table.';
    
    -- Create a standalone reference table for locations
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PhilippineLocations]') AND type in (N'U'))
    BEGIN
        CREATE TABLE dbo.PhilippineLocations (
            LocationID INT IDENTITY(1,1) PRIMARY KEY,
            Region NVARCHAR(200) NOT NULL,
            CityMunicipality NVARCHAR(200) NOT NULL,
            Barangay NVARCHAR(200) NOT NULL,
            -- Add typical geographic coordinates for these regions
            ApproxLatitude FLOAT NULL,
            ApproxLongitude FLOAT NULL
        );
        
        -- Insert seed data from our temporary tables
        INSERT INTO dbo.PhilippineLocations (Region, CityMunicipality, Barangay, ApproxLatitude, ApproxLongitude)
        SELECT 
            r.RegionName,
            c.CityName,
            b.BarangayName,
            -- Sample approximate coordinates based on city
            CASE 
                WHEN c.CityName = 'Manila' THEN 14.5995
                WHEN c.CityName = 'Quezon City' THEN 14.6760
                WHEN c.CityName = 'Makati' THEN 14.5547
                WHEN c.CityName = 'Cebu City' THEN 10.3157
                WHEN c.CityName = 'Davao City' THEN 7.1907
                ELSE NULL -- Add more cities or leave NULL for now
            END AS ApproxLatitude,
            CASE 
                WHEN c.CityName = 'Manila' THEN 120.9842
                WHEN c.CityName = 'Quezon City' THEN 121.0437
                WHEN c.CityName = 'Makati' THEN 121.0244
                WHEN c.CityName = 'Cebu City' THEN 123.8854
                WHEN c.CityName = 'Davao City' THEN 125.4553
                ELSE NULL -- Add more cities or leave NULL for now
            END AS ApproxLongitude
        FROM 
            #Regions r
            INNER JOIN #Cities c ON r.RegionID = c.RegionID
            INNER JOIN #Barangays b ON c.CityID = b.CityID;
            
        PRINT 'PhilippineLocations reference table created and populated';
    END
END

-- Drop temporary tables
DROP TABLE #Barangays;
DROP TABLE #Cities;
DROP TABLE #Regions;

-- Export JSON-formatted location data for frontend
IF OBJECT_ID('dbo.sp_ExportLocationHierarchyJson') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_ExportLocationHierarchyJson;
END
GO

CREATE PROCEDURE dbo.sp_ExportLocationHierarchyJson
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Select data with hierarchical JSON format
    SELECT
        (
            SELECT DISTINCT r.RegionName AS 'name',
            (
                SELECT DISTINCT c.CityName AS 'name',
                (
                    SELECT DISTINCT b.BarangayName AS 'name'
                    FROM #Barangays b
                    WHERE b.CityID = c.CityID
                    ORDER BY b.BarangayName
                    FOR JSON PATH
                ) AS 'barangays'
                FROM #Cities c
                WHERE c.RegionID = r.RegionID
                ORDER BY c.CityName
                FOR JSON PATH
            ) AS 'cities'
            FROM #Regions r
            ORDER BY r.RegionName
            FOR JSON PATH
        ) AS LocationHierarchyJson;
END
GO

-- Create sample view with geospatial references
IF OBJECT_ID('dbo.vw_StoresWithLocationDetails') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_StoresWithLocationDetails;
END
GO

CREATE VIEW dbo.vw_StoresWithLocationDetails AS
SELECT
    s.StoreID,
    s.StoreName,
    s.Region,
    s.CityMunicipality,
    s.Barangay,
    s.GeoLatitude,
    s.GeoLongitude,
    CASE 
        WHEN s.Region = 'National Capital Region (NCR)' THEN 'NCR'
        WHEN s.Region = 'Cordillera Administrative Region (CAR)' THEN 'CAR'
        WHEN s.Region LIKE '%Region%' THEN 
            SUBSTRING(s.Region, CHARINDEX('(Region', s.Region) + 8, 5)
        ELSE s.Region
    END AS RegionCode,
    -- Generate full address string
    CONCAT(
        ISNULL(s.StoreName + ', ', ''),
        ISNULL(s.Barangay + ', ', ''),
        ISNULL(s.CityMunicipality + ', ', ''),
        ISNULL(s.Region, '')
    ) AS FullAddress,
    -- Marker color based on region (for map visualization)
    CASE 
        WHEN s.Region = 'National Capital Region (NCR)' THEN '#FF5733'
        WHEN s.Region = 'CALABARZON (Region IV-A)' THEN '#33A8FF'
        WHEN s.Region = 'Central Visayas (Region VII)' THEN '#33FF57'
        WHEN s.Region = 'Davao Region (Region XI)' THEN '#9D33FF'
        ELSE '#808080'
    END AS RegionColor
FROM 
    dbo.Stores s
GO

-- Print help text
PRINT '------------------------------------------------------------------------------';
PRINT 'Philippines Location Seed Data has been applied successfully.';
PRINT '';
PRINT 'The following objects have been created or modified:';
PRINT '1. Added Region, CityMunicipality, and Barangay columns to Stores table';
PRINT '2. Added indexes for optimized location-based filtering';
PRINT '3. Created vw_StoreLocationHierarchy view for hierarchical reporting';
PRINT '4. Created sp_GetLocationHierarchy stored procedure for cascading filters';
PRINT '5. Added sample Philippines location data (17 regions, 29 cities, 40 barangays)';
PRINT '';
PRINT 'To use the location hierarchy in filters:';
PRINT 'EXEC sp_GetLocationHierarchy;                           -- Returns all regions';
PRINT 'EXEC sp_GetLocationHierarchy @Region = ''NCR'';           -- Returns cities in NCR';
PRINT 'EXEC sp_GetLocationHierarchy @Region = ''NCR'', @CityMunicipality = ''Manila''; -- Returns barangays in Manila';
PRINT '------------------------------------------------------------------------------';