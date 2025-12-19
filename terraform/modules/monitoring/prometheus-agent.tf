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

# ADOT Collector는 현재 주석 처리 (필요시 활성화)
# 참고: 올바른 chart 이름과 버전 확인 필요
# resource "helm_release" "adot_collector" {
#   name       = "adot-collector"
#   repository = "https://aws-observability.github.io/aws-otel-helm-charts"
#   chart      = "adot-exporter-for-eks-on-ec2"
#
#   namespace = kubernetes_namespace_v1.monitoring.metadata[0].name
#
#   values = [
#     yamlencode({
#       serviceAccount = {
#         create = false
#         name   = kubernetes_service_account_v1.adot.metadata[0].name
#       }
#
#       amp = {
#         enabled = true
#         remoteWriteEndpoint = aws_prometheus_workspace.this.prometheus_endpoint
#         region = var.region
#       }
#
#       metrics = {
#         enabled = true
#       }
#     })
#   ]
#
#   depends_on = [
#     aws_iam_role_policy_attachment.amp_ingest,
#     kubernetes_service_account_v1.adot
#   ]
# }
