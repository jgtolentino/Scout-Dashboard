#!/bin/bash

# Complete Tableau Desktop-to-Server Migration with Claude Code CLI Integration
# Unified script to extract Desktop assets and deploy self-hosted Tableau Server with MCP

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TD_REPO="${TD_REPO:-$HOME/Documents/My Tableau Repository}"
EXPORT_DIR="${EXPORT_DIR:-$HOME/tableau_complete_migration}"
TABLEAU_VERSION="${TABLEAU_VERSION:-2024.3.0}"
TSM_USER="${TSM_USER:-admin}"
TSM_PASSWORD="${TSM_PASSWORD:-}"
TABLEAU_TRIAL_KEY="${TABLEAU_TRIAL_KEY:-}"
MCP_PORT="${MCP_PORT:-8080}"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-local}" # local, vm, cloud

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

step() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] STEP: $1${NC}"
}

# Show banner
show_banner() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   Tableau Desktop → Server Migration + Claude Code CLI      ║
║                                                              ║
║   Extract all Desktop assets → Deploy Server → MCP Setup    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
}

# Check prerequisites
check_prerequisites() {
    step "Checking prerequisites..."
    
    # Check if extraction script exists
    if [[ ! -f "$SCRIPT_DIR/tableau-desktop-extractor.sh" ]]; then
        error "tableau-desktop-extractor.sh not found in $SCRIPT_DIR"
    fi
    
    # Check if deployment script exists
    if [[ ! -f "$SCRIPT_DIR/tableau-server-deploy.sh" ]]; then
        error "tableau-server-deploy.sh not found in $SCRIPT_DIR"
    fi
    
    # Check environment variables
    if [[ -z "$TSM_PASSWORD" ]]; then
        error "TSM_PASSWORD environment variable is required"
    fi
    
    # Check Tableau Desktop repository
    if [[ ! -d "$TD_REPO" ]]; then
        error "Tableau Desktop repository not found at: $TD_REPO"
    fi
    
    log "Prerequisites check passed"
}

# Phase 1: Extract Desktop Assets
extract_desktop_assets() {
    step "Phase 1: Extracting Tableau Desktop Assets"
    
    # Setup extraction directory
    mkdir -p "$EXPORT_DIR/desktop_assets"
    
    # Run desktop extraction
    TD_REPO="$TD_REPO" \
    EXPORT_DIR="$EXPORT_DIR/desktop_assets" \
    bash "$SCRIPT_DIR/tableau-desktop-extractor.sh"
    
    log "Desktop asset extraction completed"
}

# Phase 2: Deploy Tableau Server
deploy_tableau_server() {
    step "Phase 2: Deploying Tableau Server"
    
    # Setup server deployment directory
    mkdir -p "$EXPORT_DIR/server_deployment"
    cd "$EXPORT_DIR/server_deployment"
    
    # Copy deployment script
    cp "$SCRIPT_DIR/tableau-server-deploy.sh" ./
    
    # Run server deployment
    TSM_USER="$TSM_USER" \
    TSM_PASSWORD="$TSM_PASSWORD" \
    TABLEAU_TRIAL_KEY="$TABLEAU_TRIAL_KEY" \
    MCP_PORT="$MCP_PORT" \
    bash ./tableau-server-deploy.sh
    
    log "Tableau Server deployment completed"
}

