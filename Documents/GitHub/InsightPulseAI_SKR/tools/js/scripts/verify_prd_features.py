#!/usr/bin/env python3
"""
PRD Feature Validator for Client360

This script validates a deployed dashboard against PRD feature requirements.
It checks for the presence of HTML elements that indicate implementation of
required features and reports any discrepancies.

Usage:
    python verify_prd_features.py --prd PATH_TO_PRD_YAML --deployed_url URL_TO_VALIDATE
"""

import argparse
import sys
import yaml
import requests
import json
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"prd_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('prd_validator')

def load_prd(prd_file_path):
    """Load and parse the PRD YAML file."""
    try:
        with open(prd_file_path, 'r') as f:
            prd_data = yaml.safe_load(f)
            logger.info(f"Successfully loaded PRD: {prd_data['product_name']} v{prd_data['version']}")
            return prd_data
    except Exception as e:
        logger.error(f"Failed to load PRD file: {e}")
        sys.exit(1)

def fetch_page(url):
    """Fetch a web page and return its HTML content."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        logger.info(f"Successfully fetched page: {url}")
        return response.text
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch page {url}: {e}")
        return None

def check_feature(feature, html_content, soup):
    """Check if a feature is implemented in the HTML."""
    feature_id = feature['id']
    feature_name = feature['name']
    validators = feature['validator'].split(',')
    
    # Initialize result dictionary
    result = {
        'id': feature_id,
        'name': feature_name,
        'status': 'FAIL',
        'details': [],
        'matches': []
    }
    
    # Try each validator
    for validator in validators:
        validator = validator.strip()
        
        # CSS selector validation
        if validator.startswith('.') or validator.startswith('#') or validator.startswith('['):
            matches = soup.select(validator)
            if matches:
                result['matches'].extend([str(match)[:100] + '...' if len(str(match)) > 100 else str(match) for match in matches[:3]])
                result['details'].append(f"Found {len(matches)} elements matching selector: {validator}")
        
        # Text content validation
        elif validator.startswith('text:'):
            text_pattern = validator[5:].strip()
            text_matches = soup.find_all(string=re.compile(text_pattern, re.IGNORECASE))
            if text_matches:
                result['matches'].extend([str(match)[:100] + '...' if len(str(match)) > 100 else str(match) for match in text_matches[:3]])
                result['details'].append(f"Found {len(text_matches)} text matches for: {text_pattern}")
        
        # Attribute validation
        elif validator.startswith('attr:'):
            attr_spec = validator[5:].strip()
            attr_name, attr_value = attr_spec.split('=', 1)
            attr_matches = soup.find_all(attrs={attr_name: re.compile(attr_value, re.IGNORECASE)})
            if attr_matches:
                result['matches'].extend([str(match)[:100] + '...' if len(str(match)) > 100 else str(match) for match in attr_matches[:3]])
                result['details'].append(f"Found {len(attr_matches)} elements with attribute {attr_name}={attr_value}")
        
        # General string search
        else:
            if validator in html_content:
                result['matches'].append(f"Found string: {validator}")
                result['details'].append(f"String found in HTML: {validator}")
    
    # Determine status based on matches
    if result['matches']:
        result['status'] = 'PASS'
    elif feature.get('required', True):
        result['details'].append("REQUIRED FEATURE NOT IMPLEMENTED")
    else:
        result['status'] = 'OPTIONAL'
        result['details'].append("Optional feature not implemented")
    
    return result

def check_interactive_features(url, features_results):
    """
    Check interactive features like toggles and drills by simulating interaction
    This would typically require a browser automation tool like Selenium
    Here we'll just check for supporting JavaScript existence
    """
    # Look for data source toggle feature
    toggle_feature = next((f for f in features_results if f['id'] == 'F9'), None)
    if toggle_feature and toggle_feature['status'] == 'PASS':
        # Check for toggle JavaScript functionality
        js_content = fetch_page(urljoin(url, 'js/data_source_toggle.js'))
        if js_content and ('toggle(' in js_content or 'toggleDataSource' in js_content):
            toggle_feature['details'].append("Toggle JavaScript functionality confirmed")
        else:
            toggle_feature['details'].append("WARNING: Toggle UI exists but JavaScript implementation unclear")
    
    # Look for drill-down feature
    drill_feature = next((f for f in features_results if f['id'] == 'F6'), None)
    if drill_feature and drill_feature['status'] == 'PASS':
        # Check for drill-down JavaScript functionality
        js_content = fetch_page(urljoin(url, 'js/dashboard-interactivity.js'))
        if js_content and ('drill' in js_content.lower() or 'filter' in js_content.lower()):
            drill_feature['details'].append("Drill-down JavaScript functionality confirmed")
        else:
            drill_feature['details'].append("WARNING: Drill-down UI exists but JavaScript implementation unclear")

def validate_features(prd_data, url):
    """Validate all features defined in the PRD against the deployed URL."""
    html_content = fetch_page(url)
    if not html_content:
        return None
    
    soup = BeautifulSoup(html_content, 'html.parser')
    results = []
    
    # Check each feature
    features = prd_data.get('features', [])
    for feature in features:
        if 'validator' in feature:
            result = check_feature(feature, html_content, soup)
            results.append(result)
        else:
            logger.warning(f"Feature {feature['id']} has no validator defined")
            results.append({
                'id': feature['id'],
                'name': feature['name'],
                'status': 'SKIP',
                'details': ["No validator defined for this feature"],
                'matches': []
            })
    
    # Additional check for interactive features
    check_interactive_features(url, results)
    
    return results

def generate_report(prd_data, results, url):
    """Generate a validation report."""
    if not results:
        return {
            'status': 'ERROR',
            'message': 'Failed to validate features',
            'url': url,
            'timestamp': datetime.now().isoformat()
        }
    
    # Count types of results
    pass_count = len([r for r in results if r['status'] == 'PASS'])
    fail_count = len([r for r in results if r['status'] == 'FAIL'])
    skip_count = len([r for r in results if r['status'] == 'SKIP'])
    optional_count = len([r for r in results if r['status'] == 'OPTIONAL'])
    
    # Calculate coverage percentage
    required_features = [f for f in results if f.get('status') != 'SKIP' and f.get('status') != 'OPTIONAL']
    if required_features:
        coverage = (pass_count / len(required_features)) * 100
    else:
        coverage = 100
    
    # Overall validation status
    threshold = prd_data.get('qa_validation', {}).get('coverage_threshold', 100)
    overall_status = 'PASS' if coverage >= threshold else 'FAIL'
    
    report = {
        'status': overall_status,
        'coverage': f"{coverage:.1f}%",
        'threshold': f"{threshold}%",
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'product': prd_data['product_name'],
        'version': prd_data['version'],
        'summary': {
            'pass': pass_count,
            'fail': fail_count,
            'skip': skip_count,
            'optional': optional_count,
            'total': len(results)
        },
        'results': results
    }
    
    return report

def main():
    """Main function to parse arguments and run validation."""
    parser = argparse.ArgumentParser(description='Validate deployed dashboard against PRD requirements')
    parser.add_argument('--prd', required=True, help='Path to PRD YAML file')
    parser.add_argument('--deployed_url', required=True, help='URL of deployed dashboard to validate')
    parser.add_argument('--output', help='Path to output file for validation report')
    parser.add_argument('--format', choices=['json', 'yaml', 'text'], default='json', help='Output format (default: json)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Load PRD data
    prd_data = load_prd(args.prd)
    
    # Validate features
    results = validate_features(prd_data, args.deployed_url)
    
    # Generate report
    report = generate_report(prd_data, results, args.deployed_url)
    
    # Output report
    if args.output:
        with open(args.output, 'w') as f:
            if args.format == 'json':
                json.dump(report, f, indent=2)
            elif args.format == 'yaml':
                yaml.dump(report, f)
            else:
                f.write(f"PRD Validation Report for {prd_data['product_name']} v{prd_data['version']}\n")
                f.write(f"URL: {args.deployed_url}\n")
                f.write(f"Status: {report['status']}\n")
                f.write(f"Coverage: {report['coverage']} (threshold: {report['threshold']})\n")
                f.write(f"Summary: {report['summary']['pass']} passed, {report['summary']['fail']} failed\n\n")
                
                for result in report['results']:
                    f.write(f"{result['id']} - {result['name']}: {result['status']}\n")
                    for detail in result['details']:
                        f.write(f"  - {detail}\n")
                    f.write("\n")
    else:
        if args.format == 'json':
            print(json.dumps(report, indent=2))
        elif args.format == 'yaml':
            print(yaml.dump(report))
        else:
            print(f"PRD Validation Report for {prd_data['product_name']} v{prd_data['version']}")
            print(f"URL: {args.deployed_url}")
            print(f"Status: {report['status']}")
            print(f"Coverage: {report['coverage']} (threshold: {report['threshold']})")
            print(f"Summary: {report['summary']['pass']} passed, {report['summary']['fail']} failed\n")
            
            for result in report['results']:
                print(f"{result['id']} - {result['name']}: {result['status']}")
                for detail in result['details']:
                    print(f"  - {detail}")
                print()
    
    # Return exit code based on validation result
    if report['status'] == 'PASS':
        logger.info("Validation successful!")
        return 0
    else:
        logger.error(f"Validation failed: {report['coverage']} coverage (threshold: {report['threshold']})")
        return 1

if __name__ == "__main__":
    sys.exit(main())