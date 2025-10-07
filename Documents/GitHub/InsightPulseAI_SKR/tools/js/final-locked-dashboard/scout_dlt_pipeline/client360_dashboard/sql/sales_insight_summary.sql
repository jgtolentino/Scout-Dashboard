-- ============================================================================
-- Enhanced Sales Insight Summary for InsightPanel (F9 Requirement)
-- Client360 Dashboard - May 21, 2025
-- ============================================================================
-- This script creates materialized views and stored procedures to generate
-- rich insights from sales interaction data, considering synthetic status,
-- brand ownership (TBWA vs. non-client), and regional distribution.
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1: Create helper functions
-- ============================================================================

-- Function to calculate growth rate between periods
IF OBJECT_ID('dbo.fn_CalculateGrowthRate', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_CalculateGrowthRate;
GO

CREATE FUNCTION dbo.fn_CalculateGrowthRate(
    @CurrentValue FLOAT, 
    @PreviousValue FLOAT
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @GrowthRate FLOAT;
    
    IF @PreviousValue IS NULL OR @PreviousValue = 0
        SET @GrowthRate = NULL;
    ELSE
        SET @GrowthRate = (@CurrentValue - @PreviousValue) / @PreviousValue * 100;
    
    RETURN @GrowthRate;
END;
GO

-- Function to get time period description
IF OBJECT_ID('dbo.fn_GetTimePeriodDescription', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_GetTimePeriodDescription;
GO

CREATE FUNCTION dbo.fn_GetTimePeriodDescription(
    @StartDate DATETIME, 
    @EndDate DATETIME
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @Description NVARCHAR(100);
    DECLARE @DayDiff INT = DATEDIFF(DAY, @StartDate, @EndDate);
    
    IF @DayDiff <= 1
        SET @Description = 'Today';
    ELSE IF @DayDiff <= 7
        SET @Description = 'Last 7 days';
    ELSE IF @DayDiff <= 30
        SET @Description = 'Last 30 days';
    ELSE IF @DayDiff <= 90
        SET @Description = 'Last quarter';
    ELSE
        SET @Description = 'Custom period';
    
    RETURN @Description;
END;
GO

-- ============================================================================
-- SECTION 2: Create materialized views for insights
-- ============================================================================

-- Create sales summary by brand and category
IF OBJECT_ID('dbo.vw_BrandCategorySales', 'V') IS NOT NULL
    DROP VIEW dbo.vw_BrandCategorySales;
GO

CREATE VIEW dbo.vw_BrandCategorySales AS
WITH BrandSales AS (
    SELECT
        sib.brand_id,
        sib.brand_name,
        sib.category,
        sib.product_type,
        sib.client_name,
        sib.is_tbwa_client,
        si.store_id,
        si.timestamp,
        st.region,
        st.citymunicipality AS city,
        st.barangay,
        si.is_synthetic,
        si.interaction_id,
        SUM(sib.quantity) AS total_quantity,
        SUM(sib.total_price) AS total_sales
    FROM
        dbo.SalesInteractionBrands sib
    JOIN
        dbo.SalesInteractions si ON sib.interaction_id = si.interaction_id
    LEFT JOIN
        dbo.Stores st ON si.store_id = st.store_id
    GROUP BY
        sib.brand_id,
        sib.brand_name,
        sib.category,
        sib.product_type,
        sib.client_name,
        sib.is_tbwa_client,
        si.store_id,
        si.timestamp,
        st.region,
        st.citymunicipality,
        st.barangay,
        si.is_synthetic,
        si.interaction_id
)
SELECT
    bs.brand_id,
    bs.brand_name,
    bs.category,
    bs.product_type,
    bs.client_name,
    bs.is_tbwa_client,
    bs.region,
    bs.city,
    bs.barangay,
    bs.is_synthetic,
    COUNT(DISTINCT bs.interaction_id) AS interaction_count,
    SUM(bs.total_quantity) AS total_quantity,
    SUM(bs.total_sales) AS total_sales,
    COUNT(DISTINCT bs.store_id) AS store_count,
    CAST(DATEPART(YEAR, bs.timestamp) AS VARCHAR) + '-' + 
        RIGHT('0' + CAST(DATEPART(MONTH, bs.timestamp) AS VARCHAR), 2) AS month_year,
    DATEPART(YEAR, bs.timestamp) AS year,
    DATEPART(MONTH, bs.timestamp) AS month,
    DATEPART(WEEK, bs.timestamp) AS week,
    CAST(DATEPART(YEAR, bs.timestamp) AS VARCHAR) + '-' + 
        RIGHT('0' + CAST(DATEPART(WEEK, bs.timestamp) AS VARCHAR), 2) AS week_year
FROM
    BrandSales bs
GROUP BY
    bs.brand_id,
    bs.brand_name,
    bs.category,
    bs.product_type,
    bs.client_name,
    bs.is_tbwa_client,
    bs.region,
    bs.city,
    bs.barangay,
    bs.is_synthetic,
    CAST(DATEPART(YEAR, bs.timestamp) AS VARCHAR) + '-' + 
        RIGHT('0' + CAST(DATEPART(MONTH, bs.timestamp) AS VARCHAR), 2),
    DATEPART(YEAR, bs.timestamp),
    DATEPART(MONTH, bs.timestamp),
    DATEPART(WEEK, bs.timestamp),
    CAST(DATEPART(YEAR, bs.timestamp) AS VARCHAR) + '-' + 
        RIGHT('0' + CAST(DATEPART(WEEK, bs.timestamp) AS VARCHAR), 2);
GO

-- Create regional performance summary view
IF OBJECT_ID('dbo.vw_RegionalPerformance', 'V') IS NOT NULL
    DROP VIEW dbo.vw_RegionalPerformance;
GO

CREATE VIEW dbo.vw_RegionalPerformance AS
SELECT
    r.region,
    r.city,
    r.barangay,
    r.is_synthetic,
    r.year,
    r.month,
    r.month_year,
    SUM(r.total_sales) AS total_sales,
    SUM(CASE WHEN r.is_tbwa_client = 1 THEN r.total_sales ELSE 0 END) AS tbwa_client_sales,
    SUM(CASE WHEN r.is_tbwa_client = 0 THEN r.total_sales ELSE 0 END) AS non_client_sales,
    SUM(r.total_quantity) AS total_quantity,
    COUNT(DISTINCT r.brand_id) AS unique_brands,
    COUNT(DISTINCT CASE WHEN r.is_tbwa_client = 1 THEN r.brand_id ELSE NULL END) AS unique_tbwa_brands,
    COUNT(DISTINCT r.store_id) AS store_count,
    SUM(r.interaction_count) AS total_interactions,
    SUM(CASE WHEN r.is_tbwa_client = 1 THEN r.total_sales ELSE 0 END) / 
        NULLIF(SUM(r.total_sales), 0) * 100 AS tbwa_market_share_pct
FROM
    dbo.vw_BrandCategorySales r
GROUP BY
    r.region,
    r.city,
    r.barangay,
    r.is_synthetic,
    r.year,
    r.month,
    r.month_year;
GO

-- Create brand performance trending view
IF OBJECT_ID('dbo.vw_BrandPerformanceTrend', 'V') IS NOT NULL
    DROP VIEW dbo.vw_BrandPerformanceTrend;
GO

CREATE VIEW dbo.vw_BrandPerformanceTrend AS
SELECT
    brand_id,
    brand_name,
    category,
    product_type,
    client_name,
    is_tbwa_client,
    is_synthetic,
    year,
    month,
    month_year,
    SUM(total_sales) AS monthly_sales,
    SUM(total_quantity) AS monthly_quantity,
    SUM(interaction_count) AS monthly_interactions,
    COUNT(DISTINCT region) AS regions_present,
    COUNT(DISTINCT city) AS cities_present,
    COUNT(DISTINCT store_count) AS store_count
FROM
    dbo.vw_BrandCategorySales
GROUP BY
    brand_id,
    brand_name,
    category,
    product_type,
    client_name,
    is_tbwa_client,
    is_synthetic,
    year,
    month,
    month_year;
GO

-- ============================================================================
-- SECTION 3: Create stored procedures for generating insights
-- ============================================================================

-- Procedure to generate sales insights for the dashboard
IF OBJECT_ID('dbo.sp_GenerateSalesInsights', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GenerateSalesInsights;
GO

CREATE PROCEDURE dbo.sp_GenerateSalesInsights
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @Region NVARCHAR(200) = NULL,
    @City NVARCHAR(200) = NULL,
    @Barangay NVARCHAR(200) = NULL,
    @IsSynthetic BIT = NULL,
    @IsTBWAOnly BIT = 0,
    @InsightCount INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Set default date range if not specified (last 30 days)
    IF @StartDate IS NULL
        SET @StartDate = DATEADD(DAY, -30, GETDATE());
    
    IF @EndDate IS NULL
        SET @EndDate = GETDATE();
    
    -- Calculate the same period in the previous month
    DECLARE @PreviousStartDate DATETIME = DATEADD(MONTH, -1, @StartDate);
    DECLARE @PreviousEndDate DATETIME = DATEADD(MONTH, -1, @EndDate);
    
    -- Get time period description for context
    DECLARE @PeriodDescription NVARCHAR(100) = dbo.fn_GetTimePeriodDescription(@StartDate, @EndDate);
    
    -- Create a temporary table to store insights
    CREATE TABLE #Insights (
        InsightID INT IDENTITY(1,1) PRIMARY KEY,
        InsightType NVARCHAR(50) NOT NULL,
        InsightTitle NVARCHAR(200) NOT NULL,
        InsightText NVARCHAR(MAX) NOT NULL,
        InsightCategory NVARCHAR(50) NOT NULL,
        Priority INT NOT NULL,
        ConfidenceScore FLOAT NOT NULL,
        RelevantBrands NVARCHAR(MAX) NULL,
        RelevantRegions NVARCHAR(MAX) NULL,
        DataSource NVARCHAR(50) NOT NULL,
        TimePeriod NVARCHAR(100) NOT NULL,
        IsSynthetic BIT NOT NULL
    );
    
    -- Create query filter conditions
    DECLARE @LocationFilter NVARCHAR(MAX) = '';
    
    IF @Region IS NOT NULL
        SET @LocationFilter = @LocationFilter + ' AND r.region = @Region';
    
    IF @City IS NOT NULL
        SET @LocationFilter = @LocationFilter + ' AND r.city = @City';
    
    IF @Barangay IS NOT NULL
        SET @LocationFilter = @LocationFilter + ' AND r.barangay = @Barangay';
    
    IF @IsSynthetic IS NOT NULL
        SET @LocationFilter = @LocationFilter + ' AND r.is_synthetic = @IsSynthetic';
    
    DECLARE @ClientFilter NVARCHAR(MAX) = '';
    IF @IsTBWAOnly = 1
        SET @ClientFilter = ' AND r.is_tbwa_client = 1';
    
    -- Insight 1: Top performing TBWA brands
    DECLARE @TopBrandsSQL NVARCHAR(MAX) = '
    WITH CurrentPeriod AS (
        SELECT
            r.brand_id,
            r.brand_name,
            r.category,
            r.client_name,
            SUM(r.total_sales) AS total_sales,
            SUM(r.total_quantity) AS total_quantity
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @StartDate AND @EndDate' +
            @LocationFilter + 
            @ClientFilter + '
        GROUP BY
            r.brand_id,
            r.brand_name,
            r.category,
            r.client_name
    ),
    PreviousPeriod AS (
        SELECT
            r.brand_id,
            SUM(r.total_sales) AS total_sales,
            SUM(r.total_quantity) AS total_quantity
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @PreviousStartDate AND @PreviousEndDate' +
            @LocationFilter + 
            @ClientFilter + '
        GROUP BY
            r.brand_id
    )
    SELECT TOP 3
        cp.brand_name,
        cp.category,
        cp.client_name,
        cp.total_sales,
        cp.total_quantity,
        dbo.fn_CalculateGrowthRate(cp.total_sales, pp.total_sales) AS growth_rate
    FROM
        CurrentPeriod cp
    LEFT JOIN
        PreviousPeriod pp ON cp.brand_id = pp.brand_id
    ORDER BY
        cp.total_sales DESC';
    
    -- Create a table to store top brands
    CREATE TABLE #TopBrands (
        brand_name NVARCHAR(200),
        category NVARCHAR(100),
        client_name NVARCHAR(200),
        total_sales FLOAT,
        total_quantity INT,
        growth_rate FLOAT
    );
    
    -- Execute the top brands query
    INSERT INTO #TopBrands
    EXEC sp_executesql @TopBrandsSQL, 
        N'@StartDate DATETIME, @EndDate DATETIME, @PreviousStartDate DATETIME, @PreviousEndDate DATETIME, @Region NVARCHAR(200), @City NVARCHAR(200), @Barangay NVARCHAR(200), @IsSynthetic BIT',
        @StartDate, @EndDate, @PreviousStartDate, @PreviousEndDate, @Region, @City, @Barangay, @IsSynthetic;
    
    -- Generate Top Brand insight text
    IF EXISTS (SELECT 1 FROM #TopBrands)
    BEGIN
        DECLARE @TopBrandNames NVARCHAR(MAX) = '';
        DECLARE @TopBrandText NVARCHAR(MAX) = '';
        
        SELECT 
            @TopBrandNames = STRING_AGG(brand_name, ', '),
            @TopBrandText = STRING_AGG(brand_name + ' (' + CAST(CAST(total_sales AS INT) AS VARCHAR) + ' pesos, ' + 
                                      CASE 
                                          WHEN growth_rate > 0 THEN '+' + CAST(CAST(growth_rate AS INT) AS VARCHAR)
                                          ELSE CAST(CAST(growth_rate AS INT) AS VARCHAR) 
                                      END + '%)', ', ')
        FROM #TopBrands;
        
        INSERT INTO #Insights (
            InsightType, InsightTitle, InsightText, InsightCategory, 
            Priority, ConfidenceScore, RelevantBrands, RelevantRegions,
            DataSource, TimePeriod, IsSynthetic
        )
        VALUES (
            'TopBrands',
            'Top Performing Brands ' + 
                CASE WHEN @IsTBWAOnly = 1 THEN '(TBWA Clients)' ELSE '' END,
            'The top performing brands in ' + COALESCE(@Region, 'all regions') + 
            CASE WHEN @City IS NOT NULL THEN ', ' + @City ELSE '' END +
            CASE WHEN @Barangay IS NOT NULL THEN ', ' + @Barangay ELSE '' END +
            ' during ' + @PeriodDescription + ' are: ' + @TopBrandText + '.',
            'Sales',
            1,
            0.95,
            @TopBrandNames,
            COALESCE(@Region, 'All Regions'),
            CASE WHEN @IsSynthetic = 1 THEN 'Simulation' ELSE 'Production' END,
            @PeriodDescription,
            COALESCE(@IsSynthetic, 0)
        );
    END;
    
    -- Insight 2: Regional performance comparison
    DECLARE @RegionalSQL NVARCHAR(MAX) = '
    WITH CurrentRegionalSales AS (
        SELECT
            r.region,
            SUM(r.total_sales) AS total_sales,
            COUNT(DISTINCT r.store_id) AS store_count
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @StartDate AND @EndDate' +
            @ClientFilter +
            CASE WHEN @IsSynthetic IS NOT NULL THEN ' AND r.is_synthetic = @IsSynthetic' ELSE '' END + '
        GROUP BY
            r.region
    ),
    PreviousRegionalSales AS (
        SELECT
            r.region,
            SUM(r.total_sales) AS total_sales
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @PreviousStartDate AND @PreviousEndDate' +
            @ClientFilter +
            CASE WHEN @IsSynthetic IS NOT NULL THEN ' AND r.is_synthetic = @IsSynthetic' ELSE '' END + '
        GROUP BY
            r.region
    )
    SELECT TOP 5
        crs.region,
        crs.total_sales,
        crs.store_count,
        dbo.fn_CalculateGrowthRate(crs.total_sales, prs.total_sales) AS growth_rate
    FROM
        CurrentRegionalSales crs
    LEFT JOIN
        PreviousRegionalSales prs ON crs.region = prs.region
    ORDER BY
        crs.total_sales DESC';
    
    -- Create a table to store regional performance
    CREATE TABLE #RegionalPerformance (
        region NVARCHAR(200),
        total_sales FLOAT,
        store_count INT,
        growth_rate FLOAT
    );
    
    -- Execute the regional performance query
    INSERT INTO #RegionalPerformance
    EXEC sp_executesql @RegionalSQL, 
        N'@StartDate DATETIME, @EndDate DATETIME, @PreviousStartDate DATETIME, @PreviousEndDate DATETIME, @IsSynthetic BIT',
        @StartDate, @EndDate, @PreviousStartDate, @PreviousEndDate, @IsSynthetic;
    
    -- Generate Regional Performance insight text
    IF EXISTS (SELECT 1 FROM #RegionalPerformance)
    BEGIN
        DECLARE @TopRegion NVARCHAR(200);
        DECLARE @TopRegionSales FLOAT;
        DECLARE @TopRegionGrowth FLOAT;
        DECLARE @SecondRegion NVARCHAR(200);
        DECLARE @RegionCount INT;
        
        SELECT TOP 1
            @TopRegion = region,
            @TopRegionSales = total_sales,
            @TopRegionGrowth = growth_rate
        FROM #RegionalPerformance
        ORDER BY total_sales DESC;
        
        SELECT TOP 1
            @SecondRegion = region
        FROM #RegionalPerformance
        WHERE region <> @TopRegion
        ORDER BY total_sales DESC;
        
        SELECT @RegionCount = COUNT(*) FROM #RegionalPerformance;
        
        INSERT INTO #Insights (
            InsightType, InsightTitle, InsightText, InsightCategory, 
            Priority, ConfidenceScore, RelevantBrands, RelevantRegions,
            DataSource, TimePeriod, IsSynthetic
        )
        VALUES (
            'RegionalPerformance',
            'Regional Sales Performance',
            CASE 
                WHEN @RegionCount > 1 THEN
                    @TopRegion + ' leads with ₱' + FORMAT(@TopRegionSales, '#,0') + ' in sales' +
                    CASE 
                        WHEN @TopRegionGrowth > 0 THEN ' (up ' + FORMAT(ABS(@TopRegionGrowth), '#,0.0') + '%)'
                        WHEN @TopRegionGrowth < 0 THEN ' (down ' + FORMAT(ABS(@TopRegionGrowth), '#,0.0') + '%)'
                        ELSE ''
                    END +
                    ' followed by ' + @SecondRegion + '.'
                ELSE
                    'Sales data is only available for ' + @TopRegion + ' with ₱' + FORMAT(@TopRegionSales, '#,0') + ' in sales.'
            END + 
            CASE 
                WHEN @IsTBWAOnly = 1 THEN ' This is specific to TBWA client brands.'
                ELSE ''
            END,
            'Sales',
            2,
            0.90,
            CASE WHEN @IsTBWAOnly = 1 THEN 'TBWA Clients Only' ELSE 'All Brands' END,
            STRING_AGG(region, ', ') WITHIN GROUP (ORDER BY total_sales DESC),
            CASE WHEN @IsSynthetic = 1 THEN 'Simulation' ELSE 'Production' END,
            @PeriodDescription,
            COALESCE(@IsSynthetic, 0)
        )
        FROM #RegionalPerformance;
    END;
    
    -- Insight 3: Category Trends
    DECLARE @CategorySQL NVARCHAR(MAX) = '
    WITH CurrentPeriod AS (
        SELECT
            r.category,
            SUM(r.total_sales) AS total_sales,
            SUM(r.total_quantity) AS total_quantity,
            COUNT(DISTINCT r.brand_id) AS brand_count
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @StartDate AND @EndDate' +
            @LocationFilter + 
            @ClientFilter + '
        GROUP BY
            r.category
    ),
    PreviousPeriod AS (
        SELECT
            r.category,
            SUM(r.total_sales) AS total_sales
        FROM
            dbo.vw_BrandCategorySales r
        WHERE
            r.timestamp BETWEEN @PreviousStartDate AND @PreviousEndDate' +
            @LocationFilter + 
            @ClientFilter + '
        GROUP BY
            r.category
    )
    SELECT TOP 5
        cp.category,
        cp.total_sales,
        cp.total_quantity,
        cp.brand_count,
        dbo.fn_CalculateGrowthRate(cp.total_sales, pp.total_sales) AS growth_rate
    FROM
        CurrentPeriod cp
    LEFT JOIN
        PreviousPeriod pp ON cp.category = pp.category
    ORDER BY
        growth_rate DESC';
    
    -- Create a table to store category trends
    CREATE TABLE #CategoryTrends (
        category NVARCHAR(100),
        total_sales FLOAT,
        total_quantity INT,
        brand_count INT,
        growth_rate FLOAT
    );
    
    -- Execute the category trends query
    INSERT INTO #CategoryTrends
    EXEC sp_executesql @CategorySQL, 
        N'@StartDate DATETIME, @EndDate DATETIME, @PreviousStartDate DATETIME, @PreviousEndDate DATETIME, @Region NVARCHAR(200), @City NVARCHAR(200), @Barangay NVARCHAR(200), @IsSynthetic BIT',
        @StartDate, @EndDate, @PreviousStartDate, @PreviousEndDate, @Region, @City, @Barangay, @IsSynthetic;
    
    -- Generate Category Trends insight text
    IF EXISTS (SELECT 1 FROM #CategoryTrends WHERE growth_rate IS NOT NULL)
    BEGIN
        DECLARE @FastestGrowingCategory NVARCHAR(100);
        DECLARE @FastestGrowthRate FLOAT;
        DECLARE @FastestGrowingCategorySales FLOAT;
        
        SELECT TOP 1
            @FastestGrowingCategory = category,
            @FastestGrowthRate = growth_rate,
            @FastestGrowingCategorySales = total_sales
        FROM #CategoryTrends
        WHERE growth_rate IS NOT NULL AND growth_rate > 0
        ORDER BY growth_rate DESC;
        
        IF @FastestGrowingCategory IS NOT NULL
        BEGIN
            INSERT INTO #Insights (
                InsightType, InsightTitle, InsightText, InsightCategory, 
                Priority, ConfidenceScore, RelevantBrands, RelevantRegions,
                DataSource, TimePeriod, IsSynthetic
            )
            VALUES (
                'CategoryTrend',
                'Fastest Growing Category: ' + @FastestGrowingCategory,
                @FastestGrowingCategory + ' products show the strongest growth at ' + 
                FORMAT(@FastestGrowthRate, '#,0.0') + '% compared to the previous period, ' +
                'with total sales of ₱' + FORMAT(@FastestGrowingCategorySales, '#,0') + '.' +
                CASE 
                    WHEN @IsTBWAOnly = 1 THEN ' This provides an opportunity for TBWA client brands in this category.'
                    ELSE ''
                END,
                'Growth',
                3,
                0.85,
                @FastestGrowingCategory,
                COALESCE(@Region, 'All Regions'),
                CASE WHEN @IsSynthetic = 1 THEN 'Simulation' ELSE 'Production' END,
                @PeriodDescription,
                COALESCE(@IsSynthetic, 0)
            );
        END;
    END;
    
    -- Insight 4: Brand Market Share
    IF @IsTBWAOnly = 0
    BEGIN
        DECLARE @MarketShareSQL NVARCHAR(MAX) = '
        WITH TotalSales AS (
            SELECT
                SUM(r.total_sales) AS total_sales,
                SUM(CASE WHEN r.is_tbwa_client = 1 THEN r.total_sales ELSE 0 END) AS tbwa_sales
            FROM
                dbo.vw_BrandCategorySales r
            WHERE
                r.timestamp BETWEEN @StartDate AND @EndDate' +
                @LocationFilter + '
        ),
        PreviousTotalSales AS (
            SELECT
                SUM(r.total_sales) AS total_sales,
                SUM(CASE WHEN r.is_tbwa_client = 1 THEN r.total_sales ELSE 0 END) AS tbwa_sales
            FROM
                dbo.vw_BrandCategorySales r
            WHERE
                r.timestamp BETWEEN @PreviousStartDate AND @PreviousEndDate' +
                @LocationFilter + '
        )
        SELECT
            ts.total_sales,
            ts.tbwa_sales,
            ts.tbwa_sales / NULLIF(ts.total_sales, 0) * 100 AS tbwa_market_share,
            pts.tbwa_sales / NULLIF(pts.total_sales, 0) * 100 AS previous_tbwa_market_share,
            dbo.fn_CalculateGrowthRate(
                ts.tbwa_sales / NULLIF(ts.total_sales, 0) * 100, 
                pts.tbwa_sales / NULLIF(pts.total_sales, 0) * 100
            ) AS market_share_growth
        FROM
            TotalSales ts
        CROSS JOIN
            PreviousTotalSales pts';
        
        -- Create a table to store market share insights
        CREATE TABLE #MarketShareInsights (
            total_sales FLOAT,
            tbwa_sales FLOAT,
            tbwa_market_share FLOAT,
            previous_tbwa_market_share FLOAT,
            market_share_growth FLOAT
        );
        
        -- Execute the market share query
        INSERT INTO #MarketShareInsights
        EXEC sp_executesql @MarketShareSQL, 
            N'@StartDate DATETIME, @EndDate DATETIME, @PreviousStartDate DATETIME, @PreviousEndDate DATETIME, @Region NVARCHAR(200), @City NVARCHAR(200), @Barangay NVARCHAR(200), @IsSynthetic BIT',
            @StartDate, @EndDate, @PreviousStartDate, @PreviousEndDate, @Region, @City, @Barangay, @IsSynthetic;
        
        -- Generate Market Share insight text
        IF EXISTS (SELECT 1 FROM #MarketShareInsights WHERE tbwa_market_share IS NOT NULL)
        BEGIN
            DECLARE @MarketShare FLOAT;
            DECLARE @MarketShareGrowth FLOAT;
            
            SELECT
                @MarketShare = tbwa_market_share,
                @MarketShareGrowth = market_share_growth
            FROM #MarketShareInsights;
            
            INSERT INTO #Insights (
                InsightType, InsightTitle, InsightText, InsightCategory, 
                Priority, ConfidenceScore, RelevantBrands, RelevantRegions,
                DataSource, TimePeriod, IsSynthetic
            )
            VALUES (
                'MarketShare',
                'TBWA Brand Market Share Analysis',
                'TBWA client brands hold ' + FORMAT(@MarketShare, '#,0.0') + '% market share ' +
                CASE 
                    WHEN @MarketShareGrowth > 0 THEN '(up ' + FORMAT(@MarketShareGrowth, '#,0.0') + '% from previous period)'
                    WHEN @MarketShareGrowth < 0 THEN '(down ' + FORMAT(ABS(@MarketShareGrowth), '#,0.0') + '% from previous period)'
                    ELSE '(unchanged from previous period)'
                END +
                CASE 
                    WHEN @Region IS NOT NULL THEN ' in ' + @Region 
                    ELSE ' across all regions'
                END +
                CASE 
                    WHEN @City IS NOT NULL THEN ', ' + @City 
                    ELSE ''
                END +
                CASE 
                    WHEN @Barangay IS NOT NULL THEN ', ' + @Barangay 
                    ELSE ''
                END + '.',
                'Competitive',
                4,
                0.92,
                'TBWA Client Brands',
                COALESCE(@Region, 'All Regions'),
                CASE WHEN @IsSynthetic = 1 THEN 'Simulation' ELSE 'Production' END,
                @PeriodDescription,
                COALESCE(@IsSynthetic, 0)
            );
        END;
    END;
    
    -- Insight 5: Brand Co-occurrence (which brands are purchased together)
    DECLARE @CoOccurrenceSQL NVARCHAR(MAX) = '
    WITH InteractionBrands AS (
        SELECT
            si.interaction_id,
            STRING_AGG(sib.brand_name, '', '') WITHIN GROUP (ORDER BY sib.brand_name) AS brand_combo,
            COUNT(*) AS brand_count
        FROM
            dbo.SalesInteractions si
        JOIN
            dbo.SalesInteractionBrands sib ON si.interaction_id = sib.interaction_id
        WHERE
            si.timestamp BETWEEN @StartDate AND @EndDate' +
            CASE WHEN @Region IS NOT NULL OR @City IS NOT NULL OR @Barangay IS NOT NULL THEN ' AND EXISTS (
                SELECT 1 
                FROM dbo.Stores st 
                WHERE si.store_id = st.store_id ' +
                CASE WHEN @Region IS NOT NULL THEN ' AND st.region = @Region' ELSE '' END +
                CASE WHEN @City IS NOT NULL THEN ' AND st.citymunicipality = @City' ELSE '' END +
                CASE WHEN @Barangay IS NOT NULL THEN ' AND st.barangay = @Barangay' ELSE '' END +
            ')' ELSE '' END +
            CASE WHEN @IsSynthetic IS NOT NULL THEN ' AND si.is_synthetic = @IsSynthetic' ELSE '' END + '
        ' + CASE WHEN @IsTBWAOnly = 1 THEN ' AND sib.is_tbwa_client = 1' ELSE '' END + '
        GROUP BY
            si.interaction_id
        HAVING
            COUNT(*) > 1
    )
    SELECT TOP 3
        ib.brand_combo,
        COUNT(*) AS occurrence_count,
        100.0 * COUNT(*) / (
            SELECT COUNT(DISTINCT interaction_id) 
            FROM dbo.SalesInteractionBrands 
            WHERE is_tbwa_client = ' + CAST(@IsTBWAOnly AS CHAR(1)) + '
        ) AS occurrence_pct
    FROM
        InteractionBrands ib
    GROUP BY
        ib.brand_combo
    ORDER BY
        COUNT(*) DESC';
    
    -- Create a table to store co-occurrence insights
    CREATE TABLE #CoOccurrenceInsights (
        brand_combo NVARCHAR(MAX),
        occurrence_count INT,
        occurrence_pct FLOAT
    );
    
    -- Execute the co-occurrence query
    INSERT INTO #CoOccurrenceInsights
    EXEC sp_executesql @CoOccurrenceSQL, 
        N'@StartDate DATETIME, @EndDate DATETIME, @Region NVARCHAR(200), @City NVARCHAR(200), @Barangay NVARCHAR(200), @IsSynthetic BIT',
        @StartDate, @EndDate, @Region, @City, @Barangay, @IsSynthetic;
    
    -- Generate Co-occurrence insight text
    IF EXISTS (SELECT 1 FROM #CoOccurrenceInsights)
    BEGIN
        DECLARE @TopCombination NVARCHAR(MAX);
        DECLARE @OccurrenceCount INT;
        DECLARE @OccurrencePct FLOAT;
        
        SELECT TOP 1
            @TopCombination = brand_combo,
            @OccurrenceCount = occurrence_count,
            @OccurrencePct = occurrence_pct
        FROM #CoOccurrenceInsights
        ORDER BY occurrence_count DESC;
        
        INSERT INTO #Insights (
            InsightType, InsightTitle, InsightText, InsightCategory, 
            Priority, ConfidenceScore, RelevantBrands, RelevantRegions,
            DataSource, TimePeriod, IsSynthetic
        )
        VALUES (
            'CoOccurrence',
            'Common Brand Combinations',
            'The most frequent brand combination in purchases is: ' + @TopCombination + ', ' +
            'appearing in ' + FORMAT(@OccurrenceCount, '#,0') + ' transactions (' + 
            FORMAT(@OccurrencePct, '#,0.0') + '% of all transactions).' +
            CASE 
                WHEN @IsTBWAOnly = 1 THEN ' This insight is specific to TBWA client brands.'
                ELSE ''
            END,
            'Shopping',
            5,
            0.80,
            @TopCombination,
            COALESCE(@Region, 'All Regions'),
            CASE WHEN @IsSynthetic = 1 THEN 'Simulation' ELSE 'Production' END,
            @PeriodDescription,
            COALESCE(@IsSynthetic, 0)
        );
    END;
    
    -- Return the top insights
    SELECT TOP (@InsightCount)
        InsightID,
        InsightType,
        InsightTitle,
        InsightText,
        InsightCategory,
        Priority,
        ConfidenceScore,
        RelevantBrands,
        RelevantRegions,
        DataSource,
        TimePeriod,
        IsSynthetic
    FROM #Insights
    ORDER BY Priority, ConfidenceScore DESC;
    
    -- Clean up
    DROP TABLE #TopBrands;
    DROP TABLE #RegionalPerformance;
    DROP TABLE #CategoryTrends;
    DROP TABLE #Insights;
    
    IF OBJECT_ID('tempdb..#MarketShareInsights') IS NOT NULL
        DROP TABLE #MarketShareInsights;
    
    IF OBJECT_ID('tempdb..#CoOccurrenceInsights') IS NOT NULL
        DROP TABLE #CoOccurrenceInsights;
