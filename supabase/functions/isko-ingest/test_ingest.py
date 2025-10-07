#!/usr/bin/env python3
"""
Test script for Isko Ingest Edge Function
"""
import requests
import json
import sys
from datetime import datetime

# Configuration
EDGE_FUNCTION_URL = "https://your-project.functions.supabase.co/isko-ingest"
ANON_KEY = "your-anon-key"  # Replace with your actual anon key

# Test data sets
TEST_SKUS = [
    {
        "sku_id": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
        "brand_name": "Oishi",
        "sku_name": "Oishi Prawn Crackers Spicy 90g",
        "pack_size": 90,
        "pack_unit": "g",
        "category": "Snacks",
        "msrp": 25.50,
        "source_url": "https://test.example.com/oishi-prawn-spicy",
        "metadata": {"test": True, "scraped_at": datetime.now().isoformat()}
    },
    {
        "sku_id": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}-002",
        "brand_name": "Lucky Me",
        "sku_name": "Lucky Me Pancit Canton Original 60g",
        "pack_size": 60,
        "pack_unit": "g",
        "category": "Noodles",
        "msrp": 15.00,
        "source_url": "https://test.example.com/lucky-me-canton"
    },
    {
        "sku_id": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}-003",
        "sku_name": "Generic Product Without Brand",  # Test brand inference
        "category": "Uncategorized",
        "msrp": 10.00
    }
]

def test_edge_function():
    """Test the Isko Ingest Edge Function"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}"
    }
    
    print("🧪 Testing Isko Ingest Edge Function")
    print(f"📍 URL: {EDGE_FUNCTION_URL}\n")
    
    success_count = 0
    
    for i, sku in enumerate(TEST_SKUS, 1):
        print(f"Test {i}/{len(TEST_SKUS)}: {sku.get('sku_name', 'Unknown')}")
        
        try:
            response = requests.post(
                EDGE_FUNCTION_URL,
                json=sku,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success: {result}")
                success_count += 1
            else:
                print(f"❌ Failed: Status {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {e}")
        
        print()
    
    # Test error handling
    print("Test Error Handling: Missing required fields")
    try:
        response = requests.post(
            EDGE_FUNCTION_URL,
            json={"brand_name": "Test"},  # Missing sku_id and sku_name
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 400:
            print(f"✅ Correctly rejected: {response.json()}")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n📊 Summary: {success_count}/{len(TEST_SKUS)} SKUs ingested successfully")

def test_local():
    """Test against local Supabase instance"""
    global EDGE_FUNCTION_URL, ANON_KEY
    
    EDGE_FUNCTION_URL = "http://localhost:54321/functions/v1/isko-ingest"
    ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    
    print("🏠 Testing against local Supabase\n")
    test_edge_function()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--local":
        test_local()
    else:
        if EDGE_FUNCTION_URL == "https://your-project.functions.supabase.co/isko-ingest":
            print("⚠️  Please update EDGE_FUNCTION_URL and ANON_KEY in this script")
            print("   Or run with --local flag to test against local Supabase")
            sys.exit(1)
        test_edge_function()