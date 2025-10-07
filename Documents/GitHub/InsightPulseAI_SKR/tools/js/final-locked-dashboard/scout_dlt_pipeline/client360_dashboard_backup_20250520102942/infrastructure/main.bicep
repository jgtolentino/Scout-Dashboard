// infrastructure/main.bicep
param location string = resourceGroup().location
param staticAppName string = 'tbwa-client360-dashboard-production'
param skuName string = 'Standard'

resource client360 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticAppName
  location: location
  sku: {
    name: skuName
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: 'https://github.com/TBWA/InsightPulseAI_SKR'
    branch: 'main'
    buildProperties: {
      appLocation: 'client360'
      apiLocation: ''
      outputLocation: 'build'
    }
  }
}

output endpoint string = client360.properties.defaultHostname