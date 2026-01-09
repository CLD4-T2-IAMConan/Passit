############################################
# Fluent Bit IRSA Role
# 
# 주의: Fargate 환경에서는 DaemonSet을 지원하지 않으므로
# fluentbit을 사용할 수 없습니다. enable_fluentbit=false로 설정하세요.
############################################

# Service Account 이름 / Namespace
locals {
  fluentbit_namespace      = var.fluentbit_namespace
  fluentbit_serviceaccount = var.fluentbit_service_account_name
}

############################################
# IAM Role for Service Account (IRSA)
############################################

resource "aws_iam_role" "fluentbit" {
  count = var.enable_fluentbit ? 1 : 0  # Fargate에서는 비활성화

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
  count = var.enable_fluentbit ? 1 : 0  # Fargate에서는 비활성화

  role = aws_iam_role.fluentbit[0].id

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

resource "kubernetes_service_account_v1" "fluentbit" {
  count = var.enable_fluentbit ? 1 : 0  # Fargate에서는 비활성화

  metadata {
    name      = "fluent-bit"
    namespace = var.fluentbit_namespace

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.fluentbit[0].arn
    }
  }
}
