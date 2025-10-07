# TableauAgent for Pulser

A comprehensive Pulser executor agent for headless Tableau dashboard creation and publishing via REST API. No Playwright required - pure REST API operations.

## 🎯 **Copy-Paste Ready Commands**

### **Quick Setup**
```bash
# 1. Install dependencies
pip install tableau-api-lib tableauserverclient tableauhyperapi pandas python-dotenv

# 2. Configure environment
cp .env.tableau.example .env.tableau
# Edit .env.tableau with your Tableau Server details

# 3. Register with Pulser
:pulser agent add tableau-agent.yaml

# 4. Test connection
:tableau-validate-connection
```

### **Basic Dashboard Creation**
```bash
# Create single dashboard
:tableau-create-dashboard \
  --project "Sales Analytics" \
  --datasource "./data/sales.hyper" \
  --workbook "./dashboards/sales_dashboard.twbx"

# Create workbook only
:tableau-create-dashboard \
  --project "Marketing" \
  --workbook "./dashboards/marketing.twbx" \
  --description "Marketing performance dashboard"

# Create with custom settings
:tableau-create-dashboard \
  --project "Executive" \
  --workbook "./dashboards/executive.twbx" \
  --tags "executive" "kpi" "summary" \
  --description "Executive summary dashboard"
```

### **Batch Dashboard Creation**
```bash
# Create multiple dashboards from config
:tableau-batch-create \
  --config-file "batch_config.json" \
  --parallel-jobs 5

# Dry run to preview
:tableau-batch-create \
  --config-file "batch_config.json" \
  --dry-run

# Create example config
python scripts/batch_create.py --create-example-config
```

### **Desktop Migration**
```bash
# Migrate extracted Desktop assets
:tableau-migrate-desktop \
  --desktop-export-dir "~/tableau_desktop_reverse" \
  --target-project "Desktop Migration" \
  --create-projects

# Filtered migration
:tableau-migrate-desktop \
  --desktop-export-dir "~/tableau_desktop_reverse" \
  --filter-pattern "sales" \
  --parallel-jobs 3
```

## 📁 **Project Structure**

```
tableau-agent/
├── tableau-agent.yaml          # Pulser agent configuration
├── .env.tableau                # Environment configuration
├── .env.tableau.example        # Example environment file
├── scripts/
│   ├── create_dashboard.py     # Main dashboard creation script
│   ├── migrate_desktop.py      # Desktop migration integration
│   ├── batch_create.py         # Batch processing script
│   └── validate_environment.py # Environment validation
└── README.md                   # This file
```

## 🔧 **Configuration**

### **Environment Setup (.env.tableau)**
```bash
# Tableau Server Connection
TBL_SERVER=https://your-tableau-server.com
TBL_SITE_ID=                    # Empty for Default site
TBL_API_VERSION=3.19

# Authentication - Personal Access Token (Recommended)
TBL_TOKEN_NAME=pulser_token
TBL_TOKEN=your_personal_access_token_here

# Default Settings
DEFAULT_PROJECT=Default
OVERWRITE_EXISTING=true
SHOW_WORKBOOK_TABS=true
```

### **Batch Configuration Example**
```json
{
  "dashboards": [
    {
      "name": "Sales Dashboard",
      "project": "Sales Analytics",
      "workbook_path": "workbooks/sales_dashboard.twbx",
      "datasource_path": "datasources/sales_data.hyper",
      "description": "Comprehensive sales analytics",
      "tags": ["sales", "analytics", "revenue"],
      "enabled": true
    },
    {
      "name": "Executive Summary",
      "project": "Executive",
      "workbook_path": "workbooks/executive_summary.twbx",
      "description": "High-level KPI dashboard",
      "tags": ["executive", "kpi"],
      "dependencies": ["Sales Dashboard"],
      "enabled": true
    }
  ]
}
```

## 🚀 **Available Commands**

### **Core Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `tableau-create-dashboard` | Create single dashboard | `--project "Sales" --workbook "sales.twbx"` |
| `tableau-batch-create` | Batch create from config | `--config-file "dashboards.json"` |
| `tableau-migrate-desktop` | Migrate Desktop assets | `--desktop-export-dir "~/desktop_assets"` |

### **Management Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `tableau-list-projects` | List all projects | Simple list of projects |
| `tableau-list-workbooks` | List workbooks | `--project "Sales"` |
| `tableau-publish-datasource` | Publish datasource only | `--project "Data" --datasource "data.hyper"` |
| `tableau-extract-workbook` | Download workbook | `--workbook-name "Sales" --output-path "./downloads"` |

### **Validation Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `tableau-validate-connection` | Test server connection | Connection health check |
| `tableau-health-check` | Full agent health check | Comprehensive validation |

## 📊 **Integration Examples**

