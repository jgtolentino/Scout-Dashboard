#!/usr/bin/env python3
"""
Fix Claudia Sync Skip Issues

This script identifies and processes YAML files that are being skipped during Claudia sync
by updating their format to match Claudia's expected schema.
"""

import os
import sys
import re
import yaml
import logging
import glob
from typing import List, Dict, Any, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("sync-fix")

class SyncFixer:
    """Handles fixing of skipped YAML files during sync"""
    
    def __init__(self, skr_root: Optional[str] = None):
        """Initialize with SKR root directory"""
        # Default to parent directory if none specified
        if not skr_root:
            # Get path to InsightPulseAI_SKR root (parent of tools)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            skr_root = os.path.dirname(os.path.dirname(current_dir))
        
        self.skr_root = skr_root
        logger.info(f"Using SKR root directory: {skr_root}")
    
    def find_skipped_files(self, log_file: Optional[str] = None) -> List[str]:
        """
        Find files that are being skipped during sync
        Either from a log file or by pattern matching common skipped files
        """
        skipped_files = []
        
        if log_file and os.path.exists(log_file):
            # Parse log file for skipped files
            with open(log_file, 'r') as f:
                for line in f:
                    match = re.search(r'Skipped unrecognized file: (.+)', line)
                    if match:
                        skipped_file = match.group(1).strip()
                        skipped_files.append(skipped_file)
        else:
            # Look for common skipped files by pattern
            common_skipped = ['skr_docs.yaml', 'claudia_router.yaml', 'conventions.yaml']
            for file_pattern in common_skipped:
                # Search in the SKR root directory recursively
                matches = glob.glob(f"{self.skr_root}/**/{file_pattern}", recursive=True)
                skipped_files.extend(matches)
        
        return skipped_files
    
    def validate_yaml(self, file_path: str) -> bool:
        """Check if a YAML file is valid"""
        try:
            with open(file_path, 'r') as f:
                yaml.safe_load(f)
            return True
        except yaml.YAMLError as e:
            logger.error(f"Invalid YAML in {file_path}: {e}")
            return False
    
    def has_required_fields(self, data: Dict[str, Any]) -> bool:
        """Check if YAML has the required fields for Claudia sync"""
        # Check for minimum required fields (adjust based on actual requirements)
        required_fields = ['name', 'description']
        return all(field in data for field in required_fields)
    
    def fix_yaml_format(self, file_path: str) -> bool:
        """Fix YAML format to match Claudia's expected schema"""
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return False
            
        try:
            # Read the original file
            with open(file_path, 'r') as f:
                try:
                    data = yaml.safe_load(f)
                except yaml.YAMLError as e:
                    logger.error(f"Failed to parse {file_path}: {e}")
                    return False
            
            # Create backup
            backup_path = f"{file_path}.bak"
            with open(backup_path, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
            logger.info(f"Created backup: {backup_path}")
            
            # Fix the format
            fixed_data = self._apply_fixes(data, file_path)
            
            # Write fixed content
            with open(file_path, 'w') as f:
                yaml.dump(fixed_data, f, default_flow_style=False)
            
            logger.info(f"✅ Fixed: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to fix {file_path}: {e}")
            return False
    
    def _apply_fixes(self, data: Dict[str, Any], file_path: str) -> Dict[str, Any]:
        """Apply fixes to the YAML data structure"""
        filename = os.path.basename(file_path)
        
        # If data is not a dictionary, convert it to one
        if not isinstance(data, dict):
            data = {"content": data, "name": filename, "description": f"Auto-fixed from {filename}"}
        
        # Ensure required fields
        if "name" not in data:
            data["name"] = os.path.splitext(filename)[0]
        
        if "description" not in data:
            data["description"] = f"Document generated from {filename}"
        
        # Handle specific file types differently
        if "skr_docs" in filename:
            # Special handling for SKR docs
            if "schema_version" not in data:
                data["schema_version"] = "1.0"
            
            if "sections" not in data and "content" in data:
                # Convert content to sections format
                data["sections"] = [{"title": "Content", "content": data.pop("content")}]
        
        elif "router" in filename:
            # Ensure router files have routes
            if "routes" not in data:
                data["routes"] = []
                
            # Ensure each route has required fields
            for route in data.get("routes", []):
                if "path" not in route:
                    route["path"] = "/"
                if "handler" not in route:
                    route["handler"] = "default"
        
        # Add metadata field if missing
        if "metadata" not in data:
            data["metadata"] = {"sync_enabled": True, "sync_priority": 5}
        
        return data
    
    def process_all_skipped(self, log_file: Optional[str] = None) -> None:
        """Find and fix all skipped files"""
        skipped_files = self.find_skipped_files(log_file)
        
        if not skipped_files:
            logger.info("No skipped files found")
            return
        
        logger.info(f"Found {len(skipped_files)} potentially skipped files")
        
        fixed_count = 0
        for file_path in skipped_files:
            # Convert to absolute path if needed
            if not os.path.isabs(file_path):
                file_path = os.path.join(self.skr_root, file_path)
            
            # Skip if file doesn't exist
            if not os.path.exists(file_path):
                logger.warning(f"File not found: {file_path}")
                continue
                
            logger.info(f"Processing: {file_path}")
            
            if self.fix_yaml_format(file_path):
                fixed_count += 1
        
        logger.info(f"Fixed {fixed_count} out of {len(skipped_files)} files")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix Claudia sync skip issues")
    parser.add_argument("--log", type=str, help="Path to Claudia sync log file")
    parser.add_argument("--skr", type=str, help="Path to SKR root directory")
    parser.add_argument("--file", type=str, help="Fix a specific file")
    
    args = parser.parse_args()
    
    fixer = SyncFixer(args.skr)
    
    if args.file:
        # Fix a specific file
        logger.info(f"Fixing specific file: {args.file}")
        if fixer.fix_yaml_format(args.file):
            logger.info("File fixed successfully")
        else:
            logger.error("Failed to fix file")
            return 1
    else:
        # Process all skipped files
        fixer.process_all_skipped(args.log)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())