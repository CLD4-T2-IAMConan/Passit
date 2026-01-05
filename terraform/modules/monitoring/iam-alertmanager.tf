############################################
# Alertmanager IRSA IAM Role (SNS Publish)
############################################

resource "aws_iam_role" "alertmanager" {
  name = "${var.project_name}-${var.environment}-alertmanager"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${var.oidc_provider_arn}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${replace(var.oidc_provider_url, "https://", "")}:sub":
            "system:serviceaccount:${var.alertmanager_namespace}:alertmanager-kube-prometheus-stack",
          "${replace(var.oidc_provider_url, "https://", "")}:aud":
            "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF
}

resource "aws_iam_policy" "alertmanager_sns_publish" {
  name        = "${var.project_name}-${var.environment}-alertmanager-sns-publish"
  description = "Allow Alertmanager to publish alerts to SNS"

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
