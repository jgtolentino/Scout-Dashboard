#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_dashboard_views.py - Updates dashboard views with AI insights

This script updates the dashboard views used to display AI insights in the 
Client360 Dashboard, ensuring the latest insights are available for display.
"""

import os
import sys
import time
import json
import logging
import argparse
import datetime
from dotenv import load_dotenv
from databricks import sql

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"logs/view_update_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("dashboard_views_updater")

# Load environment variables
load_dotenv()

def connect_to_databricks():
    """Connect to Databricks SQL warehouse."""
    try:
        connection = sql.connect(
            server_hostname=os.environ["DATABRICKS_HOST"],
            http_path=os.environ["DATABRICKS_HTTP_PATH"],
            access_token=os.environ["DATABRICKS_TOKEN"]
        )
        logger.info("Successfully connected to Databricks SQL warehouse")
        return connection
    except Exception as e:
        logger.error(f"Error connecting to Databricks: {e}")
        sys.exit(1)

def update_sales_insights_view(connection):
    """Update the sales insights view for the dashboard."""
    try:
        cursor = connection.cursor()
        
        # Check if the view exists
        cursor.execute("""
        SHOW VIEWS IN ${DATABRICKS_SCHEMA} LIKE 'vw_SalesInsightsDashboard'
        """)
        view_exists = cursor.fetchone() is not None
        
        if view_exists:
            # Drop the existing view
            cursor.execute(f"""
            DROP VIEW IF EXISTS ${DATABRICKS_SCHEMA}.vw_SalesInsightsDashboard
            """)
        
        # Create the view
        cursor.execute(f"""
        CREATE OR REPLACE VIEW ${DATABRICKS_SCHEMA}.vw_SalesInsightsDashboard AS
        WITH LatestInsights AS (
            SELECT 
                i.InsightID,
                i.StoreID,
                i.GeneratedAt,
                i.IsSynthetic,
                JSON_VALUE(i.Content, '$.title') AS Title,
                JSON_VALUE(i.Content, '$.summary') AS Summary,
                JSON_QUERY(i.Content, '$.category_analysis') AS CategoryAnalysisJSON,
                JSON_QUERY(i.Content, '$.sales_trends') AS SalesTrendsJSON,
                JSON_QUERY(i.Content, '$.recommendations') AS RecommendationsJSON,
                JSON_VALUE(i.Content, '$.confidence') AS Confidence,
                ROW_NUMBER() OVER (PARTITION BY i.StoreID ORDER BY i.GeneratedAt DESC) as rn
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights i
            WHERE 
                i.InsightType = 'sales_insights'
                AND i.IsActive = 1
        )
        SELECT 
            i.InsightID,
            i.StoreID,
            s.StoreName,
            s.Region,
            s.CityMunicipality,
            s.Barangay,
            i.GeneratedAt,
            i.Title,
            i.Summary,
            i.CategoryAnalysisJSON,
            i.SalesTrendsJSON,
            i.RecommendationsJSON,
            i.Confidence,
            i.IsSynthetic,
            CASE WHEN i.IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS DataSource
        FROM 
            LatestInsights i
        LEFT JOIN 
            ${DATABRICKS_SCHEMA}.Stores s ON i.StoreID = s.StoreID
        WHERE 
            i.rn = 1
        ORDER BY 
            i.GeneratedAt DESC
        """)
        
        logger.info("Successfully updated sales insights dashboard view")
        return True
    except Exception as e:
        logger.error(f"Error updating sales insights view: {e}")
        return False

def update_brand_analysis_view(connection):
    """Update the brand analysis view for the dashboard."""
    try:
        cursor = connection.cursor()
        
        # Check if the view exists
        cursor.execute("""
        SHOW VIEWS IN ${DATABRICKS_SCHEMA} LIKE 'vw_BrandAnalysisDashboard'
        """)
        view_exists = cursor.fetchone() is not None
        
        if view_exists:
            # Drop the existing view
            cursor.execute(f"""
            DROP VIEW IF EXISTS ${DATABRICKS_SCHEMA}.vw_BrandAnalysisDashboard
            """)
        
        # Create the view
        cursor.execute(f"""
        CREATE OR REPLACE VIEW ${DATABRICKS_SCHEMA}.vw_BrandAnalysisDashboard AS
        WITH LatestInsights AS (
            SELECT 
                i.InsightID,
                i.BrandID,
                i.GeneratedAt,
                i.IsSynthetic,
                JSON_VALUE(i.Content, '$.title') AS Title,
                JSON_VALUE(i.Content, '$.summary') AS Summary,
                JSON_QUERY(i.Content, '$.sentiment_analysis') AS SentimentAnalysisJSON,
                JSON_QUERY(i.Content, '$.interaction_analysis') AS InteractionAnalysisJSON,
                JSON_QUERY(i.Content, '$.recommendations') AS RecommendationsJSON,
                JSON_QUERY(i.Content, '$.competitive_positioning') AS CompetitivePositioningJSON,
                JSON_VALUE(i.Content, '$.confidence') AS Confidence,
                ROW_NUMBER() OVER (PARTITION BY i.BrandID ORDER BY i.GeneratedAt DESC) as rn
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights i
            WHERE 
                i.InsightType = 'brand_analysis'
                AND i.IsActive = 1
        )
        SELECT 
            i.InsightID,
            i.BrandID,
            REPLACE(i.BrandID, '_', ' ') AS BrandName,
            i.GeneratedAt,
            i.Title,
            i.Summary,
            i.SentimentAnalysisJSON,
            i.InteractionAnalysisJSON,
            i.RecommendationsJSON,
            i.CompetitivePositioningJSON,
            i.Confidence,
            i.IsSynthetic,
            CASE WHEN i.IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS DataSource
        FROM 
            LatestInsights i
        WHERE 
            i.rn = 1
        ORDER BY 
            i.GeneratedAt DESC
        """)
        
        logger.info("Successfully updated brand analysis dashboard view")
        return True
    except Exception as e:
        logger.error(f"Error updating brand analysis view: {e}")
        return False

def update_store_recommendations_view(connection):
    """Update the store recommendations view for the dashboard."""
    try:
        cursor = connection.cursor()
        
        # Check if the view exists
        cursor.execute("""
        SHOW VIEWS IN ${DATABRICKS_SCHEMA} LIKE 'vw_StoreRecommendationsDashboard'
        """)
        view_exists = cursor.fetchone() is not None
        
        if view_exists:
            # Drop the existing view
            cursor.execute(f"""
            DROP VIEW IF EXISTS ${DATABRICKS_SCHEMA}.vw_StoreRecommendationsDashboard
            """)
        
        # Create the view
        cursor.execute(f"""
        CREATE OR REPLACE VIEW ${DATABRICKS_SCHEMA}.vw_StoreRecommendationsDashboard AS
        WITH LatestInsights AS (
            SELECT 
                i.InsightID,
                i.StoreID,
                i.GeneratedAt,
                i.IsSynthetic,
                JSON_VALUE(i.Content, '$.title') AS Title,
                JSON_VALUE(i.Content, '$.summary') AS Summary,
                JSON_QUERY(i.Content, '$.store_assessment') AS StoreAssessmentJSON,
                JSON_QUERY(i.Content, '$.product_mix_recommendations') AS ProductMixJSON,
                JSON_QUERY(i.Content, '$.category_management') AS CategoryManagementJSON,
                JSON_QUERY(i.Content, '$.action_plan') AS ActionPlanJSON,
                JSON_QUERY(i.Content, '$.financial_impact') AS FinancialImpactJSON,
                JSON_VALUE(i.Content, '$.priority') AS Priority,
                ROW_NUMBER() OVER (PARTITION BY i.StoreID ORDER BY i.GeneratedAt DESC) as rn
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights i
            WHERE 
                i.InsightType = 'store_recommendations'
                AND i.IsActive = 1
        )
        SELECT 
            i.InsightID,
            i.StoreID,
            s.StoreName,
            s.Region,
            s.CityMunicipality,
            s.Barangay,
            i.GeneratedAt,
            i.Title,
            i.Summary,
            i.StoreAssessmentJSON,
            i.ProductMixJSON,
            i.CategoryManagementJSON,
            i.ActionPlanJSON,
            i.FinancialImpactJSON,
            i.Priority,
            i.IsSynthetic,
            CASE WHEN i.IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS DataSource
        FROM 
            LatestInsights i
        LEFT JOIN 
            ${DATABRICKS_SCHEMA}.Stores s ON i.StoreID = s.StoreID
        WHERE 
            i.rn = 1
        ORDER BY 
            i.GeneratedAt DESC
        """)
        
        logger.info("Successfully updated store recommendations dashboard view")
        return True
    except Exception as e:
        logger.error(f"Error updating store recommendations view: {e}")
        return False

def update_all_insights_view(connection):
    """Update a unified view of all insights for the dashboard."""
    try:
        cursor = connection.cursor()
        
        # Check if the view exists
        cursor.execute("""
        SHOW VIEWS IN ${DATABRICKS_SCHEMA} LIKE 'vw_AllInsightsDashboard'
        """)
        view_exists = cursor.fetchone() is not None
        
        if view_exists:
            # Drop the existing view
            cursor.execute(f"""
            DROP VIEW IF EXISTS ${DATABRICKS_SCHEMA}.vw_AllInsightsDashboard
            """)
        
        # Create the view
        cursor.execute(f"""
        CREATE OR REPLACE VIEW ${DATABRICKS_SCHEMA}.vw_AllInsightsDashboard AS
        SELECT 
            InsightID,
            InsightType,
            GeneratedAt,
            StoreID,
            BrandID,
            RegionID,
            CategoryID,
            JSON_VALUE(Content, '$.title') AS Title,
            JSON_VALUE(Content, '$.summary') AS Summary,
            CASE WHEN IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS DataSource,
            IsSynthetic,
            IsActive
        FROM 
            ${DATABRICKS_SCHEMA}.AIInsights
        WHERE 
            IsActive = 1
        ORDER BY 
            GeneratedAt DESC
        """)
        
        logger.info("Successfully updated all insights dashboard view")
        return True
    except Exception as e:
        logger.error(f"Error updating all insights view: {e}")
        return False

def create_dashboard_json_view(connection):
    """Create a JSON view for direct dashboard consumption."""
    try:
        cursor = connection.cursor()
        
        # Check if the view exists
        cursor.execute("""
        SHOW VIEWS IN ${DATABRICKS_SCHEMA} LIKE 'vw_DashboardInsightsJSON'
        """)
        view_exists = cursor.fetchone() is not None
        
        if view_exists:
            # Drop the existing view
            cursor.execute(f"""
            DROP VIEW IF EXISTS ${DATABRICKS_SCHEMA}.vw_DashboardInsightsJSON
            """)
        
        # Create the view
        cursor.execute(f"""
        CREATE OR REPLACE VIEW ${DATABRICKS_SCHEMA}.vw_DashboardInsightsJSON AS
        WITH AllInsights AS (
            -- Sales Insights
            SELECT 
                'sales_insights' AS category,
                InsightID,
                StoreID AS entityID,
                NULL AS entityName,
                GeneratedAt,
                JSON_VALUE(Content, '$.title') AS title,
                JSON_VALUE(Content, '$.summary') AS summary,
                Content AS content,
                IsSynthetic
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights
            WHERE 
                InsightType = 'sales_insights'
                AND IsActive = 1
            
            UNION ALL
            
            -- Brand Analysis
            SELECT 
                'brand_analysis' AS category,
                InsightID,
                BrandID AS entityID,
                NULL AS entityName,
                GeneratedAt,
                JSON_VALUE(Content, '$.title') AS title,
                JSON_VALUE(Content, '$.summary') AS summary,
                Content AS content,
                IsSynthetic
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights
            WHERE 
                InsightType = 'brand_analysis'
                AND IsActive = 1
                
            UNION ALL
            
            -- Store Recommendations
            SELECT 
                'store_recommendations' AS category,
                InsightID,
                StoreID AS entityID,
                NULL AS entityName,
                GeneratedAt,
                JSON_VALUE(Content, '$.title') AS title,
                JSON_VALUE(Content, '$.summary') AS summary,
                Content AS content,
                IsSynthetic
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights
            WHERE 
                InsightType = 'store_recommendations'
                AND IsActive = 1
                
            UNION ALL
            
            -- Market Trends
            SELECT 
                'market_trends' AS category,
                InsightID,
                RegionID AS entityID,
                NULL AS entityName,
                GeneratedAt,
                JSON_VALUE(Content, '$.title') AS title,
                JSON_VALUE(Content, '$.summary') AS summary,
                Content AS content,
                IsSynthetic
            FROM 
                ${DATABRICKS_SCHEMA}.AIInsights
            WHERE 
                InsightType = 'market_trends'
                AND IsActive = 1
        )
        SELECT 
            category,
            InsightID,
            entityID,
            COALESCE(
                s.StoreName, 
                REPLACE(a.entityID, '_', ' '), 
                a.entityName
            ) AS entityName,
            CASE 
                WHEN s.Region IS NOT NULL THEN s.Region
                ELSE NULL 
            END AS region,
            CASE 
                WHEN s.CityMunicipality IS NOT NULL THEN s.CityMunicipality
                ELSE NULL 
            END AS cityMunicipality,
            GeneratedAt,
            title,
            summary,
            content,
            IsSynthetic,
            CASE WHEN IsSynthetic = 1 THEN 'Synthetic' ELSE 'Real' END AS dataSource
        FROM 
            AllInsights a
        LEFT JOIN 
            ${DATABRICKS_SCHEMA}.Stores s ON a.entityID = s.StoreID
        ORDER BY 
            GeneratedAt DESC
        """)
        
        logger.info("Successfully created dashboard JSON view")
        return True
    except Exception as e:
        logger.error(f"Error creating dashboard JSON view: {e}")
        return False

def create_static_json_exports(connection):
    """Create static JSON exports for dashboard consumption."""
    try:
        # Ensure output directory exists
        os.makedirs("output/dashboard", exist_ok=True)
        
        cursor = connection.cursor()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Query latest insights
        cursor.execute(f"""
        SELECT 
            category,
            InsightID,
            entityID,
            entityName,
            region,
            cityMunicipality,
            GeneratedAt,
            title,
            summary,
            content,
            dataSource
        FROM 
            ${DATABRICKS_SCHEMA}.vw_DashboardInsightsJSON
        WHERE
            IsSynthetic = CASE 
                WHEN '${os.environ.get("ENABLE_SYNTHETIC_DATA", "true")}' = 'true' THEN IsSynthetic
                ELSE 0
            END
        ORDER BY 
            GeneratedAt DESC
        """)
        
        # Fetch results
        results = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        
        # Convert to list of dictionaries
        insights = []
        for row in results:
            insight = {}
            for i, column in enumerate(column_names):
                value = row[i]
                # Convert datetime objects to ISO format
                if isinstance(value, datetime.datetime):
                    value = value.isoformat()
                # Parse JSON strings
                if column == 'content' and isinstance(value, str):
                    try:
                        value = json.loads(value)
                    except:
                        pass
                insight[column] = value
            insights.append(insight)
        
        # Group by category
        categories = {}
        for insight in insights:
            category = insight["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(insight)
        
        # Write individual category files
        for category, category_insights in categories.items():
            filename = f"output/dashboard/{category}_{timestamp}.json"
            with open(filename, 'w') as f:
                json.dump(category_insights, f, indent=2)
            logger.info(f"Wrote {len(category_insights)} insights to {filename}")
        
        # Write combined file
        combined_filename = f"output/dashboard/all_insights_{timestamp}.json"
        with open(combined_filename, 'w') as f:
            json.dump(insights, f, indent=2)
        logger.info(f"Wrote {len(insights)} total insights to {combined_filename}")
        
        # Update latest symlinks
        for category in categories.keys():
            symlink_name = f"output/dashboard/{category}_latest.json"
            if os.path.exists(symlink_name):
                os.remove(symlink_name)
            os.symlink(f"{category}_{timestamp}.json", symlink_name)
            
        all_symlink = "output/dashboard/all_insights_latest.json"
        if os.path.exists(all_symlink):
            os.remove(all_symlink)
        os.symlink(f"all_insights_{timestamp}.json", all_symlink)
        
        logger.info("Successfully created static JSON exports")
        return True
    except Exception as e:
        logger.error(f"Error creating static JSON exports: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Update dashboard views with AI insights")
    parser.add_argument("--static-only", action="store_true",
                      help="Only generate static JSON exports, don't update views")
    args = parser.parse_args()
    
    # Connect to Databricks
    connection = connect_to_databricks()
    
    success_count = 0
    total_count = 0
    
    if not args.static_only:
        # Update views
        logger.info("Updating dashboard views...")
        
        # Sales insights view
        total_count += 1
        if update_sales_insights_view(connection):
            success_count += 1
        
        # Brand analysis view
        total_count += 1
        if update_brand_analysis_view(connection):
            success_count += 1
        
        # Store recommendations view
        total_count += 1
        if update_store_recommendations_view(connection):
            success_count += 1
        
        # All insights view
        total_count += 1
        if update_all_insights_view(connection):
            success_count += 1
        
        # Dashboard JSON view
        total_count += 1
        if create_dashboard_json_view(connection):
            success_count += 1
    
    # Create static JSON exports
    total_count += 1
    if create_static_json_exports(connection):
        success_count += 1
    
    # Close connection
    connection.close()
    
    # Summary
    logger.info(f"Dashboard view update complete: {success_count}/{total_count} operations succeeded")
    
    if success_count == total_count:
        logger.info("All dashboard view updates completed successfully!")
        return 0
    else:
        logger.error("Some dashboard view updates failed. See log for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())