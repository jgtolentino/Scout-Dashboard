#!/usr/bin/env python3
"""
Error Logger Hook for Shogun
Logs detailed error information when authentication fails
"""

import os
import logging
import json
from datetime import datetime

def log_error(flow_config, error_details, **kwargs):
    """
    Log detailed error information
    
    Args:
        flow_config: Dictionary with flow configuration
        error_details: Dictionary with error details
        
    Returns:
        Dictionary with success/failure status and details
    """
    provider = flow_config.get('provider', 'unknown')
    error_log_path = os.path.expanduser(f"~/.pulser/logs/auth_errors_{provider}.log")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(error_log_path), exist_ok=True)
    
    # Log the error details
    timestamp = datetime.now().isoformat()
    error_entry = {
        "timestamp": timestamp,
        "provider": provider,
        "error": error_details.get('error', 'Unknown error'),
        "details": error_details.get('details', {})
    }
    
    try:
        # Append to the error log
        with open(error_log_path, 'a') as f:
            f.write(f"{json.dumps(error_entry)}\n")
        
        logging.error(f"Authentication error logged to {error_log_path}")
        return {
            "success": True,
            "details": {
                "error_log_path": error_log_path
            }
        }
    except Exception as e:
        logging.error(f"Error logging authentication error: {e}")
        return {
            "success": False,
            "error": f"Error logging authentication error: {str(e)}",
            "details": {}
        }