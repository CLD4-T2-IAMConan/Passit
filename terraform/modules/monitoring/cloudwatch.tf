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
# CloudWatch Logs - Log Group (Application)
############################################

resource "aws_cloudwatch_log_group" "eks_application" {
  name              = "/eks/${var.project_name}/${var.environment}/application"
  retention_in_days = local.log_retention_days[var.environment]

  tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      Component   = "application-logs"
      ManagedBy   = "terraform"
    }
  )
}