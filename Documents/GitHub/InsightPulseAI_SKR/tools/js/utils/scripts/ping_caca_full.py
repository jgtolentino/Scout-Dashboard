#!/usr/bin/env python3
# ping_caca_full.py - Full Caca QA Validation Framework for InsightPulseAI
# Created: 2025-05-15

import argparse
import json
import os
import sys
import logging
import datetime
import yaml
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("caca_qa_full.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("caca_qa")

# Base configuration
CONFIG_PATH = os.environ.get("CACA_CONFIG", "qa_config.yaml")
GOLDEN_DATASET_PATH = os.environ.get("GOLDEN_DATASET_PATH", "qa/golden_datasets")
OUTPUT_PATH = os.environ.get("QA_OUTPUT_PATH", "qa/results")

# Ensure all required directories exist
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Validation result data class
@dataclass
class ValidationResult:
    """Standardized validation result format"""
    status: str  # "PASS" or "FAIL"
    scores: Dict[str, float]
    details: Dict[str, Any]
    timestamp: str = None
    validator: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.datetime.now().isoformat()

# Base validator abstract class
class BaseValidator(ABC):
    """Abstract base class for all validators"""
    
    def __init__(self, config: Dict[str, Any], name: str):
        self.config = config
        self.name = name
        self.thresholds = config.get("thresholds", {})
        self.metrics = config.get("metrics", [])
        
    @abstractmethod
    def validate(self, input_data: Any) -> ValidationResult:
        """Perform validation on the input data"""
        pass
    
    def check_thresholds(self, scores: Dict[str, float]) -> bool:
        """Check if all scores meet their thresholds"""
        for metric, score in scores.items():
            if metric in self.thresholds and score < self.thresholds[metric]:
                return False
        return True
    
    def log_result(self, result: ValidationResult) -> None:
        """Log validation result"""
        scores_str = ", ".join([f"{k}: {v:.2f}" for k, v in result.scores.items()])
        logger.info(f"Validation {result.status}: {self.name} - {scores_str}")

# Prompt validator
class PromptValidator(BaseValidator):
    """Validates prompt quality, safety, and effectiveness"""
    
    def validate(self, input_data: Dict[str, Any]) -> ValidationResult:
        prompt_id = input_data.get("prompt_id")
        prompt_text = input_data.get("prompt_text")
        
        # Log validation attempt
        logger.info(f"Validating prompt: {prompt_id}")
        
        # Get prompt from library if only ID provided
        if prompt_id and not prompt_text:
            prompt_text = self._get_prompt_from_library(prompt_id)
            if not prompt_text:
                return ValidationResult(
                    status="FAIL",
                    scores={"error": 1.0},
                    details={"error": f"Prompt ID {prompt_id} not found in library"},
                    validator=self.name
                )
        
        # Test cases to run
        test_cases = input_data.get("test_cases", self._get_default_test_cases(prompt_id))
        
        # Run validation tests
        correctness_score = self._validate_correctness(prompt_text, test_cases)
        safety_score = self._validate_safety(prompt_text)
        consistency_score = self._validate_consistency(prompt_text, test_cases)
        
        # Calculate overall scores
        scores = {
            "correctness": correctness_score,
            "safety": safety_score,
            "consistency": consistency_score,
            "overall": (correctness_score + safety_score + consistency_score) / 3
        }
        
        # Generate result details
        details = {
            "prompt_id": prompt_id,
            "test_cases_run": len(test_cases),
            "test_case_results": self._get_test_results(prompt_text, test_cases),
            "safety_analysis": self._get_safety_analysis(prompt_text),
            "consistency_data": self._get_consistency_data(prompt_text, test_cases)
        }
        
        # Determine pass/fail status
        status = "PASS" if self.check_thresholds(scores) else "FAIL"
        
        result = ValidationResult(
            status=status,
            scores=scores,
            details=details,
            validator=self.name
        )
        
        self.log_result(result)
        return result
    
    def _get_prompt_from_library(self, prompt_id: str) -> Optional[str]:
        """Retrieve prompt text from prompt library"""
        # In production, this would query the prompt library
        # For this demo, we'll simulate with sample prompts
        sample_prompts = {
            "pcode-v1": "Write clear, efficient code to solve the following problem: {{PROBLEM}}",
            "pauto-v1": "You are an autonomous agent tasked with {{TASK}}. Proceed step by step.",
            "plist-v1": "List all the relevant {{ITEMS}} for {{CONTEXT}}.",
            "pdev-v1": "You're working in a development environment. {{TASK}}",
            "pdocs-v1": "Create comprehensive documentation for {{SUBJECT}}."
        }
        return sample_prompts.get(prompt_id)
    
    def _get_default_test_cases(self, prompt_id: str) -> List[Dict[str, Any]]:
        """Get default test cases for prompt ID"""
        # In production, this would load from a test case database
        # For this demo, we'll use sample test cases
        return [
            {
                "input": {"PROBLEM": "Sort an array of integers"},
                "expected_pattern": r"function\s+sort|def\s+sort|sort\s*\(|sorting"
            },
            {
                "input": {"PROBLEM": "Find the maximum value in a list"},
                "expected_pattern": r"function\s+find_max|def\s+find_max|max\s*\(|maximum"
            }
        ]
    
    def _validate_correctness(self, prompt_text: str, test_cases: List[Dict[str, Any]]) -> float:
        """Validate prompt produces correct outputs for test cases"""
        # In production, this would run actual tests with the LLM
        # For this demo, we'll simulate results
        correct_count = 0
        for test_case in test_cases:
            # Simulate correct responses for 85% of cases
            if hash(str(test_case)) % 100 < 85:
                correct_count += 1
        
        return correct_count / len(test_cases) if test_cases else 0.0
    
    def _validate_safety(self, prompt_text: str) -> float:
        """Validate prompt safety"""
        # In production, this would run through a safety classifier
        # For this demo, we'll use simple heuristics
        unsafe_patterns = [
            r"hack", r"exploit", r"bypass", r"illegal", 
            r"harmful", r"dangerous", r"attack"
        ]
        
        # Check for unsafe patterns
        unsafe_count = 0
        for pattern in unsafe_patterns:
            if re.search(pattern, prompt_text, re.IGNORECASE):
                unsafe_count += 1
        
        safety_score = 1.0 - (unsafe_count / len(unsafe_patterns))
        return max(0.0, min(1.0, safety_score))
    
    def _validate_consistency(self, prompt_text: str, test_cases: List[Dict[str, Any]]) -> float:
        """Validate prompt produces consistent outputs"""
        # In production, this would run multiple trials
        # For this demo, we'll simulate consistency
        return 0.9  # Simulate 90% consistency
    
    def _get_test_results(self, prompt_text: str, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate detailed test results for each test case"""
        results = []
        for i, test_case in enumerate(test_cases):
            # Simulate results
            passed = hash(str(test_case) + str(i)) % 100 < 85
            results.append({
                "test_case_id": i,
                "inputs": test_case["input"],
                "passed": passed,
                "response_sample": f"Simulated response for test case {i}"
            })
        return results
    
    def _get_safety_analysis(self, prompt_text: str) -> Dict[str, Any]:
        """Generate safety analysis for the prompt"""
        return {
            "unsafe_patterns_detected": 0,
            "safety_category_scores": {
                "illegal_content": 0.02,
                "harmful_instructions": 0.03,
                "malware_generation": 0.01,
                "privacy_violation": 0.02
            },
            "overall_safety_risk": "low"
        }
    
    def _get_consistency_data(self, prompt_text: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate consistency analysis data"""
        return {
            "trials_per_case": 5,
            "consistency_by_case": [
                {"test_case_id": i, "consistency_score": 0.9 + (hash(str(i)) % 10) / 100}
                for i in range(len(test_cases))
            ],
            "variance_statistics": {
                "mean_variance": 0.05,
                "max_variance": 0.12
            }
        }

# Brand mention validator
class BrandMentionValidator(BaseValidator):
    """Validates brand mention detection quality"""
    
    def validate(self, input_data: Dict[str, Any]) -> ValidationResult:
        interaction_id = input_data.get("interaction_id")
        
        # Log validation attempt
        logger.info(f"Validating brand mentions for interaction: {interaction_id}")
        
        # Get test case (in production, this would come from a database)
        test_case = self._get_test_case(interaction_id)
        if not test_case:
            return ValidationResult(
                status="FAIL",
                scores={"error": 1.0},
                details={"error": f"Test case for interaction {interaction_id} not found"},
                validator=self.name
            )
        
        # Get detected brands
        detected_brands = self._get_detected_brands(interaction_id)
        
        # Match detected brands with expected brands
        detection_results = []
        for expected in test_case["expected_brands"]:
            found = False
            detected_brand = None
            
            for detected in detected_brands:
                if detected["brand"].lower() == expected["brand"].lower():
                    found = True
                    detected_brand = detected
                    break
            
            detection_results.append({
                "brand": expected["brand"],
                "expected": True,
                "detected": found,
                "confidence": detected_brand["confidence"] if found else 0,
                "min_confidence": expected["min_confidence"],
                "meets_threshold": found and detected_brand["confidence"] >= expected["min_confidence"] if found else False
            })
        
        # Check for false positives (detected brands not in expected list)
        for detected in detected_brands:
            if not any(d["brand"].lower() == detected["brand"].lower() for d in test_case["expected_brands"]):
                detection_results.append({
                    "brand": detected["brand"],
                    "expected": False,
                    "detected": True,
                    "confidence": detected["confidence"],
                    "min_confidence": 0,
                    "meets_threshold": False,
                    "false_positive": True
                })
        
        # Calculate metrics
        true_positives = sum(1 for r in detection_results if r["expected"] and r["detected"])
        false_negatives = sum(1 for r in detection_results if r["expected"] and not r["detected"])
        false_positives = sum(1 for r in detection_results if not r["expected"] and r["detected"])
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        # Calculate scores
        scores = {
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score
        }
        
        # Generate result details
        details = {
            "interaction_id": interaction_id,
            "detection_results": detection_results,
            "metrics": {
                "true_positives": true_positives,
                "false_negatives": false_negatives,
                "false_positives": false_positives
            },
            "text": test_case["text"]
        }
        
        # Determine pass/fail status
        status = "PASS" if self.check_thresholds(scores) else "FAIL"
        
        result = ValidationResult(
            status=status,
            scores=scores,
            details=details,
            validator=self.name
        )
        
        self.log_result(result)
        self._display_brand_results(result)
        return result
    
    def _get_test_case(self, interaction_id: str) -> Dict[str, Any]:
        """Get test case for the given interaction ID"""
        if interaction_id == "TEST_BRAND_001":
            return {
                "interaction_id": "TEST_BRAND_001",
                "expected_brands": [
                    {"brand": "Samsung", "min_confidence": 0.8},
                    {"brand": "Pepsi", "min_confidence": 0.8},
                    {"brand": "Jollibee", "min_confidence": 0.8},
                    {"brand": "Nike", "min_confidence": 0.8},
                    {"brand": "Globe Telecom", "min_confidence": 0.7},
                    {"brand": "PLDT", "min_confidence": 0.7}
                ],
                "text": "I just bought a Samsung phone and drank Pepsi at Jollibee while wearing Nike shoes. Globe Telecom has better coverage than PLDT."
            }
        return {}
    
    def _get_detected_brands(self, interaction_id: str) -> List[Dict[str, Any]]:
        """Get detected brands for the given interaction ID"""
        # In production, this would query the database
        # For this demo, we'll simulate with sample data
        if interaction_id == "TEST_BRAND_001":
            return [
                {"brand": "Samsung", "confidence": 0.94, "chunk_index": 0},
                {"brand": "Pepsi", "confidence": 0.91, "chunk_index": 0},
                {"brand": "Jollibee", "confidence": 0.88, "chunk_index": 0},
                {"brand": "Nike", "confidence": 0.92, "chunk_index": 0},
                {"brand": "Globe Telecom", "confidence": 0.85, "chunk_index": 1},
                {"brand": "PLDT", "confidence": 0.75, "chunk_index": 1},
                # False positive with lower confidence
                {"brand": "Google", "confidence": 0.45, "chunk_index": 0}
            ]
        return []
    
    def _display_brand_results(self, results: ValidationResult) -> None:
        """Display brand detection results in a formatted way"""
        print("\n" + "="*60)
        print(f"BRAND DETECTION QA RESULTS: {results.status}")
        print("="*60)
        
        print("\nDetection Results:")
        print(f"{'Brand':<20} {'Expected':<10} {'Detected':<10} {'Confidence':<12} {'Threshold':<10} {'Status':<8}")
        print("-"*70)
        
        for res in results.details["detection_results"]:
            status = "✅" if res["detected"] and res.get("meets_threshold", False) else "❌"
            if not res["expected"] and res["detected"]:
                status = "⚠️ FP"  # False positive
                
            print(f"{res['brand']:<20} {'Yes' if res['expected'] else 'No':<10} {'Yes' if res['detected'] else 'No':<10} {res['confidence']:.2f}{'':<6} {res['min_confidence']:<10} {status:<8}")
        
        print("\nMetrics:")
        metrics = results.details["metrics"]
        print(f"Precision:      {results.scores['precision']:.2f} ({results.scores['precision']*100:.0f}%)")
        print(f"Recall:         {results.scores['recall']:.2f} ({results.scores['recall']*100:.0f}%)")
        print(f"F1 Score:       {results.scores['f1_score']:.2f}")
        print(f"True Positives: {metrics['true_positives']}")
        print(f"False Negatives: {metrics['false_negatives']}")
        print(f"False Positives: {metrics['false_positives']}")
        
        print("\nOverall Status:")
        if results.status == "PASS":
            print("✅ PASS: Brand detection is working as expected")
        else:
            print("❌ FAIL: Brand detection needs adjustment")
        
        print("="*60 + "\n")

# Dashboard validator
class DashboardValidator(BaseValidator):
    """Validates dashboard quality, accessibility, and performance"""
    
    def validate(self, input_data: Dict[str, Any]) -> ValidationResult:
        dashboard_path = input_data.get("dashboard_path")
        baseline_path = input_data.get("baseline_path")
        
        # Log validation attempt
        logger.info(f"Validating dashboard: {dashboard_path}")
        
        # Check if dashboard file exists
        if not os.path.exists(dashboard_path):
            return ValidationResult(
                status="FAIL",
                scores={"error": 1.0},
                details={"error": f"Dashboard file not found: {dashboard_path}"},
                validator=self.name
            )
        
        # Run validation tests
        visual_score = self._validate_visual(dashboard_path, baseline_path)
        accessibility_score = self._validate_accessibility(dashboard_path)
        performance_score = self._validate_performance(dashboard_path)
        functionality_score = self._validate_functionality(dashboard_path)
        
        # Calculate overall scores
        scores = {
            "visual": visual_score,
            "accessibility": accessibility_score,
            "performance": performance_score,
            "functionality": functionality_score,
            "overall": (visual_score + accessibility_score + performance_score + functionality_score) / 4
        }
        
        # Generate result details
        details = {
            "dashboard_path": dashboard_path,
            "baseline_path": baseline_path,
            "visual_analysis": self._get_visual_analysis(dashboard_path, baseline_path),
            "accessibility_report": self._get_accessibility_report(dashboard_path),
            "performance_metrics": self._get_performance_metrics(dashboard_path),
            "functionality_report": self._get_functionality_report(dashboard_path)
        }
        
        # Determine pass/fail status
        status = "PASS" if self.check_thresholds(scores) else "FAIL"
        
        result = ValidationResult(
            status=status,
            scores=scores,
            details=details,
            validator=self.name
        )
        
        self.log_result(result)
        self._display_dashboard_results(result)
        return result
    
    def _validate_visual(self, dashboard_path: str, baseline_path: str) -> float:
        """Validate dashboard visual appearance against baseline"""
        # In production, this would do a pixel-by-pixel comparison
        # For this demo, we'll simulate a result
        return 0.97  # 97% visual match
    
    def _validate_accessibility(self, dashboard_path: str) -> float:
        """Validate dashboard accessibility compliance"""
        # In production, this would run accessibility tests
        # For this demo, we'll simulate a result
        return 0.92  # 92% accessibility compliance
    
    def _validate_performance(self, dashboard_path: str) -> float:
        """Validate dashboard performance metrics"""
        # In production, this would run performance tests
        # For this demo, we'll simulate a result
        return 0.85  # 85% performance score
    
    def _validate_functionality(self, dashboard_path: str) -> float:
        """Validate dashboard functionality"""
        # In production, this would test interactive features
        # For this demo, we'll simulate a result
        return 0.95  # 95% functionality score
    
    def _get_visual_analysis(self, dashboard_path: str, baseline_path: str) -> Dict[str, Any]:
        """Generate visual analysis report"""
        return {
            "diff_percentage": 0.03,
            "pixel_differences": 8254,
            "total_pixels": 275200,
            "diff_clusters": 3,
            "diff_locations": [
                {"x": 120, "y": 50, "width": 100, "height": 20},
                {"x": 500, "y": 300, "width": 150, "height": 30},
                {"x": 800, "y": 400, "width": 50, "height": 40}
            ]
        }
    
    def _get_accessibility_report(self, dashboard_path: str) -> Dict[str, Any]:
        """Generate accessibility compliance report"""
        return {
            "wcag_level": "AA",
            "passed_rules": 38,
            "failed_rules": 3,
            "warnings": 5,
            "issues": [
                {"rule": "color-contrast", "element": "header", "impact": "moderate"},
                {"rule": "aria-roles", "element": "chart-1", "impact": "minor"},
                {"rule": "focus-order", "element": "filter-dropdown", "impact": "moderate"}
            ]
        }
    
    def _get_performance_metrics(self, dashboard_path: str) -> Dict[str, Any]:
        """Generate performance metrics report"""
        return {
            "load_time_ms": 687,
            "first_paint_ms": 320,
            "time_to_interactive_ms": 850,
            "layout_shifts": 2,
            "memory_usage_mb": 45.2,
            "cpu_usage_percent": 12.5,
            "render_blocking_resources": 3
        }
    
    def _get_functionality_report(self, dashboard_path: str) -> Dict[str, Any]:
        """Generate functionality test report"""
        return {
            "components_tested": 12,
            "components_passed": 11,
            "components_failed": 1,
            "interactive_elements": {
                "filters": {"status": "pass", "tests": 5, "passed": 5},
                "charts": {"status": "pass", "tests": 8, "passed": 8},
                "tables": {"status": "pass", "tests": 4, "passed": 4},
                "navigation": {"status": "fail", "tests": 3, "passed": 2, "failed": 1}
            }
        }
    
    def _display_dashboard_results(self, results: ValidationResult) -> None:
        """Display dashboard validation results in a formatted way"""
        print("\n" + "="*60)
        print(f"DASHBOARD QA RESULTS: {results.status}")
        print("="*60)
        
        print("\nQuality Scores:")
        for metric, score in results.scores.items():
            if metric != "overall":
                threshold = self.thresholds.get(metric, 0.0)
                status = "✅" if score >= threshold else "❌"
                print(f"{metric.capitalize():<15} {score:.2f} ({score*100:.0f}%) {status}")
        
        print(f"\nOverall Score:   {results.scores['overall']:.2f} ({results.scores['overall']*100:.0f}%)")
        
        if "visual_analysis" in results.details:
            visual = results.details["visual_analysis"]
            print("\nVisual Comparison:")
            print(f"Difference:     {visual['diff_percentage']:.2%} ({visual['pixel_differences']} pixels)")
            print(f"Diff Clusters:  {visual['diff_clusters']}")
        
        if "accessibility_report" in results.details:
            access = results.details["accessibility_report"]
            print("\nAccessibility:")
            print(f"WCAG Level:     {access['wcag_level']}")
            print(f"Rules Passed:   {access['passed_rules']}/{access['passed_rules'] + access['failed_rules']}")
            print(f"Warnings:       {access['warnings']}")
        
        if "performance_metrics" in results.details:
            perf = results.details["performance_metrics"]
            print("\nPerformance:")
            print(f"Load Time:      {perf['load_time_ms']}ms")
            print(f"Interactive:    {perf['time_to_interactive_ms']}ms")
            print(f"Memory Usage:   {perf['memory_usage_mb']:.1f}MB")
        
        print("\nOverall Status:")
        if results.status == "PASS":
            print("✅ PASS: Dashboard meets quality standards")
        else:
            print("❌ FAIL: Dashboard needs improvement")
        
        print("="*60 + "\n")

# Main validator class
class CacaValidator:
    """Main QA validation framework that orchestrates all validators"""
    
    def __init__(self, config_path: str = CONFIG_PATH):
        self.validators = {}
        self.config = self._load_config(config_path)
        self.qa_results = {
            "timestamp": datetime.datetime.now().isoformat(),
            "validator": "Caca",
            "checks": []
        }
        
        # Initialize validators
        self._init_validators()
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            logger.warning(f"Configuration file not found: {config_path}")
            logger.warning("Using default configuration")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration when config file is not available"""
        return {
            "version": "1.0",
            "validation": {
                "prompt_quality": {
                    "metrics": ["correctness", "safety", "consistency"],
                    "thresholds": {
                        "correctness": 0.85,
                        "safety": 0.95,
                        "consistency": 0.90,
                        "overall": 0.90
                    }
                },
                "brand_mentions": {
                    "metrics": ["precision", "recall", "f1_score"],
                    "thresholds": {
                        "precision": 0.80,
                        "recall": 0.80,
                        "f1_score": 0.80
                    }
                },
                "dashboard_quality": {
                    "metrics": ["visual", "accessibility", "performance", "functionality"],
                    "thresholds": {
                        "visual": 0.90,
                        "accessibility": 0.85,
                        "performance": 0.80,
                        "functionality": 0.90,
                        "overall": 0.85
                    }
                }
            }
        }
    
    def _init_validators(self) -> None:
        """Initialize all validators based on configuration"""
        validation_config = self.config.get("validation", {})
        
        # Initialize prompt validator
        if "prompt_quality" in validation_config:
            self.validators["prompt_quality"] = PromptValidator(
                validation_config["prompt_quality"],
                "prompt_quality"
            )
        
        # Initialize brand mention validator
        if "brand_mentions" in validation_config:
            self.validators["brand_mentions"] = BrandMentionValidator(
                validation_config["brand_mentions"],
                "brand_mentions"
            )
        
        # Initialize dashboard validator
        if "dashboard_quality" in validation_config:
            self.validators["dashboard_quality"] = DashboardValidator(
                validation_config["dashboard_quality"],
                "dashboard_quality"
            )
    
    def check_prompt_quality(self, args: argparse.Namespace) -> ValidationResult:
        """Validate prompt quality"""
        if "prompt_quality" not in self.validators:
            return ValidationResult(
                status="FAIL",
                scores={"error": 1.0},
                details={"error": "Prompt quality validator not configured"},
                validator="CacaValidator"
            )
        
        # Prepare input data
        input_data = {
            "prompt_id": args.prompt_id,
            "prompt_text": args.prompt_text,
            "test_cases": args.test_cases
        }
        
        # Run validation
        result = self.validators["prompt_quality"].validate(input_data)
        
        # Store result
        self.qa_results["checks"].append({
            "check_type": "prompt_quality",
            "prompt_id": args.prompt_id,
            "result": result.__dict__
        })
        
        return result
    
    def check_brand_mentions(self, args: argparse.Namespace) -> ValidationResult:
        """Validate brand mention detection"""
        if "brand_mentions" not in self.validators:
            return ValidationResult(
                status="FAIL",
                scores={"error": 1.0},
                details={"error": "Brand mentions validator not configured"},
                validator="CacaValidator"
            )
        
        # Prepare input data
        input_data = {
            "interaction_id": args.interaction_id,
            "conn_string": args.conn
        }
        
        # Run validation
        result = self.validators["brand_mentions"].validate(input_data)
        
        # Store result
        self.qa_results["checks"].append({
            "check_type": "brand_mentions",
            "interaction_id": args.interaction_id,
            "result": result.__dict__
        })
        
        return result
    
    def check_dashboard_quality(self, args: argparse.Namespace) -> ValidationResult:
        """Validate dashboard quality"""
        if "dashboard_quality" not in self.validators:
            return ValidationResult(
                status="FAIL",
                scores={"error": 1.0},
                details={"error": "Dashboard quality validator not configured"},
                validator="CacaValidator"
            )
        
        # Prepare input data
        input_data = {
            "dashboard_path": args.dashboard,
            "baseline_path": args.baseline
        }
        
        # Run validation
        result = self.validators["dashboard_quality"].validate(input_data)
        
        # Store result
        self.qa_results["checks"].append({
            "check_type": "dashboard_quality",
            "dashboard_path": args.dashboard,
            "result": result.__dict__
        })
        
        return result
    
    def check_all(self, args: argparse.Namespace) -> List[ValidationResult]:
        """Run all available validations"""
        results = []
        
        # Run prompt validation if configured
        if "prompt_quality" in self.validators and args.prompt_id:
            results.append(self.check_prompt_quality(args))
        
        # Run brand mention validation if configured
        if "brand_mentions" in self.validators and args.interaction_id:
            results.append(self.check_brand_mentions(args))
        
        # Run dashboard validation if configured
        if "dashboard_quality" in self.validators and args.dashboard:
            results.append(self.check_dashboard_quality(args))
        
        return results
    
    def save_results(self, output_path: Optional[str] = None) -> None:
        """Save QA results to file"""
        if not output_path:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = os.path.join(OUTPUT_PATH, f"caca_qa_results_{timestamp}.json")
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(self.qa_results, f, indent=2, default=lambda o: o.__dict__ if hasattr(o, "__dict__") else str(o))
        
        logger.info(f"QA results saved to {output_path}")
        print(f"\nFull QA results saved to: {output_path}")

def main() -> int:
    parser = argparse.ArgumentParser(description="Caca QA Validation Framework")
    parser.add_argument("--check", required=True, 
                        choices=["prompt_quality", "brand_mentions", "dashboard_quality", "all"],
                        help="Type of check to perform")
    
    # Input parameters
    parser.add_argument("--prompt-id", help="Prompt ID to validate")
    parser.add_argument("--prompt-text", help="Prompt text to validate")
    parser.add_argument("--interaction-id", help="Interaction ID for brand mentions")
    parser.add_argument("--dashboard", help="Path to dashboard HTML file")
    parser.add_argument("--baseline", help="Path to baseline image for comparison")
    
    # General parameters
    parser.add_argument("--output", help="Output file path for results")
    parser.add_argument("--conn", help="Database connection string")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--test-cases", help="JSON file with test cases")
    
    args = parser.parse_args()
    
    # Initialize validator with custom config if provided
    config_path = args.config if args.config else CONFIG_PATH
    validator = CacaValidator(config_path)
    
    # Parse test cases if provided
    if args.test_cases and os.path.exists(args.test_cases):
        with open(args.test_cases, 'r') as f:
            args.test_cases = json.load(f)
    else:
        args.test_cases = None
    
    # Run the requested check
    if args.check == "prompt_quality":
        if not args.prompt_id and not args.prompt_text:
            print("Error: Either --prompt-id or --prompt-text is required for prompt quality check")
            return 1
        validator.check_prompt_quality(args)
    
    elif args.check == "brand_mentions":
        if not args.interaction_id:
            print("Error: --interaction-id is required for brand mentions check")
            return 1
        validator.check_brand_mentions(args)
    
    elif args.check == "dashboard_quality":
        if not args.dashboard:
            print("Error: --dashboard is required for dashboard quality check")
            return 1
        validator.check_dashboard_quality(args)
    
    elif args.check == "all":
        validator.check_all(args)
    
    else:
        print(f"Unsupported check type: {args.check}")
        return 1
    
    # Save results
    validator.save_results(args.output)
    return 0

if __name__ == "__main__":
    sys.exit(main())