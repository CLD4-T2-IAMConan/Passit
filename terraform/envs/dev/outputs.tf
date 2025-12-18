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