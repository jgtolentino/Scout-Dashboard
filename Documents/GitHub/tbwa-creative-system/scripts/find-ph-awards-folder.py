#!/usr/bin/env python3
"""
Find PH Awards Archive folder ID using TBWA Pulser service account
"""
import json
import os
from googleapiclient.discovery import build
from google.oauth2 import service_account

def find_ph_awards_folder():
    print("🔍 Searching for PH Awards Archive folder...")
    
    # Service account paths to try
    service_account_paths = [
        '/Users/tbwa/.pulser/keys/parser-tbwa-drive-access.json',
        os.path.expanduser('~/.pulser/keys/parser-tbwa-drive-access.json'),
        '../InsightPulseAI_SKR/keys/parser-tbwa-drive-access.json'
    ]
    
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    
    # Try to find service account file
    service_account_file = None
    for path in service_account_paths:
        if os.path.exists(path):
            service_account_file = path
            print(f"✅ Found service account: {path}")
            break
    
    if not service_account_file:
        print("❌ Service account file not found. Checking environment variable...")
        # Try environment variable
        if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
            try:
                key_data = json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_KEY'])
                creds = service_account.Credentials.from_service_account_info(key_data, scopes=SCOPES)
                print("✅ Using service account from environment variable")
            except Exception as e:
                print(f"❌ Error loading from environment: {e}")
                return None
        else:
            print("❌ No Google service account credentials found")
            return None
    else:
        # Load from file
        try:
            creds = service_account.Credentials.from_service_account_file(
                service_account_file, scopes=SCOPES)
            print("✅ Service account credentials loaded")
        except Exception as e:
            print(f"❌ Error loading service account: {e}")
            return None
    
    try:
        # Build Drive service
        service = build('drive', 'v3', credentials=creds)
        print("✅ Google Drive service initialized")
        
        # Search for PH Awards Archive folder
        search_queries = [
            "name='PH Awards Archive' and mimeType='application/vnd.google-apps.folder'",
            "name contains 'PH Awards' and mimeType='application/vnd.google-apps.folder'",
            "name contains 'Awards' and mimeType='application/vnd.google-apps.folder'",
            "name contains 'Campaign' and mimeType='application/vnd.google-apps.folder'"
        ]
        
        all_folders = []
        
        for query in search_queries:
            print(f"🔍 Searching with: {query}")
            results = service.files().list(
                q=query,
                spaces='drive',
                fields="files(id, name, parents, webViewLink)",
                pageSize=50
            ).execute()
            
            items = results.get('files', [])
            if items:
                print(f"📁 Found {len(items)} folders:")
                for item in items:
                    folder_info = {
                        'name': item['name'],
                        'id': item['id'],
                        'parents': item.get('parents', []),
                        'webViewLink': item.get('webViewLink', '')
                    }
                    all_folders.append(folder_info)
                    print(f"   📂 {item['name']} → ID: {item['id']}")
            else:
                print("   📭 No folders found with this query")
            print()
        
        # Return unique folders
        unique_folders = {}
        for folder in all_folders:
            if folder['id'] not in unique_folders:
                unique_folders[folder['id']] = folder
        
        return list(unique_folders.values())
        
    except Exception as e:
        print(f"❌ Error accessing Google Drive: {e}")
        return None

if __name__ == "__main__":
    folders = find_ph_awards_folder()
    
    if folders:
        print("🎯 FOUND CAMPAIGN FOLDERS:")
        print("=" * 60)
        for folder in folders:
            print(f"📂 Name: {folder['name']}")
            print(f"🔑 Folder ID: {folder['id']}")
            print(f"🔗 Link: {folder['webViewLink']}")
            print("-" * 40)
        
        # Recommend the best match
        ph_awards_folders = [f for f in folders if 'PH Awards' in f['name'] or 'Awards' in f['name']]
        if ph_awards_folders:
            best_match = ph_awards_folders[0]
            print(f"🚀 RECOMMENDED FOR ETL:")
            print(f"   Folder: {best_match['name']}")
            print(f"   ID: {best_match['id']}")
            print()
            print(f"📋 ETL COMMAND:")
            print(f"curl -X POST http://localhost:3000/api/process-campaigns \\")
            print(f'  -H "Content-Type: application/json" \\')
            print(f'  -d \'{{"folderId": "{best_match["id"]}", "campaignName": "{best_match["name"]}"}}\'')
    else:
        print("❌ No campaign folders found. Please check your Google Drive access.")