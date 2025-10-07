#\!/bin/bash
# Script to export DBML schema to SQL format

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/schema_export_${TIMESTAMP}.log"
SCHEMA_FILE="schema/client360.dbml"
EXPORT_DIR="schema_export"

echo -e "${YELLOW}Starting DBML Schema Export...${NC}" | tee -a "$LOG_FILE"

# Check if DBML CLI is installed
if \! command -v dbml2sql &> /dev/null; then
  echo -e "${YELLOW}DBML CLI not found. Installing...${NC}" | tee -a "$LOG_FILE"
  npm install -g @dbml/cli
fi

# Create export directory
mkdir -p "$EXPORT_DIR"

# Check if schema file exists
if [ \! -f "$SCHEMA_FILE" ]; then
  echo -e "${RED}Schema file ${SCHEMA_FILE} not found\!${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# Export to various formats
echo -e "${YELLOW}Exporting to PostgreSQL format...${NC}" | tee -a "$LOG_FILE"
dbml2sql --postgres -o "${EXPORT_DIR}/schema_postgres.sql" "$SCHEMA_FILE"

echo -e "${YELLOW}Exporting to MySQL format...${NC}" | tee -a "$LOG_FILE"
dbml2sql --mysql -o "${EXPORT_DIR}/schema_mysql.sql" "$SCHEMA_FILE"

echo -e "${YELLOW}Exporting to JSON...${NC}" | tee -a "$LOG_FILE"
# Since dbml2json might not be available, create a basic JSON structure
jq -n --arg schema "$(cat $SCHEMA_FILE)" '{schema: $schema, exported_at: now|todate}' > "${EXPORT_DIR}/schema.json"

# Create a metadata file
cat > "${EXPORT_DIR}/export_metadata.json" << EOF
{
  "schema_name": "Client360 Dashboard Schema",
  "exported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0",
  "files": [
    "schema_postgres.sql",
    "schema_mysql.sql",
    "schema.json"
  ]
}
EOF

echo -e "${GREEN}Schema export complete\!${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}Exported files available in ${EXPORT_DIR}/${NC}" | tee -a "$LOG_FILE"

# Create a simple HTML report
cat > "${EXPORT_DIR}/export_report.html" << EOF
<\!DOCTYPE html>
<html>
<head>
  <title>Schema Export Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #002B80; }
    .success { color: green; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Client360 Dashboard Schema Export</h1>
  <p>Export completed at: <strong>$(date)</strong></p>
  <p class="success">✅ All schema formats have been exported successfully.</p>
  
  <h2>Exported Files:</h2>
  <ul>
    <li>PostgreSQL Schema: <code>schema_postgres.sql</code></li>
    <li>MySQL Schema: <code>schema_mysql.sql</code></li>
    <li>JSON Export: <code>schema.json</code></li>
    <li>Metadata: <code>export_metadata.json</code></li>
  </ul>
  
  <h2>Schema Preview:</h2>
  <pre>$(head -n 20 "$SCHEMA_FILE")
  ...
  </pre>
</body>
</html>
EOF

echo -e "${GREEN}Export report created at ${EXPORT_DIR}/export_report.html${NC}" | tee -a "$LOG_FILE"
EOL < /dev/null