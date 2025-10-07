"""
Tests for the creative RAG system.
"""

import os
import pytest
import numpy as np
from server.rag.creative_rag import CreativeRAG, SearchResult

@pytest.fixture
def rag_system():
    """Create a RAG system instance for testing."""
    return CreativeRAG(
        index_name="test-creative-assets",
        namespace="test"
    )

@pytest.fixture
def sample_features():
    """Create sample features for testing."""
    return {
        'visual_features': np.random.rand(384).tolist(),
        'text_features': np.random.rand(384).tolist(),
        'layout_features': np.random.rand(50).tolist()
    }

@pytest.fixture
def sample_metadata():
    """Create sample metadata for testing."""
    return {
        'title': 'Test Asset',
        'description': 'This is a test creative asset',
        'tags': ['test', 'sample'],
        'source': 'test',
        'filename': 'test.png'
    }

def test_index_asset(rag_system, sample_features, sample_metadata):
    """Test asset indexing."""
    asset_id = "test-asset-1"
    success = rag_system.index_asset(
        asset_id=asset_id,
        features=sample_features,
        metadata=sample_metadata
    )
    
    assert success
    
    # Verify indexing
    result = rag_system.get_asset(asset_id)
    assert result is not None
    assert result.id == asset_id
    assert result.metadata['title'] == sample_metadata['title']

def test_search_assets(rag_system, sample_features, sample_metadata):
    """Test asset search."""
    # Index multiple assets
    for i in range(3):
        asset_id = f"test-asset-{i}"
        rag_system.index_asset(
            asset_id=asset_id,
            features=sample_features,
            metadata={**sample_metadata, 'title': f'Test Asset {i}'}
        )
    
    # Search assets
    results = rag_system.search_assets(
        query="test creative asset",
        top_k=2
    )
    
    assert len(results) == 2
    assert all(isinstance(r, SearchResult) for r in results)
    assert all(r.score > 0 for r in results)

def test_generate_insights(rag_system, sample_features, sample_metadata):
    """Test insights generation."""
    # Index an asset
    asset_id = "test-asset-1"
    rag_system.index_asset(
        asset_id=asset_id,
        features=sample_features,
        metadata=sample_metadata
    )
    
    # Search and generate insights
    results = rag_system.search_assets(
        query="test creative asset",
        top_k=1
    )
    
    insights = rag_system.generate_insights(
        query="What are the key features of this asset?",
        search_results=results
    )
    
    assert isinstance(insights, str)
    assert len(insights) > 0

def test_delete_asset(rag_system, sample_features, sample_metadata):
    """Test asset deletion."""
    asset_id = "test-asset-1"
    
    # Index asset
    rag_system.index_asset(
        asset_id=asset_id,
        features=sample_features,
        metadata=sample_metadata
    )
    
    # Verify indexing
    result = rag_system.get_asset(asset_id)
    assert result is not None
    
    # Delete asset
    success = rag_system.delete_asset(asset_id)
    assert success
    
    # Verify deletion
    result = rag_system.get_asset(asset_id)
    assert result is None

def test_update_asset(rag_system, sample_features, sample_metadata):
    """Test asset updating."""
    asset_id = "test-asset-1"
    
    # Index asset
    rag_system.index_asset(
        asset_id=asset_id,
        features=sample_features,
        metadata=sample_metadata
    )
    
    # Update metadata
    updated_metadata = {
        **sample_metadata,
        'title': 'Updated Test Asset',
        'description': 'This is an updated test asset'
    }
    
    # Update asset
    success = rag_system.update_asset(
        asset_id=asset_id,
        features=sample_features,
        metadata=updated_metadata
    )
    assert success
    
    # Verify update
    result = rag_system.get_asset(asset_id)
    assert result is not None
    assert result.metadata['title'] == updated_metadata['title']
    assert result.metadata['description'] == updated_metadata['description']

def test_search_with_filters(rag_system, sample_features, sample_metadata):
    """Test search with filters."""
    # Index assets with different tags
    for i, tags in enumerate([['test'], ['sample'], ['test', 'sample']]):
        asset_id = f"test-asset-{i}"
        rag_system.index_asset(
            asset_id=asset_id,
            features=sample_features,
            metadata={**sample_metadata, 'tags': tags}
        )
    
    # Search with tag filter
    results = rag_system.search_assets(
        query="test creative asset",
        top_k=3,
        filter={'tags': {'$in': ['test']}}
    )
    
    assert len(results) > 0
    assert all('test' in r.metadata['tags'] for r in results)

def test_empty_search_results(rag_system):
    """Test search with no results."""
    results = rag_system.search_assets(
        query="nonexistent asset",
        top_k=5
    )
    
    assert len(results) == 0

def test_invalid_asset_id(rag_system):
    """Test operations with invalid asset ID."""
    # Try to get nonexistent asset
    result = rag_system.get_asset("nonexistent")
    assert result is None
    
    # Try to delete nonexistent asset
    success = rag_system.delete_asset("nonexistent")
    assert not success 