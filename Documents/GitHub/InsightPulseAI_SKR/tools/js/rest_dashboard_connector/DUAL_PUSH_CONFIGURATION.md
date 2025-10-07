# Dual Push Configuration for Dashboard Data

This document outlines the implementation of a dual push capability to ensure dashboard data is reliably synchronized across multiple storage locations and regions.

## Overview

The dual push configuration ensures that dashboard data processed through the Bronze/Silver/Gold pipeline is simultaneously pushed to:

1. Primary storage in the main production region
2. Secondary storage in a backup/disaster recovery region
3. Optional edge locations for improved performance in specific regions

This approach provides redundancy, improved availability, and better performance for globally distributed users.

## Architecture

```
                 ┌───────────────┐
                 │ Data Pipeline │
                 │ Orchestrator  │
                 └───────┬───────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Transaction Log       │
            │  (Write-Ahead Log)     │
            └────────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │      Synchronization Router    │
        └───┬─────────────┬──────────────┘
            │             │
  ┌─────────▼─────┐   ┌───▼────────────┐   ┌───────────────┐
  │ Primary Push  │   │ Secondary Push │   │ Edge Location │
  │ Handler       │   │ Handler        │   │ Push Handler  │
  └─────────┬─────┘   └─────────┬──────┘   └───────┬───────┘
            │                   │                  │
            ▼                   ▼                  ▼
  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
  │ Primary ADLS   │   │ Secondary ADLS │   │ Edge Storage   │
  │ Gold Container │   │ Gold Container │   │ Gold Container │
  └────────────────┘   └────────────────┘   └────────────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Verification Monitor │
                     └──────────────────────┘
```

## Implementation Components

### 1. Transaction Log System

```javascript
/**
 * Create transaction log entry for data push
 * @param {string} datasetId - Dataset identifier
 * @param {object} metadata - Dataset metadata
 * @returns {Promise<string>} - Transaction ID
 */
async function createTransactionLog(datasetId, metadata) {
  try {
    // Generate transaction ID
    const transactionId = `txn-${datasetId}-${Date.now()}`;
    
    // Create transaction log entry
    const transactionEntry = {
      id: transactionId,
      datasetId,
      metadata,
      status: 'pending',
      destinations: metadata.destinations || ['primary', 'secondary'],
      destinationStatus: {},
      createdAt: new Date().toISOString(),
      completedAt: null,
      retryCount: 0
    };
    
    // Initialize destination status
    transactionEntry.destinations.forEach(dest => {
      transactionEntry.destinationStatus[dest] = {
        status: 'pending',
        startedAt: null,
        completedAt: null,
        error: null
      };
    });
    
    // Store transaction log
    await storeTransactionLog(transactionId, transactionEntry);
    
    return transactionId;
  } catch (error) {
    console.error(`Error creating transaction log: ${error.message}`);
    throw error;
  }
}
```

### 2. Synchronization Router

```javascript
/**
 * Route data to multiple destinations
 * @param {string} transactionId - Transaction ID
 * @param {Buffer|string} data - Data to push
 * @param {object} options - Push options
 * @returns {Promise<object>} - Push results
 */
async function routeDataToDestinations(transactionId, data, options) {
  // Get transaction details
  const transaction = await getTransactionLog(transactionId);
  
  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }
  
  // Update transaction status
  await updateTransactionStatus(transactionId, 'in_progress');
  
  // Prepare push operations
  const pushOperations = transaction.destinations.map(async destination => {
    try {
      // Update destination status
      await updateDestinationStatus(transactionId, destination, 'in_progress');
      
      // Get destination configuration
      const destConfig = await getDestinationConfig(destination);
      
      // Push data to destination
      const result = await pushToDestination(destination, data, {
        ...options,
        ...destConfig
      });
      
      // Update destination status
      await updateDestinationStatus(transactionId, destination, 'completed', null, result);
      
      return {
        destination,
        success: true,
        result
      };
    } catch (error) {
      // Update destination status with error
      await updateDestinationStatus(transactionId, destination, 'failed', error.message);
      
      return {
        destination,
        success: false,
        error: error.message
      };
    }
  });
  
  // Execute push operations in parallel
  const results = await Promise.all(pushOperations);
  
  // Check if all destinations succeeded
  const allSucceeded = results.every(r => r.success);
  
  // Update transaction status
  await updateTransactionStatus(
    transactionId,
    allSucceeded ? 'completed' : 'partially_completed',
    results
  );
  
  return {
    transactionId,
    results,
    allSucceeded
  };
}
```

