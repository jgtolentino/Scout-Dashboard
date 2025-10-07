#!/usr/bin/env python3

"""
Tableau Batch Dashboard Creator
Creates multiple dashboards from configuration file with parallel processing
"""

import os
import sys
import json
import yaml
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime

# Import the dashboard creator
from create_dashboard import TableauDashboardCreator

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class DashboardConfig:
    """Configuration for a single dashboard"""
    name: str
    project: str
    workbook_path: str
    datasource_path: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    overwrite: bool = True
    show_tabs: bool = True
    enabled: bool = True
    dependencies: Optional[List[str]] = None

class TableauBatchCreator:
    """Batch creation of Tableau dashboards"""
    
    def __init__(self, config_file: str):
        """Initialize batch creator"""
        self.config_file = Path(config_file)
        self.creator = TableauDashboardCreator()
        self.config = self._load_config()
        
        logger.info(f"Initialized batch creator with config: {config_file}")
    
    def _load_config(self) -> Dict:
        """Load configuration file"""
        if not self.config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_file}")
        
        try:
            with open(self.config_file, 'r') as f:
                if self.config_file.suffix.lower() in ['.yaml', '.yml']:
                    config = yaml.safe_load(f)
                else:
                    config = json.load(f)
                
            # Validate configuration
            self._validate_config(config)
            return config
            
        except Exception as e:
            raise ValueError(f"Error loading configuration: {e}")
    
    def _validate_config(self, config: Dict) -> None:
        """Validate configuration structure"""
        required_fields = ['dashboards']
        
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Required field '{field}' missing from configuration")
        
        if not isinstance(config['dashboards'], list):
            raise ValueError("'dashboards' must be a list")
        
        # Validate each dashboard configuration
        for i, dashboard in enumerate(config['dashboards']):
            required_dashboard_fields = ['name', 'project', 'workbook_path']
            
            for field in required_dashboard_fields:
                if field not in dashboard:
                    raise ValueError(f"Dashboard {i}: Required field '{field}' missing")
    
    def _parse_dashboard_configs(self) -> List[DashboardConfig]:
        """Parse dashboard configurations"""
        dashboard_configs = []
        
        for dashboard_dict in self.config['dashboards']:
            config = DashboardConfig(
                name=dashboard_dict['name'],
                project=dashboard_dict['project'],
                workbook_path=dashboard_dict['workbook_path'],
                datasource_path=dashboard_dict.get('datasource_path'),
                description=dashboard_dict.get('description'),
                tags=dashboard_dict.get('tags'),
                overwrite=dashboard_dict.get('overwrite', True),
                show_tabs=dashboard_dict.get('show_tabs', True),
                enabled=dashboard_dict.get('enabled', True),
                dependencies=dashboard_dict.get('dependencies')
            )
            
            # Resolve file paths relative to config file directory
            config_dir = self.config_file.parent
            config.workbook_path = str((config_dir / config.workbook_path).resolve())
            
            if config.datasource_path:
                config.datasource_path = str((config_dir / config.datasource_path).resolve())
            
            dashboard_configs.append(config)
        
        return dashboard_configs
    
    def _resolve_dependencies(self, dashboard_configs: List[DashboardConfig]) -> List[List[DashboardConfig]]:
        """Resolve dependencies and return batches of dashboards to process"""
        # Create a mapping of dashboard names to configs
        name_to_config = {config.name: config for config in dashboard_configs}
        
        # Build dependency graph
        dependency_graph = {}
        for config in dashboard_configs:
            dependency_graph[config.name] = config.dependencies or []
        
        # Topological sort to determine processing order
        batches = []
        remaining = set(config.name for config in dashboard_configs if config.enabled)
        processed = set()
        
        while remaining:
            # Find dashboards with no unprocessed dependencies
            ready = []
            for name in remaining:
                dependencies = dependency_graph[name]
                if all(dep in processed for dep in dependencies):
                    ready.append(name_to_config[name])
            
            if not ready:
                # Circular dependency or invalid dependency
                logger.warning(f"Circular dependency detected or invalid dependencies. Remaining: {remaining}")
                # Add remaining dashboards to final batch
                ready = [name_to_config[name] for name in remaining]
            
            batches.append(ready)
            
            # Mark as processed
            for config in ready:
                processed.add(config.name)
                remaining.discard(config.name)
        
        return batches
    
    def _create_single_dashboard(self, config: DashboardConfig, resume_on_error: bool = False) -> Dict:
        """Create a single dashboard"""
        result = {
            'name': config.name,
            'success': False,
            'project_id': None,
            'datasource_id': None,
            'workbook_id': None,
            'duration_seconds': 0,
            'errors': []
        }
        
        start_time = datetime.now()
        
        try:
            logger.info(f"Creating dashboard: {config.name}")
            
            # Validate file paths
            if not Path(config.workbook_path).exists():
                raise FileNotFoundError(f"Workbook file not found: {config.workbook_path}")
            
            if config.datasource_path and not Path(config.datasource_path).exists():
                raise FileNotFoundError(f"Datasource file not found: {config.datasource_path}")
            
            # Create dashboard
            dashboard_result = self.creator.create_dashboard(
                project_name=config.project,
                datasource_path=config.datasource_path,
                workbook_path=config.workbook_path,
                description=config.description,
                tags=config.tags,
                overwrite=config.overwrite,
                show_tabs=config.show_tabs
            )
            
            # Update result
            result.update(dashboard_result)
            
            if dashboard_result['success']:
                logger.info(f"Successfully created dashboard: {config.name}")
            else:
                logger.error(f"Failed to create dashboard: {config.name}")
                
        except Exception as e:
            error_msg = f"Error creating dashboard {config.name}: {e}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
            
            if not resume_on_error:
                raise
        
        finally:
            result['duration_seconds'] = (datetime.now() - start_time).total_seconds()
        
        return result
    
    def create_dashboards(self, parallel_jobs: int = 3, dry_run: bool = False,
                         resume_on_error: bool = False) -> Dict:
        """Create all dashboards according to configuration"""
        
        # Parse dashboard configurations
        dashboard_configs = self._parse_dashboard_configs()
        enabled_configs = [config for config in dashboard_configs if config.enabled]
        
        logger.info(f"Found {len(enabled_configs)} enabled dashboards to create")
        
        if dry_run:
            logger.info("DRY RUN MODE - No dashboards will be created")
            return {
                'dry_run': True,
                'total_dashboards': len(enabled_configs),
                'enabled_dashboards': len(enabled_configs),
                'config_summary': [
                    {
                        'name': config.name,
                        'project': config.project,
                        'workbook_path': config.workbook_path,
                        'datasource_path': config.datasource_path,
                        'dependencies': config.dependencies
                    }
                    for config in enabled_configs
                ]
            }
        
        # Resolve dependencies into batches
        batches = self._resolve_dependencies(enabled_configs)
        
        results = {
            'total_dashboards': len(enabled_configs),
            'successful_dashboards': 0,
            'failed_dashboards': 0,
            'batches': len(batches),
            'dashboard_results': [],
            'summary': {
                'total_duration_seconds': 0,
                'errors': []
            }
        }
        
        total_start_time = datetime.now()
        
        # Process each batch
        for batch_num, batch in enumerate(batches, 1):
            logger.info(f"Processing batch {batch_num}/{len(batches)} ({len(batch)} dashboards)")
            
            if len(batch) == 1:
                # Single dashboard - process directly
                result = self._create_single_dashboard(batch[0], resume_on_error)
                results['dashboard_results'].append(result)
                
                if result['success']:
                    results['successful_dashboards'] += 1
                else:
                    results['failed_dashboards'] += 1
                    results['summary']['errors'].extend(result['errors'])
            
            else:
                # Multiple dashboards - process in parallel
                with ThreadPoolExecutor(max_workers=min(parallel_jobs, len(batch))) as executor:
                    future_to_config = {
                        executor.submit(self._create_single_dashboard, config, resume_on_error): config
                        for config in batch
                    }
                    
                    for future in as_completed(future_to_config):
                        result = future.result()
                        results['dashboard_results'].append(result)
                        
                        if result['success']:
                            results['successful_dashboards'] += 1
                        else:
                            results['failed_dashboards'] += 1
                            results['summary']['errors'].extend(result['errors'])
        
        results['summary']['total_duration_seconds'] = (datetime.now() - total_start_time).total_seconds()
        
        return results
    
    def generate_batch_report(self, results: Dict, output_file: str = None) -> str:
        """Generate batch creation report"""
        
        if results.get('dry_run'):
            report = f"""# Tableau Batch Creation - Dry Run Report

## Configuration Summary
- **Total Dashboards**: {results['total_dashboards']}
- **Enabled Dashboards**: {results['enabled_dashboards']}

## Dashboards to Create:
"""
            for config in results['config_summary']:
                report += f"""
### {config['name']}
- **Project**: {config['project']}
- **Workbook**: {config['workbook_path']}
- **Datasource**: {config['datasource_path'] or 'None'}
- **Dependencies**: {config['dependencies'] or 'None'}
"""
            
        else:
            success_rate = (results['successful_dashboards'] / max(results['total_dashboards'], 1)) * 100
            
            report = f"""# Tableau Batch Creation Report

## Summary
- **Total Dashboards**: {results['total_dashboards']}
- **Successful**: {results['successful_dashboards']}
- **Failed**: {results['failed_dashboards']}
- **Success Rate**: {success_rate:.1f}%
- **Total Duration**: {results['summary']['total_duration_seconds']:.1f} seconds
- **Processing Batches**: {results['batches']}

## Dashboard Results
"""
            
            for result in results['dashboard_results']:
                status = "✅" if result['success'] else "❌"
                duration = result['duration_seconds']
                
                report += f"- {status} **{result['name']}** ({duration:.1f}s)\n"
                
                if result['project_id']:
                    report += f"  - Project ID: {result['project_id']}\n"
                if result['workbook_id']:
                    report += f"  - Workbook ID: {result['workbook_id']}\n"
                if result['datasource_id']:
                    report += f"  - Datasource ID: {result['datasource_id']}\n"
                if result['errors']:
                    report += f"  - Errors: {'; '.join(result['errors'])}\n"
                
                report += "\n"
            
            if results['summary']['errors']:
                report += "\n## All Errors\n"
                for error in set(results['summary']['errors']):  # Remove duplicates
                    report += f"- {error}\n"
        
        # Save report if output file specified
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            logger.info(f"Batch creation report saved to: {output_file}")
        
        return report

