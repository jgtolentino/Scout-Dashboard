#!/usr/bin/env python3
# claude_pulser_bridge.py - Compatibility layer between Claude Code and Pulser
#
# This script provides two-way command and context compatibility between
# Claude Code CLI and Pulser Shell, allowing them to share a unified environment

import os
import sys
import json
import argparse
import re
from pathlib import Path
import shutil
import tempfile

# ANSI color codes for pretty output
COLORS = {
    'red': '\033[31m',
    'green': '\033[32m',
    'yellow': '\033[33m',
    'blue': '\033[34m',
    'magenta': '\033[35m',
    'cyan': '\033[36m',
    'bold': '\033[1m',
    'reset': '\033[0m'
}

def colored(text, color):
    """Add color to text for terminal output"""
    return f"{COLORS.get(color, '')}{text}{COLORS['reset']}"

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description='Claude-Pulser Bridge for shared context')
    parser.add_argument('--mode', choices=['pulser-to-claude', 'claude-to-pulser'], 
                        required=True, help='Direction of conversion')
    parser.add_argument('--input', type=str, help='Input file or text')
    parser.add_argument('--output', type=str, help='Output file (if not specified, prints to stdout)')
    parser.add_argument('--shared-memory', type=str, help='Path to shared memory file')
    parser.add_argument('--config', type=str, help='Path to config file')
    
    return parser.parse_args()

def read_input(input_arg):
    """Read input from file or use the provided text"""
    if input_arg and os.path.isfile(input_arg):
        with open(input_arg, 'r') as f:
            return f.read()
    return input_arg or sys.stdin.read()

def write_output(content, output_arg):
    """Write output to file or print to stdout"""
    if output_arg:
        with open(output_arg, 'w') as f:
            f.write(content)
    else:
        print(content)

def convert_pulser_to_claude(content, shared_memory=None):
    """Convert Pulser commands and formatting to Claude Code CLI format"""
    # Replace Pulser :command with Claude /command
    content = re.sub(r'(:)(\w+)', r'/\2', content)
    
    # Handle special command cases
    content = content.replace('/help', '/help')  # already compatible
    content = content.replace('/think-harder', '/think-harder')  # already compatible
    
    # Convert file references - Pulser :read file.txt to Claude @file.txt
    content = re.sub(r':read\s+([^\s]+)', r'@\1', content)
    
    # If shared memory file is provided, append content
    if shared_memory and os.path.isfile(shared_memory):
        with open(shared_memory, 'a') as f:
            f.write(f"\n[Pulser Session Entry]\n{content}\n")
    
    return content

def convert_claude_to_pulser(content, shared_memory=None):
    """Convert Claude Code CLI commands and formatting to Pulser format"""
    # Replace Claude /command with Pulser :command
    content = re.sub(r'(/)(\w+)', r':\2', content)
    
    # Handle special command cases
    content = content.replace(':help', ':help')  # already compatible
    content = content.replace(':think-harder', ':think-harder')  # already compatible
    
    # Convert file references - Claude @file.txt to Pulser :read file.txt
    content = re.sub(r'@([^\s]+)', r':read \1', content)
    
    # If shared memory file is provided, append content
    if shared_memory and os.path.isfile(shared_memory):
        with open(shared_memory, 'a') as f:
            f.write(f"\n[Claude Code Session Entry]\n{content}\n")
    
    return content

def convert_function_calls(content):
    """Convert Claude function call format to Pulser commands"""
    # Pattern to match Claude function calls
    pattern = r'<(antml:)?function_calls>.*?</(antml:)?function_calls>'
    
    def replace_function(match):
        # Extract function call content
        call_text = match.group(0)
        
        # Extract tool name and parameters
        tool_match = re.search(r'name="(\w+)"', call_text)
        if not tool_match:
            return call_text
        
        tool_name = tool_match.group(1)
        
        # Convert to Pulser command format
        if tool_name == 'Bash':
            # Extract command parameter
            cmd_match = re.search(r'<(antml:)?parameter name="command">(.+?)</(antml:)?parameter>', call_text, re.DOTALL)
            if cmd_match:
                command = cmd_match.group(2).strip()
                return f":bash {command}"
        
        return f":tool {tool_name}"
    
    # Replace all function calls
    return re.sub(pattern, replace_function, content, flags=re.DOTALL)

def main():
    """Main function to bridge Claude and Pulser environments"""
    args = parse_arguments()
    
    try:
        # Read input content
        content = read_input(args.input)
        
        # Process based on mode
        if args.mode == 'pulser-to-claude':
            processed_content = convert_pulser_to_claude(content, args.shared_memory)
        else:  # claude-to-pulser
            processed_content = convert_claude_to_pulser(content, args.shared_memory)
            # Also convert function calls if present
            processed_content = convert_function_calls(processed_content)
        
        # Write output
        write_output(processed_content, args.output)
        
        # Report success
        if args.output:
            print(colored(f"Successfully converted content to {args.mode.split('-')[2]} format", "green"))
        
    except Exception as e:
        print(colored(f"Error: {str(e)}", "red"), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()