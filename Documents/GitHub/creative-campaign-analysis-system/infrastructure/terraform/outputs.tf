output "resource_group_name" {
  value = azurerm_resource_group.creative_analysis.name
}

output "storage_account_name" {
  value = azurerm_storage_account.creative_data.name
}

output "openai_endpoint" {
  value = azurerm_cognitive_account.creative_ai.endpoint
}

output "databricks_workspace_url" {
  value = azurerm_databricks_workspace.creative_workspace.workspace_url
}

output "medallion_containers" {
  value = {
    raw    = azurerm_storage_container.raw.name
    bronze = azurerm_storage_container.bronze.name
    silver = azurerm_storage_container.silver.name
    gold   = azurerm_storage_container.gold.name
    ml     = azurerm_storage_container.ml_models.name
  }
} 