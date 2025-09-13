#!/usr/bin/env python3
"""
ping_caca.py - QA Circuit Testing for Pulser System

This script handles QA tasks from the Pulser task system,
creating quality circuit tests and reporting results.
"""

import os
import sys
import json
import yaml
import time
import shutil
import requests
import subprocess
import argparse
from datetime import datetime, timezone
from pathlib import Path
import random

# Version matching Pulser version
VERSION = "1.0.0"

# Constants
REPO_ROOT = Path(__file__).parent.parent.absolute()
SKR_DIR = REPO_ROOT / "SKR"
TASKS_DIR = SKR_DIR / "tasks"
QA_DIR = REPO_ROOT / "qa"
QA_DIR.mkdir(exist_ok=True)
RESULTS_DIR = QA_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)
LOGS_DIR = REPO_ROOT / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Configure logging
import logging
LOG_FILE = LOGS_DIR / "ping_caca.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ping_caca")

# ANSI color codes for terminal output
GREEN = '\033[0;32m'
YELLOW = '\033[0;33m'
BLUE = '\033[0;34m'
RED = '\033[0;31m'
BOLD = '\033[1m'
NC = '\033[0m'  # No Color

# QA Test States
TEST_STATES = {
    'pending': '⏳',
    'running': '🔄',
    'passed': '✅',
    'failed': '❌',
    'skipped': '⏭️',
    'unknown': '❓'
}

# Helper functions
def print_colored(message, color=BLUE):
    """Print with color"""
    print(f"{color}{message}{NC}")

