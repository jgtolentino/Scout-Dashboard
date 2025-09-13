#!/usr/bin/env python3
"""
UNIFIED COLUMN MAPPING SYSTEM WITH ML CAPABILITIES
Integrates with existing Scout ETL infrastructure and Cross Tabs pipeline
"""

import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import re
from difflib import SequenceMatcher
from pathlib import Path

# ML imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Database imports
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase not available - will use file-based storage")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('UnifiedColumnMapper')


class MatchStrategy(Enum):
    """Column matching strategies with confidence levels"""
    EXACT_MATCH = "exact"
    FUZZY_MATCH = "fuzzy"
    PATTERN_MATCH = "pattern"
    ML_MATCH = "ml_prediction"
    HISTORICAL_MATCH = "historical"
    DEFAULT_VALUE = "default"
    MANUAL_OVERRIDE = "manual"


@dataclass
class ColumnMapping:
    """Enhanced column mapping with ML features"""
    source_column: str
    target_column: str
    match_strategy: MatchStrategy
    confidence_score: float
    data_type: str
    transformation: Optional[str] = None
    default_value: Any = None
    validation_rule: Optional[str] = None
    usage_count: int = 0
    last_used: Optional[datetime] = None
    created_at: Optional[datetime] = None
    sheet_source: Optional[str] = None
    user_validated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        data = asdict(self)
        # Convert datetime objects to ISO strings
        if self.last_used:
            data['last_used'] = self.last_used.isoformat()
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        data['match_strategy'] = self.match_strategy.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ColumnMapping':
        """Create from dictionary"""
        # Convert ISO strings back to datetime
        if 'last_used' in data and data['last_used']:
            data['last_used'] = datetime.fromisoformat(data['last_used'])
        if 'created_at' in data and data['created_at']:
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if 'match_strategy' in data:
            data['match_strategy'] = MatchStrategy(data['match_strategy'])
        return cls(**data)


class ColumnFeatureExtractor:
    """Extract features from column names for ML training"""

    def __init__(self):
        self.tfidf = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            analyzer='char_wb',
            lowercase=True
        )
        self.fitted = False

    def extract_features(self, column_names: List[str]) -> np.ndarray:
        """Extract TF-IDF features from column names"""
        # Clean column names
        cleaned_names = [self._clean_column_name(name) for name in column_names]

        if not self.fitted:
            features = self.tfidf.fit_transform(cleaned_names)
            self.fitted = True
        else:
            features = self.tfidf.transform(cleaned_names)

        return features.toarray()

    def _clean_column_name(self, name: str) -> str:
        """Clean column name for feature extraction"""
        # Convert to lowercase
        cleaned = name.lower()
        # Remove special characters but keep spaces
        cleaned = re.sub(r'[^a-zA-Z0-9\s_]', ' ', cleaned)
        # Replace multiple spaces with single space
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()

    def get_similarity_score(self, source: str, target: str) -> float:
        """Calculate similarity between two column names"""
        features = self.extract_features([source, target])
        if len(features) < 2:
            return 0.0
        return cosine_similarity([features[0]], [features[1]])[0][0]


