#!/usr/bin/env python3
"""
MCP Status Monitor

This script monitors the status of tasks and can report on active, completed,
and failed tasks. It provides a dashboard-like view of the MCP bridge activity.
"""

import json
import os
import time
import sys
import glob
from pathlib import Path
import logging
from datetime import datetime, timedelta
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mcp/bridge/status_monitor.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("status_monitor")

# Paths
MCP_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULTS_DIR = MCP_DIR / "results"
QUEUE = MCP_DIR / "dispatch_queue.json"

def get_task_status():
    """Get the status of all tasks."""
    tasks = {
        "active": [],
        "completed": [],
        "failed": [],
        "queue": None
    }
    
    # Check queue
    if QUEUE.exists():
        try:
            with QUEUE.open('r') as f:
                queue_task = json.load(f)
            tasks["queue"] = queue_task
        except Exception as e:
            logger.error(f"Error reading queue: {e}")
    
    # Check status files
    status_files = list(RESULTS_DIR.glob("*_status.json"))
    for status_file in status_files:
        try:
            with status_file.open('r') as f:
                status = json.load(f)
            
            task_status = status.get("status", "unknown")
            task_id = status.get("task_id", status_file.stem.replace("_status", ""))
            
            if task_status == "processing":
                # Check if the task has a result file
                result_file = RESULTS_DIR / f"{task_id}.json"
                if result_file.exists():
                    task_status = "completed"
                    status["status"] = "completed"
                    # Update status file
                    with status_file.open('w') as f:
                        json.dump(status, f)
                else:
                    # Check if the task is stuck (more than 30 minutes)
                    start_time = datetime.fromisoformat(status.get("start_time", datetime.now().isoformat()))
                    if datetime.now() - start_time > timedelta(minutes=30):
                        status["status"] = "stuck"
                        task_status = "stuck"
                        # Update status file
                        with status_file.open('w') as f:
                            json.dump(status, f)
            
            if task_status == "processing" or task_status == "stuck":
                tasks["active"].append(status)
            elif task_status == "completed":
                tasks["completed"].append(status)
            elif task_status == "failed":
                tasks["failed"].append(status)
        
        except Exception as e:
            logger.error(f"Error processing status file {status_file}: {e}")
    
    return tasks

def display_status(tasks, show_completed=True, show_failed=True):
    """Display the status of tasks."""
    print("\n" + "="*80)
    print(f"MCP STATUS MONITOR - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # Queue
    if tasks["queue"]:
        print("\nQUEUE:")
        print(f"  Task ID: {tasks['queue'].get('id')}")
        print(f"  Type: {tasks['queue'].get('type')}")
        print(f"  Params: {tasks['queue'].get('params', {})}")
    else:
        print("\nQUEUE: Empty")
    
    # Active tasks
    print("\nACTIVE TASKS:")
    if tasks["active"]:
        for task in tasks["active"]:
            task_id = task.get("task_id", "Unknown")
            task_type = task.get("task_type", "Unknown")
            start_time = datetime.fromisoformat(task.get("start_time", datetime.now().isoformat()))
            duration = datetime.now() - start_time
            status = task.get("status", "Unknown")
            print(f"  Task ID: {task_id}")
            print(f"  Type: {task_type}")
            print(f"  Status: {status}")
            print(f"  Running for: {duration.total_seconds():.2f}s")
            print("  " + "-"*40)
    else:
        print("  No active tasks")
    
    # Completed tasks
    if show_completed:
        print("\nCOMPLETED TASKS:")
        if tasks["completed"]:
            for task in sorted(tasks["completed"], 
                              key=lambda x: datetime.fromisoformat(x.get("completion_time", "2000-01-01T00:00:00")), 
                              reverse=True)[:5]:  # Show last 5
                task_id = task.get("task_id", "Unknown")
                task_type = task.get("task_type", "Unknown")
                execution_time = task.get("execution_time", 0)
                completion_time = task.get("completion_time", "Unknown")
                print(f"  Task ID: {task_id}")
                print(f"  Type: {task_type}")
                print(f"  Execution time: {execution_time:.2f}s")
                print(f"  Completed at: {completion_time}")
                print("  " + "-"*40)
        else:
            print("  No completed tasks")
    
    # Failed tasks
    if show_failed:
        print("\nFAILED TASKS:")
        if tasks["failed"]:
            for task in sorted(tasks["failed"], 
                              key=lambda x: datetime.fromisoformat(x.get("time", "2000-01-01T00:00:00")), 
                              reverse=True)[:5]:  # Show last 5
                task_id = task.get("task_id", "Unknown")
                task_type = task.get("task_type", "Unknown")
                error = task.get("error", "Unknown error")
                time_str = task.get("time", "Unknown")
                print(f"  Task ID: {task_id}")
                print(f"  Type: {task_type}")
                print(f"  Error: {error}")
                print(f"  Time: {time_str}")
                print("  " + "-"*40)
        else:
            print("  No failed tasks")
    
    print("\n" + "="*80)

def cleanup_old_tasks(days=7):
    """Clean up old task files."""
    cutoff_time = datetime.now() - timedelta(days=days)
    
    # Find all result and status files
    all_files = list(RESULTS_DIR.glob("*.json"))
    for file_path in all_files:
        try:
            # Get file modification time
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            # If the file is older than the cutoff, delete it
            if mtime < cutoff_time:
                file_path.unlink()
                logger.info(f"Deleted old file: {file_path}")
        
        except Exception as e:
            logger.error(f"Error cleaning up file {file_path}: {e}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="MCP Status Monitor")
    parser.add_argument("--watch", action="store_true", help="Watch mode (continuous updates)")
    parser.add_argument("--interval", type=int, default=5, help="Update interval in seconds (default: 5)")
    parser.add_argument("--no-completed", action="store_true", help="Don't show completed tasks")
    parser.add_argument("--no-failed", action="store_true", help="Don't show failed tasks")
    parser.add_argument("--cleanup", action="store_true", help="Clean up old task files")
    parser.add_argument("--cleanup-days", type=int, default=7, help="Days to keep task files (default: 7)")
    
    args = parser.parse_args()
    
    if args.cleanup:
        cleanup_old_tasks(days=args.cleanup_days)
        return
    
    try:
        if args.watch:
            logger.info("Starting watch mode...")
            while True:
                tasks = get_task_status()
                os.system('cls' if os.name == 'nt' else 'clear')
                display_status(tasks, not args.no_completed, not args.no_failed)
                time.sleep(args.interval)
        else:
            tasks = get_task_status()
            display_status(tasks, not args.no_completed, not args.no_failed)
    
    except KeyboardInterrupt:
        logger.info("Status monitor stopped by user")
    except Exception as e:
        logger.error(f"Status monitor error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()