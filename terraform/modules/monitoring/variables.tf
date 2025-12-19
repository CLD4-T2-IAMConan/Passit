# Monitoring Module Variables

############################
# Common / AWS
############################

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, prod, dr)"
  type        = string
}

############################
# EKS
############################

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  type        = string
}

############################
# CloudWatch Logs
############################

variable "log_retention_days" {
  description = "CloudWatch Logs retention period (days)"
  type        = number
  default     = 7
}

############################
# Prometheus (AMP)
############################

variable "prometheus_workspace_name" {
  description = "Amazon Managed Service for Prometheus workspace name"
  type        = string
}

############################
# Prometheus Ingest (IRSA 대상 ServiceAccount)
############################

variable "prometheus_namespace" {
  description = "Kubernetes namespace where the metrics collector/agent runs (for IRSA binding)"
  type        = string
  default     = "monitoring"
}

variable "prometheus_service_account_name" {
  description = "Kubernetes ServiceAccount name used by the metrics collector/agent (for IRSA binding)"
  type        = string
  default     = "amp-ingest-sa"
}


############################
# Grafana (AMG)
############################

variable "grafana_workspace_name" {
  description = "Amazon Managed Grafana workspace name"
  type        = string
}

variable "grafana_authentication_providers" {
  description = "Grafana authentication providers (e.g. AWS_SSO)"
  type        = list(string)
  default     = ["AWS_SSO"]
}

############################
# Fluent Bit
############################

variable "fluentbit_namespace" {
  description = "Kubernetes namespace for Fluent Bit"
  type        = string
  default     = "kube-system"
}

variable "fluentbit_chart_version" {
  description = "Helm chart version for Fluent Bit"
  type        = string
  default     = "0.47.10"
}

variable "fluentbit_service_account_name" {
  description = "Kubernetes ServiceAccount name for Fluent Bit (IRSA binding)"
  type        = string
  default     = "fluent-bit-sa"
}


############################
# Tags
############################

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
