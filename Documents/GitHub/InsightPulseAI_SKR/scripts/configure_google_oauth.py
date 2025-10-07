#!/usr/bin/env python3
"""
configure_google_oauth.py - Configure Google OAuth using client secret JSON

This script configures Google OAuth using the client secret JSON file
and sets up the necessary environment for InsightPulseAI.
"""

import os
import sys
import json
import shutil
from pathlib import Path

# Define paths
HOME_DIR = Path.home()
SKR_DIR = HOME_DIR / "Documents/GitHub/InsightPulseAI_SKR"
CONFIG_DIR = SKR_DIR / "config"
OAUTH_DIR = CONFIG_DIR / "oauth"
CLIENT_SECRET_FILE = OAUTH_DIR / "google_oauth_client_secret.json"
TOKENS_DIR = SKR_DIR / ".tokens"
ENV_FILE = SKR_DIR / ".env.google"

def setup_environment():
    """Set up environment for Google OAuth"""
    # Create tokens directory if it doesn't exist
    TOKENS_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(str(TOKENS_DIR), 0o700)  # Secure permissions
    
    print(f"Created secure tokens directory: {TOKENS_DIR}")
    
    # Check if client secret file exists
    if not CLIENT_SECRET_FILE.exists():
        print(f"Error: Client secret file not found at {CLIENT_SECRET_FILE}")
        print("Please download the client secret JSON file from Google Cloud Console")
        print("and save it to the location above.")
        sys.exit(1)
    
    # Load client secret file
    try:
        with open(CLIENT_SECRET_FILE, 'r') as f:
            client_secret = json.load(f)
        
        # Check if it's a valid client secret file
        if 'web' not in client_secret and 'installed' not in client_secret:
            print("Error: Invalid client secret file format")
            sys.exit(1)
            
        # Determine client type (web or installed)
        client_type = 'web' if 'web' in client_secret else 'installed'
        client_info = client_secret[client_type]
        
        client_id = client_info.get('client_id')
        client_secret = client_info.get('client_secret')
        
        if not client_id or not client_secret:
            print("Error: Missing client ID or secret in client secret file")
            sys.exit(1)
            
        print(f"Client type: {client_type}")
        print(f"Client ID: {client_id}")
        print(f"Client Secret: {'*' * len(client_secret)}")
        
        # Create .env.google file
        env_content = f"""# Google API Configuration
# Created by configure_google_oauth.py

GOOGLE_CLIENT_TYPE={client_type}
GOOGLE_CLIENT_ID={client_id}
GOOGLE_CLIENT_SECRET={client_secret}
GOOGLE_AUTH_TYPE=oauth2
GOOGLE_TOKENS_DIR={TOKENS_DIR}
GOOGLE_CLIENT_SECRET_FILE={CLIENT_SECRET_FILE}

# Add your APIs below
GOOGLE_ENABLED_APIS=drive,sheets,calendar,gmail
"""

        with open(ENV_FILE, 'w') as f:
            f.write(env_content)
        
        os.chmod(str(ENV_FILE), 0o600)  # Secure permissions
        
        print(f"Created environment file: {ENV_FILE}")
        
        # Create a copy of the client secret file for Google API libraries
        credentials_file = TOKENS_DIR / "client_secret.json"
        shutil.copy2(CLIENT_SECRET_FILE, credentials_file)
        
        print(f"Created credentials file: {credentials_file}")
        
        return client_type, client_id, client_secret
        
    except Exception as e:
        print(f"Error loading client secret file: {e}")
        sys.exit(1)

