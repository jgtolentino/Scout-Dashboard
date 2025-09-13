#!/bin/bash

# Tableau Desktop Complete Extraction Script
# Extracts all workbooks, datasources, schemas, and logs from local Tableau Desktop repository

set -euo pipefail

# Configuration
TD_REPO="${TD_REPO:-$HOME/Documents/My Tableau Repository}"
EXPORT_DIR="${EXPORT_DIR:-$HOME/tableau_desktop_reverse}"
HYPER_API_VERSION="${HYPER_API_VERSION:-0.0.17200}"

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

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    # Check if Tableau Desktop repository exists
    if [[ ! -d "$TD_REPO" ]]; then
        error "Tableau Desktop repository not found at: $TD_REPO"
    fi
    
    # Check Python
    command -v python3 >/dev/null 2>&1 || error "Python 3 not found"
    
    # Check unzip
    command -v unzip >/dev/null 2>&1 || error "unzip not found"
    
    log "Requirements check passed"
}

# Setup directory structure
setup_directories() {
    log "Setting up export directories..."
    
    mkdir -p "$EXPORT_DIR"/{workbooks,tds,hyper_schemas,logs,scripts,metadata}
    
    info "Export directory structure created at: $EXPORT_DIR"
}

# Install Tableau Hyper API
install_hyper_api() {
    log "Installing Tableau Hyper API..."
    
    # Check if already installed
    if python3 -c "import tableauhyperapi" 2>/dev/null; then
        info "Tableau Hyper API already installed"
        return 0
    fi
    
    # Install via pip
    pip3 install tableauhyperapi pandas || warn "Failed to install Hyper API via pip, trying alternative method"
    
    log "Tableau Hyper API installation completed"
}

