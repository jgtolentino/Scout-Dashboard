#!/usr/bin/env python3
"""
Fallback Hook for Shogun
Switches to manual flow when headless flow fails
"""

import os
import sys
import logging
import subprocess
from datetime import datetime

def switch_to_manual_flow(flow_config, error_details, **kwargs):
    """
    Switch to manual flow when headless flow fails
    
    Args:
        flow_config: Dictionary with flow configuration
        error_details: Dictionary with error details
        
    Returns:
        Dictionary with success/failure status and details
    """
    provider = flow_config.get('provider', 'unknown')
    credentials_path = os.path.expanduser(flow_config.get('credentials_path', '~/.pulser/credentials.json'))
    
    logging.warning(f"Headless flow failed, switching to manual flow for {provider}")
    
    # Here we would launch an alternative flow
    # For example, running a script that handles manual token entry
    
    # For Zoho, we'll use our fallback script
    fallback_script = os.path.expanduser("~/run_zoho_setup.sh")
    
    if os.path.exists(fallback_script):
        try:
            logging.info(f"Launching fallback script: {fallback_script}")
            result = subprocess.run(
                [fallback_script], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                logging.info(f"Fallback script completed successfully")
                return {
                    "success": True,
                    "details": {
                        "fallback_script": fallback_script,
                        "credentials_path": credentials_path
                    }
                }
            else:
                logging.error(f"Fallback script failed with return code {result.returncode}")
                logging.error(f"Stderr: {result.stderr}")
                return {
                    "success": False,
                    "error": f"Fallback script failed with return code {result.returncode}",
                    "details": {
                        "stderr": result.stderr,
                        "fallback_script": fallback_script
                    }
                }
        except Exception as e:
            logging.error(f"Error running fallback script: {e}")
            return {
                "success": False,
                "error": f"Error running fallback script: {str(e)}",
                "details": {
                    "fallback_script": fallback_script
                }
            }
    else:
        logging.error(f"Fallback script not found: {fallback_script}")
        
        # Suggest manual steps
        print("\n--- Manual Setup Instructions ---")
        print(f"Headless authentication for {provider} failed.")
        print("Please follow these steps to manually set up authentication:")
        print("1. Get your client ID and client secret from the Zoho API Console")
        print("2. Create a credentials file at ~/.pulser/zoho_credentials.json with the following format:")
        print("""
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "access_token": "",
  "token_type": "Zoho-oauthtoken",
  "last_updated": ""
}
        """)
        print("3. Run the manual setup script: ~/run_zoho_setup.sh")
        
        return {
            "success": False,
            "error": "Fallback script not found",
            "details": {
                "fallback_script": fallback_script,
                "manual_steps_provided": True
            }
        }