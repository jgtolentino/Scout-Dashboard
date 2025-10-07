#!/usr/bin/env python
"""
Databricks Data Audit for Scout Edge Dashboard

This script audits Databricks data sources used by the Scout Edge dashboard,
checking data quality, completeness, and adherence to the expected schema.
"""
import os
import sys
import json
import yaml
import argparse
import datetime
import logging
import pandas as pd
from pathlib import Path
import databricks.sql
from tabulate import tabulate

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# SQL queries to check tables
AUDIT_QUERIES = {
    "transactions": """
        SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT TransactionID) as unique_transactions,
            MIN(TransactionDate) as min_date,
            MAX(TransactionDate) as max_date,
            COUNT(DISTINCT StoreID) as store_count,
            COUNT(DISTINCT CustomerID) as customer_count,
            COUNT(*) FILTER (WHERE TransactionDate >= CURRENT_DATE - INTERVAL 90 DAY) as recent_count,
            COUNT(*) FILTER (WHERE Status = 'Completed') as completed_count,
            COUNT(*) FILTER (WHERE TotalAmount IS NULL) as null_amount_count
        FROM sales.transactions
    """,
    
    "transaction_items": """
        SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT TransactionID) as unique_transactions,
            COUNT(DISTINCT ProductID) as unique_products,
            AVG(Quantity) as avg_quantity,
            MIN(Quantity) as min_quantity,
            MAX(Quantity) as max_quantity,
            COUNT(*) FILTER (WHERE LineTotal IS NULL) as null_amount_count
        FROM sales.transaction_items
    """,
    
    "products": """
        SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT ProductID) as unique_products,
            COUNT(DISTINCT BrandID) as unique_brands,
            COUNT(*) FILTER (WHERE BrandID IS NULL) as null_brand_count,
            COUNT(DISTINCT Category) as unique_categories
        FROM inventory.products
    """,
    
    "brands": """
        SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT BrandID) as unique_brands
        FROM inventory.brands
    """,
    
    "stores": """
        SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT StoreID) as unique_stores,
            COUNT(DISTINCT Region) as unique_regions,
            COUNT(DISTINCT City) as unique_cities,
            COUNT(*) FILTER (WHERE Latitude IS NULL OR Longitude IS NULL) as missing_coords_count
        FROM store.locations
    """
}

# Schema validation config
EXPECTED_SCHEMA = {
    "transactions": [
        "TransactionID", "StoreID", "CustomerID", "TransactionDate", 
        "TotalAmount", "ItemCount", "Status"
    ],
    "transaction_items": [
        "TransactionID", "ProductID", "Quantity", "UnitPrice", "LineTotal"
    ],
    "products": [
        "ProductID", "ProductName", "BrandID", "Category", "Subcategory"
    ],
    "brands": [
        "BrandID", "BrandName"
    ],
    "locations": [
        "StoreID", "StoreName", "StoreType", "Region", "City", "Barangay", 
        "Latitude", "Longitude"
    ]
}

def load_profiles():
    """Load dbt profiles configuration."""
    profiles_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "profiles.yml")
    with open(profiles_path, "r") as f:
        return yaml.safe_load(f)

def get_databricks_connection(profile_name, target_name=None):
    """Create a Databricks connection from a dbt profile."""
    profiles = load_profiles()
    
    if profile_name not in profiles:
        raise ValueError(f"Profile '{profile_name}' not found in profiles.yml")
    
    profile = profiles[profile_name]
    target = target_name or profile.get("target", "dev")
    
    if target not in profile.get("outputs", {}):
        raise ValueError(f"Target '{target}' not found in profile '{profile_name}'")
    
    connection_config = profile["outputs"][target]
    
    if connection_config["type"] != "databricks":
        raise ValueError(f"Connection type is not databricks: {connection_config['type']}")
    
    connection = databricks.sql.connect(
        server_hostname=os.path.expandvars(connection_config["host"].replace("{{ env_var('DBT_DATABRICKS_HOST') }}", "${DBT_DATABRICKS_HOST}")),
        http_path=os.path.expandvars(connection_config["http_path"].replace("{{ env_var('DBT_DATABRICKS_HTTP_PATH') }}", "${DBT_DATABRICKS_HTTP_PATH}")),
        access_token=os.path.expandvars(connection_config["token"].replace("{{ env_var('DBT_DATABRICKS_TOKEN') }}", "${DBT_DATABRICKS_TOKEN}"))
    )
    return connection

