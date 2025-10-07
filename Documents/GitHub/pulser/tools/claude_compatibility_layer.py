#!/usr/bin/env python3
"""
Claude Code Compatibility Layer for Pulser

This script provides Claude Code command and function call compatibility for Pulser
while preserving Pulser's enhanced features.
"""

import sys
import re
import os
import json
import subprocess
import argparse

class ClaudeCompatibilityLayer:
    def __init__(self):
        # Maps Claude Code tools to Pulser commands
        self.tool_mapping = {
            "Bash": self._handle_bash,
            "Read": self._handle_read,
            "Write": self._handle_write,
            "Edit": self._handle_edit,
            "LS": self._handle_ls,
            "Glob": self._handle_glob,
            "Grep": self._handle_grep,
            "Task": self._handle_task
        }
        
        # Command mappings (/command to :command)
        self.command_mapping = {
            "/help": ":help",
            "/config": ":config",
            "/vim": ":vim-mode",
            "/think": ":think",
            "/think-harder": ":think-harder",
            "/ultrathink": ":ultrathink"
        }
        
        # Regular expressions
        self.func_call_pattern = re.compile(r'<function_calls>(.*?)