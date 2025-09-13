# Advanced Custom QA Bot Automation & DevOps Integration

This document outlines advanced automation strategies for Azure Language Studio QA bots, including CI/CD pipelines and DevOps practices.

## Table of Contents

1. [Overview](#overview)
2. [Advanced Automation Techniques](#advanced-automation-techniques)
3. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
4. [Infrastructure as Code (IaC)](#infrastructure-as-code-iac)
5. [Multi-Environment Deployment](#multi-environment-deployment)
6. [Monitoring and Performance](#monitoring-and-performance)

## Overview

While the Azure Language Studio UI provides the most user-friendly way to create Custom QA bots, organizations with advanced requirements may need more automated, repeatable processes for development, testing, and deployment.

## Advanced Automation Techniques

### REST API Automation (Included in Script)

The provided Python script (`advanced_qna_automation.py`) demonstrates:

- **Full Project Lifecycle Automation**: Creates projects, imports data, trains and deploys models
- **Error Handling**: Gracefully handles API limits and errors
- **Authentication**: Uses Azure SDK and Identity services for secure authentication
- **Integration Code Generation**: Creates sample code and testing commands

### Batch Processing for Large Datasets

For QA bots with thousands of questions:

```python
import pandas as pd
from concurrent.futures import ThreadPoolExecutor

# Load large dataset
df = pd.read_csv("large_dataset.csv", sep="\t")

# Process in parallel batches
def process_batch(batch_df):
    # Convert batch to QnA format and submit
    # API code here...
    pass

# Split dataframe into chunks of 50 rows
batches = [df[i:i+50] for i in range(0, len(df), 50)]

# Process batches in parallel (mind rate limits)
with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(process_batch, batches))
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow Example

Create a file in your repo at `.github/workflows/deploy-qna-bot.yml`:

```yaml
name: Deploy QnA Bot

on:
  push:
    branches: [ main ]
    paths:
      - 'qna-data/**'
  workflow_dispatch:  # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install azure-identity azure-mgmt-cognitiveservices requests
          
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          
      - name: Deploy QnA Bot
        run: python /advanced_qna_automation.py
        env:
          RESOURCE_GROUP: ${{ secrets.RESOURCE_GROUP }}
          LANGUAGE_RESOURCE: ${{ secrets.LANGUAGE_RESOURCE }}
```

### Azure DevOps Pipeline Example

```yaml
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - qna-data/**

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: '3.9'
    
- script: |
    python -m pip install --upgrade pip
    pip install azure-identity azure-mgmt-cognitiveservices requests
  displayName: 'Install dependencies'

- task: AzureCLI@2
  inputs:
    azureSubscription: 'Your-Azure-Connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: 'python /advanced_qna_automation.py'
  env:
    RESOURCE_GROUP: $(resourceGroup)
    LANGUAGE_RESOURCE: $(languageResource)
```

## Infrastructure as Code (IaC)

### Terraform Example for Language Resources

```hcl
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "qna_rg" {
  name     = "QnABotResourceGroup"
  location = "australiaeast"
}

resource "azurerm_cognitive_account" "qna_language" {
  name                = "retail-language-service"
  location            = azurerm_resource_group.qna_rg.location
  resource_group_name = azurerm_resource_group.qna_rg.name
  kind                = "TextAnalytics"
  sku_name            = "S0"
}

# Output variables for CI/CD pipeline
output "language_endpoint" {
  value = azurerm_cognitive_account.qna_language.endpoint
  sensitive = true
}

output "language_key" {
  value = azurerm_cognitive_account.qna_language.primary_access_key
  sensitive = true
}
```

### ARM Template Example

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "accountName": {
      "type": "string",
      "defaultValue": "retailLanguageService"
    },
    "location": {
      "type": "string",
      "defaultValue": "australiaeast"
    }
  },
  "resources": [
    {
      "type": "Microsoft.CognitiveServices/accounts",
      "apiVersion": "2022-03-01",
      "name": "[parameters('accountName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "S0"
      },
      "kind": "TextAnalytics",
      "properties": {
        "apiProperties": {
          "statisticsEnabled": false
        }
      }
    }
  ],
  "outputs": {
    "endpoint": {
      "type": "string",
      "value": "[reference(parameters('accountName')).endpoint]"
    }
  }
}
```

## Multi-Environment Deployment

### Environment Configuration Management

```python
# config.py
environments = {
    'dev': {
        'resource_group': 'QnABot-Dev-RG',
        'language_resource': 'retail-language-dev',
        'project_suffix': '-dev',
    },
    'test': {
        'resource_group': 'QnABot-Test-RG',
        'language_resource': 'retail-language-test',
        'project_suffix': '-test',
    },
    'prod': {
        'resource_group': 'QnABot-Prod-RG',
        'language_resource': 'retail-language-prod',
        'project_suffix': '',
    },
}

def get_config(env='dev'):
    return environments.get(env, environments['dev'])
```

### Promotion Workflow

1. **Development**: Create/update QA pairs in dev environment
2. **Testing**: Promote to test environment after validation
3. **Production**: Deploy to production after approval

```python
def promote_qna_content(source_env, target_env):
    # Export QA pairs from source environment
    source_config = get_config(source_env)
    source_data = export_qna_content(source_config)
    
    # Import to target environment
    target_config = get_config(target_env)
    import_qna_content(target_config, source_data)
    
    # Train and deploy in target environment
    train_and_deploy(target_config)
```

## Monitoring and Performance

### Application Insights Integration

```python
def setup_monitoring(resource_group, language_resource):
    # Create Application Insights resource
    insights_name = f"{language_resource}-insights"
    
    # Create the resource via Azure CLI
    os.system(f"az monitor app-insights component create "
              f"--app {insights_name} "
              f"--resource-group {resource_group} "
              f"--location {location}")
              
    # Link to Language resource
    # (Note: This requires additional steps through portal currently)
    print(f"Application Insights resource '{insights_name}' created")
    print("Please link this resource to your Language Service in Azure Portal")
    
    # Return connection string for client-side logging
    return os.popen(f"az monitor app-insights component show "
                   f"--app {insights_name} "
                   f"--resource-group {resource_group} "
                   f"--query connectionString").read().strip()
```

### Client-Side Telemetry

```javascript
// Add to your bot integration code
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'YOUR_CONNECTION_STRING',
        /* ...Other Application Insights options... */
    }
});
appInsights.loadAppInsights();

// Track bot interactions
async function askBot(question) {
    // Start tracking
    appInsights.trackEvent({name: "BotQuery", properties: {question: question}});
    const startTime = Date.now();
    
    try {
        // Your existing bot query code here
        const response = await fetch(endpoint, {...});
        const data = await response.json();
        
        // Track success and timing
        const duration = Date.now() - startTime;
        appInsights.trackMetric({name: "BotResponseTime", average: duration});
        appInsights.trackEvent({
            name: "BotResponse", 
            properties: {
                question: question,
                answer: data.answers[0].answer,
                confidence: data.answers[0].confidenceScore
            }
        });
        
        return data.answers[0].answer;
    } catch (error) {
        // Track failures
        appInsights.trackException({exception: error});
        return "Sorry, I couldn't process your question.";
    }
}
```