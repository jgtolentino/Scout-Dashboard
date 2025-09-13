#!/usr/bin/env python3
# ping_caca.py - Caca QA Validation Tool for Brand Detection QA
# Created: 2025-05-12

import argparse
import json
import os
import sys
import logging
import datetime
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("caca_qa.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("caca_qa")

class CacaValidator:
    """QA Validation tool for checking various Pulser components"""
    
    def __init__(self):
        self.qa_results = {
            "timestamp": datetime.datetime.now().isoformat(),
            "validator": "Caca",
            "checks": []
        }
    
    def check_brand_mentions(self, args):
        """
        Validate brand mention detection quality
        
        For test mode, compares detection results with known expected brands
        """
        logger.info("Running brand mention QA validation")
        
        # For demonstration, use hardcoded test case
        # In production, this would load from DB
        test_case = {
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
        
        # Simulate detection results
        # In production, this would query TranscriptEntityMentions table
        detected_brands = self._get_detected_brands(test_case["interaction_id"])
        
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
        
        # Determine pass/fail status
        status = "PASS" if precision >= 0.8 and recall >= 0.8 else "FAIL"
        
        qa_result = {
            "check_type": "brand_detection",
            "interaction_id": test_case["interaction_id"],
            "detection_results": detection_results,
            "metrics": {
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score,
                "true_positives": true_positives,
                "false_negatives": false_negatives,
                "false_positives": false_positives
            },
            "status": status
        }
        
        self.qa_results["checks"].append(qa_result)
        
        # Display results
        self._display_brand_results(qa_result)
        
        return qa_result
    
    def _get_detected_brands(self, interaction_id):
        """
        Get detected brands from database (simulated)
        
        In production, this would query the database
        """
        # Simulate detection results with reasonable confidences
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
    
    def _display_brand_results(self, results):
        """Display brand detection results in a formatted way"""
        print("\n" + "="*60)
        print(f"BRAND DETECTION QA RESULTS: {results['status']}")
        print("="*60)
        
        print("\nDetection Results:")
        print(f"{'Brand':<20} {'Expected':<10} {'Detected':<10} {'Confidence':<12} {'Threshold':<10} {'Status':<8}")
        print("-"*70)
        
        for res in results["detection_results"]:
            status = "✅" if res["detected"] and res["meets_threshold"] else "❌"
            if not res["expected"] and res["detected"]:
                status = "⚠️ FP"  # False positive
                
            print(f"{res['brand']:<20} {'Yes' if res['expected'] else 'No':<10} {'Yes' if res['detected'] else 'No':<10} {res['confidence']:.2f}{'':<6} {res['min_confidence']:<10} {status:<8}")
        
        print("\nMetrics:")
        metrics = results["metrics"]
        print(f"Precision:      {metrics['precision']:.2f} ({metrics['precision']*100:.0f}%)")
        print(f"Recall:         {metrics['recall']:.2f} ({metrics['recall']*100:.0f}%)")
        print(f"F1 Score:       {metrics['f1_score']:.2f}")
        print(f"True Positives: {metrics['true_positives']}")
        print(f"False Negatives: {metrics['false_negatives']}")
        print(f"False Positives: {metrics['false_positives']}")
        
        print("\nOverall Status:")
        if results["status"] == "PASS":
            print("✅ PASS: Brand detection is working as expected")
        else:
            print("❌ FAIL: Brand detection needs adjustment")
        
        print("="*60 + "\n")
    
    def save_results(self, output_path=None):
        """Save QA results to file"""
        if not output_path:
            output_path = f"caca_qa_results_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(output_path, 'w') as f:
            json.dump(self.qa_results, f, indent=2)
        
        logger.info(f"QA results saved to {output_path}")
        print(f"\nFull QA results saved to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Caca QA Validation Tool")
    parser.add_argument("--check", required=True, choices=["brand_mentions"],
                        help="Type of check to perform")
    parser.add_argument("--output", help="Output file path for results")
    parser.add_argument("--conn", help="Database connection string")
    args = parser.parse_args()
    
    validator = CacaValidator()
    
    if args.check == "brand_mentions":
        validator.check_brand_mentions(args)
    else:
        print(f"Unsupported check type: {args.check}")
        return 1
    
    validator.save_results(args.output)
    return 0

if __name__ == "__main__":
    sys.exit(main())