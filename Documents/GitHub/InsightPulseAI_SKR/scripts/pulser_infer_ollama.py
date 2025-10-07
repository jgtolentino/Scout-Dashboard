#!/usr/bin/env python3
"""
pulser_infer_ollama.py - Connect Pulser to local Ollama LLM inference

This script provides a simple connector to use local Ollama models with Pulser,
optimized for Apple Silicon (M1-M3) Macs.
"""

import os
import sys
import json
import requests
import argparse
import subprocess
from pathlib import Path
from rich.console import Console
from rich.markdown import Markdown

# Version matching Pulser version
VERSION = "1.1.0"

# Default configuration
DEFAULT_MODEL = "mistral"  # Pinned as the default
PREFERRED_MODELS = ["mistral", "mistral:latest", "mistral:7b", "llama2", "codellama", "tinyllama"]
OLLAMA_API_URL = "http://127.0.0.1:11434/api"
DEBUG = False  # Set to True to enable debug output
DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant."

# Setup rich console for pretty output
console = Console()

def check_ollama_running():
    """Check if Ollama is running by pinging the API endpoint"""
    if DEBUG:
        console.print("[blue]Checking if Ollama is running...[/blue]")
    
    # Try direct API check first since that's what matters
    try:
        response = requests.get(f"{OLLAMA_API_URL}/tags", timeout=5)
        if response.status_code == 200:
            if DEBUG:
                console.print("[green]Ollama API is responding[/green]")
            return True
        else:
            if DEBUG:
                console.print(f"[yellow]API responded with status code {response.status_code}[/yellow]")
            return False
    except Exception as e:
        if DEBUG:
            console.print(f"[yellow]API check failed: {str(e)}[/yellow]")
        
        # Fallback to process check
        try:
            import subprocess
            result = subprocess.run(["pgrep", "ollama"], capture_output=True, text=True)
            is_running = result.returncode == 0
            if DEBUG:
                if is_running:
                    console.print("[yellow]Ollama process is running but API isn't responding[/yellow]")
                else:
                    console.print("[yellow]Ollama process is not running[/yellow]")
            return is_running  # Return True if process is running, even if API isn't responding yet
        except Exception as e:
            if DEBUG:
                console.print(f"[yellow]Process check failed: {str(e)}[/yellow]")
            return False

