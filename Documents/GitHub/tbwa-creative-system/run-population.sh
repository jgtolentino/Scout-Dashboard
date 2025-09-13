#!/bin/bash

# TBWA Creative Intelligence - Azure SQL Population Script
echo "🚀 TBWA Creative Intelligence → Azure SQL Population"
echo "=================================================="

# Check environment variables
if [ -z "$CES_AZURE_SQL_SERVER" ]; then
    echo "❌ CES_AZURE_SQL_SERVER not set"
    echo "Please set your Azure SQL server in .env.local"
    exit 1
fi

if [ -z "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
    echo "❌ GOOGLE_SERVICE_ACCOUNT_KEY not set"
    echo "Please set your Google service account key in .env.local"
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

echo "🔧 Azure SQL Server: $CES_AZURE_SQL_SERVER"
echo "📁 Google Drive Folder: ${DRIVE_CAMPAIGN_ROOT_ID:-0AJMhu01UUQKoUk9PVA}"
echo ""

echo "Starting population process..."
echo "This will:"
echo "1. Initialize Azure SQL schema"
echo "2. Extract campaigns from Google Drive"
echo "3. Analyze creative features (Echo simulation)"
echo "4. Predict business outcomes (Kalaw simulation)"
echo "5. Store all data in Azure SQL"
echo ""

read -p "Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Running population script..."

# Run the Node.js population script
node scripts/populate-azure-sql.js

echo ""
echo "🎉 Population complete!"
echo ""
echo "Next steps:"
echo "1. Start the dashboard: npm run dev"
echo "2. Visit: http://localhost:3000"
echo "3. Use the Campaign Processing tab to view results"