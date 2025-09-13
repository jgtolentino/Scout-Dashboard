# Tableau Server Complete Extraction & Cloning System

A comprehensive solution for legally extracting every component of a proprietary Tableau Server installation and reconstructing it on new infrastructure.

## Features

- **Complete TSM Configuration Export**: Server settings, clustering, SSL, ports, authentication
- **Workbook & View Extraction**: TWB/TWBX files with full metadata
- **Datasource Metadata Extraction**: Via REST API with schema information
- **Hyper Extract Schema Dumping**: Database schemas and structure
- **User/Group/Permissions Export**: Complete access control replication
- **JavaScript Embed Generation**: Ready-to-use embed snippets
- **Automated Reconstruction**: One-script server rebuild capability

## Prerequisites

1. **Tableau Tools**:
   - TSM (Tableau Server Manager) CLI
   - tabcmd (Tableau Command Line Utility)

2. **Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **System Tools**:
   - jq (JSON processor)
   - Docker (if server is containerized)

## Quick Start

### 1. Set Environment Variables

```bash
export TABLEAU_SERVER_URL="https://your-server.example.com"
export TSM_USER="admin"
export TSM_PASSWORD="your-password"
export PAT_TOKEN="your-pat-token"  # Optional: Personal Access Token
export PAT_KEY="your-pat-key"      # Optional: Personal Access Token Key
export SITE_ID="Default"           # Target site ID
export EXPORT_DIR="./tableau_export"  # Export directory
```

### 2. Run Complete Extraction

```bash
./tableau-clone-extractor.sh
```

### 3. Reconstruct on New Server

```bash
./tableau_export/scripts/reconstruct_server.sh ./tableau_export https://new-server.example.com admin new-password
```

## Detailed Usage

### Individual Component Extraction

The main script runs all extractions, but you can also run individual components:

#### TSM Configuration Only
```bash
# Set environment variables first
./tableau-clone-extractor.sh
# Then manually run specific functions
```

#### Workbooks & Views
```bash
python3 tableau_export/scripts/export_workbooks.py tableau_export/workbooks/workbook_list.csv tableau_export/workbooks
```

#### Datasources via REST API
```bash
python3 tableau_export/scripts/export_datasources.py
```

#### Hyper Schemas
```bash
python3 tableau_export/scripts/export_hyper_schemas.py
```

#### Embed Snippets
```bash
python3 tableau_export/scripts/generate_embeds.py
```

## Output Structure

```
tableau_export/
├── config/
│   ├── tsm_config.json          # Complete TSM configuration
│   ├── topology.json            # Server topology
│   ├── authentication.json      # Auth settings
│   └── security.json            # SSL/security settings
├── workbooks/
│   ├── workbook_list.csv        # Master workbook inventory
│   ├── *.twb                    # Workbook XML files
│   └── *.twbx                   # Packaged workbooks
├── datasources/
│   ├── metadata.json            # Datasource metadata
│   └── *.tds                    # Datasource definition files
├── users/
│   ├── sites.csv                # Site information
│   ├── groups.csv               # Group memberships
│   └── users.csv                # User accounts
├── permissions/
│   └── permissions.json         # Complete permission matrix
├── hyper/
│   └── schemas.sql              # Hyper database schemas
├── embeds/
│   ├── embed_snippets.json      # JavaScript embed data
│   └── embed_template.html      # Ready-to-use HTML template
└── scripts/
    ├── reconstruct_server.sh    # Complete server rebuild script
    ├── export_workbooks.py      # Workbook extraction utility
    ├── export_datasources.py    # Datasource extraction utility
    ├── export_hyper_schemas.py  # Hyper schema extractor
    └── generate_embeds.py       # Embed snippet generator
```

## Reconstruction Process

The reconstruction script performs these steps:

1. **Apply TSM Configuration**: Imports all server settings
2. **Restart Services**: Ensures configuration is active
3. **Publish Datasources**: Restores all data connections
4. **Publish Workbooks**: Deploys all dashboards and views
5. **Restore Hyper Schemas**: Rebuilds extract databases
6. **Create Users/Groups**: Recreates access control structure
7. **Apply Permissions**: Restores complete permission matrix

## Legal Compliance

This system uses only official Tableau APIs and CLI tools:
- TSM CLI for configuration export/import
- tabcmd for content publishing/downloading
- Tableau REST API for metadata extraction
- Hyper API for schema access

No reverse engineering or binary decompilation is performed.

## Security Considerations

- Store credentials securely (use environment variables)
- Protect exported files (contain sensitive metadata)
- Validate reconstruction target server
- Review permissions before applying

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify TSM_PASSWORD is correct
   - Check server URL accessibility
   - Ensure user has admin privileges

2. **Permission Errors**:
   - Run with administrator privileges
   - Check file system permissions
   - Verify export directory is writable

3. **Missing Dependencies**:
   - Install all prerequisites
   - Check Python package versions
   - Verify CLI tools are in PATH

### Debug Mode

Enable verbose logging:
```bash
export DEBUG=true
./tableau-clone-extractor.sh
```

## Performance Optimization

- Run during off-peak hours
- Use parallel processing where possible
- Consider incremental extractions for large servers
- Monitor disk space during extraction

## Support

For issues and feature requests, check:
1. Prerequisites are installed correctly
2. Environment variables are set properly
3. User has sufficient permissions
4. Server is accessible and responsive

## License

This tool uses only official Tableau APIs and respects all licensing terms.