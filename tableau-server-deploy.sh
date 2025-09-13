#!/bin/bash

# Tableau Server Deployment & MCP Integration Script
# Sets up your own Tableau Server instance with Claude Code CLI integration via MCP

set -euo pipefail

# Configuration
TABLEAU_VERSION="${TABLEAU_VERSION:-2024.3.0}"
TABLEAU_BUILD="${TABLEAU_BUILD:-20241016.24.1017.0705}"
TSM_USER="${TSM_USER:-admin}"
TSM_PASSWORD="${TSM_PASSWORD:-}"
TABLEAU_TRIAL_KEY="${TABLEAU_TRIAL_KEY:-}"
MCP_PORT="${MCP_PORT:-8080}"
TABLEAU_PAT="${TABLEAU_PAT:-}"
SITE_ID="${SITE_ID:-Default}"
HOST_IP="${HOST_IP:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ "$(uname -s)" != "Linux" ]]; then
        error "This script requires Linux (Ubuntu 20.04+ recommended)"
    fi
    
    # Check memory (minimum 16GB)
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -lt 15 ]]; then
        warn "System has ${mem_gb}GB RAM. Minimum 16GB recommended for Tableau Server"
    fi
    
    # Check disk space (minimum 50GB)
    local disk_gb=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [[ $disk_gb -lt 50 ]]; then
        warn "Available disk space: ${disk_gb}GB. Minimum 50GB recommended"
    fi
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "Do not run this script as root. Use a regular user with sudo privileges"
    fi
    
    # Validate required environment variables
    if [[ -z "$TSM_PASSWORD" ]]; then
        error "TSM_PASSWORD environment variable is required"
    fi
    
    if [[ -z "$TABLEAU_TRIAL_KEY" ]]; then
        warn "TABLEAU_TRIAL_KEY not set. You'll need to activate manually"
    fi
    
    log "System requirements check completed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install required packages
    sudo apt install -y \
        curl \
        wget \
        unzip \
        python3 \
        python3-pip \
        docker.io \
        docker-compose \
        jq \
        postgresql-client \
        openssl
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add user to docker group
    sudo usermod -aG docker "$USER"
    
    log "System dependencies installed"
}

# Download and install Tableau Server
install_tableau_server() {
    log "Downloading and installing Tableau Server..."
    
    # Construct download URL
    local tableau_url="https://downloads.tableau.com/tssoftware/TableauServer/2024.3.0/tableau-server-${TABLEAU_VERSION}_amd64.deb"
    local deb_file="tableau-server-${TABLEAU_VERSION}_amd64.deb"
    
    # Download if not already present
    if [[ ! -f "$deb_file" ]]; then
        log "Downloading Tableau Server ${TABLEAU_VERSION}..."
        curl -L -o "$deb_file" "$tableau_url" || error "Failed to download Tableau Server"
    fi
    
    # Install the package
    log "Installing Tableau Server package..."
    sudo dpkg -i "$deb_file" || error "Failed to install Tableau Server package"
    
    # Fix any dependency issues
    sudo apt-get install -f -y
    
    log "Tableau Server installation completed"
}

