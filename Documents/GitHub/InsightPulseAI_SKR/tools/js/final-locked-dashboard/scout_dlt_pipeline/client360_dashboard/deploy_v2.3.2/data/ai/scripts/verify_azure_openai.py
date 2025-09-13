#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_azure_openai.py - Script to verify Azure OpenAI API configuration

This script tests connectivity to Azure OpenAI API and validates that the
required deployments are available and properly configured.
"""

import os
import sys
import time
import json
import logging
import argparse
import datetime
import yaml
from dotenv import load_dotenv
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"logs/azure_verification_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("azure_openai_verification")

# Load environment variables
load_dotenv()

def load_model_routing_config(config_path: str = "model_routing.yaml"):
    """Load the model routing configuration from YAML file."""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        logger.info(f"Successfully loaded model routing config from {config_path}")
        return config
    except Exception as e:
        logger.error(f"Error loading model routing config: {e}")
        sys.exit(1)

def get_azure_secret(secret_name: str):
    """Retrieve a secret from Azure Key Vault."""
    try:
        keyvault_name = os.environ.get("AZURE_KEYVAULT_ENDPOINT", "").replace("https://", "").replace(".vault.azure.net/", "")
        if not keyvault_name:
            logger.warning("Azure Key Vault endpoint not configured, using environment variables")
            return os.environ.get(secret_name, "")
            
        credential = DefaultAzureCredential()
        secret_client = SecretClient(vault_url=f"https://{keyvault_name}.vault.azure.net/", credential=credential)
        return secret_client.get_secret(secret_name).value
    except Exception as e:
        logger.warning(f"Failed to retrieve secret from Key Vault: {e}")
        return os.environ.get(secret_name, "")

def setup_openai_client(config):
    """Set up the Azure OpenAI client using configuration."""
    provider_config = config["providers"]["azure_openai"]
    
    # Try to get API key from Key Vault first, fall back to environment variable
    api_key = get_azure_secret("AZURE-OPENAI-API-KEY") or os.environ.get("AZURE_OPENAI_API_KEY", "")
    if not api_key:
        logger.error("Azure OpenAI API key not found in environment or Key Vault")
        sys.exit(1)
        
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", provider_config.get("base_url", ""))
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", provider_config.get("api_version", "2023-12-01-preview"))
    
    logger.info(f"Using Azure OpenAI endpoint: {endpoint}")
    logger.info(f"Using API version: {api_version}")
    
    try:
        client = openai.AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint
        )
        logger.info("Successfully initialized Azure OpenAI client")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Azure OpenAI client: {e}")
        sys.exit(1)

def test_models(client, config):
    """Test all configured models to verify they're accessible."""
    provider_config = config["providers"]["azure_openai"]
    success_count = 0
    failure_count = 0
    
    for model_name, model_config in provider_config["models"].items():
        deployment_id = model_config.get("deployment_id", model_name)
        
        logger.info(f"Testing model: {model_name} (deployment: {deployment_id})")
        
        try:
            if "embedding" in deployment_id.lower():
                # Test embedding model
                result = client.embeddings.create(
                    model=deployment_id,
                    input="This is a test of the Azure OpenAI embedding model."
                )
                embedding_dimensions = len(result.data[0].embedding)
                logger.info(f"Successfully generated embeddings with {embedding_dimensions} dimensions")
                success_count += 1
            else:
                # Test chat completion model
                response = client.chat.completions.create(
                    model=deployment_id,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": "Hello, are you working properly?"}
                    ],
                    max_tokens=50
                )
                
                logger.info(f"Model response: {response.choices[0].message.content}")
                logger.info(f"Successfully tested chat completion with model {model_name}")
                success_count += 1
                
        except Exception as e:
            logger.error(f"Error testing model {model_name}: {e}")
            failure_count += 1
    
    return success_count, failure_count

