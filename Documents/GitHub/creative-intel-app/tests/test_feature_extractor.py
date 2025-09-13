"""
Tests for the feature extractor module.
"""

import os
import pytest
import numpy as np
from PIL import Image
from server.extraction.feature_extractor import FeatureExtractor, ExtractedFeatures

@pytest.fixture
def feature_extractor():
    """Create a feature extractor instance for testing."""
    return FeatureExtractor()

@pytest.fixture
def sample_image():
    """Create a sample image for testing."""
    # Create a simple test image
    image = Image.new('RGB', (224, 224), color='white')
    # Draw a simple shape
    for x in range(50, 150):
        for y in range(50, 150):
            image.putpixel((x, y), (255, 0, 0))
    return image

@pytest.fixture
def sample_text():
    """Create sample text for testing."""
    return "This is a test creative asset for feature extraction."

@pytest.fixture
def sample_layout():
    """Create sample layout elements for testing."""
    return [
        {
            'bbox': {'x1': 0, 'y1': 0, 'x2': 100, 'y2': 100},
            'type': 'text',
            'confidence': 0.9
        },
        {
            'bbox': {'x1': 150, 'y1': 150, 'x2': 250, 'y2': 250},
            'type': 'image',
            'confidence': 0.8
        }
    ]

def test_visual_feature_extraction(feature_extractor, sample_image):
    """Test visual feature extraction."""
    features = feature_extractor.extract_visual_features(sample_image)
    
    assert features is not None
    assert isinstance(features, np.ndarray)
    assert features.ndim == 1
    assert features.shape[0] > 0

def test_text_feature_extraction(feature_extractor, sample_text):
    """Test text feature extraction."""
    features = feature_extractor.extract_text_features(sample_text)
    
    assert features is not None
    assert isinstance(features, np.ndarray)
    assert features.ndim == 1
    assert features.shape[0] > 0

def test_layout_feature_extraction(feature_extractor, sample_layout):
    """Test layout feature extraction."""
    features = feature_extractor.extract_layout_features(
        sample_layout,
        image_size=(300, 300)
    )
    
    assert features is not None
    assert isinstance(features, np.ndarray)
    assert features.ndim == 1
    assert features.shape[0] == 50  # 10 elements * 5 features

def test_combined_feature_extraction(
    feature_extractor,
    sample_image,
    sample_text,
    sample_layout
):
    """Test combined feature extraction."""
    # Save sample image temporarily
    temp_path = "test_image.png"
    sample_image.save(temp_path)
    
    try:
        features = feature_extractor.extract_features(
            image_path=temp_path,
            text=sample_text,
            layout_elements=sample_layout
        )
        
        assert isinstance(features, ExtractedFeatures)
        assert features.visual_features is not None
        assert features.text_features is not None
        assert features.layout_features is not None
        assert features.metadata is not None
        
        # Check metadata
        assert 'image_size' in features.metadata
        assert 'has_text' in features.metadata
        assert 'has_layout' in features.metadata
        assert 'feature_dims' in features.metadata
        
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_feature_saving_and_loading(feature_extractor, sample_image, sample_text, sample_layout):
    """Test saving and loading features."""
    # Save sample image temporarily
    temp_path = "test_image.png"
    sample_image.save(temp_path)
    
    try:
        # Extract features
        features = feature_extractor.extract_features(
            image_path=temp_path,
            text=sample_text,
            layout_elements=sample_layout
        )
        
        # Save features
        save_path = "test_features.json"
        success = feature_extractor.save_features(features, save_path)
        assert success
        
        # Load features
        loaded_features = feature_extractor.load_features(save_path)
        
        # Compare features
        assert loaded_features.visual_features is not None
        assert loaded_features.text_features is not None
        assert loaded_features.layout_features is not None
        assert loaded_features.metadata is not None
        
        # Compare arrays
        np.testing.assert_array_almost_equal(
            features.visual_features,
            loaded_features.visual_features
        )
        np.testing.assert_array_almost_equal(
            features.text_features,
            loaded_features.text_features
        )
        np.testing.assert_array_almost_equal(
            features.layout_features,
            loaded_features.layout_features
        )
        
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(save_path):
            os.remove(save_path)

def test_empty_input_handling(feature_extractor):
    """Test handling of empty inputs."""
    # Test empty text
    features = feature_extractor.extract_text_features("")
    assert features is None
    
    # Test empty layout
    features = feature_extractor.extract_layout_features([], (300, 300))
    assert features is None
    
    # Test missing inputs
    features = feature_extractor.extract_features(
        image_path="nonexistent.png",
        text=None,
        layout_elements=None
    )
    assert isinstance(features, ExtractedFeatures)
    assert features.visual_features is None
    assert features.text_features is None
    assert features.layout_features is None 