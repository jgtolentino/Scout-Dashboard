#!/usr/bin/env python3
"""
pulser_task_router.py - Task orchestration for Pulser system

This script handles Pulser tasks, routing them to appropriate handlers and
managing their execution lifecycle.
"""

import os
import sys
import json
import yaml
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Version matching Pulser version
VERSION = "1.0.0"

# Constants
REPO_ROOT = Path(__file__).parent.absolute()
SKR_DIR = REPO_ROOT / "SKR"
TASKS_DIR = SKR_DIR / "tasks"
LOGS_DIR = REPO_ROOT / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Configure logging
import logging
LOG_FILE = LOGS_DIR / "pulser_tasks.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("pulser_task_router")

# Task status constants
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"

# Task handlers
def handle_leadops_task(task_id, task_data):
    """Handle a LeadOps task"""
    logger.info(f"Processing LeadOps task: {task_id}")
    
    # Check for LeadOps job configuration
    job_config_path = REPO_ROOT / "scripts" / "leadops_job.yaml"
    if not job_config_path.exists():
        logger.error(f"LeadOps job configuration not found at: {job_config_path}")
        return False
        
    try:
        # Load job configuration
        with open(job_config_path, 'r') as f:
            job_config = yaml.safe_load(f)
            
        # Update task data with job configuration
        task_data['config'] = job_config
        task_data['phases'] = job_config.get('phases', [])
        task_data['current_phase'] = 0
        task_data['phases_completed'] = []
        task_data['status'] = STATUS_IN_PROGRESS
        task_data['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Save updated task data
        save_task_data(task_id, task_data)
        
        logger.info(f"LeadOps task {task_id} initialized with {len(task_data['phases'])} phases")
        logger.info(f"Phase 0: {task_data['phases'][0]['name']}")
        
        # Notify that task is ready for phase execution
        print(f"✅ Task {task_id} initialized with {len(task_data['phases'])} phases")
        print(f"🏁 Ready to start Phase 1: {task_data['phases'][0]['name']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error initializing LeadOps task {task_id}: {str(e)}")
        return False

def handle_default_task(task_id, task_data):
    """Handle a default task"""
    logger.info(f"Processing default task: {task_id}")
    
    # Initialize basic task structure
    task_data['initiated_at'] = datetime.now(timezone.utc).isoformat()
    task_data['status'] = STATUS_IN_PROGRESS
    task_data['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    # Save updated task data
    save_task_data(task_id, task_data)
    
    logger.info(f"Default task {task_id} initialized")
    print(f"✅ Task {task_id} initialized")
    
    return True

# Utility functions
def load_task_data(task_id):
    """Load task data from YAML file"""
    task_file = TASKS_DIR / f"{task_id}.yaml"
    
    if not task_file.exists():
        logger.error(f"Task file not found: {task_file}")
        return None
        
    try:
        with open(task_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Error loading task data: {str(e)}")
        return None

def save_task_data(task_id, task_data):
    """Save task data to YAML file"""
    task_file = TASKS_DIR / f"{task_id}.yaml"
    
    # Ensure tasks directory exists
    TASKS_DIR.mkdir(exist_ok=True, parents=True)
    
    try:
        with open(task_file, 'w') as f:
            yaml.dump(task_data, f, default_flow_style=False)
        return True
    except Exception as e:
        logger.error(f"Error saving task data: {str(e)}")
        return False

def process_task(task_id):
    """Process a task by its ID"""
    logger.info(f"Processing task: {task_id}")
    
    # Load task data
    task_data = load_task_data(task_id)
    if task_data is None:
        return False
    
    # Determine task type and route to appropriate handler
    if "leadops" in task_id.lower():
        return handle_leadops_task(task_id, task_data)
    else:
        return handle_default_task(task_id, task_data)

def list_tasks(status=None):
    """List all tasks, optionally filtered by status"""
    TASKS_DIR.mkdir(exist_ok=True, parents=True)
    
    tasks = []
    for task_file in TASKS_DIR.glob("*.yaml"):
        try:
            with open(task_file, 'r') as f:
                task_data = yaml.safe_load(f)
                task_id = task_file.stem
                
                # Filter by status if specified
                if status and task_data.get('status') != status:
                    continue
                    
                tasks.append({
                    'task_id': task_id,
                    'status': task_data.get('status', 'unknown'),
                    'created_at': task_data.get('created_at', 'unknown'),
                    'type': 'leadops' if 'leadops' in task_id.lower() else 'standard'
                })
        except Exception as e:
            logger.error(f"Error reading task file {task_file}: {str(e)}")
    
    return tasks

def notify_claudia(task_id, task_data):
    """Notify Claudia about a task update"""
    logger.info(f"Notifying Claudia about task: {task_id}")
    
    # Create notification file for Claudia
    notification_file = SKR_DIR / "inbox" / f"task_notification_{task_id}_{int(time.time())}.yaml"
    
    try:
        notification_data = {
            'type': 'task_notification',
            'task_id': task_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': task_data.get('status', 'unknown'),
            'message': f"Task {task_id} updated to status: {task_data.get('status', 'unknown')}",
            'data': task_data
        }
        
        with open(notification_file, 'w') as f:
            yaml.dump(notification_data, f, default_flow_style=False)
            
        logger.info(f"Claudia notification created: {notification_file}")
        print(f"📬 Notification sent to Claudia about task {task_id}")
        return True
    except Exception as e:
        logger.error(f"Error creating Claudia notification: {str(e)}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Pulser Task Router')
    parser.add_argument('--version', '-v', action='store_true', help='Show version information')
    parser.add_argument('--list', '-l', action='store_true', help='List all tasks')
    parser.add_argument('--status', '-s', help='Filter tasks by status when listing')
    parser.add_argument('--task', '-t', help='Process a specific task by ID')
    parser.add_argument('--notify', '-n', action='store_true', help='Notify Claudia about the task')
    parser.add_argument('--create', '-c', help='Create a new task with the given ID')
    parser.add_argument('--type', help='Type of task to create (default or leadops)')
    
    args = parser.parse_args()
    
    # Show version and exit
    if args.version:
        print(f"Pulser Task Router v{VERSION}")
        sys.exit(0)
    
    # List tasks
    if args.list:
        tasks = list_tasks(args.status)
        if not tasks:
            print("No tasks found.")
        else:
            print(f"Found {len(tasks)} tasks:")
            for task in tasks:
                print(f"  • {task['task_id']} - Status: {task['status']} - Type: {task['type']}")
        sys.exit(0)
    
    # Process a specific task
    if args.task:
        if process_task(args.task):
            print(f"✅ Task {args.task} processed successfully")
            
            # Notify Claudia if requested
            if args.notify:
                task_data = load_task_data(args.task)
                if task_data:
                    notify_claudia(args.task, task_data)
        else:
            print(f"❌ Failed to process task {args.task}")
        sys.exit(0)
    
    # Create a new task
    if args.create:
        task_id = args.create
        task_type = args.type or ('leadops' if 'leadops' in task_id.lower() else 'default')
        
        task_data = {
            'task_id': task_id,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'status': STATUS_PENDING,
            'type': task_type,
            'source': 'task_router'
        }
        
        if save_task_data(task_id, task_data):
            print(f"✅ Task {task_id} created successfully")
            
            # Process the task immediately
            if process_task(task_id):
                print(f"✅ Task {task_id} processed successfully")
                
                # Notify Claudia if requested
                if args.notify:
                    notify_claudia(task_id, task_data)
        else:
            print(f"❌ Failed to create task {task_id}")
        sys.exit(0)
    
    # No action specified
    parser.print_help()
    sys.exit(1)

if __name__ == "__main__":
    main()