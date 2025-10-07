/**
 * Scout System Azure Event Hub Infrastructure as Code
 * Terraform configuration for deploying Event Hubs for Raspberry Pi edge devices
 */

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "scout_rg" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Event Hub Namespace
resource "azurerm_eventhub_namespace" "scout_namespace" {
  name                = "scout-eventhub-namespace"
  location            = azurerm_resource_group.scout_rg.location
  resource_group_name = azurerm_resource_group.scout_rg.name
  sku                 = "Standard"
  capacity            = 2
  auto_inflate_enabled = true
  maximum_throughput_units = 5
  tags                = var.tags
}

# Bronze Layer: Raw STT Event Hub
resource "azurerm_eventhub" "bronze_stt" {
  name                = "eh-pi-stt-raw"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = 4
  message_retention   = 3  # Days to retain messages
}

# Bronze Layer: Raw Visual Event Hub
resource "azurerm_eventhub" "bronze_visual" {
  name                = "eh-pi-visual-stream"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = 8  # More partitions for higher throughput
  message_retention   = 3  # Days to retain messages
}

# Silver Layer: Annotated Events Event Hub
resource "azurerm_eventhub" "silver_annotated" {
  name                = "eh-pi-annotated-events"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = 4
  message_retention   = 3  # Days to retain messages
}

# Silver Layer: Device Heartbeat Event Hub
resource "azurerm_eventhub" "silver_heartbeat" {
  name                = "eh-device-heartbeat"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = 2
  message_retention   = 3  # Days to retain messages
}

# Gold Layer: Insight Feedback Event Hub
resource "azurerm_eventhub" "gold_insight_feedback" {
  name                = "eh-insight-feedback"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  partition_count     = 4
  message_retention   = 7  # Retain feedback longer
}

# Consumer Group for Databricks DLT
resource "azurerm_eventhub_consumer_group" "dlt_consumer" {
  for_each            = toset([
    "bronze_stt", 
    "bronze_visual", 
    "silver_annotated", 
    "silver_heartbeat", 
    "gold_insight_feedback"
  ])
  name                = "scout-dlt-consumer"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key == "bronze_stt" ? azurerm_eventhub.bronze_stt.name :
                         each.key == "bronze_visual" ? azurerm_eventhub.bronze_visual.name :
                         each.key == "silver_annotated" ? azurerm_eventhub.silver_annotated.name :
                         each.key == "silver_heartbeat" ? azurerm_eventhub.silver_heartbeat.name :
                         azurerm_eventhub.gold_insight_feedback.name
  resource_group_name = azurerm_resource_group.scout_rg.name
}

# Event Hub Send Authorization Rule for Raspberry Pi devices
resource "azurerm_eventhub_authorization_rule" "pi_device_send" {
  for_each            = toset([
    "bronze_stt", 
    "bronze_visual", 
    "silver_annotated", 
    "silver_heartbeat"
  ])
  name                = "pi-device-send-rule"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key == "bronze_stt" ? azurerm_eventhub.bronze_stt.name :
                         each.key == "bronze_visual" ? azurerm_eventhub.bronze_visual.name :
                         each.key == "silver_annotated" ? azurerm_eventhub.silver_annotated.name :
                         azurerm_eventhub.silver_heartbeat.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  send                = true
  listen              = false
  manage              = false
}

# Event Hub Listen Authorization Rule for Databricks
resource "azurerm_eventhub_authorization_rule" "databricks_listen" {
  for_each            = toset([
    "bronze_stt", 
    "bronze_visual", 
    "silver_annotated", 
    "silver_heartbeat", 
    "gold_insight_feedback"
  ])
  name                = "databricks-listen-rule"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = each.key == "bronze_stt" ? azurerm_eventhub.bronze_stt.name :
                         each.key == "bronze_visual" ? azurerm_eventhub.bronze_visual.name :
                         each.key == "silver_annotated" ? azurerm_eventhub.silver_annotated.name :
                         each.key == "silver_heartbeat" ? azurerm_eventhub.silver_heartbeat.name :
                         azurerm_eventhub.gold_insight_feedback.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  send                = false
  listen              = true
  manage              = false
}

