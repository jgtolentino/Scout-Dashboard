#!/bin/bash
# register_azureml_resources.sh
# Deploys Azure ML resources for Baseline and Advanced Enrichment Pipelines
# Created: 2025-05-12

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCE_GROUP="rg-projectscout-ml"
WORKSPACE_NAME="mlw-projectscout"
SUBSCRIPTION_ID=""  # To be filled by user
LOCATION="eastus"   # Default location
COMPUTE_NAME="compute-projectscout"
COMPUTE_SIZE="Standard_D4s_v3"  # 4 cores, 16GB RAM
COMPUTE_MIN_NODES=0
COMPUTE_MAX_NODES=4

# SQL connection details for dataset registration
SQL_SERVER="sqltbwaprojectscoutserver.database.windows.net"
SQL_DATABASE="TBWA_ProjectScout_DB"  # Update based on transcript_field_map
SQL_USERNAME=""  # To be filled by user
SQL_PASSWORD=""  # To be filled by user

# Environment and pipeline versions
ENV_VERSION="1.0.0"
PIPELINE_VERSION="1.0.0"

# Header
echo -e "\n${CYAN}===============================================${NC}"
echo -e "${CYAN}   AZURE ML RESOURCE REGISTRATION FOR PROJECT SCOUT   ${NC}"
echo -e "${CYAN}===============================================${NC}\n"

# Check for Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found. Please install it first:${NC}"
    echo -e "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check for Azure ML CLI extension
if ! az ml -h &> /dev/null; then
    echo -e "${YELLOW}Azure ML CLI extension not found. Installing...${NC}"
    az extension add -n ml
fi

# Function to ensure directory exists
ensure_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}Created directory: $dir${NC}"
    fi
}

# Create directory structure
echo -e "\n${BLUE}Creating directory structure...${NC}"
ensure_dir "${SCRIPT_DIR}/environments"
ensure_dir "${SCRIPT_DIR}/pipelines"
ensure_dir "${SCRIPT_DIR}/components/brand_detection"
ensure_dir "${SCRIPT_DIR}/components/sentiment_analysis"
ensure_dir "${SCRIPT_DIR}/components/intent_extraction"
ensure_dir "${SCRIPT_DIR}/components/spacy_context"
ensure_dir "${SCRIPT_DIR}/scripts"

# Prompt for Azure credentials if needed
echo -e "\n${BLUE}Checking Azure login status...${NC}"
LOGGED_IN=$(az account show 2>/dev/null || echo "")
if [ -z "$LOGGED_IN" ]; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in:${NC}"
    az login
fi

# Prompt for subscription ID if not provided
if [ -z "$SUBSCRIPTION_ID" ]; then
    # List available subscriptions
    az account list --output table
    
    # Prompt for subscription
    echo -e "${YELLOW}Enter your Azure Subscription ID:${NC}"
    read -p "> " SUBSCRIPTION_ID
    
    # Set subscription
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Prompt for SQL credentials if not provided
if [ -z "$SQL_USERNAME" ] || [ -z "$SQL_PASSWORD" ]; then
    echo -e "${YELLOW}Enter SQL Server credentials to access TranscriptionResults:${NC}"
    read -p "Username: " SQL_USERNAME
    read -sp "Password: " SQL_PASSWORD
    echo ""  # New line after password
fi

# Create or verify resource group
echo -e "\n${BLUE}Checking resource group...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    echo -e "${YELLOW}Resource group $RESOURCE_GROUP does not exist. Creating...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Create or verify ML workspace
echo -e "\n${BLUE}Checking ML workspace...${NC}"
if ! az ml workspace show --name "$WORKSPACE_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo -e "${YELLOW}ML workspace $WORKSPACE_NAME does not exist. Creating...${NC}"
    az ml workspace create \
        --name "$WORKSPACE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION"
fi

# Create compute cluster
echo -e "\n${BLUE}Creating compute cluster...${NC}"
COMPUTE_EXISTS=$(az ml compute show --name "$COMPUTE_NAME" --workspace-name "$WORKSPACE_NAME" --resource-group "$RESOURCE_GROUP" 2>/dev/null || echo "")
if [ -z "$COMPUTE_EXISTS" ]; then
    echo -e "${YELLOW}Creating compute cluster $COMPUTE_NAME...${NC}"
    az ml compute create \
        --name "$COMPUTE_NAME" \
        --type amlcompute \
        --min-instances "$COMPUTE_MIN_NODES" \
        --max-instances "$COMPUTE_MAX_NODES" \
        --size "$COMPUTE_SIZE" \
        --workspace-name "$WORKSPACE_NAME" \
        --resource-group "$RESOURCE_GROUP"
