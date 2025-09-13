#!/usr/bin/env python3
"""
Claude-Pulser Patcher

This script patches Pulser's shell enhancement script to add full Claude Code compatibility
including command prefixes, tool invocation format, thinking mode, and context handling.
"""

import os
import sys
import re
import shutil
import argparse
from pathlib import Path

# ANSI colors
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RED = "\033[31m"
BOLD = "\033[1m"
RESET = "\033[0m"

class ClaudePulserPatcher:
    def __init__(self):
        self.home_dir = Path.home()
        self.pulser_dir = self.home_dir / ".pulser"
        self.claude_config = self.home_dir / ".claude.json"
        
        # Create required directories
        self.pulser_dir.mkdir(exist_ok=True)
        (self.pulser_dir / "plugins").mkdir(exist_ok=True)
        (self.pulser_dir / "patches").mkdir(exist_ok=True)
        
        # Paths to Pulser files
        self.pulser_shell_path = None
        self.pulser_aliases_path = None
        
    def locate_pulser_files(self):
        """Locate Pulser's shell enhancement script and aliases"""
        print(f"{BLUE}Locating Pulser files...{RESET}")
        
        # Try standard locations
        potential_shell_paths = [
            Path("/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/brand_mentions_fix/pulser_shell_enhancement.py"),
            Path("/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/pulser_shell_enhanced.sh")
        ]
        
        for path in potential_shell_paths:
            if path.exists():
                self.pulser_shell_path = path
                print(f"{GREEN}✓ Found shell enhancement at: {path}{RESET}")
                break
                
        # Try to find aliases
        potential_aliases_paths = [
            Path("/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/pulser_aliases.sh")
        ]
        
        for path in potential_aliases_paths:
            if path.exists():
                self.pulser_aliases_path = path
                print(f"{GREEN}✓ Found aliases at: {path}{RESET}")
                break
                
        # Verify we found the files
        if not self.pulser_shell_path:
            print(f"{RED}× Could not find Pulser shell enhancement script{RESET}")
            return False
            
        if not self.pulser_aliases_path:
            print(f"{YELLOW}⚠️ Could not find Pulser aliases, some features won't be available{RESET}")
            
        return True
            
    def backup_files(self):
        """Create backups of the files we'll modify"""
        print(f"{BLUE}Creating backups...{RESET}")
        
        if self.pulser_shell_path:
            backup_path = self.pulser_shell_path.with_suffix(f"{self.pulser_shell_path.suffix}.bak")
            shutil.copy2(self.pulser_shell_path, backup_path)
            print(f"{GREEN}✓ Backed up shell script to: {backup_path}{RESET}")
            
        if self.pulser_aliases_path:
            backup_path = self.pulser_aliases_path.with_suffix(f"{self.pulser_aliases_path.suffix}.bak")
            shutil.copy2(self.pulser_aliases_path, backup_path)
            print(f"{GREEN}✓ Backed up aliases to: {backup_path}{RESET}")
            
        return True
        
    def create_command_converter(self):
        """Create the command prefix converter plugin"""
        print(f"{BLUE}Creating command prefix converter...{RESET}")
        
        converter_path = self.pulser_dir / "plugins" / "command_converter.py"
        with open(converter_path, 'w') as f:
            f.write("""#!/usr/bin/env python3
\"\"\"
Command Converter for Pulser-Claude compatibility

Converts between Claude-style and Pulser-style commands
\"\"\"

import os
import re
import sys

class CommandConverter:
    def __init__(self):
        # Command mappings (Claude to Pulser)
        self.claude_to_pulser = {
            '/help': ':help',
            '/config': ':config',
            '/think': ':think',
            '/think-harder': ':think-harder',
            '/ultrathink': ':ultrathink',
            '/vim': ':vim-mode',
            '/memory': ':context',
            '/history': ':history'
        }
        
        # File reference pattern
        self.file_pattern = re.compile(r'@([^\\s]+)')
        
    def convert_command(self, command):
        \"\"\"Convert Claude-style commands to Pulser format\"\"\"
        # Handle empty input
        if not command:
            return command
            
        # Check for exact command match
        if command in self.claude_to_pulser:
            return self.claude_to_pulser[command]
            
        # Check for command with arguments
        if ' ' in command:
            parts = command.split(' ', 1)
            if parts[0] in self.claude_to_pulser:
                return f"{self.claude_to_pulser[parts[0]]} {parts[1]}"
                
        # Generic slash to colon conversion
        if command.startswith('/'):
            return ':' + command[1:]
            
        # Handle @file references
        if '@' in command:
            matches = self.file_pattern.findall(command)
            for file_path in matches:
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    command = command.replace(f'@{file_path}', f':read {file_path}')
                    
        return command

# Create singleton instance
converter = CommandConverter()
""")
        print(f"{GREEN}✓ Created command converter at: {converter_path}{RESET}")
        return True
        
    def create_function_call_converter(self):
        """Create the function call converter for Claude tool format"""
        print(f"{BLUE}Creating function call converter...{RESET}")
        
        converter_path = self.pulser_dir / "plugins" / "function_call_converter.py"
        with open(converter_path, 'w') as f:
            f.write("""#!/usr/bin/env python3
\"\"\"
Function Call Converter for Pulser-Claude compatibility

Converts Claude's function call format to Pulser commands
\"\"\"

import os
import re
import json
import sys
import subprocess

class FunctionCallConverter:
    def __init__(self):
        # Regular expressions for extracting function calls
        self.func_call_pattern = re.compile(r'<function_calls>(.*?)</function_calls>', re.DOTALL)
        self.invoke_pattern = re.compile(r'<invoke name="([^"]+)">(.*?)</invoke>', re.DOTALL)
        self.param_pattern = re.compile(r'<parameter name="([^"]+)">(.*?)