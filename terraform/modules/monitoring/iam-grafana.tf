############################################
# Grafana IRSA IAM Role (CloudWatch Logs Read)
############################################

resource "aws_iam_role" "grafana" {
  name = "${var.project_name}-${var.environment}-grafana"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${var.oidc_provider_url}:sub" = "system:serviceaccount:${var.grafana_namespace}:grafana"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "grafana_cloudwatch_logs_read" {
  name        = "${var.project_name}-${var.environment}-grafana-cloudwatch-logs-read"
  description = "Grafana read/query CloudWatch Logs (Logs Insights)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:StartQuery",
          "logs:StopQuery",
          "logs:GetQueryResults"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "grafana_cloudwatch_logs_read" {
  role       = aws_iam_role.grafana.name
  policy_arn = aws_iam_policy.grafana_cloudwatch_logs_read.arn
}
