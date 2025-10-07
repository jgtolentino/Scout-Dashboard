#!/usr/bin/env python3
"""
model_switcher.py - Dynamic model selector for Pulser agents

This script enables Claudia to dynamically switch between models based on:
- Agent type (creative, analytical, code-focused)
- Memory/context requirements
- Task complexity

Integrates with pulser_infer_ollama.py for local inference and cloud APIs for more complex tasks.
"""

import os
import sys
import json
import yaml
import argparse
import subprocess
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple

# Version matching Pulser version
VERSION = "1.1.1"

# Default paths
DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "models.yaml")

# Model tiers and capabilities
class ModelTier(Enum):
    LOCAL_SMALL = "local_small"      # Small local models (1-3B)
    LOCAL_MEDIUM = "local_medium"    # Medium local models (7-13B)
    LOCAL_LARGE = "local_large"      # Large local models (30-70B)
    CLOUD_BASIC = "cloud_basic"      # Basic cloud APIs
    CLOUD_ADVANCED = "cloud_advanced"  # Advanced cloud APIs

class ModelCapability(Enum):
    TEXT = "text"            # Basic text generation
    CODE = "code"            # Code generation and analysis
    CREATIVE = "creative"    # Creative content generation
    ANALYTICAL = "analytical"  # Data analysis and reasoning
    MULTIMODAL = "multimodal"  # Image/audio processing

# Agent persona types
class AgentType(Enum):
    CLAUDIA = "claudia"      # Core orchestrator
    KALAW = "kalaw"         # Knowledge management
    IGGY = "iggy"           # Creative ideation
    LEA = "lea"             # Logical & analytical
    TESS = "tess"           # Technical specialist

# Model selection criteria
class ModelCriteria:
    def __init__(
        self,
        agent_type: AgentType = None,
        capabilities: List[ModelCapability] = None,
        min_tier: ModelTier = None,
        context_size: int = 0,
        token_limit: int = 0,
        memory_efficient: bool = False,
        local_only: bool = False
    ):
        self.agent_type = agent_type
        self.capabilities = capabilities or []
        self.min_tier = min_tier
        self.context_size = context_size
        self.token_limit = token_limit
        self.memory_efficient = memory_efficient
        self.local_only = local_only

# Model configuration
class ModelConfig:
    def __init__(
        self,
        name: str,
        provider: str,
        tier: ModelTier,
        capabilities: List[ModelCapability],
        context_size: int,
        memory_usage: int,
        local_path: str = None,
        api_config: Dict = None,
        preferred_for: List[AgentType] = None
    ):
        self.name = name
        self.provider = provider
        self.tier = tier
        self.capabilities = capabilities
        self.context_size = context_size
        self.memory_usage = memory_usage
        self.local_path = local_path
        self.api_config = api_config or {}
        self.preferred_for = preferred_for or []

# Default model configurations - these are overridden by config file
DEFAULT_MODELS = [
    {
        "name": "mistral",
        "provider": "ollama",
        "tier": "local_medium",
        "capabilities": ["text", "code", "analytical"],
        "context_size": 8192,
        "memory_usage": 4000,
        "preferred_for": ["claudia", "kalaw", "lea"]
    },
    {
        "name": "codellama",
        "provider": "ollama",
        "tier": "local_medium",
        "capabilities": ["code", "text"],
        "context_size": 8192,
        "memory_usage": 4000,
        "preferred_for": ["tess"]
    },
    {
        "name": "tinyllama",
        "provider": "ollama",
        "tier": "local_small",
        "capabilities": ["text"],
        "context_size": 2048,
        "memory_usage": 1000,
        "preferred_for": []
    },
    {
        "name": "phi",
        "provider": "ollama",
        "tier": "local_small",
        "capabilities": ["text", "code"],
        "context_size": 2048,
        "memory_usage": 1000,
        "preferred_for": []
    },
    {
        "name": "claude-3-opus",
        "provider": "anthropic",
        "tier": "cloud_advanced",
        "capabilities": ["text", "code", "creative", "analytical", "multimodal"],
        "context_size": 200000,
        "memory_usage": 0,
        "api_config": {
            "requires_api_key": True,
            "api_key_env": "ANTHROPIC_API_KEY"
        },
        "preferred_for": ["iggy", "lea"]
    },
    {
        "name": "gpt-4",
        "provider": "openai",
        "tier": "cloud_advanced",
        "capabilities": ["text", "code", "creative", "analytical"],
        "context_size": 32000,
        "memory_usage": 0,
        "api_config": {
            "requires_api_key": True,
            "api_key_env": "OPENAI_API_KEY"
        },
        "preferred_for": []
    }
]

