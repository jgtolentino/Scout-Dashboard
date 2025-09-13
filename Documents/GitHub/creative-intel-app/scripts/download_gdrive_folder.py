#!/usr/bin/env python3
"""
Google Drive folder downloader for creative assets.
Handles authentication, folder traversal, and file downloads.
"""

import os
import json
import argparse
from typing import List, Dict, Any
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
import mimetypes
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.json.
SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
]

class DriveDownloader:
    def __init__(self, credentials_path: str, token_path: str = 'token.json'):
        """Initialize the Drive downloader with credentials."""
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google Drive API."""
        if os.path.exists(self.token_path):
            self.creds = Credentials.from_authorized_user_info(
                json.loads(open(self.token_path).read()), SCOPES
            )
        
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, SCOPES
                )
                self.creds = flow.run_local_server(port=0)
            
            with open(self.token_path, 'w') as token:
                token.write(self.creds.to_json())

        self.service = build('drive', 'v3', credentials=self.creds)

    def list_folder_contents(self, folder_id: str) -> List[Dict[str, Any]]:
        """List all files and folders in the given folder."""
        results = []
        page_token = None
        
        while True:
            try:
                query = f"'{folder_id}' in parents and trashed = false"
                response = self.service.files().list(
                    q=query,
                    spaces='drive',
                    fields='nextPageToken, files(id, name, mimeType, size)',
                    pageToken=page_token
                ).execute()
                
                results.extend(response.get('files', []))
                page_token = response.get('nextPageToken')
                
                if not page_token:
                    break
                    
            except Exception as e:
                logger.error(f"Error listing folder contents: {e}")
                break
        
        return results

    def download_file(self, file_id: str, file_name: str, output_dir: str) -> str:
        """Download a file from Drive."""
        try:
            request = self.service.files().get_media(fileId=file_id)
            file_path = os.path.join(output_dir, file_name)
            
            with io.FileIO(file_path, 'wb') as f:
                downloader = MediaIoBaseDownload(f, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    logger.info(f"Download {file_name}: {int(status.progress() * 100)}%")
            
            return file_path
            
        except Exception as e:
            logger.error(f"Error downloading file {file_name}: {e}")
            return None

    def download_folder(self, folder_id: str, output_dir: str) -> List[str]:
        """Download all files in a folder recursively."""
        downloaded_files = []
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # List folder contents
        items = self.list_folder_contents(folder_id)
        
        for item in items:
            item_name = item['name']
            item_id = item['id']
            mime_type = item['mimeType']
            
            # Handle Google Docs/Sheets/Slides
            if mime_type.startswith('application/vnd.google-apps'):
                # Export as PDF
                try:
                    request = self.service.files().export_media(
                        fileId=item_id,
                        mimeType='application/pdf'
                    )
                    file_path = os.path.join(output_dir, f"{item_name}.pdf")
                    
                    with io.FileIO(file_path, 'wb') as f:
                        downloader = MediaIoBaseDownload(f, request)
                        done = False
                        while not done:
                            status, done = downloader.next_chunk()
                            logger.info(f"Export {item_name}: {int(status.progress() * 100)}%")
                    
                    downloaded_files.append(file_path)
                    
                except Exception as e:
                    logger.error(f"Error exporting {item_name}: {e}")
            
            # Handle regular files
            elif mime_type != 'application/vnd.google-apps.folder':
                file_path = self.download_file(item_id, item_name, output_dir)
                if file_path:
                    downloaded_files.append(file_path)
            
            # Handle subfolders
            else:
                subfolder_path = os.path.join(output_dir, item_name)
                subfolder_files = self.download_folder(item_id, subfolder_path)
                downloaded_files.extend(subfolder_files)
        
        return downloaded_files

def main():
    parser = argparse.ArgumentParser(description='Download Google Drive folder contents')
    parser.add_argument('--folder_id', required=True, help='Google Drive folder ID')
    parser.add_argument('--output_dir', required=True, help='Output directory path')
    parser.add_argument('--credentials', required=True, help='Path to credentials.json')
    parser.add_argument('--token', default='token.json', help='Path to token.json')
    
    args = parser.parse_args()
    
    downloader = DriveDownloader(args.credentials, args.token)
    downloaded_files = downloader.download_folder(args.folder_id, args.output_dir)
    
    logger.info(f"Downloaded {len(downloaded_files)} files:")
    for file_path in downloaded_files:
        logger.info(f"- {file_path}")

if __name__ == '__main__':
    main() 