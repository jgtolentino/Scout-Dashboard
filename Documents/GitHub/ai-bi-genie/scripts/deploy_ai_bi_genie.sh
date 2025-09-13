#!/bin/bash
set -euo pipefail

# AI-BI-Genie Deployment Script
# This script orchestrates the complete deployment of the AI-BI-Genie system
# including Azure resources, databases, microservices, and frontend applications

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-dev}"
AZURE_SUBSCRIPTION="${AZURE_SUBSCRIPTION:-}"
RESOURCE_GROUP="${RESOURCE_GROUP:-ai-bi-genie-rg}"
LOCATION="${LOCATION:-eastus}"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Function to print colored output
log() {
    local level=$1
    shift
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $*" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $*" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $*" ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for required tools
    command -v az >/dev/null 2>&1 || missing_tools+=("az (Azure CLI)")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v python3 >/dev/null 2>&1 || missing_tools+=("python3")
    command -v dotnet >/dev/null 2>&1 || missing_tools+=("dotnet")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        log "INFO" "Please install missing tools before proceeding"
        exit 1
    fi
    
    log "SUCCESS" "All prerequisites met"
}

# Function to setup Azure resources
setup_azure_resources() {
    log "INFO" "Setting up Azure resources..."
    
    # Login to Azure if not already logged in
    if ! az account show >/dev/null 2>&1; then
        log "INFO" "Please login to Azure..."
        az login
    fi
    
    # Set subscription
    if [ -n "$AZURE_SUBSCRIPTION" ]; then
        az account set --subscription "$AZURE_SUBSCRIPTION"
    fi
    
    # Create resource group
    log "INFO" "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" || true
    
    # Deploy infrastructure using Terraform
    log "INFO" "Deploying infrastructure with Terraform..."
    cd "$PROJECT_ROOT/infra/terraform"
    
    terraform init
    terraform plan -out=tfplan -var="resource_group_name=$RESOURCE_GROUP" -var="location=$LOCATION"
    terraform apply tfplan
    
    # Export outputs
    export STORAGE_ACCOUNT=$(terraform output -raw storage_account_name)
    export SQL_SERVER=$(terraform output -raw sql_server_name)
    export KEY_VAULT=$(terraform output -raw key_vault_name)
    export APP_INSIGHTS=$(terraform output -raw app_insights_name)
    export AKS_CLUSTER=$(terraform output -raw aks_cluster_name)
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Azure resources created successfully"
}

# Function to setup databases
setup_databases() {
    log "INFO" "Setting up databases..."
    
    # Get SQL connection string from Key Vault
    SQL_CONNECTION=$(az keyvault secret show --vault-name "$KEY_VAULT" --name "sql-connection-string" --query value -o tsv)
    
    # Run database migrations
    cd "$PROJECT_ROOT/database"
    
    for migration in migrations/*.sql; do
        log "INFO" "Running migration: $migration"
        sqlcmd -S "$SQL_SERVER.database.windows.net" -d "ai-bi-genie-db" -U "sqladmin" -P "$SQL_ADMIN_PASSWORD" -i "$migration"
    done
    
    # Create functions and procedures
    for func in functions/*.sql; do
        log "INFO" "Creating function: $func"
        sqlcmd -S "$SQL_SERVER.database.windows.net" -d "ai-bi-genie-db" -U "sqladmin" -P "$SQL_ADMIN_PASSWORD" -i "$func"
    done
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Database setup completed"
}

# Function to build and deploy microservices
deploy_microservices() {
    log "INFO" "Building and deploying microservices..."
    
    # Get AKS credentials
    az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$AKS_CLUSTER"
    
    # Build microservices
    cd "$PROJECT_ROOT/advisor-microservices"
    
    for service in */; do
        if [ -f "$service/Dockerfile" ]; then
            log "INFO" "Building microservice: $service"
            docker build -t "aibirgenie.azurecr.io/$service:$TIMESTAMP" "$service"
        fi
    done
    
    # Push to Azure Container Registry
    az acr login --name aibirgenie
    docker push "aibirgenie.azurecr.io/*:$TIMESTAMP"
    
    # Deploy to AKS
    kubectl apply -f "$PROJECT_ROOT/infra/kubernetes/"
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Microservices deployed successfully"
}

# Function to deploy Streamlit app
deploy_streamlit_app() {
    log "INFO" "Deploying Streamlit app..."
    
    cd "$PROJECT_ROOT/app"
    
    # Build Docker image
    docker build -t "aibirgenie.azurecr.io/streamlit-app:$TIMESTAMP" .
    docker push "aibirgenie.azurecr.io/streamlit-app:$TIMESTAMP"
    
    # Deploy to Azure App Service
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "ai-bi-genie-asp" \
        --name "ai-bi-genie-app" \
        --deployment-container-image-name "aibirgenie.azurecr.io/streamlit-app:$TIMESTAMP"
    
    # Configure app settings
    az webapp config appsettings set \
        --resource-group "$RESOURCE_GROUP" \
        --name "ai-bi-genie-app" \
        --settings \
        AZURE_SQL_CONNECTION_STRING="$SQL_CONNECTION" \
        AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
        APPLICATION_INSIGHTS_KEY="$APP_INSIGHTS_KEY"
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Streamlit app deployed successfully"
}

