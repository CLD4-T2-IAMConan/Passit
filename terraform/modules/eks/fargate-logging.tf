############################################
# Fargate Logging Configuration
# 
# Fargate Pod의 로그를 CloudWatch Logs로 전송하기 위한 설정
# aws-observability namespace와 aws-logging ConfigMap 필요
############################################

# 1. aws-observability Namespace 생성
resource "kubernetes_namespace_v1" "aws_observability" {
  metadata {
    name = "aws-observability"
    labels = {
      "aws-observability" = "enabled"
    }
  }

  depends_on = [
    module.eks,
    aws_eks_fargate_profile.system
  ]
}

# 2. Fargate Logging ConfigMap
# 이 ConfigMap은 Fargate가 자동으로 감지하여 로그를 CloudWatch로 전송
resource "kubernetes_config_map_v1" "aws_logging" {
  metadata {
    name      = "aws-logging"
    namespace = "aws-observability"
  }

  data = {
    "output.conf" = <<-EOT
      [OUTPUT]
          Name cloudwatch_logs
          Match *
          region ${var.region}
          log_group_name /eks/${var.project_name}/${var.environment}/application
          log_stream_prefix fargate-
          auto_create_group true
    EOT
  }

  depends_on = [
    module.eks,
    kubernetes_namespace_v1.aws_observability,
    aws_eks_fargate_profile.system
  ]
}

# 3. Fargate Pod Execution Role에 CloudWatch Logs 권한 추가
# (이미 fargate.tf에 CloudWatchAgentServerPolicy가 있지만, 명시적으로 추가)
resource "aws_iam_role_policy" "fargate_cloudwatch_logs" {
  name = "${var.project_name}-${var.environment}-fargate-cloudwatch-logs"
  role = aws_iam_role.fargate.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.region}:${var.account_id}:log-group:/eks/${var.project_name}/${var.environment}/*",
          "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/eks/${var.project_name}/${var.environment}/*"
        ]
      }
    ]
  })
}

############################################
# Outputs
############################################

output "aws_observability_namespace" {
  description = "AWS Observability namespace for Fargate logging"
  value       = kubernetes_namespace_v1.aws_observability.metadata[0].name
}

output "fargate_log_group_name" {
  description = "CloudWatch log group name for Fargate logs"
  value       = "/eks/${var.project_name}/${var.environment}/application"
}

