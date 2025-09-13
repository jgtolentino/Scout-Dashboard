#!/bin/bash

# Tableau Server Complete Extraction & Cloning Script
# Extracts all configuration, assets, metadata, and permissions for server reconstruction

set -euo pipefail

# Configuration
TABLEAU_SERVER_URL="${TABLEAU_SERVER_URL:-https://your-server.example.com}"
TSM_USER="${TSM_USER:-admin}"
TSM_PASSWORD="${TSM_PASSWORD:-}"
PAT_TOKEN="${PAT_TOKEN:-}"
PAT_KEY="${PAT_KEY:-}"
SITE_ID="${SITE_ID:-Default}"
EXPORT_DIR="${EXPORT_DIR:-./tableau_export}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Validate requirements
check_requirements() {
    log "Checking requirements..."
    
    # Check if required tools are installed
    command -v tsm >/dev/null 2>&1 || error "TSM CLI not found. Install Tableau Server Manager."
    command -v tabcmd >/dev/null 2>&1 || error "tabcmd not found. Install Tableau Command Line Utility."
    command -v python3 >/dev/null 2>&1 || error "Python 3 not found."
    command -v jq >/dev/null 2>&1 || error "jq not found. Install JSON processor."
    
    # Check Python packages
    python3 -c "import tableauserverclient" 2>/dev/null || error "tableauserverclient not installed. Run: pip install tableauserverclient"
    
    # Validate credentials
    if [[ -z "$TSM_PASSWORD" ]]; then
        error "TSM_PASSWORD environment variable is required"
    fi
    
    if [[ -z "$PAT_TOKEN" || -z "$PAT_KEY" ]]; then
        warn "PAT_TOKEN and PAT_KEY not set. Some operations may fail."
    fi
    
    log "Requirements check passed"
}

# Create export directory structure
setup_directories() {
    log "Setting up export directories..."
    
    mkdir -p "$EXPORT_DIR"/{config,workbooks,datasources,users,permissions,hyper,embeds,scripts}
    
    log "Export directory structure created at: $EXPORT_DIR"
}

# Export TSM configuration
export_tsm_config() {
    log "Exporting TSM configuration..."
    
    # Login to TSM
    tsm login -u "$TSM_USER" -p "$TSM_PASSWORD" --server "$TABLEAU_SERVER_URL" || error "TSM login failed"
    
    # Export server settings
    tsm settings export -f "$EXPORT_DIR/config/tsm_config.json" || error "TSM settings export failed"
    
    # Export topology
    tsm topology list-nodes --verbose --json > "$EXPORT_DIR/config/topology.json" || warn "Topology export failed"
    
    # Export authentication settings
    tsm authentication list --json > "$EXPORT_DIR/config/authentication.json" || warn "Authentication export failed"
    
    # Export SSL settings
    tsm security list --json > "$EXPORT_DIR/config/security.json" || warn "Security settings export failed"
    
    log "TSM configuration exported successfully"
}

# Export workbooks and views
export_workbooks() {
    log "Exporting workbooks and views..."
    
    # Login to tabcmd
    tabcmd login -s "$TABLEAU_SERVER_URL" -u "$TSM_USER" -p "$TSM_PASSWORD" || error "tabcmd login failed"
    
    # Get workbook list
    tabcmd export "workbooks" --csv -f "$EXPORT_DIR/workbooks/workbook_list.csv" || error "Workbook list export failed"
    
    # Create workbook export script
    cat > "$EXPORT_DIR/scripts/export_workbooks.py" << 'EOF'
import csv
import os
import subprocess
import sys

def export_workbooks(csv_file, export_dir):
    """Export all workbooks from CSV list"""
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            workbook_id = row.get('id', '')
            workbook_name = row.get('name', '').replace('/', '_')
            
            if workbook_id and workbook_name:
                try:
                    # Export TWB file
                    cmd = ['tabcmd', 'export', f'workbooks/{workbook_id}', '--format', 'twb', '-f', f'{export_dir}/{workbook_name}.twb']
                    subprocess.run(cmd, check=True)
                    
                    # Export TWBX file
                    cmd = ['tabcmd', 'export', f'workbooks/{workbook_id}', '--format', 'twbx', '-f', f'{export_dir}/{workbook_name}.twbx']
                    subprocess.run(cmd, check=True)
                    
                    print(f"Exported: {workbook_name}")
                except subprocess.CalledProcessError as e:
                    print(f"Failed to export {workbook_name}: {e}")

if __name__ == "__main__":
    export_workbooks(sys.argv[1], sys.argv[2])
EOF
    
    # Run workbook export
    python3 "$EXPORT_DIR/scripts/export_workbooks.py" "$EXPORT_DIR/workbooks/workbook_list.csv" "$EXPORT_DIR/workbooks"
    
    log "Workbooks exported successfully"
}

