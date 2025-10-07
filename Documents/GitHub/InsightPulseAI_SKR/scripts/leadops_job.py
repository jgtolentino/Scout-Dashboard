#!/usr/bin/env python3
"""
leadops_job.py - LeadOps job handler for Pulser task router

This script processes LeadOps tasks through their defined phases, 
calling the appropriate LLM, executing commands, and managing outputs.
"""

import os
import sys
import json
import yaml
import time
import shutil
import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Version matching Pulser version
VERSION = "1.0.0"

# Constants
REPO_ROOT = Path(__file__).parent.parent.absolute()
SKR_DIR = REPO_ROOT / "SKR"
TASKS_DIR = SKR_DIR / "tasks"
OUTPUT_DIR = REPO_ROOT / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
LOGS_DIR = REPO_ROOT / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Configure logging
import logging
LOG_FILE = LOGS_DIR / "leadops_job.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("leadops_job")

# ANSI color codes for terminal output
GREEN = '\033[0;32m'
YELLOW = '\033[0;33m'
BLUE = '\033[0;34m'
RED = '\033[0;31m'
BOLD = '\033[1m'
NC = '\033[0m'  # No Color

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

def run_mistral_query(prompt, model="mistral", stream=True):
    """Run a query through the Mistral model"""
    logger.info(f"Running Mistral query with model: {model}")
    
    pulser_script = REPO_ROOT / "scripts" / "pulser_infer_ollama.py"
    
    if not pulser_script.exists():
        logger.error(f"Pulser inference script not found: {pulser_script}")
        return None
    
    try:
        cmd = ["python3", str(pulser_script)]
        
        if model:
            cmd.extend(["--model", model])
        
        if stream:
            cmd.append("--stream")
        
        cmd.append(prompt)
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Error running LLM query: {result.stderr}")
            return None
        
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Exception running LLM query: {str(e)}")
        return None

def initialize_phase_outputs(task_data, phase_index):
    """Initialize empty outputs for the current phase"""
    phase = task_data['phases'][phase_index]
    outputs = {}
    
    for output_name in phase.get('outputs', []):
        outputs[output_name] = None
    
    return outputs

def generate_phase_prompt(task_data, phase_index):
    """Generate the prompt for the current phase"""
    phase = task_data['phases'][phase_index]
    
    # Base prompt parts
    prompt_parts = [
        f"# LeadOps Task: {task_data['task_id']}",
        f"## Phase {phase_index + 1}: {phase['name']}",
        f"Description: {phase['description']}",
        "",
        "You are executing a multi-phase lead operations workflow."
    ]
    
    # Add context from previous phases if available
    if phase_index > 0:
        prompt_parts.append("\n## Previous Phases Results:")
        for i in range(phase_index):
            completed_phase = task_data['phases'][i]
            if i < len(task_data.get('phases_completed', [])):
                phase_result = task_data['phases_completed'][i]
                prompt_parts.append(f"\n### Phase {i+1}: {completed_phase['name']}")
                for output_name, output_value in phase_result.get('outputs', {}).items():
                    if output_value:
                        prompt_parts.append(f"- {output_name}: {output_value}")
    
    # Add required outputs for current phase
    prompt_parts.append("\n## Required Outputs:")
    for output_name in phase.get('outputs', []):
        prompt_parts.append(f"- {output_name}")
    
    # Add final instructions
    prompt_parts.extend([
        "",
        "Please complete this phase by providing the required outputs.",
        "Format your response as detailed information for each required output.",
        "",
        "Let's work through this systematically and thoroughly."
    ])
    
    return "\n".join(prompt_parts)