def check_table_exists(connection, schema, table):
    """Check if a table exists in the database."""
    try:
        with connection.cursor() as cursor:
            query = f"SHOW TABLES IN {schema}"
            cursor.execute(query)
            tables = [row[1] for row in cursor.fetchall()]
            return table in tables
    except Exception as e:
        logger.error(f"Error checking if {schema}.{table} exists: {e}")
        return False

def check_table_schema(connection, schema, table, expected_columns=None):
    """Check table schema and compare with expected columns."""
    try:
        with connection.cursor() as cursor:
            query = f"DESCRIBE {schema}.{table}"
            cursor.execute(query)
            columns = [row[0] for row in cursor.fetchall()]
            
            if expected_columns:
                missing_columns = [col for col in expected_columns if col not in columns]
                
                return {
                    "exists": True,
                    "columns": columns,
                    "missing_columns": missing_columns,
                    "extra_columns": [col for col in columns if col not in expected_columns],
                    "matches_expected": len(missing_columns) == 0
                }
            else:
                return {
                    "exists": True,
                    "columns": columns
                }
    except Exception as e:
        logger.error(f"Error checking schema for {schema}.{table}: {e}")
        return {
            "exists": False,
            "error": str(e)
        }

def run_audit_query(connection, table, query):
    """Run an audit query and return the results."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchone()
            
            result = {}
            for i, col in enumerate(columns):
                result[col] = data[i]
                
            return {
                "success": True,
                "data": result
            }
    except Exception as e:
        logger.error(f"Error running audit query for {table}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def run_sample_query(connection, schema, table, limit=10):
    """Run a sample query to get a few rows from the table."""
    try:
        with connection.cursor() as cursor:
            query = f"SELECT * FROM {schema}.{table} LIMIT {limit}"
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchall()
            
            # Convert to list of dicts
            results = []
            for row in data:
                row_dict = {}
                for i, col in enumerate(columns):
                    row_dict[col] = row[i]
                results.append(row_dict)
                
            return {
                "success": True,
                "columns": columns,
                "data": results
            }
    except Exception as e:
        logger.error(f"Error running sample query for {schema}.{table}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def check_relationships(connection):
    """Check foreign key relationships between tables."""
    relationship_queries = {
        "transaction_items_to_transactions": """
            SELECT 
                COUNT(*) as total_items,
                COUNT(*) FILTER (WHERE t.TransactionID IS NULL) as orphaned_items,
                (COUNT(*) FILTER (WHERE t.TransactionID IS NULL) * 100.0 / NULLIF(COUNT(*), 0)) as orphaned_percentage
            FROM 
                sales.transaction_items ti
            LEFT JOIN 
                sales.transactions t ON ti.TransactionID = t.TransactionID
        """,
        
        "transaction_items_to_products": """
            SELECT 
                COUNT(*) as total_items,
                COUNT(*) FILTER (WHERE p.ProductID IS NULL) as orphaned_items,
                (COUNT(*) FILTER (WHERE p.ProductID IS NULL) * 100.0 / NULLIF(COUNT(*), 0)) as orphaned_percentage
            FROM 
                sales.transaction_items ti
            LEFT JOIN 
                inventory.products p ON ti.ProductID = p.ProductID
        """,
        
        "products_to_brands": """
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE b.BrandID IS NULL) as orphaned_products,
                (COUNT(*) FILTER (WHERE b.BrandID IS NULL) * 100.0 / NULLIF(COUNT(*), 0)) as orphaned_percentage
            FROM 
                inventory.products p
            LEFT JOIN 
                inventory.brands b ON p.BrandID = b.BrandID
            WHERE 
                p.BrandID IS NOT NULL
        """,
        
        "transactions_to_stores": """
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(*) FILTER (WHERE s.StoreID IS NULL) as orphaned_transactions,
                (COUNT(*) FILTER (WHERE s.StoreID IS NULL) * 100.0 / NULLIF(COUNT(*), 0)) as orphaned_percentage
            FROM 
                sales.transactions t
            LEFT JOIN 
                store.locations s ON t.StoreID = s.StoreID
        """
    }
    
    results = {}
    for name, query in relationship_queries.items():
        results[name] = run_audit_query(connection, name, query)
    
    return results

def check_data_quality(connection):
    """Check data quality issues."""
    quality_queries = {
        "duplicate_transactions": """
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN duplicate_count > 1 THEN 1 ELSE 0 END) as duplicate_transactions
            FROM (
                SELECT 
                    TransactionID,
                    COUNT(*) as duplicate_count
                FROM 
                    sales.transactions
                GROUP BY 
                    TransactionID
            )
        """,
        
        "negative_prices": """
            SELECT 
                COUNT(*) as total_items,
                COUNT(*) FILTER (WHERE UnitPrice < 0) as negative_price_items,
                COUNT(*) FILTER (WHERE LineTotal < 0) as negative_total_items
            FROM 
                sales.transaction_items
        """,
        
        "future_dates": """
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(*) FILTER (WHERE TransactionDate > CURRENT_DATE) as future_transactions
            FROM 
                sales.transactions
        """,
        
        "missing_brand_names": """
            SELECT 
                COUNT(*) as total_brands,
                COUNT(*) FILTER (WHERE BrandName IS NULL OR TRIM(BrandName) = '') as missing_names
            FROM 
                inventory.brands
        """,
        
        "invalid_coordinates": """
            SELECT 
                COUNT(*) as total_stores,
                COUNT(*) FILTER (WHERE Latitude < -90 OR Latitude > 90) as invalid_lat,
                COUNT(*) FILTER (WHERE Longitude < -180 OR Longitude > 180) as invalid_lon
            FROM 
                store.locations
        """
    }
    
    results = {}
    for name, query in quality_queries.items():
        results[name] = run_audit_query(connection, name, query)
    
    return results

def generate_audit_report(schema_results, audit_results, relationship_results, quality_results, sample_data):
    """Generate a structured audit report."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = {
        "audit_timestamp": timestamp,
        "schema_validation": schema_results,
        "data_counts": audit_results,
        "relationships": relationship_results,
        "data_quality": quality_results,
        "sample_data": sample_data
    }
    
    # Generate summary metrics
    total_tables = len(schema_results)
    existing_tables = sum(1 for r in schema_results.values() if r.get("exists", False))
    schema_matches = sum(1 for r in schema_results.values() if r.get("matches_expected", False))
    
    # Calculate relationship health
    relationship_health = {}
    for rel, result in relationship_results.items():
        if result.get("success"):
            data = result.get("data", {})
            orphaned = data.get("orphaned_percentage", 0)
            health = "good" if orphaned < 1 else "warning" if orphaned < 5 else "poor"
            relationship_health[rel] = {
                "orphaned_percent": orphaned,
                "health": health
            }
    
    # Calculate overall data health
    data_quality_issues = sum(
        result.get("data", {}).get("negative_price_items", 0) +
        result.get("data", {}).get("future_transactions", 0) +
        result.get("data", {}).get("missing_names", 0) +
        result.get("data", {}).get("invalid_lat", 0) +
        result.get("data", {}).get("invalid_lon", 0)
        for result in quality_results.values() if result.get("success")
    )
    
    # Add summary to report
    report["summary"] = {
        "total_tables": total_tables,
        "existing_tables": existing_tables,
        "schema_matches": schema_matches,
        "relationship_health": relationship_health,
        "data_quality_issues": data_quality_issues,
        "overall_health": "good" if (
            existing_tables == total_tables and 
            schema_matches == total_tables and 
            data_quality_issues == 0 and
            all(h.get("health") == "good" for h in relationship_health.values())
        ) else "warning" if (
            existing_tables == total_tables and
            schema_matches >= total_tables * 0.8 and
            data_quality_issues < 100 and
            all(h.get("health") != "poor" for h in relationship_health.values())
        ) else "poor"
    }
    
    return report