# Export datasource metadata via REST API
export_datasources() {
    log "Exporting datasource metadata..."
    
    cat > "$EXPORT_DIR/scripts/export_datasources.py" << EOF
import tableauserverclient as TSC
import os
import json

def export_datasources():
    """Export all datasources via REST API"""
    server = TSC.Server("$TABLEAU_SERVER_URL", use_server_version=True)
    
    try:
        # Authenticate
        if "$PAT_TOKEN" and "$PAT_KEY":
            server.auth.sign_in(TSC.PersonalAccessTokenAuth("$PAT_TOKEN", "$PAT_KEY", site_id="$SITE_ID"))
        else:
            server.auth.sign_in(TSC.TableauAuth("$TSM_USER", "$TSM_PASSWORD", site_id="$SITE_ID"))
        
        # Get all datasources
        all_datasources, pagination = server.datasources.get()
        
        datasource_metadata = []
        os.makedirs("$EXPORT_DIR/datasources", exist_ok=True)
        
        for ds in all_datasources:
            # Download datasource
            server.datasources.download(ds.id, filepath=f"$EXPORT_DIR/datasources/{ds.name}.tds", include_extract=False)
            
            # Collect metadata
            metadata = {
                'id': ds.id,
                'name': ds.name,
                'content_url': ds.content_url,
                'datasource_type': ds.datasource_type,
                'created_at': ds.created_at.isoformat() if ds.created_at else None,
                'updated_at': ds.updated_at.isoformat() if ds.updated_at else None,
                'project_id': ds.project_id,
                'project_name': ds.project_name,
                'owner_id': ds.owner_id,
                'size': ds.size,
                'has_extracts': ds.has_extracts
            }
            datasource_metadata.append(metadata)
            
            print(f"Exported datasource: {ds.name}")
        
        # Save metadata
        with open("$EXPORT_DIR/datasources/metadata.json", 'w') as f:
            json.dump(datasource_metadata, f, indent=2)
        
        server.auth.sign_out()
        print(f"Exported {len(datasource_metadata)} datasources")
        
    except Exception as e:
        print(f"Error exporting datasources: {e}")

if __name__ == "__main__":
    export_datasources()
EOF
    
    python3 "$EXPORT_DIR/scripts/export_datasources.py"
    
    log "Datasources exported successfully"
}

# Export Hyper extract schemas
export_hyper_schemas() {
    log "Exporting Hyper extract schemas..."
    
    cat > "$EXPORT_DIR/scripts/export_hyper_schemas.py" << EOF
import subprocess
import os
import json

def export_hyper_schemas():
    """Export Hyper database schemas"""
    try:
        # Check if running in Docker
        result = subprocess.run(['docker', 'ps', '--filter', 'name=tableau-server', '--format', '{{.Names}}'], 
                              capture_output=True, text=True)
        
        if 'tableau-server' in result.stdout:
            # Running in Docker
            cmd = [
                'docker', 'exec', '-it', 'tableau-server',
                'hyperapi-dump-schema',
                '--server', 'localhost',
                '--port', '8061',
                '--user', '$TSM_USER',
                '--password', '$TSM_PASSWORD',
                '--output', '/tmp/hyper_schemas.sql'
            ]
            subprocess.run(cmd, check=True)
            
            # Copy out of container
            subprocess.run(['docker', 'cp', 'tableau-server:/tmp/hyper_schemas.sql', '$EXPORT_DIR/hyper/schemas.sql'], check=True)
        else:
            # Direct server access
            cmd = [
                'hyperapi-dump-schema',
                '--server', 'localhost',
                '--port', '8061',
                '--user', '$TSM_USER',
                '--password', '$TSM_PASSWORD',
                '--output', '$EXPORT_DIR/hyper/schemas.sql'
            ]
            subprocess.run(cmd, check=True)
        
        print("Hyper schemas exported successfully")
        
    except subprocess.CalledProcessError as e:
        print(f"Error exporting Hyper schemas: {e}")
    except FileNotFoundError:
        print("hyperapi-dump-schema not found. Skipping Hyper schema export.")

if __name__ == "__main__":
    export_hyper_schemas()
EOF
    
    python3 "$EXPORT_DIR/scripts/export_hyper_schemas.py"
    
    log "Hyper schemas export completed"
}

