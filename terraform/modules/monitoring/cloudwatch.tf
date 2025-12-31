############################################
# CloudWatch Logs - Retention Policy
############################################

locals {
  log_retention_days = {
    prod = 30
    dev  = 7
    dr   = 7
  }
}

############################################
# Application Logs
############################################
# Spring Boot / 사용자 정의 로그
############################################

resource "aws_cloudwatch_log_group" "eks_application" {
  name              = "/eks/${var.project_name}/${var.environment}/application"
  retention_in_days = local.log_retention_days[var.environment]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Type        = "application"
  }
}

############################################
# Platform Logs
############################################
# Pod stdout/stderr, K8s 이벤트
############################################

resource "aws_cloudwatch_log_group" "eks_platform" {
  name              = "/eks/${var.project_name}/${var.environment}/platform"
  retention_in_days = local.log_retention_days[var.environment]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Type        = "platform"
  }
}

############################################
# Fluent Bit Internal Logs (선택)
############################################

resource "aws_cloudwatch_log_group" "fluentbit" {
  name              = "/eks/${var.project_name}/${var.environment}/fluent-bit"
  retention_in_days = local.log_retention_days[var.environment]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Type        = "fluentbit"
  }
}
