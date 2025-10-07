#!/usr/bin/env python
"""
Update Timestamps in JSON Datasets

This script updates the timestamps in our dataset JSON files to simulate
different data freshness scenarios for testing and development.
"""
import os
import sys
import json
import glob
import argparse
import datetime
import random
import time

def update_file_timestamps(file_path, days_ago=None, hours_ago=None, random_age=False):
    """Update the modification time of a file to simulate data freshness."""
    now = datetime.datetime.now()
    
    if random_age:
        # Randomly age files between 0-48 hours
        hours_old = random.uniform(0, 48)
        new_time = now - datetime.timedelta(hours=hours_old)
    elif days_ago is not None:
        new_time = now - datetime.timedelta(days=days_ago)
    elif hours_ago is not None:
        new_time = now - datetime.timedelta(hours=hours_ago)
    else:
        return False
    
    # Convert to timestamp for os.utime
    mod_time = new_time.timestamp()
    # Update file's modified timestamp
    os.utime(file_path, (mod_time, mod_time))
    
    print(f"Updated {os.path.basename(file_path)} to {new_time.strftime('%Y-%m-%d %H:%M:%S')} ({(now - new_time).total_seconds() / 3600:.1f} hours old)")
    return True

def update_json_content_timestamps(file_path, days_ago=None, hours_ago=None):
    """Update timestamp fields within JSON content to match file modification time."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Skip if not a list or dictionary
        if not isinstance(data, (list, dict)):
            return False
            
        # Determine what timestamp to use
        now = datetime.datetime.now()
        if days_ago is not None:
            new_time = now - datetime.timedelta(days=days_ago)
        elif hours_ago is not None:
            new_time = now - datetime.timedelta(hours=hours_ago)
        else:
            return False
            
        timestamp_str = new_time.isoformat()
        
        # Check if it's array or object
        if isinstance(data, list):
            # Update array items if they have timestamp fields
            for item in data:
                if isinstance(item, dict):
                    # Look for common timestamp field names
                    for field in ['generated_at', 'createdAt', 'updatedAt', 'timestamp', 'lastUpdate', 'GeneratedAt']:
                        if field in item:
                            item[field] = timestamp_str
        elif isinstance(data, dict):
            # Update object timestamp fields
            for field in ['generated_at', 'createdAt', 'updatedAt', 'timestamp', 'lastUpdate', 'GeneratedAt']:
                if field in data:
                    data[field] = timestamp_str
            
            # Special handling for metadata.json which has a nested structure
            if 'datasets' in data:
                for dataset in data['datasets'].values():
                    if 'freshness' in dataset:
                        dataset['freshness']['last_update'] = timestamp_str
        
        # Write the updated JSON back to the file
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Updated timestamps in JSON content for {os.path.basename(file_path)}")
        return True
    except Exception as e:
        print(f"Error updating JSON content in {file_path}: {e}")
        return False

def setup_freshness_scenario(data_dir, scenario='mixed'):
    """Set up a specific freshness scenario for all data files."""
    json_files = glob.glob(os.path.join(data_dir, "*.json"))
    
    # Skip metadata.json itself - we'll update it last
    non_metadata_files = [f for f in json_files if os.path.basename(f) != "metadata.json"]
    metadata_file = os.path.join(data_dir, "metadata.json")
    
    if scenario == 'all_fresh':
        # All files fresh (less than 12 hours old)
        for file_path in non_metadata_files:
            hours_ago = random.uniform(0, 11)
            update_file_timestamps(file_path, hours_ago=hours_ago)
            update_json_content_timestamps(file_path, hours_ago=hours_ago)
    
    elif scenario == 'all_stale':
        # All files stale (more than 24 hours old)
        for file_path in non_metadata_files:
            hours_ago = random.uniform(25, 72)
            update_file_timestamps(file_path, hours_ago=hours_ago)
            update_json_content_timestamps(file_path, hours_ago=hours_ago)
    
    elif scenario == 'mixed':
        # Mix of fresh and stale files
        for i, file_path in enumerate(non_metadata_files):
            if i % 3 == 0:  # Make every third file stale
                hours_ago = random.uniform(25, 72)
            else:
                hours_ago = random.uniform(0, 11)
            update_file_timestamps(file_path, hours_ago=hours_ago)
            update_json_content_timestamps(file_path, hours_ago=hours_ago)
    
    elif scenario == 'critical':
        # Critical scenario - one file is very fresh, others are very stale
        # This simulates a partial update scenario that might need attention
        for i, file_path in enumerate(non_metadata_files):
            if i == 0:  # Only the first file is fresh
                hours_ago = 1
            else:
                hours_ago = random.uniform(48, 120)
            update_file_timestamps(file_path, hours_ago=hours_ago)
            update_json_content_timestamps(file_path, hours_ago=hours_ago)
    
    elif scenario == 'degrading':
        # Progressive degradation - files get increasingly stale
        total_files = len(non_metadata_files)
        for i, file_path in enumerate(non_metadata_files):
            # Scale from 1 hour old to 48 hours old based on position
            hours_ago = 1 + (47 * i / max(total_files - 1, 1))
            update_file_timestamps(file_path, hours_ago=hours_ago)
            update_json_content_timestamps(file_path, hours_ago=hours_ago)
    
    # Update metadata.json last (should always be fresh)
    if os.path.exists(metadata_file):
        update_file_timestamps(metadata_file, hours_ago=0.1)
        # No need to update content as it will be regenerated
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Update dataset timestamps for testing freshness monitoring')
    parser.add_argument('--data-dir', default='../assets/data', help='Directory containing dataset JSON files')
    parser.add_argument('--scenario', choices=['all_fresh', 'all_stale', 'mixed', 'critical', 'degrading'],
                        default='mixed', help='Freshness scenario to simulate')
    parser.add_argument('--file', help='Update a specific file instead of all files')
    parser.add_argument('--days-ago', type=int, help='Update timestamps to X days ago')
    parser.add_argument('--hours-ago', type=float, help='Update timestamps to X hours ago')
    parser.add_argument('--random', action='store_true', help='Randomly age files (0-48 hours)')
    
    args = parser.parse_args()
    
    # Normalize path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.normpath(os.path.join(project_dir, args.data_dir))
    
    if not os.path.exists(data_dir):
        print(f"Data directory does not exist: {data_dir}")
        return 1
    
    if args.file:
        # Update a specific file
        file_path = os.path.join(data_dir, args.file)
        if not os.path.exists(file_path):
            print(f"File does not exist: {file_path}")
            return 1
        
        success = update_file_timestamps(
            file_path, 
            days_ago=args.days_ago, 
            hours_ago=args.hours_ago,
            random_age=args.random
        )
        
        if success:
            update_json_content_timestamps(
                file_path,
                days_ago=args.days_ago, 
                hours_ago=args.hours_ago
            )
    else:
        # Set up a freshness scenario
        success = setup_freshness_scenario(data_dir, args.scenario)
    
    if success:
        print(f"Successfully updated timestamps using scenario: {args.scenario}")
        return 0
    else:
        print("Failed to update timestamps")
        return 1

if __name__ == '__main__':
    sys.exit(main())