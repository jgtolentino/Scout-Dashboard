#!/usr/bin/env python3
"""
Pulser CLI DeepSeek Integration Module
Enables seamless use of local DeepSeek models with existing Pulser/Codex commands
"""

import os
import sys
import json
import subprocess
import requests
from typing import Dict, Any, Optional, List
from pathlib import Path


class PulserDeepSeekIntegration:
    """Integrates DeepSeek local models with Pulser CLI"""
    
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.wrapper_url = "http://localhost:8080"
        self.config_path = Path.home() / ".pulser" / "deepseek_config.json"
        
    def check_ollama_status(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
            
    def start_ollama(self) -> bool:
        """Start Ollama service if not running"""
        if self.check_ollama_status():
            return True
            
        try:
            # Start Ollama in background
            subprocess.Popen(["ollama", "serve"], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            
            # Wait for service to start
            import time
            for _ in range(10):
                time.sleep(1)
                if self.check_ollama_status():
                    return True
            return False
        except:
            return False
            
    def list_models(self) -> List[str]:
        """List available DeepSeek models"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            models = response.json().get("models", [])
            deepseek_models = [m["name"] for m in models if "deepseek" in m["name"]]
            return deepseek_models
        except:
            return []
            
    def pull_model(self, model_name: str) -> bool:
        """Pull a DeepSeek model if not available"""
        available_models = self.list_models()
        if model_name in available_models:
            return True
            
        try:
            print(f"Pulling model {model_name}... This may take a while.")
            result = subprocess.run(["ollama", "pull", model_name], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
            
    def configure_pulser_alias(self) -> bool:
        """Add DeepSeek aliases to Pulser configuration"""
        pulser_config = Path.home() / ".pulserrc"
        
        deepseek_config = """
# DeepSeek Local Model Configuration
alias ds='pulser --model deepseek-6.7b'
alias dsl='pulser --model deepseek-33b'
alias codex-local='pulser --model deepseek-6.7b --mode codex'

# Function to switch between models
pulser-model() {
    case "$1" in
        claude)
            export PULSER_DEFAULT_MODEL="claude-3-sonnet"
            ;;
        deepseek|ds)
            export PULSER_DEFAULT_MODEL="deepseek-6.7b"
            ;;
        deepseek-large|dsl)
            export PULSER_DEFAULT_MODEL="deepseek-33b"
            ;;
        *)
            echo "Usage: pulser-model [claude|deepseek|deepseek-large]"
            return 1
            ;;
    esac
    echo "Default model set to: $PULSER_DEFAULT_MODEL"
}

# Auto-start Ollama if using DeepSeek
_pulser_pre_exec() {
    if [[ "$1" =~ "deepseek" ]] && ! pgrep -x "ollama" > /dev/null; then
        echo "Starting Ollama for DeepSeek..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
}
"""
        
        try:
            # Backup existing config
            if pulser_config.exists():
                backup_path = pulser_config.with_suffix('.bak')
                pulser_config.rename(backup_path)
                
            # Write new config
            with open(pulser_config, 'w') as f:
                if backup_path.exists():
                    with open(backup_path, 'r') as backup:
                        f.write(backup.read())
                f.write("\n" + deepseek_config)
                
            return True
        except Exception as e:
            print(f"Error configuring Pulser: {e}")
            return False
            
    def create_model_config(self) -> Dict[str, Any]:
        """Create model configuration for Pulser"""
        config = {
            "models": {
                "deepseek-6.7b": {
                    "provider": "ollama",
                    "endpoint": self.ollama_url,
                    "model": "deepseek-coder:6.7b-instruct-q4_K_M",
                    "context_window": 8192,
                    "supports_functions": False,
                    "parameters": {
                        "temperature": 0.1,
                        "max_tokens": 2048
                    }
                },
                "deepseek-33b": {
                    "provider": "ollama",
                    "endpoint": self.ollama_url,
                    "model": "deepseek-coder:33b-instruct-q4_K_M",
                    "context_window": 16384,
                    "supports_functions": False,
                    "parameters": {
                        "temperature": 0.2,
                        "max_tokens": 4096
                    }
                }
            },
            "routing_rules": [
                {
                    "condition": "task_complexity == 'high'",
                    "model": "deepseek-33b"
                },
                {
                    "condition": "response_time == 'critical'",
                    "model": "deepseek-6.7b"
                },
                {
                    "condition": "privacy == 'required'",
                    "model": "deepseek-33b"
                }
            ]
        }
        
        # Save configuration
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
            
        return config
        
    def test_integration(self) -> bool:
        """Test the DeepSeek integration"""
        print("Testing DeepSeek integration...")
        
        # Test 1: Ollama connection
        if not self.check_ollama_status():
            print("❌ Ollama not running")
            return False
        print("✅ Ollama running")
        
        # Test 2: Model availability
        models = self.list_models()
        if not any("deepseek" in m for m in models):
            print("❌ No DeepSeek models found")
            return False
        print(f"✅ Found models: {', '.join(m for m in models if 'deepseek' in m)}")
        
        # Test 3: Simple generation
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "deepseek-coder:6.7b-instruct-q4_K_M",
                    "prompt": "def hello():",
                    "stream": False,
                    "options": {"num_predict": 50}
                }
            )
            if response.status_code == 200:
                print("✅ Model responding correctly")
                return True
            else:
                print(f"❌ Model error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Generation failed: {e}")
            return False
            
    def setup_all(self) -> bool:
        """Complete setup process"""
        print("🚀 Setting up DeepSeek for Pulser/Codex CLI")
        
        # Start Ollama
        if not self.start_ollama():
            print("❌ Failed to start Ollama")
            return False
            
        # Pull models
        models_to_pull = [
            "deepseek-coder:6.7b-instruct-q4_K_M",
            "deepseek-coder:33b-instruct-q4_K_M"
        ]
        
        for model in models_to_pull:
            print(f"\nPulling {model}...")
            if not self.pull_model(model):
                print(f"⚠️  Failed to pull {model}, continuing...")
                
        # Configure Pulser
        if not self.configure_pulser_alias():
            print("❌ Failed to configure Pulser aliases")
            return False
            
        # Create model configuration
        self.create_model_config()
        
        # Test integration
        if self.test_integration():
            print("\n✅ Setup complete! You can now use:")
            print("  pulser --model deepseek-6.7b 'your prompt'")
            print("  ds 'your prompt'  # Short alias")
            print("  codex-local 'refactor this code'")
            return True
        else:
            print("\n⚠️  Setup completed with warnings")
            return False


if __name__ == "__main__":
    integration = PulserDeepSeekIntegration()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "setup":
            integration.setup_all()
        elif command == "test":
            integration.test_integration()
        elif command == "models":
            models = integration.list_models()
            print("Available DeepSeek models:")
            for model in models:
                print(f"  - {model}")
    else:
        print("Usage: pulser_deepseek_integration.py [setup|test|models]")
        print("  setup  - Complete setup process")
        print("  test   - Test integration")
        print("  models - List available models")