class ModelSwitcher:
    def __init__(self, config_path: str = None):
        self.config_path = config_path or DEFAULT_CONFIG_PATH
        self.models: Dict[str, ModelConfig] = {}
        self.load_config()
        self.available_local_models = self._get_available_local_models()
    
    def load_config(self):
        """Load model configurations from YAML file or use defaults"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    config_data = yaml.safe_load(f)
                
                # Process model configurations
                for model_data in config_data.get('models', []):
                    model = ModelConfig(
                        name=model_data['name'],
                        provider=model_data['provider'],
                        tier=ModelTier(model_data['tier']),
                        capabilities=[ModelCapability(c) for c in model_data['capabilities']],
                        context_size=model_data['context_size'],
                        memory_usage=model_data['memory_usage'],
                        local_path=model_data.get('local_path'),
                        api_config=model_data.get('api_config', {}),
                        preferred_for=[AgentType(a) for a in model_data.get('preferred_for', [])]
                    )
                    self.models[model.name] = model
                    
            else:
                # Use default configurations
                for model_data in DEFAULT_MODELS:
                    model = ModelConfig(
                        name=model_data['name'],
                        provider=model_data['provider'],
                        tier=ModelTier(model_data['tier']),
                        capabilities=[ModelCapability(c) for c in model_data['capabilities']],
                        context_size=model_data['context_size'],
                        memory_usage=model_data['memory_usage'],
                        local_path=model_data.get('local_path'),
                        api_config=model_data.get('api_config', {}),
                        preferred_for=[AgentType(a) for a in model_data.get('preferred_for', [])]
                    )
                    self.models[model.name] = model
                
                # Create config directory if needed
                os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
                
                # Save default configurations for future use
                self._save_default_config()
                    
        except Exception as e:
            print(f"Error loading model configurations: {e}")
            print("Using default model configurations")
            
            # Use default configurations
            for model_data in DEFAULT_MODELS:
                model = ModelConfig(
                    name=model_data['name'],
                    provider=model_data['provider'],
                    tier=ModelTier(model_data['tier']),
                    capabilities=[ModelCapability(c) for c in model_data['capabilities']],
                    context_size=model_data['context_size'],
                    memory_usage=model_data['memory_usage'],
                    local_path=model_data.get('local_path'),
                    api_config=model_data.get('api_config', {}),
                    preferred_for=[AgentType(a) for a in model_data.get('preferred_for', [])]
                )
                self.models[model.name] = model
    
    def _save_default_config(self):
        """Save default configurations to YAML file"""
        config_data = {
            'models': DEFAULT_MODELS
        }
        
        try:
            with open(self.config_path, 'w') as f:
                yaml.dump(config_data, f, default_flow_style=False)
            print(f"Default model configurations saved to {self.config_path}")
        except Exception as e:
            print(f"Error saving default configurations: {e}")
    
    def _get_available_local_models(self) -> List[str]:
        """Get list of available local models from Ollama"""
        available_models = []
        
        try:
            # Check if Ollama is running
            import requests
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                for model in data.get('models', []):
                    available_models.append(model['name'])
        except Exception:
            # Ollama might not be running or available
            pass
            
        return available_models
    
    def get_best_model(self, criteria: ModelCriteria) -> Tuple[str, str]:
        """
        Select the best model based on given criteria
        Returns a tuple of (model_name, provider)
        """
        candidate_models = []
        
        # Filter models by criteria
        for name, model in self.models.items():
            # Skip unavailable local models
            if model.provider == "ollama" and name not in self.available_local_models:
                continue
                
            # Skip cloud models if local_only is specified
            if criteria.local_only and model.provider not in ["ollama", "local"]:
                continue
                
            # Check capabilities
            if criteria.capabilities:
                capabilities_match = True
                for capability in criteria.capabilities:
                    if capability.value not in [c.value for c in model.capabilities]:
                        capabilities_match = False
                        break
                        
                if not capabilities_match:
                    continue
            
            # Check tier
            if criteria.min_tier and ModelTier(criteria.min_tier).value > model.tier.value:
                continue
                
            # Check context size
            if criteria.context_size > model.context_size:
                continue
                
            # If we get here, the model is a candidate
            score = self._calculate_model_score(model, criteria)
            candidate_models.append((name, model.provider, score))
        
        # Sort by score (descending)
        candidate_models.sort(key=lambda x: x[2], reverse=True)
        
        if candidate_models:
            # Return the best model
            return candidate_models[0][0], candidate_models[0][1]
        else:
            # Default to Mistral if available, otherwise first available model
            if "mistral" in self.available_local_models:
                return "mistral", "ollama"
            elif self.available_local_models:
                return self.available_local_models[0], "ollama"
            else:
                return "mistral", "ollama"  # Default even if not available - will trigger download
    
    def _calculate_model_score(self, model: ModelConfig, criteria: ModelCriteria) -> float:
        """Calculate a score for how well a model matches the criteria"""
        score = 0.0
        
        # Preferred model for agent type gets a big boost
        if criteria.agent_type and criteria.agent_type in model.preferred_for:
            score += 100.0
            
        # Memory efficient models get a boost if memory_efficient is specified
        if criteria.memory_efficient and model.memory_usage < 2000:
            score += 50.0
            
        # Local models get a small boost for latency
        if model.provider == "ollama":
            score += 10.0
            
        # Models with more capabilities get a boost
        score += len(model.capabilities) * 5.0
        
        # Higher context size is generally better (but not if it exceeds what we need)
        if criteria.context_size > 0:
            # Perfect match or slightly larger is ideal
            if model.context_size >= criteria.context_size and model.context_size <= criteria.context_size * 1.5:
                score += 20.0
            elif model.context_size > criteria.context_size * 1.5:
                # Larger than needed is still good but not optimal
                score += 10.0
        
        return score
    
    def get_model_info(self, model_name: str) -> Optional[Dict]:
        """Get detailed information about a specific model"""
        if model_name in self.models:
            model = self.models[model_name]
            return {
                "name": model.name,
                "provider": model.provider,
                "tier": model.tier.value,
                "capabilities": [c.value for c in model.capabilities],
                "context_size": model.context_size,
                "memory_usage": model.memory_usage,
                "available": model.name in self.available_local_models if model.provider == "ollama" else True,
                "preferred_for": [a.value for a in model.preferred_for]
            }
        return None
    
    def ensure_model_available(self, model_name: str) -> bool:
        """Ensure that a model is available, downloading it if necessary"""
        if model_name not in self.models:
            print(f"Model {model_name} not found in configuration")
            return False
            
        model = self.models[model_name]
        
        # Only Ollama models need to be checked for availability
        if model.provider == "ollama":
            if model_name in self.available_local_models:
                return True
                
            # Model not available, try to download it
            print(f"Model {model_name} not available. Attempting to download...")
            try:
                subprocess.run(["ollama", "pull", model_name], check=True)
                # Update available models list
                self.available_local_models = self._get_available_local_models()
                return model_name in self.available_local_models
            except Exception as e:
                print(f"Error downloading model {model_name}: {e}")
                return False
        else:
            # For cloud models, check if API key is available
            if model.api_config.get("requires_api_key", False):
                env_var = model.api_config.get("api_key_env")
                if env_var and not os.environ.get(env_var):
                    print(f"Warning: API key environment variable {env_var} not set for {model_name}")
                    return False
            return True
    
    def run_inference(
        self, 
        prompt: str, 
        agent_type: str = None,
        capabilities: List[str] = None,
        context_size: int = 0,
        memory_efficient: bool = False,
        local_only: bool = False,
        model_name: str = None
    ) -> str:
        """
        Run inference using the best model or a specified model
        Returns the generated response
        """
        # If specific model provided, use it
        if model_name:
            provider = self.models[model_name].provider if model_name in self.models else "ollama"
        else:
            # Otherwise select best model based on criteria
            criteria = ModelCriteria(
                agent_type=AgentType(agent_type) if agent_type else None,
                capabilities=[ModelCapability(c) for c in capabilities] if capabilities else None,
                context_size=context_size,
                memory_efficient=memory_efficient,
                local_only=local_only
            )
            model_name, provider = self.get_best_model(criteria)
        
        # Ensure model is available
        if not self.ensure_model_available(model_name):
            # Fall back to Mistral if available
            if "mistral" in self.available_local_models:
                model_name = "mistral"
                provider = "ollama"
            else:
                print("No suitable model available")
                return "Error: No suitable model available"
        
        # Run inference based on provider
        if provider == "ollama":
            return self._run_ollama_inference(model_name, prompt)
        elif provider == "anthropic":
            return self._run_anthropic_inference(model_name, prompt)
        elif provider == "openai":
            return self._run_openai_inference(model_name, prompt)
        else:
            return f"Error: Unsupported provider {provider}"
    
    def _run_ollama_inference(self, model_name: str, prompt: str) -> str:
        """Run inference using Ollama"""
        # Use the Pulser Ollama integration
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pulser_infer_ollama.py")
        
        try:
            result = subprocess.run(
                ["python3", script_path, "--model", model_name, prompt],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            print(f"Error running Ollama inference: {e}")
            return f"Error: {e.stderr}"
    
    def _run_anthropic_inference(self, model_name: str, prompt: str) -> str:
        """Run inference using Anthropic Claude API"""
        try:
            import anthropic
            
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                return "Error: ANTHROPIC_API_KEY environment variable not set"
            
            client = anthropic.Anthropic(api_key=api_key)
            
            message = client.messages.create(
                model=model_name,
                max_tokens=1000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return message.content[0].text
        except ImportError:
            return "Error: anthropic package not installed. Install with: pip install anthropic"
        except Exception as e:
            return f"Error calling Anthropic API: {str(e)}"
    
    def _run_openai_inference(self, model_name: str, prompt: str) -> str:
        """Run inference using OpenAI API"""
        try:
            import openai
            
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                return "Error: OPENAI_API_KEY environment variable not set"
            
            client = openai.OpenAI(api_key=api_key)
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.choices[0].message.content
        except ImportError:
            return "Error: openai package not installed. Install with: pip install openai"
        except Exception as e:
            return f"Error calling OpenAI API: {str(e)}"

def main():
    """Command-line interface for the model switcher"""
    parser = argparse.ArgumentParser(description="Pulser Model Switcher")
    parser.add_argument("--list", "-l", action="store_true", help="List available models")
    parser.add_argument("--info", "-i", metavar="MODEL", help="Get information about a specific model")
    parser.add_argument("--download", "-d", metavar="MODEL", help="Download a model")
    parser.add_argument("--agent", "-a", choices=["claudia", "kalaw", "iggy", "lea", "tess"], 
                      help="Agent type for model selection")
    parser.add_argument("--run", "-r", metavar="PROMPT", help="Run inference with prompt")
    parser.add_argument("--model", "-m", metavar="MODEL", help="Specify model to use")
    parser.add_argument("--local-only", action="store_true", help="Use only local models")
    parser.add_argument("--config", "-c", metavar="PATH", help="Path to model configuration file")
    parser.add_argument("--version", "-v", action="store_true", help="Show version information")
    
    args = parser.parse_args()
    
    # Show version and exit
    if args.version:
        print(f"Pulser Model Switcher v{VERSION}")
        return 0
    
    # Initialize model switcher
    model_switcher = ModelSwitcher(config_path=args.config)
    
    # List available models
    if args.list:
        print("Available Models:")
        for name, model in model_switcher.models.items():
            available = name in model_switcher.available_local_models if model.provider == "ollama" else "N/A"
            status = "✓" if available == True else "✗" if available == False else "-"
            print(f"  {status} {name} ({model.provider}, {model.tier.value})")
        return 0
    
    # Get model information
    if args.info:
        info = model_switcher.get_model_info(args.info)
        if info:
            print(f"Model: {info['name']}")
            print(f"Provider: {info['provider']}")
            print(f"Tier: {info['tier']}")
            print(f"Capabilities: {', '.join(info['capabilities'])}")
            print(f"Context Size: {info['context_size']} tokens")
            print(f"Memory Usage: {info['memory_usage']} MB")
            print(f"Available: {info['available']}")
            print(f"Preferred for agents: {', '.join(info['preferred_for']) if info['preferred_for'] else 'None'}")
        else:
            print(f"Model {args.info} not found")
        return 0
    
    # Download model
    if args.download:
        if model_switcher.ensure_model_available(args.download):
            print(f"Model {args.download} is now available")
        else:
            print(f"Failed to download model {args.download}")
        return 0
    
    # Run inference
    if args.run:
        result = model_switcher.run_inference(
            prompt=args.run,
            agent_type=args.agent,
            local_only=args.local_only,
            model_name=args.model
        )
        print(result)
        return 0
    
    # If no arguments provided, show help
    parser.print_help()
    return 0

if __name__ == "__main__":
    sys.exit(main())