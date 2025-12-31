############################################
# Prometheus (kube-prometheus-stack)
############################################

output "prometheus_service_name" {
  description = "Prometheus Service name (kube-prometheus-stack)"
  value       = "kube-prometheus-stack-prometheus"
}

output "prometheus_namespace" {
  description = "Namespace where Prometheus is deployed"
  value       = "monitoring"
}

output "prometheus_service_url" {
  description = "Prometheus in-cluster service URL"
  value       = "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090"
}
