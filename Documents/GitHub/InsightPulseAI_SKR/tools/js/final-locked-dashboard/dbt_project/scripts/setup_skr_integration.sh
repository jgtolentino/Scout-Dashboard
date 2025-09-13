#!/bin/bash
# Script to set up SKR integration hooks for dbt metadata
# This script sets up the necessary structure for SKR tagging using dbt metadata

set -e

# Directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
DASHBOARD_DIR="$( cd "$PROJECT_DIR/.." && pwd )"
ROOT_DIR="$( cd "$DASHBOARD_DIR/../../.." && pwd )"

cd "$PROJECT_DIR"

echo "=== Setting up SKR Integration for dbt Models ==="

# Create SKR integration directory if it doesn't exist
SKR_DIR="$PROJECT_DIR/skr_integration"
mkdir -p "$SKR_DIR"

# Create SKR metadata templates
echo "Creating SKR metadata templates..."

cat > "$SKR_DIR/dbt_model_meta.yaml" << EOF
# dbt Model Metadata Template for SKR
# This template is used to generate SKR metadata for dbt models

name: "{model_name}"
description: "{model_description}"
type: "dbt_model"
created_at: "{created_at}"
updated_at: "{updated_at}"
owner: "scout_edge"
tags:
  - "dbt"
  - "scout_edge"
  - "{model_type}"  # staging, intermediate, or mart
materialization: "{materialization}"
model_depends_on:
{model_depends_on}
columns:
{columns}
tests:
{tests}
metrics:
{metrics}
EOF

# Create SKR integration script for dbt
echo "Creating dbt-to-SKR integration script..."

cat > "$SKR_DIR/dbt_to_skr.py" << EOF
#!/usr/bin/env python
"""
dbt to SKR Integration Script

This script extracts metadata from dbt artifacts and creates SKR metadata files.
It allows the SKR system to understand dbt models, lineage, and documentation.
"""
import os
import sys
import json
import yaml
import glob
import argparse
from datetime import datetime
from pathlib import Path

