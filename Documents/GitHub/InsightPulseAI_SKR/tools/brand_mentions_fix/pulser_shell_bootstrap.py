#!/usr/bin/env python3
"""
Pulser Shell Bootstrap

Handles initialization for Pulser Shell, loading models and suppressing warnings.
"""

import os
import sys
import warnings
import logging
from urllib3.exceptions import NotOpenSSLWarning
from typing import Dict, Any

# Global context for the session
global_context = {}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("pulser-bootstrap")

# Suppress warnings globally
warnings.simplefilter("ignore", NotOpenSSLWarning)
warnings.filterwarnings("ignore", message=".*LibreSSL.*")
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["PYTHONWARNINGS"] = "ignore"

def load_mistral_once():
    """Load the Mistral model only once per session"""
    if "mistral_loaded" not in global_context:
        try:
            # This is a mock-up - in real implementation you'd connect to the actual model
            logger.info("Loading Mistral model once for this session...")
            
            # In real implementation:
            # import mistral
            # mistral.load_model("mistral")
            
            global_context["mistral_loaded"] = True
            logger.info("Mistral model loaded and cached for this session")
        except Exception as e:
            logger.error(f"Failed to load Mistral model: {e}")
            global_context["mistral_loaded"] = False

def get_bootstrap_config() -> Dict[str, Any]:
    """Get bootstrap configuration"""
    config = {
        "suppress_warnings": True,
        "cache_models": True,
        "default_model": "mistral",
        "default_mode": "prompt",
        "silent_mode": True  # Suppress model echo and reload announcements
    }
    
    # Read from .pulserrc if available
    rc_file = os.path.expanduser("~/.pulserrc")
    if os.path.exists(rc_file):
        try:
            with open(rc_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        key, value = line.split("=", 1)
                        if value.lower() in ("true", "yes", "1"):
                            config[key.strip()] = True
                        elif value.lower() in ("false", "no", "0"):
                            config[key.strip()] = False
                        else:
                            config[key.strip()] = value.strip()
        except Exception as e:
            logger.warning(f"Failed to read .pulserrc: {e}")
    
    return config

def initialize_environment():
    """Initialize the environment for Pulser shell"""
    config = get_bootstrap_config()
    
    # Set up the environment based on configuration
    if config["suppress_warnings"]:
        # Already done globally, but we can add more specific ones
        for warning_type in ["DeprecationWarning", "FutureWarning", "UserWarning"]:
            warnings.filterwarnings("ignore", category=eval(warning_type))
    
    # Cache models if enabled
    if config["cache_models"]:
        load_mistral_once()
    
    # Return the config for the shell to use
    return config

if __name__ == "__main__":
    # When run directly, just initialize and show status
    config = initialize_environment()
    print("Pulser shell bootstrap complete.")
    print(f"Using {config['default_model']} model in {config['default_mode']} mode.")