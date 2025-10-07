#!/usr/bin/env python3
"""
Simple script to test the Juicer Chat with Data API
This script doesn't require the API to be running as it directly imports the demo endpoint
"""

import json
from demo_endpoint import JuicerQueryRequest, app
from fastapi.testclient import TestClient

# Create a test client
client = TestClient(app)

def test_query(query_text, include_sql=False):
    """Test a query and print the results"""
    print(f"\n\033[1;34mTesting query: \"{query_text}\"\033[0m")
    
    # Create request body
    request = {
        "query": query_text,
        "include_sql": include_sql,
        "model": "claude",
        "use_rag": True
    }
    
    # Make request
    response = client.post("/api/juicer/query", json=request)
    
    # Check if successful
    if response.status_code == 200:
        print("\033[0;32mSuccess!\033[0m")
        
        # Parse response
        data = response.json()
        
        # Print answer
        print("\n\033[1;33mAnswer:\033[0m")
        print(data["answer"])
        
        # Print SQL if included
        if include_sql and data.get("sql"):
            print("\n\033[1;33mSQL Query:\033[0m")
            print(data["sql"])
        
        # Print chart info if available
        if data.get("charts") and len(data["charts"]) > 0:
            print(f"\n\033[1;33mCharts available: {len(data['charts'])}\033[0m")
            for i, chart in enumerate(data["charts"]):
                print(f"  - Chart {i+1}: {chart['type']} chart - {chart['title']}")
        
        # Print data summary if available
        if data.get("data") and len(data["data"]) > 0:
            print(f"\n\033[1;33mData available: {len(data['data'])} rows\033[0m")
            first_row = data["data"][0]
            print(f"  First row keys: {', '.join(first_row.keys())}")
    else:
        print(f"\033[0;31mError: {response.status_code}\033[0m")
        print(response.text)

if __name__ == "__main__":
    print("\033[1;36m=== Juicer Chat with Data API Test ===\033[0m")
    
    # Test sales comparison query
    test_query("Compare sales uplift for Campaign B vs A in NCR", include_sql=True)
    
    # Test brand mentions query
    test_query("How many brand mentions did Jollibee get last quarter?", include_sql=True)
    
    # Test insights query
    test_query("What insights have we gathered about vegetarian menu items?", include_sql=True)
    
    # Test unknown query
    test_query("What is the meaning of life?", include_sql=False)
    
    print("\n\033[1;36m=== Test Complete ===\033[0m")