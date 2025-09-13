#!/usr/bin/env python3
"""
authorize_google_oauth.py - Authorize with Google using client secret

This script completes the OAuth flow using the client secret file
and stores the resulting tokens for use in InsightPulseAI.
"""

import os
import sys
import json
import webbrowser
import http.server
import socketserver
import urllib.parse
import threading
from pathlib import Path

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow, Flow
except ImportError:
    print("Error: Google API libraries not installed")
    print("Run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

# Define paths
HOME_DIR = Path.home()
SKR_DIR = HOME_DIR / "Documents/GitHub/InsightPulseAI_SKR"
CONFIG_DIR = SKR_DIR / "config"
OAUTH_DIR = CONFIG_DIR / "oauth"
CLIENT_SECRET_FILE = OAUTH_DIR / "google_oauth_client_secret.json"
TOKENS_DIR = SKR_DIR / ".tokens"
ENV_FILE = SKR_DIR / ".env.google"
TOKENS_FILE = TOKENS_DIR / "google_tokens.json"

# Default scopes
SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
]

def load_env():
    """Load environment variables from .env.google file"""
    if not ENV_FILE.exists():
        print(f"Error: Environment file not found at {ENV_FILE}")
        print("Run configure_google_oauth.py first to create the environment file")
        sys.exit(1)
        
    env = {}
    with open(ENV_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
                
            key, value = line.split('=', 1)
            env[key.strip()] = value.strip().strip('"\'')
            
    return env

class OAuth2CallbackHandler(http.server.SimpleHTTPRequestHandler):
    """Handler for OAuth2 callback"""
    def __init__(self, *args, **kwargs):
        self.flow = kwargs.pop('flow', None)
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET request"""
        # Parse query parameters
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        if 'code' in params:
            code = params['code'][0]
            print("\nAuthorization code received!")
            
            try:
                self.flow.fetch_token(code=code)
                credentials = self.flow.credentials
                
                # Save credentials
                TOKENS_DIR.mkdir(parents=True, exist_ok=True)
                os.chmod(str(TOKENS_DIR), 0o700)
                
                with open(TOKENS_FILE, 'w') as f:
                    f.write(credentials.to_json())
                
                print(f"Credentials saved to {TOKENS_FILE}")
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                response = """
                <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 50px;
                            text-align: center;
                        }
                        .success {
                            color: green;
                            font-size: 24px;
                            margin: 30px 0;
                        }
                        .info {
                            color: #333;
                            font-size: 16px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>InsightPulseAI Google Integration</h1>
                    <p class="success">Authentication Successful!</p>
                    <p class="info">You have successfully authenticated with Google.</p>
                    <p class="info">You can now close this window and return to the terminal.</p>
                </body>
                </html>
                """
                
                self.wfile.write(response.encode())
                
                # Signal the server to shut down
                def shutdown_server():
                    self.server.shutdown()
                
                threading.Thread(target=shutdown_server).start()
                
            except Exception as e:
                print(f"Error exchanging code for token: {e}")
                
                # Error response
                self.send_response(500)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                error_response = f"""
                <html>
                <head>
                    <title>Authentication Error</title>
                    <style>
                        body {{
                            font-family: Arial, sans-serif;
                            margin: 50px;
                            text-align: center;
                        }}
                        .error {{
                            color: red;
                            font-size: 24px;
                            margin: 30px 0;
                        }}
                        .info {{
                            color: #333;
                            font-size: 16px;
                            margin: 20px 0;
                        }}
                    </style>
                </head>
                <body>
                    <h1>InsightPulseAI Google Integration</h1>
                    <p class="error">Authentication Error</p>
                    <p class="info">Error: {e}</p>
                    <p class="info">Please try again or check your application settings.</p>
                </body>
                </html>
                """
                
                self.wfile.write(error_response.encode())
        else:
            # Error handling
            error_msg = params.get('error', ['Unknown error'])[0]
            
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            error_response = f"""
            <html>
            <head>
                <title>Authentication Error</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        margin: 50px;
                        text-align: center;
                    }}
                    .error {{
                        color: red;
                        font-size: 24px;
                        margin: 30px 0;
                    }}
                    .info {{
                        color: #333;
                        font-size: 16px;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <h1>InsightPulseAI Google Integration</h1>
                <p class="error">Authentication Error</p>
                <p class="info">Error: {error_msg}</p>
                <p class="info">Please try again or check your application settings.</p>
            </body>
            </html>
            """
            
            self.wfile.write(error_response.encode())
    
    def log_message(self, format, *args):
        # Silence server logs
        pass

def authorize():
    """Authorize with Google using client secret"""
    env = load_env()
    
    client_type = env.get('GOOGLE_CLIENT_TYPE')
    client_secret_file = env.get('GOOGLE_CLIENT_SECRET_FILE', str(CLIENT_SECRET_FILE))
    
    print(f"Using client secret file: {client_secret_file}")
    
    # Try a different port if 8000 is in use
    port = 8888
    redirect_uri = f"http://localhost:{port}"
    
    try:
        # Load the client secret file
        with open(client_secret_file, 'r') as f:
            client_config = json.load(f)
        
        # Use web flow
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        
        # Generate authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        print(f"\nOpening browser to authorize InsightPulseAI...")
        print(f"Auth URL: {auth_url}")
        
        # Open browser
        webbrowser.open(auth_url)
        
        # Start local server
        server_address = ('', port)
        handler = lambda *args, **kwargs: OAuth2CallbackHandler(*args, flow=flow, **kwargs)
        
        print(f"\nWaiting for authorization on port {port}...")
        print("After approving in the browser, you'll be redirected to localhost.")
        
        with socketserver.TCPServer(server_address, handler) as httpd:
            httpd.serve_forever()
        
        print("\nAuthorization completed successfully!")
        
    except Exception as e:
        print(f"Error during authorization: {e}")
        sys.exit(1)

def main():
    print("=== Google OAuth Authorization ===")
    
    # Authorize
    authorize()
    
    print("\nNext steps:")
    print(f"1. You can now use the Google API in your applications")
    print(f"2. Tokens are stored securely in: {TOKENS_FILE}")
    print(f"3. To revoke access, visit: https://myaccount.google.com/permissions")

if __name__ == "__main__":
    main()