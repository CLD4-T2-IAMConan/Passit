############################################
# Alertmanager IRSA IAM Role (SNS Publish)
############################################

resource "aws_iam_role" "alertmanager" {
  name = "${var.project_name}-${var.environment}-alertmanager"

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
            "${var.oidc_provider_url}:sub" =
            "system:serviceaccount:${var.alertmanager_namespace}:alertmanager-kube-prometheus-stack"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "alertmanager_sns_publish" {
  name = "${var.project_name}-${var.environment}-alertmanager-sns-publish"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.alertmanager.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "alertmanager_sns_publish" {
  role       = aws_iam_role.alertmanager.name
  policy_arn = aws_iam_policy.alertmanager_sns_publish.arn
}
