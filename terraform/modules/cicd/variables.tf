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

variable "deploy_branch" {
  description = "Branch allowed to deploy frontend"
  type        = string
  default     = "main"
}

variable "region" { type = string }
variable "team" { type = string }
variable "owner" { type = string }

# EKS OIDC (IRSA / ArgoCD 연동용 - eks 모듈 output에서 받기)
variable "cluster_name" { type = string }

# ----------------------------
# ArgoCD
# ----------------------------
variable "argocd_namespace" {
  type    = string
  default = "argocd"
}

variable "argocd_chart_version" {
  type    = string
  default = "6.7.12"
}

# ----------------------------
# GHCR imagePullSecret
# (주의: PAT는 민감정보. tfvars/파일에 커밋 금지)
# ----------------------------
variable "enable_ghcr_pull_secret" {
  type    = bool
  default = false
}

variable "ghcr_secret_namespace" {
  type    = string
  default = "default"
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