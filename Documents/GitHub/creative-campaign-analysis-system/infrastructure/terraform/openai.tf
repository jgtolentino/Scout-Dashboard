# Azure OpenAI Service
resource "azurerm_cognitive_account" "creative_ai" {
  name                = "openai-creative-analysis"
  location            = azurerm_resource_group.creative_analysis.location
  resource_group_name = azurerm_resource_group.creative_analysis.name
  kind                = "OpenAI"
  sku_name           = "S0"
  
  custom_subdomain_name = "creative-ai"

  network_acls {
    default_action = "Deny"
    ip_rules       = [var.team_ip]
  }
}

# Deploy GPT-4 Turbo for creative analysis
resource "azurerm_cognitive_deployment" "gpt4_turbo" {
  name                 = "gpt-4-turbo"
  cognitive_account_id = azurerm_cognitive_account.creative_ai.id
  model {
    format  = "OpenAI"
    name    = "gpt-4-turbo"
    version = "1106-Preview"
  }
  scale {
    type     = "Standard"
    capacity = 20  # TPM: 20 tokens per minute
  }
} 