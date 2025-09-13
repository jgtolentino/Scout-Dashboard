/**
 * Variables for Scout System Azure Infrastructure
 */

variable "resource_group_name" {
  description = "Name of the resource group for Scout infrastructure"
  type        = string
  default     = "rg-scout-eventhub"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus2"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {
    Environment = "Production"
    Application = "ScoutRetailAdvisor"
    Project     = "ProjectScout"
    DeployedBy  = "Terraform"
  }
}

variable "pi_device_ips" {
  description = "List of IP addresses for Raspberry Pi devices to allow"
  type        = list(string)
  default     = []
}

variable "databricks_subnets" {
  description = "List of Databricks worker subnet IDs to allow"
  type        = list(string)
  default     = []
}