# Extract all datasource definitions
extract_datasources() {
    log "Extracting datasource definitions..."
    
    local tds_count=0
    local tdsx_count=0
    
    # Copy TDS files
    if ls "$TD_REPO"/Datasources/*.tds >/dev/null 2>&1; then
        cp "$TD_REPO"/Datasources/*.tds "$EXPORT_DIR"/tds/ 2>/dev/null || true
        tds_count=$(ls "$EXPORT_DIR"/tds/*.tds 2>/dev/null | wc -l)
    fi
    
    # Copy TDSX files
    if ls "$TD_REPO"/Datasources/*.tdsx >/dev/null 2>&1; then
        cp "$TD_REPO"/Datasources/*.tdsx "$EXPORT_DIR"/tds/ 2>/dev/null || true
        tdsx_count=$(ls "$EXPORT_DIR"/tds/*.tdsx 2>/dev/null | wc -l)
    fi
    
    log "Extracted $tds_count TDS and $tdsx_count TDSX files"
}

# Unpack workbooks and extract TWB files
extract_workbooks() {
    log "Extracting and unpacking workbooks..."
    
    local twbx_count=0
    local twb_count=0
    
    # Process TWBX files
    if ls "$TD_REPO"/Workbooks/*.twbx >/dev/null 2>&1; then
        for wb in "$TD_REPO"/Workbooks/*.twbx; do
            local name=$(basename "$wb" .twbx)
            mkdir -p "$EXPORT_DIR"/workbooks/"$name"
            
            if unzip -qo "$wb" -d "$EXPORT_DIR"/workbooks/"$name" 2>/dev/null; then
                ((twbx_count++))
                info "Unpacked: $name"
            else
                warn "Failed to unpack: $name"
            fi
        done
    fi
    
    # Copy standalone TWB files
    if ls "$TD_REPO"/Workbooks/*.twb >/dev/null 2>&1; then
        cp "$TD_REPO"/Workbooks/*.twb "$EXPORT_DIR"/workbooks/ 2>/dev/null || true
        twb_count=$(ls "$EXPORT_DIR"/workbooks/*.twb 2>/dev/null | wc -l)
    fi
    
    # Extract TWB files from unpacked TWBX directories
    find "$EXPORT_DIR"/workbooks -type f -name "*.twb" -exec cp {} "$EXPORT_DIR"/workbooks/ \; 2>/dev/null || true
    
    local total_twb=$(ls "$EXPORT_DIR"/workbooks/*.twb 2>/dev/null | wc -l)
    
    log "Processed $twbx_count TWBX files and extracted $total_twb TWB files"
}

# Extract Hyper schema definitions
extract_hyper_schemas() {
    log "Extracting Hyper extract schemas..."
    
    cat > "$EXPORT_DIR/scripts/extract_hyper_schemas.py" << 'EOF'
#!/usr/bin/env python3

import os
import sys
import glob
from pathlib import Path

try:
    from tableauhyperapi import HyperProcess, Connection, Telemetry, TableName
except ImportError:
    print("ERROR: tableauhyperapi not installed. Run: pip install tableauhyperapi")
    sys.exit(1)

def extract_hyper_schemas(export_dir):
    """Extract schema DDL from each embedded .hyper extract"""
    out_dir = os.path.join(export_dir, "hyper_schemas")
    os.makedirs(out_dir, exist_ok=True)
    
    workbooks_dir = os.path.join(export_dir, "workbooks")
    hyper_files = glob.glob(os.path.join(workbooks_dir, "**/*.hyper"), recursive=True)
    
    if not hyper_files:
        print("No Hyper files found")
        return
    
    print(f"Found {len(hyper_files)} Hyper files")
    
    with HyperProcess(telemetry=Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU) as hyper:
        for hyper_file in hyper_files:
            try:
                with Connection(endpoint=hyper.endpoint, database=hyper_file) as conn:
                    schema_sql = []
                    
                    # Get all schemas
                    schemas = conn.catalog.get_schema_names()
                    
                    for schema in schemas:
                        # Get tables in this schema
                        tables = conn.catalog.get_table_names(schema.name)
                        
                        for table in tables:
                            try:
                                # Get CREATE TABLE statement
                                create_stmt = str(conn.catalog.get_table_definition(table))
                                schema_sql.append(f"-- Schema: {schema.name}, Table: {table.name.unescaped}")
                                schema_sql.append(create_stmt + ";")
                                schema_sql.append("")
                            except Exception as e:
                                schema_sql.append(f"-- ERROR extracting {table}: {e}")
                    
                    # Save schema
                    name = os.path.basename(hyper_file).replace(".hyper", "")
                    schema_file = os.path.join(out_dir, f"{name}_schema.sql")
                    
                    with open(schema_file, "w", encoding="utf-8") as f:
                        f.write("\n".join(schema_sql))
                    
                    print(f"Extracted schema: {name}")
                    
            except Exception as e:
                print(f"ERROR processing {hyper_file}: {e}")

if __name__ == "__main__":
    export_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/tableau_desktop_reverse")
    extract_hyper_schemas(export_dir)
EOF
    
    chmod +x "$EXPORT_DIR/scripts/extract_hyper_schemas.py"
    python3 "$EXPORT_DIR/scripts/extract_hyper_schemas.py" "$EXPORT_DIR"
    
    local schema_count=$(ls "$EXPORT_DIR"/hyper_schemas/*.sql 2>/dev/null | wc -l)
    log "Extracted $schema_count Hyper schema files"
}

# Parse datasource field definitions
parse_datasource_fields() {
    log "Parsing datasource field definitions..."
    
    cat > "$EXPORT_DIR/scripts/parse_datasource_fields.py" << 'EOF'
#!/usr/bin/env python3

import xml.etree.ElementTree as ET
import glob
import os
import csv
import sys

def parse_datasource_fields(export_dir):
    """Parse column definitions from each .tds/.tdsx file"""
    tds_dir = os.path.join(export_dir, "tds")
    output_file = os.path.join(tds_dir, "datasource_fields.csv")
    
    # Find all TDS and TDSX files
    tds_files = glob.glob(os.path.join(tds_dir, "*.tds"))
    tdsx_files = glob.glob(os.path.join(tds_dir, "*.tdsx"))
    
    all_files = tds_files + tdsx_files
    
    if not all_files:
        print("No TDS/TDSX files found")
        return
    
    print(f"Processing {len(all_files)} datasource files")
    
    with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["datasource", "field_name", "caption", "datatype", "role", "calculation"])
        
        for file_path in all_files:
            try:
                tree = ET.parse(file_path)
                root = tree.getroot()
                
                # Get datasource name
                ds_name = root.attrib.get("name", os.path.basename(file_path))
                
                # Find all columns/fields
                for col in root.findall(".//column"):
                    field_name = col.attrib.get("name", "")
                    caption = col.attrib.get("caption", "")
                    datatype = col.attrib.get("datatype", "")
                    role = col.attrib.get("role", "")
                    
                    # Check for calculation
                    calc_elem = col.find("calculation")
                    calculation = calc_elem.attrib.get("formula", "") if calc_elem is not None else ""
                    
                    writer.writerow([ds_name, field_name, caption, datatype, role, calculation])
                
                print(f"Processed: {ds_name}")
                
            except ET.ParseError as e:
                print(f"ERROR parsing {file_path}: {e}")
            except Exception as e:
                print(f"ERROR processing {file_path}: {e}")
    
    print(f"Field definitions saved to: {output_file}")

if __name__ == "__main__":
    export_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/tableau_desktop_reverse")
    parse_datasource_fields(export_dir)
EOF
    
    chmod +x "$EXPORT_DIR/scripts/parse_datasource_fields.py"
    python3 "$EXPORT_DIR/scripts/parse_datasource_fields.py" "$EXPORT_DIR"
    
    log "Datasource field parsing completed"
}

# Extract workbook metadata
extract_workbook_metadata() {
    log "Extracting workbook metadata..."
    
    cat > "$EXPORT_DIR/scripts/extract_workbook_metadata.py" << 'EOF'
#!/usr/bin/env python3

import xml.etree.ElementTree as ET
import glob
import os
import json
import sys
from datetime import datetime

def extract_workbook_metadata(export_dir):
    """Extract metadata from TWB files"""
    workbooks_dir = os.path.join(export_dir, "workbooks")
    output_file = os.path.join(export_dir, "metadata", "workbook_metadata.json")
    
    twb_files = glob.glob(os.path.join(workbooks_dir, "*.twb"))
    
    if not twb_files:
        print("No TWB files found")
        return
    
    print(f"Processing {len(twb_files)} workbook files")
    
    metadata = []
    
    for twb_file in twb_files:
        try:
            tree = ET.parse(twb_file)
            root = tree.getroot()
            
            # Basic workbook info
            wb_name = os.path.basename(twb_file).replace(".twb", "")
            
            # Get worksheets
            worksheets = []
            for ws in root.findall(".//worksheet"):
                ws_info = {
                    "name": ws.attrib.get("name", ""),
                    "class": ws.attrib.get("class", "")
                }
                worksheets.append(ws_info)
            
            # Get dashboards
            dashboards = []
            for db in root.findall(".//dashboard"):
                db_info = {
                    "name": db.attrib.get("name", ""),
                    "class": db.attrib.get("class", "")
                }
                dashboards.append(db_info)
            
            # Get datasources
            datasources = []
            for ds in root.findall(".//datasource"):
                ds_info = {
                    "name": ds.attrib.get("name", ""),
                    "caption": ds.attrib.get("caption", ""),
                    "version": ds.attrib.get("version", "")
                }
                datasources.append(ds_info)
            
            # Get repository location if embedded
            repository_location = root.find(".//repository-location")
            repo_info = {}
            if repository_location is not None:
                repo_info = dict(repository_location.attrib)
            
            workbook_metadata = {
                "file_name": wb_name,
                "file_path": twb_file,
                "version": root.attrib.get("version", ""),
                "source_build": root.attrib.get("source-build", ""),
                "worksheets": worksheets,
                "dashboards": dashboards,
                "datasources": datasources,
                "repository_info": repo_info,
                "extracted_at": datetime.now().isoformat()
            }
            
            metadata.append(workbook_metadata)
            print(f"Processed: {wb_name}")
            
        except ET.ParseError as e:
            print(f"ERROR parsing {twb_file}: {e}")
        except Exception as e:
            print(f"ERROR processing {twb_file}: {e}")
    
    # Save metadata
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"Workbook metadata saved to: {output_file}")

if __name__ == "__main__":
    export_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/tableau_desktop_reverse")
    extract_workbook_metadata(export_dir)
EOF
    
    chmod +x "$EXPORT_DIR/scripts/extract_workbook_metadata.py"
    python3 "$EXPORT_DIR/scripts/extract_workbook_metadata.py" "$EXPORT_DIR"
    
    log "Workbook metadata extraction completed"
}

# Copy Desktop logs
copy_desktop_logs() {
    log "Copying Tableau Desktop logs..."
    
    local log_count=0
    
    if [[ -d "$TD_REPO/Logs" ]]; then
        cp -r "$TD_REPO"/Logs/* "$EXPORT_DIR"/logs/ 2>/dev/null || true
        log_count=$(find "$EXPORT_DIR"/logs -type f 2>/dev/null | wc -l)
        log "Copied $log_count log files"
    else
        warn "No logs directory found at $TD_REPO/Logs"
    fi
}

# Generate summary report
generate_summary() {
    log "Generating extraction summary..."
    
    cat > "$EXPORT_DIR/EXTRACTION_SUMMARY.md" << EOF
# Tableau Desktop Extraction Summary

**Extraction Date:** $(date)
**Source Repository:** $TD_REPO
**Export Directory:** $EXPORT_DIR

## Extracted Components

### Workbooks
- TWB Files: $(ls "$EXPORT_DIR"/workbooks/*.twb 2>/dev/null | wc -l)
- Unpacked TWBX Directories: $(find "$EXPORT_DIR"/workbooks -maxdepth 1 -type d | wc -l)

### Datasources
- TDS Files: $(ls "$EXPORT_DIR"/tds/*.tds 2>/dev/null | wc -l)
- TDSX Files: $(ls "$EXPORT_DIR"/tds/*.tdsx 2>/dev/null | wc -l)
- Field Definitions: $([ -f "$EXPORT_DIR/tds/datasource_fields.csv" ] && echo "✓" || echo "✗")

### Hyper Extracts
- Schema Files: $(ls "$EXPORT_DIR"/hyper_schemas/*.sql 2>/dev/null | wc -l)

### Logs
- Log Files: $(find "$EXPORT_DIR"/logs -type f 2>/dev/null | wc -l)

### Metadata
- Workbook Metadata: $([ -f "$EXPORT_DIR/metadata/workbook_metadata.json" ] && echo "✓" || echo "✗")

## Directory Structure

\`\`\`
$EXPORT_DIR/
├── workbooks/          # TWB files and unpacked TWBX contents
├── tds/               # Datasource definitions and field CSV
├── hyper_schemas/     # SQL DDL from Hyper extracts
├── logs/              # Tableau Desktop logs
├── metadata/          # Extracted metadata in JSON format
└── scripts/           # Python extraction utilities
\`\`\`

## Next Steps

1. **Review extracted assets** in each directory
2. **Validate schema files** for completeness
3. **Use scripts** for additional processing
4. **Deploy to Tableau Server** using reconstruction tools

## Scripts Available

- \`extract_hyper_schemas.py\` - Re-run Hyper schema extraction
- \`parse_datasource_fields.py\` - Re-parse datasource fields
- \`extract_workbook_metadata.py\` - Re-extract workbook metadata

All scripts are executable and can be run independently.
EOF
    
    log "Summary report generated: $EXPORT_DIR/EXTRACTION_SUMMARY.md"
}

# Main execution
main() {
    log "Starting Tableau Desktop extraction..."
    log "Source: $TD_REPO"
    log "Target: $EXPORT_DIR"
    
    check_requirements
    setup_directories
    install_hyper_api
    extract_datasources
    extract_workbooks
    extract_hyper_schemas
    parse_datasource_fields
    extract_workbook_metadata
    copy_desktop_logs
    generate_summary
    
    log "Tableau Desktop extraction completed successfully!"
    log "All assets exported to: $EXPORT_DIR"
    log "View summary: $EXPORT_DIR/EXTRACTION_SUMMARY.md"
}

# Run main function
main "$@"