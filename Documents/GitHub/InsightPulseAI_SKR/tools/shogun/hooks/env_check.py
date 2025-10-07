#!/usr/bin/env python3
"""
Environment Check Hook for Shogun
Validates required environment variables are set before proceeding
"""

import os
import logging

def check_required_env(flow_config, **kwargs):
    """
    Check required environment variables are set
    
    Args:
        flow_config: Dictionary with flow configuration
        
    Returns:
        Dictionary with success/failure status and details
    """
    provider = flow_config['provider']
    provider_config = flow_config['providers'][provider]
    
    # Check client ID and secret environment variables
    client_id_env = provider_config['client_env']
    client_secret_env = provider_config['secret_env']
    
    missing_vars = []
    
    if not os.environ.get(client_id_env):
        missing_vars.append(client_id_env)
    
    if not os.environ.get(client_secret_env):
        missing_vars.append(client_secret_env)
    
    if missing_vars:
        logging.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return {
            "success": False,
            "error": "Missing required environment variables",
            "details": {
                "missing_vars": missing_vars
            }
        }
    
    logging.info(f"All required environment variables are set")
    return {
        "success": True,
        "details": {}
    }