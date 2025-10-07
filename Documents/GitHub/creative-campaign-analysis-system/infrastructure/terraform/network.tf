# Virtual Network
resource "azurerm_virtual_network" "creative_vnet" {
  name                = "vnet-creative-analysis"
  resource_group_name = azurerm_resource_group.creative_analysis.name
  location            = azurerm_resource_group.creative_analysis.location
  address_space       = ["10.0.0.0/16"]
}

# Subnet for Databricks
resource "azurerm_subnet" "databricks" {
  name                 = "snet-databricks"
  resource_group_name  = azurerm_resource_group.creative_analysis.name
  virtual_network_name = azurerm_virtual_network.creative_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
  
  service_endpoints = [
    "Microsoft.Storage",
    "Microsoft.KeyVault",
    "Microsoft.ServiceBus"
  ]
}

# Private Endpoints
resource "azurerm_private_endpoint" "storage" {
  name                = "pe-storage"
  location            = azurerm_resource_group.creative_analysis.location
  resource_group_name = azurerm_resource_group.creative_analysis.name
  subnet_id           = azurerm_subnet.databricks.id

  private_service_connection {
    name                           = "psc-storage"
    private_connection_resource_id = azurerm_storage_account.creative_data.id
    is_manual_connection          = false
    subresource_names            = ["blob"]
  }
}

resource "azurerm_private_endpoint" "openai" {
  name                = "pe-openai"
  location            = azurerm_resource_group.creative_analysis.location
  resource_group_name = azurerm_resource_group.creative_analysis.name
  subnet_id           = azurerm_subnet.databricks.id

  private_service_connection {
    name                           = "psc-openai"
    private_connection_resource_id = azurerm_cognitive_account.creative_ai.id
    is_manual_connection          = false
    subresource_names            = ["account"]
  }
} 