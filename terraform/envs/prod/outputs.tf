# ============================================
# Network Module Outputs
# ============================================

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private app subnet IDs"
  value       = module.network.private_subnet_ids
}

output "private_db_subnet_ids" {
  description = "List of private DB subnet IDs"
  value       = module.network.private_db_subnet_ids
}

# ============================================
# EKS Module Outputs
# ============================================
output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.eks.oidc_provider_arn
}

# ============================================
# Security Module Outputs (추가됨) ⭐️
# ============================================
output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = module.security.rds_security_group_id
}

output "elasticache_security_group_id" {
  description = "The ID of the ElastiCache security group"
  value       = module.security.elasticache_security_group_id
}

output "eks_worker_security_group_id" {
  description = "The ID of the EKS worker security group"
  value       = module.security.eks_worker_security_group_id
}

# ============================================
# Data Module Outputs (RDS Endpoint 등 추가)
# ============================================
output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = module.data.rds_cluster_endpoint
}

output "rds_reader_endpoint" {
  description = "RDS Aurora reader endpoint"
  value       = module.data.rds_reader_endpoint
}

output "valkey_primary_endpoint" {
  description = "Valkey (ElastiCache) primary endpoint"
  value       = module.data.valkey_primary_endpoint
}

output "valkey_reader_endpoint" {
  description = "Valkey (ElastiCache) reader endpoint"
  value       = module.data.valkey_reader_endpoint
}

output "valkey_port" {
  description = "Valkey (ElastiCache) port"
  value       = module.data.valkey_port
}

output "s3_uploads_bucket_id" {
  description = "S3 uploads bucket ID"
  value       = module.data.s3_uploads_bucket_id
}

output "s3_logs_bucket_id" {
  description = "S3 logs bucket ID"
  value       = module.data.s3_logs_bucket_id
}

output "s3_backup_bucket_id" {
  description = "S3 backup bucket ID"
  value       = module.data.s3_backup_bucket_id
}

output "s3_bucket_ids" {
  description = "All S3 bucket IDs"
  value       = module.data.s3_bucket_ids
}

# Service-specific S3 buckets (from cicd module)
output "s3_profile_bucket_id" {
  description = "Account 서비스 프로필 이미지용 S3 버킷"
  value       = module.cicd.s3_bucket_profile
}

output "s3_ticket_bucket_id" {
  description = "Ticket 서비스 티켓 이미지용 S3 버킷"
  value       = module.cicd.s3_bucket_ticket
}

# ============================================
# CI/CD Information
# ============================================
output "github_actions_frontend_role_arn" {
  value       = module.cicd.github_actions_frontend_role_arn
  description = "IAM Role ARN assumed by GitHub Actions for frontend deploy"
}

output "github_actions_role_arn" {
  value       = module.security.github_actions_role_arn
  description = "IAM Role ARN assumed by GitHub Actions for EKS deployment"
}

# irsa 부분
output "backend_irsa_roles" {
  description = "IRSA role ARNs per backend service"
  value       = module.cicd.backend_irsa_roles
}

# ============================================
# Frontend Information (운영 편의)
# ============================================
output "frontend_bucket_name" {
  value       = module.cicd.frontend_bucket_name
  description = "S3 bucket for frontend static files"
}

output "frontend_cloudfront_domain" {
  value       = module.cicd.frontend_cloudfront_domain
  description = "CloudFront domain name for frontend"
}

# ============================================
# Bastion Host Information
# ============================================
# Note: Bastion Host는 prod 환경에서 제외됩니다.
#       dev 환경에서만 사용 가능합니다.
# ===========================================
# ALB Controller (운영 편의)
# ===========================================
output "alb_controller_role_arn" {
  value = module.cicd.alb_controller_role_arn
}

output "frontend_cloudfront_distribution_id" {
  value       = module.cicd.frontend_cloudfront_distribution_id
  description = "CloudFront distribution ID for cache invalidation"
}

#######################################
# Monitoring - Amazon Managed Prometheus
#######################################

output "prometheus_workspace_arn" {
  description = "ARN of the Amazon Managed Prometheus workspace"
  value       = module.monitoring.prometheus_workspace_arn
}

output "prometheus_workspace_endpoint" {
  description = "Remote write endpoint for Amazon Managed Prometheus"
  value       = module.monitoring.prometheus_workspace_endpoint
}

#######################################
# Monitoring - Prometheus IRSA
#######################################

output "prometheus_ingest_role_arn" {
  description = "IAM Role ARN used by Prometheus/ADOT to write metrics to AMP"
  value       = module.monitoring.prometheus_ingest_role_arn
}

#######################################
# Monitoring - Kubernetes Metadata
#######################################

output "prometheus_namespace" {
  description = "Kubernetes namespace where Prometheus/ADOT is deployed"
  value       = module.monitoring.prometheus_namespace
}

output "prometheus_service_account_name" {
  description = "Kubernetes ServiceAccount name for Prometheus/ADOT"
  value       = module.monitoring.prometheus_service_account_name
}
