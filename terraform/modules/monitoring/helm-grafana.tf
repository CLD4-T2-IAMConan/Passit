resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace = var.monitoring_namespace

  version = "7.3.9"

  values = [
    file("${path.module}/grafana-values.yaml"),
    file("${path.module}/grafana-dashboards.yaml")
  ]

  ########################################
  # Admin credentials (from tfvars)
  ########################################
  set = [
    {
      name  = "adminUser"
      value = var.grafana_admin_user
    },
    {
      name  = "adminPassword"
      value = var.grafana_admin_password
    }
  ]


  depends_on = [
    helm_release.kube_prometheus_stack
  ]
}