def load_dbt_manifest(manifest_path):
    """Load dbt manifest.json file."""
    try:
        with open(manifest_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dbt manifest: {e}")
        sys.exit(1)

def load_dbt_catalog(catalog_path):
    """Load dbt catalog.json file."""
    try:
        with open(catalog_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dbt catalog: {e}")
        sys.exit(1)

def load_metadata_template(template_path):
    """Load SKR metadata template."""
    try:
        with open(template_path, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"Error loading metadata template: {e}")
        sys.exit(1)

def extract_model_info(manifest, catalog, model_name):
    """Extract model information from dbt artifacts."""
    model_info = {}
    
    # Get model node from manifest
    for node_id, node in manifest.get('nodes', {}).items():
        if node.get('name') == model_name and node.get('resource_type') == 'model':
            model_info['name'] = node.get('name')
            model_info['description'] = node.get('description', '')
            model_info['schema'] = node.get('schema')
            model_info['database'] = node.get('database')
            model_info['materialization'] = node.get('config', {}).get('materialized', 'view')
            model_info['columns'] = node.get('columns', {})
            model_info['depends_on'] = node.get('depends_on', {}).get('nodes', [])
            model_info['meta'] = node.get('meta', {})
            model_info['tags'] = node.get('tags', [])
            model_info['path'] = node.get('path', '')
            
            # Get model type based on path
            if 'staging' in model_info['path']:
                model_info['model_type'] = 'staging'
            elif 'intermediate' in model_info['path']:
                model_info['model_type'] = 'intermediate'
            elif 'marts' in model_info['path']:
                model_info['model_type'] = 'mart'
            else:
                model_info['model_type'] = 'unknown'
                
            # Get catalog information
            catalog_key = f"model.{manifest.get('metadata', {}).get('project_name', 'scout_edge')}.{model_name}"
            if catalog_key in catalog.get('nodes', {}):
                catalog_node = catalog['nodes'][catalog_key]
                model_info['stats'] = catalog_node.get('stats', {})
                
            break
    
    return model_info

def format_depends_on(model_info, manifest):
    """Format model dependencies in YAML format."""
    depends_on_yaml = []
    
    for node_id in model_info.get('depends_on', []):
        for manifest_node_id, manifest_node in manifest.get('nodes', {}).items():
            if manifest_node_id == node_id:
                depends_on_yaml.append(f"  - name: {manifest_node.get('name')}")
                depends_on_yaml.append(f"    resource_type: {manifest_node.get('resource_type')}")
    
    return "\n".join(depends_on_yaml)

def format_columns(model_info):
    """Format model columns in YAML format."""
    columns_yaml = []
    
    for column_name, column_info in model_info.get('columns', {}).items():
        columns_yaml.append(f"  - name: {column_name}")
        columns_yaml.append(f"    description: \"{column_info.get('description', '')}\"")
        if column_info.get('tags'):
            columns_yaml.append(f"    tags: {column_info.get('tags')}")
    
    return "\n".join(columns_yaml)

def format_tests(model_info, manifest):
    """Format model tests in YAML format."""
    tests_yaml = []
    model_name = model_info.get('name')
    
    for node_id, node in manifest.get('nodes', {}).items():
        if node.get('resource_type') == 'test' and node.get('depends_on', {}).get('nodes', []):
            for dep in node.get('depends_on', {}).get('nodes', []):
                if dep.endswith(f".{model_name}"):
                    tests_yaml.append(f"  - name: {node.get('name')}")
                    tests_yaml.append(f"    description: \"{node.get('description', '')}\"")
                    tests_yaml.append(f"    test_type: {node.get('test_metadata', {}).get('name', 'unknown')}")
    
    return "\n".join(tests_yaml)

def format_metrics(model_info, manifest):
    """Format model metrics in YAML format."""
    metrics_yaml = []
    
    # Add row count and byte size if available
    if 'stats' in model_info:
        for stat_name, stat_value in model_info.get('stats', {}).items():
            metrics_yaml.append(f"  - name: {stat_name}")
            metrics_yaml.append(f"    value: {stat_value}")
    
    return "\n".join(metrics_yaml)

def generate_skr_metadata(model_info, manifest, template):
    """Generate SKR metadata from dbt model information."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Format dependencies, columns, tests, and metrics
    formatted_depends_on = format_depends_on(model_info, manifest)
    formatted_columns = format_columns(model_info)
    formatted_tests = format_tests(model_info, manifest)
    formatted_metrics = format_metrics(model_info, manifest)
    
    # Fill in template
    metadata = template.format(
        model_name=model_info.get('name', ''),
        model_description=model_info.get('description', ''),
        created_at=now,
        updated_at=now,
        model_type=model_info.get('model_type', 'unknown'),
        materialization=model_info.get('materialization', 'view'),
        model_depends_on=formatted_depends_on,
        columns=formatted_columns,
        tests=formatted_tests,
        metrics=formatted_metrics
    )
    
    return metadata

def save_skr_metadata(metadata, output_dir, model_name):
    """Save SKR metadata to file."""
    output_path = os.path.join(output_dir, f"{model_name}.yaml")
    
    try:
        with open(output_path, 'w') as f:
            f.write(metadata)
        print(f"Saved SKR metadata for {model_name} to {output_path}")
    except Exception as e:
        print(f"Error saving SKR metadata: {e}")

def main():
    parser = argparse.ArgumentParser(description='Generate SKR metadata from dbt artifacts')
    parser.add_argument('--manifest', required=True, help='Path to dbt manifest.json')
    parser.add_argument('--catalog', required=True, help='Path to dbt catalog.json')
    parser.add_argument('--template', default='dbt_model_meta.yaml', help='Path to metadata template')
    parser.add_argument('--output-dir', required=True, help='Output directory for SKR metadata files')
    parser.add_argument('--models', nargs='*', help='List of model names to process (all models if not specified)')
    
    args = parser.parse_args()
    
    # Load dbt artifacts
    manifest = load_dbt_manifest(args.manifest)
    catalog = load_dbt_catalog(args.catalog)
    
    # Load metadata template
    template_path = args.template
    if not os.path.isabs(template_path):
        template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), template_path)
    template = load_metadata_template(template_path)
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Get model names to process
    model_names = args.models or []
    if not model_names:
        # Process all models if none specified
        for node_id, node in manifest.get('nodes', {}).items():
            if node.get('resource_type') == 'model':
                model_names.append(node.get('name'))
    
    # Process each model
    for model_name in model_names:
        print(f"Processing model: {model_name}")
        model_info = extract_model_info(manifest, catalog, model_name)
        if model_info:
            metadata = generate_skr_metadata(model_info, manifest, template)
            save_skr_metadata(metadata, args.output_dir, model_name)
        else:
            print(f"Model {model_name} not found in dbt artifacts")
    
    print(f"Processed {len(model_names)} models")

if __name__ == '__main__':
    main()
EOF

# Create SKR integration hook for dbt run
echo "Creating dbt hooks for SKR integration..."

cat > "$SKR_DIR/dbt_on_run_end.sql" << EOF
-- dbt hook: run after dbt run completes
-- This hook will be automatically executed after dbt run completes

{% macro export_skr_metadata() %}
    {{ log("Exporting dbt metadata to SKR...", info=True) }}
    {% if execute %}
        {% do run_shell_command("python ../skr_integration/dbt_to_skr.py --manifest target/manifest.json --catalog target/catalog.json --template ../skr_integration/dbt_model_meta.yaml --output-dir ../skr_integration/metadata") %}
    {% endif %}
{% endmacro %}

-- Export metadata at the end of dbt run
{{ export_skr_metadata() }}
EOF

# Create SKR integration macros
mkdir -p "$PROJECT_DIR/macros"

cat > "$PROJECT_DIR/macros/skr_integration.sql" << EOF
-- dbt macros for SKR integration

-- Export dbt metadata to SKR after run
{% macro on_run_end() %}
    {{ log("Running on_run_end hook for SKR integration", info=True) }}
    {% do run_query("select 1") %}  -- Dummy query to ensure hook runs
    {{ log("Exporting metadata to SKR...", info=True) }}
    {% if execute %}
        {% do run_shell_command("python ../skr_integration/dbt_to_skr.py --manifest target/manifest.json --catalog target/catalog.json --template ../skr_integration/dbt_model_meta.yaml --output-dir ../skr_integration/metadata") %}
    {% endif %}
{% endmacro %}

-- Add SKR metadata to models
{% macro skr_metadata(
    resource_type = "model",
    owner = "scout_edge",
    tags = [],
    metrics = []
) %}
  {{ config(
    meta = {
      "resource_type": resource_type,
      "owner": owner,
      "tags": tags,
      "skr_metrics": metrics,
      "skr_updated_at": modules.datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
  ) }}
{% endmacro %}
EOF

# Create SKR metadata directory
mkdir -p "$SKR_DIR/metadata"

# Create integration README
cat > "$SKR_DIR/README.md" << EOF
# SKR Integration for dbt Models

This directory contains the integration between dbt models and the SKR (Sales Knowledge Repository) system.

## How It Works

1. dbt generates artifacts (manifest.json and catalog.json) during the model run
2. The on_run_end hook triggers the dbt_to_skr.py script
3. The script extracts metadata from dbt artifacts and creates SKR metadata files
4. These metadata files are synchronized with the SKR system

## Usage

### Adding SKR Metadata to Models

Use the \`skr_metadata\` macro in your model SQL files:

\`\`\`sql
{{
  config(
    materialized = 'table'
  )
}}

-- Apply SKR metadata
{{ skr_metadata(
    resource_type = "model",
    owner = "scout_edge",
    tags = ["brand_intelligence", "geo_analysis"],
    metrics = ["brand_count", "region_count"]
) }}

SELECT
  ...
\`\`\`

### Exporting Metadata Manually

Run the export script:

\`\`\`bash
cd <project_dir>
dbt run  # Generates the latest artifacts
python skr_integration/dbt_to_skr.py \\
  --manifest target/manifest.json \\
  --catalog target/catalog.json \\
  --template skr_integration/dbt_model_meta.yaml \\
  --output-dir skr_integration/metadata
\`\`\`

## Files

- \`dbt_to_skr.py\`: Python script that converts dbt metadata to SKR format
- \`dbt_model_meta.yaml\`: Template for generating SKR metadata
- \`metadata/\`: Directory containing generated SKR metadata files
- \`dbt_on_run_end.sql\`: dbt hook that runs after dbt models complete
- \`../macros/skr_integration.sql\`: dbt macros for SKR integration

## Integration with Kalaw

The generated metadata files can be automatically synced with Kalaw using the SKR indexer.
EOF

# Make scripts executable
chmod +x "$SKR_DIR/dbt_to_skr.py"

# Update dbt_project.yml to include SKR integration
echo "Updating dbt_project.yml with SKR integration settings..."

# Check if dbt_project.yml already has SKR integration
if ! grep -q "on-run-end" "$PROJECT_DIR/dbt_project.yml"; then
  # Add on-run-end hook to dbt_project.yml
  # First, make a backup
  cp "$PROJECT_DIR/dbt_project.yml" "$PROJECT_DIR/dbt_project.yml.bak"
  
  # Add hook configuration before the models section
  awk '/models:/{print "on-run-end:\n  - \"{{ on_run_end() }}\"\n";print;next}1' "$PROJECT_DIR/dbt_project.yml.bak" > "$PROJECT_DIR/dbt_project.yml"
fi

# Install dependencies if needed
echo "Checking for required Python packages..."
if ! pip list | grep -q "pyyaml"; then
  echo "Installing required Python packages..."
  pip install pyyaml
fi

echo "=== SKR Integration Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Add the skr_metadata macro to your models"
echo "2. Run 'dbt run' to generate metadata"
echo "3. Check the generated metadata files in $SKR_DIR/metadata"
echo "4. Integrate with Kalaw using the SKR indexer"
echo ""