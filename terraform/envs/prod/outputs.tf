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
  description = "The cluster endpoint for RDS Aurora"
  value       = module.data.rds_cluster_endpoint
}

output "rds_reader_endpoint" {
  description = "The reader endpoint for RDS Aurora"
  value       = module.data.rds_reader_endpoint
}

# ============================================
# CI/CD Information
# ============================================
output "github_actions_frontend_role_arn" {
  value       = module.cicd.github_actions_frontend_role_arn
  description = "IAM Role ARN assumed by GitHub Actions for frontend deploy"
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
