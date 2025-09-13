#!/bin/bash
# Enterprise Migrations Deployment Script
# Applies Migration #201 (Enterprise Enhancements) and #202 (Medallion Architecture)

echo "================================================"
echo "TBWA Enterprise Migrations Deployment"
echo "================================================"
echo ""

# Check if running from supabase directory
if [ ! -f "config.toml" ]; then
    echo "❌ Error: Must run this script from the supabase directory"
    echo "Please navigate to your project's supabase folder and try again."
    exit 1
fi

# Function to apply migrations
apply_migrations() {
    echo "📦 Applying Enterprise Migrations..."
    echo ""
    
    # Apply Migration #201
    echo "🚀 Applying Migration #201: Enterprise Enhancements..."
    supabase db push
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to apply migrations. Please check for errors above."
        exit 1
    fi
    
    echo "✅ Migrations applied successfully!"
}

# Function to run initial ETL pipeline
run_initial_etl() {
    echo ""
    echo "🔄 Running initial Medallion ETL pipeline..."
    
    # Get database URL
    DB_URL=$(supabase db url)
    
    if [ -z "$DB_URL" ]; then
        echo "⚠️  Could not get database URL. Skipping ETL initialization."
        echo "   You can run it manually later with:"
        echo "   psql \$DATABASE_URL -c \"SELECT etl.run_medallion_pipeline();\""
        return
    fi
    
    # Run ETL pipeline
    psql "$DB_URL" -c "SELECT etl.run_medallion_pipeline();" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ ETL pipeline initialized successfully!"
    else
        echo "⚠️  ETL pipeline initialization skipped (this is normal on first run)"
    fi
}

# Function to verify deployment
verify_deployment() {
    echo ""
    echo "🔍 Verifying deployment..."
    
    DB_URL=$(supabase db url)
    
    if [ -n "$DB_URL" ]; then
        # Check medallion health
        echo ""
        echo "📊 Medallion Architecture Health:"
        psql "$DB_URL" -c "SELECT layer, total_tables, active_tables FROM gold.medallion_health_dashboard;" 2>/dev/null || echo "⚠️  Medallion dashboard not yet available"
        
        # Check data quality
        echo ""
        echo "📈 Data Quality Status:"
        psql "$DB_URL" -c "SELECT * FROM quality.check_silver_data_quality();" 2>/dev/null || echo "⚠️  Quality checks not yet available"
    fi
}

# Main execution
echo "This script will apply the following migrations:"
echo "• Migration #201: Enterprise Enhancements (Audit, Analytics, Reporting)"
echo "• Migration #202: Medallion Architecture (Bronze, Silver, Gold layers)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    apply_migrations
    run_initial_etl
    verify_deployment
    
    echo ""
    echo "================================================"
    echo "✨ Enterprise Migrations Complete!"
    echo "================================================"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Access Supabase Dashboard: https://app.supabase.com/project/cxzllzyxwpyptfretryc"
    echo "2. View analytics dashboards in the 'gold' schema"
    echo "3. Monitor ETL jobs in metadata.etl_jobs"
    echo "4. Check data quality with: SELECT * FROM quality.check_silver_data_quality();"
    echo ""
    echo "🔗 Quick Links:"
    echo "• [SQL Editor](https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql)"
    echo "• [Table Editor](https://app.supabase.com/project/cxzllzyxwpyptfretryc/editor)"
    echo ""
else
    echo "❌ Deployment cancelled."
fi