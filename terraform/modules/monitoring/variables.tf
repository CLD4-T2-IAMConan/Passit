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
  type = string
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

variable "alarm_sns_topic_arn" {
  type        = string
  description = "SNS Topic ARN for Alertmanager notifications"
  default     = null
}

variable "alertmanager_role_arn" {
  type        = string
  description = "IAM Role ARN used by Alertmanager via IRSA"
  default     = null
}

############################
# Prometheus (AMP) & Workspace
############################

variable "prometheus_workspace_name" {
  description = "The name of the Amazon Managed Service for Prometheus workspace"
  type        = string
}

variable "prometheus_service_account_name" {
  type    = string
  default = "prometheus-agent"
}

variable "log_retention_days" {
  type = number
}

variable "application_error_threshold" {
  type = number
}

variable "prometheus_namespace" {
  description = "Namespace for Prometheus"
  type        = string
  default     = "monitoring"
}

############################
# Fluent Bit Extensions
############################

variable "fluentbit_service_account_name" {
  description = "Service account name for Fluent Bit"
  type        = string
  default     = "fluent-bit"
}

variable "fluentbit_chart_version" {
  description = "The version of the Fluent Bit Helm chart"
  type        = string
}

variable "fluentbit_timeout" {
  description = "Timeout in seconds for Fluent Bit Helm installation (default: 600 for dev, 1800 for prod)"
  type        = number
  default     = 600
}

variable "fluentbit_wait" {
  description = "Wait for Fluent Bit Helm installation to complete (default: false for dev, true for prod)"
  type        = bool
  default     = false
}

variable "enable_fluentbit" {
  description = "Enable Fluent Bit installation (Fargate에서는 DaemonSet을 지원하지 않으므로 false로 설정 권장)"
  type        = bool
  default     = false
}
