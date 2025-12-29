############################
# Grafana on EKS (Helm) + AMP SigV4 (IRSA)
############################

############################
# Variables
############################

variable "grafana_namespace" {
  description = "Namespace to deploy Grafana"
  type        = string
  default     = "monitoring"
}

variable "grafana_service_account_name" {
  description = "ServiceAccount name for Grafana (IRSA binding)"
  type        = string
  default     = "grafana"
}

variable "grafana_chart_version" {
  description = "Helm chart version for Grafana"
  type        = string
  default     = "7.3.9"
}



############################
# Data / Locals
############################

data "aws_eks_cluster" "this" {
  name = var.cluster_name
}

locals {

  # AMP workspace endpoint
  amp_query_endpoint = trim(
    aws_prometheus_workspace.this.prometheus_endpoint,
    "/"
  )

  # namespace count 처리로 인한 참조 꼬임 방지
  grafana_namespace_name = coalesce(
    try(kubernetes_namespace_v1.grafana[0].metadata[0].name, null),
    var.grafana_namespace
  )
}

############################
# IRSA Role for Grafana
############################

data "aws_iam_policy_document" "grafana_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:sub"
      values = [
        "system:serviceaccount:${var.grafana_namespace}:${var.grafana_service_account_name}"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "grafana" {
  name               = "${var.project_name}-${var.environment}-grafana-irsa-role"
  assume_role_policy = data.aws_iam_policy_document.grafana_assume_role.json

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-grafana-irsa-role"
  })
}

data "aws_iam_policy_document" "grafana_amp_query_policy" {
  statement {
    sid    = "AllowQueryAMP"
    effect = "Allow"
    actions = [
      "aps:QueryMetrics",
      "aps:GetSeries",
      "aps:GetLabels",
      "aps:GetMetricMetadata"
    ]
    resources = [aws_prometheus_workspace.this.arn]
  }
}

resource "aws_iam_policy" "grafana_amp_query" {
  name   = "${var.project_name}-${var.environment}-grafana-amp-query-policy"
  policy = data.aws_iam_policy_document.grafana_amp_query_policy.json
}

resource "aws_iam_role_policy_attachment" "grafana_amp_query" {
  role       = aws_iam_role.grafana.name
  policy_arn = aws_iam_policy.grafana_amp_query.arn
}

############################
# Kubernetes Namespace
############################

resource "kubernetes_namespace_v1" "grafana" {
  count = contains(
    ["kube-system", "default", "kube-public", "kube-node-lease", "monitoring"],
    var.grafana_namespace
  ) ? 0 : 1

  metadata {
    name = var.grafana_namespace
  }
}

############################
# Kubernetes ServiceAccount (IRSA)
############################

resource "kubernetes_service_account_v1" "grafana" {
  metadata {
    name      = var.grafana_service_account_name
    namespace = local.grafana_namespace_name

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.grafana.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.grafana_amp_query
  ]
}

############################
# Helm Release: Grafana
############################

resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  version    = var.grafana_chart_version

  namespace = local.grafana_namespace_name

  values = [
    yamlencode({
      # admin 정보는 tfvars → variable → helm values
      adminUser     = var.grafana_admin_user
      adminPassword = var.grafana_admin_password

      serviceAccount = {
        create = false
        name   = kubernetes_service_account_v1.grafana.metadata[0].name
      }

      service = {
        type = "ClusterIP"
      }

      datasources = {
        "datasources.yaml" = {
          apiVersion = 1
          datasources = [
            {
              name      = "AMP-Prometheus"
              type      = "prometheus"
              access    = "proxy"
              url       = local.amp_query_endpoint
              isDefault = true

              jsonData = {
                httpMethod  = "POST"
                sigV4Auth   = true
                sigV4Region = var.region
              }
            }
          ]
        }
      }
    })
  ]

  depends_on = [
    kubernetes_service_account_v1.grafana
  ]
}