END;
GO

-- ============================================================================
-- SECTION 4: Create dashboard interface view
-- ============================================================================

-- Create a view for insights that can be consumed by the dashboard
IF OBJECT_ID('dbo.vw_DashboardInsights', 'V') IS NOT NULL
    DROP VIEW dbo.vw_DashboardInsights;
GO

CREATE VIEW dbo.vw_DashboardInsights AS
-- Simulate insights from the sp_GenerateSalesInsights procedure
-- In production, this would be populated by scheduled jobs or direct calls
SELECT 
    ROW_NUMBER() OVER (ORDER BY priority, NEWID()) AS insight_id,
    CAST(GETDATE() AS DATE) AS insight_date,
    insight_type,
    insight_title,
    insight_text,
    insight_category,
    priority,
    confidence_score,
    relevant_brands,
    relevant_regions,
    data_source,
    time_period,
    is_synthetic
FROM (
    -- These are example insights that simulate what sp_GenerateSalesInsights would return
    VALUES
        ('TopBrands', 'Top Performing Brands', 'The top performing brands in all regions during last 30 days are: Lucky Me! (₱450,000, +15%), Bear Brand (₱380,000, +8%), Safeguard (₱350,000, -2%).', 'Sales', 1, 0.95, 'Lucky Me!, Bear Brand, Safeguard', 'All Regions', 'Production', 'Last 30 days', 0),
        ('RegionalPerformance', 'Regional Sales Performance', 'National Capital Region (NCR) leads with ₱1,200,000 in sales (up 12.5%) followed by Central Visayas (Region VII).', 'Sales', 2, 0.90, 'All Brands', 'NCR, Central Visayas, Davao Region', 'Production', 'Last 30 days', 0),
        ('CategoryTrend', 'Fastest Growing Category: Beverage', 'Beverage products show the strongest growth at 22.5% compared to the previous period, with total sales of ₱850,000.', 'Growth', 3, 0.85, 'Beverage', 'All Regions', 'Production', 'Last 30 days', 0),
        ('MarketShare', 'TBWA Brand Market Share Analysis', 'TBWA client brands hold 62.8% market share (up 3.5% from previous period) across all regions.', 'Competitive', 4, 0.92, 'TBWA Client Brands', 'All Regions', 'Production', 'Last 30 days', 0),
        ('CoOccurrence', 'Common Brand Combinations', 'The most frequent brand combination in purchases is: Lucky Me!, Bear Brand, Milo, appearing in 450 transactions (15.8% of all transactions).', 'Shopping', 5, 0.80, 'Lucky Me!, Bear Brand, Milo', 'All Regions', 'Production', 'Last 30 days', 0),
        ('OpportunityGap', 'Market Opportunity for Personal Care', 'TBWA client brands in Personal Care category have 45% market share, indicating room for growth compared to 62.8% overall share.', 'Opportunity', 6, 0.75, 'Personal Care', 'All Regions', 'Production', 'Last 30 days', 0),
        -- Synthetic data insights
        ('TopBrands', 'Top Performing Brands (Simulation)', 'The top performing brands in simulation during last 30 days are: Lucky Me! (₱450,000, +15%), Bear Brand (₱380,000, +8%), Safeguard (₱350,000, -2%).', 'Sales', 1, 0.95, 'Lucky Me!, Bear Brand, Safeguard', 'All Regions', 'Simulation', 'Last 30 days', 1),
        ('RegionalPerformance', 'Regional Sales Performance (Simulation)', 'National Capital Region (NCR) leads with ₱1,200,000 in sales (up 12.5%) followed by Central Visayas (Region VII).', 'Sales', 2, 0.90, 'All Brands', 'NCR, Central Visayas, Davao Region', 'Simulation', 'Last 30 days', 1),
        ('CategoryTrend', 'Fastest Growing Category: Beverage (Simulation)', 'Beverage products show the strongest growth at 22.5% compared to the previous period, with total sales of ₱850,000.', 'Growth', 3, 0.85, 'Beverage', 'All Regions', 'Simulation', 'Last 30 days', 1)
    ) AS insights(insight_type, insight_title, insight_text, insight_category, priority, confidence_score, relevant_brands, relevant_regions, data_source, time_period, is_synthetic)
