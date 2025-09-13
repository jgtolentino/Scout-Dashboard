-- Sprint 08: Customer Profiling Module
-- Purpose: Create customer profile tables, demographics, and segmentation infrastructure
-- Author: Scout Dashboard Team
-- Date: 2025-05-23

USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

-- ======================================
-- 1. CREATE CUSTOMER PROFILE TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerProfiles')
BEGIN
    CREATE TABLE dbo.CustomerProfiles (
        CustomerID INT IDENTITY(1,1) PRIMARY KEY,
        PhoneNumber NVARCHAR(20) NULL,  -- Masked phone from interactions
        FirstSeenDate DATE NOT NULL,
        LastSeenDate DATE NOT NULL,
        TotalTransactions INT DEFAULT 0,
        TotalSpent DECIMAL(18,2) DEFAULT 0,
        AverageTransactionValue DECIMAL(18,2) DEFAULT 0,
        PreferredStoreID INT NULL,
        CustomerSegment NVARCHAR(50) NULL,  -- 'High Value', 'Regular', 'At Risk', 'New'
        ChurnRiskScore DECIMAL(3,2) NULL,  -- 0.00 to 1.00
        LifetimeValue DECIMAL(18,2) DEFAULT 0,
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_CustomerProfiles_Store FOREIGN KEY (PreferredStoreID) 
            REFERENCES dbo.Stores(StoreID)
    );

    CREATE INDEX IX_CustomerProfiles_Segment ON dbo.CustomerProfiles(CustomerSegment);
    CREATE INDEX IX_CustomerProfiles_ChurnRisk ON dbo.CustomerProfiles(ChurnRiskScore);
    CREATE INDEX IX_CustomerProfiles_LTV ON dbo.CustomerProfiles(LifetimeValue);
END
GO

-- ======================================
-- 2. CREATE DEMOGRAPHIC TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerDemographics')
BEGIN
    CREATE TABLE dbo.CustomerDemographics (
        CustomerID INT PRIMARY KEY,
        InferredGender NVARCHAR(10) NULL,  -- From voice analysis
        InferredAgeGroup NVARCHAR(20) NULL,  -- 'Teen', 'Young Adult', 'Adult', 'Senior'
        PreferredLanguage NVARCHAR(50) NULL,
        PreferredTimeOfDay NVARCHAR(20) NULL,  -- 'Morning', 'Afternoon', 'Evening'
        PreferredDayType NVARCHAR(20) NULL,  -- 'Weekday', 'Weekend'
        LocationCluster NVARCHAR(50) NULL,  -- Geographic clustering
        UpdatedDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Demographics_Customer FOREIGN KEY (CustomerID)
            REFERENCES dbo.CustomerProfiles(CustomerID)
    );
END
GO

-- ======================================
-- 3. CREATE PURCHASE PATTERNS TABLE
-- ======================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerPurchasePatterns')
BEGIN
    CREATE TABLE dbo.CustomerPurchasePatterns (
        CustomerID INT PRIMARY KEY,
        TopCategory1 NVARCHAR(100) NULL,
        TopCategory2 NVARCHAR(100) NULL,
        TopCategory3 NVARCHAR(100) NULL,
        TopBrand1 NVARCHAR(100) NULL,
        TopBrand2 NVARCHAR(100) NULL,
        TopBrand3 NVARCHAR(100) NULL,
        PurchaseFrequency NVARCHAR(20) NULL,  -- 'Daily', 'Weekly', 'Monthly'
        AverageDaysBetweenPurchases INT NULL,
        SeasonalityScore DECIMAL(3,2) NULL,  -- 0.00 to 1.00
        BrandLoyaltyScore DECIMAL(3,2) NULL,  -- 0.00 to 1.00
        UpdatedDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PurchasePatterns_Customer FOREIGN KEY (CustomerID)
            REFERENCES dbo.CustomerProfiles(CustomerID)
    );
END
GO

