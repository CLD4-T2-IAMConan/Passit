resource "helm_release" "grafana" {
  name             = "grafana"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "grafana"
  namespace        = kubernetes_namespace_v1.monitoring.metadata[0].name
  create_namespace = false

  version = "7.3.9"

  values = [
    templatefile(
      "${path.module}/values/grafana-values.yaml.tftpl",
      {
        grafana_irsa_role_arn = aws_iam_role.grafana.arn
      }
    ),
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
    kubernetes_namespace_v1.monitoring
  ]
}