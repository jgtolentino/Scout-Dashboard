#!/usr/bin/env python3
"""
TBWA DAIVID Integration & Feature Extraction Pipeline
Implements automated creative analysis with external benchmarking
"""

import asyncio
import aiohttp
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Union
import json
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import cv2
import torch
from PIL import Image
import io
import base64
from pathlib import Path
import hashlib

# Computer Vision and NLP imports
try:
    import clip
    import whisper
    from transformers import pipeline, AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    logging.warning(f"Some AI libraries not available: {e}")

@dataclass
class CreativeAsset:
    """Creative asset metadata"""
    asset_id: str
    filepath: str
    asset_type: str  # 'image', 'video', 'audio', 'text', 'presentation'
    mime_type: str
    file_size: int
    duration: Optional[float] = None  # For video/audio
    dimensions: Optional[Tuple[int, int]] = None  # For images/video
    campaign_id: Optional[str] = None
    
@dataclass 
class FeatureExtractionResult:
    """Results from feature extraction"""
    asset_id: str
    features: Dict[str, float]
    confidence_scores: Dict[str, float]
    extraction_metadata: Dict[str, Any]
    processing_time: float
    timestamp: datetime

class DAIVIDIntegration:
    """DAIVID API integration for creative benchmarking"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.daivid.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        self.logger = logging.getLogger(__name__)
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
            
    async def analyze_creative(self, asset: CreativeAsset) -> Dict[str, Any]:
        """
        Send creative asset to DAIVID for analysis
        
        Args:
            asset: Creative asset to analyze
            
        Returns:
            DAIVID analysis results
        """
        if not self.session:
            raise RuntimeError("Must use within async context manager")
            
        # Prepare asset for upload
        asset_data = await self._prepare_asset_data(asset)
        
        # Submit to DAIVID
        async with self.session.post(
            f"{self.base_url}/analyze",
            data=asset_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return self._parse_daivid_response(result)
            else:
                error_text = await response.text()
                self.logger.error(f"DAIVID API error: {response.status} - {error_text}")
                return {}
                
    async def _prepare_asset_data(self, asset: CreativeAsset) -> Dict[str, Any]:
        """Prepare asset data for DAIVID upload"""
        
        asset_data = {
            'asset_type': asset.asset_type,
            'mime_type': asset.mime_type
        }
        
        # Read and encode file
        with open(asset.filepath, 'rb') as f:
            file_content = f.read()
            asset_data['file_data'] = base64.b64encode(file_content).decode('utf-8')
            
        return asset_data
        
    def _parse_daivid_response(self, response: Dict[str, Any]) -> Dict[str, float]:
        """Parse DAIVID API response into standardized metrics"""
        
        return {
            'visual_attention_score': response.get('attention', {}).get('overall_score', 0.0),
            'emotional_impact_index': response.get('emotion', {}).get('impact_score', 0.0),
            'brand_power_score': response.get('brand', {}).get('power_score', 0.0),
            'message_clarity_rating': response.get('message', {}).get('clarity_score', 0.0),
            'daivid_overall_score': response.get('overall_effectiveness', 0.0),
            'benchmark_quartile': response.get('benchmark', {}).get('quartile', 2),
            'category_performance': response.get('category_benchmark', 0.0)
        }

class FeatureExtractionPipeline:
    """Comprehensive creative feature extraction pipeline"""
    
    def __init__(self, 
                 use_gpu: bool = True,
                 model_cache_dir: str = "./models"):
        """
        Initialize feature extraction pipeline
        
        Args:
            use_gpu: Whether to use GPU acceleration
            model_cache_dir: Directory to cache AI models
        """
        self.device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
        self.model_cache_dir = Path(model_cache_dir)
        self.model_cache_dir.mkdir(exist_ok=True)
        
        self.logger = logging.getLogger(__name__)
        
        # Initialize models lazily
        self._clip_model = None
        self._whisper_model = None
        self._sentence_transformer = None
        self._sentiment_pipeline = None
        
    @property
    def clip_model(self):
        """Lazy load CLIP model for vision-language tasks"""
        if self._clip_model is None:
            try:
                self._clip_model, self.clip_preprocess = clip.load("ViT-B/32", device=self.device)
                self.logger.info("CLIP model loaded successfully")
            except Exception as e:
                self.logger.error(f"Failed to load CLIP model: {e}")
                self._clip_model = None
        return self._clip_model
    
    @property
    def whisper_model(self):
        """Lazy load Whisper model for audio transcription"""
        if self._whisper_model is None:
            try:
                self._whisper_model = whisper.load_model("base")
                self.logger.info("Whisper model loaded successfully")
            except Exception as e:
                self.logger.error(f"Failed to load Whisper model: {e}")
                self._whisper_model = None
        return self._whisper_model
    
    @property
    def sentence_transformer(self):
        """Lazy load sentence transformer for semantic similarity"""
        if self._sentence_transformer is None:
            try:
                self._sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
                self.logger.info("SentenceTransformer loaded successfully")
            except Exception as e:
                self.logger.error(f"Failed to load SentenceTransformer: {e}")
                self._sentence_transformer = None
        return self._sentence_transformer
    
    @property
    def sentiment_pipeline(self):
        """Lazy load sentiment analysis pipeline"""
        if self._sentiment_pipeline is None:
            try:
                self._sentiment_pipeline = pipeline(
                    "sentiment-analysis", 
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=0 if self.device == "cuda" else -1
                )
                self.logger.info("Sentiment pipeline loaded successfully")
            except Exception as e:
                self.logger.error(f"Failed to load sentiment pipeline: {e}")
                self._sentiment_pipeline = None
        return self._sentiment_pipeline
    
    async def extract_features(self, asset: CreativeAsset) -> FeatureExtractionResult:
        """
        Extract comprehensive features from creative asset
        
        Args:
            asset: Creative asset to analyze
            
        Returns:
            Feature extraction results
        """
        start_time = datetime.now()
        
        features = {}
        confidence_scores = {}
        metadata = {}
        
        try:
            if asset.asset_type == 'image':
                img_features = await self._extract_image_features(asset)
                features.update(img_features['features'])
                confidence_scores.update(img_features['confidence'])
                metadata.update(img_features['metadata'])
                
            elif asset.asset_type == 'video':
                video_features = await self._extract_video_features(asset)
                features.update(video_features['features'])
                confidence_scores.update(video_features['confidence'])
                metadata.update(video_features['metadata'])
                
            elif asset.asset_type == 'audio':
                audio_features = await self._extract_audio_features(asset)
                features.update(audio_features['features'])
                confidence_scores.update(audio_features['confidence'])
                metadata.update(audio_features['metadata'])
                
            elif asset.asset_type == 'text':
                text_features = await self._extract_text_features(asset)
                features.update(text_features['features'])
                confidence_scores.update(text_features['confidence'])
                metadata.update(text_features['metadata'])
                
        except Exception as e:
            self.logger.error(f"Feature extraction failed for {asset.asset_id}: {e}")
            features = {'extraction_error': 1.0}
            confidence_scores = {'extraction_error': 0.0}
            
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return FeatureExtractionResult(
            asset_id=asset.asset_id,
            features=features,
            confidence_scores=confidence_scores,
            extraction_metadata=metadata,
            processing_time=processing_time,
            timestamp=datetime.now()
        )
    
    async def _extract_image_features(self, asset: CreativeAsset) -> Dict[str, Any]:
        """Extract features from image assets"""
        
        features = {}
        confidence = {}
        metadata = {}
        
        try:
            # Load image
            image = Image.open(asset.filepath).convert('RGB')
            img_array = np.array(image)
            
            # Basic image metrics
            features['image_width'] = image.width
            features['image_height'] = image.height
            features['aspect_ratio'] = image.width / image.height
            features['image_area'] = image.width * image.height
            
            # Color analysis
            color_features = self._analyze_color_composition(img_array)
            features.update(color_features)
            
            # Visual complexity
            complexity_features = self._analyze_visual_complexity(img_array)
            features.update(complexity_features)
            
            # CLIP-based semantic features
            if self.clip_model:
                clip_features = await self._extract_clip_features(image)
                features.update(clip_features['features'])
                confidence.update(clip_features['confidence'])
                
            # Face detection and analysis
            face_features = self._analyze_faces(img_array)
            features.update(face_features)
            
            # Text detection in image
            text_features = self._detect_text_in_image(img_array)
            features.update(text_features)
            
            confidence = {k: 0.8 for k in features.keys() if k not in confidence}
            
        except Exception as e:
            self.logger.error(f"Image feature extraction failed: {e}")
            features = {'image_processing_error': 1.0}
            confidence = {'image_processing_error': 0.0}
            
        return {
            'features': features,
            'confidence': confidence,
            'metadata': metadata
        }
    
    async def _extract_video_features(self, asset: CreativeAsset) -> Dict[str, Any]:
        """Extract features from video assets"""
        
        features = {}
        confidence = {}
        metadata = {}
        
        try:
            # Open video
            cap = cv2.VideoCapture(asset.filepath)
            
            # Video metadata
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            features['video_duration'] = duration
            features['video_fps'] = fps
            features['video_frame_count'] = frame_count
            
            # Sample frames for analysis
            sample_frames = self._sample_video_frames(cap, n_samples=10)
            
            # Analyze frame composition
            frame_features = []
            for frame in sample_frames:
                color_features = self._analyze_color_composition(frame)
                complexity_features = self._analyze_visual_complexity(frame)
                frame_features.append({**color_features, **complexity_features})
            
            # Aggregate frame features
            if frame_features:
                for key in frame_features[0].keys():
                    values = [f[key] for f in frame_features if key in f]
                    features[f'avg_{key}'] = np.mean(values)
                    features[f'var_{key}'] = np.var(values)
            
            # Motion analysis
            motion_features = self._analyze_motion(sample_frames)
            features.update(motion_features)
            
            cap.release()
            confidence = {k: 0.7 for k in features.keys()}
            
        except Exception as e:
            self.logger.error(f"Video feature extraction failed: {e}")
            features = {'video_processing_error': 1.0}
            confidence = {'video_processing_error': 0.0}
            
        return {
            'features': features,
            'confidence': confidence,
            'metadata': metadata
        }
    
    async def _extract_audio_features(self, asset: CreativeAsset) -> Dict[str, Any]:
        """Extract features from audio assets"""
        
        features = {}
        confidence = {}
        metadata = {}
        
        try:
            # Transcribe audio with Whisper
            if self.whisper_model:
                result = self.whisper_model.transcribe(asset.filepath)
                transcript = result.get('text', '')
                
                features['audio_duration'] = result.get('duration', 0)
                features['speech_confidence'] = np.mean([s.get('no_speech_prob', 1.0) 
                                                       for s in result.get('segments', [])])
                
                # Analyze transcript
                if transcript:
                    text_features = await self._analyze_text_content(transcript)
                    features.update(text_features)
                
                metadata['transcript'] = transcript
                confidence = {k: 0.8 for k in features.keys()}
            else:
                features = {'whisper_unavailable': 1.0}
                confidence = {'whisper_unavailable': 0.0}
                
        except Exception as e:
            self.logger.error(f"Audio feature extraction failed: {e}")
            features = {'audio_processing_error': 1.0}
            confidence = {'audio_processing_error': 0.0}
            
        return {
            'features': features,
            'confidence': confidence,
            'metadata': metadata
        }
    
    async def _extract_text_features(self, asset: CreativeAsset) -> Dict[str, Any]:
        """Extract features from text assets"""
        
        features = {}
        confidence = {}
        metadata = {}
        
        try:
            # Read text content
            with open(asset.filepath, 'r', encoding='utf-8') as f:
                text_content = f.read()
            
            text_features = await self._analyze_text_content(text_content)
            features.update(text_features)
            
            confidence = {k: 0.9 for k in features.keys()}
            metadata['text_length'] = len(text_content)
            
        except Exception as e:
            self.logger.error(f"Text feature extraction failed: {e}")
            features = {'text_processing_error': 1.0}
            confidence = {'text_processing_error': 0.0}
            
        return {
            'features': features,
            'confidence': confidence,
            'metadata': metadata
        }
    
    async def _analyze_text_content(self, text: str) -> Dict[str, float]:
        """Comprehensive text content analysis"""
        
        features = {}
        
        # Basic text metrics
        words = text.split()
        sentences = text.count('.') + text.count('!') + text.count('?')
        
        features['word_count'] = len(words)
        features['sentence_count'] = sentences
        features['avg_words_per_sentence'] = len(words) / max(1, sentences)
        features['character_count'] = len(text)
        
        # Readability (Flesch Reading Ease)
        if len(words) > 0 and sentences > 0:
            syllables = sum([self._count_syllables(word) for word in words])
            flesch_score = 206.835 - (1.015 * len(words)/sentences) - (84.6 * syllables/len(words))
            features['flesch_reading_ease'] = max(0, min(100, flesch_score)) / 100
        
        # Sentiment analysis
        if self.sentiment_pipeline and len(text) > 0:
            try:
                sentiment_result = self.sentiment_pipeline(text[:512])  # Truncate for model limits
                if sentiment_result:
                    sentiment_label = sentiment_result[0]['label']
                    sentiment_score = sentiment_result[0]['score']
                    
                    # Convert to numerical scale
                    if sentiment_label == 'POSITIVE':
                        features['sentiment_score'] = 0.5 + (sentiment_score * 0.5)
                    elif sentiment_label == 'NEGATIVE':
                        features['sentiment_score'] = 0.5 - (sentiment_score * 0.5)
                    else:  # NEUTRAL
                        features['sentiment_score'] = 0.5
            except Exception as e:
                self.logger.warning(f"Sentiment analysis failed: {e}")
                features['sentiment_score'] = 0.5
        
        # Brand-related keywords
        brand_keywords = ['brand', 'product', 'service', 'company', 'quality', 'premium']
        brand_mentions = sum([1 for word in words if word.lower() in brand_keywords])
        features['brand_keyword_density'] = brand_mentions / max(1, len(words))
        
        # Call-to-action detection
        cta_keywords = ['buy', 'shop', 'learn', 'discover', 'try', 'get', 'start', 'join', 'call', 'visit']
        cta_mentions = sum([1 for word in words if word.lower() in cta_keywords])
        features['cta_density'] = cta_mentions / max(1, len(words))
        
        return features
    
    def _analyze_color_composition(self, img_array: np.ndarray) -> Dict[str, float]:
        """Analyze color composition and contrast"""
        
        features = {}
        
        # Convert to different color spaces
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        
        # Color diversity (using HSV histogram)
        h_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
        features['color_diversity'] = np.count_nonzero(h_hist) / 180
        
        # Brightness analysis
        brightness = np.mean(img_array)
        features['average_brightness'] = brightness / 255
        
        # Contrast analysis
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        features['contrast_ratio'] = np.std(gray) / 255
        
        # Dominant colors
        pixels = img_array.reshape(-1, 3)
        
        # Color temperature (blue vs orange)
        blue_orange_ratio = np.mean(pixels[:, 2]) / (np.mean(pixels[:, 0]) + 1)
        features['color_temperature'] = min(1.0, blue_orange_ratio / 2)
        
        return features
    
    def _analyze_visual_complexity(self, img_array: np.ndarray) -> Dict[str, float]:
        """Analyze visual complexity and composition"""
        
        features = {}
        
        # Edge detection for complexity
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        features['edge_density'] = np.sum(edges > 0) / edges.size
        
        # Texture analysis using Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        features['texture_complexity'] = min(1.0, laplacian_var / 1000)
        
        return features
    
    def _analyze_faces(self, img_array: np.ndarray) -> Dict[str, float]:
        """Detect and analyze faces in image"""
        
        features = {}
        
        try:
            # Load face cascade classifier
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            features['face_count'] = len(faces)
            
            if len(faces) > 0:
                # Face area ratio
                total_face_area = sum([w * h for (x, y, w, h) in faces])
                image_area = img_array.shape[0] * img_array.shape[1]
                features['face_area_ratio'] = total_face_area / image_area
                
                # Average face size
                avg_face_area = total_face_area / len(faces)
                features['avg_face_size'] = avg_face_area / image_area
            else:
                features['face_area_ratio'] = 0.0
                features['avg_face_size'] = 0.0
                
        except Exception as e:
            self.logger.warning(f"Face detection failed: {e}")
            features['face_count'] = 0
            features['face_area_ratio'] = 0.0
            features['avg_face_size'] = 0.0
            
        return features
    
    def _detect_text_in_image(self, img_array: np.ndarray) -> Dict[str, float]:
        """Detect text content in image"""
        
        features = {}
        
        try:
            # Simple text detection using edge analysis
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Text regions tend to have high horizontal edge density
            sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            text_regions = np.abs(sobel_x) > 100
            
            features['text_region_ratio'] = np.sum(text_regions) / text_regions.size
            
        except Exception as e:
            self.logger.warning(f"Text detection failed: {e}")
            features['text_region_ratio'] = 0.0
            
        return features
    
    async def _extract_clip_features(self, image: Image.Image) -> Dict[str, Any]:
        """Extract CLIP-based semantic features"""
        
        features = {}
        confidence = {}
        
        try:
            # Preprocess image for CLIP
            image_tensor = self.clip_preprocess(image).unsqueeze(0).to(self.device)
            
            # Define semantic concepts to test
            concepts = [
                "a happy person",
                "a sad person", 
                "a luxury product",
                "a budget product",
                "food",
                "technology",
                "nature",
                "urban environment",
                "celebration",
                "professional setting"
            ]
            
            text_tokens = clip.tokenize(concepts).to(self.device)
            
            with torch.no_grad():
                image_features = self.clip_model.encode_image(image_tensor)
                text_features = self.clip_model.encode_text(text_tokens)
                
                # Calculate similarities
                similarities = torch.cosine_similarity(image_features, text_features)
                
                for concept, similarity in zip(concepts, similarities):
                    concept_key = concept.replace(" ", "_").replace("a_", "")
                    features[f'clip_{concept_key}'] = float(similarity)
                    confidence[f'clip_{concept_key}'] = 0.9
                    
        except Exception as e:
            self.logger.error(f"CLIP feature extraction failed: {e}")
            features = {'clip_extraction_error': 1.0}
            confidence = {'clip_extraction_error': 0.0}
            
        return {
            'features': features,
            'confidence': confidence
        }
    
    def _sample_video_frames(self, cap: cv2.VideoCapture, n_samples: int = 10) -> List[np.ndarray]:
        """Sample frames from video for analysis"""
        
        frames = []
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if frame_count > n_samples:
            step = frame_count // n_samples
            frame_indices = list(range(0, frame_count, step))[:n_samples]
        else:
            frame_indices = list(range(frame_count))
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
        return frames
    
    def _analyze_motion(self, frames: List[np.ndarray]) -> Dict[str, float]:
        """Analyze motion between video frames"""
        
        features = {}
        
        if len(frames) < 2:
            features['motion_intensity'] = 0.0
            return features
        
        motion_values = []
        
        for i in range(1, len(frames)):
            prev_gray = cv2.cvtColor(frames[i-1], cv2.COLOR_RGB2GRAY)
            curr_gray = cv2.cvtColor(frames[i], cv2.COLOR_RGB2GRAY)
            
            # Calculate optical flow
            flow = cv2.calcOpticalFlowPyrLK(
                prev_gray, curr_gray, 
                cv2.goodFeaturesToTrack(prev_gray, maxCorners=100, qualityLevel=0.01, minDistance=10),
                None
            )[0]
            
            if flow is not None:
                motion = np.mean(np.linalg.norm(flow, axis=2))
                motion_values.append(motion)
        
        if motion_values:
            features['motion_intensity'] = np.mean(motion_values) / 100  # Normalize
            features['motion_variance'] = np.var(motion_values) / 10000
        else:
            features['motion_intensity'] = 0.0
            features['motion_variance'] = 0.0
            
        return features
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
            
        if word.endswith('e'):
            syllable_count -= 1
            
        return max(1, syllable_count)

# Example usage
async def main():
    """Example feature extraction pipeline"""
    
    # Initialize feature extraction pipeline
    pipeline = FeatureExtractionPipeline(use_gpu=False)
    
    # Example creative asset
    asset = CreativeAsset(
        asset_id="test_001",
        filepath="./sample_creative.jpg",
        asset_type="image",
        mime_type="image/jpeg",
        file_size=1024000,
        dimensions=(1920, 1080)
    )
    
    # Extract features
    print("Extracting features...")
    result = await pipeline.extract_features(asset)
    
    print(f"Extracted {len(result.features)} features in {result.processing_time:.2f}s")
    print("Features:")
    for feature, value in result.features.items():
        confidence = result.confidence_scores.get(feature, 0.0)
        print(f"  {feature}: {value:.3f} (confidence: {confidence:.2f})")
    
    # Example DAIVID integration
    print("\nDAIVID Integration Example:")
    async with DAIVIDIntegration("test_api_key") as daivid:
        # Mock DAIVID results since we don't have real API access
        mock_daivid_result = {
            'visual_attention_score': 0.75,
            'emotional_impact_index': 0.82,
            'brand_power_score': 0.68,
            'message_clarity_rating': 0.71,
            'daivid_overall_score': 0.74,
            'benchmark_quartile': 3,
            'category_performance': 0.69
        }
        
        print("DAIVID Results:")
        for metric, value in mock_daivid_result.items():
            print(f"  {metric}: {value}")

if __name__ == "__main__":
    asyncio.run(main())