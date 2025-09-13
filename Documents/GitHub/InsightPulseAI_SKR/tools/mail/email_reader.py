#!/usr/bin/env python3
"""
email_reader.py - Email reading functionality for Pulser

This script provides capabilities to read, search, and process emails
from Zoho Mail accounts associated with Pulser.
"""

import os
import sys
import json
import logging
import argparse
from pathlib import Path
from datetime import datetime, timedelta

# Try to import the Zoho client
try:
    sys.path.append(str(Path(__file__).parent.parent))
    from zoho_mail_client import ZohoMailClient
except ImportError:
    print("Error: zoho_mail_client.py not found. Please make sure it's in the parent directory.")
    sys.exit(1)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path.home() / '.pulser' / 'logs' / 'pulser_mail.log')
    ]
)
logger = logging.getLogger('pulser_mail_reader')

class EmailReader:
    """Class for reading emails from Pulser accounts"""
    
    def __init__(self):
        """Initialize the EmailReader"""
        try:
            self.client = ZohoMailClient()
        except Exception as e:
            logger.error(f"Failed to initialize email reader: {e}")
            raise
    
    def list_folders(self):
        """List available email folders"""
        try:
            folders = self.client.get_folders()
            return folders
        except Exception as e:
            logger.error(f"Error listing folders: {e}")
            return None
    
    def get_unread_count(self, folder="Inbox"):
        """Get the number of unread emails in a folder"""
        try:
            count = self.client.get_unread_count(folder)
            return count
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return -1
    
    def search_emails(self, query, folder="Inbox", limit=10):
        """Search for emails matching the query"""
        try:
            results = self.client.search_emails(query, folder, limit)
            return results
        except Exception as e:
            logger.error(f"Error searching emails: {e}")
            return []
    
    def get_recent_emails(self, folder="Inbox", days=1, limit=10):
        """Get recent emails from the specified folder"""
        try:
            # Calculate the date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Format dates for the API
            start_str = start_date.strftime("%Y-%m-%d")
            end_str = end_date.strftime("%Y-%m-%d")
            
            # Get emails
            emails = self.client.get_emails(
                folder=folder,
                start_date=start_str,
                end_date=end_str,
                limit=limit
            )
            
            return emails
        except Exception as e:
            logger.error(f"Error getting recent emails: {e}")
            return []
    
    def get_email_details(self, email_id):
        """Get details of a specific email"""
        try:
            email = self.client.get_email(email_id)
            return email
        except Exception as e:
            logger.error(f"Error getting email details: {e}")
            return None
    
    def mark_as_read(self, email_id):
        """Mark an email as read"""
        try:
            success = self.client.mark_as_read(email_id)
            return success
        except Exception as e:
            logger.error(f"Error marking email as read: {e}")
            return False
    
    def mark_as_unread(self, email_id):
        """Mark an email as unread"""
        try:
            success = self.client.mark_as_unread(email_id)
            return success
        except Exception as e:
            logger.error(f"Error marking email as unread: {e}")
            return False
    
    def move_to_folder(self, email_id, folder):
        """Move an email to a different folder"""
        try:
            success = self.client.move_to_folder(email_id, folder)
            return success
        except Exception as e:
            logger.error(f"Error moving email to folder: {e}")
            return False

def format_email_list(emails):
    """Format a list of emails for display"""
    if not emails:
        return "No emails found."
    
    result = []
    for i, email in enumerate(emails):
        sender = email.get('fromAddress', 'Unknown Sender')
        subject = email.get('subject', '(No Subject)')
        date = email.get('receivedTime', 'Unknown Date')
        
        result.append(f"{i+1}. From: {sender}")
        result.append(f"   Subject: {subject}")
        result.append(f"   Date: {date}")
        result.append(f"   ID: {email.get('messageId', 'Unknown')}")
        result.append("")
    
    return "\n".join(result)

def main():
    parser = argparse.ArgumentParser(description='Pulser Email Reader')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # List folders command
    folders_parser = subparsers.add_parser('folders', help='List email folders')
    
    # Unread count command
    unread_parser = subparsers.add_parser('unread', help='Get unread email count')
    unread_parser.add_argument('--folder', default='Inbox', help='Folder to check')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search emails')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--folder', default='Inbox', help='Folder to search')
    search_parser.add_argument('--limit', type=int, default=10, help='Maximum results to return')
    
    # Recent emails command
    recent_parser = subparsers.add_parser('recent', help='Get recent emails')
    recent_parser.add_argument('--folder', default='Inbox', help='Folder to check')
    recent_parser.add_argument('--days', type=int, default=1, help='Number of days to look back')
    recent_parser.add_argument('--limit', type=int, default=10, help='Maximum emails to return')
    
    # Get email details command
    details_parser = subparsers.add_parser('details', help='Get email details')
    details_parser.add_argument('email_id', help='Email ID to retrieve')
    
    # Mark as read command
    read_parser = subparsers.add_parser('mark-read', help='Mark email as read')
    read_parser.add_argument('email_id', help='Email ID to mark')
    
    # Mark as unread command
    unread_parser = subparsers.add_parser('mark-unread', help='Mark email as unread')
    unread_parser.add_argument('email_id', help='Email ID to mark')
    
    # Move email command
    move_parser = subparsers.add_parser('move', help='Move email to folder')
    move_parser.add_argument('email_id', help='Email ID to move')
    move_parser.add_argument('folder', help='Destination folder')
    
    args = parser.parse_args()
    
    # Ensure dirs exist
    os.makedirs(Path.home() / '.pulser' / 'logs', exist_ok=True)
    
    try:
        reader = EmailReader()
        
        if args.command == 'folders':
            folders = reader.list_folders()
            if folders:
                print("Email Folders:")
                for folder in folders:
                    print(f"- {folder.get('folderName')} ({folder.get('messageCount')} messages)")
            else:
                print("Failed to retrieve folders.")
                
        elif args.command == 'unread':
            count = reader.get_unread_count(args.folder)
            if count >= 0:
                print(f"Unread messages in {args.folder}: {count}")
            else:
                print(f"Failed to get unread count for {args.folder}.")
                
        elif args.command == 'search':
            results = reader.search_emails(args.query, args.folder, args.limit)
            print(format_email_list(results))
                
        elif args.command == 'recent':
            emails = reader.get_recent_emails(args.folder, args.days, args.limit)
            print(format_email_list(emails))
                
        elif args.command == 'details':
            email = reader.get_email_details(args.email_id)
            if email:
                print(f"From: {email.get('fromAddress')}")
                print(f"To: {email.get('toAddress')}")
                print(f"Subject: {email.get('subject')}")
                print(f"Date: {email.get('receivedTime')}")
                print("\nContent:")
                print(email.get('content'))
            else:
                print(f"Failed to retrieve email with ID: {args.email_id}")
                
        elif args.command == 'mark-read':
            success = reader.mark_as_read(args.email_id)
            if success:
                print(f"Marked email {args.email_id} as read.")
            else:
                print(f"Failed to mark email {args.email_id} as read.")
                
        elif args.command == 'mark-unread':
            success = reader.mark_as_unread(args.email_id)
            if success:
                print(f"Marked email {args.email_id} as unread.")
            else:
                print(f"Failed to mark email {args.email_id} as unread.")
                
        elif args.command == 'move':
            success = reader.move_to_folder(args.email_id, args.folder)
            if success:
                print(f"Moved email {args.email_id} to folder {args.folder}.")
            else:
                print(f"Failed to move email {args.email_id} to folder {args.folder}.")
                
        else:
            parser.print_help()
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()