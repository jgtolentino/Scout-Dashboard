#!/usr/bin/env python3
"""
Headless OAuth Flow Handler for Shogun
Handles OAuth authorization flow without requiring browser interaction
"""

import os
import sys
import json
import time
import logging
import urllib.parse
import webbrowser
import http.server
import socketserver
import threading
from datetime import datetime
from pathlib import Path

import requests

# Configure logging
def setup_logging(log_file):
    """Set up logging to file"""
    log_dir = os.path.dirname(log_file)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] [Shogun] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Add console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter('[Shogun] %(message)s'))
    logging.getLogger('').addHandler(console)

# Global variables
authorization_code = None
server_running = True

class OAuthCallbackHandler(http.server.SimpleHTTPRequestHandler):
    """Handler for OAuth callback"""
    
    def do_GET(self):
        """Handle GET request to callback URL"""
        global authorization_code, server_running
        
        # Parse the query parameters
        query = urllib.parse.urlparse(self.path).query
        if query:
            params = urllib.parse.parse_qs(query)
            if 'code' in params:
                authorization_code = params['code'][0]
                logging.info("Authorization code received")
                
                # Send a response to the browser
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                response = f"""
                <html>
                <head><title>Authorization Successful</title></head>
                <body>
                    <h1>Authorization Successful</h1>
                    <p>You have successfully authorized the Pulser Mail integration.</p>
                    <p>You can now close this window and return to the terminal.</p>
                    <script>
                        setTimeout(function() {{
                            window.close();
                        }}, 5000);
                    </script>
                </body>
                </html>
                """
                
                self.wfile.write(response.encode())
                
                # Stop the server after handling the request
                server_running = False
            elif 'error' in params:
                error = params['error'][0]
                logging.error(f"Authorization error: {error}")
                
                # Send an error response to the browser
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                response = f"""
                <html>
                <head><title>Authorization Failed</title></head>
                <body>
                    <h1>Authorization Failed</h1>
                    <p>Error: {error}</p>
                    <p>Please try again.</p>
                </body>
                </html>
                """
                
                self.wfile.write(response.encode())
                
                # Stop the server after handling the request
                server_running = False
        else:
            # Send a 404 response for other paths
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            response = """
            <html>
            <head><title>Not Found</title></head>
            <body>
                <h1>Not Found</h1>
                <p>The requested resource was not found.</p>
            </body>
            </html>
            """
            
            self.wfile.write(response.encode())
    
    def log_message(self, format, *args):
        """Override default logging to use our logger"""
        logging.debug(f"Server: {format % args}")

def start_callback_server():
    """Start the callback server to receive the authorization code"""
    global authorization_code, server_running
    
    # Reset global variables
    authorization_code = None
    server_running = True
    
    # Create and start the server
    handler = OAuthCallbackHandler
    
    # Try different ports if 8000 is in use
    port = 8000
    max_attempts = 5
    attempts = 0
    
    while attempts < max_attempts:
        try:
            server = socketserver.TCPServer(("", port), handler)
            break
        except OSError:
            attempts += 1
            port += 1
            if attempts >= max_attempts:
                logging.error(f"Failed to start server after {max_attempts} attempts")
                return None
    
    logging.info(f"Starting callback server on http://localhost:{port}")
    
    # Run the server in a separate thread
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    # Wait for the authorization code or timeout
    timeout = 300  # 5 minutes
    start_time = time.time()
    
    while server_running and time.time() - start_time < timeout:
        time.sleep(0.1)
    
    # Stop the server
    server.shutdown()
    server_thread.join()
    
    if not authorization_code and server_running:
        logging.error("Timeout waiting for authorization code")
    
    return authorization_code

def get_authorization_url(provider_config, client_id, scopes, redirect_uri):
    """Get the authorization URL for the user to visit"""
    auth_url = provider_config['auth_url']
    scopes_str = " ".join(scopes) if isinstance(scopes, list) else scopes
    
    # For server-based applications, use Zoho's format
    params = {
        "client_id": client_id,
        "response_type": "code",
        "scope": scopes_str,
        "access_type": "offline",
        "redirect_uri": redirect_uri
    }
    
    # Build the URL
    url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    return url

def exchange_code_for_tokens(provider_config, client_id, client_secret, code, redirect_uri):
    """Exchange the authorization code for access and refresh tokens"""
    token_url = provider_config['token_url']
    
    params = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri
    }
    
    try:
        response = requests.post(token_url, data=params)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logging.error(f"Error exchanging code for tokens: {e}")
        if hasattr(e, 'response') and e.response:
            logging.error(f"Response: {e.response.text}")
        return None