def parse_phase_outputs(response, task_data, phase_index):
    """Parse LLM response to extract outputs for the current phase"""
    phase = task_data['phases'][phase_index]
    expected_outputs = phase.get('outputs', [])
    outputs = {}
    
    if not response:
        logger.error("No response received from LLM")
        return None
    
    # Simple parsing - look for sections with output names
    for output_name in expected_outputs:
        # Look for headers with the output name
        pattern = f"# {output_name}:"
        pattern_alt = f"## {output_name}:"
        
        # Try to find the output with different patterns
        for p in [pattern, pattern_alt, f"{output_name}:", f"{output_name.upper()}:"]:
            if p in response:
                parts = response.split(p, 1)
                if len(parts) > 1:
                    output_text = parts[1].strip()
                    # Truncate at the next section if present
                    for next_output in expected_outputs:
                        if next_output != output_name:
                            for np in [f"# {next_output}:", f"## {next_output}:", 
                                     f"{next_output}:", f"{next_output.upper()}:"]:
                                if np in output_text:
                                    output_text = output_text.split(np, 1)[0].strip()
                    
                    outputs[output_name] = output_text
                    break
        
        # If not found with patterns, try to extract from the whole response
        if output_name not in outputs:
            # Very basic extraction - assume the output is somewhere in the response
            outputs[output_name] = f"[Extracted from response] Phase {phase_index + 1}: {phase['name']}"
    
    return outputs

