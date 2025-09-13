#!/usr/bin/env python3
"""
zoho_mail_client.py - Enhanced Zoho Mail API client for Pulser

This script provides a comprehensive API client for working with Zoho Mail,
supporting both email sending and reading operations for Pulser.
"""

import os
import sys
import json
import base64
import logging
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from pathlib import Path
from datetime import datetime, timedelta

# Default configuration
CONFIG_DIR = Path.home() / '.pulser'
CREDENTIALS_FILE = CONFIG_DIR / 'zoho_creds.json'
LOG_DIR = CONFIG_DIR / 'logs'
LOG_FILE = LOG_DIR / 'zoho_mail.log'

# Ensure log directory exists
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE)
    ]
)
logger = logging.getLogger('zoho_mail_client')

class ZohoMailClient:
    """Zoho Mail API Client for Pulser email automation"""
    
    def __init__(self, credentials_file=None):
        """Initialize the client with credentials"""
        if credentials_file:
            self.credentials_file = Path(credentials_file)
        else:
            self.credentials_file = CREDENTIALS_FILE
        
        # Load credentials
        self.load_credentials()
        
        # API endpoints
        self.auth_url = "https://accounts.zoho.com/oauth/v2/token"
        self.base_url = "https://mail.zoho.com/api/accounts"
        
        # Get access token
        self.access_token = self.get_access_token()
    
    def load_credentials(self):
        """Load API credentials from file"""
        if not self.credentials_file.exists():
            sample_file = Path(str(self.credentials_file) + '.sample')
            if sample_file.exists():
                logger.error(f"Credentials file not found: {self.credentials_file}")
                logger.error(f"Please rename the sample file {sample_file} and update with your credentials")
                raise FileNotFoundError(f"Credentials file not found: {self.credentials_file}")
            else:
                logger.error(f"Credentials file not found: {self.credentials_file}")
                logger.error("Please run setup_zoho_credentials.py first")
                raise FileNotFoundError(f"Credentials file not found: {self.credentials_file}")
        
        try:
            with open(self.credentials_file, 'r') as f:
                creds = json.load(f)
            
            self.client_id = creds.get('client_id')
            self.client_secret = creds.get('client_secret')
            self.refresh_token = creds.get('refresh_token')
            self.account_id = creds.get('account_id')
            
            # Handle the case where account_id is the full email
            if self.account_id and '@' in self.account_id:
                self.account_id = self.account_id.split('@')[0]
            
            if not all([self.client_id, self.client_secret, self.refresh_token, self.account_id]):
                logger.error("Missing required credentials in credentials file")
                raise ValueError("Missing required credentials in credentials file")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in credentials file: {self.credentials_file}")
            raise ValueError(f"Invalid JSON in credentials file: {self.credentials_file}")
        except Exception as e:
            logger.error(f"Error loading credentials: {e}")
            raise
    
    def get_access_token(self):
        """Get an access token using the refresh token"""
        data = {
            'refresh_token': self.refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token'
        }
        
        try:
            response = requests.post(self.auth_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data['access_token']
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get access token: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            raise ValueError(f"Failed to get access token: {e}")
    
    def get_aliases(self):
        """Get all email aliases for the account"""
        url = f"{self.base_url}/{self.account_id}/fromaddresses"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get aliases: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return None
    
    def get_folders(self):
        """Get all email folders"""
        url = f"{self.base_url}/{self.account_id}/folders"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get folders: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return None
    
    def get_unread_count(self, folder="Inbox"):
        """Get number of unread emails in a folder"""
        url = f"{self.base_url}/{self.account_id}/folders/{folder}/unreadcount"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return response.json().get('unreadCount', 0)
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get unread count: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return -1
    
    def search_emails(self, query, folder="Inbox", limit=10):
        """Search for emails matching query"""
        url = f"{self.base_url}/{self.account_id}/search"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        params = {
            'searchKey': query,
            'folder': folder,
            'limit': limit
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to search emails: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return []
    
    def get_emails(self, folder="Inbox", start_date=None, end_date=None, limit=10):
        """Get emails from a folder with optional date filtering"""
        url = f"{self.base_url}/{self.account_id}/folders/{folder}/messages"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        params = {'limit': limit}
        
        if start_date:
            params['fromDate'] = start_date
        if end_date:
            params['toDate'] = end_date
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get emails: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return []
    
    def get_email(self, email_id):
        """Get a specific email by ID"""
        url = f"{self.base_url}/{self.account_id}/messages/{email_id}"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return response.json().get('data')
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get email: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return None
    
    def mark_as_read(self, email_id):
        """Mark an email as read"""
        url = f"{self.base_url}/{self.account_id}/messages/{email_id}/read"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.put(url, headers=headers)
            response.raise_for_status()
            
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to mark email as read: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return False
    
    def mark_as_unread(self, email_id):
        """Mark an email as unread"""
        url = f"{self.base_url}/{self.account_id}/messages/{email_id}/unread"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        try:
            response = requests.put(url, headers=headers)
            response.raise_for_status()
            
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to mark email as unread: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return False
    
    def move_to_folder(self, email_id, folder):
        """Move an email to a different folder"""
        url = f"{self.base_url}/{self.account_id}/messages/{email_id}/move"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        data = {'folderName': folder}
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to move email: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return False
    
    def send_email(self, from_addr, to_addr, subject, body, html=True, cc=None, bcc=None):
        """Send an email using the specified alias"""
        url = f"{self.base_url}/{self.account_id}/messages"
        headers = {'Authorization': f'Zoho-oauthtoken {self.access_token}'}
        
        # Create a multipart message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_addr
        msg['To'] = to_addr
        
        if cc:
            msg['Cc'] = ','.join(cc) if isinstance(cc, list) else cc
        if bcc:
            msg['Bcc'] = ','.join(bcc) if isinstance(bcc, list) else bcc
        
        # Create plain text and HTML versions of the message
        if html:
            text_part = MIMEText(self.strip_html(body), 'plain')
            html_part = MIMEText(body, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
        else:
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
        
        # Encode the message
        raw_message = base64.b64encode(msg.as_string().encode('utf-8')).decode('utf-8')
        
        data = {
            'fromAddress': from_addr,
            'toAddress': to_addr,
            'subject': subject,
            'content': raw_message,
            'askReceipt': 'no'
        }
        
        if cc:
            data['ccAddress'] = cc if isinstance(cc, str) else ','.join(cc)
        if bcc:
            data['bccAddress'] = bcc if isinstance(bcc, str) else ','.join(bcc)
        
        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            logger.info(f"Email sent successfully from {from_addr} to {to_addr}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send email: {e}")
            if response.text:
                logger.error(f"Response: {response.text}")
            return False
    
    @staticmethod
    def strip_html(html_text):
        """Simple HTML to plain text conversion"""
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html_text)
        # Replace multiple spaces with single space
        text = re.sub('\\s+', ' ', text)
        # Replace multiple newlines with single newline
        text = re.sub('\\n+', '\n', text)
        return text.strip()

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Zoho Mail API Client')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Get aliases command
    aliases_parser = subparsers.add_parser('aliases', help='List email aliases')
    
    # Get folders command
    folders_parser = subparsers.add_parser('folders', help='List email folders')
    
    # Send email command
    send_parser = subparsers.add_parser('send', help='Send an email')
    send_parser.add_argument('--from', dest='from_addr', required=True, help='Sender email address')
    send_parser.add_argument('--to', dest='to_addr', required=True, help='Recipient email address')
    send_parser.add_argument('--subject', required=True, help='Email subject')
    send_parser.add_argument('--body', required=True, help='Email body')
    send_parser.add_argument('--html', action='store_true', help='Send as HTML email')
    send_parser.add_argument('--cc', help='CC recipients (comma-separated)')
    send_parser.add_argument('--bcc', help='BCC recipients (comma-separated)')
    
    args = parser.parse_args()
    
    # Create the client
    try:
        client = ZohoMailClient()
        
        if args.command == 'aliases':
            aliases = client.get_aliases()
            if aliases:
                print("Email Aliases:")
                for alias in aliases.get('data', []):
                    print(f"- {alias.get('fromAddress')}")
            else:
                print("Failed to retrieve aliases or none found.")
                sys.exit(1)
        
        elif args.command == 'folders':
            folders = client.get_folders()
            if folders:
                print("Email Folders:")
                for folder in folders:
                    print(f"- {folder.get('folderName')} ({folder.get('messageCount')} messages)")
            else:
                print("Failed to retrieve folders or none found.")
                sys.exit(1)
        
        elif args.command == 'send':
            # Process CC/BCC if provided
            cc = args.cc.split(',') if args.cc else None
            bcc = args.bcc.split(',') if args.bcc else None
            
            success = client.send_email(
                args.from_addr,
                args.to_addr,
                args.subject,
                args.body,
                args.html,
                cc,
                bcc
            )
            
            if success:
                print(f"Email sent successfully from {args.from_addr} to {args.to_addr}")
            else:
                print("Failed to send email")
                sys.exit(1)
        
        else:
            parser.print_help()
            sys.exit(1)
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()