-- ======================================
-- 4. CREATE VIEW FOR CUSTOMER SEGMENTATION
-- ======================================
CREATE OR ALTER VIEW dbo.v_CustomerSegmentation
AS
WITH CustomerMetrics AS (
    SELECT 
        cp.CustomerID,
        cp.PhoneNumber,
        cp.TotalTransactions,
        cp.TotalSpent,
        cp.AverageTransactionValue,
        cp.CustomerSegment,
        cp.ChurnRiskScore,
        cp.LifetimeValue,
        cd.InferredGender,
        cd.InferredAgeGroup,
        cd.PreferredTimeOfDay,
        cd.LocationCluster,
        cpp.TopCategory1,
        cpp.TopBrand1,
        cpp.PurchaseFrequency,
        cpp.BrandLoyaltyScore,
        s.StoreName AS PreferredStore,
        s.Location AS PreferredLocation,
        DATEDIFF(DAY, cp.LastSeenDate, GETDATE()) AS DaysSinceLastPurchase,
        CASE 
            WHEN cp.TotalTransactions >= 50 AND cp.AverageTransactionValue >= 1000 THEN 'VIP'
            WHEN cp.TotalTransactions >= 20 AND cp.AverageTransactionValue >= 500 THEN 'High Value'
            WHEN cp.TotalTransactions >= 10 THEN 'Regular'
            WHEN cp.TotalTransactions >= 1 AND DATEDIFF(DAY, cp.FirstSeenDate, GETDATE()) <= 30 THEN 'New'
            WHEN DATEDIFF(DAY, cp.LastSeenDate, GETDATE()) > 90 THEN 'Dormant'
            ELSE 'Occasional'
        END AS CalculatedSegment,
        CASE
            WHEN DATEDIFF(DAY, cp.LastSeenDate, GETDATE()) > 60 THEN 0.8
            WHEN DATEDIFF(DAY, cp.LastSeenDate, GETDATE()) > 30 THEN 0.5
            WHEN DATEDIFF(DAY, cp.LastSeenDate, GETDATE()) > 14 THEN 0.3
            ELSE 0.1
        END AS CalculatedChurnRisk
    FROM dbo.CustomerProfiles cp
    LEFT JOIN dbo.CustomerDemographics cd ON cp.CustomerID = cd.CustomerID
    LEFT JOIN dbo.CustomerPurchasePatterns cpp ON cp.CustomerID = cpp.CustomerID
    LEFT JOIN dbo.Stores s ON cp.PreferredStoreID = s.StoreID
)
SELECT * FROM CustomerMetrics;
GO

-- ======================================
-- 5. CREATE STORED PROCEDURE FOR PROFILE UPDATES
-- ======================================
CREATE OR ALTER PROCEDURE sp_UpdateCustomerProfiles
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert new customers from recent interactions
    INSERT INTO dbo.CustomerProfiles (PhoneNumber, FirstSeenDate, LastSeenDate)
    SELECT DISTINCT 
        si.CustomerPhone,
        MIN(si.TransactionDate) AS FirstSeen,
        MAX(si.TransactionDate) AS LastSeen
    FROM dbo.SalesInteractions si
    WHERE si.CustomerPhone IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM dbo.CustomerProfiles cp 
            WHERE cp.PhoneNumber = si.CustomerPhone
        )
    GROUP BY si.CustomerPhone;

    -- Update existing customer metrics
    UPDATE cp
    SET 
        cp.LastSeenDate = metrics.LastTransaction,
        cp.TotalTransactions = metrics.TransactionCount,
        cp.TotalSpent = metrics.TotalAmount,
        cp.AverageTransactionValue = metrics.AvgAmount,
        cp.PreferredStoreID = metrics.MostFrequentStore,
        cp.UpdatedDate = GETDATE()
    FROM dbo.CustomerProfiles cp
    INNER JOIN (
        SELECT 
            CustomerPhone,
            MAX(TransactionDate) AS LastTransaction,
            COUNT(*) AS TransactionCount,
            SUM(TransactionAmount) AS TotalAmount,
            AVG(TransactionAmount) AS AvgAmount,
            (
                SELECT TOP 1 StoreID 
                FROM dbo.SalesInteractions si2 
                WHERE si2.CustomerPhone = si.CustomerPhone 
                GROUP BY StoreID 
                ORDER BY COUNT(*) DESC
            ) AS MostFrequentStore
        FROM dbo.SalesInteractions si
        WHERE CustomerPhone IS NOT NULL
        GROUP BY CustomerPhone
    ) metrics ON cp.PhoneNumber = metrics.CustomerPhone;

    -- Update customer segments
    UPDATE dbo.CustomerProfiles
    SET CustomerSegment = CASE 
        WHEN TotalTransactions >= 50 AND AverageTransactionValue >= 1000 THEN 'VIP'
        WHEN TotalTransactions >= 20 AND AverageTransactionValue >= 500 THEN 'High Value'
        WHEN TotalTransactions >= 10 THEN 'Regular'
        WHEN TotalTransactions >= 1 AND DATEDIFF(DAY, FirstSeenDate, GETDATE()) <= 30 THEN 'New'
        WHEN DATEDIFF(DAY, LastSeenDate, GETDATE()) > 90 THEN 'Dormant'
        ELSE 'Occasional'
    END;

    -- Calculate simple churn risk
    UPDATE dbo.CustomerProfiles
    SET ChurnRiskScore = CASE
        WHEN DATEDIFF(DAY, LastSeenDate, GETDATE()) > 60 THEN 0.8
        WHEN DATEDIFF(DAY, LastSeenDate, GETDATE()) > 30 THEN 0.5
        WHEN DATEDIFF(DAY, LastSeenDate, GETDATE()) > 14 THEN 0.3
        ELSE 0.1
    END;

    -- Simple lifetime value calculation
    UPDATE dbo.CustomerProfiles
    SET LifetimeValue = TotalSpent * (1 + (1.0 - ChurnRiskScore));
END
GO

