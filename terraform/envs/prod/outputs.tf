# # ============================================
# # Network Module Outputs
# # ============================================
# output "vpc_id" {
#   description = "The ID of the VPC"
#   value       = module.network.vpc_id
# }
#
# output "public_subnet_ids" {
#   description = "List of public subnet IDs"
#   value       = module.network.public_subnet_ids
# }
#
# output "private_subnet_ids" {
#   description = "List of private app subnet IDs"
#   value       = module.network.private_subnet_ids
# }
#
# output "private_db_subnet_ids" {
#   description = "List of private DB subnet IDs"
#   value       = module.network.private_db_subnet_ids
# }
#
# # ============================================
# # EKS Module Outputs
# # ============================================
# output "cluster_name" {
#   description = "EKS cluster name"
#   value       = module.eks.cluster_name
# }
#
# output "cluster_endpoint" {
#   description = "EKS cluster endpoint"
#   value       = module.eks.cluster_endpoint
# }
#
# output "cluster_security_group_id" {
#   description = "Security group ID attached to the EKS cluster"
#   value       = module.eks.cluster_security_group_id
# }
#
# output "oidc_provider_arn" {
#   description = "OIDC provider ARN for IRSA"
#   value       = module.eks.oidc_provider_arn
# }
#
# # ============================================
# # Security Module Outputs (추가됨) ⭐️
# # ============================================
# output "rds_security_group_id" {
#   description = "The ID of the RDS security group"
#   value       = module.security.rds_security_group_id
# }
#
# output "elasticache_security_group_id" {
#   description = "The ID of the ElastiCache security group"
#   value       = module.security.elasticache_security_group_id
# }
#
# output "eks_worker_security_group_id" {
#   description = "The ID of the EKS worker security group"
#   value       = module.security.eks_worker_security_group_id
# }
#
# # ============================================
# # Data Module Outputs (RDS Endpoint 등 추가)
# # ============================================
# output "rds_cluster_endpoint" {
#   description = "The cluster endpoint for RDS Aurora"
#   value       = module.data.rds_cluster_endpoint
# }
#
# output "rds_reader_endpoint" {
#   description = "The reader endpoint for RDS Aurora"
#   value       = module.data.rds_reader_endpoint
# }