# Event Hub Send/Listen Rule for Advisor Dashboard (only for insight feedback)
resource "azurerm_eventhub_authorization_rule" "advisor_dashboard" {
  name                = "advisor-dashboard-rule"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  eventhub_name       = azurerm_eventhub.gold_insight_feedback.name
  resource_group_name = azurerm_resource_group.scout_rg.name
  send                = true
  listen              = true
  manage              = false
}

# Storage account for Event Hub capture
resource "azurerm_storage_account" "ehub_archive" {
  name                     = "scoutehubarchive${random_string.random.result}"
  resource_group_name      = azurerm_resource_group.scout_rg.name
  location                 = azurerm_resource_group.scout_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

resource "random_string" "random" {
  length  = 8
  special = false
  upper   = false
}

# Enable Archive/Capture for Bronze Event Hubs
resource "azurerm_eventhub_namespace_disaster_recovery_config" "bronze_capture" {
  for_each            = toset([
    "bronze_stt", 
    "bronze_visual"
  ])
  name                = "${each.key}-capture"
  namespace_name      = azurerm_eventhub_namespace.scout_namespace.name
  partner_namespace_id = azurerm_eventhub_namespace.scout_namespace.id
  eventhub_name       = each.key == "bronze_stt" ? azurerm_eventhub.bronze_stt.name :
                         azurerm_eventhub.bronze_visual.name
  blob_container_name = each.key == "bronze_stt" ? "stt-archive" : "visual-archive"
  storage_account_id  = azurerm_storage_account.ehub_archive.id
  archive_format      = "Avro"
  interval_in_seconds = 300
  size_limit_in_bytes = 314572800  # 300 MB
}

# Output important connection strings
output "eventhub_connection_string" {
  value       = azurerm_eventhub_namespace.scout_namespace.default_primary_connection_string
  description = "The primary connection string for the Event Hub Namespace"
  sensitive   = true
}

output "databricks_connection_strings" {
  value = {
    for key in ["bronze_stt", "bronze_visual", "silver_annotated", "silver_heartbeat", "gold_insight_feedback"] :
    key => lookup(
      {
        "bronze_stt"           = azurerm_eventhub_authorization_rule.databricks_listen["bronze_stt"].primary_connection_string
        "bronze_visual"        = azurerm_eventhub_authorization_rule.databricks_listen["bronze_visual"].primary_connection_string
        "silver_annotated"     = azurerm_eventhub_authorization_rule.databricks_listen["silver_annotated"].primary_connection_string
        "silver_heartbeat"     = azurerm_eventhub_authorization_rule.databricks_listen["silver_heartbeat"].primary_connection_string
        "gold_insight_feedback" = azurerm_eventhub_authorization_rule.databricks_listen["gold_insight_feedback"].primary_connection_string
      },
      key,
      null
    )
  }
  description = "Connection strings for Databricks to listen to each event hub"
  sensitive   = true
}

output "raspberry_pi_connection_strings" {
  value = {
    for key in ["bronze_stt", "bronze_visual", "silver_annotated", "silver_heartbeat"] :
    key => lookup(
      {
        "bronze_stt"           = azurerm_eventhub_authorization_rule.pi_device_send["bronze_stt"].primary_connection_string
        "bronze_visual"        = azurerm_eventhub_authorization_rule.pi_device_send["bronze_visual"].primary_connection_string
        "silver_annotated"     = azurerm_eventhub_authorization_rule.pi_device_send["silver_annotated"].primary_connection_string
        "silver_heartbeat"     = azurerm_eventhub_authorization_rule.pi_device_send["silver_heartbeat"].primary_connection_string
      },
      key,
      null
    )
  }
  description = "Connection strings for Raspberry Pi devices to send events to each event hub"
  sensitive   = true
}