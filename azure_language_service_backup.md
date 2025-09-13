# Azure Language Service Backup Information

## Resource Details (DELETED)
- **Resource Name**: LanguageService
- **Resource Group**: LanguageResourceGroup
- **Location**: australiaeast
- **Original SKU**: S (Standard)
- **Final SKU**: F0 (Free)
- **Kind**: TextAnalytics
- **Status**: DELETED on April 18, 2025

## Authentication Keys (INACTIVE)
- **Key1**: e14fda2b966d4aa6b33c074b2030fd5a
- **Key2**: fbef402a82994c51bd014e27851dd09e

## CLU Training Data
- **Local file**: `/Users/tbwa/Downloads/clu_training_data_task7p.json`
- **Project Name**: Task7P

## Recreation Instructions
If you need to recreate this service:

```bash
# Create new resource group if needed
az group create --name LanguageResourceGroup --location australiaeast

# Create Language Service (Free tier)
az cognitiveservices account create --name LanguageService --resource-group LanguageResourceGroup --kind TextAnalytics --sku F0 --location australiaeast

# If needed, upgrade to Standard tier
# az cognitiveservices account update --name LanguageService --resource-group LanguageResourceGroup --sku S
```

## Import CLU Training Data
After creating the service, you can import the training data using:
1. Go to Language Studio (https://language.cognitive.azure.com/)
2. Create a new CLU project
3. Import the JSON file from `/Users/tbwa/Downloads/clu_training_data_task7p.json`

## Cost Information
- F0 (Free tier): 5,000 transactions/month free
- S (Standard tier): 100,000 transactions/month ($75/month)