-- ======================================
-- 6. CREATE API STORED PROCEDURE
-- ======================================
CREATE OR ALTER PROCEDURE sp_GetCustomerProfiles
    @Segment NVARCHAR(50) = NULL,
    @MinLifetimeValue DECIMAL(18,2) = NULL,
    @MaxChurnRisk DECIMAL(3,2) = NULL,
    @Location NVARCHAR(100) = NULL,
    @PageSize INT = 100,
    @PageNumber INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    WITH ProfiledCustomers AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY LifetimeValue DESC) AS RowNum,
            CustomerID,
            CustomerSegment,
            ChurnRiskScore,
            LifetimeValue,
            TotalTransactions,
            TotalSpent,
            AverageTransactionValue,
            InferredGender,
            InferredAgeGroup,
            PreferredTimeOfDay,
            LocationCluster,
            TopCategory1,
            TopBrand1,
            PurchaseFrequency,
            BrandLoyaltyScore,
            PreferredStore,
            PreferredLocation,
            DaysSinceLastPurchase
        FROM dbo.v_CustomerSegmentation
        WHERE (@Segment IS NULL OR CustomerSegment = @Segment)
            AND (@MinLifetimeValue IS NULL OR LifetimeValue >= @MinLifetimeValue)
            AND (@MaxChurnRisk IS NULL OR ChurnRiskScore <= @MaxChurnRisk)
            AND (@Location IS NULL OR PreferredLocation LIKE '%' + @Location + '%')
    )
    SELECT 
        CustomerID,
        CustomerSegment,
        ChurnRiskScore,
        LifetimeValue,
        TotalTransactions,
        TotalSpent,
        AverageTransactionValue,
        InferredGender,
        InferredAgeGroup,
        PreferredTimeOfDay,
        LocationCluster,
        TopCategory1,
        TopBrand1,
        PurchaseFrequency,
        BrandLoyaltyScore,
        PreferredStore,
        PreferredLocation,
        DaysSinceLastPurchase
    FROM ProfiledCustomers
    WHERE RowNum BETWEEN ((@PageNumber - 1) * @PageSize + 1) 
        AND (@PageNumber * @PageSize)
    ORDER BY LifetimeValue DESC;
END
GO

-- ======================================
-- 7. CREATE AGGREGATION PROCEDURE
-- ======================================
CREATE OR ALTER PROCEDURE sp_GetCustomerSegmentSummary
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerSegment,
        COUNT(*) AS CustomerCount,
        AVG(LifetimeValue) AS AvgLifetimeValue,
        AVG(ChurnRiskScore) AS AvgChurnRisk,
        AVG(TotalTransactions) AS AvgTransactions,
        AVG(AverageTransactionValue) AS AvgTransactionValue,
        SUM(TotalSpent) AS TotalRevenue
    FROM dbo.v_CustomerSegmentation
    GROUP BY CustomerSegment
    ORDER BY AVG(LifetimeValue) DESC;
    
    -- Demographics breakdown
    SELECT 
        InferredAgeGroup,
        InferredGender,
        COUNT(*) AS CustomerCount,
        AVG(LifetimeValue) AS AvgLifetimeValue
    FROM dbo.v_CustomerSegmentation
    WHERE InferredAgeGroup IS NOT NULL
    GROUP BY InferredAgeGroup, InferredGender
    ORDER BY COUNT(*) DESC;
    
    -- Location insights
    SELECT TOP 10
        LocationCluster,
        COUNT(*) AS CustomerCount,
        AVG(LifetimeValue) AS AvgLifetimeValue,
        AVG(ChurnRiskScore) AS AvgChurnRisk
    FROM dbo.v_CustomerSegmentation
    WHERE LocationCluster IS NOT NULL
    GROUP BY LocationCluster
    ORDER BY COUNT(*) DESC;
END
GO

-- ======================================
-- 8. INITIAL DATA POPULATION
-- ======================================
-- Run the profile update procedure to populate initial data
EXEC sp_UpdateCustomerProfiles;
GO

-- ======================================
-- 9. GRANT PERMISSIONS
-- ======================================
GRANT SELECT ON dbo.CustomerProfiles TO [scout_api_user];
GRANT SELECT ON dbo.CustomerDemographics TO [scout_api_user];
GRANT SELECT ON dbo.CustomerPurchasePatterns TO [scout_api_user];
GRANT SELECT ON dbo.v_CustomerSegmentation TO [scout_api_user];
GRANT EXECUTE ON dbo.sp_GetCustomerProfiles TO [scout_api_user];
GRANT EXECUTE ON dbo.sp_GetCustomerSegmentSummary TO [scout_api_user];
GO

PRINT 'Customer Profiling module installed successfully!';
PRINT 'Tables created: CustomerProfiles, CustomerDemographics, CustomerPurchasePatterns';
PRINT 'View created: v_CustomerSegmentation';
PRINT 'Procedures created: sp_UpdateCustomerProfiles, sp_GetCustomerProfiles, sp_GetCustomerSegmentSummary';
GO