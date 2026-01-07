# EKS Module Outputs

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = module.eks.cluster_version
}

output "cluster_ca_certificate" {
  description = "Base64 encoded certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
}


# Networking / Security
output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group ID attached to the worker nodes"
  value       = module.eks.node_security_group_id
}


# IRSA / OIDC
output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.eks.oidc_provider_arn
}

output "oidc_provider_url" {
  description = "OIDC provider URL for IRSA"
  value       = module.eks.oidc_provider
}


# Managed Node Group Outputs
# Note: managed_node_groups not configured in main.tf yet
output "managed_node_group_names" {
  description = "Names of EKS managed node groups"
  value       = keys(module.eks.eks_managed_node_groups)
}

output "managed_node_group_arns" {
  description = "ARNs of EKS managed node groups"
  value = {
    for k, v in module.eks.eks_managed_node_groups : k => v.node_group_arn
  }
}


# Convenience / Debug
output "vpc_id" {
  description = "VPC ID where EKS is deployed"
  value       = var.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by EKS"
  value       = var.private_subnet_ids
}