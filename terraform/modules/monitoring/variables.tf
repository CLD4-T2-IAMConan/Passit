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

variable "grafana_authentication_providers" {
  description = "Grafana authentication providers (e.g. AWS_SSO)"
  type        = list(string)
  default     = ["AWS_SSO"]
}

variable "grafana_admin_user" {
  type        = string
}

variable "grafana_admin_password" {
  type        = string
}

############################
# Fluent Bit
############################

variable "fluentbit_namespace" {
  description = "Kubernetes namespace for Fluent Bit"
  type        = string
  sensitive   = true
}

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
