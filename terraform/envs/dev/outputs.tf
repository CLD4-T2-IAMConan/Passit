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

# ============================================
# EKS Information
# ============================================

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  value       = module.eks.cluster_endpoint
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
output "bastion_instance_id" {
  description = "Bastion Host 인스턴스 ID"
  value       = module.bastion.bastion_instance_id
}

output "bastion_public_ip" {
  description = "Bastion Host 퍼블릭 IP"
  value       = module.bastion.bastion_public_ip
}

output "bastion_connection_info" {
  description = "Bastion Host 접속 정보"
  value = {
    session_manager_command = module.bastion.session_manager_command
    ssh_command            = module.bastion.ssh_command
  }
}

output "rds_tunnel_command" {
  description = "RDS SSH 터널링 명령어"
  value       = module.bastion.ssh_tunnel_rds_command
}

output "elasticache_tunnel_command" {
  description = "ElastiCache SSH 터널링 명령어"
  value       = module.bastion.ssh_tunnel_elasticache_command
}