class MLColumnMatcher:
    """Machine Learning-based column matcher"""

    def __init__(self, model_path: Optional[str] = None):
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.feature_extractor = ColumnFeatureExtractor()
        self.target_encoder = {}
        self.trained = False
        self.model_path = model_path or '/tmp/column_matcher_model.pkl'

    def train(self, training_data: List[Tuple[str, str, float]]) -> Dict[str, Any]:
        """
        Train the ML model on historical mappings
        training_data: List of (source_column, target_column, confidence_score)
        """
        if len(training_data) < 10:
            logger.warning("Insufficient training data for ML model")
            return {'status': 'insufficient_data', 'samples': len(training_data)}

        # Prepare training data
        source_columns = [item[0] for item in training_data]
        target_columns = [item[1] for item in training_data]
        confidence_scores = [item[2] for item in training_data]

        # Extract features
        X = self.feature_extractor.extract_features(source_columns)

        # Encode target columns
        unique_targets = list(set(target_columns))
        self.target_encoder = {target: idx for idx, target in enumerate(unique_targets)}
        y = [self.target_encoder[target] for target in target_columns]

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Train model
        self.model.fit(X_train, y_train)
        self.trained = True

        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)

        # Save model
        self.save_model()

        return {
            'status': 'trained',
            'samples': len(training_data),
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'target_classes': len(unique_targets)
        }

    def predict_mapping(self, source_column: str,
                       possible_targets: List[str]) -> List[Tuple[str, float]]:
        """
        Predict best target columns for a source column
        Returns list of (target_column, confidence) sorted by confidence
        """
        if not self.trained:
            return []

        # Extract features for source column
        source_features = self.feature_extractor.extract_features([source_column])

        # Get prediction probabilities
        probabilities = self.model.predict_proba(source_features)[0]

        # Map probabilities to target columns
        reverse_encoder = {idx: target for target, idx in self.target_encoder.items()}
        predictions = []

        for class_idx, prob in enumerate(probabilities):
            if class_idx in reverse_encoder:
                target = reverse_encoder[class_idx]
                if target in possible_targets:
                    predictions.append((target, prob))

        # Sort by confidence
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:5]  # Return top 5

    def save_model(self):
        """Save trained model to disk"""
        if self.trained:
            model_data = {
                'model': self.model,
                'feature_extractor': self.feature_extractor,
                'target_encoder': self.target_encoder,
                'trained': True
            }
            joblib.dump(model_data, self.model_path)
            logger.info(f"Model saved to {self.model_path}")

    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            if Path(self.model_path).exists():
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.feature_extractor = model_data['feature_extractor']
                self.target_encoder = model_data['target_encoder']
                self.trained = model_data['trained']
                logger.info("Model loaded successfully")
                return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
        return False


