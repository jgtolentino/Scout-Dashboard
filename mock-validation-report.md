# Schema Validation Report

**Generated:** 2025-01-17T12:00:00.000Z
**Status:** ⚠️ PASSED WITH WARNINGS

## Issues Found (2)

### Warnings (2)

- **products.csv** (public.products): Columns not found in schema: id
- **inventory_report.csv** (public.products): Columns not found in schema: product_id, product_name, current_stock, reorder_level, supplier

## Summary

The validation found 2 warnings but no critical errors. The data files are largely compatible with the schema, with the following observations:

1. **products.csv**: Uses 'id' instead of the UUID-based id in the schema
2. **inventory_report.csv**: Appears to be a denormalized view with additional columns not present in the base products table

### Recommendations

1. Consider creating a view or separate table for inventory reporting data
2. Ensure consistent naming conventions between CSV exports and database columns
3. Map 'id' fields in CSV files to appropriate UUID columns during import