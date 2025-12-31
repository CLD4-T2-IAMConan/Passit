resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace = kubernetes_namespace_v1.monitoring.metadata[0].name
  create_namespace = false

  version = "58.6.0"

  ########################################
  # values.yaml 사용
  ########################################
  values = [
    file("${path.module}/prometheus-values.yaml")
  ]

  depends_on = [
    kubernetes_namespace_v1.monitoring
  ]
}