# ============================================
# Network Information
# ============================================

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = module.network.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "List of IDs of private app subnets"
  value       = module.network.private_subnet_ids
}

# ============================================
<<<<<<< HEAD
# Security Information (모듈의 Output 참조로 수정)
# ============================================

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  # 리소스를 직접 참조하는 대신 module.security의 output을 참조합니다.
  value = module.security.rds_security_group_id
}

output "elasticache_security_group_id" {
  description = "The ID of the ElastiCache security group"
  value       = module.security.elasticache_security_group_id
}

output "eks_worker_security_group_id" {
  description = "The ID of the EKS worker security group"
  value       = module.security.eks_worker_security_group_id
}
=======
# EKS Information
# ============================================

output "cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS API server endpoint"
}

# ============================================
# CI/CD Information
# ============================================
output "argocd_irsa_role_arn" {
  value       = module.cicd.argocd_irsa_role_arn
  description = "IAM Role ARN used by Argo CD via IRSA"
}

output "github_actions_frontend_role_arn" {
  value       = module.cicd.github_actions_frontend_role_arn
  description = "IAM Role ARN assumed by GitHub Actions for frontend deploy"
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
>>>>>>> 5336c2345ef5ae48f6c79b4d1f9c10c016c18960