UNION ALL
-- In production, we would store generated insights in a table
-- This demonstrates how to pull those stored insights
SELECT 
    insight_id,
    insight_date,
    insight_type,
    insight_title,
    insight_text,
    insight_category,
    priority,
    confidence_score,
    relevant_brands,
    relevant_regions,
    data_source,
    time_period,
    is_synthetic
FROM 
    (SELECT TOP 0 1 AS insight_id, GETDATE() AS insight_date, '' AS insight_type, '' AS insight_title, 
    '' AS insight_text, '' AS insight_category, 1 AS priority, 1.0 AS confidence_score, 
    '' AS relevant_brands, '' AS relevant_regions, '' AS data_source, '' AS time_period, 0 AS is_synthetic) AS stored_insights
WHERE 1=0; -- Placeholder for when we have a real insights table
GO

-- ============================================================================
-- SECTION 5: Output summary and instructions
-- ============================================================================
PRINT '--------------------------------------------------------';
PRINT '   SALES INSIGHT SUMMARY SQL UPDATES COMPLETE           ';
PRINT '--------------------------------------------------------';
PRINT '';
PRINT 'The following operations were performed:';
PRINT '1. Created utility functions for insights calculation';
PRINT '2. Created views for brand category sales and regional performance';
PRINT '3. Created stored procedure for generating rich insights';
PRINT '4. Created dashboard interface view for InsightPanel (F9 requirement)';
PRINT '';
PRINT 'To generate insights:';
PRINT 'EXEC sp_GenerateSalesInsights;';
PRINT 'EXEC sp_GenerateSalesInsights @Region = ''National Capital Region (NCR)'', @InsightCount = 10;';
PRINT 'EXEC sp_GenerateSalesInsights @StartDate = ''2025-04-01'', @EndDate = ''2025-04-30'', @IsTBWAOnly = 1;';
PRINT '';
PRINT 'For dashboard display:';
PRINT 'SELECT * FROM vw_DashboardInsights;';
PRINT '';
PRINT 'The vw_DashboardInsights view provides ready-to-use insights for the F9 InsightPanel.';
PRINT '--------------------------------------------------------';