### 3. Push Handlers

#### Primary Storage Push Handler

```javascript
/**
 * Push data to primary storage
 * @param {string} destination - Destination identifier
 * @param {Buffer|string} data - Data to push
 * @param {object} options - Push options
 * @returns {Promise<object>} - Push result
 */
async function pushToPrimaryStorage(destination, data, options) {
  try {
    const {
      containerName = 'gold',
      blobPath,
      contentType,
      metadata
    } = options;
    
    // Get Azure credentials
    const credential = new DefaultAzureCredential();
    
    // Create blob service client
    const blobServiceClient = new BlobServiceClient(
      `https://${options.storageAccount}.blob.core.windows.net`,
      credential
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(blobPath);
    
    // Upload data
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      metadata
    };
    
    // Handle different data types
    let uploadResult;
    if (Buffer.isBuffer(data)) {
      uploadResult = await blobClient.upload(data, data.length, uploadOptions);
    } else if (typeof data === 'string') {
      uploadResult = await blobClient.upload(data, data.length, uploadOptions);
    } else {
      // Assume data is JSON
      const content = JSON.stringify(data);
      uploadResult = await blobClient.upload(content, content.length, {
        ...uploadOptions,
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
    }
    
    return {
      url: blobClient.url,
      etag: uploadResult.etag,
      contentMD5: uploadResult.contentMD5
    };
  } catch (error) {
    console.error(`Error pushing to primary storage: ${error.message}`);
    throw error;
  }
}
```

#### Secondary Storage Push Handler

```javascript
/**
 * Push data to secondary storage
 * @param {string} destination - Destination identifier
 * @param {Buffer|string} data - Data to push
 * @param {object} options - Push options
 * @returns {Promise<object>} - Push result
 */
