"""
Tests for the FastAPI server.
"""

import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np
from server.main import app

@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)

@pytest.fixture
def sample_image():
    """Create a sample image for testing."""
    # Create a simple test image
    image = Image.new('RGB', (224, 224), color='white')
    # Draw a simple shape
    for x in range(50, 150):
        for y in range(50, 150):
            image.putpixel((x, y), (255, 0, 0))
    
    # Save image
    image_path = "test_image.png"
    image.save(image_path)
    
    try:
        yield image_path
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

def test_upload_asset(client, sample_image):
    """Test asset upload endpoint."""
    # Prepare form data
    files = {
        'file': ('test_image.png', open(sample_image, 'rb'), 'image/png')
    }
    data = {
        'metadata': {
            'title': 'Test Asset',
            'description': 'This is a test asset',
            'tags': ['test', 'sample'],
            'source': 'test'
        }
    }
    
    # Make request
    response = client.post(
        "/assets/upload",
        files=files,
        data={'metadata': str(data['metadata'])}
    )
    
    assert response.status_code == 200
    assert 'asset_id' in response.json()
    assert 'message' in response.json()

def test_search_assets(client):
    """Test asset search endpoint."""
    # Prepare search query
    query = {
        'query': 'test creative asset',
        'top_k': 5,
        'filter': None
    }
    
    # Make request
    response = client.post("/search", json=query)
    
    assert response.status_code == 200
    assert 'results' in response.json()
    assert 'insights' in response.json()
    assert isinstance(response.json()['results'], list)
    assert isinstance(response.json()['insights'], str)

def test_get_asset(client):
    """Test get asset endpoint."""
    # First upload an asset
    files = {
        'file': ('test_image.png', open('test_image.png', 'rb'), 'image/png')
    }
    data = {
        'metadata': {
            'title': 'Test Asset',
            'description': 'This is a test asset',
            'tags': ['test'],
            'source': 'test'
        }
    }
    
    upload_response = client.post(
        "/assets/upload",
        files=files,
        data={'metadata': str(data['metadata'])}
    )
    
    asset_id = upload_response.json()['asset_id']
    
    # Get asset
    response = client.get(f"/assets/{asset_id}")
    
    assert response.status_code == 200
    assert 'id' in response.json()
    assert 'metadata' in response.json()
    assert response.json()['id'] == asset_id

def test_delete_asset(client):
    """Test delete asset endpoint."""
    # First upload an asset
    files = {
        'file': ('test_image.png', open('test_image.png', 'rb'), 'image/png')
    }
    data = {
        'metadata': {
            'title': 'Test Asset',
            'description': 'This is a test asset',
            'tags': ['test'],
            'source': 'test'
        }
    }
    
    upload_response = client.post(
        "/assets/upload",
        files=files,
        data={'metadata': str(data['metadata'])}
    )
    
    asset_id = upload_response.json()['asset_id']
    
    # Delete asset
    response = client.delete(f"/assets/{asset_id}")
    
    assert response.status_code == 200
    assert 'message' in response.json()
    
    # Verify deletion
    get_response = client.get(f"/assets/{asset_id}")
    assert get_response.status_code == 404

def test_invalid_asset_id(client):
    """Test operations with invalid asset ID."""
    # Try to get nonexistent asset
    response = client.get("/assets/nonexistent")
    assert response.status_code == 404
    
    # Try to delete nonexistent asset
    response = client.delete("/assets/nonexistent")
    assert response.status_code == 500

def test_invalid_upload(client):
    """Test invalid file upload."""
    # Try to upload without file
    response = client.post(
        "/assets/upload",
        data={'metadata': '{"title": "Test"}'}
    )
    assert response.status_code == 422
    
    # Try to upload without metadata
    files = {
        'file': ('test.txt', b'test content', 'text/plain')
    }
    response = client.post("/assets/upload", files=files)
    assert response.status_code == 422

def test_invalid_search_query(client):
    """Test invalid search query."""
    # Try to search without query
    response = client.post("/search", json={})
    assert response.status_code == 422
    
    # Try to search with invalid filter
    query = {
        'query': 'test',
        'filter': {'invalid': 'filter'}
    }
    response = client.post("/search", json=query)
    assert response.status_code == 500 