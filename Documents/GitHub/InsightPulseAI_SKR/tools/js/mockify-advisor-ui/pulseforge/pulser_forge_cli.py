#\!/usr/bin/env python3
"""
PulseForge CLI - Python-based CLI for Pulser integration

This module provides a CLI interface that integrates with the Pulser `:forge` command,
allowing users to generate full-stack applications from natural language prompts.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the orchestrator
from src.orchestrators.pulseforge_orchestrator import PulseForgeOrchestrator
from src.agents.tide.interface import GenerationRequest, GenerationResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='logs/pulseforge_cli.log',
    filemode='a'
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(levelname)s: %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)
logger = logging.getLogger(__name__)

# Base directory
BASE_DIR = Path(__file__).parent.absolute()


def parse_arguments() -> argparse.Namespace:
    """
    Parse command line arguments.
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description="PulseForge CLI - Generate full-stack applications from prompts")
    
    # Main arguments
    parser.add_argument("--prompt", type=str, help="Natural language prompt describing the application to generate")
    parser.add_argument("--stack", type=str, default="react-fastapi-postgres", 
                        help="Target tech stack (e.g., react-fastapi-postgres)")
    parser.add_argument("--auth-required", action="store_true", default=True,
                        help="Include authentication in the generated application")
    parser.add_argument("--no-auth", action="store_true", 
                        help="Exclude authentication from the generated application")
    parser.add_argument("--features", type=str, nargs="+", 
                        help="Additional features to include (e.g., admin dashboard)")
    parser.add_argument("--output-dir", type=str, default="./output",
                        help="Output directory for the generated application")
    parser.add_argument("--model", type=str, default="gpt-4-1106-preview",
                        help="LLM model to use for generation")
    parser.add_argument("--log-level", type=str, choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                        default="INFO", help="Logging level")
                        
    return parser.parse_args()


def main() -> int:
    """
    Main entry point for the CLI.
    
    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    # Parse arguments
    args = parse_arguments()
    
    # Set logging level
    logging.getLogger('').setLevel(getattr(logging, args.log_level))
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create orchestrator
    orchestrator = PulseForgeOrchestrator(output_dir=str(output_dir))
    
    # Handle authentication flag
    auth_required = args.auth_required and not args.no_auth
    
    # Check if prompt is provided
    if not args.prompt:
        print("Error: --prompt is required")
        return 1
    
    try:
        # Create generation request
        request = GenerationRequest(
            prompt=args.prompt,
            target_stack=args.stack,
            auth_required=auth_required,
            features=args.features or [],
            output_dir=str(output_dir),
            model_name=args.model
        )
        
        # Execute the request
        print(f"\n🚀 Generating app from prompt: \"{args.prompt}\"")
        print(f"⚙️  Using stack: {args.stack}")
        print(f"🔐 Authentication: {'Enabled' if auth_required else 'Disabled'}")
        if args.features:
            print(f"✨ Additional features: {', '.join(args.features)}")
        print(f"📂 Output directory: {output_dir}\n")
        
        # Run the request
        response = orchestrator.run(request)
        
        # Check for success
        if response.status == "success":
            print(f"\n✅ Generated App at: {response.codebase_path}")
            print(f"📋 Generated {len(response.specification.get('entities', []))} entities with {len(response.specification.get('relationships', []))} relationships")
            print(f"⏱️  Generation completed in {response.metadata.get('duration_seconds', 'N/A')} seconds")
            
            # Show next steps
            print("\n🚀 Next steps:")
            print(f"  1. cd {response.codebase_path}")
            print(f"  2. docker-compose up")
            print(f"  3. Open http://localhost:3000 in your browser")
            
            return 0
        else:
            print(f"\n❌ Error: {response.error}")
            return 1
            
    except Exception as e:
        logger.error(f"Error generating application: {e}", exc_info=True)
        print(f"\n❌ Error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
