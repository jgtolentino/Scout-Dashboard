#!/usr/bin/env python3

"""
Tableau Desktop Migration Script
Integrates with existing Tableau extraction system to migrate Desktop assets to server
"""

import os
import sys
import json
import glob
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import the dashboard creator
from create_dashboard import TableauDashboardCreator

# Configure logging
logger = logging.getLogger(__name__)

class TableauDesktopMigrator:
    """Migrate extracted Tableau Desktop assets to server"""
    
    def __init__(self, desktop_export_dir: str, target_project: str = "Desktop Migration"):
        """Initialize migrator"""
        self.desktop_export_dir = Path(desktop_export_dir)
        self.target_project = target_project
        self.creator = TableauDashboardCreator()
        
        # Validate export directory structure
        if not self.desktop_export_dir.exists():
            raise FileNotFoundError(f"Desktop export directory not found: {desktop_export_dir}")
        
        self.workbooks_dir = self.desktop_export_dir / "workbooks"
        self.tds_dir = self.desktop_export_dir / "tds"
        self.metadata_dir = self.desktop_export_dir / "metadata"
        
        logger.info(f"Initialized migrator for: {desktop_export_dir}")
    
    def discover_assets(self, filter_pattern: str = None) -> Dict[str, List[Path]]:
        """Discover all publishable assets in the export directory"""
        assets = {
            'workbooks_twb': [],
            'workbooks_twbx': [],
            'datasources_tds': [],
            'datasources_tdsx': [],
            'hyper_files': []
        }
        
        # Find TWB files
        if self.workbooks_dir.exists():
            twb_files = list(self.workbooks_dir.glob("*.twb"))
            if filter_pattern:
                twb_files = [f for f in twb_files if filter_pattern in f.name]
            assets['workbooks_twb'] = twb_files
            
            # Find unpacked TWBX directories and their Hyper files
            for twbx_dir in self.workbooks_dir.iterdir():
                if twbx_dir.is_dir():
                    # Look for TWB file in the directory
                    twb_in_dir = list(twbx_dir.glob("*.twb"))
                    if twb_in_dir and (not filter_pattern or filter_pattern in twbx_dir.name):
                        assets['workbooks_twbx'].append(twb_in_dir[0])
                    
                    # Find Hyper files
                    hyper_files = list(twbx_dir.glob("**/*.hyper"))
                    if filter_pattern:
                        hyper_files = [f for f in hyper_files if filter_pattern in f.name]
                    assets['hyper_files'].extend(hyper_files)
        
        # Find TDS/TDSX files
        if self.tds_dir.exists():
            tds_files = list(self.tds_dir.glob("*.tds"))
            tdsx_files = list(self.tds_dir.glob("*.tdsx"))
            
            if filter_pattern:
                tds_files = [f for f in tds_files if filter_pattern in f.name]
                tdsx_files = [f for f in tdsx_files if filter_pattern in f.name]
            
            assets['datasources_tds'] = tds_files
            assets['datasources_tdsx'] = tdsx_files
        
        return assets
    
    def load_workbook_metadata(self) -> Dict:
        """Load workbook metadata if available"""
        metadata_file = self.metadata_dir / "workbook_metadata.json"
        
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load workbook metadata: {e}")
        
        return {}
    
    def create_project_structure(self, create_projects: bool = True) -> Dict[str, str]:
        """Create project structure based on Desktop organization"""
        projects = {}
        
        try:
            self.creator.connect()
            
            # Create main migration project
            main_project_id = self.creator.get_or_create_project(
                self.target_project,
                description="Migrated assets from Tableau Desktop"
            )
            projects['main'] = main_project_id
            
            # Create sub-projects if requested
            if create_projects:
                # Create projects based on discovered workbook categories
                metadata = self.load_workbook_metadata()
                categories = set()
                
                for wb_meta in metadata:
                    # Extract category from workbook name or path
                    wb_name = wb_meta.get('file_name', '')
                    if '_' in wb_name:
                        category = wb_name.split('_')[0]
                        categories.add(category)
                
                # Create category-based projects
                for category in categories:
                    if category and category.lower() not in ['temp', 'test', 'backup']:
                        project_name = f"{self.target_project} - {category.title()}"
                        project_id = self.creator.get_or_create_project(
                            project_name,
                            description=f"Desktop assets for {category} category"
                        )
                        projects[category] = project_id
            
        finally:
            self.creator.disconnect()
        
        return projects
    
    def migrate_datasource(self, ds_path: Path, project_id: str) -> Dict:
        """Migrate a single datasource"""
        result = {
            'success': False,
            'datasource_path': str(ds_path),
            'datasource_id': None,
            'error': None
        }
        
        try:
            self.creator.connect()
            
            datasource_id = self.creator.publish_datasource(
                datasource_path=str(ds_path),
                project_id=project_id,
                datasource_name=ds_path.stem,
                overwrite=True
            )
            
            result['success'] = True
            result['datasource_id'] = datasource_id
            logger.info(f"Migrated datasource: {ds_path.name}")
            
        except Exception as e:
            error_msg = f"Failed to migrate datasource {ds_path.name}: {e}"
            logger.error(error_msg)
            result['error'] = error_msg
            
        finally:
            self.creator.disconnect()
        
        return result
    
    def migrate_workbook(self, wb_path: Path, project_id: str, metadata: Dict = None) -> Dict:
        """Migrate a single workbook"""
        result = {
            'success': False,
            'workbook_path': str(wb_path),
            'workbook_id': None,
            'error': None
        }
        
        try:
            self.creator.connect()
            
            # Get metadata for this workbook if available
            wb_meta = None
            if metadata:
                wb_name = wb_path.stem
                wb_meta = next((wb for wb in metadata if wb.get('file_name') == wb_name), None)
            
            # Extract description and tags from metadata
            description = None
            tags = []
            
            if wb_meta:
                worksheets = wb_meta.get('worksheets', [])
                dashboards = wb_meta.get('dashboards', [])
                
                description = f"Desktop workbook with {len(worksheets)} worksheets and {len(dashboards)} dashboards"
                
                # Create tags based on content
                if worksheets:
                    tags.append('worksheets')
                if dashboards:
                    tags.append('dashboards')
                
                # Add tags based on datasources
                datasources = wb_meta.get('datasources', [])
                for ds in datasources:
                    ds_name = ds.get('name', '').lower()
                    if 'extract' in ds_name:
                        tags.append('extract')
                    elif 'live' in ds_name:
                        tags.append('live-connection')
            
            workbook_id = self.creator.publish_workbook(
                workbook_path=str(wb_path),
                project_id=project_id,
                workbook_name=wb_path.stem,
                show_tabs=True,
                overwrite=True,
                description=description,
                tags=tags
            )
            
            result['success'] = True
            result['workbook_id'] = workbook_id
            logger.info(f"Migrated workbook: {wb_path.name}")
            
        except Exception as e:
            error_msg = f"Failed to migrate workbook {wb_path.name}: {e}"
            logger.error(error_msg)
            result['error'] = error_msg
            
        finally:
            self.creator.disconnect()
        
        return result
    
    def migrate_assets(self, assets: Dict[str, List[Path]], projects: Dict[str, str],
                      parallel_jobs: int = 3) -> Dict:
        """Migrate all discovered assets"""
        results = {
            'datasources': [],
            'workbooks': [],
            'summary': {
                'total_datasources': 0,
                'successful_datasources': 0,
                'total_workbooks': 0,
                'successful_workbooks': 0,
                'errors': []
            }
        }
        
        # Load workbook metadata
        metadata = self.load_workbook_metadata()
        
        # Get main project ID
        main_project_id = projects.get('main', projects.get(self.target_project))
        
        # Migrate datasources first (parallel)
        all_datasources = assets['datasources_tds'] + assets['datasources_tdsx']
        results['summary']['total_datasources'] = len(all_datasources)
        
        if all_datasources:
            logger.info(f"Migrating {len(all_datasources)} datasources...")
            
            with ThreadPoolExecutor(max_workers=parallel_jobs) as executor:
                future_to_ds = {
                    executor.submit(self.migrate_datasource, ds_path, main_project_id): ds_path
                    for ds_path in all_datasources
                }
                
                for future in as_completed(future_to_ds):
                    result = future.result()
                    results['datasources'].append(result)
                    
                    if result['success']:
                        results['summary']['successful_datasources'] += 1
                    else:
                        results['summary']['errors'].append(result['error'])
        
        # Migrate workbooks (parallel)
        all_workbooks = assets['workbooks_twb'] + assets['workbooks_twbx']
        results['summary']['total_workbooks'] = len(all_workbooks)
        
        if all_workbooks:
            logger.info(f"Migrating {len(all_workbooks)} workbooks...")
            
            with ThreadPoolExecutor(max_workers=parallel_jobs) as executor:
                future_to_wb = {
                    executor.submit(self.migrate_workbook, wb_path, main_project_id, metadata): wb_path
                    for wb_path in all_workbooks
                }
                
                for future in as_completed(future_to_wb):
                    result = future.result()
                    results['workbooks'].append(result)
                    
                    if result['success']:
                        results['summary']['successful_workbooks'] += 1
                    else:
                        results['summary']['errors'].append(result['error'])
        
        return results
    
    def generate_migration_report(self, results: Dict, output_file: str = None) -> str:
        """Generate migration report"""
        summary = results['summary']
        
        report = f"""# Tableau Desktop Migration Report

## Migration Summary
- **Total Datasources**: {summary['total_datasources']}
- **Successful Datasources**: {summary['successful_datasources']}
- **Total Workbooks**: {summary['total_workbooks']}
- **Successful Workbooks**: {summary['successful_workbooks']}
- **Errors**: {len(summary['errors'])}

## Success Rate
- **Datasources**: {(summary['successful_datasources'] / max(summary['total_datasources'], 1) * 100):.1f}%
- **Workbooks**: {(summary['successful_workbooks'] / max(summary['total_workbooks'], 1) * 100):.1f}%

## Migrated Datasources
"""
        
        for ds_result in results['datasources']:
            status = "✅" if ds_result['success'] else "❌"
            ds_name = Path(ds_result['datasource_path']).name
            report += f"- {status} {ds_name}\n"
        
        report += "\n## Migrated Workbooks\n"
        
        for wb_result in results['workbooks']:
            status = "✅" if wb_result['success'] else "❌"
            wb_name = Path(wb_result['workbook_path']).name
            report += f"- {status} {wb_name}\n"
        
        if summary['errors']:
            report += "\n## Errors\n"
            for error in summary['errors']:
                report += f"- {error}\n"
        
        # Save report if output file specified
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            logger.info(f"Migration report saved to: {output_file}")
        
        return report

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Migrate Tableau Desktop assets to server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Migrate all assets from Desktop extraction
  python migrate_desktop.py --desktop-export-dir ~/tableau_desktop_reverse --target-project "Desktop Migration"
  
  # Migrate filtered assets
  python migrate_desktop.py --desktop-export-dir ~/tableau_desktop_reverse --filter-pattern "sales" --create-projects
  
  # Parallel migration with custom settings
  python migrate_desktop.py --desktop-export-dir ~/tableau_desktop_reverse --parallel-jobs 5 --output-report migration_report.md
        """
    )
    
    parser.add_argument('--desktop-export-dir', required=True,
                       help='Path to Desktop extraction directory')
    parser.add_argument('--target-project', default='Desktop Migration',
                       help='Target project name on server')
    parser.add_argument('--filter-pattern',
                       help='Filter assets by name pattern')
    parser.add_argument('--create-projects', action='store_true',
                       help='Create sub-projects based on asset organization')
    parser.add_argument('--parallel-jobs', type=int, default=3,
                       help='Number of parallel migration jobs')
    parser.add_argument('--output-report',
                       help='Save migration report to file')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be migrated without actually migrating')
    
    return parser.parse_args()

def main():
    """Main execution function"""
    args = parse_arguments()
    
    try:
        # Initialize migrator
        migrator = TableauDesktopMigrator(
            desktop_export_dir=args.desktop_export_dir,
            target_project=args.target_project
        )
        
        # Discover assets
        logger.info("Discovering assets...")
        assets = migrator.discover_assets(filter_pattern=args.filter_pattern)
        
        # Print discovery summary
        total_assets = sum(len(asset_list) for asset_list in assets.values())
        print(f"Discovered {total_assets} assets:")
        for asset_type, asset_list in assets.items():
            if asset_list:
                print(f"  - {asset_type}: {len(asset_list)}")
        
        if args.dry_run:
            print("\nDry run mode - no assets will be migrated")
            return 0
        
        if total_assets == 0:
            print("No assets found to migrate")
            return 0
        
        # Create project structure
        logger.info("Creating project structure...")
        projects = migrator.create_project_structure(create_projects=args.create_projects)
        print(f"Created/found {len(projects)} projects")
        
        # Migrate assets
        logger.info("Starting migration...")
        results = migrator.migrate_assets(
            assets=assets,
            projects=projects,
            parallel_jobs=args.parallel_jobs
        )
        
        # Generate and display report
        report = migrator.generate_migration_report(
            results=results,
            output_file=args.output_report
        )
        
        print("\n" + report)
        
        # Return appropriate exit code
        summary = results['summary']
        total_success = summary['successful_datasources'] + summary['successful_workbooks']
        total_items = summary['total_datasources'] + summary['total_workbooks']
        
        if total_success == total_items:
            print("✅ Migration completed successfully!")
            return 0
        elif total_success > 0:
            print("⚠️ Migration completed with some errors")
            return 1
        else:
            print("❌ Migration failed")
            return 2
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
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