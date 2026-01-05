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
