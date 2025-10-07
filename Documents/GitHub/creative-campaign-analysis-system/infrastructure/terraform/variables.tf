variable "team_ip" {
  description = "IP address of the team for network access"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "southeastasia"
}

variable "budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 5000
}

variable "notification_emails" {
  description = "List of email addresses for budget notifications"
  type        = list(string)
  default     = ["team@creative-analysis.com"]
} 