def write_audit_report(report, output_file):
    """Write the audit report to a file."""
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    return output_file

def write_audit_markdown(report, output_file):
    """Write the audit report as a markdown file."""
    with open(output_file, 'w') as f:
        f.write(f"# Databricks Data Audit Report\n\n")
        f.write(f"**Generated:** {report['audit_timestamp']}\n\n")
        
        # Write summary
        summary = report["summary"]
        f.write("## Summary\n\n")
        f.write(f"- **Overall health:** {summary['overall_health'].upper()}\n")
        f.write(f"- **Tables checked:** {summary['existing_tables']}/{summary['total_tables']}\n")
        f.write(f"- **Schema validation:** {summary['schema_matches']}/{summary['total_tables']} tables match expected schema\n")
        f.write(f"- **Data quality issues:** {summary['data_quality_issues']} issues found\n\n")
        
        # Write schema validation results
        f.write("## Schema Validation\n\n")
        
        schema_table = []
        for table, result in report["schema_validation"].items():
            status = "✅ Exists" if result.get("exists", False) else "❌ Missing"
            schema_match = "✅ Matches" if result.get("matches_expected", False) else "❌ Mismatch"
            missing = ", ".join(result.get("missing_columns", []))
            if not missing:
                missing = "None"
                
            schema_table.append([table, status, schema_match, missing])
            
        f.write(tabulate(schema_table, headers=["Table", "Status", "Schema", "Missing Columns"], tablefmt="pipe"))
        f.write("\n\n")
        
        # Write data counts
        f.write("## Data Counts\n\n")
        
        for table, result in report["data_counts"].items():
            if result.get("success", False):
                f.write(f"### {table}\n\n")
                
                data = result.get("data", {})
                counts_table = []
                for metric, value in data.items():
                    counts_table.append([metric, value])
                    
                f.write(tabulate(counts_table, headers=["Metric", "Value"], tablefmt="pipe"))
                f.write("\n\n")
            else:
                f.write(f"### {table}\n\n")
                f.write(f"Error: {result.get('error', 'Unknown error')}\n\n")
        
        # Write relationship results
        f.write("## Relationships\n\n")
        
        rel_table = []
        for rel, result in report["relationships"].items():
            if result.get("success", False):
                data = result.get("data", {})
                total = data.get("total_items", data.get("total_transactions", data.get("total_products", 0)))
                orphaned = data.get("orphaned_items", data.get("orphaned_transactions", data.get("orphaned_products", 0)))
                pct = data.get("orphaned_percentage", 0)
                
                health = "✅ Good" if pct < 1 else "⚠️ Warning" if pct < 5 else "❌ Poor"
                
                rel_table.append([rel, total, orphaned, f"{pct:.2f}%", health])
        
        f.write(tabulate(rel_table, headers=["Relationship", "Total Records", "Orphaned", "Percentage", "Health"], tablefmt="pipe"))
        f.write("\n\n")
        
        # Write data quality results
        f.write("## Data Quality\n\n")
        
        quality_issues = []
        for check, result in report["data_quality"].items():
            if result.get("success", False):
                data = result.get("data", {})
                
                # Extract relevant metrics based on check type
                if check == "duplicate_transactions":
                    total = data.get("total_transactions", 0)
                    issues = data.get("duplicate_transactions", 0)
                    if issues > 0:
                        quality_issues.append([check, total, issues, f"{issues/total*100:.2f}%"])
                        
                elif check == "negative_prices":
                    total = data.get("total_items", 0)
                    negative_price = data.get("negative_price_items", 0)
                    negative_total = data.get("negative_total_items", 0)
                    if negative_price > 0 or negative_total > 0:
                        quality_issues.append(["negative_price_items", total, negative_price, f"{negative_price/total*100:.2f}%"])
                        quality_issues.append(["negative_total_items", total, negative_total, f"{negative_total/total*100:.2f}%"])
                        
                elif check == "future_dates":
                    total = data.get("total_transactions", 0)
                    future = data.get("future_transactions", 0)
                    if future > 0:
                        quality_issues.append([check, total, future, f"{future/total*100:.2f}%"])
                        
                elif check == "missing_brand_names":
                    total = data.get("total_brands", 0)
                    missing = data.get("missing_names", 0)
                    if missing > 0:
                        quality_issues.append([check, total, missing, f"{missing/total*100:.2f}%"])
                        
                elif check == "invalid_coordinates":
                    total = data.get("total_stores", 0)
                    invalid_lat = data.get("invalid_lat", 0)
                    invalid_lon = data.get("invalid_lon", 0)
                    if invalid_lat > 0:
                        quality_issues.append(["invalid_latitude", total, invalid_lat, f"{invalid_lat/total*100:.2f}%"])
                    if invalid_lon > 0:
                        quality_issues.append(["invalid_longitude", total, invalid_lon, f"{invalid_lon/total*100:.2f}%"])
        
        if quality_issues:
            f.write(tabulate(quality_issues, headers=["Issue", "Total Records", "Affected Records", "Percentage"], tablefmt="pipe"))
        else:
            f.write("No data quality issues detected.\n")
            
        f.write("\n\n")
        
        # Write sample data
        f.write("## Sample Data\n\n")
        
        for table, result in report["sample_data"].items():
            if result.get("success", False):
                f.write(f"### {table}\n\n")
                
                data = result.get("data", [])
                if data:
                    # Convert first row to list for headers
                    headers = list(data[0].keys())
                    rows = [[row.get(col, "") for col in headers] for row in data]
                    
                    f.write(tabulate(rows, headers=headers, tablefmt="pipe"))
                    f.write("\n\n")
                else:
                    f.write("No data available.\n\n")
            else:
                f.write(f"### {table}\n\n")
                f.write(f"Error: {result.get('error', 'Unknown error')}\n\n")
        
        # Write recommendations
        f.write("## Recommendations\n\n")
        
        # Generate recommendations based on audit results
        recommendations = []
        
        # Schema recommendations
        missing_schema_tables = [
            table for table, result in report["schema_validation"].items() 
            if not result.get("exists", False)
        ]
        if missing_schema_tables:
            recommendations.append(f"- Create missing tables: {', '.join(missing_schema_tables)}")
        
        schema_mismatch_tables = [
            f"{table} (missing: {', '.join(result.get('missing_columns', []))})" 
            for table, result in report["schema_validation"].items() 
            if result.get("exists", False) and not result.get("matches_expected", False)
        ]
        if schema_mismatch_tables:
            recommendations.append(f"- Fix schema mismatches in tables: {'; '.join(schema_mismatch_tables)}")
        
        # Relationship recommendations
        poor_relationships = [
            rel for rel, health in summary["relationship_health"].items() 
            if health.get("health") == "poor"
        ]
        if poor_relationships:
            recommendations.append(f"- Fix orphaned records in relationships: {', '.join(poor_relationships)}")
        
        # Data quality recommendations
        if report["summary"]["data_quality_issues"] > 0:
            recommendations.append("- Clean data quality issues:")
            if any("duplicate_transactions" in issue[0] for issue in quality_issues):
                recommendations.append("  - Remove duplicate transaction records")
            if any("negative_price" in issue[0] for issue in quality_issues):
                recommendations.append("  - Fix negative price values")
            if any("future_dates" in issue[0] for issue in quality_issues):
                recommendations.append("  - Correct transaction dates set in the future")
            if any("missing_brand_names" in issue[0] for issue in quality_issues):
                recommendations.append("  - Add missing brand names")
            if any("invalid_" in issue[0] for issue in quality_issues):
                recommendations.append("  - Fix invalid geographic coordinates")
        
        # Write all recommendations
        if recommendations:
            for rec in recommendations:
                f.write(f"{rec}\n")
        else:
            f.write("No specific recommendations at this time. Data quality looks good.\n")
    
    return output_file