def save_credentials(credentials, credentials_path):
    """Save credentials to a file"""
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(credentials_path), exist_ok=True)
    
    with open(credentials_path, 'w') as f:
        json.dump(credentials, f, indent=2)
    
    logging.info(f"Credentials saved to {credentials_path}")

def load_credentials(credentials_path):
    """Load credentials from a file"""
    try:
        with open(credentials_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        logging.error(f"Invalid JSON in credentials file")
        return {}

def handle_headless_flow(flow_config, log_file):
    """
    Handle headless OAuth flow
    
    Args:
        flow_config: Dictionary with flow configuration
        log_file: Path to log file
    
    Returns:
        Dictionary with success/failure status and details
    """
    # Set up logging
    setup_logging(log_file)
    
    logging.info(f"Initiating OAuth headless flow for {flow_config['provider']}")
    
    # Get configuration
    provider = flow_config['provider']
    provider_config = flow_config['providers'][provider]
    redirect_uri = flow_config['redirect_uri']
    scopes = flow_config['scopes']
    credentials_path = os.path.expanduser(flow_config['credentials_path'])
    
    # Get client ID and secret from environment
    client_id_env = provider_config['client_env']
    client_secret_env = provider_config['secret_env']
    
    client_id = os.environ.get(client_id_env)
    client_secret = os.environ.get(client_secret_env)
    
    if not client_id or not client_secret:
        logging.error(f"Missing environment variables: {client_id_env} and/or {client_secret_env}")
        return {
            "success": False,
            "error": "Missing environment variables",
            "details": {
                "missing_vars": [var for var in [client_id_env, client_secret_env] if not os.environ.get(var)]
            }
        }
    
    # Load existing credentials
    credentials = load_credentials(credentials_path)
    
    # Update client ID and secret
    credentials['client_id'] = client_id
    credentials['client_secret'] = client_secret
    
    # Get authorization URL
    auth_url = get_authorization_url(provider_config, client_id, scopes, redirect_uri)
    
    # Start the callback server
    logging.info(f"Starting callback server to receive the authorization code...")
    
    # Open the authorization URL in the browser
    logging.info(f"Opening browser for authorization: {auth_url}")
    webbrowser.open(auth_url)
    
    # Wait for the authorization code
    code = start_callback_server()
    
    if not code:
        logging.error("No authorization code received")
        return {
            "success": False,
            "error": "No authorization code received",
            "details": {}
        }
    
    # Exchange the code for tokens
    logging.info("Exchanging authorization code for tokens...")
    token_data = exchange_code_for_tokens(provider_config, client_id, client_secret, code, redirect_uri)
    
    if not token_data:
        logging.error("Failed to exchange code for tokens")
        return {
            "success": False,
            "error": "Failed to exchange code for tokens",
            "details": {}
        }
    
    logging.info("Tokens received successfully")
    
    # Update and save credentials
    credentials.update({
        "refresh_token": token_data.get('refresh_token'),
        "access_token": token_data.get('access_token'),
        "token_type": token_data.get('token_type', 'Zoho-oauthtoken'),
        "last_updated": datetime.now().isoformat()
    })
    
    save_credentials(credentials, credentials_path)
    
    logging.info("OAuth flow completed successfully")
    
    return {
        "success": True,
        "details": {
            "provider": provider,
            "credentials_path": credentials_path,
            "scopes": scopes
        }
    }

# Test function for standalone execution
def main():
    """Test function for standalone execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test headless OAuth flow")
    parser.add_argument("--provider", default="zoho", help="Provider name")
    parser.add_argument("--credentials", default="~/.pulser/zoho_credentials.json", help="Path to credentials file")
    parser.add_argument("--log", default="~/.pulser/logs/shogun_oauth.log", help="Path to log file")
    
    args = parser.parse_args()
    
    # Example configuration
    flow_config = {
        "provider": args.provider,
        "redirect_uri": "http://localhost:8000/callback",
        "scopes": ["ZohoMail.accounts.READ", "ZohoMail.messages.ALL"],
        "credentials_path": args.credentials,
        "providers": {
            "zoho": {
                "auth_url": "https://accounts.zoho.com/oauth/v2/auth",
                "token_url": "https://accounts.zoho.com/oauth/v2/token",
                "client_env": "PULSER_ZOHO_CLIENT_ID",
                "secret_env": "PULSER_ZOHO_CLIENT_SECRET"
            }
        }
    }
    
    # Run the flow
    result = handle_headless_flow(flow_config, args.log)
    
    print(f"Result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    main()