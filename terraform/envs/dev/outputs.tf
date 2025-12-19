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