def run_audit_with_sample_data():
    """Generate sample audit data when no connection is available."""
    # Sample schema validation results
    schema_results = {
        "transactions": {
            "exists": True,
            "columns": ["TransactionID", "StoreID", "CustomerID", "TransactionDate", "TotalAmount", "ItemCount", "Status"],
            "missing_columns": [],
            "extra_columns": ["LastUpdated"],
            "matches_expected": True
        },
        "transaction_items": {
            "exists": True,
            "columns": ["TransactionID", "ProductID", "Quantity", "UnitPrice", "LineTotal"],
            "missing_columns": [],
            "extra_columns": [],
            "matches_expected": True
        },
        "products": {
            "exists": True,
            "columns": ["ProductID", "ProductName", "BrandID", "Category", "Subcategory"],
            "missing_columns": [],
            "extra_columns": ["SKU", "IsActive"],
            "matches_expected": True
        },
        "brands": {
            "exists": True,
            "columns": ["BrandID", "BrandName"],
            "missing_columns": [],
            "extra_columns": ["Logo", "Description"],
            "matches_expected": True
        },
        "locations": {
            "exists": True,
            "columns": ["StoreID", "StoreName", "StoreType", "Region", "City", "Barangay", "Latitude", "Longitude"],
            "missing_columns": [],
            "extra_columns": ["IsActive", "OpeningDate"],
            "matches_expected": True
        }
    }
    
    # Sample audit results
    audit_results = {
        "transactions": {
            "success": True,
            "data": {
                "row_count": 55873,
                "unique_transactions": 55873,
                "min_date": "2024-02-14",
                "max_date": "2025-05-14",
                "store_count": 52,
                "customer_count": 24356,
                "recent_count": 15287,
                "completed_count": 54982,
                "null_amount_count": 0
            }
        },
        "transaction_items": {
            "success": True,
            "data": {
                "row_count": 183695,
                "unique_transactions": 55873,
                "unique_products": 4285,
                "avg_quantity": 2.3,
                "min_quantity": 1,
                "max_quantity": 24,
                "null_amount_count": 0
            }
        },
        "products": {
            "success": True,
            "data": {
                "row_count": 5831,
                "unique_products": 5831,
                "unique_brands": 287,
                "null_brand_count": 142,
                "unique_categories": 24
            }
        },
        "brands": {
            "success": True,
            "data": {
                "row_count": 287,
                "unique_brands": 287
            }
        },
        "stores": {
            "success": True,
            "data": {
                "row_count": 52,
                "unique_stores": 52,
                "unique_regions": 17,
                "unique_cities": 38,
                "missing_coords_count": 2
            }
        }
    }
    
    # Sample relationship results
    relationship_results = {
        "transaction_items_to_transactions": {
            "success": True,
            "data": {
                "total_items": 183695,
                "orphaned_items": 32,
                "orphaned_percentage": 0.017
            }
        },
        "transaction_items_to_products": {
            "success": True,
            "data": {
                "total_items": 183695,
                "orphaned_items": 18,
                "orphaned_percentage": 0.01
            }
        },
        "products_to_brands": {
            "success": True,
            "data": {
                "total_products": 5689,
                "orphaned_products": 53,
                "orphaned_percentage": 0.93
            }
        },
        "transactions_to_stores": {
            "success": True,
            "data": {
                "total_transactions": 55873,
                "orphaned_transactions": 0,
                "orphaned_percentage": 0.0
            }
        }
    }
    
    # Sample data quality results
    quality_results = {
        "duplicate_transactions": {
            "success": True,
            "data": {
                "total_transactions": 55873,
                "duplicate_transactions": 0
            }
        },
        "negative_prices": {
            "success": True,
            "data": {
                "total_items": 183695,
                "negative_price_items": 0,
                "negative_total_items": 0
            }
        },
        "future_dates": {
            "success": True,
            "data": {
                "total_transactions": 55873,
                "future_transactions": 23
            }
        },
        "missing_brand_names": {
            "success": True,
            "data": {
                "total_brands": 287,
                "missing_names": 0
            }
        },
        "invalid_coordinates": {
            "success": True,
            "data": {
                "total_stores": 52,
                "invalid_lat": 0,
                "invalid_lon": 0
            }
        }
    }
    
    # Sample data
    sample_data = {
        "transactions": {
            "success": True,
            "columns": ["TransactionID", "StoreID", "CustomerID", "TransactionDate", "TotalAmount", "ItemCount", "Status"],
            "data": [
                {"TransactionID": "T12345", "StoreID": "S001", "CustomerID": "C5432", "TransactionDate": "2025-05-12", "TotalAmount": 2345.67, "ItemCount": 5, "Status": "Completed"},
                {"TransactionID": "T12346", "StoreID": "S002", "CustomerID": "C8721", "TransactionDate": "2025-05-12", "TotalAmount": 543.21, "ItemCount": 2, "Status": "Completed"},
                {"TransactionID": "T12347", "StoreID": "S001", "CustomerID": "C9023", "TransactionDate": "2025-05-13", "TotalAmount": 1298.45, "ItemCount": 3, "Status": "Completed"}
            ]
        },
        "brands": {
            "success": True,
            "columns": ["BrandID", "BrandName"],
            "data": [
                {"BrandID": "B001", "BrandName": "Nike"},
                {"BrandID": "B002", "BrandName": "Adidas"},
                {"BrandID": "B003", "BrandName": "Puma"}
            ]
        },
        "stores": {
            "success": True,
            "columns": ["StoreID", "StoreName", "StoreType", "Region", "City", "Barangay", "Latitude", "Longitude"],
            "data": [
                {"StoreID": "S001", "StoreName": "Metro Manila Flagship", "StoreType": "Flagship", "Region": "NCR", "City": "Manila", "Barangay": "Binondo", "Latitude": 14.5995, "Longitude": 120.9842},
                {"StoreID": "S002", "StoreName": "Cebu City Mall", "StoreType": "Mall", "Region": "Central Visayas", "City": "Cebu", "Barangay": "Fuente", "Latitude": 10.3157, "Longitude": 123.8854}
            ]
        }
    }
    
    report = generate_audit_report(schema_results, audit_results, relationship_results, quality_results, sample_data)
    return report