### **With Existing Tableau Extraction System**
```bash
# 1. Extract Desktop assets (using previous extraction scripts)
./tableau-desktop-extractor.sh

# 2. Migrate to server via TableauAgent
:tableau-migrate-desktop \
  --desktop-export-dir "./tableau_desktop_reverse" \
  --target-project "Migrated Desktop Assets" \
  --create-projects \
  --parallel-jobs 3
```

### **With MCP Proxy Integration**
```bash
# Use TableauAgent with existing MCP setup
export ENABLE_MCP_INTEGRATION=true
export MCP_PROXY_URL=http://localhost:8080

:tableau-create-dashboard \
  --project "MCP Integration" \
  --workbook "./dashboards/mcp_dashboard.twbx"
```

### **CI/CD Pipeline Integration**
```bash
# In your CI/CD pipeline
:tableau-validate-connection
:tableau-batch-create --config-file "production_dashboards.json" --resume-on-error
```

## 🔍 **Advanced Features**

### **Dependency Management**
TableauAgent supports dashboard dependencies in batch operations:
```json
{
  "name": "Executive Dashboard",
  "dependencies": ["Sales Dashboard", "Marketing Dashboard"],
  "enabled": true
}
```

### **Parallel Processing**
All operations support parallel execution:
- Dashboard creation: `--parallel-jobs 5`
- Desktop migration: `--parallel-jobs 3`
- Batch operations: Automatic dependency resolution

### **Error Recovery**
Robust error handling with recovery options:
- `--resume-on-error`: Continue on failures
- Automatic retry with exponential backoff
- Detailed error reporting and logging

### **Monitoring & Metrics**
Built-in monitoring capabilities:
- Health check endpoints
- Prometheus metrics
- Comprehensive logging
- Performance tracking

## 🛠 **Development & Testing**

### **Environment Validation**
```bash
# Validate complete setup
python scripts/validate_environment.py

# Check specific components
:tableau-validate-connection
:tableau-health-check
```

### **Testing Commands**
```bash
# Test with dry run
:tableau-batch-create --config-file "test_config.json" --dry-run

# Validate before migration
:tableau-migrate-desktop --desktop-export-dir "./test_assets" --dry-run
```

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
export ENABLE_API_LOGGING=true

:tableau-create-dashboard --project "Debug Test" --workbook "test.twbx"
```

## 📈 **Performance Optimization**

### **Batch Processing**
- Process up to 10 dashboards in parallel
- Automatic dependency resolution
- Intelligent batching based on dependencies

### **File Upload Optimization**
- Streaming uploads for large files
- Compression support
- Resume capability for interrupted uploads

### **Connection Pooling**
- Persistent connections to Tableau Server
- Connection reuse across operations
- Automatic connection recovery

## 🔒 **Security & Best Practices**

### **Authentication**
- Personal Access Tokens (recommended)
- Username/password fallback
- Secure credential storage

### **Network Security**
- SSL certificate validation
- Configurable timeouts
- Network access restrictions

### **Data Protection**
- No credentials in logs
- Secure temporary file handling
- Automatic cleanup

## 🐛 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Authentication fails | Check PAT token and permissions |
| Upload timeout | Increase `UPLOAD_TIMEOUT` setting |
| Memory issues | Reduce `MAX_CONCURRENT_UPLOADS` |
| Network errors | Check firewall and proxy settings |

### **Debug Commands**
```bash
# Check environment
python scripts/validate_environment.py

# Test connection
:tableau-validate-connection

# View logs
tail -f /workspace/tableau-agent/logs/tableau-agent.log
```

### **Support Information**
- **Logs**: `/workspace/tableau-agent/logs/`
- **Configuration**: `.env.tableau`
- **Validation**: `scripts/validate_environment.py`
- **Health Check**: `:tableau-health-check`

## 🔄 **Complete Workflow Example**

```bash
# 1. Setup environment
cp .env.tableau.example .env.tableau
# Edit .env.tableau with your settings

# 2. Validate setup
python scripts/validate_environment.py

# 3. Register agent
:pulser agent add tableau-agent.yaml

# 4. Test connection
:tableau-validate-connection

# 5. Create example batch config
python scripts/batch_create.py --create-example-config

# 6. Execute batch creation
:tableau-batch-create --config-file batch_config_example.json

# 7. Migrate Desktop assets (if available)
:tableau-migrate-desktop --desktop-export-dir "~/tableau_desktop_reverse" --target-project "Desktop Migration"

# 8. Validate results
:tableau-list-projects
:tableau-list-workbooks --project "Desktop Migration"
```

Your headless Tableau dashboard creation system is ready! 🎉

## 📚 **Additional Resources**

- **Tableau REST API**: https://help.tableau.com/current/api/rest_api/en-us/
- **tableau-api-lib**: https://github.com/divinorum-webb/tableau-api-lib
- **Pulser Documentation**: [Your Pulser docs link]
- **Tableau Server Admin**: https://help.tableau.com/current/server/en-us/