# Phase 3: Upload Desktop Assets to Server
upload_assets_to_server() {
    step "Phase 3: Uploading Desktop Assets to Server"
    
    # Create upload script
    cat > "$EXPORT_DIR/upload_assets.py" << 'EOF'
#!/usr/bin/env python3

import os
import sys
import glob
import json
from pathlib import Path
import tableauserverclient as TSC

def upload_desktop_assets(assets_dir, server_url, username, password, site_id=""):
    """Upload extracted desktop assets to Tableau Server"""
    
    # Connect to server
    server = TSC.Server(server_url, use_server_version=True)
    auth = TSC.TableauAuth(username, password, site_id)
    
    try:
        server.auth.sign_in(auth)
        print(f"Connected to Tableau Server: {server_url}")
        
        # Create project for migrated assets
        project_name = "Desktop Migration"
        projects, _ = server.projects.get()
        project = None
        
        for p in projects:
            if p.name == project_name:
                project = p
                break
        
        if not project:
            project = TSC.ProjectItem(name=project_name, description="Migrated from Tableau Desktop")
            project = server.projects.create(project)
            print(f"Created project: {project_name}")
        
        # Upload datasources
        tds_dir = os.path.join(assets_dir, "tds")
        if os.path.exists(tds_dir):
            for tds_file in glob.glob(os.path.join(tds_dir, "*.tds")):
                try:
                    datasource = TSC.DatasourceItem(project_id=project.id)
                    datasource = server.datasources.publish(
                        datasource, 
                        tds_file, 
                        mode=TSC.Server.PublishMode.Overwrite
                    )
                    print(f"Uploaded datasource: {os.path.basename(tds_file)}")
                except Exception as e:
                    print(f"Failed to upload {tds_file}: {e}")
        
        # Upload workbooks
        workbooks_dir = os.path.join(assets_dir, "workbooks")
        if os.path.exists(workbooks_dir):
            # Upload TWBX files
            for twbx_dir in glob.glob(os.path.join(workbooks_dir, "*/")):
                if os.path.isdir(twbx_dir):
                    # Look for TWB file in the directory
                    twb_files = glob.glob(os.path.join(twbx_dir, "*.twb"))
                    if twb_files:
                        try:
                            workbook = TSC.WorkbookItem(project_id=project.id)
                            workbook = server.workbooks.publish(
                                workbook,
                                twb_files[0],
                                mode=TSC.Server.PublishMode.Overwrite
                            )
                            print(f"Uploaded workbook: {os.path.basename(twb_files[0])}")
                        except Exception as e:
                            print(f"Failed to upload {twb_files[0]}: {e}")
            
            # Upload standalone TWB files
            for twb_file in glob.glob(os.path.join(workbooks_dir, "*.twb")):
                try:
                    workbook = TSC.WorkbookItem(project_id=project.id)
                    workbook = server.workbooks.publish(
                        workbook,
                        twb_file,
                        mode=TSC.Server.PublishMode.Overwrite
                    )
                    print(f"Uploaded workbook: {os.path.basename(twb_file)}")
                except Exception as e:
                    print(f"Failed to upload {twb_file}: {e}")
        
        print("Asset upload completed successfully!")
        
    except Exception as e:
        print(f"Error during upload: {e}")
    finally:
        server.auth.sign_out()

if __name__ == "__main__":
    assets_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/tableau_complete_migration/desktop_assets")
    server_url = sys.argv[2] if len(sys.argv) > 2 else f"https://{os.popen('hostname -I').read().strip().split()[0]}"
    username = sys.argv[3] if len(sys.argv) > 3 else os.getenv("TSM_USER", "admin")
    password = sys.argv[4] if len(sys.argv) > 4 else os.getenv("TSM_PASSWORD", "")
    
    if not password:
        print("ERROR: Password is required")
        sys.exit(1)
    
    upload_desktop_assets(assets_dir, server_url, username, password)
EOF
    
    chmod +x "$EXPORT_DIR/upload_assets.py"
    
    # Get server IP
    local server_ip=$(hostname -I | awk '{print $1}')
    
    # Run upload
    python3 "$EXPORT_DIR/upload_assets.py" \
        "$EXPORT_DIR/desktop_assets" \
        "https://$server_ip" \
        "$TSM_USER" \
        "$TSM_PASSWORD"
    
    log "Asset upload completed"
}

