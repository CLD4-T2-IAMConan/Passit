# Prometheus Installation (Helm)
############################
# AMP (Amazon Managed Service for Prometheus)
############################

resource "aws_prometheus_workspace" "this" {
  alias = var.prometheus_workspace_name

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-amp"
    }
  )
}

############################
# IRSA for Remote Write to AMP
# (EKS에서 AMP로 메트릭 전송하는 ServiceAccount용)
############################

data "aws_iam_openid_connect_provider" "this" {
  arn = var.oidc_provider_arn
}

# OIDC issuer URL을 assume role policy에서 쓰기 위해 https:// 제거
locals {
  oidc_issuer = replace(data.aws_iam_openid_connect_provider.this.url, "https://", "")
}

data "aws_iam_policy_document" "amp_assume_role" {
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
        "system:serviceaccount:${var.prometheus_namespace}:${var.prometheus_service_account_name}"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "amp_ingest" {
  name               = "${var.project_name}-${var.environment}-amp-ingest-role"
  assume_role_policy = data.aws_iam_policy_document.amp_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-amp-ingest-role"
    }
  )
}

data "aws_iam_policy_document" "amp_permissions" {
  statement {
    sid    = "AllowRemoteWriteToAMP"
    effect = "Allow"
    actions = [
      "aps:RemoteWrite",
      # 운영/점검 시 유용 (선택)
      "aps:QueryMetrics",
      "aps:GetSeries",
      "aps:GetLabels",
      "aps:GetMetricMetadata"
    ]
    resources = [aws_prometheus_workspace.this.arn]
  }
}

resource "aws_iam_policy" "amp_ingest" {
  name   = "${var.project_name}-${var.environment}-amp-ingest-policy"
  policy = data.aws_iam_policy_document.amp_permissions.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-amp-ingest-policy"
    }
  )
}

resource "aws_iam_role_policy_attachment" "amp_ingest" {
  role       = aws_iam_role.amp_ingest.name
  policy_arn = aws_iam_policy.amp_ingest.arn
}
