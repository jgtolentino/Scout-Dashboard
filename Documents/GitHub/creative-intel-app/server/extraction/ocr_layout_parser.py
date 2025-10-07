"""
OCR and layout analysis for creative assets.
Handles text extraction, layout detection, and element classification.
"""

import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional
import logging
from dataclasses import dataclass
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BoundingBox:
    """Represents a bounding box with confidence score."""
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            'x1': self.x1,
            'y1': self.y1,
            'x2': self.x2,
            'y2': self.y2,
            'confidence': self.confidence
        }

@dataclass
class LayoutElement:
    """Represents a detected layout element."""
    element_type: str  # 'text', 'image', 'logo', etc.
    bounding_box: BoundingBox
    content: Optional[str] = None
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': self.element_type,
            'bounding_box': self.bounding_box.to_dict(),
            'content': self.content,
            'metadata': self.metadata or {}
        }

class LayoutParser:
    def __init__(self, tesseract_cmd: Optional[str] = None):
        """Initialize the layout parser with optional Tesseract path."""
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        
        # Load pre-trained models for element detection
        self._load_models()

    def _load_models(self):
        """Load pre-trained models for element detection."""
        # TODO: Load actual models (e.g., YOLO for logo detection)
        pass

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR and layout detection."""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh)
        
        return denoised

    def detect_text_regions(self, image: np.ndarray) -> List[BoundingBox]:
        """Detect text regions in the image."""
        # Preprocess image
        processed = self.preprocess_image(image)
        
        # Find contours
        contours, _ = cv2.findContours(
            processed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        
        text_regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter small regions
            if w < 20 or h < 20:
                continue
            
            # Calculate confidence based on region properties
            confidence = min(1.0, (w * h) / (image.shape[0] * image.shape[1]))
            
            text_regions.append(BoundingBox(x, y, x + w, y + h, confidence))
        
        return text_regions

    def extract_text(self, image: np.ndarray, region: BoundingBox) -> str:
        """Extract text from a specific region."""
        try:
            # Crop region
            cropped = image[region.y1:region.y2, region.x1:region.x2]
            
            # OCR
            text = pytesseract.image_to_string(cropped)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    def detect_layout_elements(self, image: np.ndarray) -> List[LayoutElement]:
        """Detect all layout elements in the image."""
        elements = []
        
        # Detect text regions
        text_regions = self.detect_text_regions(image)
        
        for region in text_regions:
            # Extract text
            text = self.extract_text(image, region)
            
            if text:
                elements.append(LayoutElement(
                    element_type='text',
                    bounding_box=region,
                    content=text
                ))
        
        # TODO: Add image, logo, and other element detection
        
        return elements

    def analyze_layout(self, image_path: str) -> Dict[str, Any]:
        """Analyze layout of an image file."""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Detect elements
            elements = self.detect_layout_elements(image)
            
            # Convert to dictionary
            result = {
                'file_path': image_path,
                'dimensions': {
                    'width': image.shape[1],
                    'height': image.shape[0]
                },
                'elements': [elem.to_dict() for elem in elements]
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing layout: {e}")
            return {
                'file_path': image_path,
                'error': str(e)
            }

    def process_batch(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Process a batch of images."""
        results = []
        
        for image_path in image_paths:
            result = self.analyze_layout(image_path)
            results.append(result)
            
            logger.info(f"Processed: {image_path}")
        
        return results

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze layout of images')
    parser.add_argument('--input', required=True, help='Input image or directory')
    parser.add_argument('--output', required=True, help='Output JSON file')
    parser.add_argument('--tesseract', help='Path to tesseract executable')
    
    args = parser.parse_args()
    
    parser = LayoutParser(args.tesseract)
    
    if os.path.isfile(args.input):
        # Single file
        result = parser.analyze_layout(args.input)
        results = [result]
    else:
        # Directory
        image_files = [
            os.path.join(args.input, f) for f in os.listdir(args.input)
            if f.lower().endswith(('.png', '.jpg', '.jpeg'))
        ]
        results = parser.process_batch(image_files)
    
    # Save results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"Results saved to: {args.output}")

if __name__ == '__main__':
    main() 