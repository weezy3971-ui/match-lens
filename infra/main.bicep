@description('Globally unique Azure Static Web App resource name.')
@minLength(1)
param staticWebAppName string

@description('Azure region supported by Static Web Apps.')
param location string = 'westeurope'

@description('Resource tags used for ownership and cost reporting.')
param tags object = {
  application: 'matchlens-4d'
  environment: 'production'
  dataClassification: 'synthetic-public'
}

resource web 'Microsoft.Web/staticSites@2025-03-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    publicNetworkAccess: 'Enabled'
    stagingEnvironmentPolicy: 'Disabled'
  }
}

output resourceId string = web.id
output defaultHostname string = web.properties.defaultHostname