def start_ollama():
    """Attempt to start Ollama if it's not running"""
    console.print("[yellow]Ollama is not running. Attempting to start it...[/yellow]")
    try:
        # Start Ollama in the background
        subprocess.Popen(["ollama", "serve"], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        
        # Wait longer for Ollama to start fully
        import time
        for i in range(6):  # Try for up to 6 seconds
            time.sleep(1)
            if check_ollama_running():
                console.print("[green]Ollama started successfully![/green]")
                # Give it an extra second to fully initialize
                time.sleep(1)
                return True
        
        console.print("[red]Failed to start Ollama automatically.[/red]")
        return False
    except FileNotFoundError:
        console.print("[red]Ollama command not found. Please ensure Ollama is installed.[/red]")
        console.print("[yellow]Install with: brew install ollama[/yellow]")
        return False

def list_available_models():
    """List all available models in Ollama"""
    try:
        response = requests.get(f"{OLLAMA_API_URL}/tags")
        if response.status_code == 200:
            models = response.json().get("models", [])
            return [model["name"] for model in models]
        return []
    except requests.RequestException:
        return []

def ensure_preferred_model():
    """Make sure at least one of our preferred models is available"""
    available_models = list_available_models()
    
    # Check if any of our preferred models is available
    for model in PREFERRED_MODELS:
        if model in available_models:
            return model
    
    # If we reach here, none of our preferred models are available
    # Pull the default model
    console.print(f"[yellow]No preferred models available. Pulling {DEFAULT_MODEL}...[/yellow]")
    try:
        subprocess.run(["ollama", "pull", DEFAULT_MODEL], check=True)
        return DEFAULT_MODEL
    except subprocess.CalledProcessError:
        console.print(f"[red]Failed to pull {DEFAULT_MODEL}. Using first available model instead.[/red]")
        if available_models:
            return available_models[0]
        else:
            console.print("[red]No models available and failed to pull one.[/red]")
            return None

def run_ollama(prompt, model=DEFAULT_MODEL, system=DEFAULT_SYSTEM_PROMPT, stream=False):
    """Run inference using Ollama API"""
    
    # First check if Ollama is running
    if not check_ollama_running():
        if not start_ollama():
            console.print("[red]Error: Ollama is not running. Please start it with 'ollama serve'[/red]")
            sys.exit(1)
    
    # Check if model is available locally
    available_models = list_available_models()
    
    # Create a model cache file to track already downloaded models
    cache_dir = os.path.expanduser("~/.pulser/cache")
    os.makedirs(cache_dir, exist_ok=True)
    model_cache_file = os.path.join(cache_dir, "model_cache.txt")
    
    # Check if we've previously downloaded this model
    model_previously_pulled = False
    if os.path.exists(model_cache_file):
        with open(model_cache_file, "r") as f:
            cached_models = [line.strip() for line in f.readlines()]
            model_previously_pulled = model in cached_models
    
    if model not in available_models:
        # Don't show "not found" message if we know we've pulled it before
        if not model_previously_pulled:
            console.print(f"[yellow]Model '{model}' not found locally.[/yellow]")
            console.print(f"[yellow]Attempting to pull '{model}'...[/yellow]")
        else:
            console.print(f"[blue]Reloading model '{model}'...[/blue]")
        
        try:
            subprocess.run(["ollama", "pull", model], check=True)
            
            # Add to our cache file if not already there
            if not model_previously_pulled:
                with open(model_cache_file, "a") as f:
                    f.write(f"{model}\n")
                
            console.print(f"[green]Successfully pulled '{model}'[/green]")
        except subprocess.CalledProcessError:
            console.print(f"[red]Failed to pull '{model}'.[/red]")
            
            # If the requested model couldn't be pulled, ensure we have at least one preferred model
            alternative_model = ensure_preferred_model()
            if alternative_model:
                model = alternative_model
                console.print(f"[yellow]Using '{model}' instead.[/yellow]")
            else:
                console.print("[red]No models available. Please pull a model manually with 'ollama pull mistral'[/red]")
                sys.exit(1)
    
    # Prepare the request
    request_data = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 1024
        }
    }
    
    # Add system prompt if provided
    if system:
        request_data["system"] = system
    
    if stream:
        # Streaming implementation
        console.print(f"[blue]Model: {model}[/blue]")
        console.print(f"[blue]Prompt: {prompt}[/blue]\n")
        console.print("[green]Response:[/green]")
        
        full_response = ""
        try:
            response = requests.post(
                f"{OLLAMA_API_URL}/generate", 
                json=request_data,
                stream=True
            )
            
            for line in response.iter_lines():
                if line:
                    json_chunk = json.loads(line)
                    chunk = json_chunk.get('response', '')
                    print(chunk, end='', flush=True)
                    full_response += chunk
                    
                    if json_chunk.get('done', False):
                        print()  # Newline at the end
                        break
                        
            return full_response
            
        except requests.RequestException as e:
            console.print(f"[red]Error during API call: {str(e)}[/red]")
            return ""
    else:
        # Non-streaming implementation
        try:
            response = requests.post(f"{OLLAMA_API_URL}/generate", json=request_data)
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                console.print(f"[red]Error: API returned status code {response.status_code}[/red]")
                console.print(f"[red]{response.text}[/red]")
                return ""
        except requests.RequestException as e:
            console.print(f"[red]Error during API call: {str(e)}[/red]")
            return ""

