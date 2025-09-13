#!/usr/bin/env python3
"""
Pulser Deployment Verification Utility

Verifies that a Pulser deployment is properly configured and accessible.
"""

import re
import os
import sys
import time
import socket
import logging
import requests
import warnings
from urllib3.exceptions import NotOpenSSLWarning

# Suppress LibreSSL warnings
warnings.simplefilter("ignore", NotOpenSSLWarning)
warnings.filterwarnings("ignore", message=".*LibreSSL.*")
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("pulser-verify")

def verify_vercel(domain: str = "pulser-ai.app", verbose: bool = False):
    """
    Verify a Vercel deployment for Pulser
    
    Args:
        domain: Domain name to verify
        verbose: If True, print detailed information
        
    Returns:
        Dictionary of verification results
    """
    if verbose:
        logger.info(f"Verifying deployment at {domain}")
    
    results = {}
    
    # Set timeout for all requests
    timeout = 10
    
    # Step 1: Check DNS resolution
    try:
        ip_address = socket.gethostbyname(domain)
        results["DNS"] = f"✅ DNS resolves to {ip_address}"
        if verbose:
            logger.info(f"DNS resolution successful: {domain} resolves to {ip_address}")
    except socket.gaierror:
        results["DNS"] = f"❌ Failed to resolve domain"
        if verbose:
            logger.error(f"DNS resolution failed for {domain}")
    
    # Step 2: Check HTTPS access
    try:
        response = requests.get(f"https://{domain}", timeout=timeout)
        if response.status_code == 200:
            results["HTTPS"] = f"✅ Site reachable with 200 OK"
            if verbose:
                logger.info(f"HTTPS check successful: {domain} returned status code 200")
        else:
            results["HTTPS"] = f"⚠️ Site returned status {response.status_code}"
            if verbose:
                logger.warning(f"HTTPS check warning: {domain} returned status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        results["HTTPS"] = f"❌ Failed to connect: {str(e)}"
        if verbose:
            logger.error(f"HTTPS check failed: {e}")
    
    # Step 3: Check www redirect
    try:
        www_domain = f"www.{domain}"
        try:
            socket.gethostbyname(www_domain)
            # www domain exists, check if it redirects to non-www
            try:
                response = requests.get(f"https://{www_domain}", timeout=timeout, allow_redirects=False)
                if response.status_code in (301, 302, 307, 308):
                    redirect_url = response.headers.get('Location', '')
                    if re.search(rf"https?://{re.escape(domain)}", redirect_url):
                        results["www_redirect"] = f"✅ www redirects to {domain}"
                        if verbose:
                            logger.info(f"WWW redirect check successful: {www_domain} redirects to {domain}")
                    else:
                        results["www_redirect"] = f"⚠️ www redirects to {redirect_url}"
                        if verbose:
                            logger.warning(f"WWW redirect check warning: {www_domain} redirects to unexpected URL {redirect_url}")
                else:
                    results["www_redirect"] = f"⚠️ www domain active but no redirect"
                    if verbose:
                        logger.warning(f"WWW redirect check warning: {www_domain} active but doesn't redirect")
            except requests.exceptions.RequestException:
                results["www_redirect"] = f"⚠️ www domain resolves but connection failed"
                if verbose:
                    logger.warning(f"WWW redirect check warning: {www_domain} resolves but connection failed")
        except socket.gaierror:
            results["www_redirect"] = f"ℹ️ www subdomain not configured"
            if verbose:
                logger.info(f"WWW redirect check: {www_domain} not configured")
    except Exception as e:
        results["www_redirect"] = f"❌ Error checking www: {str(e)}"
        if verbose:
            logger.error(f"WWW redirect check error: {e}")
    
    # Step 4: Check API endpoint
    try:
        api_url = f"https://{domain}/api/health"
        response = requests.get(api_url, timeout=timeout)
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    results["API"] = f"✅ API health endpoint working"
                    if verbose:
                        logger.info(f"API check successful: {api_url} returned status 'ok'")
                else:
                    results["API"] = f"⚠️ API returned unexpected data"
                    if verbose:
                        logger.warning(f"API check warning: {api_url} returned unexpected data: {data}")
            except ValueError:
                results["API"] = f"⚠️ API response not valid JSON"
                if verbose:
                    logger.warning(f"API check warning: {api_url} response not valid JSON")
        else:
            results["API"] = f"⚠️ API returned status {response.status_code}"
            if verbose:
                logger.warning(f"API check warning: {api_url} returned status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        results["API"] = f"ℹ️ API health endpoint not found"
        if verbose:
            logger.info(f"API check: health endpoint not available: {e}")
    
    # Step 5: Check configuration
    try:
        config_url = f"https://{domain}/api/config"
        response = requests.get(config_url, timeout=timeout)
        if response.status_code == 200:
            try:
                config = response.json()
                version = config.get("version", "unknown")
                results["Config"] = f"✅ Running version {version}"
                if verbose:
                    logger.info(f"Config check successful: running version {version}")
            except ValueError:
                results["Config"] = f"⚠️ Config endpoint not returning valid JSON"
                if verbose:
                    logger.warning(f"Config check warning: endpoint not returning valid JSON")
        else:
            results["Config"] = f"ℹ️ Config endpoint returned status {response.status_code}"
            if verbose:
                logger.info(f"Config check: endpoint returned status code {response.status_code}")
    except requests.exceptions.RequestException:
        results["Config"] = f"ℹ️ Config endpoint not available"
        if verbose:
            logger.info(f"Config check: endpoint not available")
    
    return results

def main():
    """Command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Verify a Pulser deployment")
    parser.add_argument("domain", nargs="?", default="pulser-ai.app", help="Domain name to verify")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print verbose information")
    
    args = parser.parse_args()
    
    results = verify_vercel(args.domain, args.verbose)
    
    # Print results
    for key, value in results.items():
        print(f"[{key}] {value}")
    
    # Check if any checks failed
    if any("❌" in value for value in results.values()):
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())