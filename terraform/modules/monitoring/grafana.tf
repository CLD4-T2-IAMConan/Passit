# Grafana Installation (Helm)
############################
# IAM Role for Grafana
############################

data "aws_iam_policy_document" "grafana_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["grafana.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "grafana" {
  name               = "${var.project_name}-${var.environment}-grafana-role"
  assume_role_policy = data.aws_iam_policy_document.grafana_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-grafana-role"
    }
  )
}

data "aws_iam_policy_document" "grafana_amp_access" {
  statement {
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

resource "aws_iam_policy" "grafana_amp_access" {
  name   = "${var.project_name}-${var.environment}-grafana-amp-policy"
  policy = data.aws_iam_policy_document.grafana_amp_access.json
}

resource "aws_iam_role_policy_attachment" "grafana_amp_access" {
  role       = aws_iam_role.grafana.name
  policy_arn = aws_iam_policy.grafana_amp_access.arn
}

############################
# Amazon Managed Grafana Workspace
############################

resource "aws_grafana_workspace" "this" {
  name = var.grafana_workspace_name

  authentication_providers = var.grafana_authentication_providers
  permission_type          = "SERVICE_MANAGED"
  role_arn                = aws_iam_role.grafana.arn

  data_sources = ["PROMETHEUS"]

  account_access_type = "CURRENT_ACCOUNT"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-grafana"
    }
  )
}
