# Security Module Variables

variable "account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "727646470302"
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