def test_prompt_templates(config):
    """Test that all configured prompt templates are available and valid."""
    success_count = 0
    failure_count = 0
    
    for template_name, template_config in config["prompt_templates"].items():
        template_file = os.path.expandvars(template_config["file"])
        
        logger.info(f"Testing prompt template: {template_name} (file: {template_file})")
        
        try:
            with open(template_file, 'r') as f:
                template_text = f.read()
                
            # Check that all variables in the template config are present in the template
            variables = template_config["variables"]
            missing_vars = []
            
            for var in variables:
                if f"{{{var}}}" not in template_text:
                    missing_vars.append(var)
            
            if missing_vars:
                logger.warning(f"Template {template_name} is missing variables: {', '.join(missing_vars)}")
                failure_count += 1
            else:
                logger.info(f"Successfully validated template {template_name}")
                success_count += 1
                
        except Exception as e:
            logger.error(f"Error testing template {template_name}: {e}")
            failure_count += 1
    
    return success_count, failure_count

def test_routing_configuration(config):
    """Test the routing configuration for all insight types."""
    success_count = 0
    failure_count = 0
    
    for insight_type, routing_config in config["routing"].items():
        logger.info(f"Testing routing configuration for insight type: {insight_type}")
        
        try:
            # Check that the primary model exists
            primary_model = routing_config["primary_model"]
            provider, model = primary_model.split(".")
            
            if provider not in config["providers"]:
                logger.error(f"Provider {provider} not found in configuration")
                failure_count += 1
                continue
                
            if model not in config["providers"][provider]["models"]:
                logger.error(f"Model {model} not found in provider {provider} configuration")
                failure_count += 1
                continue
            
            # Check that the prompt template exists
            prompt_template = routing_config["prompt_template"]
            if prompt_template not in config["prompt_templates"]:
                logger.error(f"Prompt template {prompt_template} not found in configuration")
                failure_count += 1
                continue
            
            logger.info(f"Successfully validated routing for {insight_type}")
            success_count += 1
            
        except Exception as e:
            logger.error(f"Error testing routing for {insight_type}: {e}")
            failure_count += 1
    
    return success_count, failure_count

def verify_directories():
    """Verify that all required directories exist."""
    required_dirs = ["prompts", "output", "logs"]
    
    for directory in required_dirs:
        if not os.path.exists(directory):
            logger.info(f"Creating directory: {directory}")
            os.makedirs(directory)

def main():
    parser = argparse.ArgumentParser(description="Verify Azure OpenAI API configuration")
    parser.add_argument("--config", default="model_routing.yaml",
                      help="Path to the model routing configuration file")
    parser.add_argument("--verify-only", action="store_true",
                      help="Only verify configuration without testing API access")
    args = parser.parse_args()
    
    # Verify directories
    verify_directories()
    
    # Load configuration
    config = load_model_routing_config(args.config)
    
    # Verify configuration format
    logger.info("Verifying configuration format...")
    
    # Test routing configuration
    logger.info("Testing routing configuration...")
    routing_success, routing_failure = test_routing_configuration(config)
    logger.info(f"Routing configuration test results: {routing_success} succeeded, {routing_failure} failed")
    
    # Test prompt templates
    logger.info("Testing prompt templates...")
    template_success, template_failure = test_prompt_templates(config)
    logger.info(f"Prompt template test results: {template_success} succeeded, {template_failure} failed")
    
    if args.verify_only:
        logger.info("Skipping API access tests (--verify-only flag set)")
    else:
        # Set up OpenAI client
        client = setup_openai_client(config)
        
        # Test models
        logger.info("Testing models...")
        model_success, model_failure = test_models(client, config)
        logger.info(f"Model test results: {model_success} succeeded, {model_failure} failed")
    
    # Summary
    logger.info("Verification complete!")
    if routing_failure == 0 and template_failure == 0 and (args.verify_only or model_failure == 0):
        logger.info("All tests passed successfully!")
        return 0
    else:
        logger.error("Some tests failed. See log for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())