else
    echo -e "${GREEN}Compute cluster $COMPUTE_NAME already exists.${NC}"
fi

# Create environments YAML files
echo -e "\n${BLUE}Creating environment definition files...${NC}"

# Create baseline environment YAML
cat > "${SCRIPT_DIR}/environments/baseline_env.yml" << EOF
name: baseline_enrichment_env
version: $ENV_VERSION
description: Environment for baseline transcript enrichment pipeline
docker:
  image: mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest
conda_file:
  channels:
    - conda-forge
    - defaults
  dependencies:
    - python=3.9
    - pip=22.3.1
    - pip:
      - azureml-core
      - azureml-dataset-runtime
      - azureml-defaults
      - vaderSentiment==3.3.2
      - rapidfuzz==3.0.0
      - pymssql==2.2.7
      - sqlalchemy==2.0.9
      - pandas>=2.0.0
      - numpy>=1.24.0
      - spacy>=3.5.0
      - pyodbc>=4.0.39
      - azure-identity>=1.12.0
      - azure-keyvault-secrets>=4.6.0
EOF

# Create advanced environment YAML with additional packages
cat > "${SCRIPT_DIR}/environments/advanced_env.yml" << EOF
name: advanced_enrichment_env
version: $ENV_VERSION
description: Environment for advanced transcript enrichment pipeline with NLP capabilities
docker:
  image: mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest
conda_file:
  channels:
    - conda-forge
    - defaults
  dependencies:
    - python=3.9
    - pip=22.3.1
    - pip:
      - azureml-core
      - azureml-dataset-runtime
      - azureml-defaults
      - vaderSentiment==3.3.2
      - rapidfuzz==3.0.0
      - pymssql==2.2.7
      - sqlalchemy==2.0.9
      - pandas>=2.0.0
      - numpy>=1.24.0
      - spacy>=3.5.0
      - pyodbc>=4.0.39
      - azure-identity>=1.12.0
      - azure-keyvault-secrets>=4.6.0
      - scikit-learn>=1.2.2
      - transformers>=4.28.0
      - torch>=2.0.0
      - tensorflow>=2.12.0
      - nltk>=3.8.1
      - textblob>=0.17.1
      - gensim>=4.3.0
      - langdetect>=1.0.9
EOF

echo -e "${GREEN}✓ Environment definition files created${NC}"

# Create a setup script to download SpaCy models
cat > "${SCRIPT_DIR}/scripts/setup_spacy_models.py" << EOF
# setup_spacy_models.py
# Downloads required SpaCy models during environment setup

import os
import sys
import spacy
from spacy.cli import download

def main():
    """Download required SpaCy models"""
    print("Downloading SpaCy models...")
    
    # Download English models
    models = ["en_core_web_sm", "en_core_web_lg"]
    
    for model in models:
        print(f"Downloading {model}...")
        try:
            download(model)
            # Verify the model loads correctly
            nlp = spacy.load(model)
            print(f"✓ Successfully downloaded and loaded {model}")
        except Exception as e:
            print(f"Error downloading {model}: {e}")
            sys.exit(1)
    
    print("All SpaCy models downloaded successfully.")

if __name__ == "__main__":
    main()
EOF

# Create the brand detection component
echo -e "\n${BLUE}Creating brand detection component...${NC}"
cat > "${SCRIPT_DIR}/components/brand_detection/component.yaml" << EOF
name: brand_detection_component
version: $PIPELINE_VERSION
type: command
description: Detect brand mentions in transcription chunks

inputs:
  transcription_data:
    type: mltable
    description: Table containing transcription chunks
  brand_list:
    type: uri_file
    description: File containing known brands for detection
    optional: true
  min_confidence:
    type: number
    description: Minimum confidence threshold for brand detection
    default: 0.8

outputs:
  brand_mentions:
    type: mltable
    description: Table containing detected brand mentions

code: ./src

environment:
  name: baseline_enrichment_env
  version: $ENV_VERSION
  
command: >-
  python run.py
  --transcription-data \${{inputs.transcription_data}}
  --brand-list \${{inputs.brand_list}}
  --min-confidence \${{inputs.min_confidence}}
  --output-path \${{outputs.brand_mentions}}
