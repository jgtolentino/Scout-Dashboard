#!/usr/bin/env python3
"""
Zoho Mail Client for Pulser
A comprehensive client for interacting with Zoho Mail APIs
"""

import os
import sys
import json
import time
import requests
import argparse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path

# Constants
ZOHO_API_URL = "https://mail.zoho.com/api/accounts"
TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token"
DEFAULT_CREDENTIALS_PATH = os.path.expanduser("~/.pulser/zoho_credentials.json")

def load_credentials(credentials_path=DEFAULT_CREDENTIALS_PATH):
    """Load credentials from JSON file"""
    try:
        with open(credentials_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Credentials file {credentials_path} not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Credentials file {credentials_path} is not valid JSON")
        sys.exit(1)

def refresh_access_token(credentials):
    """Get a new access token using the refresh token"""
    refresh_token = credentials.get('refresh_token')
    if not refresh_token:
        print("Error: No refresh token found in credentials")
        return None
    
    params = {
        "refresh_token": refresh_token,
        "client_id": credentials.get('client_id'),
        "client_secret": credentials.get('client_secret'),
        "grant_type": "refresh_token"
    }
    
    try:
        response = requests.post(TOKEN_URL, data=params)
        response.raise_for_status()
        token_data = response.json()
        
        # Update the credentials with the new access token
        credentials['access_token'] = token_data['access_token']
        credentials['token_type'] = token_data.get('token_type', 'Zoho-oauthtoken')
        credentials['last_updated'] = datetime.now().isoformat()
        
        # Save updated credentials back to file
        with open(DEFAULT_CREDENTIALS_PATH, 'w') as f:
            json.dump(credentials, f, indent=2)
        
        return credentials
    except requests.RequestException as e:
        print(f"Error refreshing token: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return None

class ZohoMailClient:
    """Client for interacting with Zoho Mail API"""
    
    def __init__(self, credentials_path=DEFAULT_CREDENTIALS_PATH):
        """Initialize the mail client"""
        self.credentials_path = credentials_path
        self.credentials = load_credentials(credentials_path)
        self.account_id = None
        self.base_url = ZOHO_API_URL
        
        # Refresh token if needed
        self.refresh_credentials()
        
        # Get account ID
        self.get_account_id()
    
    def refresh_credentials(self):
        """Refresh the access token if needed"""
        # If there's no access token or it's likely expired, refresh it
        if not self.credentials.get('access_token') or not self.credentials.get('last_updated'):
            self.credentials = refresh_access_token(self.credentials)
            if not self.credentials:
                print("Error: Failed to refresh access token")
                sys.exit(1)
    
    def get_account_id(self):
        """Get the account ID for API calls"""
        if self.account_id:
            return self.account_id
        
        headers = {"Authorization": f"Zoho-oauthtoken {self.credentials['access_token']}"}
        
        try:
            response = requests.get(self.base_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'error':
                print(f"API Error: {data.get('message')}")
                return None
            
            accounts = data.get('data', [])
            if not accounts:
                print("No accounts found")
                return None
            
            self.account_id = accounts[0].get('accountId')
            return self.account_id
        except requests.RequestException as e:
            print(f"Error getting account details: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            return None
    
    def send_email(self, from_addr, to_addr, subject, body, html=True, signature=None, cc=None, bcc=None):
        """Send an email using Zoho Mail API"""
        if not self.account_id:
            print("Error: Cannot send email without account ID")
            return False
        
        # Add signature if provided
        if signature and os.path.exists(signature):
            try:
                with open(signature, 'r') as f:
                    sig_content = f.read()
                if html:
                    body = f"{body}\n{sig_content}"
                else:
                    # Strip HTML tags for plain text
                    import re
                    sig_plain = re.sub('<[^<]+?>', '', sig_content)
                    body = f"{body}\n\n{sig_plain}"
            except Exception as e:
                print(f"Warning: Could not add signature: {e}")
        
        # Prepare the request
        url = f"{self.base_url}/{self.account_id}/messages"
        headers = {"Authorization": f"Zoho-oauthtoken {self.credentials['access_token']}"}
        
        data = {
            "fromAddress": from_addr,
            "toAddress": to_addr,
            "subject": subject,
            "content": body,
            "mailFormat": "html" if html else "plain"
        }
        
        if cc:
            data["ccAddress"] = cc
        if bcc:
            data["bccAddress"] = bcc
        
        try:
            response = requests.post(url, headers=headers, json=data)
            
            # Check if we got a 401 error (token expired)
            if response.status_code == 401:
                print("Token expired, refreshing...")
                self.refresh_credentials()
                headers = {"Authorization": f"Zoho-oauthtoken {self.credentials['access_token']}"}
                response = requests.post(url, headers=headers, json=data)
            
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') == 'error':
                print(f"API Error: {result.get('message')}")
                return False
            
            print(f"✅ Email sent successfully to {to_addr}")
            return True
        except requests.RequestException as e:
            print(f"Error sending email via API: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            
            # Fallback to SMTP if API fails and password is available
            if 'password' in self.credentials or os.environ.get('ZOHO_PASSWORD'):
                print("Attempting to send via SMTP as fallback...")
                return self.send_email_smtp(from_addr, to_addr, subject, body, html, cc, bcc)
            
            return False
    
    def send_email_smtp(self, from_addr, to_addr, subject, body, html=True, cc=None, bcc=None):
        """Send an email using SMTP as a fallback"""
        # Get password from credentials or environment
        password = self.credentials.get('password') or os.environ.get('ZOHO_PASSWORD')
        if not password:
            print("Error: No password available for SMTP fallback")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = from_addr
        msg['To'] = to_addr
        msg['Subject'] = subject
        
        if cc:
            msg['Cc'] = cc
        if bcc:
            msg['Bcc'] = bcc
        
        # Add HTML and plain text parts
        if html:
            # Create a simple plain text version by stripping HTML
            import re
            plain_text = re.sub('<[^<]+?>', '', body)
            text_part = MIMEText(plain_text, 'plain')
            html_part = MIMEText(body, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Set up SMTP connection
        smtp_server = "smtp.zoho.com"
        smtp_port = 587
        
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(from_addr, password)
            
            # Determine all recipients
            all_recipients = [to_addr]
            if cc:
                all_recipients.append(cc)
            if bcc:
                all_recipients.append(bcc)
            
            # Send email
            server.sendmail(from_addr, all_recipients, msg.as_string())
            print(f"✅ Email sent successfully via SMTP to {to_addr}")
            
            server.quit()
            return True
        except Exception as e:
            print(f"❌ Error sending email via SMTP: {str(e)}")
            return False
    
    def get_vacation_settings(self):
        """Get vacation auto-reply settings"""
        if not self.account_id:
            print("Error: Cannot get vacation settings without account ID")
            return None
        
        url = f"{self.base_url}/{self.account_id}/settings/vacation"
        headers = {"Authorization": f"Zoho-oauthtoken {self.credentials['access_token']}"}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error getting vacation settings: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            return None
    
    def set_vacation_settings(self, enable, from_date=None, to_date=None, subject=None, message=None):
        """Set vacation auto-reply settings"""
        if not self.account_id:
            print("Error: Cannot set vacation settings without account ID")
            return False
        
        url = f"{self.base_url}/{self.account_id}/settings/vacation"
        headers = {"Authorization": f"Zoho-oauthtoken {self.credentials['access_token']}"}
        
        data = {"enabled": enable}
        
        if enable:
            if not from_date or not to_date or not subject or not message:
                print("Error: When enabling vacation reply, from_date, to_date, subject, and message are required")
                return False
            
            # Convert dates to YYYY-MM-DD format if needed
            if isinstance(from_date, datetime):
                from_date = from_date.strftime("%Y-%m-%d")
            if isinstance(to_date, datetime):
                to_date = to_date.strftime("%Y-%m-%d")
            
            data.update({
                "fromDate": from_date,
                "toDate": to_date,
                "subject": subject,
                "content": message
            })
        
        try:
            response = requests.put(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') == 'error':
                print(f"API Error: {result.get('message')}")
                return False
            
            status = "enabled" if enable else "disabled"
            print(f"✅ Vacation auto-reply {status} successfully")
            return True
        except requests.RequestException as e:
            print(f"Error setting vacation settings: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            return False

def send_command(args):
    """Handle the send command"""
    client = ZohoMailClient(args.credentials)
    
    success = client.send_email(
        args.from_addr,
        args.to,
        args.subject,
        args.body,
        args.html,
        args.signature,
        args.cc,
        args.bcc
    )
    
    return 0 if success else 1

def account_command(args):
    """Handle the account command"""
    client = ZohoMailClient(args.credentials)
    
    if args.info:
        account_id = client.get_account_id()
        if account_id:
            print(f"Account ID: {account_id}")
            return 0
    
    return 1

def settings_command(args):
    """Handle the settings command"""
    client = ZohoMailClient(args.credentials)
    
    if args.vacation == "status":
        settings = client.get_vacation_settings()
        if settings:
            if settings.get('data', {}).get('enabled'):
                print("Vacation auto-reply is currently enabled:")
                print(f"  From: {settings['data'].get('fromDate')}")
                print(f"  To: {settings['data'].get('toDate')}")
                print(f"  Subject: {settings['data'].get('subject')}")
                print(f"  Message: {settings['data'].get('content')}")
            else:
                print("Vacation auto-reply is currently disabled")
            return 0
    elif args.vacation == "enable":
        if not args.from_date or not args.to_date or not args.subject or not args.message:
            print("Error: When enabling vacation reply, --from, --to, --subject, and --message are required")
            return 1
        
        success = client.set_vacation_settings(
            True,
            args.from_date,
            args.to_date,
            args.subject,
            args.message
        )
        return 0 if success else 1
    elif args.vacation == "disable":
        success = client.set_vacation_settings(False)
        return 0 if success else 1
    
    return 1

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Zoho Mail Client for Pulser")
    parser.add_argument("--credentials", default=DEFAULT_CREDENTIALS_PATH,
                      help=f"Path to credentials file (default: {DEFAULT_CREDENTIALS_PATH})")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Send command
    send_parser = subparsers.add_parser("send", help="Send an email")
    send_parser.add_argument("--from", dest="from_addr", required=True,
                          help="Email address to send from")
    send_parser.add_argument("--to", required=True,
                          help="Email address to send to")
    send_parser.add_argument("--subject", required=True,
                          help="Email subject line")
    send_parser.add_argument("--body", required=True,
                          help="Email body content")
    send_parser.add_argument("--html", action="store_true", default=True,
                          help="Send as HTML (default)")
    send_parser.add_argument("--no-html", action="store_false", dest="html",
                          help="Send as plain text")
    send_parser.add_argument("--signature", 
                          help="Path to signature file to append")
    send_parser.add_argument("--cc", 
                          help="Carbon copy recipients")
    send_parser.add_argument("--bcc", 
                          help="Blind carbon copy recipients")
    
    # Account command
    account_parser = subparsers.add_parser("account", help="Manage account settings")
    account_parser.add_argument("--info", action="store_true",
                             help="Show account information")
    
    # Settings command
    settings_parser = subparsers.add_parser("settings", help="Manage email settings")
    settings_parser.add_argument("--vacation", choices=["status", "enable", "disable"],
                              help="Manage vacation auto-reply")
    settings_parser.add_argument("--from", dest="from_date",
                              help="Start date for vacation auto-reply (YYYY-MM-DD)")
    settings_parser.add_argument("--to", dest="to_date",
                              help="End date for vacation auto-reply (YYYY-MM-DD)")
    settings_parser.add_argument("--subject",
                              help="Subject for vacation auto-reply")
    settings_parser.add_argument("--message",
                              help="Message for vacation auto-reply")
    
    args = parser.parse_args()
    
    if args.command == "send":
        return send_command(args)
    elif args.command == "account":
        return account_command(args)
    elif args.command == "settings":
        return settings_command(args)
    else:
        parser.print_help()
        return 1

if __name__ == "__main__":
    sys.exit(main())