def execute_phase(task_id, task_data, phase_index):
    """Execute a specific phase of the LeadOps task"""
    if phase_index >= len(task_data['phases']):
        logger.error(f"Phase index {phase_index} out of range")
        return False
    
    phase = task_data['phases'][phase_index]
    logger.info(f"Executing phase {phase_index + 1}: {phase['name']}")
    print_colored(f"🚀 Executing Phase {phase_index + 1}: {phase['name']}", BLUE + BOLD)
    
    # Check dependencies if any
    if 'depends_on' in phase and phase_index > 0:
        for dependency in phase['depends_on']:
            # Get index of dependency
            dependency_index = None
            for i, p in enumerate(task_data['phases']):
                if p.get('id') == dependency:
                    dependency_index = i
                    break
            
            if dependency_index is None:
                logger.error(f"Dependency {dependency} not found")
                return False
            
            # Check if dependency is completed
            if dependency_index >= len(task_data.get('phases_completed', [])):
                logger.error(f"Dependency {dependency} (Phase {dependency_index + 1}) not completed yet")
                return False
    
    # Generate prompt for the phase
    prompt = generate_phase_prompt(task_data, phase_index)
    
    # Run the prompt through the LLM
    model = task_data.get('config', {}).get('runtime', {}).get('model', 'mistral')
    print_colored(f"💬 Running inference with model: {model}", YELLOW)
    response = run_mistral_query(prompt, model=model)
    
    if not response:
        logger.error("Failed to get response from LLM")
        return False
    
    # Parse outputs from the response
    outputs = parse_phase_outputs(response, task_data, phase_index)
    
    if not outputs:
        logger.error("Failed to parse outputs from response")
        return False
    
    # Update task with phase results
    phase_result = {
        'phase_id': phase.get('id'),
        'phase_name': phase['name'],
        'phase_index': phase_index,
        'completed_at': datetime.now(timezone.utc).isoformat(),
        'outputs': outputs,
        'response': response
    }
    
    # Initialize phases_completed if not exists
    if 'phases_completed' not in task_data:
        task_data['phases_completed'] = []
    
    # Append or update phase result
    if phase_index < len(task_data['phases_completed']):
        task_data['phases_completed'][phase_index] = phase_result
    else:
        task_data['phases_completed'].append(phase_result)
    
    # Update current phase
    task_data['current_phase'] = phase_index + 1
    task_data['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    # Save outputs to result file
    save_phase_outputs(task_id, task_data, phase_index, outputs, response)
    
    # Save updated task
    if not save_task(task_id, task_data):
        logger.error("Failed to save task")
        return False
    
    # Print success message
    print_colored(f"✅ Phase {phase_index + 1} ({phase['name']}) completed successfully!", GREEN + BOLD)
    
    # If there are more phases, move to the next one
    if phase_index + 1 < len(task_data['phases']):
        next_phase = task_data['phases'][phase_index + 1]
        print_colored(f"⏭️  Next: Phase {phase_index + 2} - {next_phase['name']}", BLUE)
    else:
        # All phases complete
        task_data['status'] = 'completed'
        task_data['completed_at'] = datetime.now(timezone.utc).isoformat()
        save_task(task_id, task_data)
        print_colored("🎉 LeadOps task completed successfully!", GREEN + BOLD)
        
        # Generate final report
        generate_final_report(task_id, task_data)
    
    return True

def save_phase_outputs(task_id, task_data, phase_index, outputs, response):
    """Save phase outputs to result file"""
    phase = task_data['phases'][phase_index]
    
    # Create directory structure if needed
    results_dir = OUTPUT_DIR / task_id / f"phase_{phase_index + 1}_{phase['name'].lower().replace(' ', '_')}"
    results_dir.mkdir(exist_ok=True, parents=True)
    
    # Save raw response
    with open(results_dir / "response.md", 'w') as f:
        f.write(f"# Phase {phase_index + 1}: {phase['name']} - Response\n\n")
        f.write(response)
    
    # Save structured outputs
    with open(results_dir / "outputs.yaml", 'w') as f:
        yaml.dump(outputs, f, default_flow_style=False)
    
    # Save formatted outputs
    with open(results_dir / "outputs.md", 'w') as f:
        f.write(f"# Phase {phase_index + 1}: {phase['name']} - Outputs\n\n")
        for output_name, output_value in outputs.items():
            f.write(f"## {output_name}\n\n")
            f.write(f"{output_value}\n\n")
    
    logger.info(f"Saved phase outputs to {results_dir}")

def generate_final_report(task_id, task_data):
    """Generate final report for the completed task"""
    report_path = Path(task_data.get('config', {}).get('output', {}).get(
        'destination', OUTPUT_DIR / f"{task_id}_final_report.md"))
    
    # Ensure directory exists
    report_path.parent.mkdir(exist_ok=True, parents=True)
    
    logger.info(f"Generating final report: {report_path}")
    print_colored(f"📝 Generating final report: {report_path}", BLUE)
    
    # Create report content
    report_content = [
        f"# LeadOps Task Report: {task_id}",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Summary",
        f"Task ID: {task_id}",
        f"Status: {task_data.get('status', 'unknown')}",
        f"Created: {task_data.get('created_at', 'unknown')}",
        f"Completed: {task_data.get('completed_at', 'unknown')}",
        "",
        "## Phases",
        ""
    ]
    
    # Add phase results
    for i, phase_result in enumerate(task_data.get('phases_completed', [])):
        phase_name = phase_result.get('phase_name', f"Phase {i+1}")
        report_content.extend([
            f"### Phase {i+1}: {phase_name}",
            f"Completed: {phase_result.get('completed_at', 'unknown')}",
            "",
            "#### Outputs:",
            ""
        ])
        
        for output_name, output_value in phase_result.get('outputs', {}).items():
            # Format output value - limit size if needed
            if output_value and len(output_value) > 500:
                summary = output_value[:500] + "... (truncated)"
                report_content.append(f"**{output_name}**: {summary}")
            else:
                report_content.append(f"**{output_name}**: {output_value}")
            
            report_content.append("")
    
    # Add footer
    report_content.extend([
        "",
        "---",
        "Generated by Pulser LeadOps Job Handler"
    ])
    
    # Write report to file
    with open(report_path, 'w') as f:
        f.write("\n".join(report_content))
    
    logger.info(f"Final report generated: {report_path}")
    print_colored(f"✅ Final report generated: {report_path}", GREEN)
    
    return True

def process_task(task_id):
    """Process a LeadOps task"""
    logger.info(f"Processing LeadOps task: {task_id}")
    print_colored(f"🔄 Processing LeadOps task: {task_id}", BLUE + BOLD)
    
    # Load task data
    task_data = load_task(task_id)
    if not task_data:
        print_colored(f"❌ Failed to load task: {task_id}", RED)
        return False
    
    # Check task status
    status = task_data.get('status', 'unknown')
    if status == 'completed':
        print_colored(f"✅ Task already completed: {task_id}", YELLOW)
        return True
    
    # Get current phase
    current_phase = task_data.get('current_phase', 0)
    
    # Execute current phase
    if current_phase < len(task_data.get('phases', [])):
        result = execute_phase(task_id, task_data, current_phase)
        return result
    else:
        logger.error(f"Invalid phase index: {current_phase}")
        print_colored(f"❌ Invalid phase index: {current_phase}", RED)
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='LeadOps Job Handler')
    parser.add_argument('--version', '-v', action='store_true', help='Show version')
    parser.add_argument('--task', '-t', help='Task ID to process')
    parser.add_argument('--phase', '-p', type=int, help='Specific phase to execute (0-indexed)')
    parser.add_argument('--report', '-r', action='store_true', help='Generate final report only')
    parser.add_argument('--list', '-l', action='store_true', help='List LeadOps tasks')
    
    args = parser.parse_args()
    
    # Show version and exit
    if args.version:
        print(f"LeadOps Job Handler v{VERSION}")
        sys.exit(0)
    
    # List LeadOps tasks
    if args.list:
        print_colored("📋 LeadOps Tasks:", BLUE + BOLD)
        
        # Find all task files
        tasks = []
        for task_file in TASKS_DIR.glob("*.yaml"):
            try:
                with open(task_file, 'r') as f:
                    task_data = yaml.safe_load(f)
                    task_id = task_file.stem
                    
                    # Filter to LeadOps tasks
                    if task_id.startswith("leadops-") or task_data.get('type') == 'leadops':
                        tasks.append({
                            'task_id': task_id,
                            'status': task_data.get('status', 'unknown'),
                            'current_phase': task_data.get('current_phase', 0),
                            'total_phases': len(task_data.get('phases', [])),
                            'created_at': task_data.get('created_at', 'unknown')
                        })
            except Exception as e:
                logger.error(f"Error reading task file {task_file}: {str(e)}")
        
        if not tasks:
            print_colored("No LeadOps tasks found.", YELLOW)
            sys.exit(0)
        
        # Print tasks
        for task in sorted(tasks, key=lambda x: x['task_id']):
            status_color = GREEN if task['status'] == 'completed' else YELLOW
            progress = f"{task['current_phase']}/{task['total_phases']}" if task['total_phases'] > 0 else "unknown"
            print(f"  • {task['task_id']} - Status: {status_color}{task['status']}{NC} - Progress: {progress}")
        
        sys.exit(0)
    
    # Generate report only
    if args.report and args.task:
        task_data = load_task(args.task)
        if task_data:
            generate_final_report(args.task, task_data)
        else:
            print_colored(f"❌ Failed to load task: {args.task}", RED)
        sys.exit(0)
    
    # Process specific task
    if args.task:
        # Load task data
        task_data = load_task(args.task)
        if not task_data:
            print_colored(f"❌ Failed to load task: {args.task}", RED)
            sys.exit(1)
        
        # Run specific phase if requested
        if args.phase is not None:
            if args.phase >= 0 and args.phase < len(task_data.get('phases', [])):
                result = execute_phase(args.task, task_data, args.phase)
                sys.exit(0 if result else 1)
            else:
                print_colored(f"❌ Invalid phase index: {args.phase}", RED)
                sys.exit(1)
        
        # Process the task normally
        result = process_task(args.task)
        sys.exit(0 if result else 1)
    
    # No action specified
    parser.print_help()
    sys.exit(1)

if __name__ == "__main__":
    main()