async function pushToSecondaryStorage(destination, data, options) {
  try {
    const {
      containerName = 'gold',
      blobPath,
      contentType,
      metadata
    } = options;
    
    // Get Azure credentials
    const credential = new DefaultAzureCredential();
    
    // Create blob service client for secondary storage
    const blobServiceClient = new BlobServiceClient(
      `https://${options.storageAccount}.blob.core.windows.net`,
      credential
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(blobPath);
    
    // Upload data with same options as primary
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      metadata
    };
    
    // Handle different data types (same as primary)
    let uploadResult;
    if (Buffer.isBuffer(data)) {
      uploadResult = await blobClient.upload(data, data.length, uploadOptions);
    } else if (typeof data === 'string') {
      uploadResult = await blobClient.upload(data, data.length, uploadOptions);
    } else {
      // Assume data is JSON
      const content = JSON.stringify(data);
      uploadResult = await blobClient.upload(content, content.length, {
        ...uploadOptions,
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
    }
    
    return {
      url: blobClient.url,
      etag: uploadResult.etag,
      contentMD5: uploadResult.contentMD5
    };
  } catch (error) {
    console.error(`Error pushing to secondary storage: ${error.message}`);
    throw error;
  }
}
```

### 4. Verification System

```javascript
/**
 * Verify data consistency across destinations
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<object>} - Verification results
 */
async function verifyDataConsistency(transactionId) {
  try {
    // Get transaction details
    const transaction = await getTransactionLog(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    // Check if all destinations are completed
    const allCompleted = Object.values(transaction.destinationStatus)
      .every(ds => ds.status === 'completed');
    
    if (!allCompleted) {
      return {
        transactionId,
        verified: false,
        status: 'incomplete',
        message: 'Not all destinations have completed the push'
      };
    }
    
    // Get reference MD5 (from primary)
    const primaryStatus = transaction.destinationStatus.primary;
    const referenceMD5 = primaryStatus?.result?.contentMD5;
    
    if (!referenceMD5) {
      return {
        transactionId,
        verified: false,
        status: 'missing_reference',
        message: 'Missing reference MD5 from primary storage'
      };
    }
    
    // Check MD5 consistency across all destinations
    const verificationResults = {};
    let allConsistent = true;
    
    for (const [dest, status] of Object.entries(transaction.destinationStatus)) {
      if (dest === 'primary') continue; // Skip primary (it's our reference)
      
      const destMD5 = status?.result?.contentMD5;
      const isConsistent = destMD5 && destMD5 === referenceMD5;
      
      verificationResults[dest] = {
        verified: isConsistent,
        referenceMD5,
        actualMD5: destMD5
      };
      
      if (!isConsistent) {
        allConsistent = false;
      }
    }
    
    // Update transaction verification status
    await updateTransactionVerification(
      transactionId,
      allConsistent ? 'verified' : 'inconsistent',
      verificationResults
    );
    
    return {
      transactionId,
      verified: allConsistent,
      status: allConsistent ? 'verified' : 'inconsistent',
      results: verificationResults
    };
  } catch (error) {
    console.error(`Error verifying data consistency: ${error.message}`);
    
    // Update transaction verification status
    await updateTransactionVerification(
      transactionId,
      'verification_error',
      { error: error.message }
    );
    
    throw error;
  }
}
```

### 5. Retry Mechanism

```javascript
/**
 * Retry failed pushes
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<object>} - Retry results
 */
async function retryFailedPushes(transactionId) {
  try {
    // Get transaction details
    const transaction = await getTransactionLog(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    // Check retry count
    if (transaction.retryCount >= MAX_RETRIES) {
      return {
        transactionId,
        status: 'max_retries_exceeded',
        message: `Maximum retry count (${MAX_RETRIES}) exceeded`
      };
    }
    
    // Find failed destinations
    const failedDestinations = [];
    for (const [dest, status] of Object.entries(transaction.destinationStatus)) {
      if (status.status === 'failed') {
        failedDestinations.push(dest);
      }
    }
    
    if (failedDestinations.length === 0) {
      return {
        transactionId,
        status: 'no_failed_destinations',
        message: 'No failed destinations to retry'
      };
    }
    
    // Retrieve data from successful destination
    const successfulDest = Object.entries(transaction.destinationStatus)
      .find(([, status]) => status.status === 'completed');
    
    if (!successfulDest) {
      return {
        transactionId,
        status: 'no_successful_destinations',
        message: 'No successful destinations to retrieve data from'
      };
    }
    
    const [successDestName, successDestStatus] = successfulDest;
    
    // Get data from successful destination
    const sourceData = await retrieveDataFromDestination(
      successDestName,
      transaction.datasetId,
      transaction.metadata
    );
    
    // Retry push to failed destinations
    const retryResults = await Promise.all(
      failedDestinations.map(async dest => {
        try {
          // Get destination configuration
          const destConfig = await getDestinationConfig(dest);
          
          // Push data to destination
          const result = await pushToDestination(dest, sourceData, {
            ...transaction.metadata,
            ...destConfig
          });
          
          // Update destination status
          await updateDestinationStatus(transactionId, dest, 'completed', null, result);
          
          return {
            destination: dest,
            success: true,
            result
          };
        } catch (error) {
          // Update destination status with error
          await updateDestinationStatus(transactionId, dest, 'failed', error.message);
          
          return {
            destination: dest,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    // Increment retry count
    await incrementRetryCount(transactionId);
    
    // Check if all retries succeeded
    const allSucceeded = retryResults.every(r => r.success);
    
    // Update transaction status
    const newStatus = allSucceeded ? 'completed' : 'partially_completed';
    await updateTransactionStatus(transactionId, newStatus, retryResults);
    
    return {
      transactionId,
      status: newStatus,
      retried: failedDestinations,
      results: retryResults
    };
  } catch (error) {
    console.error(`Error retrying failed pushes: ${error.message}`);
    throw error;
  }
}
```

## Configuration

### Primary Storage Configuration

```json
{
  "destination": "primary",
  "storageAccount": "goldstorageeast2",
  "containerName": "gold",
  "region": "eastus2",
  "priority": 1,
  "required": true,
  "timeout": 60000
}
```

### Secondary Storage Configuration

```json
{
  "destination": "secondary",
  "storageAccount": "goldstoragewest2",
  "containerName": "gold",
  "region": "westus2",
  "priority": 2,
  "required": true,
  "timeout": 60000
}
```

### Edge Location Configuration (Optional)

```json
{
  "destination": "edge-asia",
  "storageAccount": "goldstorageasia",
  "containerName": "gold",
  "region": "southeastasia",
  "priority": 3,
  "required": false,
  "timeout": 120000
}
```

## Dashboard Data Flow Integration

### Connection String Configuration

The dashboard connection module automatically detects and configures multiple backends:

```javascript
// Multi-region connection configuration
const dataConnections = {
  primary: {
    endpoint: `https://goldstorageeast2.dfs.core.windows.net/gold`,
    region: 'eastus2',
    status: 'active'
  },
  secondary: {
    endpoint: `https://goldstoragewest2.dfs.core.windows.net/gold`,
    region: 'westus2',
    status: 'active'
  }
};

// Automatic failover mechanism
let currentConnection = 'primary';

// Check connection health
async function checkConnectionHealth() {
  try {
    // Check primary connection
    const primaryHealth = await checkEndpointHealth(dataConnections.primary.endpoint);
    dataConnections.primary.status = primaryHealth.healthy ? 'active' : 'unhealthy';
    
    // Check secondary connection
    const secondaryHealth = await checkEndpointHealth(dataConnections.secondary.endpoint);
    dataConnections.secondary.status = secondaryHealth.healthy ? 'active' : 'unhealthy';
    
    // Select best connection
    if (dataConnections[currentConnection].status !== 'active') {
      // Current connection is unhealthy, try to switch
      const newConnection = currentConnection === 'primary' ? 'secondary' : 'primary';
      
      if (dataConnections[newConnection].status === 'active') {
        // Switch to healthy connection
        currentConnection = newConnection;
        console.log(`Switched to ${currentConnection} connection`);
      }
    }
    
    return {
      connections: dataConnections,
      current: currentConnection
    };
  } catch (error) {
    console.error(`Error checking connection health: ${error.message}`);
    return {
      connections: dataConnections,
      current: currentConnection,
      error: error.message
    };
  }
}
```

### Dashboard Adapter Integration

```javascript
/**
 * Get dashboard data with automatic failover
 * @param {string} dataPath - Path to data in storage
 * @returns {Promise<object>} - Dashboard data
 */
async function getDashboardData(dataPath) {
  // Start with current preferred connection
  let connection = currentConnection;
  let attempts = 0;
  const maxAttempts = Object.keys(dataConnections).length;
  
  while (attempts < maxAttempts) {
    try {
      // Get connection config
      const connConfig = dataConnections[connection];
      
      if (connConfig.status !== 'active') {
        // Try next connection
        connection = getNextConnection(connection);
        attempts++;
        continue;
      }
      
      // Fetch data from the connection
      const data = await fetchDataFromEndpoint(`${connConfig.endpoint}/${dataPath}`);
      
      // Return data with connection info
      return {
        data,
        source: connection,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching from ${connection}: ${error.message}`);
      
      // Mark connection as unhealthy
      dataConnections[connection].status = 'unhealthy';
      
      // Try next connection
      connection = getNextConnection(connection);
      attempts++;
    }
  }
  
  // All connections failed
  throw new Error(`Failed to fetch data after trying all connections`);
}

/**
 * Get next connection in rotation
 * @param {string} currentConn - Current connection
 * @returns {string} - Next connection
 */
function getNextConnection(currentConn) {
  const connections = Object.keys(dataConnections);
  const currentIndex = connections.indexOf(currentConn);
  const nextIndex = (currentIndex + 1) % connections.length;
  return connections[nextIndex];
}
```

## Monitoring and Alerting

### Health Check System

```javascript
/**
 * Comprehensive health check for dual push system
 * @returns {Promise<object>} - Health status
 */
async function dualPushHealthCheck() {
  try {
    // Check primary storage
    const primaryHealth = await checkStorageHealth('primary');
    
    // Check secondary storage
    const secondaryHealth = await checkStorageHealth('secondary');
    
    // Check transaction log system
    const transactionLogHealth = await checkTransactionLogHealth();
    
    // Check synchronization router
    const routerHealth = await checkRouterHealth();
    
    // Check verification system
    const verificationHealth = await checkVerificationHealth();
    
    // Calculate overall health
    const allHealthy = [
      primaryHealth.healthy,
      secondaryHealth.healthy,
      transactionLogHealth.healthy,
      routerHealth.healthy,
      verificationHealth.healthy
    ].every(Boolean);
    
    // Get recent transactions stats
    const transactionStats = await getRecentTransactionStats();
    
    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      components: {
        primaryStorage: primaryHealth,
        secondaryStorage: secondaryHealth,
        transactionLog: transactionLogHealth,
        synchronizationRouter: routerHealth,
        verificationSystem: verificationHealth
      },
      stats: transactionStats
    };
  } catch (error) {
    console.error(`Health check error: ${error.message}`);
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}
```

### Alert System

```javascript
/**
 * Create alert for dual push issues
 * @param {string} alertType - Type of alert
 * @param {object} data - Alert data
 * @returns {Promise<object>} - Alert result
 */
async function createDualPushAlert(alertType, data) {
  try {
    // Generate alert ID
    const alertId = `alert-${alertType}-${Date.now()}`;
    
    // Create alert
    const alert = {
      id: alertId,
      type: alertType,
      severity: getSeverityForAlertType(alertType),
      data,
      timestamp: new Date().toISOString(),
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null
    };
    
    // Store alert
    await storeAlert(alertId, alert);
    
    // Send notifications based on severity
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await sendAlertNotifications(alert);
    }
    
    return {
      alertId,
      created: true
    };
  } catch (error) {
    console.error(`Error creating alert: ${error.message}`);
    throw error;
  }
}

/**
 * Get severity level for alert type
 * @param {string} alertType - Alert type
 * @returns {string} - Severity level
 */
function getSeverityForAlertType(alertType) {
  const severityMap = {
    'push_failure': 'high',
    'verification_failure': 'high',
    'data_inconsistency': 'critical',
    'connection_failure': 'high',
    'retry_failure': 'medium',
    'performance_degradation': 'low'
  };
  
  return severityMap[alertType] || 'medium';
}
```

## Azure Implementation

### Deploy Script for Dual Push Configuration

```bash
#!/bin/bash
# deploy-dual-push.sh
# Deploys dual push configuration for dashboard data

set -e

# Configuration
PRIMARY_RESOURCE_GROUP="data-primary-rg"
SECONDARY_RESOURCE_GROUP="data-secondary-rg"
PRIMARY_LOCATION="eastus2"
SECONDARY_LOCATION="westus2"
PRIMARY_STORAGE_ACCOUNT="goldstorageeast2"
SECONDARY_STORAGE_ACCOUNT="goldstoragewest2"
CONTAINER_NAME="gold"

# Function App
FUNCTION_APP_NAME="dual-push-orchestrator"
FUNCTION_APP_PLAN="dual-push-plan"

# Create resource groups
echo "Creating resource groups..."
az group create --name $PRIMARY_RESOURCE_GROUP --location $PRIMARY_LOCATION
az group create --name $SECONDARY_RESOURCE_GROUP --location $SECONDARY_LOCATION

# Create storage accounts
echo "Creating primary storage account..."
az storage account create \
  --name $PRIMARY_STORAGE_ACCOUNT \
  --resource-group $PRIMARY_RESOURCE_GROUP \
  --location $PRIMARY_LOCATION \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --enable-hierarchical-namespace true

echo "Creating secondary storage account..."
az storage account create \
  --name $SECONDARY_STORAGE_ACCOUNT \
  --resource-group $SECONDARY_RESOURCE_GROUP \
  --location $SECONDARY_LOCATION \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --enable-hierarchical-namespace true

# Create containers
echo "Creating containers..."
az storage container create --name $CONTAINER_NAME --account-name $PRIMARY_STORAGE_ACCOUNT
az storage container create --name $CONTAINER_NAME --account-name $SECONDARY_STORAGE_ACCOUNT

# Create transaction log storage table
echo "Creating transaction log table..."
az storage table create --name "dualpushtransactions" --account-name $PRIMARY_STORAGE_ACCOUNT

# Create Function App
echo "Creating Function App Plan..."
az functionapp plan create \
  --name $FUNCTION_APP_PLAN \
  --resource-group $PRIMARY_RESOURCE_GROUP \
  --location $PRIMARY_LOCATION \
  --sku EP1

echo "Creating Function App..."
az functionapp create \
  --name $FUNCTION_APP_NAME \
  --resource-group $PRIMARY_RESOURCE_GROUP \
  --plan $FUNCTION_APP_PLAN \
  --storage-account $PRIMARY_STORAGE_ACCOUNT \
  --runtime node

# Assign identities and permissions
echo "Configuring managed identity..."
az functionapp identity assign \
  --name $FUNCTION_APP_NAME \
  --resource-group $PRIMARY_RESOURCE_GROUP

# Get function app identity
FUNCTION_ID=$(az functionapp identity show \
  --name $FUNCTION_APP_NAME \
  --resource-group $PRIMARY_RESOURCE_GROUP \
  --query principalId -o tsv)

# Assign roles to primary storage
echo "Assigning roles for primary storage..."
az role assignment create \
  --assignee $FUNCTION_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$PRIMARY_RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$PRIMARY_STORAGE_ACCOUNT"

az role assignment create \
  --assignee $FUNCTION_ID \
  --role "Storage Table Data Contributor" \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$PRIMARY_RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$PRIMARY_STORAGE_ACCOUNT"

# Assign roles to secondary storage
echo "Assigning roles for secondary storage..."
az role assignment create \
  --assignee $FUNCTION_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$SECONDARY_RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$SECONDARY_STORAGE_ACCOUNT"

# Configure Function App settings
echo "Configuring Function App settings..."
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $PRIMARY_RESOURCE_GROUP \
  --settings \
  "PRIMARY_STORAGE_ACCOUNT=$PRIMARY_STORAGE_ACCOUNT" \
  "SECONDARY_STORAGE_ACCOUNT=$SECONDARY_STORAGE_ACCOUNT" \
  "CONTAINER_NAME=$CONTAINER_NAME" \
  "TRANSACTION_TABLE_NAME=dualpushtransactions" \
  "MAX_RETRIES=3" \
  "VERIFICATION_ENABLED=true"

echo "Dual push configuration deployed successfully!"
```

## Dashboard Client Integration

To ensure the dashboard can read from multiple locations with automatic failover:

```javascript
// dashboard-client.js
const DEFAULT_RETRY_ATTEMPTS = 3;
const CONNECTION_TIMEOUT = 10000;

/**
 * Initialize dashboard data client with failover capability
 * @param {object} options - Client options
 * @returns {object} - Client API
 */
function initDashboardClient(options = {}) {
  // Default options
  const config = {
    endpoints: [
      {
        id: 'primary',
        url: 'https://goldstorageeast2.dfs.core.windows.net/gold',
        region: 'eastus2',
        isActive: true
      },
      {
        id: 'secondary',
        url: 'https://goldstoragewest2.dfs.core.windows.net/gold',
        region: 'westus2',
        isActive: true
      }
    ],
    retryAttempts: DEFAULT_RETRY_ATTEMPTS,
    autoFailover: true,
    ...options
  };
  
  // Track endpoint health
  let endpointHealth = {};
  
  // Initialize endpoint health
  config.endpoints.forEach(endpoint => {
    endpointHealth[endpoint.id] = {
      lastChecked: null,
      isHealthy: true,
      responseTime: 0,
      failureCount: 0
    };
  });
  
  // Get best endpoint based on health and configuration
  function getBestEndpoint() {
    // Filter to active and healthy endpoints
    const availableEndpoints = config.endpoints.filter(endpoint => 
      endpoint.isActive && endpointHealth[endpoint.id].isHealthy
    );
    
    if (availableEndpoints.length === 0) {
      // All endpoints unhealthy, try any active endpoint
      return config.endpoints.find(endpoint => endpoint.isActive);
    }
    
    // Sort by response time
    availableEndpoints.sort((a, b) => 
      endpointHealth[a.id].responseTime - endpointHealth[b.id].responseTime
    );
    
    return availableEndpoints[0];
  }
  
  // Fetch data with automatic retry and failover
  async function fetchDataWithFailover(path) {
    let attempts = 0;
    let errors = [];
    
    while (attempts < config.retryAttempts) {
      const endpoint = getBestEndpoint();
      
      if (!endpoint) {
        throw new Error('No available endpoints');
      }
      
      try {
        const startTime = Date.now();
        
        // Fetch with timeout
        const response = await Promise.race([
          fetch(`${endpoint.url}/${path}`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), CONNECTION_TIMEOUT)
          )
        ]);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Update endpoint health
        endpointHealth[endpoint.id] = {
          lastChecked: new Date().toISOString(),
          isHealthy: true,
          responseTime,
          failureCount: 0
        };
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
          data,
          source: endpoint.id,
          responseTime
        };
      } catch (error) {
        console.error(`Error fetching from ${endpoint.id}: ${error.message}`);
        
        // Update endpoint health
        endpointHealth[endpoint.id] = {
          ...endpointHealth[endpoint.id],
          lastChecked: new Date().toISOString(),
          isHealthy: false,
          failureCount: (endpointHealth[endpoint.id].failureCount || 0) + 1
        };
        
        errors.push({
          endpoint: endpoint.id,
          error: error.message
        });
        
        attempts++;
      }
    }
    
    throw new Error(`All endpoints failed after ${attempts} attempts: ${JSON.stringify(errors)}`);
  }
  
  // Check health of all endpoints
  async function checkAllEndpoints() {
    const results = {};
    
    await Promise.all(config.endpoints.map(async endpoint => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${endpoint.url}/_health`);
        const endTime = Date.now();
        
        results[endpoint.id] = {
          isHealthy: response.ok,
          responseTime: endTime - startTime,
          lastChecked: new Date().toISOString()
        };
        
        // Update endpoint health
        endpointHealth[endpoint.id] = {
          ...endpointHealth[endpoint.id],
          ...results[endpoint.id],
          failureCount: response.ok ? 0 : (endpointHealth[endpoint.id].failureCount || 0) + 1
        };
      } catch (error) {
        results[endpoint.id] = {
          isHealthy: false,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
        
        // Update endpoint health
        endpointHealth[endpoint.id] = {
          ...endpointHealth[endpoint.id],
          isHealthy: false,
          lastChecked: new Date().toISOString(),
          failureCount: (endpointHealth[endpoint.id].failureCount || 0) + 1
        };
      }
    }));
    
    return results;
  }
  
  // Public API
  return {
    fetchData: fetchDataWithFailover,
    checkHealth: checkAllEndpoints,
    getEndpointHealth: () => endpointHealth,
    setEndpointActive: (endpointId, isActive) => {
      const endpoint = config.endpoints.find(e => e.id === endpointId);
      if (endpoint) {
        endpoint.isActive = isActive;
        return true;
      }
      return false;
    }
  };
}
```

## Best Practices

1. **Transaction Safety**
   - Always use the transaction log system for all data operations
   - Verify all data operations are completed successfully
   - Implement comprehensive retry logic

2. **Performance Optimization**
   - Use parallel push operations to minimize latency
   - Implement client-side routing to closest endpoint
   - Use appropriate storage tier based on access patterns

3. **Monitoring and Alerting**
   - Monitor data consistency across all endpoints
   - Set up alerts for push failures
   - Track performance metrics for each endpoint

4. **Security Considerations**
   - Use managed identities for authentication
   - Implement least privilege access
   - Encrypt data in transit and at rest

5. **Disaster Recovery**
   - Test failover scenarios regularly
   - Implement automated recovery procedures
   - Document manual recovery processes

## Conclusion

This dual push configuration ensures high availability and data consistency for dashboard data across multiple storage locations. By implementing transaction logging, verification, and automatic failover, the system provides reliable access to data even in the event of regional outages or service disruptions.

With proper monitoring and alerting, any issues in the data replication process can be quickly identified and resolved, minimizing impact on dashboard users.

The implementation follows Azure best practices for multi-region deployments and integrates seamlessly with the existing Bronze/Silver/Gold data processing pipeline.