EOF

# Create the implementation script for brand detection
ensure_dir "${SCRIPT_DIR}/components/brand_detection/src"
cat > "${SCRIPT_DIR}/components/brand_detection/src/run.py" << EOF
#!/usr/bin/env python3
# Brand detection component for Azure ML pipeline
# Detects brand mentions in transcription chunks and stores results

import os
import sys
import argparse
import logging
import pandas as pd
import numpy as np
from rapidfuzz import fuzz, process
import spacy
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import create_engine

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("brand_detection")

def load_spacy_model():
    """Load SpaCy model for NER"""
    try:
        return spacy.load("en_core_web_lg")
    except Exception as e:
        logger.error(f"Error loading SpaCy model: {e}")
        # Fall back to small model if large isn't available
        try:
            return spacy.load("en_core_web_sm")
        except Exception as e:
            logger.error(f"Error loading fallback SpaCy model: {e}")
            return None

def load_known_brands(brand_list_path=None):
    """Load known brands from file or use defaults"""
    if brand_list_path and os.path.exists(brand_list_path):
        with open(brand_list_path, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    else:
        # Default brand list if file not provided
        return [
            "Nike", "Adidas", "Pepsi", "Coca-Cola", "Samsung", "Apple", 
            "Google", "Microsoft", "Amazon", "Facebook", "Twitter", 
            "Jollibee", "Globe Telecom", "PLDT", "Smart", "BDO", "BPI",
            "Metrobank", "SM", "Ayala", "Bench", "Penshoppe", "Mercury Drug"
        ]

def extract_brands(text, nlp, known_brands):
    """Extract brand mentions from text using NLP and known brands list"""
    if not text or not isinstance(text, str):
        return []
    
    extracted_brands = []
    text_lower = text.lower()
    
    # First pass: Use SpaCy NER if available
    if nlp:
        doc = nlp(text)
        # Extract organizations and products as potential brands
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT", "GPE"]:
                brand_name = ent.text.strip()
                # Check if this matches our known brands list (case insensitive)
                known_brand_match = next(
                    (kb for kb in known_brands if kb.lower() == brand_name.lower()), 
                    None
                )
                
                if known_brand_match:
                    # Use canonical spelling from known brands list
                    brand_name = known_brand_match
                    confidence = 0.9  # Higher confidence for known brands
                else:
                    confidence = 0.7  # Lower confidence for unknown brands
                
                extracted_brands.append({
                    "brand": brand_name,
                    "confidence": confidence,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "type": ent.label_
                })
    
    # Second pass: Rule-based detection for known brands
    for brand in known_brands:
        brand_lower = brand.lower()
        if brand_lower in text_lower:
            # Find all occurrences
            start = 0
            while True:
                start = text_lower.find(brand_lower, start)
                if start == -1:
                    break
                
                # Check if we already detected this brand at this position via NER
                if not any(b["start"] <= start and b["end"] >= start + len(brand_lower) 
                          for b in extracted_brands if b["brand"].lower() == brand_lower):
                    extracted_brands.append({
                        "brand": brand,  # Use canonical spelling
                        "confidence": 0.85,
                        "start": start,
                        "end": start + len(brand_lower),
                        "type": "RULE_BASED"
                    })
                
                start += len(brand_lower)
    
    return extracted_brands

def main():
    parser = argparse.ArgumentParser(description="Brand mention detection in transcription chunks")
    parser.add_argument("--transcription-data", type=str, required=True, help="Path to transcription data")
    parser.add_argument("--brand-list", type=str, help="Path to file containing known brands")
    parser.add_argument("--min-confidence", type=float, default=0.8, help="Minimum confidence threshold")
    parser.add_argument("--output-path", type=str, required=True, help="Output path for brand mentions")
    
    args = parser.parse_args()
    
    logger.info("Starting brand detection process")
    
    # Load models and resources
    logger.info("Loading SpaCy model")
    nlp = load_spacy_model()
    
    logger.info("Loading known brands list")
    known_brands = load_known_brands(args.brand_list)
    logger.info(f"Loaded {len(known_brands)} known brands")
    
    # Load transcription data
    logger.info(f"Loading transcription data from {args.transcription_data}")
    try:
        # For ML Table input
        df = pd.read_csv(args.transcription_data)
        logger.info(f"Loaded {len(df)} transcription chunks")
    except Exception as e:
        logger.error(f"Error loading transcription data: {e}")
        sys.exit(1)
    
    # Ensure required columns exist
    required_columns = ["InteractionID", "ChunkIndex", "ChunkText"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        logger.error(f"Missing required columns: {missing_columns}")
        sys.exit(1)
    
    # Process transcripts
    results = []
    for idx, row in df.iterrows():
        chunk_text = row["ChunkText"]
        if pd.isna(chunk_text) or not chunk_text:
            continue
            
        # Extract brands
        brands = extract_brands(chunk_text, nlp, known_brands)
        
        # Add to results if confidence meets threshold
        for brand in brands:
            if brand["confidence"] >= args.min_confidence:
                results.append({
                    "InteractionID": row["InteractionID"],
                    "ChunkIndex": row["ChunkIndex"],
                    "MentionedBrand": brand["brand"],
                    "ConfidenceScore": brand["confidence"],
                    "DeviceID": row.get("DeviceID", None),
                    "DetectedAt": datetime.now().isoformat(),
                    "BrandType": brand["type"],
                    "StartPosition": brand["start"],
                    "EndPosition": brand["end"]
                })
                
    # Create results DataFrame
    results_df = pd.DataFrame(results)
    
    # Save results
    logger.info(f"Detected {len(results)} brand mentions with confidence >= {args.min_confidence}")
    logger.info(f"Saving results to {args.output_path}")
    
    # Convert DeviceID column to string to avoid type issues
    if 'DeviceID' in results_df.columns:
        results_df['DeviceID'] = results_df['DeviceID'].astype(str)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output_path), exist_ok=True)
    
    # Save as CSV
    results_df.to_csv(os.path.join(args.output_path, "brand_mentions.csv"), index=False)
    
    logger.info("Brand detection complete")

