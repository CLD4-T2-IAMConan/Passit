############################
# Fluent Bit -> CloudWatch Logs (IRSA + Helm)
############################

# kube-system 같은 기본 namespace는 이미 존재하므로,
# 기본 namespace가 아닐 때만 namespace 생성하도록 처리
resource "kubernetes_namespace_v1" "fluentbit" {
  count = contains(["kube-system", "default", "kube-public", "kube-node-lease"], var.fluentbit_namespace) ? 0 : 1

  metadata {
    name = var.fluentbit_namespace
  }
}

locals {
  fluentbit_ns = contains(
    ["kube-system", "default", "kube-public", "kube-node-lease"],
    var.fluentbit_namespace
  ) ? var.fluentbit_namespace : kubernetes_namespace_v1.fluentbit[0].metadata[0].name

  fluentbit_log_group = "/aws/eks/${var.cluster_name}/application"
}


############################
# IRSA Role for Fluent Bit
############################


data "aws_iam_policy_document" "fluentbit_assume_role" {
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
        "system:serviceaccount:${local.fluentbit_ns}:${var.fluentbit_service_account_name}"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "fluentbit" {
  name               = "${var.project_name}-${var.environment}-fluentbit-role"
  assume_role_policy = data.aws_iam_policy_document.fluentbit_assume_role.json

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-fluentbit-role"
  })
}

# CloudWatch Logs write 권한
data "aws_iam_policy_document" "fluentbit_logs_policy" {
  statement {
    sid    = "AllowWriteCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
      "logs:DescribeLogGroups"
    ]

    # log group을 사전 생성(cloudwatch.tf)할 수도 있고, Fluent Bit이 자동 생성할 수도 있어
    # 둘 다 커버하도록 prefix 기반으로 허용
    resources = [
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/eks/${var.cluster_name}*",
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/eks/${var.cluster_name}*:log-stream:*"
    ]
  }
}

resource "aws_iam_policy" "fluentbit_logs" {
  name   = "${var.project_name}-${var.environment}-fluentbit-cwlogs-policy"
  policy = data.aws_iam_policy_document.fluentbit_logs_policy.json

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-fluentbit-cwlogs-policy"
  })
}

resource "aws_iam_role_policy_attachment" "fluentbit_logs" {
  role       = aws_iam_role.fluentbit.name
  policy_arn = aws_iam_policy.fluentbit_logs.arn
}

############################
# K8s ServiceAccount (IRSA annotation)
############################

resource "kubernetes_service_account_v1" "fluentbit" {
  metadata {
    name      = var.fluentbit_service_account_name
    namespace = local.fluentbit_ns

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.fluentbit.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.fluentbit_logs
  ]
}

############################
# Helm Release: Fluent Bit
############################

resource "helm_release" "fluentbit" {
  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  version    = var.fluentbit_chart_version

  namespace = local.fluentbit_ns

  values = [
    yamlencode({
      serviceAccount = {
        create = false
        name   = kubernetes_service_account_v1.fluentbit.metadata[0].name
      }

      # 기본적으로 chart는 tail input + kubernetes filter를 제공
      # output만 CloudWatch로 명확히 지정
      config = {
        outputs = <<-EOT
          [OUTPUT]
              Name                cloudwatch_logs
              Match               *
              region              ${var.region}
              log_group_name      ${local.fluentbit_log_group}
              log_stream_prefix   from-fluent-bit-
              auto_create_group   true
              log_retention_days  ${var.log_retention_days}
          EOT
      }
    })
  ]

  depends_on = [
    aws_iam_role_policy_attachment.fluentbit_logs,
    kubernetes_service_account_v1.fluentbit
  ]
}
