#!/bin/bash

# Variables
RG="rg-client360-audit"
LOCATION="eastus"
ACR="acrclient360audit"
APP="app-client360-audit"

# 1. Create resource group
az group create -n $RG -l $LOCATION

# 2. Create ACR
az acr create -n $ACR -g $RG --sku Basic

# 3. Build & push Docker image
az acr build -t client360audit:latest --registry $ACR --image client360audit:latest .

# 4. Create App Service plan & Web App (Linux container)
az appservice plan create -n "${APP}-plan" -g $RG --is-linux --sku B1
az webapp create -n $APP -g $RG --plan "${APP}-plan" \
    --deployment-container-image-name "${ACR}.azurecr.io/client360audit:latest"

# 5. Configure ACR credentials
az webapp deployment container config --enable-cd true \
    --name $APP --resource-group $RG \
    --docker-registry-server-url "https://${ACR}.azurecr.io" \
    --docker-registry-server-user $(az acr credential show -n $ACR -g $RG --query "username" -o tsv) \
    --docker-registry-server-password $(az acr credential show -n $ACR -g $RG --query "passwords[0].value" -o tsv)

# 6. Browse
echo "https://${APP}.azurewebsites.net"