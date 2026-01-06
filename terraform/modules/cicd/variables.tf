# CI/CD Module Variables

# ================================
# Common
# ================================
variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "team" {
  type = string
}

variable "owner" {
  type = string
}

variable "vpc_id" {
  type        = string
}

# ================================
# irsa.tf
# ================================
variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_url" {
  type = string
}

# ================================
# github-oidc.tf
# ================================
variable "github_org" {
  description = "GitHub organization or user name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_ref" {
  description = "Branch allowed to deploy frontend"
  type        = string
}


# EKS OIDC (IRSA / ArgoCD 연동용 - eks 모듈 output에서 받기)
variable "cluster_name" {
  type = string
}

# ----------------------------
# ArgoCD
# ----------------------------
variable "argocd_namespace" {
  type    = string
  default = "argocd"
}

variable "argocd_chart_version" {
  type    = string
  default = "9.1.6"
}

# ----------------------------
# GHCR imagePullSecret
# (주의: PAT는 민감정보. tfvars/파일에 커밋 금지)
# ----------------------------
variable "enable_ghcr_pull_secret" {
  type    = bool
  default = true
}

variable "service_namespaces" {
  type        = list(string)
  description = "List of Kubernetes namespaces for services"
}

variable "ghcr_username" {
  type      = string
  sensitive = true
  default   = null
}

variable "ghcr_pat" {
  type      = string
  sensitive = true
  default   = null
}

variable "ghcr_secret_name" {
  type    = string
  default = "ghcr-pull-secret"
}

# ----------------------------
# Frontend (S3 + CloudFront OAC)
# ----------------------------
variable "enable_frontend" {
  type    = bool
  default = true
}

variable "frontend_bucket_name" {
  type    = string
  default = null
}

variable "frontend_default_root_object" {
  type    = string
  default = "index.html"
}

variable "frontend_price_class" {
  type    = string
  default = "PriceClass_200"
}

variable "frontend_aliases" {
  type    = list(string)
  default = []
}

variable "frontend_acm_certificate_arn" {
  type    = string
  default = null
}

variable "frontend_spa_fallback" {
  type    = bool
  default = true
}

variable "alb_name" {
  description = "ALB name for backend services (used to lookup DNS name dynamically)"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "ALB DNS name for backend services (optional fallback, if alb_name is not provided)"
  type        = string
  default     = ""
}

# ============================================
# irsa.tf
# ============================================
variable "s3_bucket_profile" {
  description = "Account 서비스 프로필 이미지용 S3 버킷 이름"
  type        = string
}

variable "s3_bucket_ticket" {
  description = "Ticket 서비스 티켓 이미지용 S3 버킷 이름"
  type        = string
}

# ============================================
# irsa - Secrets Manager
# ============================================
variable "secret_db_password_arn" {
  description = "RDS DB 비밀번호를 저장한 Secrets Manager ARN"
  type        = string
}

variable "secret_elasticache_arn" {
  description = "Valkey(ElastiCache) 인증 토큰을 저장한 Secrets Manager ARN"
  type        = string
}

variable "secret_smtp_arn" {
  description = "SMTP 메일 계정 자격 증명 Secrets Manager ARN (account 서비스 전용)"
  type        = string
}

variable "secret_kakao_arn" {
  description = "Kakao OAuth 자격 증명 Secrets Manager ARN (account 서비스 전용)"
  type        = string
}

# ============================================
# SNS/SQS - Topic ARNs
# ============================================
variable "sns_ticket_events_topic_arn" {
  description = "ARN of the ticket events SNS topic"
  type        = string
  default     = ""
}

variable "sns_deal_events_topic_arn" {
  description = "ARN of the deal events SNS topic"
  type        = string
  default     = ""
}

variable "sns_payment_events_topic_arn" {
  description = "ARN of the payment events SNS topic"
  type        = string
  default     = ""
}

# ============================================
# SNS/SQS - Queue URLs
# ============================================
variable "sns_chat_deal_events_queue_url" {
  description = "URL of the chat service deal events SQS queue"
  type        = string
  default     = ""
}

variable "sns_ticket_deal_events_queue_url" {
  description = "URL of the ticket service deal events SQS queue"
  type        = string
  default     = ""
}

variable "sns_trade_ticket_events_queue_url" {
  description = "URL of the trade service ticket events SQS queue"
  type        = string
  default     = ""
}

# ============================================
# SNS/SQS - Queue ARNs
# ============================================
variable "sns_chat_deal_events_queue_arn" {
  description = "ARN of the chat service deal events SQS queue"
  type        = string
  default     = ""
}

variable "sns_ticket_deal_events_queue_arn" {
  description = "ARN of the ticket service deal events SQS queue"
  type        = string
  default     = ""
}

variable "sns_trade_ticket_events_queue_arn" {
  description = "ARN of the trade service ticket events SQS queue"
  type        = string
  default     = ""
}