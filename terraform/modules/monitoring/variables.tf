############################################
# Common
############################################

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod, dr)"
  type        = string
}

############################################
# EKS
############################################

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "oidc_provider_arn" {
  type        = string
  description = "OIDC Provider ARN from EKS"
}

variable "oidc_provider_url" {
  type = string
}


variable "account_id" {
  type        = string
  description = "AWS Account ID"
}

variable "region" {
  type        = string
}

########################################
# Grafana Admin
########################################

variable "grafana_admin_user" {
  description = "Grafana admin username"
  type        = string
  sensitive   = true
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "grafana_authentication_providers" {
  description = "Grafana authentication providers (e.g. AWS_SSO)"
  type        = list(string)
  default     = ["AWS_SSO"]
}

variable "grafana_namespace" {
  type    = string
  default = "monitoring"
}

############################
# Fluent Bit
############################

variable "fluentbit_namespace" {
  description = "Namespace for Fluent Bit"
  type        = string
  default     = "logging"
}

variable "monitoring_namespace" {
  type        = string
  description = "Namespace for monitoring stack"
  default     = "monitoring"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "alertmanager_namespace" {
  type    = string
  default = "monitoring"
}




variable "prometheus_workspace_name" {
  type        = string
  description = "AMP workspace name"
}

variable "prometheus_namespace" {
  type        = string
  default     = "monitoring"
}

variable "prometheus_service_account_name" {
  type        = string
  default     = "prometheus-agent"
}

variable "log_retention_days" {
  type        = number
}

variable "application_error_threshold" {
  type        = number
}

