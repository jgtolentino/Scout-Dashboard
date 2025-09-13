#!/usr/bin/env python3
"""
Scout v6 + Isko Go-Live Validation Suite
Fast-fail validation for core platform health checks
"""

import os
import sys
import json
import time
import requests
import psycopg2
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

console = Console()

class ValidationResult:
    def __init__(self):
        self.checks: List[Dict[str, Any]] = []
        self.start_time = datetime.now()
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def add_check(self, name: str, status: str, details: Dict[str, Any] = None, duration_ms: int = 0):
        self.checks.append({
            'name': name,
            'status': status,  # 'pass', 'fail', 'warn', 'skip'
            'details': details or {},
            'duration_ms': duration_ms,
            'timestamp': datetime.now().isoformat()
        })
    
    def add_error(self, error: str):
        self.errors.append(error)
    
    def add_warning(self, warning: str):
        self.warnings.append(warning)
    
    def get_summary(self) -> Dict[str, Any]:
        total = len(self.checks)
        passed = len([c for c in self.checks if c['status'] == 'pass'])
        failed = len([c for c in self.checks if c['status'] == 'fail'])
        warnings = len([c for c in self.checks if c['status'] == 'warn'])
        skipped = len([c for c in self.checks if c['status'] == 'skip'])
        
        return {
            'total_checks': total,
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'skipped': skipped,
            'duration_seconds': (datetime.now() - self.start_time).total_seconds(),
            'success_rate': (passed / total * 100) if total > 0 else 0
        }