# Initialize TSM
initialize_tsm() {
    log "Initializing Tableau Server Manager (TSM)..."
    
    # Initialize TSM and accept EULA
    sudo /opt/tableau/tableau_server/packages/scripts.*/*/initialize-tsm \
        --accepteula \
        --activation-service \
        --ts-user "$USER" || error "TSM initialization failed"
    
    # Source TSM environment
    source /etc/profile.d/tableau_server.sh || true
    
    log "TSM initialization completed"
}

# Configure Tableau Server
configure_tableau_server() {
    log "Configuring Tableau Server..."
    
    # Get host IP if not provided
    if [[ -z "$HOST_IP" ]]; then
        HOST_IP=$(hostname -I | awk '{print $1}')
    fi
    
    # Create registration file
    cat > registration.json << EOF
{
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@company.com",
    "company": "Company",
    "title": "Administrator",
    "department": "IT",
    "industry": "Technology",
    "phone": "555-1234",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "US"
}
EOF
    
    # Login to TSM
    tsm login -u "$TSM_USER" -p "$TSM_PASSWORD" --server "https://$HOST_IP" || {
        # If login fails, might need to setup initial config
        log "Setting up initial TSM configuration..."
        
        # Create identity store configuration
        tsm settings import -f - << 'TSMSETTINGS'
{
    "configKeys": {
        "identityStore.domain.nickname": "local",
        "identityStore.domain.username.format": "{0}",
        "gateway.admin.port": "8850",
        "gateway.admin.ssl.enabled": "true",
        "gateway.public.port": "80",
        "gateway.public.ssl.enabled": "false"
    }
}
TSMSETTINGS
        
        # Apply configuration
        tsm pending-changes apply --ignore-warnings || warn "Some configuration changes may have warnings"
        
        # Try login again
        tsm login -u "$TSM_USER" -p "$TSM_PASSWORD" --server "https://$HOST_IP"
    }
    
    # Register server
    tsm register --file registration.json || warn "Registration may have failed - continuing anyway"
    
    # Activate license if provided
    if [[ -n "$TABLEAU_TRIAL_KEY" ]]; then
        log "Activating Tableau license..."
        tsm licenses activate -k "$TABLEAU_TRIAL_KEY" || warn "License activation failed"
    fi
    
    # Apply any pending changes
    tsm pending-changes apply --ignore-warnings || warn "Some configuration changes may have warnings"
    
    log "Tableau Server configuration completed"
}

# Start Tableau Server
start_tableau_server() {
    log "Starting Tableau Server..."
    
    # Initialize and start server
    tsm initialize --start-server --request-timeout 1800 || error "Failed to start Tableau Server"
    
    # Wait for server to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if tsm status | grep -q "Status: RUNNING"; then
            log "Tableau Server is running!"
            break
        fi
        
        info "Waiting for server to start (attempt $attempt/$max_attempts)..."
        sleep 30
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Tableau Server failed to start within expected time"
    fi
}

# Create MCP Docker container
create_mcp_proxy() {
    log "Creating MCP proxy for Claude Code CLI integration..."
    
    # Create MCP Dockerfile
    cat > Dockerfile.mcp << 'EOF'
FROM python:3.11-slim

RUN pip install \
    fastapi \
    uvicorn \
    tableauserverclient \
    requests \
    pydantic \
    python-multipart

WORKDIR /app
COPY mcp_proxy.py .

EXPOSE 8080

CMD ["uvicorn", "mcp_proxy:app", "--host", "0.0.0.0", "--port", "8080"]
EOF
    
    # Create MCP proxy application
    cat > mcp_proxy.py << 'EOF'
#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import tableauserverclient as TSC
import os
import json
from typing import List, Dict, Any, Optional

app = FastAPI(title="Tableau MCP Proxy", version="1.0.0")

# Configuration
TABLEAU_SERVER = os.getenv("TABLEAU_SERVER", "https://localhost")
TABLEAU_SITE = os.getenv("TABLEAU_SITE", "Default")
TABLEAU_TOKEN_NAME = os.getenv("TABLEAU_TOKEN_NAME", "")
TABLEAU_TOKEN_VALUE = os.getenv("TABLEAU_TOKEN_VALUE", "")
TABLEAU_USERNAME = os.getenv("TABLEAU_USERNAME", "admin")
TABLEAU_PASSWORD = os.getenv("TABLEAU_PASSWORD", "")

class QueryRequest(BaseModel):
    datasource: str
    query: str
    
class PublishRequest(BaseModel):
    file_path: str
    project_name: str = "default"
    overwrite: bool = True

def get_tableau_auth():
    """Get Tableau authentication"""
    server = TSC.Server(TABLEAU_SERVER, use_server_version=True)
    
    if TABLEAU_TOKEN_NAME and TABLEAU_TOKEN_VALUE:
        auth = TSC.PersonalAccessTokenAuth(TABLEAU_TOKEN_NAME, TABLEAU_TOKEN_VALUE, TABLEAU_SITE)
    else:
        auth = TSC.TableauAuth(TABLEAU_USERNAME, TABLEAU_PASSWORD, TABLEAU_SITE)
    
    return server, auth

@app.get("/")
async def root():
    return {"message": "Tableau MCP Proxy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        server, auth = get_tableau_auth()
        server.auth.sign_in(auth)
        server.auth.sign_out()
        return {"status": "healthy", "tableau_server": TABLEAU_SERVER}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tableau connection failed: {str(e)}")

@app.get("/datasources")
async def list_datasources():
    """List all datasources"""
    try:
        server, auth = get_tableau_auth()
        server.auth.sign_in(auth)
        
        datasources, pagination = server.datasources.get()
        
        result = []
        for ds in datasources:
            result.append({
                "id": ds.id,
                "name": ds.name,
                "content_url": ds.content_url,
                "datasource_type": ds.datasource_type,
                "project_name": ds.project_name,
                "owner_id": ds.owner_id,
                "created_at": ds.created_at.isoformat() if ds.created_at else None,
                "updated_at": ds.updated_at.isoformat() if ds.updated_at else None
            })
        
        server.auth.sign_out()
        return {"datasources": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list datasources: {str(e)}")

@app.get("/workbooks")
async def list_workbooks():
    """List all workbooks"""
    try:
        server, auth = get_tableau_auth()
        server.auth.sign_in(auth)
        
        workbooks, pagination = server.workbooks.get()
        
        result = []
        for wb in workbooks:
            result.append({
                "id": wb.id,
                "name": wb.name,
                "content_url": wb.content_url,
                "show_tabs": wb.show_tabs,
                "size": wb.size,
                "project_name": wb.project_name,
                "owner_id": wb.owner_id,
                "created_at": wb.created_at.isoformat() if wb.created_at else None,
                "updated_at": wb.updated_at.isoformat() if wb.updated_at else None
            })
        
        server.auth.sign_out()
        return {"workbooks": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list workbooks: {str(e)}")

@app.post("/query-datasource")
async def query_datasource(request: QueryRequest):
    """Execute query against a datasource"""
    # Note: This is a simplified implementation
    # Full implementation would require Hyper API or custom SQL execution
    return {
        "message": "Query execution not yet implemented",
        "datasource": request.datasource,
        "query": request.query,
        "note": "Use Hyper API or direct database connection for actual query execution"
    }

@app.post("/publish-workbook")
async def publish_workbook(request: PublishRequest):
    """Publish a workbook to Tableau Server"""
    try:
        server, auth = get_tableau_auth()
        server.auth.sign_in(auth)
        
        # Find or create project
        projects, _ = server.projects.get()
        project = None
        for p in projects:
            if p.name == request.project_name:
                project = p
                break
        
        if not project:
            # Create project if it doesn't exist
            project = TSC.ProjectItem(name=request.project_name)
            project = server.projects.create(project)
        
        # Publish workbook
        workbook = TSC.WorkbookItem(project_id=project.id)
        workbook = server.workbooks.publish(workbook, request.file_path, mode=TSC.Server.PublishMode.Overwrite if request.overwrite else TSC.Server.PublishMode.CreateNew)
        
        server.auth.sign_out()
        return {
            "message": "Workbook published successfully",
            "workbook_id": workbook.id,
            "project_name": request.project_name
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish workbook: {str(e)}")

@app.get("/sites")
async def list_sites():
    """List all sites"""
    try:
        server, auth = get_tableau_auth()
        server.auth.sign_in(auth)
        
        sites, pagination = server.sites.get()
        
        result = []
        for site in sites:
            result.append({
                "id": site.id,
                "name": site.name,
                "content_url": site.content_url,
                "admin_mode": site.admin_mode,
                "state": site.state
            })
        
        server.auth.sign_out()
        return {"sites": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sites: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
EOF
    
    # Build MCP Docker image
    docker build -f Dockerfile.mcp -t tableau-mcp:latest . || error "Failed to build MCP Docker image"
    
    log "MCP proxy Docker image created"
}

# Deploy MCP proxy
deploy_mcp_proxy() {
    log "Deploying MCP proxy..."
    
    # Stop existing container if running
    docker stop tableau-mcp 2>/dev/null || true
    docker rm tableau-mcp 2>/dev/null || true
    
    # Run MCP proxy container
    docker run -d \
        --name tableau-mcp \
        -p "$MCP_PORT":8080 \
        --restart unless-stopped \
        -e TABLEAU_SERVER="https://$HOST_IP" \
        -e TABLEAU_SITE="$SITE_ID" \
        -e TABLEAU_TOKEN_NAME="${TABLEAU_PAT:+mcp}" \
        -e TABLEAU_TOKEN_VALUE="$TABLEAU_PAT" \
        -e TABLEAU_USERNAME="$TSM_USER" \
        -e TABLEAU_PASSWORD="$TSM_PASSWORD" \
        tableau-mcp:latest || error "Failed to start MCP proxy container"
    
    # Wait for MCP proxy to be ready
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "http://localhost:$MCP_PORT/health" >/dev/null 2>&1; then
            log "MCP proxy is running!"
            break
        fi
        
        info "Waiting for MCP proxy to start (attempt $attempt/$max_attempts)..."
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        warn "MCP proxy may not be fully ready, but continuing..."
    fi
}

# Create Claude Code CLI integration scripts
create_claude_cli_scripts() {
    log "Creating Claude Code CLI integration scripts..."
    
    mkdir -p claude_cli_scripts
    
    # Create MCP command wrapper
    cat > claude_cli_scripts/mcp_tableau.sh << EOF
#!/bin/bash

# Claude Code CLI MCP Tableau Commands
# Usage examples for interacting with your Tableau Server via MCP

MCP_SERVER="http://localhost:$MCP_PORT"

# List all datasources
mcp_list_datasources() {
    curl -s "\$MCP_SERVER/datasources" | jq '.'
}

# List all workbooks  
mcp_list_workbooks() {
    curl -s "\$MCP_SERVER/workbooks" | jq '.'
}

# List all sites
mcp_list_sites() {
    curl -s "\$MCP_SERVER/sites" | jq '.'
}

# Health check
mcp_health() {
    curl -s "\$MCP_SERVER/health" | jq '.'
}

# Publish workbook
mcp_publish_workbook() {
    local file_path="\$1"
    local project_name="\${2:-default}"
    
    if [[ -z "\$file_path" ]]; then
        echo "Usage: mcp_publish_workbook <file_path> [project_name]"
        return 1
    fi
    
    curl -s -X POST "\$MCP_SERVER/publish-workbook" \\
        -H "Content-Type: application/json" \\
        -d "{\"file_path\": \"\$file_path\", \"project_name\": \"\$project_name\"}" | jq '.'
}

# Query datasource (placeholder)
mcp_query_datasource() {
    local datasource="\$1"
    local query="\$2"
    
    if [[ -z "\$datasource" || -z "\$query" ]]; then
        echo "Usage: mcp_query_datasource <datasource_name> <sql_query>"
        return 1
    fi
    
    curl -s -X POST "\$MCP_SERVER/query-datasource" \\
        -H "Content-Type: application/json" \\
        -d "{\"datasource\": \"\$datasource\", \"query\": \"\$query\"}" | jq '.'
}

# Show usage
case "\${1:-}" in
    "list-datasources"|"ds")
        mcp_list_datasources
        ;;
    "list-workbooks"|"wb")
        mcp_list_workbooks
        ;;
    "list-sites"|"sites")
        mcp_list_sites
        ;;
    "health"|"status")
        mcp_health
        ;;
    "publish")
        shift
        mcp_publish_workbook "\$@"
        ;;
    "query")
        shift
        mcp_query_datasource "\$@"
        ;;
    *)
        echo "Usage: \$0 {list-datasources|list-workbooks|list-sites|health|publish|query}"
        echo ""
        echo "Examples:"
        echo "  \$0 list-datasources     # List all datasources"
        echo "  \$0 list-workbooks       # List all workbooks"
        echo "  \$0 health               # Check MCP proxy health"
        echo "  \$0 publish workbook.twbx project_name"
        echo "  \$0 query datasource_name 'SELECT * FROM table LIMIT 5'"
        ;;
esac
EOF
    
    chmod +x claude_cli_scripts/mcp_tableau.sh
    
    # Create environment setup script
    cat > claude_cli_scripts/setup_env.sh << EOF
#!/bin/bash

# Tableau + MCP Environment Setup
export TABLEAU_SERVER_URL="https://$HOST_IP"
export TABLEAU_MCP_URL="http://localhost:$MCP_PORT"
export TSM_USER="$TSM_USER"

# Add MCP commands to PATH
export PATH="\$PATH:\$(pwd)/claude_cli_scripts"

echo "Tableau Server Environment Setup Complete!"
echo "Server URL: \$TABLEAU_SERVER_URL"
echo "MCP Proxy URL: \$TABLEAU_MCP_URL"
echo ""
echo "Available commands:"
echo "  mcp_tableau.sh list-datasources"
echo "  mcp_tableau.sh list-workbooks"
echo "  mcp_tableau.sh health"
echo ""
echo "Test with: ./claude_cli_scripts/mcp_tableau.sh health"
EOF
    
    chmod +x claude_cli_scripts/setup_env.sh
    
    log "Claude Code CLI integration scripts created"
}

# Generate deployment summary
generate_deployment_summary() {
    log "Generating deployment summary..."
    
    cat > DEPLOYMENT_SUMMARY.md << EOF
# Tableau Server + MCP Deployment Summary

**Deployment Date:** $(date)
**Host IP:** $HOST_IP
**Tableau Version:** $TABLEAU_VERSION

## Access Information

### Tableau Server
- **URL:** https://$HOST_IP
- **Admin User:** $TSM_USER
- **TSM URL:** https://$HOST_IP:8850

### MCP Proxy
- **URL:** http://localhost:$MCP_PORT
- **Health Check:** http://localhost:$MCP_PORT/health
- **API Documentation:** http://localhost:$MCP_PORT/docs

## Claude Code CLI Integration

### Quick Start
\`\`\`bash
# Source environment
source claude_cli_scripts/setup_env.sh

# Test MCP connection
./claude_cli_scripts/mcp_tableau.sh health

# List datasources
./claude_cli_scripts/mcp_tableau.sh list-datasources

# List workbooks
./claude_cli_scripts/mcp_tableau.sh list-workbooks
\`\`\`

### Available MCP Commands
- \`mcp_tableau.sh list-datasources\` - List all datasources
- \`mcp_tableau.sh list-workbooks\` - List all workbooks
- \`mcp_tableau.sh list-sites\` - List all sites
- \`mcp_tableau.sh health\` - Check proxy health
- \`mcp_tableau.sh publish <file> [project]\` - Publish workbook
- \`mcp_tableau.sh query <ds> <sql>\` - Query datasource

## Next Steps

1. **Access Tableau Server** at https://$HOST_IP
2. **Create initial admin user** if needed
3. **Upload extracted Desktop assets** using the MCP API
4. **Configure Personal Access Token** for enhanced security
5. **Test Claude Code CLI integration** with MCP commands

## Troubleshooting

### Tableau Server Issues
\`\`\`bash
# Check server status
tsm status

# Check logs
tail -f /var/opt/tableau/tableau_server/data/tabsvc/logs/tabadminservice/tabadminservice_*.log
\`\`\`

### MCP Proxy Issues
\`\`\`bash
# Check container status
docker ps | grep tableau-mcp

# Check container logs
docker logs tableau-mcp

# Restart MCP proxy
docker restart tableau-mcp
\`\`\`

## Security Notes

- Change default passwords immediately
- Configure SSL certificates for production use
- Restrict network access to trusted IPs
- Enable audit logging
- Regular backup procedures

## Docker Containers

- \`tableau-mcp\` - MCP proxy for Claude Code CLI integration

## File Locations

- Tableau Server: \`/opt/tableau/tableau_server\`
- TSM Logs: \`/var/opt/tableau/tableau_server/data/tabsvc/logs\`
- MCP Scripts: \`./claude_cli_scripts/\`

Your Tableau Server with Claude Code CLI integration is now ready!
EOF
    
    log "Deployment summary generated: DEPLOYMENT_SUMMARY.md"
}

# Main execution
main() {
    log "Starting Tableau Server deployment with MCP integration..."
    
    check_requirements
    install_dependencies
    install_tableau_server
    initialize_tsm
    configure_tableau_server
    start_tableau_server
    create_mcp_proxy
    deploy_mcp_proxy
    create_claude_cli_scripts
    generate_deployment_summary
    
    log "Tableau Server deployment completed successfully!"
    log "Access your server at: https://$HOST_IP"
    log "MCP proxy available at: http://localhost:$MCP_PORT"
    log "Review deployment summary: DEPLOYMENT_SUMMARY.md"
    
    info "Test MCP integration with: ./claude_cli_scripts/mcp_tableau.sh health"
}

# Run main function
main "$@"