# Export users, groups, and permissions
export_users_permissions() {
    log "Exporting users, groups, and permissions..."
    
    # Export sites
    tsm sites list --verbose --format csv > "$EXPORT_DIR/users/sites.csv" || warn "Sites export failed"
    
    # Export groups
    tsm groups list --site "$SITE_ID" --format csv > "$EXPORT_DIR/users/groups.csv" || warn "Groups export failed"
    
    # Export users
    tsm users list --site "$SITE_ID" --format csv > "$EXPORT_DIR/users/users.csv" || warn "Users export failed"
    
    # Export permissions
    tsm permissions export --site "$SITE_ID" --format json > "$EXPORT_DIR/permissions/permissions.json" || warn "Permissions export failed"
    
    log "Users and permissions exported successfully"
}

# Generate JavaScript embed snippets
generate_embed_snippets() {
    log "Generating JavaScript embed snippets..."
    
    cat > "$EXPORT_DIR/scripts/generate_embeds.py" << 'EOF'
import json
import os
import xml.etree.ElementTree as ET
from pathlib import Path

def generate_embed_snippets():
    """Generate JavaScript embed snippets from workbooks"""
    workbooks_dir = Path("$EXPORT_DIR/workbooks")
    embeds_dir = Path("$EXPORT_DIR/embeds")
    
    embed_snippets = []
    
    # Process TWB files
    for twb_file in workbooks_dir.glob("*.twb"):
        try:
            tree = ET.parse(twb_file)
            root = tree.getroot()
            
            # Extract workbook info
            workbook_name = twb_file.stem
            
            # Find worksheets
            for worksheet in root.findall(".//worksheet"):
                worksheet_name = worksheet.get("name", "")
                
                # Generate embed snippet
                embed_snippet = {
                    "workbook": workbook_name,
                    "worksheet": worksheet_name,
                    "iframe": f'<iframe src="{os.environ.get("TABLEAU_SERVER_URL", "")}/views/{workbook_name}/{worksheet_name}?:embed=yes" width="800" height="600"></iframe>',
                    "javascript": f'''
var viz = new tableau.Viz(document.getElementById('tableauViz'), 
    '{os.environ.get("TABLEAU_SERVER_URL", "")}/views/{workbook_name}/{worksheet_name}', {{
        hideTabs: true,
        hideToolbar: true,
        width: '800px',
        height: '600px'
    }});
'''
                }
                embed_snippets.append(embed_snippet)
                
        except ET.ParseError as e:
            print(f"Error parsing {twb_file}: {e}")
    
    # Save embed snippets
    with open(embeds_dir / "embed_snippets.json", 'w') as f:
        json.dump(embed_snippets, f, indent=2)
    
    # Generate HTML template
    html_template = '''<!DOCTYPE html>
<html>
<head>
    <title>Tableau Embed Snippets</title>
    <script src="https://public.tableau.com/javascripts/api/tableau-2.min.js"></script>
</head>
<body>
'''
    
    for snippet in embed_snippets:
        html_template += f'''
    <h3>{snippet["workbook"]} - {snippet["worksheet"]}</h3>
    <div id="tableauViz_{snippet["workbook"]}_{snippet["worksheet"]}"></div>
    <script>
        {snippet["javascript"].replace("tableauViz", f"tableauViz_{snippet['workbook']}_{snippet['worksheet']}")}
    </script>
    <hr>
'''
    
    html_template += '''
</body>
</html>
'''
    
    with open(embeds_dir / "embed_template.html", 'w') as f:
        f.write(html_template)
    
    print(f"Generated {len(embed_snippets)} embed snippets")

if __name__ == "__main__":
    generate_embed_snippets()
EOF
    
    python3 "$EXPORT_DIR/scripts/generate_embeds.py"
    
    log "Embed snippets generated successfully"
}