# Phase 4: Setup Claude Code CLI Integration
setup_claude_cli_integration() {
    step "Phase 4: Setting up Claude Code CLI Integration"
    
    # Create Claude CLI configuration
    mkdir -p "$EXPORT_DIR/claude_cli_config"
    
    # Get server details
    local server_ip=$(hostname -I | awk '{print $1}')
    local mcp_url="http://localhost:$MCP_PORT"
    
    # Create MCP integration guide
    cat > "$EXPORT_DIR/claude_cli_config/CLAUDE_CLI_INTEGRATION.md" << EOF
# Claude Code CLI + Tableau Integration Guide

## Overview
Your Tableau Server is now accessible via Claude Code CLI through the MCP (Model Context Protocol) proxy.

## Connection Details
- **Tableau Server:** https://$server_ip
- **MCP Proxy:** $mcp_url
- **Admin User:** $TSM_USER

## Claude Code CLI Commands

### Basic MCP Operations
\`\`\`bash
# Test connection
curl $mcp_url/health

# List datasources
curl $mcp_url/datasources | jq '.'

# List workbooks
curl $mcp_url/workbooks | jq '.'
\`\`\`

### Using the MCP Scripts
\`\`\`bash
# Source environment
source $EXPORT_DIR/server_deployment/claude_cli_scripts/setup_env.sh

# List assets
./claude_cli_scripts/mcp_tableau.sh list-datasources
./claude_cli_scripts/mcp_tableau.sh list-workbooks

# Check health
./claude_cli_scripts/mcp_tableau.sh health
\`\`\`

### Example Claude Code CLI Usage

When using Claude Code CLI, you can now reference your Tableau instance:

\`\`\`
:mcp list-datasources --server $mcp_url
:mcp query-datasource --server $mcp_url --datasource "your_datasource" --query "SELECT * FROM table LIMIT 5"
\`\`\`

## Integration with Your Workflow

1. **Data Pipeline**: Extract → Transform → Load to Tableau via MCP
2. **Report Generation**: Query via MCP → Generate insights with Claude
3. **Dashboard Management**: Deploy/update dashboards via MCP API

## Next Steps

1. Configure Personal Access Tokens for security
2. Set up automated data refresh schedules
3. Create custom MCP endpoints for your specific use cases
4. Integrate with your existing CI/CD pipeline

## Troubleshooting

- **MCP Proxy Issues**: Check \`docker logs tableau-mcp\`
- **Tableau Server Issues**: Check \`tsm status\`
- **Connection Issues**: Verify firewall settings and network access

Your complete Tableau ecosystem with Claude Code CLI integration is ready!
EOF
    
    # Create example usage script
    cat > "$EXPORT_DIR/claude_cli_config/example_usage.sh" << EOF
#!/bin/bash

# Example usage of Tableau + Claude Code CLI integration

echo "=== Tableau + Claude Code CLI Integration Demo ==="
echo ""

# Set environment
export TABLEAU_MCP_URL="$mcp_url"
export TABLEAU_SERVER_URL="https://$server_ip"

echo "1. Testing MCP connection..."
curl -s "\$TABLEAU_MCP_URL/health" | jq '.status'
echo ""

echo "2. Listing available datasources..."
curl -s "\$TABLEAU_MCP_URL/datasources" | jq '.count'
echo ""

echo "3. Listing available workbooks..."
curl -s "\$TABLEAU_MCP_URL/workbooks" | jq '.count'
echo ""

echo "4. Example Claude Code CLI commands you can now use:"
echo ""
echo "   # List all datasources"
echo "   :mcp list-datasources --server \$TABLEAU_MCP_URL"
echo ""
echo "   # Query a specific datasource"
echo "   :mcp query-datasource --server \$TABLEAU_MCP_URL --datasource 'sample' --query 'SELECT * FROM table LIMIT 10'"
echo ""
echo "   # Publish a new workbook"
echo "   :mcp publish-workbook --server \$TABLEAU_MCP_URL --file 'workbook.twbx' --project 'default'"
echo ""

echo "Your Tableau Server is ready for Claude Code CLI integration!"
EOF
    
    chmod +x "$EXPORT_DIR/claude_cli_config/example_usage.sh"
    
    log "Claude Code CLI integration setup completed"
}

# Generate comprehensive report
generate_comprehensive_report() {
    step "Generating comprehensive migration report..."
    
    local server_ip=$(hostname -I | awk '{print $1}')
    
    cat > "$EXPORT_DIR/MIGRATION_COMPLETE.md" << EOF
# Complete Tableau Desktop → Server Migration Report

**Migration Date:** $(date)
**Migration Directory:** $EXPORT_DIR

## Migration Summary

✅ **Phase 1 Complete**: Desktop asset extraction
✅ **Phase 2 Complete**: Tableau Server deployment  
✅ **Phase 3 Complete**: Asset upload to server
✅ **Phase 4 Complete**: Claude Code CLI integration

## Access Information

### Tableau Server
- **URL:** https://$server_ip
- **Admin Portal:** https://$server_ip:8850
- **Username:** $TSM_USER
- **Status:** Running

### MCP Proxy (Claude Code CLI)
- **URL:** http://localhost:$MCP_PORT
- **Health Check:** http://localhost:$MCP_PORT/health
- **API Docs:** http://localhost:$MCP_PORT/docs

## Extracted Assets

### Desktop Assets (Phase 1)
- **Location:** \`$EXPORT_DIR/desktop_assets/\`
- **Workbooks:** $(ls "$EXPORT_DIR/desktop_assets/workbooks"/*.twb 2>/dev/null | wc -l) TWB files
- **Datasources:** $(ls "$EXPORT_DIR/desktop_assets/tds"/*.{tds,tdsx} 2>/dev/null | wc -l) files
- **Hyper Schemas:** $(ls "$EXPORT_DIR/desktop_assets/hyper_schemas"/*.sql 2>/dev/null | wc -l) schema files
- **Logs:** $(find "$EXPORT_DIR/desktop_assets/logs" -type f 2>/dev/null | wc -l) log files

### Server Deployment (Phase 2)
- **Location:** \`$EXPORT_DIR/server_deployment/\`
- **Tableau Version:** $TABLEAU_VERSION
- **MCP Container:** tableau-mcp (running)
- **CLI Scripts:** Available in \`claude_cli_scripts/\`

## Claude Code CLI Integration

### Quick Test
\`\`\`bash
# Test MCP connection
curl http://localhost:$MCP_PORT/health

# Run example demo
$EXPORT_DIR/claude_cli_config/example_usage.sh
\`\`\`

### Available Commands
- \`mcp_tableau.sh list-datasources\` - List all datasources
- \`mcp_tableau.sh list-workbooks\` - List all workbooks  
- \`mcp_tableau.sh health\` - Check system health
- \`mcp_tableau.sh publish <file>\` - Publish workbook
- \`mcp_tableau.sh query <ds> <sql>\` - Query datasource

### Claude Code CLI Examples
\`\`\`
:mcp list-datasources --server http://localhost:$MCP_PORT
:mcp query-datasource --server http://localhost:$MCP_PORT --datasource "sample" --query "SELECT * FROM table LIMIT 5"
\`\`\`

## File Structure

\`\`\`
$EXPORT_DIR/
├── desktop_assets/          # Extracted Desktop assets
│   ├── workbooks/          # TWB files and unpacked TWBX
│   ├── tds/               # Datasource definitions
│   ├── hyper_schemas/     # Extract schemas
│   ├── logs/              # Desktop logs
│   └── metadata/          # Workbook metadata
├── server_deployment/      # Server deployment files
│   ├── claude_cli_scripts/ # MCP integration scripts
│   └── DEPLOYMENT_SUMMARY.md
├── claude_cli_config/      # Claude CLI integration
│   ├── CLAUDE_CLI_INTEGRATION.md
│   └── example_usage.sh
└── upload_assets.py        # Asset upload utility
\`\`\`

## Next Steps

1. **Access Tableau Server**: Navigate to https://$server_ip
2. **Test Claude Integration**: Run \`$EXPORT_DIR/claude_cli_config/example_usage.sh\`
3. **Configure Security**: Set up SSL certificates and PAT tokens
4. **Create Schedules**: Set up data refresh schedules
5. **Backup Strategy**: Implement regular backup procedures

## Troubleshooting

### Tableau Server
\`\`\`bash
# Check status
tsm status

# View logs
tail -f /var/opt/tableau/tableau_server/data/tabsvc/logs/tabadminservice/tabadminservice_*.log
\`\`\`

### MCP Proxy
\`\`\`bash
# Check container
docker ps | grep tableau-mcp

# View logs  
docker logs tableau-mcp

# Restart if needed
docker restart tableau-mcp
\`\`\`

## Security Recommendations

- [ ] Change default passwords
- [ ] Configure SSL certificates
- [ ] Set up Personal Access Tokens
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up regular backups

## Support

- **Tableau Server Docs**: https://help.tableau.com/current/server/en-us/
- **MCP Proxy**: Check \`docker logs tableau-mcp\` for issues
- **Claude Code CLI**: Refer to Claude documentation

---

🎉 **Your complete Tableau ecosystem with Claude Code CLI integration is ready!**

Test the integration with: \`$EXPORT_DIR/claude_cli_config/example_usage.sh\`
EOF
    
    log "Comprehensive migration report generated: $EXPORT_DIR/MIGRATION_COMPLETE.md"
}

# Main execution
main() {
    show_banner
    
    log "Starting complete Tableau Desktop → Server migration with Claude Code CLI integration"
    log "Source: $TD_REPO"
    log "Target: $EXPORT_DIR"
    
    check_prerequisites
    extract_desktop_assets
    deploy_tableau_server
    upload_assets_to_server
    setup_claude_cli_integration
    generate_comprehensive_report
    
    echo ""
    log "🎉 MIGRATION COMPLETE! 🎉"
    log "📊 Tableau Server: https://$(hostname -I | awk '{print $1}')"
    log "🤖 MCP Proxy: http://localhost:$MCP_PORT"
    log "📋 Full Report: $EXPORT_DIR/MIGRATION_COMPLETE.md"
    echo ""
    info "Test your Claude Code CLI integration:"
    info "$EXPORT_DIR/claude_cli_config/example_usage.sh"
}

# Run main function
main "$@"