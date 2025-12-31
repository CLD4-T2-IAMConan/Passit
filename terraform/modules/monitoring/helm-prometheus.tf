resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  version = "58.6.0" # 안정 버전 (2025 기준)

  ########################################
  # values.yaml 사용
  ########################################
  values = [
    file("${path.module}/prometheus-values.yaml")
  ]

  depends_on = [
    kubernetes_namespace.monitoring
  ]
}