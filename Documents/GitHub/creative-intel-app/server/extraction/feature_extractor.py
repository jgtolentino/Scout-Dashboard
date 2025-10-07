"""
Feature extraction module for creative assets.
Handles extraction of visual, textual, and layout features from creative assets.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
import numpy as np
from PIL import Image
import torch
from transformers import AutoFeatureExtractor, AutoModel
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ExtractedFeatures:
    """Container for extracted features from a creative asset."""
    visual_features: Optional[np.ndarray] = None
    text_features: Optional[np.ndarray] = None
    layout_features: Optional[np.ndarray] = None
    metadata: Dict = None

class FeatureExtractor:
    """Extracts features from creative assets using various models."""
    
    def __init__(
        self,
        visual_model_name: str = "google/vit-base-patch16-224",
        text_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        """Initialize the feature extractor with specified models."""
        self.device = device
        logger.info(f"Initializing feature extractor on {device}")
        
        # Initialize visual feature extractor
        self.visual_extractor = AutoFeatureExtractor.from_pretrained(visual_model_name)
        self.visual_model = AutoModel.from_pretrained(visual_model_name).to(device)
        
        # Initialize text feature extractor
        self.text_model = SentenceTransformer(text_model_name).to(device)
        
        # Set models to evaluation mode
        self.visual_model.eval()
        self.text_model.eval()

    def extract_visual_features(self, image: Union[str, Image.Image]) -> np.ndarray:
        """Extract visual features from an image."""
        try:
            if isinstance(image, str):
                image = Image.open(image).convert('RGB')
            
            # Preprocess image
            inputs = self.visual_extractor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Extract features
            with torch.no_grad():
                outputs = self.visual_model(**inputs)
                features = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            
            return features[0]  # Return first (and only) image's features
            
        except Exception as e:
            logger.error(f"Error extracting visual features: {str(e)}")
            return None

    def extract_text_features(self, text: str) -> np.ndarray:
        """Extract text features from a string."""
        try:
            if not text.strip():
                return None
                
            # Extract features
            with torch.no_grad():
                features = self.text_model.encode(text)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting text features: {str(e)}")
            return None

    def extract_layout_features(
        self,
        layout_elements: List[Dict],
        image_size: tuple
    ) -> np.ndarray:
        """Extract layout features from detected elements."""
        try:
            if not layout_elements:
                return None
                
            # Normalize coordinates
            width, height = image_size
            normalized_elements = []
            
            for element in layout_elements:
                bbox = element.get('bbox', {})
                normalized = {
                    'x1': bbox.get('x1', 0) / width,
                    'y1': bbox.get('y1', 0) / height,
                    'x2': bbox.get('x2', 0) / width,
                    'y2': bbox.get('y2', 0) / height,
                    'type': element.get('type', 'unknown'),
                    'confidence': element.get('confidence', 0.0)
                }
                normalized_elements.append(normalized)
            
            # Convert to feature vector
            features = []
            for element in normalized_elements:
                element_features = [
                    element['x1'], element['y1'],
                    element['x2'], element['y2'],
                    element['confidence']
                ]
                features.extend(element_features)
            
            # Pad or truncate to fixed length
            max_elements = 10
            feature_length = 5  # x1, y1, x2, y2, confidence
            max_length = max_elements * feature_length
            
            if len(features) < max_length:
                features.extend([0] * (max_length - len(features)))
            else:
                features = features[:max_length]
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Error extracting layout features: {str(e)}")
            return None

    def extract_features(
        self,
        image_path: str,
        text: Optional[str] = None,
        layout_elements: Optional[List[Dict]] = None
    ) -> ExtractedFeatures:
        """Extract all features from a creative asset."""
        try:
            # Load and process image
            image = Image.open(image_path).convert('RGB')
            image_size = image.size
            
            # Extract features
            visual_features = self.extract_visual_features(image)
            text_features = self.extract_text_features(text) if text else None
            layout_features = self.extract_layout_features(layout_elements, image_size) if layout_elements else None
            
            # Prepare metadata
            metadata = {
                'image_size': image_size,
                'has_text': text is not None,
                'has_layout': layout_elements is not None,
                'feature_dims': {
                    'visual': visual_features.shape[0] if visual_features is not None else 0,
                    'text': text_features.shape[0] if text_features is not None else 0,
                    'layout': layout_features.shape[0] if layout_features is not None else 0
                }
            }
            
            return ExtractedFeatures(
                visual_features=visual_features,
                text_features=text_features,
                layout_features=layout_features,
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            return ExtractedFeatures()

    def save_features(
        self,
        features: ExtractedFeatures,
        output_path: str
    ) -> bool:
        """Save extracted features to a JSON file."""
        try:
            # Convert numpy arrays to lists
            feature_dict = {
                'visual_features': features.visual_features.tolist() if features.visual_features is not None else None,
                'text_features': features.text_features.tolist() if features.text_features is not None else None,
                'layout_features': features.layout_features.tolist() if features.layout_features is not None else None,
                'metadata': features.metadata
            }
            
            # Save to file
            with open(output_path, 'w') as f:
                json.dump(feature_dict, f, indent=2)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving features: {str(e)}")
            return False

    def load_features(self, input_path: str) -> ExtractedFeatures:
        """Load features from a JSON file."""
        try:
            with open(input_path, 'r') as f:
                feature_dict = json.load(f)
            
            return ExtractedFeatures(
                visual_features=np.array(feature_dict['visual_features']) if feature_dict['visual_features'] else None,
                text_features=np.array(feature_dict['text_features']) if feature_dict['text_features'] else None,
                layout_features=np.array(feature_dict['layout_features']) if feature_dict['layout_features'] else None,
                metadata=feature_dict['metadata']
            )
            
        except Exception as e:
            logger.error(f"Error loading features: {str(e)}")
            return ExtractedFeatures() 