def main():
    print("=== Google OAuth Configuration ===")
    
    # Set up environment
    client_type, client_id, client_secret = setup_environment()
    
    print("\nConfiguration complete!")
    print(f"Client type: {client_type}")
    print(f"Environment file: {ENV_FILE}")
    print(f"Tokens directory: {TOKENS_DIR}")
    
    print("\nNext steps:")
    print("1. Run the authorization script to complete OAuth setup:")
    print("   python3 scripts/authorize_google_oauth.py")
    print("2. Use the Google API in your applications")
    
    # Create the authorization script
    auth_script = SKR_DIR / "scripts/authorize_google_oauth.py"
    auth_script_content = """#!/usr/bin/env python3
\"\"\"
authorize_google_oauth.py - Authorize with Google using client secret

This script completes the OAuth flow using the client secret file
and stores the resulting tokens for use in InsightPulseAI.
\"\"\"

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
    \"\"\"Load environment variables from .env.google file\"\"\"
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
            env[key.strip()] = value.strip().strip('\"\\'')
            
    return env

class OAuth2CallbackHandler(http.server.SimpleHTTPRequestHandler):
    \"\"\"Handler for OAuth2 callback\"\"\"
    def __init__(self, *args, **kwargs):
        self.flow = kwargs.pop('flow', None)
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        \"\"\"Handle GET request\"\"\"
        if self.path.startswith('/oauth2callback'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            
            if 'code' in params:
                code = params['code'][0]
                print("\\nAuthorization code received!")
                
                try:
                    self.flow.fetch_token(code=code)
                    credentials = self.flow.credentials
                    
                    # Save credentials
                    TOKENS_DIR.mkdir(parents=True, exist_ok=True)
                    os.chmod(str(TOKENS_DIR), 0o700)
                    
                    with open(TOKENS_FILE, 'w') as f:
                        f.write(credentials.to_json())
                    
                    print(f"Credentials saved to {TOKENS_FILE}")
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    
                    response = \"\"\"
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
                    \"\"\"
                    
                    self.wfile.write(response.encode())
                    
                    # Signal the server to shut down
                    def shutdown_server():
                        self.server.shutdown()
                    
                    threading.Thread(target=shutdown_server).start()
                    
                except Exception as e:
                    print(f"Error exchanging code for token: {e}")
                    
                    self.send_response(500)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    
                    error_response = f\"\"\"
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
                    \"\"\"
                    
                    self.wfile.write(error_response.encode())
            else:
                error_msg = params.get('error', ['Unknown error'])[0]
                
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                error_response = f\"\"\"
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
                \"\"\"
                
                self.wfile.write(error_response.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Silence server logs
        pass

def authorize():
    \"\"\"Authorize with Google using client secret\"\"\"
    env = load_env()
    
    client_type = env.get('GOOGLE_CLIENT_TYPE')
    client_secret_file = env.get('GOOGLE_CLIENT_SECRET_FILE', str(CLIENT_SECRET_FILE))
    
    print(f"Using client secret file: {client_secret_file}")
    
    port = 8080
    redirect_uri = f"http://localhost:{port}/oauth2callback"
    
    try:
        if client_type == 'web':
            # Use Flow for web applications
            with open(client_secret_file, 'r') as f:
                client_config = json.load(f)
            
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        else:
            # Use InstalledAppFlow for desktop applications
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        
        # Generate authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        print(f"Opening browser to authorize InsightPulseAI...")
        print(f"Auth URL: {auth_url}")
        
        # Open browser
        webbrowser.open(auth_url)
        
        # Start local server
        server_address = ('', port)
        handler = lambda *args, **kwargs: OAuth2CallbackHandler(*args, flow=flow, **kwargs)
        
        print(f"Waiting for authorization on port {port}...")
        
        with socketserver.TCPServer(server_address, handler) as httpd:
            httpd.serve_forever()
        
        print("\\nAuthorization completed successfully!")
        
    except Exception as e:
        print(f"Error during authorization: {e}")
        sys.exit(1)

def main():
    print("=== Google OAuth Authorization ===")
    
    # Authorize
    authorize()
    
    print("\\nNext steps:")
    print("1. You can now use the Google API in your applications")
    print("2. Tokens are stored securely in: {TOKENS_FILE}")
    print("3. To revoke access, visit: https://myaccount.google.com/permissions")

if __name__ == "__main__":
    main()
"""
    
    with open(auth_script, 'w') as f:
        f.write(auth_script_content)
    
    os.chmod(str(auth_script), 0o755)  # Make executable
    
    print(f"Created authorization script: {auth_script}")

if __name__ == "__main__":
    main()