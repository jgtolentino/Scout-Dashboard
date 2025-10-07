#!/usr/bin/env python3

"""
Headless Tableau Dashboard Creator
Creates and publishes Tableau dashboards via REST API (no Playwright)
"""

import os
import sys
import json
import time
import logging
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

try:
    from tableau_api_lib import TableauServerConnection
    from tableau_api_lib.utils.querying import get_projects_dataframe, get_workbooks_dataframe, get_datasources_dataframe
    import tableauserverclient as TSC
    import pandas as pd
    from dotenv import load_dotenv
except ImportError as e:
    print(f"ERROR: Required package not installed: {e}")
    print("Run: pip install tableau-api-lib tableauserverclient pandas python-dotenv")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/workspace/tableau-agent/logs/dashboard_creation.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)

class TableauDashboardCreator:
    """Headless Tableau dashboard creation and publishing"""
    
    def __init__(self, server_url: str = None, site_id: str = None, 
                 token_name: str = None, token_secret: str = None):
        """Initialize Tableau connection"""
        
        # Load environment variables
        load_dotenv('.env.tableau')
        
        # Set connection parameters
        self.server_url = server_url or os.environ.get('TBL_SERVER')
        self.site_id = site_id or os.environ.get('TBL_SITE_ID', '')
        self.token_name = token_name or os.environ.get('TBL_TOKEN_NAME')
        self.token_secret = token_secret or os.environ.get('TBL_TOKEN')
        
        # Validate required parameters
        if not all([self.server_url, self.token_name, self.token_secret]):
            raise ValueError("Missing required Tableau connection parameters")
        
        # Initialize connections
        self.conn = None
        self.tsc_server = None
        self.tsc_auth = None
        
        logger.info(f"Initialized TableauDashboardCreator for server: {self.server_url}")
    
    def connect(self) -> None:
        """Establish connection to Tableau Server"""
        try:
            # tableau-api-lib connection
            self.conn = TableauServerConnection(
                server=self.server_url,
                api_version='3.19',
                personal_access_token_name=self.token_name,
                personal_access_token_secret=self.token_secret,
                site_id=self.site_id
            )
            self.conn.sign_in()
            
            # tableauserverclient connection for advanced operations
            self.tsc_server = TSC.Server(self.server_url, use_server_version=True)
            self.tsc_auth = TSC.PersonalAccessTokenAuth(
                self.token_name, 
                self.token_secret, 
                site_id=self.site_id
            )
            self.tsc_server.auth.sign_in(self.tsc_auth)
            
            logger.info("Successfully connected to Tableau Server")
            
        except Exception as e:
            logger.error(f"Failed to connect to Tableau Server: {e}")
            raise
    
    def disconnect(self) -> None:
        """Close Tableau Server connections"""
        try:
            if self.conn:
                self.conn.sign_out()
            if self.tsc_server and self.tsc_server.auth.is_signed_in():
                self.tsc_server.auth.sign_out()
            logger.info("Disconnected from Tableau Server")
        except Exception as e:
            logger.warning(f"Error during disconnect: {e}")
    
    def get_or_create_project(self, project_name: str, description: str = None) -> str:
        """Get existing project or create new one"""
        try:
            # Get projects using tableau-api-lib
            projects_df = get_projects_dataframe(self.conn)
            
            # Check if project exists
            project_match = projects_df[projects_df['name'] == project_name]
            
            if not project_match.empty:
                project_id = project_match.iloc[0]['id']
                logger.info(f"Found existing project: {project_name} (ID: {project_id})")
                return project_id
            
            # Create new project using TSC
            new_project = TSC.ProjectItem(
                name=project_name,
                description=description or f"Created by TableauAgent on {datetime.now()}"
            )
            
            created_project = self.tsc_server.projects.create(new_project)
            logger.info(f"Created new project: {project_name} (ID: {created_project.id})")
            return created_project.id
            
        except Exception as e:
            logger.error(f"Error managing project {project_name}: {e}")
            raise
    
    def publish_datasource(self, datasource_path: str, project_id: str, 
                          datasource_name: str = None, overwrite: bool = True,
                          connection_credentials: Dict = None) -> str:
        """Publish datasource to Tableau Server"""
        try:
            datasource_path = Path(datasource_path)
            
            if not datasource_path.exists():
                raise FileNotFoundError(f"Datasource file not found: {datasource_path}")
            
            ds_name = datasource_name or datasource_path.stem
            
            logger.info(f"Publishing datasource: {ds_name} from {datasource_path}")
            
            # Create datasource item
            datasource_item = TSC.DatasourceItem(project_id=project_id, name=ds_name)
            
            # Set connection credentials if provided
            if connection_credentials:
                connection = TSC.ConnectionItem()
                connection.server_address = connection_credentials.get('server')
                connection.username = connection_credentials.get('username')
                connection.password = connection_credentials.get('password')
                datasource_item.connections = [connection]
            
            # Publish datasource
            mode = TSC.Server.PublishMode.Overwrite if overwrite else TSC.Server.PublishMode.CreateNew
            published_ds = self.tsc_server.datasources.publish(
                datasource_item,
                str(datasource_path),
                mode=mode
            )
            
            logger.info(f"Successfully published datasource: {ds_name} (ID: {published_ds.id})")
            return published_ds.id
            
        except Exception as e:
            logger.error(f"Error publishing datasource {datasource_path}: {e}")
            raise
    
    def publish_workbook(self, workbook_path: str, project_id: str,
                        workbook_name: str = None, show_tabs: bool = True,
                        overwrite: bool = True, description: str = None,
                        tags: List[str] = None) -> str:
        """Publish workbook to Tableau Server"""
        try:
            workbook_path = Path(workbook_path)
            
            if not workbook_path.exists():
                raise FileNotFoundError(f"Workbook file not found: {workbook_path}")
            
            wb_name = workbook_name or workbook_path.stem
            
            logger.info(f"Publishing workbook: {wb_name} from {workbook_path}")
            
            # Create workbook item
            workbook_item = TSC.WorkbookItem(
                name=wb_name,
                project_id=project_id,
                show_tabs=show_tabs
            )
            
            # Set description and tags if provided
            if description:
                workbook_item.description = description
            if tags:
                workbook_item.tags = set(tags)
            
            # Publish workbook
            mode = TSC.Server.PublishMode.Overwrite if overwrite else TSC.Server.PublishMode.CreateNew
            published_wb = self.tsc_server.workbooks.publish(
                workbook_item,
                str(workbook_path),
                mode=mode
            )
            
            logger.info(f"Successfully published workbook: {wb_name} (ID: {published_wb.id})")
            return published_wb.id
            
        except Exception as e:
            logger.error(f"Error publishing workbook {workbook_path}: {e}")
            raise
    
    def create_dashboard(self, project_name: str, datasource_path: str = None,
                        workbook_path: str = None, **kwargs) -> Dict:
        """Create complete dashboard with datasource and workbook"""
        
        start_time = time.time()
        result = {
            'success': False,
            'project_id': None,
            'datasource_id': None,
            'workbook_id': None,
            'duration_seconds': 0,
            'errors': []
        }
        
        try:
            # Connect to Tableau Server
            self.connect()
            
            # Get or create project
            project_id = self.get_or_create_project(
                project_name,
                description=kwargs.get('description')
            )
            result['project_id'] = project_id
            
            # Publish datasource if provided
            if datasource_path:
                datasource_id = self.publish_datasource(
                    datasource_path=datasource_path,
                    project_id=project_id,
                    datasource_name=kwargs.get('datasource_name'),
                    overwrite=kwargs.get('overwrite', True),
                    connection_credentials=kwargs.get('connection_credentials')
                )
                result['datasource_id'] = datasource_id
            
            # Publish workbook if provided
            if workbook_path:
                workbook_id = self.publish_workbook(
                    workbook_path=workbook_path,
                    project_id=project_id,
                    workbook_name=kwargs.get('workbook_name'),
                    show_tabs=kwargs.get('show_tabs', True),
                    overwrite=kwargs.get('overwrite', True),
                    description=kwargs.get('description'),
                    tags=kwargs.get('tags')
                )
                result['workbook_id'] = workbook_id
            
            result['success'] = True
            
        except Exception as e:
            error_msg = f"Dashboard creation failed: {e}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
            
        finally:
            # Clean up connection
            self.disconnect()
            result['duration_seconds'] = time.time() - start_time
            
        return result
    
    def list_projects(self) -> List[Dict]:
        """List all projects on Tableau Server"""
        try:
            self.connect()
            projects_df = get_projects_dataframe(self.conn)
            return projects_df.to_dict('records')
        except Exception as e:
            logger.error(f"Error listing projects: {e}")
            raise
        finally:
            self.disconnect()
    
    def list_workbooks(self, project_name: str = None) -> List[Dict]:
        """List workbooks in project or all workbooks"""
        try:
            self.connect()
            workbooks_df = get_workbooks_dataframe(self.conn)
            
            if project_name:
                workbooks_df = workbooks_df[workbooks_df['project_name'] == project_name]
            
            return workbooks_df.to_dict('records')
        except Exception as e:
            logger.error(f"Error listing workbooks: {e}")
            raise
        finally:
            self.disconnect()
    
    def validate_connection(self) -> Dict:
        """Validate Tableau Server connection"""
        result = {
            'success': False,
            'server_version': None,
            'site_id': self.site_id,
            'user_info': None,
            'errors': []
        }
        
        try:
            self.connect()
            
            # Get server info
            server_info = self.tsc_server.server_info.get()
            result['server_version'] = server_info.version
            
            # Get current user info
            current_user = self.tsc_server.users.get_by_id(self.tsc_server.user_id)
            result['user_info'] = {
                'name': current_user.name,
                'site_role': current_user.site_role,
                'id': current_user.id
            }
            
            result['success'] = True
            logger.info("Connection validation successful")
            
        except Exception as e:
            error_msg = f"Connection validation failed: {e}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
            
        finally:
            self.disconnect()
            
        return result

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Headless Tableau Dashboard Creator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create dashboard with datasource and workbook
  python create_dashboard.py --project "Sales Analytics" --datasource data/sales.hyper --workbook dashboards/sales.twbx
  
  # List all projects
  python create_dashboard.py --list-projects
  
  # Validate connection
  python create_dashboard.py --validate-connection
        """
    )
    
    # Main operation arguments
    parser.add_argument('--project', help='Project name to create/use')
    parser.add_argument('--datasource', help='Path to datasource file (.hyper, .tds, .tdsx)')
    parser.add_argument('--workbook', help='Path to workbook file (.twb, .twbx)')
    
    # Server connection arguments
    parser.add_argument('--server-url', help='Tableau Server URL')
    parser.add_argument('--site-id', help='Site ID (empty for Default)')
    parser.add_argument('--token-name', help='Personal Access Token name')
    parser.add_argument('--token-secret', help='Personal Access Token secret')
    
    # Publishing options
    parser.add_argument('--overwrite', action='store_true', default=True,
                       help='Overwrite existing content (default: True)')
    parser.add_argument('--show-tabs', action='store_true', default=True,
                       help='Show tabs in workbook (default: True)')
    parser.add_argument('--description', help='Description for project/workbook')
    parser.add_argument('--tags', nargs='*', help='Tags for workbook')
    parser.add_argument('--datasource-name', help='Custom name for datasource')
    parser.add_argument('--workbook-name', help='Custom name for workbook')
    
    # Information commands
    parser.add_argument('--list-projects', action='store_true',
                       help='List all projects on server')
    parser.add_argument('--list-workbooks', 
                       help='List workbooks in project (or all if no project specified)')
    parser.add_argument('--validate-connection', action='store_true',
                       help='Validate Tableau Server connection')
    
    # Output options
    parser.add_argument('--format', choices=['json', 'table'], default='table',
                       help='Output format for list commands')
    parser.add_argument('--output-file', help='Save results to file')
    
    return parser.parse_args()

def main():
    """Main execution function"""
    args = parse_arguments()
    
    # Create output directory for logs
    os.makedirs('/workspace/tableau-agent/logs', exist_ok=True)
    
    try:
        # Initialize dashboard creator
        creator = TableauDashboardCreator(
            server_url=args.server_url,
            site_id=args.site_id,
            token_name=args.token_name,
            token_secret=args.token_secret
        )
        
        # Handle information commands
        if args.validate_connection:
            result = creator.validate_connection()
            print(json.dumps(result, indent=2))
            return 0 if result['success'] else 1
        
        if args.list_projects:
            projects = creator.list_projects()
            if args.format == 'json':
                print(json.dumps(projects, indent=2))
            else:
                print(f"Found {len(projects)} projects:")
                for project in projects:
                    print(f"  - {project['name']} (ID: {project['id']})")
            return 0
        
        if args.list_workbooks is not None:
            workbooks = creator.list_workbooks(args.list_workbooks if args.list_workbooks else None)
            if args.format == 'json':
                print(json.dumps(workbooks, indent=2))
            else:
                print(f"Found {len(workbooks)} workbooks:")
                for wb in workbooks:
                    print(f"  - {wb['name']} (Project: {wb.get('project_name', 'N/A')})")
            return 0
        
        # Handle dashboard creation
        if not args.project:
            print("ERROR: --project is required for dashboard creation")
            return 1
        
        if not args.datasource and not args.workbook:
            print("ERROR: At least one of --datasource or --workbook is required")
            return 1
        
        # Create dashboard
        result = creator.create_dashboard(
            project_name=args.project,
            datasource_path=args.datasource,
            workbook_path=args.workbook,
            overwrite=args.overwrite,
            show_tabs=args.show_tabs,
            description=args.description,
            tags=args.tags,
            datasource_name=args.datasource_name,
            workbook_name=args.workbook_name
        )
        
        # Output results
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2)
        
        print(json.dumps(result, indent=2))
        
        if result['success']:
            print("✅ Dashboard published successfully!")
            return 0
        else:
            print("❌ Dashboard creation failed!")
            return 1
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"ERROR: {e}")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)