def load_task(task_id):
    """Load a task from the tasks directory"""
    task_file = TASKS_DIR / f"{task_id}.yaml"
    
    if not task_file.exists():
        logger.error(f"Task file not found: {task_file}")
        return None
    
    try:
        with open(task_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Error loading task: {str(e)}")
        return None

def save_task(task_id, task_data):
    """Save task data to YAML file"""
    task_file = TASKS_DIR / f"{task_id}.yaml"
    
    try:
        with open(task_file, 'w') as f:
            yaml.dump(task_data, f, default_flow_style=False)
        return True
    except Exception as e:
        logger.error(f"Error saving task: {str(e)}")
        return False

def run_command(command):
    """Run a shell command and return the output"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Command failed: {command}")
            logger.error(f"Error: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Exception running command: {command}")
        logger.error(f"Error: {str(e)}")
        return None

def check_file_exists(file_path):
    """Check if a file exists"""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return False
    return True

def get_system_info():
    """Get basic system information"""
    info = {}
    try:
        # OS info
        info['os'] = run_command("uname -s")
        info['hostname'] = run_command("hostname")
        
        # Python info
        info['python_version'] = run_command("python3 --version")
        
        # Disk usage
        info['disk_usage'] = run_command("df -h / | tail -1 | awk '{print $5}'")
        
        # Memory usage
        if sys.platform == 'darwin':  # macOS
            info['memory_usage'] = run_command("top -l 1 -s 0 | grep PhysMem")
        else:  # Linux
            info['memory_usage'] = run_command("free -h | head -2 | tail -1")
        
        # Get Ollama status
        ollama_status = subprocess.run(["pgrep", "ollama"], capture_output=True)
        info['ollama_running'] = ollama_status.returncode == 0
        
        # Get network status
        ping_result = subprocess.run(["ping", "-c", "1", "-W", "1", "8.8.8.8"], capture_output=True)
        info['network_ok'] = ping_result.returncode == 0
        
        return info
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        return {'error': str(e)}

def run_pipeline_test(task_id, task_data):
    """Run a pipeline test"""
    logger.info(f"Running pipeline test for task: {task_id}")
    print_colored(f"🧪 Running pipeline test for: {task_id}", BLUE + BOLD)
    
    # Generate a timestamp for test session
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_id = f"test_{task_id}_{timestamp}"
    
    # Create results directory
    test_dir = RESULTS_DIR / test_id
    test_dir.mkdir(exist_ok=True, parents=True)
    
    # Get system information
    system_info = get_system_info()
    
    # Define test suites based on task type
    test_suites = []
    
    # Basic system tests - run for all tasks
    system_tests = {
        'name': 'System Environment',
        'description': 'Basic system environment tests',
        'tests': [
            {
                'name': 'Operating System Check',
                'command': 'uname -a',
                'expected': lambda x: len(x) > 0,
                'status': 'pending'
            },
            {
                'name': 'Python Environment',
                'command': 'python3 --version',
                'expected': lambda x: 'Python 3' in x,
                'status': 'pending'
            },
            {
                'name': 'Disk Space',
                'command': "df -h / | tail -1 | awk '{print $5}'",
                'expected': lambda x: int(x.replace('%', '')) < 90,
                'status': 'pending'
            }
        ]
    }
    test_suites.append(system_tests)
    
    # Pulser specific tests
    pulser_tests = {
        'name': 'Pulser Environment',
        'description': 'Pulser components tests',
        'tests': [
            {
                'name': 'Task Router Presence',
                'command': f'ls -la {REPO_ROOT}/pulser_task_router.py',
                'expected': lambda x: 'pulser_task_router.py' in x,
                'status': 'pending'
            },
            {
                'name': 'SKR Directory',
                'command': f'ls -la {SKR_DIR}',
                'expected': lambda x: 'tasks' in x,
                'status': 'pending'
            },
            {
                'name': 'LeadOps Handler',
                'command': f'ls -la {REPO_ROOT}/scripts/leadops_job.py',
                'expected': lambda x: 'leadops_job.py' in x,
                'status': 'pending'
            }
        ]
    }
    test_suites.append(pulser_tests)
    
    # Ollama tests
    ollama_tests = {
        'name': 'Ollama LLM',
        'description': 'Ollama LLM tests',
        'tests': [
            {
                'name': 'Ollama Process',
                'command': 'pgrep ollama || echo "Not running"',
                'expected': lambda x: x != "Not running",
                'status': 'pending'
            },
            {
                'name': 'Ollama API',
                'command': 'curl -s http://localhost:11434/api/tags | grep -q "models" && echo "API OK" || echo "API Error"',
                'expected': lambda x: 'API OK' in x,
                'status': 'pending'
            },
            {
                'name': 'Mistral Model',
                'command': 'curl -s http://localhost:11434/api/tags | grep -q "mistral" && echo "Mistral OK" || echo "Mistral Not Found"',
                'expected': lambda x: 'Mistral OK' in x,
                'status': 'pending'
            }
        ]
    }
    test_suites.append(ollama_tests)
    
    # Task specific tests
    if 'leadops' in task_id.lower() or task_data.get('type') == 'leadops':
        leadops_tests = {
            'name': 'LeadOps Task',
            'description': 'LeadOps specific tests',
            'tests': [
                {
                    'name': 'LeadOps Task File',
                    'command': f'ls -la {TASKS_DIR}/{task_id}.yaml',
                    'expected': lambda x: f'{task_id}.yaml' in x,
                    'status': 'pending'
                },
                {
                    'name': 'LeadOps Configuration',
                    'command': f'grep -q "phases:" {TASKS_DIR}/{task_id}.yaml && echo "Phases Found" || echo "Missing Phases"',
                    'expected': lambda x: 'Phases Found' in x,
                    'status': 'pending'
                },
                {
                    'name': 'Output Directory',
                    'command': f'mkdir -p {REPO_ROOT}/output/{task_id} && echo "OK"',
                    'expected': lambda x: 'OK' in x,
                    'status': 'pending'
                }
            ]
        }
        test_suites.append(leadops_tests)
    
    # Run all tests
    all_tests_passed = True
    test_results = {
        'task_id': task_id,
        'test_id': test_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'system_info': system_info,
        'test_suites': []
    }
    
    for suite in test_suites:
        print_colored(f"\n🔍 Running test suite: {suite['name']}", YELLOW)
        
        suite_result = {
            'name': suite['name'],
            'description': suite['description'],
            'tests': [],
            'passed': 0,
            'failed': 0,
            'skipped': 0
        }
        
        for test in suite['tests']:
            test_name = test['name']
            print(f"  {TEST_STATES['running']} Running: {test_name}... ", end='', flush=True)
            
            test_result = {
                'name': test_name,
                'status': 'unknown',
                'output': None,
                'error': None,
                'duration_ms': 0
            }
            
            # Run the test
            start_time = time.time()
            
            try:
                output = run_command(test['command'])
                test_result['output'] = output
                
                # Check result against expected
                if output is not None:
                    expected_check = test['expected']
                    if callable(expected_check):
                        passed = expected_check(output)
                    else:
                        passed = expected_check == output
                    
                    if passed:
                        test_result['status'] = 'passed'
                        suite_result['passed'] += 1
                        print(f"{TEST_STATES['passed']} Passed")
                    else:
                        test_result['status'] = 'failed'
                        suite_result['failed'] += 1
                        all_tests_passed = False
                        print(f"{TEST_STATES['failed']} Failed")
                else:
                    test_result['status'] = 'failed'
                    test_result['error'] = 'Command returned no output'
                    suite_result['failed'] += 1
                    all_tests_passed = False
                    print(f"{TEST_STATES['failed']} Failed (no output)")
            except Exception as e:
                test_result['status'] = 'failed'
                test_result['error'] = str(e)
                suite_result['failed'] += 1
                all_tests_passed = False
                print(f"{TEST_STATES['failed']} Failed: {str(e)}")
            
            # Calculate duration
            test_result['duration_ms'] = int((time.time() - start_time) * 1000)
            suite_result['tests'].append(test_result)
        
        test_results['test_suites'].append(suite_result)
    
    # Save test results
    results_file = test_dir / "results.yaml"
    with open(results_file, 'w') as f:
        yaml.dump(test_results, f, default_flow_style=False)
    
    # Generate HTML report
    html_report = generate_html_report(test_results)
    html_file = test_dir / "report.html"
    with open(html_file, 'w') as f:
        f.write(html_report)
    
    # Update task with test results
    task_data['qa_results'] = {
        'test_id': test_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'passed': all_tests_passed,
        'report_path': str(html_file)
    }
    save_task(task_id, task_data)
    
    # Print summary
    print_colored("\n📋 Test Summary:", BLUE + BOLD)
    total_passed = sum(suite['passed'] for suite in test_results['test_suites'])
    total_failed = sum(suite['failed'] for suite in test_results['test_suites'])
    total_tests = total_passed + total_failed
    
    if total_failed == 0:
        status_color = GREEN
        status_text = "All tests passed!"
    else:
        status_color = RED
        status_text = f"{total_failed} tests failed!"
    
    print_colored(f"Results: {total_passed}/{total_tests} passed - {status_text}", status_color + BOLD)
    print_colored(f"Report: {html_file}", BLUE)
    
    return all_tests_passed, str(html_file)

def generate_html_report(test_results):
    """Generate HTML report from test results"""
    task_id = test_results['task_id']
    test_id = test_results['test_id']
    timestamp = datetime.fromisoformat(test_results['timestamp'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
    system_info = test_results['system_info']
    
    # Count results
    total_passed = sum(suite['passed'] for suite in test_results['test_suites'])
    total_failed = sum(suite['failed'] for suite in test_results['test_suites'])
    total_skipped = sum(suite['skipped'] for suite in test_results['test_suites'])
    total_tests = total_passed + total_failed + total_skipped
    
    if total_failed == 0:
        overall_status = "✅ Passed"
        status_color = "green"
    else:
        overall_status = "❌ Failed"
        status_color = "red"
    
    # Start building HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Report: {task_id}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1, h2, h3, h4 {{
            color: #2c3e50;
        }}
        .header {{
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        .summary {{
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }}
        .status {{
            font-weight: bold;
            color: {status_color};
        }}
        .system-info {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }}
        .info-item {{
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
        }}
        .suite {{
            margin-bottom: 30px;
            border: 1px solid #eee;
            border-radius: 5px;
            overflow: hidden;
        }}
        .suite-header {{
            background-color: #f0f0f0;
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
        }}
        .suite-body {{
            padding: 15px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }}
        th {{
            background-color: #f5f5f5;
        }}
        .passed {{
            color: green;
        }}
        .failed {{
            color: red;
        }}
        .skipped {{
            color: orange;
        }}
        .output {{
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            white-space: pre-wrap;
            margin-top: 5px;
            max-height: 100px;
            overflow-y: auto;
        }}
        .toggle-button {{
            background: none;
            border: none;
            color: #007bff;
            cursor: pointer;
            padding: 0;
            font-size: 0.9em;
        }}
        .hidden {{
            display: none;
        }}
        .progress {{
            height: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
            margin-bottom: 10px;
        }}
        .progress-bar {{
            height: 100%;
            border-radius: 5px;
            background-color: #4caf50;
        }}
        .progress-bar-fail {{
            background-color: #f44336;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Pulser QA Report</h1>
        <div>
            <strong>Task:</strong> {task_id}
            <br>
            <strong>Test ID:</strong> {test_id}
            <br>
            <strong>Date:</strong> {timestamp}
        </div>
    </div>

    <div class="summary">
        <h2>Test Summary</h2>
        <p class="status">{overall_status}</p>
        
        <div class="progress">
            <div class="progress-bar" style="width: {100 * total_passed / max(total_tests, 1)}%"></div>
            <div class="progress-bar progress-bar-fail" style="width: {100 * total_failed / max(total_tests, 1)}%; float: right;"></div>
        </div>
        
        <p>
            <strong>Total Tests:</strong> {total_tests}
            <br>
            <strong>Passed:</strong> {total_passed} ({100 * total_passed / max(total_tests, 1):.1f}%)
            <br>
            <strong>Failed:</strong> {total_failed} ({100 * total_failed / max(total_tests, 1):.1f}%)
            <br>
            <strong>Skipped:</strong> {total_skipped} ({100 * total_skipped / max(total_tests, 1):.1f}%)
        </p>
    </div>

    <h2>System Information</h2>
    <div class="system-info">
"""
    
    # Add system info
    for key, value in system_info.items():
        html += f"""
        <div class="info-item">
            <strong>{key.replace('_', ' ').title()}:</strong> {value}
        </div>"""
    
    html += """
    </div>

    <h2>Test Results</h2>
"""
    
    # Add test suites
    for i, suite in enumerate(test_results['test_suites']):
        suite_id = f"suite-{i}"
        suite_name = suite['name']
        suite_description = suite['description']
        suite_passed = suite['passed']
        suite_failed = suite['failed']
        suite_skipped = suite.get('skipped', 0)
        suite_total = suite_passed + suite_failed + suite_skipped
        
        html += f"""
    <div class="suite">
        <div class="suite-header">
            <h3>{suite_name}</h3>
            <p>{suite_description}</p>
            <p>
                <strong>Results:</strong> {suite_passed}/{suite_total} passed
                ({100 * suite_passed / max(suite_total, 1):.1f}%)
            </p>
        </div>
        <div class="suite-body">
            <table>
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
"""
        
        # Add tests
        for test in suite['tests']:
            test_name = test['name']
            test_status = test['status']
            test_output = test.get('output', '')
            test_error = test.get('error', '')
            test_duration = test.get('duration_ms', 0)
            
            status_class = test_status
            status_icon = TEST_STATES.get(test_status, '❓')
            
            details_button = f"""<button class="toggle-button" onclick="toggleOutput('{suite_id}-{test_name}')">Show details</button>"""
            
            output_html = ""
            if test_output or test_error:
                output_html += f"""
                    <div id="{suite_id}-{test_name}" class="output hidden">"""
                
                if test_output:
                    output_html += f"""
                        <strong>Output:</strong><br>
                        {test_output}"""
                
                if test_error:
                    output_html += f"""
                        <br><strong>Error:</strong><br>
                        {test_error}"""
                
                output_html += """
                    </div>
                """
            
            html += f"""
                <tr>
                    <td>{test_name}</td>
                    <td class="{status_class}">{status_icon} {test_status.capitalize()}</td>
                    <td>{test_duration} ms</td>
                    <td>{details_button}{output_html}</td>
                </tr>"""
        
        html += """
                </tbody>
            </table>
        </div>
    </div>
"""
    
    # Finish HTML
    html += """
    <script>
        function toggleOutput(id) {
            var element = document.getElementById(id);
            if (element.classList.contains('hidden')) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
"""
    
    return html

def process_task(task_id):
    """Process a QA task"""
    logger.info(f"Processing QA task: {task_id}")
    print_colored(f"🔄 Processing QA task: {task_id}", BLUE + BOLD)
    
    # Load task data
    task_data = load_task(task_id)
    if not task_data:
        print_colored(f"❌ Failed to load task: {task_id}", RED)
        return False
    
    # Check if this is a QA task or a task that needs QA
    is_qa_task = task_id.startswith('qa-')
    
    # Update task status
    task_data['status'] = 'in_progress'
    task_data['last_updated'] = datetime.now(timezone.utc).isoformat()
    save_task(task_id, task_data)
    
    # Run pipeline test
    passed, report_path = run_pipeline_test(task_id, task_data)
    
    # Update task status
    task_data['status'] = 'completed' if passed else 'failed'
    task_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    save_task(task_id, task_data)
    
    # Print results
    status_color = GREEN if passed else RED
    status_text = "Passed" if passed else "Failed"
    print_colored(f"✅ QA testing complete - Status: {status_text}", status_color + BOLD)
    print_colored(f"📝 Report: {report_path}", BLUE)
    
    return passed

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Pulser QA Circuit Testing')
    parser.add_argument('--version', '-v', action='store_true', help='Show version')
    parser.add_argument('--task', '-t', help='Task ID to test')
    parser.add_argument('--create', '-c', help='Create a new QA task for testing a target task')
    parser.add_argument('--list', '-l', action='store_true', help='List QA tasks')
    
    args = parser.parse_args()
    
    # Show version and exit
    if args.version:
        print(f"Pulser QA Circuit Testing v{VERSION}")
        sys.exit(0)
    
    # List QA tasks
    if args.list:
        print_colored("📋 QA Tasks:", BLUE + BOLD)
        
        # Find all task files
        tasks = []
        for task_file in TASKS_DIR.glob("*.yaml"):
            try:
                with open(task_file, 'r') as f:
                    task_data = yaml.safe_load(f)
                    task_id = task_file.stem
                    
                    # Filter to QA tasks
                    if task_id.startswith("qa-") or task_data.get('type') == 'qa':
                        tasks.append({
                            'task_id': task_id,
                            'status': task_data.get('status', 'unknown'),
                            'created_at': task_data.get('created_at', 'unknown'),
                            'target_task': task_data.get('target_task', 'none')
                        })
            except Exception as e:
                logger.error(f"Error reading task file {task_file}: {str(e)}")
        
        if not tasks:
            print_colored("No QA tasks found.", YELLOW)
            sys.exit(0)
        
        # Print tasks
        for task in sorted(tasks, key=lambda x: x['task_id']):
            status_color = GREEN if task['status'] == 'completed' else YELLOW
            print(f"  • {task['task_id']} - Status: {status_color}{task['status']}{NC} - Target: {task['target_task']}")
        
        sys.exit(0)
    
    # Create a new QA task for a target task
    if args.create:
        target_task = args.create
        qa_task_id = f"qa-{target_task}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        print_colored(f"🆕 Creating QA task: {qa_task_id}", BLUE + BOLD)
        
        # Check if target task exists
        target_task_file = TASKS_DIR / f"{target_task}.yaml"
        if not target_task_file.exists():
            print_colored(f"❌ Target task not found: {target_task}", RED)
            sys.exit(1)
        
        # Create QA task
        qa_task_data = {
            'task_id': qa_task_id,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'status': 'pending',
            'type': 'qa',
            'target_task': target_task,
            'source': 'ping_caca'
        }
        
        if save_task(qa_task_id, qa_task_data):
            print_colored(f"✅ QA task created: {qa_task_id}", GREEN)
            
            # Optionally process immediately
            print_colored(f"🔄 Processing QA task immediately...", BLUE)
            process_task(qa_task_id)
        else:
            print_colored(f"❌ Failed to create QA task", RED)
            sys.exit(1)
        
        sys.exit(0)
    
    # Process specific task
    if args.task:
        result = process_task(args.task)
        sys.exit(0 if result else 1)
    
    # No action specified
    parser.print_help()
    sys.exit(1)

if __name__ == "__main__":
    main()