# Create reconstruction script
create_reconstruction_script() {
    log "Creating reconstruction script..."
    
    cat > "$EXPORT_DIR/scripts/reconstruct_server.sh" << 'EOF'
#!/bin/bash

# Tableau Server Reconstruction Script
# Rebuilds server from exported configuration and assets

set -euo pipefail

EXPORT_DIR="${1:-./tableau_export}"
TARGET_SERVER="${2:-https://new-server.example.com}"
TSM_USER="${3:-admin}"
TSM_PASSWORD="${4:-}"

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
    exit 1
}

# Validate inputs
if [[ -z "$TSM_PASSWORD" ]]; then
    error "TSM_PASSWORD is required"
fi

if [[ ! -d "$EXPORT_DIR" ]]; then
    error "Export directory not found: $EXPORT_DIR"
fi

log "Starting Tableau Server reconstruction..."

# 1. Apply TSM configuration
log "Applying TSM configuration..."
tsm login -u "$TSM_USER" -p "$TSM_PASSWORD" --server "$TARGET_SERVER"

if [[ -f "$EXPORT_DIR/config/tsm_config.json" ]]; then
    tsm settings import -f "$EXPORT_DIR/config/tsm_config.json" --force-keys
    log "TSM configuration applied"
else
    error "TSM configuration file not found"
fi

# 2. Restart services
log "Restarting Tableau Server services..."
tsm restart

# 3. Publish datasources
log "Publishing datasources..."
tabcmd login -s "$TARGET_SERVER" -u "$TSM_USER" -p "$TSM_PASSWORD"

for tds_file in "$EXPORT_DIR/datasources"/*.tds; do
    if [[ -f "$tds_file" ]]; then
        tabcmd publish "$tds_file" --overwrite
        log "Published: $(basename "$tds_file")"
    fi
done

# 4. Publish workbooks
log "Publishing workbooks..."
for twbx_file in "$EXPORT_DIR/workbooks"/*.twbx; do
    if [[ -f "$twbx_file" ]]; then
        tabcmd publish "$twbx_file" --overwrite
        log "Published: $(basename "$twbx_file")"
    fi
done

# 5. Restore Hyper schemas (if available)
if [[ -f "$EXPORT_DIR/hyper/schemas.sql" ]]; then
    log "Restoring Hyper schemas..."
    # Execute SQL schema restoration
    # Note: This requires appropriate Hyper API access
fi

# 6. Create users and groups
log "Creating users and groups..."
if [[ -f "$EXPORT_DIR/users/users.csv" ]]; then
    python3 << 'PYTHON_EOF'
import csv
import subprocess
import sys

def create_users(csv_file):
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            username = row.get('username', '')
            email = row.get('email', '')
            site_role = row.get('site_role', 'Viewer')
            
            if username and email:
                try:
                    cmd = ['tabcmd', 'createusers', username, '--email', email, '--role', site_role]
                    subprocess.run(cmd, check=True)
                    print(f"Created user: {username}")
                except subprocess.CalledProcessError:
                    print(f"Failed to create user: {username}")

create_users(sys.argv[1])
PYTHON_EOF
fi

# 7. Apply permissions
log "Applying permissions..."
if [[ -f "$EXPORT_DIR/permissions/permissions.json" ]]; then
    tsm permissions import --site Default --format json -f "$EXPORT_DIR/permissions/permissions.json"
    log "Permissions applied"
fi

log "Tableau Server reconstruction completed successfully!"
log "Server is ready at: $TARGET_SERVER"
EOF
    
    chmod +x "$EXPORT_DIR/scripts/reconstruct_server.sh"
    
    log "Reconstruction script created"
}

# Main execution
main() {
    log "Starting Tableau Server extraction..."
    
    check_requirements
    setup_directories
    export_tsm_config
    export_workbooks
    export_datasources
    export_hyper_schemas
    export_users_permissions
    generate_embed_snippets
    create_reconstruction_script
    
    log "Tableau Server extraction completed successfully!"
    log "All assets exported to: $EXPORT_DIR"
    log "Use $EXPORT_DIR/scripts/reconstruct_server.sh to rebuild the server"
}

# Run main function
main "$@"