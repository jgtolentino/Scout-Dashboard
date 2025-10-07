#!/usr/bin/env python3
"""
Manual Google Drive folder ID input for TBWA Campaign Processing
"""

def get_folder_id_from_user():
    print("🔍 TBWA Campaign Folder ID Input")
    print("=" * 50)
    print()
    print("📋 How to find your Google Drive folder ID:")
    print("1. Open Google Drive in browser")
    print("2. Navigate to 'PH Awards Archive' folder")
    print("3. Copy the URL - it looks like:")
    print("   https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J")
    print("4. The part after '/folders/' is your Folder ID")
    print()
    
    # Common TBWA folder patterns
    print("💡 Common TBWA Campaign Folders:")
    print("- PH Awards Archive")
    print("- Creative Campaign Collection")
    print("- Brand Launch Portfolio")
    print("- Video Campaign Library")
    print("- Cross-Platform Campaign Assets")
    print()
    
    folder_id = input("📝 Enter your Google Drive Folder ID: ").strip()
    
    if not folder_id:
        print("❌ No folder ID provided")
        return None
    
    # Basic validation
    if len(folder_id) < 20:
        print("⚠️  Warning: Folder ID seems too short. Please double-check.")
    
    folder_name = input("📂 Enter folder name (optional): ").strip() or "TBWA Campaign Collection"
    
    return {
        'folder_id': folder_id,
        'folder_name': folder_name
    }

def generate_etl_commands(folder_info):
    if not folder_info:
        return
    
    folder_id = folder_info['folder_id']
    folder_name = folder_info['folder_name']
    
    print("\n🚀 GENERATED ETL COMMANDS:")
    print("=" * 60)
    
    # Dashboard method
    print("📊 Method 1: Use Dashboard")
    print(f"1. Go to: http://localhost:3000")
    print(f"2. Click: 'Process Campaigns' tab")
    print(f"3. Enter Folder ID: {folder_id}")
    print(f"4. Campaign Name: {folder_name}")
    print(f"5. Click: 'Process Campaign'")
    print()
    
    # API method
    print("⚡ Method 2: Direct API Call")
    print("curl -X POST http://localhost:3000/api/process-campaigns \\")
    print("  -H \"Content-Type: application/json\" \\")
    print(f"  -d '{{\"folderId\": \"{folder_id}\", \"campaignName\": \"{folder_name}\"}}'")
    print()
    
    # Expected results
    print("📈 Expected ETL Results:")
    print("- Campaign files will be analyzed")
    print("- 30+ creative features detected per campaign")
    print("- 25+ business outcomes predicted")
    print("- Data populated in Azure SQL Server")
    print("- Available for Creative Insights queries")
    print()
    
    print("🔍 Verify Processing:")
    print("curl -s http://localhost:3000/api/health | jq .")
    print()
    
    print("💬 Test Creative Insights:")
    print("curl -X POST http://localhost:3000/api/creative-insights \\")
    print("  -H \"Content-Type: application/json\" \\")
    print(f"  -d '{{\"question\": \"What creative features from {folder_name} drive highest engagement?\"}}'")

if __name__ == "__main__":
    folder_info = get_folder_id_from_user()
    generate_etl_commands(folder_info)