class UnifiedColumnMapper:
    """
    Unified column mapping system integrating with Scout ETL infrastructure
    """

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        self.supabase_client = None
        self.ml_matcher = MLColumnMatcher()
        self.feature_extractor = ColumnFeatureExtractor()
        self.mapping_cache = {}
        self.transformation_rules = self._load_transformation_rules()

        # Initialize database connection
        if SUPABASE_AVAILABLE and supabase_url and supabase_key:
            try:
                self.supabase_client = create_client(supabase_url, supabase_key)
                logger.info("Connected to Supabase")
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {e}")

        # Load existing mappings and train ML model
        self._initialize_system()

    def _initialize_system(self):
        """Initialize the mapping system"""
        # Load existing mappings
        historical_mappings = self._load_historical_mappings()

        # Build cache
        for mapping in historical_mappings:
            cache_key = f"{mapping.source_column}:{mapping.sheet_source or 'global'}"
            self.mapping_cache[cache_key] = mapping

        # Train ML model if enough data
        if len(historical_mappings) >= 10:
            training_data = [
                (m.source_column, m.target_column, m.confidence_score)
                for m in historical_mappings
                if m.confidence_score > 0.5
            ]

            if training_data:
                result = self.ml_matcher.train(training_data)
                logger.info(f"ML model training result: {result}")
        else:
            # Try to load existing model
            self.ml_matcher.load_model()

    def _load_transformation_rules(self) -> Dict[str, str]:
        """Load transformation rules for data cleaning"""
        return {
            'extract_store_number': r'\d+',
            'standardize_datetime': 'datetime',
            'standardize_payment_method': 'upper_underscore',
            'standardize_category': 'title_case',
            'standardize_age_group': 'age_bracket',
            'categorize_basket_size': 'basket_category',
            'normalize_currency': 'decimal_2',
            'extract_brand': 'brand_name',
            'clean_product_name': 'product_clean'
        }

    def find_column_mapping(self, source_column: str,
                           available_targets: List[str],
                           sheet_source: str = None,
                           min_confidence: float = 0.6) -> Optional[ColumnMapping]:
        """
        Find the best column mapping using multiple strategies
        """
        cache_key = f"{source_column}:{sheet_source or 'global'}"

        # Check cache first
        if cache_key in self.mapping_cache:
            cached_mapping = self.mapping_cache[cache_key]
            if cached_mapping.target_column in available_targets:
                # Update usage
                cached_mapping.usage_count += 1
                cached_mapping.last_used = datetime.now()
                self._save_mapping(cached_mapping)
                return cached_mapping

        # Try different matching strategies
        strategies = [
            self._exact_match,
            self._fuzzy_match,
            self._pattern_match,
            self._ml_match,
            self._historical_match
        ]

        best_mapping = None
        best_confidence = 0.0

        for strategy in strategies:
            mapping = strategy(source_column, available_targets, sheet_source)
            if mapping and mapping.confidence_score > best_confidence:
                best_mapping = mapping
                best_confidence = mapping.confidence_score

                # If confidence is high enough, use this mapping
                if best_confidence >= min_confidence:
                    break

        # Save and cache the best mapping
        if best_mapping and best_confidence >= min_confidence:
            best_mapping.created_at = datetime.now()
            best_mapping.last_used = datetime.now()
            best_mapping.usage_count = 1

            self._save_mapping(best_mapping)
            self.mapping_cache[cache_key] = best_mapping

            return best_mapping

        return None

    def _exact_match(self, source: str, targets: List[str],
                    sheet_source: str = None) -> Optional[ColumnMapping]:
        """Exact string matching"""
        source_clean = source.lower().strip()

        for target in targets:
            if source_clean == target.lower().strip():
                return ColumnMapping(
                    source_column=source,
                    target_column=target,
                    match_strategy=MatchStrategy.EXACT_MATCH,
                    confidence_score=1.0,
                    data_type=self._infer_data_type(source),
                    sheet_source=sheet_source
                )
        return None

    def _fuzzy_match(self, source: str, targets: List[str],
                    sheet_source: str = None) -> Optional[ColumnMapping]:
        """Fuzzy string matching"""
        best_match = None
        best_score = 0.0
        threshold = 0.8

        source_clean = self._clean_column_name(source)

        for target in targets:
            target_clean = self._clean_column_name(target)
            score = SequenceMatcher(None, source_clean, target_clean).ratio()

            if score > best_score and score >= threshold:
                best_score = score
                best_match = target

        if best_match:
            return ColumnMapping(
                source_column=source,
                target_column=best_match,
                match_strategy=MatchStrategy.FUZZY_MATCH,
                confidence_score=best_score,
                data_type=self._infer_data_type(source),
                sheet_source=sheet_source
            )
        return None

    def _pattern_match(self, source: str, targets: List[str],
                      sheet_source: str = None) -> Optional[ColumnMapping]:
        """Pattern-based matching using domain knowledge"""
        patterns = {
            r'.*transaction.*id.*': ['transaction_id', 'txn_id', 'trans_id'],
            r'.*store.*id.*': ['store_id', 'shop_id', 'location_id'],
            r'.*payment.*method.*': ['payment_method', 'payment_type', 'pay_method'],
            r'.*customer.*gender.*': ['customer_gender', 'gender', 'cust_gender'],
            r'.*age.*group.*': ['age_group', 'age_bracket', 'age_category'],
            r'.*product.*category.*': ['product_category', 'category', 'prod_cat'],
            r'.*total.*amount.*': ['total_amount', 'amount', 'total_cost'],
            r'.*brand.*name.*': ['brand_name', 'brand', 'manufacturer'],
            r'.*timestamp.*': ['timestamp', 'created_at', 'datetime'],
            r'.*quantity.*': ['quantity', 'qty', 'amount_qty']
        }

        source_lower = source.lower()

        for pattern, possible_targets in patterns.items():
            if re.match(pattern, source_lower):
                for target in targets:
                    if target.lower() in [t.lower() for t in possible_targets]:
                        confidence = 0.85  # Pattern matches get high confidence
                        return ColumnMapping(
                            source_column=source,
                            target_column=target,
                            match_strategy=MatchStrategy.PATTERN_MATCH,
                            confidence_score=confidence,
                            data_type=self._infer_data_type(source),
                            sheet_source=sheet_source
                        )
        return None

    def _ml_match(self, source: str, targets: List[str],
                 sheet_source: str = None) -> Optional[ColumnMapping]:
        """ML-based matching"""
        if not self.ml_matcher.trained:
            return None

        predictions = self.ml_matcher.predict_mapping(source, targets)

        if predictions and predictions[0][1] > 0.6:  # Min confidence threshold
            target, confidence = predictions[0]
            return ColumnMapping(
                source_column=source,
                target_column=target,
                match_strategy=MatchStrategy.ML_MATCH,
                confidence_score=confidence,
                data_type=self._infer_data_type(source),
                sheet_source=sheet_source
            )
        return None

    def _historical_match(self, source: str, targets: List[str],
                         sheet_source: str = None) -> Optional[ColumnMapping]:
        """Match based on historical usage patterns"""
        # Find similar source columns in cache
        similar_mappings = []

        for cached_key, mapping in self.mapping_cache.items():
            if mapping.target_column in targets:
                similarity = self.feature_extractor.get_similarity_score(
                    source, mapping.source_column
                )
                if similarity > 0.7:
                    # Weight by usage count and similarity
                    weighted_confidence = similarity * min(mapping.usage_count / 10, 1.0)
                    similar_mappings.append((mapping, weighted_confidence))

        if similar_mappings:
            # Sort by weighted confidence
            similar_mappings.sort(key=lambda x: x[1], reverse=True)
            best_mapping, confidence = similar_mappings[0]

            return ColumnMapping(
                source_column=source,
                target_column=best_mapping.target_column,
                match_strategy=MatchStrategy.HISTORICAL_MATCH,
                confidence_score=confidence,
                data_type=self._infer_data_type(source),
                transformation=best_mapping.transformation,
                sheet_source=sheet_source
            )
        return None

    def _clean_column_name(self, name: str) -> str:
        """Clean column name for matching"""
        # Remove special characters and normalize
        cleaned = re.sub(r'[^a-zA-Z0-9]', '', name.lower())
        # Remove common prefixes/suffixes
        for pattern in ['unnamed', 'column', 'field', 'col', 'new', 'old']:
            cleaned = cleaned.replace(pattern, '')
        return cleaned

    def _infer_data_type(self, column_name: str) -> str:
        """Infer data type from column name"""
        name_lower = column_name.lower()

        if any(keyword in name_lower for keyword in ['id', 'key', 'number']):
            return 'string'
        elif any(keyword in name_lower for keyword in ['amount', 'price', 'cost', 'total']):
            return 'numeric'
        elif any(keyword in name_lower for keyword in ['date', 'time', 'timestamp']):
            return 'datetime'
        elif any(keyword in name_lower for keyword in ['count', 'quantity', 'qty']):
            return 'integer'
        else:
            return 'string'

    def _load_historical_mappings(self) -> List[ColumnMapping]:
        """Load historical mappings from database or file"""
        mappings = []

        if self.supabase_client:
            try:
                response = self.supabase_client.table('column_mappings').select('*').execute()
                for row in response.data:
                    mapping = ColumnMapping.from_dict(row)
                    mappings.append(mapping)
                logger.info(f"Loaded {len(mappings)} historical mappings from database")
            except Exception as e:
                logger.error(f"Error loading mappings from database: {e}")
        else:
            # Load from file as fallback
            mapping_file = Path('/tmp/column_mappings.json')
            if mapping_file.exists():
                try:
                    with open(mapping_file, 'r') as f:
                        data = json.load(f)
                        mappings = [ColumnMapping.from_dict(item) for item in data]
                    logger.info(f"Loaded {len(mappings)} mappings from file")
                except Exception as e:
                    logger.error(f"Error loading mappings from file: {e}")

        return mappings

    def _save_mapping(self, mapping: ColumnMapping):
        """Save mapping to database or file"""
        if self.supabase_client:
            try:
                data = mapping.to_dict()
                # Upsert based on source_column and sheet_source
                self.supabase_client.table('column_mappings').upsert(
                    data,
                    on_conflict='source_column,sheet_source'
                ).execute()
            except Exception as e:
                logger.error(f"Error saving mapping to database: {e}")
        else:
            # Save to file as fallback
            self._save_mappings_to_file()

    def _save_mappings_to_file(self):
        """Save all mappings to file"""
        mapping_file = Path('/tmp/column_mappings.json')
        try:
            data = [mapping.to_dict() for mapping in self.mapping_cache.values()]
            with open(mapping_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving mappings to file: {e}")

    def batch_map_columns(self, source_columns: List[str],
                         target_schema: List[str],
                         sheet_source: str = None) -> Dict[str, ColumnMapping]:
        """
        Map multiple columns at once
        Returns dict of source_column -> ColumnMapping
        """
        mappings = {}
        unmapped_sources = []
        available_targets = target_schema.copy()

        # First pass: find mappings
        for source_col in source_columns:
            mapping = self.find_column_mapping(
                source_col, available_targets, sheet_source
            )

            if mapping:
                mappings[source_col] = mapping
                # Remove mapped target to avoid duplicates
                if mapping.target_column in available_targets:
                    available_targets.remove(mapping.target_column)
            else:
                unmapped_sources.append(source_col)

        # Log results
        logger.info(f"Mapped {len(mappings)}/{len(source_columns)} columns")
        if unmapped_sources:
            logger.warning(f"Unmapped columns: {unmapped_sources}")

        return mappings

    def generate_mapping_report(self, mappings: Dict[str, ColumnMapping]) -> Dict[str, Any]:
        """Generate detailed mapping report"""
        if not mappings:
            return {'total_mappings': 0, 'strategies': {}, 'confidence_distribution': {}}

        strategy_counts = {}
        confidence_scores = []

        for mapping in mappings.values():
            strategy = mapping.match_strategy.value
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
            confidence_scores.append(mapping.confidence_score)

        # Confidence distribution
        confidence_dist = {
            'high (>0.9)': sum(1 for s in confidence_scores if s > 0.9),
            'medium (0.7-0.9)': sum(1 for s in confidence_scores if 0.7 <= s <= 0.9),
            'low (<0.7)': sum(1 for s in confidence_scores if s < 0.7)
        }

        return {
            'total_mappings': len(mappings),
            'average_confidence': np.mean(confidence_scores) if confidence_scores else 0,
            'strategies': strategy_counts,
            'confidence_distribution': confidence_dist,
            'unmapped_rate': 0,  # To be calculated by caller
            'timestamp': datetime.now().isoformat()
        }

    def retrain_ml_model(self) -> Dict[str, Any]:
        """Retrain the ML model with latest data"""
        historical_mappings = self._load_historical_mappings()

        if len(historical_mappings) < 10:
            return {'status': 'insufficient_data', 'samples': len(historical_mappings)}

        # Prepare training data from validated mappings
        training_data = [
            (m.source_column, m.target_column, m.confidence_score)
            for m in historical_mappings
            if m.user_validated or m.confidence_score > 0.8
        ]

        return self.ml_matcher.train(training_data)


def main():
    """Test the unified column mapper"""
    import os

    # Initialize mapper
    mapper = UnifiedColumnMapper(
        supabase_url=os.getenv('SUPABASE_URL'),
        supabase_key=os.getenv('SUPABASE_KEY')
    )

    # Test column mapping
    source_columns = [
        'trans_id', 'store_number', 'payment_type', 'customer_age',
        'product_category', 'total_cost', 'transaction_date'
    ]

    target_schema = [
        'transaction_id', 'store_id', 'payment_method', 'age_group',
        'category', 'total_amount', 'timestamp', 'customer_gender'
    ]

    # Perform mapping
    mappings = mapper.batch_map_columns(source_columns, target_schema, 'test_sheet')

    # Generate report
    report = mapper.generate_mapping_report(mappings)

    print("\n" + "="*50)
    print("COLUMN MAPPING RESULTS")
    print("="*50)

    for source, mapping in mappings.items():
        print(f"{source} → {mapping.target_column} ({mapping.match_strategy.value}, {mapping.confidence_score:.2f})")

    print(f"\nReport: {json.dumps(report, indent=2)}")


if __name__ == "__main__":
    main()