############################################
# Fluent Bit IRSA Role
############################################

# Service Account 이름 / Namespace
locals {
  fluentbit_namespace      = "logging"
  fluentbit_serviceaccount = "fluent-bit"
}

############################################
# IAM Role for Service Account (IRSA)
############################################

resource "aws_iam_role" "fluentbit" {
  name = "${var.project_name}-${var.environment}-fluentbit-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(
            var.oidc_provider_arn,
            "arn:aws:iam::${var.account_id}:oidc-provider/",
            ""
          )}:sub" = "system:serviceaccount:${local.fluentbit_namespace}:${local.fluentbit_serviceaccount}"
        }
      }
    }]
  })



  tags = {
    Project     = var.project_name
    Environment = var.environment
    Component   = "fluent-bit"
  }
}

############################################
# IAM Policy - CloudWatch Logs Write
############################################

resource "aws_iam_role_policy" "fluentbit_cloudwatch" {
  role = aws_iam_role.fluentbit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:${var.region}:${var.account_id}:log-group:/eks/${var.project_name}/${var.environment}/*"
    }]
  })
}
