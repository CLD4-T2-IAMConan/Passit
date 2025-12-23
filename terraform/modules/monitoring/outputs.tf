# Monitoring Module Outputs

############################
# Amazon Managed Prometheus
############################

output "prometheus_workspace_arn" {
  description = "ARN of the Amazon Managed Prometheus workspace"
  value       = aws_prometheus_workspace.this.arn
}

output "prometheus_workspace_endpoint" {
  description = "Remote write endpoint for Amazon Managed Prometheus"
  value       = aws_prometheus_workspace.this.prometheus_endpoint
}

############################
# Prometheus IRSA (Ingest Role)
############################

output "prometheus_ingest_role_arn" {
  description = "IAM Role ARN used by ADOT Collector to write metrics to AMP (IRSA)"
  value       = aws_iam_role.amp_ingest.arn
}

############################
# ADOT Collector (Kubernetes)
############################

output "prometheus_namespace" {
  description = "Kubernetes namespace where ADOT Collector is deployed"
  value       = var.prometheus_namespace
}

output "prometheus_service_account_name" {
  description = "Kubernetes ServiceAccount name used by ADOT Collector"
  value       = var.prometheus_service_account_name
}

# ############################
# # Amazon Managed Grafana
# ############################
#
# output "grafana_workspace_id" {
#   description = "ID of the Amazon Managed Grafana workspace"
#   value       = aws_grafana_workspace.this.id
# }
#
output "grafana_workspace_endpoint" {
  description = "Endpoint URL of the Amazon Managed Grafana workspace"
  value       = aws_grafana_workspace.this.endpoint
}
#
# ############################
# # CloudWatch Logs
# ############################
#
# output "cloudwatch_log_retention_days" {
#   description = "CloudWatch Logs retention period (days)"
#   value       = var.log_retention_days
# }