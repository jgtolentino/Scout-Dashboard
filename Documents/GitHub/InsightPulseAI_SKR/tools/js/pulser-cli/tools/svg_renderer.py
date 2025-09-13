#!/usr/bin/env python3
"""
SVG Renderer for Claude adapter.
Converts text descriptions or Mermaid/DOT syntax into SVG diagrams.
"""

import sys
import os
import argparse
import subprocess
import json
import tempfile
from datetime import datetime

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="SVG Diagram Renderer")
    parser.add_argument("--input", help="Input file path or string (if --text is used)")
    parser.add_argument("--output", help="Output SVG file path")
    parser.add_argument("--format", choices=['mermaid', 'dot', 'plantuml', 'text'], 
                        default='mermaid', help="Input format")
    parser.add_argument("--text", action='store_true', 
                        help="Treat input as raw text rather than a file path")
    return parser.parse_args()

def log(message, log_file="claude_session.log"):
    """Log message to session log file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"[{timestamp}] [SVG Renderer] {message}\n")

def render_mermaid(input_text, output_path):
    """Render Mermaid diagram to SVG."""
    # Create temporary file for Mermaid content
    with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as temp:
        temp.write(input_text)
        temp_path = temp.name
    
    try:
        # Check if mmdc (Mermaid CLI) is installed
        try:
            subprocess.run(["which", "mmdc"], check=True, capture_output=True)
        except subprocess.CalledProcessError:
            log("Mermaid CLI not found. Using alternative renderer.")
            # Fallback to npx
            result = subprocess.run(
                ["npx", "@mermaid-js/mermaid-cli", temp_path, "-o", output_path],
                check=True, capture_output=True, text=True
            )
            log(f"Rendered with npx: {result.stdout}")
            return True
        
        # Use mmdc directly if available
        result = subprocess.run(
            ["mmdc", "-i", temp_path, "-o", output_path],
            check=True, capture_output=True, text=True
        )
        log(f"Rendered with mmdc: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        log(f"Error rendering Mermaid: {e}")
        print(f"Error rendering Mermaid: {e}", file=sys.stderr)
        return False
    finally:
        os.unlink(temp_path)

def render_dot(input_text, output_path):
    """Render Graphviz DOT diagram to SVG."""
    # Create temporary file for DOT content
    with tempfile.NamedTemporaryFile(mode='w', suffix='.dot', delete=False) as temp:
        temp.write(input_text)
        temp_path = temp.name
    
    try:
        result = subprocess.run(
            ["dot", "-Tsvg", "-o", output_path, temp_path],
            check=True, capture_output=True, text=True
        )
        log(f"Rendered DOT: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        log(f"Error rendering DOT: {e}")
        print(f"Error rendering DOT: {e}", file=sys.stderr)
        return False
    finally:
        os.unlink(temp_path)

def render_plantuml(input_text, output_path):
    """Render PlantUML diagram to SVG."""
    # Create temporary file for PlantUML content
    with tempfile.NamedTemporaryFile(mode='w', suffix='.puml', delete=False) as temp:
        temp.write(input_text)
        temp_path = temp.name
    
    try:
        result = subprocess.run(
            ["plantuml", "-tsvg", temp_path],
            check=True, capture_output=True, text=True
        )
        
        # PlantUML outputs to original path with .svg extension
        plantuml_output = temp_path + ".svg"
        if os.path.exists(plantuml_output):
            # Move to desired output path
            subprocess.run(["mv", plantuml_output, output_path], check=True)
            
        log(f"Rendered PlantUML: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        log(f"Error rendering PlantUML: {e}")
        print(f"Error rendering PlantUML: {e}", file=sys.stderr)
        return False
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def render_from_text(input_text, output_path):
    """Render diagram from text description using Claude."""
    try:
        # Create temporary file with prompt for Claude
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp:
            temp.write(f"""Create an SVG diagram based on this description:

{input_text}

Generate just the SVG code without any explanation or markdown.
The SVG should be valid, self-contained, and ready to save directly to a file.
""")
            prompt_path = temp.name
        
        # Here we'd normally call Claude API directly
        # For now, we'll use a placeholder reminder
        log("Text-to-SVG would require Claude API integration")
        print("NOTE: Text-to-SVG rendering requires Claude API integration.")
        print("This is a placeholder for the actual implementation.")
        
        # For demo purposes, create a very simple SVG
        with open(output_path, 'w') as f:
            f.write(f"""<svg width="500" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle">
    Diagram from: {input_text[:50]}...
  </text>
</svg>""")
        
        return True
    except Exception as e:
        log(f"Error in text-to-SVG: {e}")
        print(f"Error in text-to-SVG: {e}", file=sys.stderr)
        return False
    finally:
        if os.path.exists(prompt_path):
            os.unlink(prompt_path)

def main():
    """Main function."""
    args = parse_arguments()
    
    # Set default output path if not specified
    if not args.output:
        args.output = "diagram_output.svg"
    
    # Get input content
    if args.text:
        # Input is direct text
        input_content = args.input
    else:
        # Input is a file path
        if not args.input or not os.path.exists(args.input):
            print(f"Error: Input file {args.input} does not exist", file=sys.stderr)
            return 1
            
        with open(args.input, 'r') as f:
            input_content = f.read()
    
    # Log start of rendering
    log(f"Rendering {args.format} diagram to {args.output}")
    
    # Render based on format
    success = False
    if args.format == 'mermaid':
        success = render_mermaid(input_content, args.output)
    elif args.format == 'dot':
        success = render_dot(input_content, args.output)
    elif args.format == 'plantuml':
        success = render_plantuml(input_content, args.output)
    elif args.format == 'text':
        success = render_from_text(input_content, args.output)
    
    # Log completion
    if success:
        log(f"Successfully rendered to {args.output}")
        print(f"SVG diagram saved to: {args.output}")
        return 0
    else:
        log(f"Failed to render diagram")
        return 1

if __name__ == "__main__":
    sys.exit(main())