# Function to deploy Angular SPA
deploy_angular_spa() {
    log "INFO" "Building and deploying Angular SPA..."
    
    cd "$PROJECT_ROOT/azure-portal-spa"
    
    # Install dependencies and build
    npm install
    npm run build:prod
    
    # Deploy to Azure Static Web Apps
    az staticwebapp create \
        --name "ai-bi-genie-portal" \
        --resource-group "$RESOURCE_GROUP" \
        --source "." \
        --location "$LOCATION" \
        --branch "main" \
        --app-location "/" \
        --output-location "dist/azure-portal-spa" \
        --login-with-github
    
    cd "$PROJECT_ROOT"
    log "SUCCESS" "Angular SPA deployed successfully"
}

# Function to setup data pipelines
setup_data_pipelines() {
    log "INFO" "Setting up data pipelines..."
    
    # Deploy Databricks workspace
    az databricks workspace create \
        --resource-group "$RESOURCE_GROUP" \
        --name "ai-bi-genie-databricks" \
        --location "$LOCATION" \
        --sku standard
    
    # Upload notebooks
    databricks workspace import-dir \
        "$PROJECT_ROOT/notebooks" \
        "/ai-bi-genie/notebooks" \
        --overwrite
    
    # Create job clusters
    databricks jobs create --json-file "$PROJECT_ROOT/pipelines/databricks/job-cluster-config.json"
    
    log "SUCCESS" "Data pipelines configured successfully"
}

# Function to setup monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring and alerting..."
    
    # Deploy Prometheus and Grafana
    kubectl create namespace monitoring || true
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    helm install prometheus prometheus-community/prometheus \
        --namespace monitoring \
        --values "$PROJECT_ROOT/monitoring/prometheus/values.yaml"
    
    helm install grafana grafana/grafana \
        --namespace monitoring \
        --values "$PROJECT_ROOT/monitoring/grafana/values.yaml"
    
    # Import dashboards
    kubectl apply -f "$PROJECT_ROOT/monitoring/grafana/dashboards/"
    
    log "SUCCESS" "Monitoring setup completed"
}

# Function to validate deployment
validate_deployment() {
    log "INFO" "Validating deployment..."
    
    local errors=0
    
    # Check microservices health
    for service in AdvisorAPI ResourceGraphAPI MetricsAPI Gateway; do
        if ! kubectl get deployment "$service" -n default >/dev/null 2>&1; then
            log "ERROR" "Microservice $service not found"
            ((errors++))
        fi
    done
    
    # Check web apps
    APP_URL=$(az webapp show --name "ai-bi-genie-app" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv)
    if ! curl -s "https://$APP_URL" | grep -q "AI-BI Genie"; then
        log "ERROR" "Streamlit app not responding correctly"
        ((errors++))
    fi
    
    # Check database connectivity
    if ! sqlcmd -S "$SQL_SERVER.database.windows.net" -d "ai-bi-genie-db" -U "sqladmin" -P "$SQL_ADMIN_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then
        log "ERROR" "Database connection failed"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log "SUCCESS" "Deployment validation passed!"
        return 0
    else
        log "ERROR" "Deployment validation failed with $errors errors"
        return 1
    fi
}

# Function to generate deployment report
generate_deployment_report() {
    log "INFO" "Generating deployment report..."
    
    cat > "$PROJECT_ROOT/deployment-report-$TIMESTAMP.md" <<EOF
# AI-BI-Genie Deployment Report

**Deployment Date:** $(date)
**Environment:** $DEPLOYMENT_ENV
**Resource Group:** $RESOURCE_GROUP
**Location:** $LOCATION

## Deployed Resources

### Azure Resources
- Storage Account: $STORAGE_ACCOUNT
- SQL Server: $SQL_SERVER
- Key Vault: $KEY_VAULT
- Application Insights: $APP_INSIGHTS
- AKS Cluster: $AKS_CLUSTER

### Applications
- Streamlit App: https://$APP_URL
- Angular Portal: https://ai-bi-genie-portal.azurestaticapps.net
- API Gateway: https://ai-bi-genie-gateway.azurefd.net

### Microservices
- AdvisorAPI: Running on AKS
- ResourceGraphAPI: Running on AKS
- MetricsAPI: Running on AKS
- Gateway: Running on AKS

### Data Infrastructure
- Databricks Workspace: ai-bi-genie-databricks
- Data Lake: $STORAGE_ACCOUNT
- SQL Database: ai-bi-genie-db

### Monitoring
- Prometheus: http://prometheus.monitoring.svc.cluster.local:9090
- Grafana: http://grafana.monitoring.svc.cluster.local:3000

## Next Steps
1. Configure API Management policies
2. Set up automated backups
3. Configure autoscaling rules
4. Enable Azure AD authentication
5. Set up CI/CD pipelines

EOF
    
    log "SUCCESS" "Deployment report generated: deployment-report-$TIMESTAMP.md"
}

# Main deployment flow
main() {
    log "INFO" "Starting AI-BI-Genie deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Setup Azure resources
    setup_azure_resources
    
    # Setup databases
    setup_databases
    
    # Deploy microservices
    deploy_microservices
    
    # Deploy Streamlit app
    deploy_streamlit_app
    
    # Deploy Angular SPA
    deploy_angular_spa
    
    # Setup data pipelines
    setup_data_pipelines
    
    # Setup monitoring
    setup_monitoring
    
    # Validate deployment
    if validate_deployment; then
        generate_deployment_report
        log "SUCCESS" "AI-BI-Genie deployment completed successfully!"
        log "INFO" "Check deployment-report-$TIMESTAMP.md for details"
    else
        log "ERROR" "Deployment completed with errors. Please check the logs."
        exit 1
    fi
}

# Run main function
main "$@"