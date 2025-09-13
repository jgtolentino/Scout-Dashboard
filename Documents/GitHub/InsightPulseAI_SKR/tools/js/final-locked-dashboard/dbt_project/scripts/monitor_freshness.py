#!/usr/bin/env python
"""
dbt Data Freshness Monitor

This script monitors the freshness of dbt datasets and generates a metadata.json file
that can be used to display freshness information in the dashboard.
"""
import os
import sys
import json
import yaml
import glob
import argparse
import datetime
import hashlib
from pathlib import Path

# Constants
DATA_DIR = "../assets/data"
METADATA_FILE = "../assets/data/metadata.json"
FRESHNESS_THRESHOLD_HOURS = 24  # Data older than this is considered stale

def get_file_stats(file_path):
    """Get file statistics (size, modification time, etc.)"""
    try:
        stats = os.stat(file_path)
        file_size = stats.st_size
        mod_time = datetime.datetime.fromtimestamp(stats.st_mtime)
        
        # Calculate file hash (first 1KB for large files)
        with open(file_path, 'rb') as f:
            content = f.read(1024)
            file_hash = hashlib.md5(content).hexdigest()
            
        # Read JSON to get row count
        with open(file_path, 'r') as f:
            data = json.load(f)
            row_count = len(data) if isinstance(data, list) else 1
            
        return {
            'size_bytes': file_size,
            'last_modified': mod_time.isoformat(),
            'hash': file_hash,
            'row_count': row_count
        }
    except Exception as e:
        print(f"Error getting stats for {file_path}: {e}")
        return {
            'size_bytes': 0,
            'last_modified': datetime.datetime.now().isoformat(),
            'hash': '',
            'row_count': 0,
            'error': str(e)
        }

def get_dataset_freshness(dataset_path):
    """Determine if a dataset is fresh based on modification time"""
    try:
        stats = os.stat(dataset_path)
        mod_time = datetime.datetime.fromtimestamp(stats.st_mtime)
        now = datetime.datetime.now()
        
        # Calculate age in hours
        age_hours = (now - mod_time).total_seconds() / 3600
        
        is_fresh = age_hours < FRESHNESS_THRESHOLD_HOURS
        
        return {
            'is_fresh': is_fresh,
            'age_hours': round(age_hours, 2),
            'last_update': mod_time.isoformat()
        }
    except Exception as e:
        print(f"Error checking freshness for {dataset_path}: {e}")
        return {
            'is_fresh': False,
            'age_hours': 999,
            'last_update': datetime.datetime.now().isoformat(),
            'error': str(e)
        }

def get_dbt_metadata(target_dir):
    """Get metadata from dbt artifacts"""
    manifest_path = os.path.join(target_dir, "manifest.json")
    
    # Check if manifest exists
    if not os.path.exists(manifest_path):
        print(f"Warning: dbt manifest not found at {manifest_path}")
        return {}
    
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            
        # Get metadata about the dbt run
        metadata = manifest.get('metadata', {})
        
        # Extract model details
        models = {}
        for node_id, node in manifest.get('nodes', {}).items():
            if node.get('resource_type') == 'model':
                model_name = node.get('name')
                models[model_name] = {
                    'name': model_name,
                    'schema': node.get('schema'),
                    'database': node.get('database'),
                    'materialization': node.get('config', {}).get('materialized', 'view'),
                    'description': node.get('description', ''),
                    'path': node.get('path', '')
                }
        
        return {
            'project_name': metadata.get('project_name', ''),
            'generated_at': metadata.get('generated_at', ''),
            'dbt_version': metadata.get('dbt_version', ''),
            'models': models
        }
    except Exception as e:
        print(f"Error loading dbt metadata: {e}")
        return {}

def generate_metadata(data_dir, target_dir, output_file):
    """Generate metadata.json file with freshness information"""
    # Get list of JSON files in data directory
    json_files = glob.glob(os.path.join(data_dir, "*.json"))
    
    # Skip metadata.json itself
    json_files = [f for f in json_files if os.path.basename(f) != "metadata.json"]
    
    # Get stats for each file
    datasets = {}
    for file_path in json_files:
        dataset_name = os.path.splitext(os.path.basename(file_path))[0]
        stats = get_file_stats(file_path)
        freshness = get_dataset_freshness(file_path)
        
        datasets[dataset_name] = {
            'stats': stats,
            'freshness': freshness
        }
    
    # Get dbt metadata
    dbt_metadata = get_dbt_metadata(target_dir)
    
    # Combine all metadata
    metadata = {
        'generated_at': datetime.datetime.now().isoformat(),
        'freshness_threshold_hours': FRESHNESS_THRESHOLD_HOURS,
        'datasets': datasets,
        'dbt': dbt_metadata
    }
    
    # Write metadata to file
    with open(output_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Metadata written to {output_file}")
    
    # Return summary
    return {
        'total_datasets': len(datasets),
        'fresh_datasets': sum(1 for ds in datasets.values() if ds['freshness']['is_fresh']),
        'stale_datasets': sum(1 for ds in datasets.values() if not ds['freshness']['is_fresh'])
    }

def main():
    global FRESHNESS_THRESHOLD_HOURS
    
    parser = argparse.ArgumentParser(description='Monitor dbt data freshness and generate metadata')
    parser.add_argument('--data-dir', default=DATA_DIR, help='Directory containing dataset JSON files')
    parser.add_argument('--target-dir', default='../target', help='Directory containing dbt artifacts')
    parser.add_argument('--output', default=METADATA_FILE, help='Output metadata.json file path')
    parser.add_argument('--threshold', type=int, default=FRESHNESS_THRESHOLD_HOURS, help='Freshness threshold in hours')
    
    args = parser.parse_args()
    
    # Update global threshold
    FRESHNESS_THRESHOLD_HOURS = args.threshold
    
    # Generate metadata
    summary = generate_metadata(args.data_dir, args.target_dir, args.output)
    
    # Print summary
    print("\nFreshness Summary:")
    print(f"Total datasets: {summary['total_datasets']}")
    print(f"Fresh datasets: {summary['fresh_datasets']}")
    print(f"Stale datasets: {summary['stale_datasets']}")
    
    # Return exit code based on freshness
    return 0 if summary['stale_datasets'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())