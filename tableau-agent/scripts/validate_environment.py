#!/usr/bin/env python3

"""
Tableau Agent Environment Validation
Validates environment setup and dependencies for TableauAgent
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnvironmentValidator:
    """Validates TableauAgent environment"""
    
    def __init__(self):
        """Initialize validator"""
        self.validation_results = {
            'overall_status': 'UNKNOWN',
            'python_environment': {},
            'dependencies': {},
            'configuration': {},
            'filesystem': {},
            'network': {},
            'errors': [],
            'warnings': []
        }
    
    def validate_python_environment(self) -> bool:
        """Validate Python environment"""
        try:
            # Check Python version
            python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            self.validation_results['python_environment']['version'] = python_version
            
            if sys.version_info < (3, 8):
                self.validation_results['errors'].append(f"Python {python_version} is too old. Minimum required: 3.8")
                return False
            
            # Check virtual environment
            in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
            self.validation_results['python_environment']['virtual_env'] = in_venv
            
            if not in_venv:
                self.validation_results['warnings'].append("Not running in virtual environment")
            
            logger.info(f"Python environment: {python_version} (Virtual env: {in_venv})")
            return True
            
        except Exception as e:
            self.validation_results['errors'].append(f"Python environment check failed: {e}")
            return False
    
    def validate_dependencies(self) -> bool:
        """Validate required dependencies"""
        required_packages = {
            'tableau_api_lib': '0.1.48',
            'tableauserverclient': '0.25.0',
            'tableauhyperapi': '0.0.17200',
            'pandas': '1.5.0',
            'requests': '2.28.0',
            'python-dotenv': '1.0.0'
        }
        
        all_dependencies_ok = True
        
        for package, min_version in required_packages.items():
            try:
                if package == 'python-dotenv':
                    import dotenv
                    package_name = 'python-dotenv'
                    version = dotenv.__version__
                elif package == 'tableau_api_lib':
                    import tableau_api_lib
                    package_name = 'tableau-api-lib'
                    version = tableau_api_lib.__version__
                elif package == 'tableauserverclient':
                    import tableauserverclient
                    package_name = 'tableauserverclient'
                    version = tableauserverclient.__version__
                elif package == 'tableauhyperapi':
                    import tableauhyperapi
                    package_name = 'tableauhyperapi'
                    version = getattr(tableauhyperapi, '__version__', 'unknown')
                elif package == 'pandas':
                    import pandas
                    package_name = 'pandas'
                    version = pandas.__version__
                elif package == 'requests':
                    import requests
                    package_name = 'requests'
                    version = requests.__version__
                else:
                    continue
                
                self.validation_results['dependencies'][package_name] = {
                    'installed': True,
                    'version': version,
                    'min_required': min_version
                }
                
                logger.info(f"✓ {package_name}: {version}")
                
            except ImportError:
                self.validation_results['dependencies'][package] = {
                    'installed': False,
                    'version': None,
                    'min_required': min_version
                }
                self.validation_results['errors'].append(f"Required package not installed: {package}")
                all_dependencies_ok = False
                logger.error(f"✗ {package}: Not installed")
        
        return all_dependencies_ok
    
    def validate_configuration(self) -> bool:
        """Validate configuration files"""
        config_files = [
            '.env.tableau',
            '.env.tableau.example'
        ]
        
        config_ok = True
        
        for config_file in config_files:
            config_path = Path(config_file)
            
            if config_path.exists():
                self.validation_results['configuration'][config_file] = {
                    'exists': True,
                    'readable': config_path.is_file() and os.access(config_path, os.R_OK)
                }
                logger.info(f"✓ Configuration file: {config_file}")
            else:
                self.validation_results['configuration'][config_file] = {
                    'exists': False,
                    'readable': False
                }
                
                if config_file == '.env.tableau':
                    self.validation_results['errors'].append(f"Required configuration file missing: {config_file}")
                    config_ok = False
                else:
                    self.validation_results['warnings'].append(f"Example configuration file missing: {config_file}")
                
                logger.warning(f"✗ Configuration file: {config_file}")
        
        # Validate environment variables if .env.tableau exists
        if Path('.env.tableau').exists():
            try:
                from dotenv import load_dotenv
                load_dotenv('.env.tableau')
                
                required_env_vars = ['TBL_SERVER', 'TBL_TOKEN_NAME', 'TBL_TOKEN']
                missing_vars = []
                
                for var in required_env_vars:
                    value = os.getenv(var)
                    if not value:
                        missing_vars.append(var)
                    else:
                        # Mask sensitive values
                        display_value = value if var == 'TBL_SERVER' else '***'
                        self.validation_results['configuration'][f'env_{var}'] = {
                            'set': True,
                            'value': display_value
                        }
                
                if missing_vars:
                    self.validation_results['errors'].append(f"Missing required environment variables: {', '.join(missing_vars)}")
                    config_ok = False
                
            except Exception as e:
                self.validation_results['warnings'].append(f"Could not validate environment variables: {e}")
        
        return config_ok
    
    def validate_filesystem(self) -> bool:
        """Validate filesystem permissions and directories"""
        required_dirs = [
            '/workspace/tableau-agent',
            '/workspace/tableau-agent/scripts',
            '/workspace/tableau-agent/temp',
            '/workspace/tableau-agent/logs'
        ]
        
        filesystem_ok = True
        
        for dir_path in required_dirs:
            path = Path(dir_path)
            
            try:
                # Create directory if it doesn't exist
                path.mkdir(parents=True, exist_ok=True)
                
                # Check permissions
                readable = os.access(path, os.R_OK)
                writable = os.access(path, os.W_OK)
                executable = os.access(path, os.X_OK)
                
                self.validation_results['filesystem'][str(path)] = {
                    'exists': path.exists(),
                    'is_directory': path.is_dir(),
                    'readable': readable,
                    'writable': writable,
                    'executable': executable
                }
                
                if not (readable and writable and executable):
                    self.validation_results['errors'].append(f"Insufficient permissions for directory: {path}")
                    filesystem_ok = False
                    logger.error(f"✗ Directory permissions: {path}")
                else:
                    logger.info(f"✓ Directory: {path}")
                
            except Exception as e:
                self.validation_results['errors'].append(f"Error creating/accessing directory {path}: {e}")
                filesystem_ok = False
                logger.error(f"✗ Directory error: {path} - {e}")
        
        return filesystem_ok
    
    def validate_network(self) -> bool:
        """Validate network connectivity"""
        try:
            import requests
            
            # Test basic internet connectivity
            try:
                response = requests.get('https://httpbin.org/get', timeout=10)
                internet_ok = response.status_code == 200
                self.validation_results['network']['internet'] = internet_ok
                
                if internet_ok:
                    logger.info("✓ Internet connectivity")
                else:
                    logger.warning("✗ Internet connectivity issue")
                    self.validation_results['warnings'].append("Internet connectivity issue")
                
            except Exception as e:
                self.validation_results['network']['internet'] = False
                self.validation_results['warnings'].append(f"Internet connectivity test failed: {e}")
                logger.warning(f"✗ Internet connectivity: {e}")
            
            # Test Tableau connectivity if server is configured
            tableau_server = os.getenv('TBL_SERVER')
            if tableau_server:
                try:
                    response = requests.get(f"{tableau_server}/api/3.19/serverinfo", timeout=30)
                    tableau_reachable = response.status_code in [200, 401, 403]  # 401/403 means server is reachable
                    
                    self.validation_results['network']['tableau_server'] = {
                        'reachable': tableau_reachable,
                        'status_code': response.status_code,
                        'server': tableau_server
                    }
                    
                    if tableau_reachable:
                        logger.info(f"✓ Tableau Server reachable: {tableau_server}")
                    else:
                        logger.warning(f"✗ Tableau Server not reachable: {tableau_server}")
                        self.validation_results['warnings'].append(f"Tableau Server not reachable: {tableau_server}")
                
                except Exception as e:
                    self.validation_results['network']['tableau_server'] = {
                        'reachable': False,
                        'error': str(e),
                        'server': tableau_server
                    }
                    self.validation_results['warnings'].append(f"Tableau Server connectivity test failed: {e}")
                    logger.warning(f"✗ Tableau Server connectivity: {e}")
            
            return True
            
        except ImportError:
            self.validation_results['errors'].append("requests library not available for network testing")
            return False
        except Exception as e:
            self.validation_results['errors'].append(f"Network validation failed: {e}")
            return False
    
    def run_full_validation(self) -> Dict:
        """Run complete environment validation"""
        logger.info("Starting TableauAgent environment validation...")
        
        # Run all validations
        validations = [
            ('Python Environment', self.validate_python_environment),
            ('Dependencies', self.validate_dependencies),
            ('Configuration', self.validate_configuration),
            ('Filesystem', self.validate_filesystem),
            ('Network', self.validate_network)
        ]
        
        all_passed = True
        
        for validation_name, validation_func in validations:
            logger.info(f"Validating {validation_name}...")
            try:
                result = validation_func()
                if not result:
                    all_passed = False
            except Exception as e:
                logger.error(f"Validation {validation_name} failed with exception: {e}")
                self.validation_results['errors'].append(f"{validation_name} validation failed: {e}")
                all_passed = False
        
        # Set overall status
        if all_passed and not self.validation_results['errors']:
            self.validation_results['overall_status'] = 'PASS'
        elif self.validation_results['errors']:
            self.validation_results['overall_status'] = 'FAIL'
        else:
            self.validation_results['overall_status'] = 'PASS_WITH_WARNINGS'
        
        logger.info(f"Validation completed with status: {self.validation_results['overall_status']}")
        
        return self.validation_results
    
    def print_summary(self, results: Dict) -> None:
        """Print validation summary"""
        status = results['overall_status']
        
        print(f"\n{'='*60}")
        print(f"  TableauAgent Environment Validation Summary")
        print(f"{'='*60}")
        
        if status == 'PASS':
            print("🎉 VALIDATION PASSED - Environment is ready!")
        elif status == 'PASS_WITH_WARNINGS':
            print("⚠️  VALIDATION PASSED WITH WARNINGS - Environment is functional but has issues")
        else:
            print("❌ VALIDATION FAILED - Environment setup issues detected")
        
        print(f"\nOverall Status: {status}")
        print(f"Errors: {len(results['errors'])}")
        print(f"Warnings: {len(results['warnings'])}")
        
        if results['errors']:
            print(f"\n🚨 ERRORS:")
            for error in results['errors']:
                print(f"  • {error}")
        
        if results['warnings']:
            print(f"\n⚠️  WARNINGS:")
            for warning in results['warnings']:
                print(f"  • {warning}")
        
        print(f"\n{'='*60}")

def main():
    """Main execution function"""
    try:
        validator = EnvironmentValidator()
        results = validator.run_full_validation()
        
        # Print summary
        validator.print_summary(results)
        
        # Save detailed results
        results_file = '/workspace/tableau-agent/logs/validation_results.json'
        os.makedirs(os.path.dirname(results_file), exist_ok=True)
        
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nDetailed results saved to: {results_file}")
        
        # Return appropriate exit code
        if results['overall_status'] == 'PASS':
            return 0
        elif results['overall_status'] == 'PASS_WITH_WARNINGS':
            return 1
        else:
            return 2
        
    except Exception as e:
        logger.error(f"Environment validation failed: {e}")
        print(f"ERROR: {e}")
        return 3

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)