def ensure_mistral_available():
    """Ensure Mistral model is available, with user-friendly messages"""
    available_models = list_available_models()
    
    # Check if Mistral is already available
    if DEFAULT_MODEL in available_models or f"{DEFAULT_MODEL}:latest" in available_models:
        return True
        
    console.print(f"[yellow]Mistral model not found. Would you like to download it? (y/N)[/yellow]")
    
    # Wait for user input with a timeout
    import select
    import sys
    
    # Check if input is available within 5 seconds
    i, o, e = select.select([sys.stdin], [], [], 5)
    
    if i:
        user_input = sys.stdin.readline().strip().lower()
        if user_input == 'y' or user_input == 'yes':
            console.print(f"[blue]Downloading Mistral model...[/blue]")
            try:
                subprocess.run(["ollama", "pull", DEFAULT_MODEL], check=True)
                console.print(f"[green]Successfully downloaded Mistral model.[/green]")
                return True
            except subprocess.CalledProcessError:
                console.print(f"[red]Failed to download Mistral model.[/red]")
                return False
    else:
        # Timeout occurred, auto-download
        console.print(f"[blue]Automatically downloading Mistral model...[/blue]")
        try:
            subprocess.run(["ollama", "pull", DEFAULT_MODEL], check=True)
            console.print(f"[green]Successfully downloaded Mistral model.[/green]")
            return True
        except subprocess.CalledProcessError:
            console.print(f"[red]Failed to download Mistral model.[/red]")
            return False
    
    return False

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run Pulser inference using local Ollama models")
    parser.add_argument("prompt", nargs="?", help="The prompt to send to Ollama")
    parser.add_argument("--model", "-m", default=os.environ.get("PULSER_MODEL", DEFAULT_MODEL),
                        help=f"Ollama model to use (default: {DEFAULT_MODEL})")
    parser.add_argument("--system", "-s", default=DEFAULT_SYSTEM_PROMPT,
                        help="System prompt to use")
    parser.add_argument("--stream", "-t", action="store_true", 
                        help="Stream the response in real-time")
    parser.add_argument("--file", "-f", help="Read prompt from a file")
    parser.add_argument("--list-models", "-l", action="store_true",
                        help="List available models and exit")
    parser.add_argument("--version", "-v", action="store_true",
                        help="Show version information")
    parser.add_argument("--ensure-mistral", "-e", action="store_true",
                        help="Ensure Mistral model is available")
    
    args = parser.parse_args()
    
    # Handle ensure-mistral flag
    if args.ensure_mistral:
        if check_ollama_running():
            ensure_mistral_available()
        else:
            console.print("[red]Ollama is not running. Please start it first with 'ollama serve'[/red]")
        sys.exit(0)
    
    # Show version and exit
    if args.version:
        console.print(f"[blue]Pulser Ollama Connector v{VERSION}[/blue]")
        sys.exit(0)
    
    # Check if Ollama is installed
    try:
        result = subprocess.run(["which", "ollama"], capture_output=True, text=True)
        if result.returncode != 0:
            console.print("[red]Error: Ollama not found. Please install it first:[/red]")
            console.print("[yellow]brew install ollama[/yellow]")
            sys.exit(1)
    except FileNotFoundError:
        console.print("[red]Error: Command 'which' not found. Cannot check for Ollama.[/red]")
    
    # List available models and exit
    if args.list_models:
        if not check_ollama_running():
            if not start_ollama():
                console.print("[red]Error: Ollama is not running and couldn't be started.[/red]")
                sys.exit(1)
        
        models = list_available_models()
        if models:
            console.print("[blue]Available Ollama models:[/blue]")
            for model in models:
                console.print(f"  • {model}")
        else:
            console.print("[yellow]No models available. Pull one with:[/yellow]")
            console.print("[yellow]ollama pull mistral[/yellow]")
        sys.exit(0)
    
    # Get prompt from file if specified
    if args.file:
        try:
            with open(args.file, 'r') as f:
                prompt = f.read().strip()
        except Exception as e:
            console.print(f"[red]Error reading file: {str(e)}[/red]")
            sys.exit(1)
    elif args.prompt:
        prompt = args.prompt
    else:
        # If no prompt provided, enter interactive mode
        console.print("[blue]Pulser Ollama Connector v{VERSION}[/blue]")
        console.print("[blue]Interactive mode. Type 'exit' to quit.[/blue]")
        console.print(f"[blue]Using model: {args.model}[/blue]\n")
        
        while True:
            try:
                user_input = input("> ")
                if user_input.lower() in ("exit", "quit", "q"):
                    break
                
                if not user_input.strip():
                    continue
                
                response = run_ollama(user_input, args.model, args.system, args.stream)
                
                # Only print response if not streaming (for streaming it's already printed)
                if not args.stream and response:
                    console.print("\n[green]Response:[/green]")
                    console.print(Markdown(response))
                    print()
                    
            except KeyboardInterrupt:
                console.print("\n[blue]Exiting...[/blue]")
                break
            except EOFError:
                console.print("\n[blue]Exiting...[/blue]")
                break
        
        sys.exit(0)
    
    # Run inference
    response = run_ollama(prompt, args.model, args.system, args.stream)
    
    # Print response if not streaming (for streaming it's already printed)
    if not args.stream and response:
        console.print("\n[green]Response:[/green]")
        console.print(Markdown(response))

if __name__ == "__main__":
    main()