def create_example_config():
    """Create an example configuration file"""
    example_config = {
        "dashboards": [
            {
                "name": "Sales Dashboard",
                "project": "Sales Analytics",
                "workbook_path": "workbooks/sales_dashboard.twbx",
                "datasource_path": "datasources/sales_data.hyper",
                "description": "Comprehensive sales analytics dashboard",
                "tags": ["sales", "analytics", "revenue"],
                "overwrite": True,
                "show_tabs": True,
                "enabled": True
            },
            {
                "name": "Marketing Dashboard",
                "project": "Marketing Analytics", 
                "workbook_path": "workbooks/marketing_dashboard.twbx",
                "datasource_path": "datasources/marketing_data.hyper",
                "description": "Marketing performance and campaign analytics",
                "tags": ["marketing", "campaigns", "performance"],
                "overwrite": True,
                "show_tabs": True,
                "enabled": True,
                "dependencies": ["Sales Dashboard"]
            },
            {
                "name": "Executive Summary",
                "project": "Executive",
                "workbook_path": "workbooks/executive_summary.twbx",
                "description": "High-level executive summary dashboard",
                "tags": ["executive", "summary", "kpi"],
                "overwrite": True,
                "show_tabs": False,
                "enabled": True,
                "dependencies": ["Sales Dashboard", "Marketing Dashboard"]
            }
        ]
    }
    
    with open('batch_config_example.json', 'w') as f:
        json.dump(example_config, f, indent=2)
    
    print("Example configuration created: batch_config_example.json")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Batch create Tableau dashboards',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create dashboards from config file
  python batch_create.py --config-file dashboards.json --parallel-jobs 5
  
  # Dry run to see what would be created
  python batch_create.py --config-file dashboards.json --dry-run
  
  # Create with error recovery
  python batch_create.py --config-file dashboards.json --resume-on-error --output-report report.md
  
  # Generate example configuration
  python batch_create.py --create-example-config
        """
    )
    
    parser.add_argument('--config-file', 
                       help='Configuration file (JSON or YAML)')
    parser.add_argument('--parallel-jobs', type=int, default=3,
                       help='Number of parallel creation jobs')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be created without actually creating')
    parser.add_argument('--resume-on-error', action='store_true',
                       help='Continue processing even if some dashboards fail')
    parser.add_argument('--output-report',
                       help='Save batch creation report to file')
    parser.add_argument('--create-example-config', action='store_true',
                       help='Create an example configuration file')
    
    return parser.parse_args()

def main():
    """Main execution function"""
    args = parse_arguments()
    
    # Handle example config creation
    if args.create_example_config:
        create_example_config()
        return 0
    
    # Validate arguments
    if not args.config_file:
        print("ERROR: --config-file is required (or use --create-example-config)")
        return 1
    
    try:
        # Initialize batch creator
        batch_creator = TableauBatchCreator(args.config_file)
        
        # Create dashboards
        results = batch_creator.create_dashboards(
            parallel_jobs=args.parallel_jobs,
            dry_run=args.dry_run,
            resume_on_error=args.resume_on_error
        )
        
        # Generate and display report
        report = batch_creator.generate_batch_report(
            results=results,
            output_file=args.output_report
        )
        
        print("\n" + report)
        
        # Return appropriate exit code
        if results.get('dry_run'):
            print("✅ Dry run completed successfully!")
            return 0
        elif results['failed_dashboards'] == 0:
            print("✅ All dashboards created successfully!")
            return 0
        elif results['successful_dashboards'] > 0:
            print("⚠️ Batch creation completed with some errors")
            return 1
        else:
            print("❌ Batch creation failed")
            return 2
        
    except Exception as e:
        logger.error(f"Batch creation failed: {e}")
        print(f"ERROR: {e}")
        return 1

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    exit_code = main()
    sys.exit(exit_code)