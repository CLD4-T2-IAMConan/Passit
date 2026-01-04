# Security Module Variables

variable "account_id" {
  description = "AWS Account ID (should be passed from parent module, auto-detected in envs/dev/main.tf)"
  type        = string
  # 기본값 제거 - 부모 모듈에서 전달받거나 자동 감지된 값 사용
}

variable "environment" {
  description = "Environment name (dev, prod, dr)"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "passit"
}

variable "vpc_id" {
  description = "VPC ID for Security Groups"
  type        = string
}

variable "eks_cluster_name" {
  description = "EKS Cluster name for IRSA"
  type        = string
  default     = ""
}

variable "rds_security_group_id" {
  description = "RDS Security Group ID (optional, for cross-references)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (optional, for cross-references)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for ALB access (for dev environment)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "github_org" {
  description = "GitHub organization or user name for OIDC trust policy"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository name for OIDC trust policy"
  type        = string
  default     = ""
}

variable "frontend_bucket_name" {
  type = string
}

variable "frontend_cloudfront_distribution_id" {
  type = string
}

variable "github_actions_frontend_role_arn" {
  type = string
}

# ============================================
# Secrets Manager Variables
# ============================================

variable "db_secrets" {
  description = "Database credentials for Secrets Manager"
  type = object({
    db_host     = string
    db_port     = string
    db_name     = string
    db_user     = string
    db_password = string
  })
  sensitive = true
}

variable "smtp_secrets" {
  description = "SMTP email credentials for Secrets Manager"
  type = object({
    mail_username = string
    mail_password = string
  })
  sensitive = true
  default = {
    mail_username = ""
    mail_password = ""
  }
}

variable "kakao_secrets" {
  description = "Kakao OAuth credentials for Secrets Manager"
  type = object({
    rest_api_key  = string
    client_secret = string
    admin_key     = string
  })
  sensitive = true
  default = {
    rest_api_key  = ""
    client_secret = ""
    admin_key     = ""
  }
}

variable "admin_secrets" {
  description = "Initial admin account credentials for Secrets Manager"
  type = object({
    email    = string
    password = string
    name     = string
    nickname = string
  })
  sensitive = true
  default = {
    email    = "admin@passit.com"
    password = "admin123!"
    name     = "Administrator"
    nickname = "admin"
  }
}

variable "app_secrets" {
  description = "Application secrets (JWT, API keys, etc.) for Secrets Manager"
  type = object({
    jwt_secret = string
    api_key    = string
  })
  sensitive = true
  default = {
    jwt_secret = ""
    api_key    = ""
  }
}

variable "elasticache_secrets" {
  description = "ElastiCache credentials for Secrets Manager"
  type = object({
    auth_token = string
  })
  sensitive = true
  default = {
    auth_token = ""
  }
}