def main():
    parser = argparse.ArgumentParser(description='Audit Databricks data for Scout Edge Dashboard')
    parser.add_argument('--profile', default='scout_edge', help='dbt profile name')
    parser.add_argument('--target', default=None, help='dbt target name (default: profile\'s default target)')
    parser.add_argument('--output-dir', default='.', help='Output directory for audit report')
    parser.add_argument('--sample', action='store_true', help='Generate sample audit data (no database connection needed)')
    
    args = parser.parse_args()
    
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)
    
    json_output = os.path.join(output_dir, "databricks_audit_results.json")
    md_output = os.path.join(output_dir, "DATABRICKS_DATA_AUDIT.md")
    
    if args.sample:
        logger.info("Generating sample audit data")
        report = run_audit_with_sample_data()
    else:
        try:
            logger.info(f"Connecting to Databricks using profile '{args.profile}'")
            connection = get_databricks_connection(args.profile, args.target)
            
            # Check schema validation
            logger.info("Checking table schemas")
            schema_results = {}
            for schema_table, expected_columns in EXPECTED_SCHEMA.items():
                # Split schema.table
                parts = schema_table.split('.')
                if len(parts) == 1:
                    schema, table = "public", parts[0]
                else:
                    schema, table = parts
                    
                schema_results[schema_table] = check_table_schema(connection, schema, table, expected_columns)
            
            # Run audit queries
            logger.info("Running audit queries")
            audit_results = {}
            for table, query in AUDIT_QUERIES.items():
                audit_results[table] = run_audit_query(connection, table, query)
            
            # Check relationships
            logger.info("Checking table relationships")
            relationship_results = check_relationships(connection)
            
            # Check data quality
            logger.info("Checking data quality")
            quality_results = check_data_quality(connection)
            
            # Get sample data
            logger.info("Getting sample data")
            sample_data = {}
            for schema_table in EXPECTED_SCHEMA.keys():
                parts = schema_table.split('.')
                if len(parts) == 1:
                    schema, table = "public", parts[0]
                else:
                    schema, table = parts
                    
                sample_data[schema_table] = run_sample_query(connection, schema, table, limit=3)
            
            # Generate report
            logger.info("Generating audit report")
            report = generate_audit_report(schema_results, audit_results, relationship_results, quality_results, sample_data)
            
            # Close connection
            connection.close()
            
        except Exception as e:
            logger.error(f"Error during audit: {e}")
            return 1
    
    # Write reports
    write_audit_report(report, json_output)
    write_audit_markdown(report, md_output)
    
    logger.info(f"Audit report written to {json_output} and {md_output}")
    return 0

if __name__ == '__main__':
    sys.exit(main())