#!/usr/bin/env python3
"""
Python code executor for PulseDev
Provides a standardized interface for executing code in various languages
"""

import os
import sys
import json
import time
import tempfile
import subprocess
import signal
import uuid
import traceback
from pathlib import Path

# Configuration
WORKSPACE_DIR = os.environ.get('WORKSPACE_DIR', '/home/pulsedev/workspace')
MAX_OUTPUT_SIZE = int(os.environ.get('MAX_OUTPUT_SIZE', 1024 * 1024))  # 1MB
DEFAULT_TIMEOUT = int(os.environ.get('TIMEOUT', 30))  # 30 seconds

# Ensure workspace directory exists
Path(WORKSPACE_DIR).mkdir(parents=True, exist_ok=True)

def execute_code(language, code, timeout=DEFAULT_TIMEOUT):
    """Execute code in the specified language and return the result"""
    print(f"Executing {language} code (timeout: {timeout}s)")
    
    # Map language to command and file extension
    language_map = {
        'python': ('python3', 'py'),
        'py': ('python3', 'py'),
        'javascript': ('node', 'js'),
        'js': ('node', 'js'),
        'typescript': ('npx ts-node', 'ts'),
        'ts': ('npx ts-node', 'ts'),
        'bash': ('bash', 'sh'),
        'sh': ('bash', 'sh'),
    }
    
    if language.lower() not in language_map:
        return {
            'success': False,
            'error': f"Unsupported language: {language}",
            'output': '',
            'execution_time': 0
        }
    
    command, extension = language_map[language.lower()]
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(suffix=f'.{extension}', delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(code.encode('utf-8'))
    
    # Make shell scripts executable
    if extension == 'sh':
        os.chmod(temp_path, 0o755)
    
    # Execute with timeout
    start_time = time.time()
    result = {
        'success': False,
        'error': None,
        'output': '',
        'execution_time': 0
    }
    
    try:
        # Execute with timeout
        process = subprocess.Popen(
            f"timeout {timeout}s {command} {temp_path}",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        output, _ = process.communicate()
        
        if process.returncode == 124:  # timeout exit code
            result['success'] = False
            result['error'] = f"Execution timed out after {timeout} seconds"
        elif process.returncode != 0:
            result['success'] = False
            result['error'] = f"Execution failed with exit code {process.returncode}"
            result['output'] = output
        else:
            result['success'] = True
            result['output'] = output
    
    except Exception as e:
        result['success'] = False
        result['error'] = str(e)
        result['output'] = traceback.format_exc()
    
    finally:
        # Calculate execution time
        result['execution_time'] = time.time() - start_time
        
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except Exception as e:
            print(f"Failed to remove temp file {temp_path}: {e}")
    
    return result

def execute_file(file_path, timeout=DEFAULT_TIMEOUT):
    """Execute a file from the workspace"""
    print(f"Executing file: {file_path} (timeout: {timeout}s)")
    
    # Resolve path
    full_path = os.path.abspath(os.path.join(WORKSPACE_DIR, file_path))
    
    # Verify path is within workspace for security
    if not full_path.startswith(WORKSPACE_DIR):
        return {
            'success': False,
            'error': 'Security error: Attempted to access file outside workspace',
            'output': '',
            'execution_time': 0,
            'file_name': file_path
        }
    
    # Check if file exists
    if not os.path.exists(full_path):
        return {
            'success': False,
            'error': f"File not found: {file_path}",
            'output': '',
            'execution_time': 0,
            'file_name': file_path
        }
    
    # Determine language from extension
    extension = os.path.splitext(full_path)[1].lower()[1:]
    
    command_map = {
        'py': 'python3',
        'js': 'node',
        'ts': 'npx ts-node',
        'sh': 'bash',
    }
    
    if extension not in command_map:
        return {
            'success': False,
            'error': f"Unsupported file type: {extension}",
            'output': '',
            'execution_time': 0,
            'file_name': file_path
        }
    
    command = command_map[extension]
    
    # Execute with timeout
    start_time = time.time()
    result = {
        'success': False,
        'error': None,
        'output': '',
        'execution_time': 0,
        'file_name': file_path
    }
    
    try:
        # Execute with timeout
        process = subprocess.Popen(
            f"timeout {timeout}s {command} {full_path}",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        output, _ = process.communicate()
        
        if process.returncode == 124:  # timeout exit code
            result['success'] = False
            result['error'] = f"Execution timed out after {timeout} seconds"
        elif process.returncode != 0:
            result['success'] = False
            result['error'] = f"Execution failed with exit code {process.returncode}"
            result['output'] = output
        else:
            result['success'] = True
            result['output'] = output
    
    except Exception as e:
        result['success'] = False
        result['error'] = str(e)
        result['output'] = traceback.format_exc()
    
    finally:
        # Calculate execution time
        result['execution_time'] = time.time() - start_time
    
    return result

def main():
    """Main entry point"""
    if len(sys.argv) >= 3:
        command = sys.argv[1]
        
        if command == 'exec-code':
            language = sys.argv[2]
            code = sys.stdin.read()  # Read from stdin
            timeout = int(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_TIMEOUT
            
            result = execute_code(language, code, timeout)
            print(json.dumps(result, indent=2))
        
        elif command == 'exec-file':
            file_path = sys.argv[2]
            timeout = int(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_TIMEOUT
            
            result = execute_file(file_path, timeout)
            print(json.dumps(result, indent=2))
        
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
    
    else:
        print("Python executor for PulseDev")
        print("Usage:")
        print("  python executor.py exec-code <language> [timeout] < code.py")
        print("  python executor.py exec-file <filepath> [timeout]")

if __name__ == "__main__":
    main()