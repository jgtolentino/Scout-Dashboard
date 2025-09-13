#!/bin/bash
# Script to initialize the dbt project with sample data

set -e

# Directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=== Initializing Scout Edge dbt Project with Sample Data ==="

# Create output directory if it doesn't exist
mkdir -p "../assets/data"

# Generate sample data
echo "=== Generating sample data ==="
./run_and_export.sh --sample

# Create .env file with sample variables if it doesn't exist
if [[ ! -f ".env" ]]; then
  echo "=== Creating sample .env file ==="
  cat > ".env" << EOF
# Databricks connection
DBT_DATABRICKS_HOST=PLACEHOLDER_DATABRICKS_HOST
DBT_DATABRICKS_HTTP_PATH=PLACEHOLDER_HTTP_PATH
DBT_DATABRICKS_TOKEN=PLACEHOLDER_TOKEN

# Source database info
DBT_SOURCE_DATABASE=scout_database
DBT_SOURCE_SCHEMA=bronze
EOF
  echo "Created .env file with sample values"
fi

# Create a README file if it doesn't exist
if [[ ! -f "README.md" ]]; then
  echo "=== Creating README.md ==="
  cat > "README.md" << EOF
# Scout Edge dbt Project

This project contains dbt models for the Scout Edge dashboard data pipeline.

## Models

### SalesInteractionBrands

This is the core model that connects sales transactions to brand data with geographical context.
It's used for brand intelligence analytics and choropleth map visualization.

### TopBrands

Provides brand performance metrics by geographic region with market share and rankings.
This model powers the brand performance visualizations in the dashboard.

### TopCombos

Brand combination analytics showing which brands are purchased together.
This helps identify cross-selling opportunities and brand affinities.

### StoreMetrics

Comprehensive store performance metrics with regional benchmarking.
Used for the store performance dashboard and map visualizations.

## Getting Started

### Setup

1. Install dbt:
   \`\`\`
   pip install dbt-databricks
   \`\`\`

2. Configure environment variables:
   \`\`\`
   cp .env.example .env
   # Edit .env with your Databricks connection details
   \`\`\`

### Running the Models

To run the models and export data:

\`\`\`
./run_and_export.sh
\`\`\`

For sample data:

\`\`\`
./run_and_export.sh --sample
\`\`\`

### Integration with Scout Edge Dashboard

The exported JSON files in \`../assets/data/\` are loaded by the dashboard through the
\`MedallionDataConnector\` and displayed using the dashboard visualization components.
EOF
  echo "Created README.md"
fi

# Create a requirements.txt file
echo "=== Creating requirements.txt ==="
cat > "requirements.txt" << EOF
dbt-core>=1.5.0
dbt-databricks>=1.5.0
pandas>=1.5.0
sqlalchemy>=2.0.0
pyyaml>=6.0
numpy>=1.23.0
databricks-sql-connector>=2.0.0
EOF
echo "Created requirements.txt"

# Create execution permissions
chmod +x run_and_export.sh
chmod +x init_with_sample_data.sh
chmod +x scripts/export_to_json.py

echo
echo "=== Initialization Complete ==="
echo "Sample data has been generated in ../assets/data/"
echo
echo "Next steps:"
echo "1. Review the README.md file for more information"
echo "2. Update connection details in .env if connecting to a real database"
echo "3. Run ./run_and_export.sh to rebuild the models"