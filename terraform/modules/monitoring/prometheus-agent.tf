############################
# Kubernetes Namespace
############################

resource "kubernetes_namespace_v1" "monitoring" {
  metadata {
    name = var.prometheus_namespace
  }
}

############################
# Kubernetes ServiceAccount (IRSA 대상)
############################

resource "kubernetes_service_account_v1" "adot" {
  metadata {
    name      = var.prometheus_service_account_name
    namespace = kubernetes_namespace_v1.monitoring.metadata[0].name

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.amp_ingest.arn
    }
  }
}

############################
# ADOT Collector Helm Release
############################

resource "helm_release" "adot_collector" {
  name       = "adot-collector"
  repository = "https://aws-observability.github.io/aws-otel-helm-charts"
  chart      = "aws-otel-collector"
  version    = "0.25.0"

  namespace = kubernetes_namespace_v1.monitoring.metadata[0].name

  values = [
    yamlencode({
      mode = "daemonset"

      serviceAccount = {
        create = false
        name   = kubernetes_service_account_v1.adot.metadata[0].name
      }

      # (이하 config 동일)
    })
  ]
}