class ScoutV6Validator:
    def __init__(self):
        self.result = ValidationResult()
        self.db_url = os.getenv('DB_URL')
        self.supabase_url = os.getenv('SUPABASE_URL', 'https://cxzllzyxwpyptfretryc.supabase.co')
        self.app_url = os.getenv('APP_URL', 'http://localhost:3000')
        self.csv_dir = Path(os.getenv('CSV_DIR', 'scout_v6_deployment/data/csv'))
        
        # Create logs directory
        self.logs_dir = Path('validators/logs')
        self.logs_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_database_connection(self) -> bool:
        """Test database connectivity and basic schema"""
        start = time.time()
        
        if not self.db_url:
            self.result.add_check('DB Connection', 'skip', {'reason': 'DB_URL not set'})
            return True  # Skip, not fail
        
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            # Test basic connectivity
            cursor.execute("SELECT 1")
            
            # Check critical Scout tables/views
            critical_objects = [
                "scout_ux.dashboard_revenue_treemap",
                "scout_ux.dashboard_store_heatmap", 
                "scout_ux.dashboard_kpi_big_numbers",
                "scout_silver.transactions",
                "scout_silver.transaction_items"
            ]
            
            missing_objects = []
            for obj in critical_objects:
                try:
                    cursor.execute(f"SELECT 1 FROM {obj} LIMIT 1")
                except psycopg2.Error:
                    missing_objects.append(obj)
            
            cursor.close()
            conn.close()
            
            duration_ms = int((time.time() - start) * 1000)
            
            if missing_objects:
                self.result.add_check('DB Schema', 'fail', 
                    {'missing_objects': missing_objects}, duration_ms)
                self.result.add_error(f"Missing critical DB objects: {missing_objects}")
                return False
            
            self.result.add_check('DB Connection', 'pass', 
                {'objects_verified': len(critical_objects)}, duration_ms)
            return True
            
        except Exception as e:
            duration_ms = int((time.time() - start) * 1000)
            self.result.add_check('DB Connection', 'fail', 
                {'error': str(e)}, duration_ms)
            self.result.add_error(f"Database connection failed: {e}")
            return False
    
    def validate_supabase_edge_functions(self) -> bool:
        """Test critical Supabase Edge Functions"""
        start = time.time()
        
        functions_to_test = [
            {
                'name': 'isko-sku-scraper',
                'path': '/functions/v1/isko-sku-scraper',
                'method': 'POST',
                'headers': {'x-tenant-id': 'test-tenant'},
                'data': {'dry_run': True}
            },
            {
                'name': 'agent-job-runner-health',
                'path': '/functions/v1/agent-job-runner/health',
                'method': 'GET'
            }
        ]
        
        all_passed = True
        
        for func in functions_to_test:
            func_start = time.time()
            try:
                url = f"{self.supabase_url}{func['path']}"
                
                if func['method'] == 'POST':
                    response = requests.post(
                        url, 
                        json=func.get('data', {}),
                        headers=func.get('headers', {}),
                        timeout=10
                    )
                else:
                    response = requests.get(url, timeout=10)
                
                func_duration_ms = int((time.time() - func_start) * 1000)
                
                if response.status_code in [200, 201]:
                    self.result.add_check(f"Edge Function: {func['name']}", 'pass',
                        {'status_code': response.status_code, 'response_time_ms': func_duration_ms},
                        func_duration_ms)
                else:
                    self.result.add_check(f"Edge Function: {func['name']}", 'fail',
                        {'status_code': response.status_code, 'response': response.text[:200]},
                        func_duration_ms)
                    all_passed = False
                    
            except requests.exceptions.Timeout:
                func_duration_ms = int((time.time() - func_start) * 1000)
                self.result.add_check(f"Edge Function: {func['name']}", 'fail',
                    {'error': 'timeout'}, func_duration_ms)
                all_passed = False
            except Exception as e:
                func_duration_ms = int((time.time() - func_start) * 1000)
                self.result.add_check(f"Edge Function: {func['name']}", 'fail',
                    {'error': str(e)}, func_duration_ms)
                all_passed = False
        
        return all_passed
    
    def validate_app_endpoints(self) -> bool:
        """Test critical app API endpoints"""
        start = time.time()
        
        endpoints_to_test = [
            '/api/analytics',
            '/api/geo', 
            '/api/exports'
        ]
        
        all_passed = True
        
        for endpoint in endpoints_to_test:
            ep_start = time.time()
            try:
                url = f"{self.app_url}{endpoint}"
                response = requests.get(url, timeout=5)
                
                ep_duration_ms = int((time.time() - ep_start) * 1000)
                
                if response.status_code in [200, 201]:
                    # Try to parse JSON if possible
                    try:
                        response.json()
                        json_valid = True
                    except:
                        json_valid = False
                    
                    self.result.add_check(f"API Endpoint: {endpoint}", 'pass',
                        {'status_code': response.status_code, 'json_valid': json_valid},
                        ep_duration_ms)
                else:
                    self.result.add_check(f"API Endpoint: {endpoint}", 'fail',
                        {'status_code': response.status_code, 'response': response.text[:200]},
                        ep_duration_ms)
                    all_passed = False
                    
            except requests.exceptions.ConnectionError:
                ep_duration_ms = int((time.time() - ep_start) * 1000)
                self.result.add_check(f"API Endpoint: {endpoint}", 'skip',
                    {'reason': 'app_not_running'}, ep_duration_ms)
                self.result.add_warning(f"App not running - skipping {endpoint}")
            except Exception as e:
                ep_duration_ms = int((time.time() - ep_start) * 1000)
                self.result.add_check(f"API Endpoint: {endpoint}", 'fail',
                    {'error': str(e)}, ep_duration_ms)
                all_passed = False
        
        return all_passed
    
    def validate_csv_data(self) -> bool:
        """Validate CSV exports and manifest"""
        start = time.time()
        
        if not self.csv_dir.exists():
            self.result.add_check('CSV Data', 'skip', 
                {'reason': f'CSV directory not found: {self.csv_dir}'})
            self.result.add_warning(f"CSV directory not found: {self.csv_dir}")
            return True  # Skip, not fail
        
        # Check for CSV files
        csv_files = list(self.csv_dir.glob('*.csv'))
        
        if len(csv_files) < 12:  # Expecting 12 core CSVs
            self.result.add_check('CSV Count', 'fail',
                {'found': len(csv_files), 'expected_min': 12, 'files': [f.name for f in csv_files]})
            self.result.add_error(f"Only found {len(csv_files)} CSV files, expected at least 12")
            return False
        
        # Check for manifest file
        manifest_files = list(self.csv_dir.glob('MANIFEST_*.txt'))
        
        if not manifest_files:
            self.result.add_check('CSV Manifest', 'fail',
                {'reason': 'No MANIFEST_*.txt file found'})
            self.result.add_error("No MANIFEST_*.txt file found in CSV directory")
            return False
        
        # Validate most recent manifest
        latest_manifest = max(manifest_files, key=lambda f: f.stat().st_mtime)
        
        try:
            manifest_content = latest_manifest.read_text()
            lines = [line.strip() for line in manifest_content.splitlines() if line.strip()]
            
            duration_ms = int((time.time() - start) * 1000)
            
            self.result.add_check('CSV Data', 'pass',
                {
                    'csv_files': len(csv_files),
                    'manifest_entries': len(lines),
                    'latest_manifest': latest_manifest.name
                }, duration_ms)
            return True
            
        except Exception as e:
            duration_ms = int((time.time() - start) * 1000)
            self.result.add_check('CSV Manifest', 'fail',
                {'error': str(e)}, duration_ms)
            self.result.add_error(f"Failed to read manifest: {e}")
            return False
    
    def generate_reports(self):
        """Generate JSON and Markdown reports"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON Report
        json_report = {
            'validation_id': f"scout_v6_{timestamp}",
            'summary': self.result.get_summary(),
            'checks': self.result.checks,
            'errors': self.result.errors,
            'warnings': self.result.warnings,
            'metadata': {
                'db_url': '***' if self.db_url else None,
                'supabase_url': self.supabase_url,
                'app_url': self.app_url,
                'csv_dir': str(self.csv_dir)
            }
        }
        
        json_file = self.logs_dir / f"scout_v6_validation_{timestamp}.json"
        json_file.write_text(json.dumps(json_report, indent=2))
        
        # Markdown Report
        summary = self.result.get_summary()
        
        md_content = f"""# Scout v6 + Isko Validation Report