if __name__ == "__main__":
    main()
EOF

# Create baseline pipeline definition
echo -e "\n${BLUE}Creating baseline pipeline definition...${NC}"
cat > "${SCRIPT_DIR}/pipelines/baseline_pipeline.py" << EOF
# baseline_pipeline.py
# Baseline enrichment pipeline for Project Scout transcripts
# Includes brand mention detection

from azure.ai.ml import MLClient, Input, Output, dsl, load_component, command
from azure.ai.ml.entities import Job, Component, Environment, Data
from azure.ai.ml.constants import AssetTypes, InputOutputModes
from azure.identity import DefaultAzureCredential

# Define pipeline function
def create_baseline_pipeline():
    # Load brand detection component
    brand_detection = load_component(path="../components/brand_detection/component.yaml")
    
    # Data preparation component - inline definition
    @command(
        name="prepare_transcription_data",
        display_name="Prepare Transcription Data",
        description="Extracts and prepares transcription data for enrichment",
        environment="../environments/baseline_env.yml",
        version="$PIPELINE_VERSION"
    )
    def prepare_data(
        # Input SQL connection parameters as pipeline input
        sql_server: str,
        sql_database: str,
        sql_username: str,
        sql_password: str,
        
        # Output prepared data
        prepared_data: Output(type=AssetTypes.MLTABLE)
    ):
        import os
        import pandas as pd
        import pymssql
        import logging
        
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger("data_prep")
        
        # Connect to SQL database
        logger.info(f"Connecting to {sql_server}/{sql_database}")
        conn = pymssql.connect(
            server=sql_server,
            database=sql_database,
            user=sql_username,
            password=sql_password
        )
        
        # Query data - using the standardized field names
        query = """
        SELECT
            InteractionID,
            ChunkIndex,
            ChunkText,
            ChunkTimestamp,
            DeviceID
        FROM
            dbo.SalesInteractionTranscripts
        WHERE
            ChunkText IS NOT NULL
        ORDER BY
            InteractionID, ChunkIndex
        """
        
        logger.info("Executing query")
        df = pd.read_sql(query, conn)
        logger.info(f"Retrieved {len(df)} rows")
        
        # Save to output
        os.makedirs(prepared_data, exist_ok=True)
        df.to_csv(os.path.join(prepared_data, "transcription_data.csv"), index=False)
        
        # Create MLTable definition file
        with open(os.path.join(prepared_data, "MLTable"), "w") as f:
            f.write("type: mltable\n")
            f.write("paths:\n")
            f.write("  - file: ./transcription_data.csv\n")
        
        logger.info(f"Data prepared and saved to {prepared_data}")
    
    # Load brand list component - inline definition
    @command(
        name="load_brand_list",
        display_name="Load Brand List",
        description="Prepares the brand list for detection",
        environment="../environments/baseline_env.yml",
        version="$PIPELINE_VERSION"
    )
    def load_brands(
        # Output brand list
        brand_list: Output(type=AssetTypes.URI_FILE)
    ):
        import os
        
        # Default brand list
        brands = [
            "Nike", "Adidas", "Pepsi", "Coca-Cola", "Samsung", "Apple", 
            "Google", "Microsoft", "Amazon", "Facebook", "Twitter", 
            "Jollibee", "Globe Telecom", "PLDT", "Smart", "BDO", "BPI",
            "Metrobank", "SM", "Ayala", "Bench", "Penshoppe", "Mercury Drug"
        ]
        
        # Save to output
        with open(brand_list, "w") as f:
            for brand in brands:
                f.write(f"{brand}\n")
    
    # Export results component - inline definition  
    @command(
        name="export_brand_mentions",
        display_name="Export Brand Mentions",
        description="Exports brand mentions back to SQL database",
        environment="../environments/baseline_env.yml",
        version="$PIPELINE_VERSION"
    )
    def export_results(
        # Input detected brand mentions
        brand_mentions: Input(type=AssetTypes.MLTABLE),
        
        # SQL connection parameters
        sql_server: str,
        sql_database: str,
        sql_username: str,
        sql_password: str
    ):
        import os
        import pandas as pd
        import pymssql
        import logging
        from datetime import datetime
        
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger("export_results")
        
        # Load detected brand mentions
        logger.info(f"Loading brand mentions from {brand_mentions}")
        mentions_df = pd.read_csv(os.path.join(brand_mentions, "brand_mentions.csv"))
        logger.info(f"Loaded {len(mentions_df)} brand mentions")
        
        # Connect to SQL database
        logger.info(f"Connecting to {sql_server}/{sql_database}")
        conn = pymssql.connect(
            server=sql_server,
            database=sql_database,
            user=sql_username,
            password=sql_password
        )
        
        # Check if table exists
        cursor = conn.cursor()
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TranscriptEntityMentions')
        CREATE TABLE dbo.TranscriptEntityMentions (
          InteractionID     VARCHAR(60)   NOT NULL,
          ChunkIndex        INT           NOT NULL,
          MentionedBrand    NVARCHAR(255) NOT NULL,
          ConfidenceScore   FLOAT         NULL,
          DeviceID          VARCHAR(60)   NULL,
          DetectedAt        DATETIME2     DEFAULT SYSDATETIME(),
          PRIMARY KEY (InteractionID, ChunkIndex, MentionedBrand),
          FOREIGN KEY (InteractionID, ChunkIndex)
            REFERENCES dbo.SalesInteractionTranscripts(InteractionID, ChunkIndex)
        );
        """)
        conn.commit()
        
        # Insert data
        logger.info("Inserting brand mentions into database")
        for idx, row in mentions_df.iterrows():
            cursor.execute("""
            IF NOT EXISTS (
                SELECT 1 FROM dbo.TranscriptEntityMentions 
                WHERE InteractionID = %s AND ChunkIndex = %s AND MentionedBrand = %s
            )
            INSERT INTO dbo.TranscriptEntityMentions 
                (InteractionID, ChunkIndex, MentionedBrand, ConfidenceScore, DeviceID, DetectedAt)
            VALUES
                (%s, %s, %s, %s, %s, %s)
            """, (
                row['InteractionID'], row['ChunkIndex'], row['MentionedBrand'],
                row['InteractionID'], row['ChunkIndex'], row['MentionedBrand'],
                row['ConfidenceScore'], row['DeviceID'], row['DetectedAt']
            ))
        
        conn.commit()
        logger.info("Export complete")
    
    # Define the pipeline
    @dsl.pipeline(
        name="baseline_enrichment_pipeline",
        description="Baseline enrichment pipeline for Project Scout transcripts",
        compute="compute-projectscout"
    )
    def baseline_pipeline(
        sql_server: str,
        sql_database: str,
        sql_username: str,
        sql_password: str,
        min_confidence: float = 0.8
    ):
        # Step 1: Prepare data
        prep_job = prepare_data(
            sql_server=sql_server,
            sql_database=sql_database,
            sql_username=sql_username,
            sql_password=sql_password
        )
        
        # Step 2: Load brand list
        brands_job = load_brands()
        
        # Step 3: Detect brand mentions
        detection_job = brand_detection(
            transcription_data=prep_job.outputs.prepared_data,
            brand_list=brands_job.outputs.brand_list,
            min_confidence=min_confidence
        )
        
        # Step 4: Export results
        export_job = export_results(
            brand_mentions=detection_job.outputs.brand_mentions,
            sql_server=sql_server,
            sql_database=sql_database,
            sql_username=sql_username,
            sql_password=sql_password
        )
        
        return {
            "brand_mentions": detection_job.outputs.brand_mentions
        }
    
    return baseline_pipeline

# Pipeline entry point
if __name__ == "__main__":
    # This code would be used when registering the pipeline
    from azure.ai.ml import MLClient
    from azure.identity import DefaultAzureCredential
    
    # Get ML client
    ml_client = MLClient(
        DefaultAzureCredential(),
        subscription_id="$SUBSCRIPTION_ID",
        resource_group_name="$RESOURCE_GROUP",
        workspace_name="$WORKSPACE_NAME"
    )
    
    # Create pipeline
    pipeline = create_baseline_pipeline()
    
    # Register pipeline
    registered_pipeline = ml_client.components.create_or_update(pipeline)
    print(f"Pipeline registered: {registered_pipeline.name} (v{registered_pipeline.version})")
EOF

# Create a Python script to automate registration of all resources
cat > "${SCRIPT_DIR}/scripts/register_resources.py" << EOF
# register_resources.py
# Registers all Azure ML resources for Project Scout

import os
import sys
import argparse
import logging
from azure.ai.ml import MLClient
from azure.ai.ml.entities import (
    Environment, 
    ManagedOnlineEndpoint,
    ManagedOnlineDeployment,
    Model,
    Component
)
from azure.identity import DefaultAzureCredential
from azure.core.exceptions import ResourceNotFoundError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("register_resources")

def register_environments(ml_client, env_dir):
    """Register all environment definitions in env_dir"""
    logger.info(f"Registering environments from {env_dir}")
    
    for env_file in os.listdir(env_dir):
        if env_file.endswith(".yml") or env_file.endswith(".yaml"):
            env_path = os.path.join(env_dir, env_file)
            logger.info(f"Registering environment: {env_path}")
            
            try:
                env = Environment.load(env_path)
                registered_env = ml_client.environments.create_or_update(env)
                logger.info(f"✓ Registered: {registered_env.name} (v{registered_env.version})")
            except Exception as e:
                logger.error(f"Error registering environment {env_file}: {e}")

def register_components(ml_client, components_dir):
    """Register all component definitions in components_dir"""
    logger.info(f"Registering components from {components_dir}")
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(components_dir):
        for file in files:
            if file == "component.yaml" or file == "component.yml":
                component_path = os.path.join(root, file)
                logger.info(f"Registering component: {component_path}")
                
                try:
                    component = Component.load(component_path)
                    registered_component = ml_client.components.create_or_update(component)
                    logger.info(f"✓ Registered: {registered_component.name} (v{registered_component.version})")
                except Exception as e:
                    logger.error(f"Error registering component {component_path}: {e}")

def register_pipeline(ml_client, pipeline_script):
    """Register a pipeline from a Python script"""
    logger.info(f"Registering pipeline from {pipeline_script}")
    
    try:
        # Import the pipeline script dynamically
        import importlib.util
        spec = importlib.util.spec_from_file_location("pipeline_module", pipeline_script)
        pipeline_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(pipeline_module)
        
        # Create pipeline
        pipeline = pipeline_module.create_baseline_pipeline()
        
        # Register pipeline
        registered_pipeline = ml_client.components.create_or_update(pipeline)
        logger.info(f"✓ Registered: {registered_pipeline.name} (v{registered_pipeline.version})")
        
        return registered_pipeline
    except Exception as e:
        logger.error(f"Error registering pipeline {pipeline_script}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Register Azure ML resources for Project Scout")
    parser.add_argument("--subscription", required=True, help="Azure subscription ID")
    parser.add_argument("--resource-group", required=True, help="Azure resource group name")
    parser.add_argument("--workspace", required=True, help="Azure ML workspace name")
    parser.add_argument("--base-dir", required=True, help="Base directory for ML resources")
    
    args = parser.parse_args()
    
    logger.info("Connecting to Azure ML workspace")
    try:
        ml_client = MLClient(
            DefaultAzureCredential(),
            subscription_id=args.subscription,
            resource_group_name=args.resource_group,
            workspace_name=args.workspace
        )
    except Exception as e:
        logger.error(f"Error connecting to Azure ML workspace: {e}")
        sys.exit(1)
    
    # Register environments
    env_dir = os.path.join(args.base_dir, "environments")
    register_environments(ml_client, env_dir)
    
    # Register components
    components_dir = os.path.join(args.base_dir, "components")
    register_components(ml_client, components_dir)
    
    # Register pipelines
    pipeline_dir = os.path.join(args.base_dir, "pipelines")
    for pipeline_file in os.listdir(pipeline_dir):
        if pipeline_file.endswith(".py"):
            register_pipeline(ml_client, os.path.join(pipeline_dir, pipeline_file))
    
    logger.info("Resource registration complete")

if __name__ == "__main__":
    main()
EOF

# Register Azure ML resources
echo -e "\n${BLUE}Creating script to register all resources...${NC}"
cat > "${SCRIPT_DIR}/register-all.sh" << EOF
#!/bin/bash
# Register all Azure ML resources

# Set variables
SUBSCRIPTION_ID="$SUBSCRIPTION_ID"
RESOURCE_GROUP="$RESOURCE_GROUP"
WORKSPACE_NAME="$WORKSPACE_NAME"
BASE_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

# Register resources using Python script
python "\${BASE_DIR}/scripts/register_resources.py" \\
    --subscription "\$SUBSCRIPTION_ID" \\
    --resource-group "\$RESOURCE_GROUP" \\
    --workspace "\$WORKSPACE_NAME" \\
    --base-dir "\$BASE_DIR"

# Register environments directly with CLI
echo "Registering environments with Azure CLI..."
az ml environment create --file "\${BASE_DIR}/environments/baseline_env.yml" \\
    --resource-group "\$RESOURCE_GROUP" \\
    --workspace-name "\$WORKSPACE_NAME"

az ml environment create --file "\${BASE_DIR}/environments/advanced_env.yml" \\
    --resource-group "\$RESOURCE_GROUP" \\
    --workspace-name "\$WORKSPACE_NAME"

# Register brand detection component
echo "Registering brand detection component..."
az ml component create --file "\${BASE_DIR}/components/brand_detection/component.yaml" \\
    --resource-group "\$RESOURCE_GROUP" \\
    --workspace-name "\$WORKSPACE_NAME"

echo "Registration complete!"
EOF

chmod +x "${SCRIPT_DIR}/register-all.sh"

# Create a quick-start guide
cat > "${SCRIPT_DIR}/README.md" << EOF
# Project Scout Azure ML Resources

This directory contains Azure ML resources for operationalizing the Project Scout enrichment pipelines.

## Directory Structure

- **environments/**: Conda environment definitions for baseline and advanced pipelines
- **components/**: Reusable pipeline components
  - **brand_detection/**: Brand detection component
  - **sentiment_analysis/**: Sentiment analysis component
  - **intent_extraction/**: Intent extraction component
  - **spacy_context/**: SpaCy context extraction component
- **pipelines/**: Pipeline definitions
  - **baseline_pipeline.py**: Baseline enrichment pipeline
  - **advanced_pipeline.py**: Advanced enrichment pipeline with NLP
- **scripts/**: Utility scripts for registration and setup

## Quick Start

1. Run the setup script:
   ```bash
   ./register_azureml_resources.sh
   ```

2. Register all resources:
   ```bash
   cd ml-resources
   ./register-all.sh
   ```

3. Run a pipeline:
   ```bash
   az ml job create --file run_pipeline.yml --resource-group $RESOURCE_GROUP --workspace-name $WORKSPACE_NAME
   ```

## Pipeline Descriptions

### Baseline Enrichment Pipeline

This pipeline performs basic enrichment on transcription data:
- Brand mention detection
- Basic sentiment analysis
- Result export to SQL

### Advanced Enrichment Pipeline

This pipeline extends the baseline with advanced NLP capabilities:
- Entity recognition with SpaCy
- Intent classification
- Advanced sentiment analysis with transformers
- Result export to SQL with additional metadata

## Usage Notes

- Pipelines are designed to work with the standardized transcript field naming
- All components expect SalesInteractionTranscripts.ChunkText as the source field
- Results are stored in TranscriptEntityMentions table

## Monitoring and Management

Monitor pipeline runs in the Azure ML Studio UI or using the CLI:
```bash
az ml job list --resource-group $RESOURCE_GROUP --workspace-name $WORKSPACE_NAME
```

## Connections to Pulser Ecosystem

These pipelines integrate with the Pulser ecosystem:
- Standardized field naming from transcript_field_map.yaml
- Compatible with transcription data from Echo
- Enriched data available to Kalaw for knowledge integration
- Dashboard visualization in Superset
EOF

# Create a run configuration file for pipelines
cat > "${SCRIPT_DIR}/run_pipeline.yml" << EOF
$schema: https://azuremlschemas.azureedge.net/latest/pipelineJob.schema.json
type: pipeline

name: baseline_enrichment_run
display_name: Baseline Enrichment Pipeline Run
description: Runs the baseline enrichment pipeline for brand mention detection

experiment_name: brand_enrichment

compute: compute-projectscout

inputs:
  sql_server: "$SQL_SERVER"
  sql_database: "$SQL_DATABASE"
  sql_username: "$SQL_USERNAME"
  # Note: In production, use key vault for passwords
  sql_password: "$SQL_PASSWORD"
  min_confidence: 0.8

# Reference to the registered pipeline component
component: azureml:baseline_enrichment_pipeline@latest
EOF

# Create a scheduling script
cat > "${SCRIPT_DIR}/schedule_pipeline.sh" << EOF
#!/bin/bash
# Schedule pipeline to run on a regular basis

# Set variables
SUBSCRIPTION_ID="$SUBSCRIPTION_ID"
RESOURCE_GROUP="$RESOURCE_GROUP"
WORKSPACE_NAME="$WORKSPACE_NAME"
PIPELINE_NAME="baseline_enrichment_pipeline"

# Create schedule
echo "Creating schedule for \$PIPELINE_NAME..."
az ml schedule create \\
    --name "daily_enrichment" \\
    --display-name "Daily Enrichment Run" \\
    --description "Runs the baseline enrichment pipeline daily" \\
    --schedule-start "2025-05-12T00:00:00Z" \\
    --schedule-end "2026-05-12T00:00:00Z" \\
    --cron-expression "0 2 * * *" \\
    --time-zone "UTC" \\
    --resource-group "\$RESOURCE_GROUP" \\
    --workspace-name "\$WORKSPACE_NAME" \\
    --component "\$PIPELINE_NAME" \\
    --input sql_server="$SQL_SERVER" \\
    --input sql_database="$SQL_DATABASE" \\
    --input sql_username="$SQL_USERNAME" \\
    --input sql_password="$SQL_PASSWORD" \\
    --input min_confidence=0.8

echo "Schedule created successfully"
EOF

chmod +x "${SCRIPT_DIR}/schedule_pipeline.sh"

# Make scripts executable
chmod +x "${SCRIPT_DIR}/register-all.sh"

# Summary
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}   AZURE ML RESOURCE SETUP COMPLETE   ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "\n${BLUE}Created resources:${NC}"
echo -e "1. ${YELLOW}Environments:${NC} baseline_enrichment_env, advanced_enrichment_env"
echo -e "2. ${YELLOW}Components:${NC} brand_detection_component"
echo -e "3. ${YELLOW}Pipelines:${NC} baseline_enrichment_pipeline"
echo -e "4. ${YELLOW}Scripts:${NC} register-all.sh, schedule_pipeline.sh"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Edit configuration in ${SCRIPT_DIR}/register-all.sh if needed"
echo -e "2. Run: ${GREEN}cd ${SCRIPT_DIR} && ./register-all.sh${NC}"
echo -e "3. Run a pipeline job: ${GREEN}az ml job create --file ${SCRIPT_DIR}/run_pipeline.yml --resource-group $RESOURCE_GROUP --workspace-name $WORKSPACE_NAME${NC}"
echo -e "\n${BLUE}To schedule daily runs:${NC}"
echo -e "${GREEN}cd ${SCRIPT_DIR} && ./schedule_pipeline.sh${NC}"

echo -e "\n${CYAN}Documentation: ${SCRIPT_DIR}/README.md${NC}"
echo -e "${CYAN}===============================================${NC}"