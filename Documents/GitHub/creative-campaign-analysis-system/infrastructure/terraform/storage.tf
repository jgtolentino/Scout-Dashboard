# Azure Data Lake Storage (ADLS2)
resource "azurerm_storage_account" "creative_data" {
  name                     = "stcreative${random_id.suffix.hex}"
  resource_group_name      = azurerm_resource_group.creative_analysis.name
  location                 = azurerm_resource_group.creative_analysis.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  account_kind             = "StorageV2"
  is_hns_enabled          = true  # Enable hierarchical namespace

  network_rules {
    default_action = "Deny"
    ip_rules       = [var.team_ip]
  }
}

# Medallion architecture containers
resource "azurerm_storage_container" "raw" {
  name                  = "raw"
  storage_account_name  = azurerm_storage_account.creative_data.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "bronze" {
  name                  = "bronze"
  storage_account_name  = azurerm_storage_account.creative_data.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "silver" {
  name                  = "silver"
  storage_account_name  = azurerm_storage_account.creative_data.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "gold" {
  name                  = "gold"
  storage_account_name  = azurerm_storage_account.creative_data.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "ml_models" {
  name                  = "ml-models"
  storage_account_name  = azurerm_storage_account.creative_data.name
  container_access_type = "private"
} 