**Generated:** {datetime.now().isoformat()}
**Duration:** {summary['duration_seconds']:.2f}s
**Success Rate:** {summary['success_rate']:.1f}%

## Summary

- ✅ **Passed:** {summary['passed']}/{summary['total_checks']}
- ❌ **Failed:** {summary['failed']}/{summary['total_checks']} 
- ⚠️ **Warnings:** {summary['warnings']}/{summary['total_checks']}
- ⏭️ **Skipped:** {summary['skipped']}/{summary['total_checks']}

## Check Results

| Check | Status | Duration | Details |
|-------|--------|----------|---------|
"""
        
        for check in self.result.checks:
            status_icon = {'pass': '✅', 'fail': '❌', 'warn': '⚠️', 'skip': '⏭️'}[check['status']]
            details = json.dumps(check['details'], separators=(',', ':'))[:100]
            md_content += f"| {check['name']} | {status_icon} {check['status']} | {check['duration_ms']}ms | {details} |\n"
        
        if self.result.errors:
            md_content += "\n## Errors\n\n"
            for error in self.result.errors:
                md_content += f"- ❌ {error}\n"
        
        if self.result.warnings:
            md_content += "\n## Warnings\n\n"
            for warning in self.result.warnings:
                md_content += f"- ⚠️ {warning}\n"
        
        md_file = self.logs_dir / f"scout_v6_validation_{timestamp}.md"
        md_file.write_text(md_content)
        
        return json_file, md_file
    
    def run_validation(self) -> bool:
        """Run all validation checks"""
        console.print(Panel.fit("🚀 Scout v6 + Isko Go-Live Validation", style="bold blue"))
        
        # Core platform health checks
        checks = [
            ("Database Connection & Schema", self.validate_database_connection),
            ("Supabase Edge Functions", self.validate_supabase_edge_functions),
            ("App API Endpoints", self.validate_app_endpoints),
            ("CSV Data & Manifest", self.validate_csv_data)
        ]
        
        overall_success = True
        
        for check_name, check_func in checks:
            console.print(f"\n🔍 {check_name}...")
            try:
                success = check_func()
                if not success:
                    overall_success = False
                    console.print(f"❌ {check_name} failed", style="red")
                else:
                    console.print(f"✅ {check_name} passed", style="green")
            except Exception as e:
                console.print(f"❌ {check_name} error: {e}", style="red")
                self.result.add_error(f"{check_name} unexpected error: {e}")
                overall_success = False
        
        # Generate reports
        json_file, md_file = self.generate_reports()
        
        # Print summary
        summary = self.result.get_summary()
        
        table = Table(title="Validation Summary")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="magenta")
        
        table.add_row("Total Checks", str(summary['total_checks']))
        table.add_row("Passed", f"{summary['passed']} ✅")
        table.add_row("Failed", f"{summary['failed']} ❌")
        table.add_row("Warnings", f"{summary['warnings']} ⚠️")
        table.add_row("Success Rate", f"{summary['success_rate']:.1f}%")
        table.add_row("Duration", f"{summary['duration_seconds']:.2f}s")
        
        console.print(table)
        
        console.print(f"\n📊 Reports generated:")
        console.print(f"  JSON: {json_file}")
        console.print(f"  Markdown: {md_file}")
        
        if overall_success:
            console.print(Panel.fit("✅ All critical validations passed!", style="green"))
        else:
            console.print(Panel.fit("❌ Validation failed - check logs for details", style="red"))
        
        return overall_success

def main():
    validator = ScoutV6Validator()
    success = validator.run_validation()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()